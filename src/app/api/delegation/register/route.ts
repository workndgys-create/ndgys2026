import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { delegationSchema } from "@/lib/validation";
import { createCashfreeOrder, cashfreeMode } from "@/lib/cashfree";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { env } from "@/lib/env";
import { getFlag } from "@/lib/settings";
import { holdPortfolio } from "@/lib/portfolios";
import { checkPromo } from "@/lib/promoDb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`delegation:${clientIp(req.headers)}`, 5, 60).ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  if (!(await getFlag("registration.open"))) return NextResponse.json({ error: "Registration is currently closed." }, { status: 403 });

  const parsed = delegationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const d = parsed.data;
  if (d.company) return NextResponse.json({ ok: true });
  if (!d.consentAccepted) return NextResponse.json({ error: "Please accept the Terms and Code of Conduct to continue.", needConsent: true }, { status: 422 });

  // Resolve fees per member from their committee
  const slugs = Array.from(new Set(d.members.map((m) => m.track)));
  type T = { slug: string; name: string; fee: number };
  const tracks = (await prisma.track.findMany({ where: { slug: { in: slugs } } })) as unknown as T[];
  const trackBySlug = new Map<string, T>(tracks.map((t) => [t.slug, t]));
  for (const m of d.members) if (!trackBySlug.get(m.track)) return NextResponse.json({ error: `Unknown committee: ${m.track}` }, { status: 422 });

  const subtotal = d.members.reduce((sum, m) => sum + (trackBySlug.get(m.track)!.fee), 0);

  // Optional delegation-wide promo (applies to the whole subtotal)
  let amount = subtotal;
  let appliedCode: string | null = null;
  if (d.promoCode) {
    const promo = await checkPromo(d.promoCode, subtotal);
    if (!promo.ok) return NextResponse.json({ error: "That promo code can't be applied.", promoInvalid: true }, { status: 422 });
    amount = promo.final; appliedCode = promo.code ?? null;
  }

  const delegation = await prisma.delegation.create({
    data: {
      schoolName: d.schoolName, headName: d.headName, email: d.email, phone: d.phone,
      institution: d.institution || null, memberCount: d.members.length, amount, promoCode: appliedCode, consentAccepted: true, status: "PENDING"
    }
  });

  // Create one PENDING registration per member, holding an optional portfolio
  const createdIds: string[] = [];
  for (const m of d.members) {
    const t = trackBySlug.get(m.track)!;
    const reg = await prisma.registration.create({
      data: {
        fullName: m.fullName, email: (m.email || d.email), phone: (m.phone || d.phone), institution: d.institution || null,
        trackSlug: t.slug, trackName: t.name, amount: t.fee, status: "PENDING",
        delegationId: delegation.id, portfolioId: m.portfolioId || null
      }
    });
    createdIds.push(reg.id);
    if (m.portfolioId) {
      const hold = await holdPortfolio(m.portfolioId, reg.id);
      if (!hold.ok) {
        // roll back the whole delegation if any requested portfolio is taken
        await prisma.portfolio.updateMany({ where: { heldBy: { in: createdIds } }, data: { status: "AVAILABLE", heldUntil: null, heldBy: null } }).catch(() => {});
        await prisma.registration.deleteMany({ where: { delegationId: delegation.id } }).catch(() => {});
        await prisma.delegation.delete({ where: { id: delegation.id } }).catch(() => {});
        return NextResponse.json({ error: `A selected portfolio for ${m.fullName} was just taken — please review and resubmit.`, portfolioUnavailable: true }, { status: 409 });
      }
    }
  }

  try {
    const order = await createCashfreeOrder({
      orderId: delegation.id, amountPaise: amount,
      customer: { id: delegation.id, name: d.headName, email: d.email, phone: d.phone },
      returnUrl: `${env.NEXT_PUBLIC_BASE_URL}/?delegation={order_id}`,
      notifyUrl: `${env.NEXT_PUBLIC_BASE_URL}/api/payment/cashfree-webhook`,
      note: `Delegation - ${d.schoolName}`
    });
    await prisma.delegation.update({ where: { id: delegation.id }, data: { gatewayOrderId: order.orderId } });
    return NextResponse.json({ delegationId: delegation.id, orderId: order.orderId, paymentSessionId: order.paymentSessionId, mode: cashfreeMode(), amount, currency: "INR" });
  } catch (err) {
    console.error("[delegation] order error", err);
    await prisma.portfolio.updateMany({ where: { heldBy: { in: createdIds } }, data: { status: "AVAILABLE", heldUntil: null, heldBy: null } }).catch(() => {});
    await prisma.registration.deleteMany({ where: { delegationId: delegation.id } }).catch(() => {});
    await prisma.delegation.delete({ where: { id: delegation.id } }).catch(() => {});
    return NextResponse.json({ error: "Could not initialise payment. Please try again." }, { status: 502 });
  }
}
