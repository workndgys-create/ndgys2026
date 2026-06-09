import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const me = await currentDelegate();

    if (!me) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (me.status !== "PAID") {
      return NextResponse.json(
        { error: "Available after payment" },
        { status: 403 }
      );
    }

    const guide = await prisma.committeeGuide.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!guide || guide.trackSlug !== me.trackSlug) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    if (!guide.data || guide.data.length === 0) {
      return NextResponse.json(
        { error: "Guide file missing" },
        { status: 404 }
      );
    }

    // PrismaPg returns Uint8Array for Bytes columns
    const body = new Uint8Array(guide.data);

    // Sanitize filename for HTTP headers
    const safeFileName = (guide.fileName || "guide.pdf")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/"/g, "");

    return new NextResponse(body, {
      headers: {
        "Content-Type": guide.mime || "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GUIDE DOWNLOAD ERROR:", error);

    return NextResponse.json(
      { error: "Failed to download guide" },
      { status: 500 }
    );
  }
}
