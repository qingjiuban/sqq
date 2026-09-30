import { isTauri } from "./tauri";
import { isMobilePlatform, probeRuntime } from "./api";

/**
 * Cached mobile flag. Starts from user-agent sniffing and is upgraded to the
 * authoritative native value (`is_mobile_platform`) once the app boots.
 */
let mobileFlag: boolean | null = null;

/** Whether a usable Node.js runtime exists in the current sandbox. */
let nodeAvailable: boolean | null = null;
let runtimeProbe: Promise<boolean> | null = null;

function uaIsMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

/** Synchronous mobile check, safe to call from render/agent code. */
export function isMobileOS(): boolean {
  return mobileFlag ?? uaIsMobile();
}

/** Ask the native layer whether we are on mobile and cache the answer.
 * Call this once during app bootstrap; falls back to user-agent sniffing.
 */
export async function resolveMobileOS(): Promise<boolean> {
  if (!isTauri()) {
    mobileFlag = uaIsMobile();
    void resolveNodeRuntime();
    return mobileFlag;
  }
  try {
    mobileFlag = await isMobilePlatform();
  } catch {
    mobileFlag = uaIsMobile();
  }
  void resolveNodeRuntime();
  return mobileFlag;
}

/**
 * Probe the sandbox for a runnable Node.js binary. Desktop always reports true
 * (the toolchain lives on the host); mobile depends on what is bundled.
 */
async function resolveNodeRuntime(): Promise<boolean> {
  if (!isTauri() || !isMobileOS()) {
    nodeAvailable = true;
    return true;
  }
  if (nodeAvailable != null) return nodeAvailable;
  if (!runtimeProbe) {
    runtimeProbe = probeRuntime("node")
      .then((ok) => {
        nodeAvailable = ok;
        return ok;
      })
      .catch(() => {
        nodeAvailable = false;
        return false;
      });
  }
  return runtimeProbe;
}

/** Synchronous view of the last known Node.js availability. */
export function hasNodeRuntime(): boolean {
  return nodeAvailable ?? false;
}

/** Running as a native Tauri app (desktop or mobile), not the browser preview. */
export function isNativeApp(): boolean {
  return isTauri();
}

/** Desktop native app: has a folder picker and can run commands. */
export function isDesktopApp(): boolean {
  return isTauri() && !isMobileOS();
}

/** Native mobile app: sandbox workspace, no command execution. */
export function isMobileApp(): boolean {
  return isTauri() && isMobileOS();
}

/** Commands require a runtime that can actually spawn the toolchain. */
export function canExecuteCommands(): boolean {
  if (isDesktopApp()) return true;
  return hasNodeRuntime();
}
