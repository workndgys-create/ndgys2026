import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("name" in b && b.name) data.name = b.name;
  if ("role" in b && b.role) data.role = b.role;
  if ("photoUrl" in b) data.photoUrl = b.photoUrl || null;
  if ("bio" in b) data.bio = b.bio || null;
  if ("order" in b) data.order = Number(b.order) || 0;
  if ("published" in b) data.published = b.published === true || b.published === "true";
  const item = await prisma.secretariatMember.update({ where: { id: params.id }, data });
  await audit(s.email, "secretariat.update", "SecretariatMember", params.id);
  return NextResponse.json({ ok: true, item });
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.secretariatMember.delete({ where: { id: params.id } });
  await audit(s.email, "secretariat.delete", "SecretariatMember", params.id);
  return NextResponse.json({ ok: true });
}
