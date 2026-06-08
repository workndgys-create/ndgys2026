import { NextRequest, NextResponse } from "next/server";
import { listPortfolios } from "@/lib/portfolios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const track = req.nextUrl.searchParams.get("track");
    const reg = req.nextUrl.searchParams.get("reg");

    if (!track) {
      return NextResponse.json(
        { error: "track required" },
        { status: 422 }
      );
    }

    const portfolios = await listPortfolios(track, reg);

    return NextResponse.json({
      ok: true,
      count: portfolios.length,
      portfolios,
    });
  } catch (error) {
    console.error("PORTFOLIOS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
