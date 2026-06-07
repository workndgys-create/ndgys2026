import { NextResponse } from "next/server";
import { delegateCookieName } from "@/lib/delegateAuth";
export const runtime = "nodejs";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(delegateCookieName, "", { path: "/", maxAge: 0 });
  return res;
}
