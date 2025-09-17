/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@flashfusion/performance-monitor'],
  experimental: {
    esmExternals: false
  }
};

module.exports = nextConfig;