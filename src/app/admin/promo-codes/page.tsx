"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

const TRACK_OPTIONS = [
  { value: "", label: "All committees" },
  { value: "global-policy", label: "Global Policy Dialogue" }, { value: "climate", label: "Climate & Sustainability Forum" },
  { value: "technology", label: "Technology & Society Lab" }, { value: "entrepreneurship", label: "Youth Entrepreneurship Track" },
  { value: "human-rights", label: "Human Rights Council" }, { value: "press", label: "International Press Corps" },
  { value: "leadership", label: "Leadership & Diplomacy Summit" }, { value: "crisis", label: "Continuous Crisis Committee" }
];

export default function Page() {
  return (
    <AdminShell title="Promo codes">
      <CrudManager
        endpoint="/api/admin/promo-codes"
        newLabel="Promo code"
        hasPublished={false}
        columns={[
          { key: "code", label: "Code", render: (r) => <span className="font-mono font-600 text-ink">{r.code}</span> },
          { key: "kind", label: "Type", render: (r) => (r.kind === "FLAT" ? `₹${(r.value / 100).toLocaleString("en-IN")} off` : `${r.value}% off`) },
          { key: "uses", label: "Used", render: (r) => `${r.uses}${r.maxUses ? ` / ${r.maxUses}` : ""}` },
          { key: "appliesTo", label: "Scope", render: (r) => TRACK_OPTIONS.find((t) => t.value === (r.appliesTo || ""))?.label || "All" },
          { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
          { key: "expiresAt", label: "Expires", render: (r) => (r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("en-IN") : "—") }
        ]}
        fields={[
          { name: "code", label: "Code (e.g. EARLYBIRD)", required: true },
          { name: "kind", label: "Discount type", type: "select", options: [{ value: "PERCENT", label: "Percent (%)" }, { value: "FLAT", label: "Flat (paise off)" }] },
          { name: "value", label: "Value (percent 0-100, or paise off e.g. 50000 = ₹500)", type: "number", required: true },
          { name: "maxUses", label: "Max uses (blank = unlimited)", type: "number" },
          { name: "appliesTo", label: "Limit to committee", type: "select", options: TRACK_OPTIONS },
          { name: "active", label: "Active", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
          { name: "expiresAt", label: "Expires at", type: "datetime-local" }
        ]}
      />
    </AdminShell>
  );
}
