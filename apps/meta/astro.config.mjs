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
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
          ],
        },
        {
          label: 'CAIRN',
          autogenerate: { directory: 'cairn' },
        },
        {
          label: 'Architecture',
          autogenerate: { directory: 'architecture' },
        },
        {
          label: 'Components',
          autogenerate: { directory: 'components' },
        },
        {
          label: 'Reports',
          autogenerate: { directory: 'reports' },
        },
        {
          label: 'Reference',
          items: [
            { label: 'LLM Workflows', slug: 'workflows' },
            { label: 'Content Formats', slug: 'content-formats' },
            { label: 'Content Database', slug: 'content-database' },
            { label: 'Automation Tools', slug: 'automation-tools' },
            { label: 'Mermaid Diagrams', slug: 'mermaid-diagrams' },
            { label: 'Cause-Effect Diagrams', slug: 'cause-effect-diagrams' },
            { label: 'Knowledge Base', slug: 'knowledge-base' },
            { label: 'Models', slug: 'models' },
            { label: 'Research Reports', slug: 'research-reports' },
            { label: 'Enhancement Queue', slug: 'enhancement-queue' },
            { label: 'Project Roadmap', slug: 'project-roadmap' },
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
