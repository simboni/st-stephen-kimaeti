import type { MetadataRoute } from "next";
import { news, site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${site.domain}`;
  const staticRoutes = [
    "",
    "/about/",
    "/admissions/",
    "/fees/",
    "/news/",
    "/events/",
    "/gallery/",
    "/contact/",
    "/complain/",
    "/portal/",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const posts = news.map((post) => ({
    url: `${base}/news/${post.slug}/`,
    lastModified: new Date(`${post.date}T00:00:00`),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...posts];
}
