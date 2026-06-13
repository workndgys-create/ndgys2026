import { env } from "./env";

export interface Attachment {
  filename: string;
  content: Buffer;
}
export interface MailInput {
  to: string;
  subject?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  attachments?: Attachment[];
}

/** Sends via Resend; logs and resolves (never throws) when RESEND_API_KEY is absent. */
export async function sendMail({ to, subject, html, template, templateData, attachments }: MailInput): Promise<{ sent: boolean }> {
  if (!env.RESEND_API_KEY) {
    console.info(`[email:skipped] to=${to} subject="${subject ?? template ?? "(no subject)"}" (RESEND_API_KEY not set)`);
    return { sent: false };
  }

  const payload: Record<string, unknown> = {
    from: env.MAIL_FROM,
    to
  };

const attachmentsPayload = attachments?.length
    ? attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") }))
    : undefined;

  if (template && templateData) {
    payload.template = {
      id: template,
      variables: templateData
    };
    payload.subject = subject || "Announcement";
  } else {
    if (html) payload.html = html;
    if (subject) payload.subject = subject;
  }

  if (attachmentsPayload) {
    payload.attachments = attachmentsPayload;
  }

  console.log("[email:sending]", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[email:error] Resend returned error:", to, result);
      if (template && html) {
        console.warn("[email:warn] Template send failed, retrying with HTML fallback for", to);
        delete payload.template;
        delete payload.subject;
        payload.html = html;
        if (subject) payload.subject = subject;

        const retryResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const retryResult = await retryResponse.json().catch(() => ({}));
        if (!retryResponse.ok) {
          console.error("[email:error] HTML fallback also failed:", to, retryResult);
          return { sent: false };
        }
        console.log("[email:sent] to", to, "(HTML fallback)");
        return { sent: true };
      }
      return { sent: false };
    }

    console.log("[email:sent] to", to);
    return { sent: true };
  } catch (err) {
    console.error("[email:error] Exception:", to, err);
    return { sent: false };
  }
}

const PAYMENTS_RECEIPT_TEMPLATE_ID = "7f3595e7-3ada-453f-a13a-0d3cae799da8";
const REGISTRATION_CONFIRMED_TEMPLATE_ID = "908f81fe-100b-43f5-bb99-97c85a9158b1";

const supportEmailFromSender = (from: string) => {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
};

export function receiptTemplateData(options: {
  fullName: string;
  receiptNo: string;
  date: string;
  item: string;
  paymentId: string;
  amount: string;
  supportEmail: string;
  venue: string;
  invoiceUrl: string;
  ctaUrl?: string;
  ctaLabel?: string;
  ctaText?: string;
}) {
  return {
    FULL_NAME: options.fullName,
    RECEIPT_NO: options.receiptNo,
    DATE: options.date,
    ITEM: options.item,
    PAYMENT_ID: options.paymentId,
    AMOUNT: options.amount,
    SUPPORT_EMAIL: options.supportEmail,
    VENUE: options.venue,
    INVOICE_URL: options.invoiceUrl,
    CTA_URL: options.ctaUrl,
    CTA_LABEL: options.ctaLabel,
    CTA_TEXT: options.ctaText,
    CTA_BUTTON_LABEL: options.ctaLabel,
    CTA_BUTTON_TEXT: options.ctaText,
    BUTTON_LABEL: options.ctaLabel,
    BUTTON_TEXT: options.ctaText
  };
}

export function registrationConfirmedTemplateData(options: {
  firstName: string;
  delegateId: string;
  eventDates: string;
  committee: string;
  portfolio: string;
  amount: string;
  venue: string;
  invoiceUrl: string;
  ticketUrl?: string;
  supportEmail?: string;
  dashboardUrl?: string;
  qrUrl?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  ctaText?: string;
}) {
  return {
    FIRST_NAME: options.firstName,
    DELEGATE_ID: options.delegateId,
    EVENT_DATES: options.eventDates,
    COMMITTEE: options.committee,
    PORTFOLIO: options.portfolio,
    AMOUNT: options.amount,
    VENUE: options.venue,
    INVOICE_URL: options.invoiceUrl,
    TICKET_URL: options.ticketUrl,
    SUPPORT_EMAIL: options.supportEmail,
    DASHBOARD_URL: options.dashboardUrl,
    QR_URL: options.qrUrl,
    CTA_URL: options.ctaUrl,
    CTA_LABEL: options.ctaLabel,
    CTA_TEXT: options.ctaText,
    CTA_BUTTON_LABEL: options.ctaLabel,
    CTA_BUTTON_TEXT: options.ctaText,
    BUTTON_LABEL: options.ctaLabel,
    BUTTON_TEXT: options.ctaText
  };
}

export const resendTemplates = {
  receiptTemplateId: PAYMENTS_RECEIPT_TEMPLATE_ID,
  registrationConfirmedTemplateId: REGISTRATION_CONFIRMED_TEMPLATE_ID,
  supportEmail: supportEmailFromSender(env.MAIL_FROM)
};

const shell = (inner: string) => `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#FFE8C8;padding:32px">
    <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #FFE8C8;border-radius:14px;overflow:hidden">
      <div style="background:#4A2008;color:#D97706;padding:20px 28px;font-size:17px;letter-spacing:.4px;font-weight:bold">
        NEW DELHI GLOBAL YOUTH SUMMIT 4.0
      </div>
      <div style="padding:28px;color:#222;line-height:1.6;font-size:15px">${inner}</div>
      <div style="padding:16px 28px;background:#FFF3D6;color:#8B6914;font-size:12px">
        22–23 August 2026 · IIT Delhi, New Delhi
      </div>
    </div>
  </div>`;

const inr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export const templates = {
  registrationPaid: (name: string, track: string, delegateId: string, amount: number, qrDataUrl: string, accessLink?: string) =>
    shell(
      `<h2 style="margin:0 0 12px;color:#4A2008">You're confirmed, ${name}. 🎉</h2>
       <p>Your seat at the <b>New Delhi Global Youth Summit 4.0</b> is secured.</p>
       <table style="margin:14px 0;font-size:14px">
         <tr><td style="color:#8B6914;padding:2px 12px 2px 0">Delegate ID</td><td><b>${delegateId}</b></td></tr>
         <tr><td style="color:#8B6914;padding:2px 12px 2px 0">Track</td><td>${track}</td></tr>
         <tr><td style="color:#8B6914;padding:2px 12px 2px 0">Amount paid</td><td>${inr(amount)}</td></tr>
       </table>
       <p>Your tax invoice is attached as a PDF. Show this QR at check-in:</p>
       <div style="text-align:center;margin:16px 0"><img src="${qrDataUrl}" width="180" height="180" alt="Check-in QR" style="border:8px solid #fff;border-radius:8px"/></div>
       ${accessLink
        ? `<p style="margin:16px 0"><a href="${accessLink}" style="background:#D97706;color:#FFF3D6;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Open Delegate Dashboard</a></p>
          <p style="color:#8B6914;font-size:13px">This secure access link is sent automatically to your registered email and can be used directly.</p>`
        : `<p style="color:#8B6914;font-size:13px">Access your delegate dashboard anytime at ${env.NEXT_PUBLIC_BASE_URL}/dashboard</p>`}
      `
     ),
  paymentReceipt: (name: string, receiptNo: string, date: string, item: string, paymentId: string, amount: string, supportEmail: string) =>
    shell(
      `<h2 style="margin:0 0 12px;color:#4A2008">Payment receipt</h2>
       <p>Thank you, <strong>${name}</strong>. We have received your payment.</p>
       <table style="margin:14px 0;font-size:14px;width:100%">
         <tr><td style="color:#8B6914;padding:6px 12px 6px 0;width:120px">Receipt no.</td><td>${receiptNo}</td></tr>
         <tr><td style="color:#8B6914;padding:6px 12px 6px 0">Date</td><td>${date}</td></tr>
         <tr><td style="color:#8B6914;padding:6px 12px 6px 0">Item</td><td>${item}</td></tr>
         <tr><td style="color:#8B6914;padding:6px 12px 6px 0">Payment ID</td><td>${paymentId}</td></tr>
         <tr><td style="color:#8B6914;padding:6px 12px 6px 0">Total paid</td><td><strong>${amount}</strong></td></tr>
       </table>
       <p>If you have questions, write to <a href="mailto:${supportEmail}" style="color:#4A2008">${supportEmail}</a>.</p>
      `
    ),
  magicLink: (link: string, otp: string) =>
    shell(
      `<h2 style="margin:0 0 12px;color:#4A2008">Sign in to your delegate dashboard</h2>
       <p>Use the button below, or enter this one-time code:</p>
       <p style="font-size:30px;letter-spacing:8px;font-weight:bold;color:#4A2008;margin:16px 0">${otp}</p>
       <p style="margin:20px 0"><a href="${link}" style="background:#D97706;color:#FFF3D6;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Open Dashboard →</a></p>
       <p style="color:#8B6914;font-size:13px">This link and code expire in 15 minutes. If you didn't request this, ignore this email.</p>`
    ),
  waitlistConfirm: (name: string, track: string) =>
    shell(
      `<h2 style="margin:0 0 12px;color:#4A2008">You're on the waitlist, ${name}.</h2>
       <p>The <b>${track}</b> track is currently full. We'll email you the moment a seat opens up.</p>`
    ),
  announcement: (title: string, body: string) =>
    shell(`<h2 style="margin:0 0 12px;color:#4A2008">${title}</h2><p style="white-space:pre-wrap">${body}</p>`),
  adminNewRegistration: (name: string, email: string, track: string) =>
    shell(`<h3 style="margin:0 0 8px;color:#4A2008">New paid registration</h3><p><b>${name}</b> (${email})<br/>Track: ${track}</p>`),
  adminNewContact: (name: string, email: string, subject: string, message: string) =>
    shell(`<h3 style="margin:0 0 8px;color:#4A2008">New contact message</h3><p><b>${name}</b> (${email})<br/><b>Subject:</b> ${subject}</p><p style="white-space:pre-wrap">${message}</p>`),
  refundProcessed: (name: string, track: string, amount: number) =>
    shell(`<h2 style="margin:0 0 12px;color:#4A2008">Your registration has been cancelled</h2><p>Hi ${name}, your <b>${track}</b> registration was cancelled and a refund of ${inr(amount)} has been initiated.</p>`),

  competitionConfirmed: (name: string, competition: string, participation: string, refId: string, amount: number, teamName?: string | null) =>
    shell(`
      <h2 style="font-family:Georgia,serif;color:#4A2008;margin:0 0 8px">You're registered!</h2>
      <p style="color:#444">Hi ${name}, your entry for <b>${competition}</b> (${participation === "GROUP" ? `Group${teamName ? ` — ${teamName}` : ""}` : "Solo"}) is confirmed.</p>
      <p style="color:#444">Entry reference: <b style="font-family:monospace">${refId}</b></p>
      <p style="color:#444">Amount paid: <b>${inr(amount)}</b></p>
      <p style="color:#666;font-size:13px">Keep this reference handy on the day of the event.</p>
    `),

  adminNewCompetition: (name: string, email: string, competition: string, participation: string) =>
    shell(`
      <h3 style="font-family:Georgia,serif;color:#4A2008;margin:0 0 8px">New competition entry</h3>
      <p style="color:#444">${competition} — <b>${participation}</b></p>
      <p style="color:#444">${name} &lt;${email}&gt;</p>
    `),

  waitlistPromoted: (name: string, track: string, link: string) =>
    shell(`
      <h2 style="font-family:Georgia,serif;color:#4A2008;margin:0 0 8px">A seat just opened!</h2>
      <p style="color:#444">Hi ${name}, a place has opened in <b>${track}</b>. Seats are first-come — register now to claim it.</p>
      <p style="margin:18px 0"><a href="${link}" style="background:#D97706;color:#FFF3D6;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Register now</a></p>
    `),

  abandonedRegistration: (name: string, track: string, link: string) =>
    shell(`
      <h2 style="font-family:Georgia,serif;color:#4A2008;margin:0 0 8px">Almost there, ${name}</h2>
      <p style="color:#444">You started registering for <b>${track}</b> but didn't finish payment. Your spot isn't reserved until payment is complete.</p>
      <p style="margin:18px 0"><a href="${link}" style="background:#D97706;color:#FFF3D6;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Complete registration</a></p>
      <p style="color:#666;font-size:13px">If you've already paid, please ignore this email.</p>
    `),

  delegationConfirmed: (headName: string, school: string, count: number, amount: number) =>
    shell(`
      <h2 style="font-family:Georgia,serif;color:#4A2008;margin:0 0 8px">Delegation confirmed</h2>
      <p style="color:#444">Hi ${headName}, your delegation for <b>${school}</b> (${count} delegate${count === 1 ? "" : "s"}) is confirmed.</p>
      <p style="color:#444">Total paid: <b>${inr(amount)}</b></p>
      <p style="color:#666;font-size:13px">Each delegate will receive their own ticket and can sign in to their dashboard with their email.</p>
    `),

  backgroundGuideUploaded: (name: string, title: string, committee: string, link: string) =>
    shell(`
      <h2 style="font-family:Georgia,serif;color:#4A2008;margin:0 0 8px">New background guide available</h2>
      <p style="color:#444">Hi ${name}, a background guide <b>"${title}"</b> for <b>${committee}</b> has been uploaded to your delegate panel. Please log in and review it ahead of the Summit.</p>
      <p style="margin:18px 0"><a href="${link}" style="background:#D97706;color:#FFF3D6;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">View in dashboard</a></p>
    `)
};
