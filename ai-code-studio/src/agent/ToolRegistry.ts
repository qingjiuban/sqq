import type { AgentTool } from "../types/tools";
import {
  editFileTool,
  getProjectInfoTool,
  listFilesTool,
  readFileTool,
  searchFilesTool,
  writeFileTool,
} from "./fileTools";
import {
  getProcessOutputTool,
  killProcessTool,
  runCommandTool,
} from "./commandTools";

export const READONLY_TOOLS: AgentTool[] = [
  readFileTool,
  listFilesTool,
  searchFilesTool,
  getProjectInfoTool,
];

export const WRITE_TOOLS: AgentTool[] = [writeFileTool, editFileTool];

export const EXECUTE_TOOLS: AgentTool[] = [
  runCommandTool,
  getProcessOutputTool,
  killProcessTool,
];

const ALL_TOOLS: AgentTool[] = [...READONLY_TOOLS, ...WRITE_TOOLS, ...EXECUTE_TOOLS];

export function getTool(name: string): AgentTool | undefined {
  return ALL_TOOLS.find((tool) => tool.name === name);
}

export function allTools(): AgentTool[] {
  return ALL_TOOLS;
}
