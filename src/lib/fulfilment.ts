import { prisma } from "./prisma";
import { generateDelegateId, nextInvoiceNumber } from "./ids";
import { generateInvoicePdf } from "./invoice";
import { qrDataUrl } from "./qr";
import { sendMail, templates } from "./email";
import { env } from "./env";
import { assignPortfolioForRegistration } from "./portfolios";
import { generateCompetitionRefId } from "./ids";
import { consumePromo } from "./promoDb";
import { summitIcs } from "./eventIcs";

/**
 * Idempotently fulfils a paid registration:
 *  - marks PAID, assigns a delegate id
 *  - creates the Invoice row (sequential number)
 *  - generates the PDF + QR and emails the delegate (invoice attached) + notifies admin
 * Safe to call from both the client verify route and the webhook.
 */
export async function fulfilPaidRegistration(orderId: string, paymentId: string): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  const reg = await prisma.registration.findUnique({ where: { gatewayOrderId: orderId } });
  if (!reg) return { ok: false, alreadyPaid: false };
  if (reg.status === "PAID") return { ok: true, alreadyPaid: true };

  const delegateId = reg.delegateId ?? (await generateDelegateId());

  await prisma.registration.update({
    where: { id: reg.id },
    data: { status: "PAID", gatewayPaymentId: paymentId, delegateId }
  });

  let portfolioLabel = reg.portfolio || undefined;
  // Auto-assign the portfolio the delegate selected at registration (idempotent).
  if (reg.portfolioId) {
    const label = await assignPortfolioForRegistration(reg.id, reg.portfolioId);
    if (label) {
      await prisma.registration.update({ where: { id: reg.id }, data: { portfolio: label } });
      portfolioLabel = label;
    }
  }
  if (reg.promoCode) await consumePromo(reg.promoCode);

  // Create invoice (guard against duplicates)
  const existing = await prisma.invoice.findUnique({ where: { registrationId: reg.id } });
  const invoice =
    existing ??
    (await prisma.invoice.create({
      data: { number: await nextInvoiceNumber(), registrationId: reg.id, amount: reg.amount }
    }));

  // Generate artifacts + email (never block fulfilment on email failures)
  try {
    const [pdf, qr] = await Promise.all([
      generateInvoicePdf({
        number: invoice.number,
        issuedAt: invoice.issuedAt,
        delegateId,
        fullName: reg.fullName,
        email: reg.email,
        trackName: reg.trackName,
        amount: reg.amount,
        portfolio: portfolioLabel
      }),
      qrDataUrl(delegateId)
    ]);

    const cal = await summitIcs(delegateId);
    await Promise.allSettled([
      sendMail({
        to: reg.email,
        subject: "Your Summit registration is confirmed 🎉",
        html: templates.registrationPaid(reg.fullName, reg.trackName, delegateId, reg.amount, qr),
        attachments: [
          { filename: `${invoice.number.replace(/\//g, "-")}.pdf`, content: pdf },
          { filename: cal.filename, content: Buffer.from(cal.ics, "utf8") }
        ]
      }),
      env.MAIL_ADMIN_TO
        ? sendMail({
            to: env.MAIL_ADMIN_TO,
            subject: `New registration — ${reg.trackName}`,
            html: templates.adminNewRegistration(reg.fullName, reg.email, reg.trackName)
          })
        : Promise.resolve()
    ]);
  } catch (err) {
    console.error("[fulfil] artifact/email error", err);
  }

  return { ok: true, alreadyPaid: false };
}

/** Idempotently fulfils a paid competition entry: marks PAID, assigns a ref id, emails confirmation. */
export async function fulfilPaidCompetition(orderId: string, paymentId: string): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  const entry = await prisma.competitionRegistration.findUnique({ where: { gatewayOrderId: orderId } });
  if (!entry) return { ok: false, alreadyPaid: false };
  if (entry.status === "PAID") return { ok: true, alreadyPaid: true };

  const refId = entry.refId;
  await prisma.competitionRegistration.update({
    where: { id: entry.id },
    data: { status: "PAID", gatewayPaymentId: paymentId }
  });

  try {
    await Promise.allSettled([
      sendMail({
        to: entry.email,
        subject: `You're registered — ${entry.competitionTitle} 🎉`,
        html: templates.competitionConfirmed(entry.leaderName, entry.competitionTitle, entry.participation, refId, entry.amount, entry.teamName)
      }),
      env.MAIL_ADMIN_TO
        ? sendMail({ to: env.MAIL_ADMIN_TO, subject: `New competition entry — ${entry.competitionTitle}`, html: templates.adminNewCompetition(entry.leaderName, entry.email, entry.competitionTitle, entry.participation) })
        : Promise.resolve()
    ]);
  } catch (err) {
    console.error("[fulfil:competition] email error", err);
  }
  return { ok: true, alreadyPaid: false };
}

/** Idempotently fulfils a paid delegation: marks the delegation + all member registrations PAID. */
export async function fulfilPaidDelegation(orderId: string, paymentId: string): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  const delegation = await prisma.delegation.findUnique({ where: { gatewayOrderId: orderId } });
  if (!delegation) return { ok: false, alreadyPaid: false };
  if (delegation.status === "PAID") return { ok: true, alreadyPaid: true };

  await prisma.delegation.update({ where: { id: delegation.id }, data: { status: "PAID", gatewayPaymentId: paymentId } });
  if (delegation.promoCode) await consumePromo(delegation.promoCode);

  const members = await prisma.registration.findMany({ where: { delegationId: delegation.id } });
  for (const reg of members) {
    if (reg.status === "PAID") continue;
    const delegateId = reg.delegateId ?? (await generateDelegateId());
    await prisma.registration.update({ where: { id: reg.id }, data: { status: "PAID", delegateId, gatewayPaymentId: paymentId } });
    let portfolioLabel = reg.portfolio || undefined;
    if (reg.portfolioId) {
      const label = await assignPortfolioForRegistration(reg.id, reg.portfolioId);
      if (label) {
        await prisma.registration.update({ where: { id: reg.id }, data: { portfolio: label } });
        portfolioLabel = label;
      }
    }
    try {
      const [pdf, qr] = await Promise.all([
        generateInvoicePdf({
          number: await nextInvoiceNumber(),
          issuedAt: new Date(),
          delegateId,
          fullName: reg.fullName,
          email: reg.email,
          trackName: reg.trackName,
          amount: reg.amount,
          portfolio: portfolioLabel
        }),
        qrDataUrl(delegateId)
      ]);
      const inv = await prisma.invoice.findUnique({ where: { registrationId: reg.id } });
      const invoice = inv ?? (await prisma.invoice.create({ data: { number: await nextInvoiceNumber(), registrationId: reg.id, amount: reg.amount } }));
      const cal = await summitIcs(delegateId);
      await sendMail({
        to: reg.email,
        subject: "Your Summit registration is confirmed 🎉",
        html: templates.registrationPaid(reg.fullName, reg.trackName, delegateId, reg.amount, qr),
        attachments: [
          { filename: `${invoice.number.replace(/\//g, "-")}.pdf`, content: pdf },
          { filename: cal.filename, content: Buffer.from(cal.ics, "utf8") }
        ]
      });
    } catch (err) { console.error("[fulfil:delegation-member] error", err); }
  }

  try {
    await sendMail({ to: delegation.email, subject: `Delegation confirmed — ${delegation.schoolName}`, html: templates.delegationConfirmed(delegation.headName, delegation.schoolName, delegation.memberCount, delegation.amount) });
  } catch (err) { console.error("[fulfil:delegation] email error", err); }

  return { ok: true, alreadyPaid: false };
}

/** Routes a paid order to the right fulfilment (delegate registration or competition entry). */
export async function fulfilByOrderId(orderId: string, paymentId: string): Promise<{ ok: boolean; kind: "registration" | "competition" | "delegation" | "none" }> {
  const reg = await prisma.registration.findUnique({ where: { gatewayOrderId: orderId }, select: { id: true } });
  if (reg) { await fulfilPaidRegistration(orderId, paymentId); return { ok: true, kind: "registration" }; }
  const comp = await prisma.competitionRegistration.findUnique({ where: { gatewayOrderId: orderId }, select: { id: true } });
  if (comp) { await fulfilPaidCompetition(orderId, paymentId); return { ok: true, kind: "competition" }; }
  const delg = await prisma.delegation.findUnique({ where: { gatewayOrderId: orderId }, select: { id: true } });
  if (delg) { await fulfilPaidDelegation(orderId, paymentId); return { ok: true, kind: "delegation" }; }
  return { ok: false, kind: "none" };
}
