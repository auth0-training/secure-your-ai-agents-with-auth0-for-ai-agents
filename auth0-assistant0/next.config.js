const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
});
