"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function requestLink(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/delegate/auth/request", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.authenticated) { router.push("/dashboard"); router.refresh(); return; }
    setErr(d.error || "Login failed.");
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-5">
      <div className="w-full max-w-sm rounded-2xl bg-paper p-8 shadow-2xl">
        <h1 className="font-display text-2xl font-700 text-ink">Participant Sign-in</h1>
        <p className="mt-1 text-sm text-slatey">Login is allowed only for the email used in a successfully paid registration or competition entry.</p>

        <form onSubmit={requestLink} className="mt-6">
          <label className="text-sm font-500 text-ink/80">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
          <button disabled={busy} className="mt-5 w-full rounded-full bg-midnight py-3 font-600 text-cream hover:bg-royal disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      </div>
    </main>
  );
}

export default function DelegateLogin() {
  return <Suspense fallback={null}><LoginInner /></Suspense>;
}
