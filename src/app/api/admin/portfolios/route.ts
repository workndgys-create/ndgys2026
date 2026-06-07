import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const track = req.nextUrl.searchParams.get("track") || undefined;
  const where: any = track ? { trackSlug: track } : {};
  const items = await prisma.portfolio.findMany({ where, orderBy: [{ trackSlug: "asc" }, { order: "asc" }, { name: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("allocations.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.trackSlug || !b?.name) return NextResponse.json({ error: "Committee and name are required" }, { status: 422 });
  const exists = await prisma.portfolio.findFirst({ where: { trackSlug: b.trackSlug, name: b.name.trim() } });
  if (exists) return NextResponse.json({ error: "That portfolio already exists in this committee" }, { status: 409 });
  const item = await prisma.portfolio.create({ data: { trackSlug: b.trackSlug, name: b.name.trim(), order: Number(b.order) || 0 } });
  await audit(s.email, "portfolio.create", "Portfolio", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
