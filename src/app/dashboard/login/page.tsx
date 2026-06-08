"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Handle magic-link arrival (?token=&email=)
  useEffect(() => {
    const token = params.get("token");
    const e = params.get("email");
    if (token && e) {
      setBusy(true);
      fetch("/api/delegate/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, token })
      }).then(async (r) => {
        if (r.ok) { router.push("/dashboard"); router.refresh(); }
        else { setErr("This link is invalid or has expired. Request a new one below."); setEmail(e); setBusy(false); }
      });
    }
  }, [params, router]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setMsg("");
    const res = await fetch("/api/delegate/auth/request", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
    });
    const d = await res.json().catch(() => ({}));
    if (d.pending) { setMsg(d.message); setBusy(false); return; } // not confirmed → stay on email step
    setMsg("If that email has a confirmed registration, a sign-in link and code are on the way."); setStep("otp"); setBusy(false);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const fd = new FormData(e.target as HTMLFormElement);
    const r = await fetch("/api/delegate/auth/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: String(fd.get("otp")) })
    });
    if (r.ok) { router.push("/dashboard"); router.refresh(); }
    else { setErr("Invalid or expired code."); setBusy(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-5">
      <div className="w-full max-w-sm rounded-2xl bg-paper p-8 shadow-2xl">
        <h1 className="font-display text-2xl font-700 text-ink">Delegate Sign-in</h1>
        <p className="mt-1 text-sm text-slatey">Enter the email you registered with. Once payment is confirmed, access is automatically sent to that email — no manual sharing needed.</p>

        {step === "email" ? (
          <form onSubmit={requestLink} className="mt-6">
            <label className="text-sm font-500 text-ink/80">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
            <button disabled={busy} className="mt-5 w-full rounded-full bg-midnight py-3 font-600 text-cream hover:bg-royal disabled:opacity-60">
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6">
            <label className="text-sm font-500 text-ink/80">6-digit code</label>
            <input name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-center text-2xl tracking-[8px] outline-none focus:border-gold" />
            <button disabled={busy} className="mt-5 w-full rounded-full bg-gold py-3 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setMsg(""); }} className="mt-3 w-full text-sm text-slatey hover:text-ink">Use a different email</button>
          </form>
        )}

        {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      </div>
    </main>
  );
}

export default function DelegateLogin() {
  return <Suspense fallback={null}><LoginInner /></Suspense>;
}
