import { currentDelegate } from "@/lib/delegateSession";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CancelRegistration from "@/components/dashboard/CancelRegistration";

export const dynamic = "force-dynamic";

export default async function RegistrationPage() {
  const reg = await currentDelegate();
  if (!reg) return null;
  const invoice = await prisma.invoice.findUnique({ where: { registrationId: reg.id } });

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between border-b border-ink/5 py-3 text-sm"><span className="text-slatey">{k}</span><span className="font-500 text-ink">{v}</span></div>
  );

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-700 text-ink">My Registration</h1>
      <div className="mt-6 rounded-2xl border border-ink/10 bg-paper p-6">
        <Row k="Delegate ID" v={reg.delegateId ?? "—"} />
        <Row k="Track" v={reg.trackName} />
        <Row k="Portfolio / Allotment" v={reg.portfolio ?? "To be announced"} />
        <Row k="Amount" v={`₹${reg.amount.toLocaleString("en-IN")}`} />
        <Row k="Status" v={reg.status} />
        <Row k="Invoice No." v={invoice?.number ?? "—"} />
      </div>

      {invoice ? (
        <a href="/api/delegate/invoice" className="mt-5 inline-block rounded-full bg-gold px-6 py-3 font-600 text-midnight hover:bg-goldlite">Download Invoice (PDF)</a>
      ) : (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Invoice is generated after payment. <Link href="/register" className="font-600 underline">Complete payment</Link>
        </div>
      )}

      <CancelRegistration status={reg.status} />
    </div>
  );
}
