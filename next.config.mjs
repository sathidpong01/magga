/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-1f8d25d164134702943300ef6d01fc35.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    unoptimized: false,
  },
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql', 'libsql'],
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    scrollRestoration: true,
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  turbopack: {}, // Acknowledge Turbopack as default bundler in Next.js 16
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$|LICENSE$|\.d\.ts$/,
      use: 'ignore-loader',
    });
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev https://lh3.googleusercontent.com https://*.googleusercontent.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev https://*.turso.io wss://*.turso.io https://vercel.live https://va.vercel-scripts.com https://accounts.google.com",
              "frame-src 'self' https://vercel.live https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
