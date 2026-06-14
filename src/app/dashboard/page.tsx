import Link from "next/link";
import { currentDelegate, allDelegateRegistrations } from "@/lib/delegateSession";
import Countdown from "@/components/dashboard/Countdown";
import LiveAnnouncements from "@/components/dashboard/LiveAnnouncements";
import OverviewRegistrations from "@/components/dashboard/OverviewRegistrations";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const reg = await currentDelegate();
  if (!reg) return null; // middleware redirects; safety net

  const regs = await allDelegateRegistrations();
  const paid = reg.status === "PAID";
  return (
    <div>
      <h1 className="font-display text-3xl font-700 text-ink">Welcome, {reg.fullName.split(" ")[0]}.</h1>
      <p className="mt-1 text-ink/70">New Delhi Global Youth Summit · 22–23 August 2026</p>

      <OverviewRegistrations currentId={reg.id} registrations={regs} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slatey">Status</p>
          <p className={`mt-2 font-display text-2xl font-700 ${paid ? "text-green-700" : "text-amber-600"}`}>{reg.status}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slatey">Event</p>
          <p className="mt-2 font-display text-lg font-700 text-ink">{reg.trackName}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slatey">Participant ID</p>
          <p className="mt-2 font-mono text-lg font-700 text-ink">{reg.delegateId ?? "—"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-midnight p-6 text-cream">
        <p className="text-xs uppercase tracking-wider text-gold">Countdown to opening</p>
        <Countdown target="2026-08-22T09:00:00+05:30" />
      </div>

      {!paid && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-sm text-amber-800">Your payment is pending. Complete it to lock your seat.</p>
          <Link href="/register" className="rounded-full bg-gold px-5 py-2.5 text-sm font-600 text-midnight">Complete payment</Link>
        </div>
      )}

      <LiveAnnouncements />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/ticket" className="rounded-2xl border border-ink/10 bg-paper p-5 hover:border-gold">
          <p className="font-display text-lg font-700 text-ink">Pass & QR →</p>
          <p className="mt-1 text-sm text-ink/65">Show this at check-in.</p>
        </Link>
        <Link href="/dashboard/registration" className="rounded-2xl border border-ink/10 bg-paper p-5 hover:border-gold">
          <p className="font-display text-lg font-700 text-ink">Invoice & details →</p>
          <p className="mt-1 text-sm text-ink/65">Download your PDF invoice.</p>
        </Link>
      </div>
    </div>
  );
}
