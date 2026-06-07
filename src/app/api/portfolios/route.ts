import { NextRequest, NextResponse } from "next/server";
import { listPortfolios } from "@/lib/portfolios";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get("track");
  const reg = req.nextUrl.searchParams.get("reg");
  if (!track) return NextResponse.json({ error: "track required" }, { status: 422 });
  const portfolios = await listPortfolios(track, reg);
  return NextResponse.json({ portfolios }, { headers: { "Cache-Control": "no-store" } });
}
