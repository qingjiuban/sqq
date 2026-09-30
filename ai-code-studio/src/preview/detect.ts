import { listDir, readFile } from "../lib/api";
import { getFileTree } from "../lib/searchApi";

export interface PreviewCommand {
  command: string;
  args: string[];
}

export interface PreviewPlan {
  kind: string;
  label: string;
  /** Command to run in the project root. Empty on mobile (no processes). */
  command: PreviewCommand;
  /** Port the server is expected to listen on, or null for local file mode. */
  port: number | null;
  /** Optional relative path inside the repo to run from. */
  cwd?: string;
  /** Framework/manager hints discovered during detection. */
  notes: string[];
  /** Mobile: render the file directly through the asset protocol. */
  localEntry?: string;
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const VITE_DEFAULT = 5173;
const CRA_DEFAULT = 3000;
const NEXT_DEFAULT = 3000;
const ASTRO_DEFAULT = 4321;
const NUXT_DEFAULT = 3000;
const ANGULAR_DEFAULT = 4200;

function parsePortFromScript(script: string | undefined): number | null {
  if (!script) return null;
  const patterns = [
    /--port[= ](\d{2,5})/,
    /-p\s+(\d{2,5})/,
    /PORT=(\d{2,5})/,
    /--listen[= ]\S*:(\d{2,5})/,
  ];
  for (const pattern of patterns) {
    const match = script.match(pattern);
    if (match) {
      const port = Number(match[1]);
      if (Number.isFinite(port)) return port;
    }
  }
  return null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function readPackageJson(): Promise<PackageJson | null> {
  try {
    const raw = await readFile("package.json");
    return JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }
}

async function detectNode(
  pkg: PackageJson,
  manager: string,
): Promise<PreviewPlan | null> {
  const scripts = pkg.scripts ?? {};
  const scriptName = scripts.dev ? "dev" : scripts.start ? "start" : null;
  if (!scriptName) return null;

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const notes: string[] = [];
  let kind = "node";
  let label = "Node.js dev server";
  let port = 3000;

  if (deps.next) {
    kind = "next";
    label = "Next.js";
    port = NEXT_DEFAULT;
  } else if (deps["@angular/core"]) {
    kind = "angular";
    label = "Angular";
    port = ANGULAR_DEFAULT;
  } else if (deps["react-scripts"]) {
    kind = "cra";
    label = "Create React App";
    port = CRA_DEFAULT;
  } else if (deps.astro) {
    kind = "astro";
    label = "Astro";
    port = ASTRO_DEFAULT;
  } else if (deps.nuxt) {
    kind = "nuxt";
    label = "Nuxt";
    port = NUXT_DEFAULT;
  } else if (deps.vite) {
    kind = "vite";
    label = "Vite";
    port = VITE_DEFAULT;
  } else if (deps["@vue/cli-service"]) {
    kind = "vue";
    label = "Vue CLI";
    port = 8080;
  } else if (deps.express || deps.fastify || deps.koa) {
    kind = "node-server";
    label = "Node 服务";
    port = 3000;
  } else {
    notes.push("No known web framework detected; using the start script as-is.");
  }

  const scriptPort = parsePortFromScript(scripts[scriptName]);
  if (scriptPort) {
    port = scriptPort;
    notes.push(`Port ${scriptPort} taken from the "${scriptName}" script.`);
  }

  return {
    kind,
    label,
    command: { command: manager, args: ["run", scriptName] },
    port,
    notes,
  };
}

async function detectManager(): Promise<string> {
  if (await fileExists("pnpm-lock.yaml")) return "pnpm";
  if (await fileExists("yarn.lock")) return "yarn";
  if (await fileExists("bun.lockb")) return "bun";
  return "npm";
}

async function detectStatic(): Promise<PreviewPlan | null> {
  const hasIndex = await fileExists("index.html");
  const hasPublic = await fileExists("public/index.html");
  if (!hasIndex && !hasPublic) return null;
  return {
    kind: "static",
    label: "静态 HTML",
    command: { command: "python3", args: ["-m", "http.server", "8000"] },
    port: 8000,
    cwd: hasIndex ? undefined : "public",
    notes: ["Serving static files with python http.server."],
  };
}

const HTML_ENTRY_NAMES = ["index.html", "index.htm", "main.html"];
const HTML_EXTENSIONS = [".html", ".htm", ".svg"];

async function detectLocalFile(): Promise<PreviewPlan | null> {
  for (const name of HTML_ENTRY_NAMES) {
    if (await fileExists(name)) {
      return {
        kind: "local",
        label: name,
        command: { command: "", args: [] },
        port: null,
        localEntry: name,
        notes: ["Rendering the file directly with the asset protocol."],
      };
    }
  }

  const tree = await getFileTree(400);
  const candidate = tree.find((path) =>
    HTML_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext)),
  );
  if (!candidate) return null;
  return {
    kind: "local",
    label: candidate.split("/").pop() ?? candidate,
    command: { command: "", args: [] },
    port: null,
    localEntry: candidate,
    notes: ["Rendering the first HTML/SVG file found."],
  };
}

export interface DetectOptions {
  /** Mobile cannot spawn build tools, so only static sites are previewable. */
  staticOnly?: boolean;
}

/**
 * Inspect the project root and decide how to start a preview server.
 * Detection is best-effort: when nothing matches we return null and the UI
 * falls back to a manual command.
 */
export async function detectPreviewPlan(
  options: DetectOptions = {},
): Promise<PreviewPlan | null> {
  if (options.staticOnly) {
    return detectLocalFile();
  }

  const entries = await listDir(".");
  const names = new Set(entries.map((entry) => entry.name));

  if (names.has("package.json")) {
    const pkg = await readPackageJson();
    if (pkg) {
      const plan = await detectNode(pkg, await detectManager());
      if (plan) return plan;
    }
  }

  if (names.has("manage.py")) {
    return {
      kind: "django",
      label: "Django",
      command: { command: "python3", args: ["manage.py", "runserver", "8000"] },
      port: 8000,
      notes: [],
    };
  }

  if (names.has("app.py") || names.has("wsgi.py")) {
    return {
      kind: "flask",
      label: "Flask",
      command: { command: "python3", args: ["app.py"] },
      port: 8000,
      notes: [],
    };
  }

  if (names.has("go.mod")) {
    return {
      kind: "go",
      label: "Go",
      command: { command: "go", args: ["run", "."] },
      port: 8080,
      notes: [],
    };
  }

  if (names.has("Cargo.toml")) {
    return {
      kind: "rust",
      label: "Rust",
      command: { command: "cargo", args: ["run"] },
      port: 8080,
      notes: [],
    };
  }

  if (names.has("pom.xml")) {
    return {
      kind: "spring",
      label: "Spring Boot (Maven)",
      command: { command: "mvn", args: ["spring-boot:run"] },
      port: 8080,
      notes: [],
    };
  }

  const staticPlan = await detectStatic();
  if (staticPlan) return staticPlan;

  return null;
}
