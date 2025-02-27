/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'suppinfo.directus.app',
        pathname: '/assets/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8055',
        pathname: '/assets/**',
      },
    ],
    unoptimized: false,
    minimumCacheTTL: 3600,
  },
  transpilePackages: ['@heroicons/react', '@react-hook/media-query'],
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@react-hook/media-query'],
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig 