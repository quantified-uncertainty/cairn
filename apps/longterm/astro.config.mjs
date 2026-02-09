// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://longtermwiki.vercel.app',
  integrations: [
      react(),
      starlight({
          title: 'LongtermWiki',
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
              // Custom footer with version display
              Footer: './src/components/starlight/Footer.astro',
              // Path-based sidebar filtering (public vs internal)
              Sidebar: './src/components/starlight/Sidebar.astro',
          },
          tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 2 },
          social: [
              { icon: 'github', label: 'GitHub', href: 'https://github.com/quantified-uncertainty/cairn' },
          ],
          sidebar: [
              // Top-level navigation items
              { label: 'Explore All Content', link: '/explore', attrs: { class: 'sidebar-icon-explore' } },
              // Main content sections
              {
                  label: 'Interventions',
                  collapsed: true,
                  items: [
                      { label: 'AI Alignment', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/alignment' },
                          { slug: 'knowledge-base/responses/technical-research' },
                          { slug: 'knowledge-base/responses/research-agendas' },
                          { slug: 'knowledge-base/responses/anthropic-core-views' },
                          { slug: 'knowledge-base/responses/ai-assisted' },
                      ]},
                      { label: 'Safety Generalizability', collapsed: true, items: [
                          { label: 'Table View', link: '/knowledge-base/responses/safety-generalizability/table', attrs: { class: 'sidebar-icon-table' } },
                          { label: 'Matrix View', link: '/knowledge-base/responses/safety-generalizability/matrix', attrs: { class: 'sidebar-icon-matrix' } },
                      ]},
                      { label: 'Governance', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/governance-policy' },
                          { slug: 'knowledge-base/responses/compute-governance' },
                          { slug: 'knowledge-base/responses/effectiveness-assessment' },
                          { label: 'Legislation', collapsed: true, items: [
                              { slug: 'knowledge-base/responses/us-executive-order' },
                              { slug: 'knowledge-base/responses/us-state-legislation' },
                              { slug: 'knowledge-base/responses/california-sb1047' },
                              { slug: 'knowledge-base/responses/california-sb53' },
                              { slug: 'knowledge-base/responses/colorado-ai-act' },
                              { slug: 'knowledge-base/responses/new-york-raise-act' },
                              { slug: 'knowledge-base/responses/texas-traiga' },
                              { slug: 'knowledge-base/responses/canada-aida' },
                              { slug: 'knowledge-base/responses/china-ai-regulations' },
                              { slug: 'knowledge-base/responses/eu-ai-act' },
                              { slug: 'knowledge-base/responses/nist-ai-rmf' },
                              { slug: 'knowledge-base/responses/failed-stalled-proposals' },
                          ]},
                          { label: 'Compute Governance', collapsed: true, items: [
                              { slug: 'knowledge-base/responses/hardware-enabled-governance' },
                              { slug: 'knowledge-base/responses/monitoring' },
                              { slug: 'knowledge-base/responses/export-controls' },
                              { slug: 'knowledge-base/responses/international-regimes' },
                          ]},
                          { label: 'International Governance', collapsed: true, items: [
                              { slug: 'knowledge-base/responses/international-summits' },
                              { slug: 'knowledge-base/responses/bletchley-declaration' },
                              { slug: 'knowledge-base/responses/seoul-declaration' },
                              { slug: 'knowledge-base/responses/coe-ai-convention' },
                          ]},
                          { label: 'Industry Self-Regulation', collapsed: true, items: [
                              { slug: 'knowledge-base/responses/voluntary-commitments' },
                              { slug: 'knowledge-base/responses/responsible-scaling-policies' },
                              { slug: 'knowledge-base/responses/model-registries' },
                              { slug: 'knowledge-base/responses/model-spec' },
                          ]},
                      ]},
                      { label: 'Institutions', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/ai-safety-institutes' },
                          { slug: 'knowledge-base/responses/standards-bodies' },
                          { slug: 'knowledge-base/organizations/frontier-model-forum' },
                      ]},
                      { label: 'Epistemic & Forecasting', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/epistemic-infrastructure' },
                          { label: 'Approaches', collapsed: true, items: [
                              { slug: 'knowledge-base/responses/epistemic-tools-approaches-overview' },
                              { slug: 'knowledge-base/responses/ai-forecasting' },
                              { slug: 'knowledge-base/responses/prediction-markets' },
                              { slug: 'knowledge-base/responses/community-notes-for-everything' },
                              { slug: 'knowledge-base/responses/content-authentication' },
                              { slug: 'knowledge-base/responses/coordination-tech' },
                              { slug: 'knowledge-base/responses/deepfake-detection' },
                              { slug: 'knowledge-base/responses/epistemic-virtue-evals' },
                              { slug: 'knowledge-base/responses/hybrid-systems' },
                              { slug: 'knowledge-base/responses/provenance-tracing' },
                              { slug: 'knowledge-base/responses/reliability-tracking' },
                              { slug: 'knowledge-base/responses/rhetoric-highlighting' },
                          ]},
                          { label: 'Tools & Platforms', collapsed: true, items: [
                              { slug: 'knowledge-base/responses/epistemic-tools-tools-overview' },
                              { slug: 'knowledge-base/responses/ai-forecasting-benchmark' },
                              { slug: 'knowledge-base/responses/ai-watch' },
                              { slug: 'knowledge-base/responses/community-notes' },
                              { slug: 'knowledge-base/responses/donations-list-website' },
                              { slug: 'knowledge-base/responses/forecastbench' },
                              { slug: 'knowledge-base/responses/longterm-wiki' },
                              { slug: 'knowledge-base/responses/metaforecast' },
                              { slug: 'knowledge-base/responses/mit-ai-risk-repository' },
                              { slug: 'knowledge-base/responses/org-watch' },
                              { slug: 'knowledge-base/responses/roastmypost' },
                              { slug: 'knowledge-base/responses/squiggle' },
                              { slug: 'knowledge-base/responses/squiggleai' },
                              { slug: 'knowledge-base/responses/stampy-aisafety-info' },
                              { slug: 'knowledge-base/responses/timelines-wiki' },
                              { slug: 'knowledge-base/responses/wikipedia-views' },
                              { slug: 'knowledge-base/responses/xpt' },
                          ]},
                      ]},
                      { label: 'Organizational Practices', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/lab-culture' },
                          { slug: 'knowledge-base/responses/open-source' },
                          { slug: 'knowledge-base/responses/pause' },
                          { slug: 'knowledge-base/responses/whistleblower-protections' },
                      ]},
                      { label: 'Field Building', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/field-building-analysis' },
                          { slug: 'knowledge-base/responses/corporate-influence' },
                          { slug: 'knowledge-base/responses/training-programs' },
                          { slug: 'knowledge-base/responses/ai-for-human-reasoning-fellowship' },
                      ]},
                      { label: 'Resilience', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/epistemic-security' },
                          { slug: 'knowledge-base/responses/labor-transition' },
                      ]},
                      { label: 'Biosecurity', collapsed: true, items: [
                          { slug: 'knowledge-base/responses/biosecurity-overview' },
                      ]},
                  ],
              },
              {
                  label: 'Risks',
                  collapsed: true,
                  items: [
                      { label: 'Accident Risks', collapsed: true, items: [
                          { slug: 'knowledge-base/risks/scheming' },
                          { slug: 'knowledge-base/risks/deceptive-alignment' },
                          { slug: 'knowledge-base/risks/goal-misgeneralization' },
                          { slug: 'knowledge-base/risks/reward-hacking' },
                          { slug: 'knowledge-base/risks/power-seeking' },
                          { slug: 'knowledge-base/risks/instrumental-convergence' },
                          { slug: 'knowledge-base/risks/mesa-optimization' },
                          { slug: 'knowledge-base/risks/sharp-left-turn' },
                          { slug: 'knowledge-base/risks/treacherous-turn' },
                          { slug: 'knowledge-base/risks/emergent-capabilities' },
                          { slug: 'knowledge-base/risks/distributional-shift' },
                          { slug: 'knowledge-base/risks/corrigibility-failure' },
                          { slug: 'knowledge-base/risks/sleeper-agents' },
                          { slug: 'knowledge-base/risks/sandbagging' },
                          { slug: 'knowledge-base/risks/steganography' },
                          { slug: 'knowledge-base/risks/sycophancy' },
                          { slug: 'knowledge-base/risks/automation-bias' },
                          { slug: 'knowledge-base/risks/rogue-ai-scenarios' },
                      ]},
                      { label: 'Misuse Risks', collapsed: true, items: [
                          { slug: 'knowledge-base/risks/bioweapons' },
                          { slug: 'knowledge-base/risks/cyberweapons' },
                          { slug: 'knowledge-base/risks/autonomous-weapons' },
                          { slug: 'knowledge-base/risks/deepfakes' },
                          { slug: 'knowledge-base/risks/disinformation' },
                          { slug: 'knowledge-base/risks/fraud' },
                          { slug: 'knowledge-base/risks/surveillance' },
                          { slug: 'knowledge-base/risks/authoritarian-tools' },
                          { slug: 'knowledge-base/risks/consensus-manufacturing' },
                      ]},
                      { label: 'Structural Risks', collapsed: true, items: [
                          { slug: 'knowledge-base/risks/concentration-of-power' },
                          { slug: 'knowledge-base/risks/winner-take-all' },
                          { slug: 'knowledge-base/risks/lock-in' },
                          { slug: 'knowledge-base/risks/racing-dynamics' },
                          { slug: 'knowledge-base/risks/multipolar-trap' },
                          { slug: 'knowledge-base/risks/economic-disruption' },
                          { slug: 'knowledge-base/risks/flash-dynamics' },
                          { slug: 'knowledge-base/risks/proliferation' },
                          { slug: 'knowledge-base/risks/irreversibility' },
                          { slug: 'knowledge-base/risks/enfeeblement' },
                          { slug: 'knowledge-base/risks/authoritarian-takeover' },
                      ]},
                      { label: 'Epistemic Risks', collapsed: true, items: [
                          { slug: 'knowledge-base/risks/epistemic-collapse' },
                          { slug: 'knowledge-base/risks/epistemic-sycophancy' },
                          { slug: 'knowledge-base/risks/expertise-atrophy' },
                          { slug: 'knowledge-base/risks/authentication-collapse' },
                          { slug: 'knowledge-base/risks/reality-fragmentation' },
                          { slug: 'knowledge-base/risks/preference-manipulation' },
                          { slug: 'knowledge-base/risks/knowledge-monopoly' },
                          { slug: 'knowledge-base/risks/historical-revisionism' },
                          { slug: 'knowledge-base/risks/institutional-capture' },
                          { slug: 'knowledge-base/risks/learned-helplessness' },
                          { slug: 'knowledge-base/risks/erosion-of-agency' },
                          { slug: 'knowledge-base/risks/scientific-corruption' },
                          { slug: 'knowledge-base/risks/cyber-psychosis' },
                          { slug: 'knowledge-base/risks/legal-evidence-crisis' },
                          { slug: 'knowledge-base/risks/trust-cascade' },
                          { slug: 'knowledge-base/risks/trust-decline' },
                          { slug: 'knowledge-base/risks/ai-welfare' },
                      ]},
                  ],
              },
              {
                  label: 'Organizations',
                  collapsed: true,
                  items: [
                      { label: 'AI Labs', collapsed: true, autogenerate: { directory: 'knowledge-base/organizations' } },
                  ],
              },
              { label: 'People', collapsed: true, autogenerate: { directory: 'knowledge-base/people' } },
              { label: 'AI Capabilities', collapsed: true, autogenerate: { directory: 'knowledge-base/capabilities' } },
              {
                  label: 'Debates & Cruxes',
                  collapsed: true,
                  items: [
                      { label: 'Debates', collapsed: true, autogenerate: { directory: 'knowledge-base/debates' } },
                      { label: 'Cruxes', collapsed: true, autogenerate: { directory: 'knowledge-base/cruxes' } },
                  ],
              },
              {
                  label: 'Reports',
                  collapsed: true,
                  autogenerate: { directory: 'knowledge-base/reports' },
              },
              {
                  label: 'Background & Context',
                  collapsed: true,
                  items: [
                      { label: 'History', collapsed: true, autogenerate: { directory: 'knowledge-base/history' } },
                      { label: 'Incidents', collapsed: true, autogenerate: { directory: 'knowledge-base/incidents' } },
                      { label: 'Intelligence Paradigms', collapsed: true, items: [
                          { label: 'Comparison Table', link: '/knowledge-base/architecture-scenarios/table', attrs: { class: 'sidebar-icon-table' } },
                          { label: 'Paradigms', collapsed: true, autogenerate: { directory: 'knowledge-base/intelligence-paradigms' } },
                      ]},
                      { label: 'Forecasting & Scenarios', collapsed: true, items: [
                          { label: 'AGI Forecasting', collapsed: true, autogenerate: { directory: 'knowledge-base/forecasting' } },
                          { label: 'Worldviews', collapsed: true, autogenerate: { directory: 'knowledge-base/worldviews' } },
                          { label: 'Future Projections', collapsed: true, autogenerate: { directory: 'knowledge-base/future-projections' } },
                      ]},
                      { label: 'Foundation Models', collapsed: true, autogenerate: { directory: 'knowledge-base/foundation-models' } },
                  ],
              },
              // AI Transition Model - comprehensive framework
              {
                  label: 'AI Transition Model',
                  collapsed: true,
                  items: [
                      { label: 'Overview', slug: 'ai-transition-model' },
                      { label: 'Parameter Table', slug: 'ai-transition-model/table', attrs: { class: 'sidebar-icon-table' } },
                      { label: 'Outcomes', collapsed: true, items: [
                          { slug: 'ai-transition-model/existential-catastrophe' },
                          { slug: 'ai-transition-model/long-term-trajectory' },
                      ]},
                      { label: 'Scenarios', collapsed: true, items: [
                          { label: 'AI Takeover', slug: 'ai-transition-model/scenarios-ai-takeover-overview' },
                          { slug: 'ai-transition-model/rapid' },
                          { slug: 'ai-transition-model/gradual' },
                          { label: 'Human Catastrophe', slug: 'ai-transition-model/scenarios-human-catastrophe-overview' },
                          { slug: 'ai-transition-model/state-actor' },
                          { slug: 'ai-transition-model/rogue-actor' },
                          { label: 'Long-term Lock-in', slug: 'ai-transition-model/scenarios-long-term-lockin-overview' },
                          { slug: 'ai-transition-model/economic-power' },
                          { slug: 'ai-transition-model/political-power' },
                          { slug: 'ai-transition-model/scenarios-long-term-lockin-epistemics' },
                          { slug: 'ai-transition-model/values' },
                          { slug: 'ai-transition-model/suffering-lock-in' },
                      ]},
                      { label: 'AI Factors', collapsed: true, items: [
                          { label: 'Misalignment Potential', slug: 'ai-transition-model/factors-misalignment-potential-overview' },
                          { slug: 'ai-transition-model/technical-ai-safety' },
                          { slug: 'ai-transition-model/ai-governance' },
                          { slug: 'ai-transition-model/lab-safety-practices' },
                          { label: 'AI Capabilities', slug: 'ai-transition-model/factors-ai-capabilities-overview' },
                          { slug: 'ai-transition-model/compute' },
                          { slug: 'ai-transition-model/algorithms' },
                          { slug: 'ai-transition-model/adoption' },
                          { label: 'AI Uses', slug: 'ai-transition-model/factors-ai-uses-overview' },
                          { slug: 'ai-transition-model/recursive-ai-capabilities' },
                          { slug: 'ai-transition-model/industries' },
                          { slug: 'ai-transition-model/governments' },
                          { slug: 'ai-transition-model/coordination' },
                          { label: 'AI Ownership', slug: 'ai-transition-model/factors-ai-ownership-overview' },
                          { slug: 'ai-transition-model/countries' },
                          { slug: 'ai-transition-model/companies' },
                          { slug: 'ai-transition-model/shareholders' },
                      ]},
                      { label: 'Civilizational Factors', collapsed: true, items: [
                          { label: 'Civilizational Competence', slug: 'ai-transition-model/factors-civilizational-competence-overview' },
                          { slug: 'ai-transition-model/governance' },
                          { slug: 'ai-transition-model/factors-civilizational-competence-epistemics' },
                          { slug: 'ai-transition-model/adaptability' },
                          { label: 'Transition Turbulence', slug: 'ai-transition-model/factors-transition-turbulence-overview' },
                          { slug: 'ai-transition-model/economic-stability' },
                          { slug: 'ai-transition-model/racing-intensity' },
                          { label: 'Misuse Potential', slug: 'ai-transition-model/factors-misuse-potential-overview' },
                          { slug: 'ai-transition-model/biological-threat-exposure' },
                          { slug: 'ai-transition-model/cyber-threat-exposure' },
                          { slug: 'ai-transition-model/robot-threat-exposure' },
                          { slug: 'ai-transition-model/surprise-threat-exposure' },
                      ]},
                      { label: 'Quantitative Models', collapsed: true, items: [
                          { slug: 'ai-transition-model/compute-forecast-sketch' },
                      ]},
                  ],
              },
              // Reference materials
              {
                  label: 'Reference',
                  collapsed: true,
                  items: [
                      { label: 'Analytical Models', collapsed: true, autogenerate: { directory: 'knowledge-base/models' } },
                      { label: 'Key Metrics', collapsed: true, autogenerate: { directory: 'knowledge-base/metrics' } },
                  ],
              },
              {
                  label: 'Dashboards & Tools',
                  collapsed: false,
                  items: [
                      { label: 'Dashboard', slug: 'dashboard' },
                      { label: 'Content Quality', slug: 'browse' },
                      { label: 'Enhancement Queue', slug: 'internal/enhancement-queue' },
                      { label: 'External Resources', slug: 'browse/resources' },
                      { label: 'Automation Tools', slug: 'internal/automation-tools' },
                      { label: 'Content Database', slug: 'internal/content-database' },
                  ],
              },
              {
                  label: 'Style Guides',
                  collapsed: true,
                  items: [
                      { label: 'Page Types', slug: 'internal/page-types' },
                      { label: 'Knowledge Base', slug: 'internal/knowledge-base' },
                      { label: 'Models', slug: 'internal/models' },
                      { label: 'Mermaid Diagrams', slug: 'internal/mermaid-diagrams' },
                      { label: 'Cause-Effect Diagrams', slug: 'internal/cause-effect-diagrams' },
                      { label: 'Research Reports', slug: 'internal/research-reports' },
                  ],
              },
              {
                  label: 'Experiments',
                  collapsed: true,
                  items: [
                      { label: 'Interactive Views', slug: 'guides/interactive-views' },
                      { label: 'Cause-Effect Demo', slug: 'guides/cause-effect-demo' },
                      { label: 'Insight Grid', slug: 'internal/insight-grid-experiments' },
                      { label: 'Risk Trajectory', slug: 'internal/risk-trajectory-experiments' },
                  ],
              },
              {
                  label: 'Research',
                  collapsed: true,
                  items: [
                      { label: 'Insight Hunting', collapsed: true, autogenerate: { directory: 'insight-hunting' } },
                      { label: 'Technical Reports', collapsed: true, autogenerate: { directory: 'internal/reports' } },
                      { label: 'Schema Docs', collapsed: true, autogenerate: { directory: 'internal/schema' } },
                  ],
              },
              {
                  label: 'Project',
                  collapsed: true,
                  items: [
                      { label: 'Overview', slug: 'project' },
                      { label: 'Vision', slug: 'project/vision' },
                      { label: 'Strategy', slug: 'project/strategy-brainstorm' },
                      { label: 'Value Proposition', slug: 'internal/longtermwiki-value-proposition' },
                      { label: 'Critical Insights', slug: 'project/critical-insights' },
                      { label: 'Similar Projects', slug: 'project/similar-projects' },
                      { label: 'Changelog', slug: 'project/changelog' },
                      { label: 'About & Transparency', slug: 'about' },
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
    build: {
      // Suppress warnings for large chunks (database.json is ~5MB)
      chunkSizeWarningLimit: 6000,
    },
  },

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
