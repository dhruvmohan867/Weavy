import { join } from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
      {
        protocol: "https",
        hostname: "assets.weavy.ai", // Adding this just in case you use images from their asset server too
      },
    ],
  },
  reactStrictMode: true,
  // ensure Turbopack picks the correct workspace root
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;