import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gatewayOrderId, gatewayPaymentId, ...safe } = reg;
  return NextResponse.json({ registration: safe });
}
