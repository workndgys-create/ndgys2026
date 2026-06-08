import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
export const metadata: Metadata = { title: "Privacy Policy — NDGYS 2026" };
export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <p>We collect the information you provide when registering — name, email, phone, institution and committee preference — solely to administer your participation in the Summit.</p>
      <h2>What we collect</h2>
      <p>Registration details, payment confirmation metadata from our payment processor (we never store card details), and any messages you send us.</p>
      <h2>How we use it</h2>
      <p>To process your registration, issue tickets and invoices, send you essential updates, and manage check-in. We do not sell your data.</p>
      <h2>Your choices</h2>
      <p>You can request access to or deletion of your data by writing to hi@nesummit.in.</p>
    </LegalPage>
  );
}
