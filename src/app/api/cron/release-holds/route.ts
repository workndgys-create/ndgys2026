import { NextResponse } from "next/server";
import { releaseExpiredHolds } from "@/lib/portfolios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const released = await releaseExpiredHolds();

    return NextResponse.json({
      ok: true,
      released,
    });
  } catch (error) {
    console.error("release-holds failed", error);

    return NextResponse.json({
      ok: false,
      released: 0,
    });
  }
}
