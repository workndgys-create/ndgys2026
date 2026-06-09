import type { AdminRole } from "./auth";

export const ACTIONS = [
  "registrations.read",
  "registrations.manage",

  "allocations.manage",

  "checkin.scan",
  "checkin.manage",

  "badges.read",
  "badges.print",

  "messages.read",
  "messages.manage",

  "announcements.manage",

  "content.read",
  "content.manage",

  "competitions.manage",
  "competitionEntries.manage",

  "delegations.read",
  "delegations.manage",

  "payments.read",
  "payments.manage",

  "invoices.read",
  "invoices.manage",

  "reports.read",
  "reports.export",

  "volunteers.read",
  "volunteers.manage",

  "team.manage",
  "settings.manage",
  "system.manage"
] as const;

export type Action = (typeof ACTIONS)[number];

const BASE: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],

  DIRECTOR: [
    "registrations.read",
    "registrations.manage",
    "delegations.read",
    "delegations.manage",
    "messages.read",
    "messages.manage",
    "content.read",
    "content.manage",
    "competitions.manage",
    "competitionEntries.manage",
    "reports.read",
    "badges.read"
  ],

  HR: [
    "registrations.read",
    "checkin.scan",
    "checkin.manage",
    "badges.read",
    "badges.print"
  ],

  DEVELOPER: [
    "content.read",
    "content.manage",
    "team.manage",
    "settings.manage",
    "system.manage"
  ],

  FINANCE_LEAD: [
    "payments.read",
    "payments.manage",
    "invoices.read",
    "invoices.manage",
    "reports.read",
    "reports.export"
  ],

  FINANCE_EXECUTIVE: [
    "payments.read"
  ],

  DELEGATE_AFFAIRS_LEAD: [
    "registrations.read",
    "registrations.manage",
    "delegations.read",
    "delegations.manage",
    "messages.read",
    "messages.manage",
    "competitionEntries.manage"
  ],

  DELEGATE_AFFAIRS_EXECUTIVE: [
    "registrations.read",
    "messages.read"
  ],

  VOLUNTEER_COORDINATOR: [
    "checkin.scan",
    "badges.print",
    "volunteers.read",
    "volunteers.manage"
  ],

  VOLUNTEER: [
    "checkin.scan"
  ]
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

export function can(
  ctx: PermissionContext,
  action: Action
): boolean {
  const denied = parseList(ctx.deniedPermissions);

  if (denied.includes(action)) return false;

  const base = BASE[ctx.role] ?? [];
  const extra = parseList(ctx.extraPermissions);

  return (
    base.includes("*") ||
    base.includes(action) ||
    extra.includes(action)
  );
}

export function effectivePermissions(
  ctx: PermissionContext
): string[] {
  const denied = new Set(parseList(ctx.deniedPermissions));

  const base = BASE[ctx.role] ?? [];

  if (base.includes("*")) {
    return ["*"];
  }

  const set = new Set<string>([
    ...base,
    ...parseList(ctx.extraPermissions)
  ]);

  return [...set].filter((a) => !denied.has(a));
}

export function canFromList(
  list: string[],
  action: Action
): boolean {
  return (
    list.includes("*") ||
    list.includes(action)
  );
}
