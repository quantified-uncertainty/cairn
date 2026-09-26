# Evaluation Engineering — Revision Plan

*September 2026. Written after a full read of all 18 pages (~21k words).
Phase 1 shipped in the PR that added this file; the rest is proposed.*

## Decision

Turn the wiki from a well-organized restatement of the 2021–22 program
into a **quantitative, evidence-backed engineering text**. The conceptual
chapters (Components, Methods, Techniques) are 2021 thinking with almost
no evidence. The two strongest pages (the catalogue of ~100 systems and
the Patterns literature synthesis) were added in 2026 and never fed back
into them. The wiki's central claim — LLMs make the architecture buildable
— had no chapter at all.

**What would flip this:** if the intended readership is funders deciding
*whether* to back the agenda rather than practitioners building systems,
the priority becomes the Objections and Use Cases pages, not a
quantitative core. Worth asking before Phase 3.

## Diagnosis (what the read found)

1. **Factual error in the headline empirical claim.** The 2019
   amplification experiment was cited in three pages as "~73% of the
   evaluator's signal … at much lower cost." The source table says:
   network-adjacent forecasters recovered 87% of the value at **120%** of
   the evaluator's cost (benefit/cost 72%). The cheaper group had
   *negative* value. Fixed in Phase 1.
2. **Structural bugs.** Two chapters numbered "4"; the strongest pages
   unnumbered; Part III one page long.
3. **Redundancy.** The "all you need" thesis appeared in 5 places, the
   capability ladder in 5, the candidness/rollout example in 3, the
   system-questions list in 2.
4. **The "why now" has no chapter.** LLM evaluation existed only as a
   bibliography section.
5. **No worked example.** External commentary's single most-requested
   item, and still listed as a standing gap on Open Problems.
6. **Unsupported claims** stated as fact ("statistical measures are growing
   faster than any other method"; centralized truth agencies "more
   corrupt than their reputations suggest").
7. **Sibling links pointed at the GitHub repo**, not at the RRP site.

## Phase 1 — shipped in this PR

- Sidebar renumbered 1–12; the catalogue and the Patterns synthesis moved
  into their own Part III ("Evidence from the Wild"); Lineage moved to
  Reference. URLs unchanged.
- One home per repeated idea; other occurrences reduced to pointers.
- Amplification figures corrected everywhere (both wikis); a CriticGPT
  figure that the paper's abstract doesn't support was replaced with
  figures it does support.
- New chapter **9. LLMs as Evaluators**: what LLMs cheapen per component,
  what the judge literature measures, the two system-level failures
  (correlated error, Goodhart under optimization), and the
  audit-the-cheap-layer design pattern.
- New **Interlude: A Worked Example**: 1,000 grants through four designs,
  with explicit costs and the binomial arithmetic of a 50-item audit.
- Patterns findings pushed back into Methods and Techniques (robust
  aggregation, pairwise comparison, verifying who evaluates); unsupported
  claims grounded or marked as conjecture.
- Cross-links to specific RRP pages; `llms.txt` and `llms-full.txt`
  generated from the sidebar by a shared script; a link, anchor, and
  KaTeX checker (`scripts/check-built-links.py`).

## Phase 2 — rewrite the 2021 chapters against the evidence

- **Evaluation Methods:** replace the per-method prose "profiles" with a
  comparison table populated from real catalogue systems (cost per
  evaluation, coverage, documented failure). Every "high/low" gets an
  example or is marked as a guess.
- **Techniques:** each technique gets a status line —
  *tested* (prediction–evaluation, with the 2019 numbers), *deployed
  elsewhere* (Bayesian shrinkage, pairwise ranking), or *untested*
  (automated trust networks, estimation functions at scale).
- **Draft the capability ladder.** Mentioned five times, never written.
  A v0 with 5 levels, each defined by a measurable property (e.g. Level 2:
  publishes a measured error rate; Level 3: error rate survives an
  adversarial audit). Grade 5 real systems from the catalogue against it
  to test whether the levels discriminate.
- **Obstacle:** the 2021 notes are gitignored in the sibling app, so
  provenance checks need the author's local copy.

## Phase 3 — a quantitative core

RRP has a Core Model with graded formalisms; this wiki has only the phrase
"accuracy × quantity × cost". Build the equivalent, reusing RRP's
**[exact] / [standard shape] / [heuristic]** grades:

- System value as decisions changed × value per change − cost, with the
  value-of-information term made explicit (Cruxes Q9).
- Optimal audit fraction for a prediction–evaluation system as a function
  of stakes and gaming pressure (starting from RRP's inspection-game
  bound).
- Propagation and consistency: expected staleness of a static report set
  vs. a function-based one, given an input-update rate.
- **Obstacle:** value-per-changed-decision is the hard term, and it has no
  good estimator yet. Expect this chapter to end with an honest
  [heuristic] grade on that term.

## Phase 4 — real case studies

Replace the fictional grants example with measured ones:

- Run design C (model on everything, hidden random expert audit) for one
  real cycle with a willing funder, or on QURI's own RoastMyPost logs.
  Publish agreement vs. the panel–panel baseline.
- Write up Squiggle AI and RoastMyPost **from the throughput/cost angle**
  (cost per evaluation, coverage, error rate). RRP's case-study page
  covers their trustworthiness; don't duplicate it.
- **Obstacle:** needs a partner and 1–3 months of calendar time; this is
  where the plan most likely stalls.

## Phase 5 — the one-wiki-or-two question

The two wikis share ancestry, citations (Goodhart, reputation systems,
amplification, LLM-judge biases), and at least three topics:
EE Epistemic Culture ↔ RRP Ch. 22 (planned); EE trust networks ↔ RRP
Ch. 19; EE prediction–evaluation ↔ RRP oversight protocols.

**Recommendation:** keep two wikis with distinct questions (EE:
*throughput at known cost*; RRP: *corruption cost*), and share one
literature layer. Concretely: a single culture chapter, linked from both;
EE's Patterns page as the shared evidence base RRP cites instead of
restating.

**What would flip it:** if a reader survey or analytics showed most
readers arrive at one wiki and never cross over, merging into one book
with two Parts would serve them better.

## Not in scope

- Renaming the field (Cruxes Q12). No new evidence bears on it.
- Changing URLs. Nothing is gained that the sidebar doesn't already give.
