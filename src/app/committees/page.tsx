import Link from "next/link";
import type { Metadata } from "next";
import { getPublicTracks } from "@/lib/publicData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Committees — New Delhi Global Youth Summit 4.0",
  description: "Eight committees spanning policy, climate, technology, human rights and crisis simulation. Find your track and reserve a seat."
};

const TRACK_IMAGES: Record<string, string> = {
  unsc: "/UNSC.jpeg",
  unga: "/UNGA.jpeg",
  unhrc: "/UNHRC.jpeg",
  csw: "/UNCSW.jpeg",
  unicef: "/UNICEF.jpeg",
  unep: "/UNEP.jpeg",
  wto: "/WTO.jpeg",
  "international-press": "/IP.jpeg",
  aippm: "/AIPPM.jpeg",
  "lok-sabha": "/LOKSABHA.jpeg",
  "war-cabinet": "/IWC.jpeg",
  ipl: "/IPL.jpeg",
};

export default async function CommitteesPage() {
  const tracksRaw = await getPublicTracks();
  // Defensive: filter out any 'ipl' track (IPL is a competition, not a committee)
  const tracks = tracksRaw.filter((t) => (t.slug ?? "") !== "ipl");
  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-40">
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <p className="kicker text-xs uppercase text-gold">DISPATCH — Committees</p>
          <h1 className="mt-4 font-display text-5xl font-700 text-ink sm:text-7xl">The Committees.</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/70">
            Each committee tackles a live agenda. Seats are limited and assigned on a first-come basis — once a committee fills, you can join its waitlist.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t, i) => {
              const imageSrc = TRACK_IMAGES[t.slug];
              return (
                <article key={t.slug} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-40 overflow-hidden bg-midnight">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc} alt={t.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-display text-6xl font-900 text-white/5">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    )}
                    
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[11px] uppercase tracking-wider text-slatey">{t.difficulty}</span>
                    <h2 className="mt-1 font-display text-xl font-700 text-ink">{t.name}</h2>
                    <p className="mt-2 flex-1 text-sm text-ink/70">{t.agenda}</p>
                    <Link href={`/committees/${t.slug}`} className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-midnight px-5 py-2 text-sm font-600 text-cream transition group-hover:bg-gold group-hover:text-midnight">
                      View committee →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
