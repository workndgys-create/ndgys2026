import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.announcement.findMany({
    where: {
      OR: [
        { audience: "ALL" },
        ...(reg.status === "PAID" ? [{ audience: "PAID" as const }] : []),
        { audience: "TRACK", trackSlug: reg.trackSlug }
      ]
    },
    orderBy: { publishedAt: "desc" },
    take: 50
  });
  return NextResponse.json({ announcements: items });
}
