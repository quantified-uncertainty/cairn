---
title: Project Roadmap
description: Future work, infrastructure improvements, and project tracking
sidebar:
  order: 10
lastEdited: "2025-12-26"
---

This file tracks infrastructure improvements, tooling ideas, and style guide evolution. For content-specific enhancement tasks, see:
- [Model Enhancement TODO](/knowledge-base/models/_ENHANCEMENT_TODO/)
- [Risk Enhancement TODO](/knowledge-base/risks/_ENHANCEMENT_TODO/)
- [Response Enhancement TODO](/knowledge-base/responses/_ENHANCEMENT_TODO/)

---

## Infrastructure Improvements

### Content Quality Automation

- [ ] **Vale integration** - Prose linting for terminology consistency, hedging, readability
  - Priority: Low
  - Effort: ~30 min basic setup, ~2 hours for custom rules
  - Would catch ~20-30% of mechanical style issues (terminology, passive voice, hedging)
  - Can't check structural issues (hierarchy, argument quality)
  - Start with built-in packages (Microsoft, write-good), add custom rules later

- [ ] **Freshness tracking system** - Identify pages needing review
  - Priority: Medium
  - Effort: ~2-3 hours
  - Add `lastReviewed` field to schema (distinct from `lastEdited`)
  - Add `reviewCycle` field (days before considered stale)
  - Create script to generate staleness report
  - Integrate into validation suite

- [ ] **Quality dashboard** - Visual overview of content health
  - Priority: Low
  - Could be a generated page showing:
    - Pages by quality score
    - Pages by staleness
    - Pages missing required fields
    - Style guide version coverage

### Schema Enhancements

- [ ] Add `lastReviewed` field (when human verified accuracy)
- [ ] Add `reviewCycle` field (days before stale, default 90?)
- [ ] Validate `styleGuideVersion` against known versions (kb-1.0, kb-2.0, etc.)
- [ ] Consider `contentType` enum for better categorization

### Tooling

- [ ] **VS Code snippets** - Scaffolding for new pages
  - Priority: Low
  - Effort: ~30 min
  - Templates for: risk, response, model, debate pages
  - Zero installation, immediate value

- [ ] **Hygen templates** - Interactive page creation (if snippets aren't enough)
  - Priority: Very Low
  - More powerful but requires installation

---

## Style Guide Evolution

### Current: kb-2.0 (2025-12-26)

Covers risks and responses with emphasis on:
- Proper h2/h3 hierarchy (not flat structures)
- Integrated arguments (not sparse Case For/Against)
- Content over format (guidelines not rigid templates)
- Sparing use of visualizations (DisagreementMap often confusing)

### Future Considerations

- [ ] **Separate guide for models?** - Models have different structure (Mermaid diagrams, quantitative tables, scenarios)
  - Could be `model-1.0` extending shared principles from `kb-2.0`
  - Or expand kb guide with "Model Pages" section

- [ ] **Mermaid diagram guidance** - When to use, how to structure, accessibility considerations

- [ ] **Component usage patterns** - When to use:
  - EstimateBox vs plain tables
  - DisagreementMap vs prose
  - KeyQuestions vs inline questions

- [ ] **Cross-linking standards** - More specific guidance on:
  - How many links per page
  - When to use inline links vs Related Pages section
  - Bidirectional link maintenance

---

## Content Priorities

Enhancement task queues are now tracked in dedicated files:
- **Models**: [_ENHANCEMENT_TODO.md](/knowledge-base/models/_ENHANCEMENT_TODO/) - ~26 pending
- **Risks**: [_ENHANCEMENT_TODO.md](/knowledge-base/risks/_ENHANCEMENT_TODO/) - ~34 pending (1 high priority: mesa-optimization)
- **Responses**: [_ENHANCEMENT_TODO.md](/knowledge-base/responses/_ENHANCEMENT_TODO/) - ~40 pending

### Pages Already Updated to kb-2.0
- [x] ai-safety-institutes.mdx (2025-12-26)

---

## Completed

### 2025-12-26
- [x] Created kb-2.0 style guide (renamed from risk-response templates)
- [x] Added styleGuideVersion tracking to frontmatter
- [x] Restructured ai-safety-institutes.mdx as pilot page
- [x] Researched Vale/automation options (decided to defer)

---

## Notes

- **Don't over-engineer** - Start simple, add tooling only when manual process becomes painful
- **Style guide is guidelines, not law** - Adapt to content, don't force content into templates
- **Versioning helps prioritization** - Can search for old styleGuideVersion to find pages needing updates
