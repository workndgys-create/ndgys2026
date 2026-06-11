import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";
import { currentDelegate } from "@/lib/delegateSession";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;

  // 1. Authenticate check: Admin or Delegate session must be present
  const admin = await currentAdmin();
  let isAuthorized = !!admin;

  if (!isAuthorized) {
    const delegate = await currentDelegate();
    if (delegate && (delegate.id === id || delegate.delegateId === id)) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch photo from DB. Query by registration ID or delegate ID
  const registration = await prisma.registration.findFirst({
    where: {
      OR: [
        { id: id },
        { delegateId: id }
      ]
    },
    select: {
      id: true
    }
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  const photo = await prisma.registrationPhoto.findUnique({
    where: { registrationId: registration.id }
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  return new NextResponse(photo.data, {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "public, max-age=86400, must-revalidate",
    }
  });
}
