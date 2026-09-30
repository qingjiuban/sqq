import { create } from "zustand";
import type { FileEntry, OpenTab } from "../types/project";
import {
  createDir,
  deletePath,
  ensureWorkspace,
  getProjectRoot,
  listDir,
  pickProjectFolder,
  readFile,
  setProjectRoot,
  writeFile,
} from "../lib/api";
import { resolveMobileOS } from "../lib/platform";

const ROOT_KEY = ".";

interface ProjectStore {
  root: string | null;
  projectName: string;
  isMobile: boolean;
  dirs: Record<string, FileEntry[]>;
  expanded: Record<string, boolean>;
  tabs: OpenTab[];
  activePath: string | null;
  openProject: () => Promise<void>;
  restoreProject: () => Promise<void>;
  loadDir: (path: string) => Promise<void>;
  toggleDir: (path: string) => Promise<void>;
  refreshTree: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeTab: (path: string) => Promise<void>;
  setActiveTab: (path: string) => void;
  updateActiveContent: (content: string) => void;
  saveActive: () => Promise<void>;
  createFile: (parentDir: string) => Promise<void>;
  createFolder: (parentDir: string) => Promise<void>;
  deleteEntry: (path: string) => Promise<void>;
  reloadOpenTabs: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  root: null,
  projectName: "",
  isMobile: false,
  dirs: {},
  expanded: { [ROOT_KEY]: true },
  tabs: [],
  activePath: null,

  openProject: async () => {
    if (get().isMobile) {
      const info = await ensureWorkspace();
      set({ root: info.root, projectName: info.name });
      await get().loadDir(ROOT_KEY);
      return;
    }
    const folder = await pickProjectFolder();
    if (!folder) return;
    const info = await setProjectRoot(folder);
    set({ root: info.root, projectName: info.name, dirs: {}, expanded: { [ROOT_KEY]: true } });
    await get().loadDir(ROOT_KEY);
  },

  restoreProject: async () => {
    try {
      const mobile = await resolveMobileOS();
      set({ isMobile: mobile });
      if (mobile) {
        const info = await ensureWorkspace();
        set({ root: info.root, projectName: info.name });
        await get().loadDir(ROOT_KEY);
        return;
      }
      const info = await getProjectRoot();
      if (info) {
        set({ root: info.root, projectName: info.name });
        await get().loadDir(ROOT_KEY);
      }
    } catch {
      // ignore: no project opened yet
    }
  },

  loadDir: async (path) => {
    const entries = await listDir(path);
    set((s) => ({ dirs: { ...s.dirs, [path]: entries } }));
  },

  toggleDir: async (path) => {
    const { expanded, dirs } = get();
    const next = !expanded[path];
    set((s) => ({ expanded: { ...s.expanded, [path]: next } }));
    if (next && !dirs[path]) {
      await get().loadDir(path);
    }
  },

  refreshTree: async () => {
    const { dirs } = get();
    const paths = Object.keys(dirs);
    const results = await Promise.all(
      paths.map(async (p) => {
        try {
          return [p, await listDir(p)] as const;
        } catch {
          return [p, dirs[p]] as const;
        }
      }),
    );
    const nextDirs: Record<string, FileEntry[]> = {};
    for (const [p, entries] of results) nextDirs[p] = entries;
    set({ dirs: nextDirs });
  },

  openFile: async (path) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      set({ activePath: path });
      return;
    }
    const content = await readFile(path);
    set((s) => ({
      tabs: [...s.tabs, { path, content, dirty: false }],
      activePath: path,
    }));
  },

  closeTab: async (path) => {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.path === path);
      const tabs = s.tabs.filter((t) => t.path !== path);
      let activePath = s.activePath;
      if (s.activePath === path) {
        const next = tabs[Math.min(idx, tabs.length - 1)];
        activePath = next ? next.path : null;
      }
      return { tabs, activePath };
    });
  },

  setActiveTab: (path) => set({ activePath: path }),

  updateActiveContent: (content) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.path === s.activePath ? { ...t, content, dirty: true } : t,
      ),
    })),

  saveActive: async () => {
    const { activePath, tabs } = get();
    if (!activePath) return;
    const tab = tabs.find((t) => t.path === activePath);
    if (!tab) return;
    await writeFile(tab.path, tab.content);
    set((s) => ({
      tabs: s.tabs.map((t) => (t.path === tab.path ? { ...t, dirty: false } : t)),
    }));
    await get().refreshTree();
  },

  createFile: async (parentDir) => {
    const name = window.prompt("文件名");
    if (!name) return;
    const path = parentDir === ROOT_KEY ? name : `${parentDir}/${name}`;
    await writeFile(path, "");
    await get().refreshTree();
    await get().openFile(path);
  },

  createFolder: async (parentDir) => {
    const name = window.prompt("文件夹名");
    if (!name) return;
    const path = parentDir === ROOT_KEY ? name : `${parentDir}/${name}`;
    await createDir(path);
    await get().refreshTree();
  },

  deleteEntry: async (path) => {
    if (!window.confirm(`确定删除 "${path}" 吗？`)) return;
    await deletePath(path);
    set((s) => ({
      tabs: s.tabs.filter((t) => t.path !== path && !t.path.startsWith(`${path}/`)),
      activePath:
        s.activePath === path || s.activePath?.startsWith(`${path}/`)
          ? null
          : s.activePath,
    }));
    await get().refreshTree();
  },

  reloadOpenTabs: async () => {
    const { tabs } = get();
    const reloaded = await Promise.all(
      tabs.map(async (tab) => {
        if (tab.dirty) return tab;
        try {
          const content = await readFile(tab.path);
          return content === tab.content ? tab : { ...tab, content };
        } catch {
          return tab;
        }
      }),
    );
    set({ tabs: reloaded });
    await get().refreshTree();
  },
}));
