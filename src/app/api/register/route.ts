import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBeginnerTrackSlug, registrationSchema } from "@/lib/validation";
import { createCashfreeOrder, cashfreeMode } from "@/lib/cashfree";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { env } from "@/lib/env";
import { getFlag } from "@/lib/settings";
import { holdPortfolio, getHoldMinutes } from "@/lib/portfolios";
import { checkPromo } from "@/lib/promoDb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`register:${ip}`, 8, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Please slow down." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  if (!(await getFlag("registration.open"))) {
    return NextResponse.json({ error: "Registration is currently closed." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const data = parsed.data;
  if (data.company) return NextResponse.json({ ok: true }); // honeypot tripped — silently drop
  const needsHowHeardDetail = data.howHeard === "Friend / Word of mouth" || data.howHeard === "Other";
  const howHeard = needsHowHeardDetail && data.howHeardDetail?.trim()
    ? `${data.howHeard}: ${data.howHeardDetail.trim()}`
    : data.howHeard;

  const portfolioId: string | undefined = body?.portfolioId;
  if (!portfolioId) return NextResponse.json({ error: "Please select a portfolio.", needPortfolio: true }, { status: 422 });
  if (!data.consentAccepted) return NextResponse.json({ error: "Please accept the Terms and Code of Conduct to continue.", needConsent: true }, { status: 422 });

  // Support category-style selections for International Press: if frontend sent a
  // category name (e.g., "Journalist") or the selected id is not a real portfolio
  // row, attempt to resolve it to an available underlying portfolio row.
  let resolvedPortfolioId: string | undefined = portfolioId;
  const ipCategories = new Set(["journalist", "caricature", "photographer"]);
  try {
    const maybe = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!maybe) {
      // If the selection is a category label, try to find an available matching row.
      const label = String(portfolioId || "").trim().toLowerCase();
      if (ipCategories.has(label)) {
        const now = new Date();
        const sample = await prisma.portfolio.findFirst({
          where: {
            trackSlug: data.track,
            name: { contains: label, mode: "insensitive" },
            OR: [
              { status: "AVAILABLE" },
              { status: "HELD", heldUntil: { lt: now } }
            ]
          },
          orderBy: [{ order: "asc" }, { name: "asc" }]
        });
        if (sample) resolvedPortfolioId = sample.id;
        else resolvedPortfolioId = undefined;
      } else {
        // not found and not a category — mark as unresolved
        resolvedPortfolioId = undefined;
      }
    }
  } catch (err) {
    resolvedPortfolioId = undefined;
  }

  if (!resolvedPortfolioId) return NextResponse.json({ error: "Invalid portfolio for this committee." }, { status: 422 });

  // Validate answers to admin-defined custom questions (required ones must be answered)
  const answers = Array.isArray((body as any)?.customAnswers) ? (body as any).customAnswers as { questionId: string; label: string; value: string | string[] }[] : [];
  type RQ = { id: string; label: string; required: boolean };
  const requiredQs = (await prisma.registrationQuestion.findMany({ where: { published: true, required: true }, select: { id: true, label: true, required: true } })) as unknown as RQ[];
  for (const q of requiredQs) {
    const a = answers.find((x) => x.questionId === q.id);
    const empty = !a || (Array.isArray(a.value) ? a.value.length === 0 : !String(a.value).trim());
    if (empty) return NextResponse.json({ error: `Please answer: ${q.label}`, needAnswer: q.id }, { status: 422 });
  }

  const track = await prisma.track.findUnique({ where: { slug: data.track } });
  if (!track) return NextResponse.json({ error: "Unknown track" }, { status: 422 });
  if (isBeginnerTrackSlug(track.slug)) {
    if (typeof data.age !== "number" || data.age < 12 || data.age > 16) {
      return NextResponse.json(
        {
          error: "Beginner committees are only open to delegates aged 12-16.",
          issues: { age: ["Beginner committees are only open to delegates aged 12-16."] }
        },
        { status: 422 }
      );
    }
  }
  if (!track.isOpen) return NextResponse.json({ error: "Registration for this track is closed" }, { status: 409 });

  const paidCount = await prisma.registration.count({ where: { trackSlug: track.slug, status: "PAID" } });
  // derive capacity from actual portfolios for this track
  const portfolioCount = await prisma.portfolio.count({ where: { trackSlug: track.slug } });
  if (paidCount >= portfolioCount) return NextResponse.json({ error: "Track is full", full: true }, { status: 409 });

  // Validate the (resolved) portfolio belongs to this committee
  const portfolio = await prisma.portfolio.findUnique({ where: { id: resolvedPortfolioId } });
  if (!portfolio || portfolio.trackSlug !== track.slug) return NextResponse.json({ error: "Invalid portfolio for this committee." }, { status: 422 });

  // Apply an optional promo code to the committee fee
  let amount = track.fee;
  let appliedCode: string | null = null;
  const rawCode: string | undefined = body?.promoCode;
  if (rawCode) {
    const promo = await checkPromo(rawCode, track.fee, track.slug);
    if (!promo.ok) return NextResponse.json({ error: "That promo code can't be applied.", promoInvalid: true, reason: promo.reason }, { status: 422 });
    amount = promo.final; appliedCode = promo.code ?? null;
  }

  // If delegate2 info was supplied (UNSC double-delegation), append it to customAnswers so both delegates are linked to this registration
  const combinedAnswers = answers.slice();
  if (data.delegate2) {
    combinedAnswers.push({ questionId: "__delegate2__", label: "Delegate 2", value: data.delegate2 as any });
  }

  // Create the PENDING registration first (so the hold can reference it)
  const createPayload: any = {
    fullName: data.fullName, email: data.email, phone: data.phone,
    institution: data.institution || null, trackSlug: track.slug, trackName: track.name,
    amount, status: "PENDING", portfolioId: resolvedPortfolioId, promoCode: appliedCode,
    age: data.age ?? null, city: data.city || null, gender: data.gender ?? null,
    emergencyContact: data.emergencyContact ?? null, howHeard: howHeard || null, notes: data.notes || null,
    consentAccepted: true, guardianName: data.guardianName || null, guardianPhone: data.guardianPhone || null, guardianConsent: !!data.guardianConsent,
    customAnswers: combinedAnswers.length ? JSON.stringify(combinedAnswers) : null
  };

  const reg = await prisma.registration.create({ data: createPayload });

  // Atomically hold the portfolio for the configured window
  const hold = await holdPortfolio(resolvedPortfolioId as string, reg.id);
  if (!hold.ok) {
    await prisma.registration.delete({ where: { id: reg.id } }).catch(() => {});
    return NextResponse.json({ error: "That portfolio was just taken — please choose another.", portfolioUnavailable: true }, { status: 409 });
  }

  // Store photo if provided
  if (body?.photoData && body?.photoMime) {
    if (body.photoMime.startsWith("image/")) {
      try {
        const buf = Buffer.from(body.photoData, "base64");
        if (buf.length <= 2 * 1024 * 1024) {
          await prisma.registrationPhoto.create({
            data: {
              registrationId: reg.id,
              mime: body.photoMime,
              data: buf
            }
          });
        }
      } catch (err) {
        console.error("[register] Failed to save photo:", err);
      }
    }
  }

  try {
    const order = await createCashfreeOrder({
      orderId: reg.id, amountRupees: amount,
      customer: { id: reg.id, name: data.fullName, email: data.email, phone: data.phone },
      returnUrl: `${env.NEXT_PUBLIC_BASE_URL}/dashboard?order={order_id}`,
      notifyUrl: `${env.NEXT_PUBLIC_BASE_URL}/api/payment/cashfree-webhook`,
      note: `Delegate ${track.name} - ${portfolio.name}`
    });
    await prisma.registration.update({ where: { id: reg.id }, data: { gatewayOrderId: order.orderId } });
    return NextResponse.json({
      registrationId: reg.id, orderId: order.orderId, paymentSessionId: order.paymentSessionId, mode: cashfreeMode(),
      amount, currency: "INR", portfolio: portfolio.name, heldUntil: hold.heldUntil, holdMinutes: await getHoldMinutes()
    });
  } catch (err) {
    console.error("[register] order error", err);
    // free the hold + the pending row on failure to start payment
    await prisma.portfolio.updateMany({ where: { id: portfolioId, heldBy: reg.id }, data: { status: "AVAILABLE", heldUntil: null, heldBy: null } }).catch(() => {});
    await prisma.registration.delete({ where: { id: reg.id } }).catch(() => {});
    return NextResponse.json({ error: "Could not initialise payment. Please try again." }, { status: 502 });
  }
}
