import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.committeeGuide.findMany({
    orderBy: { uploadedAt: "desc" },
    select: { id: true, trackSlug: true, title: true, fileName: true, sizeBytes: true, uploadedAt: true }
  });
  return NextResponse.json({ items });
}

const MAX_BYTES = 15 * 1024 * 1024; // 15MB cap for rules & regulations

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 422 });
  const trackSlug = String(form.get("trackSlug") || "");
  const title = String(form.get("title") || "");
  const file = form.get("file");
  if (!trackSlug || !title || !(file instanceof File)) return NextResponse.json({ error: "Committee, title and a PDF file are required" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const item = await prisma.committeeGuide.create({
    data: { trackSlug, title, fileName: file.name || "guide.pdf", mime: file.type || "application/pdf", sizeBytes: buf.length, data: buf, uploadedBy: s.email }
  });
  await audit(s.email, "guide.upload", "CommitteeGuide", item.id, `${trackSlug}:${title}`);
  return NextResponse.json({ ok: true, id: item.id });
}
