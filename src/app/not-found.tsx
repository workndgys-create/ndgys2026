import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream grain px-5 text-center">
      <p className="font-display text-8xl font-900 text-ink/10">404</p>
      <h1 className="mt-2 font-display text-3xl font-700 text-ink">Page not found</h1>
      <p className="mt-2 text-ink/65">The page you're looking for isn't part of the Summit.</p>
      <Link href="/" className="mt-6 rounded-full bg-midnight px-6 py-3 font-600 text-cream hover:bg-royal">Back to home</Link>
    </main>
  );
}
