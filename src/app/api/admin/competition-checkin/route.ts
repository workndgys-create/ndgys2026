import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

function normaliseCompetitionScan(raw: string): string {
  let refId = raw.trim();

  // Handle verify URLs
  try {
    const url = new URL(refId);

    if (url.pathname.includes("/verify/")) {
      refId = decodeURIComponent(
        url.pathname.split("/verify/").pop() || ""
      );
    }
  } catch {
    // Not a URL, continue
  }

  // Handle plain verify URLs without URL parsing
  if (refId.includes("/verify/")) {
    refId = decodeURIComponent(
      refId.split("/verify/").pop() || ""
    );
  }

  // Remove QR signature
  // NDGYS-C-2026-26N3.542c5e5ba6425159
  // becomes
  // NDGYS-C-2026-26N3
  const dot = refId.lastIndexOf(".");

  if (
    refId.startsWith("NDGYS-C-") &&
    dot > 0
  ) {
    refId = refId.substring(0, dot);
  }

  return refId;
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

  const q =
    typeof body?.q === "string"
      ? normaliseCompetitionScan(body.q)
      : "";

  if (!q) {
    return NextResponse.json(
      { error: "Invalid QR code." },
      { status: 422 }
    );
  }

  console.log("Competition scan:", q);

  const participant =
    await prisma.competitionRegistration.findFirst({
      where: {
        refId: q,
        status: "PAID",
      },
    });

  if (!participant) {
    return NextResponse.json(
      {
        error:
          "No paid competition participant found.",
      },
      { status: 404 }
    );
  }

  // Already checked in
  if (participant.checkedIn) {
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: true,
      participant,
    });
  }

  const updated =
    await prisma.competitionRegistration.update({
      where: {
        id: participant.id,
      },
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
    participant: updated,
  });
}
