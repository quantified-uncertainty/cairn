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
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [
		react(),
		mermaid(),
		starlight({
			title: 'Evaluation Engineering',
			description: 'The discipline of designing, building, and operating systems that produce large numbers of estimates and evaluations at known cost.',
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
						{ label: '1. Evaluation Engineering', slug: 'start-here/introduction' },
						{ label: '2. Estimation vs. Evaluation', slug: 'start-here/estimation-vs-evaluation' },
						{ label: '3. Why It Matters — Use Cases', slug: 'start-here/use-cases' },
						{ label: '4. Cruxes', slug: 'start-here/key-questions' },
						{ label: 'Lineage', slug: 'start-here/lineage' },
					],
				},
				{
					label: 'Part I — The Systems View',
					collapsed: false,
					items: [
						{ label: '4. Evaluation as a System', slug: 'concepts/the-systems-view' },
						{ label: '5. The Four Components', slug: 'concepts/components' },
						{ label: 'Evaluation Systems in the Wild', slug: 'concepts/evaluation-systems-in-the-wild' },
						{ label: 'Patterns & Failure Modes', slug: 'concepts/patterns-and-failure-modes' },
					],
				},
				{
					label: 'Part II — Methods & Techniques',
					collapsed: false,
					items: [
						{ label: '6. Evaluation Methods', slug: 'concepts/evaluation-methods' },
						{ label: '7. Techniques', slug: 'concepts/techniques' },
					],
				},
				{
					label: 'Part III — The Environment',
					collapsed: false,
					items: [
						{ label: '8. Epistemic Culture', slug: 'concepts/epistemic-culture' },
					],
				},
				{
					label: 'Reference',
					collapsed: false,
					items: [
						{ label: 'Glossary', slug: 'reference/glossary' },
						{ label: 'Objections & FAQ', slug: 'reference/objections' },
						{ label: 'Related Work (QURI)', slug: 'reference/related-work' },
						{ label: 'Adjacent Fields & Literature', slug: 'reference/adjacent-fields' },
						{ label: 'Open Problems', slug: 'open-questions' },
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
