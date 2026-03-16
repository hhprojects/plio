import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@plio/ui", "@plio/db", "@plio/utils"],
};

export default nextConfig;
