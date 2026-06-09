"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries()))
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-paper p-8 shadow-2xl">
        <h1 className="font-display text-2xl font-700 text-ink">Admin Login</h1>
        <p className="mt-1 text-sm text-slatey">New Delhi Global Youth Summit</p>

        <label className="mt-6 block text-sm font-500 text-ink/80">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />

        <label className="mt-4 block text-sm font-500 text-ink/80">Password</label>
        <input name="password" type="password" required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />

        <button disabled={busy} className="mt-6 w-full rounded-full bg-midnight py-3 font-600 text-cream hover:bg-royal disabled:opacity-60">
          {busy ? "Signing in…" : "Sign In"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
