import type { NextConfig } from "next";

const apiOrigin = process.env.REGOS_API_ORIGIN ?? "http://127.0.0.1:8000";
const apiDestination = process.env.VERCEL ? "/api/v1/:path*" : `${apiOrigin}/api/v1/:path*`;
const healthDestination = process.env.VERCEL ? "/api/health" : `${apiOrigin}/health`;

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/regos/:path*",
        destination: apiDestination,
      },
      {
        source: "/health/regos",
        destination: healthDestination,
      },
    ];
  },
};

export default nextConfig;
