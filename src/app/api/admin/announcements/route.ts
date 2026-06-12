import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { currentAdmin, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

const ANNOUNCEMENT_TEMPLATE_ID = "be579367-b458-42d3-b2c3-dbdb3db4e063";

async function notifyRecipients(title: string, body: string, audience: string, trackSlug: string | null, competitionId: string | null) {
  const preheader = body.substring(0, 100).replace(/\n/g, " ");
  const templateData = {
    PREHEADER: preheader,
    KICKER: "ANNOUNCEMENT",
    HEADLINE: title,
    BODY_HTML: body.replace(/\n/g, "<br />"),
    CTA_URL: `${env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    CTA_LABEL: "Open Dashboard"
  };

  // helper to send to list of emails
  const sendTo = async (emails: string[]) => {
    await Promise.allSettled(
      emails.map((to) => sendMail({ to, subject: title, template: ANNOUNCEMENT_TEMPLATE_ID, templateData }))
    );
  };

  // All participants = all registrations + all competition registrations
  if (audience === "ALL") {
    const regs = await prisma.registration.findMany({ where: { email: { not: "" } }, distinct: ["email"], select: { email: true } });
    const comps = await prisma.competitionRegistration.findMany({ where: { email: { not: "" } }, distinct: ["email"], select: { email: true } });
    const emails = Array.from(new Set([...regs.map(r => r.email), ...comps.map(c => c.email)]));
    return sendTo(emails);
  }

  // All MUN delegates
  if (audience === "MUN_ALL") {
    const regs = await prisma.registration.findMany({ where: { email: { not: "" } }, distinct: ["email"], select: { email: true } });
    return sendTo(regs.map(r => r.email));
  }

  // Specific MUN committee
  if (audience === "TRACK") {
    if (!trackSlug) return;
    const regs = await prisma.registration.findMany({ where: { email: { not: "" }, trackSlug }, distinct: ["email"], select: { email: true } });
    return sendTo(regs.map(r => r.email));
  }

  // All competition participants
  if (audience === "COMPETITION_ALL") {
    const comps = await prisma.competitionRegistration.findMany({ where: { email: { not: "" } }, distinct: ["email"], select: { email: true } });
    return sendTo(comps.map(c => c.email));
  }

  // Specific competition
  if (audience === "COMPETITION") {
    if (!competitionId) return;
    const comps = await prisma.competitionRegistration.findMany({ where: { competitionId, email: { not: "" } }, distinct: ["email"], select: { email: true } });
    return sendTo(comps.map(c => c.email));
  }

  // Backwards-compatible: PAID
  if (audience === "PAID") {
    const regs = await prisma.registration.findMany({ where: { email: { not: "" }, status: "PAID" }, distinct: ["email"], select: { email: true } });
    return sendTo(regs.map(r => r.email));
  }

  return;
}

export async function GET() {
  const items = await prisma.announcement.findMany({ orderBy: { publishedAt: "desc" }, take: 100 });
  return NextResponse.json({ announcements: items });
}
export async function POST(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.title || !b?.body) return NextResponse.json({ error: "Missing fields" }, { status: 422 });

  const aud: string = b.audience || "ALL";
  if (aud === "TRACK" && !b.trackSlug) return NextResponse.json({ error: "Track is required for TRACK audience" }, { status: 422 });
  if (aud === "COMPETITION" && !b.competitionId) return NextResponse.json({ error: "Competition is required for COMPETITION audience" }, { status: 422 });

  const a = await prisma.announcement.create({
    data: { title: b.title, body: b.body, audience: aud as any, trackSlug: b.trackSlug || null, competitionId: b.competitionId || null }
  });

  await audit(admin.email, "announcement.create", "Announcement", a.id);
  await notifyRecipients(a.title, a.body, a.audience, a.trackSlug, a.competitionId);

  return NextResponse.json({ ok: true, id: a.id });
}
