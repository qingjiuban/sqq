import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./tauri";

/**
 * API keys never enter the project files or localStorage. They are stored in
 * the OS credential store through the Rust `save_secret` / `get_secret`
 * commands. When Tauri is unavailable (browser preview) operations are no-ops
 * so the UI keeps working with the in-memory key only.
 */
export const secretStore = {
  async set(id: string, value: string): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      await invoke("save_secret", { key: `provider:${id}`, value });
      return true;
    } catch {
      return false;
    }
  },

  async get(id: string): Promise<string | null> {
    if (!isTauri()) return null;
    try {
      return await invoke<string | null>("get_secret", { key: `provider:${id}` });
    } catch {
      return null;
    }
  },

  async remove(id: string): Promise<void> {
    if (!isTauri()) return;
    try {
      await invoke("delete_secret", { key: `provider:${id}` });
    } catch {
      // ignore
    }
  },
};
