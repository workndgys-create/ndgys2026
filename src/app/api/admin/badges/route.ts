import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";
import { generateBadgePdf, generateBadgeSheet, BadgeData } from "@/lib/badge";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  const track = sp.get("track") || undefined;

  if (id) {
    const r = await prisma.registration.findUnique({ where: { id } });
    if (!r || !r.delegateId) return NextResponse.json({ error: "Delegate not found or unpaid" }, { status: 404 });
    const pdf = await generateBadgePdf({
      delegateId: r.delegateId,
      fullName: r.fullName,
      trackName: r.trackName,
      trackSlug: r.trackSlug,
      portfolio: r.portfolio,
      institution: r.institution,
      city: r.city,
      categoryLabel: "Portfolio"
    });
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="badge-${r.delegateId}.pdf"` } });
  }

  const where: any = { status: "PAID", NOT: { delegateId: null }, ...(track ? { trackSlug: track } : {}) };
  const regs = await prisma.registration.findMany({ where, orderBy: [{ trackSlug: "asc" }, { fullName: "asc" }] });
  const list: BadgeData[] = (regs as unknown as { delegateId: string; fullName: string; trackName: string; trackSlug: string; portfolio: string | null; institution: string | null; city: string | null }[])
    .map((r) => ({
      delegateId: r.delegateId,
      fullName: r.fullName,
      trackName: r.trackName,
      trackSlug: r.trackSlug,
      portfolio: r.portfolio,
      institution: r.institution,
      city: r.city,
      categoryLabel: "Portfolio"
    }));
  const pdf = await generateBadgeSheet(list);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="badges${track ? "-" + track : ""}.pdf"` } });
}
