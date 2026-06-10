"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";
import { useEffect, useState } from "react";
import { Panel } from "@/components/admin/Shell";

// tracks are loaded from /api/public/tracks
const STATE: Record<string, string> = { AVAILABLE: "Available", HELD: "On hold", ASSIGNED: "Assigned" };

export default function Page() {
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  async function fetchTracks() {
    try {
      const r = await fetch("/api/public/tracks");
      if (r.ok) setTracks(await r.json());
    } catch (_) { /* ignore */ }
  }
  useEffect(() => { void fetchTracks(); }, []);
  return (
    <AdminShell title="Portfolios">
      <IplAuctionHouses />
      <BulkAdd tracks={tracks} refreshTracks={fetchTracks} />
      <BulkDelete tracks={tracks} refreshTracks={fetchTracks} />
      <CrudManager
        endpoint="/api/admin/portfolios"
        bulkDelete={true}
        newLabel="Portfolio"
        hasPublished={false}
        columns={[
          { key: "name", label: "Portfolio", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "trackSlug", label: "Committee", render: (r) => tracks.find((t) => t.value === r.trackSlug)?.label || r.trackSlug },
          { key: "status", label: "Status", render: (r) => STATE[r.status] || r.status },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "trackSlug", label: "Committee", type: "select", options: tracks, required: true },
          { name: "name", label: "Portfolio (country / role)", required: true },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}

type HouseSummary = { house: number; total: number; available: number; held: number; assigned: number };

function IplAuctionHouses() {
  const [activeHouse, setActiveHouse] = useState<number>(1);
  const [houses, setHouses] = useState<HouseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [startHouse, setStartHouse] = useState(1);
  const [houseCount, setHouseCount] = useState(1);
  const [slotsPerHouse, setSlotsPerHouse] = useState(8);
  const [manualHouse, setManualHouse] = useState(1);
  const [deleteHouse, setDeleteHouse] = useState(1);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/portfolios/ipl-house", { cache: "no-store" });
    setLoading(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not load IPL house settings."); return; }
    setActiveHouse(Number(d.activeHouse || 1));
    setManualHouse(Number(d.activeHouse || 1));
    setDeleteHouse(Number(d.activeHouse || 1));
    setHouses(Array.isArray(d.houses) ? d.houses : []);
  }

  useEffect(() => { void load(); }, []);

  async function addHouses() {
    setMsg("");
    const res = await fetch("/api/admin/portfolios/ipl-houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startHouse, houseCount, slotsPerHouse, slotLabel: "Team Slot" })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not create house slots."); return; }
    setMsg(`Created ${d.created || 0} new IPL house slots.`);
    await load();
  }

  async function openNext() {
    setMsg("");
    const res = await fetch("/api/admin/portfolios/ipl-house", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "openNext" })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not open next house."); return; }
    setMsg(`House ${d.activeHouse} is now open for registrations.`);
    setActiveHouse(d.activeHouse);
    setManualHouse(d.activeHouse);
    setHouses(Array.isArray(d.houses) ? d.houses : []);
  }

  async function setManualActive() {
    setMsg("");
    const res = await fetch("/api/admin/portfolios/ipl-house", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeHouse: manualHouse })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not set active house."); return; }
    setMsg(`House ${d.activeHouse} is now active.`);
    setActiveHouse(d.activeHouse);
    setManualHouse(d.activeHouse);
    setDeleteHouse(d.activeHouse);
    setHouses(Array.isArray(d.houses) ? d.houses : []);
  }

  async function removeHouse() {
    setMsg("");
    if (!confirm(`Delete House ${deleteHouse}? This will remove all AVAILABLE slots in that house.`)) return;
    const res = await fetch("/api/admin/portfolios/ipl-house", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteHouse", house: deleteHouse })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not delete house."); return; }
    setMsg(`Deleted ${d.deleted || 0} slots from House ${deleteHouse}.`);
    setActiveHouse(d.activeHouse);
    setManualHouse(d.activeHouse);
    setDeleteHouse(d.activeHouse);
    setHouses(Array.isArray(d.houses) ? d.houses : []);
  }

  const activeSummary = houses.find((h) => h.house === activeHouse);

  return (
    <Panel title="IPL Auction Houses">
      <p className="mb-3 text-sm text-slatey">Use houses as registration batches for IPL Auction slots. Only the active house is shown to participants.</p>
      {loading ? <p className="text-sm text-slatey">Loading IPL house settings…</p> : (
        <div className="space-y-4">
          <div className="rounded-lg border border-ink/10 bg-cream p-3">
            <p className="text-sm font-600 text-ink">Active house: House {activeHouse}</p>
            {activeSummary ? (
              <p className="mt-1 text-xs text-slatey">Slots — total: {activeSummary.total}, available: {activeSummary.available}, held: {activeSummary.held}, assigned: {activeSummary.assigned}</p>
            ) : (
              <p className="mt-1 text-xs text-slatey">No slots found for this house yet.</p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <button onClick={openNext} className="rounded-full bg-gold px-4 py-2 text-sm font-600 text-midnight hover:bg-goldlite">Open Next House</button>
            <input type="number" min={1} value={manualHouse} onChange={(e) => setManualHouse(Number(e.target.value) || 1)} className="w-24 rounded-lg border border-ink/15 bg-cream px-3 py-2" />
            <button onClick={setManualActive} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-600 text-ink hover:bg-cream">Set Active House</button>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
            <label className="text-xs text-slatey">Start house
              <input type="number" min={1} value={startHouse} onChange={(e) => setStartHouse(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-slatey">How many houses
              <input type="number" min={1} value={houseCount} onChange={(e) => setHouseCount(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-slatey">Slots per house
              <input type="number" min={1} value={slotsPerHouse} onChange={(e) => setSlotsPerHouse(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
            </label>
            <button onClick={addHouses} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal">Add House Slots</button>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
            <label className="text-xs text-slatey">Delete house
              <input type="number" min={1} value={deleteHouse} onChange={(e) => setDeleteHouse(Number(e.target.value) || 1)} className="mt-1 w-28 rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
            </label>
            <button onClick={removeHouse} className="rounded-full bg-red-600 px-4 py-2 text-sm font-600 text-cream hover:bg-red-700">Delete House</button>
            <p className="text-xs text-red-700">Deletion is blocked for active, held, or assigned house slots.</p>
          </div>

          {houses.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-ink/10">
              <table className="w-full text-xs">
                <thead className="bg-cream text-left text-slatey">
                  <tr>
                    <th className="px-2 py-2">House</th>
                    <th className="px-2 py-2">Total</th>
                    <th className="px-2 py-2">Available</th>
                    <th className="px-2 py-2">Held</th>
                    <th className="px-2 py-2">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map((h) => (
                    <tr key={h.house} className={h.house === activeHouse ? "bg-[#D97706]/10" : ""}>
                      <td className="px-2 py-1.5">House {h.house}</td>
                      <td className="px-2 py-1.5">{h.total}</td>
                      <td className="px-2 py-1.5">{h.available}</td>
                      <td className="px-2 py-1.5">{h.held}</td>
                      <td className="px-2 py-1.5">{h.assigned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {msg && <p className="text-sm text-ink/70">{msg}</p>}
        </div>
      )}
    </Panel>
  );
}

function BulkDelete({ tracks, refreshTracks }: { tracks: { value: string; label: string }[]; refreshTracks: () => Promise<void> }) {
  const [trackSlug, setTrackSlug] = useState<string | undefined>(undefined);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { if (!trackSlug && tracks?.length) setTrackSlug(tracks[0].value); }, [tracks]);

  async function run() {
    setBusy(true); setMsg("");
    const names = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!names.length || !trackSlug) { setMsg("No committee selected or no portfolio names provided."); setBusy(false); return; }
    const res = await fetch("/api/admin/portfolios/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackSlug, names }) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setText("");
      setMsg(`Deleted ${d.deleted || 0}. ${d.notFound?.length ? `${d.notFound.length} not found` : ""}`);
      await refreshTracks();
    } else setMsg(d.error || "Bulk delete failed.");
  }

  return (
    <Panel title="Bulk delete portfolios">
      <p className="mb-3 text-sm text-slatey">Paste portfolio names (one per line) to archive them in the selected committee.</p>
      <div className="mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search committee" className="mb-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80" />
        <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80">
          {tracks.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase())).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={"United States\nUnited Kingdom\nFrance\n..."} className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 font-mono text-sm outline-none focus:border-gold" />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={busy} className="rounded-full bg-red-600 px-6 py-2.5 font-600 text-cream hover:bg-red-500 disabled:opacity-60">{busy ? "Deleting…" : "Delete portfolios"}</button>
        {msg && <p className="text-sm text-ink/70">{msg}</p>}
      </div>
    </Panel>
  );
}

function BulkAdd({ tracks, refreshTracks }: { tracks: { value: string; label: string }[]; refreshTracks: () => Promise<void> }) {
  const [trackSlug, setTrackSlug] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<"committee" | "csv">("committee");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => { if (!trackSlug && tracks?.length) setTrackSlug(tracks[0].value); }, [tracks]);

  async function run() {
    setBusy(true); setMsg("");
    if (mode === "committee" && !trackSlug) { setMsg("Choose a committee"); setBusy(false); return; }
    const body = { trackSlug, text };
    const res = await fetch("/api/admin/portfolios/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
      if (res.ok) {
      setText("");
      setMsg(`Added ${d.created}, skipped ${d.skipped} duplicate(s)${d.errors ? `, ${d.errors} error(s)` : ""}.`);
        await refreshTracks();
    } else setMsg(d.error || "Bulk import failed.");
  }

  return (
    <Panel title="Bulk add portfolios">
      <p className="mb-3 text-sm text-slatey">Paste a long list once instead of adding portfolios one by one. Duplicates are skipped automatically.</p>
      <div className="mb-3 flex gap-2">
        <button onClick={() => setMode("committee")} className={`rounded-full px-3 py-1.5 text-xs font-600 ${mode === "committee" ? "bg-midnight text-cream" : "border border-ink/15 text-ink/70"}`}>One committee · names</button>
        <button onClick={() => setMode("csv")} className={`rounded-full px-3 py-1.5 text-xs font-600 ${mode === "csv" ? "bg-midnight text-cream" : "border border-ink/15 text-ink/70"}`}>Mixed · committee, name</button>
      </div>
      {mode === "committee" && (
        <div className="mb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search committee" className="mb-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80" />
          <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="mb-3 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80">
            {tracks.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase())).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={8}
        placeholder={mode === "committee" ? "United States\nUnited Kingdom\nFrance\n..." : "unsc, United States\nunga, Brazil\nwar-cabinet, Minister of Defence\n..."}
        className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 font-mono text-sm outline-none focus:border-gold"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={busy} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">{busy ? "Importing…" : "Import portfolios"}</button>
        {msg && <p className="text-sm text-ink/70">{msg}</p>}
      </div>
    </Panel>
  );
}
