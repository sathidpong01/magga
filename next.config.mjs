/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-1f8d25d164134702943300ef6d01fc35.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql', 'libsql'],
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
};

export default nextConfig;
