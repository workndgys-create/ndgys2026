import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.track.findMany({ where: { archived: false }, orderBy: [{ createdAt: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => null);
  if (!b?.slug || !b?.name) return NextResponse.json({ error: "Slug and name are required" }, { status: 422 });

  const fee = Number(b.fee);
  if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "Fee must be a valid non-negative number" }, { status: 422 });

  const item = await prisma.track.create({
    data: {
      slug: String(b.slug).trim().toLowerCase(),
      name: String(b.name).trim(),
      fee,
      capacity: Number.isFinite(Number(b.capacity)) ? Number(b.capacity) : 0,
      agenda: String(b.agenda || "").trim(),
      difficulty: String(b.difficulty || "Intermediate"),
      isOpen: b.isOpen === undefined ? true : (b.isOpen === true || b.isOpen === "true")
    }
  });

  await audit(s.email, "track.create", "Track", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
