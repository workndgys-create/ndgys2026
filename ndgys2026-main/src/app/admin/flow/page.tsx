"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Event Flow">
      <CrudManager
        endpoint="/api/admin/schedule"
        newLabel="Flow item"
        columns={[
          { key: "day", label: "Day" },
          { key: "time", label: "Time", render: (r) => `${r.startTime}–${r.endTime}` },
          { key: "title", label: "Title", render: (r) => <span className="font-600 text-ink">{r.title}</span> },
          { key: "room", label: "Room", render: (r) => r.room || "—" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "day", label: "Day (1 or 2)", type: "number", required: true },
          { name: "startTime", label: "Start (e.g. 09:30)", required: true },
          { name: "endTime", label: "End (e.g. 11:00)", required: true },
          { name: "title", label: "Title", required: true },
          { name: "room", label: "Room" },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
