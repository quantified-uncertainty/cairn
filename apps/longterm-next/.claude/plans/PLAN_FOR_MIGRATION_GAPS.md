# Plan: Migration Gaps — What's Not Yet Ported from longterm to longterm-next

## Context

The Cairn monorepo has two sibling apps:
- **`apps/longterm/`** — Astro/Starlight wiki. The authoritative source for all content (MDX), entity data (YAML), and tooling (validation, generation, analysis). ~169 components, ~250 scripts, ~615 MDX pages.
- **`apps/longterm-next/`** — Next.js 15 App Router frontend. Consumes `database.json` and MDX from longterm. ~64 components, ~14 scripts, 0 local content files.

The migration to Next.js is partial. The core wiki reading experience works: entity pages render MDX, cross-references resolve, InfoBox/Backlinks/ExternalLinks display, and the CauseEffectGraph diagrams render. But significant functionality — analytical views, discovery tools, comparison tables, and the entire content management toolchain — has not been ported.

This document catalogs every gap, organized by category with effort estimates and dependency notes.

---

## Table of Contents

1. [Special Pages / Routes](#1-special-pages--routes)
2. [Components](#2-components)
3. [Data Layer](#3-data-layer)
4. [Library Utilities](#4-library-utilities)
5. [Build Tooling & Scripts](#5-build-tooling--scripts)
6. [Styling](#6-styling)
7. [What longterm-next Has That longterm Doesn't](#7-what-longterm-next-has-that-longterm-doesnt)
8. [Prioritized Migration Roadmap](#8-prioritized-migration-roadmap)

---

## 1. Special Pages / Routes

longterm has 21 special Astro pages in `src/pages/` providing dedicated analytical views. longterm-next has 5 app routes (home, wiki browse, wiki page, internal docs, facts dashboard). **0 of the 21 special pages have been ported.**

### 1a. Comparison Tables (7 pages)

These render structured data as sortable, filterable tables with custom column definitions.

| longterm Page | Path | Description |
|---------------|------|-------------|
| Tables Gallery | `/tables/index.astro` | Index page listing all comparison tables |
| Safety Approaches | `/knowledge-base/responses/safety-approaches/table.astro` | Safety vs capability tradeoffs comparison |
| Eval Types | `/knowledge-base/models/eval-types/table.astro` | AI evaluation types and strategies |
| Deployment Architectures | `/knowledge-base/deployment-architectures/table.astro` | Deployment architecture scenarios |
| Architecture Scenarios | `/knowledge-base/architecture-scenarios/table.astro` | Architecture scenario comparisons |
| Accident Risks | `/knowledge-base/risks/accident/table.astro` | Accident risk comparison table |
| Technical Innovations | `/knowledge-base/technical-innovations/table.astro` | Technical innovations table |

**Dependencies:** Requires porting ~20 components (6 table views, 6 column definitions, 7 shared table utilities, TablesGallery) plus 8 data generator files.

**Effort:** Large. Each table has custom column definitions, data transformers, and interactive features (sorting, filtering, column toggles).

### 1b. Cause-Effect Diagrams (3 pages)

Interactive graph visualizations of causal relationships between AI safety factors.

| longterm Page | Path | Description |
|---------------|------|-------------|
| Diagrams Gallery | `/diagrams/index.astro` | Gallery listing all entity diagrams with master graph banner |
| Entity Diagram | `/diagrams/[entityId].astro` | Dynamic per-entity cause-effect diagram viewer |
| Master Graph | `/diagrams/master-graph.astro` | Unified master graph of all causal relationships |

**Dependencies:** The core CauseEffectGraph component IS ported, but advanced features are missing (FilterControls, DetailsPanel, InteractiveView, ListView, OutlineView, ClusterNode types, grouped layout). Also needs `MasterGraphViewer` and `DiagramViewer` components.

**Effort:** Medium. The graph engine is ported — these pages are mostly routing + layout wrappers. But the missing advanced CauseEffectGraph features (filtering, details panel, alternative views) add complexity.

### 1c. Safety Generalizability Views (3 pages)

Three different visualizations of the same safety generalizability dataset.

| longterm Page | Path | Description |
|---------------|------|-------------|
| Table View | `/knowledge-base/responses/safety-generalizability/table.astro` | Table of safety approach generalizability |
| Matrix View | `/knowledge-base/responses/safety-generalizability/matrix.astro` | Matrix visualization |
| Graph View | `/knowledge-base/responses/safety-generalizability/graph.astro` | Graph visualization |

**Dependencies:** `SafetyGeneralizabilityTableView`, `SafetyArchitectureMatrixView`, `SafetyGeneralizabilityGraphView` components + `safety-generalizability-graph-data.ts`.

**Effort:** Medium.

### 1d. AI Transition Model Views (3 pages)

Dedicated full-page views of the AI Transition Model parameter system.

| longterm Page | Path | Description |
|---------------|------|-------------|
| ATM Index | `/ai-transition-model-views/index.astro` | Redirects to graph view |
| ATM Graph | `/ai-transition-model-views/graph.astro` | Full-page graph of transition model (custom HTML, not Starlight) |
| ATM Data | `/ai-transition-model-views/data.astro` | Data visualization of transition model parameters |

**Dependencies:** `TransitionModelGraphView`, `TransitionModelDataView`, `TransitionModelInteractive`, `TransitionModelNav` components.

**Effort:** Medium. The `TransitionModelTable` and `TransitionModelContent` are already ported. These are additional view modes.

### 1e. Content Discovery / Insight Hunting (3 pages)

Analysis tools for finding content gaps and extracting insights.

| longterm Page | Path | Description |
|---------------|------|-------------|
| Explore | `/explore/index.astro` | Full-width ContentHub for searching/browsing all content |
| Gap Analysis | `/insight-hunting/gap-analysis.astro` | High-importance pages with few/no insights (scores: `importance × (1 + quality/100) - insightCount × 20`) |
| Quantitative Claims | `/insight-hunting/quantitative-claims.astro` | Extracted numbers, percentages, timelines marked as "Notable" |

**Dependencies:** `ContentHub`, `ContentTree`, `GapAnalysisTable`, `QuantitativeClaimsView`, `TableCandidatesView`, `InsightGridExperiment` + `insights-data.ts`, `insight-hunting.ts`.

**Note:** longterm-next already has `/wiki` (ExploreGrid) which partially replaces `/explore/`, but with different UI. The insight hunting tools are completely absent.

**Effort:** Medium-Large. The explore page is partially covered. Insight hunting is novel functionality.

### 1f. Resource Detail Pages (1 page)

| longterm Page | Path | Description |
|---------------|------|-------------|
| Resource Detail | `/browse/resources/[id].astro` | Individual external resource page (author, summary, abstract, review, key points, citing articles) |

**Dependencies:** `ResourceList`, `ResourcesIndex`, `resources-columns.tsx` + `external-links-data.ts`.

**Effort:** Small-Medium.

---

## 2. Components

longterm has ~169 component files. longterm-next has ~64. About 38% have been ported. Here's what's missing, grouped by subsystem.

### 2a. Complete Table System (~20 components)

The entire table visualization infrastructure is absent.

**Table View Components (6):**
- `AccidentRisksTableView.tsx`
- `ArchitectureScenariosTableView.tsx`
- `DeploymentArchitecturesTableView.tsx`
- `EvalTypesTableView.tsx`
- `SafetyApproachesTableView.tsx`
- `TechnicalInnovationsTableView.tsx`

**Column Definition Files (6):**
- `tables/accident-risks-columns.tsx`
- `tables/architecture-scenarios-columns.tsx`
- `tables/deployment-architectures-columns.tsx`
- `tables/eval-types-columns.tsx`
- `tables/safety-approaches-columns.tsx`
- `tables/safety-generalizability-columns.tsx`

**Shared Table Utilities (7+1):**
- `tables/shared/ColumnToggleControls.tsx`
- `tables/shared/TableInsightsSummary.tsx`
- `tables/shared/TableViewHeader.tsx`
- `tables/shared/ViewModeToggle.tsx`
- `tables/shared/useColumnVisibility.ts`
- `tables/shared/safety-table-styles.ts`
- `tables/shared/table-view-styles.ts`
- `tables/shared/index.ts`

**Gallery:**
- `TablesGallery.tsx`

**Also missing:** `SafetyArchitectureMatrixView.tsx`, `SafetyGeneralizabilityGraphView.tsx`, `SafetyGeneralizabilityTableView.tsx`

**Effort:** Large. These are complex interactive components with custom column configs, sorting, filtering, and column visibility toggles.

### 2b. Advanced CauseEffectGraph Features (~8 components)

The core graph renders, but advanced interaction features are absent.

**Missing components:**
- `CauseEffectGraph/components/FilterControls.tsx` — Graph filtering UI
- `CauseEffectGraph/components/DetailsPanel.tsx` — Sidebar with node details
- `CauseEffectGraph/components/InteractiveView.tsx` — Advanced interactive mode
- `CauseEffectGraph/components/ListView.tsx` — List-view alternative
- `CauseEffectGraph/components/OutlineView.tsx` — Hierarchical outline view
- `CauseEffectGraph/nodes/ClusterContainerNode.tsx` — Container for clusters
- `CauseEffectGraph/nodes/ClusterNode.tsx` — Cluster node type
- `CauseEffectGraph/nodes/ExpandableNode.tsx` — Expandable/collapsible nodes
- `CauseEffectGraph/layout-grouped.ts` — Grouped layout algorithm

**Effort:** Medium. These add polish and alternative views to the already-working graph.

### 2c. Data/Analysis/Dashboard Components (~10 components)

Internal tools for content quality and analysis.

- `ContentHub.tsx` — Full search/browse interface
- `ContentTree.tsx` — Hierarchical content tree
- `MasterGraphViewer.tsx` — Full master graph viewer
- `MetaView.tsx` — Entity metadata viewer
- `dashboard/QualityDashboard.tsx` — Content quality metrics
- `RiskTrajectoryExperiment.tsx` — Risk trajectory visualization
- `InsightGridExperiment.tsx` — Insight discovery grid
- `insight-hunting/GapAnalysisTable.tsx` — Gap analysis table
- `insight-hunting/QuantitativeClaimsView.tsx` — Quantitative claims viewer
- `insight-hunting/TableCandidatesView.tsx` — Table insight candidates
- `LiteratureList.tsx` — Literature/resource listing

**Effort:** Medium. Most are page-level compositions of existing primitives.

### 2d. Forecasts Components (3 components)

Integration with prediction markets / Metaforecast.

- `forecasts/ForecastCard.tsx` — Individual forecast display
- `forecasts/PageForecasts.tsx` — Forecasts section for wiki pages
- `forecasts/index.ts` — Module exports

**Effort:** Small. Self-contained subsystem.

### 2e. Wiki Display Components (~25 components)

Various specialized display components used within wiki pages.

**Entity Discovery:**
- `ConceptsDirectory.tsx` — Concept listing with descriptions
- `EntityCard.tsx` — Card-format entity display
- `EntityGraph.tsx` — Entity relationship graph
- `EntityIndex.tsx` — Searchable, filterable entity table
- `PageIndex.tsx` — Page listing
- `RecentUpdates.tsx` — Recently updated pages
- `TagBrowser.tsx` — Tag cloud/browser interface
- `Tags.tsx` — Tag display component
- `Glossary.tsx` — Glossary/term definitions

**Factor/Model Analysis:**
- `FactorKeyDebates.tsx` — Key debates for ATM factors
- `FactorRatings.tsx` — Factor quality/importance ratings
- `FactorRelatedContent.tsx` — Related content for factors
- `FactorRelationshipDiagram.tsx` — Factor relationship visualization
- `FactorScope.tsx` — Factor scope definition
- `ModelPosition.tsx` — Model position display
- `ModelRatings.tsx` — Model quality ratings
- `ModelsList.tsx` — Models listing
- `ModelsTable.tsx` — Models as table
- `ParameterDistinctions.tsx` — Parameter distinction display
- `ParameterFlowDiagram.tsx` — Parameter flow visualization
- `RiskDependencyGraph.tsx` — Risk dependency visualization
- `RiskRelationshipDiagram.tsx` — Risk relationship visualization
- `RootFactorsTable.tsx` — Root factors table
- `ScenarioRatings.tsx` — Scenario quality ratings
- `WarningIndicatorsTable.tsx` — Warning indicators display (note: `WarningIndicatorsCard.tsx` IS ported)
- `TimelineViz.tsx` — Timeline visualization

**Data Display:**
- `ArticleSources.tsx` — Article source citations
- `Crux.tsx` / `DataCrux.tsx` — Crux (key disagreement) display
- `DisagreementMap.tsx` / `DataDisagreementMap.tsx` — Disagreement visualization
- `DataEstimateBox.tsx` / `EstimateBox.tsx` — Estimate display (note: `EstimatesCard.tsx` IS ported as replacement)
- `ImpactGrid.tsx` — Impact assessment grid
- `InsightsTable.tsx` — Insights listing
- `KeyPeople.tsx` — Key people section
- `KeyQuestions.tsx` — Key questions section
- `ParametersTable.tsx` — Parameters table
- `RisksTable.tsx` — Risks table
- `Sources.tsx` — Source citation display

**Other:**
- `FundersList.tsx` — Funders listing
- `Section.tsx` — Content section wrapper
- `InterventionsList.tsx` — Interventions listing (note: `InterventionsCard.tsx` IS ported as replacement)

**Effort:** Large overall, but many are small individual components. Some have already been replaced by newer components in longterm-next (EstimatesCard, InterventionsCard, WarningIndicatorsCard, FactorStatusCard).

### 2f. Shared Wiki Utilities (12 of 13 missing)

Only `style-config.ts` is ported. Missing:
- `shared/Badge.tsx`
- `shared/createDataWrapper.tsx`
- `shared/EmptyCell.tsx`
- `shared/FilterToggleGroup.tsx`
- `shared/ItemsCell.tsx`
- `shared/PillLink.tsx`
- `shared/ScoreCell.tsx`
- `shared/SeverityBadge.tsx`
- `shared/StatBox.tsx`
- `shared/TrendCell.tsx`
- `shared/useToggleSet.ts`
- `shared/index.ts`

**Effort:** Small-Medium. Mostly used by the table system — porting tables will require these.

### 2g. UI Primitives (7 missing)

shadcn/ui components present in longterm but not longterm-next:
- `ui/button.tsx`
- `ui/hover-card.tsx`
- `ui/input.tsx`
- `ui/select.tsx`
- `ui/tabs.tsx`
- `ui/toggle-group.tsx`
- `ui/toggle.tsx`

**Effort:** Small. These are standard shadcn/ui copies — just install them.

### 2h. Transition Model Components (3 of 5 missing)

- `TransitionModelDataView.tsx` — Data visualization of parameters
- `TransitionModelGraphView.tsx` — Graph view of model
- `TransitionModelNav.tsx` — Navigation for ATM views

Already ported: `TransitionModelContent.tsx`, `TransitionModelTable.tsx` (+ `TransitionModelTableClient.tsx` split)

**Effort:** Medium.

### 2i. Starlight Components (12 Astro files — NOT applicable)

These are Astro/Starlight-specific layout overrides and should NOT be ported:
- `starlight/Breadcrumbs.astro`, `Footer.astro`, `Head.astro`, `Header.astro`, `MarkdownContent.astro`, `MiniModelDiagramStatic.astro`, `PageFrame.astro`, `PageSidebar.astro`, `PageTitle.astro`, `Sidebar.astro`, `SidebarInfoBox.astro`, `SidebarSublist.astro`

longterm-next implements equivalent layout functionality via Next.js `layout.tsx`, `WikiSidebar.tsx`, `Breadcrumbs.tsx`, etc.

---

## 3. Data Layer

### 3a. Table Data Generators (8 files missing)

These transform raw entity data into structured table rows:
- `accident-risks-data.ts`
- `architecture-scenarios-data.ts`
- `architectures-table-data.ts`
- `scenarios-table-data.ts`
- `safety-approaches-data.ts`
- `deployment-architectures-data.ts`
- `eval-types-table-data.ts`
- `safety-generalizability-graph-data.ts`

**Note:** Required before any table pages can be ported.

### 3b. Other Data Modules (6 files missing)

- `content-schemas.ts` — Component prop validation schemas
- `database-types.ts` — Intermediate database type definitions
- `risk-categories.ts` — Risk category utilities
- `external-links-data.ts` — External link management data
- `insights-data.ts` — Insights processing and access
- `page-templates.ts` — Page template definitions

### 3c. YAML Data (not synced, by design)

longterm-next reads `database.json` (pre-built) rather than source YAML. This is intentional — longterm owns the data layer. However, longterm-next does NOT have access to:
- Raw entity YAML (23 files in `entities/`)
- Graph definitions (4 YAML files in `graphs/`)
- Fact definitions (4 YAML files in `facts/`)
- Insight YAML (6 files in `insights/`)
- Resource YAML (9 files in `resources/`)

These are accessed via `database.json` aggregated data, which works for most use cases but limits some analytical features.

---

## 4. Library Utilities

### Missing from longterm-next:

| File | Purpose | Used By |
|------|---------|---------|
| `dashboard.ts` | Dashboard metrics computation (QualityDistribution, StaleContent, EntityGap) | QualityDashboard |
| `graph-analysis.ts` | Graph traversal and analysis utilities | MasterGraphViewer, EntityGraph |
| `insight-hunting.ts` | Insight discovery and cross-page analysis | Insight hunting pages |

### Already in longterm-next (not in longterm):

| File | Purpose |
|------|---------|
| `mdx.ts` | MDX compilation, path resolution, static params (Next.js specific) |
| `wiki-nav.ts` | Contextual sidebar navigation |
| `internal-nav.ts` | Internal documentation navigation |
| `remark-callouts.ts` | Remark plugin for `:::note` directives |

### Simplified in longterm-next:

| File | longterm | longterm-next |
|------|----------|---------------|
| `page-types.ts` | 182 lines with `isAITransitionModelPage()`, `shouldSkipValidation()`, `shouldShowPageStatus()`, styleGuideUrl fields | 82 lines with only `detectPageType()` |

---

## 5. Build Tooling & Scripts

This is the largest gap. longterm has ~250 script files; longterm-next has ~14.

### 5a. Validation System (34 rules — 0 ported)

longterm has a unified validation engine (`scripts/lib/validation-engine.mjs`) with 34 pluggable rules:

**Escaping rules:** `dollar-signs`, `comparison-operators`, `tilde-dollar`
**Markdown rules:** `markdown-lists`, `jsx-in-md`, `consecutive-bold-labels`
**Linking rules:** `prefer-entitylink`, `entitylink-ids`, `internal-links`, `external-links`
**Frontmatter:** `frontmatter-schema`
**Quality rules:** `fact-consistency`, `quality-source`, `structural-quality`, `false-certainty`
**Tone rules:** `tone-markers`, `insider-jargon`, `prescriptive-language`
**Citation rules:** `citation-urls`, `vague-citations`
**Component rules:** `component-imports`, `component-refs`, `component-props`
**Entity rules:** `entity-mentions`, `outdated-names`
**Other:** `placeholders`, `editorial-artifacts`, `fake-urls`, `sidebar-coverage`, `sidebar-index`, `cruft-files`, `estimate-boxes`

Plus 27 dedicated validation scripts and pre-commit hooks.

longterm-next has: `validate/validate-internal-links.mjs` (1 script).

**Effort:** Very Large if building independently. If sharing the validation engine as a package, Medium.

### 5b. Content Generation (8 scripts — 0 ported)

- `generate-content.mjs` — AI-powered page generation
- `generate-yaml.mjs` — Entity YAML from templates
- `generate-summaries.mjs` — Content summaries via LLM
- `generate-schema-docs.mjs` — Schema documentation
- `generate-schema-diagrams.mjs` — Mermaid diagrams from data
- `generate-data-diagrams.mjs` — Data flow diagrams
- `generate-research-reports.mjs` — Long-form analysis reports
- `generate-llm-files.mjs` — LLM context files (this one IS shared)

### 5c. Analysis Tools (4+ scripts — 0 ported)

- `analyze-all.mjs` — Full site analysis
- `analyze-entity-links.mjs` — Cross-linking coverage
- `analyze-link-coverage.mjs` — Coverage metrics
- `find-attributed-quotes.mjs` — Quote attribution

Plus CLI subcommands: `crux analyze mentions`, `crux analyze entity-links <id>`, `crux analyze quality`

### 5d. Content Management (8 scripts — 0 ported)

- `page-creator.mjs` — Create new wiki pages from templates
- `page-improver.mjs` — AI-powered page enhancement
- `grade-content.mjs` — Content quality grading
- `grade-by-template.mjs` — Template-based grading
- `add-key-links.mjs` — Add important cross-links
- `regrade.mjs` — Re-evaluate page quality
- `post-improve.mjs` — Post-improvement cleanup

### 5e. Resource Management

- `resource-manager.mjs` — External link management
- `utils/export-resources.mjs` — Export resource lists
- `utils/fetch-sources.mjs` — Fetch source metadata

### 5f. Insight Extraction (3 scripts — 0 ported)

- `extract/extract-insights.mjs` — Extract insights from pages
- `extract/extract-table-insights.mjs` — Extract from tables
- `extract/find-quantitative-claims.mjs` — Find metrics/estimates

### 5g. Forecasting Integration (3 scripts — 0 ported)

- `metaforecast/refresh.mjs` — Refresh prediction market data
- `metaforecast/match.mjs` — Match forecasts to entities
- `metaforecast/display.mjs` — Format forecast display

### 5h. Crux CLI (unified command interface — not ported)

longterm has `scripts/crux.mjs` as a unified CLI with domains: `validate`, `analyze`, `fix`, `content`, `generate`, `resources`, `insights`, `gaps`.

longterm-next has no CLI.

### 5i. Pre-commit Hooks (not configured)

longterm has pre-commit hooks running `npm run precommit` (4 validation rules + compile check).
longterm-next has no git hooks configured.

**Note on tooling:** Much of this tooling operates on content/YAML that lives in longterm. It may make more sense to keep these scripts in longterm and share them, rather than duplicating. The question is whether longterm-next should eventually become the sole app and absorb these tools.

---

## 6. Styling

### Missing CSS features:

- **Icon system:** longterm has 15+ Lucide SVG icons as CSS mask backgrounds used for sidebar navigation icons (table, matrix, graph, explore, compass, etc.). longterm-next uses no sidebar icons.
- **Entity index styles:** `.entity-index` classes for the searchable entity table
- **Models list styles:** `.models-list` classes
- **~6KB of Starlight-specific** component overrides (some applicable to longterm-next's prose, some Starlight-only)

### Already equivalent:

- oklch color system (both apps)
- Tailwind v4 configuration (both apps)
- Prose typography (both apps, slightly different implementations)
- Footnote styling (both apps)
- InfoBox grid layout (both apps)
- Dark mode support (both apps)

---

## 7. What longterm-next Has That longterm Doesn't

These are improvements or new features unique to longterm-next:

| Feature | Description |
|---------|-------------|
| **`/wiki/[id]/info` debug page** | Developer page showing metadata, raw MDX, facts, backlinks, entity JSON |
| **`/internal/facts` dashboard** | Canonical facts viewer |
| **`Callout.tsx`** | Native callout/admonition component for `:::note` directives |
| **`MermaidDiagram.tsx`** | Dedicated mermaid rendering component |
| **`StarlightCards.tsx`** | Compatibility shim for Starlight card markup |
| **`entity-ontology.ts`** | Canonical display metadata (icons, colors, badges) per entity type |
| **Discriminated union types** | Stricter TypeScript with per-entity-type schemas |
| **Auto-generated sidebars** | `wiki-nav.ts` builds contextual sidebars from page metadata (vs 280-line manual config) |
| **Vitest test suite** | 5 app-level tests (vs 2 script-level tests in longterm) |
| **Error boundaries** | Per-route error handling |
| **Server Components** | RSC by default, `"use client"` only when needed |
| **`InfoBoxVisibility.tsx`** | Client-side InfoBox visibility control |
| **`FactorStatusCard.tsx`** | Card-format factor status (vs badge in longterm) |
| **`EstimatesCard.tsx`** | Card-format estimates (replaces EstimatesPanel) |
| **`InterventionsCard.tsx`** | Card-format interventions (replaces InterventionsList) |
| **`WarningIndicatorsCard.tsx`** | Card-format warning indicators (replaces table) |

---

## 8. Prioritized Migration Roadmap

### Tier 1: High-Value, Foundation-Building

These unlock the most user-visible functionality and are prerequisites for later tiers.

**1.1 — UI Primitives** (Small effort)
Port the 7 missing shadcn/ui components: `button`, `hover-card`, `input`, `select`, `tabs`, `toggle-group`, `toggle`. Many later components depend on these.

**1.2 — Shared Wiki Utilities** (Small-Medium effort)
Port the 12 missing `wiki/shared/` utilities. The table system and many display components depend on these.

**1.3 — Cause-Effect Diagram Pages** (Medium effort)
Add `/diagrams/`, `/diagrams/[entityId]`, `/diagrams/master-graph` routes. The core graph engine is already ported — these need page wrappers + the `MasterGraphViewer`/`DiagramViewer` components. Then port the advanced CauseEffectGraph features (FilterControls, DetailsPanel, alternative views).

**1.4 — ATM View Pages** (Medium effort)
Port `TransitionModelDataView`, `TransitionModelGraphView`, `TransitionModelNav`. Add `/ai-transition-model-views/` routes. The `TransitionModelTable` and `TransitionModelContent` are already working.

### Tier 2: Analytical Features

These provide the comparative analysis views that differentiate the wiki from plain documentation.

**2.1 — Table Data Layer** (Medium effort)
Port the 8 table data generators. These transform raw database.json entities into structured table rows and are required before any table UI can work.

**2.2 — Table System** (Large effort)
Port the complete table infrastructure: 6 table views, 6 column definitions, shared table utilities, TablesGallery. Add table routes.

**2.3 — Safety Generalizability Views** (Medium effort)
Port the 3 safety generalizability pages (table/matrix/graph). These are a showcase for the multi-view analysis approach.

### Tier 3: Content Discovery

Features for navigating and discovering content across the wiki.

**3.1 — Entity Discovery Components** (Medium effort)
Port `EntityIndex` (searchable entity table), `EntityCard`, `TagBrowser`, `RecentUpdates`, `ConceptsDirectory`, `Glossary`. These improve the browse experience beyond the current ExploreGrid.

**3.2 — Wiki Display Components** (Medium-Large effort)
Port the remaining ~25 wiki display components. Many of these are used within MDX pages (currently stubbed). Priority order: Crux/DisagreementMap → FactorAnalysis components → Model/Risk visualization → KeyPeople/KeyQuestions.

**3.3 — Resource Pages** (Small-Medium effort)
Port resource detail pages and the resource index system.

### Tier 4: Internal Tools & Analytics

Development and editorial tools.

**4.1 — Quality Dashboard** (Medium effort)
Port `QualityDashboard` + `dashboard.ts` metrics computation. Useful for tracking editorial progress.

**4.2 — Insight Hunting Pages** (Medium effort)
Port gap analysis, quantitative claims, and table candidates pages. These drive editorial improvement workflows.

**4.3 — Forecasts Integration** (Small effort)
Port `ForecastCard`, `PageForecasts`, and forecast data integration.

### Tier 5: Tooling

Build tools and content management automation.

**5.1 — Validation Engine** (Large effort)
Decide architecture: share longterm's validation engine as a package, or build longterm-next-specific validation. At minimum, add pre-commit hooks with key rules (frontmatter-schema, internal-links, dollar-signs).

**5.2 — Content Generation Scripts** (Medium effort)
Port or share LLM-powered generation scripts. These may stay in longterm if it remains the content authority.

**5.3 — Analysis & Content Management** (Medium effort)
Port or share analysis tools, page improver, grading system. Same architectural question as validation.

**5.4 — Crux CLI** (Medium effort)
Build a unified CLI for longterm-next, or extend the existing crux CLI to work with both apps.

---

## Decision Points

Before proceeding, these architectural questions should be resolved:

1. **Will longterm-next eventually replace longterm entirely?** If yes, all tooling needs to migrate. If no (longterm stays as content CMS, longterm-next as frontend), tooling can stay in longterm.

2. **Should the table data live in database.json?** Currently, table data generators produce structured data at runtime. Moving them to build time (into `build-data.mjs`) would simplify the frontend but increase database.json size.

3. **Should validation be shared?** The 34-rule validation engine could become a `@cairn/validation` package used by both apps. This avoids duplication.

4. **How should special pages be routed?** Options: (a) add dedicated routes like `/tables/[slug]`, `/diagrams/[slug]`; (b) use the wiki `[id]` route with layout switching based on page type; (c) use query parameters like `/wiki/[id]?view=table`.

5. **Which stub components should be permanently removed vs ported?** Some stubs (42+ currently) may represent features that aren't worth porting. An audit of which stubs are actually referenced in MDX content would help prioritize.

---

## Stats Summary

| Category | In longterm | In longterm-next | Gap |
|----------|-------------|------------------|-----|
| Components | ~169 | ~64 | ~105 |
| Special pages | 21 | 5 | 16 |
| Data modules | 18 TS files | 5 TS files | 13 |
| Library utilities | 5 files | 9 files | 3 missing + 4 new |
| Scripts | ~250 files | ~14 files | ~236 |
| Validation rules | 34 | 0 | 34 |
| npm scripts | 35 | 7 | 28 |
| CSS | 17.9KB | 11.6KB | ~6KB |
| Tests | 2 (script-level) | 5 (app-level) | longterm-next ahead |
