import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const s = await requireRole("SUPER_ADMIN");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true }
    });
    return NextResponse.json({ admins });
  } catch (error) {
    console.error("[admin/team] GET failed", { email: s.email, error });
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

const createSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  role: z.enum([
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
]),
  password: z.string().min(8)
});

export async function POST(req: NextRequest) {
  const s = await requirePermission("team.add");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
    const d = parsed.data;
    const exists = await prisma.adminUser.findUnique({ where: { email: d.email } });
    if (exists) return NextResponse.json({ error: "An admin with that email already exists" }, { status: 409 });
    const passwordHash = await bcrypt.hash(d.password, 10);
    const u = await prisma.adminUser.create({ data: { email: d.email, name: d.name || null, role: d.role, passwordHash } });
    await audit(s.email, "team.create", "AdminUser", u.id, d.role);
    return NextResponse.json({ ok: true, id: u.id });
  } catch (error) {
    console.error("[admin/team] POST failed", { email: s.email, error });
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
