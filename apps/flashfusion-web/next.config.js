/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@krosebrook/ui-components', '@krosebrook/shared-utilities'],
  },
  reactStrictMode: true,
}

module.exports = nextConfig