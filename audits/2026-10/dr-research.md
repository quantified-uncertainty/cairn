# Audit: `apps/delegation-risk/src/content/docs/research/` (28 pages, ~91k words)

Auditor date: 2026-10-15. Context read: `TERMINOLOGY.md`, `REVISION_PLAN.md`, `CREDIBILITY_HARDENING_PLAN.md` (Phase 3.5, 2026-06-10), and the git history for this directory. All 28 pages were read at least structurally. These were read deeply: empirical-scheming-reduction, human-trust-calibration, correlated-failure-modeling, ai-safety-frameworks, byzantine-coordinator-voting, fidelity-insurance, mechanism-design, nuclear-aerospace, financial-risk-budgeting, all 10 theory pages, potential-projects, and the key sections of risk-measurement-and-pricing, runtime-monitoring, formal-verification, prototype-architecture, linear-logic, capability-elicitation and steganography. About 45 arXiv IDs were checked against the arXiv API. Those results are marked **[verified]** below.

---

## Overall verdict: 3.5 / 10

**Justification.** The section is mostly literature-flavored filler, not research. About 60% of the words are "deep-research" style surveys produced by an LLM over vendor blogs, Wikipedia and secondary sources. These include prototype-architecture-feasibility, steganography, byzantine, runtime-monitoring, formal-verification, linear-logic and human-trust-calibration. They restate the textbook (CAP theorem, PBFT, Girard, Shapley axioms, VCG) and then add a short "Implications for AI safety" list that is not derived from the survey. Little of it is load-bearing for the framework's actual contributions: the entanglement tax, accident/defection, runtime accounting.

Three things make this worse than "merely padded":

1. **Wrong numbers and math in the pages that are closest to the framework's core.**
   - The headline Factor(T,U) result is cited as 41%→70% in 3 pages. The paper's abstract says **41%→63%** [verified].
   - correlated-failure-modeling contains 4 arithmetic or modeling errors. One of them, the "correlation-aware BFT n ≥ (3f+1)/(1−β)" rule, directly contradicts the site's own canonical common-cause-floor result.
   - Invented "Safety Level" tables appear in the scheming page.
2. **Citation-claim mismatches at scale.** human-trust-calibration attaches precise percentages ("reduced over-reliance by 42%", "r = 0.72", "79% accuracy") to real papers that do not contain them. In several cases the reference entry is an unrelated paper (e.g., "Nonparametric Bayesian models for ranked data" cited for EEG trust classification). runtime-monitoring has wrong authors and years on at least 5 of 20 references. A domain expert who spot-checks two citations will stop trusting the site.
3. **Currency and consistency debt the June 2026 hardening pass missed.**
   - "Claude Opus 4 (Dec 2024)" as ASL-3.
   - "OpenAI/Apollo 2024".
   - "Factor(T,U) December 2024 / Redwood Research". The paper is Sandoval & Rushing, Dec 2025.
   - OMB M-24-18, which has been rescinded and replaced.
   - Comparisons that describe AI Control as "qualitative" and "single T-U pair", while `reference/related-approaches.md` already covers the 2025–26 agentic control line.

**Worth keeping.**
- potential-projects.md (rewritten June 2026). It is honest, falsifiable and well scoped, and it is the best page in the section.
- The AI Control, Ctrl-Z, ACL, sandbagging-audit and safety-case material in empirical-scheming-reduction §2–4.
- The beta-factor worked example (β=0.1 → 1e-4 vs 7e-10).
- nuclear-aerospace's standards tables. DO-178C objective counts, ASIL hardware metrics, SIL bands and ARP 4761 targets were all checked and are correct.
- The fidelity-insurance core (Parts 1–2, 6) as one real-world pricing analogy.

**Rough size:** about 91k words. After the recommended cuts and merges, about 30–35k words of materially better content would remain.

---

## Findings by priority

### P0: credibility-damaging or wrong (fix before anyone cites the site)

**P0-1. Factor(T,U) headline number, attribution and model details are wrong in 3 pages.** Effort: S.
- Files:
  - `trust-behavior/empirical-scheming-reduction.md` (lines 10, 34–37, 45, 530–533, 617, 947)
  - `risk-methods/risk-measurement-and-pricing.md` (§2.1, line ~721, ref line 1497)
  - `technical-safety/ai-safety-frameworks.md` (line ~77)
- Evidence: "**Factored monitoring improves safety by 41% → 70%** (Redwood Research, 2024)"; "### 1.2 Factor(T,U)... (December 2024)" with "by Redwood Research (December 2025)" two lines later; "(some sources cite 41% → 63%)"; "Blue team uses o3-mini as powerful decomposer"; "Factor(T,U) December 2024: Safety improved 41% → 70%".
- Reality [verified, arXiv:2512.02157, Sandoval & Rushing, 2025-12-01]:
  - The abstract says "boost safety from 41% to 63%".
  - The red team is GPT-4.1 Nano.
  - The paper says "Factored cognition makes it no harder for capable LLMs to write backdoors in APPS". This contradicts the site's "attack coordination challenges" rationale.
  - The paper also reports "low usefulness in APPS".
- Also fix the inconsistent decomposition-tax definition: Factor(T,T)/T on one page, Factor(T,U)/T on another.
- Proposed change:
  - Replace with 41%→63%.
  - Correct the authors and date.
  - Add the paper's own caveats: no added backdoor difficulty, low usefulness.
  - Drop the "some sources cite" hedge.
  - Grep the site for "41% → 70%" (`design-patterns/tools/empirical-tests.md` also references Factor(T,U)).

**P0-2. Fabricated or mismatched quantitative findings in human-trust-calibration.** Effort: L.
- File: `trust-behavior/human-trust-calibration.md`.
- In-text claims that do not match the cited work:
  - "Zhang et al. (2020): ... medical diagnosis ... accuracy rates (75%, 85%, 95%)" and "Confidence scores improved appropriate reliance by 27% in bird species classification". Zhang, Liao & Bellamy FAT* 2020 used an income-prediction task.
  - "Bansal et al. (2021): Combined approach: cognitive forcing + explanations reduced over-reliance by 42%". Cognitive forcing is Buçinca et al. 2021. Bansal 2021 found explanations *increase* acceptance regardless of correctness.
  - "Lebovitz et al. (2021) ... Organizational factors explained 40% of variance". This is a qualitative ethnography with no variance decomposition.
  - "Manager endorsement of AI system increased team trust by 38% (Glikson & Woolley, 2020)". That paper is a literature review.
  - "Raghu et al. (2019): Dermatology AI + doctor ... (AI: 86%, doctor: 82%, combined: 91%)". The reference is "Direct uncertainty prediction for medical second opinions", not a dermatology team study.
  - "Kohn et al. (2021): 5 successful diagnoses: 40% recovery ... 20: 85%". The reference given is "A multi-country comparison of AI acceptance for COVID-19 contact tracing".
  - "Wang et al. (2018): ML classifiers using EEG predicted trust (accuracy: 79%)". The reference given is "Nonparametric Bayesian models for ranked data", UAI 2018, which is unrelated.
  - "De-Visser et al. (2020): ... (r = 0.72)". That is a theory paper.
  - "Jessup et al. (2019): HRV predicted automation reliance (r = 0.58)". That paper is a propensity-scale paper.
  - "Koopmann et al. (2024) ... (r = 0.64)". This is a probably-nonexistent AMJ paper.
  - "Lee & Choi (2024) ... arXiv:2401.09876". That arXiv ID is **an NA62 Cherenkov detector paper** [verified].
  - "Lyons et al. (2021): Training on limitations reduced over-trust by 29%". The reference is "a qualitative study".
  - Also suspect: "Desai et al. (2013): 15 consecutive successful interactions required to restore 80%"; "Kizilcec (2016) ... reduced over-trust by 34%"; "Bahner et al. (2008) ... reduced automation bias by 35%"; Hamacher "18% vs 8%"; Robinette "42% vs 39%"; "Mozannar et al. (2024): human 78%, AI 82%, ... 89%"; "Lai & Tan (2019) ... 31% more often".
- Reference-list errors: Gonzalez et al. "(2020) ... Cognitive Science 27(4)" is from 2003. Alarcon "(2020) ... Behavior Research Methods 48(5)" is vol 48 = 2016. Bai et al. "(2023) ... Pattern Recognition 120" is 2021 and off-topic.
- Air France 447 is mischaracterized as "Pilots trusted faulty airspeed indicators". The accepted account is an automation-disconnect / startle / manual-handling failure.
- Proposed change: rewrite from scratch around ~15 verified sources:
  - Lee & See 2004; Parasuraman & Manzey 2010; Goddard 2012; Lyell & Coiera 2017; Dietvorst 2015/2018; Logg 2019; Yin et al. 2019; Zhang et al. 2020; Bansal et al. 2021 (CHI "Does the whole exceed its parts?"); Buçinca 2021; Vasconcelos 2023.
  - Add 2024–26 LLM-overreliance work, e.g. studies of LLM-assisted coding/decision overreliance and the Anthropic/others' work on human oversight of agents.
  - Keep **no number that has not been checked against the PDF**.
  - Merge with `theory/human-ai-trust.md` and link `entanglements/cross-domain/psychology-of-oversight.md` as the canonical home.

**P0-3. Math errors in correlated-failure-modeling that contradict the canon.** Effort: M.
- File: `trust-behavior/correlated-failure-modeling.md`.
- (a) "If three AI models independently have 1% probability of misclassifying ... the actual correlated failure probability may be 0.8 or higher". This is impossible: a joint failure probability cannot exceed a marginal of 1%.
- (b) "Adversarial input targeting shared vulnerabilities: 80% per node, ρ=0.9 → 51% all fail". 0.8³ = 0.512 is the *independent* answer. Under the canonical beta mixture, (1−ρ)p³+ρ·min p = 0.1·0.512+0.9·0.8 ≈ 0.77.
- (c) "λ_system = [β + (1-β)ⁿ]·λ" is wrong. It should be βλ + ((1−β)λ)ⁿ, as the page's own earlier example uses.
- (d) The 3-of-5 example "P(exactly k fail due to CCF) = (n choose k)·β^k·(1-β)^{n-k}·λ ... ≈ 0.0047" is a nonsense model (binomial in β). Its own arithmetic also gives 0.0016, not 0.0047. The independent comparison "0.01³ = 10⁻⁶" is also wrong for 3-of-5: it is ≈ C(5,3)·10⁻⁶ ≈ 10⁻⁵.
- (e) "Correlation-adjusted BFT: Required nodes: n ≥ (3f+1)/(1-β)" is invented. Under a beta-factor model, adding correlated replicas cannot get below the βλ floor. This is the site's own "unreachable common-cause floor" result (risk-propagation.md, solutions.md §5).
- Also check:
  - "D'Amour et al. (2020): Architectural diversity reduces error correlation by 15-30%" is not in D'Amour.
  - "Fort et al. (2019): Ensembles of different architectures outperform same-architecture ensembles by 2-4%". Fort studies random inits of one architecture.
  - "Raghu et al. (2021): Transformers of different sizes show high CKA (0.8+)". The paper compares ViTs vs CNNs.
  - The vendor share "~85%" is unsourced.
- Proposed change:
  - Delete (a), (b), (d), (e) and the Common Mode Beta section.
  - Fix (c).
  - Restate everything on the φ scale with the canonical mixture and link `delegation-risk/risk-propagation.md`.
  - Cut the 2008 and WW1 sections, which duplicate `case-studies/human-systems/alliance-cascades.md` and the finance page.
  - Add the empirical LLM error-correlation literature (see P1-12).
  - Target length ~2k words.

**P0-4. Invented "Safety Level" tables and confidence tiers presented as empirical.** Effort: S.
- File: `trust-behavior/empirical-scheming-reduction.md` §7.1, §7.3.
- Evidence: "| Deliberative alignment | 99.6-99.7% safety | Strong empirical |"; "| Untrusted monitoring with anti-collusion | 50-70% safety |"; "| Simple decomposition alone | <50% safety |"; "| Output-based oversight only | <30% safety | Strong negative |"; "**Strong evidence (>70% confidence)**".
- Why it is wrong: a 0.4% covert-action rate on Apollo's eval suite is not "99.6% safety". The source paper explicitly says eval awareness confounds the result and "the intervention as-studied is not sufficient". The other cells have no source.
- Proposed change: replace with a table of *reported metrics, setting, and caveats*. Drop all "safety level" cells that are not a reported number.

**P0-5. Factual errors in ai-safety-frameworks comparison.** Effort: M. Then merge (see P1-1).
- File: `technical-safety/ai-safety-frameworks.md`.
- "| **ASL-3** | ... | Claude Opus 4 (Dec 2024) |". Claude Opus 4 shipped with ASL-3 protections in **May 2025**.
- "ASL-4+ | Not yet defined" is stale.
- "Scheming Detection (OpenAI/Apollo 2024)". It is Sept 2025, arXiv:2509.15541 [verified]. It is also anti-scheming *training*, not detection.
- "DeepMind Debate — Irving et al. (2018)". The 2018 debate paper is from OpenAI.
- "Cooperative AI Foundation (2024). Multi-Agent Risks from Advanced AI". This is Hammond et al., Feb 2025 [verified arXiv:2502.14143].
- The Guaranteed Safe AI section attributes the quote "Mathematical proof is humanity's most powerful tool for controlling AGIs..." and the DNA-synthesizer/geofencing examples to Dalrymple et al. 2024. They come from Tegmark & Omohundro 2023 (arXiv:2309.01933).
- Mischaracterizing AI Control:
  - "| Qualitative T/U separation | Quantitative risk budgets |" and "Risk Budgeting: Qualitative". AI Control is explicitly quantitative (safety/usefulness curves, auditing budget).
  - "Single T-U pair". This ignores Ctrl-Z, resampling, and agentic control evaluations. All of those are already in empirical-scheming-reduction and related-approaches.
- Overclaims under "Unique Contributions":
  - "First framework to mathematically compose risks across hierarchical AI systems using Euler allocation".
  - "Coordinator Formalization: Explicit formal treatment".
  - Neither is shown anywhere on the site.
- "Proposed Integration: ASL-2 component: Risk budget = 10⁻⁴ per operation; ASL-3 ... 10⁻⁶; Yellow line: 50% of budget consumed". These are invented numbers.

**P0-6. Wrong author, year and venue on runtime-monitoring references.** Effort: S.
- File: `technical-safety/runtime-monitoring-architectures.md` (References).
- "Huang, L., et al. (2021). Runtime Safety Monitoring of DNNs for Perception: A Survey (arXiv:2511.05982)". Correct: Schotschneider, Pavlitska, Zöllner, **Nov 2025** [verified].
- "Desai, A., et al. (2025). Proactive Runtime Enforcement of LLM Agent Safety via Probabilistic Model Checking (arXiv:2508.00500)". Correct: Wang, Poskitt et al., title "ProbGuard: Proactive Runtime Monitoring for LLM Agent Safety via Probabilistic Prediction" [verified].
- "Zhao, H., et al. (2025) ... Simplex (arXiv:2509.21014)". Correct first author: Nesti [verified].
- "Cofer, D., et al. (2012). Compositional verification of architectural models ... Copilot framework". Cofer 2012 is AGREE. Copilot is Pike, Goodloe et al., RV 2010.
- "Sipma, H., & Leucker, M. (2024). TeSSLa – An Ecosystem..." The linked chapter is RV 2022, by Kallwies, Leucker et al.
- "Huang, C., et al. (2019). ROSRV" links to an RV 2014 chapter.
- "IEEE (2025). Explainable Online Monitoring of MTL" links to a Springer TACAS 2023 chapter.
- "Pike, L., et al. (2022). Integrating FRET with Copilot". The NASA FRET-Copilot work is Perez, Mavridou et al.
- Also: the benchmark figures "ROSRV: 2-8% CPU... TeSSLa 5-15%... internal representation monitoring: 10-30%" have no source. They are copied verbatim into risk-measurement-and-pricing §1.4/§2.6.
- Proposed change: fix or remove each item. Delete the unsourced overhead numbers on both pages.

**P0-7. Formal-verification citation errors.** Effort: S.
- File: `technical-safety/formal-verification-limits.md`.
- "Learned branching ([Ferrari et al., NeurIPS 2021](openreview B1evfa4tPB))". That OpenReview ID is Lu & Kumar, ICLR 2020.
- "Ferrari et al., 2024 (arXiv 2507.17453)" and "Order-leading exploration (arXiv:2507.17453, 2024)". Correct: Zhang, Fukuda et al., **July 2025** [verified].
- "ScenicProver, arXiv 2024 (2511.02164)" is Nov 2025 [verified].
- "Pandey et al., arXiv 2024 (2409.02218)". First author is Rouquette [verified].
- "Graebener et al., CAV 2022" links to a 2025 book chapter (978-3-032-…).
- "α,β-CROWN achieved 6.68% verified error on MNIST at ε=0.3, outperforming even PGD adversarial training (~12% error)". This compares verified error with empirical adversarial-training error and misattributes a CROWN-IBP-era number.
- "1M neurons (34-layer ResNet) → verified in ~34.5ms using GPUPoly (Müller et al., NeurIPS 2021)". GPUPoly is MLSys 2021 (arXiv:2007.10868 [verified]). The timing claim needs checking.
- "Panigrahy (2025)" is described as an "Impossibility of Safe, Trusted AGI" result. The actual title is "Limitations on Accurate, Trusted, Human-level Reasoning" (Panigrahy & Sharan) [verified]. Restate the claim accordingly.

**P0-8. Unsourced or fabricated industry numbers in risk-measurement-and-pricing Part III.** Effort: S.
- File: `risk-methods/risk-measurement-and-pricing.md`.
- "Cuts need for costly human labeling by up to **70%** according to Anthropic's internal benchmarks". No such public benchmark exists.
- "In single concurrency scenarios, monitoring overheads can account for **33% of entire benchmark duration**". This is a misreading of NVIDIA GenAI-Perf client overhead and has nothing to do with safety monitoring.
- "DIAMOND system: ~30% latency reduction, 38% communication overhead reduction" is unidentified.
- "RLHF can bring GPT-3.5-level models to roughly GPT-4 equivalent performance" and "Llama 3 Instruct improves MMLU by almost 2.5 points" are unsourced.
- "Deliberative alignment (2024)" is wrong; it is 2025. "Constitutional Classifiers (2024)" is arXiv 2501.18837, Jan 2025.
- Proposed change: delete or source each.

**P0-9. Theory pages contain substantive math errors.** Effort: M.
- `theory/trust-at-scale.md`: "Sublinear scaling ... Many components means errors average out ... (independent → sublinear, correlated → superlinear)". Expected loss (DR) is additive by linearity of expectation regardless of correlation. Correlation changes variance and tails, not Σ E[loss]. This misleads about the framework's own quantity.
  - The "CAP theorem analog" includes the "CA" option, a known misreading per Brewer 2012. It is decorative.
- `theory/trust-economics.md`: the VCG "Payment_i = Trust_cost_to_others_if_i_absent - Trust_cost_to_others_with_i" has the Clarke-pivot sign reversed for costs. As written it pays agent i rather than charging it.
  - The "Desirable properties" list asks for efficiency + truthfulness + individual rationality + budget balance with no mention of Green–Laffont / Myerson–Satterthwaite impossibility. mechanism-design.md does mention it.
  - "This is the core insight enabling principled trust markets" overclaims what the revelation principle gives.
- `theory/trust-dynamics.md`: the Bayesian model treats an "untrustworthy" agent as producing good outcomes 30% of the time at random. It concludes "After 10 good outcomes: π₁₀ ≈ 1.0 ... As π_n → 1, Delegation Risk → 0". This is exactly the inference a schemer defeats: a deceptive agent's P(good | evaluated) ≈ 0.95. The page's own "Deceptive Equilibrium" box below it is never connected.
  - The DR formula also drops the trustworthy agent's 5% failure rate, i.e. the accident channel.
  - Minor: π₅ = 0.997, not 0.998.
- `theory/trust-propagation.md`:
  - The "practical algorithm" combines paths with noisy-OR, 1−∏(1−t). That assumes path independence even when paths share edges, and it contradicts the canon note above it.
  - The comparison table still recommends harmonic "Best When: Balanced view".
  - PageRank/"Kirchhoff's laws for trust" are decorative with undefined semantics. Trust is not conserved, and normalizing by out-degree means a node that delegates widely dilutes each delegate's trust.

### P1: significant

**P1-1. Massive duplication with other sections; merge or cut.** Effort: M–L.

| Research page | Duplicates | Recommendation |
|---|---|---|
| technical-safety/ai-safety-frameworks.md | reference/related-approaches.md (more current: Agentic Control line 2025–26) | Merge unique bits into related-approaches; cut |
| system-design/mechanism-design.md, theory/trust-economics.md | cross-domain-methods/mechanism-design.md | Merge into one page |
| system-design/nuclear-aerospace-deep-dive.md | cross-domain-methods/nuclear-safety-pra.md, asil-decomposition.md | Merge tables into cross-domain pages |
| risk-methods/financial-risk-budgeting.md + risk-measurement Part I | cross-domain-methods/euler-allocation.md (canonical scoping lives there) | Coherent measures / Euler / Shapley stated 3×; keep once |
| trust-behavior/linear-logic-trust-budgets.md + risk-measurement Part I "Linear Logic" | cross-domain-methods/linear-logic-types.md | Merge; cut 80% |
| trust-behavior/correlated-failure-modeling.md | entanglements/fundamentals/formal-definitions.md, detection/modeling.md, correlation-calculator, delegation-risk/risk-propagation.md | Reduce to an annotated "prior art + measurement" page |
| system-design/byzantine-coordinator-voting.md | prototype-architecture §4, correlated-failure "correlation-aware BFT", design-patterns/least-x-principles | One short page |
| theory/human-ai-trust.md + trust-behavior/human-trust-calibration.md | entanglements/cross-domain/psychology-of-oversight.md | Merge into psychology-of-oversight |
| theory/trust-accounting.md | delegation-risk/delegation-accounting.md, runtime-accounting.md (canon "exposure ledger" with reconciliation) | Cut; ledger without reconciliation contradicts TERMINOLOGY canon |
| technical-safety/runtime-monitoring-architectures.md | design-patterns/monitoring.md | Cut classical RV to a 1-page appendix |
| technical-safety/capability-elicitation-sandbagging.md | empirical-scheming-reduction §4.2 (better, more current) | Merge into scheming page |
| technical-safety/steganography-detection-prevention.md | design-patterns/channel-integrity.md, entanglements/detection/detecting-influence.md | Rewrite short, LLM-specific |
| theory/trust-protocols.md, trust-interfaces.md | design-patterns, runtime-accounting | Cut to a sketch or merge |

**P1-2. prototype-architecture-feasibility.md is vendor-blog SEO content (10,141 words).** Effort: S (cut).
- Sources include Shaped blog, Medium, Qbotica, AIMultiple, MarkTechPost, Galileo, Maxim AI, T3 Consultants and DataCamp.
- Claims:
  - "decomposed systems can reduce costs by 80% while improving reliability".
  - "Decomposed architectures show 40-100% accuracy improvements".
  - "Healthcare - Parsed.com: 60% better accuracy than GPT-4".
  - "Tier 1 ... 7 nodes, A100-80GB ... ~$2.5M/year".
  - "Aerospace (Boeing 777/787): Flight control systems use 3f+1 Byzantine fault-tolerant computing".
- Category error: Mixture-of-Experts is presented as a "decomposition pattern". MoE experts are sub-networks of one model, not separately trusted components.
- Prices and models (GPT-4, Llama 2, A100) are already stale.
- Recommendation: cut entirely. If anything is kept, use a 500-word note: "the cost/latency question for decomposition is empirical; here are the 3 numbers we'd need", with BAIR's Compound AI Systems post as the one decent source.

**P1-3. byzantine-coordinator-voting.md uses the wrong frame.** Effort: M.
- BFT consensus (PBFT, HotStuff, Tendermint) solves agreement on a replicated log among deterministic replicas in a partially synchronous network with equivocation. Voting over independent AI judges' outputs collected by a trusted aggregator is **N-version programming / majority voting**. Its correct literature is Knight & Leveson 1986 (cited in TERMINOLOGY) and the Condorcet jury theorem with correlated voters. There, 2f+1 masks f faults, not 3f+1.
- The page itself says "Consensus requires 2f+1 = 3 matching responses" at n=4, mixing both frames.
- Remove, as irrelevant blockchain filler: TenderTee, PVSS-BFT, TSW-BFT, SPECULOR, eVRF, libp2p, gradient poisoning, and Krum/DETOX.
- "Hyperledger Fabric: PBFT-variant consensus" is wrong. Fabric's ordering service is Raft (crash fault tolerant), with SmartBFT only from v3.0.
- "PBFT ... sub-millisecond latency increases - only 26% overhead" sits next to "PBFT: 4.9-15.2 seconds under load". These are uncontextualized numbers from different papers.
- The quote "There is no feasible way to validate failure independence..." is unattributed. It is likely from Bloomfield & Rushby, arXiv:2407.13948 [verified exists].
- "Semantic similarity above threshold (cosine similarity > 0.95)" is an invented threshold.
- The temperature=0 "Deterministic execution mode" ignores that greedy decoding is not deterministic across batches in production inference.
- Proposed change: rewrite as "Redundant AI judges: voting, N-version, and why independence fails", ~1,200 words, keeping the good "subtle wrong answers / no disagreement to detect" and tiered-cost sections.

**P1-4. steganography-detection-prevention.md is auto-generated survey content with junk sources.** Effort: M.
- The 43 references include VentureBeat, Wikipedia (×4), DataCamp, DEV Community, DeepLearning.AI, image LSB/PVD/VoIP steganalysis and memory side-channel surveys.
- There are duplicate references: 26 = 28, 12 = 31, 2 = 38, 35 ≈ 42.
- The central claim "LLMs can master 'encoded reasoning'... This capability exists even without explicit training" is sourced to VentureBeat [1]. The underlying paper is Roger & Greenblatt 2023 (arXiv:2310.18512). It shows encoded reasoning learned *through fine-tuning*, and paraphrasing largely defeats it.
- Shannon capacity is cited to Shannon–Hartley, which is the AWGN-specific theorem.
- Missing core LLM work:
  - Schroeder de Witt et al. 2023, perfectly secure stego via minimum-entropy coupling (ICLR 2023).
  - Motwani et al. 2024 (Secret Collusion, NeurIPS).
  - Mathew et al. 2024 "Hidden in Plain Text" (arXiv:2410.03768).
  - Skaf et al. 2025 on steganographic CoT under process supervision.
  - Zolkowski et al. 2025 "Early signs of steganographic capabilities in frontier LLMs".
  - The CoT-monitorability literature.
- Proposed change: rewrite to ~1,500 words, LLM-only, on threat model → capacity bounds → paraphrasing defenses → empirical status. Merge into channel-integrity or keep as its research companion.

**P1-5. Missing major 2024–26 literature (currency).** Effort: M.
The section's AI-safety content stops around mid-2025, apart from patches in the scheming page. Missing, all relevant to delegation/monitoring:
- **CoT monitorability and faithfulness**:
  - Korbak et al. 2025 "Chain of Thought Monitorability" (arXiv:2507.11473).
  - Baker et al. 2025 "Monitoring reasoning models for misbehavior and the risks of promoting obfuscation" (arXiv:2503.11926).
  - Chen et al. 2025 "Reasoning models don't always say what they think" (arXiv:2505.05410).
  - Lanham et al. 2023.
- **Monitor robustness**: Terekhov et al. 2025 "Adaptive attacks on trusted monitors" (arXiv:2510.09462 [verified]). It is in the scheming page's source list but never discussed in the body.
- **Agentic sabotage and monitoring benchmarks**: SHADE-Arena (Kutasov et al. 2025); BashBench/Ctrl-Z, which is already present.
- **Agentic misalignment incidents and evals**:
  - Anthropic "Agentic Misalignment" (Lynch et al. 2025).
  - Emergent misalignment (Betley et al. 2025, arXiv:2502.17424).
  - Reward-hacking → misalignment generalization (Anthropic, Nov 2025).
  - Real agent incidents, e.g. the Replit production-DB deletion of July 2025. These are directly relevant to "risk preflight".
- **Eval awareness**: Claude Sonnet 4.5 / Apollo findings 2025; Chaudhary et al. 2025 (arXiv:2509.13333 [verified], cited only in capability-elicitation).
- **Correlated model errors** (directly answers potential-projects problems 2 and 3):
  - Goel et al. 2025 "Great Models Think Alike and this Undermines AI Oversight" (arXiv:2502.04313; CAPA error-correlation metric).
  - Kim et al. 2025 "Correlated Errors in Large Language Models" (ICML 2025).
  - LLM-judge self-preference work.
- **Safety cases**:
  - Clymer et al. 2024 "Safety Cases".
  - UK AISI safety-case templates.
  - Korbak et al. 2025 control safety case, which is present in the scheming page only.
- **Frameworks and policy**:
  - Google DeepMind Frontier Safety Framework (v2/v3).
  - RSP updates after v2.2.
  - EU AI Act GPAI Code of Practice (July 2025).
  - OMB M-25-21/M-25-22 replacing the M-24-10/M-24-18 cited in mechanism-design.md.
  - California SB 53 is present and correct.
- **AI insurance market** (fidelity-insurance is silent on it):
  - Armilla/Lloyd's AI liability products (2025).
  - AIUC and the AIUC-1 standard (2025).
  - Munich Re aiSure.
  - Major insurers seeking AI exclusions (late 2025).
  - This is the most direct real-world test of the "insurance prices delegation risk" thesis.
- **Multi-tenant/MCP risks** (potential-projects problem 4 says "hasn't been characterized"):
  - MCP tool-poisoning disclosures (Invariant Labs 2025).
  - Memory-injection attacks (AgentPoison 2024; MINJA 2025).
- **Model welfare**: Anthropic's model-welfare program (2025) and Long et al. 2024 "Taking AI Welfare Seriously". These are relevant if the site discusses constraining or "punishing" agents (trust-dynamics' "penalty", fidelity bonds). Currently absent; at minimum a scoping note.

**P1-6. potential-projects.md claims "nobody has checked" things that have published results.** Effort: S.
- Problem 2 says "Nobody has checked" whether a separate narrow judge catches what a frontier sibling misses. Problem 3 asks for measured correlation priors.
- Goel et al. 2025 and Kim et al. 2025 measure exactly cross-model error correlation, and find it rising with capability. Trusted-monitoring papers measure weaker-monitor detection.
- Proposed change: cite these as first results and reframe the problems as "replicate on agentic harm tasks, on φ scale".
- The "Surviving problems" list includes items already "done" as pages here (nuclear transfer, financial budgeting, comparison to frameworks). Prune it.
- "Temperature and covert signaling — does temperature=0 meaningfully suppress steganographic signaling" is answerable now: no. Encoding lives in token choice, and greedy decoding is a deterministic but still arbitrary channel.

**P1-7. fidelity-insurance.md: invented market numbers, canon violation, and a stale ACFE figure.** Effort: M.
- The control-discount tiers "Tier 1 Controls (10-30% premium reduction)... Tier 2 (additional 10-20%)" have no source.
  - "Insurers assume ~10-20% annual decay" is unsourced.
  - "Forensic accounting recovers ~30-40% of fraud losses" contradicts ACFE data, where most victims recover little or nothing.
  - "Standard exclusions (~90% of policies)" is unsourced.
  - "Economic downturns increase theft ... ~20-30%" is unsourced.
- "Median loss per case ~$117,000" is the ACFE **2022** figure. The 2024 report cited in Further Reading gives $145,000; tips ≈ 43%.
- Canon: the table maps "Exposure (theft) | Fidelity bond premium". Per TERMINOLOGY, an expected-loss price is *delegation risk*, not *exposure* (worst case). Also "Market is pricing Bob's defection risk at ~$5,000 expected" ignores the expense/profit loading the page itself lists (20–30%). Expected loss is therefore below the premium.
- §6.2 "Implied Exposure Reduction = Premium Reduction" 1:1 has invented numbers.
- Part 3, "Political Fidelity Insurance" (~1,000 words), is off-topic for AI delegation. Cut it or move it to a footnote. The "EA/rationalist mutual fidelity pool" research question is odd here.
- Citation: "Mookherjee, D. & Png, I. (1995). 'Corruptible Law Enforcers.' *RAND Journal of Economics*" is *Economic Journal* 105.
- Citation: "Dionne, G. & Wang, K. (2013). 'Does insurance fraud in automobile insurance increase claims?'" The actual title is "Does insurance fraud in automobile theft insurance fluctuate with the business cycle?" (J Risk Uncertain 47).

**P1-8. Scheming page: misused or unattributed sources in §5 and §8.** Effort: M.
- `trust-behavior/empirical-scheming-reduction.md`.
- §5.2 cites Divide-and-Conquer prompting (arXiv:2402.05359) for "less prone to intermediate errors and deceptions". "Deception" there means *misleading content in fact-verification inputs*, not model scheming. This is an equivocation.
- PMC "information-theoretic models of deception" is decorative.
- §5.1 human group deception-detection study (ResearchGate link, `researchgate.com` typo in body) is weak analogical evidence presented as "Empirical finding".
- §5.3 attributes "Lightweight sequential monitor ... 93% defense success rate" to Jones et al. 2024 (arXiv:2406.14595). It is a separate 2025 paper on monitoring decomposition attacks with lightweight sequential monitors. The paper is linked via emergentmind rather than arXiv.
- §8, folded from the old trust-dynamics-adversarial page, consists mostly of quotes in quotation marks with no attribution:
  - "Without decay, the only subgame-perfect equilibrium is no trust at all" is false as stated.
  - "~10-15% of system reliability is attributable to network effects in monitoring" is meaningless and is repeated as recommendation #8.
  - "entrusted with 29% more money".
  - "(Real example: the 2014 Tor attack where the attacker controlled a quarter of all exit relays.)". The ~25% exit-relay figure is the 2020 KAX17-era report; the 2014 attack was different.
  - "Colonial Pipeline ... reputational contagion to competitor firms with ownership connections" is unsourced.
  - "Deception impossibility result: 'It's currently impossible to train an AI model that's incapable of deception...'" is a quote, not a result.
- §4.3 sycophancy attributes measurement/mitigation findings (Orca-2, Mistral-7b, "visual misdirection") to Sharma et al. (arXiv:2310.13548). They come from a different survey or the ACL "Chaos with Keywords" paper.
- "Models from before 2024 did not show this capability" needs an exact source.
- "Larger and more capable models show systematically higher rates..." is unattributed.
- Alignment-faking numbers are inconsistent across pages: "12% compliance" here vs "12% ... compared to 3%" in capability-elicitation. The paper gives 14% compliance in free tier and 12% AF reasoning.
- Proposed change:
  - Cut §8 to ~800 words: repeated-game basics, inspection games (Avenhaus et al.), and the treacherous turn, with real citations.
  - Remove all unattributed quotes.
  - Fix §5.

**P1-9. nuclear-aerospace: historical and technical imprecision.** Effort: S.
- "RAW > 2 triggers NRC action". RAW ≥ 2 is a Maintenance-Rule risk-significance screening criterion (NUMARC 93-01), not an action trigger.
- The beta-factor table "Well-engineered 0.001 to 0.05 / Typical 0.05 to 0.25 / Poor engineering up to 0.25" is incoherent: poor equals the typical upper bound. Use IEC 61508-6 ranges (≈0.5–5% logic; 1–10% sensors/actuators).
- "Three Mile Island — What PRA missed" is contested. No TMI-2-specific PRA existed, and WASH-1400 had identified small-break LOCAs and human error as dominant contributors. Frame it as "what the licensing basis missed".
- "11 previous PORV failures" needs a source.
- Missing from aerospace: AC 25.1309's fail-safe rule, that no single failure may be catastrophic regardless of probability. This is the exact precedent for the canon "exposure envelope" (hard bound, not statistical), so cite it.
- Missing: STPA/STAMP (Leveson 2011), the standard critique of PRA for software/systematic failure, which is exactly the AI case.
- "Challenger ... No rules broken - decision followed NASA protocol" should cite Vaughan 1996.
- The MIL-HDBK-217 quote is unattributed.
- The final mermaid diagram (Aero→Series, Nuclear→Parallel) is meaningless; delete it.

**P1-10. mechanism-design.md: decorative application and minor errors.** Effort: S.
- VCG "AI subsystems ... pay increase in risk to others" assumes subsystems have quasi-linear utility over payments, which is not the case for AI components. Either reframe to *developers or vendors* as the strategic agents or drop it.
- "Holmström-Milgrom Informativeness Principle" is Holmström 1979. The quoted sentence is a paraphrase in quotation marks.
- "Top Trading Cycles ... Unique mechanism with all three properties" is Ma 1994 for housing markets. Real kidney exchange uses integer-programming cycle/chain optimization; RSÜ 2004 TTCC's strategy-proofness depends on the chain rule.
- Spectrum "87 auctions, >$60B revenue" and "coded in Excel" need sources.
- "AI forecasting bots now reaching top 10 in competitions" is unsourced.
- OMB M-24-18 was rescinded and replaced by M-25-22 (April 2025).

**P1-11. financial-risk-budgeting & risk-measurement: sign-convention and claim errors.** Effort: S.
- risk-measurement Part I mixes conventions. Monotonicity is written in loss convention ("X ≤ Y ⟹ ρ(X) ≤ ρ(Y)") while translation invariance is in P&L convention ("ρ(X + α) = ρ(X) − α"). The finance page uses P&L monotonicity. Pick one convention site-wide.
- "VaR ... fails for heavy tails" is misleading. The page's own bond example is a skewed/discrete default case. VaR is subadditive for elliptical distributions.
- "ES = E[X | X ≥ VaR]" is coherent only for continuous distributions; note the caveat.
- Part II: "σ_multiplier = e^(0.15 × complexity_score)" with "1.35× (±35%)" conflates a spread multiplier with a ±interval. "Premium = Expected Loss × σ_m × Safety Factor" multiplies the mean by an uncertainty-spread factor, which is dimensionally incoherent; use a loading. The whole complexity-score table (+2, +3 points) is invented. Label it as a proposal or cut it.
- financial-risk-budgeting: "Risk parity funds suffered 13-43% drawdowns" and "VaR underestimated ... (2010 study)" need sources. "Advisor Perspectives (2020)" and Wikipedia are not adequate references.
- "Basel FRTB 2025" should note jurisdictional delays (US/UK/EU 2026–27).

**P1-12. capability-elicitation-sandbagging.md: overreach and duplication.** Effort: S (merge).
- "OpenAI-Anthropic Joint Evaluation (2025) ... helps validate that sandbagging concerns extend across model families". That exercise was not a sandbagging study.
- MoReBench "(77.5%) vs (41.5%)" moral-reasoning numbers are used as evidence about evaluation gaming. They are irrelevant.
- "Strategic Chain-of-Thought" is irrelevant.
- The sabotage-eval numbers (36.1% → 95.6%) are correct, but Benton et al. 2024 (arXiv:2410.21514) is not in the references. Add it.
- Merge the unique remainder (contamination, held-out evals) into the scheming page's sandbagging section.

**P1-13. Section framing and index are stale or misleading.** Effort: S.
- `research/index.md` says "understand *why* the framework works", "Validate the Framework", and "[Trust Dynamics] — Is the trust model sound?". The theory pages do not validate anything.
- The index lists titles that do not match the page titles: "Trust Dynamics" is "Risk Dynamics", and "Trust Economics" is "Delegation Economics".
- `theory/index.md` says pages use "risk" and "trust" "somewhat interchangeably". TERMINOLOGY.md forbids undefined quantitative "trust". The theory pages violate that throughout (trust_amount, Trust_received, "Trust ∝ n^α", PageRank trust).
- Proposed change: rewrite the index as an honest "Background reading & surveys (non-canonical)" page with a status badge per page.

**P1-14. Find-replace damage ("DR" → "Delegation Risk").** Effort: S.
- `theory/trust-accounting.md`: the ASCII dashboard is broken ("│ SYSTEM Delegation Risk          │" overflows the boxes; "⚠ Code Generator Delegation Risk +15% (24h)    │"). There is also the type `trust_amount: Delegation Risk` and the KPI "System Delegation Risk            |".
- `theory/trust-interfaces.md` uses the legacy term "max_ete" (expected trust exposure?), which is not in the canon. It also has the invariant "deterministic output for same input" for an LLM reviewer.

### P2: polish

- **P2-1.** Template-y LLM prose throughout:
  - "Executive Summary / Key Takeaways / ✅ ⚠️ ❌", bold-label bullet lists, and "Critical insight:" / "Key insight:" scaffolding.
  - "Conclusion" sections that restate the summary.
  - Frontmatter "author: Research compiled from academic sources" (linear-logic).
  - "date: 2025-12-13" plus "Document Version 1.0" footer (prototype).
  - Remove them.
- **P2-2.** Reference hygiene:
  - Replace Medium, VentureBeat, Wikipedia, emergentmind, ar5iv and ResearchGate links with primary arXiv/DOI.
  - Normalize "(2023-2024)" style ranges.
  - Remove orphan references, e.g. Hendrycks et al. 2021 in correlated-failure (its claim was removed in Phase 3.5 but the reference remains).
- **P2-3.** correlated-failure:
  - "Mosleh, Fleming, Parry et al. (1988). Guidelines on Modeling CCF in PRA. NUREG/CR-5485, INEEL/EXT-97-01327" conflates NUREG/CR-4780 (1988) with NUREG/CR-5485 (1998).
  - "NUREG/CR-5497 (Mosleh et al. 1998) identifies 8 primary CCF causes": the cause taxonomy is NUREG/CR-6268.
  - "Vaurio (2007) RESS 79(1)": vol 79 = 2003.
- **P2-4.** byzantine: Internet Computer uses a threshold-BLS random beacon rather than a VRF. libp2p is a network stack, not a BFT library.
- **P2-5.** linear-logic: says linear types ensure the budget is "neither exceeded ... nor wasted (unused)". Budgets should be **affine** (discarding is fine). "Liquid Haskell: ... (hybrid static/dynamic)" is wrong; it is static. Sections 8–10 (Baker, Cyclone, Vault, LFPL, Leivant, Light LL) are irrelevant to AI delegation.
  - Add the missing conceptual caveat: a type system constrains the *scaffold*, not the model, and DR consumption is an estimate. Linearity only guarantees accounting discipline, which is the same point the canon makes about the ledger.
- **P2-6.** runtime-monitoring: the PAC sample complexity "N = O((1/ε²) log(1/δ))" is the estimation bound. For certifying rare failures with zero observed failures it is O((1/ε) log(1/δ)), the rule of three. Add Butler & Finelli 1993 on the infeasibility of statistically demonstrating 10⁻⁹. This is the key point for the framework's calibration problem.
- **P2-7.** trust-economics: "Insurer prices premium: P = E[D] × P(violation) × (1 + margin)" double-counts if E[D] is unconditional. Write E[D | violation].
- **P2-8.** trust-at-scale: "Blockchain/distributed ledger can provide this without trusting single party" is dated and decorative.
- **P2-9.** human-ai-trust: "Trust violations by AI are responsibility of human who trusted AI" is stated as a principle without argument.
- **P2-10.** trust-optimization: the convexity discussion is hand-wavy. The quadrant chart axes "Low Trust → High Trust" are ambiguous: is that low risk or low trustworthiness?
- **P2-11.** CAIS links point to fhi.ox.ac.uk; FHI closed in April 2024. Check the link and use the archived copy.

---

## Per-page triage

| # | Page | Words | Verdict | Est. cut % | Notes |
|---|---|---|---|---|---|
| 1 | research/index.md | 508 | Rewrite | 40% | Honest status labels; fix titles |
| 2 | theory/index.md | 195 | Rewrite | 30% | Remove "interchangeably" note |
| 3 | theory/trust-dynamics.md | 533 | Rewrite (merge into scheming §8 or delegation-risk) | 50% | Bayesian model ignores schemer case (P0-9) |
| 4 | theory/trust-accounting.md | 697 | Cut → link runtime-accounting / delegation-accounting | 100% | Ledger w/o reconciliation contradicts canon; broken ASCII |
| 5 | theory/trust-economics.md | 607 | Merge into cross-domain-methods/mechanism-design | 70% | VCG sign error |
| 6 | theory/trust-at-scale.md | 645 | Cut (keep HHI concentration idea → 1 para elsewhere) | 90% | Linearity-of-expectation error; CAP decorative |
| 7 | theory/trust-optimization.md | 526 | Cut or merge 1 para into euler-allocation | 85% | Generic pseudo-code |
| 8 | theory/trust-interfaces.md | 1,272 | Merge sketch into runtime-accounting / design-patterns | 75% | JSON Schema bloat; legacy max_ete |
| 9 | theory/trust-propagation.md | 1,345 | Rewrite short; canon lives in risk-propagation | 65% | Algorithm contradicts canon; PageRank/Kirchhoff decorative |
| 10 | theory/trust-protocols.md | 683 | Cut (protocol sketch duplicates design patterns) | 90% | |
| 11 | theory/human-ai-trust.md | 723 | Merge into psychology-of-oversight | 80% | |
| 12 | potential-projects.md | 2,157 | Keep (update) | 25% | Best page; cite existing first results; prune backlog |
| 13 | system-design/mechanism-design.md | 1,199 | Merge with cross-domain-methods/mechanism-design | 40% | Reframe strategic agents; update OMB |
| 14 | system-design/nuclear-aerospace-deep-dive.md | 1,418 | Merge into cross-domain nuclear/ASIL pages | 35% | Tables good; fix β table, TMI framing, add fail-safe rule & STPA |
| 15 | system-design/byzantine-coordinator-voting.md | 3,258 | Rewrite as N-version voting | 65% | Wrong frame |
| 16 | system-design/prototype-architecture-feasibility.md | 10,141 | Cut | 95–100% | Vendor-blog SEO; MoE category error |
| 17 | risk-methods/financial-risk-budgeting.md | 1,432 | Merge into euler-allocation + one finance-lessons page | 50% | Shapley/Euler/coherence stated 3× |
| 18 | risk-methods/fidelity-insurance.md | 3,130 | Rewrite | 50% | Cut political insurance; add 2025–26 AI insurance market; canon fix |
| 19 | risk-methods/risk-measurement-and-pricing.md | 8,517 | Rewrite / split | 60% | Part I duplicates finance+euler; Part II invented formula; Part III stale & unsourced numbers |
| 20 | technical-safety/ai-safety-frameworks.md | 1,692 | Merge into reference/related-approaches; cut | 85% | ASL-3 date, overclaims |
| 21 | technical-safety/capability-elicitation-sandbagging.md | 5,044 | Merge into scheming page | 75% | |
| 22 | technical-safety/formal-verification-limits.md | 6,810 | Rewrite short | 65% | Citation errors; keep "verified-unverified gap", GS AI levels (verify) |
| 23 | technical-safety/runtime-monitoring-architectures.md | 7,387 | Rewrite short; merge with design-patterns/monitoring | 70% | Classical CPS RV; little LLM monitoring; bad refs |
| 24 | technical-safety/steganography-detection-prevention.md | 4,445 | Rewrite short (LLM-specific) | 65% | Junk sources |
| 25 | trust-behavior/correlated-failure-modeling.md | 5,189 | Rewrite | 60% | 4 math errors; duplicates entanglements |
| 26 | trust-behavior/empirical-scheming-reduction.md | 8,416 | Keep (fix + update) | 40% | Strongest AI-safety page; fix P0-1/P0-4/P1-8; add CoT-monitorability etc. |
| 27 | trust-behavior/human-trust-calibration.md | 6,479 | Rewrite from scratch | 70% | Fabricated stats (P0-2) |
| 28 | trust-behavior/linear-logic-trust-budgets.md | 6,616 | Merge into cross-domain-methods/linear-logic-types | 85% | PL survey; affine not linear |

**Triage counts:** Keep 2 · Rewrite 12 · Merge 9 · Cut 5. Cut counts pages 4, 6, 7, 10 and 16. Pages that are "cut or merge 1 paragraph" are counted as Cut.

**Word estimate:** about 91k → about 30–35k (≈ −62%).

---

## Citations to verify

**[verified] means checked against the arXiv API on 2026-10-15.**

**Confirmed wrong (fix now):**
1. "Factor(T,U) ... Redwood Research ... December 2024 ... 41% → 70%". Correct: Sandoval & Rushing, arXiv:2512.02157, Dec 2025, 41%→63% [verified]. Appears in empirical-scheming-reduction, risk-measurement-and-pricing and ai-safety-frameworks.
2. "Lee, M. K., & Choi, J. (2024) ... arXiv:2401.09876". That ID is an NA62 Cherenkov-detector paper [verified]. The reference is fabricated (human-trust-calibration).
3. "Huang, L., et al. (2021) ... arXiv:2511.05982". The paper is Schotschneider et al., 2025 [verified] (runtime-monitoring).
4. "Desai, A., et al. (2025) ... Proactive Runtime Enforcement ... arXiv:2508.00500". The paper is Wang, Poskitt et al., "ProbGuard" [verified].
5. "Zhao, H., et al. (2025) ... arXiv:2509.21014". First author is Nesti [verified].
6. "Ferrari et al., 2024 ... arXiv 2507.17453" and "(arXiv:2507.17453, 2024)". The paper is Zhang, Fukuda et al., 2025 [verified].
7. "ScenicProver, arXiv 2024 (2511.02164)" is 2025 [verified].
8. "Pandey et al., arXiv 2024 (2409.02218)". First author is Rouquette [verified].
9. "Panigrahy (2025) ... Impossibility of Safe, Trusted AGI". The actual title is "Limitations on Accurate, Trusted, Human-level Reasoning" (Panigrahy & Sharan) [verified].
10. "Cooperative AI Foundation (2024). Multi-Agent Risks from Advanced AI". The paper is Hammond et al., Feb 2025 [verified arXiv:2502.14143].
11. "OpenAI/Apollo (2024)" scheming. The paper is Schoen et al., Sept 2025, arXiv:2509.15541 [verified] (ai-safety-frameworks ×2; risk-measurement "Deliberative alignment (2024)").
12. "ASL-3 ... Claude Opus 4 (Dec 2024)". Correct date is May 2025.
13. "Learned branching (Ferrari et al., NeurIPS 2021) openreview B1evfa4tPB". That is Lu & Kumar, ICLR 2020.
14. "Cofer, D., et al. (2012) ... Copilot framework". Cofer 2012 is AGREE; Copilot is Pike et al. 2010.
15. "Sipma, H., & Leucker, M. (2024). TeSSLa – An Ecosystem". The paper is Kallwies, Leucker et al., RV 2022.
16. "Huang, C., et al. (2019). ROSRV". This is RV 2014.
17. "IEEE (2025). Explainable Online Monitoring of MTL". Published by Springer, TACAS 2023.
18. "Wang, Y., Khardon, R., & Protopapas, P. (2018). Nonparametric Bayesian models for ranked data" is cited for an EEG trust classifier. The claim belongs to a different paper (likely Akash et al. 2018, ACM TiiS).
19. "Kohn, L., ... (2021). ... COVID-19 contact tracing. PLOS ONE" is cited for trust-recovery percentages. Mismatch, and the reference is possibly fabricated.
20. "Koopmann, J., ... (2024). Observational learning from peers and coworkers. AMJ" is likely fabricated.
21. "Bansal et al. (2021) ... cognitive forcing ... 42%". The finding belongs to Buçinca et al. 2021, and the number is not verified.
22. "Gonzalez, Lerch, Lebiere (2020) ... Cognitive Science 27(4)" is 2003.
23. "Alarcon et al. (2020) ... Behavior Research Methods 48(5)" is 2016.
24. "Bai et al. (2023) ... Pattern Recognition 120, 108102" is 2021 and off-topic.
25. "Mosleh, Fleming, Parry et al. (1988) ... NUREG/CR-5485". The 1988 report is NUREG/CR-4780; NUREG/CR-5485 is 1998.
26. "Vaurio (2007) RESS 79(1)" is 2003.
27. "Mookherjee & Png (1995) ... RAND Journal of Economics". Correct venue: Economic Journal.
28. "Dionne & Wang (2013). 'Does insurance fraud in automobile insurance increase claims?'". Wrong title.
29. "Hyperledger Fabric: PBFT-variant consensus". Fabric uses Raft; BFT (SmartBFT) only from v3.
30. Guaranteed Safe AI quote ("Mathematical proof is humanity's most powerful tool...") is attributed to Dalrymple et al. 2024. It is Tegmark & Omohundro 2023.
31. "DeepMind Debate — Irving et al. (2018)". The paper is from OpenAI.
32. "Holmström-Milgrom Informativeness Principle" is Holmström 1979; the quote is a paraphrase.
33. ACFE "Median loss ~$117,000" is the 2022 figure, while the page cites the 2024 report ($145k).
34. "Lightly sequential monitor ... 93%" is attributed to Jones et al. 2024 (arXiv:2406.14595). It is a separate 2025 paper.

**Unverified, needs a PDF check before keeping:**
- All remaining percentages in human-trust-calibration: Desai 2013, Hamacher 2016, Robinette, Kizilcec 2016, Bahner 2008, Mozannar 2024, Lai & Tan 2019, Lakkaraju & Bastani 2020, Jessup 2019, De Visser 2020, Wang N. 2016, Lyons 2021, Glikson & Woolley 2020, Lebovitz 2021, Raghu 2019.
- correlated-failure: Kornblith 2019 "0.3-0.7 CKA"; Raghu 2021 "0.8+"; D'Amour "15-30%"; Fort "2-4%"; Papernot "47-84%".
- nuclear-aerospace: "11 previous PORV failures"; MIL-HDBK-217 quote.
- mechanism-design: "87 auctions, >$60B", "coded in Excel", "72-hour incident reporting" (OMB M-24-18).
- financial-risk-budgeting: "13-43% drawdowns", "UBS acknowledged 'shortcuts'", "2010 study" EVT quote.
- formal-verification:
  - GPUPoly "34.5ms ResNet34".
  - α,β-CROWN "6.68% MNIST ε=0.3".
  - Alfonseca et al. "Nature Scientific Reports 2025 'Machines that halt resolve the undecidability...'". Check the author list; Alfonseca's known paper is JAIR 2021.
  - GS AI "Levels 1–9".
  - "Wurm et al." semi-linear.
- byzantine: "PBFT ... only 26% overhead"; latencies "4.9-15.2 s", "TSW-BFT 0.75 s", "SPECULOR 34%".
- empirical-scheming-reduction:
  - "Models from before 2024 did not show this capability".
  - "Larger and more capable models show systematically higher rates of both prompted and spontaneous deception".
  - Aoyagi et al. (2024) quote.
  - "entrusted with 29% more money".
  - "~10-15% ... network effects".
  - Tor 2014 "quarter of exit relays".
  - Colonial Pipeline contagion.
  - Trusted editing "92% at 20%" (likely right; confirm).
  - In-context scheming "o1 >85%" (likely right).
- risk-measurement: ROSRV/TeSSLa/Copilot overhead numbers; "DIAMOND"; GenAI-Perf "33%"; CAI "70%"; "Lin et al., EMNLP 2024" (likely right); "Huang et al., 2025 Safety Tax" (likely right).
- capability-elicitation: MoReBench 77.5/41.5 (relevance); TS-Guessing "57%" (Deng et al. 2023).
- prototype-architecture: every number (vendor-sourced). Recommend cutting rather than verifying.

**Pages with zero or near-zero real citations that need them** (or need cutting):
- theory/trust-dynamics, trust-accounting, trust-economics, trust-at-scale, trust-optimization, trust-protocols, trust-interfaces, human-ai-trust: zero citations, except trust-propagation, which has Kleinberg 1999, Resnick 2000 and EigenTrust.
- nuclear-aerospace: only generic "Sources" (no specific documents for TMI/Fukushima claims).

**Spot-checked correct** (no action): Greenblatt et al. arXiv:2312.06942; Ctrl-Z 2504.10374; ACLs 2504.05259; control safety case 2501.17315; Gardner-Challis 2602.20628 [verified]; Auditing Games for Sandbagging 2512.07810 [verified]; Adaptive Attacks 2510.09462 [verified]; Elicitation Game 2502.02180; Tice 2412.01784; Apollo in-context scheming 2412.04984; alignment faking 2412.14093; Goldowsky-Dill probes 2502.03407; Secret Collusion 2402.07510; Jones et al. 2406.14595; Constitutional Classifiers 2501.18837 (23.7%, 0.38%); Burns W2S 2312.09390; Christiano IDA 1810.08575; Irving 1805.00899; CAI 2212.08073; GSAI 2405.06624; Urban & Miné 2104.02466 [verified]; Bloomfield & Rushby 2407.13948 [verified]; deVadoss BFT-AI 2504.14668 [verified]; Hashgraph 2505.03553 [verified]; RaRust 2502.19810 [verified]; Artzner 1999; Acerbi–Tasche 2002; Tasche 0708.2542; DO-178C objective counts (71/69/62/26); ASIL SPFM/LFM/FIT table; SIL PFD bands; ARP 4761 targets; SB 53 reporting windows; the linear-logic PL bibliography (Girard, GSS 1992, Ghica–Smith ESOP 2014, Atkey LICS 2018, Orchard ICFP 2019, Baker 1992/1995, Fähndrich–DeLine PLDI 2002, etc.).

---

## Top 5 recommendations

1. **Run a citation-correctness sprint now (P0-1, P0-2, P0-6, P0-7; ~1 day).**
   - Fix the 34 confirmed-wrong items above.
   - Unpublish or rewrite human-trust-calibration's numeric claims.
   - Replace Factor(T,U) 41→70 with 41→63 everywhere.
   - Add a CI check that runs every `arxiv.org/abs/NNNN.NNNNN` link through the arXiv API and compares the stated year and first author.
   - This class of error is what discredits the site with LW/EA readers fastest, and the June hardening pass did not cover this section.

2. **Fix the math that contradicts the canon (P0-3, P0-9; ~half day).** Correct correlated-failure's four errors and delete "correlation-adjusted BFT n ≥ (3f+1)/(1−β)". Fix trust-at-scale's linearity-of-expectation error, the VCG sign, and the trust-dynamics model that "proves" a schemer trustworthy after 10 good outcomes. Re-express everything on the φ scale with the canonical mixture.

3. **Cut and merge aggressively: 28 pages → about 10 (~91k → ~32k words).**
   - Delete prototype-architecture-feasibility outright.
   - Collapse the 9 "trust-*" theory stubs into 1–2 links to canonical pages.
   - Merge ai-safety-frameworks → related-approaches; mechanism-design + trust-economics → cross-domain mechanism-design; nuclear and finance → cross-domain pages; linear-logic → linear-logic-types; capability-elicitation → scheming page; human-ai-trust + calibration → psychology-of-oversight.
   - Rewrite byzantine as N-version voting.
   - Most of this is derivative survey prose that dilutes the novel 60k words the REVISION_PLAN identified.

4. **Rebuild the scheming/monitoring page as the section's flagship and bring it to late 2026 (P1-5, P0-4, P1-8).**
   - Replace the invented "Safety Level" tables with reported-metric tables.
   - Cut §8's unattributed quotes.
   - Add the missing literature: CoT monitorability (Korbak 2025, Baker 2025, Chen 2025), adaptive attacks on monitors, SHADE-Arena, agentic misalignment / emergent misalignment, eval-awareness, and cross-model error correlation (Goel 2025, Kim 2025).
   - Explicitly tie each result to a canon term: trusted monitoring ↔ risk preflight; correlated errors ↔ correlation budget.

5. **Re-aim the economics pages at the live empirical test of the thesis (P1-7, P1-6).**
   - In fidelity-insurance, replace political-insurance speculation and invented control-discount tables with the 2025–26 AI liability-insurance market: Armilla/Lloyd's, AIUC-1, Munich Re aiSure, and insurers' AI exclusions. That market is the first real-world price signal for "delegation risk".
   - Fix "premium = exposure" to "premium ≈ loaded delegation risk".
   - Update potential-projects to cite existing first results and prune backlog items that are already pages.
