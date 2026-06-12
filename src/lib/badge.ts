import PDFDocument from "pdfkit";
import { qrPngBuffer } from "./qr";
import path from "path";
import fs from "fs";

const DARK_BROWN = "#25140F"; // premium deep espresso
const SAFFRON    = "#D97706"; // warm saffron
const INK        = "#1F0A02"; // dark chocolate text
const SLATE      = "#735F57"; // warm charcoal for labels
const CREAM      = "#FAF6F0"; // premium soft paper off-white

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
  photoData?: Buffer | null;
  photoMime?: string | null;
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

  // Logo & Header image
  const logoPath = path.join(process.cwd(), "public", "NDGYS26.png");
  const logoExists = fs.existsSync(logoPath);

  // Header background block (90 pt height)
  doc.rect(x, y, w, 90).fill(DARK_BROWN);

  // Logo in header (using full width 'w' bounding box + align: center for bulletproof horizontal centering)
  if (logoExists) {
    try {
      doc.image(logoPath, x, y + 10, { fit: [w, 52], align: "center", valign: "center" });
    } catch (e) {
      doc.fillColor(SAFFRON).font("Helvetica-Bold").fontSize(13).text("NDGYS 4.0", x, y + 26, { width: w, align: "center" });
    }
  } else {
    doc.fillColor(SAFFRON).font("Helvetica-Bold").fontSize(13).text("NDGYS 4.0", x, y + 26, { width: w, align: "center" });
  }

  // Subtitle/venue in header (visible off-white CREAM color, no invalid rgba opacity functions)
  doc.fillColor(CREAM).font("Helvetica").fontSize(7.5).text("22–23 August 2026 · IIT Delhi", x, y + 68, { width: w, align: "center" });

  // Gold accent band below header
  doc.rect(x, y + 90, w, 4).fill(accent);

  // Name (auto-scale font size if name is long to prevent text layout issues)
  let nameSize = 17;
  if (d.fullName.length > 25) nameSize = 12;
  else if (d.fullName.length > 18) nameSize = 14;

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(nameSize).text(d.fullName, x + 16, y + 102, { width: w - 32, align: "center" });

  // Details: Portfolio (MUN) vs Competition
  const isComp = d.categoryLabel === "Competition";
  const isMun = d.categoryLabel === "Portfolio" || (!isComp && d.trackSlug && TRACK_COLOURS[d.trackSlug]);

  if (isMun) {
    // Portfolio label
    doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5).text("PORTFOLIO / ALLOCATION", x + 16, y + 128, { width: w - 32, align: "center" });
    // Portfolio value
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(12.5).text(d.portfolio || "PENDING ALLOCATION", x + 16, y + 138, { width: w - 32, align: "center" });
    
    // Committee label
    doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5).text("MUN COMMITTEE", x + 16, y + 162, { width: w - 32, align: "center" });
    // Committee value
    let commSize = 10;
    if (d.trackName.length > 30) commSize = 8.5;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(commSize).text(d.trackName, x + 16, y + 171, { width: w - 32, align: "center" });
  } else if (isComp) {
    // Competition label
    doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5).text("COMPETITION", x + 16, y + 128, { width: w - 32, align: "center" });
    // Competition value
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(12.5).text(d.trackName, x + 16, y + 138, { width: w - 32, align: "center" });
    
    // Role label
    doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5).text("PARTICIPATION ROLE", x + 16, y + 162, { width: w - 32, align: "center" });
    // Role value
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text("Participant", x + 16, y + 171, { width: w - 32, align: "center" });
  } else {
    // Fallback: Event detail
    doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5).text("EVENT GROUP", x + 16, y + 128, { width: w - 32, align: "center" });
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(11).text(d.trackName, x + 16, y + 138, { width: w - 32, align: "center" });
  }

  // Affiliation / Institution / City
  const affiliation = [d.institution, d.city].filter(Boolean).join(" · ");
  if (affiliation) {
    doc.fillColor(SLATE).font("Helvetica").fontSize(7.5).text(affiliation, x + 16, y + 196, { width: w - 32, align: "center" });
  }

  // QR and Photo block area (between y + 215 and y + 355)
  const qr = await qrPngBuffer(d.delegateId).catch(() => null);
  const qrAreaY = y + 215;
  const qrAreaH = 140;

  if (qr && d.photoData) {
    const imgWidth = 82;
    const imgHeight = 96;
    const qrSize = 82;
    const gap = 14;
    const totalW = imgWidth + qrSize + gap;
    const startX = x + (w - totalW) / 2;

    const photoY = qrAreaY + (qrAreaH - imgHeight) / 2;
    const qrYOffset = qrAreaY + (qrAreaH - qrSize) / 2;

    // Photo Box & Image
    try {
      // Draw background frame
      doc.rect(startX - 2, photoY - 2, imgWidth + 4, imgHeight + 4).fill("#EFE9DF");
      doc.save();
      doc.roundedRect(startX, photoY, imgWidth, imgHeight, 4).clip();
      doc.image(d.photoData, startX, photoY, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight] });
      doc.restore();
      doc.roundedRect(startX, photoY, imgWidth, imgHeight, 4).lineWidth(1).strokeColor(accent).stroke();
    } catch (err) {
      console.error("Failed to render photo on PDF badge:", err);
      // Fallback: draw centered QR
      const fallqr = 108;
      doc.roundedRect(x + (w - fallqr) / 2 - 4, qrAreaY + (qrAreaH - fallqr) / 2 - 4, fallqr + 8, fallqr + 8, 6).fill("#FFFFFF");
      doc.roundedRect(x + (w - fallqr) / 2 - 4, qrAreaY + (qrAreaH - fallqr) / 2 - 4, fallqr + 8, fallqr + 8, 6).lineWidth(1).strokeColor("#E5DCCF").stroke();
      doc.image(qr, x + (w - fallqr) / 2, qrAreaY + (qrAreaH - fallqr) / 2, { width: fallqr });
    }

    // QR Box & Image
    doc.roundedRect(startX + imgWidth + gap - 4, qrYOffset - 4, qrSize + 8, qrSize + 8, 6).fill("#FFFFFF");
    doc.roundedRect(startX + imgWidth + gap - 4, qrYOffset - 4, qrSize + 8, qrSize + 8, 6).lineWidth(1).strokeColor("#E5DCCF").stroke();
    doc.image(qr, startX + imgWidth + gap, qrYOffset, { width: qrSize });

  } else if (qr) {
    // Centered QR
    const qrSize = 108;
    const qrYOffset = qrAreaY + (qrAreaH - qrSize) / 2;
    doc.roundedRect(x + (w - qrSize) / 2 - 4, qrYOffset - 4, qrSize + 8, qrSize + 8, 6).fill("#FFFFFF");
    doc.roundedRect(x + (w - qrSize) / 2 - 4, qrYOffset - 4, qrSize + 8, qrSize + 8, 6).lineWidth(1).strokeColor("#E5DCCF").stroke();
    doc.image(qr, x + (w - qrSize) / 2, qrYOffset, { width: qrSize });
  }

  // Delegate ID
  doc.fillColor(INK).font("Courier-Bold").fontSize(10.5).text(d.delegateId, x + 16, y + 364, { width: w - 32, align: "center", characterSpacing: 1 });
  doc.fillColor(SLATE).font("Helvetica").fontSize(6.5).text("Scan at check-in desk", x + 16, y + 379, { width: w - 32, align: "center" });

  // Bottom Footer band (dark brown sandwich style with thin gold accent line above)
  const footerH = 22;
  const footerY = y + BADGE_H - footerH;
  
  // Gold accent line above footer
  doc.rect(x, footerY - 3, w, 3).fill(accent);
  
  // Footer main bar
  doc.rect(x, footerY, w, footerH).fill(DARK_BROWN);
  
  // Correct label based on role
  let footerText = "PARTICIPANT";
  if (isComp) {
    footerText = "COMPETITION PARTICIPANT";
  } else if (isMun) {
    footerText = "OFFICIAL MUN DELEGATE";
  }
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7.5).text(footerText, x, footerY + 7, { width: w, align: "center", characterSpacing: 0.5 });

  // Outer border
  doc.roundedRect(x, y, BADGE_W, BADGE_H, 10).lineWidth(1).strokeColor(accent).stroke();
  
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
