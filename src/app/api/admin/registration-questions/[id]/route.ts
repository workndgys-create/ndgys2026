import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";
const TYPES = ["short", "paragraph", "select", "multiselect"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("label" in b && b.label) data.label = b.label;
  if ("type" in b && TYPES.includes(b.type)) data.type = b.type;
  if ("options" in b) data.options = Array.isArray(b.options) ? JSON.stringify(b.options.map(String).filter(Boolean)) : null;
  if ("helpText" in b) data.helpText = b.helpText || null;
  if ("required" in b) data.required = !!b.required;
  if ("published" in b) data.published = !!b.published;
  if ("order" in b) data.order = Number(b.order) || 0;
  const item = await prisma.registrationQuestion.update({ where: { id: params.id }, data });
  await audit(s.email, "regquestion.update", "RegistrationQuestion", params.id);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.registrationQuestion.delete({ where: { id: params.id } });
  await audit(s.email, "regquestion.delete", "RegistrationQuestion", params.id);
  return NextResponse.json({ ok: true });
}
