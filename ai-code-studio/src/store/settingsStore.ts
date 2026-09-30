import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApprovalMode, PermissionLevel } from "../security/PermissionManager";
import { permissionManager } from "../security/PermissionManager";

interface SettingsStore {
  level: PermissionLevel;
  mode: ApprovalMode;
  autoVerify: boolean;
  maxRepairRounds: number;
  setLevel: (level: PermissionLevel) => void;
  setMode: (mode: ApprovalMode) => void;
  setAutoVerify: (value: boolean) => void;
  setMaxRepairRounds: (value: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      level: 1,
      mode: "auto-safe",
      autoVerify: true,
      maxRepairRounds: 2,
      setLevel: (level) => {
        permissionManager.setLevel(level);
        set({ level });
      },
      setMode: (mode) => {
        permissionManager.setMode(mode);
        set({ mode });
      },
      setAutoVerify: (autoVerify) => set({ autoVerify }),
      setMaxRepairRounds: (maxRepairRounds) => set({ maxRepairRounds }),
    }),
    { name: "acs-settings" },
  ),
);

permissionManager.setLevel(useSettingsStore.getState().level);
permissionManager.setMode(useSettingsStore.getState().mode);
