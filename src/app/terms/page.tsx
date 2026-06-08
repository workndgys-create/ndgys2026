import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
export const metadata: Metadata = { title: "Terms of Service — NDGYS 4.0" };
export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="June 2026">
      <p>By registering for the New Delhi Global Youth Summit 4.0, you agree to the following terms.</p>
      <h2>Registration</h2>
      <p>Registration is confirmed only on successful payment. Committee seats are assigned on a first-come basis and subject to availability.</p>
      <h2>Conduct</h2>
      <p>Delegates are expected to maintain decorum and follow the rules of procedure. The organisers may remove participants who violate the code of conduct.</p>
      <h2>Changes</h2>
      <p>The programme, speakers and schedule may change. We will communicate material changes by email.</p>
    </LegalPage>
  );
}
