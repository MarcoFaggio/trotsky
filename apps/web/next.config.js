const path = require("path");
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

// Monorepo: Next.js only auto-loads `.env*` from `apps/web`. Repo secrets live at root.
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@hotel-pricing/db", "@hotel-pricing/shared"],
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  webpack: (config, { isServer, dev }) => {
    // Polling reduces file descriptors vs native FSEvent watchers — use on external drives
    // or when you see EMFILE: set NEXT_DEV_POLLING=1 (see root package.json `dev` script).
    if (
      dev &&
      (process.env.NEXT_DEV_POLLING === "1" ||
        process.env.NEXT_DEV_POLLING === "true")
    ) {
      config.watchOptions = {
        poll: 1500,
        aggregateTimeout: 500,
        ignored: ["**/node_modules/**", "**/.git/**"],
      };
    }
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

module.exports = nextConfig;
