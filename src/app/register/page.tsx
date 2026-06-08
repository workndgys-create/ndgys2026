"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TRACKS } from "@/lib/validation";

declare global {
  interface Window { Cashfree?: any; }
}

type PortfolioState = "available" | "held" | "mine" | "taken";
type Portfolio = { id: string; name: string; order: number; state: PortfolioState; heldUntil: string | null };
type CustomQ = { id: string; label: string; type: "short" | "paragraph" | "select" | "multiselect"; required: boolean; helpText: string | null; options: string[] };

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

const HEARD = [
  "Instagram",
  "WhatsApp",
  "School / College",
  "Friend / Word of mouth",
  "Other",
];

function RegisterInner() {
  const params = useSearchParams();
  const preTrack = params.get("track") || TRACKS[0].slug;

  const [track, setTrack] = useState(preTrack);
  const [status, setStatus] = useState<"idle" | "processing" | "paid" | "error" | "full">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<Record<string, string>>({});

  const [portfolios, setPortfolios] = useState<Portfolio[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [regId, setRegId] = useState<string>("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [discounted, setDiscounted] = useState<number | null>(null);
  const [age, setAge] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const isMinor = age !== "" && Number(age) > 0 && Number(age) < 18;
  const [questions, setQuestions] = useState<CustomQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (TRACKS.some((t) => t.slug === preTrack)) setTrack(preTrack); }, [preTrack]);
  const fee = useMemo(() => TRACKS.find((t) => t.slug === track)?.fee ?? 0, [track]);

  useEffect(() => {
    fetch("/api/registration-questions", { cache: "no-store" })
      .then((r) => r.json()).then((d) => setQuestions(d.questions || [])).catch(() => {});
  }, []);
  function setAnswer(id: string, value: string | string[]) { setAnswers((a) => ({ ...a, [id]: value })); }
  function toggleMulti(id: string, opt: string) {
    setAnswers((a) => {
      const cur = Array.isArray(a[id]) ? (a[id] as string[]) : [];
      return { ...a, [id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });
  }

  async function loadPortfolios() {
    try {
      const res = await fetch(`/api/portfolios?track=${track}${regId ? `&reg=${regId}` : ""}`, { cache: "no-store" });
      const d = await res.json();
      setPortfolios(d.portfolios || []);
    } catch { /* keep last */ }
  }
  useEffect(() => {
    setSelected(""); setPortfolios(null); setDiscounted(null); setPromoMsg("");
    loadPortfolios();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { if (!document.hidden) loadPortfolios(); }, 12000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, regId]);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) expireHold();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  async function releaseHold() {
    if (!regId) return;
    await fetch("/api/portfolios/release", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId: regId }) }).catch(() => {});
  }

  function expireHold() {
    setDeadline(null); setRegId(""); setStatus("idle");
    setMessage("Your hold expired - that portfolio is open again. Please re-select and pay within the time limit.");
    loadPortfolios();
  }

  async function applyPromo() {
    setPromoMsg("");
    if (!promo.trim()) { setDiscounted(null); return; }
    const res = await fetch("/api/promo/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promo, amount: fee, trackSlug: track }) });
    const d = await res.json().catch(() => ({}));
    if (d.ok) { setDiscounted(d.final); setPromoMsg(`Code applied - you save Rs ${(d.discount / 100).toLocaleString("en-IN")}.`); }
    else { setDiscounted(null); setPromoMsg("That code can't be applied."); }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({}); setMessage("");
    if (!selected) { setMessage("Please select an available portfolio first."); setStatus("error"); return; }
    if (!consent) { setMessage("Please accept the Terms and Code of Conduct to continue."); setStatus("error"); return; }
    if (isMinor && !guardianConsent) { setMessage("Parent/guardian consent is required for delegates under 18."); setStatus("error"); return; }
    for (const q of questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      const empty = v === undefined || (Array.isArray(v) ? v.length === 0 : !String(v).trim());
      if (empty) { setMessage(`Please answer: ${q.label}`); setStatus("error"); return; }
    }
    setStatus("processing");
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    payload.portfolioId = selected;
    payload.consentAccepted = consent ? "true" : "";
    payload.guardianConsent = guardianConsent ? "true" : "";
    payload.customAnswers = questions.map((q) => ({ questionId: q.id, label: q.label, value: answers[q.id] ?? (q.type === "multiselect" ? [] : "") })).filter((x) => (Array.isArray(x.value) ? x.value.length : String(x.value).trim()));
    if (promo.trim()) payload.promoCode = promo.trim();
    setForm(payload as Record<string, string>);

    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (res.status === 409) {
      const d = await res.json().catch(() => ({}));
      if (d.full) { setStatus("full"); return; }
      if (d.portfolioUnavailable) { setSelected(""); setMessage(d.error || "That portfolio was just taken - please pick another."); setStatus("error"); loadPortfolios(); return; }
      setMessage(d.error || "This track is unavailable."); setStatus("error"); return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrors(d.issues || {}); setMessage(d.error || "Please check the form."); setStatus("error"); return;
    }

    const order = await res.json();
    setRegId(order.registrationId);
    if (order.heldUntil) setDeadline(new Date(order.heldUntil).getTime());

    if (!(await loadCashfree())) { setMessage("Could not load the payment gateway."); setStatus("error"); await releaseHold(); setDeadline(null); return; }

    const cashfree = window.Cashfree({ mode: order.mode || "sandbox" });
    const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });

    if (result?.error) {
      // user closed the modal or payment failed → free the hold and let them retry
      await releaseHold(); setDeadline(null); setRegId(""); setStatus("idle"); loadPortfolios();
      return;
    }

    // confirm server-side by order status, then fulfil
    const v = await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId }) });
    if (v.ok) { setDeadline(null); setStatus("paid"); }
    else if (v.status === 202) { setMessage("Payment is processing. If it succeeded, your confirmation email will arrive shortly — you can also refresh your dashboard."); setStatus("error"); }
    else { setMessage("Payment could not be verified. If charged, contact us."); setStatus("error"); }
  }

  async function joinWaitlist() {
    await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: form.fullName, email: form.email, track }) });
    setMessage("You're on the waitlist - we'll email you if a seat opens.");
  }

  if (status === "paid") {
    return (
      <Centered>
        <div className="text-center">
          <p className="font-display text-5xl">&#127881;</p>
          <h1 className="mt-4 font-display text-4xl font-700 text-ink">You're confirmed!</h1>
          <p className="mt-3 text-ink/70">Your portfolio is locked in. A confirmation email with your QR ticket and invoice is on its way.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/dashboard" className="rounded-full bg-midnight px-6 py-3 font-600 text-cream hover:bg-royal">Go to Dashboard</Link>
            <Link href="/" className="rounded-full border border-ink/20 px-6 py-3 font-600 text-ink hover:border-gold">Home</Link>
          </div>
        </div>
      </Centered>
    );
  }

  if (status === "full") {
    return (
      <Centered>
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl font-700 text-ink">This track is full</h1>
          <p className="mt-3 text-ink/70">{TRACKS.find((t) => t.slug === track)?.name} has reached capacity. Join the waitlist and we'll notify you if a seat frees up.</p>
          <button onClick={joinWaitlist} className="mt-6 rounded-full bg-gold px-6 py-3 font-600 text-midnight hover:bg-goldlite">Join Waitlist</button>
          {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
          <div className="mt-4"><Link href="/#tracks" className="text-sm text-gold hover:underline">&larr; Choose another track</Link></div>
        </div>
      </Centered>
    );
  }

  const available = portfolios?.filter((p) => p.state === "available" || p.state === "mine").length ?? 0;
  const mm = String(Math.floor(remaining / 60));
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Centered>
      <div className="w-full max-w-lg">
        <Link href="/" className="text-sm text-gold hover:underline">&larr; Back</Link>
        <h1 className="mt-3 font-display text-4xl font-700 text-ink">Register</h1>
        <p className="mt-2 text-ink/70">Pick your committee, choose an available portfolio, and pay to lock it in.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-ink/10 bg-paper p-7 shadow-sm">
          <Field name="fullName" label="Full Name" errors={errors} />
          <Field name="email" type="email" label="Email" errors={errors} />
          <Field name="phone" label="Phone Number" errors={errors} />
          <Field name="institution" label="School / College (optional)" errors={errors} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-500 text-ink/80">Age</label>
              <input name="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
              {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-500 text-ink/80">Gender</label>
              <select name="gender" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
          </div>
          <Field name="city" label="Place / City" errors={errors} />
          <Field name="emergencyContact" label="Emergency contact number" errors={errors} />
          <div>
            <label className="text-sm font-500 text-ink/80">How did you hear about us?</label>
            <select name="howHeard" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
              <option value="Instagram">Instagram</option><option value="WhatsApp">WhatsApp</option>
              <option value="School / College">School / College</option><option value="Friend / Word of mouth">Friend / Word of mouth</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div>
            <label className="text-sm font-500 text-ink/80">Committee</label>
            <select name="track" value={track} onChange={(e) => setTrack(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
              {TRACKS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-500 text-ink/80">Portfolio</label>
              <span className="text-xs text-slatey">{portfolios ? `${available} available` : "loading..."}</span>
            </div>
            <div className="mt-2 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-ink/10 bg-cream p-2 sm:grid-cols-3">
              {!portfolios ? (
                <p className="col-span-full py-6 text-center text-sm text-slatey">Loading portfolios...</p>
              ) : portfolios.length === 0 ? (
                <p className="col-span-full py-6 text-center text-sm text-slatey">No portfolios configured for this committee yet.</p>
              ) : portfolios.map((p) => {
                const disabled = p.state === "held" || p.state === "taken";
                const isSel = selected === p.id;
                return (
                  <button
                    type="button" key={p.id} disabled={disabled}
                    onClick={() => setSelected(p.id)}
                    className={`rounded-lg px-2.5 py-2 text-left text-xs font-500 transition ${isSel ? "bg-midnight text-cream ring-2 ring-gold" : disabled ? "cursor-not-allowed bg-ink/5 text-slatey line-through" : "bg-paper text-ink hover:ring-1 hover:ring-gold"}`}
                  >
                    {p.name}
                    {p.state === "held" && <span className="ml-1 text-[10px] text-amber-600">held</span>}
                    {p.state === "taken" && <span className="ml-1 text-[10px]">taken</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-500 text-ink/80">Experience</label>
            <select name="experience" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
              <option value="beginner">First-timer</option>
              <option value="experienced">Experienced delegate</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-500 text-ink/80">Anything you'd like us to know? (optional)</label>
            <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
          </div>

          {isMinor && (
            <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-600 text-amber-900">You're under 18 — a parent/guardian must consent.</p>
              <div className="grid grid-cols-2 gap-3">
                <Field name="guardianName" label="Parent / guardian name" errors={errors} />
                <Field name="guardianPhone" label="Guardian contact number" errors={errors} />
              </div>
              <label className="flex items-start gap-2 text-sm text-amber-900">
                <input type="checkbox" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} className="mt-0.5 accent-gold" />
                <span>I am the parent/guardian and I consent to this delegate's participation.</span>
              </label>
              {errors.guardianConsent && <p className="text-xs text-red-600">{errors.guardianConsent[0]}</p>}
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-4 rounded-xl border border-ink/10 bg-cream/60 p-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="text-sm font-600 text-ink">{q.label}{q.required && <span className="text-red-500"> *</span>}</label>
                  {q.helpText && <p className="text-xs text-slatey">{q.helpText}</p>}
                  {q.type === "short" && (
                    <input value={(answers[q.id] as string) || ""} onChange={(e) => setAnswer(q.id, e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 outline-none focus:border-gold" />
                  )}
                  {q.type === "paragraph" && (
                    <textarea value={(answers[q.id] as string) || ""} onChange={(e) => setAnswer(q.id, e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 outline-none focus:border-gold" />
                  )}
                  {q.type === "select" && (
                    <div className="mt-1 space-y-1.5">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-ink/80">
                          <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} className="accent-gold" /> {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === "multiselect" && (
                    <div className="mt-1 space-y-1.5">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-ink/80">
                          <input type="checkbox" checked={Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt)} onChange={() => toggleMulti(q.id, opt)} className="accent-gold" /> {opt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-gold" />
            <span>I have read and agree to the <a href="/terms" target="_blank" className="font-600 text-gold hover:underline">Terms</a> and the <a href="/code-of-conduct" target="_blank" className="font-600 text-gold hover:underline">Code of Conduct</a>.</span>
          </label>

          {deadline && status === "processing" && (
            <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-goldlite/20 px-4 py-3 text-sm">
              <span className="text-ink/80">Portfolio held - complete payment</span>
              <span className="font-mono text-lg font-700 text-ink">{mm}:{ss}</span>
            </div>
          )}

          <div>
            <label className="text-sm font-500 text-ink/80">Promo code (optional)</label>
            <div className="mt-1 flex gap-2">
              <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="EARLYBIRD" className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 uppercase outline-none focus:border-gold" />
              <button type="button" onClick={applyPromo} className="rounded-lg border border-ink/15 px-4 text-sm font-600 text-ink hover:border-gold">Apply</button>
            </div>
            {promoMsg && <p className={`mt-1 text-xs ${discounted != null ? "text-green-700" : "text-red-600"}`}>{promoMsg}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-cream px-4 py-3">
            <span className="text-sm text-ink/70">Amount payable</span>
            <span className="font-display text-2xl font-700 text-ink">
              {discounted != null && discounted !== fee
                ? <><span className="mr-2 text-base font-400 text-slatey line-through">Rs {(fee / 100).toLocaleString("en-IN")}</span>Rs {(discounted / 100).toLocaleString("en-IN")}</>
                : <>Rs {(fee / 100).toLocaleString("en-IN")}</>}
            </span>
          </div>

          <button disabled={status === "processing" || !selected || !consent || (isMinor && !guardianConsent)} className="w-full rounded-full bg-gold py-3 font-600 text-midnight transition hover:bg-goldlite disabled:opacity-60">
            {status === "processing" ? "Processing..." : selected ? "Pay & lock portfolio" : "Select a portfolio"}
          </button>
          {message && <p className={`text-sm ${status === "error" ? "text-red-600" : "text-ink/70"}`}>{message}</p>}
          <p className="text-center text-xs text-slatey">Your portfolio is held for a few minutes while you pay. Secured by Cashfree.</p>
          <p className="text-center text-xs text-slatey">Registering a school group? <Link href="/delegation/register" className="font-600 text-gold hover:underline">Delegation registration &rarr;</Link></p>
        </form>
      </div>
    </Centered>
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
function Centered({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-cream grain px-5 py-16">{children}</main>;
}

export default function RegisterPage() {
  return <Suspense fallback={<Centered><p className="text-ink/60">Loading...</p></Centered>}><RegisterInner /></Suspense>;
}
