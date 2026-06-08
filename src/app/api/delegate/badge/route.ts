import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
import { generateBadgePdf } from "@/lib/badge";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!reg.delegateId) return NextResponse.json({ error: "Badge available after payment" }, { status: 409 });
  const pdf = await generateBadgePdf({ delegateId: reg.delegateId, fullName: reg.fullName, trackName: reg.trackName, trackSlug: reg.trackSlug, portfolio: reg.portfolio });
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="badge-${reg.delegateId}.pdf"` } });
}
