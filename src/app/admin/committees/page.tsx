"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function CommitteesPage() {
  return (
    <AdminShell title="Committees">
      <CrudManager
        endpoint="/api/admin/tracks"
        newLabel="Committee"
        hasPublished={false}
        columns={[
          { key: "name", label: "Committee", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "slug", label: "Slug" },
          { key: "fee", label: "Price (Rs)", render: (r) => `Rs ${Number(r.fee || 0).toLocaleString("en-IN")}` },
          { key: "capacity", label: "Capacity" },
          { key: "difficulty", label: "Level" },
          { key: "isOpen", label: "Status", render: (r) => (r.isOpen ? "Open" : "Closed") }
        ]}
        fields={[
          { name: "slug", label: "Slug", required: true, placeholder: "e.g. unsc" },
          { name: "name", label: "Committee name", required: true },
          { name: "fee", label: "Price in rupees", type: "number", required: true },
          { name: "capacity", label: "Capacity", type: "number" },
          { name: "difficulty", label: "Difficulty", type: "select", options: [
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" }
          ] },
          { name: "isOpen", label: "Registration", type: "select", options: [
            { value: "true", label: "Open" },
            { value: "false", label: "Closed" }
          ] },
          { name: "agenda", label: "Agenda", type: "textarea", placeholder: "Optional agenda/description" }
        ]}
      />
    </AdminShell>
  );
}
