"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";
import { useEffect, useState } from "react";

function useTracks() {
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => { void (async () => { try { const r = await fetch("/api/public/tracks"); if (r.ok) setTracks(await r.json()); } catch (_) {} })(); }, []);
  return tracks;
}

export default function Page() {
  const tracks = useTracks();
  const opts = [{ value: "", label: "All committees" }, ...tracks];
  return (
    <AdminShell title="Promo codes">
      <CrudManager
        endpoint="/api/admin/promo-codes"
        newLabel="Promo code"
        hasPublished={false}
        columns={[
          { key: "code", label: "Code", render: (r) => <span className="font-mono font-600 text-ink">{r.code}</span> },
          { key: "kind", label: "Type", render: (r) => (r.kind === "FLAT" ? `₹${r.value.toLocaleString("en-IN")} off` : `${r.value}% off`) },
          { key: "uses", label: "Used", render: (r) => `${r.uses}${r.maxUses ? ` / ${r.maxUses}` : ""}` },
          { key: "appliesTo", label: "Scope", render: (r) => opts.find((t) => t.value === (r.appliesTo || ""))?.label || "All" },
          { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
          { key: "expiresAt", label: "Expires", render: (r) => (r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("en-IN") : "—") }
        ]}
        fields={[
          { name: "code", label: "Code (e.g. EARLYBIRD)", required: true },
          { name: "kind", label: "Discount type", type: "select", options: [{ value: "PERCENT", label: "Percent (%)" }, { value: "FLAT", label: "Flat (Rs off)" }] },
          { name: "value", label: "Value (percent 0-100, or rupees off e.g. 500 = ₹500)", type: "number", required: true },
          { name: "maxUses", label: "Max uses (blank = unlimited)", type: "number" },
          { name: "appliesTo", label: "Limit to committee", type: "select", options: opts },
          { name: "active", label: "Active", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
          { name: "expiresAt", label: "Expires at", type: "datetime-local" }
        ]}
      />
    </AdminShell>
  );
}
