import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

const TYPES = ["short", "paragraph", "select", "multiselect"];

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.registrationQuestion.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.label) return NextResponse.json({ error: "Question label is required" }, { status: 422 });
  const type = TYPES.includes(b.type) ? b.type : "short";
  const options = Array.isArray(b.options) ? JSON.stringify(b.options.map(String).filter(Boolean)) : null;
  const max = await prisma.registrationQuestion.aggregate({ _max: { order: true } });
  const item = await prisma.registrationQuestion.create({
    data: { label: b.label, type, options, helpText: b.helpText || null, required: !!b.required, published: b.published === undefined ? true : !!b.published, order: (max._max.order ?? -1) + 1 }
  });
  await audit(s.email, "regquestion.create", "RegistrationQuestion", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
