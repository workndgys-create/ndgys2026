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

        <EventsFeatured />
        <Competitions />
        <Speakers />
        <Secretariat />
        <EventFlow />
        <Sponsors />
        <Tracks />
        <Resources />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
