# Audit: Evaluation Engineering wiki (apps/evaluation-engineering)

*Audited 2026-10-15. Scope: all 20 pages in `src/content/docs` (~24.1k words, every page read in full), `astro.config.mjs`, `CLAUDE.md`, `REVISION_PLAN.md`. I also checked links in both directions with `apps/reasoning-processes` (RRP). No repo files were edited.*

All paths below are relative to `apps/evaluation-engineering/src/content/docs/` unless they say otherwise.

---

## Overall verdict: 5.5 / 10

**Strengths.**
- The two newest chapters are good. *LLMs as Evaluators* has a falsifiable claim, clear system-level failures and a usable 6-step design pattern. *Worked Example* gives costs and binomial arithmetic.
- The *Patterns & Failure Modes* synthesis is a strong, mostly accurately cited literature review. I spot-checked about 35 citations there and in the LLM chapter (Muchnik, Bornmann, Halawi, Sclar, McAleese, Gao, Kim, Goel, Manheim & Garrabrant, Lizzeri, Dranove, Jin & Leslie, Resnick, Nosko & Tadelis, Pallais, and others). Nearly all IDs and figures check out.
- The catalogue of ~110 systems is a real asset.
- The Phase 1 fixes were real: the amplification-figure correction and the renumbering.

**Why it is not higher.**
1. **The thesis is under-specified and never reconciled with the book's own evidence.** Part III's headline finding is "funding structure predicts trustworthiness better than methodology". That cuts against an *engineering* thesis, and nothing in Ch. 1 or Ch. 5 absorbs it.
   - The organizing frame "accuracy × quantity × cost" leaves out robustness to gaming and legitimacy. The book's own evidence says these two decide outcomes.
2. **The positioning against existing work is badly out of date, and in two places wrong.**
   - "Evaluation engineering" is now an established industry term for LLM-application evals: eval-driven development, the Husain/Shankar AI-evals curriculum, Inspect, METR, AISI. The wiki never mentions this name collision.
   - The LLM chapter says robustness under optimization has "no direct evidence at all". In fact there is a direct literature on attacking LLM judges, plus a 2025 real-world incident.
   - The flagship technique (predict an expensive evaluator on a random audited subset) has a large real-world instance, DARPA SCORE / Replication Markets, and a standard statistical method, prediction-powered inference. Neither is cited.
3. **The arc is incomplete.** REVISION_PLAN Phases 2–5 are all undone:
   - the capability ladder is mentioned 5 times and never written;
   - there is no quantitative core;
   - there are no real case studies;
   - the 2021-era chapters (Components, Methods, Techniques, Culture, Use Cases) are still mostly uncited assertion.
4. **The worked example has a statistical flaw at its centre.** It uses raw % agreement with no base-rate or chance correction, and it infers a ~70% binary agreement from an ICC. Its main comparison could be measuring chance.
5. **LLM-prose texture remains in the older pages:** bold-everything, "Profile: **…**" templates, superlatives, and a slogan in the hero.

As a working draft it beats most EA Forum agendas. Against a Gwern/LessWrong reference-work bar it is about halfway there.

---

## Thesis, as reconstructed

> (1) The bottleneck in evaluation has moved from *one good evaluation* to *ten thousand adequate ones at known cost*, which is a systems-engineering problem. (2) Design by divide-and-conquer: push work from judgment-bound evaluation into verifiable estimation. (3) LLMs are the cheap executor the 2021 architecture lacked. (4) The core pattern is prediction–evaluation: a cheap layer predicts a trusted, expensive evaluator, a hidden random subset is audited, and quality is benchmarked against panel–panel agreement. (5) Culture and capture, not technique, are the binding constraints.

**Assessment.**
- (4) is the sharpest and most defensible part. It is not novel, but it is a good synthesis, and the book should own it as the centrepiece.
- (1) and the "all you need" slogan are rhetorical and unmeasured. The book admits this (Objections: "'plausibly more resources' is an unmeasured claim").
- (2) is untested. No page estimates the fraction of evaluation questions that can be demoted to estimation (Crux 3).
- (5) sits in tension with (1). That tension is the book's most interesting idea and it goes unexplored.

---

## P0: correctness and thesis-level problems (fix first)

### P0-1. "No direct evidence" of judges failing under optimization is false
- **File:** `concepts/llm-evaluators.md`
- **Evidence:** "The third part, holding up under pressure, has no direct evidence at all, and it is what decides whether LLM evaluation is engineering or a demo."
- **Problem:** Direct evidence exists:
  - Zheng et al. 2024/ICLR 2025 oral, *Cheating Automatic LLM Benchmarks: Null Models Achieve High Win Rates* (arXiv 2410.07137). A constant "null" response reached an 86.5% length-controlled win rate on AlpacaEval 2.0, 83.0 on Arena-Hard-Auto and 9.55 on MT-Bench.
  - Adversarial attacks on LLM judges, e.g. Raina et al. 2024, *Is LLM-as-a-Judge Robust?* (universal adversarial phrases), and 2025 "one token to fool" style work.
  - Wen et al. 2024, *Language Models Learn to Mislead Humans via RLHF*. The evaluator is a human, but the Goodhart dynamic is the same.
  - **A real-world incident:** in July 2025 hidden prompt-injection text ("give a positive review only") was found in arXiv preprints aimed at LLM-assisted peer reviewers (Nikkei Asia report). This is exactly the "evaluated party optimizes against the judge" case, in the wild, in a judgment-bound domain.
- **Proposed change:**
  - Rewrite the sentence as "direct evidence exists and is uniformly negative for undefended judges".
  - Add a short "Evidence under pressure" subsection with these items.
  - Update Glossary/Objections to match.
- **Effort:** S–M

### P0-2. "Judgment without ground truth … barely measured" ignores the closest literatures
- **File:** `concepts/llm-evaluators.md`
- **Evidence:** "For judgment without ground truth … agreement has barely been measured", and the open question "For which classes of *judgment-bound* questions … has LLM–panel agreement been measured at all".
- **Problem:** Three relevant literatures are missing:
  - **Automated essay scoring.** Decades of "machine–human agreement vs. human–human agreement" (QWK) as the formal validity criterion; see Williamson, Xi & Breyer 2012, *A Framework for Evaluation and Use of Automated Scoring*. This is literally the worked example's "panel–panel bar", with an operational standard (e.g. machine–human QWK within 0.1 of human–human).
  - **LLM peer review.** Liang et al. 2024 (*NEJM AI*, "Can LLMs provide useful feedback on research papers?") found GPT-4/human comment overlap comparable to human/human overlap. Liang et al. 2024, *Monitoring AI-Modified Content at Scale*, estimated 6.5–16.9% of ICLR/NeurIPS reviews were substantially LLM-modified. There are also the ICLR 2025 review-feedback-agent RCT and the AAAI-26 AI-review pilot.
  - **Grant review / replication prediction with LLMs.**
- **Proposed change:** Replace "barely measured" with a short review of these three, and state precisely what remains unmeasured: normative, long-horizon evaluation under adversarial pressure.
- **Effort:** M

### P0-3. The worked example's headline comparison has no chance correction and a mismatched baseline
- **File:** `concepts/worked-example.md`
- **Evidence:**
  - The assumption table says "Agreement of two independent expert panels on the renew/don't decision | unknown; assume ~70% | … peer-review meta-analysis finds mean agreement ICC ≈ 0.34".
  - Later: "50 audits distinguish 'the model agrees with experts about as often as experts agree with each other' (around 70% …) from 'the model is near chance'".
- **Problems:**
  - **Chance agreement depends on the base rate.** If ~80% of grants are renewed (plausible for "renewed on momentum"), chance agreement is 0.8² + 0.2² = 68%. Then "70% agreement" is roughly *chance*, and model and panel could both be uninformative. This is the classic kappa paradox.
  - **An ICC on continuous scores does not convert to a binary % agreement** without a threshold and a base rate. The citation does not support the 70%.
  - **"Expert" vs "panel" is inconsistent.** The cost row is one expert at \$600, but the comparison is to "the panel". A 3-person panel would cost \$1,800 per item.
  - **The baseline itself must be measured.** The design never costs this. It needs ≥50 double-reviewed items, i.e. +\$30k, which roughly doubles design C's cost. This should be in the table.
- **Proposed change:**
  - Add the renewal base rate as an explicit assumption.
  - Report Cohen's κ (or AC1/Krippendorff's α) alongside raw agreement.
  - Compute chance agreement.
  - Add a "measure the panel–panel baseline" line item, priced.
  - Make the panel size explicit.
  - Keep the binomial table, which is arithmetically correct (±11.1, ±7.8, ±5.5, ±13.6).
- **Effort:** S–M

### P0-4. The flagship technique ignores its largest real-world test and the standard statistics for it
- **Files:** `concepts/techniques.md`, `concepts/worked-example.md`
- **Evidence:** "This isn't only theory. The idea was first written up as … (2018) and tested in … (2019)". Only QURI's own 19-forecaster experiment is cited.
- **Missing:**
  - **DARPA SCORE / Replication Markets** (2019–2023). Forecasters and algorithms scored thousands of social-science claims, and a subset was replicated. It is the largest prediction–evaluation system ever run, and its results (market accuracy ~70%+ on replicated claims) bear directly on Crux 8.
  - Also Dreber et al. 2015 (*PNAS*) and Camerer et al. 2016/2018, on prediction markets for replication.
  - **Prediction-powered inference** (Angelopoulos et al., *Science* 2023) and the active-inference follow-ups. These are the formal method for "model labels everything, humans label a random subset, get unbiased estimates with tighter CIs". Design C *is* PPI. The "audit the decision boundary, then reweight" refinement is Horvitz–Thompson / stratified estimation and should be named.
  - **Trust or Escalate** (Jung, Brahman & Choi, ICLR 2025): selective LLM-judge cascades with a provable human-agreement guarantee. This is the LLM chapter's design-pattern step 5, with theory.
- **Proposed change:** Add these to Techniques ("Evidence" sub-section), to the LLM chapter design pattern, and to the Worked Example (one paragraph: "with PPI the 50 audits yield an accuracy-corrected estimate of the *renewal rate itself*, not just agreement").
- **Effort:** M

### P0-5. Thesis contradiction: "funding beats method" vs. an engineering thesis
- **Files:** `start-here/introduction.md`, `concepts/the-systems-view.md`, `concepts/evaluation-systems-in-the-wild.md` (lesson 1), `concepts/patterns-and-failure-modes.md` (synthesis 2)
- **Evidence:**
  - Patterns: "Funding structure predicts trustworthiness better than methodology."
  - Intro: "this is an engineering problem with engineering answers"; "optimizing any single evaluation is usually the wrong objective; you optimize the system."
- **Problem:** If who pays matters more than method, then the central design variables are institutional, not technical. The book should say what that implies: is incentive design part of "engineering"? The "Funding and incentives" bullet in Ch. 5 gestures at this but never connects it to the Part III result.
- **Evidence-quality issue:** the "funding predicts" claim is itself supported only by hand-picked contrasts (Consumer Reports vs. credit ratings), never by coding the catalogue.
- **Proposed change:**
  1. Add a section to Ch. 5, "Two kinds of design variable: technical and institutional", that treats funding/payer, metric ownership and appeal rights as first-class design parameters.
  2. Code the ~110 catalogue entries (payer model × documented failure type), publish the cross-tab, and state the claim with that count. This turns an anecdote into the book's one quantitative empirical result.
- **Effort:** M (section) + M (coding)

### P0-6. The core design frame omits the dimensions the book says matter
- **File:** `concepts/the-systems-view.md`
- **Evidence:** "Every evaluation system is a point in a three-way trade-off: Accuracy … Quantity … Cost … You can usually buy more of any two by giving up the third."
- **Problems:**
  - Cost is total cost (= quantity × unit cost), so this is not three independent axes. The "pick two" framing is a trope, not a model. The real frontier is accuracy vs. cost-per-item, with quantity a scale choice and fixed vs. marginal costs separated (Methods already uses "setup vs. marginal").
  - It omits robustness to optimization pressure (the LLM chapter's own conclusion: "a judge's validity is indexed to the optimization pressure it was validated under") and legitimacy/trust (the defining property of "evaluation" in Ch. 2). It also omits latency.
- **Proposed change:** Redefine the design space as accuracy, unit cost (fixed + marginal), robustness under pressure, and legitimacy, with quantity as the scale parameter. Give one small formula, e.g. value ≈ N·(ΔDecision value per item) − (F + N·c), and point to RRP's Core Model "unit economics" and "pricing information" sections rather than re-deriving them. Update the glossary entry.
- **Effort:** M

### P0-7. The name collides with an established 2025–26 usage and is never acknowledged
- **Files:** `start-here/introduction.md`, `start-here/lineage.md`, `start-here/estimation-vs-evaluation.md`, `start-here/key-questions.md` (Crux 12)
- **Evidence:** Estimation vs. Evaluation says "The priority is honest categories that won't collide with existing terminology."
- **Problem:** In 2026, "evals"/"eval engineering" overwhelmingly means building test suites and LLM judges for AI products and models (AI-evals practitioner courses, eval-driven development, UK AISI's Inspect, METR, Epoch benchmarks, "evaluation science"). A reader arriving from that world will be confused. Conversely, that community is the most likely large audience for the audit-the-cheap-layer material.
- **Proposed change:** Add a section to Ch. 1, "What this is not: AI model evals (and where they overlap)". Map the overlap explicitly: LLM-judge validation, construct validity, eval error bars (Miller 2024, *Adding Error Bars to Evals*), benchmark Goodhart (*The Leaderboard Illusion*, Singh et al. 2025). Decide whether to rename or to own the overlap.
- **Effort:** S–M

### P0-8. The planned chapters were never written; the book's arc is incomplete
- **Files:** `REVISION_PLAN.md`, `concepts/the-systems-view.md`, `start-here/introduction.md`, `reference/glossary.md`, `open-questions/index.md`
- **Evidence:**
  - "Draft the capability ladder. Mentioned five times, never written." It is still unwritten.
  - Intro: "Building one is open work".
  - Glossary defines "Advanced evaluation system" by reference to a ladder that does not exist.
- **Not done from the plan:**
  - Phase 2 (methods comparison table from catalogue systems; tested / deployed / untested status lines on Techniques; ladder v0 graded on 5 real systems).
  - Phase 3 (quantitative core).
  - Phase 4 (real case studies: a RoastMyPost/Squiggle AI throughput write-up).
  - Phase 5 (shared culture chapter with RRP Ch. 22; Patterns as the shared evidence layer, partly happening organically).
  - The "what would flip this" question about readership (funders vs. practitioners) was never answered.
- **Proposed change:** Do Phase 2 first. Then write the ladder and reuse RRP's 5-tier "Reliability Ladder" (`apps/reasoning-processes/src/content/docs/concepts/epistemic-applications.md`) as a sibling or template, so the two books don't invent incompatible ladders.
- **Effort:** L

---

## P1: significant epistemic, citation, currency and value issues

### P1-1. Misquote of the FCIC
- **File:** `reference/adjacent-fields.md` §8
- **Evidence:** "credit-rating agencies … whose ratings inflation the official 2008-crisis inquiry called a non-optional cog of the collapse."
- **Problem:** The FCIC's actual words are that the rating agencies' failures were "essential cogs in the wheel of financial destruction". The report also calls them "key enablers of the financial meltdown".
- **Proposed change:** Quote it exactly.
- **Effort:** S

### P1-2. Credit-rating settlement figure understates
- **File:** `concepts/evaluation-systems-in-the-wild.md`
- **Evidence:** "~\$864M+ settlements after 2008"
- **Problem:** \$864M is Moody's 2017 settlement alone. S&P paid ~\$1.375B in 2015, so the combined total is ~\$2.2B.
- **Proposed change:** Correct the figure and attribute each settlement.
- **Effort:** S

### P1-3. "Discovered independently three times" contradicts itself
- **File:** `concepts/patterns-and-failure-modes.md` §1
- **Evidence:** "**Goodhart's law**, discovered independently three times: Goodhart … Campbell … and Strathern's popular gloss"
- **Problem:** A gloss of Goodhart is not an independent discovery. The Lucas critique (1976) is the usual third independent instance.
- **Proposed change:** "Goodhart (1975), Campbell (1979) and the Lucas critique (1976) are near-simultaneous independent statements; Strathern (1997) supplied the popular phrasing."
- **Also:** labelling cardiac-surgery cream-skimming a "cobra effect" is loose. It is adversarial/causal Goodhart (selection on inputs). Reserve "cobra" for incentives that create more of the measured bad.
- **Effort:** S

### P1-4. A definition is attributed to a page that does not contain it
- **File:** `reference/adjacent-fields.md` §9
- **Evidence:** "This formalizes the wiki's working definition of an evaluation as 'a procedure that converts complex information into simpler information preserving most of the value' (see Estimation vs. Evaluation)."
- **Problem:** That definition appears nowhere on that page or anywhere else in the wiki (grep confirms). It is probably a leftover from the 2021 notes.
- **Proposed change:** Either add the definition to Ch. 2, where it would sharpen the estimation/evaluation contrast, or delete the claim.
- **Effort:** S

### P1-5. Opinion Fuzzing is described as "proposal" in one place and "evidence" in another
- **Files:** `concepts/llm-evaluators.md` ("QURI's opinion fuzzing proposal"); `reference/related-work.md` ("**Opinion Fuzzing** (2025). Evidence that LLM judgments shift substantially on prompt phrasing alone")
- **Proposed change:** Pick one. If the post reports measurements, quote them with numbers. If not, call it a proposal everywhere. Add the URL in Related Work.
- **Effort:** S

### P1-6. Related Work, the QURI bibliography, is missing most links
- **File:** `reference/related-work.md`
- **Evidence:** Squiggle AI, Scorable Functions, RoastMyPost, Opinion Fuzzing, Accuracy Agreements, Incentive Problems…, Prediction Markets in the Corporate Setting, the shallow evaluations, Nolan's GiveDirectly CEA, Sempere's "Predicting the value of small altruistic projects" and the relative-value experiments all have no URL.
- **Other problems:**
  - The "partial retraction" of Scorable Functions is asserted with no link or quote.
  - Squiggle AI is dated "(2025)" here but "(2024)" in RRP (`case-studies/llm-epistemics-in-production.md`, which links the Jan 2025 EA Forum post).
- **Proposed change:** Add URLs for all items and quote the retraction. Link RRP's case-study page, which already has the URLs and figures (168 workflows / 30 users, \$0.10–0.35, "significant" false-positive quote).
- **Effort:** S–M

### P1-7. Hanson futarchy is dated two ways
- **Files:** `start-here/use-cases.md` "Robin Hanson's futarchy (2007)"; `reference/adjacent-fields.md` cites Hanson (2013)
- **Problem:** Futarchy was proposed ~2000 and published in *J. Political Philosophy* in 2013.
- **Proposed change:** Use one dating.
- **Also on that page:** cite a source, not Goodreads, for *Superforecasting* (`concepts/components.md`), and credit certificates of impact to Christiano & Grace.
- **Effort:** S

### P1-8. Unsupported assertions in the 2021-era chapters
These need a citation or a "conjecture" label.

| File | Evidence | Proposed change |
|---|---|---|
| `concepts/evaluation-methods.md` | "Metaculus has resolved questions against small expert teams; resolution councils have been set up for similar purposes." | Cite it. |
| `concepts/techniques.md` | "Each step trades a little accuracy for a large drop in marginal cost." | Unknown; say so. Distillation chains compound error and correlation. |
| `concepts/components.md` | "Keeping them separate is what makes the field tractable; combining them is a comparatively thin integration layer on top." | **Contradicts** the intro's "Nobody was building the whole machine" (if integration were thin, someone would have) and Ch. 5's claim that consistency/propagation are the dominant failure modes. Delete or invert it. |
| `concepts/components.md` | "Ontology is plausibly the part where progress is most leveraged and least worked-on." | Engage Wikidata and LLM question-generation work (e.g. ForecastBench's automated question generation; Metaculus/AI-generated question sets). |
| `reference/adjacent-fields.md` §4 | "collapsing cost-per-evaluation by orders of magnitude" | No cost source; add one or soften. |
| `reference/objections.md`, `start-here/lineage.md` | "~\$100B over 20 years" | A Fermi number with no model, in a wiki about estimation. Add a 5-line Squiggle model or drop the figure. |
| `start-here/use-cases.md` | "A system that let existing teams scale output 10–100×" | Speculative; label it. |

- **Effort:** S–M

### P1-9. Currency gaps as of Oct 2026 (beyond P0-1/2/4/7)

**LLM forecasting.** Halawi 2024 is the only citation. Missing:
- ForecastBench (Karger et al., ICLR 2025, with live updates);
- the Metaculus AI Benchmarking series (quarterly bot-vs-pro results, 2024–26);
- FutureSearch / Bridgewater-style AI forecasting deployments.

These change the "Prediction" row of the components table.

**AI eval science.** Missing:
- METR (time-horizon methodology);
- UK AISI Inspect (open eval framework, arguably the most-used "evaluation engineering" tool in 2026);
- Epoch's benchmarking hub;
- *The Leaderboard Illusion* (2025, private-testing gaming of LMArena). Patterns §5 cites Elo/Bradley–Terry "now used to rank LLMs in preference arenas" with no mention of this, the most relevant Goodhart case;
- construct-validity critiques of benchmarks (e.g. *Measuring what Matters*, 2025).

**Rubric-based LLM evaluation at scale.** HealthBench (OpenAI 2025, physician-written rubrics, ~48k criteria) and PaperBench are large rubric-graded systems with published judge–human agreement. They are directly relevant to "evaluation" (vs. estimation).

**Polymarket.** The catalogue says "past US legal issues". The company acquired QCEX (CFTC-licensed, July 2025) and relaunched US operations as a DCM in late 2025, so this needs an update.

**Metaculus.** The catalogue says "no monetary incentive". Metaculus runs cash-prize tournaments, including the AI Benchmark series.

**Regulation.** The EU AI Act classes AI used for creditworthiness, employment and education evaluation as high-risk (Annex III). Obligations were scheduled for Aug 2026; check the status of the late-2025 "digital omnibus" delay proposal. GDPR Art. 22 also applies. The Culture "rollout problem" proposes publishing estimates on "every politician, bill, organization, and individual" with no legal analysis.

**Smaller items.**
- RTINGS "2026 paywall": verify.
- Rossi et al. 7th ed. (2004) is superseded by the 8th ed. (2019).
- Patton 5th ed. (2021) exists but is co-authored with Campbell-Patton; add the co-author.

- **Effort:** M

### P1-10. Catalogue gaps: the systems most relevant to this wiki's thesis are absent
- **File:** `concepts/evaluation-systems-in-the-wild.md`
- **Missing:**
  - **X/Twitter Community Notes.** An open-source bridging-algorithm evaluation system with published data and research (Wojcik et al. 2022; Allen et al.), adopted by Meta/TikTok in 2025. It is the strongest live example of a designed anti-capture aggregation rule.
  - **The Unjournal.** Paid, quantified (with credible intervals) public evaluation of research; EA-adjacent, i.e. the target audience.
  - **DARPA SCORE / Replication Markets** (see P0-4).
  - **AI model leaderboards/evals** (LMArena, HELM, METR, AISI).
  - **Wikipedia ORES / Lift Wing** (ML-scored edit quality at scale).
  - **Automated essay scoring** (e-rater in GRE/TOEFL, which runs as model + human audit; the closest deployed analog of design C).
  - **Content moderation** (Meta's Oversight Board as the expensive layer over automated moderation).
  - **NIH/NSF grant scoring** (the worked example's domain is not in the catalogue).
- **Problem:** The catalogue is consumer-heavy (beer, anime, coffee) and light on the systems where the book's core pattern is actually deployed.
- **Proposed change:** Add these 8–10, and trim low-information entries such as beer, anime and Letterboxd into one line.
- **Effort:** M

### P1-11. Missing objections (the strongest ones)
- **File:** `reference/objections.md`
- **Problem:** The page addresses vagueness, accuracy, terminology, theory-vs-building, "why evaluation" and scale, but not the objections a sharp critic would lead with.
- **Missing objections:**
  - **Monoculture / outcome homogenization.** If many funders use the same model, their errors correlate across institutions (Kleinberg & Raghavan, *PNAS* 2021, "Algorithmic monoculture"; Bommasani et al. 2022, "Picking on the same person"). This is the cross-institutional version of the LLM chapter's correlated error, and the worst systemic risk of scaled LLM evaluation.
  - **Goodhart makes scale self-defeating.** The more decisions ride on the score, the faster it degrades (Campbell's dose–response, which the book cites but never turns into an objection).
  - **Accountability/legitimacy.** This is mentioned in the LLM chapter but deserves an objection entry.
  - **Not neglected.** Billions are now spent on AI evals and LLM judges; why does this need a new field?
- **Also:** the "External commentary" section still lists case studies as the "single most wanted thing" without linking the Worked Example.
- **Proposed change:** Add 4 objections, each with its best response. Link the worked example.
- **Effort:** M

### P1-12. Epistemic Culture is the thinnest chapter and has no citations
- **File:** `concepts/epistemic-culture.md` (592 words, zero external citations)
- **Evidence:** "The notes suggest starting with custom, lower-stakes systems…"; "'just make people more candid' has defeated many reformers".
- **Problem:** The catalogue has the evidence this chapter needs, and none of it is used:
  - Stiftung Warentest sued ~10×/year;
  - US News boycott;
  - Ofsted abandoning single-word grades after a headteacher's death (Ruth Perry, 2023);
  - Charity Navigator's overhead-ratio backlash (the 2013 "Overhead Myth" letter);
  - Doing Business.

  The chapter also ignores EA-specific experience: reactions to Sempere's shallow evaluations, ACE review controversies, GiveWell's published "mistakes" page as a candidness norm.
- **Proposed change:** Rebuild it around 4–5 documented rollout and backlash cases, extract the sequencing lessons, and coordinate with RRP's planned Ch. 22, "Culture, Consent, and Adoption" (Phase 5 recommendation: one shared chapter).
- **Effort:** M–L

### P1-13. Evaluation Methods is still "profile" boilerplate
- **File:** `concepts/evaluation-methods.md`
- **Evidence:**
  - "Profile: **high accuracy, low quantity, high cost, high trust.**" and four more like it, none with an example or number.
  - "Expert evaluations … high accuracy" contradicts Patterns §2 (peer-review ICC ≈ 0.34).
- **Proposed change:** Do Plan Phase 2 here. Replace the five profiles with one table: method × example system from the catalogue × cost/item (order of magnitude, sourced) × measured reliability (ICC/κ where known) × documented failure. Add LLM judge as a sixth method row, and structured elicitation (Cooke, IDEA, Delphi) as a seventh. The latter currently lives only in Adjacent Fields.
- **Effort:** M

### P1-14. Worked example: missing fixed costs and value; uses agreement instead of scoring
- **File:** `concepts/worked-example.md`
- **Problems:**
  - The \$1/item LLM cost excludes rubric design, a calibration set, engineering and re-validation on each model update. RRP's case study calls prompt engineering "a recurring tax, not a setup cost". Add a fixed-cost line (e.g. \$10–30k/yr) and show that C still wins or doesn't.
  - The book's own Prediction component stresses "calibration, scorability", but the example scores a binary renew/don't. Having the model output P(panel renews) and scoring it with Brier/log loss uses all 50 audits more efficiently and connects to proper-scoring-rules material already in Adjacent Fields §1.
  - The value is left out entirely ("a value-of-information estimate this wiki does not yet have a method for"). RRP's Core Model §5 "Pricing information before it arrives [exact]" and RRP's Epistemic Impact Analysis exist. Link them and give one illustrative VOI line, e.g. if 5% of renewals flip and each flip is worth \$X.
- **Effort:** M

### P1-15. The "all you need" thesis appears in 5+ places despite the Phase 1 "one home" claim
- **Files:** `index.mdx` (hero tagline + section), `start-here/introduction.md`, `start-here/lineage.md`, `reference/objections.md`, `reference/glossary.md`
- **Related duplication:**
  - "Why now / missing executor" appears in index, intro ("Timing"), lineage and the LLM chapter opening.
  - The candidness example appears in use-cases and culture.
  - Crux list and Open Problems overlap about 60%.
- **Proposed change:**
  - Keep "all you need" in Ch. 1 only. Elsewhere use a one-line pointer.
  - Merge Open Problems into Cruxes, or make Open Problems strictly per-chapter links.
  - Retire the slogan from the hero tagline: it is the least-supported claim in the book and the first thing a reader sees.
- **Effort:** S

### P1-16. Cross-links to RRP are thin and miss the most relevant pages
- **Current EE→RRP links (10):** oversight-protocols (×3), untrustworthy-sources, hardening-invariance (×2), hardening-deterrence (×2), hardening-techniques, root.
- **Missing links:**

| EE page | Should link to RRP |
|---|---|
| `llm-evaluators.md`, `related-work.md`, `evaluation-methods.md` | `case-studies/llm-epistemics-in-production.md` (RoastMyPost, Squiggle AI, and the \$300 Fermi competition, which is a deployed LLM judge with a documented scoring error; the LLM chapter's best in-house example) |
| `the-systems-view.md`, `worked-example.md`, Crux 9 | `concepts/core-model.md` §3 unit economics and §5 information pricing; `proposals/epistemic-impact-analysis.md` |
| `the-systems-view.md` (consistency/propagation) | `proposals/consistency-evals.md` (seven consistency types; arbitrage-based checks; exactly the "automatable contradiction detection" EE asks for) |
| `evaluation-methods.md`, `techniques.md` (pairwise / relative values) | `concepts/constructing-utility-functions.md` (relative value functions, comparison polling, empirical record) |
| capability-ladder mentions | `concepts/epistemic-applications.md` (Reliability Ladder) |
| `patterns-and-failure-modes.md` §3 | `case-studies/the-funding-effect.md` (RRP already links back) |
| `techniques.md` trust networks | `environment/identity-and-track-records.md` (RRP Ch. 19 links EE; EE says only "the sibling RRP wiki's work on identity", with no link) |

- **Proposed change:** Add these ~8 links; it is cheap and high value. Consider a shared "See also in RRP" box per chapter.
- **Effort:** S

### P1-17. Use Cases are 2021-era and EA-internal
- **File:** `start-here/use-cases.md`
- **Problems:**
  - Futarchy, certificates of impact and felicific calculators are speculative mechanisms that themselves never shipped, so they are weak motivation.
  - Missing current, concrete high-value cases: grant triage (the worked example), LLM-assisted peer review (a live 2025–26 controversy), AI-model evaluation itself, fact-checking/Community Notes, research-claim replicability triage (SCORE), and policy cost-benefit at scale.
  - "Felicific calculators … should work for nearly any utility function" is unsupported.
- **Proposed change:** Restructure into "Live now" (3–4 cases with real systems) and "Speculative" (the 2021 list, condensed).
- **Effort:** M

### P1-18. Techniques chapter: give each technique an evidence status (Plan Phase 2, undone)
- **File:** `concepts/techniques.md`
- **Problem:** Automated trust networks and estimation-functions-at-scale are presented beside prediction–evaluation as if equally established. Also, "Cultural change toward candidness" is listed as a technique but is really a precondition (and Culture already has its own chapter).
- **Proposed change:** Add a status line per technique: tested / deployed elsewhere / untested. For the random-subset trick, note the incentive-dilution issue: with 50 of 10,000 resolved, each item's expected reward is 1/200. A proper score stays proper under random resolution, but effort incentives fall. Link Sempere & Lawsen.
- **Effort:** S–M

---

## P2: polish, prose and information architecture

### P2-1. LLM-prose smell in the older pages
- **Evidence:** bold and em-dash density per page (bold spans / em-dashes):
  - Catalogue 204 / 136
  - Adjacent Fields 96 / 152
  - Patterns 69 / 42
  - Related Work 26 / 17

  By contrast, the LLM chapter has 18 / 1 and the Worked Example 22 / 4, which shows the newer house style.
- **Phrases to cut or sharpen:**
  - Estimation vs. Evaluation: "This distinction is the load-bearing one. If you only take one idea from this wiki, take this one."
  - Patterns: "The single most important finding across the whole literature"; "the deepest and most distinctive"
  - Intro: "The emphasis is on every word after *systems*."
  - Objections: "verbatim-in-spirit", which is self-contradictory.
  - Use Cases: "The slogan version: *if you've ever thought…*"
- **Proposed change:** Bring the older pages to the newer style: bold only for defined terms on first use, fewer em-dashes, no "Where to go next" lists where the sidebar suffices.
- **Effort:** M

### P2-2. Adjacent Fields paragraphs are walls of text
- **File:** `reference/adjacent-fields.md`
- **Problem:** Each section opens with a 150–250-word paragraph full of bolded terms. Entries describe each work in promotional terms ("The landmark", "the definitive", "Foundational").
- **Proposed change:**
  - Split each opener into "What it offers / Where it stops short / Relevant chapter".
  - Add the four "candidate fields not yet covered" it lists: scientometrics/peer review, accounting measurement, reliability engineering, survey methodology. Survey methodology matters most, because Methods has a "Surveys" section with zero survey-methodology citations (e.g. Groves et al., *Survey Methodology*; total survey error).
  - Add psychometrics/IRT explicitly. V-Dem's Bayesian IRT is the best model for aggregating many noisy raters with uncertainty, and the LLM chapter could use it for multi-judge aggregation.
- **Effort:** M

### P2-3. "7 ± 2" scale granularity borrows Miller's slogan
- **File:** `concepts/patterns-and-failure-modes.md` §5
- **Evidence:** "Optimal scale granularity is ~7 ± 2."
- **Problem:** Preston & Colman found indices improved up to 7–10 points. "±2" invents precision and evokes Miller (1956).
- **Proposed change:** Say "about 7–10 points".
- **Effort:** S

### P2-4. The ESG figure is version-dependent
- **File:** `concepts/evaluation-systems-in-the-wild.md`
- **Evidence:** "inter-rater correlation ~0.54 vs. ~0.92 for credit ratings (MIT 'Aggregate Confusion')"
- **Problem:** This matches the published *Review of Finance* version. The working paper reported 0.61 vs 0.99.
- **Proposed change:** Cite the authors (Berg, Kölbel & Rigobon 2022) rather than "MIT", and the 0.38–0.71 range.
- **Effort:** S

### P2-5. Stale frontmatter `sidebar.order` values
- **Problem:** e.g. methods `order: 1`, techniques `order: 2`, culture `order: 1`, catalogue `order: 3`, patterns `order: 4`. They are ignored, because the sidebar is explicit, but misleading.
- **Proposed change:** Delete them.
- **Effort:** S

### P2-6. Lineage sits at `start-here/lineage` but in the Reference section
- **Problem:** The plan says URLs stay unchanged, so the mismatch stays.
- **Proposed change:** At least add a redirect-free note in CLAUDE.md so future editors don't "fix" it.
- **Effort:** S

### P2-7. The index status column carries no information
- **File:** `index.mdx`
- **Problem:** Every row says "draft". The table also duplicates the sidebar.
- **Proposed change:** Replace the status with an evidence grade (e.g. "literature-backed" / "argument only" / "numbers illustrative") or a last-reviewed date, or drop the table.
- **Effort:** S

### P2-8. Open Problems is stale
- **File:** `open-questions/index.md`
- **Evidence:** "The field is long on architecture and short on worked examples."
- **Proposed change:** Link the Interlude and reword to "short on *measured* case studies". Add the LLM-chapter and worked-example open questions that are missing (base-rate-corrected agreement, fixed-cost amortization).
- **Effort:** S

### P2-9. Glossary gaps
- **File:** `reference/glossary.md`
- **Missing terms:** Goodhart variants (regressional / extremal / causal / adversarial), reactivity, commensuration, surrogation, random audit, inspection game, value of information, inter-rater reliability (ICC/κ), prediction-powered inference, escalation, drift/re-validation.
- **Also:** "Advanced evaluation system … analogous to 'Level 4'" depends on the missing ladder.
- **Effort:** S

### P2-10. Mermaid diagrams are decorative
- **Files:** use-cases flowchart (inputs → systems → use cases); components "Background → Components → Domains"
- **Problem:** Neither shows a mechanism.
- **Proposed change:** Replace them with one real diagram: the design-C data flow (model scores all → hidden random audit → agreement tracking → drift alarm → escalation queue), which the book's core argument would benefit from.
- **Effort:** S

### P2-11. LLM chapter: the Halawi caveat
- **Evidence:** the chapter quotes Brier .179 vs .149 (correct).
- **Proposed change:** Note that by 2025–26 ForecastBench and the Metaculus bot benchmarks show the gap narrowing. Say which direction, with dated numbers, rather than leaving a 2024 snapshot as current.
- **Effort:** S

### P2-12. Patterns caution box overclaims
- **File:** `concepts/patterns-and-failure-modes.md`
- **Evidence:** "Citations and key figures have been verified against their sources."
- **Problem:** My spot-check mostly agrees, but the Goodhart "three times" and "7 ± 2" items show interpretive drift. Adjacent Fields' box is more honest.
- **Proposed change:** Add "as of Sept 2026; interpretive glosses are the authors'", and a per-page "last verified" date.
- **Effort:** S

### P2-13. CLAUDE.md says "early brainstorming stage"
- **Problem:** That framing conflicts with the plan's goal of an "evidence-backed engineering text".
- **Proposed change:** Update the content-style guidance:
  - require a source or a "conjecture" tag for each empirical claim;
  - use the RRP-style [exact] / [standard shape] / [heuristic] grades;
  - forbid bold outside defined terms.
- **Effort:** S

---

## Per-page triage

| Page | Words | Quality | Main problems | Action |
|---|---|---|---|---|
| `index.mdx` | 808 | 5 | slogan hero; duplicated why-now; empty status column | Trim; evidence-grade column |
| `start-here/introduction.md` | 1067 | 5 | unmeasured "all you need"; no name-collision section; no reconciliation with "funding beats method" | Revise (P0-5, P0-7) |
| `start-here/estimation-vs-evaluation.md` | 754 | 6 | good core idea; no estimate of the demotable fraction; missing the definition Adjacent Fields cites | Light revise; add one worked demotion example |
| `start-here/use-cases.md` | 772 | 4 | speculative 2021 cases; futarchy date; decorative diagram | Restructure (P1-17) |
| `start-here/key-questions.md` | 582 | 6 | fine as a list; overlaps Open Problems | Merge with Open Problems |
| `concepts/the-systems-view.md` | 958 | 5 | "pick two" frame; missing robustness/legitimacy; ladder unwritten | Rewrite design-space section (P0-6, P0-8) |
| `concepts/components.md` | 688 | 4 | uncited; "thin integration layer" contradiction; Goodreads cite | Revise, add evidence |
| `concepts/evaluation-methods.md` | 940 | 3 | template "Profile" lines; no numbers; no LLM-judge row | Rewrite as table (P1-13) |
| `concepts/techniques.md` | 1152 | 5 | missing SCORE/PPI; no status lines; candidness is not a technique | Revise (P0-4, P1-18) |
| `concepts/llm-evaluators.md` | 1739 | 7 | best chapter; two false "unmeasured" claims; missing judge-attack literature and PPI / Trust-or-Escalate | Targeted fixes (P0-1, P0-2) |
| `concepts/worked-example.md` | 1221 | 6 | kappa/base-rate flaw; baseline cost omitted; panel vs expert; no fixed costs | Fix (P0-3, P1-14) |
| `concepts/evaluation-systems-in-the-wild.md` | 2943 | 6 | valuable; consumer-heavy; missing Community Notes, Unjournal, SCORE, AI leaderboards, AES; settlement figure; Polymarket/Metaculus stale | Add/trim; code by funding (P0-5) |
| `concepts/patterns-and-failure-modes.md` | 2488 | 8 | strongest page; Goodhart "three times"; 7±2; no LLM-arena Goodhart | Small fixes |
| `concepts/epistemic-culture.md` | 592 | 3 | zero citations; 2021 notes restated | Rebuild (P1-12) |
| `reference/glossary.md` | 740 | 5 | missing key terms; references nonexistent ladder | Extend |
| `reference/objections.md` | 958 | 5 | missing monoculture/Goodhart-scale/not-neglected/legitimacy objections | Extend (P1-11) |
| `start-here/lineage.md` | 763 | 6 | fine; \$100B unsupported | Light |
| `reference/related-work.md` | 811 | 4 | most items unlinked; proposal-vs-evidence inconsistency; dates | Link everything (P1-6) |
| `reference/adjacent-fields.md` | 3436 | 6 | strong bibliography; FCIC misquote; phantom definition; wall-of-bold; no AES/psychometrics/survey methodology | Fix and reformat |
| `open-questions/index.md` | 691 | 4 | stale; duplicates Cruxes | Merge or refresh |

---

## New chapters and content worth adding

1. **The capability ladder, v0** (Plan Phase 2). Five levels, each defined by a measurable property:
   - L1 produces scores;
   - L2 publishes a measured error rate on a random audit;
   - L3 its error rate survives an adversarial audit / red-team;
   - L4 detects its own drift and re-validates;
   - L5 its outputs are relied on by independent parties, with an appeal mechanism.

   Grade about 8 catalogue systems (Consumer Reports, Moody's, IMDb, Community Notes, GiveWell, RoastMyPost, an AES system, LMArena) to test whether the levels discriminate. Align it with RRP's Reliability Ladder.

2. **"Measuring an evaluator: agreement, reliability, and validity."** A practitioner chapter that is currently missing:
   - ICC, κ, Krippendorff's α and the kappa paradox;
   - panel–panel baselines, and how many double-reviewed items you need;
   - PPI and stratified/Horvitz–Thompson estimators for audited systems;
   - eval error bars (Miller 2024);
   - the AES "machine–human vs human–human" acceptance standard as a template.

   This would make the wiki a go-to reference.

3. **"Evaluators under attack."** Consolidate the scattered Goodhart material plus the LLM-judge attack literature (null-model cheating, adversarial suffixes, prompt injection in papers, *Leaderboard Illusion*). Add a defense table (private prompts, random audits with penalties, rotating judges, canaries). Link RRP's hardening chapters rather than duplicating them.

4. **A real case study.** RoastMyPost or the \$300 Fermi competition, written from the throughput/cost angle (Plan Phase 4): cost/eval, coverage, human-labeled false-positive rate on a sample of ~100 flags. Even one measured number would outrank the fictional example.

5. **A recipe / checklist page: "Launching an LLM-assisted evaluation system in 10 steps."** Define the decision → write the rubric → collect a double-reviewed calibration set → measure the panel–panel κ → pilot the model → PPI audit plan → escalation rule → drift monitoring → disclosure policy → re-validation triggers. Each step links to the chapter that justifies it.

6. **A quantitative core** (Plan Phase 3). Reuse RRP's Core Model rather than building a parallel one: system value, optimal audit fraction vs. stakes, staleness under propagation, graded [exact] / [standard shape] / [heuristic].

7. **"AI evals and evaluation engineering"** (or fold into Ch. 1). The relationship to METR / AISI / Epoch / Inspect and the LLM-app evals practice, and what each community can take from the other.

8. **A coded catalogue dataset.** Release the ~110 systems as CSV (payer model, method archetype, output format, failure type). Then the "funding predicts capture" claim becomes a cross-tab anyone can check.

---

## Top 5 recommendations

1. **Fix the four claims that a knowledgeable reader would catch immediately:**
   - "no direct evidence" of judges failing under optimization (P0-1);
   - "barely measured" judgment agreement (P0-2);
   - the chance-uncorrected 70% agreement baseline in the worked example (P0-3);
   - the FCIC misquote and other small citation errors (P1-1 to P1-7).

   About two days of work, and it greatly lifts credibility.
2. **Situate the core pattern in its real lineage:** DARPA SCORE / Replication Markets, prediction-powered inference, automated essay scoring's validity standard, Trust-or-Escalate. Address the name collision with AI "evals" (P0-4, P0-7). The book's best idea then reads as a well-grounded synthesis rather than a 2018 blog post plus fiction.
3. **Reconcile the thesis with the book's own Part III finding.** Make incentive and funding structure first-class design variables. Replace "accuracy × quantity × cost" with a frame that includes robustness under pressure and legitimacy. Back "funding beats method" by coding the catalogue (P0-5, P0-6).
4. **Write the missing practitioner core:** the measuring-an-evaluator chapter, the capability ladder v0 graded on real systems, and the 10-step launch checklist. Rewrite Evaluation Methods as a sourced comparison table (P0-8, P1-13, new content 1, 2 and 5).
5. **Wire the two wikis together and finish the planned phases.** Add the ~8 missing RRP links (Core Model, Epistemic Impact Analysis, Consistency Evals, LLM Epistemics in Production, Reliability Ladder, Constructing Utility Functions). Merge the culture chapter with RRP Ch. 22. Rebuild Epistemic Culture on documented backlash cases. Retire the "all you need" hero slogan (P1-12, P1-15, P1-16).

---

## Counts

- **P0:** 8
- **P1:** 18
- **P2:** 13
- **Total findings:** 39
- **New content items proposed:** 8
- **Pages triaged:** 20. Rewrite/rebuild: 4 (Methods, Culture, Use Cases, Systems-view design space). Targeted fixes: 12. Light: 4.
