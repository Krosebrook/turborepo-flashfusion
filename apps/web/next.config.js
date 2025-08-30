/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@flashfusion/ui', '@flashfusion/shared'],
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig