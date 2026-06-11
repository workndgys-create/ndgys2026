import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const delegate = await currentDelegate();
  if (!delegate) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((delegate as any).isCompetition) {
    return NextResponse.json({ error: "Photo upload not required for competition participants" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => null);
    const { photoData, photoMime } = body || {};

    if (!photoData || !photoMime) {
      return NextResponse.json({ error: "Photo data and MIME type are required" }, { status: 422 });
    }

    if (!photoMime.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 422 });
    }

    if (photoMime !== "image/jpeg" && photoMime !== "image/jpg" && photoMime !== "image/png") {
      return NextResponse.json({ error: "Only JPEG and PNG formats are supported" }, { status: 422 });
    }

    const buf = Buffer.from(photoData, "base64");
    if (buf.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be smaller than 2MB" }, { status: 422 });
    }

    // Upsert the photo record linked to this delegate's registration
    await prisma.registrationPhoto.upsert({
      where: { registrationId: delegate.id },
      update: { mime: photoMime, data: buf },
      create: { registrationId: delegate.id, mime: photoMime, data: buf }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delegate/photo POST] error:", err);
    return NextResponse.json({ error: "Could not upload photo." }, { status: 500 });
  }
}
