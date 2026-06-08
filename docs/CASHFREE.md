# Connecting Cashfree Payments

Cashfree is the **only** payment gateway in this app and is already wired into all three payment surfaces (delegate registration, competition entries, school delegations), the verify endpoint, and the webhook. This guide covers what you need to operate it: getting keys, configuring the environment, the webhook, sandbox testing, and going live. The adapter lives at `src/lib/cashfree.ts`.

> Money is stored in **rupees** everywhere in this app. Cashfree also works in **rupees**, so the adapter forwards the amount directly.

> **Already wired:** order creation (`src/app/api/{register,competitions/register,delegation/register}/route.ts`), the webhook (`src/app/api/payment/cashfree-webhook/route.ts`), the server confirm (`src/app/api/payment/verify/route.ts`), and the client checkout (the three forms) all use Cashfree. The sections below on "switching" are kept as a reference for how the pieces fit together — you don't need to make those edits, they're done.

---

## 1. Get your Cashfree credentials

1. Create an account at https://www.cashfree.com and open the **Cashfree Merchant Dashboard**.
2. Go to **Developers → API Keys**. You'll see two environments:
   - **Test/Sandbox** — for development.
   - **Production** — for live payments (requires KYC/business verification to be approved first).
3. Copy the **App ID** (client id) and **Secret Key** for the environment you're setting up.
4. Under **Developers → Webhooks**, you'll later add your webhook URL (Section 5).

---

## 2. Configure environment variables

These are already stubbed in `.env.example`:

```bash
CASHFREE_APP_ID="your_app_id"
CASHFREE_SECRET_KEY="your_secret_key"
CASHFREE_MODE="sandbox"                 # sandbox | production
NEXT_PUBLIC_CASHFREE_MODE="sandbox"     # MUST match CASHFREE_MODE — used by the browser SDK
```

`CASHFREE_MODE` selects the API base URL inside the adapter:
- `sandbox` → `https://sandbox.cashfree.com/pg`
- `production` → `https://api.cashfree.com/pg`

The `NEXT_PUBLIC_` copy is exposed to the browser so the client SDK initialises in the matching mode.

---

## 3. What the adapter gives you

`src/lib/cashfree.ts` exposes four functions (API version `2023-08-01`):

- `createCashfreeOrder({ orderId, amountRupees, customer, returnUrl, notifyUrl, note })` → `{ cfOrderId, orderId, paymentSessionId }`. The **`paymentSessionId`** is what the browser SDK needs.
- `verifyCashfreeWebhook(rawBody, timestamp, signature)` → `boolean`. Validates the `x-webhook-signature` / `x-webhook-timestamp` headers (`base64(HMAC_SHA256(timestamp + rawBody, secret))`).
- `isCashfreeOrderPaid(orderId)` → `boolean`. Server-side source of truth — calls `GET /pg/orders/{order_id}` and checks `order_status === "PAID"`.
- `cashfreeMode()` → `"sandbox" | "production"`.

Razorpay's equivalent lives in `src/lib/razorpay.ts`; the two are deliberately parallel so the swap is mechanical.

---

## 4. Switch the server: order creation

There are **three** places that create a Razorpay order. Each currently does:

```ts
const order = await getRazorpay().orders.create({ amount, currency: "INR", receipt: id, notes: {...} });
await prisma.<model>.update({ where: { id }, data: { razorpayOrderId: order.id } });
return NextResponse.json({ orderId: order.id, amount, keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID, prefill: {...}, ... });
```

Replace each with the Cashfree equivalent. The files are:

1. `src/app/api/register/route.ts` (delegate registration)
2. `src/app/api/competitions/register/route.ts` (competition entries)
3. `src/app/api/delegation/register/route.ts` (school delegations)

Example for the delegate registration route — swap the `try { ... }` order block for:

```ts
import { createCashfreeOrder } from "@/lib/cashfree";
import { env } from "@/lib/env";

// ...after the hold/validation, replacing the Razorpay order creation:
try {
  const base = env.NEXT_PUBLIC_BASE_URL;
  const order = await createCashfreeOrder({
    orderId: reg.id,                       // reuse your internal id as the Cashfree order_id
    amountRupees: amount,
    customer: { id: reg.id, name: data.fullName, email: data.email, phone: data.phone },
    returnUrl: `${base}/dashboard?order={order_id}`,
    notifyUrl: `${base}/api/payment/cashfree-webhook`,
    note: `Delegate ${track.name} · ${portfolio.name}`
  });
  // store the Cashfree order id where you stored razorpayOrderId
  await prisma.registration.update({ where: { id: reg.id }, data: { razorpayOrderId: order.orderId } });
  return NextResponse.json({
    registrationId: reg.id,
    paymentSessionId: order.paymentSessionId,   // <-- the client needs THIS instead of orderId/keyId
    mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox",
    amount, portfolio: portfolio.name, heldUntil: hold.heldUntil, holdMinutes: await getHoldMinutes()
  });
} catch (err) { /* keep the existing rollback (free hold + delete pending row) */ }
```

> You can keep the `razorpayOrderId` column name (it just stores "the gateway order id"), or run a migration to rename it to `gatewayOrderId`. The fulfilment dispatcher (`src/lib/fulfilment.ts → fulfilByOrderId`) looks orders up by that column, so as long as you store the Cashfree `order_id` there, fulfilment keeps working unchanged.

Apply the same swap in the competition and delegation routes (using their respective ids and amounts).

---

## 5. Switch the server: the webhook

Cashfree notifies you server-to-server. Add a new route `src/app/api/payment/cashfree-webhook/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeWebhook, isCashfreeOrderPaid } from "@/lib/cashfree";
import { fulfilByOrderId } from "@/lib/fulfilment";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature") || "";
  const timestamp = req.headers.get("x-webhook-timestamp") || "";
  if (!verifyCashfreeWebhook(raw, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: any; try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  // Cashfree sends PAYMENT_SUCCESS_WEBHOOK with data.order.order_id + data.payment.cf_payment_id
  const orderId = event?.data?.order?.order_id;
  const paymentId = String(event?.data?.payment?.cf_payment_id ?? "");
  if (orderId && (await isCashfreeOrderPaid(orderId))) {
    await fulfilByOrderId(orderId, paymentId);   // same idempotent fulfilment used today
  }
  return NextResponse.json({ received: true });
}
```

Then in the Cashfree dashboard (**Developers → Webhooks**) add:
- URL: `https://YOUR_DOMAIN/api/payment/cashfree-webhook`
- Events: **Payment Success** (and optionally Payment Failed/User Dropped).

Because `fulfilByOrderId` is already idempotent (it no-ops if the row is already `PAID`), webhook retries are safe.

Optionally also wire `src/app/api/payment/verify/route.ts` to call `isCashfreeOrderPaid(order_id)` + `fulfilByOrderId(...)` so the browser return path can confirm immediately rather than waiting for the webhook.

---

## 6. Switch the client checkout

Razorpay uses an inline `new Razorpay({...}).open()` handler. Cashfree uses a hosted/modal SDK driven by the `paymentSessionId`. In each form
(`src/app/register/page.tsx`, `src/components/CompetitionRegisterForm.tsx`, `src/app/delegation/register/page.tsx`)
replace the `loadRazorpay()` + `new window.Razorpay(...)` block with:

```ts
function loadCashfree(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Cashfree) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// after POSTing to /api/register and getting { paymentSessionId, mode }:
if (!(await loadCashfree())) { /* show gateway error */ return; }
const cashfree = (window as any).Cashfree({ mode: order.mode || "sandbox" });
const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });
if (result?.error) { /* user closed / failed → release hold as today */ }
// On success Cashfree fires the webhook; confirm via your verify endpoint or poll order status:
const v = await fetch("/api/payment/verify", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ orderId: order.registrationId ? undefined : undefined, cashfree_order_id: <yourOrderId> })
});
```

For the **portfolio hold timer** in `src/app/register/page.tsx`, keep everything as-is — the `heldUntil` countdown and the `releaseHold()` on modal dismiss work identically; just trigger `releaseHold()` from Cashfree's `result.error`/close instead of Razorpay's `ondismiss`.

> Tip: keep both gateways behind a small `PAYMENT_PROVIDER` env (`razorpay` | `cashfree`) and branch in each route + form. That lets you A/B or fall back without re-deploying code.

---

## 7. Test in sandbox

1. Set `CASHFREE_MODE=sandbox` and the sandbox keys.
2. Use Cashfree's sandbox test instruments (test UPI `testsuccess@gocash`, or the test cards in their docs).
3. Run a registration end-to-end and confirm:
   - the order is created (you get a `paymentSessionId`),
   - the modal opens and completes,
   - the webhook hits `/api/payment/cashfree-webhook` and the registration flips to **PAID** (delegate id + QR ticket email + portfolio auto-assigned),
   - `isCashfreeOrderPaid` returns `true` for that order.
4. Test the failure path (close the modal) and confirm the portfolio **hold is released** and the seat reopens.

To receive webhooks on `localhost`, expose your dev server with a tunnel (e.g. `cloudflared tunnel` or `ngrok http 3000`) and point the dashboard webhook at the tunnel URL.

---

## 8. Go live

- Complete Cashfree KYC and get **production** approved.
- Switch `CASHFREE_MODE=production` and `NEXT_PUBLIC_CASHFREE_MODE=production`, and use the **production** App ID + Secret.
- Update the dashboard **production** webhook URL to your live domain.
- Confirm `NEXT_PUBLIC_BASE_URL` points to the production domain (used for `return_url` / `notify_url`).
- Do one small real transaction end-to-end before announcing.

---

## 9. Security checklist

- Never expose `CASHFREE_SECRET_KEY` to the browser — only `NEXT_PUBLIC_CASHFREE_MODE` is public.
- Always **verify the webhook signature** (the adapter does) and **re-check order status server-side** with `isCashfreeOrderPaid` before fulfilling — never trust the client's success callback alone.
- Keep fulfilment idempotent (it already is) so retries don't double-issue tickets or double-assign portfolios.
- Log webhook failures; Cashfree retries failed deliveries.

---

### Summary of files to add/change

| File | Change |
| --- | --- |
| `.env.example` / `.env` | Cashfree keys + mode (done in example) |
| `src/lib/cashfree.ts` | Adapter (already included) |
| `src/app/api/register/route.ts` | Create Cashfree order, return `paymentSessionId` |
| `src/app/api/competitions/register/route.ts` | Same |
| `src/app/api/delegation/register/route.ts` | Same |
| `src/app/api/payment/cashfree-webhook/route.ts` | **New** webhook (verify + fulfil) |
| `src/app/api/payment/verify/route.ts` | Optional: confirm via `isCashfreeOrderPaid` |
| `src/app/register/page.tsx` | Cashfree JS SDK checkout (keep hold timer) |
| `src/components/CompetitionRegisterForm.tsx` | Cashfree JS SDK checkout |
| `src/app/delegation/register/page.tsx` | Cashfree JS SDK checkout |

Once these are in, Cashfree becomes the active gateway with the same fulfilment, ticketing, invoicing, portfolio auto-assignment, and email flows already built.
