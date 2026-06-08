import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
export const metadata: Metadata = { title: "Refund Policy — NDGYS 4.0" };
export default function Refund() {
  return (
    <LegalPage title="Refund Policy" updated="June 2026">
      <p>We want you to register with confidence. The following refund terms apply to delegate fees.</p>
      <h2>Cancellations</h2>
      <p>Cancellations made more than 30 days before the Summit are eligible for a full refund less processing fees. Within 30 days, refunds are at the organisers' discretion.</p>
      <h2>How refunds are issued</h2>
      <p>Approved refunds are returned to your original payment method via our payment processor, typically within 5–7 business days.</p>
      <h2>Requesting a refund</h2>
      <p>Email hi@nesummit.in with your delegate ID and reason for cancellation.</p>
    </LegalPage>
  );
}
