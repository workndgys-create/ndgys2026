import { getPublicCompetitions } from "@/lib/publicData";
import Link from "next/link";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

export default async function Competitions() {
  const items = await getPublicCompetitions();
  if (items.length === 0) return null;
  return (
    <section id="competitions" className="bg-paper py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="COMMUNIQUÉ — Competitions" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">COMPETE & <span className="text-gold">WIN.</span></h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c: any, i: number) => (
            <Reveal key={c.id} delay={(i % 3) * 90}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-midnight font-display text-5xl font-900 text-white/10">{String(i + 1).padStart(2, "0")}</div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[11px] uppercase tracking-wider text-slatey">{c.category}</span>
                  <h3 className="mt-1 font-display text-xl font-700 text-ink">{c.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink/70">{(c.summary || "").replace(/🏆/g, "").replace(/\b(Rs\.?|₹)\s?\d[\d,]*/gi, "").replace(/trophy|certificate/gi, "").trim()}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span />
                    {c.registrationOpen && (c.feeSolo || c.feeGroup)
                      ? <Link href={`/competitions/${c.slug}/register`} className="text-sm font-600 text-gold hover:underline">Register →</Link>
                      : c.ctaUrl
                        ? <a href={c.ctaUrl} className="text-sm font-600 text-gold hover:underline">Learn more →</a>
                        : <span />}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
