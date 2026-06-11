import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
import {
  generateBadgePdf,
  generateBadgeSheet,
} from "@/lib/badge";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const reg = await currentDelegate();

  if (!reg) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Competition participants
  if ((reg as any).isCompetition) {
    const compReg =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            id: reg.id,
          },
        }
      );

    if (
      !compReg ||
      compReg.status !== "PAID"
    ) {
      return NextResponse.json(
        {
          error:
            "Badge available after payment",
        },
        { status: 409 }
      );
    }

    const competition =
      await prisma.competition.findUnique(
        {
          where: {
            id: compReg.competitionId,
          },
        }
      );

    const members =
      typeof compReg.members ===
      "string"
        ? JSON.parse(compReg.members)
        : compReg.members || [];

    const memberBadges =
      members.map(
        (
          member: any,
          index: number
        ) => ({
          delegateId:
            member.participantId ||
            `${compReg.refId}-${String(
              index + 1
            ).padStart(2, "0")}`,

          fullName:
            member.name,

          trackName:
            compReg.competitionTitle,

          trackSlug:
            competition?.slug ||
            compReg.competitionId,

          portfolio: null,

          institution:
            compReg.institution,

          city:
            compReg.city,

          categoryLabel:
            "Competition",

          photoData:
            undefined,

          photoMime:
            undefined,
        })
      );

    const allBadges = [
      {
        delegateId:
          `${compReg.refId}-00`,

        fullName:
          compReg.leaderName,

        trackName:
          compReg.competitionTitle,

        trackSlug:
          competition?.slug ||
          compReg.competitionId,

        portfolio: null,

        institution:
          compReg.institution,

        city:
          compReg.city,

        categoryLabel:
          "Competition",

        photoData:
          undefined,

        photoMime:
          undefined,
      },

      ...memberBadges,
    ];

    const pdf =
      await generateBadgeSheet(
        allBadges
      );

    return new NextResponse(
      new Uint8Array(pdf),
      {
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="badges-${compReg.refId}.pdf"`,
        },
      }
    );
  }

  // MUN delegates
  if (!reg.delegateId) {
    return NextResponse.json(
      {
        error:
          "Badge available after payment",
      },
      { status: 409 }
    );
  }

  const photo =
    await prisma.registrationPhoto.findUnique(
      {
        where: {
          registrationId:
            reg.id,
        },
      }
    );

  const pdf =
    await generateBadgePdf({
      delegateId:
        reg.delegateId,

      fullName:
        reg.fullName,

      trackName:
        reg.trackName,

      trackSlug:
        reg.trackSlug,

      portfolio:
        reg.portfolio,

      institution:
        reg.institution,

      city:
        reg.city,

      categoryLabel:
        "Portfolio",

      photoData:
        photo?.data
          ? Buffer.from(
              photo.data
            )
          : undefined,

      photoMime:
        photo?.mime,
    });

  return new NextResponse(
    new Uint8Array(pdf),
    {
      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="badge-${reg.delegateId}.pdf"`,
      },
    }
  );
}
