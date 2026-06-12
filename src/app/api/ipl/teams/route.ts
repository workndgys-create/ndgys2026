import { NextRequest, NextResponse } from "next/server";
import { getIplTeamsFromDb } from "@/lib/iplTeams";

export async function GET() {
  try {
    const teams = await getIplTeamsFromDb();
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}
