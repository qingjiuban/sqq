#!/usr/bin/env bash
# Preflight check for `pnpm tauri android build`.
# Verifies every prerequisite the Android build needs and prints exactly what
# is missing. Run it before building so failures are obvious and early.

set -u

ok()   { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
bad()  { printf '  \033[31mMISS\033[0m %s\n' "$1"; }
warn() { printf '  \033[33mWARN\033[0m %s\n' "$1"; }

FAIL=0
need() { command -v "$1" >/dev/null 2>&1 && ok "$1 ($(command -v "$1"))" || { bad "$1 not found"; FAIL=1; }; }

echo "== Java =="
need java
if command -v java >/dev/null 2>&1; then
  JAVA_MAJOR="$(java -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')"
  if [ "${JAVA_MAJOR:-0}" -ge 17 ] 2>/dev/null; then
    ok "JDK major version $JAVA_MAJOR"
  else
    bad "JDK 17+ required, found major version ${JAVA_MAJOR:-unknown}"
    FAIL=1
  fi
fi

echo "== Android SDK =="
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -n "$SDK" ] && [ -d "$SDK" ]; then
  ok "ANDROID_HOME=$SDK"
  [ -d "$SDK/platform-tools" ] && ok "platform-tools" || { bad "platform-tools (adb) missing"; FAIL=1; }
  [ -d "$SDK/cmdline-tools" ] && ok "cmdline-tools" || warn "cmdline-tools missing (needed for sdkmanager)"
  if [ -d "$SDK/ndk" ] && [ -n "$(ls -A "$SDK/ndk" 2>/dev/null)" ]; then
    ok "NDK: $(ls "$SDK/ndk" | tr '\n' ' ')"
  else
    bad "NDK missing (install via: sdkmanager \"ndk;27.0.12077973\")"
    FAIL=1
  fi
else
  bad "ANDROID_HOME / ANDROID_SDK_ROOT not set or not a directory"
  FAIL=1
fi

echo "== Rust targets =="
if command -v rustup >/dev/null 2>&1; then
  if rustup target list --installed 2>/dev/null | grep -q aarch64-linux-android; then
    ok "aarch64-linux-android installed"
  else
    bad "run: rustup target add aarch64-linux-android"
    FAIL=1
  fi
  if rustup target list --installed 2>/dev/null | grep -q x86_64-linux-android; then
    ok "x86_64-linux-android installed (emulator)"
  else
    warn "x86_64-linux-android not installed (only needed for emulators)"
  fi
else
  bad "rustup not found"
  FAIL=1
fi

echo "== Node / pnpm =="
need node
need pnpm

echo "== Project =="
if [ -f package.json ] && [ -d src-tauri ]; then
  ok "run from the project root"
else
  bad "run this script from the ai-code-studio project root"
  FAIL=1
fi

echo
if [ "$FAIL" -eq 0 ]; then
  printf '\033[32mAll prerequisites satisfied.\033[0m Next:\n'
  echo "  pnpm tauri android init     # once"
  echo "  pnpm tauri android dev      # run on device"
  echo "  pnpm tauri android build    # release APK/AAB"
else
  printf '\033[31mMissing prerequisites above.\033[0m Fix them, then re-run this script.\n'
fi
exit "$FAIL"
