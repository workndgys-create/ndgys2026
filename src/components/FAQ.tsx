import SectionKicker from "./SectionKicker";
import FAQClient from "./FAQClient";
import { getAllSettings } from "../lib/settings";

export default async function FAQ() {
  const settings = await getAllSettings();
  const venueRevealed = settings["venue.revealed"] === "true" || settings["venue.revealed"] === true;
  const venueName = settings["venue.name"] || settings["venue.displayName"] || "IIT Delhi";

  return (
    <section id="faq" className="bg-cream grain py-28">
      <div className="mx-auto max-w-3xl px-5">
        <SectionKicker label="DISPATCH — 04" />
        <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">
          GOT <span className="text-gold">QUESTIONS?</span>
        </h2>
        <p className="mt-3 text-sm text-slatey">Have queries about participation, fees, or timeline? We've got you covered.</p>

        <FAQClient venueRevealed={venueRevealed} venueName={venueName} />
      </div>
    </section>
  );
}
