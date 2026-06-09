import { getPublicEvents } from "@/lib/publicData";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

const KIND_LABEL: Record<string, string> = { keynote: "Keynote", workshop: "Workshop", social: "Social", ceremony: "Ceremony" };

export default async function EventsFeatured() {
  const items = await getPublicEvents();
  if (items.length === 0) return null;
  return (
    <section id="events" className="bg-cream grain py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="DISPATCH — Programme Highlights" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">WHAT'S <span className="text-gold">ON.</span></h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((e: any, i: number) => (
            <Reveal key={e.id} delay={(i % 2) * 90}>
              <article className="flex gap-5 rounded-2xl border border-ink/10 bg-paper p-5 transition hover:-translate-y-1 hover:shadow-xl">
                {e.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.imageUrl} alt={e.title} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-midnight font-display text-2xl font-900 text-gold">{(KIND_LABEL[e.kind] || "Event")[0]}</div>
                )}
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gold">{KIND_LABEL[e.kind] || e.kind}</span>
                  <h3 className="font-display text-xl font-700 text-ink">{e.title}</h3>
                  {(e.startsAt || e.venue) && (
                    <p className="mt-1 text-xs text-slatey">
                      {e.startsAt ? new Date(e.startsAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      {e.venue ? ` · ${e.venue}` : ""}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-ink/70">{e.summary}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
