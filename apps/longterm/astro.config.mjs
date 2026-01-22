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
              // Custom right sidebar with minimap for AI Transition Model pages
              PageSidebar: './src/components/starlight/PageSidebar.astro',
              // Add MetaPanel for ?meta debugging on AI Transition Model pages
              PageFrame: './src/components/starlight/PageFrame.astro',
              // Add breadcrumbs for AI Transition Model pages
              PageTitle: './src/components/starlight/PageTitle.astro',
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
                  label: 'AI Transition Model',
                  collapsed: true,
                  items: [
                      { label: 'Overview', slug: 'ai-transition-model' },
                      { label: 'Parameter Table', slug: 'ai-transition-model/table' },
                      { label: 'Outcomes', collapsed: true, items: [
                          { slug: 'ai-transition-model/outcomes/existential-catastrophe' },
                          { slug: 'ai-transition-model/outcomes/long-term-trajectory' },
                      ]},
                      { label: 'Scenarios', collapsed: true, items: [
                          { label: 'AI Takeover', slug: 'ai-transition-model/scenarios/ai-takeover' },
                          { slug: 'ai-transition-model/scenarios/ai-takeover/rapid' },
                          { slug: 'ai-transition-model/scenarios/ai-takeover/gradual' },
                          { label: 'Human Catastrophe', slug: 'ai-transition-model/scenarios/human-catastrophe' },
                          { slug: 'ai-transition-model/scenarios/human-catastrophe/state-actor' },
                          { slug: 'ai-transition-model/scenarios/human-catastrophe/rogue-actor' },
                          { label: 'Long-term Lock-in', slug: 'ai-transition-model/scenarios/long-term-lockin' },
                          { slug: 'ai-transition-model/scenarios/long-term-lockin/economic-power' },
                          { slug: 'ai-transition-model/scenarios/long-term-lockin/political-power' },
                          { slug: 'ai-transition-model/scenarios/long-term-lockin/epistemics' },
                          { slug: 'ai-transition-model/scenarios/long-term-lockin/values' },
                          { slug: 'ai-transition-model/scenarios/long-term-lockin/suffering-lock-in' },
                      ]},
                      { label: 'AI Factors', collapsed: true, items: [
                          { label: 'Misalignment Potential', slug: 'ai-transition-model/factors/misalignment-potential' },
                          { slug: 'ai-transition-model/factors/misalignment-potential/technical-ai-safety' },
                          { slug: 'ai-transition-model/factors/misalignment-potential/ai-governance' },
                          { slug: 'ai-transition-model/factors/misalignment-potential/lab-safety-practices' },
                          { label: 'AI Capabilities', slug: 'ai-transition-model/factors/ai-capabilities' },
                          { slug: 'ai-transition-model/factors/ai-capabilities/compute' },
                          { slug: 'ai-transition-model/factors/ai-capabilities/algorithms' },
                          { slug: 'ai-transition-model/factors/ai-capabilities/adoption' },
                          { label: 'AI Uses', slug: 'ai-transition-model/factors/ai-uses' },
                          { slug: 'ai-transition-model/factors/ai-uses/recursive-ai-capabilities' },
                          { slug: 'ai-transition-model/factors/ai-uses/industries' },
                          { slug: 'ai-transition-model/factors/ai-uses/governments' },
                          { slug: 'ai-transition-model/factors/ai-uses/coordination' },
                          { label: 'AI Ownership', slug: 'ai-transition-model/factors/ai-ownership' },
                          { slug: 'ai-transition-model/factors/ai-ownership/countries' },
                          { slug: 'ai-transition-model/factors/ai-ownership/companies' },
                          { slug: 'ai-transition-model/factors/ai-ownership/shareholders' },
                      ]},
                      { label: 'Civilizational Factors', collapsed: true, items: [
                          { label: 'Civilizational Competence', slug: 'ai-transition-model/factors/civilizational-competence' },
                          { slug: 'ai-transition-model/factors/civilizational-competence/governance' },
                          { slug: 'ai-transition-model/factors/civilizational-competence/epistemics' },
                          { slug: 'ai-transition-model/factors/civilizational-competence/adaptability' },
                          { label: 'Transition Turbulence', slug: 'ai-transition-model/factors/transition-turbulence' },
                          { slug: 'ai-transition-model/factors/transition-turbulence/economic-stability' },
                          { slug: 'ai-transition-model/factors/transition-turbulence/racing-intensity' },
                          { label: 'Misuse Potential', slug: 'ai-transition-model/factors/misuse-potential' },
                          { slug: 'ai-transition-model/factors/misuse-potential/biological-threat-exposure' },
                          { slug: 'ai-transition-model/factors/misuse-potential/cyber-threat-exposure' },
                          { slug: 'ai-transition-model/factors/misuse-potential/robot-threat-exposure' },
                          { slug: 'ai-transition-model/factors/misuse-potential/surprise-threat-exposure' },
                      ]},
                      { label: 'Models', collapsed: true, items: [
                          { slug: 'ai-transition-model/models/compute-forecast-sketch' },
                      ]},
                  ],
              },
              {
                  label: 'Knowledge Base',
                  collapsed: true,
                  items: [
                      { label: 'Overview', slug: 'knowledge-base' },
                      { label: 'Directory', slug: 'knowledge-base/directory' },
                      { label: 'Interventions', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/responses' },
                          { label: 'AI Alignment', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/alignment' } },
                          { label: 'Safety Generalizability', collapsed: true, items: [
                              { label: 'Table View', link: '/knowledge-base/responses/safety-generalizability/table' },
                              { label: 'Matrix View', link: '/knowledge-base/responses/safety-generalizability/matrix' },
                              { label: 'Graph View', link: '/knowledge-base/responses/safety-generalizability/graph' },
                          ]},
                          { label: 'Governance', collapsed: true, items: [
                              { label: 'Overview', slug: 'knowledge-base/responses/governance' },
                              { label: 'Legislation', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/legislation' } },
                              { label: 'Compute Governance', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/compute-governance' } },
                              { label: 'International', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/international' } },
                              { label: 'Industry Self-Regulation', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/industry' } },
                              { label: 'Effectiveness Assessment', slug: 'knowledge-base/responses/governance/effectiveness-assessment' },
                          ]},
                          { label: 'Institutions', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/institutions' } },
                          { label: 'Epistemic Tools', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/epistemic-tools' } },
                          { label: 'Organizational Practices', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/organizational-practices' } },
                          { label: 'Field Building', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/field-building' } },
                          { label: 'Resilience', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/resilience' } },
                      ]},
                      { label: 'Risks', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/risks' },
                          { label: 'Accident Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/accident' } },
                          { label: 'Misuse Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/misuse' } },
                          { label: 'Structural Risks', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/structural' } },
                          { label: 'Epistemic Harms', collapsed: true, autogenerate: { directory: 'knowledge-base/risks/epistemic' } },
                      ]},
                      { label: 'Organizations', collapsed: true, items: [
                          { label: 'Overview', slug: 'knowledge-base/organizations' },
                          { label: 'AI Labs', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations/labs' } },
                          { label: 'Safety Research Orgs', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations/safety-orgs' } },
                          { label: 'Government Institutes', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations/government' } },
                      ]},
                      { label: 'People', collapsed: true, autogenerate: { directory: 'knowledge-base/people' } },
                      { label: 'AI Capabilities', collapsed: true, autogenerate: { directory: 'knowledge-base/capabilities' } },
                      { label: 'History', collapsed: true, autogenerate: { directory: 'knowledge-base/history' } },
                      { label: 'Key Metrics', collapsed: true, autogenerate: { directory: 'knowledge-base/metrics' } },
                      { label: 'Models', collapsed: true, autogenerate: { directory: 'knowledge-base/models' } },
                      { label: 'Intelligence Paradigms', collapsed: true, items: [
                          { slug: 'knowledge-base/intelligence-paradigms' },
                          { label: 'Comparison Table', link: '/knowledge-base/architecture-scenarios/table' },
                          { label: 'Paradigm Pages', collapsed: true, autogenerate: { directory: 'knowledge-base/intelligence-paradigms' } },
                      ]},
                      { label: 'Future Projections', collapsed: true, autogenerate: { directory: 'knowledge-base/future-projections' } },
                      { label: 'Worldviews', collapsed: true, autogenerate: { directory: 'knowledge-base/worldviews' } },
                      { label: 'Key Debates', collapsed: true, autogenerate: { directory: 'knowledge-base/debates' } },
                      { label: 'Research Reports', collapsed: true, autogenerate: { directory: 'knowledge-base/research-reports' } },
                  ],
              },
              {
                  label: 'Browse',
                  collapsed: false,
                  items: [
                      { label: 'All Entities', slug: 'browse' },
                      { label: 'By Tag', slug: 'browse/tags' },
                      { label: 'External Resources', slug: 'browse/resources' },
                  ],
              },
              {
                  label: 'Interactive Tools',
                  collapsed: true,
                  autogenerate: { directory: 'guides' },
              },
              {
                  label: 'Internal',
                  collapsed: true,
                  autogenerate: { directory: 'internal' },
              },
              {
                  label: 'Project',
                  collapsed: true,
                  autogenerate: { directory: 'project' },
              },
              {
                  label: 'Meta',
                  collapsed: true,
                  items: [
                      { label: 'About & Transparency', slug: 'about' },
                      { label: 'Dashboard', slug: 'dashboard' },
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
        // Ensure mermaid's dynamic imports are bundled
        target: 'esnext',
      },
    },
    ssr: {
      // Don't externalize mermaid - bundle it
      noExternal: ['mermaid'],
    },
  },

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
