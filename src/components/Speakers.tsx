import { getPublicSpeakers } from "@/lib/publicData";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

export default async function Speakers() {
  const items = await getPublicSpeakers();
  if (items.length === 0) return null;
  return (
    <section id="speakers" className="bg-paper py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="COMMUNIQUÉ — Speakers" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">VOICES ON <span className="text-gold">STAGE.</span></h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s: any, i: number) => (
            <Reveal key={s.id} delay={(i % 4) * 80}>
              <article className="overflow-hidden rounded-2xl border border-ink/10 bg-cream text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt={s.name} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-midnight font-display text-5xl font-900 text-gold">{s.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}</div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-lg font-700 text-ink">{s.name}</h3>
                  <p className="text-sm text-gold">{s.title}</p>
                  {s.bio && <p className="mt-2 text-xs leading-relaxed text-ink/65 line-clamp-3">{s.bio}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
