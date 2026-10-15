# Audit: delegation-risk core (homepage, getting-started, delegation-risk, power-dynamics, reference, IA, planning docs)

Auditor pass, 2026-10-15. Every page in scope was read in full: ~47k words of content plus ~8k words of planning docs.
All paths are relative to `apps/delegation-risk/` unless absolute. Content paths are relative to `src/content/docs/`.

---

## Overall verdict: 4 / 10

**What works.** The June 2026 hardening was real. Fabricated citations were purged, illustrative numbers carry banners, and the homepage now says honestly that the work is "early-stage, exploratory." Three pages would hold up on LessWrong after modest edits: `delegation-risk/risk-propagation.md`, `delegation-risk/runtime-accounting.md`, and the five-minute intro. The site credits common-cause-failure prior art directly. The idea of making delegation risk a quantity tracked inside the agent harness (preflight, envelope, ledger) is a good one, and it is timely.

**Why it scores only 4.**
1. **Load-bearing math is wrong or self-contradictory.** The power-dynamics formalism (`Capability = Power × Agency`, `DR = Capability × Misalignment`, RACAP) contradicts the core `DR = Σ P × D` and the site's own "bridge" paragraph. RACAP was formally *rejected* in TERMINOLOGY.md, yet it still appears 31 times. The flagship ledger's "consolidation" rule and the exposure-cascade "multiplicative budget" claim are both mathematically wrong (expectations add). The worked examples contain arithmetic contradictions.
2. **It reads as 2023–24, not late 2026.** The examples use GPT-4, AutoGPT, BabyAGI, LangChain, "OpenAI Functions," and a "hypothetical autonomous agent." It treats "RL systems" as a rarely used bottom tier of the verifiability hierarchy, but every frontier model is now RL-trained. Missing entirely: prompt injection as a threat class, CaMeL and capability-based agent security, METR time horizons, the 2025 reward-hacking and scheming evidence, frontier safety frameworks, and the AI insurance market. The roadmap's "2025–2027 human-level AI" timeline and Gantt chart are simply out of date.
3. **The headline number rests on an unsourced ρ table.** The "~50× entanglement tax at ρ≈0.5" is unsourced, and the math (a passive beta-factor model) does not apply to the adversarial cases the site uses it for.
4. **Planning docs were only partly carried out.** Phases 4–6 of REVISION_PLAN are not done. The Phase 5 acceptance criterion ("related-approaches names principal-agent theory") is unmet. A Core-path page, `insurers-dilemma.md`, still ends on a cliffhanger for the deleted Anomaly Chronicles fiction.
5. **Heavy LLM house style.** Pages share a uniform TL;DR box, 14 "Key Insight" boxes, template listicles, made-up percentages in tables, and dialogue vignettes with invented premiums.

Count of findings: **P0 = 16, P1 = 27, P2 = 15**.

---

## P0: credibility-damaging, wrong, or contradictory

### P0-1. Power-dynamics formalism contradicts the core formula and itself (L)
- `power-dynamics/agent-power-formalization.md` Part IV: "$\text{DelegationRisk} = \text{EffectiveCapability} \times \text{Misalignment}$" and "$\text{Value} = \text{EffectiveCapability} - \text{DelegationRisk} = \text{Power} \times \text{Agency} \times (1 - \text{Misalignment})$". This contradicts `DR = Σ P(harm) × Damage` (canonical in `getting-started/core-concepts.md#the-formula`). It also subtracts a dimensionless score from dollars.
- `power-dynamics/index.md` (the Phase 3d "bridge") says a system with Agency ≈ 0 "has *no defection term*: its entire risk budget is accident risk." Under Part IV's formula, Agency = 0 gives Capability = 0 and therefore DR = 0. Two pages in the same section disagree on what the formula says.
- `Capability = Power × Agency` makes a "strong tool" (high power, low agency) *low-capability* by definition. That undermines the Strong Tools Hypothesis on its own terms. `agency-power-examples.md` shows the problem: Google Search ("Very High" power, agency ~0.1) and the calculator (Effective Capability 0.1) come out near-useless.
- `agent-power-formalization.md` "fully stated" problem: `max Power × Agency s.t. ... Agency ≥ TaskMinimum`. Maximizing Power × Agency pushes agency *up*, which is the opposite of "Set agency as low as possible" stated on the same page.
- The same formula is repeated in `getting-started/core-concepts.md` ("Capability = Power × Agency … We want high power, minimum necessary agency"), `getting-started/quick-reference.md` (Core Formulas table), `getting-started/glossary.md` (Effective Capability, RACAP), and `strong-tools-hypothesis.md` ("Delegation Risk ∝ Power × Agency × Misalignment").
- CREDIBILITY_HARDENING_PLAN "Deferred" lists "power-dynamics equation reconciliation … either Fable for an afternoon or badge section speculative." **Neither happened.**
- **Fix:** Delete Part IV's equations and `Capability = Power × Agency` everywhere. Keep only the bridge in `power-dynamics/index.md`: agency gates P(defection) and power bounds Damage. Badge the whole section "Speculative." Remove the optimization-problem blocks from core-concepts.

### P0-2. RACAP was rejected in the canon but is used 31 times (S–M)
- `TERMINOLOGY.md`: "**risk-adjusted capability / RACAP** — right idea, broken units … rejected until the formalization is repaired."
- It still appears in `getting-started/glossary.md` ("Higher RACAP = better system design"), `getting-started/quick-reference.md`, `power-dynamics/index.md`, `agent-power-formalization.md`, `agency-power-examples.md` (entire Example 2 and 3), `strong-tools-hypothesis.md`, `case-studies/power-dynamics-cases.md`, and `research/potential-projects.md`.
- `agency-power-examples.md` Example 2 concludes "**AlphaGo has the best RACAP**" (2.25). The only reason is an assumed DR of "\$1/month". The units problem is the one the canon flagged: dividing by dollars means a \$0-risk system has infinite RACAP.
- **Fix:** Purge RACAP, or rename it to a frontier plot (capability vs DR) with no ratio.

### P0-3. "Consolidation" in the flagship exposure ledger has the math backwards (S)
- `delegation-risk/runtime-accounting.md` §3: "When a coordinator's exposure is rolled up from its subagents, the entries don't simply sum — shared dependencies mean shared failure modes, and naive addition double-counts independence you don't have … The entanglement tax is what you pay when you skip this step."
- Expected losses add *exactly*, whatever the correlation (linearity of expectation). Where subagents' harm modes hit the *same* asset, the true rolled-up loss is P(A∪B)·D = (P_A + P_B − P(A∩B))·D. So the naive sum is an **upper bound**, and positive correlation makes it *more* conservative, not less. The entanglement tax applies to AND-structures (all layers miss), not to OR-roll-ups.
- The same claim appears in `TERMINOLOGY.md` (exposure ledger: "naive sums double-count shared risks") and `getting-started/glossary.md#exposure-ledger`.
- **Fix:** Rewrite consolidation. (a) Expected-loss roll-ups add, minus an overlap correction when harm modes target the same asset, so the sum is conservative. (b) Correlation matters for *tail* metrics (P(simultaneous failures), VaR/ES of the roll-up) and for AND-type defense stacks. (c) Link the entanglement tax only for (c)-type structures.

### P0-4. Exposure cascade: "cascades multiplicatively" and "67% risk reduction" are both wrong (S)
- `delegation-risk/exposure-cascade.md` Key Insight 1: "Risk budget cascades multiplicatively … (why multiplication is the right composition … is derived in Risk Propagation)." The page's own arithmetic is subtractive (retain + delegate = receive), and Key Insight 4 says "The total is conserved." Reliability composition has nothing to do with budget allocation, so the cross-link conflates two unrelated operations.
- Worked example: moving from Standard to Tight gives "Risk reduction: 67%". The Board's total budget is still \$5M in both scenarios. Tight oversight *moves* risk budget up the hierarchy; it does not reduce organizational risk. "Velocity reduction ~40%" and "Incidents last year: 3 (expected ~2 at this risk level)" are invented.
- The "Key observation: Higher levels retain more proportionally" is contradicted by the page's own table (Board 10%, CEO 33%, Execs 67%, Managers 40%).
- **Fix:** Rewrite the insights as additive allocation. Pick a Euler/Shapley-style allocation or say it is judgmental. Delete the multiplicative claim and the fake trade-off numbers. Better still, re-target the page at an orchestrator→subagent tree, which is the AI case the site is about.

### P0-5. Walkthrough arithmetic is internally inconsistent (S)
`delegation-risk/walkthrough.md`:
- Part 3 shows "Total Active Delegation Risk: \$203.75" (15.50 + 180 + 8.25 = 203.75), then "Current Usage: \$204.75 (41% of budget)". It then computes "Would push total to \$644.75", which is 204.75 + 440 and should be 643.75.
- Frank's per-delivery risk is \$220, estimated from his \$5,000 deliveries (initially \$180 on \$5,000). "Frank's estimated risk: \$440" for \$10,000 scales correctly. But Part 4 says "Frank's risk: \$220/delivery → \$1,100 for this amount [\$5,000]", which treats \$220 as per-\$1,000. The "55×" comparison ("Two deliveries of \$1,000 … Frank \$220 × 2.1") has the same error.
- "Risk-Weighted Exposure = Delegation Risk × Duration" multiplies a per-delivery expected loss, which already integrates over the delivery window, by time again. That double-counts. The lifecycle box ("\$42.50/delivery × duration") makes the same confusion.
- Measure 3 (bond "forfeits if delivery fails") is a *transfer* of Alice's loss to Bob, not just an incentive change. Alice's residual expected loss from Loss/Theft should fall to about zero, leaving roughly the \$10 delay, not "≈\$15." This is the risk-transfer vs risk-reduction distinction the insurer pages depend on.
- **Fix:** Recompute Parts 3–4 on one consistent per-\$1,000 basis, drop or redefine "risk-weighted exposure" as a rate (\$/hour of exposure), and correct the bond step.

### P0-6. Overview's flagship example: the "trust" numbers can't be reconciled with the harm tables, and Step 2 leads nowhere (M)
- `delegation-risk/overview.md` puts edge weights on the diagram ("trust: 0.95/0.90/0.85"). These are never defined and cannot be squared with the components' harm probabilities (Summarizer harms total P≈0.021, yet trust is 0.90). `TERMINOLOGY.md` itself rules: "trust (as an undefined math symbol) — where used quantitatively it must be defined as P(faithful execution) and reconciled with harm-mode tables." The same undefined trust weights appear in `getting-started/core-concepts.md` ("If A trusts B with weight 0.8").
- Step 2 computes "JointReliability = 0.8075 … ~19%" and then never uses it. The system total stays the sum of component DRs.
- The post-mitigation diagram labels the Verifier edge "0.99", but the text says the verifier catches 70% of buggy deployments.
- No time unit is given for the probabilities. The TL;DR says "\$1,770/month", but "Deploys buggy code P = 0.05" is per what?
- The "Comparison to Nuclear Safety" section (\$12k/yr vs \$100k/yr is "roughly comparable … suggests either we're appropriately cautious or…") is a non sequitur. It compares an 8× gap between unrelated systems with an arbitrary \$10B damage figure.
- **Fix:** Define link weights as P(link executes faithfully per task) derived from the harm tables, or remove them. Either feed Step 2 into the total or cut it. Fix the diagram label. State "per month, at N tasks/month." Delete the nuclear comparison.

### P0-7. Core-path page `insurers-dilemma.md` ends on a teaser for deleted fiction (S–M)
- The page ends with "## Setting Up Mr. X", "## What Diana Learns", and "Diana: Alice? We need to talk … a completely different way of structuring this engagement." That payoff lived in Anomaly Chronicles, which was removed in commit `ab8c143` (and redirected in `astro.config.mjs`).
- `delegation-risk/delegation-accounting.md` has a matching orphan: "### The Extreme Case: A Known Threat … This scenario pushes delegation accounting to its limits." The section has no content and links nowhere.
- `getting-started/reading-order.md` calls the Insurer's Dilemma "the pivot point of the whole framework" and says Delegation Accounting's "running example … escalates to an adversarial agent." That escalation is gone.
- **Fix:** Cut the Mr. X material (about 40% of the page) and the "Known Threat" stub. End insurers-dilemma at "NEW CATEGORY: ADVERSARIAL AGENT RISK" with a short non-fiction conclusion linking to AI Control and runtime accounting. Reword the reading-order blurbs.

### P0-8. The headline "~50× entanglement tax" rests on an unsourced ρ table (M)
- `index.mdx`, `getting-started/five-minute-intro.md`, `faq.md`, `common-mistakes.md`, and `for-engineers.md` all assert "At the correlations realistic for same-provider stacks (ρ ≈ 0.5) … ~50× … typically 10–100×."
- `delegation-risk/risk-propagation.md` cites "ρ ≈ 0.5–0.7 … see realistic correlation estimates". That points to `entanglements/detection/correlation-calculator.md` "Realistic Correlation Estimates", whose table ("Same provider, different models (e.g., GPT-4 vs GPT-3.5) 0.5 - 0.7") has **no source**. On the φ (failure-indicator) scale the site now mandates, 0.5–0.7 is very high.
- Empirical literature now exists and should anchor or replace these numbers (verify exact details): Goel et al. 2025, "Great Models Think Alike and this Undermines AI Oversight" (arXiv 2502.04313; CAPA error-similarity metric; finds error correlation rising with capability), and Kim et al. 2025, "Correlated Errors in Large Language Models" (ICML 2025; arXiv ~2506.07962). Neither is cited anywhere in scope.
- **Fix:** Cite them and convert their agreement statistics to φ, or downgrade "realistic" to "assumed." Show the tax at ρ = 0.1 / 0.2 / 0.5 so readers see how sensitive it is (at φ = 0.2 the tax is ~20×, not 50×).

### P0-9. The beta-factor math is passive-failure math, but it is applied to adversarial cases (M)
- `delegation-risk/risk-propagation.md` derives the mixture from random common-cause failure and estimates ρ on "the same labeled challenge set." Against an adaptive adversary (a scheming component, a prompt-injection attacker, a transferable jailbreak), inputs are *selected* to defeat all layers. Effective ρ on attack inputs approaches 1, whatever φ is on a benign challenge set.
- The pages that cite this math are about scheming and verification stacks: the faq "Isn't this just defense in depth?", for-engineers, and the homepage "safety layers in front of a risky action."
- `reference/related-approaches.md` claims the novelty over CCF is "active influence and adversarial coordination", yet the math page never handles those cases.
- **Fix:** Add an "Adversarial inputs" section to risk-propagation.md. Measure ρ under red-team/adaptive attack (Control-evaluation style). For adversarial channels, default to the minimum rule (ρ = 1) unless a control evaluation shows otherwise. Say plainly that 50× is the *benign-failure* tax.

### P0-10. Risk decomposition leaves out the dominant 2026 agent threat: third-party hijack / prompt injection (M)
- `delegation-risk/risk-decomposition.md`: "Every harm mode … falls into one of two categories: accident or defection." Prompt injection (a third party steering a non-scheming delegate) and user misuse fit neither category. The delegate is neither failing at its task nor pursuing its own goal.
- In 2025–26 this is *the* practical agent-security problem: Simon Willison's "lethal trifecta" (2025), Google DeepMind's CaMeL (Debenedetti et al. 2025, arXiv 2503.18813), and "Design Patterns for Securing LLM Agents against Prompt Injections" (Beurer-Kellner et al. 2025, arXiv 2506.08837). Verify IDs. These are also the closest prior art for the site's exposure envelope and decomposition patterns.
- 2025 reward hacking and specification gaming in coding agents (special-casing tests, editing graders) sits *between* accident and defection: goal-directed but not scheming. METR's June 2025 reward-hacking report, Baker et al. 2025 "Monitoring Reasoning Models for Misbehavior" (OpenAI), and the Claude 3.7 Sonnet system card all document it.
- `getting-started/faq.md` only mentions adversarial users as handled by "input validation … sanitized/validated", which is known not to work for LLM inputs.
- **Fix:** Make it three channels (accident / defection / hijack-misuse), or explicitly sub-type defection. Add a reward-hacking row. Rewrite the faq answer.

### P0-11. "Typical Risk Ratio" table and coordinator decomposition: invented numbers that make the argument circular (S)
- `delegation-risk/risk-decomposition.md`: "General LLMs ~80% Accident*, Agentic systems ~60%, RL-trained agents ~40%, Coordinators: Defection-dominated." These are made up (the footnote says "highly uncertain"). The coordinator example then *assigns* "Grants excessive permissions (strategic) 0.004 vs (error) 0.001" and concludes in a Key Insight that "coordinators are where defection risk concentrates."
- The page also reverse-engineers the overview's \$1,100 Code Deployer total from different harm modes ("subtly malicious 0.001 × \$20,000", "catastrophic breach (error/intentional)"). So the overview's verifier ("catches 99% of malicious") can no longer be applied consistently across the two pages.
- **Fix:** Delete the ratio table or replace it with qualitative ordering plus citations. Present the coordinator result as an assumption ("if you believe X, then…"). Use one harm-mode table shared by both pages.

### P0-12. Quick Reference formulas are wrong, mix units, or contradict the canon (S)
`getting-started/quick-reference.md`:
- "Pipeline Risk = 1 - Π(1 - Component_Risk_i)": Component_Risk is defined in dollars (expected harm), so this applies a probability formula to dollar amounts.
- "Entangled Risk = Pipeline_Risk × Entanglement_Tax": circular, since the tax is defined as actual/independent.
- "Mitigation effectiveness (serial layers): Residual = Base × Π(1 - Catch_Rate_i)": this is the uncorrected independence product the site's flagship argument says is wrong. It also calls defense layers "serial", while `risk-propagation.md` calls them "parallel."
- RACAP, "Authority = Power ∩ Permission" (intersection of a scalar and a set), and "Effective Capability = Power × Agency" (see P0-1).
- "Key Thresholds" (P(correct) < 0.8, Damage > \$10K, "> 3 failures/week") carry no illustrative label.
- **Fix:** Rebuild from the canonical rule with `(1−ρ)∏p + ρ·min p`, keep units straight, and label thresholds as examples.

### P0-13. The verifiability hierarchy is out of date and wrong for 2026 models (S–M)
- `getting-started/core-concepts.md#verifiability-hierarchy`, `glossary.md` (Verifiability Hierarchy, Least Generality: "... > general LLMs > RL"), and `runtime-accounting.md` (which leans on it for the "trusted preflight" rule) all rank "Base LLMs" above "RL systems — Rarely recommended for safety-critical paths."
- Every frontier model in deployment (reasoning models, coding agents) is RL-trained post-pretraining, and nobody deploys "Base LLMs" for "Creative tasks, complex reasoning". As written, the hierarchy says to avoid all current frontier models.
- **Fix:** Re-axis the hierarchy by *verifiability properties*: determinism, spec-ability, capability to scheme (Control's "trusted vs untrusted" threshold), and training-signal shape. Do not use 2022-era model categories.

### P0-14. Staleness: examples and integrations frozen in 2023 (M)
- `power-dynamics/agency-power-examples.md` is built around "GPT-4 (API)" (11 mentions) and a "**Hypothetical** autonomous agent." In late 2026, autonomous coding and computer-use agents are commercial products. Sentences like "No persistent goals across conversations" and "Resource acquisition: LOW (no agency to pursue)" are no longer accurate.
- `power-dynamics/strong-tools-hypothesis.md`: "AutoGPT, BabyAGI add persistent goals", a quadrant chart with "GPT-3 / Claude / GPT-4 agents?", and "RLHF may increase agency" (the live issue is now RL on verifiable rewards).
- `getting-started/for-engineers.md` integration table: "LangChain … OpenAI Functions … Anthropic Claude: Use system prompts for least-context … AutoGPT-style." System prompts are not a security boundary. Missing: MCP tool permissions, agent SDK hooks and permission modes, sandboxing in coding agents, egress allow-lists.
- `getting-started/faq.md` "What tools support this?": "Currently, implementing requires manual engineering … LangChain/LlamaIndex, Guardrails AI". Missing: Inspect / ControlArena (UK AISI / Redwood), Llama Guard / LlamaFirewall, CaMeL, agent permission systems. Also "Self-hosted models (Llama, Mistral)".
- `getting-started/index.md`: "A year ago, AI couldn't reliably write working code; now it often can." This is relative to an unstated date and is understated for 2026. Replace with a dated, cited claim, e.g. METR time-horizon doubling ~7 months (Kwa et al. 2025, arXiv 2503.14499).
- `delegation-risk/runtime-accounting.md` "Nothing on this page exists yet." Parts do exist: pre-tool-use hooks, permission/approval modes, spend caps, and trusted-monitor deployments. Position the page against what exists and say what is new (the ledger plus reconciliation).
- **Fix:** Do a dedicated currency pass, then a "last reviewed" date per page.

### P0-15. The Strong Tools Hypothesis ignores the evidence that has accumulated since (M)
- `strong-tools-hypothesis.md` calls the capability–agency frontier "an empirical question. We don't know the true shape." It treats Search and compilers as the "existence proofs."
- Since 2024 the market has moved decisively toward agents (Gwern's 2016 prediction, which the site cites elsewhere). RL training produced reward hacking and situationally aware behavior. Evaluation awareness has been documented in 2025 system cards and in OpenAI/Apollo anti-scheming work (verify). This page should engage with that, not present the question as untouched.
- The page also never engages the standard objection that any behavior fits *some* utility function (Shah 2019, "Coherence arguments do not entail goal-directed behavior"). That objection undercuts `AgencyScore = max_U Fit(U,B)`.
- It omits prior art on formal agency and goal-directedness: Kenton et al. 2022, "Discovering Agents" (DeepMind), and MacDermott et al. 2024, "Measuring Goal-Directedness" (NeurIPS 2024; verify).
- "Strategy 5: Constitutional Constraints" with `assert self.is_single_step(response)` is pseudo-code that hides the hard part. It also borrows "Constitutional", which is Anthropic's term for a *training* method (a violation of the TERMINOLOGY Rosetta rule).
- **Fix:** Rewrite as one short "Speculative" page. State the hypothesis, the 2024–26 evidence against it as a default trajectory, what remains (decomposed tool-like components *inside* agent systems), and the formal agency literature.

### P0-16. Public-facing artifacts contradict each other (S)
- `astro.config.mjs` `social`: "Download PDF" points to `releases/download/v1.0.0/delegation-risk-framework-book.pdf`. `index.mdx` says "The earlier v1.0.0 book … has been withdrawn." REVISION_PLAN Phase 6 also called for updating this link. It was not done.
- `reference/bibliography.md` "How to Cite": "AI Safety Framework: Structural Constraints for Safe AI Systems. https://[domain]/". Wrong title, placeholder URL, no author or date.
- `reference/about-this-site.md` claims real-history claims "were verified against primary sources." CREDIBILITY_HARDENING_PLAN Batch 0 shows the checks were mostly Wikipedia ("CONFIRMED: … (Wikipedia)"). It also gives "~100,000 words"; REVISION_PLAN says the corpus is ~319k.
- **Fix:** Remove or update the PDF link, write a real citation block (Gooen / QURI, title, year, URL), and correct the about-page claims.

---

## P1: significant quality problems

### P1-1. Phase 5 literature bridges never written (M–L)
- REVISION_PLAN Phase 5 called for `research/principal-agent-theory.md`, `research/deceptive-alignment-stress-test.md`, and making `related-approaches.md` "name principal-agent theory and deceptive alignment explicitly" (an acceptance criterion). None of these exist (checked `research/*/`).
- `reference/related-approaches.md` has no principal-agent section. `TERMINOLOGY.md` claims "agency cost (economics)" and "Holmström lineage" as the vocabulary's ancestry, but **neither Holmström (1979) nor Jensen & Meckling (1976) appears in `bibliography.md`.** Nor do Fleming 1974, NUREG/CR-4780, Knight & Leveson 1986, or Reason 1990, all of which TERMINOLOGY names as borrowed sources.
- **Fix:** Write a 1,500-word principal-agent page with a term-by-term map: DR ↔ agency cost, defection ↔ moral hazard / hidden action, verification ↔ monitoring (Holmström's informativeness principle), bond ↔ efficiency wage/bonding cost, insurer's dilemma ↔ Arrow 1963 / Shavell 1979 / Rothschild–Stiglitz 1976. Add these to the bibliography.

### P1-2. Phase 4 (calibration) undone; tools that don't exist are still listed (L)
- REVISION_PLAN calls Phase 4 "the highest-value phase." None of it is done: no `design-patterns/examples/code-deployment-calibrated.mdx`, no `estimates/correlation-priors.md`, and the incident-database seed is still a methods page.
- The Phase 4c instruction "Cut … Trust Updater, Sensitivity Dashboard, Architecture Comparator" was not followed. `experimental/probabilistic-estimation/tools/{trust-updater,sensitivity-dashboard,architecture-comparator}.mdx` still exist.
- The homepage still sells "the framework's path from vocabulary to method."
- **Fix:** Do 4b first. Use a *coding agent* (the 2026 flagship use case) with runtime accounting: Squiggle distributions, sensitivity analysis, and ρ priors anchored to P0-8's literature. Cut or banner the three tool pages.

### P1-3. `related-approaches.md` is out of date and contradicts the current thesis (M)
- It describes "This proposal" as "Architectural foundation that makes scheming harder + **forecasting-based navigation**". Under IDA: "This assumes forecasting + evaluation by AI itself is sufficient if you prevent scheming." This is the earlier "modular AI / honest coordination" proposal. It contradicts `runtime-accounting.md`'s rule that the model never preflights itself ("a frontier sibling of the actor, never").
- "Why This Might Actually Work: Three reasons" is followed by five reasons. "We only need this for ~5 years" ties the thesis to the 2025–2030 timeline.
- Missing comparisons: frontier safety frameworks (Anthropic RSP/ASL-3, OpenAI Preparedness, GDM FSF), EU AI Act GPAI Code of Practice, NIST AI RMF, **FAIR** (quantitative cyber risk in dollars, the obvious precedent for "Σ P × Damage in dollars"), safety cases, Guaranteed Safe AI (in the bibliography but not compared), CaMeL/agent-security patterns, and METR.
- The CAIS critique ("'train from scratch for each task'") mischaracterizes Drexler.
- **Fix:** Restructure as a positioning table with honest "what we add" columns. Delete the forecasting-navigation framing.

### P1-4. `reference/roadmap.md` is out of date (S)
- "2025-2027: AI reaches human-level capability in most cognitive domains". The Gantt runs 2025–2028, with "Prototype implementation :2025, 2026" and "Success Criterion: By 2028, demonstrate that modular architecture + **honest agency + forecasting**…". None of this matches the current thesis, and the 2025–26 milestones passed without being met.
- **Fix:** Delete it, or replace it with a dated "Status & next 12 months" section built from the undone plan phases.

### P1-5. Accident risk "decreases with capability" stated as fact (S)
- `risk-decomposition.md` ("Accident Risk: Generally ↓"), `glossary.md` ("Generally *decreases* with capability"), `reading-order.md` ("smarter systems have fewer accidents"), and `faq.md` ("Old/dumb models make more Type 1 errors but fewer Type 2 errors").
- Counter-evidence: inverse scaling, and higher-autonomy agents taking more consequential actions per error (damage per accident rises with power, as the site's own bridge says). The "fewer Type 2 errors" claim is Control's *trusted-model assumption*. It should be cited and framed as an assumption.
- **Fix:** Separate P(error per action) from Damage per error, and hedge with citations.

### P1-6. Least-X principles: five different lists (S)
- Canonical `design-patterns/least-x-principles.md` has 13 principles plus Maximum Verifiability, including **Least Intelligence** and no "Least Capability."
- `core-concepts.md` lists 6, starting with "**Least Capability**" (not on the canonical page). `five-minute-intro.md` lists 5 (includes Least Intelligence). `glossary.md` lists 11 (omits Least Scope and Least Latency Budget). `faq.md` mentions Least Intelligence.
- **Fix:** Pick a short canonical core set (≤6) plus a long tail, and use the same names everywhere.

### P1-7. Glossary entries that are technically wrong (S)
- `glossary.md` "**Least Surprise** — Temperature=0 for LLMs … Prevents covert signaling." Temperature 0 neither guarantees determinism in served LLMs nor prevents steganography (a deterministic policy can still encode signals). "Least surprise" is also POLA's name from UI design, a Rosetta-rule collision. `reference/roadmap.md` lists this as an open empirical question, which contradicts the glossary's flat assertion.
- "**Least Observability** — Components can't observe … whether they're being tested." Unenforceable, and contradicted by 2025 evaluation-awareness findings.
- "**Delegation Risk** — Measured in dollars per time period." `core-concepts.md`'s check-writing example and `walkthrough.md` are per-delegation. Pick one convention.
- "**Coordinator** — Highest-risk component type" is asserted without support.
- "Quick Reference: Typical Values" gives "Component Delegation Risk < \$100/mo = Low risk", invented thresholds presented as "typical."

### P1-8. Delegation accounting: invented "complexity score" passed off as method; the premium math contradicts itself (M)
- `delegation-accounting.md`: complexity points (+2 per layer, +3 informal…) map to "Uncertainty Multiplier ±20% … ±640%+". Both are invented with no derivation, yet they drive the dialogue's premiums.
- Carol: "At complexity 5 … confidence interval of \$1,750 to \$8,250 … Your premium would be around **\$8,000/year—covering the upper bound of my confidence interval plus margin**." \$8,000 is below the \$8,250 upper bound.
- Insurance pricing is mischaracterized. Insurers price expected loss plus a loading tied to variance and capital, diversified across a pool; they do not price to the CI upper bound. The real phenomenon here, ambiguity premiums, has a literature (Hogarth & Kunreuther 1989; Kunreuther, Meszaros & Hogarth 1993) that is not cited.
- Terminology drift: the "Alice's Two Exposures" table lists expected values (\$30, \$5,030) as "exposure", violating the canon (exposure = worst case). "Same key … 125× difference in total exposure" has the same problem.
- Office-premium baselines don't line up: \$500 gem-only, \$3,000 full office, "Dumb Bob (baseline) \$600", "Smart Bob \$5,000."
- The AI implication ("A capable AI … could offer … financial bonds … make misuse structurally irrational") assumes a rational agent with known utilities. That is exactly what a schemer lacks, and a *volunteered* constraint from a schemer is weak evidence. Needs a caveat or should be cut.
- **Fix:** Halve the page. Keep the balance sheet, the office-key capability point, and Ouroboros (conflict of interest → uninsurable is good). Replace complexity scores with "parameter uncertainty → ambiguity loading", cite it, and fix terminology and numbers.

### P1-9. Insurer's Dilemma: fiction format, invented parameters, no economics citations (M)
- All retention percentages ("Full transparency 10–20%", "No monitoring 70–80%"), "Coverage Possible" bands, and the Trust Ladder are invented, with no illustrative banner.
- No citation of the canonical results the page re-derives: Arrow 1963, Pauly 1968, Shavell 1979 (moral hazard and partial coverage), Holmström 1979, Rothschild–Stiglitz 1976 (the adverse-selection "death spiral").
- Missing the 2025–26 real-world tie-in: an AI-agent insurance market now exists (e.g., AIUC and its AIUC-1 standard, Armilla/Lloyd's-backed agent liability cover, Munich Re aiSure; verify specifics). This is direct evidence for the site's thesis that insurers will price delegation risk.
- The insurer is "Diana" here, "Carol" in delegation-accounting, and Carol is the *overseer* in the walkthrough.
- **Fix:** Rewrite as ~1,200 words of non-fiction with citations and a section on the AI-insurance market. Consider removing the Core badge.

### P1-10. `common-mistakes.md` and `for-engineers.md`: inverted claim plus template listicle (S–M)
- Both say: "If the development team sets the risk budget but users bear the harm … Team will systematically **underestimate** acceptable risk." When others bear the harm, the team will *over*-accept risk (overestimate acceptable risk, or underestimate risk). The wording is inverted.
- Eight mistakes in an identical "What It Looks Like / Why It Happens / The Problem / How to Avoid" template are mostly generic (cargo-culting, set-and-forget). Only Mistake 2 (independence) and Mistake 6 are framework-specific.
- `for-engineers.md`: "about 15 minutes total" to read Quick Reference + Quick Start + implement the Minimal Viable Framework, but core-concepts' checklist for that framework spans "1 day … 1 week … 2 weeks."
- **Fix:** Fix the inversion. Cut common-mistakes to the three framework-specific mistakes and fold them into for-engineers.

### P1-11. FAQ answers contradict the site's flagship thesis (S)
- `faq.md` "What about emergent behavior?": "**Independent implementations**: Different components, different failure modes." This is the exact independence assumption the entanglement tax says is false.
- "How does risk inheritance handle cycles? … **Damping factor**: Each hop reduces trust (like PageRank)" revives the "discounted" rule that `risk-propagation.md` retired as double-counting.
- "A component that doesn't know it's constrained, can't remember previous invocations…" assumes no situational awareness. Hedge and cite.
- "How do you know this actually works? … Analogous domains: Nuclear, finance … demonstrated success." Finance risk budgeting (VaR) failed visibly in 2008. Hedge.
- "Conservative defaults: P=0.1 for LLM outputs, P=0.01 for code": P of what, per what?
- "Security theater" table claims "Testable predictions" but no prediction is stated anywhere in scope.
- **Fix:** Correct each answer. Add one falsifiable prediction (e.g., "measured φ between same-provider LLM monitors on [benchmark] > 0.3").

### P1-12. Core-concepts contradicts Entanglements on collusion and skipping (S)
- `core-concepts.md` tables: decomposed systems have "Coordination risk: Components can't easily collude." `Which Sections Can I Skip?` says "Entanglements — Skip if your system has < 3 components."
- Same-model instances colluding via Schelling points is a central Control concern (untrusted-monitoring collusion). Two correlated components are enough to pay the tax. Meanwhile the homepage calls Entanglements "the site's most distinctive contribution."
- "Arrow's impossibility theorem has implications for trust aggregation: no perfect rule exists." Arrow concerns ordinal preference aggregation, not combining probabilities. Cut it.

### P1-13. Defense-in-depth chain in related-approaches overclaims (S)
- "If all fail → Worst case limited by component scope and privilege", "Rate Limiting … Prevents fast takeoff scenarios", and "Many points of failure before catastrophe" all assume independence across these layers. That contradicts the entanglement thesis.

### P1-14. Getting-started is still five overlapping intros (M)
- `index.mdx`, `getting-started/index.md`, `five-minute-intro.md`, and `core-concepts.md` each restate the problem, the AI motivation, the Least-X list, decomposition, and the takeaways. `delegation-risk/overview.md` "Why Delegation Risk Matters" is a sixth copy.
- The homepage and getting-started/index share whole sentences ("Every delegation involves risk. When you delegate a task—to an employee…", "None of these claims are certain. But if even some hold…").
- CREDIBILITY_HARDENING_PLAN "Deferred: Intro-stack collapse (5 competing intros → 1) … High value." GETTING_STARTED_REVAMP reduced titles, not redundancy.
- **Fix:** Use homepage → five-minute-intro → Core Path. Merge getting-started/index into the homepage. Turn core-concepts into a reference "Concepts" page without its own optimization problem or takeaways.

### P1-15. Reading paths are still spread across pages (S)
- `getting-started/index.md` (5-row table), `reading-order.md` (13 stops + 5 "Paths by Goal" + a time table), `reference/site-map.md` ("Reading Paths by Audience": 5 more paths, citing "Introduction", "Trust Optimization", "Roadmap"), `core-concepts.md` ("Which Sections Can I Skip?"), `for-engineers.md`, and `examples-catalog.md` ("Examples by Skill Level").
- The GETTING_STARTED_REVAMP goal was "one path-chooser." It holds only within getting-started.
- **Fix:** Delete the site-map reading paths and skill-level lists, and link to the Core Path.

### P1-16. `reference/site-map.md` is out of date (S)
- The Mermaid diagram still has `INTRO[Introduction]` (deleted, now redirected). It shows research/theory trust-* pages under a "Delegation Risk" subgraph, includes "Forecasting Navigation" and "Carbon Budgets", and the diagram omits runtime-accounting and risk-propagation.
- **Fix:** Regenerate from the sidebar, or delete the diagram and keep the table.

### P1-17. `delegation-risk/index.md` is missing two of its pages (S)
- The "Pages" table lists 6 pages. It omits **Risk Propagation** and **Runtime Risk Accounting**, which are the two strongest pages in the section.
- "This section formalizes the **negative side** of the optimization problem" depends on the broken power-dynamics framing (P0-1).

### P1-18. `overview.md` "Key Topics" points readers to the trust-* suite flagged for deletion (S)
- It links 10 `research/theory/trust-*` pages ("Risk Optimization", "Delegation Protocols", "Delegation at Scale"…). CREDIBILITY_HARDENING_PLAN Deferred: "trust-accounting, trust-at-scale, trust-protocols, trust-optimization flagged deletable." Both the walkthrough's and the overview's "What's Next?" route readers there.
- **Fix:** Cut the links, and decide on the trust-* merge.

### P1-19. Expected value alone, with nothing on tails, while advertising catastrophic-risk relevance (M)
- The framework is `Σ P × D` throughout. `overview.md` "Further Reading" lists Expected Shortfall and coherent risk measures, yet neither is ever used in scope. `quick-reference.md` "Catastrophic potential: \$0-100 annual budget … Existential concern" expresses existential risk as an expected-dollar budget.
- An expected-loss budget treats 1e-6 × \$1B the same as 1 × \$1,000. `runtime-accounting.md` acknowledges this (the "envelope" exists because "the worst failures are concentrated in single actions"), but the core pages never do.
- **Fix:** Add a "When expected loss is the wrong metric" section to core-concepts (risk aversion, ES, hard caps, the envelope) and drop the existential-in-dollars row.

### P1-20. Verifier and Least-X advice in the minimal framework is generic security boilerplate (S)
- `core-concepts.md` "Minimal Viable Framework": least privilege, human escalation (>\$1000), output filtering, sandboxing, audit logging, plus "Phase 1 (1 day) / Phase 2 (1 week)". Repeated in `for-engineers.md` and `quick-reference.md`. None of it uses the framework's distinctive content (ρ budget, preflight, ledger).
- **Fix:** Replace with "the minimal *delegation-engineering* layer": (1) write the harm surface; (2) a hard envelope; (3) a correlation budget, i.e. no two checks on the same model family; (4) a ledger with monthly reconciliation. Keep the security list as a one-line pointer.

### P1-21. Agency formalization: ill-defined formulas (S–M)
- `agent-power-formalization.md`: `Fit_MDL = -(|U| + |B|U|)/|B_raw|` is garbled (it means L(B|U)). `Fit_temporal = 1 − Var_t[U*_t]` takes a variance of utility functions without defining it. `PowerTrajectory = P·e^{λt}` is assumed. `PlanningHorizon = argmax_T Corr(a_t, r_{t+T})` is ill-posed for non-scalar actions.
- `agency-power-examples.md` fit percentages ("U₁ = 'be helpful' — fits ~70%") and λ contribution tables ("Self-improvement +0.5 to +2.0") are invented.
- Turner et al. (2021, NeurIPS) defines POWER formally. The site's PowerScore is a loose paraphrase without the IID-reward-distribution assumptions.
- **Fix:** Cite and use Turner's definition directly, keep at most two agency proxies, and drop the invented tables (or banner them as toy numbers).

### P1-22. `walkthrough.md` assumes gaming away: "Everyone benefits from lower delegation risk" (S)
- Part 4 makes Bob's risk score visible and rewards him for lowering it. That is a textbook Goodhart setup: Bob gains by under-reporting incidents or delays, and the score uses self-reported "transparency" updates. In AI terms, this is the defection channel.
- **Fix:** Add a short "Goodhart" box linking runtime-accounting rule 2 ("Ledger inputs come from the scaffold's own observation, never from agent self-report").

### P1-23. Inconsistent and possibly wrong citation dates/attributions in scope (S)
- AI Control is "(2024)" in bibliography.md and getting-started/index.md, "Greenblatt et al. 2023" in runtime-accounting.md, and "Redwood Research, 2024" in related-approaches.md. Pick arXiv 2023 / ICML 2024 and use it consistently.
- Shlegeris & Greenblatt, "The case for ensuring that powerful AIs are controlled", is dated "May 2024" in related-approaches.md. I believe it was published January 2024. **Verify.**
- bibliography.md "Palin, R., & Goff, L. (2010). *ASIL Decomposition: The Good, the Bad and the Ugly*. SAE." I believe the authors are Palin, Ward, Habli & Rivett, published 2011. "Goff, L." looks hallucinated. **Verify.**
- bibliography.md lists "Myerson (1981) Optimal Auction Design" under "Revelation Principle". The revelation principle is usually credited to Myerson 1979 (Econometrica), Dasgupta–Hammond–Maskin 1979, and Gibbard 1973.
- CAIS links (`fhi.ox.ac.uk/reframing/`, `.../Reframing_Superintelligence.pdf`) appear in glossary, strong-tools, related-approaches, and bibliography. FHI closed in April 2024, so the links are likely dead. Use the arXiv or Drexler-hosted copy. **Check.**
- glossary/TERMINOLOGY "Microsoft 2024: ~2% of granted cloud permissions are actually used" has no link. Add the report title (*State of Multicloud Security Risk*) and URL. **Verify the figure.**

### P1-24. `reference/potential-examples.md`: internal notes published as reference (S)
- 4,158 words of brainstorm tables ("Already covered—trust without verification capacity", "Prioritized Recommendations: Tier 1…", "Suggested Next Documents"), with unsupported side claims ("Credit Unions … lower fraud rates than banks").
- **Fix:** Move it to the repo as a planning doc, or delete it.

### P1-25. TERMINOLOGY canon not applied in scope (S)
- "Rejected" or rule-bound terms still appear: RACAP (P0-2); trust as an undefined math symbol (P0-6); "exposure" used for expected values (delegation-accounting, walkthrough "Delegate Risk Score"/"exposure budget"). The canon asks for "risk budget" when expected loss is meant.
- "Considered and rejected — capability escrow" fine; "control tax" not found in scope (good).
- **Fix:** Run a grep-driven sweep with the canon as checklist.

### P1-26. Five-minute intro mini-example refers to verifiers it doesn't contain (S)
- `five-minute-intro.md` "Slack bot" table: Retriever / Answerer / Poster, then "If those verifiers share a provider, apply the correction above." The table has no verifiers. "Fine-tuned 7B" is also dated.
- **Fix:** Add two checking layers on the same model family, then apply the canonical tax visibly. This is where the five-minute intro should show the site's one distinctive number.

### P1-27. Unsupported scope claims on the homepage and getting-started (S)
- `index.mdx` "Who This Is For: … Policy makers looking for concrete technical approaches". No page in scope addresses policy.
- `getting-started/index.md`: "This is how nuclear plants budget failure probabilities, how secure systems limit blast radius, and the logic behind constitutional separation of powers." It merges three different mechanisms into one claim.
- `about-this-site.md` "Strengths: Consistent terminology across ~100,000 words" is contradicted by P0-2, P1-6, and P1-25.

---

## P2: polish

1. **LLM house style.** 12 TL;DR boxes, 14 "Key Insight" boxes, 4 "Key Takeaways", and 1,321 bold-bearing lines in scope. Headings like "The Uncomfortable Truth" (`risk-decomposition.md`) and closing notes like "Without principled risk management, we're flying blind" (`overview.md`). Remove TL;DRs on pages under 1,500 words, cap "Key Insight" boxes at one per page, and cut bold by about 80%. (M)
2. **Tables for their own sake.** `risk-decomposition.md` "When to Use Each Term" (a table on which word to use), `core-concepts.md` CEO "Organizational Analogy", and `faq.md` "Doesn't this severely limit…" 3-row table. Convert to prose or delete. (S)
3. **Dialogue vignettes** in delegation-accounting and insurers-dilemma (Carol, Diana, Ouroboros, Xavier) cost about 4k words for maybe 600 words of content. Keep one short vignette per page at most. (M)
4. `delegation-risk/risk-propagation.md` "how systems with 'five 90% layers' fail": a leftover five-layer example. The canonical example is three layers (CHP 5a). (S)
5. Sidebar order: `delegation-risk/index.md` has `order: 2`, the same as `walkthrough.md`. The page title "Risk Formalization" doesn't match the sidebar group "Delegation Risk", and `power-dynamics/index.md` is titled "Capability Formalization" under group "Power Dynamics". Align names. (S)
6. `reference/index.md` is a 52-word stub whose only "Related" link is "Delegation Accounting — Core framework". Replace with a real index or drop it. (S)
7. `getting-started/examples-catalog.md` lists the archived `organizational-trust` page (whose archive note points back to the Examples Catalog, a loop). It describes "Capability Drift" as a "Failure" and the Code Review Bot as a "Success", but both are illustrative. Tag them as illustrative. (S)
8. `walkthrough.md` mixes \$/delivery, \$/day budgets, and "\$·hours". Add a units line at the top. (S)
9. `exposure-cascade.md` is all human-corporate. Add a 3-line AI mapping (orchestrator → subagents → tool calls). (S)
10. `power-dynamics/agent-power-formalization.md` quadrant chart caption ("Points below and to the right are achievable") doesn't match the chart's quadrant labels. Simplify or remove. (S)
11. `strong-tools-hypothesis.md` "Strong Tool = High Power + Low Agency" is pseudo-equation styling. Use prose. (S)
12. `getting-started/glossary.md` Mathematical Notation lists δ (discount factor) and λ (decay). Those belong to retired rules; prune. (S)
13. `reference/bibliography.md` "Online Courses" (Stanford CS224N, MIT 22.033) and "Tools & Libraries" (LangChain, Guardrails) are padding. Delete. (S)
14. `index.mdx` has two "Case Studies" blocks: one in the Explore grid, one as a section. Merge. (S)
15. `faq.md` "Why trust old/dumb models…" uses informal "dumb". Use "trusted (less capable) models" per the Control vocabulary in TERMINOLOGY. (S)

---

## What the planning docs left undone or waived (summary)

| Plan item | Status | Evidence |
|---|---|---|
| REVISION_PLAN Phase 4 (calibrated example, correlation priors, incident seed, cut vaporware tools) | **Not done** | No `*-calibrated.mdx`; no `correlation-priors.md`; 3 cut-listed tool pages still exist |
| Phase 5 principal-agent page, deceptive-alignment stress test, related-approaches naming both | **Not done** | No files; related-approaches has no P-A section; Holmström not in bibliography |
| Phase 6 v2 PDF, update `v1.0.0` links | **Not done** | `astro.config.mjs` social link still v1.0.0 |
| Acceptance: "one propagation rule used everywhere" | **Partly** | `faq.md` damping factor; `quick-reference.md` uncorrected product |
| Acceptance: corpus ≤240k words | Unverified / likely not met | Plan status says 319k |
| CHP Deferred: intro-stack collapse | **Partly** (titles only) | See P1-14 |
| CHP Deferred: power-dynamics equation reconciliation | **Not done** | P0-1 |
| CHP Deferred: research/theory trust-* cuts | **Not done** | 10 trust-* pages still linked from overview |
| TERMINOLOGY rejections (RACAP; undefined trust) | **Not applied** | P0-2, P0-6 |
| REVISION_PLAN waivers for Ozzie | Open | minimal-framework funnel not restored; examples.md Example 1 non-canonical correlation; trust-across-civilizations cuts |
| Anomaly Chronicles removal | Done, but **left orphans** | P0-7 |
| Model-tier tables in the plans (Fable 5 / Opus 4.8 / Sonnet 4.6 pricing) | Process notes only | Fine in internal docs; don't publish |

---

## Cut / merge candidates

- **Merge** `getting-started/index.md` into `index.mdx`. Keep `five-minute-intro.md` as the only intro. Demote `core-concepts.md` to a reference "Concepts" page with no takeaways and no optimization problem.
- **Merge** `common-mistakes.md` into `for-engineers.md` (keep 3 framework-specific mistakes plus the reading mistakes).
- **Merge** `delegation-risk/overview.md` and `delegation-risk/index.md`. The section index can be the overview with a page table.
- **Merge** `risk-decomposition.md`'s worked example into the overview's example, so one harm table is shared.
- **Cut ~50%** of `delegation-accounting.md` (complexity scores, office-premium tables, Xavier vignette). **Cut ~40%** of `insurers-dilemma.md` (Mr. X onward). Consider removing the Core badge from both.
- **Collapse** `power-dynamics/` (4 pages, ~7.7k words) into one "Speculative: agency, power, and strong tools" page of ~1,500 words. Delete `agency-power-examples.md`.
- **Delete** `reference/roadmap.md`, `reference/potential-examples.md` (move to repo notes), and the reading-path and diagram sections of `reference/site-map.md`. Make `reference/index.md` real or drop it.
- **Delete** the "Typical Values" table in `glossary.md`, the "Key Thresholds" and "Risk Budget Rules of Thumb" tables in `quick-reference.md`, and the bibliography padding.

---

## Top 5 recommendations

1. **Fix the math before anything else (P0-1–6, P0-12).** Remove `Capability = Power × Agency`, `DR = Capability × Misalignment`, and RACAP from every page. Fix ledger "consolidation" (expected losses add, so the naive sum is conservative) and the cascade's "multiplicative / 67% reduction" claims. Repair the arithmetic in the walkthrough, accounting, and overview. Define or delete "trust weights."
2. **Support or soften the flagship number (P0-8, P0-9).** Replace the unsourced ρ table with conversions from the 2025 correlated-error literature (Goel et al.; Kim et al.). Show sensitivity across ρ. Add an adversarial-inputs section: the beta-factor tax is the *benign* case, and under adaptive attack you should assume ρ→1 unless a control evaluation shows otherwise.
3. **Bring it up to 2026 (P0-10, P0-13–15, P1-3, P1-4).** Add hijack/prompt injection as a third harm channel and reward hacking as a sub-type. Position runtime accounting against CaMeL, agent-security design patterns, the lethal trifecta, harness hooks and permission modes, and Control work from 2025–26. Replace the GPT-4/AutoGPT/LangChain examples and the RL-at-the-bottom hierarchy. Rewrite strong-tools in light of the agentic turn. Delete the roadmap. Add the AI-insurance market to insurers-dilemma.
4. **Finish the plan items that matter (P1-1, P1-2, P0-7, P0-16).** Write the principal-agent page and add Holmström, Jensen–Meckling, Arrow/Shavell, and the ambiguity-premium literature. Build one calibrated, Squiggle-based example for a coding agent with a ledger. Remove the Mr. X / "Known Threat" orphans. Fix the v1 PDF link and the "How to Cite" placeholder.
5. **Shrink and de-template (P1-14, P1-15, cut list, P2-1–3).** Reach a three-step funnel (homepage → five-minute intro → Core Path) and one path-chooser. Collapse power-dynamics to one speculative page. Halve the accounting and insurer vignettes. Remove the uniform TL;DR / Key Insight / listicle templates and the invented "typical" tables. Lead with the two pages that are actually strong: risk-propagation and runtime-accounting.
