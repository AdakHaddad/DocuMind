import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**" // Allow all hostnames
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas"); // Ignore 'canvas' on server build
    }
    return config;
  }
};

export default nextConfig;
