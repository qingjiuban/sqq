import { listDir, readFile } from "../lib/api";
import { getProcessOutput, runCommand } from "../lib/commandApi";
import { canExecuteCommands } from "../lib/platform";

export interface VerifyStep {
  label: string;
  command: string;
  args: string[];
}

export interface VerifyOutcome {
  step: VerifyStep;
  passed: boolean;
  output: string;
}

const WAIT_MS = 120_000;
const POLL_MS = 800;

interface PackageJson {
  scripts?: Record<string, string>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function detectManager(): Promise<string> {
  if (await fileExists("pnpm-lock.yaml")) return "pnpm";
  if (await fileExists("yarn.lock")) return "yarn";
  if (await fileExists("bun.lockb")) return "bun";
  return "npm";
}

/**
 * Pick the commands that best prove the project still works, ordered from the
 * cheapest/most targeted check to the most expensive one. Only a couple are
 * kept so a self-repair cycle stays fast.
 */
export async function detectVerifySteps(): Promise<VerifyStep[]> {
  if (!canExecuteCommands()) return [];
  const entries = await listDir(".");
  const names = new Set(entries.map((entry) => entry.name));
  const steps: VerifyStep[] = [];

  if (names.has("package.json")) {
    let scripts: Record<string, string> = {};
    try {
      const raw = await readFile("package.json");
      scripts = (JSON.parse(raw) as PackageJson).scripts ?? {};
    } catch {
      scripts = {};
    }
    const manager = await detectManager();
    const ordered = ["typecheck", "lint", "build", "test"].filter(
      (name) => typeof scripts[name] === "string",
    );
    for (const name of ordered.slice(0, 2)) {
      steps.push({ label: name, command: manager, args: ["run", name] });
    }
  }

  if (names.has("Cargo.toml")) {
    steps.push({ label: "cargo check", command: "cargo", args: ["check"] });
  }

  if (names.has("go.mod")) {
    steps.push({ label: "go build", command: "go", args: ["build", "./..."] });
  }

  if (names.has("pyproject.toml") && names.has("mypy.ini")) {
    steps.push({ label: "mypy", command: "python3", args: ["-m", "mypy", "."] });
  }

  return steps;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run a single verify step to completion, waiting for background processes. */
async function runStep(step: VerifyStep): Promise<VerifyOutcome> {
  const result = await runCommand(step.command, step.args, 10_000);
  let { stdout, stderr, running, exitCode } = result;

  const deadline = Date.now() + WAIT_MS;
  while (running && Date.now() < deadline) {
    await sleep(POLL_MS);
    const polled = await getProcessOutput(result.processId).catch(() => null);
    if (!polled) break;
    stdout = polled.stdout;
    stderr = polled.stderr;
    running = polled.running;
    exitCode = polled.exitCode;
  }

  const output = [stdout, stderr].filter((part) => part.trim()).join("\n");
  return { step, passed: !running && exitCode === 0, output: output.trim() };
}

/**
 * Run the detected verification steps in order, stopping at the first failure
 * so the agent can repair the project before continuing.
 */
export async function runVerification(): Promise<VerifyOutcome[]> {
  const steps = await detectVerifySteps();
  const outcomes: VerifyOutcome[] = [];
  for (const step of steps) {
    const outcome = await runStep(step);
    outcomes.push(outcome);
    if (!outcome.passed) break;
  }
  return outcomes;
}
