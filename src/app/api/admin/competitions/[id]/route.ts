import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["title", "category", "summary", "description", "prize", "ctaUrl", "imageUrl"]) if (k in b) data[k] = b[k] || null;
  if ("published" in b) data.published = !!b.published;
  if ("order" in b) data.order = Number(b.order) || 0;
  if ("date" in b) data.date = b.date ? new Date(b.date) : null;
  if ("format" in b && ["SOLO", "GROUP", "BOTH"].includes(b.format)) data.format = b.format;
  if ("minTeam" in b) data.minTeam = b.minTeam ? Number(b.minTeam) : null;
  if ("maxTeam" in b) data.maxTeam = b.maxTeam ? Number(b.maxTeam) : null;
  if ("feeSolo" in b) data.feeSolo = b.feeSolo ? Number(b.feeSolo) : null;
  if ("feeGroup" in b) data.feeGroup = b.feeGroup ? Number(b.feeGroup) : null;
  if ("registrationOpen" in b) data.registrationOpen = b.registrationOpen === true || b.registrationOpen === "true";
  if ("questionsText" in b) data.questionsText = b.questionsText || null;
  const item = await prisma.competition.update({ where: { id: params.id }, data });
  await audit(s.email, "competition.update", "Competition", params.id);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.competition.delete({ where: { id: params.id } });
  await audit(s.email, "competition.delete", "Competition", params.id);
  return NextResponse.json({ ok: true });
}
