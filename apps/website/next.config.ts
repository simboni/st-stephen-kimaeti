import type { NextConfig } from "next";

// When deploying to GitHub Pages under a project sub-path (e.g.
// https://<user>.github.io/st-stephen-kimaeti/), CI sets PAGES_BASE_PATH so
// Next prefixes asset and internal-link URLs correctly. Left empty for local
// dev and for root-domain hosts (Vercel / Cloudflare / a custom domain).
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static HTML export — deploys to any static host.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // The school's photographs are pre-exported as responsive WebP at build
  // time, so pages use plain <img srcset> rather than next/image (which, with
  // optimisation off, emits a single source and no srcset). Next does not
  // rewrite hand-written src attributes, so the base path is inlined here for
  // <Photo> to prefix them itself.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
