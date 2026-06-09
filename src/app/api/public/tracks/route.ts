import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const FALLBACK_TRACKS = [
  { value: "unsc", label: "United Nations Security Council" },
  { value: "unga", label: "United Nations General Assembly" },
  { value: "unhrc", label: "United Nations Human Rights Council" },
  { value: "csw", label: "United Nations Commission on the Status of Women" },
  { value: "unicef", label: "United Nations International Children’s Emergency Fund (UNICEF)" },
  { value: "unep", label: "United Nations Environment Programme" },
  { value: "wto", label: "World Trade Organization" },
  { value: "aippm", label: "All India Political Parties Meet" },
  { value: "lok-sabha", label: "Lok Sabha" },
  { value: "war-cabinet", label: "Indian War Cabinet" },
  { value: "ipl", label: "Indian Premier League" }
];

export async function GET(req: NextRequest) {
  try {
    const tracks = await prisma.track.findMany({ where: { archived: false }, select: { slug: true, name: true } });
    return NextResponse.json(tracks.map((t) => ({ value: t.slug, label: t.name })));
  } catch (e) {
    // If the DB isn't available during build/export, return a sensible fallback so export can continue.
    console.error("/api/public/tracks - prisma error:", e);
    return NextResponse.json(FALLBACK_TRACKS);
  }
}
