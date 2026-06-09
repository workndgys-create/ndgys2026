"use client";
import Link from "next/link";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream grain px-5 text-center">
      <h1 className="font-display text-3xl font-700 text-ink">Something went wrong</h1>
      <p className="mt-2 text-ink/65">An unexpected error occurred. Please try again.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-full bg-midnight px-6 py-3 font-600 text-cream hover:bg-royal">Try again</button>
        <Link href="/" className="rounded-full border border-ink/20 px-6 py-3 font-600 text-ink hover:border-gold">Home</Link>
      </div>
    </main>
  );
}
