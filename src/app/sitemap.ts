import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { TRACKS } from "@/lib/validation";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const now = new Date();
  const routes = ["", "/about", "/committees", "/schedule", "/register", "/privacy", "/terms", "/refund"];
  const staticEntries = routes.map((r) => ({ url: `${base}${r}`, lastModified: now, changeFrequency: "weekly" as const, priority: r === "" ? 1 : 0.7 }));
  const trackEntries = TRACKS.map((t) => ({ url: `${base}/committees/${t.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 }));
  return [...staticEntries, ...trackEntries];
}
