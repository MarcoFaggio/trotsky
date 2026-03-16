/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@hotel-pricing/db", "@hotel-pricing/shared"],
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
};

module.exports = nextConfig;
