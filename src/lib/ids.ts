import { prisma } from "./prisma";

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

export function randomCode(len = 4): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

/** Unique delegate id: NDGYS-2026-XXXX */
export async function generateDelegateId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = `NDGYS-2026-${randomCode(4)}`;
    const exists = await prisma.registration.findUnique({ where: { delegateId: id } });
    if (!exists) return id;
  }
  return `NDGYS-2026-${randomCode(6)}`;
}

/** Sequential invoice number: NDGYS/2026/0001 */
export async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const seq = String(count + 1).padStart(4, "0");
  return `NDGYS/2026/${seq}`;
}

/** Unique competition entry id: NDGYS-C-2026-XXXX */
export async function generateCompetitionRefId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = `NDGYS-C-2026-${randomCode(4)}`;
    const exists = await prisma.competitionRegistration.findUnique({ where: { refId: id } });
    if (!exists) return id;
  }
  return `NDGYS-C-2026-${randomCode(6)}`;
}
