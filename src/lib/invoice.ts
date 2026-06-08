import PDFDocument from "pdfkit";
import { qrPngBuffer } from "./qr";

const DARK_BROWN = "#3B1A0A";
const SAFFRON   = "#D97706";
const INK       = "#2C0F04";
const SLATE     = "#8B6914";

export interface InvoiceData {
  number: string;
  issuedAt: Date;
  delegateId: string;
  fullName: string;
  email: string;
  trackName: string;
  amount: number; // rupees
  gstAmount?: number; // rupees
}

const inr = (amount: number) => `INR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

/** Renders a branded A4 invoice to a Buffer. Uses pdfkit's built-in Helvetica (no font files needed). */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const qr = await qrPngBuffer(data.delegateId).catch(() => null);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const left = 50;
    const right = pageW - 50;

    // Header band
    doc.rect(0, 0, pageW, 90).fill(DARK_BROWN);
    doc.fillColor(SAFFRON).fontSize(20).font("Helvetica-Bold").text("NEW DELHI GLOBAL YOUTH SUMMIT 4.0", left, 30);
    doc.fillColor("#FFE8C8").fontSize(10).font("Helvetica").text("22–23 August 2026 · IIT Delhi, New Delhi", left, 56);
    doc.fillColor(SAFFRON).fontSize(22).font("Helvetica-Bold").text("INVOICE", right - 120, 32, { width: 120, align: "right" });

    // Meta
    let y = 120;
    doc.fillColor(INK).fontSize(10).font("Helvetica-Bold").text("Invoice No.", left, y);
    doc.font("Helvetica").fillColor(SLATE).text(data.number, left + 80, y);
    doc.font("Helvetica-Bold").fillColor(INK).text("Date", left, y + 16);
    doc.font("Helvetica").fillColor(SLATE).text(data.issuedAt.toLocaleDateString("en-IN"), left + 80, y + 16);
    doc.font("Helvetica-Bold").fillColor(INK).text("Delegate ID", left, y + 32);
    doc.font("Helvetica").fillColor(SLATE).text(data.delegateId, left + 80, y + 32);

    // Bill to
    doc.font("Helvetica-Bold").fillColor(INK).fontSize(11).text("Billed to", right - 220, y, { width: 220, align: "right" });
    doc.font("Helvetica").fillColor(SLATE).fontSize(10)
      .text(data.fullName, right - 220, y + 16, { width: 220, align: "right" })
      .text(data.email, right - 220, y + 30, { width: 220, align: "right" });

    // Table header
    y = 210;
    doc.rect(left, y, right - left, 26).fill("#FFF3D6");
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
      .text("Description", left + 12, y + 8)
      .text("Amount", right - 132, y + 8, { width: 120, align: "right" });

    // Line item
    y += 26;
    doc.fillColor(INK).font("Helvetica").fontSize(10)
      .text(`Delegate Registration — ${data.trackName}`, left + 12, y + 9, { width: right - left - 160 })
      .text(inr(data.amount), right - 132, y + 9, { width: 120, align: "right" });
    doc.moveTo(left, y + 30).lineTo(right, y + 30).strokeColor("#D97706").stroke();

    // Totals
    y += 44;
    const gst = data.gstAmount ?? 0;
    const total = data.amount + gst;
    if (gst > 0) {
      doc.font("Helvetica").fillColor(SLATE).fontSize(10)
        .text("GST", right - 252, y, { width: 120, align: "right" })
        .text(inr(gst), right - 132, y, { width: 120, align: "right" });
      y += 18;
    }
    doc.font("Helvetica-Bold").fillColor(INK).fontSize(12)
      .text("Total Paid", right - 252, y, { width: 120, align: "right" })
      .fillColor(SAFFRON).text(inr(total), right - 132, y, { width: 120, align: "right" });

    // QR + footer
    if (qr) {
      doc.image(qr, left, y + 40, { width: 96 });
      doc.fillColor(SLATE).fontSize(8).text("Scan at check-in", left, y + 140, { width: 96, align: "center" });
    }
    doc.fillColor(SLATE).fontSize(9).font("Helvetica")
      .text("This is a system-generated invoice and does not require a signature.", left, doc.page.height - 80, {
        width: right - left,
        align: "center"
      });

    doc.end();
  });
}
