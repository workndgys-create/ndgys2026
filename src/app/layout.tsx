import type { Metadata, Viewport } from "next";
import { Fraunces, Libre_Franklin } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-display",
  display: "swap"
});
const body = Libre_Franklin({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://nesummit.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "New Delhi Global Youth Summit 2026 | Diplomacy, Debate & Leadership",
  description:
    "New Delhi Global Youth Summit 2026 — the inaugural edition. 22–23 August 2026, IIT Delhi. Eight tracks, 40+ speakers, 500+ delegates. Register now.",
  keywords: ["New Delhi Global Youth Summit", "youth summit India", "MUN Delhi", "youth leadership", "diplomacy conference"],
  authors: [{ name: "New Delhi Global Youth Summit" }],
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "New Delhi Global Youth Summit 2026",
    title: "New Delhi Global Youth Summit 2026",
    description:
      "The inaugural edition. 22–23 August 2026, IIT Delhi. Eight tracks, 40+ speakers, 500+ delegates.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "New Delhi Global Youth Summit 2026" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "New Delhi Global Youth Summit 2026",
    description: "The inaugural edition. 22–23 August 2026, IIT Delhi.",
    images: ["/og-image.jpg"]
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NDGYS 2026" }
};

export const viewport: Viewport = {
  themeColor: "#1A1A3E",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">{children}<ServiceWorker /></body>
    </html>
  );
}
