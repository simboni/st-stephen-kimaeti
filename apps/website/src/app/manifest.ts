import type { MetadataRoute } from "next";
import { school, site } from "@/lib/site";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Makes the site installable: a parent can keep St Stephen's on their home
 *  screen and open the fee structure without a browser, or a signal. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: school.name,
    short_name: school.shortName,
    description: site.description,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf9f5",
    theme_color: "#0e1620",
    lang: "en-KE",
    dir: "ltr",
    categories: ["education"],
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: `${base}/icon-maskable.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Fees", url: `${base}/fees/` },
      { name: "Admissions", url: `${base}/admissions/` },
      { name: "Term dates", url: `${base}/events/` },
      { name: "Contact", url: `${base}/contact/` },
    ],
  };
}
