"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";
import { downloadFileFromUrl } from "@/lib/download";

const DEFAULT_OPTION: [string, string] = ["", "All committees"];

export default function BadgesPage() {
  const [track, setTrack] = useState("");
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/public/tracks");
        if (r.ok) setTracks(await r.json());
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
      <Panel title="Generate delegate badges">
        <p className="text-sm text-slatey">Badges include the delegate's name, committee, assigned portfolio, delegate ID and a check-in QR. Download a print-ready PDF (one badge per page).</p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-500 text-ink/80">Committee</label>
            <select value={track} onChange={(e) => setTrack(e.target.value)} className="mt-1 block rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
              <option key={DEFAULT_OPTION[0]} value={DEFAULT_OPTION[0]}>{DEFAULT_OPTION[1]}</option>
              {tracks.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button onClick={downloadBadges} className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal">Download badges (PDF)</button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-xs text-slatey">Only PAID delegates with an assigned delegate ID are included. Assign portfolios under <b>Allocations</b> first if you want them printed on the badge.</p>
      </Panel>
    </AdminShell>
  );
}
