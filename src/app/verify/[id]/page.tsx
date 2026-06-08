import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: { id: string } }) {
  let reg: { fullName: string; trackName: string; status: string; delegateId: string | null } | null = null;
  try {
    reg = await prisma.registration.findUnique({
      where: { delegateId: params.id },
      select: { fullName: true, trackName: true, status: true, delegateId: true }
    });
  } catch {
    reg = null;
  }

  const valid = reg && reg.status === "PAID";

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-5">
      <div className="w-full max-w-sm rounded-3xl bg-paper p-8 text-center shadow-2xl">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {valid ? "✓" : "✕"}
        </div>
        {valid ? (
          <>
            <h1 className="mt-5 font-display text-2xl font-700 text-ink">Valid delegate</h1>
            <p className="mt-3 font-display text-xl text-ink">{reg!.fullName}</p>
            <p className="text-sm text-slatey">{reg!.trackName}</p>
            <p className="mt-2 font-mono text-xs text-slatey">{reg!.delegateId}</p>
            <p className="mt-5 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">Cleared for entry</p>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-2xl font-700 text-ink">Not recognised</h1>
            <p className="mt-3 text-sm text-slatey">
              This QR doesn't match a paid delegate. Verify the ID in the admin check-in console.
            </p>
          </>
        )}
        <p className="mt-6 text-xs text-slatey">New Delhi Global Youth Summit 2026</p>
      </div>
    </main>
  );
}
