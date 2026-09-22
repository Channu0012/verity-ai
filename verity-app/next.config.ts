import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimization
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // HTTP Headers for SEO, Security & Performance Caching
  async headers() {
    const now = new Date().toUTCString();
    return [
      {
        // Global security & caching headers
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Last-Modified",
            value: now,
          },
        ],
      },
      {
        // Static public media (icons, logo, videos) (RankMath 'Expires' header test)
        source: "/:file*(png|jpg|jpeg|gif|svg|ico|webp|mp4)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          {
            key: "Expires",
            value: new Date(Date.now() + 86400000).toUTCString(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
