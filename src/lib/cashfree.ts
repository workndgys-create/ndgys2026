import crypto from "crypto";

/**
 * Cashfree Payment Gateway adapter (API version 2023-08-01).
 *
 * Cashfree is the only payment gateway for this app. See docs/CASHFREE.md for setup
 * (keys, env, webhook configuration, sandbox testing and go-live).
 *
 * IMPORTANT: Cashfree amounts are in RUPEES. This app now stores money in RUPEES
 * as well, so amounts can be forwarded directly to Cashfree.
 */

function creds() {
  const id = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  const mode = (process.env.CASHFREE_MODE || "sandbox").toLowerCase();
  if (!id || !secret) throw new Error("Cashfree credentials are not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY).");
  const base = mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  return { id, secret, base, mode };
}

const API_VERSION = "2023-08-01";

export interface CashfreeOrderInput {
  orderId: string;        // your internal id (registration / competition / delegation id)
  amountRupees: number;
  customer: { id: string; name?: string; email?: string; phone: string };
  returnUrl?: string;     // where Cashfree redirects after payment
  notifyUrl?: string;     // your webhook URL
  note?: string;
}

export interface CashfreeOrderResult {
  cfOrderId: string;
  orderId: string;
  paymentSessionId: string; // pass this to the Cashfree JS SDK on the client
}

/** Creates a Cashfree order and returns the payment_session_id used by the web SDK. */
export async function createCashfreeOrder(input: CashfreeOrderInput): Promise<CashfreeOrderResult> {
  const { id, secret, base } = creds();
  const res = await fetch(`${base}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client-id": id, "x-client-secret": secret, "x-api-version": API_VERSION },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amountRupees.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.id,
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone
      },
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
      order_note: input.note
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.payment_session_id) {
    throw new Error(`Cashfree order creation failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return { cfOrderId: String(data.cf_order_id), orderId: String(data.order_id), paymentSessionId: data.payment_session_id };
}

/**
 * Verifies a Cashfree webhook. Cashfree signs with:
 *   signature = base64( HMAC_SHA256( timestamp + rawBody, clientSecret ) )
 * Headers: x-webhook-signature, x-webhook-timestamp.
 */
export function verifyCashfreeWebhook(rawBody: string, timestamp: string, signature: string): boolean {
  try {
    const { secret } = creds();
    const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature || "");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Server-side source of truth: returns true only when Cashfree reports the order PAID. */
export async function isCashfreeOrderPaid(orderId: string): Promise<boolean> {
  return (await getCashfreeOrderStatus(orderId)).paid;
}

/** Returns whether the order is PAID and (best-effort) the Cashfree payment id. */
export async function getCashfreeOrderStatus(orderId: string): Promise<{ paid: boolean; paymentId?: string }> {
  const { id, secret, base } = creds();
  const headers = { "x-client-id": id, "x-client-secret": secret, "x-api-version": API_VERSION };
  const res = await fetch(`${base}/orders/${encodeURIComponent(orderId)}`, { headers });
  if (!res.ok) return { paid: false };
  const data = await res.json().catch(() => ({}));
  const paid = data?.order_status === "PAID";
  if (!paid) return { paid: false };
  // best-effort: fetch the successful payment id
  try {
    const pr = await fetch(`${base}/orders/${encodeURIComponent(orderId)}/payments`, { headers });
    if (pr.ok) {
      const payments = await pr.json().catch(() => []);
      const ok = Array.isArray(payments) ? payments.find((p: any) => p.payment_status === "SUCCESS") : null;
      if (ok?.cf_payment_id) return { paid: true, paymentId: String(ok.cf_payment_id) };
    }
  } catch { /* ignore */ }
  return { paid: true, paymentId: orderId };
}

export function cashfreeMode(): "sandbox" | "production" {
  return (process.env.CASHFREE_MODE || "sandbox").toLowerCase() === "production" ? "production" : "sandbox";
}
