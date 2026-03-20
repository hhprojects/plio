import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@plio/ui", "@plio/db", "@plio/utils"],
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
