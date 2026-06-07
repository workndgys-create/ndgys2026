import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";
export const runtime = "nodejs";
export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const delegations = await prisma.delegation.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ delegations });
}
