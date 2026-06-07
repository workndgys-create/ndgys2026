"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/Shell";

type Msg = { id: string; fullName: string; email: string; phone: string | null; subject: string; message: string; handled: boolean; createdAt: string };

export default function MessagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Msg[] | null>(null);
  const [filter, setFilter] = useState<"all" | "open">("open");

  function load() {
    fetch("/api/admin/messages")
      .then(async (r) => {
        if (r.status === 401) return router.push("/admin/login");
        setItems((await r.json()).messages);
      });
  }
  useEffect(load, [router]);

  async function toggle(id: string, handled: boolean) {
    setItems((cur) => cur?.map((m) => (m.id === id ? { ...m, handled } : m)) ?? cur);
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled })
    });
  }

  const shown = items?.filter((m) => (filter === "open" ? !m.handled : true)) ?? [];

  return (
    <AdminShell title="Messages">
      <div className="mb-4 flex gap-2">
        <Tab active={filter === "open"} onClick={() => setFilter("open")}>Open</Tab>
        <Tab active={filter === "all"} onClick={() => setFilter("all")}>All</Tab>
      </div>

      {!items ? (
        <p className="text-slatey">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 bg-paper p-8 text-center text-slatey">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((m) => (
            <article key={m.id} className={`rounded-2xl border bg-paper p-5 ${m.handled ? "border-ink/10 opacity-70" : "border-gold/40"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-600 text-ink">{m.fullName} <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs text-slatey">{m.subject}</span></p>
                  <p className="text-sm text-slatey">
                    <a className="hover:text-ink" href={`mailto:${m.email}`}>{m.email}</a>
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                <time className="text-xs text-slatey">{new Date(m.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink/85">{m.message}</p>
              <div className="mt-4 flex gap-2">
                <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="rounded-full bg-midnight px-4 py-1.5 text-xs font-600 text-cream hover:bg-royal">Reply</a>
                <button onClick={() => toggle(m.id, !m.handled)} className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-600 hover:border-gold">
                  {m.handled ? "Mark open" : "Mark handled"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

const Tab = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-500 ${active ? "bg-midnight text-cream" : "border border-ink/15 bg-paper text-ink/70"}`}>{children}</button>
);
