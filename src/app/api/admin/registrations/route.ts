import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await currentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePermission("registrations.read"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || "";
  const status = sp.get("status") || "";
  const track = sp.get("track") || "";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Math.max(5, Number(sp.get("pageSize") || 20)));

  if (status && !["PENDING", "PAID", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 422 });
  }

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

  try {
    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          delegateId: true,
          fullName: true,
          email: true,
          phone: true,
          trackSlug: true,
          trackName: true,
          portfolio: true,
          amount: true,
          status: true,
          source: true,
          createdAt: true
        }
      }),
      prisma.registration.count({ where })
    ]);

    return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error("[admin/registrations GET] primary query failed", error);

    try {
      // Fallback for legacy/dirty enum data: omit `source` to avoid decode issues and still render list.
      const [itemsFallback, total] = await Promise.all([
        prisma.registration.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            delegateId: true,
            fullName: true,
            email: true,
            phone: true,
            trackSlug: true,
            trackName: true,
            portfolio: true,
            amount: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.registration.count({ where })
      ]);

      const items = itemsFallback.map((x) => ({ ...x, source: "online" }));
      return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize), degraded: true });
    } catch (fallbackError) {
      console.error("[admin/registrations GET] fallback query failed", fallbackError);
      // Do not throw a 500 to the UI; return a safe empty payload so admin page still loads.
      return NextResponse.json({ items: [], total: 0, page, pageSize, pages: 0, degraded: true, temporaryError: true });
    }
  }
}

// Create an offline (manual) registration, already PAID.
export async function POST(req: NextRequest) {
  const admin = await requirePermission("registrations.manage");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body?.fullName || !body?.email || !body?.track) return NextResponse.json({ error: "Missing fields" }, { status: 422 });
    const t = await prisma.track.findUnique({ where: { slug: body.track } });
    if (!t) return NextResponse.json({ error: "Unknown track" }, { status: 422 });
    const reg = await prisma.registration.create({
      data: { fullName: body.fullName, email: body.email, phone: body.phone || "-", trackSlug: t.slug, trackName: t.name, amount: t.fee, status: "PAID", source: "offline" }
    });
    await audit(admin.email, "registration.offline.create", "Registration", reg.id);
    return NextResponse.json({ id: reg.id });
  } catch (error) {
    console.error("[admin/registrations POST] failed", error);
    return NextResponse.json({ error: "Could not create registration right now." }, { status: 503 });
  }
}
