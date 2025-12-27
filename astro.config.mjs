// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ea-crux-project.netlify.app',
  integrations: [
      react(),
      starlight({
          title: 'EA Crux Project',
          customCss: ['./src/styles/global.css'],
          components: {
              // Auto-inject PageStatus from frontmatter
              MarkdownContent: './src/components/starlight/MarkdownContent.astro',
              // Add dev mode toggle to header
              Header: './src/components/starlight/Header.astro',
              // Add dev mode init script to head
              Head: './src/components/starlight/Head.astro',
          },
          tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 2 },
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
                      { label: 'Overview', slug: 'knowledge-base' },
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
                          { label: 'Organizational Practices', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/institutional' } },
                          { label: 'Field Building', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/field-building' } },
                          { label: 'Resilience', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/resilience' } },
                      ]},
                      { label: 'Risks & Failure Modes', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/risks' },
                          { label: 'Accident Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/accident' } },
                          { label: 'Misuse Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/misuse' } },
                          { label: 'Structural Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/structural' } },
                          { label: 'Epistemic Harms', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/epistemic' } },
                      ]},
                      { label: 'Risk Factors', collapsed: true, autogenerate: { directory: 'knowledge-base/risk-factors' } },
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
                      { label: 'Key Metrics', collapsed: true, autogenerate: { directory: 'knowledge-base/metrics' } },
                      { label: 'Models', collapsed: true, autogenerate: { directory: 'knowledge-base/models' } },
                      { label: 'Scenarios', collapsed: true, autogenerate: { directory: 'knowledge-base/scenarios' } },
                  ],
              },
              {
                  label: 'Browse',
                  collapsed: false,
                  items: [
                      { label: 'All Entities', slug: 'browse' },
                      { label: 'By Tag', slug: 'browse/tags' },
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

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
