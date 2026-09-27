import type { MetadataRoute } from "next";
import { isPreview, site } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // The preview host carries photographs of identifiable children, fee figures
  // and sample news the school has not yet approved. It exists so people can
  // look at the build, not so Google can index it. See lib/site.ts.
  if (isPreview) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `https://${site.domain}/sitemap.xml`,
  };
}
