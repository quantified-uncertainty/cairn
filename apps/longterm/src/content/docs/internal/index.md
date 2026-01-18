---
title: Internal
description: Project documentation, style guides, and roadmap
sidebar:
  order: 0
  label: Overview
---

This section contains internal documentation for maintaining and contributing to the knowledge base.

## Automation and Tools

- [Automation Tools](/internal/automation-tools/) - Complete reference for all scripts and CLI workflows
- [Content Database](/internal/content-database/) - SQLite-based system for indexing and AI summaries

## Style Guides

- [Knowledge Base Style Guide](/internal/knowledge-base/) - Guidelines for risk and response pages (kb-2.0)
- [Model Style Guide](/internal/models/) - Guidelines for analytical model pages
- [Mermaid Diagrams](/internal/mermaid-diagrams/) - How to create diagrams

## Project Management

- [Enhancement Queue](/internal/enhancement-queue/) - Track content enhancement progress across all page types
- [Project Roadmap](/internal/project-roadmap/) - Future work, infrastructure improvements, and tracking

## CAIRN Project

- [CAIRN Project](/internal/cairn/) - Planning docs for CAIRN: Comprehensive AI Impact & Risk Navigator
  - [Vision Document](/internal/cairn/vision/) - 2-person-year scope, architecture, milestones
  - [Strategy Brainstorm](/internal/cairn/strategy-brainstorm/) - Failure modes, definitions of success
  - [Similar Projects Analysis](/internal/cairn/similar-projects/) - Lessons from Arbital, Stampy, etc.

## Technical Reports

- [Internal Reports](/internal/reports/) - Technical research and design decisions
  - [Causal Diagram Visualization](/internal/reports/causal-diagram-visualization/) - Tools, literature, and best practices

---

## Quick Commands

Most common operations:

```bash
# Run all validators
npm run validate

# List pages needing improvement
node scripts/page-improver.mjs --list

# Rebuild data after editing entities.yaml
npm run build:data

# Start dev server
npm run dev
```

See [Automation Tools](/internal/automation-tools/) for complete command reference.
