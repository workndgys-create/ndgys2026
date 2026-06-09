import { prisma } from "./prisma";
import { applyPromo, PromoCheck } from "./promo";

/** Validates a code against the DB for a base amount + track (no usage increment). */
export async function checkPromo(code: string, baseAmount: number, trackSlug?: string): Promise<PromoCheck & { code?: string }> {
  if (!code) return { ok: false, reason: "invalid" };
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  const res = applyPromo(promo as any, baseAmount, trackSlug);
  return res.ok ? { ...res, code: promo!.code } : res;
}

/** Atomically consumes one use of a code (best-effort; called on payment success). */
export async function consumePromo(code?: string | null): Promise<void> {
  if (!code) return;
  await prisma.promoCode.updateMany({ where: { code }, data: { uses: { increment: 1 } } }).catch(() => {});
}
