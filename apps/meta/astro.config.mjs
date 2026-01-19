import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CAIRN Meta',
      description: 'How to build CAIRN-like knowledge bases',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/cairn' },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Architecture', slug: 'architecture' },
            { label: 'Content Formats', slug: 'content-formats' },
            { label: 'Knowledge Base', slug: 'knowledge-base' },
            { label: 'Models', slug: 'models' },
          ],
        },
        {
          label: 'Components',
          items: [
            { label: 'Overview', slug: 'components' },
            { label: 'Mermaid Diagrams', slug: 'mermaid-diagrams' },
            { label: 'Cause-Effect Diagrams', slug: 'cause-effect-diagrams' },
          ],
        },
        {
          label: 'LLM Workflows',
          items: [
            { label: 'Overview', slug: 'workflows' },
            { label: 'Research Reports', slug: 'research-reports' },
            { label: 'Content Database', slug: 'content-database' },
            { label: 'Automation Tools', slug: 'automation-tools' },
            { label: 'Enhancement Queue', slug: 'enhancement-queue' },
          ],
        },
        {
          label: 'Reports',
          autogenerate: { directory: 'reports' },
        },
        {
          label: 'Project',
          items: [
            { label: 'Vision', slug: 'cairn/vision' },
            { label: 'Strategy', slug: 'cairn/strategy-brainstorm' },
            { label: 'Similar Projects', slug: 'cairn/similar-projects' },
            { label: 'Roadmap', slug: 'project-roadmap' },
          ],
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
