"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";
import { downloadFileFromUrl } from "@/lib/download";

const DEFAULT_OPTION: [string, string] = ["", "All committees & competitions"];

export default function BadgesPage() {
  const [track, setTrack] = useState("");
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const [rTracks, rComps] = await Promise.all([
          fetch("/api/public/tracks"),
          fetch("/api/admin/competitions")
        ]);
        let unified: { value: string; label: string }[] = [];
        if (rTracks.ok) {
          const t = await rTracks.json();
          unified = unified.concat(t.map((x: any) => ({ value: x.value, label: `${x.label} (MUN)` })));
        }
        if (rComps.ok) {
          const c = await rComps.json();
          unified = unified.concat((c.items || []).map((x: any) => ({ value: x.slug, label: `${x.title} (Competition)` })));
        }
        setTracks(unified);
      } catch (_) { /* ignore */ }
    })();
  }, []);
  const href = `/api/admin/badges${track ? `?track=${track}` : ""}`;
  const [error, setError] = useState("");

  async function downloadBadges() {
    try {
      setError("");
      await downloadFileFromUrl(href, `badges${track ? `-${track}` : ""}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download badges.");
    }
  }

  return (
    <AdminShell title="Badges">
      <Panel title="Generate attendee badges">
        <p className="text-sm text-slatey">Badges include the attendee's name, committee or competition, assigned portfolio (for MUN), delegate ID, and a check-in QR. Download a print-ready PDF (one badge per page).</p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-500 text-ink/80">Committee / Competition</label>
            <select value={track} onChange={(e) => setTrack(e.target.value)} className="mt-1 block rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
              <option key={DEFAULT_OPTION[0]} value={DEFAULT_OPTION[0]}>{DEFAULT_OPTION[1]}</option>
              {tracks.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button onClick={downloadBadges} className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal">Download badges (PDF)</button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-xs text-slatey">Only PAID attendees with an assigned delegate ID / ref ID are included. Assign portfolios under <b>Allocations</b> first if you want them printed on MUN badges.</p>
      </Panel>
    </AdminShell>
  );
}
