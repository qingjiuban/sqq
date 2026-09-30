# AI Code Studio

A model-agnostic AI coding IDE. Desktop (Tauri) and mobile (Tauri mobile) share
one React frontend; a Rust backend provides filesystem, process and credential
access.

## Features

- File explorer, Monaco editor, open/edit/save
- Model gateway: OpenAI-compatible, Anthropic-style, Ollama and fully custom HTTP
  providers, with streaming, tool calling and a connection test
- Agent loop: read/write/edit files, search, list, project tree, plus
  `run_command` / `get_process_output` / `kill_process`
- Three-layer safety: permission levels 0-3, approval modes
  (`ask-all` / `auto-safe` / `full-auto`) and a command allow/deny policy
- Terminal panel showing command output
- Preview panel: auto-detects the project type, starts the dev server and
  embeds it in an iframe
- Self-repair: after edits, runs typecheck/build/test and feeds failures back to
  the model

## Requirements

- Node.js 20+ and pnpm
- Rust toolchain (stable)
- Linux desktop: `webkit2gtk-4.1`, `librsvg2-dev`, `libappindicator3-dev`,
  `patchelf`

## Development

```bash
# Install frontend dependencies
pnpm install

# Browser preview (UI only, no native backend)
pnpm dev

# Desktop app (native backend enabled)
pnpm tauri dev

# Production frontend build
pnpm build

# Rust checks
cd src-tauri && cargo check
```

## Mobile

The UI is responsive: below 768px it switches to a single-pane layout with a
bottom navigation bar (Files / Code / Agent / Preview).

On mobile the app has no folder picker and cannot spawn build tools, so it uses
a private sandbox directory as its workspace. The preview panel renders HTML/SVG
files directly through the asset protocol (no dev server), and shell commands
are disabled. Everything else (editing, agent, model gateway) works the same.

Mobile support is configured through `tauri.conf.json` and the `#[cfg]` guards
in the Rust backend. The `src-tauri/gen/android` and `src-tauri/gen/apple`
projects are intentionally not committed; the Tauri CLI generates them and they
are environment-specific.

### Build prerequisites

Android:

- JDK 17
- Android SDK + NDK (set `ANDROID_HOME` / `NDK_HOME`)
- `rustup target add aarch64-linux-android`

iOS (macOS only):

- Xcode and CocoaPods
- `rustup target add aarch64-apple-ios`

### Build and run

```bash
# One-time: generate the native projects
pnpm tauri android init
pnpm tauri ios init

# Run on a connected device or emulator
pnpm tauri android dev
pnpm tauri ios dev

# Produce a signed release build
pnpm tauri android build
pnpm tauri ios build
```

### Cloud build (no local Android toolchain)

`.github/workflows/android.yml` builds a debug APK on GitHub's runners, so a
local JDK 17 + Android SDK/NDK is optional. Push the repo to GitHub, then either
run the workflow manually from the Actions tab ("Android APK" -> Run workflow)
or push a `v*` tag. Download the APK from the run's Artifacts section. The
artifact is debug-signed, which is fine for sideloading and testing.

