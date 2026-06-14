import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venue — NDGYS 4.0",
  description: "Venue information for New Delhi Global Youth Summit 4.0 (reveal coming soon)",
};

export default async function VenuePage() {
  const settings = await getAllSettings();
  const revealed = settings["venue.revealed"] === "true";
  const address = settings["venue.address"] ?? "";
  const mapQuery = settings["venue.mapQuery"] ?? "";
  const metro = settings["venue.metro"] ?? "";
  const airport = settings["venue.airport"] ?? "";
  const parking = settings["venue.parking"] ?? "";
  const notes = settings["venue.notes"] ?? "";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream grain pt-36 text-ink">
        {!revealed ? (
          <section className="min-h-[60vh] flex items-center">
            <div className="mx-auto w-full max-w-4xl px-6 text-center">
              <p className="kicker text-xs uppercase tracking-[0.2em] text-goldlite font-bold">DISPATCH — Venue</p>
              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-display font-black text-ink">VENUE REVEAL COMING SOON</h1>
              <p className="mt-6 text-lg md:text-xl text-ink/80 max-w-2xl mx-auto">
                We're finalizing the venue details. Stay tuned for the official announcement!
              </p>
              <p className="mt-3 text-sm text-ink/70">The official venue announcement will be shared soon. Keep an eye on our updates.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="relative h-[55vh] overflow-hidden bg-[#1F0A02]">
              <img
                src="/IMG_7820.JPG.jpeg"
                alt="IIT Delhi campus"
                className="absolute inset-0 w-full h-full object-cover brightness-50 opacity-60"
              />
              <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-cream flex flex-col justify-end h-full">
                <p className="kicker text-xs uppercase tracking-[0.2em] text-goldlite font-bold">DISPATCH — Venue</p>
                <h1 className="text-4xl md:text-6xl font-display font-black mt-2 text-[#FFF8E7] drop-shadow-md">
                  THE VENUE
                </h1>
                {address && <p className="mt-2 text-lg md:text-xl text-goldlite font-semibold">{address}</p>}
                <p className="mt-4 max-w-3xl text-sm md:text-base text-cream/80 leading-relaxed">{notes || "The venue details will be published here when revealed."}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || address || "IIT Delhi")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-midnight shadow-lg shadow-gold/25 hover:bg-goldlite transition"
                  >
                    Open in Google Maps
                  </a>
                  <a
                    href="#directions"
                    className="inline-block rounded-full border border-cream/35 bg-cream/10 backdrop-blur-sm px-6 py-2.5 text-sm font-bold text-cream hover:border-goldlite hover:text-goldlite transition"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </section>

            <section id="about" className="max-w-5xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-display font-bold text-ink">About the venue</h2>
              <p className="mt-4 text-ink/85 leading-relaxed">
                IIT Delhi's Hauz Khas campus sits in South Delhi and combines academic spaces with
                conference-ready auditoria and guest facilities. We'll be using centrally-located
                lecture halls and breakout rooms with AV support. The campus is wheelchair-accessible
                and has on-site parking for organisers.
              </p>

              <div className="grid gap-8 md:grid-cols-2 mt-10">
                <div className="rounded-2xl border border-gold/15 bg-paper p-6">
                  <h3 className="font-display text-xl font-bold text-ink">Address</h3>
                  <address className="not-italic mt-3 text-ink/80 leading-relaxed">{address || "Address will be published soon."}</address>

                  <h4 className="mt-6 font-display text-lg font-bold text-ink">On-site contacts</h4>
                  <p className="mt-2 text-ink/80">{notes ? notes : "Event desk details will appear here."}</p>
                </div>

                <div className="rounded-2xl border border-gold/15 bg-paper p-6">
                  <h3 className="font-display text-xl font-bold text-ink">How to reach</h3>
                  <ul className="mt-3 list-disc pl-5 text-ink/80 space-y-2">
                    {metro && <li>{metro}</li>}
                    {parking && <li>{parking}</li>}
                    {airport && <li>{airport}</li>}
                    {!metro && !parking && !airport && <li>Travel information will be published soon.</li>}
                  </ul>
                </div>
              </div>
            </section>

            <section id="facilities" className="bg-paper py-16">
              <div className="max-w-5xl mx-auto px-6">
                <h3 className="text-3xl font-display font-bold text-ink">Facilities</h3>
                <ul className="mt-6 grid gap-4 md:grid-cols-2 text-ink/85">
                  {[
                    "Multiple auditoria and lecture halls with AV support",
                    "Breakout rooms for workshops and panels",
                    "On-campus dining and catering options",
                    "Accessible restrooms and ramps",
                    "On-site parking for organisers",
                    "Secure Wi‑Fi for event operations"
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="text-gold font-bold">✔</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="gallery" className="max-w-5xl mx-auto px-6 py-16">
              <h3 className="text-3xl font-display font-bold text-ink">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <img src="/logos/IMG_2821.PNG" alt="venue 1" className="w-full h-40 object-cover rounded-xl border border-gold/10" />
                <img src="/IMG_7820.JPG.jpeg" alt="venue 2" className="w-full h-40 object-cover rounded-xl border border-gold/10" />
                <img src="/logo.png" alt="venue 3" className="w-full h-40 object-cover rounded-xl border border-gold/10" />
                <div className="w-full h-40 bg-paper border border-gold/15 rounded-xl flex items-center justify-center text-slatey text-xs font-semibold p-4 text-center">
                  More images coming soon
                </div>
              </div>
            </section>

            <section id="directions" className="max-w-5xl mx-auto px-6 pb-20">
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-8 text-center max-w-3xl mx-auto">
                <h3 className="text-2xl font-display font-bold text-ink">Event day information</h3>
                <p className="mt-4 text-ink/80 leading-relaxed">
                  Please arrive at the venue at least 45 minutes before your scheduled session. On arrival,
                  check in at the event desk and collect your badge. Volunteers will be available to guide
                  participants to auditoria and breakout rooms.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
