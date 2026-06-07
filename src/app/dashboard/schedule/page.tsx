import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await currentDelegate();
  if (!me) return <p className="text-ink/70">Please <Link href="/dashboard/login" className="text-gold underline">sign in</Link>.</p>;

  type SI = { id: string; day: number; startTime: string; endTime: string; title: string; trackSlug: string | null; room: string | null };
  const items = (await prisma.scheduleItem.findMany({ where: { published: true }, orderBy: [{ day: "asc" }, { order: "asc" }] })) as unknown as SI[];
  const days = Array.from(new Set(items.map((i) => i.day))).sort((a, b) => a - b);

  return (
    <div>
      <h1 className="font-display text-3xl font-700 text-ink">My Schedule</h1>
      <p className="mt-1 text-ink/70">Sessions for <b>{me.trackName}</b> are highlighted in gold.</p>
      <div className="mt-6 space-y-8">
        {days.map((day) => (
          <div key={day}>
            <h2 className="font-display text-xl font-700 text-ink">Day {day}</h2>
            <div className="mt-3 space-y-2">
              {items.filter((i) => i.day === day).map((i) => {
                const mine = i.trackSlug === me.trackSlug;
                return (
                  <div key={i.id} className={`flex items-center gap-4 rounded-xl border p-4 ${mine ? "border-gold/50 bg-goldlite/15" : "border-ink/10 bg-paper"}`}>
                    <div className="w-28 shrink-0 font-mono text-sm text-ink/70">{i.startTime}–{i.endTime}</div>
                    <div className="flex-1">
                      <p className="font-600 text-ink">{i.title}{mine && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-600 text-ink">YOUR COMMITTEE</span>}</p>
                      {i.room && <p className="text-xs text-slatey">{i.room}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-slatey">The schedule will appear here once published.</p>}
      </div>
    </div>
  );
}
