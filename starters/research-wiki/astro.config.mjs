// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Update with your deployed URL to enable sitemap and canonical URLs:
  // site: 'https://your-site.netlify.app',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    react(),
    mermaid(),
    starlight({
      title: 'My Research Wiki',
      customCss: ['./src/styles/global.css'],
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css',
          },
        },
      ],
      // Uncomment and update with your repo URL:
      // social: [
      //   { icon: 'github', label: 'GitHub', href: 'https://github.com/your-username/your-repo' },
      // ],
      sidebar: [
        {
          label: 'Example',
          autogenerate: { directory: 'example' },
        },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['mermaid'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    ssr: {
      noExternal: ['mermaid'],
    },
  },
});
