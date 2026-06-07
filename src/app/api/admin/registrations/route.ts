import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || "";
  const status = sp.get("status") || "";
  const track = sp.get("track") || "";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Math.max(5, Number(sp.get("pageSize") || 20)));

  const where: any = {
    AND: [
      q ? { OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { delegateId: { contains: q, mode: "insensitive" } }
      ] } : {},
      status ? { status: status as any } : {},
      track ? { trackSlug: track } : {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.registration.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.registration.count({ where })
  ]);

  return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });
}

// Create an offline (manual) registration, already PAID.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.fullName || !body?.email || !body?.track) return NextResponse.json({ error: "Missing fields" }, { status: 422 });
  const t = await prisma.track.findUnique({ where: { slug: body.track } });
  if (!t) return NextResponse.json({ error: "Unknown track" }, { status: 422 });
  const reg = await prisma.registration.create({
    data: { fullName: body.fullName, email: body.email, phone: body.phone || "-", trackSlug: t.slug, trackName: t.name, amount: t.fee, status: "PAID", source: "offline" }
  });
  return NextResponse.json({ id: reg.id });
}
