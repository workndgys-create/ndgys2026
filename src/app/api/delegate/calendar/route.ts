import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
import { summitIcs } from "@/lib/eventIcs";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cal = await summitIcs(reg.delegateId || reg.id);
  return new NextResponse(cal.ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${cal.filename}"` } });
}
