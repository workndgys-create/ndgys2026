"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton({ endpoint, redirect }: { endpoint: string; redirect: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch(endpoint, { method: "POST" }); router.push(redirect); router.refresh(); }}
      className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-cream hover:border-gold hover:text-gold"
    >
      Logout
    </button>
  );
}
