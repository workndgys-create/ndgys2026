import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
import { generateInvoicePdf } from "@/lib/invoice";
export const runtime = "nodejs";
export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoice = await prisma.invoice.findUnique({ where: { registrationId: reg.id } });
  if (!invoice || !reg.delegateId) return NextResponse.json({ error: "No invoice yet" }, { status: 409 });

  const pdf = await generateInvoicePdf({
    number: invoice.number, issuedAt: invoice.issuedAt, delegateId: reg.delegateId,
    fullName: reg.fullName, email: reg.email, trackName: reg.trackName, amount: invoice.amount, gstAmount: invoice.gstAmount
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number.replace(/\//g, "-")}.pdf"`
    }
  });
}
