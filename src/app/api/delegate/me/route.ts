import { NextResponse } from "next/server";
import { currentDelegate, allDelegateRegistrations } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gatewayOrderId, gatewayPaymentId, ...safe } = reg;
  const regs = await allDelegateRegistrations();
  return NextResponse.json({ registration: safe, registrations: regs });
}
