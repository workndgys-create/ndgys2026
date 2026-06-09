"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Speakers">
      <CrudManager
        endpoint="/api/admin/speakers"
        newLabel="Speaker"
        hasPublished={false}
        columns={[
          { key: "name", label: "Name", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "title", label: "Title" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "title", label: "Title / role", required: true },
          { name: "bio", label: "Bio", type: "textarea" },
          { name: "imageUrl", label: "Photo URL", type: "url" },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
