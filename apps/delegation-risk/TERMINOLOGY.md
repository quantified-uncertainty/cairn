# Terminology Canon

Decision log for the framework's vocabulary. Rules:

1. **The canon is capped.** New Framework Terms require an entry here, a collision check
   (web search), and a survival test (write the glossary entry + one natural usage sentence).
   Everything else is prose.
2. **Borrowed terms are used as their home field uses them**, with attribution. We do not
   redefine other people's words, and we cite the existing term when ours is adjacent
   (the "Rosetta rule").
3. **Rejected terms stay rejected** (see bottom) unless new evidence reopens them.

Collision checks run 2026-06-10 (web). Sources: Redwood reference pack (same date,
see REVISION_PLAN/session notes), CIEM vendor literature, aviation/finance standard usage.

---

## The vocabulary architecture (three tiers)

The load-bearing fix. Three concepts were previously smeared across the word "exposure":

| Term | What it is | Type | Lineage |
|---|---|---|---|
| **Harm surface** | The enumeration: the *set* of distinct ways a delegation can go wrong | a set | attack surface (security); collision-checked clear |
| **Exposure** | The worst-case loss across that surface, given the delegate's actual access and capability | dollars (bound) | exposure-at-default (finance) |
| **Delegation risk** | The expected loss: Σ P(harm mode) × Damage | dollars (expectation) | agency cost (economics); "delegation risk" itself is in organic compatible use in management/governance literature — we inherit, not own, the phrase |

Mnemonic: **enumerate → bound → expect.** Sweep rules: "exposure is not a number / surface
area of what can go wrong" → harm surface; "$X exposure (expected)" → delegation risk;
"$X exposure budget" → decide per-context whether worst-case (exposure) or expected
(delegation risk) is meant — exposure-cascade budgets are expected-loss budgets and should
say "risk budget".

## Canon terms

**delegation engineering** — The practice of designing, measuring, and operating delegation
structures (human or AI) to bound exposure while preserving capability. The field name for
what this site does. Usage rules: descriptive register only ("work in delegation
engineering"), never foundational ("we founded…"); when first used on a page, scope to AI
("…applied to AI agent systems") since all our distinctive content is AI-flavored.
Collision: clear.

**risk preflight** — A damage estimate run by the scaffold before an agent action commits:
enumerate the harm surface of the proposed action, bound the exposure, compare against
budget, adjust strategy or escalate. Lineage is doubly helpful: CORS preflight (a cheap
permission-check request before the real request) and aviation flight-risk assessment
tools. Hard rule: the preflight component must sit *lower* on the verifiability hierarchy
than the actor it checks (see "who preflights the preflight" in
`delegation-risk/runtime-accounting.md`) — a frontier model preflighting itself is
correlated with its own blind spots and, if scheming, falsifies its own telemetry
(the standard Control objection; Greenblatt et al., arXiv:2312.06942).

**exposure envelope** — The bounded region of action-space within which an agent may operate
freely; the scaffold enforces the boundary *regardless of the agent's inputs or intent*.
Lineage: Airbus flight envelope protection. This is the framework's
intent-independence thesis made mechanical. The envelope is a hard bound, not a statistical
one — this is what answers the concentrated-failure objection (a single catastrophic action
must hit the envelope wall, not merely overdraw a budget).

**exposure ledger** — The running account of exposure per delegate: actions debit, completed
verifications and de-provisioning credit back. Ships ONLY with its discipline attached:
**reconciliation** (periodically comparing ledger estimates against observed incidents and
near-misses) and **consolidation** (rolling up a subagent tree requires correlation
adjustments, like intercompany eliminations — naive sums double-count shared risks).
A ledger without reconciliation is the fake-precision trap with bookkeeping aesthetics.

**privilege overhang** — The static gap between what a delegate *can* do and what its current
task *needs*. Position against existing security vocabulary, always cited: **privilege
creep** (the process that grows it over time) and CIEM's **unused entitlements / permissions
gap** (the cloud-security measurement of the same quantity; Microsoft 2024: ~2% of granted
cloud permissions are used). Overhang is the stock; creep is the flow.

**load-bearing channels** — The sanctioned communication paths between delegates that
decomposition could not remove; the "necessary evil" channels where monitoring budget should
concentrate. The named subspecies of entanglement that is *chosen*, vs. the passive
correlations that are inherited.

**correlation budget** — A budget on allowed failure correlation within a defense stack
("no two layers share a provider"), complementing the risk budget. The practical, settable
face of the entanglement tax. ρ is always on the phi (failure-indicator) scale per
`delegation-risk/risk-propagation.md`.

## Borrowed terms — used as-is, with attribution

- **AI Control vocabulary** (Redwood Research; cite arXiv:2312.06942 at first use per page):
  *trusted model, untrusted model, control protocol, control evaluation, trusted/untrusted
  monitoring, trusted editing, auditing budget, concentrated failures.* Their scope is the
  defection channel (scheming); our accident channel is outside their stated scope — say so
  rather than stretching their terms. Their tradeoff term is **usefulness cost** — "control
  tax" is NOT their term and we don't attribute it to them.
- **Security**: attack surface, least privilege, blast radius, privilege creep, unused
  entitlements.
- **Reliability engineering**: common-cause failure, beta-factor model (Fleming 1974;
  NUREG/CR-4780), N-version programming (Knight & Leveson 1986), Swiss-cheese model
  (Reason 1990).
- **Economics/finance/accounting** (prose, never capitalized into Framework Terms):
  agency cost, moral hazard, adverse selection (Holmström lineage); margin call,
  mark-to-market, reconciliation, consolidation, exposure-at-default.
- **Climate economics**: marginal abatement cost curve — when ranking interventions by
  exposure-reduced-per-dollar, name the import explicitly rather than minting "risk
  abatement curve" as ours.

## Rhetoric tier (usable in prose, not canon)

- **approval theater** — self-explaining via Schneier's security theater; "governance
  theater" already live in AI discourse. Use for effect, don't define formally.
- **rubber-stamp rate** — fraction of approvals issued faster than minimum reading time;
  a metric name, fine in prose and dashboards.
- **exposure-hours** — time-integrated exposure (the walkthrough's risk-weighted
  exposure-time); promote to canon only if it earns repeated use.

## Considered and rejected

- **control tax** — not Redwood's term (theirs: usefulness cost); attributing it would be
  the renaming sin in reverse.
- **capability escrow** — "AI escrow" already means vendor-continuity weight-holding;
  the site's existing *Capability Airlock* pattern covers the concept.
- **risk-adjusted capability / RACAP** — right idea, broken units in
  power-dynamics/agent-power-formalization.md; rejected until the formalization is repaired.
- **diversity quota** — "quota" baggage; the canon already covers it via correlation budget.
- **harm modes → "harm surface" replaces "surface area of what can go wrong"** — the
  walkthrough's informal phrasing, now canonized properly.
- **harmonic / discounted propagation rules** — retired with derivation in
  delegation-risk/risk-propagation.md (Phase 3).
- **trust (as an undefined math symbol)** — where used quantitatively it must be defined as
  P(faithful execution) and reconciled with harm-mode tables; colloquial use is fine.
