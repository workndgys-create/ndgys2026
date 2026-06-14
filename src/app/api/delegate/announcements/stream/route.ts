import { prisma } from "@/lib/prisma";
import { currentDelegate, allDelegateRegistrations } from "@/lib/delegateSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of announcements relevant to the delegate.
 * Emits the current list on connect, then any new items as they're published.
 * Clients fall back to polling /api/delegate/announcements if SSE is unavailable.
 */
export async function GET(req: Request) {
  const me = await currentDelegate();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const allRegs = await allDelegateRegistrations();
  const trackSlugs = allRegs.map(r => r.trackSlug).filter(Boolean);

  const audienceWhere = {
    OR: [
      { audience: "ALL" as const },
      ...(me.status === "PAID" ? [{ audience: "PAID" as const }] : []),
      { audience: "TRACK" as const, trackSlug: { in: trackSlugs } }
    ]
  };

  const encoder = new TextEncoder();
  let lastSeen = new Date(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      const poll = async (initial = false) => {
        try {
          const items = await prisma.announcement.findMany({ where: audienceWhere, orderBy: { publishedAt: "desc" }, take: 50 });
          if (initial) {
            send("snapshot", items);
            if (items[0]) lastSeen = new Date(items[0].publishedAt as unknown as string);
          } else {
            const fresh = (items as unknown as { publishedAt: string }[]).filter((a) => new Date(a.publishedAt) > lastSeen);
            if (fresh.length) { send("new", fresh); lastSeen = new Date(fresh[0].publishedAt); }
            else controller.enqueue(encoder.encode(": keep-alive\n\n"));
          }
        } catch {
          controller.enqueue(encoder.encode(": error\n\n"));
        }
      };

      await poll(true);
      timer = setInterval(() => poll(false), 15000);

      req.signal.addEventListener("abort", () => { if (timer) clearInterval(timer); try { controller.close(); } catch {} });
    },
    cancel() { if (timer) clearInterval(timer); }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" }
  });
}
