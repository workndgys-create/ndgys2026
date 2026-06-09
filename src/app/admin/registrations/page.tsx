"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { StatusPill, Panel } from "@/components/admin/Shell";
import { downloadFileFromUrl } from "@/lib/download";

type Reg = {
  id: string; delegateId: string | null; fullName: string; email: string; phone: string;
  trackSlug: string; trackName: string; amount: number; status: string; source: string; createdAt: string;
};
type Resp = { items: Reg[]; total: number; page: number; pages: number };
type Track = { slug: string; name: string };

const TRACK_OPTS: Track[] = [
  { slug: "global-policy", name: "Global Policy Dialogue" },
  { slug: "climate", name: "Climate & Sustainability Forum" },
  { slug: "technology", name: "Technology & Society Lab" },
  { slug: "entrepreneurship", name: "Youth Entrepreneurship Track" },
  { slug: "human-rights", name: "Human Rights Council" },
  { slug: "press", name: "International Press Corps" },
  { slug: "leadership", name: "Leadership & Diplomacy Summit" },
  { slug: "crisis", name: "Continuous Crisis Committee" }
];

export default function RegistrationsPage() {
  const router = useRouter();
  const [data, setData] = useState<Resp | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [track, setTrack] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [badgeError, setBadgeError] = useState("");
  const [viewReg, setViewReg] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (track) sp.set("track", track);
    fetch(`/api/admin/registrations?${sp}`)
      .then(async (r) => {
        if (r.status === 401) return router.push("/admin/login");
        setData(await r.json());
      })
      .finally(() => setLoading(false));
  }, [q, status, track, page, router]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function changeStatus(id: string, next: string) {
    await fetch(`/api/admin/registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    load();
  }

  async function downloadBadge(id: string, delegateId?: string | null) {
    try {
      setBadgeError("");
      await downloadFileFromUrl(`/api/admin/badges?id=${id}`, `badge-${delegateId || id}.pdf`);
    } catch (error) {
      setBadgeError(error instanceof Error ? error.message : "Could not download badge.");
    }
  }

  async function viewRegistration(id: string) {
    setViewLoading(true);
    setViewReg(null);
    try {
      const r = await fetch(`/api/admin/registrations/${id}`);
      if (r.status === 401) return router.push("/admin/login");
      const data = await r.json();
      if (data.registration) setViewReg(data.registration);
      else setActionMessage("Could not load registration.");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to load registration.");
    } finally {
      setViewLoading(false);
    }
  }

  async function deleteRegistration(id: string) {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      const r = await fetch(`/api/admin/registrations/${id}`, { method: "DELETE" });
      if (r.status === 401) return router.push("/admin/login");
      const data = await r.json();
      if (r.ok && data.ok) {
        setData((cur) => cur ? { ...cur, items: cur.items.filter((it) => it.id !== id), total: cur.total - 1 } : cur);
        setActionMessage("Registration deleted.");
      } else {
        setActionMessage(data.error || "Failed to delete registration.");
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to delete registration.");
    }
    setTimeout(() => setActionMessage(""), 3000);
  }

  return (
    <AdminShell title="Registrations">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="Search name, email, delegate ID…"
          className="min-w-[220px] flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold">
          <option value="">All statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={track} onChange={(e) => { setPage(1); setTrack(e.target.value); }} className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold">
          <option value="">All tracks</option>
          {TRACK_OPTS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
        <a href="/api/admin/registrations/export" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-600 text-ink hover:border-gold">Export CSV</a>
        <button onClick={() => setShowAdd(true)} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal">+ Offline</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slatey">
            <tr>
              <Th>Delegate</Th><Th>Email</Th><Th>Track</Th><Th>Amount</Th><Th>Source</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-slatey">Loading…</td></tr>}
            {!loading && data?.items.map((r) => (
              <tr key={r.id} className="hover:bg-cream/60">
                <Td>
                  <div className="font-600 text-ink">{r.fullName}</div>
                  <div className="font-mono text-xs text-slatey">{r.delegateId || "—"}</div>
                </Td>
                <Td className="text-slatey">{r.email}<div className="text-xs">{r.phone}</div></Td>
                <Td>{r.trackName}</Td>
                <Td>₹{r.amount.toLocaleString("en-IN")}</Td>
                <Td><span className="text-xs uppercase tracking-wide text-slatey">{r.source}</span></Td>
                <Td><StatusPill s={r.status} /></Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => viewRegistration(r.id)} className="rounded-md border border-ink/15 px-2 py-1 text-xs font-600 text-ink hover:border-gold">View</button>
                    {r.delegateId && (
                      <button onClick={() => downloadBadge(r.id, r.delegateId)} className="rounded-md border border-ink/15 px-2 py-1 text-xs font-600 text-ink hover:border-gold">Badge</button>
                    )}
                    <select
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) changeStatus(r.id, e.target.value); e.target.value = ""; }}
                      className="rounded-md border border-ink/15 bg-cream px-2 py-1 text-xs"
                    >
                      <option value="">Set status…</option>
                      <option value="PAID">Mark Paid</option>
                      <option value="PENDING">Mark Pending</option>
                      <option value="CANCELLED">Mark Cancelled</option>
                    </select>
                    <button onClick={() => deleteRegistration(r.id)} className="ml-1 rounded-md bg-red-600 px-2 py-1 text-xs font-600 text-cream hover:bg-red-700">Delete</button>
                  </div>
                </Td>
              </tr>
            ))}
            {!loading && data?.items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slatey">No registrations match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slatey">Page {data.page} of {data.pages} · {data.total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-ink/15 px-4 py-1.5 disabled:opacity-40">Prev</button>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-ink/15 px-4 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showAdd && <OfflineModal tracks={TRACK_OPTS} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {badgeError && <p className="mt-3 text-sm text-red-600">{badgeError}</p>}
      {actionMessage && <p className="mt-3 text-sm text-slatey">{actionMessage}</p>}

      {viewReg !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewReg(null)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <Panel title={viewReg ? `Registration: ${viewReg.fullName}` : "Loading…"}>
              {viewLoading && !viewReg && <p className="text-slatey">Loading…</p>}
              {viewReg && (
                <div className="space-y-2 text-sm">
                  <div><strong>Full Name:</strong> {viewReg.fullName}</div>
                  <div><strong>Delegate ID:</strong> {viewReg.delegateId || "—"}</div>
                  <div><strong>Email:</strong> {viewReg.email}</div>
                  <div><strong>Phone:</strong> {viewReg.phone}</div>
                  <div><strong>Track:</strong> {viewReg.trackName}</div>
                  <div><strong>Amount:</strong> ₹{(viewReg.amount || 0).toLocaleString("en-IN")}</div>
                  <div><strong>Payment Status:</strong> {viewReg.status}</div>
                  <div><strong>Source:</strong> {viewReg.source}</div>
                  <div><strong>Registered At:</strong> {new Date(viewReg.createdAt).toLocaleString()}</div>
                  <div><strong>Day 1 Checked In:</strong> {viewReg.checkedInDay1 ? "Yes" : "No"}</div>
                  <div><strong>Day 2 Checked In:</strong> {viewReg.checkedInDay2 ? "Yes" : "No"}</div>
                  {viewReg.invoice && <div><strong>Invoice:</strong> #{viewReg.invoice.number} · ₹{viewReg.invoice.amount}</div>}
                  {viewReg.notes && <div><strong>Notes:</strong> {viewReg.notes}</div>}
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button onClick={() => setViewReg(null)} className="rounded-full border border-ink/15 px-4 py-2">Close</button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function OfflineModal({ tracks, onClose, onSaved }: { tracks: Track[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries()))
    });
    setSaving(false);
    if (res.ok) onSaved();
    else setErr((await res.json().catch(() => ({}))).error || "Could not save.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Panel title="Add offline registration">
          <form onSubmit={submit} className="space-y-3">
            <input name="fullName" required placeholder="Full name" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
            <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
            <input name="phone" placeholder="Phone (optional)" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
            <select name="track" required defaultValue="" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
              <option value="" disabled>Choose track…</option>
              {tracks.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
            <p className="text-xs text-slatey">Creates a PAID registration with a delegate ID and invoice on the next sync.</p>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2 text-sm">Cancel</button>
              <button disabled={saving} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-4 py-3">{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
