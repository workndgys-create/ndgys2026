import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCashfreeOrder, cashfreeMode } from "@/lib/cashfree";
import { env } from "@/lib/env";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ registrationId: z.string().min(1) });

// Re-create a Cashfree order for an existing PENDING registration (e.g. retry).
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const reg = await prisma.registration.findUnique({ where: { id: parsed.data.registrationId } });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reg.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 });

  const order = await createCashfreeOrder({
    orderId: reg.id, amountPaise: reg.amount,
    customer: { id: reg.id, name: reg.fullName, email: reg.email, phone: reg.phone },
    returnUrl: `${env.NEXT_PUBLIC_BASE_URL}/dashboard?order={order_id}`,
    notifyUrl: `${env.NEXT_PUBLIC_BASE_URL}/api/payment/cashfree-webhook`
  });
  await prisma.registration.update({ where: { id: reg.id }, data: { gatewayOrderId: order.orderId } });
  return NextResponse.json({ orderId: order.orderId, paymentSessionId: order.paymentSessionId, mode: cashfreeMode(), amount: reg.amount, currency: "INR" });
}
