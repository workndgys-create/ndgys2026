import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifyDelegateSession, delegateCookieName } from "./delegateAuth";
import { generateDelegateId } from "./ids";

/**
 * Returns the participant's PAID registration, or null.
 * The participant portal unlocks once payment is confirmed, so a session
 * without a PAID registration resolves to null (no portal access).
 */
export async function currentDelegate() {
  const token = cookies().get(delegateCookieName)?.value;
  const session = token ? await verifyDelegateSession(token) : null;
  if (!session) return null;

  const activeRegId = cookies().get("ndgys_active_reg_id")?.value;

  if (activeRegId) {
    // Try to find in Registration first
    const reg = await prisma.registration.findFirst({ where: { id: activeRegId, email: session.email, status: "PAID" } });
    if (reg) {
      if (reg.delegateId) return { ...reg, isCompetition: false };

      // Backfill for legacy PAID rows created before delegateId assignment became strict.
      for (let i = 0; i < 3; i++) {
        const candidate = await generateDelegateId();
        const updated = await prisma.registration.updateMany({
          where: { id: reg.id, status: "PAID", delegateId: null },
          data: { delegateId: candidate }
        });
        if (updated.count === 1) return { ...reg, delegateId: candidate, isCompetition: false };

        const latest = await prisma.registration.findUnique({ where: { id: reg.id } });
        if (latest?.delegateId) return { ...latest, isCompetition: false };
      }
      return { ...reg, isCompetition: false };
    }

    // Try to find in CompetitionRegistration
    const compReg = await prisma.competitionRegistration.findFirst({ where: { id: activeRegId, email: session.email, status: "PAID" } });
    if (compReg) {
      const comp = await prisma.competition.findUnique({ where: { id: compReg.competitionId } });
      const trackSlug = comp?.slug || compReg.competitionId;
      return {
        id: compReg.id,
        delegateId: compReg.refId,
        fullName: compReg.leaderName,
        email: compReg.email,
        phone: compReg.phone,
        institution: compReg.institution || "",
        trackSlug,
        trackName: compReg.competitionTitle,
        status: "PAID" as const,
        experience: compReg.pastExperience || "",
        amount: compReg.amount,
        source: "online" as const,
        portfolio: null,
        portfolioId: null,
        delegationId: null,
        promoCode: null,
        nudgedAt: null,
        cancelledAt: null,
        rosterOptIn: false,
        age: compReg.age,
        city: compReg.city,
        gender: compReg.gender,
        emergencyContact: compReg.emergencyContact,
        howHeard: compReg.howHeard,
        notes: compReg.notes,
        consentAccepted: compReg.consentAccepted,
        guardianName: compReg.guardianName,
        guardianPhone: compReg.guardianPhone,
        guardianConsent: compReg.guardianConsent,
        customAnswers: null,
        dietary: null,
        accessibility: null,
        checkedInDay1: false,
        checkedInDay2: false,
        gatewayOrderId: compReg.gatewayOrderId,
        gatewayPaymentId: compReg.gatewayPaymentId,
        createdAt: compReg.createdAt,
        updatedAt: compReg.updatedAt,
        isCompetition: true
      };
    }
  }

  // Fallback: Check standard Registration
  const reg = await prisma.registration.findFirst({ where: { email: session.email, status: "PAID" }, orderBy: { createdAt: "desc" } });
  if (reg) {
    if (reg.delegateId) return { ...reg, isCompetition: false };

    // Backfill for legacy PAID rows created before delegateId assignment became strict.
    for (let i = 0; i < 3; i++) {
      const candidate = await generateDelegateId();
      const updated = await prisma.registration.updateMany({
        where: { id: reg.id, status: "PAID", delegateId: null },
        data: { delegateId: candidate }
      });
      if (updated.count === 1) return { ...reg, delegateId: candidate, isCompetition: false };

      const latest = await prisma.registration.findUnique({ where: { id: reg.id } });
      if (latest?.delegateId) return { ...latest, isCompetition: false };
    }
    return { ...reg, isCompetition: false };
  }

  // Check CompetitionRegistration
  const compReg = await prisma.competitionRegistration.findFirst({ where: { email: session.email, status: "PAID" }, orderBy: { createdAt: "desc" } });
  if (compReg) {
    const comp = await prisma.competition.findUnique({ where: { id: compReg.competitionId } });
    const trackSlug = comp?.slug || compReg.competitionId;
    return {
      id: compReg.id,
      delegateId: compReg.refId,
      fullName: compReg.leaderName,
      email: compReg.email,
      phone: compReg.phone,
      institution: compReg.institution || "",
      trackSlug,
      trackName: compReg.competitionTitle,
      status: "PAID" as const,
      experience: compReg.pastExperience || "",
      amount: compReg.amount,
      source: "online" as const,
      portfolio: null,
      portfolioId: null,
      delegationId: null,
      promoCode: null,
      nudgedAt: null,
      cancelledAt: null,
      rosterOptIn: false,
      age: compReg.age,
      city: compReg.city,
      gender: compReg.gender,
      emergencyContact: compReg.emergencyContact,
      howHeard: compReg.howHeard,
      notes: compReg.notes,
      consentAccepted: compReg.consentAccepted,
      guardianName: compReg.guardianName,
      guardianPhone: compReg.guardianPhone,
      guardianConsent: compReg.guardianConsent,
      customAnswers: null,
      dietary: null,
      accessibility: null,
      checkedInDay1: false,
      checkedInDay2: false,
      gatewayOrderId: compReg.gatewayOrderId,
      gatewayPaymentId: compReg.gatewayPaymentId,
      createdAt: compReg.createdAt,
      updatedAt: compReg.updatedAt,
      isCompetition: true
    };
  }

  return null;
}

export async function allDelegateRegistrations() {
  const token = cookies().get(delegateCookieName)?.value;
  const session = token ? await verifyDelegateSession(token) : null;
  if (!session) return [];

  const list: Array<{
    id: string;
    delegateId: string;
    fullName: string;
    trackSlug: string;
    trackName: string;
    amount: number;
    status: string;
    isCompetition: boolean;
    createdAt: Date;
  }> = [];

  const regs = await prisma.registration.findMany({
    where: { email: session.email, status: "PAID" },
    orderBy: { createdAt: "desc" }
  });
  for (const r of regs) {
    list.push({
      id: r.id,
      delegateId: r.delegateId || "",
      fullName: r.fullName,
      trackSlug: r.trackSlug,
      trackName: r.trackName,
      amount: r.amount,
      status: r.status,
      isCompetition: false,
      createdAt: r.createdAt
    });
  }

  const compRegs = await prisma.competitionRegistration.findMany({
    where: { email: session.email, status: "PAID" },
    orderBy: { createdAt: "desc" }
  });
  for (const c of compRegs) {
    const comp = await prisma.competition.findUnique({ where: { id: c.competitionId } });
    const trackSlug = comp?.slug || c.competitionId;
    list.push({
      id: c.id,
      delegateId: c.refId,
      fullName: c.leaderName,
      trackSlug,
      trackName: c.competitionTitle,
      amount: c.amount,
      status: c.status,
      isCompetition: true,
      createdAt: c.createdAt
    });
  }

  return list;
}
