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
	site: 'https://open-stacks.quantifieduncertainty.org',
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [
		react(),
		mermaid(),
		starlight({
			title: 'Open Stacks',
			description: "Exploring the world's literature cheaply and well: what is free, what is cheap, what tools exist, and what could be built.",
			customCss: ['./src/styles/global.css'],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
					},
				},
			],
			components: {
				Footer: './src/components/Footer.astro',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/cairn' },
			],
			sidebar: [
				{
					label: 'Start Here',
					collapsed: false,
					items: [
						{ label: 'Open Stacks', slug: 'index' },
					],
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
