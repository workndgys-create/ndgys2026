import QRCode from "qrcode";
import { env } from "./env";

/** Value encoded in the QR — a verifiable check-in URL containing the delegate id. */
export function qrPayload(delegateId: string): string {
  return `${env.NEXT_PUBLIC_BASE_URL}/verify/${encodeURIComponent(delegateId)}`;
}

/** Data URL for rendering in an <img> on the web ticket. */
export async function qrDataUrl(delegateId: string): Promise<string> {
  return QRCode.toDataURL(qrPayload(delegateId), { margin: 1, width: 320 });
}

/** PNG Buffer for embedding into the PDF invoice/ticket. */
export async function qrPngBuffer(delegateId: string): Promise<Buffer> {
  return QRCode.toBuffer(qrPayload(delegateId), { margin: 1, width: 240, type: "png" });
}
