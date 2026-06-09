import { NextRequest, NextResponse } from "next/server";
import { checkPromo } from "@/lib/promoDb";
import { rateLimit, clientIp } from "@/lib/ratelimit";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!rateLimit(`promo:${clientIp(req.headers)}`, 20, 60).ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const b = await req.json().catch(() => null);
  if (!b?.code || !b?.amount) return NextResponse.json({ ok: false }, { status: 422 });
  const res = await checkPromo(String(b.code), Number(b.amount), b.trackSlug);
  if (!res.ok) return NextResponse.json({ ok: false, reason: res.reason });
  return NextResponse.json({ ok: true, code: res.code, discount: res.discount, final: res.final });
}
