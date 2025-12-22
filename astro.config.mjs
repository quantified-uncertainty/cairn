// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
      react(),
      starlight({
          title: 'EA Crux Project',
          customCss: ['./src/styles/global.css'],
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
                  label: 'Knowledge Base',
                  items: [
                      { label: 'Labs', autogenerate: { directory: 'labs' } },
                      { label: 'Capabilities', autogenerate: { directory: 'capabilities' } },
                      { label: 'Risks', autogenerate: { directory: 'risks' } },
                      { label: 'Safety Agendas', autogenerate: { directory: 'safety-agendas' } },
                      { label: 'Policies', autogenerate: { directory: 'policies' } },
                  ],
              },
              {
                  label: 'Cross-Cutting Views',
                  items: [
                      { label: 'Timelines', autogenerate: { directory: 'timelines' } },
                      { label: 'Scenarios', autogenerate: { directory: 'scenarios' } },
                      { label: 'Interventions', autogenerate: { directory: 'interventions' } },
                  ],
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

  vite: {
    plugins: [tailwindcss()],
  },
});