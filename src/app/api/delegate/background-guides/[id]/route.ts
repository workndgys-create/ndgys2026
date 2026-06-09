import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await currentDelegate();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "PAID") return NextResponse.json({ error: "Available after payment" }, { status: 403 });
  const guide = await prisma.backgroundGuide.findUnique({ where: { id: params.id } });
  if (!guide || (guide.trackSlug && guide.trackSlug !== me.trackSlug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = Buffer.from(guide.data as unknown as Buffer);
  return new NextResponse(body, {
    headers: {
      "Content-Type": guide.mime || "application/pdf",
      "Content-Disposition": `attachment; filename="${guide.fileName.replace(/"/g, "")}"`,
      "Content-Length": String(body.length)
    }
  });
}
