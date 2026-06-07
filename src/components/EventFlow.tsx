import { getPublicFlow } from "@/lib/publicData";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

export default async function EventFlow() {
  const items = await getPublicFlow();
  if (items.length === 0) return null;
  const days = [...new Set((items as any[]).map((i) => i.day))].sort((a, b) => a - b);
  return (
    <section id="flow" className="bg-cream grain py-24">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <SectionKicker label="DISPATCH — Event Flow" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">HOW IT <span className="text-gold">UNFOLDS.</span></h2>
        </Reveal>
        {days.map((day) => (
          <div key={day} className="mt-10">
            <h3 className="font-display text-2xl font-700 text-ink">Day {day} <span className="text-slatey">· {day === 1 ? "22 August" : "23 August"}</span></h3>
            <ol className="mt-5 border-l-2 border-gold/40 pl-6">
              {(items as any[]).filter((i) => i.day === day).map((it) => (
                <li key={it.id} className="relative pb-7 last:pb-0">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-gold bg-cream" />
                  <p className="font-mono text-xs text-slatey">{it.startTime} – {it.endTime}</p>
                  <p className="font-display text-lg font-700 text-ink">{it.title}</p>
                  {it.room && <p className="text-sm text-slatey">{it.room}</p>}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
