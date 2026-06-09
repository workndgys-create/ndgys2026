"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Sponsors & partners">
      <CrudManager
        endpoint="/api/admin/sponsors"
        newLabel="Sponsor"
        columns={[
          { key: "name", label: "Name", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "tier", label: "Tier", render: (r) => r.tier || "—" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "logoUrl", label: "Logo URL", type: "url" },
          { name: "websiteUrl", label: "Website URL", type: "url" },
          { name: "tier", label: "Tier", type: "select", options: [
            { value: "Title", label: "Title" }, { value: "Gold", label: "Gold" }, { value: "Partner", label: "Partner" }, { value: "Community", label: "Community" }
          ]},
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
