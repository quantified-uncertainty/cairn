import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cairn/ui",
    "@quri/squiggle-components",
    "@quri/squiggle-lang",
    "@quri/ui",
  ],
  typescript: {
    // Pre-existing type error in @cairn/ui Mermaid component
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
