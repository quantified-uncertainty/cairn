# Delegation Risk Content Revision Plan

Status: proposed (2026-06-09). Derived from a full-corpus review of all 169 content files (~330k words).

## Diagnosis (summary)

The corpus is internally coherent and unusually honest, but:

1. The genuinely novel ~60k words (entanglements, accident/defection decomposition, channel
   integrity, delegation accounting, 3 isomorphic case studies) are buried in ~270k words of
   competent-but-derivative scaffolding.
2. The quantitative apparatus is decorative: every P(harm) is illustrative, no calibration,
   no sensitivity analysis. `experimental/probabilistic-estimation/` — the section meant to
   fix this — is ~40% built (registry empty, tools described but not implemented).
3. Load-bearing math is under-justified: risk propagation rules are offered as a menu
   (multiplicative vs. minimum vs. discounted) though they give wildly different answers;
   Euler allocation assumes degree-1 homogeneity that is never argued for AI risk.
4. High redundancy: the core formula is restated 7+ times in getting-started; three research
   files overlap on risk pricing; Enron/Boeing/Iraq-WMD examples are recycled across sections.
5. Missing literature bridges: principal-agent economics (the obvious foundation) and
   deceptive alignment are barely engaged.

## Goals

- **G1**: A discoverable "Core" tier (~60k words) that a motivated reader can finish.
- **G2**: At least one fully calibrated, distribution-based worked example — moving the
  framework from "vocabulary" to "method."
- **G3**: One canonical propagation rule with a written justification; honest scoping of
  Euler allocation.
- **G4**: ~25–30% total word-count reduction via merges and demotion, with zero broken links.
- **G5**: Explicit bridges to principal-agent theory and deceptive alignment.

---

## Phase 1 — Compression & deduplication (mechanical, low risk) — ~1–2 days

### getting-started/ (13.7k words → target ~8k)
- Keep `five-minute-intro.md` as the single entry point.
- Merge `minimal-framework.md` into `core-concepts.md`; trim `introduction.md` to problem
  statement + pointers (the decomposition argument currently appears in 3 files — keep one
  canonical telling in `core-concepts.md`).
- State `DR = Σ P(harm) × Damage` ONCE canonically (in `core-concepts.md` with an anchor);
  everywhere else cross-link instead of restating.
- Merge `reading-order.md` + `how-sections-connect.md` into one navigation page (Phase 2
  rewrites it as the Core path).

### research/ (32 files → ~27)
- Merge `complexity-pricing.md` + `compositional-risk-measures.md` +
  `alignment-tax-quantification.md` → `risk-measurement-and-pricing.md`.
- Fold `trust-dynamics-adversarial-pressure.md` into `empirical-scheming-reduction.md`
  (the empirical file is stronger; keep its citations).
- Deduplicate intro framing between `human-ai-trust.md` and `human-trust-calibration.md`.
- Relabel `research-connections.md` as an annotated reading list (it is one).
- Delete `hierarchy-visualization.md` (index-like, no research content).

### case-studies/
- Cut `human-systems/trust-across-civilizations.md` (~45 pages) to its generative third:
  keep pirate democracy, monastery verification, Manhattan Project compartmentalization;
  drop the Enron/Theranos/Nixon retellings (cross-link to
  `entanglements/case-studies/historical-cases.md`, which covers Enron better).
- Fold `alliance-cascades.md`'s WW1 material into a short "network cascade" section; its
  core point (bilateral thinking misses systemic risk) is one section, not a file.

### Cross-cutting dedup
- Canonical homes for recycled examples: Enron/Andersen, Boeing/FAA, rating agencies →
  `entanglements/case-studies/historical-cases.md`; Iraq WMD →
  `entanglements/case-studies/intelligence-failures.md`. All other mentions become links.
- `reference/site-map.md` vs `reference/visual-sitemap.md`: keep one.

### Mechanics
- Update `astro.config.mjs` sidebar for every removed/merged slug.
- Add redirects (Astro `redirects` config) for all removed slugs.
- Acceptance: `pnpm build` passes; link checker clean; getting-started ≤ 8.5k words.

---

## Phase 2 — Core carve-out & navigation — ~1 day

### Define the Core tier (~60k words)
- `entanglements/` fundamentals + detection/detecting-influence + case-studies/examples
- `delegation-risk/risk-decomposition.md`, `delegation-accounting.md`, `insurers-dilemma.md`
- `design-patterns/channel-integrity.md`, `structural.md`, `composing-patterns.md`
- All 4 worked examples (research-assistant, code-deployment, trading, healthcare)
- Case studies: `nuclear-launch-authority.md`, `jury-trust.md`, `criminal-trust.md`,
  `case-study-sydney.md`

### Implement
- Frontmatter tier field (`tier: core | reference | archive`) + a Starlight badge
  (`badge: { text: 'Core' }` in sidebar entries is the cheap version).
- Rewrite the merged navigation page as **"The Core in ~12 pages"** — an ordered path
  through the list above, with one paragraph per stop saying what it contributes.
- Sidebar: Core path pinned at top (manual items, like the existing Design Patterns block);
  everything else under collapsed reference groups.
- Demote to archive tier (keep, badge as archival, remove from main nav):
  `entanglements/cross-domain/hidden-coordination.md` (merge usable content into
  `detecting-influence.md`), `case-studies/human-systems/organizational-trust.md`
  (or move under a "applying to ordinary orgs" tools page).
- Anomaly Chronicles: stays, clearly fiction-labeled (it already is), outside the Core path.

---

## Phase 3 — Math hardening (the real intellectual work) — ~2–4 days

### 3a. Pick the propagation rule (decision required — recommendation below)
- Write `delegation-risk/risk-propagation.md` (or extend `exposure-cascade.md`):
  adopt **multiplicative composition as the default**, with an explicit independence
  caveat and an entanglement correction term (link to the entanglement tax). Justify with:
  (i) derivation from independent-failure assumptions, (ii) a small Monte Carlo simulation
  showing where multiplicative vs. minimum diverge and which matches simulated ground truth
  under correlation, (iii) guidance for when minimum is the honest bound (fully correlated
  verifiers).
- Sweep all worked examples + tools to use the chosen rule consistently
  (currently `trust-propagation.mdx` and the examples mix rules).

### 3b. Scope Euler allocation honestly
- Add a section to `cross-domain-methods/euler-allocation.md` +
  `research/financial-risk-budgeting.md`: when is DR degree-1 homogeneous? Name the failure
  modes (threshold effects, superadditive interaction harms), and state the rule:
  **Euler for smooth/marginal regimes, Shapley (or explicit scenario analysis) when
  thresholds dominate.**

### 3c. Tighten the entanglement tax
- One canonical derivation in `entanglements/fundamentals/formal-definitions.md`; the
  correlation-calculator lookup tables reference it; add an explicit higher-order-
  correlation limitation note.

### 3d. Power/agency: bridge or demote
- Write a 1-page bridge: agency score enters DR as a modifier on P(defection); power score
  as a modifier on Damage. If the bridge doesn't hold up while writing it, badge the whole
  `power-dynamics/` section as speculative-tier instead. Either outcome is fine; the
  current floating state is not.

---

## Phase 4 — Probabilistic estimation completion (biggest lift, the differentiator) — ~1–2 weeks

This is the highest-value phase: it converts the framework's central weakness into its
distinctive strength, and it is the most QURI-shaped work (Squiggle-native).

### 4a. Populate the estimates registry
- `estimates/probability-priors.md`, `damage-distributions.md`,
  `mitigation-effectiveness.md`: real elicited distributions in Squiggle notation, each
  entry carrying `source`, `confidence`, `calibration-status` fields.
- **Add the missing file: `estimates/correlation-priors.md`** — ρ priors by architecture
  relationship (same provider/different model, same training paradigm, shared retrieval,
  etc.). The entanglement tax is uncomputable without these; this is the link between the
  experimental section and the site's best idea.

### 4b. One fully calibrated worked example, end to end
- Use the **code-deployment example** (best public data: incident postmortem corpora,
  CVE/supply-chain stats, SWE-bench-style model failure rates, DORA benchmarks).
- Replace every point estimate with a distribution; run sensitivity analysis; show which
  inputs the recommendation is robust to and which flip it; document elicitation per the
  existing `expert-elicitation.md` protocols (that file is already good — use it as-is).
- Publish as `design-patterns/examples/code-deployment-calibrated.mdx`, in the Core path.

### 4c. Tools: build the minimal one, cut the vaporware
- Build: one **distribution-based risk calculator** (React + Squiggle JS — `@quri/squiggle-lang`
  embeds cleanly in the existing React/mdx setup; `delegation-risk-calculator.mdx` is the
  shell to upgrade).
- Cut from `experimental/tools/index.md`: Trust Updater, Sensitivity Dashboard,
  Architecture Comparator — replace with a one-line "future work" note. No described-but-
  nonexistent tools.

### 4d. Seed the incident database
- 20–30 real AI incidents (AI Incident Database, public postmortems) mapped to framework
  categories (accident vs. defection, entanglement class, which pattern would have caught
  it). This grounds the priors in 4a and gives the case-studies section empirical teeth.

---

## Phase 5 — Literature bridges & known gaps — ~2–3 days

- New `research/principal-agent-theory.md`: explicit term-by-term mapping (delegation risk ↔
  agency cost; defection ↔ moral hazard; verification patterns ↔ monitoring/screening;
  insurer's dilemma ↔ Holmström). Cite Holmström–Milgrom, Myerson, Bolton & Dewatripont
  (already in the bibliography — the engagement just never happened).
- New `research/deceptive-alignment-stress-test.md`: how each Core mechanism fares against
  a schemer (connect to Greenblatt et al. AI Control, Hubinger et al.); be explicit about
  which patterns assume non-adversarial failure.
- Sharpen `reference/related-approaches.md`: add the principal-agent positioning, plus
  specification gaming / power-seeking (Turner et al.) references.
- Add a short "humans as fallible checkpoints" subsection to `design-patterns/monitoring.md`,
  cross-linking the (already strong) `entanglements/cross-domain/psychology-of-oversight.md`
  numbers to concrete design rules (e.g., verification session length limits).

---

## Phase 6 — Ship — ~1 day

- Update glossary + sitemaps to the new structure.
- Regenerate PDF/EPUB, cut `v2.0.0` release on `quantified-uncertainty/delegation-risk-framework`,
  update the hardcoded `v1.0.0` links in `index.mdx` and `astro.config.mjs:33`.
- Optional distribution: extract a standalone essay ("The Entanglement Tax: why your five
  90% safety layers aren't 99.999%") for LW/EA Forum, linking back to the Core path.

---

## Sequencing & dependencies

```
Phase 1 ──> Phase 2 ──> Phase 6
Phase 3 ──────┬───────> Phase 4 (rule choice feeds calculator + calibrated example)
Phase 5 (parallel with 3/4)
```

Phases 1–2 are safe LLM-assisted mechanical work. Phase 3 needs real authorial judgment.
Phase 4 is the long pole and the highest-value item; if time-boxed, do 4b (calibrated
example) before 4a (full registry).

## Decision points (owner: Ozzie)

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Core = site tier now, separate paper later? | Site tier now; essay (Phase 6) as the external artifact; full paper only if the calibrated example lands well |
| 2 | Propagation rule | Multiplicative default + entanglement correction; minimum as the bound for correlated verifiers |
| 3 | Tools | Build one Squiggle calculator; delete the other three promises |
| 4 | Weak files | Demote/badge as archive, don't delete (except `hierarchy-visualization.md`) |
| 5 | Empirical calibration depth | One example fully calibrated (4b) before populating the whole registry |

## Model selection per task

Tiers (per 1M tokens): Fable 5 $10/$50 · Opus 4.8 $5/$25 · Sonnet 4.6 $3/$15 · Haiku 4.5 $1/$5.
Rule of thumb for subagents: Haiku/Explore to *find*, Sonnet to *read and summarize*,
inherit the main model (no override) to *decide or write*.

| Task | Model |
|---|---|
| Phase 3 math hardening (derivations, rule choice) | Fable 5 / Opus 4.8, effort high/xhigh, main loop — do not delegate |
| Phase 4b calibrated example, prior synthesis | Fable 5 / Opus 4.8 |
| Phase 4c Squiggle calculator component | Opus 4.8 (calculator itself is client-side Squiggle, no LLM calls) |
| Phase 1 prose merges | Opus 4.8 main loop + Sonnet verifier subagents ("every claim preserved?") |
| Phase 4d/5 incident + literature research fan-out | Sonnet 4.6 subagents in parallel; synthesis back on Opus/Fable |
| Link checks, cross-ref audits, find-where-X-is-mentioned | Haiku 4.5 / Explore agents |
| Phase 2/6 sidebar, redirects, frontmatter, glossary sync | Sonnet 4.6 |

Spend concentrates correctly when Fable/Opus time goes to Phase 3 + Phase 4b synthesis
(~15% of tokens, ~80% of correctness risk) and the wide fan-outs run on Sonnet/Haiku.

## Acceptance criteria (whole effort)

- Total corpus ≤ ~240k words (from ~331k); Core path ≤ ~65k.
- `DR` formula defined in exactly one place; one propagation rule used everywhere.
- One worked example with distributions + sensitivity analysis, reproducible in the
  embedded calculator.
- Zero broken internal links; clean `pnpm build`; redirects for every removed slug.
- `related-approaches.md` names principal-agent theory and deceptive alignment explicitly.
