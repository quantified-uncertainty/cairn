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
						{ label: '1. Open Stacks (planned)', link: '/#the-book' },
						{ label: '2. What to Do First', slug: 'start-here/decision-guide' },
						{ label: '3. Cruxes', slug: 'start-here/cruxes' },
					],
				},
				{
					label: 'Part I — Getting the Text',
					collapsed: false,
					items: [
						{ label: '4. Open-Access Books and Textbooks', slug: 'access/open-books' },
						{ label: '5. The Public Domain and Open Corpora', slug: 'access/public-domain' },
						{ label: '6. Open Papers and Preprints', slug: 'access/open-papers' },
						{ label: '7. Grey Literature and Community Archives (planned)', link: '/#the-book' },
						{ label: '8. Cheap Subscriptions', slug: 'access/subscriptions' },
						{ label: '9. Public Libraries', slug: 'access/public-libraries' },
						{ label: '10. University and Employer Access', slug: 'access/academic-and-employer' },
						{ label: '11. Your Own Library (planned)', link: '/#the-book' },
						{ label: '12. The Shadow Libraries', slug: 'access/shadow-libraries' },
						{ label: '13. The Access Ladder', slug: 'access/access-ladder' },
					],
				},
				{
					label: 'Part II — Finding Things',
					collapsed: false,
					items: [
						{ label: '14. Catalogs and Metadata', slug: 'finding/catalogs-and-metadata' },
						{ label: '15. Browsing the Stacks', slug: 'finding/browsing-the-stacks' },
						{ label: '16. Searching Inside Books You Don’t Have', slug: 'finding/searching-inside-books' },
						{ label: '17. AI Research Assistants', slug: 'finding/ai-research-assistants' },
						{ label: '18. Curation: Syllabi, Experts and Reviews', slug: 'finding/curation' },
						{ label: '19. Lectures, Talks and Podcasts (planned)', link: '/#the-book' },
					],
				},
				{
					label: 'Part III — Interfaces: What Has Been Tried',
					collapsed: false,
					items: [
						{ label: '20. Foraging and Exploratory Search', slug: 'interfaces/exploratory-search' },
						{ label: '21. Maps of Knowledge', slug: 'interfaces/maps-of-knowledge' },
						{ label: '22. Reading Interfaces', slug: 'interfaces/reading-interfaces' },
						{ label: '23. Generative Interfaces', slug: 'interfaces/generative-interfaces' },
					],
				},
				{
					label: 'Part IV — Where You Read',
					collapsed: false,
					items: [
						{ label: '24. Reading Modes and Devices', slug: 'environments/reading-modes-and-devices' },
						{ label: '25. VR and Spatial Computing', slug: 'environments/vr-and-spatial-computing' },
						{ label: '26. Building a Virtual Reading Room', slug: 'environments/virtual-reading-room' },
					],
				},
				{
					label: 'Part V — Building Your Own',
					collapsed: false,
					items: [
						{ label: '27. The Legal Map', slug: 'building/legal-map' },
						{ label: '28. A Reference Architecture', slug: 'building/reference-architecture' },
						{ label: '29. Costs and Effort', slug: 'building/costs-and-effort' },
						{ label: '30. The Design Space', slug: 'building/design-space' },
						{ label: '31. Prototype Gallery (planned)', link: '/#the-book' },
					],
				},
				{
					label: 'Reference',
					collapsed: false,
					items: [
						{ label: 'Directory of Sources and Tools (planned)', link: '/#the-book' },
						{ label: 'Glossary (planned)', link: '/#the-book' },
						{ label: 'Open Problems (planned)', link: '/#the-book' },
						{ label: 'About the Research', slug: 'reference/methodology' },
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
