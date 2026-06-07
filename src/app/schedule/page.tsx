import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Schedule — New Delhi Global Youth Summit 2026",
  description: "Two days of committee sessions, keynotes and ceremonies. 22–23 August 2026, IIT Delhi."
};

type Item = { id: string; day: number; startTime: string; endTime: string; title: string; room: string | null; order: number };

const FALLBACK: Item[] = [
  { id: "1", day: 1, startTime: "09:00", endTime: "10:00", title: "Registration & Opening Ceremony", room: "Main Hall", order: 0 },
  { id: "2", day: 1, startTime: "10:15", endTime: "13:00", title: "Committee Session I", room: null, order: 1 },
  { id: "3", day: 1, startTime: "14:00", endTime: "17:00", title: "Committee Session II", room: null, order: 2 },
  { id: "4", day: 2, startTime: "09:30", endTime: "12:30", title: "Committee Session III", room: null, order: 3 },
  { id: "5", day: 2, startTime: "16:00", endTime: "17:30", title: "Closing & Awards", room: "Main Hall", order: 4 }
];

export default async function SchedulePage() {
  let items: Item[] = FALLBACK;
  try {
    const rows = await prisma.scheduleItem.findMany({ orderBy: [{ day: "asc" }, { order: "asc" }] });
    if (rows.length) items = rows as unknown as Item[];
  } catch {
    /* fall back to static */
  }
  const days = [1, 2].map((d) => ({ day: d, items: items.filter((i) => i.day === d) }));

  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-28">
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <p className="kicker text-xs uppercase text-gold">DISPATCH — Programme</p>
          <h1 className="mt-4 font-display text-5xl font-700 text-ink sm:text-7xl">Schedule.</h1>
          <p className="mt-4 text-lg text-ink/70">Two days · 22–23 August 2026 · IIT Delhi. Timings are indicative and may shift slightly.</p>

          {days.map(({ day, items }) => (
            <div key={day} className="mt-12">
              <h2 className="font-display text-2xl font-700 text-ink">Day {day} <span className="text-slatey">· {day === 1 ? "22 August" : "23 August"}</span></h2>
              <ol className="mt-5 border-l-2 border-gold/40 pl-6">
                {items.map((it) => (
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
        </section>
      </main>
      <Footer />
    </>
  );
}
