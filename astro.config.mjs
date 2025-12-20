// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	integrations: [
		react(),
		starlight({
			title: 'EA Crux Project',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/ea-crux-project' },
			],
			sidebar: [
				{
					label: 'Getting Started',
					autogenerate: { directory: 'getting-started' },
				},
				{
					label: 'The Risk Argument',
					autogenerate: { directory: 'risk-argument' },
				},
				{
					label: 'Risk Models',
					autogenerate: { directory: 'models' },
				},
				{
					label: 'Safety Approaches',
					autogenerate: { directory: 'approaches' },
				},
				{
					label: 'Worldviews',
					autogenerate: { directory: 'worldviews' },
				},
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
