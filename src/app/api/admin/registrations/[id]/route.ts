import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
import { assignPortfolioByName, releaseHoldByRegistration } from "@/lib/portfolios";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requirePermission("registrations.manage");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.status === "string") {
    if (!["PENDING", "PAID", "CANCELLED"].includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 422 });
    data.status = body.status;
  }
  if ("portfolio" in (body || {})) {
    const p = body.portfolio;
    data.portfolio = typeof p === "string" && p.trim() ? p.trim().slice(0, 120) : null;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 422 });

  const updated = await prisma.registration.update({ where: { id: params.id }, data });

  // Keep the Portfolio table in sync when an admin overrides the allocation by name.
  if ("portfolio" in (body || {})) {
    if (typeof data.portfolio === "string" && data.portfolio) {
      const portfolioId = await assignPortfolioByName(updated.id, updated.trackSlug, data.portfolio as string);
      if (portfolioId) await prisma.registration.update({ where: { id: updated.id }, data: { portfolioId } });
    } else {
      // cleared: release any hold/assignment this registration had
      await releaseHoldByRegistration(updated.id);
      await prisma.portfolio.updateMany({ where: { assignedTo: updated.id }, data: { status: "AVAILABLE", assignedTo: null } });
      await prisma.registration.update({ where: { id: updated.id }, data: { portfolioId: null } });
    }
  }

  await audit(admin.email, "portfolio" in (body || {}) ? "registration.portfolio" : "registration.status", "Registration", params.id, JSON.stringify(data));
  return NextResponse.json({ ok: true, registration: { id: updated.id, status: updated.status, portfolio: updated.portfolio } });
}
