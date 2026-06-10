import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

function parseOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return { ok: true as const, value: null };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return { ok: false as const };
  return { ok: true as const, value: parsed };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ("name" in b) data.name = String(b.name ?? "").trim();
  if ("agenda" in b) data.agenda = String(b.agenda ?? "");
  if ("difficulty" in b) data.difficulty = String(b.difficulty ?? "Intermediate");

  if ("fee" in b) {
    const parsed = parseOptionalNumber(b.fee);
    if (!parsed.ok || parsed.value == null || parsed.value < 0) {
      return NextResponse.json({ error: "Fee must be a valid non-negative number." }, { status: 422 });
    }
    data.fee = parsed.value;
  }

  if ("capacity" in b) {
    const parsed = parseOptionalNumber(b.capacity);
    if (!parsed.ok || parsed.value == null || parsed.value < 0) {
      return NextResponse.json({ error: "Capacity must be a valid non-negative number." }, { status: 422 });
    }
    data.capacity = parsed.value;
  }

  if ("isOpen" in b) {
    data.isOpen = b.isOpen === true || b.isOpen === "true";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  try {
    const item = await prisma.track.update({ where: { id: params.id }, data });
    await audit(s.email, "track.update", "Track", params.id, JSON.stringify(data));
    return NextResponse.json({ ok: true, item });
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Committee not found." }, { status: 404 });
    return NextResponse.json({ error: "Could not update committee." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.track.update({ where: { id: params.id }, data: { archived: true, isOpen: false } });
    await audit(s.email, "track.archive", "Track", params.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Committee not found." }, { status: 404 });
    return NextResponse.json({ error: "Could not archive committee." }, { status: 500 });
  }
}
