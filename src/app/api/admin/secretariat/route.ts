import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.secretariatMember.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}
export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.name || !b?.role) return NextResponse.json({ error: "Name and role are required" }, { status: 422 });
  const item = await prisma.secretariatMember.create({
    data: { name: b.name, role: b.role, photoUrl: b.photoUrl || null, bio: b.bio || null, order: Number(b.order) || 0, published: b.published === undefined ? true : (b.published === true || b.published === "true") }
  });
  await audit(s.email, "secretariat.create", "SecretariatMember", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
