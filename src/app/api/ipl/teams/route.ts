import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug") ?? "ipl-auction";
    const comp = await prisma.competition.findUnique({ where: { slug } });
    if (!comp) {
      return NextResponse.json({ teams: [] });
    }
    const key = `competition:teams:${comp.id}`;
    const s = await prisma.setting.findUnique({ where: { key } });
    if (!s || !s.value) {
      return NextResponse.json({ teams: [] });
    }
    try {
      const parsed = JSON.parse(s.value);
      return NextResponse.json({ teams: Array.isArray(parsed) ? parsed : [] });
    } catch (e) {
      return NextResponse.json({ teams: [] });
    }
  } catch (error) {
    return NextResponse.json({ teams: [] });
  }
}
