---
name: research-report
description: Create in-depth research reports on AI safety topics. Use when asked to research a topic, investigate a question, or prepare documentation for diagram creation.
allowed-tools: Read, Edit, Write, Grep, Glob, WebSearch, WebFetch, Task
---

# Research Report Creation

Create comprehensive research reports that investigate AI safety topics and identify causal factors for diagram creation.

## When to Use This Skill

- User asks to "research [topic]" or "investigate [topic]"
- User wants a deep dive into a knowledge-base topic
- Preparing groundwork for a cause-effect diagram
- Filling in gaps in existing documentation

## Report File Location

Save reports to: `src/content/docs/internal/research-reports/{topic-id}.mdx`

## Frontmatter Schema

```yaml
---
title: "[Topic]: Research Report"
description: "One-sentence summary of key findings with specifics."
topic: "[entity-id]"           # Links to knowledge-base or transition-model item
createdAt: YYYY-MM-DD          # Date without quotes (YAML date type)
lastUpdated: YYYY-MM-DD        # Date without quotes (YAML date type)
researchDepth: "standard"      # quick | standard | comprehensive
sources: ["web", "codebase"]   # What sources were consulted
quality: 3                     # 1-5 quality rating
sidebar:
  order: 10
---
```

## Formatting Guidelines

**Follow the [Knowledge Base Style Guide](/internal/knowledge-base/)** for general formatting principles:

### Use Tables Over Bullet Lists

**Bad (low density):**
```markdown
**Factor Name**
- Direction: Increases → topic
- Type: leaf
- Evidence: Some evidence
- Confidence: high
```

**Good (table format):**
```markdown
| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **Factor Name** | ↑ Topic | leaf | Some evidence | High |
```

### Use Callouts/Asides Liberally

Add `<Aside>` components to highlight key insights, caveats, and implications:

```mdx
import { Aside } from '@astrojs/starlight/components';

<Aside type="tip" title="Why This Matters">
Key insight about safety implications.
</Aside>

<Aside type="caution" title="Limitation">
Important caveat about the data.
</Aside>

<Aside type="note" title="Data Source">
Methodological note about how data was collected.
</Aside>
```

### Escape Dollar Signs

Currency values MUST be escaped to avoid LaTeX rendering:

**Wrong:** `$100,000` (renders as LaTeX)
**Right:** `\$100,000` (renders as text)

Also escape in frontmatter description:
```yaml
description: "H-1B fees increased to \\$100K"
```

### Use Horizontal Rules

Separate major sections with `---` for visual clarity.

## Required Sections

### 1. Executive Summary (TABLE FORMAT)

Use a table, not bullets:

```markdown
| Finding | Key Data | Implication |
|---------|----------|-------------|
| **US dominance** | 57% of top researchers | US remains primary hub |
| **Policy risk** | \$100K H-1B fee | May accelerate brain drain |
```

### 2. Background

Why this topic matters, context, and relationship to AI safety. Include an Aside about safety implications.

### 3. Key Findings

Main research results organized by theme. Each finding should:
- Have a clear heading
- Include specific claims with citations
- Use tables for structured comparisons
- Include Asides for important caveats

### 4. Causal Factors (TABLE FORMAT - Critical for Diagrams)

Use tables to present factors clearly:

```markdown
## Causal Factors

### Primary Factors (Strong Influence)

| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **Immigration Policy** | ↑↓ Concentration | leaf | 80% retention depends on visas | High |
| **Research Ecosystem** | ↑ Concentration | cause | 60% of top institutions in US | High |

### Secondary Factors (Medium Influence)

| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **Graduate Programs** | ↑ Concentration | cause | 80% of students stay | Medium |

### Minor Factors (Weak Influence)

| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **Nationalist Sentiment** | ↓ Mobility | leaf | Limited evidence | Low |
```

### 5. Open Questions (TABLE FORMAT)

```markdown
| Question | Why It Matters | Current State |
|----------|----------------|---------------|
| **Will fees persist?** | Changes startup economics | May face legal challenge |
```

### 6. Sources

Organized by type: Academic, Government, Industry, Journalism.

## Validation Checklist

Before saving the report, verify:

- [ ] **Dollar signs escaped**: All `$` replaced with `\$`
- [ ] **Dates unquoted**: `createdAt: 2025-01-07` not `"2025-01-07"`
- [ ] **Tables used**: Causal factors and open questions in table format
- [ ] **Asides included**: At least 3-4 callouts highlighting key insights
- [ ] **Sources organized**: By type with brief annotations
- [ ] **Links valid**: All URLs work

Run validation after saving:
```bash
npm run validate:mdx
npm run validate:dollars
```

## Research Process

### Step 1: Load Context

Before web research, read existing codebase content:

1. Read the target entity page (if exists)
2. Read related pages (check backlinks)
3. For transition-model topics, read the model overview
4. Note gaps in existing coverage

### Step 2: AI Transition Model Context

For transition-model topics, understand how the topic connects to:
- **Factors**: AI Capabilities, AI Ownership, AI Uses, Misalignment/Misuse Potential, Civilizational Competence, Transition Turbulence
- **Scenarios**: AI Takeover, Human Catastrophe, Long-term Lock-in
- **Outcomes**: Human Extinction, Civilizational Collapse, Recovery, Flourishing

### Step 3: Web Research

Search strategy:
1. Academic sources: `"[topic]" site:arxiv.org OR site:nature.com`
2. Policy sources: `"[topic]" site:rand.org OR site:brookings.edu`
3. Recent news: `"[topic]" AI safety 2024 OR 2025`

Source trust hierarchy:
1. Peer-reviewed research (Nature, Science, arXiv)
2. Expert organizations (RAND, FHI, CAIS, MIRI)
3. Government reports (GAO, UK AISI, NIST)
4. Quality journalism (Reuters, AP)
5. Industry analysis (McKinsey, OECD)
6. Blog posts (LessWrong, EA Forum - verify claims)

### Step 4: Synthesis

Organize findings by theme, not by source. Focus on:
- Areas of consensus
- Points of disagreement
- Quantitative data where available
- Causal relationships (for diagram creation)

## Quality Levels

| Level | Criteria |
|-------|----------|
| 1 | Basic outline, <10 sources, major gaps |
| 2 | Main points covered, 10-15 sources, some gaps |
| 3 | Solid coverage, 15-25 sources, minor gaps |
| 4 | Comprehensive, 25-35 sources, well-structured |
| 5 | Authoritative, 35+ sources, original synthesis |

## Template

```mdx
---
title: "[Topic]: Research Report"
description: "[Key finding with specific number - escape \\$ signs]"
topic: "[entity-id]"
createdAt: YYYY-MM-DD
lastUpdated: YYYY-MM-DD
researchDepth: "standard"
sources: ["web", "codebase"]
quality: 3
sidebar:
  order: 10
---
import { Aside } from '@astrojs/starlight/components';

## Executive Summary

| Finding | Key Data | Implication |
|---------|----------|-------------|
| **Finding 1** | Specific number | What it means |
| **Finding 2** | Specific data | What it means |
| **Key uncertainty** | Current state | Why it matters |

---

## Background

[2-3 paragraphs explaining the topic and its importance]

<Aside type="tip" title="Why This Matters for AI Safety">
Key insight about safety implications.
</Aside>

---

## Key Findings

### [Theme 1]

[Paragraphs with citations and tables]

<Aside type="note" title="Data Source">
Methodological note or caveat.
</Aside>

### [Theme 2]

[Paragraphs with citations and tables]

---

## Causal Factors

### Primary Factors (Strong Influence)

| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **[Factor]** | ↑ Topic | leaf | Evidence summary | High |

### Secondary Factors (Medium Influence)

| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **[Factor]** | ↓ Topic | cause | Evidence summary | Medium |

### Minor Factors (Weak Influence)

| Factor | Direction | Type | Evidence | Confidence |
|--------|-----------|------|----------|------------|
| **[Factor]** | Mixed | intermediate | Limited evidence | Low |

---

## Open Questions

<Aside type="note" title="Key Uncertainties">
These questions represent the highest-value areas for follow-up research.
</Aside>

| Question | Why It Matters | Current State |
|----------|----------------|---------------|
| **[Question]** | Impact on assessment | Current understanding |

---

## Sources

### Research Organizations
- [Source](url) - Brief annotation

### Policy Analysis
- [Source](url) - Brief annotation

### News Coverage
- [Source](url) - Brief annotation

---

## AI Transition Model Context

<Aside type="tip" title="Model Integration">
How this research connects to the AI Transition Model factors and scenarios.
</Aside>

[Brief explanation of connections]
```

## Integration with Diagrams

After completing a report, the Causal Factors table can be directly converted to a causeEffectGraph:

| Report Column | Maps to Diagram |
|---------------|-----------------|
| Factor | Node label |
| Type | Node type (leaf/cause/intermediate) |
| Direction (↑/↓) | Edge effect (increases/decreases) |
| Confidence | Edge confidence |

Use the `cause-effect-diagram` skill for diagram creation after the report is complete.
