import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeWebhook, isCashfreeOrderPaid } from "@/lib/cashfree";
import { fulfilByOrderId } from "@/lib/fulfilment";

export const runtime = "nodejs";

// Cashfree server-to-server notification. Verify the signature, re-check the
// order status, then run the same idempotent fulfilment used everywhere else.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature") || "";
  const timestamp = req.headers.get("x-webhook-timestamp") || "";
  if (!verifyCashfreeWebhook(raw, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const orderId = event?.data?.order?.order_id as string | undefined;
  const paymentId = String(event?.data?.payment?.cf_payment_id ?? orderId ?? "");
  if (orderId && (await isCashfreeOrderPaid(orderId))) {
    await fulfilByOrderId(orderId, paymentId);
  }
  return NextResponse.json({ received: true });
}
