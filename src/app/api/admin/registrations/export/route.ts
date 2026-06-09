import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";

export const runtime = "nodejs";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function flattenAnswers(json: string | null): string {
  if (!json) return "";
  try {
    const arr = JSON.parse(json) as { label: string; value: string | string[] }[];
    return arr.map((a) => `${a.label}: ${Array.isArray(a.value) ? a.value.join("; ") : a.value}`).join(" | ");
  } catch { return ""; }
}

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const regs = (await prisma.registration.findMany({ orderBy: { createdAt: "desc" } })) as any[];
  const header = [
    "Delegate ID", "Name", "Email", "Phone", "Age", "Gender", "City", "Emergency Contact", "Institution",
    "Track", "Portfolio", "Amount (INR)", "Status", "Source", "Promo",
    "Consent", "Guardian Name", "Guardian Phone", "Guardian Consent", "How Heard", "Notes", "Custom Answers", "Created"
  ];
  const rows = regs.map((r) => [
    r.delegateId ?? "", r.fullName, r.email, r.phone, r.age ?? "", r.gender ?? "", r.city ?? "", r.emergencyContact ?? "", r.institution ?? "",
    r.trackName, r.portfolio ?? "", r.amount.toString(), r.status, r.source, r.promoCode ?? "",
    r.consentAccepted ? "Yes" : "No", r.guardianName ?? "", r.guardianPhone ?? "", r.guardianConsent ? "Yes" : "No",
    r.howHeard ?? "", r.notes ?? "", flattenAnswers(r.customAnswers), new Date(r.createdAt).toISOString()
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="registrations.csv"` }
  });
}
