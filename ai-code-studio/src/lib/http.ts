import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "./tauri";

type FetchFn = typeof globalThis.fetch;

let cached: FetchFn | null = null;

/**
 * Returns a fetch implementation that bypasses CORS by routing through the
 * Tauri Rust backend when running as a desktop app. In a plain browser it
 * falls back to the global fetch.
 */
export function httpFetch(): FetchFn {
  if (cached) return cached;
  cached = isTauri()
    ? (tauriFetch as unknown as FetchFn)
    : globalThis.fetch.bind(globalThis);
  return cached;
}
