import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { currentAdmin, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

const ANNOUNCEMENT_TEMPLATE_ID = "be579367-b458-42d3-b2c3-dbdb3db4e063";

async function notifyDelegates(title: string, body: string, audience: string, trackSlug: string | null) {
  const where: any = { email: { not: "" } };
  if (audience === "PAID") where.status = "PAID";
  if (audience === "TRACK") {
    if (!trackSlug) return;
    where.trackSlug = trackSlug;
  }

  const recipients = await prisma.registration.findMany({
    where,
    distinct: ["email"],
    select: { email: true }
  });

  const preheader = body.substring(0, 100).replace(/\n/g, " ");
  const templateData = {
    PREHEADER: preheader,
    KICKER: "ANNOUNCEMENT",
    HEADLINE: title,
    BODY_HTML: body.replace(/\n/g, "<br />"),
    CTA_URL: `${env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    CTA_LABEL: "Open Dashboard"
  };

  await Promise.allSettled(
    recipients.map((recipient) =>
      sendMail({
        to: recipient.email,
        subject: title,
        template: ANNOUNCEMENT_TEMPLATE_ID,
        templateData
      })
    )
  );
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
  if (b.audience === "TRACK" && !b.trackSlug) return NextResponse.json({ error: "Track is required for TRACK audience" }, { status: 422 });

  const a = await prisma.announcement.create({
    data: { title: b.title, body: b.body, audience: (b.audience || "ALL"), trackSlug: b.trackSlug || null }
  });

  await audit(admin.email, "announcement.create", "Announcement", a.id);
  await notifyDelegates(a.title, a.body, a.audience, a.trackSlug);

  return NextResponse.json({ ok: true, id: a.id });
}
