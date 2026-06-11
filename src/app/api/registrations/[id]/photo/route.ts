import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";
import { currentDelegate } from "@/lib/delegateSession";

export const runtime = "nodejs";

function parseCompetitionId(id: string, searchParams: URLSearchParams) {
  let memberIndex = searchParams.get("memberIndex") ? Number(searchParams.get("memberIndex")) : null;
  let baseId = id;

  if (id.includes("-M")) {
    const parts = id.split("-M");
    baseId = parts[0];
    const suffixVal = Number(parts[1]);
    if (Number.isInteger(suffixVal)) {
      memberIndex = suffixVal - 1;
    }
  } else if (/-\d{2}$/.test(id)) {
    const parts = id.split("-");
    const suffix = parts.pop()!;
    baseId = parts.join("-");
    memberIndex = Number(suffix);
  }

  if (memberIndex === null) {
    memberIndex = 0;
  }

  return { baseId, memberIndex };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const admin = await currentAdmin();
  let isAuthorized = !!admin;

  // 1. Try fetching standard Registration first
  const registration = await prisma.registration.findFirst({
    where: {
      OR: [
        { id: id },
        { delegateId: id }
      ]
    },
    select: {
      id: true,
      delegateId: true
    }
  });

  if (registration) {
    if (!isAuthorized) {
      const delegate = await currentDelegate();
      if (delegate && (delegate.id === registration.id || delegate.delegateId === registration.delegateId)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // 2. Try Competition Registration
  const parsedComp = parseCompetitionId(id, req.nextUrl.searchParams);
  const compReg = await prisma.competitionRegistration.findFirst({
    where: {
      OR: [
        { id: parsedComp.baseId },
        { refId: parsedComp.baseId }
      ]
    },
    select: {
      id: true,
      refId: true
    }
  });

  if (compReg) {
    if (!isAuthorized) {
      const delegate = await currentDelegate();
      if (delegate && (delegate.id === compReg.id || delegate.delegateId === compReg.refId)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const compPhoto = await prisma.competitionPhoto.findUnique({
      where: {
        competitionRegistrationId_memberIndex: {
          competitionRegistrationId: compReg.id,
          memberIndex: parsedComp.memberIndex
        }
      }
    });

    if (!compPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return new NextResponse(compPhoto.data, {
      headers: {
        "Content-Type": compPhoto.mime,
        "Cache-Control": "public, max-age=86400, must-revalidate",
      }
    });
  }

  return NextResponse.json({ error: "Registration not found" }, { status: 404 });
}
