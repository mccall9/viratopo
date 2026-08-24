import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://viratopo.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/ranking", "/analytics", "/termos", "/privacidade"].map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date("2026-08-24"), changeFrequency: path === "" || path === "/ranking" ? "daily" : "monthly", priority: path === "" ? 1 : path === "/ranking" ? 0.9 : 0.6 }));
}
