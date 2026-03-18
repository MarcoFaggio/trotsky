const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@hotel-pricing/db", "@hotel-pricing/shared"],
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

module.exports = nextConfig;
