import { cookies } from "next/headers";
import { verifySessionToken, sessionCookieName, roleAtLeast, AdminRole, AdminSession } from "./auth";
import { prisma } from "./prisma";
import { can, effectivePermissions, Action } from "./permissions";

export async function currentAdmin(): Promise<AdminSession | null> {
  const token = cookies().get(sessionCookieName)?.value;
  return token ? verifySessionToken(token) : null;
}

/** Returns the session if it meets the minimum role, else null. */
export async function requireRole(min: AdminRole): Promise<AdminSession | null> {
  const s = await currentAdmin();
  if (!s || !roleAtLeast(s.role, min)) return null;
  return s;
}

/** Loads the AdminUser overrides for the current session (role lives in the JWT). */
async function loadCtx(s: AdminSession) {
  try {
    const u = await prisma.adminUser.findUnique({ where: { email: s.email }, select: { active: true, extraPermissions: true, deniedPermissions: true } });
    if (!u || !u.active) return null;
    return { role: s.role, extraPermissions: u.extraPermissions, deniedPermissions: u.deniedPermissions };
  } catch {
    return { role: s.role, extraPermissions: null, deniedPermissions: null };
  }
}

/** Returns the session iff it is allowed to perform `action` (role + per-user overrides). */
export async function requirePermission(action: Action): Promise<AdminSession | null> {
  const s = await currentAdmin();
  if (!s) return null;
  const ctx = await loadCtx(s);
  if (!ctx) return null;
  return can(ctx, action) ? s : null;
}

/** Effective permission allow-list for the current admin (for the client UI). */
export async function currentPermissions(): Promise<{ session: AdminSession; permissions: string[] } | null> {
  const s = await currentAdmin();
  if (!s) return null;
  const ctx = (await loadCtx(s)) ?? { role: s.role, extraPermissions: null, deniedPermissions: null };
  return { session: s, permissions: effectivePermissions(ctx) };
}

export async function audit(adminEmail: string, action: string, entity: string, entityId?: string, meta?: string) {
  try {
    await prisma.adminAction.create({ data: { adminEmail, action, entity, entityId: entityId ?? null, meta: meta ?? null } });
  } catch (error) {
    console.error("[adminSession] audit failed", { adminEmail, action, entity, entityId, error });
  }
}
