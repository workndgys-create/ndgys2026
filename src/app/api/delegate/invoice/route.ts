import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate, getDelegateById } from "@/lib/delegateSession";
import { generateInvoicePdf } from "@/lib/invoice";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regId = searchParams.get("regId");
  const reg = regId ? await getDelegateById(regId) : await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isComp = !!(reg as any).isCompetition;
  let number = "";
  let issuedAt = new Date();
  let amount = 0;
  let gstAmount = 0;
  let itemTitle = undefined;

  if (isComp) {
    if (!reg.delegateId) return NextResponse.json({ error: "No invoice yet" }, { status: 409 });
    const suffix = reg.delegateId.split("-").pop() || "COMP";
    number = `NDGYS/2026/C-${suffix}`;
    issuedAt = reg.createdAt;
    amount = reg.amount;
    itemTitle = `Competition Registration — ${reg.trackName}`;
  } else {
    const invoice = await prisma.invoice.findUnique({ where: { registrationId: reg.id } });
    if (!invoice || !reg.delegateId) return NextResponse.json({ error: "No invoice yet" }, { status: 409 });
    number = invoice.number;
    issuedAt = invoice.issuedAt;
    amount = invoice.amount;
    gstAmount = invoice.gstAmount;
  }

  const pdf = await generateInvoicePdf({
    number,
    issuedAt,
    delegateId: reg.delegateId,
    fullName: reg.fullName,
    email: reg.email,
    trackName: reg.trackName,
    amount,
    gstAmount,
    itemTitle,
    portfolio: isComp ? undefined : (reg.portfolio || "To be announced")
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${number.replace(/\//g, "-")}.pdf"`,
      "Cache-Control": "no-store, private, must-revalidate"
    }
  });
}
