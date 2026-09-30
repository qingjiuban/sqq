import { convertFileSrc } from "@tauri-apps/api/core";
import { create } from "zustand";
import { checkPort, runCommand, getProcessOutput, killProcess } from "../lib/commandApi";
import { isMobileOS } from "../lib/platform";
import { detectPreviewPlan, type PreviewPlan } from "../preview/detect";
import { useProjectStore } from "./projectStore";

export type PreviewStatus =
  | "idle"
  | "detecting"
  | "starting"
  | "running"
  | "stopped"
  | "error";

interface PreviewStore {
  status: PreviewStatus;
  plan: PreviewPlan | null;
  port: number | null;
  url: string | null;
  processId: string | null;
  output: string;
  error: string | null;
  autoDetect: boolean;

  setAutoDetect: (value: boolean) => void;
  detect: () => Promise<PreviewPlan | null>;
  start: (plan?: PreviewPlan) => Promise<void>;
  stop: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  reset: () => void;
}

const POLL_INTERVAL = 700;
const POLL_ATTEMPTS = 45;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Absolute file URL used on mobile, where no server process can be spawned. */
function localFileUrl(rel: string): string | null {
  const root = useProjectStore.getState().root;
  if (!root) return null;
  const base = root.replace(/[\\/]+$/, "");
  return convertFileSrc(`${base}/${rel}`);
}

export const usePreviewStore = create<PreviewStore>((set, get) => ({
  status: "idle",
  plan: null,
  port: null,
  url: null,
  processId: null,
  output: "",
  error: null,
  autoDetect: true,

  setAutoDetect: (value) => set({ autoDetect: value }),

  detect: async () => {
    set({ status: "detecting", error: null });
    try {
      const plan = await detectPreviewPlan({ staticOnly: isMobileOS() });
      set({ plan, port: plan?.port ?? null, status: plan ? "idle" : "error" });
      if (!plan) {
        set({
          error: isMobileOS()
            ? "暂无可预览的 HTML/SVG 文件。可以让智能体创建 index.html。"
            : "无法检测该项目的运行方式。",
        });
        return null;
      }
      // Local file previews are free to open, so show them immediately.
      if (plan.localEntry) {
        const url = localFileUrl(plan.localEntry);
        if (url) set({ status: "running", url });
      }
      return plan;
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  start: async (planOverride) => {
    const plan = planOverride ?? get().plan ?? (await get().detect());
    if (!plan) return;

    // Mobile: render the file directly, no process to spawn.
    if (plan.localEntry) {
      const url = localFileUrl(plan.localEntry);
      if (!url) {
        set({ status: "error", error: "没有可用的项目根目录。" });
        return;
      }
      set({ status: "running", url, port: null, error: null, processId: null });
      return;
    }

    if (!plan.port) {
      set({ status: "error", error: "该项目无法在此处预览。" });
      return;
    }

    const { command, args } = plan.command;
    set({
      status: "starting",
      plan,
      port: plan.port,
      output: "",
      error: null,
      processId: null,
    });

    try {
      const result = await runCommand(command, args, 5000);
      const processId = result.processId;
      set({
        processId,
        output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
      });

      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        if (await checkPort(plan.port)) {
          set({
            status: "running",
            url: `http://localhost:${plan.port}`,
          });
          return;
        }
        const polled = await getProcessOutput(processId).catch(() => null);
        if (polled) {
          set({
            output: [polled.stdout, polled.stderr].filter(Boolean).join("\n"),
          });
          if (!polled.running) {
            set({
              status: "error",
              error: `进程在服务器就绪前退出，退出码 ${polled.exitCode ?? "?"}。`,
            });
            return;
          }
        }
        await sleep(POLL_INTERVAL);
      }

      set({
        status: "error",
        error: `服务器未能在限定时间内于端口 ${plan.port} 就绪。`,
      });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  stop: async () => {
    const { processId } = get();
    if (processId) {
      await killProcess(processId).catch(() => undefined);
    }
    set({ status: "stopped", url: null, processId: null });
  },

  refreshStatus: async () => {
    const { port, status, plan } = get();
    // Local file previews have no process/port to poll.
    if (plan?.localEntry) return;
    if (!port || status === "idle") return;
    const alive = await checkPort(port).catch(() => false);
    if (alive && status !== "running") {
      set({ status: "running", url: `http://localhost:${port}` });
    } else if (!alive && status === "running") {
      set({ status: "stopped", url: null });
    }
  },

  reset: () =>
    set({
      status: "idle",
      plan: null,
      port: null,
      url: null,
      processId: null,
      output: "",
      error: null,
    }),
}));
