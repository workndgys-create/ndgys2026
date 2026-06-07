import { prisma } from "./prisma";
import { sendMail, templates } from "./email";
import { env } from "./env";

/**
 * When a seat frees up in a committee, invite the next waiting person to register.
 * We can't auto-charge, so we email them a register link and mark them PROMOTED.
 */
export async function promoteFromWaitlist(trackSlug: string): Promise<{ promoted: boolean; email?: string }> {
  const next = await prisma.waitlist.findFirst({ where: { trackSlug, status: "WAITING" }, orderBy: { createdAt: "asc" } });
  if (!next) return { promoted: false };

  const track = await prisma.track.findUnique({ where: { slug: trackSlug } });
  await prisma.waitlist.update({ where: { id: next.id }, data: { status: "PROMOTED", promotedAt: new Date() } });

  const link = `${env.NEXT_PUBLIC_BASE_URL}/register?track=${trackSlug}`;
  await sendMail({
    to: next.email,
    subject: `A seat just opened — ${track?.name ?? "your committee"} 🎟️`,
    html: templates.waitlistPromoted(next.name, track?.name ?? "your committee", link)
  }).catch(() => {});
  return { promoted: true, email: next.email };
}
