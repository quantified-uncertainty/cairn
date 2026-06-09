// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/getting-started/minimal-framework/': '/getting-started/core-concepts/',
		'/getting-started/how-sections-connect/': '/getting-started/reading-order/',
		'/reference/visual-sitemap/': '/reference/site-map/',
		'/research/risk-methods/complexity-pricing/': '/research/risk-methods/risk-measurement-and-pricing/',
		'/research/risk-methods/compositional-risk-measures/': '/research/risk-methods/risk-measurement-and-pricing/',
		'/research/risk-methods/alignment-tax-quantification/': '/research/risk-methods/risk-measurement-and-pricing/',
		'/research/trust-behavior/trust-dynamics-adversarial-pressure/': '/research/trust-behavior/empirical-scheming-reduction/',
		'/research/hierarchy-visualization/': '/research/',
	},
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [
		react(),
		mermaid(),
		starlight({
			title: 'Delegation Risk',
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
				{ icon: 'document', label: 'Download PDF', href: 'https://github.com/quantified-uncertainty/delegation-risk-framework/releases/download/v1.0.0/delegation-risk-framework-book.pdf' },
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/delegation-risk-framework' },
			],
			sidebar: [
				{
					label: 'The Core Path',
					slug: 'getting-started/reading-order',
					badge: { text: 'Start Here', variant: 'tip' },
				},
				{
					label: 'Getting Started',
					collapsed: false,
					items: [
						{ label: 'Overview', slug: 'getting-started' },
						{ label: 'Five-Minute Intro', slug: 'getting-started/five-minute-intro' },
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Core Concepts', slug: 'getting-started/core-concepts' },
						{ label: 'Reading Order & The Core Path', slug: 'getting-started/reading-order' },
						{ label: 'For Engineers', slug: 'getting-started/for-engineers' },
						{ label: 'Common Mistakes', slug: 'getting-started/common-mistakes' },
						{ label: 'FAQ', slug: 'getting-started/faq' },
					],
				},
				{
					label: 'Delegation Risk',
					collapsed: true,
					autogenerate: { directory: 'delegation-risk' },
				},
				{
					label: 'Power Dynamics',
					collapsed: true,
					autogenerate: { directory: 'power-dynamics' },
				},
				{
					label: 'Entanglements',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'entanglements', badge: { text: 'Core', variant: 'tip' } },
						{
							label: 'Fundamentals',
							collapsed: true,
							autogenerate: { directory: 'entanglements/fundamentals' },
						},
						{
							label: 'Detection & Measurement',
							collapsed: true,
							autogenerate: { directory: 'entanglements/detection' },
						},
						{
							label: 'Mitigation',
							collapsed: true,
							autogenerate: { directory: 'entanglements/mitigation' },
						},
						{
							label: 'Research',
							collapsed: true,
							autogenerate: { directory: 'entanglements/research' },
						},
						{
							label: 'Case Studies',
							collapsed: true,
							autogenerate: { directory: 'entanglements/case-studies' },
						},
						{
							label: 'Cross-Domain Patterns',
							collapsed: true,
							autogenerate: { directory: 'entanglements/cross-domain' },
						},
					],
				},
				{
					label: 'Design Patterns',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'design-patterns' },
						{ label: 'Composing Patterns', slug: 'design-patterns/composing-patterns', badge: { text: 'Core', variant: 'tip' } },
						{ label: 'Principles to Practice', slug: 'design-patterns/principles-to-practice' },
						{ label: 'Architecture Overview', slug: 'design-patterns/decomposed-coordination' },
						{ label: 'Safety Mechanisms', slug: 'design-patterns/safety-mechanisms' },
						{ label: 'Forecasting & Navigation', slug: 'design-patterns/forecasting-navigation' },
						{ label: 'Least-X Principles', slug: 'design-patterns/least-x-principles' },
						{ label: 'Coordinator Constraints', slug: 'design-patterns/coordinator-constraints' },
						{
							label: 'Pattern Categories',
							collapsed: true,
							items: [
								{ label: 'Structural', slug: 'design-patterns/structural', badge: { text: 'Core', variant: 'tip' } },
								{ label: 'Verification', slug: 'design-patterns/verification' },
								{ label: 'Information', slug: 'design-patterns/information' },
								{ label: 'Temporal', slug: 'design-patterns/temporal' },
								{ label: 'Monitoring', slug: 'design-patterns/monitoring' },
								{ label: 'Multi-Agent', slug: 'design-patterns/multi-agent' },
								{ label: 'Incentive', slug: 'design-patterns/incentive' },
								{ label: 'Recovery', slug: 'design-patterns/recovery' },
								{ label: 'Channel Integrity', slug: 'design-patterns/channel-integrity', badge: { text: 'Core', variant: 'tip' } },
							],
						},
						{
							label: 'Worked Examples',
							collapsed: true,
							autogenerate: { directory: 'design-patterns/examples' },
						},
						{
							label: 'Tools & Guides',
							collapsed: true,
							autogenerate: { directory: 'design-patterns/tools' },
						},
					],
				},
				{
					label: 'Case Studies',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'case-studies' },
						{
							label: 'AI Systems',
							collapsed: true,
							autogenerate: { directory: 'case-studies/ai-systems' },
						},
						{
							label: 'Human Systems',
							collapsed: true,
							autogenerate: { directory: 'case-studies/human-systems' },
						},
						{
							label: 'The Anomaly Chronicles',
							collapsed: true,
							autogenerate: { directory: 'case-studies/anomaly-chronicles' },
						},
					],
				},
				{
					label: 'Cross-Domain Methods',
					collapsed: true,
					autogenerate: { directory: 'cross-domain-methods' },
				},
				{
					label: 'Research',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'research' },
						{
							label: 'Theoretical Foundations',
							collapsed: true,
							autogenerate: { directory: 'research/theory' },
						},
						{
							label: 'Risk & Financial Methods',
							collapsed: true,
							autogenerate: { directory: 'research/risk-methods' },
						},
						{
							label: 'Technical Safety',
							collapsed: true,
							autogenerate: { directory: 'research/technical-safety' },
						},
						{
							label: 'System Design',
							collapsed: true,
							autogenerate: { directory: 'research/system-design' },
						},
						{
							label: 'Trust & Behavior',
							collapsed: true,
							autogenerate: { directory: 'research/trust-behavior' },
						},
						{ label: 'Potential Projects', slug: 'research/potential-projects' },
					],
				},
				{
					label: 'Experimental',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'experimental' },
						{
							label: 'Probabilistic Estimation',
							collapsed: true,
							items: [
								{ label: 'Overview', slug: 'experimental/probabilistic-estimation' },
								{
									label: 'Interactive Tools',
									collapsed: true,
									autogenerate: { directory: 'experimental/probabilistic-estimation/tools' },
								},
								{
									label: 'Estimates Registry',
									collapsed: true,
									autogenerate: { directory: 'experimental/probabilistic-estimation/estimates' },
								},
							],
						},
					],
				},
				{
					label: 'Reference',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'reference' },
						{ label: 'Glossary', slug: 'getting-started/glossary' },
						{ label: 'Quick Reference', slug: 'getting-started/quick-reference' },
						{ label: 'Examples Catalog', slug: 'getting-started/examples-catalog' },
						{ label: 'About This Site', slug: 'reference/about-this-site' },
						{ label: 'Related Approaches', slug: 'reference/related-approaches' },
						{ label: 'Bibliography', slug: 'reference/bibliography' },
						{ label: 'Roadmap', slug: 'reference/roadmap' },
						{ label: 'Site Map', slug: 'reference/site-map' },
						{ label: 'Potential Examples', slug: 'reference/potential-examples' },
					],
				},
			],
		}),
	],
});
