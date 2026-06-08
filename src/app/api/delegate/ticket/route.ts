import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
import { qrDataUrl } from "@/lib/qr";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!reg.delegateId) return NextResponse.json({ error: "Ticket available after payment" }, { status: 409 });
  return NextResponse.json({
    delegateId: reg.delegateId,
    fullName: reg.fullName,
    trackName: reg.trackName,
    qr: await qrDataUrl(reg.delegateId)
  });
}
