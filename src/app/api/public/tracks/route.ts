import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const FALLBACK_TRACKS = [
  { value: "unsc", label: "United Nations Security Council", fee: 2500 },
  { value: "unga", label: "United Nations General Assembly", fee: 2000 },
  { value: "unhrc", label: "United Nations Human Rights Council", fee: 2000 },
  { value: "csw", label: "United Nations Commission on the Status of Women", fee: 2000 },
  { value: "unicef", label: "United Nations International Children's Emergency Fund", fee: 2000 },
  { value: "unep", label: "United Nations Environment Programme", fee: 2000 },
  { value: "wto", label: "World Trade Organization", fee: 2500 },
  { value: "aippm", label: "All India Political Parties Meet", fee: 1500 },
  { value: "lok-sabha", label: "Lok Sabha", fee: 1500 },
  { value: "war-cabinet", label: "Indian War Cabinet", fee: 1500 },
  { value: "ipl", label: "Indian Premier League", fee: 1500 }
];

export async function GET(req: NextRequest) {
  try {
    const tracks = await prisma.track.findMany({ where: { archived: false }, select: { slug: true, name: true, fee: true } });
    return NextResponse.json(tracks.map((t) => ({ value: t.slug, label: t.name, fee: t.fee })));
  } catch (e) {
    // If the DB isn't available during build/export, return a sensible fallback so export can continue.
    console.error("/api/public/tracks - prisma error:", e);
    return NextResponse.json(FALLBACK_TRACKS);
  }
}
