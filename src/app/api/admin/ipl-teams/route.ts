import { NextRequest, NextResponse } from "next/server";
import { getIplTeamsFromDb, setIplTeamsInDb } from "@/lib/iplTeams";

export async function GET() {
  try {
    const teams = await getIplTeamsFromDb();
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.teams)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    await setIplTeamsInDb(body.teams.map(String));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
