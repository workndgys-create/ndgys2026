export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { releaseExpiredHolds } from "@/lib/portfolios";
export const runtime = "nodejs";
export async function GET() {
  const released = await releaseExpiredHolds();
  return NextResponse.json({ ok: true, released });
}
