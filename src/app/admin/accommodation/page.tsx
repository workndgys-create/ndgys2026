"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Stay & travel">
      <CrudManager
        endpoint="/api/admin/accommodation"
        newLabel="Listing"
        columns={[
          { key: "name", label: "Name", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "kind", label: "Type" },
          { key: "distance", label: "Distance", render: (r) => r.distance || "—" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "kind", label: "Type", type: "select", options: [
            { value: "Hotel", label: "Hotel / Stay" }, { value: "Travel", label: "Travel / Getting here" }, { value: "Nearby", label: "Nearby / Food" }
          ]},
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "address", label: "Address" },
          { name: "distance", label: "Distance from venue (e.g. 1.2 km)" },
          { name: "priceRange", label: "Price range (e.g. ₹3,000–5,000/night)" },
          { name: "url", label: "Booking / info URL", type: "url" },
          { name: "imageUrl", label: "Image URL", type: "url" },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
