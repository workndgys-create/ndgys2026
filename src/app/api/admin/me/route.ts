import { NextResponse } from "next/server";
import { currentPermissions } from "@/lib/adminSession";
export const runtime = "nodejs";
export async function GET() {
  const me = await currentPermissions();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email: me.session.email, role: me.session.role, permissions: me.permissions });
}
