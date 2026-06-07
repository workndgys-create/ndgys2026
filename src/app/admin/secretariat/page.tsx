"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Secretariat">
      <CrudManager
        endpoint="/api/admin/secretariat"
        newLabel="Member"
        columns={[
          { key: "name", label: "Name", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "role", label: "Role" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "role", label: "Role / designation", required: true },
          { name: "photoUrl", label: "Photo URL", type: "url" },
          { name: "bio", label: "Short bio", type: "textarea" },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
