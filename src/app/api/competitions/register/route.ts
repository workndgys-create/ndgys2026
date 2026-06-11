import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { competitionRegistrationSchema } from "@/lib/validation";
import {
  feeForParticipation,
  validateTeam,
  Participation,
  CompetitionFormat
} from "@/lib/competitionRules";
import { generateCompetitionRefId } from "@/lib/ids";
import { createCashfreeOrder, cashfreeMode } from "@/lib/cashfree";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);

  const rl = rateLimit(`comp-register:${ip}`, 8, 60);

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfter),
        },
      }
    );
  }

  const parsed = competitionRegistrationSchema.safeParse(
    await req.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const d = parsed.data;

  if (d.company) {
    return NextResponse.json({ ok: true });
  }

  const needsHowHeardDetail =
    d.howHeard === "Friend / Word of mouth" ||
    d.howHeard === "Other";

  const howHeard =
    needsHowHeardDetail && d.howHeardDetail?.trim()
      ? `${d.howHeard}: ${d.howHeardDetail.trim()}`
      : d.howHeard;

  if (!d.consentAccepted) {
    return NextResponse.json(
      {
        error:
          "Please accept the Terms and Code of Conduct to continue.",
        needConsent: true,
      },
      { status: 422 }
    );
  }

  const c = await prisma.competition.findUnique({
    where: { id: d.competitionId },
  });

  if (!c || !c.published) {
    return NextResponse.json(
      { error: "Competition not found" },
      { status: 404 }
    );
  }

  if (!c.registrationOpen) {
    return NextResponse.json(
      {
        error:
          "Registration for this competition is closed.",
      },
      { status: 403 }
    );
  }

  const participation =
    d.participation as Participation;

  const team = validateTeam(
    {
      format: c.format as CompetitionFormat,
      minTeam: c.minTeam,
      maxTeam: c.maxTeam,
    },
    participation,
    d.members.length
  );

  if (!team.ok) {
    return NextResponse.json(
      { error: team.error },
      { status: 422 }
    );
  }

  const amount = feeForParticipation(
    {
      format: c.format as CompetitionFormat,
      feeSolo: c.feeSolo,
      feeGroup: c.feeGroup,
    },
    participation
  );

  if (amount == null || amount <= 0) {
    return NextResponse.json(
      {
        error:
          "This competition is not open for paid registration.",
      },
      { status: 422 }
    );
  }

  const refId = await generateCompetitionRefId();

  // Generate unique participant IDs for each member
  const membersWithIds = d.members.map(
    (member: any, index: number) => ({
      ...member,
      participantId: `${refId}-${String(
        index + 1
      ).padStart(2, "0")}`,
    })
  );

  const createPayload: any = {
    refId,
    competitionId: c.id,
    competitionTitle: c.title,
    participation,

    teamName:
      participation === "GROUP"
        ? d.teamName || null
        : null,

    leaderName: d.leaderName,
    email: d.email,
    phone: d.phone,
    institution: d.institution || null,

    // Store members WITH participant IDs
    members: JSON.stringify(membersWithIds),

    teamSize:
      participation === "GROUP"
        ? d.members.length
        : 1,

    age: d.age ?? null,
    city: d.city || null,
    gender: d.gender ?? null,

    emergencyContact:
      d.emergencyContact || null,

    pastExperience:
      d.pastExperience || null,

    howHeard: howHeard || null,

    notes: d.notes || null,

    answers:
      d.answers && d.answers.length
        ? JSON.stringify(d.answers)
        : null,

    consentAccepted: true,

    guardianName:
      d.guardianName || null,

    guardianPhone:
      d.guardianPhone || null,

    guardianConsent:
      !!d.guardianConsent,

    amount,

    status: "PENDING",
  };

  const entry =
    await prisma.competitionRegistration.create({
      data: createPayload,
    });

  // Store photos for leader (index 0) and members (index 1..N) if provided
  try {
    if (d.photoData && d.photoMime) {
      await prisma.competitionPhoto.create({
        data: {
          competitionRegistrationId: entry.id,
          memberIndex: 0,
          mime: d.photoMime,
          data: Buffer.from(d.photoData, "base64")
        }
      });
    }

    if (d.members && d.members.length > 0) {
      for (let i = 0; i < d.members.length; i++) {
        const m = d.members[i];
        if (m.photoData && m.photoMime) {
          await prisma.competitionPhoto.create({
            data: {
              competitionRegistrationId: entry.id,
              memberIndex: i + 1,
              mime: m.photoMime,
              data: Buffer.from(m.photoData, "base64")
            }
          });
        }
      }
    }
  } catch (err) {
    console.error("[competition-register] Failed to save competition photos:", err);
  }

  try {
    const order = await createCashfreeOrder({
      orderId: entry.id,

      amountRupees: amount,

      customer: {
        id: entry.id,
        name: d.leaderName,
        email: d.email,
        phone: d.phone,
      },

      returnUrl: `${env.NEXT_PUBLIC_BASE_URL}/?entry={order_id}`,

      notifyUrl: `${env.NEXT_PUBLIC_BASE_URL}/api/payment/cashfree-webhook`,

      note: c.title,
    });

    await prisma.competitionRegistration.update({
      where: { id: entry.id },

      data: {
        gatewayOrderId: order.orderId,
      },
    });

    return NextResponse.json({
      entryId: entry.id,

      refId,

      orderId: order.orderId,

      paymentSessionId:
        order.paymentSessionId,

      mode: cashfreeMode(),

      amount,

      currency: "INR",
    });
  } catch (err) {
    console.error(
      "[competition-register] order error",
      err
    );

    await prisma.competitionRegistration
      .delete({
        where: { id: entry.id },
      })
      .catch(() => {});

    return NextResponse.json(
      {
        error:
          "Could not initialise payment. Please try again.",
      },
      { status: 502 }
    );
  }
}
