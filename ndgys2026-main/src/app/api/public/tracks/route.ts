import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const FALLBACK_TRACKS = [
  { value: "unsc", label: "United Nations Security Council", fee: 2500, difficulty: "Advanced" },
  { value: "unga", label: "United Nations General Assembly", fee: 2000, difficulty: "Intermediate" },
  { value: "unhrc", label: "United Nations Human Rights Council", fee: 2000, difficulty: "Intermediate" },
  { value: "csw", label: "United Nations Commission on the Status of Women", fee: 2000, difficulty: "Intermediate" },
  { value: "unicef", label: "United Nations International Children's Emergency Fund", fee: 2000, difficulty: "Intermediate" },
  { value: "unep", label: "United Nations Environment Programme", fee: 2000, difficulty: "Intermediate" },
  { value: "wto", label: "World Trade Organization", fee: 2500, difficulty: "Intermediate" },
  { value: "aippm", label: "All India Political Parties Meet", fee: 1500, difficulty: "Beginner" },
  { value: "lok-sabha", label: "Lok Sabha", fee: 1500, difficulty: "Beginner" },
  { value: "war-cabinet", label: "Indian War Cabinet", fee: 1500, difficulty: "Advanced" }
];

export async function GET(req: NextRequest) {
  try {
    const tracks = await prisma.track.findMany({ where: { archived: false }, select: { slug: true, name: true, fee: true, difficulty: true } });
    // derive capacity from actual portfolios
    const counts = await prisma.portfolio.groupBy({ by: ["trackSlug"], _count: true });
    const capMap = new Map((counts as unknown as { trackSlug: string; _count: number }[]).map((c) => [c.trackSlug, c._count]));
    return NextResponse.json(tracks.map((t) => ({ value: t.slug, label: t.name, fee: t.fee, difficulty: t.difficulty, capacity: capMap.get(t.slug) ?? 0 })));
  } catch (e) {
    // If the DB isn't available during build/export, return a sensible fallback so export can continue.
    console.error("/api/public/tracks - prisma error:", e);
    return NextResponse.json(FALLBACK_TRACKS);
  }
}
