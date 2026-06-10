import QRCode from "qrcode";
import { env } from "./env";
import crypto from "crypto";

function sigFor(delegateId: string) {
  const h = crypto.createHmac("sha256", env.JWT_SECRET).update(delegateId).digest("hex");
  return h.slice(0, 16);
}

/** Value encoded in the QR — a verifiable check-in URL containing the delegate id and short HMAC sig. */
export function qrPayload(delegateId: string): string {
  const sig = sigFor(delegateId);
  return `${env.NEXT_PUBLIC_BASE_URL}/verify/${encodeURIComponent(delegateId)}.${sig}`;
}

export function verifySignature(delegateId: string, sig: string): boolean {
  if (!sig || typeof sig !== "string") return false;
  return sigFor(delegateId) === sig;
}

/** Data URL for rendering in an <img> on the web ticket. */
export async function qrDataUrl(delegateId: string): Promise<string> {
  return QRCode.toDataURL(qrPayload(delegateId), { margin: 1, width: 320 });
}

/** PNG Buffer for embedding into the PDF invoice/ticket. */
export async function qrPngBuffer(delegateId: string): Promise<Buffer> {
  return QRCode.toBuffer(qrPayload(delegateId), { margin: 1, width: 240, type: "png" });
}
