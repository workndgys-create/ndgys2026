import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  const results = q
    ? await prisma.competitionRegistration.findMany({
        where: {
          status: "PAID",
          OR: [
            { refId: q },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          refId: true,
          leaderName: true,
          competitionTitle: true,
          checkedIn: true,
          checkedInAt: true,
        },
        take: 10,
      })
    : [];

  return NextResponse.json({ results });
}

export async function POST(req: NextRequest) {
  const admin = await currentAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const q = body?.q?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Scan value required" },
      { status: 422 }
    );
  }

  const registration = await prisma.competitionRegistration.findFirst({
    where: {
      status: "PAID",
      OR: [
        { refId: q },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
  });

  if (!registration) {
    return NextResponse.json(
      { error: "No paid competition participant found." },
      { status: 404 }
    );
  }

  if (registration.checkedIn) {
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: true,
      checkedInAt: registration.checkedInAt,
      registration,
    });
  }

  const updated = await prisma.competitionRegistration.update({
    where: { id: registration.id },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  await audit(
    admin.email,
    "competition.checkin.scan",
    "CompetitionRegistration",
    updated.id,
    `refId=${updated.refId}`
  );

  return NextResponse.json({
    ok: true,
    registration: updated,
  });
}
