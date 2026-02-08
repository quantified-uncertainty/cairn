import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cairn/ui",
    "@quri/squiggle-components",
    "@quri/squiggle-lang",
    "@quri/ui",
  ],
};

export default nextConfig;
