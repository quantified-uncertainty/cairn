# Revamp Brief: QA + Polish Pass over Phases 1–3

Context: read `REVISION_PLAN.md` first (status block at top). Phases 1–3 were executed
2026-06-09 on branch `claude/delegation-risk-phase1` (commits `ae5c2e7a`..`dad556aa`),
largely via parallel subagents. This brief defines a second pass: adversarial QA and
prose polish over that work. Use `git diff main...HEAD` to scope every check to what
actually changed.

Model policy (from REVISION_PLAN.md): Sonnet subagents for verification/reading fan-outs,
Opus for prose rewrites, main loop for judgment calls. Run checks as parallel background
agents; keep main-loop turns short.

## A. Content-loss audit (Sonnet agents, one per merge)

For each Phase 1 merge, diff the deleted sources (via `git show ae5c2e7a^:<path>`) against
the merged destination and list any unique claim, citation, formula, or example that was
dropped. Merges to audit:
1. getting-started: minimal-framework → core-concepts; how-sections-connect → reading-order
2. research: complexity-pricing + compositional-risk-measures + alignment-tax-quantification
   → risk-methods/risk-measurement-and-pricing.md
3. research: trust-dynamics-adversarial-pressure → trust-behavior/empirical-scheming-reduction.md (§8)
4. entanglements: hidden-coordination → detection/detecting-influence.md
5. reference: visual-sitemap → site-map.md
Real losses → restore into the destination file. Judgment calls the Phase 1 agents
flagged (e.g. trust-across-civilizations Part 3–5 cuts) → list for Ozzie, don't restore.

## B. Seam polish (Opus agents, only on files A flags or these known-risk spots)

Merged files may read as stitched. Check and smooth:
- risk-measurement-and-pricing.md Part I/II/III transitions and the new bridging intro
- empirical-scheming-reduction.md §8 (folded game-theory material) — does it flow?
- reading-order.md — Phase 2 prepended "The Core Path" onto Phase 1's merged content;
  check for duplicated framing between the core path and the older sections below it
- core-concepts.md — absorbed minimal-framework; check heading hierarchy and ordering

## C. Phase 3 consistency sweep (Sonnet agents)

The canonical propagation rule and tax formula changed. Grep the WHOLE corpus for
leftovers that still teach the old story:
- Any page still presenting multiplicative/minimum/harmonic/discounted as an open menu
  (check: delegation-risk/walkthrough.md, getting-started/quick-reference.md, glossary.md,
  design-patterns/*, research/theory/trust-*.md, entanglements/detection/metrics.md and
  modeling.md)
- Any entanglement-tax or P(all fail) numbers inconsistent with the beta-factor formula
  (1−ρ)·∏p + ρ·min(p) — especially entanglements/detection/modeling.md (never audited),
  delegation-accounting.md's uncertainty-multiplier table, and the four worked examples
- Verify the three updated tables in correlation-calculator.md against the formula;
  check its Worked Examples section (lines ~109–160) still consistent
- glossary.md: does it define propagation rules / entanglement tax? Update to match canon.

## D. Rendered-output spot check (one Haiku/Explore agent + script)

- `pnpm build` clean; rerun the internal-link sweep script (see plan or git log for the
  one-liner); confirm KaTeX renders on risk-propagation.md and formal-definitions.md
  (no literal $$ in HTML); confirm 20 Core badges + Start Here pin still render;
  confirm /getting-started/core-concepts/#the-formula anchor resolves.

## E. Fresh-eyes review (optional, if budget allows)

One Opus agent per area reads the END STATE only (no history): the Core Path page,
risk-propagation.md, and the rewritten correlation-calculator.md. Question: "Would a
smart newcomer find errors, confusing transitions, or overclaiming?" Math claims in
risk-propagation.md should be re-derived, not trusted.

## Done criteria

- All A-losses restored or explicitly waived; B-seams smoothed; C-leftovers updated;
  D-checks green. Commit as "Revamp: QA pass over Phases 1–3" on the same branch.
- Update REVISION_PLAN.md status block with what the revamp changed.
- List for Ozzie: anything ambiguous, plus the deferred judgment calls from A.
