import PDFDocument from "pdfkit";
import { qrPngBuffer } from "./qr";

const NAVY = "#1A1A3E";
const GOLD = "#C9A24B";
const INK = "#10112B";
const SLATE = "#6B6E8A";
const CREAM = "#F7F4EC";

// Committee accent colours for the badge band.
const TRACK_COLOURS: Record<string, string> = {
  "global-policy": "#2C2C66",
  "climate": "#2E7D5B",
  "technology": "#3A4DB5",
  "entrepreneurship": "#C9A24B",
  "human-rights": "#A23B5E",
  "press": "#5A5A7A",
  "leadership": "#1A1A3E",
  "crisis": "#9C2B2B"
};

export interface BadgeData {
  delegateId: string;
  fullName: string;
  trackName: string;
  trackSlug?: string;
  portfolio?: string | null;
}

// Lanyard badge size ~100 x 150 mm (1mm = 2.83465pt)
const MM = 2.83465;
const BADGE_W = 100 * MM;
const BADGE_H = 150 * MM;

async function drawBadge(doc: PDFKit.PDFDocument, x: number, y: number, d: BadgeData) {
  const accent = (d.trackSlug && TRACK_COLOURS[d.trackSlug]) || GOLD;
  const w = BADGE_W;

  // Card background
  doc.save();
  doc.roundedRect(x, y, BADGE_W, BADGE_H, 10).fill(CREAM);

  // Header
  doc.rect(x, y, w, 70).fill(NAVY);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12).text("NEW DELHI GLOBAL", x, y + 16, { width: w, align: "center" });
  doc.fillColor("#FFFFFF").fontSize(12).text("YOUTH SUMMIT 2026", x, y + 32, { width: w, align: "center" });
  doc.fillColor("rgba(255,255,255,0.7)").font("Helvetica").fontSize(8).text("22–23 August 2026 · IIT Delhi", x, y + 50, { width: w, align: "center" });

  // Accent band
  doc.rect(x, y + 70, w, 8).fill(accent);

  // Name
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(d.fullName, x + 16, y + 96, { width: w - 32, align: "center" });

  // Portfolio / role
  if (d.portfolio) {
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(13).text(d.portfolio, x + 16, y + 126, { width: w - 32, align: "center" });
  }
  // Committee
  doc.fillColor(SLATE).font("Helvetica").fontSize(10).text(d.trackName, x + 16, d.portfolio ? y + 146 : y + 130, { width: w - 32, align: "center" });

  // QR
  const qr = await qrPngBuffer(d.delegateId).catch(() => null);
  const qrSize = 120;
  if (qr) {
    doc.image(qr, x + (w - qrSize) / 2, y + 180, { width: qrSize });
  }

  // Delegate id
  doc.fillColor(INK).font("Courier-Bold").fontSize(12).text(d.delegateId, x + 16, y + 312, { width: w - 32, align: "center" });
  doc.fillColor(SLATE).font("Helvetica").fontSize(7).text("Scan at check-in · DELEGATE", x + 16, y + 330, { width: w - 32, align: "center" });

  // Border
  doc.roundedRect(x, y, BADGE_W, BADGE_H, 10).lineWidth(1).strokeColor("#E2DDCE").stroke();
  doc.restore();
}

/** Single delegate badge, one page sized to the badge. */
export async function generateBadgePdf(d: BadgeData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: [BADGE_W, BADGE_H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    drawBadge(doc, 0, 0, d).then(() => doc.end()).catch(reject);
  });
}

/** Bulk sheet — one badge per page, for printing a batch. */
export async function generateBadgeSheet(delegates: BadgeData[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: [BADGE_W, BADGE_H], margin: 0, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    (async () => {
      const list = delegates.length ? delegates : [];
      if (list.length === 0) {
        doc.addPage();
        doc.fillColor(SLATE).font("Helvetica").fontSize(12).text("No paid delegates to badge yet.", 20, BADGE_H / 2 - 10, { width: BADGE_W - 40, align: "center" });
      } else {
        for (const d of list) {
          doc.addPage();
          await drawBadge(doc, 0, 0, d);
        }
      }
      doc.end();
    })().catch(reject);
  });
}
