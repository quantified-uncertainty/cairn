# Content Warnings Checklist

Systematic checklist for reviewing wiki pages. Used in **Step 2** of the [3-step content grading pipeline](#3-step-pipeline) and as a reference for manual page improvement.

Each item has a short ID (e.g., `OBJ-01`) for reference in warning output.

## 3-Step Pipeline

1. **Automated warnings** (Step 1) — regex-based rules catch obvious patterns (fast, no LLM)
2. **LLM checklist** (Step 2) — Haiku reviews this checklist systematically, producing yes/no warnings
3. **Rating scales** (Step 3) — Sonnet scores 7 dimensions, informed by Steps 1-2

---

## Objectivity & Tone (OBJ)

- **OBJ-01**: Does the page use insider jargon? ("EA money", "non-EA charities", "the community" without specifying which community)
- **OBJ-02**: Does it use "EA" as an unqualified adjective? ("EA organizations" instead of naming them, "EA-aligned" without defining alignment)
- **OBJ-03**: Does it present rough estimates as precise facts? ("True Cost: $500K" instead of "Estimated cost: $300K–$1M")
- **OBJ-04**: Does it use false certainty language? ("clearly", "obviously", "certainly", "undoubtedly", "without question")
- **OBJ-05**: Does it use surprise/correction markers? ("actually", "in fact", "contrary to what you might think", "it turns out")
- **OBJ-06**: Does it use self-importance language? ("This is the canonical source for...", "Rigorous analysis of...", "The definitive guide to...")
- **OBJ-07**: Does it use loaded or emotionally charged language? ("alarming", "devastating", "critical threat", "existential emergency")
- **OBJ-08**: Does it use prescriptive voice where analysis is expected? ("should", "must", "need to", "ought to" — when the page is supposed to analyze, not advocate)
- **OBJ-09**: Does it show asymmetric skepticism? (Scrutinizing one side's claims while accepting the other's at face value)
- **OBJ-10**: Does it use "we/our" in ways that assume shared identity with a particular group?
- **OBJ-11**: Does it editorialize in what should be factual descriptions? ("importantly", "significantly", "notably" used to smuggle in value judgments)
- **OBJ-12**: Does it use rhetorical questions as implicit arguments? ("Can we really afford to wait?")
- **OBJ-13**: Does it frame one position as the default/obvious one? ("Of course X is true, but...")
- **OBJ-14**: Does it attribute motives without evidence? ("They chose this approach because they wanted to...")
- **OBJ-15**: Does it use scare quotes to dismiss positions? (putting terms in quotes to signal disagreement: "their 'safety' work")

## Rigor & Evidence (RIG)

- **RIG-01**: Are there major unsourced claims? (Factual assertions without citations that a reader would want to verify)
- **RIG-02**: Are numerical estimates given without ranges? (Point estimates like "$500K" instead of "$300K–$800K")
- **RIG-03**: Is there stale data presented as current? (Using 2020 figures without noting they may be outdated)
- **RIG-04**: Are there false precision issues? (4 significant figures on a rough estimate: "$1,247,350")
- **RIG-05**: Is evidence cherry-picked? (Citing only studies that support one conclusion, ignoring contrary evidence)
- **RIG-06**: Are there circular sourcing issues? (Citing a source that itself cites this wiki or the same original claim)
- **RIG-07**: Are there inconsistent numbers? (Different figures for the same thing in different parts of the page)
- **RIG-08**: Are sources authoritative? (Citing blog posts for claims that need academic/primary sources)
- **RIG-09**: Are conditional claims stated as absolutes? ("X leads to Y" instead of "X may contribute to Y under conditions Z")
- **RIG-10**: Does it conflate correlation with causation?
- **RIG-11**: Are there unstated key assumptions? (Models or analyses that depend on assumptions not made explicit)
- **RIG-12**: Does it extrapolate beyond data? (Drawing conclusions from a narrow dataset that don't generalize)
- **RIG-13**: Are confidence levels appropriate? (Expressing high confidence about inherently uncertain future events)
- **RIG-14**: Does it cite retracted, superseded, or disputed research without noting the controversy?
- **RIG-15**: Are denominators missing? ("10 incidents" without saying out of how many total)

## Focus & Structure (FOC)

- **FOC-01**: Does the content match the title? (Title promises X but content delivers Y)
- **FOC-02**: Is there scope creep? (Page starts focused then drifts into adjacent topics)
- **FOC-03**: Is the lede buried? (Key conclusion or finding not stated until deep in the page)
- **FOC-04**: Are there redundant sections? (Same information repeated in different sections)
- **FOC-05**: Is there a missing conclusion? (Analysis that just stops without summarizing findings)
- **FOC-06**: Are there wall-of-text sections? (>200-word paragraphs without visual breaks)
- **FOC-07**: Is the page trying to do too much? (Covering 5+ distinct topics that could each be their own page)
- **FOC-08**: Is the introduction proportional? (Spending 40% of content on background before getting to the main topic)
- **FOC-09**: Are sections in a logical order? (Prerequisites after the section that needs them)
- **FOC-10**: Does the page have a clear purpose statement? (Reader can tell within the first 2 paragraphs what this page will deliver)

## Completeness (CMP)

- **CMP-01**: Are major counterarguments missing? (One-sided analysis without engaging strongest objections)
- **CMP-02**: Are key stakeholders missing? (Analyzing a policy without considering all affected parties)
- **CMP-03**: Are obvious questions left unanswered? (Raises a question in the reader's mind that it never addresses)
- **CMP-04**: Are limitations discussed? (Every model/analysis should acknowledge its limitations)
- **CMP-05**: Are uncertainties acknowledged? (Key uncertainties should be explicitly flagged)
- **CMP-06**: Is there a missing "so what"? (Data or analysis without explaining why it matters)
- **CMP-07**: Are there empty or stub sections? (Section headers with minimal or placeholder content)
- **CMP-08**: Does it cover the full scope implied by the title? (A page titled "X landscape" that only covers half the landscape)
- **CMP-09**: Are edge cases addressed? (Analysis that only covers the typical case, ignoring important exceptions)
- **CMP-10**: Is temporal coverage adequate? (Historical analysis that stops at an arbitrary date, or future-oriented analysis without considering alternate timelines)

## Concreteness (CON)

- **CON-01**: Does it use vague generalities? ("many organizations", "significant funding", "growing concern" — without specifying)
- **CON-02**: Are recommendations abstract? ("Policymakers should consider AI risks" vs. specific policy proposals)
- **CON-03**: Does it use "it depends" without specifying on what? (Hedging without giving the conditions)
- **CON-04**: Are timelines vague? ("in the near future", "soon", "eventually" without defining)
- **CON-05**: Are magnitudes missing? ("significant increase" — 10%? 10x?)
- **CON-06**: Are examples missing where they'd clarify? (Abstract claims without illustrative cases)
- **CON-07**: Are comparisons ungrounded? ("expensive" without saying compared to what)
- **CON-08**: Does it name specific actors? ("some researchers" vs. naming who — where appropriate and verifiable)

## Cross-Page Consistency (XPC)

- **XPC-01**: Are there contradictory figures across pages? (Different numbers for the same metric on related pages)
- **XPC-02**: Are there stale valuations? (Net worth or asset figures that don't account for known appreciation/depreciation)
- **XPC-03**: Are cross-references missing? (Related pages that should link to each other but don't)
- **XPC-04**: Are entity descriptions consistent? (Different characterizations of the same organization/person on different pages)
- **XPC-05**: Are date references consistent? (One page says "founded 2018", related page says "founded 2019")

## Formatting (FMT)

- **FMT-01**: Are there long paragraphs (>200 words) that should be broken up?
- **FMT-02**: Are data dates missing? (Tables or figures without indicating when data was collected)
- **FMT-03**: Are required frontmatter fields missing? (title, description, importance, quality)
- **FMT-04**: Are numbers formatted consistently? ($1M vs $1,000,000 vs $1 million — pick one per page)
- **FMT-05**: Are table headers clear? (Ambiguous column names that require context to understand)
