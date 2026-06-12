import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function GET() {
  const me = await currentDelegate();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "PAID") return NextResponse.json({ guides: [], locked: true });
  const guides = await prisma.committeeGuide.findMany({
    where: { trackSlug: me.trackSlug },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, title: true, fileName: true, sizeBytes: true, uploadedAt: true }
  });
  return NextResponse.json({ trackName: me.trackName, guides, isCompetition: !!(me as any).isCompetition });
}
