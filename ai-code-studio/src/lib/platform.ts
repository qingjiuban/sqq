import { isTauri } from "./tauri";
import { isMobilePlatform } from "./api";

/**
 * Cached mobile flag. Starts from user-agent sniffing and is upgraded to the
 * authoritative native value (`is_mobile_platform`) once the app boots.
 */
let mobileFlag: boolean | null = null;

function uaIsMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

/** Synchronous mobile check, safe to call from render/agent code. */
export function isMobileOS(): boolean {
  return mobileFlag ?? uaIsMobile();
}

/**
 * Ask the native layer whether we are on mobile and cache the answer.
 * Call this once during app bootstrap; falls back to user-agent sniffing.
 */
export async function resolveMobileOS(): Promise<boolean> {
  if (!isTauri()) {
    mobileFlag = uaIsMobile();
    return mobileFlag;
  }
  try {
    mobileFlag = await isMobilePlatform();
  } catch {
    mobileFlag = uaIsMobile();
  }
  return mobileFlag;
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

/** Commands require a desktop native runtime with the required toolchains. */
export function canExecuteCommands(): boolean {
  return isDesktopApp();
}
