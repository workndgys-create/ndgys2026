import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifyDelegateSession, delegateCookieName } from "./delegateAuth";

/**
 * Returns the delegate's PAID registration, or null.
 * The delegate panel is only assigned once payment is confirmed, so a session
 * without a PAID registration resolves to null (no panel access).
 */
export async function currentDelegate() {
  const token = cookies().get(delegateCookieName)?.value;
  const session = token ? await verifyDelegateSession(token) : null;
  if (!session) return null;
  return prisma.registration.findFirst({ where: { email: session.email, status: "PAID" }, orderBy: { createdAt: "desc" } });
}
