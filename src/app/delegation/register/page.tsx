"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

declare global {
  interface Window { Cashfree?: any; }
}
function loadCashfree(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Cashfree) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Member = { fullName: string; email: string; phone: string; track: string; age: string; experience?: string; photoData?: string; photoMime?: string; guardianName?: string; guardianPhone?: string; guardianConsent?: boolean };

export default function DelegationRegisterPage() {
  const BEGINNER_CLIENT = new Set<string>(["unep", "aippm"]);
  const [members, setMembers] = useState<Member[]>([ 
    { fullName: "", email: "", phone: "", track: "", age: "", experience: "beginner", photoData: "", photoMime: "", guardianName: "", guardianPhone: "", guardianConsent: false },
    { fullName: "", email: "", phone: "", track: "", age: "", experience: "beginner", photoData: "", photoMime: "", guardianName: "", guardianPhone: "", guardianConsent: false }
  ]);
  const [tracks, setTracks] = useState<{ value: string; label: string; fee?: number }[]>([]);
  const [committeeSearch, setCommitteeSearch] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");
  const [consent, setConsent] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<"idle" | "processing" | "paid" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const feeOf = (slug: string) => tracks.find((t) => t.value === slug)?.fee ?? 0;
  const subtotal = useMemo(() => members.reduce((s, m) => s + feeOf(m.track), 0), [members]);
  const total = Math.max(0, subtotal - discount);

  function addMember() { if (members.length < 40) setMembers((m) => [...m, { fullName: "", email: "", phone: "", track: tracks[0]?.value || "", age: "", experience: "beginner", photoData: "", photoMime: "" }]); }
  function removeMember(i: number) { if (members.length > 1) setMembers((m) => m.filter((_, idx) => idx !== i)); }
  function setM(i: number, k: keyof Member, v: any) { setMembers((m) => m.map((mm, idx) => (idx === i ? { ...mm, [k]: v } : mm))); }

  function matchTrack(token: string): string {
    const t = token.trim().toLowerCase();
    const bySlug = tracks.find((x) => x.value.toLowerCase() === t);
    if (bySlug) return bySlug.value;
    const byName = tracks.find((x) => x.label.toLowerCase() === t || x.label.toLowerCase().includes(t));
    return byName ? byName.value : (tracks[0]?.value || "");
  }

  function importBulk() {
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: Member[] = [];
      for (const line of lines) {
      const cols = line.split(/[\t,;]+/).map((c) => c.trim()).filter(Boolean);
      if (!cols.length) continue;
      const emailCol = cols.find((c) => c.includes("@")) || "";
      const phoneCol = cols.find((c) => /^[+]?[0-9\s-]{8,15}$/.test(c)) || "";
      const name = cols[0];
      // committee = last column that is neither the name, email nor phone
      const committeeCol = [...cols].reverse().find((c) => c !== name && c !== emailCol && c !== phoneCol) || "";
      parsed.push({ fullName: name, email: emailCol, phone: phoneCol, track: committeeCol ? matchTrack(committeeCol) : (tracks[0]?.value || ""), age: "", photoData: "", photoMime: "" });
    }
    if (!parsed.length) { setBulkMsg("Could not read any rows."); return; }
    setMembers(parsed.slice(0, 40));
    setBulkMsg(`Loaded ${Math.min(parsed.length, 40)} delegate(s). Review committees below, then pay.`);
    setBulkOpen(false);
  }

  async function applyPromo() {
    setPromoMsg("");
    if (!promo.trim()) { setDiscount(0); return; }
    const res = await fetch("/api/promo/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promo, amount: subtotal }) });
    const d = await res.json().catch(() => ({}));
    if (d.ok) { setDiscount(d.discount); setPromoMsg(`Code applied - you save Rs ${d.discount.toLocaleString("en-IN")}.`); }
    else { setDiscount(0); setPromoMsg("That code can't be applied."); }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("processing"); setMessage(""); setErrors({});
    if (!consent) { setMessage("Please accept the Terms and Code of Conduct to continue."); setStatus("error"); return; }
    const fd = new FormData(e.currentTarget);
    
    // Check if any member has missing photo
    const missingPhoto = members.some((m) => !m.photoData || !m.photoMime);
    if (missingPhoto) {
      setMessage("Please upload a passport size photo for all delegates.");
      setStatus("error");
      return;
    }

      const payload: Record<string, unknown> = {
      schoolName: fd.get("schoolName"), headName: fd.get("headName"), email: fd.get("email"),
      phone: fd.get("phone"), institution: fd.get("institution") || "",
      promoCode: promo.trim() || "", consentAccepted: consent, company: fd.get("company") || "",
      members: members.filter((m) => m.fullName.trim()).map((m) => ({
        fullName: m.fullName.trim(),
        email: m.email.trim(),
        phone: m.phone.trim(),
        track: m.track,
        age: Number(m.age),
        photoData: m.photoData,
        photoMime: m.photoMime,
        guardianName: m.guardianName || "",
        guardianPhone: m.guardianPhone || "",
        guardianConsent: !!m.guardianConsent
      }))
    };

    const res = await fetch("/api/delegation/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.status === 409) { const d = await res.json().catch(() => ({})); setMessage(d.error || "A portfolio conflict occurred."); setStatus("error"); return; }
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErrors(d.issues || {}); setMessage(d.error || "Please check the form."); setStatus("error"); return; }

    const order = await res.json();
    if (!(await loadCashfree())) { setMessage("Could not load the payment gateway."); setStatus("error"); return; }
    const cashfree = window.Cashfree({ mode: order.mode || "sandbox" });
    const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });
    if (result?.error) { setStatus("idle"); return; }
    const v = await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId }) });
    if (v.ok) setStatus("paid");
    else if (v.status === 202) { setMessage("Payment is processing — confirmation emails will arrive shortly if it succeeded."); setStatus("error"); }
    else { setMessage("Payment could not be verified. If charged, contact us."); setStatus("error"); }
  }

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/public/tracks');
        if (r.ok) {
          const t = await r.json(); setTracks(t);
          if (members.length && !members[0].track && t.length) setMembers((m) => m.map((mm) => ({ ...mm, track: t[0].value, experience: mm.experience ?? "beginner" })));
        }
      } catch (_) {}
    })();
  }, []);

  if (status === "paid") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream grain px-5 py-16">
        <div className="text-center">
          <p className="font-display text-5xl">&#127881;</p>
          <h1 className="mt-4 font-display text-4xl font-700 text-ink">Delegation confirmed!</h1>
          <p className="mt-3 max-w-md text-ink/70">Each delegate will receive their own ticket by email and can sign in to their dashboard using their registered email. Any portfolios selected during registration are assigned automatically.</p>
          <Link href="/" className="mt-8 inline-block rounded-full bg-midnight px-6 py-3 font-600 text-cream hover:bg-royal">Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream grain px-5 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/register" className="text-sm text-gold hover:underline">&larr; Individual registration</Link>
        <h1 className="mt-3 font-display text-4xl font-700 text-ink">School / Delegation Registration</h1>
        <p className="mt-2 text-ink/70">Register and pay for your whole delegation in one go. Each delegate gets their own ticket and dashboard login.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-ink/10 bg-paper p-7 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="schoolName" label="School / Institution" errors={errors} />
            <Field name="headName" label="Lead contact name" errors={errors} />
            <Field name="email" type="email" label="Lead contact email" errors={errors} />
            <Field name="phone" label="Phone number" errors={errors} />
          </div>
          <Field name="institution" label="Address / city (optional)" errors={errors} />
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-500 text-ink/80">Delegates ({members.length})</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setBulkOpen((v) => !v)} className="text-sm font-600 text-gold hover:underline">Bulk add</button>
                <button type="button" onClick={addMember} disabled={members.length >= 40} className="text-sm font-600 text-gold hover:underline disabled:opacity-40">+ Add delegate</button>
              </div>
            </div>
            {bulkOpen && (
              <div className="mt-2 rounded-xl border border-gold/40 bg-goldlite/10 p-3">
                <p className="text-xs text-ink/70">Paste one delegate per line as <b>Name, Number, Committee</b> (email optional). Tabs, commas or semicolons all work — great for pasting straight from a spreadsheet.</p>
                <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={6} placeholder={"Asha Verma, 9876543210, Climate\nRavi Kumar, 9876500000, Crisis Committee\nMeera S, meera@school.edu, 9811111111, Human Rights"} className="mt-2 w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-gold" />
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" onClick={importBulk} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal">Load rows</button>
                  {bulkMsg && <span className="text-xs text-ink/70">{bulkMsg}</span>}
                </div>
              </div>
            )}
            <div className="mt-2 space-y-4">
              {members.map((m, i) => (
                <div key={i} className="space-y-4 rounded-xl border border-ink/10 bg-cream/30 p-4">
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-sm font-600 text-ink">Delegate {i + 1}</span>
                    <button type="button" onClick={() => removeMember(i)} disabled={members.length <= 1} className="text-xs font-600 text-red-600 hover:underline disabled:opacity-40">Remove</button>
                  </div>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-500 text-ink/80 block mb-1">Full Name *</label>
                      <input value={m.fullName} onChange={(e) => setM(i, "fullName", e.target.value)} placeholder="Full Name" required className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-xs font-500 text-ink/80 block mb-1">Email *</label>
                      <input value={m.email} onChange={(e) => setM(i, "email", e.target.value)} placeholder="Email" type="email" required className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-xs font-500 text-ink/80 block mb-1">Phone Number *</label>
                      <input value={m.phone} onChange={(e) => setM(i, "phone", e.target.value)} placeholder="Number" required className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                    </div>
                                    <div>
                                      <label className="text-xs font-500 text-ink/80 block mb-1">Age *</label>
                                      {
                                        BEGINNER_CLIENT.has(m.track) ? (
                                          <>
                                            <input value={m.age} onChange={(e) => setM(i, "age", e.target.value)} placeholder="Age" inputMode="numeric" type="number" min={12} max={16} required className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                                            {(!m.age || Number(m.age) < 12 || Number(m.age) > 16) ? (
                                              <p className="mt-1 text-xs text-red-600">Beginner committees require delegates aged 12–16.</p>
                                            ) : (
                                              <p className="mt-1 text-xs text-ink/70">Beginner committee — age 12–16 required.</p>
                                            )}
                                          </>
                                        ) : (
                                          <input value={m.age} onChange={(e) => setM(i, "age", e.target.value)} placeholder="Age" inputMode="numeric" type="number" min={8} max={99} required className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                                        )
                                      }
                                    </div>
                    <div>
                      <label className="text-xs font-500 text-ink/80 block mb-1">MUN Committee *</label>
                      <div className="flex gap-2">
                        <input value={committeeSearch} onChange={(e) => setCommitteeSearch(e.target.value)} placeholder="Search" className="w-20 rounded-lg border border-ink/15 bg-paper px-2 py-1 text-xs outline-none focus:border-gold" />
                        <div className="flex-1">
                          <div className="rounded-t-md bg-ink/60 text-cream px-3 py-2 text-sm font-600 border border-ink/15 border-b-0">{tracks.find((t) => t.value === m.track)?.label || "Select committee"}</div>
                          <div className="border border-ink/15 bg-cream h-40 overflow-auto text-sm">
                            {tracks
                              .filter((t) => t.label.toLowerCase().includes(committeeSearch.toLowerCase()) || t.value.toLowerCase().includes(committeeSearch.toLowerCase()))
                              .map((t) => {
                                const note = (t.value === "unep" || t.value === "aippm" || t.label.includes("Environment Programme") || t.label.includes("All India Political Parties Meet")) ? " (Beginner, age 12-16)" : "";
                                const selected = m.track === t.value;
                                return (
                                  <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => { setM(i, "track", t.value); setM(i, "experience", "beginner"); }}
                                    className={`w-full text-left px-3 py-2 ${selected ? "bg-ink/60 text-cream" : "text-ink hover:bg-goldlite"}`}
                                  >
                                    {t.label}{note}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* guardian block shown when member is under 18 */}
                    {Number(m.age) && Number(m.age) < 18 && (
                      <div className="rounded-lg border border-ink/10 bg-cream/60 p-3">
                        <p className="text-sm font-600 text-ink mb-2">You're under 18 — a parent/guardian must consent.</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-500 text-ink/80 block mb-1">Parent / guardian name</label>
                            <input value={m.guardianName || ""} onChange={(e) => setM(i, "guardianName", e.target.value)} placeholder="Parent / guardian name" className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                          </div>
                          <div>
                            <label className="text-xs font-500 text-ink/80 block mb-1">Guardian contact number</label>
                            <input value={m.guardianPhone || ""} onChange={(e) => setM(i, "guardianPhone", e.target.value)} placeholder="Contact number" className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                          </div>
                        </div>
                        <label className="mt-3 flex items-start gap-2 text-sm text-ink/80">
                          <input type="checkbox" checked={!!m.guardianConsent} onChange={(e) => setM(i, "guardianConsent", e.target.checked)} className="mt-0.5 accent-gold" />
                          <span>I am the parent/guardian and I consent to this delegate's participation.</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-500 text-ink/80 block mb-1">Passport Photo (JPEG/PNG, Max 2MB) *</label>
                    <input
                      type="file"
                      accept="image/jpeg, image/png"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setM(i, "photoData", "");
                          setM(i, "photoMime", "");
                          return;
                        }
                        if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/jpg") {
                          alert("Only JPEG and PNG formats are supported.");
                          e.target.value = "";
                          return;
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Photo must be smaller than 2MB.");
                          e.target.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = (reader.result as string).split(",")[1];
                          setM(i, "photoData", base64);
                          setM(i, "photoMime", file.type);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-xs outline-none focus:border-gold file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-gold file:text-midnight hover:file:bg-goldlite"
                    />
                  </div>
                </div>
              ))}
            </div>
            {errors.members && <p className="mt-1 text-xs text-red-600">{errors.members[0]}</p>}
          </div>

          <div>
            <label className="text-sm font-500 text-ink/80">Promo / school code (optional)</label>
            <div className="mt-1 flex gap-2">
              <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="SCHOOL25" className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 uppercase outline-none focus:border-gold" />
              <button type="button" onClick={applyPromo} className="rounded-lg border border-ink/15 px-4 text-sm font-600 text-ink hover:border-gold">Apply</button>
            </div>
            {promoMsg && <p className={`mt-1 text-xs ${discount > 0 ? "text-green-700" : "text-red-600"}`}>{promoMsg}</p>}
          </div>

          <div className="rounded-lg bg-cream px-4 py-3">
            <div className="flex items-center justify-between text-sm text-ink/70"><span>Subtotal ({members.length} delegates)</span><span>Rs {subtotal.toLocaleString("en-IN")}</span></div>
            {discount > 0 && <div className="flex items-center justify-between text-sm text-green-700"><span>Discount</span><span>- Rs {discount.toLocaleString("en-IN")}</span></div>}
            <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-2"><span className="text-sm font-600 text-ink">Total payable</span><span className="font-display text-2xl font-700 text-ink">Rs {total.toLocaleString("en-IN")}</span></div>
          </div>

          <label className="flex items-start gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-gold" />
            <span>On behalf of our delegation, I agree to the <a href="/terms" target="_blank" className="font-600 text-gold hover:underline">Terms</a> and the <a href="/code-of-conduct" target="_blank" className="font-600 text-gold hover:underline">Code of Conduct</a>, and confirm parental consent has been obtained for any delegate under 18.</span>
          </label>

          <button disabled={status === "processing" || !consent} className="w-full rounded-full bg-gold py-3 font-600 text-midnight transition hover:bg-goldlite disabled:opacity-60">
            {status === "processing" ? "Processing..." : "Pay for delegation"}
          </button>
          {message && <p className="text-sm text-red-600">{message}</p>}
          <p className="text-center text-xs text-slatey">Secured by Cashfree. One payment covers every delegate listed above.</p>
        </form>
      </div>
    </main>
  );
}

function Field({ name, label, type = "text", errors }: { name: string; label: string; type?: string; errors: Record<string, string[]> }) {
  return (
    <div>
      <label className="text-sm font-500 text-ink/80">{label}</label>
      <input name={name} type={type} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}
    </div>
  );
}
