import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  },
  // Experimental settings for better video support
  experimental: {
    // Optimization for analytics tools
    optimizePackageImports: ['react', 'react-dom']
  },
};

export default nextConfig;
