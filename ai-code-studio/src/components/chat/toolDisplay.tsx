import type { ReactNode } from "react";
import type { ToolCall } from "../../types/tools";
import {
  IconAgent,
  IconCube,
  IconEdit,
  IconFiles,
  IconSearch,
  IconStop,
  IconTerminal,
} from "../ui/icons";

function basename(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : path;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Turn an internal tool call into language a user reads: what the agent is
 * doing to their project, not which function was invoked.
 */
export function describeTool(call: ToolCall): {
  label: string;
  detail?: string;
  icon: ReactNode;
} {
  const a = call.arguments ?? {};
  switch (call.name) {
    case "read_file":
      return { label: "Read", detail: basename(str(a.path)), icon: <IconFiles size={14} /> };
    case "write_file":
      return { label: "Wrote", detail: basename(str(a.path)), icon: <IconEdit size={14} /> };
    case "edit_file":
      return { label: "Edited", detail: basename(str(a.path)), icon: <IconEdit size={14} /> };
    case "list_files":
      return {
        label: "Listed files",
        detail: str(a.path) && str(a.path) !== "." ? basename(str(a.path)) : undefined,
        icon: <IconFiles size={14} />,
      };
    case "search_files":
      return {
        label: "Searched",
        detail: str(a.query) || str(a.pattern) || undefined,
        icon: <IconSearch size={14} />,
      };
    case "get_project_info":
      return { label: "Inspected project", icon: <IconCube size={14} /> };
    case "run_command":
      return { label: "Ran", detail: str(a.command), icon: <IconTerminal size={14} /> };
    case "get_process_output":
      return {
        label: "Read output",
        detail: str(a.processId) || undefined,
        icon: <IconTerminal size={14} />,
      };
    case "kill_process":
      return {
        label: "Stopped process",
        detail: str(a.processId) || undefined,
        icon: <IconStop size={14} />,
      };
    default:
      return { label: call.name, icon: <IconAgent size={14} /> };
  }
}

export function describeApproval(call: ToolCall): string {
  switch (call.name) {
    case "write_file":
    case "edit_file":
      return "This will modify files in your project.";
    case "run_command":
      return "This will run a command inside your project.";
    case "kill_process":
      return "This will stop a running process.";
    default:
      return "Allow this operation?";
  }
}
