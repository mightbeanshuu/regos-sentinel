import type { NextConfig } from "next";

const apiOrigin = process.env.REGOS_API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  /* The landing page was promoted from /landing to / on 2026-08-11, and the
     product moved to /app. Links to /landing are already in the wild — in the
     submission pack and in chat — so they redirect rather than 404. Permanent,
     because the move is. */
  async redirects() {
    return [{ source: "/landing", destination: "/", permanent: true }];
  },
  async rewrites() {
    if (process.env.VERCEL) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${apiOrigin}/health`,
      },
    ];
  },
};

export default nextConfig;
