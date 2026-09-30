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
      return { label: "读取", detail: basename(str(a.path)), icon: <IconFiles size={14} /> };
    case "write_file":
      return { label: "写入", detail: basename(str(a.path)), icon: <IconEdit size={14} /> };
    case "edit_file":
      return { label: "编辑", detail: basename(str(a.path)), icon: <IconEdit size={14} /> };
    case "list_files":
      return {
        label: "列出文件",
        detail: str(a.path) && str(a.path) !== "." ? basename(str(a.path)) : undefined,
        icon: <IconFiles size={14} />,
      };
    case "search_files":
      return {
        label: "搜索",
        detail: str(a.query) || str(a.pattern) || undefined,
        icon: <IconSearch size={14} />,
      };
    case "get_project_info":
      return { label: "检查项目", icon: <IconCube size={14} /> };
    case "run_command":
      return { label: "运行", detail: str(a.command), icon: <IconTerminal size={14} /> };
    case "get_process_output":
      return {
        label: "读取输出",
        detail: str(a.processId) || undefined,
        icon: <IconTerminal size={14} />,
      };
    case "kill_process":
      return {
        label: "停止进程",
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
      return "此操作将修改你项目中的文件。";
    case "run_command":
      return "此操作将在你的项目中运行一条命令。";
    case "kill_process":
      return "此操作将停止一个正在运行的进程。";
    default:
      return "允许此操作吗？";
  }
}
