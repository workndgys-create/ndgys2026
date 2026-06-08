import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireRole("SUPER_ADMIN");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const target = await prisma.adminUser.findUnique({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (
  typeof body.role === "string" &&
  [
    "SUPER_ADMIN",
    "DIRECTOR",
    "HR",
    "DEVELOPER",
    "FINANCE_LEAD",
    "FINANCE_EXECUTIVE",
    "DELEGATE_AFFAIRS_LEAD",
    "DELEGATE_AFFAIRS_EXECUTIVE",
    "VOLUNTEER_COORDINATOR",
    "VOLUNTEER"
  ].includes(body.role)
) {
  data.role = body.role;
}
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.name === "string") data.name = body.name || null;
    if (typeof body.extraPermissions === "string" || body.extraPermissions === null) data.extraPermissions = body.extraPermissions;
    if (typeof body.deniedPermissions === "string" || body.deniedPermissions === null) data.deniedPermissions = body.deniedPermissions;

    if (target.role === "SUPER_ADMIN" && (data.role && data.role !== "SUPER_ADMIN" || data.active === false)) {
      const supers = await prisma.adminUser.count({ where: { role: "SUPER_ADMIN", active: true } });
      if (supers <= 1) return NextResponse.json({ error: "Cannot remove the last active super-admin" }, { status: 409 });
    }

    const updated = await prisma.adminUser.update({ where: { id: params.id }, data });
    await audit(s.email, "team.update", "AdminUser", params.id, JSON.stringify(data));
    return NextResponse.json({ ok: true, admin: { id: updated.id, role: updated.role, active: updated.active } });
  } catch (error) {
    console.error("[admin/team] PATCH failed", { id: params.id, email: s.email, error });
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}
