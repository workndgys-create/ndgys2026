import { NextRequest, NextResponse } from "next/server";
import { releaseHoldByRegistration } from "@/lib/portfolios";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.registrationId) return NextResponse.json({ error: "registrationId required" }, { status: 422 });
  const released = await releaseHoldByRegistration(body.registrationId);
  return NextResponse.json({ ok: true, released });
}
