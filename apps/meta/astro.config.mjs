// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://cairn-meta.vercel.app',
  // Pages removed in the October 2026 rebuild (they documented the old
  // apps/longterm, which now lives in the standalone longterm-wiki repo).
  redirects: {
    '/getting-started/introduction/': '/',
    '/architecture/': '/build-and-tooling/',
    '/components/': '/build-and-tooling/',
    '/content-database/': '/build-and-tooling/',
    '/automation-tools/': '/build-and-tooling/',
    '/mermaid-diagrams/': '/adding-a-wiki/',
    '/workflows/': '/review-workflow/',
    '/enhancement-queue/': '/review-workflow/',
    '/cause-effect-diagrams/': '/',
    '/content-formats/': '/',
    '/knowledge-base/': '/',
    '/models/': '/',
    '/research-reports/': '/',
    '/reports/': '/',
    '/reports/causal-diagram-visualization/': '/',
    '/project-roadmap/': '/',
  },
  integrations: [
    starlight({
      title: 'CAIRN Handbook',
      description: 'How QURI builds and maintains CAIRN, its monorepo of LLM-assisted research wikis.',
      components: {
        Footer: './src/components/starlight/Footer.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/cairn' },
      ],
      // Explicit { label, slug } entries: scripts/generate-llm-files.mjs reads
      // this sidebar to build public/llms.txt and public/llms-full.txt.
      sidebar: [
        {
          label: 'Handbook',
          collapsed: false,
          items: [
            { label: 'Adding a Wiki', slug: 'adding-a-wiki' },
            { label: 'Build & Tooling', slug: 'build-and-tooling' },
            { label: 'Review Workflow', slug: 'review-workflow' },
          ],
        },
        {
          label: 'Workshop',
          collapsed: false,
          items: [
            { label: 'Building Research Websites', slug: 'workshop' },
            { label: 'Claude Code on the Web', slug: 'claude-code-web-app' },
          ],
        },
      ],
    }),
  ],
});
