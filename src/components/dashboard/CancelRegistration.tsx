"use client";
import { useState } from "react";

export default function CancelRegistration({ status }: { status: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<null | { refundNote: boolean; promoted: boolean }>(null);
  const [busy, setBusy] = useState(false);

  if (status === "CANCELLED") return <p className="mt-6 text-sm text-slatey">This registration has been cancelled.</p>;
  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-ink/10 bg-paper p-4 text-sm text-ink/80">
        Your registration has been cancelled and your portfolio released.
        {done.refundNote && " Our team will process any eligible refund per the refund policy."}
      </div>
    );
  }

  async function cancel() {
    setBusy(true);
    const res = await fetch("/api/delegate/cancel", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone({ refundNote: !!d.refundNote, promoted: !!d.promoted });
  }

  return (
    <div className="mt-8 border-t border-ink/10 pt-5">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-600 text-red-600 hover:underline">Cancel my registration</button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Cancelling releases your portfolio and frees your seat. This can't be undone. Refunds, if any, follow the refund policy.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={cancel} disabled={busy} className="rounded-full bg-red-600 px-4 py-2 text-sm font-600 text-white hover:bg-red-700 disabled:opacity-60">{busy ? "Cancelling…" : "Yes, cancel"}</button>
            <button onClick={() => setOpen(false)} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-600 text-ink">Keep my seat</button>
          </div>
        </div>
      )}
    </div>
  );
}
