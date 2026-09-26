import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logo uploads are validated at 1 MB in the action; the transport limit
      // sits above that so users get our friendly error, not a raw 500.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
