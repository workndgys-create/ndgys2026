import { NextRequest, NextResponse } from "next/server";
import { getPublicCompetitions } from "@/lib/publicData";

export async function GET(req: NextRequest) {
  try {
    const comps = await getPublicCompetitions();
    // map to lightweight shape for client
    const payload = comps.map((c: any) => ({ id: c.id, title: c.title, slug: c.slug }));
    return NextResponse.json(payload);
  } catch (err) {
    console.error("/api/public/competitions - error", err);
    return NextResponse.json([]);
  }
}
