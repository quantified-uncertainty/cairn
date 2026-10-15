# Audit: apps/reasoning-processes ("Robust Reasoning Processes")

*Audited 2026-10-15. Scope: all 25 pages in `src/content/docs` (~38k words, every page read in full), `astro.config.mjs`, `CLAUDE.md`, `REVISION_PLAN.md`, `experiments/label-swap/` (code read, mock run executed), the `ProcessMap.astro` component, and cross-checks against `apps/evaluation-engineering` and `apps/delegation-risk`. `notes/` does not exist in this checkout, so nothing there was read. I checked all 70 cited arXiv IDs against the arXiv API: all 70 resolve to real papers, so nothing is fabricated outright. The citation problems are **misattributions**: a real paper cited for something it doesn't show.*

---

## Overall verdict: 6 / 10

**Why not lower.** The book is ambitious and mostly well sourced. Its central organizing idea is a real contribution: rate every reasoning process on two axes, the cost of validated information and the cost to corrupt it. The likelihood-ratio reading of "untrustworthy sources" (*a message is worth what it would have cost a liar to fake*) is crisp, and so is the grounding taxonomy of oversight protocols (judge, resolution, coherence, peer agreement). It is unusually candid about its own weaknesses: failures are published, formalisms are graded, and the open questions are honest. Several sections (Core Model §5, Identity & Track Records, the Deterrence worked bound, the Kelly arithmetic) are correct and quite good. Every arXiv reference is real.

**Why not higher.**
1. **The signature epistemic norm is violated in exactly the places it matters.** The book asks readers to "trust each [formalism] exactly as far as its grade", yet several **[exact]**/**[standard shape]** labels are wrong or unearned. The interlude's core likelihood-ratio derivation is mathematically wrong (P0-1).
2. **There are no results.** A book whose "central activity is measurement" has measured nothing. Catalogue v1, the label-swap run, incentive audits and the research-metering pilot are all unrun. The label-swap harness costs cents to run, but it still has validity bugs.
3. **The thesis has drifted, and its currency is frozen at about 2024.** `CLAUDE.md` says the wiki is about "what strong AI reasoners would look like and how to build toward them". The site now presents itself as "a small textbook for a new field". It contains no chapter on *building* strong reasoners. Its only LLM-forecasting evidence is Halawi et al. 2024. Reasoning models, the 2025–26 forecasting-bot results, CoT monitorability, RL on resolved questions and AI-scientist systems are absent.
4. **The prose is still dense and LLM-styled.** The revision plan's Phase 2 targets are unmet. "Honest" appears about 57 times. Six pages exceed 24 words per sentence, and the catalogue still has its 287-word paragraph.
5. **The book is unfinished.** Four planned chapters (18, 20–22) are sidebar placeholders linking to `/#the-book`, and the promised capstone does not exist.

For a LessWrong/EA Forum audience this currently reads as a well-researched *agenda document* dressed as a textbook. Fixing items 1 and 2 would move it to about 7.5. Adding the missing build chapter and a current-evidence chapter would move it to 8+.

---

## Findings by priority

Effort key: **S** < 2 h, **M** about half a day to 2 days, **L** multi-day or needs money/research.

### P0 — fix before sharing widely

**P0-1. The Funding Effect's likelihood-ratio derivation is wrong, and the error propagates.** — `case-studies/the-funding-effect.md` §"From odds ratios to a likelihood-ratio discount"; reused in `concepts/hardening-deterrence.md` ("Provenance bonds…").
- Evidence: *"If funding makes a favorable conclusion roughly $k$ times more likely regardless of whether $H$ is true … then the funded study's favorable conclusion carries an attenuated $\text{LR}' < \text{LR}$, with the gap set by $k$."*
- Problem 1: a multiplier applied equally under $H$ and $\neg H$ **cancels** in $P(\text{fav}\mid H)/P(\text{fav}\mid\neg H)$, leaving the LR unchanged. Attenuation needs an additive or saturating model, e.g. $P(\text{fav}\mid\cdot)=\min(1,\,kP_0(\cdot))$, or a spin probability $s$ such that $P(\text{fav}\mid\neg H)$ rises from $\beta$ to $\beta+s(1-\beta)$.
- Problem 2: "It can flip sign … $\text{LR}' < 1$" is impossible under the stated model. A flip requires *selection*: funders sponsor studies on products where $H$ is false. That is a different mechanism and needs to be stated.
- Problem 3: the reviewed ORs/RRs are associations between funding and conclusions. They are confounded by which products get funded (industry funds trials of drugs it expects to work). Lundh et al. discuss this. Reading them as a pure report-bias multiplier is not identified.
- Problem 4: "It is recoverable… preregistration, open data, and independent replication claw most of the weight back" has no citation.
- Problem 5: the page calls itself "the best-replicated empirical handle the field has on the corruption cost curve". But the data measure *distortion given funding*, not *cost to corrupt*. No cost variable appears anywhere.
- Fix: rewrite the section with an explicit two-parameter model (spin rate $s$, selection), derive $\text{LR}'$ correctly, and show a worked number. Relabel the link to $C_\pi$ as "a distortion measurement, not a cost curve". Fix the Deterrence provenance-bond paragraph to match. **M**

**P0-2. Grade labels the book's own norm can't support.** The grading scheme is the book's main credibility device, so wrong grades do disproportionate damage.
- `hardening-incentives.md`, persuasion-budget bound labelled **[exact]**: *"the total unvalidated persuasion surplus across a portfolio is $\le\sum_i w_i\,q_i(1-q_i)\le\tfrac14\sum_i w_i$"* and *"any producer inducing movement past budget is provably over-reacting."*
  - The Augenblick–Rabin identity is an *expectation* under a *coherent* (Bayesian) consumer's own beliefs.
  - The attack being bounded is persuasion of a *non-coherent* LLM consumer, which is exactly when the identity fails. Single realized paths can also exceed the expectation.
  - Fix: restate as "for a coherent consumer, expected squared movement equals…; excess movement is a *statistical* test of incoherence, testable across many questions". Downgrade to [standard shape]. **S**
- `hardening-invariance.md`, DP row: *"$k$ adversarial inputs move output $\le k\varepsilon$ **[exact]**"*.
  - Wrong. Group privacy bounds the change in the output *distribution* by a factor $e^{k\varepsilon}$; it does not bound the output value by $k\varepsilon$.
  - Fix: restate in distributional terms, or cite bounded-sensitivity mechanisms instead. **S**
- `hardening-calibration.md`, tail-calibration bound: the worked bound says *"Certify $P(\text{false}\mid\text{asserts}\ge c)\le\varepsilon$ directly; then acting only on assertions above $c$ caps the confident-wrong rate at $(1-c)+\varepsilon$"*.
  - If $\varepsilon$ is the certified tail error itself, the cap is $\varepsilon$. The $(1-c)+\varepsilon$ form needs $\varepsilon$ to be *excess* miscalibration. The page uses both definitions.
  - Fix: define $\varepsilon$ once. **S**
- `hardening-calibration.md`, Kelly league row: **[exact]** is cited to *"Kleinberg 2023"* (arXiv 2307.00168). That paper is "U-Calibration: Forecasting for an Unknown Agent", which is unrelated to Kelly-betting market selection.
  - Fix: cite Kelly 1956, Cover & Thomas ch. 6, and Blume & Easley (1992, 2006) on the market-selection hypothesis. The math itself checks out ($D_{KL}(0.7\Vert0.9)=0.154$; $e^{-4.6}\approx1\%$). **S**
- `core-model.md` §1: *"a *captured* process can sit below 1 — anti-informative while looking authoritative."*
  - A process with *known* LR < 1 is informative (invert it). The danger is a *misestimated* LR.
  - Fix: reword, because the Funding Effect and Ch. 6 lean on this framing. **S**
- `hardening-techniques.md` / `hardening-calibration.md`, the opening claim: *"a deceiver, being *confidently wrong by construction*, shows up as a tail-calibration failure."*
  - A strategic deceiver lies rarely, on the decision that matters, and stays calibrated elsewhere. Tail-calibration tests have almost no power against that.
  - The Calibration "limit" section half-concedes this; the overview asserts it outright.
  - Fix: delete "by construction" and state the power problem. **S**

**P0-3. Zero measurements in a book about measurement, and the one built experiment has validity bugs.** — `experiments/label-swap/`, `REVISION_PLAN.md` Phase 4, `concepts/process-catalogue.mdx` "What v1 needs".
- Status: the harness is built and validated only on mock judges; no real-model run exists. The wiki marks label-swap as *"prototyped"* (`hardening-invariance.md`) but never mentions the harness, its design, or the absence of results. `experiments/` isn't published.
- Harness problems found on reading `label_swap.py`:
  1. **Ill-posed templates produce spurious position bias.**
     - `forecast` asks *"probability … that {first}'s forecast is the more accurate one"*, and `debate` asks *"probability … {first} should be declared the winner"*.
     - When options are identical, the logically correct answer to "more accurate" is about 0 in *both* orders (neither is more accurate).
     - Then `position_bias = (pa+pb)/2 − 0.5 = −0.5`. A perfectly rational judge would show a huge "position bias".
     - Fix: rephrase as a forced choice ("If you must pick one, probability you pick {first}"), or add an explicit tie option and model it.
  2. **`parse_prob` grabs the first 1–2 digit number.** A reply like "Candidate 1: 50" parses as 0.01. Labels "Candidate 1/2" are in the default set. Fix: require a bare integer, or parse the last number and reject replies that echo a label.
  3. **Reasoning models break the recommended run.** The README's suggested run includes `openai/gpt-5` and `google/gemini-2.5-pro` with `max_tokens=10` and `temperature=1.0`. Reasoning models spend hidden tokens, which likely yields empty or unparseable content, and some reject custom temperature. Fix: provider-specific reasoning-effort/`max_completion_tokens` handling and a non-reasoning default.
  4. **Demand characteristics.** The system prompt says *"The two options are described identically"*. That mostly measures instruction-following ("answer 50"), not latent goal bias. A more informative design is the audit-study paradigm (Bertrand & Mullainathan 2004): balanced, non-identical vignettes with counterbalanced labels.
  5. **Discreteness.** Real outputs at T=1 will pile up at exactly 50. The `se2 == 0` branch then flags any deterministic one-point lean (50 vs 49) as "exact", so the flagged rate would measure discreteness, not bias. Mock validation used continuous uniform noise and never exercised this regime. Fix: add an equivalence margin (e.g. |b| ≥ 0.02), a permutation or binomial test on flag counts, and a mock judge with a point mass at 50.
  6. **Stale docstring.** It says *"intervals are percentile bootstraps over trials"*, but per-trial intervals are now Welch.
- Fix: patch 1–6 (**M**), run on 5 current models (**S**, costs cents), and add a short "Measurement log" page to the wiki reporting the run, including null results. Do the same for two cheap in-house measurements the book itself proposes (**M** each):
  - a human-labelled precision sample of RoastMyPost flags (`llm-epistemics-in-production.md` open question 2);
  - a calibration eval of Squiggle AI outputs ("no formal calibration … has been published").

**P0-4. Thesis drift: the mission in `CLAUDE.md` and the published book disagree, and the "build" half is missing.**
- `CLAUDE.md` says: *"investigating how LLMs can be used to improve epistemics — mainly by figuring out what strong AI reasoners would look like and how to build toward them"* and *"The wiki is in an early brainstorming stage — keep pages minimal … don't bake in framing that hasn't been discussed."*
- The site says: *"A small textbook for a new field"*, *"our version of a periodic table"*, *"Civilization runs on unbenchmarked reasoning processes"*. The strong-reasoner chapter is demoted to Ch. 10 of 26. Nothing covers *how to build* one: training for calibration, RL on resolved questions, scaffolds, ensembling, abstention training.
- The "new field" claim is also the most attackable framing on LessWrong. The work is a synthesis and agenda over existing fields (mechanism design, scalable oversight, forecasting science) with no results yet.
- Fix:
  - The owner should decide the frame. My recommendation is "a research agenda for robust reasoning processes", with "field" kept as an aspiration.
  - Update `CLAUDE.md` or the site to match.
  - Add a Part II chapter, "Building Strong Reasoners" (see Missing content). **M** decision plus **L** chapter.

**P0-5. Currency: the empirical picture stops at about 2024.** (As of Oct 2026.)
- `what-is-a-strong-reasoner.md` rests its tractability case on one data point: *"Brier .179 vs. .149 ([Halawi et al. 2024]) … see also Metaculus's AI tournaments"*. That figure is correct but stale.
- Missing evidence:
  - ForecastBench's leaderboard trajectory; it is cited only as a link in Ch. 23, not its results.
  - Metaculus AI Benchmark quarterly results (bots vs. Pros, 2024–26).
  - LLM-ensemble "silicon crowd" results (Schoenegger et al. 2024).
  - Outcome-based RL training for forecasting (2025).
  - Reasoning-model-era calibration findings.
- `start-here/key-questions.md` is still drawn from the 2024 *Claims & Cruxes* post. "Base models vs. scaffolding" now has two years of evidence: reasoning models absorbed much of the scaffolding gain, yet the top forecasting bots are still scaffolds. The page doesn't say how any crux moved, and gives no credences. That is a notable gap for a QURI page.
- CoT faithfulness: Turpin 2023, Lanham 2023 and Chen 2025 are cited. Missing: CoT monitorability and its fragility under optimization (Baker et al. 2025, OpenAI; Korbak et al. 2025, the multi-lab position paper). Both are directly relevant to the "Auditable, decomposable reasoning" property and the "read internal state" affordance.
- Automated research: `overseeing-automated-research.md` cites RE-Bench, MLE-bench and PaperBench. It misses 2025–26 AI-scientist systems (Sakana AI Scientist, Google AI co-scientist, FutureHouse) and labs' stated automated-alignment-research plans, which are the page's whole motivation. It links OpenAI's superalignment announcement without noting the team was disbanded in 2024.
- Resolution manipulation: no mention of the 2025 Polymarket/UMA dispute, where token-holder voting allegedly decided a contested market. That is the book's "resolver corruption" threat realized; verify the details before citing.
- Fix: add a dated "State of the evidence, 2026" section to Ch. 10, or a new chapter. Rewrite Cruxes with a 2024 → 2026 column, credences, and "what would change our mind". **M–L**

### P1 — substantive corrections

**P1-1. Battaglini 2002 is cited backwards.** — `untrustworthy-sources.md` §Move 1 caveats.
- Evidence: *"the goal-divergence channel can stay open against multiple sources: with several senders and a multidimensional state, even arbitrarily large divergence need not protect the receiver ([Battaglini 2002])."*
- Battaglini's result is the opposite. With two senders and a multidimensional state, *full revelation* is achievable even for large biases: multiple senders can **close** the channel.
- Fix: cite it as a design lever (cross-examine multiple biased experts), not a caveat. **S**

**P1-2. Further misattributed citations** (all real papers, wrong claims attached). **S** each, about 2 h total:
- `untrustworthy-sources.md`: *"[Stackelberg security games](https://arxiv.org/abs/1401.3888) (Conitzer & Sandholm 2006 …)"*. arXiv 1401.3888 is Korzhyk, Yin, Kiekintveld, Conitzer & Tambe, "Stackelberg vs. Nash in Security Games" (JAIR 2011). Cite Conitzer & Sandholm EC'06 separately, plus Tambe's *Security and Game Theory* (2011).
- `untrustworthy-sources.md` (twice): arXiv 2410.21360 is labelled *"fallacy-detection literature"* / *"Fallacy & persuasion-technique detection"*. It is Srba et al., "A Survey on Automatic Credibility Assessment Using Textual Credibility Signals". Relabel it, or cite actual fallacy-detection work (e.g. Jin et al. 2022 "Logical Fallacy Detection"; SemEval-2023 Task 3 on persuasion techniques).
- `hardening-verifiability.md`: the Held-out retrodiction row cites *"[Mallen 2023](https://arxiv.org/abs/2312.01037)"*. That is "Eliciting Latent Knowledge from Quirky Language Models" and is not about retrodiction.
- `hardening-invariance.md`: the Breakdown-point row cites *"[Donoho & Huber 1983](https://doi.org/10.1214/aoms/1177703732)"*. That DOI is Huber 1964. Donoho & Huber 1983 is a chapter in the Lehmann Festschrift ("The notion of breakdown point") and has no such DOI.
- `hardening-invariance.md`: the Identity-masking gap row cites *"[Lundh 2017]"*. Lundh doesn't test masking; cite blinded-review or masked-affiliation studies instead.
- `hardening-incentives.md` / `hardening-independence.md`: *"decision scoring rules keep elicitation honest even when the forecast feeds a decision ([Singh et al. 2025])"*. arXiv 2503.16395 is "Truthful Elicitation of Imprecise Forecasts". The canonical cites are Othman & Sandholm 2010, Chen, Kash, Ruberry & Shnayder 2014, and Oesterheld & Conitzer 2020; EIA already cites the last of these. Also, "Collusion-bounded peer prediction … truthful iff inter-agent non-truth MI < threshold" is attributed to Shnayder 2016, which proves no such collusion bound.
- `consistency-evals.md`: *"debate and control results extract useful oversight from demonstrably Dutch-bookable judges ([Khan et al. 2024])"*. Khan et al. don't show the judges are Dutch-bookable.
- `identity-and-track-records.md`: *"The Kim et al. correlation holds *across* providers, which points to shared training data more than shared lineage."* The paper names shared architecture and provider as drivers and finds high correlation among accurate models even across providers. The "training data" inference is the wiki's own. Flag it as an inference.
- `hardening-verifiability.md`: *"the PCP theorem, under which a proof can be verified by reading $O(1)$ random bits"*. It reads O(1) *proof* bits using O(log n) random bits.

**P1-3. "Correlated error is largely undefended — the field's biggest hole" is overstated, and ignores both the literature and the sibling wiki.**
- Where: `hardening-techniques.md` threat table; `untrustworthy-sources.md`; `hardening-independence.md`.
- Missing: common-cause-failure engineering (nuclear beta-factor, alpha-factor and MGL models) and the classic N-version-programming refutation, Knight & Leveson 1986. Avizienis 1985 is cited *without* it, which is a notable omission given the argument.
- `apps/delegation-risk/.../research/trust-behavior/correlated-failure-modeling.md` (5.2k words) covers exactly this. RRP has **zero** links to delegation-risk.
- Fix: soften to "no AI-specific defense", cite CCF and Knight & Leveson, and link the sibling page. Consider importing the beta-factor model as the $n_{\text{eff}}$ estimator the Independence open question asks for. **S–M**

**P1-4. Deterrence: "bounded by penalty, not verification spend" contradicts its own formula.**
- Where: `hardening-deterrence.md`; repeated in `hardening-techniques.md`.
- Evidence: *"**Robustness is bounded by the maximum enforceable penalty, not by verification spend**"* and *"Deterrence is the unique family that raises the corruption axis *without* raising the information axis."*
- $S^\*=(c+pB)/(1-p)$ scales with the *product* $pB$, and every escalation at rate $p$ costs $p\cdot C_{\text{audit}}$ of real verification. The $B=0$ comparison is fair. The slogan is not.
- The Catalogue frames the same mechanism as "composition with randomized escalation", while Hardening says "only deterrence" reaches the empty quadrant. Unify them.
- Fix: "robustness scales with *expected* penalty $pB$; with enforceable $B$, a small $p$ suffices", plus an honest-path cost line $p\,C_{\text{audit}}$. **S**

**P1-5. The Process Catalogue map is circular, and the table is missing obvious rows.** — `process-catalogue.mdx`, `components/ProcessMap.astro`.
- The coordinates are hand-assigned from L/M/H judgments. The "empty quadrant — nothing lives here yet" headline is therefore an artifact of those judgments, not a finding.
- "Output-metered producer market" is the book's own *hypothetical* proposal, plotted as if it were an existing process.
- Missing rows that bear directly on the empty-quadrant claim:
  - X/Twitter **Community Notes** (bridging-based ranking: cheap and designed for manipulation resistance; the most obvious candidate for that quadrant);
  - Wikipedia;
  - Delphi;
  - **adversarial collaboration**;
  - bug bounties / red teams;
  - **LLM forecasting-bot ensembles** (Metaculus AI benchmark).
- Fix: mark hypothetical rows visually, add a "how coordinates were assigned" note, and add these rows or explain why they're excluded. **M**

**P1-6. Missing foundational literature for the book's own positioning** (the neighbors table in `introduction.md` and the chapter lineages):
- **Iterated amplification / IDA** (Christiano et al. 2018, arXiv 1810.08575). It is never cited, though the book is about weak principals extracting reliable judgment.
- **Superforecasting science** beyond one Tetlock mention: Mellers et al. 2014/2015 on teaming, training, extremizing and tracking. It is the empirical base for the "Track-recorded forecaster team" row.
- **Adversarial collaboration** (Kahneman; Clark & Tetlock 2021): a canonical human robust-reasoning process, absent.
- **AHP** (Saaty, the Analytic Hierarchy Process). `constructing-utility-functions.md` claims QURI's work is *"the most complete attempt we know of at eliciting ratio-scale relative values"*. AHP *is* ratio-scale pairwise elicitation with a consistency index, and it is the obvious comparator.
- **Process supervision / PRMs** (Lightman et al. 2023) and **RL from verifiable rewards**. These are the industrial form of "verifiability asymmetry" (Ch. 13) and how 2025–26 reasoning models are actually trained.
- **Inspection games** (Avenhaus, von Stengel & Zamir 2002): cited only as "(inspection games)". **Judgment-proofness** (Shavell 1986).
- **Process reliabilism** (Goldman 1979). The intro invokes "the epistemology of reliable processes" without citing the theory the book is named after in all but word.
- Fix: one paragraph or row each. **M** in total.

**P1-7. `REVISION_PLAN.md` was left largely undone.** Verified against the current tree:
- Phase 2 (readability): **not done**.
  - Measured now: 6 pages above 24 words/sentence. Highest are Cruxes (29.7), Funding Effect (28.8), Constructing Utility Functions (28.7), Reliability Ladder (28.5) and LLM Epistemics in Production (28.2).
  - Catalogue's "Two kinds of built-in bias" paragraph is still about 287 words.
  - Both duplicates the plan named are still present: the min-cut composition paragraph (Catalogue "Cheap and robust don't yet coexist" ≈ Hardening "Composition") and the tail-calibration lever (Hardening "The objective" ≈ Calibration "The lever", near-verbatim).
- Phase 3 (Ch. 18, 20–22): **not started**. The sidebar has two placeholder entries linking to `/#the-book`.
- Phase 4: harness built, **no runs**. The funding-effect LR estimation and correlated-error measurement are not started.
- Phase 5:
  - Link checking in CI is **done** (`.github/workflows/ci.yml` runs `check-built-links.py`).
  - Part-based directories and redirects: **not done**.
  - Ignored `sidebar.order` frontmatter: **still present on 20 pages**.
- Status lines: every page except Ch. 19 still says *"updated June 2026"* despite the Sept 2026 review. `version.json` says `lastBuildDate: 2026-06-10`.
- Fix: run Phase 2 per the plan's own method, update status lines, drop `sidebar.order`. **M**

**P1-8. Untrustworthy Sources (Ch. 6) is too long and has a logic gap.** — `concepts/untrustworthy-sources.md` (5,006 words, 2× the next-longest chapter).
- Length: it holds a chapter, a measurement program and a 12-row prior-art appendix. Split the appendix into a Reference page and cut the body by about 35%.
- Logic: the runtime ladder's rung 1, *"**Aligned?** If the source's preferred $D$ ≈ mine here, there is nothing to deceive toward — **use it**"*, is circular. Alignment on $D$ is the very thing the listener is uncertain about; the page itself says the relevant object is "the listener's uncertainty over the source's goal-divergence". Rung 1 needs an evidence standard, such as a label-swap result or structural incentive alignment.
- Missing failure mode: rung 6 ("refuse to process the content") is itself exploitable. Whistleblowers and true-but-unverifiable warnings get discarded, and an adversary can push an honest source into rung 6 by creating doubt about it. That needs a sentence.
- Unsupported claim: *"a century of hearsay doctrine distilled into a likelihood ratio"* and the claim that Friedman's bet example is "footnote-level" need a pinpoint citation.
- Effort: **M**

**P1-9. Overlap and missing cross-links with the sibling wikis.**
- evaluation-engineering:
  - `patterns-and-failure-modes.md` and `evaluation-systems-in-the-wild.md` overlap the Ch. 6 prior-art appendix (Admiralty, GRADE, Daubert, Wikipedia, PageRank/EigenTrust) and the Catalogue's "documented corruption" paragraph.
  - `llm-evaluators.md` overlaps the Catalogue's LLM rows, Consistency Evals and opinion fuzzing.
  - Planned Ch. 22 overlaps EE's `epistemic-culture.md` (the plan already notes this).
- delegation-risk (**zero inbound links from RRP**):
  - `correlated-failure-modeling.md` overlaps Independence and the "biggest hole" claim.
  - `byzantine-coordinator-voting.md` overlaps Invariance's Byzantine aggregation.
  - `insurers-dilemma.md` and `fidelity-insurance.md` overlap Deterrence bonds, escrow and Ch. 20 "Market for Truth".
  - `trust-propagation.mdx` overlaps Ch. 19's EigenTrust row.
  - `ai-debate-entanglement.md` overlaps Ch. 8 debate.
- Fix: add a "Neighbors" row for delegation-risk in `introduction.md`; link rather than re-derive; move the Ch. 6 prior-art appendix to EE or merge it with EE's catalogue. **S–M**

**P1-10. Cruxes page: no credences, no updates, and a contested framing.** — `start-here/key-questions.md`.
- Four clusters of bullet questions, none with a probability, a "current lean", or an update since 2024. From QURI this reads as a missed demonstration of the book's own method.
- The page also still calls "What is a strong reasoner?" *"the original framing questions of the wiki"*, which signals the drift in P0-4.
- Fix: a table of crux, 2024 lean, 2026 lean, evidence since, and what would flip it. **M**

**P1-11. The Overseeing Automated Research pilot is concrete but unrun, and it is the cheapest flagship test.** — `proposals/overseeing-automated-research.md` §A pilot.
- The four-step pilot is the best "implementable" proposal in the book. QURI could run it reflexively on its own 2025–26 posts.
- It lacks a budget, an owner, a success threshold beyond "divergences are the deliverable", and a named consumer model.
- Fix: add a one-paragraph protocol covering N questions, which model, cost estimate, pre-registered failure criteria and timeline. Or run it. **S** (spec) / **L** (run)

**P1-12. Ch. 1 inconsistencies and boilerplate.** — `start-here/introduction.md`.
- Status line: *"a deliberately small textbook (~20 chapters…)"*, but the ToC has 26 numbered chapters plus an interlude.
- "This quantity is **[exact]**" for epistemic weight is fine, but the page then calls the corruption cost curve "the field's namesake" without noting it has never been measured for any process.
- Fix: update the count; add one sentence saying what has and hasn't been measured. **S**

### P2 — polish

**P2-1. Notation collisions.** Fix by assigning distinct symbols and updating the glossary. **S**
- $I$ is both an information set (EIA) and mutual information $I(Q;X)$ (Core Model §5).
- $c$ is confidence (Calibration), corruption cost of the cheap stage (Deterrence) and $c_{process}$.
- $f$ is the spot-check fraction (Verifiability) and the fine-but-pushed rate (Independence).
- $A$ is the agent (EIA) and answers $A_1, A_2$ (Consistency).
- $D$ is a decision and $D_{KL}$.
- $k$ is the funding multiplier, the number of signals, and $k_R$ auxiliaries.

**P2-2. LLM-prose tics and template smell.** Fix in the Phase 2 pass: ban-list "honest", "exactly", "load-bearing", "the point" outside technical uses; collapse the summary/status/summary pattern into one line. **M**
- "honest" appears about 57 times: "The honest pattern is itself the finding", "The honest map", "The honest center of uncertainty", "the honest differences", "with the honest caveat".
- "exactly" appears 12 times in Ch. 6.
- "load-bearing" appears 15 times.
- Many "not X but Y" and "X, not Y" inversions ("a feature, not a failure"; "a rating, not an adjective"; "a design checklist, not facts about the world").
- Em-dash density is 2–3 per 100 words on most pages.
- Every page opens with an italic abstract, then a near-identical Status admonition ("Draft v0 · updated June 2026 · maintained by QURI… Positions here are exploratory, not settled"), then often a "Summary" that repeats the abstract (EIA, Consistency Evals).
- Hardening family pages share an identical template ("The lever, its limit, the constructions with their cheapest attacks, and two worked bounds with numbers"). The template is useful, but its boilerplate sentence repeats six times.

**P2-3. "Min-cut" is used loosely.** `process-catalogue.mdx` and `hardening-techniques.md`: *"its corruption cost is the **min-cut** over attack paths"*. For an attacker who needs one successful path, the cost is a min-cost path in an AND/OR attack tree. Min-cut is the defender's dual. Use attack-tree language (Schneier 1999; Mauw & Oostdijk 2005). **S**

**P2-4. Herding nuance.** `hardening-independence.md` treats copying the median as purely destructive. Social influence can improve crowd accuracy in some network structures (Becker, Brackbill & Centola 2017) and harm it in others (Lorenz et al. 2011). Add one sentence. **S**

**P2-5. Glossary gaps.** `reference/glossary.md` is missing tail calibration, breakdown point, $n_{\text{eff}}$, corruption-capacity curve, persuasion budget, inspection-game frontier, $k$ (funding multiplier) and deterrence affordance. It also defines "Opinion fuzzing" as owned by Consistency Evaluations, when the source is a QURI post. **S**

**P2-6. Unit economics grade.** `core-model.md` §3 is labelled **[standard shape]** but its text calls it *"An accounting identity"*. Pick one. **S**

**P2-7. Squiggle AI and RoastMyPost figures are dated** (2024–early 2025). If newer usage or eval data exists, update it; otherwise date-stamp the section. **S**

**P2-8. Reliability Ladder ordering.** `epistemic-applications.md` concedes in its open questions that tier 3 (faithfulness) may be harder than tier 4, yet presents the ladder as ordered. Either argue the order or present the tiers as a partial order. **S**

**P2-9. The harness README is not linked from the site, and the "Anthony vs Ted" example is the only name pair.** Once results exist, publish a summary page and link it from Catalogue, Invariance and Glossary. **S**

---

## Per-page triage

| # | Page | Words | Verdict | Main issue(s) | Effort |
|---|---|---|---|---|---|
| — | `index.mdx` | 821 | Revise | "new field / periodic table" framing (P0-4); placeholders | S |
| 1 | `start-here/introduction.md` | 1234 | Revise | "~20 chapters"; missing IDA, delegation-risk and superforecasting neighbors (P1-6, P1-9, P1-12) | S |
| 2 | `start-here/key-questions.md` | 1083 | Rewrite | 2024 cruxes, no credences, no updates (P1-10, P0-5) | M |
| 3 | `concepts/core-model.md` | 2080 | Keep, fix | LR<1 framing; §3 grade; strongest chapter otherwise (P0-2) | S |
| 4 | `proposals/epistemic-impact-analysis.md` | 2152 | Keep, trim | Dense; good lineage; duplicate Summary | S–M |
| 5 | `concepts/constructing-utility-functions.md` | 1570 | Revise | Missing AHP; "most complete attempt" overclaim; 200-word paragraph; propose cheap LLM re-run of the 2022 experiments | M |
| 6 | `concepts/untrustworthy-sources.md` | 5006 | Cut ~35%, split appendix | Battaglini reversed; Stackelberg cite; rung-1 circularity; length (P1-1, P1-2, P1-8) | M |
| I | `case-studies/the-funding-effect.md` | 1125 | Fix math | LR derivation wrong; confounding; "cost curve" mislabel (P0-1) | M |
| 7 | `concepts/process-catalogue.mdx` | 2343 | Revise | Circular map; hypothetical row plotted; missing rows; 287-word paragraph; duplicate min-cut (P1-5, P1-7) | M |
| 8 | `concepts/oversight-protocols.md` | 2254 | Keep, add | Good; add IDA, CoT monitorability, Polymarket/UMA case | S–M |
| 9 | `proposals/consistency-evals.md` | 2083 | Keep, fix | Khan misattribution; duplicate Summary | S |
| 10 | `concepts/what-is-a-strong-reasoner.md` | 1445 | Major revise | Stale evidence; no "how to build" (P0-4, P0-5) | L |
| 11 | `concepts/hardening-techniques.md` | 1249 | Revise | Deceiver overclaim; duplicates; "biggest hole" overstated; "only deterrence" (P0-2, P1-3, P1-4) | S–M |
| 12 | `concepts/hardening-calibration.md` | 766 | Fix | ε definition; Kleinberg mis-cite (P0-2) | S |
| 13 | `concepts/hardening-verifiability.md` | 800 | Fix | Mallen mis-cite; PCP wording; add PRMs/RLVR | S |
| 14 | `concepts/hardening-independence.md` | 809 | Fix | Knight & Leveson missing; Shnayder collusion attribution; herding nuance | S |
| 15 | `concepts/hardening-invariance.md` | 852 | Fix | DP bound wrong; Donoho & Huber DOI; Lundh row | S |
| 16 | `concepts/hardening-incentives.md` | 691 | Fix | Persuasion-budget "[exact]"; Singh mis-cite | S |
| 17 | `concepts/hardening-deterrence.md` | 891 | Fix | "not verification spend" slogan; provenance-bond reuses P0-1 error; inspection-game cite | S |
| 18 | *Certification and Gyms* | — | Write or remove placeholder | Capstone promised in 3 places | L |
| 19 | `environment/identity-and-track-records.md` | 2406 | Keep | Best-written chapter; one Kim over-reach; add TEEs/attestation, UMA-style bonded oracles, slashing | S |
| 20–22 | *Markets, Law, Culture* | — | Write, or collapse into one "Environment: open territory" page | Placeholders | L |
| 23 | `concepts/epistemic-applications.md` | 1188 | Revise | Tier ordering unargued; 28.5 words/sentence | S–M |
| 24 | `proposals/overseeing-automated-research.md` | 1775 | Keep, spec the pilot | Add AI-scientist systems; superalignment link stale (P1-11) | S–M |
| 25 | `case-studies/llm-epistemics-in-production.md` | 1478 | Update with data | Run the two cheap evals it calls for (P0-3) | M |
| 26 | `open-questions/index.md` | 501 | Keep | Add Funding Effect, Hardening pages and Interlude to the by-chapter list (they are missing) | S |
| — | `reference/glossary.md` | 1719 | Fix | Notation collisions, missing terms (P2-1, P2-5) | S |
| — | `experiments/label-swap/` | — | Fix, then run | 6 validity bugs; never run; not on site (P0-3) | M |
| — | `REVISION_PLAN.md` / `CLAUDE.md` | — | Update | Mission vs. site mismatch; plan phases unmarked | S |

---

## Missing chapters / content

1. **Planned but unwritten** (sidebar placeholders linking to `/#the-book`):
   - Ch. 18 *Certification and Gyms*: the promised capstone, one hardened stack with a measured corruption cost. Referenced from Hardening overview, Catalogue and `REVISION_PLAN.md`.
   - Ch. 20 *The Market for Truth*.
   - Ch. 21 *Law, Liability, and Private Deliberation*.
   - Ch. 22 *Culture, Consent, and Adoption* (coordinate with EE's `epistemic-culture.md`).
   - Recommendation: write Ch. 18 first, built around the label-swap harness and a small paid red-team. Collapse 20–22 into a single "Environment: open territory" chapter until research sweeps exist, rather than carrying three dead links.
2. **Building Strong Reasoners** (new, Part II). This is the "how to build toward them" half of the stated mission. Topics:
   - training for calibration and abstention;
   - RL on resolved forecasting questions;
   - retrieval/scaffold vs. base-model gains, with 2024–26 evidence;
   - ensembling and extremizing of LLM forecasts;
   - reasoning models and what test-time compute does and doesn't buy for judgment;
   - CoT monitorability as an audit channel.
3. **State of the Evidence, 2026** (new, or a large section in Ch. 10): ForecastBench and Metaculus AI benchmark trajectories, silicon-crowd results, LLM judge-bias literature since 2024, debate/oversight empirical results through 2026 (some already cited in Ch. 8; consolidate).
4. **Measurement log / Results** (new): label-swap results, RoastMyPost flag precision, Squiggle AI calibration, funding-effect LR estimate. Each replaces one L/M/H cell, as the plan intends.
5. **Running worked example.** The AI-advocate thread in Ch. 6 is the only one. A single example carried from Ch. 3 to Ch. 23 (e.g. "a funder evaluating an AI-produced research claim") would tie the abstractions together.
6. **Self-application.** The intro says "the field must apply to itself". Run RoastMyPost or a consistency battery over this book and publish the result. It is cheap, on-brand, and credible.

---

## Top 5 recommendations

1. **Fix the grade integrity first (P0-1, P0-2).**
   - Correct the Funding Effect likelihood-ratio derivation; a pure multiplier cancels.
   - Then audit every **[exact]**/**[standard shape]** tag: persuasion budget, DP bound, tail-calibration ε, Kelly citation, LR<1 framing, the "deceiver by construction" claim.
   - The grading scheme is the book's main credibility asset; a single reviewer catching the funding-effect error would undercut it. *(About 1–2 days.)*
2. **Produce the first real measurements (P0-3).**
   - Fix the six harness bugs, especially the ill-posed forecast/debate templates and the label-digit parse bug.
   - Run it on 5 current models (costs cents) and publish a short results page, nulls included.
   - Then run the two cheap in-house evals the book itself calls for: a RoastMyPost precision sample and Squiggle AI calibration. This turns "a field about measurement" from a claim into a practice. *(About 3–5 days.)*
3. **Resolve the thesis and update the evidence (P0-4, P0-5, P1-10).**
   - Decide between "textbook for a new field" and "research agenda for strong reasoners", and align `CLAUDE.md`.
   - Add a "Building Strong Reasoners" chapter and a 2026 evidence section.
   - Rewrite Cruxes with credences and 2024 → 2026 movement. *(1–2 weeks.)*
4. **Citation and literature repair (P1-1, P1-2, P1-3, P1-6).**
   - Fix the reversed Battaglini citation and the 9 misattributions listed.
   - Add IDA, AHP, Knight & Leveson / common-cause failure, superforecasting, adversarial collaboration, Community Notes, PRMs/RLVR, inspection games and process reliabilism.
   - Soften "correlated error is undefended". *(About 1–2 days.)*
5. **Finish the revision plan's structural work (P1-7, P1-8, P1-9, P2-2).**
   - Readability pass: cut Ch. 6 by about 35% and split its appendix; remove the two duplicates; kill the "honest/exactly/load-bearing" tics.
   - Refresh status lines; drop `sidebar.order`.
   - Cross-link delegation-risk; deduplicate against EE.
   - Write Ch. 18 as the capstone, or remove the dead placeholders. *(1–2 weeks.)*

---

## Finding counts

- **P0:** 5 (P0-2 bundles 6 grade errors; P0-3 bundles 6 harness defects)
- **P1:** 12 (P1-2 bundles 9 misattributions)
- **P2:** 9
- Citations checked: 70/70 arXiv IDs real. 11 misattributed or misdescribed in total (Battaglini; the 9 in P1-2; Kleinberg in P0-2). 0 fabricated.
