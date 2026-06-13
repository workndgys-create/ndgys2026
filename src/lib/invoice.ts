import PDFDocument from "pdfkit";
import { qrPngBuffer } from "./qr";
import fs from "fs";
import path from "path";

const DARK_BROWN = "#3B1A0A";
const SAFFRON   = "#D97706";
const INK       = "#2C0F04";
const SLATE     = "#8B6914";
const GOLD_LIGHT = "#FFF3D6";

export interface InvoiceData {
  number: string;
  issuedAt: Date;
  delegateId: string;
  fullName: string;
  email: string;
  trackName: string;
  amount: number; // rupees
  gstAmount?: number; // rupees
  itemTitle?: string;
}

const inr = (amount: number) => `INR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

/** Safely load a logo from the public directory. Returns null if the file is missing. */
function loadLogo(filename: string): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", filename));
  } catch {
    return null;
  }
}

/** Renders a branded A4 invoice to a Buffer. Uses pdfkit's built-in Helvetica (no font files needed). */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const qr = await qrPngBuffer(data.delegateId).catch(() => null);

  // Pre-load logos
  const shlLogo = loadLogo("SHLLogo.png");
  const ndgysLogo = loadLogo("NDGYS26.png");
  const gysLogo = loadLogo("GYS.png");

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const left = 50;
    const right = pageW - 50;
    const contentW = right - left;

    // ── Header band with logos ──────────────────────────────────────
    const headerH = 140;
    doc.rect(0, 0, pageW, headerH).fill(DARK_BROWN);

    // Thin saffron accent line at bottom of header
    doc.rect(0, headerH, pageW, 3).fill(SAFFRON);

    // Logo sizing – all logos are vertically centred within the header
    const logoPad = 12; // vertical padding from top/bottom of header band
    const logoMaxH = headerH - logoPad * 2; // max height for any logo

    // Side logo dimensions — SHL and GYS share the same bounding box
    const sideLogoW = 150;
    const sideLogoH = logoMaxH;

    // Left: SHL Logo
    if (shlLogo) {
      const shlY = logoPad + (logoMaxH - sideLogoH) / 2;
      doc.image(shlLogo, left, shlY, { fit: [sideLogoW, sideLogoH], align: "center", valign: "center" });
    }

    // Centre: NDGYS26 logo (the main event logo)
    if (ndgysLogo) {
      const ndgysW = 220;
      const ndgysH = logoMaxH;
      const ndgysX = (pageW - ndgysW) / 2;
      doc.image(ndgysLogo, ndgysX, logoPad, { fit: [ndgysW, ndgysH], align: "center", valign: "center" });
    }

    // Right: GYS logo
    if (gysLogo) {
      const gysY = logoPad + (logoMaxH - sideLogoH) / 2;
      doc.image(gysLogo, right - sideLogoW, gysY, { fit: [sideLogoW, sideLogoH], align: "center", valign: "center" });
    }

    // ── "INVOICE" title bar ─────────────────────────────────────────
    const titleBarY = headerH + 3; // just below accent line
    const titleBarH = 32;
    doc.rect(0, titleBarY, pageW, titleBarH).fill(GOLD_LIGHT);
    doc.fillColor(DARK_BROWN).fontSize(14).font("Helvetica-Bold")
      .text("INVOICE", left, titleBarY + 8, { width: contentW / 2 });
    doc.fillColor(SLATE).fontSize(9).font("Helvetica")
      .text("22–23 August 2026 · IIT Delhi, New Delhi", left, titleBarY + 10, { width: contentW, align: "right" });

    // ── Meta section ────────────────────────────────────────────────
    let y = titleBarY + titleBarH + 20;
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

    // ── Table header ────────────────────────────────────────────────
    y += 60;
    doc.rect(left, y, contentW, 26).fill(GOLD_LIGHT);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
      .text("Description", left + 12, y + 8)
      .text("Amount", right - 132, y + 8, { width: 120, align: "right" });

    // Line item
    y += 26;
    const itemTitle = data.itemTitle ?? `Delegate Registration — ${data.trackName}`;
    doc.fillColor(INK).font("Helvetica").fontSize(10)
      .text(itemTitle, left + 12, y + 9, { width: contentW - 160 })
      .text(inr(data.amount), right - 132, y + 9, { width: 120, align: "right" });
    doc.moveTo(left, y + 30).lineTo(right, y + 30).strokeColor(SAFFRON).stroke();

    // ── Totals ──────────────────────────────────────────────────────
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

    // ── QR + footer ─────────────────────────────────────────────────
    if (qr) {
      doc.image(qr, left, y + 40, { width: 96 });
      doc.fillColor(SLATE).fontSize(8).text("Scan at check-in", left, y + 140, { width: 96, align: "center" });
    }
    doc.fillColor(SLATE).fontSize(9).font("Helvetica")
      .text("This is a system-generated invoice and does not require a signature.", left, doc.page.height - 80, {
        width: contentW,
        align: "center"
      });

    doc.end();
  });
}
