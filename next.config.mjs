/** @type {import('next').NextConfig} */
const defaultR2PublicUrl =
  "https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev";
const r2PublicUrl = process.env.R2_PUBLIC_URL || defaultR2PublicUrl;
const r2PublicHostname = new URL(r2PublicUrl).hostname;

const nextConfig = {
  images: {
    // Let Vercel Image CDN optimize cover images (auto AVIF, resize, edge cache)
    // Manga reader pages use per-image unoptimized={true} to stay within Hobby plan limits
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: r2PublicHostname,
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 320, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["bcryptjs"],
  transpilePackages: ["better-auth"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    scrollRestoration: true,
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/logo.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.:ext*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://vercel.live https://va.vercel-scripts.com https://accounts.google.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // img-src: Using https: wildcard to allow author credit icons from any source
              // This is an acceptable risk as images cannot execute code (unlike scripts)
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              `connect-src 'self' ${r2PublicUrl} https://vercel.live https://va.vercel-scripts.com https://accounts.google.com`,
              "frame-src 'self' https://vercel.live https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
