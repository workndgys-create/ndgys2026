import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Code of Conduct & Safety — NDGYS 2026", description: "Code of conduct, anti-harassment and safety policy for the New Delhi Global Youth Summit 2026, including how to raise a grievance." };

export default async function CodeOfConduct() {
  const [email, phone] = await Promise.all([getSetting("safety.grievanceEmail"), getSetting("safety.grievancePhone")]);
  return (
    <LegalPage title="Code of Conduct & Safety" updated="June 2026">
      <p>The New Delhi Global Youth Summit is committed to a safe, respectful and inclusive environment for every delegate, volunteer, mentor and guest — many of whom are students and minors. By participating, everyone agrees to uphold this Code.</p>

      <h2>Expected behaviour</h2>
      <p>Treat all participants with courtesy and respect. Engage in debate and competition with integrity and good faith. Follow the rules of procedure, the instructions of the organising team, and all venue rules at IIT Delhi.</p>

      <h2>Zero tolerance for harassment</h2>
      <p>We do not tolerate harassment, bullying, intimidation, discrimination or abuse of any kind — including on the basis of gender, gender identity, sexual orientation, disability, appearance, race, ethnicity, religion or any other characteristic. This includes unwelcome physical contact, sexual attention or advances, demeaning comments, stalking, photography or recording without consent, and sustained disruption of sessions.</p>

      <h2>Protection of minors</h2>
      <p>Delegates under 18 register with the consent and contact details of a parent or guardian. Adults at the event must maintain appropriate, transparent and professional boundaries with minors at all times. Any concern relating to the safety of a minor is treated as the highest priority.</p>

      <h2>Safety on site</h2>
      <p>Carry a valid photo ID and your delegate QR. Wear your badge at all times within the venue. Follow emergency and evacuation instructions from the organising team and venue staff. Report anything that feels unsafe immediately to a member of the organising team.</p>

      <h2>Anti-substance & prohibited items</h2>
      <p>Alcohol, tobacco, drugs and any prohibited or dangerous items are not permitted at the venue. Participants found in violation may be removed without refund and, where appropriate, reported to the relevant authorities.</p>

      <h2>Consequences</h2>
      <p>Violations may result in a warning, removal from a session or committee, removal from the event without refund, a bar from future editions, and — where the law requires — referral to the authorities. The organising team's decisions on conduct are final.</p>

      <h2>Raising a concern or grievance</h2>
      <p>If you experience or witness a breach of this Code, or have any safety concern, please contact the organising team's safety desk immediately. Reports are handled discreetly and taken seriously.</p>
      <p>
        Safety &amp; grievance desk:<br />
        Email: <a href={`mailto:${email}`} className="text-gold underline">{email}</a><br />
        Phone: <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-gold underline">{phone}</a>
      </p>
      <p className="text-sm text-slatey">For an emergency at the venue, alert the nearest organising-team member or volunteer right away, and call local emergency services (112) if there is an immediate risk to safety.</p>
    </LegalPage>
  );
}
