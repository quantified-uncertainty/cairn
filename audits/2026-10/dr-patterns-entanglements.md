# Audit: delegation-risk `design-patterns/` (29 pages) + `entanglements/` (26 pages)

Auditor pass, 2026-10-15. Scope root: `apps/delegation-risk/src/content/docs/`. All paths below are relative to it unless absolute.
Coverage: every page read in full except long CSS/JS blocks in `tools/*.mdx` (prose and formulas read) and the second half of `entanglements/mitigation/red-team-methodology.md` / `audit-guide.md` (skimmed by headings, thresholds, and numbers). Math checked by hand wherever a number is derived.

---

## Overall verdict: 4 / 10

**Why not lower.** The entanglement core is real and useful: the beta-factor / common-cause mixture `P(all fail) = (1-ρ)∏pᵢ + ρ·min pᵢ`, the "floor that no number of layers can push below" point, effective-redundancy tables, and the honest lineage section crediting Knight & Leveson (1986), Fleming's beta factor and Reason's Swiss cheese (`entanglements/fundamentals/formal-definitions.md`, `entanglements/research/research-connections.md`, `entanglements/detection/correlation-calculator.md`). I re-derived these numbers and they are correct. Someone has already patched parts of the site toward the canon (the trust-propagation "one rule, not a menu" note, the illustrative-data banners, AI Control citations in 5 pattern pages). `channel-integrity.md` engages with the real collusion literature (Shlegeris 2024; Gardner-Challis et al. 2026, which I verified is real).

**Why not higher.**
1. **The "45 patterns" catalog is mostly a Gang-of-Four-style rename of standard security, SRE and governance practice.** Examples include need-to-know, Brewer-Nash, air gap, bulkhead, circuit breaker, canary tokens, honeypots, checkpoint/rollback, rate limiting and separation of duties. Each gets a uniform Intent/Motivation/Structure/Consequences template, invented parameters, and almost no AI-specific insight. Several "patterns" are duplicates (Bulkhead vs. Blast Radius, Random Audit vs. Panopticon, Capability Sunset vs. Data Shelf Life vs. Trust Decay), and `safety-mechanisms.md` restates a third of the catalog again.
2. **There are hard math and logic errors in load-bearing places.** Examples: risk "super-additivity" from correlation (wrong for expected loss), `P(fail)×(1+ρ)/2` for a same-model redundant verifier, a "proper-scoring" reputation stake that rewards underconfidence, cost-benefit break-even tables that contradict their own formula, and a "worse than useless" human-oversight example whose numbers show it is better.
3. **Invented numbers are presented as data, and some are laundered.** `cost-benefit.md` cites "preliminary experiments" that `empirical-tests.md` labels invented, and the two pages contradict each other on API cost. Correlation-by-provider tables have no source. Transfer-rate tables are attributed to papers that do not contain them.
4. **Several citations are misattributed or hallucinated,** concentrated in `ai-debate-entanglement.md` and `adversarial-transferability.md`. For example, Irving & Askell (2019) is cited as a QuALITY debate experiment; it is the Distill essay "AI Safety Needs Social Scientists."
5. **The content reads as 2024.** GPT-4/GPT-3.5/"Claude" as the reference models (≈100 mentions), CNN/RNN "architecture diversity," and the 2023 US Executive Order (revoked January 2025). It covers none of the following: MCP/tool-use, agent harnesses, computer use, CoT monitoring, evaluation awareness, alignment faking or in-context scheming evidence, the EU GPAI systemic-risk regime, or DORA.
6. **The terminology canon is not applied.** None of the 7 canon terms (harm surface, exposure envelope, exposure ledger, privilege overhang, load-bearing channels, correlation budget, risk preflight) appear anywhere in these 55 pages. "Trust" is used as an undefined math symbol throughout, which TERMINOLOGY explicitly rejects. `entanglements/detection/modeling.md` defines Delegation Risk as a *probability*, contradicting the canon (expected dollars).
7. **The prose has strong LLM smell:** templated sections, bold-everything, "Key insight:" boxes, emoji tables, Game of Thrones analogies (twice), "Sleep at night: Priceless", and an `entanglements/index.md` that is mostly a 25-item TOC duplicating the sidebar.

Net: the entanglement *idea* is worth a strong 6–8-page section. The design-patterns section should shrink by roughly 60% into a smaller set of AI-specific patterns, each with a real mechanism, a cited source, and an honest "this is standard practice X; the AI-specific twist is Y" note.

---

## P0: credibility-damaging or wrong

### P0-1. Expected-loss risk is not "super-additive" under correlation; the covariance formula is malformed
`design-patterns/channel-integrity.md` (§"Independence and Subadditivity", §"Side-Channels Create Super-Additivity", §"Risk Budget Allocation Under Correlation")
> "For **independent** components, risk is subadditive… **R_total ≤ R_A + R_B**" / "When side-channels exist… Risk becomes **super-additive**: **R_total > R_A + R_B**" / "**R_total = Σ R_i + Σ Cov(R_i, R_j) × channel_strength_ij**" / "Independent case (Euler allocation applies)"

**Problems:**
- Delegation risk is an expectation, Σ P×D, and expectations are additive regardless of correlation.
- Correlation changes the *joint* failure probability of parallel defences (an AND of misses) and tail measures such as VaR. It does not change the sum of expected losses.
- Subadditivity is an axiom of coherent risk *measures*, not a consequence of independence.
- Euler allocation is about decomposing a homogeneous risk measure; it has nothing to do with independence.
- The covariance-times-"channel strength" term double-counts and has no units.

**Fix:** Rewrite the section around the canonical joint-miss formula: correlation raises P(all layers miss), not Σ expected losses. If tail measures are wanted, say "variance/VaR of total loss" and use Var(ΣL) = ΣVar + 2ΣCov. **Effort: S**

### P0-2. Wrong formula for a redundant same-model verifier
`design-patterns/channel-integrity.md`, "Practical Implications" table:
> "Add redundant verifier (same model) | P(fail) → P(fail) × (1 + ρ)/2"

At ρ=0 this gives p/2 instead of p², which is wrong. The correct form, consistent with the canon for two layers, is `p·(p + ρ(1−p))`. The same page's own correlation table uses the correct form. **Fix:** Replace the formula. Also rename "Correlation Tax" to "entanglement tax" here and in `entanglements/detection/modeling.md`, because two names for the same quantity is a canon violation. **Effort: S**

### P0-3. Reputation-staking scheme is not incentive-compatible, yet is called "Brier-style"
`design-patterns/multi-agent.md`, Reputation Staking:
> "Correct | Stake returned + bonus (higher bonus for lower stated confidence)" / "+2.25 bonus (15 × 15%)" / "Overconfidence penalty: Uses Brier-style scoring"

With bonus = s(1−c) and a penalty increasing in c, expected payoff is strictly decreasing in stated confidence c. An agent therefore always reports the minimum allowed (50%). That is the opposite of calibration.

**Fix:** Use an actual proper scoring rule (log or quadratic score on stated c), or delete the numeric mechanism. More fundamentally, see P0-9. **Effort: S**

### P0-4. Cost-benefit page contradicts itself and launders invented numbers
`design-patterns/tools/cost-benefit.md` vs. `design-patterns/tools/empirical-tests.md`.

**Laundering.** cost-benefit says:
> "Based on [preliminary experiments](/design-patterns/tools/empirical-tests/): Median latency 2.3s → 4.1s"

and its summary table reads "Risk reduction | 70-80% (attack success rate)". But empirical-tests says:
> "The tables below are **invented-for-illustration**"

**Direct contradiction.** cost-benefit says decomposed API cost is $15 vs $120 per 1K calls (decomposed is "cheaper", saving 82%). empirical-tests says "API cost per task | $0.12 | $0.18 | 1.5x" (decomposed is *more* expensive).

**Arithmetic errors in "Break-Even by Use Case".** With the page's own $2,000/mo maintenance overhead and ~$15K upfront:
- Internal tool: savings $190/mo → never breaks even (table says "5-8 months").
- Customer-facing: net $3,100/mo → ~4.8 months (table says "2-3").
- Autonomous agent: net $900/mo → ~17 months (table says "3-4").

The "Key Finding" ("positive ROI within 6 months for >10K tasks/month") is contradicted by the autonomous-agent row.

**Staleness.** Pricing assumes GPT-4 at $120/1K calls vs. a fine-tuned 7B; 2026 pricing makes the whole cost argument obsolete.

**Fix:** Delete the numeric case, or turn it into a fill-in worksheet with formulas only. Remove the "Based on preliminary experiments" link. **Effort: M**

### P0-5. Misattributed or hallucinated debate citations
`entanglements/research/ai-debate-entanglement.md`:
- **"Irving & Askell (2019)**: Human debates on QuALITY reading comprehension… 60% → 70%". Irving & Askell 2019 is "AI Safety Needs Social Scientists" (Distill), a position piece. QuALITY dates from 2021 (Pang et al.). The QuALITY debate experiments are Parrish et al. 2022 and Michael et al. 2023. The 60→70% figure appears invented.
- **"Barnes et al. (2020)**: Under certain conditions, debate converges to truth-telling". Barnes's 2020 work is the *obfuscated arguments problem*, a negative result. Convergence/complexity results are in Irving et al. 2018 and Brown-Cohen, Irving & Piliouras 2023 ("Scalable AI Safety via Doubly-Efficient Debate").
- **"Khan et al. (2024)** | Debate limitations and failure modes". Khan et al. 2024 (ICML best paper) is "Debating with More Persuasive LLMs Leads to More Truthful Answers", a *positive* result.
- **Michael et al. (2023)**: The page says improvement "plateaus and doesn't reach ground truth; 'sneaky' debaters performed well". The paper's headline is that debate beats consultancy (~84% vs ~74%). Re-check against the paper.
- **Missing:** Kenton et al. 2024 (weak LLM judges / strong debaters), Brown-Cohen et al. prover–estimator debate (2025), and UK AISI's debate agenda.

**Fix:** Rewrite the "Research Results" section from the primary sources. **Effort: M**

### P0-6. Adversarial-transferability page maps 2016-era image-classifier numbers onto LLM verifiers, with unsourced tables attributed to real papers
`entanglements/research/adversarial-transferability.md`:
- Specific transfer-rate tables are attributed to Papernot 2016 ("DNN → Logistic Regression 25-50%") and Liu 2016 ("1 model 40-50%, 5 models 70-80%"). Demontis 2019 is quoted as "Input gradient similarity: ρ = 0.7 correlation with transfer rate… Training data overlap ρ = 0.4". None of these appear verifiable as stated, and they look generated.
- "~25-dimensional subspace… (in ImageNet-scale models)": Tramèr 2017's ~25-dim estimate is from MNIST experiments, not ImageNet. Verify.
- "Salman et al. 2020 Adversarially Robust Transfer" is about robust models transferring better *in transfer learning*, not adversarial-example transfer. It is misused.
- The conclusion "GPT-4 vs Claude… Expected transfer rate: 40-60% (based on cross-architecture studies)" extrapolates pixel-perturbation CNN results to text LLMs. "Rule-based 5-15%" and "Human expert 10-30%" have no source.
- The defences listed (JPEG compression, spatial smoothing) are irrelevant to LLM verification.

**Fix:** Rebuild on the LLM literature: Zou et al. 2023 (GCG universal transferable jailbreaks), jailbreak and prompt-injection transfer studies, Goel et al. 2025 "Great Models Think Alike and this Undermines AI Oversight" (ICML 2025, CAPA metric; errors become *more* correlated with capability; LLM judges favour similar models), Kim et al. 2025 "Correlated Errors in Large Language Models", and Panickssery et al. 2024 (self-preference in LLM evaluators). Keep 1 paragraph of vision history. **Effort: M**

### P0-7. NUREG/CR-4780 misattributed
`entanglements/research/research-connections.md`:
> "**NUREG/CR-4780** (Wreathall & Fragola, 1987) is the NRC's procedures guide…"

NUREG/CR-4780 is Mosleh, Fleming, Parry, Paula, Worledge & Rasmuson, *Procedures for Treating Common Cause Failures in Safety and Reliability Studies*, Vol. 1 1988 / Vol. 2 1989 (also EPRI NP-5613). This matters because the page presents itself as "the closest prior art"; it is the credibility anchor of the entanglement section. Also: FDT is Yudkowsky & Soares 2017, not "Soares & Fallenstein (2017)". **Effort: S**

### P0-8. Healthcare example claims the wrong FDA pathway
`design-patterns/examples/healthcare-bot-example.md`, "FDA Considerations":
> "This architecture is designed for the 'non-device' pathway: System provides information, not diagnosis…"

The 21st Century Cures Act non-device CDS criteria (§520(o)(1)(E); FDA 2022 CDS guidance) require the software to be intended for *healthcare professionals*, who can independently review the basis. A *patient-facing* triage bot recommending ER vs. self-care generally does not qualify.

Related problems on the same page: a $1M valuation for wrongful death (US VSL ≈ $13M) and $200/month residual under-triage risk at any realistic patient volume.

**Fix:** State that patient-facing triage is likely SaMD and requires FDA review, cite the guidance, and add volume to the risk math. **Effort: S**

### P0-9. Incentive patterns assume LLM agents respond to bonds, reputation points and insurance premiums
`design-patterns/incentive.md` (Bonding & Slashing, Bounty, Insurance) and `design-patterns/multi-agent.md` (Vouching Network, Reputation Staking).
> "Agent posts bond: 1000 reputation points" / "Agents can contest slashing decisions through an appeals process" / "Require agents to hold insurance"

A deployed model does not experience or optimize "reputation points" unless they are in its training signal or prompt. These mechanisms bind the *operators, vendors or deployers* (the principal hierarchy), not the model. As written, this is anthropomorphic mechanism design that a LessWrong reader will dismiss on sight. The same section omits the real 2025–26 developments: the AI insurance market (e.g. AIUC and its AIUC-1 standard, Munich Re aiSure, Armilla) and vendor liability.

**Fix:**
- Reframe the section as "incentives on the humans and firms in the delegation chain," with model-level incentives only via training.
- Drop or relabel the invented premium table ("Code execution $100K | 0.5%").

**Effort: M**

### P0-10. "Worse than useless" human-oversight example: the arithmetic shows it is better
`entanglements/cross-domain/psychology-of-oversight.md`:
> "AI alone: 90% accurate… Human catches 30%… introduces 2% new errors. Net: ~9% error rate—slightly worse than AI alone… Entanglement tax: ~9×"

9% is *lower* than 10%, so the example disproves its own headline. "Entanglement tax ~9×" (9% / 1% perceived) misuses the tax, which is defined for correlated layers. Unsourced statistics on the same page: "Users fail to notice automation errors 60-70%" (cite Skitka et al. 1999 / Parasuraman & Manzey 2010 properly), "~50% anchoring weight", "drop 10-20% per hour", and "7±2" (stale; Cowan 2001 ≈ 4±1).

**Fix:** Rebuild the example so the commission-error rate actually exceeds the catch rate, or drop the headline. Cite each statistic or delete it. **Effort: S**

### P0-11. Delegation Risk redefined as a probability; "trust" used as an undefined quantity across many pages
- `entanglements/detection/modeling.md`: "Define **Delegation Risk (DR)** as the probability that delegated actions cause unacceptable outcomes." This contradicts TERMINOLOGY (DR = Σ P(harm mode) × Damage, in dollars).
- Quantitative "trust" appears in `design-patterns/principles-to-practice.md` ("Trust(Human → Hypothesis Generator) = 0.95 × 0.90 × 0.85"), `design-patterns/tools/quick-start.md` ("Trust(A→C via B) = Trust(A→B) × Trust(B→C)"), `design-patterns/temporal.md` (Trust Decay formulas, trust → permission thresholds), `design-patterns/multi-agent.md` (Trust Transitivity), `design-patterns/tools/tradeoff-frontier.mdx` (y-axis "Trust %") and `design-patterns/tools/trust-propagation.mdx`.

TERMINOLOGY: "trust (as an undefined math symbol)… where used quantitatively it must be defined as P(faithful execution)."

**Fix:** Sweep all of these pages. Define trust as P(faithful execution) once and link to it, or replace "trust" with exposure/delegation-risk language. **Effort: M**

### P0-12. Stale and wrong regulatory content
`entanglements/cross-domain/regulatory-approaches.md`:
- **US.** "US Executive Order on AI (2023)" is presented as current; EO 14110 was revoked in January 2025.
- **EU.** "EU AI Act doesn't explicitly address provider concentration" — the GPAI-with-systemic-risk regime (Art. 51 ff., applicable August 2025, plus the GPAI Code of Practice) is close to the page's own "Option 5: Systemic Importance Designation", and the page doesn't mention it. DORA (applicable January 2025) already oversees *critical ICT third-party providers*, which is exactly the concentration-limit idea. The UK critical third parties regime and California SB 53 (2025) are also missing.
- **Basel.** "Treaty | Basel Accords… High (precedent exists)": the Basel Accords are not treaties (non-binding BCBS standards).
- **Aviation.** "FAA regulations require… Different design teams… Diverse software implementations" overstates the case. Dissimilarity is guidance and design practice (DO-178C / ARP4754A, Airbus practice), not an FAA mandate. Boeing 777 notably used a single source language.
- **SR 11-7** is a Federal Reserve letter, not OCC (OCC Bulletin 2011-12).

**Fix:** Full currency rewrite. **Effort: M**

### P0-13. Index tables claim pattern usage and case studies that don't exist
- `design-patterns/index.md`, "By Worked Example" table: the trading example is listed as using "Graceful Degradation, Blast Radius Containment, Bulkhead Isolation", the healthcare example "Escalation Ladder, Need-to-Know, Cooling Off Period", and so on. **None of the 45 pattern names appear in any of the 4 example pages** (I grepped all 12 names listed).
- `design-patterns/index.md` says Historical Cases cover "Enron, rating agencies, Boeing, Madoff, TMI", but `entanglements/case-studies/historical-cases.md` has only the first three.
- `entanglements/index.md` promises "Iraq WMD, 9/11, Bay of Pigs" for `intelligence-failures.md`, which has Iraq and Yom Kippur only.
- `design-patterns/index.md` says "8 mitigations"; solutions has nine.

**Fix:** Correct the tables. Better, make the examples actually name the patterns they use. **Effort: S**

---

## P1: significant quality problems

### P1-1. Pattern catalog is taxonomy-for-its-own-sake, with duplicates
- Bulkhead Isolation (`design-patterns/structural.md`) vs. Blast Radius Containment (`design-patterns/recovery.md`): the Blast Radius diagram is literally labelled "BULKHEAD BOUNDARY". Merge.
- Random Audit (`design-patterns/verification.md`: "This is the Panopticon effect") vs. Panopticon Effect (`design-patterns/monitoring.md`). Merge.
- Capability Sunset (`design-patterns/temporal.md`), Data Shelf Life (`design-patterns/information.md`) and Trust Decay (`temporal.md`) are all TTL-plus-renewal on a grant. Merge into one "Expiring grants" pattern.
- Capability Airlock vs. Gateway Chokepoint (the page admits "Airlocks are specialized chokepoints"). Merge.
- Self-Healing Loop and Fallback Component Chain are generic SRE practice with no AI-safety content; cut or reduce to a link.
- "Novel Patterns" in `design-patterns/index.md` lists Dead Man's Switch, Cooling Off Period and Capability Sunset; none is novel. Delete the "you might not find elsewhere" claim.
- Related-pattern lists reference non-existent patterns: "Circuit Breaker", "Constitutional Constraints" (`structural.md`), "Information Asymmetry Exploitation" (`verification.md`), "Incident Response Automation" (`recovery.md` TL;DR). Monitoring's TL;DR lists Capability Probing, which lives in Verification.

**Fix:** Cut to roughly 15–20 patterns. For each, add a "Prior art" line (e.g. "= Brewer-Nash 1989", "= bulkheads, Nygard *Release It!*") and a "What is different for LLM agents" paragraph. **Effort: L**

### P1-2. Uniform template with invented parameters on almost every pattern
Examples:
- Promotion criteria table (`structural.md`: "1→2 | 1,000 tasks | 30 days | 2% | 10% | 0.90").
- Permission attenuation "level 0 gets 1/1 of base, level 1 gets 1/2".
- Data Shelf Life "Customer PII 4 hours" with *contradictory* renewal rules on the same page: "Maximum 3 renewals" vs. the table's "Customer PII | 1 renewal" (`information.md`).
- Trust Decay: the diagram shows linear decay to a 25% floor while the text says "minimum floor (default 10%)" (`temporal.md`).
- Rate-limit suspicion increments "+0.2/+0.3".
- Panopticon "~100ms" padding.
- Behavioral fingerprint "Deviation > 30%".
- Coordinator "70-80% of their total risk" is defection (`coordinator-constraints.md`), with no source.

**Fix:** Delete numbers that carry no information, or mark them as placeholders. Keep only numbers derived from a stated model. **Effort: M**

### P1-3. Several claims about LLM mechanics are wrong or outdated
- **Determinism and steganography.** `design-patterns/least-x-principles.md` (Least Surprise) says "Use temperature=0… Deterministic outputs eliminate this attack vector." A deterministic policy can still encode information in *which* output it deterministically chooses as a function of its input; steganography does not need sampling noise. Temperature 0 is also not deterministic on most hosted APIs (batching nondeterminism), and many reasoning models fix or disallow the temperature setting. The examples propagate this: "All LLMs run at temperature=0".
- **Time pressure.** "Least Latency Budget" claims "Time pressure forces simpler, more honest behavior". This is unsupported and in tension with the CoT-monitorability literature (Korbak et al. 2025): restricting visible reasoning may push cognition into less monitorable forward passes.
- **Generality ladder.** Least Generality places "RL systems" as a separate, most-dangerous tier above "General foundation models (Base GPT-4, Claude)". Frontier models are now RL-trained agents, so the ladder collapses. Also, Claude is not a "base" model.
- **Coordinator diversity.** `coordinator-constraints.md` and `safety-mechanisms.md` recommend "Different model architectures (transformer, CNN, etc.)", "Bug in transformer architecture doesn't affect CNN" and "7B, 13B, 70B".
- **Old model as coordinator.** `decomposed-coordination.md` and `research-assistant-example.md` use GPT-3.5 as the Strategy module because it is "less capable = less risky". This inverts how AI Control uses trusted models: the weak trusted model *monitors*; it does not do the most consequential planning. The caveat box in coordinator-constraints only half-fixes this.

**Effort: M**

### P1-4. Byzantine and N-version guarantees asserted without the independence assumption they need
- `design-patterns/safety-mechanisms.md`: "Provides quantifiable safety: 'safe unless >1/3 of coordinators compromised'".
- `design-patterns/tools/decision-guide.md`: "4-of-5 | Tolerates 1 Byzantine + 1 crash". The hybrid bound is n ≥ 3f+2c+1 = 6, so 5 is insufficient. Verify and fix.
- The same page has "Formal verification ~10x safer than base LLM" next to multipliers of 0.1× vs 2.0×, which is 20×.

BFT bounds assume independent faults. The entanglement section's whole point is that same-family models are not independent. This is the most important cross-section inconsistency on the site: the pattern pages promise what the entanglement pages refute.

**Fix:** Add explicit cross-links. Restate BFT as "f *independent* faults; with common-cause ρ, see entanglement tax." **Effort: S**

### P1-5. Inconsistent ρ guidance and thresholds across pages
| Claim | Page |
|---|---|
| "If you can't prove independence, assume ρ ≥ 0.3 for … same provider/training" | `design-patterns/channel-integrity.md` |
| "layers share a provider… assume ρ ≥ 0.5"; "ρ > 0.5: redesign required" | `entanglements/fundamentals/types.md` |
| Same provider/different models 0.5–0.7; different providers 0.3–0.6 | `entanglements/detection/correlation-calculator.md` |
| Same provider ρ ≈ 0.7–0.9; same paradigm 0.4–0.6 | `entanglements/mitigation/audit-guide.md` |
| 0.6–0.8 "Urgent: redesign required" | `entanglements/detection/modeling.md` |
| Frame sensitivity ">15% high" vs. quick-ref ">10%"; preference alignment ">0.3" vs. ">0.15" | within `entanglements/detection/metrics.md` itself |

None of the ρ-by-configuration estimates has a source.

**Fix:**
- Put one sourced table in `formal-definitions.md` and reference it everywhere else.
- Seed it with Goel et al. 2025 (CAPA) and Kim et al. 2025 error-agreement data, explicitly converted to the phi scale.
- Mark everything else as a prior. Pick one threshold set.

**Effort: M**

### P1-6. Code computes Jaccard where the canon requires phi
- `entanglements/mitigation/solutions.md`: `CorrelationCircuitBreaker._calculate_correlation` returns `joint_failures / any_failures`, which is Jaccard.
- `entanglements/mitigation/red-team-methodology.md`: "Compute: |F_A ∩ F_V1| / |F_A ∪ F_V1| (Jaccard similarity)… Flag pairs with correlation > 0.3".

`types.md` explicitly warns that Jaccard "will overstate the tax if substituted". `modeling.md` has the correct phi code; reuse it. **Effort: S**

### P1-7. Directional "influence" measured with a correlational statistic
`entanglements/fundamentals/types.md`:
> "Influence(A→B) = P(B fails | A fails) - P(B fails | A succeeds) … If Influence(A→B) >> Influence(B→A), the relationship is asymmetric"

This is an association measure. It cannot establish direction, and the page's own detection page says "This requires causal reasoning, not just correlation." **Fix:** Replace with the interventional definition, E[B | do(A=a)] − E[B | do(A=a′)], via the counterfactual protocol in `detecting-influence.md`. **Effort: S**

### P1-8. Massive redundancy across the entanglement section (merge clusters)
- **Cluster A, measurement:** `detection/metrics.md`, `detection/modeling.md` and `detection/correlation-calculator.md` all explain failure correlation, the tax and thresholds, and the same matrix appears twice in `modeling.md` with *different values* (Firewall–Ghost 0.4 vs 0.5; Firewall–Tripwire 0.2 vs 0.1). Merge into a single "Measuring entanglement" page.
- **Cluster B, procedures:** `mitigation/audit-guide.md`, `mitigation/red-team-methodology.md` and half of `detection/detecting-influence.md`. The frame-sensitivity test, capture indicators, timing-MI test and master-key search each appear 3–4 times. Merge into one audit/red-team protocol page, with `detecting-influence.md` keeping the conceptual methods.
- **Cluster C, taxonomy:** `fundamentals/types.md` and `fundamentals/challenges.md` (9 categories that re-slice the same 3 types). The bureaucrat analogy is told in full three times (`index.md`, `types.md`, `challenges.md`). Merge.
- **Cluster D, mitigation:** `mitigation/solutions.md` §9 duplicates `cross-domain/software-dependency-patterns.md`. `mitigation/decision-framework.md` should become a section of solutions. Solutions also has a full "Summary checklist" stranded between §7 and §8, a sign of bolted-on sections.
- **Cluster E, human institutions:** `case-studies/historical-cases.md`, `case-studies/intelligence-failures.md`, `cross-domain/organizational-isolation.md`, `cross-domain/legibility-and-control.md` and `cross-domain/psychology-of-oversight.md` → one or two pages: "Lessons from human oversight institutions" plus "Human overseers as a correlated layer".
- **Cross-section:** `design-patterns/channel-integrity.md` duplicates `entanglements/detection/detecting-influence.md`, with the same TDT section, the same Littlefinger / Game of Thrones material, the same timing-MI thresholds and the same Shlegeris list. Make channel integrity the "patterns" view and have it link to detection.

**Effort: L**

### P1-9. Redundancy inside design-patterns (merge clusters)
- `safety-mechanisms.md` re-covers circuit breakers, fingerprinting, rollback, expiring permissions, time locks, rate limiting, N-version and BFT, all of which exist as catalog patterns. Cut it, keeping the "scheming coordinator vs. layered defences" sequence diagram, which is good, in coordinator-constraints.
- `decomposed-coordination.md` and `coordinator-constraints.md` overlap heavily (old models, redundancy, voting, narrow I/O). Merge. The sidebar label "Architecture Overview" doesn't match the title "Honest Agency Through Decomposed Coordination".
- `least-x-principles.md` presents the same 6-level hierarchy twice ("Least Generality" table and "Maximum Verifiability" list). The TL;DR lists 7 principles, the table 10, and the page body 13.
- `principles-to-practice.md` is a cross-reference table of the two examples; fold it into `composing-patterns.md`.

**Effort: M**

### P1-10. Unsupported "logic is sound" claims about decomposition preventing scheming
`design-patterns/decomposed-coordination.md`:
> "This needs empirical validation, but the logic is sound: **strategic deception requires persistent context and coordination**"

Similar claims appear in `forecasting-navigation.md` ("Coordinators can't cause catastrophic failures through scheming") and `research-assistant-example.md` ("Distributed coordination prevents scheming").

Evidence since 2024 shows in-context scheming and alignment faking *within a single episode*: Apollo Research (Meinke et al., Dec 2024, "Frontier Models are Capable of In-context Scheming") and Greenblatt et al. 2024 ("Alignment faking in large language models"), alongside reward hacking in frontier coding agents. The persistence premise is contested and needs engaging, not asserting. **Effort: M**

### P1-11. `forecasting-navigation.md` is out of place and overclaims
> "Recent evidence (Anthropic's forecasting work, various LLM forecasting benchmarks) suggests frontier models can achieve near-superforecaster calibration"

There is no specific citation, and "Anthropic's forecasting work" is vague or dubious. ForecastBench (Karger et al. 2024/25) showed LLMs below superforecasters; Halawi et al. 2024 approached the crowd, not superforecasters. The 60/30/10 "1000 scenarios" example is fabricated-looking, and the "Compositional Safety" properties are asserted as guarantees.

**Fix:** Move to an experimental/research-agenda page with real citations, or cut. `empirical-tests.md` repeats "LLMs are approaching superforecaster-level". **Effort: S**

### P1-12. Currency: no 2025–26 agent-stack content
Grep for MCP, "computer use", "reasoning model", CoT monitoring, evaluation awareness, alignment faking and reward hacking across the 55 pages: zero substantive hits ("sandbagging" appears twice). Missing material that directly instantiates these patterns:
- MCP and tool-permission scoping as Least Privilege / Gateway Chokepoint.
- Agent sandboxes (container/VM, network egress allowlists) as Airlock.
- Approval modes in coding agents as Escalation Ladder.
- Prompt injection via tool outputs as the dominant "active entanglement" channel.
- Subagent orchestration as coordinator constraints.
- OpenTelemetry GenAI traces as Flight Recorder.
- CoT monitoring (Baker et al. 2025; Korbak et al. 2025) as Ghost Checker / Monitoring.
- Evaluation awareness (models detecting tests), which directly undermines Honeypot, Panopticon and "Least Observability: can't tell test vs prod".
- Ctrl-Z resampling is cited once; Factor(T,U) is mentioned without a citation in `empirical-tests.md`.

**Fix:** Add a "2026 agent stack" mapping page or a section per pattern page. **Effort: L**

### P1-13. `foundation-model-monoculture.md` is 2024-framed and has an unsupported trend claim
> "Foundation Model Providers (2024)… When everyone uses GPT-4" / "This is getting worse, not better. Concentration is increasing as leading models pull ahead."

The 2025–26 landscape has many frontier labs plus competitive open-weight models (DeepSeek, Qwen, Kimi, Llama, Mistral), so the concentration trend needs data. The page cites none of the monoculture literature: Kleinberg & Raghavan 2021 (PNAS), Bommasani et al. 2021 (homogenization) and 2022 (outcome homogenization), Goel et al. 2025. The "architecture diversity score" uses "Transformer + RNN"; SSM/hybrid models are the 2025 example. **Effort: M**

### P1-14. `impossibility-results.md` misapplies Gödel/Rice and invents "formal results"
- "An AI system cannot fully verify its own safety… per Gödel". Rice's theorem concerns arbitrary programs; a fixed finite network on bounded inputs is decidable, if intractable.
- "Formal result: No mechanism can guarantee non-collusion between rational agents in repeated settings without either…" has no citation and appears invented.
- "Capture Is Convergent… Impossibility" overclaims.
- "Adversarial Transferability Floor… typically 20-40% minimum" is unsourced.
- "Heisenberg for AI" is a label, not a result.
- The page ignores the key counterpoint that weak verifiers *can* check strong provers (interactive proofs; this is the basis of debate) and omits ELK.

**Fix:** Cut to roughly 1/3 length: computational limits, scalable-oversight gap, and the observer/evaluation-awareness problem with real citations. **Effort: M**

### P1-15. Historical and intelligence case studies contain factual overreach
- `entanglements/case-studies/intelligence-failures.md`: "All 16 intelligence agencies shared the same priors". State/INR and DOE dissented on the aluminium tubes and the nuclear judgment (2002 NIE). The "Entanglement tax: 5-10×" figure is invented. "Consensus confidence often inversely correlates with accuracy" is an unsupported generalization.
- `historical-cases.md`: the capture timeline years ("Professional (1985-1995)…") are invented.
- "Easier for AI: Current AI may not deliberately deceive" is stale given 2024–25 evidence.

**Effort: S**

### P1-16. Debate page's game theory is muddled
`entanglements/research/ai-debate-entanglement.md` says "Zero-sum game: debaters can't collude (one must lose)" and also "Folk theorem implication: Even in zero-sum games… debaters… develop strategies that benefit both". In strictly zero-sum repeated games the folk theorem yields nothing beyond the minimax value. Real collusion risk comes from debaters *not* being zero-sum in what they actually optimize (same weights, same developer, shared training signal). Say that. **Effort: S**

### P1-17. Python pseudocode inconsistent with the prose
- `research-assistant-example.md` CircuitBreaker auto-transitions OPEN → HALF_OPEN after a timeout, while `safety-mechanisms.md` says "Manual reset required after trip".
- Its `RuleBasedChecker` regex `r"(hack|exploit|attack)\s+"` would reject the Red Team component's own outputs, is trivially evaded, and is labelled "Formally verifiable".
- `detecting-influence.md`'s honeypot check uses `"approved" in output.lower()`, which also matches "not approved".
- `trading-system-example.md` describes `cvxpy` as a "verified convex solver" and says "convex (unique solution)"; convexity alone does not give uniqueness.

**Fix:** Either make the code correct or replace it with prose/pseudocode. **Effort: S**

### P1-18. Contradictions between design-pattern pages
- `examples/code-deployment-example.md`: "LLMs… shouldn't have veto power". `coordinator-constraints.md` Easy Veto: "Any single checker can veto".
- `examples/code-deployment-example.md`: "Autonomy level | Medium (can run experiments)" for the research assistant, which elsewhere has "no lab access".
- `tools/tradeoff-frontier.mdx`: "Points below this line exceed your risk budget" and, three lines later, "Any configuration above the budget line exceeds acceptable risk". Only the first is right given its formula, `trust = 100 − DR/(cap·50)`, which uses an arbitrary factor and undefined axes.
- `tools/trust-propagation.mdx` Example 3 is labelled "Using weakest link rule (both must pass)" but computes the OR/parallel formula.
- `principles-to-practice.md`: "Both examples target ~$2,000/month total Delegation Risk", but the research-assistant example contains no budget numbers.

**Effort: S**

### P1-19. Units ambiguity in every Delegation Risk worksheet
`tools/quick-start.md`, `tools/delegation-risk-calculator.mdx` and `tools/decision-guide.md` give "P = 0.1: Happens regularly" yet produce "$/month". It is never stated whether P is per task, per month or per deployment. The Slack-bot example ("Answerer hallucinates: P=0.1, D=$500 → $50/month") is meaningless without volume.

**Fix:** Add a volume × per-action probability column (and canon exposure vs. delegation-risk language). The calculator also still uses the legacy `ete` identifiers. **Effort: S**

### P1-20. Fiction as evidence
`design-patterns/channel-integrity.md` ("Littlefinger (Game of Thrones)… 'Chaos is a ladder'") and `entanglements/detection/detecting-influence.md` (Red Wedding, Littlefinger) use fiction as case material. This reads unserious to the target audience. **Fix:** Replace with real cases (Curveball is already present; add cartel price-fixing via signalling, e.g. airline tariff-publishing signals, US v. ATPCO 1994). **Effort: S**

---

## P2: polish

1. **LLM-prose smell everywhere.**
   - Bold-everything; "Key insight:" tips on most pages.
   - Emoji traffic lights in tables (`mitigation/decision-framework.md`), "Sleep at night | Priceless" (same page), and "Ignores all honeypots | Normal behavior | Good sign" (`verification.md`).
   - Uniform Benefits/Costs/Risks triplets of 3–4 generic bullets on all 45 patterns.
   - Repeated "Human institutions have centuries of experience" opener (≥3 pages).

   Fix with a style pass. **Effort: M**
2. **`entanglements/index.md`** is about 60% a hand-maintained TOC of 25 sub-pages, already stale (counts, promised cases). Replace it with a 5-line "start here" path. **Effort: S**
3. **`entanglements/cross-domain/hidden-coordination.md`** is a hidden 71-word redirect stub, but `channel-integrity.md` ("For detailed methods, see Hidden Coordination") and `organizational-isolation.md` still link to it. Repoint the links and delete the stub. **Effort: S**
4. **Missing frontmatter `description`** on least-x-principles, coordinator-constraints, decomposed-coordination, safety-mechanisms, principles-to-practice, empirical-tests, quick-start, decision-guide and cost-benefit. **Effort: S**
5. **AI Control citation rule** (TERMINOLOGY: cite arXiv:2312.06942 at first use per page) is unmet on `decomposed-coordination.md` ("Trusted monitoring") and `entanglements/detection/detecting-influence.md` (untrusted-monitoring techniques). **Effort: S**
6. **Dead or legacy links.** `https://www.fhi.ox.ac.uk/reframing/` (FHI closed April 2024) in `least-x-principles.md` and `decomposed-coordination.md`; use the arXiv / Drexler site version. **Effort: S**
7. **"AI Safety Framework"** naming in `tools/quick-start.md` ("applying the AI Safety Framework") and "Trust Ledger" (canon term: exposure ledger, with reconciliation). Old "pattern interconnection" phrasing remains in `entanglements/mitigation/solutions.md` and the `case-studies/examples.md` description. **Effort: S**
8. **`entanglements/case-studies/examples.md`** is described as "real architectures" but is hypothetical with invented numbers. It needs the same "Illustrative example" banner as the design-pattern examples. It also averages ρ (0.13) despite the calculator page advising max-pairwise for asymmetric structures. **Effort: S**
9. **Correlation-calculator "Rules of thumb"** #1 ("tax is linear in ρ, and the first step is the worst") is self-contradictory; increments are equal in absolute terms. #2 ("n-th correlated layer adds only (1-ρ) × effectiveness of first layer") is vague and not derived. **Effort: S**
10. **Excess Mermaid.** Many diagrams are boxes-with-bullets better rendered as lists (e.g. Air Gap, Separation of Powers, Capability Sunset timelines). Trim roughly half. **Effort: M**
11. **Air Gap use-case table** (`information.md`): "Model training | Physical | Prevent data poisoning" is the wrong threat; poisoning enters through the data, not the network. **Effort: S**
12. **Monitoring "Behavioral Fingerprint – Agent: claude-prod-001"** with vocabulary markers "I'll / Let me / Here's" reads as a parody. Use model-agnostic, observable features (tool-call distribution, trace shape). **Effort: S**
13. **Dead Man's Switch** lists "CAPTCHA or proof of human" as check-in verification; current models solve CAPTCHAs. "Defeats 'slow takeover' scenarios" overclaims. **Effort: S**
14. **Selective Amnesia's memory-scrubbing protocol** (`information.md`: zeroize, swap) targets host memory, but the real LLM issue is context, KV/prompt caches, provider logs, and memory/RAG stores. **Effort: S**

---

## Per-page triage

| Page | Verdict | One-line reason |
|---|---|---|
| design-patterns/index.md | rewrite | False "patterns in practice" tables; "novel" claims; reduce to a curated short catalog |
| design-patterns/composing-patterns.md | rewrite (absorb principles-to-practice) | Useful framing; stale GPT-4/Claude example; ignores correlation in the "each layer is a fallback" logic |
| design-patterns/principles-to-practice.md | merge → composing-patterns | Cross-reference table only; undefined "Trust" math |
| design-patterns/decomposed-coordination.md | merge → coordinator-constraints | Overlaps; GPT-3.5 strategist; "logic is sound" overclaim |
| design-patterns/coordinator-constraints.md | rewrite | Some genuinely useful constraints; CNN/7B/GPT-3.5 staleness; unsourced "70–80%"; contradicts Easy Veto vs. examples |
| design-patterns/safety-mechanisms.md | cut (salvage sequence diagram) | Restates ~12 catalog patterns; BFT without independence caveat |
| design-patterns/forecasting-navigation.md | cut (or move to experimental) | Off-topic research agenda; unsupported forecasting claims |
| design-patterns/least-x-principles.md | rewrite | Good spine; wrong temp=0 claim; duplicated hierarchy; stale generality ladder |
| design-patterns/structural.md | rewrite | Core patterns OK but generic; invented promotion tables; merge Airlock/Gateway |
| design-patterns/verification.md | rewrite | Honeypot/probing need evaluation-awareness caveat; Random Audit → merge with Panopticon; resample mischaracterization |
| design-patterns/information.md | rewrite (shrink) | Standard security renamed; contradictory renewal rules; scrubbing irrelevant to LLMs |
| design-patterns/temporal.md | rewrite | Merge Sunset/Shelf-Life/Decay; undefined trust math; inconsistent floor |
| design-patterns/monitoring.md | rewrite | TL;DR wrong; add CoT monitoring and traces; anthropomorphic timing analysis |
| design-patterns/multi-agent.md | rewrite | Broken staking rule; debate lit uncited; anthropomorphic reputation |
| design-patterns/incentive.md | rewrite | Re-target to operators/vendors; add real AI insurance market |
| design-patterns/recovery.md | rewrite | Merge Blast Radius into Bulkhead; cut Self-Healing; irreversible side effects missing |
| design-patterns/channel-integrity.md | rewrite | Best conceptual page; fix P0 math; dedupe vs. detecting-influence; drop GoT |
| design-patterns/examples/code-deployment-example.md | keep (fix) | Clean, sensible; fix veto contradiction and units |
| design-patterns/examples/healthcare-bot-example.md | rewrite | Wrong FDA pathway; implausible risk math |
| design-patterns/examples/research-assistant-example.md | rewrite | GPT-3.5 strategist; buggy code; trim code by ~70% |
| design-patterns/examples/trading-system-example.md | cut (replace with agentic coding/MCP example) | Traditional quant with "no LLM"; doesn't illustrate the framework |
| design-patterns/tools/cost-benefit.md | rewrite (as worksheet) | Self-contradictory, laundered invented numbers |
| design-patterns/tools/decision-guide.md | keep (fix) | Useful trees; fix BFT row and multiplier claim |
| design-patterns/tools/delegation-risk-calculator.mdx | keep (fix) | Add volume/units; rename ete identifiers |
| design-patterns/tools/empirical-tests.md | rewrite | Recast as a pre-registered research agenda; cite Factor(T,U), Ctrl-Z |
| design-patterns/tools/interactive-delegation-graph.mdx | keep | Fine |
| design-patterns/tools/quick-start.md | keep (fix) | Units, canon terms, undefined trust |
| design-patterns/tools/tradeoff-frontier.mdx | cut | Undefined axes, arbitrary formula, self-contradictory budget-line text |
| design-patterns/tools/trust-propagation.mdx | keep (fix) | Already canon-patched; fix Example 3 label; drop harmonic option |
| entanglements/index.md | rewrite | Replace 25-item TOC with short path; fix promised content |
| entanglements/fundamentals/types.md | keep (fix) | Solid; fix Influence metric; ρ guidance |
| entanglements/fundamentals/challenges.md | merge → types | Re-slices the same taxonomy; stale model names |
| entanglements/fundamentals/formal-definitions.md | keep | Correct, canonical; add sourced ρ table here |
| entanglements/detection/correlation-calculator.md | keep (fix) | Correct tables; unsourced ρ-by-config estimates; rules-of-thumb errors |
| entanglements/detection/detecting-influence.md | rewrite | Good protocols; dedupe with channel-integrity/audit; drop GoT |
| entanglements/detection/metrics.md | merge → measurement page | Internally inconsistent thresholds |
| entanglements/detection/modeling.md | merge → measurement page | DR defined as probability; duplicate matrices disagree |
| entanglements/mitigation/solutions.md | rewrite | Strong floor/lever content; Jaccard code; bolted-on sections |
| entanglements/mitigation/decision-framework.md | merge → solutions | Thin, invented costs, emoji matrix |
| entanglements/mitigation/red-team-methodology.md | merge → audit-guide | Duplicates audit and detection; Jaccard |
| entanglements/mitigation/audit-guide.md | rewrite (absorb red team) | Useful procedure; inconsistent thresholds |
| entanglements/research/adversarial-transferability.md | rewrite | Unsourced tables; CNN-to-LLM extrapolation; misused citations |
| entanglements/research/ai-debate-entanglement.md | rewrite | Hallucinated/misattributed citations |
| entanglements/research/impossibility-results.md | rewrite (cut ~2/3) | Gödel misuse; invented "formal results" |
| entanglements/research/research-connections.md | keep (fix) | Best-cited page; fix NUREG and FDT attribution; add 2024–26 AI lit |
| entanglements/case-studies/examples.md | keep (fix) | Good worked math; add illustrative banner; max-ρ consistency |
| entanglements/case-studies/foundation-model-monoculture.md | rewrite | 2024 framing; unsupported trend; no monoculture lit |
| entanglements/case-studies/historical-cases.md | merge (with intelligence-failures) | Reasonable but thin; invented timeline |
| entanglements/case-studies/intelligence-failures.md | merge → historical-cases | Factual overreach; missing promised cases |
| entanglements/cross-domain/hidden-coordination.md | cut | Redirect stub; fix inbound links |
| entanglements/cross-domain/legibility-and-control.md | merge → organizational-isolation | Thin but valuable counterweight |
| entanglements/cross-domain/organizational-isolation.md | keep (absorb legibility) | Fine, short |
| entanglements/cross-domain/psychology-of-oversight.md | rewrite | Math error; uncited statistics |
| entanglements/cross-domain/regulatory-approaches.md | rewrite | Revoked EO, missing EU GPAI/DORA, factual errors |
| entanglements/cross-domain/software-dependency-patterns.md | merge → solutions | Duplicates solutions §9; generic |

**Tally (55 pages):** keep 12 (incl. "keep (fix)") · rewrite 27 · merge 11 · cut 5.

**Finding counts:** P0 = 13, P1 = 20, P2 = 14.

---

## Top 5 recommendations

1. **Fix the P0 math and citation errors first** (P0-1/2/3/4/5/6/7/10). They are cheap, mostly 1–2 hours each, and they are exactly what a rigorous reader will spot and use to discount the whole site. Add a "verified against primary source" checklist for every citation in `ai-debate-entanglement.md`, `adversarial-transferability.md` and `research-connections.md`.
2. **Collapse the 45-pattern catalog to about 15–20 AI-specific patterns.** Each gets an explicit "Prior art: X" line, a "What's different for LLM agents in 2026" section (MCP/tool scoping, sandboxes, approval modes, subagents, CoT monitoring, evaluation awareness, prompt injection via tool outputs), and no invented parameters. Delete `safety-mechanisms.md`, `forecasting-navigation.md` and `tradeoff-frontier.mdx`, and merge the duplicate patterns.
3. **Reconcile the patterns section with the entanglements section.** Every redundancy pattern (Voting Tribunal, N-version, BFT, Rotating Validator, Adversarial Collaboration, Composing Patterns) must state its independence assumption and link to the entanglement tax. Unify ρ guidance into one sourced table (seed it with Goel et al. 2025 CAPA and Kim et al. 2025) and one threshold set.
4. **Run the terminology canon sweep these pages missed.**
   - Replace quantitative "trust" with P(faithful execution) or exposure/delegation-risk language.
   - Fix "DR = probability" and "Correlation Tax".
   - Introduce harm surface → exposure → delegation risk, exposure envelope, exposure ledger and correlation budget where they naturally belong (Airlock/Gateway → envelope; quick-start "Trust Ledger" → exposure ledger; solutions → correlation budget).
   - Add volume/units to every DR worksheet.
5. **Consolidate the entanglements section from 26 pages to about 12:** index, types (+challenges), formal definitions, measurement (calculator+metrics+modeling), detecting influence, audit/red-team protocol, solutions (+decision framework, +software deps), research connections, debate, transferability (rebuilt on LLM literature), monoculture (updated), human institutions (historical+intelligence+org+legibility), human overseers, regulation (rewritten for 2026). Then do a style pass removing templated bullets, emoji and fiction analogies.
