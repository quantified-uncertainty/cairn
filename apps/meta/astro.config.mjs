import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      title: 'LongtermWiki Meta',
      description: 'How to build LongtermWiki-like knowledge bases',
      components: {
        // Custom footer with version display
        Footer: './src/components/starlight/Footer.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/cairn' },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Workshop: Research Websites', slug: 'workshop' },
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
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
