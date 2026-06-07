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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <>
      
      <Navbar />
      
      <div className="h-[72px]" />

      <Marquee />
      <Marquee />
      <Navbar />
      <div className="h-8" />
      <main>
        <Hero />
        <About />
        <Stats />

        <section id="allocations" className="bg-cream grain py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionKicker label="DISPATCH — Allocations" />
            <h2 className="mb-8 mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">THE FLOOR IS <span className="text-gold">FILLING UP.</span></h2>
            <PortfolioAllocationsBoard />
          </div>
        </section>

        {/* Venue preview inserted above Contact (full-height preview) */}

        <EventsFeatured />
        <Competitions />
        <Speakers />
        <Secretariat />
        <EventFlow />
        <Sponsors />
        <Tracks />
        <Resources />
        <FAQ />

        <section id="venue-preview" className="py-0">
          <div className="mx-auto max-w-full">
            <SectionKicker label="DISPATCH — Venue" />
            <div className="h-[80vh] w-full">
              <iframe
                title="IIT Delhi — full preview"
                src="https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1sIIT+Delhi,+Hauz+Khas,+New+Delhi"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mx-auto max-w-6xl px-5 py-6">
              <p className="text-ink/70">IIT Delhi, Hauz Khas, New Delhi — previewed above. <a href="https://www.globalyouthsummit.in/venue" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Open official venue page</a></p>
            </div>
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
