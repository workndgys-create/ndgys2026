import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifyDelegateSession, delegateCookieName } from "./delegateAuth";
import { generateDelegateId } from "./ids";

/**
 * Returns the participant's PAID registration, or null.
 * The participant portal unlocks once payment is confirmed, so a session
 * without a PAID registration resolves to null (no portal access).
 */
export async function currentDelegate() {
  const token = cookies().get(delegateCookieName)?.value;
  const session = token ? await verifyDelegateSession(token) : null;
  if (!session) return null;
  const reg = await prisma.registration.findFirst({ where: { email: session.email, status: "PAID" }, orderBy: { createdAt: "desc" } });
  if (!reg) return null;
  if (reg.delegateId) return reg;

  // Backfill for legacy PAID rows created before delegateId assignment became strict.
  for (let i = 0; i < 3; i++) {
    const candidate = await generateDelegateId();
    const updated = await prisma.registration.updateMany({
      where: { id: reg.id, status: "PAID", delegateId: null },
      data: { delegateId: candidate }
    });
    if (updated.count === 1) return { ...reg, delegateId: candidate };

    const latest = await prisma.registration.findUnique({ where: { id: reg.id } });
    if (latest?.delegateId) return latest;
  }

  return reg;
}
