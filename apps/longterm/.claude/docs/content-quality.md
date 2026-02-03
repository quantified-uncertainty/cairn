# Content Quality System

Quality scoring applies only to `content` pages (see page-types.md).

## Content Types

Pages have different purposes, which affects how ratings should be weighted:

| Content Type | Purpose | Key Ratings | Examples |
|--------------|---------|-------------|----------|
| `reference` | Factual coverage | rigor, completeness | Org pages, people, risk definitions |
| `analysis` | Original research/models | focus, concreteness, novelty | Model pages, policy analyses, forecasts |
| `explainer` | Educational | completeness, rigor | Concept explainers, how-it-works |

Set via `contentType` frontmatter field. If unset, inferred from path:
- `/models/` → analysis
- `/organizations/`, `/people/` → reference
- Default → reference

## Rating System

Six dimensions (0-10 scale, harsh - 7+ is exceptional):

### Core Ratings (All Content Types)

**focus** - Does it answer the question its title implies?
- 3-4: Drifts significantly from claimed topic, answers a different question
- 5-6: Mostly on-topic but with tangential sections
- 7+: Laser-focused on exactly what the title promises

*Example failure*: Title "Policy Implications of Short Timelines" but content is "Evidence For/Against Short Timelines" → focus: 4

**novelty** - Value-add beyond what a reader could get from obvious sources
- 1-2: Restates common knowledge, purely derivative
- 3-4: Well-organized compilation of existing work; competent summary with minor original perspective
- 5-6: Genuine new framing or connections that add real insight beyond sources
- 7+: Genuinely new insight, analysis, or framework not found elsewhere (exceptional - very rare)

**CRITICAL NOVELTY CALIBRATION:**
- Page that organizes known arguments into tables → 3-4 (compilation, not insight)
- Page that summarizes someone else's framework → 3 (no original contribution)
- Page that applies standard economics/game theory to known problem → 4-5
- Page with genuinely new framework or quantitative model not found elsewhere → 6-7
- DO NOT give 5-6 for "good organization" - that's a 3-4

*Example failure*: Compiling news articles about AI policy without any original analysis → novelty: 3

**rigor** - Evidence quality and precision
- 3-4: Mixed sourcing, some unsupported claims
- 5-6: Most claims sourced, some quantification
- 7+: Fully sourced with uncertainty ranges and quantification

**completeness** - Covers what the TITLE promises (not just "has lots of content")
- 3-4: Missing key aspects of the claimed topic
- 5-6: Covers main points but gaps in important areas
- 7+: Thorough coverage of exactly what the title promises

*Critical distinction*: A doc that thoroughly covers the WRONG topic scores low. Completeness is relative to the title's promise.

### Analysis-Weighted Ratings (Critical for Analysis/Model Pages)

**concreteness** - Specific recommendations, numbers, examples vs. abstract hand-waving
- 3-4: Vague generalities ("consider the tradeoffs", "it depends")
- 5-6: Some specific examples or numbers, but mostly abstract
- 7+: Concrete details, specific recommendations, quantified claims

*Example failure*: "Policymakers should consider AI risks" vs. "Governments should mandate reporting for training runs >10²⁶ FLOPS" → first is 3, second is 7+

**actionability** - Can a reader make different decisions after reading this?
- 3-4: No clear implications for what to do
- 5-6: Some takeaways but reader must infer actions
- 7+: Explicit "do X not Y" guidance, decision-relevant information

*Example failure*: Describing the policy landscape without saying what anyone should do → actionability: 4

## Content-Type-Specific Calibration

### Reference Pages (orgs, people, risks, responses)

**Weight heavily**: rigor (accuracy matters), completeness (coverage matters)
**Weight less**: concreteness, actionability (these are informational, not prescriptive)

Acceptable scores:
- focus: 6+ (should stay on topic but some context is fine)
- novelty: 5+ (value is in accurate compilation, not originality)
- rigor: 7+ (accuracy is critical)
- completeness: 7+ (coverage is the point)
- concreteness: 5+ (specific facts, but not prescriptive)
- actionability: 4+ (informational pages don't need to be actionable)

### Analysis Pages (models, policy analyses, forecasts)

**Weight heavily**: focus (must answer the stated question), concreteness (must be specific), novelty (must add value)
**Weight less**: completeness (depth over breadth)

Acceptable scores:
- focus: 7+ (must answer exactly what it claims to)
- novelty: 6+ (must add something beyond sources)
- rigor: 6+ (claims should be supported)
- completeness: 5+ (okay to be narrow if deep)
- concreteness: 7+ (must be specific and concrete)
- actionability: 7+ (must have clear implications)

### Explainer Pages (concepts, how-it-works)

**Weight heavily**: completeness (educational coverage), rigor (accuracy)
**Weight less**: novelty (explaining known things is fine), actionability

Acceptable scores:
- focus: 6+ (on-topic)
- novelty: 4+ (explaining existing concepts is fine)
- rigor: 7+ (must be accurate)
- completeness: 7+ (educational coverage matters)
- concreteness: 6+ (concrete examples help learning)
- actionability: 4+ (educational, not prescriptive)

## Common Rating Failures

### The "Policy Landscape" Trap
**Symptom**: Doc claims to analyze implications/recommendations but actually describes the current state of things.
**Ratings affected**: focus (answering wrong question), actionability (no guidance), concreteness (abstract)
**Fix**: Ask "what should someone DO with this information?"

### The "Well-Sourced Summary" Trap
**Symptom**: Many citations, covers lots of ground, but no original insight or synthesis.
**Ratings affected**: novelty (just compiling sources), sometimes focus (drifts to cover more ground)
**Fix**: Ask "what does this tell me that I couldn't learn from reading the sources directly?"

### The "Abstract Generalities" Trap
**Symptom**: Uses hedge words, "it depends", "consider the tradeoffs" without specifics.
**Ratings affected**: concreteness (vague), actionability (can't act on vague advice)
**Fix**: Demand specific recommendations, numbers, examples

### The "Comprehensive But Wrong" Trap
**Symptom**: Thoroughly covers adjacent topic while missing the claimed topic.
**Ratings affected**: focus (wrong topic), completeness (didn't cover what title promised)
**Fix**: Re-read the title and ask "does the content actually address THIS?"

## Frontmatter Format

```yaml
---
title: "Page Title"
contentType: analysis  # or reference, explainer
quality: 65
ratings:
  focus: 7
  novelty: 6
  rigor: 7
  completeness: 6
  concreteness: 8
  actionability: 7
metrics:
  wordCount: 2500
  citations: 12
  tables: 3
  diagrams: 1
---
```

## Page TODOs System

Pages can have a `todos` array in frontmatter to track incomplete sections.

**Frontmatter format:**
```yaml
---
title: "Page Title"
todos:
  - "Complete 'How It Works' section"
  - "Fill in Limitations (3 items)"
  - "Add Key Uncertainties"
---
```

**How it works:**
- TODOs appear in the PageStatus component with a violet badge
- Only visible in dev mode (controlled by header toggle)
- Count shown in header: "TODOs (3)"

**When completing a TODO:**
1. Write the actual content for the section
2. Manually remove the item from the `todos` array in frontmatter
3. Update `lastEdited` date

## Derived Quality Score

The overall `quality` score (0-100) is computed from ratings:

**For reference pages:**
```
quality = (focus + novelty + rigor*1.5 + completeness*1.5 + concreteness + actionability*0.5) / 7 * 10 + bonuses
```

**For analysis pages:**
```
quality = (focus*1.5 + novelty*1.2 + rigor + completeness + concreteness*1.5 + actionability*1.2) / 7.4 * 10 + bonuses
```

**For explainer pages:**
```
quality = (focus + novelty*0.5 + rigor*1.5 + completeness*1.5 + concreteness + actionability*0.5) / 6.5 * 10 + bonuses
```

Bonuses:
- +5 for >3000 words
- +3 for >10 citations
- +2 for diagrams

## Validation

Use the `/grade` skill to grade pages. Run validation:

```bash
npm run crux -- validate ratings  # Check rating consistency
```
