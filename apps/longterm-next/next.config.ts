import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cairn/ui",
    "@quri/squiggle-components",
    "@quri/squiggle-lang",
    "@quri/ui",
  ],
  typescript: {
    // Known type errors:
    // - @cairn/ui: missing @tanstack/react-table types, Mermaid theme type mismatch
    // - remark-callouts.ts: missing type declarations for unified/mdast/unist-util-visit
    // TODO: Fix these and remove ignoreBuildErrors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
