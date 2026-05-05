const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Tell Webpack to completely ignore parsing these massive Node.js libraries
  serverExternalPackages: [
    'googleapis',
    '@langchain/community',
    '@slack/web-api'
  ],
  experimental: {
    // 2. Keep this to efficiently tree-shake the 1000+ client-side icons
    optimizePackageImports: ['lucide-react'], 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = withBundleAnalyzer(nextConfig);