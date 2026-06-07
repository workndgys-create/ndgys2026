import { getPublicSecretariat } from "@/lib/publicData";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

export default async function Secretariat() {
  const items = await getPublicSecretariat();
  if (items.length === 0) return null;
  return (
    <section id="secretariat" className="bg-cream grain py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="COMMUNIQUÉ — Secretariat" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">THE TEAM BEHIND <span className="text-gold">THE SUMMIT.</span></h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m: any, i: number) => (
            <Reveal key={m.id} delay={(i % 4) * 80}>
              <article className="overflow-hidden rounded-2xl border border-ink/10 bg-paper text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt={m.name} className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-midnight font-display text-5xl font-900 text-gold">{m.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}</div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-lg font-700 text-ink">{m.name}</h3>
                  <p className="text-sm text-gold">{m.role}</p>
                  {m.bio && <p className="mt-2 text-xs leading-relaxed text-ink/65 line-clamp-3">{m.bio}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
