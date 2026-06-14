import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate, allDelegateRegistrations } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const allRegs = await allDelegateRegistrations();
  const trackSlugs = allRegs.map(r => r.trackSlug).filter(Boolean);

  const items = await prisma.announcement.findMany({
    where: {
      OR: [
        { audience: "ALL" },
        ...(reg.status === "PAID" ? [{ audience: "PAID" as const }] : []),
        { audience: "TRACK", trackSlug: { in: trackSlugs } }
      ]
    },
    orderBy: { publishedAt: "desc" },
    take: 50
  });
  return NextResponse.json({ announcements: items });
}
