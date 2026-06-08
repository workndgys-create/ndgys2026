"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Events">
      <CrudManager
        endpoint="/api/admin/events"
        newLabel="Event"
        columns={[
          { key: "title", label: "Title", render: (r) => <span className="font-600 text-ink">{r.title}</span> },
          { key: "kind", label: "Kind" },
          { key: "venue", label: "Venue", render: (r) => r.venue || "—" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "kind", label: "Kind", type: "select", options: [
            { value: "keynote", label: "Keynote" }, { value: "workshop", label: "Workshop" },
            { value: "social", label: "Social" }, { value: "ceremony", label: "Ceremony" }
          ]},
          { name: "summary", label: "Summary", type: "textarea", required: true },
          { name: "venue", label: "Venue" },
          { name: "startsAt", label: "Starts", type: "datetime-local" },
          { name: "endsAt", label: "Ends", type: "datetime-local" },
          { name: "imageUrl", label: "Image URL", type: "url" },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
