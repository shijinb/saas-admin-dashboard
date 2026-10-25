import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page here shows per-user data fetched at request time, so Cache Components and partial
  // prefetching (the Next 16 scaffold defaults) would add Suspense/caching rules without a benefit.
  // See README "Design choices".
  output: "standalone", // minimal server bundle for the Docker image
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
