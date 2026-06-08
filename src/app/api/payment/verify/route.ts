import { NextRequest, NextResponse } from "next/server";
import { getCashfreeOrderStatus } from "@/lib/cashfree";
import { fulfilByOrderId } from "@/lib/fulfilment";
import { z } from "zod";

export const runtime = "nodejs";

// The Cashfree web SDK doesn't hand the client a signed token, so we confirm
// the order server-side by its status before fulfilling. (The webhook is the
// independent, authoritative path; this lets the browser confirm immediately.)
const schema = z.object({ orderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const status = await getCashfreeOrderStatus(parsed.data.orderId);
  if (!status.paid) return NextResponse.json({ status: "PENDING" }, { status: 202 });

  const result = await fulfilByOrderId(parsed.data.orderId, status.paymentId || parsed.data.orderId);
  if (!result.ok) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ status: "PAID", kind: result.kind });
}
