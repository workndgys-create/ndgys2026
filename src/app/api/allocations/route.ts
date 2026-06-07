import { NextResponse } from "next/server";
import { getPublicAllocations } from "@/lib/publicData";
export const runtime = "nodejs";
export async function GET() {
  const data = await getPublicAllocations();
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
