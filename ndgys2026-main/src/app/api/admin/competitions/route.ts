import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `item-${Date.now()}`;

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.competition.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.title || !b?.summary) return NextResponse.json({ error: "Title and summary are required" }, { status: 422 });
  const item = await prisma.competition.create({
    data: {
      slug: b.slug ? slugify(b.slug) : slugify(b.title),
      title: b.title, category: b.category || "General", summary: b.summary, description: b.description || "",
      prize: b.prize || null, ctaUrl: b.ctaUrl || null, imageUrl: b.imageUrl || null,
      date: b.date ? new Date(b.date) : null, published: !!b.published, order: Number(b.order) || 0,
      format: ["SOLO", "GROUP", "BOTH"].includes(b.format) ? b.format : "SOLO",
      minTeam: b.minTeam ? Number(b.minTeam) : null, maxTeam: b.maxTeam ? Number(b.maxTeam) : null,
      feeSolo: b.feeSolo ? Number(b.feeSolo) : null, feeGroup: b.feeGroup ? Number(b.feeGroup) : null,
      registrationOpen: b.registrationOpen === undefined ? true : (b.registrationOpen === true || b.registrationOpen === "true"),
      questionsText: b.questionsText || null
    }
  });
  await audit(s.email, "competition.create", "Competition", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
