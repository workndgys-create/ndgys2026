import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import PortfolioAllocationsBoard from "@/components/PortfolioAllocationsBoard";
import EventsFeatured from "@/components/EventsFeatured";
import Competitions from "@/components/Competitions";
import Speakers from "@/components/Speakers";
import Secretariat from "@/components/Secretariat";
import Sponsors from "@/components/Sponsors";
import EventFlow from "@/components/EventFlow";
import Tracks from "@/components/Tracks";
import Resources from "@/components/Resources";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SectionKicker from "@/components/SectionKicker";
import { getAllSettings } from "@/lib/settings";
import Marquee from "@/components/Marquee";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getAllSettings();
  const venueRevealed = settings["venue.revealed"] === "true";
  const mapQuery = settings["venue.mapQuery"] ?? "IIT Delhi, Hauz Khas, New Delhi";
  const metro = settings["venue.metro"] ?? "";
  const airport = settings["venue.airport"] ?? "";
  const parking = settings["venue.parking"] ?? "";
  const address = settings["venue.address"] ?? "IIT Delhi, Hauz Khas, New Delhi";
  return (
    <>

      {/* Marquee sits at very top (fixed top-0, h-8 = 32px) */}
      <Marquee />

      {/* Navbar sits just below marquee (fixed top-8) */}
      <Navbar />

      {/* spacer: 32px marquee + 112px header = 144px total */}
      <div className="h-36" />

      <main>
        <Hero />
        <About />
        <Stats />

        <section id="allocations" className="bg-cream grain py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionKicker label="DISPATCH — Allocations" />
            <h2 className="mb-8 mt-5 text-center font-display text-4xl font-700 text-ink sm:text-left sm:text-6xl">THE FLOOR IS <span className="text-gold">FILLING UP.</span></h2>
            <PortfolioAllocationsBoard />
          </div>
        </section>

        {/* Venue preview inserted above Contact (full-height preview) */}

        <EventsFeatured />
        <Speakers />
        <Secretariat />
        <EventFlow />
        <Sponsors />
        <Tracks />
        <Competitions />
        <Resources />
        <FAQ />
        

        <section id="venue-preview" className="py-0">
          <div className="mx-auto max-w-full">
            <SectionKicker label="DISPATCH-4 VENUE" />
            {!venueRevealed ? (
              <div className="min-h-[60vh] flex items-center">
                <div className="mx-auto w-full max-w-4xl px-6 text-center">
                  <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-display font-black text-ink">VENUE REVEAL COMING SOON</h2>
                  <p className="mt-6 text-lg md:text-xl text-ink/80 max-w-2xl mx-auto">We're finalizing the venue details. Stay tuned for the official announcement!</p>
                  <p className="mt-3 text-sm text-ink/70">The official venue announcement will be shared soon. Keep an eye on our updates.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-[80vh] w-full">
                  <iframe
                    title="Venue preview"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery || address)}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="mx-auto max-w-6xl px-5 py-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-lg border border-gold/20 p-6 bg-paper">
                      <h4 className="text-lg font-semibold text-ink">By Metro</h4>
                      <p className="mt-3 text-ink/80">{metro || "Nearest Metro details will be published soon."}</p>
                    </div>

                    <div className="rounded-lg border border-gold/20 p-6 bg-paper">
                      <h4 className="text-lg font-semibold text-ink">By Air</h4>
                      <p className="mt-3 text-ink/80">{airport || "Air travel details will be published soon."}</p>
                    </div>

                    <div className="rounded-lg border border-gold/20 p-6 bg-paper">
                      <h4 className="text-lg font-semibold text-ink">Parking & on-site</h4>
                      <p className="mt-3 text-ink/80">{parking || "Parking details will be published soon."}</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 p-4 text-ink/80 font-600">
                    Carry a government photo ID and your delegate QR for entry. Gates open 60 minutes before the first session.
                  </div>

                  <div className="mt-6 rounded-lg border border-dashed border-gold/20 p-6 bg-paper">
                    <p className="text-ink/80">Recommended hotels and travel options will be published here soon. Outstation and international delegates — check back closer to the event for curated hotel and travel partners.</p>
                  </div>

                  <div className="mt-6">
                    <p className="text-ink/70">{address} — previewed above. <a href="/venue" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Open official venue page</a></p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
