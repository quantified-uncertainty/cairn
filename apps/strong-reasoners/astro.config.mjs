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
			title: 'Robust Reasoning Processes',
			description: 'A small textbook for a new field — the study and engineering of reasoning processes that deliver trustworthy conclusions at known cost and resist corruption.',
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
						{ label: '1. Robust Reasoning Processes', slug: 'start-here/introduction' },
						{ label: '2. Cruxes', slug: 'start-here/key-questions' },
					],
				},
				{
					label: 'Part I — The Judge',
					collapsed: false,
					items: [
						{ label: '3. The Core Model', slug: 'concepts/core-model' },
						{ label: '4. Epistemic Impact Analysis', slug: 'proposals/epistemic-impact-analysis' },
						{ label: '5. Constructing Utility Functions', slug: 'concepts/constructing-utility-functions' },
						{ label: 'Interlude: Untrustworthy Sources', slug: 'concepts/untrustworthy-sources' },
						{ label: 'Interlude: The Funding Effect', slug: 'case-studies/the-funding-effect' },
					],
				},
				{
					label: 'Part II — The Processes',
					collapsed: false,
					items: [
						{ label: '6. The Process Catalogue', slug: 'concepts/process-catalogue' },
						{ label: '7. What Grounds an Oversight Protocol?', slug: 'concepts/oversight-protocols' },
						{ label: '8. Consistency Evaluations', slug: 'proposals/consistency-evals' },
						{ label: '9. What Is a Strong Reasoner?', slug: 'concepts/what-is-a-strong-reasoner' },
						{ label: '10. Attack Models (planned)', link: '/#the-book' },
						{ label: '11. Hardening Techniques', slug: 'concepts/hardening-techniques' },
						{ label: 'The Construction Catalogue', slug: 'concepts/construction-catalogue' },
						{ label: '12. Certification and Gyms (planned)', link: '/#the-book' },
					],
				},
				{
					label: 'Part III — The Environment',
					collapsed: false,
					items: [
						{ label: '13–16. Identity, Markets, Law, Culture (planned)', link: '/#the-book' },
					],
				},
				{
					label: 'Part IV — Applications',
					collapsed: false,
					items: [
						{ label: '17. The Reliability Ladder', slug: 'concepts/epistemic-applications' },
						{ label: '18. Overseeing Automated Research', slug: 'proposals/overseeing-automated-research' },
						{ label: '19. LLM Epistemics in Production', slug: 'case-studies/llm-epistemics-in-production' },
						{ label: '20. Open Problems', slug: 'open-questions' },
					],
				},
				{
					label: 'Reference',
					collapsed: false,
					items: [
						{ label: 'Glossary & Notation', slug: 'reference/glossary' },
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
