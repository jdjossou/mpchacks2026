import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    }
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/upload",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
