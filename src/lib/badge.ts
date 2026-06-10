import PDFDocument from "pdfkit";
import { qrPngBuffer } from "./qr";

const DARK_BROWN = "#3B1A0A";
const SAFFRON    = "#D97706";
const INK        = "#2C0F04";
const SLATE      = "#8B6914";
const CREAM      = "#FFE8C8";

// Committee accent colours for the badge band — palette mapped to canonical committees.
const TRACK_COLOURS: Record<string, string> = {
  "unsc":       "#6B2D0A", // deep terracotta
  "unga":       "#2E7D5B", // forest green
  "unhrc":      "#A23B5E", // heritage rose
  "csw":        "#D97706", // saffron
  "unicef":     "#3B82F6", // bright blue
  "unep":       "#16A34A", // green
  "wto":        "#7C3AED", // purple
  "aippm":      "#FF8A00", // orange
  "lok-sabha":  "#92400E", // copper
  "war-cabinet":"#9C2B2B", // deep red
  "ipl":        "#F472B6"  // pink (sports)
};

export interface BadgeData {
  delegateId: string;
  fullName: string;
  trackName: string;
  trackSlug?: string;
  portfolio?: string | null;
  institution?: string | null;
  city?: string | null;
  categoryLabel?: string;
}

// Lanyard badge size ~100 x 150 mm (1mm = 2.83465pt)
const MM = 2.83465;
const BADGE_W = 100 * MM;
const BADGE_H = 150 * MM;

async function drawBadge(doc: PDFKit.PDFDocument, x: number, y: number, d: BadgeData) {
  const accent = (d.trackSlug && TRACK_COLOURS[d.trackSlug]) || SAFFRON;
  const w = BADGE_W;

  // Card background
  doc.save();
  doc.roundedRect(x, y, BADGE_W, BADGE_H, 10).fill(CREAM);

  // Header
  doc.rect(x, y, w, 70).fill(DARK_BROWN);
  doc.fillColor(SAFFRON).font("Helvetica-Bold").fontSize(12).text("NEW DELHI GLOBAL", x, y + 16, { width: w, align: "center" });
  doc.fillColor(CREAM).fontSize(12).text("YOUTH SUMMIT 4.0", x, y + 32, { width: w, align: "center" });
  doc.fillColor("rgba(255,232,200,0.7)").font("Helvetica").fontSize(8).text("22–23 August 2026 · IIT Delhi", x, y + 50, { width: w, align: "center" });

  // Accent band
  doc.rect(x, y + 70, w, 8).fill(accent);

  // Name
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(19).text(d.fullName, x + 16, y + 92, { width: w - 32, align: "center" });

  // Portfolio / role
  const category = d.categoryLabel || "Assignment";
  if (d.portfolio) {
    doc.fillColor(SLATE).font("Helvetica").fontSize(8).text(category.toUpperCase(), x + 16, y + 122, { width: w - 32, align: "center" });
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(13).text(d.portfolio, x + 16, y + 132, { width: w - 32, align: "center" });
  }

  // Event/track info
  doc.fillColor(SLATE).font("Helvetica").fontSize(8).text("EVENT", x + 16, d.portfolio ? y + 150 : y + 126, { width: w - 32, align: "center" });
  doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(10).text(d.trackName, x + 16, d.portfolio ? y + 160 : y + 136, { width: w - 32, align: "center" });

  // Affiliation block
  const affiliation = [d.institution, d.city].filter(Boolean).join(" · ");
  if (affiliation) {
    doc.fillColor(SLATE).font("Helvetica").fontSize(8).text(affiliation, x + 16, y + 175, { width: w - 32, align: "center" });
  }

  // QR
  const qr = await qrPngBuffer(d.delegateId).catch(() => null);
  const qrSize = 120;
  const qrY = affiliation ? y + 190 : y + 182;
  if (qr) {
    doc.image(qr, x + (w - qrSize) / 2, qrY, { width: qrSize });
  }

  // Delegate id
  doc.fillColor(INK).font("Courier-Bold").fontSize(12).text(d.delegateId, x + 16, y + 320, { width: w - 32, align: "center" });
  doc.fillColor(SLATE).font("Helvetica").fontSize(7).text("Scan at check-in · PARTICIPANT", x + 16, y + 338, { width: w - 32, align: "center" });

  // Border
  doc.roundedRect(x, y, BADGE_W, BADGE_H, 10).lineWidth(1).strokeColor("#D97706").stroke();
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
