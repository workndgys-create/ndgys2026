"use client";
import { useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";
import { downloadFileFromUrl } from "@/lib/download";

const TRACKS: [string, string][] = [
  ["", "All committees"],
  ["global-policy", "Global Policy Dialogue"], ["climate", "Climate & Sustainability Forum"],
  ["technology", "Technology & Society Lab"], ["entrepreneurship", "Youth Entrepreneurship Track"],
  ["human-rights", "Human Rights Council"], ["press", "International Press Corps"],
  ["leadership", "Leadership & Diplomacy Summit"], ["crisis", "Continuous Crisis Committee"]
];

export default function BadgesPage() {
  const [track, setTrack] = useState("");
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
              {TRACKS.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
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
