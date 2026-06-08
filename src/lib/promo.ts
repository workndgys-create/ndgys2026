export type PromoKind = "PERCENT" | "FLAT";
export interface PromoLike {
  kind: PromoKind;
  value: number;          // percent (0-100) or paise off
  maxUses?: number | null;
  uses?: number;
  appliesTo?: string | null; // track slug filter, null = all
  active?: boolean;
  expiresAt?: Date | string | null;
}

export type PromoCheck =
  | { ok: true; discount: number; final: number }
  | { ok: false; reason: "inactive" | "expired" | "used_up" | "not_applicable" | "invalid" };

/** Applies a promo to a base amount (paise) for a given track. Pure + deterministic. */
export function applyPromo(promo: PromoLike | null, baseAmount: number, trackSlug?: string, now: Date = new Date()): PromoCheck {
  if (!promo) return { ok: false, reason: "invalid" };
  if (promo.active === false) return { ok: false, reason: "inactive" };
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now.getTime()) return { ok: false, reason: "expired" };
  if (promo.maxUses != null && (promo.uses ?? 0) >= promo.maxUses) return { ok: false, reason: "used_up" };
  if (promo.appliesTo && trackSlug && promo.appliesTo !== trackSlug) return { ok: false, reason: "not_applicable" };

  let discount = promo.kind === "PERCENT"
    ? Math.round((baseAmount * Math.min(Math.max(promo.value, 0), 100)) / 100)
    : Math.min(Math.max(promo.value, 0), baseAmount);
  discount = Math.min(discount, baseAmount);
  const final = Math.max(0, baseAmount - discount);
  return { ok: true, discount, final };
}
