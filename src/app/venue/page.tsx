import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionKicker from "@/components/SectionKicker";
import { getSetting } from "@/lib/settings";
import { getPublicAccommodation } from "@/lib/publicData";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Venue & Travel — NDGYS 2026", description: "How to reach the New Delhi Global Youth Summit 2026 at IIT Delhi, plus stay and travel guidance." };

export default async function VenuePage() {
  const [address, mapQuery, metro, airport, parking, notes, venue] = await Promise.all([
    getSetting("venue.address"), getSetting("venue.mapQuery"), getSetting("venue.metro"),
    getSetting("venue.airport"), getSetting("venue.parking"), getSetting("venue.notes"), getSetting("event.venue")
  ]);
  const listings = await getPublicAccommodation();
  const stays = listings.filter((l: any) => l.kind === "Hotel");
  const travel = listings.filter((l: any) => l.kind === "Travel");
  const nearby = listings.filter((l: any) => l.kind === "Nearby");
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-28">
        <div className="mx-auto max-w-6xl px-5 pb-20">
          <SectionKicker label="DISPATCH — Venue" />
          <h1 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">GETTING TO <span className="text-gold">{venue.toUpperCase()}.</span></h1>
          <p className="mt-3 max-w-2xl text-ink/70">{address}</p>
          <div className="mt-4">
            <a href="https://www.globalyouthsummit.in/venue" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/5 px-4 py-2 text-sm font-600 text-ink hover:bg-white/10">
              Official venue page
            </a>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 shadow-sm">
            <iframe title="Venue map" src={mapSrc} width="100%" height="380" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block w-full" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Info title="By Metro" body={metro} />
            <Info title="By Air" body={airport} />
            <Info title="Parking & on-site" body={parking} />
          </div>

          {notes && <p className="mt-6 rounded-xl border border-gold/30 bg-goldlite/10 p-4 text-sm text-ink/80">{notes}</p>}

          {stays.length > 0 && <Listings title="Where to stay" items={stays} />}
          {travel.length > 0 && <Listings title="Getting here" items={travel} />}
          {nearby.length > 0 && <Listings title="Nearby & food" items={nearby} />}

          {listings.length === 0 && (
            <p className="mt-12 rounded-xl border border-dashed border-ink/15 bg-paper p-6 text-slatey">Recommended hotels and travel options will be published here soon. Outstation and international delegates — check back closer to the dates.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-5">
      <h3 className="font-display text-lg font-700 text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{body}</p>
    </div>
  );
}

function Listings({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="mt-12">
      <h2 className="font-display text-2xl font-700 text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((l) => (
          <article key={l.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
            {l.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt={l.name} className="h-40 w-full object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-700 text-ink">{l.name}</h3>
                {l.distance && <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-600 text-ink/70">{l.distance}</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{l.description}</p>
              {l.address && <p className="mt-2 text-xs text-slatey">{l.address}</p>}
              <div className="mt-3 flex items-center justify-between">
                {l.priceRange ? <span className="text-sm font-600 text-ink">{l.priceRange}</span> : <span />}
                {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-600 text-gold hover:underline">Details →</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
