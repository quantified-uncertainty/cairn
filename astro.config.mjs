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
                  collapsed: true,
                  items: [
                      { label: 'Overview', slug: 'understanding-ai-risk' },
                      { label: 'Core Argument', collapsed: true, autogenerate: { directory: 'understanding-ai-risk/core-argument' } },
                      { label: 'Risk Models', collapsed: true, autogenerate: { directory: 'understanding-ai-risk/models' } },
                      { label: 'Worldviews', collapsed: true, autogenerate: { directory: 'understanding-ai-risk/worldviews' } },
                      { label: 'Key Debates', collapsed: true, autogenerate: { directory: 'understanding-ai-risk/debates' } },
                      { label: 'Arguments', collapsed: true, autogenerate: { directory: 'understanding-ai-risk/arguments' } },
                      { label: 'Reasoning Challenges', collapsed: true, autogenerate: { directory: 'understanding-ai-risk/reasoning' } },
                  ],
              },
              {
                  label: 'Knowledge Base',
                  collapsed: true,
                  items: [
                      { label: 'Responses & Interventions', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/responses' },
                          { label: 'Technical Approaches', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/technical' } },
                          { label: 'Governance', collapsed: true, items: [
                              { label: 'Overview', slug: 'knowledge-base/responses/governance' },
                              { label: 'Legislation', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/legislation' } },
                              { label: 'Policy Approaches', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/policy-approaches' } },
                              { label: 'International', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/international' } },
                              { label: 'Industry Self-Regulation', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/industry' } },
                          ]},
                          { label: 'Institutions', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/institutions' } },
                          { label: 'Epistemic Tools', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/epistemic-tools' } },
                          { label: 'Institutional', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/institutional' } },
                          { label: 'Field Building', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/field-building' } },
                          { label: 'Resilience', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/resilience' } },
                      ]},
                      { label: 'Risks & Failure Modes', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/risks' },
                          { label: 'Accident Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/accident' } },
                          { label: 'Misuse Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/misuse' } },
                          { label: 'Structural Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/structural' } },
                          { label: 'Epistemic Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/epistemic' } },
                      ]},
                      { label: 'Key Uncertainties', collapsed: true, autogenerate: { directory: 'knowledge-base/cruxes' } },
                      { label: 'Organizations', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/organizations' },
                          { label: 'AI Labs', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations/labs' } },
                          { label: 'Safety Research Orgs', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations/safety-orgs' } },
                          { label: 'Government Institutes', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations/government' } },
                      ]},
                      { label: 'People', collapsed: true, autogenerate: { directory: 'knowledge-base/people' } },
                      { label: 'Funders', collapsed: true, autogenerate: { directory: 'knowledge-base/funders' } },
                      { label: 'AI Capabilities', collapsed: true, autogenerate: { directory: 'knowledge-base/capabilities' } },
                      { label: 'History', collapsed: true, autogenerate: { directory: 'knowledge-base/history' } },
                      { label: 'Key Literature', collapsed: true, autogenerate: { directory: 'knowledge-base/literature' } },
                  ],
              },
              {
                  label: 'Analysis',
                  collapsed: true,
                  items: [
                      { label: 'Overview', slug: 'analysis' },
                      { label: 'Scenarios', collapsed: true, autogenerate: { directory: 'analysis/scenarios' } },
                      { label: 'Case Studies', collapsed: true, autogenerate: { directory: 'analysis/case-studies' } },
                      { label: 'AI Timeline', slug: 'analysis/ai-timeline' },
                      { label: 'Risk Map', slug: 'analysis/risk-map' },
                      { label: 'Estimates Dashboard', slug: 'analysis/estimates-dashboard' },
                      { label: 'Comparisons', slug: 'analysis/comparisons' },
                  ],
              },
              {
                  label: 'Interactive Tools',
                  collapsed: true,
                  autogenerate: { directory: 'guides' },
              },
          ],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});