import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

export async function GET() {
  try {
    type Q = { id: string; label: string; type: string; options: string | null; helpText: string | null; required: boolean; order: number };
    const rows = (await prisma.registrationQuestion.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] })) as unknown as Q[];
    const questions = rows.map((q) => ({
      id: q.id, label: q.label, type: q.type, required: q.required, helpText: q.helpText,
      options: q.options ? safeParse(q.options) : []
    }));
    return NextResponse.json({ questions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
function safeParse(s: string): string[] { try { const v = JSON.parse(s); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } }
