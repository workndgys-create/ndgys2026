import type { AdminRole } from "./auth";

/**
 * Coarse action strings used to gate admin features.
 * "*" grants everything (SUPER_ADMIN).
 */
export const ACTIONS = [
  "registrations.read", "registrations.manage",
  "allocations.manage",
  "checkin.manage",
  "messages.read", "messages.manage",
  "announcements.manage",
  "content.read", "content.manage", // events / competitions / flow / speakers
  "badges.read",
  "team.manage",
  "settings.manage"
] as const;
export type Action = (typeof ACTIONS)[number];

const BASE: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "registrations.read", "registrations.manage",
    "allocations.manage", "checkin.manage",
    "messages.read", "messages.manage",
    "announcements.manage",
    "content.read", "content.manage",
    "badges.read"
  ],
  VIEWER: ["registrations.read", "messages.read", "content.read", "badges.read"]
};

function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export interface PermissionContext {
  role: AdminRole;
  extraPermissions?: string | null;
  deniedPermissions?: string | null;
}

export function can(ctx: PermissionContext, action: Action): boolean {
  const denied = parseList(ctx.deniedPermissions);
  if (denied.includes(action)) return false;
  const base = BASE[ctx.role] ?? [];
  const extra = parseList(ctx.extraPermissions);
  return base.includes("*") || base.includes(action) || extra.includes(action);
}

/** Effective allow-list for the client (kept compact; may contain "*"). */
export function effectivePermissions(ctx: PermissionContext): string[] {
  const denied = new Set(parseList(ctx.deniedPermissions));
  const base = BASE[ctx.role] ?? [];
  if (base.includes("*")) return ["*"];
  const set = new Set<string>([...base, ...parseList(ctx.extraPermissions)]);
  return [...set].filter((a) => !denied.has(a));
}

/** Client-side check against an effective allow-list. */
export function canFromList(list: string[], action: Action): boolean {
  return list.includes("*") || list.includes(action);
}
