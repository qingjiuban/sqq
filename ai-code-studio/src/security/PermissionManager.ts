import type { ToolCall, ToolPermission } from "../types/tools";
import { getTool } from "../agent/ToolRegistry";

export type PermissionLevel = 0 | 1 | 2 | 3;

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  0: "Level 0 — Read only",
  1: "Level 1 — Read + edit project files",
  2: "Level 2 — Level 1 + safe commands",
  3: "Level 3 — Level 2 + high-risk commands",
};

export type ApprovalMode = "ask-all" | "auto-safe" | "full-auto";

const PERMISSION_RANK: Record<ToolPermission, number> = {
  read: 0,
  write: 1,
  execute: 2,
};

export interface PermissionDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

export class PermissionManager {
  constructor(
    private level: PermissionLevel = 1,
    private mode: ApprovalMode = "auto-safe",
  ) {}

  setLevel(level: PermissionLevel): void {
    this.level = level;
  }

  setMode(mode: ApprovalMode): void {
    this.mode = mode;
  }

  /** Whether the tool's permission class is permitted at the current level. */
  private withinLevel(permission: ToolPermission): boolean {
    return PERMISSION_RANK[permission] <= this.level;
  }

  check(permission: ToolPermission): PermissionDecision {
    if (!this.withinLevel(permission)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Permission "${permission}" exceeds the current level (${this.level}).`,
      };
    }
    if (this.mode === "full-auto") {
      return { allowed: true, requiresApproval: false };
    }
    if (this.mode === "auto-safe" && permission === "read") {
      return { allowed: true, requiresApproval: false };
    }
    return { allowed: true, requiresApproval: true };
  }

  checkCall(call: ToolCall): PermissionDecision {
    const permission = getTool(call.name)?.permission ?? "write";
    return this.check(permission);
  }
}

export const permissionManager = new PermissionManager();
