import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
import { sendMail, templates } from "@/lib/email";
import { env } from "@/lib/env";
export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.backgroundGuide.findMany({
    orderBy: { uploadedAt: "desc" },
    select: { id: true, title: true, trackSlug: true, fileName: true, sizeBytes: true, notifiedCount: true, notifiedAt: true, uploadedAt: true }
  });
  return NextResponse.json({ items });
}

/** Upload a background guide and (by default) notify the targeted MUN delegates by email. */
export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 422 });
  const title = String(form.get("title") || "");
  const trackSlug = String(form.get("trackSlug") || ""); // "" = all MUN delegates
  const notify = String(form.get("notify") || "true") !== "false";
  const file = form.get("file");
  if (!title || !(file instanceof File)) return NextResponse.json({ error: "A title and a PDF file are required" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());

  // Target = PAID delegates (optionally limited to one committee)
  let notifiedCount = 0;
  if (notify) {
    type R = { fullName: string; email: string; trackName: string };
    const where: any = { status: "PAID", ...(trackSlug ? { trackSlug } : {}) };
    const delegates = (await prisma.registration.findMany({ where, select: { fullName: true, email: true, trackName: true } })) as unknown as R[];
    const link = `${env.NEXT_PUBLIC_BASE_URL}/dashboard/guides`;
    const results = await Promise.allSettled(
      delegates.map((d) => sendMail({ to: d.email, subject: `New background guide: ${title}`, html: templates.backgroundGuideUploaded(d.fullName, title, trackSlug ? d.trackName : "your committee", link) }))
    );
    notifiedCount = results.filter((r) => r.status === "fulfilled").length;
  }

  const item = await prisma.backgroundGuide.create({
    data: {
      title, trackSlug: trackSlug || null, fileName: file.name || "guide.pdf", mime: file.type || "application/pdf",
      sizeBytes: buf.length, data: buf, uploadedBy: s.email,
      notifiedCount, notifiedAt: notify ? new Date() : null
    }
  });
  await audit(s.email, "bgguide.upload", "BackgroundGuide", item.id, `${trackSlug || "ALL"}:${title}:notified=${notifiedCount}`);
  return NextResponse.json({ ok: true, id: item.id, notified: notifiedCount });
}
