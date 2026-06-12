import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requirePermission("registrations.manage");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.status === "string") {
    if (!["PENDING", "PAID", "CANCELLED"].includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 422 });
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 422 });

  const updated = await prisma.competitionRegistration.update({ where: { id: params.id }, data });

  await audit(admin.email, "competition-entry.status", "CompetitionRegistration", params.id, JSON.stringify(data));
  return NextResponse.json({ ok: true, entry: { id: updated.id, status: updated.status } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requirePermission("registrations.read");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const entry = await prisma.competitionRegistration.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requirePermission("registrations.manage");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  const existing = await prisma.competitionRegistration.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.competitionRegistration.delete({ where: { id } });
    await audit(admin.email, "competition-entry.delete", "CompetitionRegistration", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/competition-entries] DELETE failed", { id, error });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
