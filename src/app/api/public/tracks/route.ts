import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "edge";

export async function GET(req: NextRequest) {
  const tracks = await prisma.track.findMany({ where: { archived: false }, select: { slug: true, name: true } });
  return NextResponse.json(tracks.map((t) => ({ value: t.slug, label: t.name })));
}
