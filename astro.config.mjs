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
                  label: 'Understanding AI Risk',
                  items: [
                      { label: 'Overview', slug: 'understanding-ai-risk' },
                      { label: 'Core Argument', autogenerate: { directory: 'understanding-ai-risk/core-argument' } },
                      { label: 'Risk Models', autogenerate: { directory: 'understanding-ai-risk/models' } },
                      { label: 'Worldviews', autogenerate: { directory: 'understanding-ai-risk/worldviews' } },
                  ],
              },
              {
                  label: 'Knowledge Base',
                  items: [
                      { label: 'Organizations', autogenerate: { directory: 'organizations' } },
                      { label: 'People', autogenerate: { directory: 'people' } },
                      { label: 'Capabilities', autogenerate: { directory: 'capabilities' } },
                      {
                          label: 'Risks & Failure Modes',
                          items: [
                              { label: 'Overview', slug: 'risks' },
                              { label: 'Accident Risks', autogenerate: { directory: 'risks/accident' } },
                              { label: 'Misuse Risks', autogenerate: { directory: 'risks/misuse' } },
                              { label: 'Structural Risks', autogenerate: { directory: 'risks/structural' } },
                              { label: 'Epistemic Risks', autogenerate: { directory: 'risks/epistemic' } },
                          ],
                      },
                      {
                          label: 'Safety Approaches',
                          items: [
                              { label: 'Overview', slug: 'safety-approaches' },
                              { label: 'Technical', autogenerate: { directory: 'safety-approaches/technical' } },
                              { label: 'Governance', autogenerate: { directory: 'safety-approaches/governance' } },
                              { label: 'Institutional', autogenerate: { directory: 'safety-approaches/institutional' } },
                          ],
                      },
                      { label: 'Policies', autogenerate: { directory: 'policies' } },
                  ],
              },
              {
                  label: 'Debates',
                  autogenerate: { directory: 'debates' },
              },
              {
                  label: 'Scenarios & Analysis',
                  items: [
                      { label: 'Future Scenarios', autogenerate: { directory: 'scenarios' } },
                      { label: 'Case Studies', autogenerate: { directory: 'analysis/case-studies' } },
                      { label: 'Interventions', autogenerate: { directory: 'analysis/interventions' } },
                      { label: 'Other Analysis', autogenerate: { directory: 'analysis' } },
                  ],
              },
              {
                  label: 'Resources',
                  autogenerate: { directory: 'resources' },
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