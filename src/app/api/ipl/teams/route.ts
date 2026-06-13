import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIplTeamsFromDb } from "@/lib/iplTeams";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug") ?? "ipl-auction";
    // Try competition-specific teams first
    const comp = await prisma.competition.findUnique({ where: { slug } });
    if (comp) {
      const key = `competition:teams:${comp.id}`;
      const s = await prisma.setting.findUnique({ where: { key } });
      if (s && s.value) {
        try {
          const parsed = JSON.parse(s.value);
          if (Array.isArray(parsed)) return NextResponse.json({ teams: parsed.map(String) });
        } catch {
          // ignore and fall back
        }
      }
    }

    // Fallback to global IPL teams
    const global = await getIplTeamsFromDb();
    return NextResponse.json({ teams: global });
  } catch (err) {
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}
