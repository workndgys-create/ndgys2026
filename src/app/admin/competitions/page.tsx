"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";

export default function Page() {
  return (
    <AdminShell title="Competitions">
      <CrudManager
        endpoint="/api/admin/competitions"
        newLabel="Competition"
        columns={[
          { key: "title", label: "Title", render: (r) => <span className="font-600 text-ink">{r.title}</span> },
          { key: "format", label: "Format" },
          { key: "reg", label: "Reg", render: (r) => (r.registrationOpen ? "Open" : "Closed") },
          { key: "fees", label: "Fees (Rs)", render: (r) => [r.feeSolo ? `solo ₹${r.feeSolo}` : null, r.feeGroup ? `group ₹${r.feeGroup}` : null].filter(Boolean).join(" / ") || "—" },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "category", label: "Category", placeholder: "e.g. Debate, Quiz, Hackathon" },
          { name: "summary", label: "Summary", type: "textarea", required: true },
          { name: "description", label: "Description", type: "textarea" },
          { name: "prize", label: "Prize", placeholder: "₹25,000 + trophy" },
          { name: "ctaUrl", label: "Info link (optional)", type: "url" },
          { name: "imageUrl", label: "Image URL", type: "url" },
          { name: "date", label: "Date", type: "datetime-local" },
          { name: "format", label: "Format", type: "select", options: [
            { value: "SOLO", label: "Solo only" }, { value: "GROUP", label: "Group only" }, { value: "BOTH", label: "Solo or Group" }
          ]},
          { name: "feeSolo", label: "Solo fee (Rs, e.g. 200)", type: "number" },
          { name: "feeGroup", label: "Group fee per team (Rs)", type: "number" },
          { name: "minTeam", label: "Min team size", type: "number" },
          { name: "maxTeam", label: "Max team size", type: "number" },
          { name: "registrationOpen", label: "Registration", type: "select", options: [
            { value: "true", label: "Open" }, { value: "false", label: "Closed" }
          ]},
          { name: "questionsText", label: "Custom questions (one per line, shown on the entry form)", type: "textarea" },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}
