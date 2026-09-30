import { create } from "zustand";
import type { AgentStatus } from "../agent/AgentLoop";
import { summarizeResult } from "../agent/ToolExecutor";
import type { ToolCall, ToolResult } from "../types/tools";

export interface ToolLogEntry {
  call: ToolCall;
  status: "running" | "ok" | "error";
  summary?: string;
}

interface AgentStore {
  status: AgentStatus;
  log: ToolLogEntry[];
  setStatus: (status: AgentStatus) => void;
  startTool: (call: ToolCall) => void;
  endTool: (call: ToolCall, result: ToolResult) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  status: "idle",
  log: [],
  setStatus: (status) => set({ status }),
  startTool: (call) =>
    set((state) => ({
      log: [...state.log, { call, status: "running" }],
    })),
  endTool: (call, result) =>
    set((state) => {
      const summary = summarizeResult(result);
      const log = [...state.log];
      for (let i = log.length - 1; i >= 0; i -= 1) {
        if (log[i].call.id === call.id) {
          log[i] = { call, status: result.success ? "ok" : "error", summary };
          break;
        }
      }
      return { log };
    }),
  reset: () => set({ status: "idle", log: [] }),
}));
