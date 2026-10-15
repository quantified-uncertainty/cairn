# Audit: delegation-risk — Case Studies, Cross-Domain Methods, Experimental

Scope: `apps/delegation-risk/src/content/docs/{case-studies (15), cross-domain-methods (10), experimental (15)}` (~55k words) plus the four React tools they embed (`src/components/{SquiggleRiskCalculator,TrustUpdater,SensitivityDashboard,ArchitectureComparator}.tsx`). I read every page in full. Arithmetic was rechecked in Python and Node, the tool numerics were run in Node, and I did a few web checks (marked). Context documents: `TERMINOLOGY.md`, `astro.config.mjs`, `CREDIBILITY_HARDENING_PLAN.md`, `REVISION_PLAN.md`. Paths below are relative to `apps/delegation-risk/src/content/docs/` unless noted.

---

## Overall verdict: 4 / 10

**Why not lower.** The obvious fabrications were already handled in the June 2026 credibility pass: the Petrov "45%", the "$111.11" table, Germany "no jury", and the hypothetical banners on the three AI scenarios. Most pages state their framing honestly with "Framework Interpretation" or "Illustrative" banners. A few pages are useful and mostly correct:
- `cross-domain-methods/access-control-systems.md`
- `case-studies/human-systems/alliance-cascades.md`
- `experimental/.../expert-elicitation.md`
- the "When Euler applies" section of `euler-allocation.md`
- the xz narrative in `open-source-trust.md`

**Why not higher.**
1. **Decorative quantification is still everywhere.** Almost every human-systems case puts invented P × $ tables over real history: the US presidency at "$65B/term", Treasury Secretary "$4.4B/yr", pirate captain "$176,600/voyage", WW1 "20× underestimate". These are dressed in false precision, and several are then used to draw substantive conclusions. The nuclear page's "the Dead Hand is the *safest* architecture" conclusion rests on one invented P(attack) shared across all countries. A banner does not fix conclusions that the made-up numbers drive.
2. **Many concrete math errors survive.** These are not the ones the plan fixed:
   - the jury page's Condorcet table and majority-rule probabilities are wrong
   - the open-source package DR table is off by 1000×
   - the criminal informant reduction is 1000×, not "100×"
   - the near-miss "10,000×" should be 1000×
   - the random-oversight calculation divides a probability by 12 with no justification
   - the "track record modifier" used in two pages and a tool is conceptually wrong
3. **Practitioners would wince.** Examples:
   - "Component VaR (CoVaR)": CoVaR is Adrian–Brunnermeier's systemic-risk measure.
   - Series and parallel are swapped in ASIL.
   - ASIL C → A+A is not a permitted ISO 26262-9 split (web-checked).
   - The Rust code claims dropping a value is a compile error. It is not.
   - A TypeScript phantom-type example would not fail to compile.
   - Hanssen is cited as "compartmentalization worked—damage contained". He is one of the most damaging spies in US history.
   - AlphaFold is described as "physics-based energy minimization".
   - Holmström–Milgrom is cited for the opposite of its multitask lesson.
   - Nuclear CDF "achieved" figures are model estimates, not observed rates.
4. **The interactive tools are broken or misleading, and none of them uses Squiggle.**
   - Trust Updater returns NaN / [0%, 0%] intervals beyond about 170 observations, even though the page recommends 500+.
   - The risk calculator ignores its own "uncertainty" input, inflates any probability below 1% (0.1% becomes about 1%), and calls parameter uncertainty "probability of staying within budget".
   - The sensitivity tornado leaves the top driver's bar blank.
   - The comparator scores "human review" as adding risk.

   `REVISION_PLAN.md` Phase 4c already said to cut three of these four tools. That has not been done.
5. **Currency is weak.** The AI cases are anchored on GPT-3.5/GPT-4, AutoGPT and "RL agents". None of the 2023–2026 real agent incidents appear: Air Canada/Moffatt, the Chevy $1 Tahoe, Replit deleting a production DB, the Amazon Q extension wiper prompt, the Shai-Hulud/chalk npm compromises, tj-actions, slopsquatting, malicious MCP servers, the OpenAI board crisis. Neither do the regulatory regimes now in force: EU AI Act Art. 73 incident reporting, CA SB 53, ISO/PAS 8800, SOTIF. Benchmarks and constants are stale: IBM 2023, 1.5°C budget "400 Gt from 2023", VSL "$7–12M".
6. **The sections overlap and repeat the same template.** Four cross-domain pages duplicate longer `research/` pages. Each human case follows the same "Part N / failure-mode table / DR table / Lessons for AI / Key Takeaways" scaffold. The "Lessons for AI" sections are generic and interchangeable.

**Experimental section, in a sentence.** It is a half-built "probabilistic estimation" module: a registry of uncalibrated, unsourced priors in pseudo-Squiggle, plus four demo widgets. It is valuable as a QURI-shaped idea and currently harmful as a public artifact. Its index promises "Source / Last updated" on every estimate, and none has one. `experimental/index.md` still says "Calibrated priors". It should not stay public in its current form; see the triage table.

---

## Findings

Effort: S = under 1 hour, M = half a day, L = 1 day or more.

### P0 — credibility-damaging or wrong

**P0-1. Jury page: Condorcet and voting-rule numbers are wrong.** `case-studies/human-systems/jury-trust.md`
- The table "p = 0.7: n=9 → 0.879, n=12 → 0.903, n=15 → 0.919, n=21 → 0.939, n=100 → 0.993" is wrong. Correct strict-majority values are 9 → 0.901, 12 → 0.882, 15 → 0.950, 21 → 0.974, 100 → ≈1.000. The 6-person value of 0.841 is wrong too: it is 0.744 strict, or ≈0.837 with ties split. The "marginal improvement" column (+2.0% for 21, +5.4% for 100) is nonsense, so the "diminishing returns after 12" conclusion is unsupported.
- The 7/12 rule with an innocent defendant gives 5.0e-5 (0.005%), not "0.000003 / 0.0003%".
- The 10/12 rule gives P(acquit guilty) = 26.4%, not "7%". P(convict innocent) = 5.5e-9, not 5e-8.
- The "What Modern Analysis Suggests … Studies examining actual jury accuracy (6 jurors 85-88%, 12 jurors 90-93%)" table cites no study. It looks fabricated.

Fix: recompute with code and link a notebook; delete the "studies" table. **Effort: S**

**P0-2. Jury page: wrong legal facts and internal contradictions.** Same file.
- "*Williams v. Florida* … maintained twelve for serious criminal cases" is wrong. Williams upheld a 6-person jury in a felony case; *Ballew v. Georgia* (1978) set the floor at 6.
- "USA (State) … some allow 10/12" contradicts the page's own *Ramos* (2020) paragraph.
- The Part 5 comparison still lists "Germany (judges) … Professional only", which contradicts the corrected Schöffen row above it.
- The page never mentions that roughly 90–97% of US convictions are pleas. That undercuts the claim that unanimity explains wrongful-conviction rates.

**Effort: S**

**P0-3. Open-source page: package DR table is off by 1000×.** `case-studies/human-systems/open-source-trust.md`. The page computes "lodash 150,000 × 0.001 × $100K = $15M", but that product is $15B. Express gives $16B and core-js $10B, not millions. The ecosystem total of about $10B is then inconsistent with its own parts.
- The xz table says "Estimated: 50-100 million systems". The backdoor was caught in Debian sid / Fedora Rawhide / 40 beta before stable releases, so the affected installed base was small. The "$10T ransomware" row (about 10% of world GDP) should go.
- "Funding maintainers has 72× ROI … highest-ROI security investment possible" is invented.

Fix: correct the arithmetic or drop the dollar tables; reframe xz as counterfactual exposure "had it reached stable distros". **Effort: S**

**P0-4. Nuclear launch page: invented-number model drives a substantive conclusion.** `case-studies/human-systems/nuclear-launch-authority.md`
- "The Soviet system … has *lower* total Delegation Risk" and "The 'scariest' system may be safest". Both follow from using the same P(attack) = 1e-4 for every country, which leaves out the deterrence effect the caveat itself appeals to. It also treats "failure to retaliate" as a $10T loss in the same currency as accidental war.
- US "~50% failure to retaliate" ignores SSBN survivability, TACAMO/Looking Glass, continuity-of-government succession and the historical pre-delegation. A NC3 specialist would reject it.
- Perimeter is described as operating "autonomously" once armed. Hoffman's *The Dead Hand* and Yarynich describe duty officers in a bunker who must launch the command rockets.
- "France: PM counter-signature historically expected" appears to be wrong. Nuclear authority rests with the President under the 1964 and 1996 decrees.
- Lesson 5 table: "Redundancy (multiple submarines …) → Higher false negative risk" is backwards. Redundancy lowers false negatives and raises false positives.
- "0.99^10 = 0.90 … 10% failure rate—higher than most estimates assume" cites no estimate.

Fix: delete the DR tables and the Dead Hand ranking; keep the qualitative FP/FN tradeoff, the incident table and the UK letters. Add the 2022 NPR human-in-the-loop commitment and the Nov 2024 Biden–Xi statement on human control of nuclear use, the most AI-relevant real development. **Effort: M**

**P0-5. Random-oversight math is a probability error.** `case-studies/human-systems/oversight-dilemma.md`, Part 5
- "P(corrupt overseer during specific presidential action) = 0.05 × (1/12) = 0.004 … 12.5× better". If 5% of the pool is corrupt and a fresh draw is made monthly, the chance that any given action faces a corrupt overseer is still about 5%. Dividing by 12 has no justification.
- "Defection (exposing) is dominant strategy in iterated game" is backwards. Iteration is what sustains collusion (folk theorem).
- Layer 1 adversarial DR is $10.9B in Part 4 and "$3B" in Part 6.
- Committee corruption is computed with p = 0.10 but compared against an Ombudsman table that uses 0.05.
- Multiplying pass rates across layers contradicts the site's own canonical correlated-layer model, (1−ρ)∏p + ρ·min p.

The whole page is a speculative US-politics thought experiment with $65B/term numbers, and in late 2026 it invites a partisan reading. **Effort: L to fix; S to cut**

**P0-6. Fabricated empirical claims in the experimental registry.**
- `experimental/.../estimates/incident-database.md`: "Failure Mode Frequencies — From AIID taxonomy: Incorrect output 35%, Bias 20%, Privacy 15% …" and "Categorize AIID incidents … Minor 60%, Moderate 30%, Major 10%". These are presented as AIID data. AIID uses the CSET and GMF taxonomies, not these categories, and nothing is cited. The domain "Estimated Reporting Rate" table is also unsourced.
- `cross-domain-benchmarks.md`: the "Comparison Table … AI Current: Nuclear 10⁻²/year, Aviation 10⁻⁴/hour, Medical 10⁻³/use … Gap 1000×" and "Realistic AI critical failure: ~10⁻⁴ per task … ~100,000× worse than aviation" are invented. The phishing claim "Traditional filters catch 80-90%, against AI-crafted 40-60%" is unsourced.
- `mitigation-effectiveness.md` gives "Confidence: High" to invented numbers, for example sandbox containment 95% and formal verification 99%.
- `probability-priors.md` gives "Confidence: High" to deterministic-code failure 0.01% "per invocation". Its only rationale, "~0.1–1 defects per KLOC", contradicts the benchmarks page's "Typical commercial 15–50 defects/KLOC" and does not convert to a per-invocation rate.

Fix: delete the fabricated rows, downgrade every confidence label to "Speculative" unless a source is given, and add the promised `source` / `last-updated` fields. **Effort: M**

**P0-7. The registry's top-level claims are false.**
- `experimental/index.md`: "Estimates Registry: **Calibrated priors** for failure probabilities". The plan changed this wording on `probabilistic-estimation/index.md` but not here.
- `estimates/index.md`: "Each estimate includes: … **Source** … **Last updated**". No estimate on any page has either.

**Effort: S**

**P0-8. Trust Updater tool breaks numerically.** `src/components/TrustUpdater.tsx`
- `gamma()` is a Windschitl/Stirling `Math.pow` form that overflows once α+β > ~171. `betaPdf` then returns NaN and the 90% CI shows [0%, 0%]. Tested in Node: beta(209, 1) and beta(1009, 11) both give 0.0000/0.0000.
- The page tells users to collect "500+" observations for strong priors.
- A correct `gammaLanczos` is defined in the same file and never used.

Fix: compute in log space (`lgamma`) or use `@quri/squiggle-lang` / jStat. **Effort: S**

**P0-9. The "track record modifier" is conceptually wrong.** It appears in `TrustUpdater.tsx`, `tools/trust-updater.mdx`, `estimates/trust-calibration.md` and `probability-priors.md`.
- The modifier is `priorMean / posteriorMean` on the *reliability* scale. Going from 90% to 99.5% reliability cuts the failure rate 20× (10% → 0.5%), but the page's table shows "0.90 (10% reduction)". Risk scales with failure probability, so the correct modifier is (1−post)/(1−prior).
- `probability-priors.md` defines a different "trackRecordMultiplier" with failure-indexed α/β, while the updater indexes α by successes. The two conventions conflict.

**Effort: S**

**P0-10. Risk Calculator is mislabeled and biased.** `src/components/SquiggleRiskCalculator.tsx` + `tools/risk-calculator.mdx`
- The "Probability (uncertainty)" input is never used. Beta concentration is hard-coded to 100.
- `Math.max(1, mean*100)` clamps α to at least 1, so a 0.1% harm mode is simulated at about 1%. Every rare, high-damage mode is inflated up to 10×.
- Each sample is `prob × damage`, which is the *expected* loss given sampled parameters. "Budget Confidence = probability that your actual monthly risk stays within budget" therefore conflates epistemic uncertainty about the mean with the realized-loss distribution. The realized monthly loss is $0 most months, with heavy tails.
- The component and page carry the Squiggle name but do not use Squiggle. The exported "Squiggle code" uses a different rounding from the simulation; `beta(0, 100)` is invalid when p < 0.5%; and bare mid-file expressions should be checked against current Squiggle syntax.
- `setIsSimulating` is called inside `useMemo`, which is a React anti-pattern.

For QURI specifically, a "Squiggle" calculator that does not run Squiggle is embarrassing. Fix: rebuild on `@quri/squiggle-lang` as `REVISION_PLAN` 4c says, simulating a Bernoulli × damage draw per period. **Effort: M**

**P0-11. Other arithmetic errors in the case studies.**
- `ai-systems/case-study-near-miss.md` TL;DR: "$50,000 compensation (10,000x the appropriate amount)". The appropriate amount is $50, so the ratio is 1,000×.
- `human-systems/criminal-trust.md`: P(informant) 0.10 → 0.0001 is called a "100× reduction". It is 1,000×. "Kill courier … Expected Cost ∞" and "individual DR = ∞" make the whole table degenerate.
- `ai-systems/case-study-drift.md`: the TL;DR says DR "crept from $200/month to $2,400/month" but the table shows $170 → $1,370. The page claims the 80% budget alert would fire at Month 3; 80% of $325 is $260, so it fires at Month 2. A $700K+ incident against a modeled $1,370/month DR shows the model was badly miscalibrated, and the page never says so. In the monitor code, `component_drs` is never initialized.
- `ai-systems/case-study-success.md`:
  - The TL;DR says "3 potential security vulnerabilities" but the metrics say "12 security vulnerabilities caught".
  - It says "6 months" in one place and "8 months" in another.
  - "False positive rate 0.3% (15 legitimate PRs)" appears beside "False positives 48 (0.3%)".
  - 2,200 human reviews and 340 true positives imply about 1,860 benign escalations, so "0.3% FP" is not meaningful.
  - "No component can post directly to GitHub" contradicts "Auto-post".
  - The cross-PR detection credited to the decomposed design actually came from a stateful aggregator, which a monolith could also have.
  - Its comparison table (monolithic GPT-4 70% injection resistance vs 100%, and so on) is still decimal-precision invented data, despite the plan.
- `ai-systems/case-study-sydney.md`: "Delegation Risk ≈ $10B/day" ($1M per embarrassing output × 1M conversations/day) is larger than Microsoft's daily revenue of about $0.7B. The figure is self-refuting. Drop the dollar model.

**Effort: S each**

**P0-12. Factual inversions in Access Control.** `cross-domain-methods/access-control-systems.md`
- "Robert Hanssen … Compartmentalization worked—damage was contained" is wrong. Hanssen's 22 years of espionage are regarded as among the most damaging in US history.
- "Ames, Hanssen, Snowden … Detection, not prevention, caught them" is wrong for Snowden, who self-disclosed, and mostly wrong for Hanssen, who was identified through a purchased KGB file.
- *The Cuckoo's Egg* is listed as a "Classic insider threat detection case study". It is about an external intruder (Markus Hess).
- RFC 6819 is the 2013 OAuth Threat Model, not the "Security Best Current Practice", which is RFC 9700 (2025).
- "> 'I get 200 access requests per week…' — **Actual manager quote**" has no source. It reads as a fabricated quote; cite it or remove it.

**Effort: S**

**P0-13. Power-dynamics cases: rejected canon and a wrong AlphaFold claim.** `case-studies/power-dynamics-cases.md`
- The page relies on RACAP and "Effective Capability = Power × Agency". `TERMINOLOGY.md` rejects RACAP for "broken units".
- AlphaFold: "finds lowest energy structure … Physics-based objective, not learned preference". AlphaFold 2/3 are learned networks trained on PDB structures, with only an optional Amber relaxation step. "Output can't be repurposed" ignores protein-design dual-use, which is a live biosecurity concern.
- "Power Score ~85/100" and "Agency 0.35" are invented scores.

Fix: rewrite qualitatively or cut. **Effort: M**

### P1 — significant

**P1-1. Sydney omits what actually happened and recommends things that are now wrong.** `ai-systems/case-study-sydney.md`
- The page never mentions Microsoft's real fix: on Feb 17, 2023 it capped chats at 5 turns per session and 50 per day, later raised. That is exactly the "Least Persistence / session limit" mitigation the page proposes as counterfactual, and the strongest evidence it has.
- No sources are given: Roose (NYT, Feb 16, 2023), the Marvin von Hagen threats, the Avatar-date "gaslighting" exchange, Microsoft's blog posts, and Microsoft's confirmation that the model was GPT-4-based.
- "Components shouldn't know they're AI systems, shouldn't see their own prompts … Ignorance is a safety feature" is a strong, contested claim. It conflicts with situational-awareness research and with how every 2026 agent is built. Present it as a tradeoff and cite the debate.
- Add 2024–26 analogues: Air Canada/Moffatt (2024), the Chevy Tahoe bot (Dec 2023), the DPD swearing bot (Jan 2024), the Replit agent deleting a production DB (Jul 2025), the Gemini CLI file deletion (Jul 2025), and the sycophancy rollback (OpenAI, Apr 2025).

**Effort: M**

**P1-2. The AI section has only one real case.** `case-studies/index.md` + `ai-systems/*`. Sydney is the only real incident; the rest are hypotheticals. Add 3–5 short, sourced real cases mapped to framework concepts. This is what `REVISION_PLAN` 4d asked for. Candidates:
- Air Canada (liability for agent promises), which pairs with the Near-Miss scenario
- Replit (privilege overhang, no envelope)
- the Amazon Q VS Code extension wiper-prompt PR (Jul 2025: supply chain plus agent permissions)
- the postmark-mcp malicious MCP server (Sep 2025)
- slopsquatting
- the OpenAI board crisis (Nov 2023: an oversight structure under stress)

**Effort: L**

**P1-3. Criminal page: wrong organization and missing scholarship.** `human-systems/criminal-trust.md`
- "The Sicilian Mafia Model: Boss → Underboss (Son/Brother) → Consigliere (Brother-in-law)" mixes American Cosa Nostra ranks with a blood-kin model. The blood-family organization known for very few defectors is the **'Ndrangheta**; Sicilian *cosche* are not primarily kin-based.
- "Inter-organization war: Rare (marriages create ties)" is contradicted by the Second Mafia War (1981–83).
- "Mafia families lasted centuries" is wrong; the Mafia emerged in the mid-19th century.
- "Family trust is 6× more efficient" is invented.
- The RICO section leaves out WITSEC, created by the same 1970 Act.
- There are no citations. The standard scholarly sources would be Gambetta, *Codes of the Underworld* (2009), the very costly-signaling theory the page restates; Gambetta, *The Sicilian Mafia* (1993); Varese; Paoli; Leeson.

**Effort: M**

**P1-4. Trust Across Civilizations: invented tables and factual slips.** `human-systems/trust-across-civilizations.md`
- Monastery: "Daily confession and weekly chapter meetings" is roughly inverted. The Benedictine chapter, including the chapter of faults, met daily, and sacramental confession was not daily.
- "Benedictine monasteries have operated continuously for 1,500 years" is wrong. Monte Cassino was abandoned for about 140 years after 577 and destroyed in 1944.
- The "Median Lifespan / λ" table (monastery 500+ years, λ = 0.002) is invented and survivorship-biased; it ignores the Dissolution of 1536–41.
- "Trust-decay rate is governed far more by how often you check than by how carefully you select" is an unsupported causal claim drawn from an invented table.
- Pirates: the Royal Navy "~$2M DR" and "10× democracy discount" are invented. "No accountability" is wrong: the Articles of War applied, and Admiral Byng was shot in 1757. Cite Leeson, *The Invisible Hook*.
- Manhattan Project: "USSR got the bomb 2–4 years earlier" — common estimates are about 1–2 years.
- "Compartmentalization protects you from low-context nodes" is contradicted by David Greenglass, a machinist, and Ted Hall, who both leaked. Soviet penetration was multi-node.
- The trust weights on edges (FDR→Stimson "0.95") are meaningless under TERMINOLOGY's "trust must be defined as P(faithful execution)" rule.

**Effort: M**

**P1-5. Open-source page is stale and missing the most relevant incidents.**
- Ecosystem figures are stale: npm "2+ million" (now 3M+), PyPI "450,000+" (now 650K+).
- Dependency claims are wrong or dated: react "3 direct / 8 transitive" (React 18 had one dependency, React 19 has none); create-react-app was deprecated in Feb 2025.
- Missing incidents:
  - SolarWinds (2020), Codecov (2021), 3CX (2023), polyfill.io (Jun 2024)
  - tj-actions/changed-files (Mar 2025)
  - the chalk/debug maintainer phish (Sep 2025, billions of weekly downloads)
  - the Shai-Hulud self-replicating npm worm (Sep 2025)
  - slopsquatting (LLM-hallucinated package names), malicious MCP servers and model-hub pickle exploits — the direct AI-agent analogues
- Missing defenses: npm/PyPI trusted publishing and provenance attestations, Sigstore, SLSA. "Package signing: Low adoption" is outdated.
- "Reproducible builds would not catch xz" is misleading. The payload was in the release tarball (`build-to-host.m4`), not in git, so a tarball-vs-git diff would have caught it.

**Effort: M**

**P1-6. Euler allocation misses its key point and gets terms wrong.** `cross-domain-methods/euler-allocation.md`
- The "delegation risk" defined in TERMINOLOGY is an expectation, Σ P × D. That is linear, so Euler allocation reduces to "each component's expected loss" and adds nothing. Euler only earns its keep for non-linear measures such as SD, VaR or ES. The page should say this and connect it to a tail measure, or demote itself.
- "Component VaR (CoVaR)": CoVaR is Adrian & Brunnermeier's conditional systemic-risk VaR, not component VaR.
- The budget-cascade diagram uses arbitrary splits, not Euler. "Diversification: Independent components can use their full budgets simultaneously" contradicts the idea of a diversified allocation.
- The FSB 2013 RAF principles are "principles", not a "regulatory standard requiring quantitative tolerances".

**Effort: M**

**P1-7. ASIL decomposition page has standard-level errors.** `cross-domain-methods/asil-decomposition.md`
- The decomposition table includes "ASIL C → ASIL A + ASIL A". This is not permitted. ISO 26262-9 allows C → B(C)+A(C) or C(C)+QM(C) (web-checked via the TI app note and arXiv 2001.02496). The C→C+QM and B→B+QM rows are missing.
- The required "X(Y)" notation is dropped, and "Combined ASIL: B(B) = D equivalent" is wrong notation; it should be B(D)+B(D).
- "components in **series** (AND-gate, both must fail)" and "**parallel** (OR-gate, any failure)" are swapped. In reliability, series means OR and parallel means AND.
- The verification table says "ASIL C: MC/DC". Per ISO 26262-6, MC/DC is highly recommended only at D.
- Missing: SOTIF (ISO 21448), which is the standard for ML perception performance limitations; **ISO/PAS 8800:2024** (Road vehicles — Safety and AI); and UL 4600.

**Effort: M**

**P1-8. Mechanism design page misapplies the economics.** `cross-domain-methods/mechanism-design.md`
- It cites the "Holmström–Milgrom informativeness principle" and concludes "safety metrics … should all affect compensation". The informativeness principle is Holmström (1979). Holmström–Milgrom (1991, multitask) is the canonical *warning* that paying on measurable metrics diverts effort from unmeasured ones — Goodhart, safety theater.
- The "Pareto-optimal fee schedule u′(w)/v′(w) = λ + μ f′(x|a)/f(x|a)" has the ratio inverted and the derivative taken with respect to x. Holmström's condition is v′(x−w)/u′(w) = λ + μ f_a/f.
- For eliciting probabilities, the right tools are proper scoring rules, peer prediction, Bayesian Truth Serum and prediction markets, not VCG. The page does not mention them.
- The page duplicates `research/system-design/mechanism-design.md`; merge.

**Effort: M**

**P1-9. Linear logic page: the code examples are false.** `cross-domain-methods/linear-logic-types.md`
- The Rust comment "Compile error if you try to … Drop budget without returning (Drop not impl, must call return_unused)" is false. Rust is affine: any value can be dropped silently, and not implementing `Drop` changes nothing. At most, `#[must_use]` produces a warning.
- "Cannot clone: #[derive(Clone)] would be a compile error" is false.
- "`!T` — Unrestricted type" listed under Rust: Rust has no `!` modality; `!` is the never type.
- The TypeScript `Component<T>` never uses `T`, so under structural typing `Component<"Low">` *is* assignable to `Component<"High">` and the claimed "❌ Compile error" would not occur.
- `EffectiveTrust = min(t₁,t₂)` contradicts the multiplicative chain used in `organizational-trust.md`.
- Missing prior art: Linear Haskell, Austral, Move resources (the closest real system), object capabilities, macaroons. The research page `research/trust-behavior/linear-logic-trust-budgets.md` (6.6k words) covers this already; merge.

**Effort: M**

**P1-10. Nuclear PRA page presents modeled estimates as achieved performance.** `cross-domain-methods/nuclear-safety-pra.md` (and `overview.md` TL;DR, `cross-domain-benchmarks.md`)
- "Actual performance achieves … CDF around 10⁻⁵" and "Nuclear safety has decades of operational experience achieving 10⁻⁵ to 10⁻⁶ failure rates" treat PRA *model outputs* as observed rates. The empirical record is about 4 core-damage reactors (TMI-2, Chernobyl-4, Fukushima 1–3) over roughly 15–20k reactor-years worldwide, or about 10⁻⁴/reactor-year. That gap between model and observation is exactly the lesson an AI-risk audience needs.
- The example AI fault tree totals 1.2e-6 against a "< 10⁻⁶" target and never notes the miss. It also assumes independence, which the site's own ρ canon forbids.
- `overview.md` calls SIL "Safety Integrity Levels from nuclear/aerospace". SIL is IEC 61508 functional safety. "Nuclear's three lines of defense" confuses the IIA/banking "three lines" model with nuclear's *five* levels of defense-in-depth (INSAG-10).

**Effort: S–M**

**P1-11. Carbon budgets page: wrong figures and a missing disanalogy.** `cross-domain-methods/carbon-budgets.md`
- "Humanity can emit approximately 400 GtCO₂ more (from 2023)" is wrong. IGCC 2025 puts the remaining budget at about 130 GtCO₂ from the start of 2025 (web-checked).
- "Paris … Every 5 years, commitments must increase; no backsliding allowed" overstates what Article 4.3 requires (a normative "progression", not enforceable). The page also leaves out the US withdrawal (effective Jan 2026).
- It misses the key disanalogy. Cap-and-trade works because CO₂ is a uniformly mixed stock pollutant. AI risk is non-fungible and tail-dominated, so "trust permit trading" creates hot spots — the SO₂/NOx critique.
- "Advanced safety teams get smaller budgets" builds in a perverse incentive the page never flags.

**Effort: M**

**P1-12. Attack surface page violates the site's own vocabulary.** `cross-domain-methods/attack-surface-metrics.md`
- "Capability Surface = Π dimensions" multiplies ordinal 1–4 scales. This is the classic risk-matrix error (Cox 2008; Hubbard).
- It conflicts with TERMINOLOGY, where "harm surface" is a set and the numeric quantity is exposure.
- The CVSS aggregation formula "Γ(V) = 10 − (1/σ) × f(V)" has no source.
- CBRA is real (CSA, Nov 2025, web-checked), but the "Low 1–6, Medium 7–24, High 25+" tiers need checking against the whitepaper.
- The mermaid diagram connects only 4 of its 6 dimensions.

**Effort: S**

**P1-13. Lessons-from-failures is thin and misses the best examples.** `cross-domain-methods/lessons-from-failures.md` (594 words)
- Challenger is filed under the "Nuclear" heading.
- The best delegation analogues are missing:
  - Knight Capital 2012 ($440M in 45 minutes: automation without a kill switch)
  - Boeing 737 MAX MCAS (single sensor, delegated certification)
  - CrowdStrike Jul 2024 (kernel-privileged auto-update)
  - the 2010 Flash Crash, Archegos 2021, SVB 2023
- No sources (Vaughan 1996, the Fukushima Diet report, the UBS shareholder report).
- "March 2020 risk parity drawdowns (13–43%)" needs a source.
- It overlaps `entanglements/case-studies/historical-cases.md`; merge or expand.

**Effort: M**

**P1-14. Experimental priors use the wrong taxonomy and no units.** `probability-priors.md`
- The taxonomy (General LLM: "GPT-4, Claude"; RL/Agentic: "AutoGPT-style, trading agents") is out of date. 2026 agents are LLM-based tool users, not RL agents.
- No unit is stated: per call, per task or per month. The tools treat the same beta(8,80) as per-task in one place and per-month in another.
- "Defection rate General LLM 1%" (per what?) and "RL 14%" have no basis.
- Ground the priors in measurable 2025–26 data: SWE-bench Verified and τ-bench failure rates, METR time-horizon curves, published agent incident postmortems.

**Effort: L**

**P1-15. Mitigation stacking ignores the site's own correlation model.**
- `mitigation-effectiveness.md`: the N-version model `p^(2−c)` and the "Diminishing returns" pseudo-code are ad hoc. They contradict the *canonical* (1−ρ)∏p + ρ·min p, which the credibility plan says "do not re-litigate". With ρ = 0.5 the canonical model gives 2.6%, not "~1%".
- `architecture-comparator.mdx` says "3 mitigations at 85% effectiveness: × 0.85³". If each mitigation is 85% effective, the residual is 0.15³.
- `ArchitectureComparator.tsx` sums component risks. Adding a "Human Review" component therefore *increases* risk: "AI Assist" ($79) scores above "Human Only" ($72), contradicting the page text and the framework's core thesis. Every mitigation, from "Training" to "Defense in depth", counts as an identical 15%. `setArchitectures` is never used, so the advertised "Customization" does not exist.

**Effort: S (text); cut tool**

**P1-16. Sensitivity Dashboard misdraws its top driver and misstates its scope.** `src/components/SensitivityDashboard.tsx`
- For inverse parameters such as mitigation effectiveness, `lowRisk > base` and `highRisk < base`, so both bar widths go negative and nothing is drawn. Mitigation is the #1 driver (importance 104 vs 72 for the next) yet its row is blank.
- `params.x || default` silently replaces a user-entered 0 with the default.
- The model is hard-coded, so "adjust to match your situation" is limited to tweaking 7 constants.
- `tools/index.md` advertises "Interaction effects between parameters", which one-at-a-time analysis cannot show; the dashboard page itself admits this.

**Effort: S to fix; recommend cut**

**P1-17. Trust calibration ignores the limits of counting successes.** `trust-calibration.md`, `TrustUpdater`. The page implies that tallying successes calibrates trust. Two limits are missing:
- **Rare events.** By the rule of three, bounding a 10⁻⁶ catastrophic rate needs about 3M failure-free trials (Butler & Finelli 1993, Littlewood & Strigini).
- **Defection.** A scheming model's good behavior under observation is not i.i.d. evidence. This is the site's own defection channel.

"Weight adversarial failures 3×" and "benign 0.7×" are arbitrary. "Skeptical" is beta(5,5) in one table and beta(1,9) in the next. Example 3 says the prior "barely moved" while the mean went from 90% to 94.5%.

**Effort: M**

**P1-18. Cross-domain benchmarks page has aviation-standard errors.** `cross-domain-benchmarks.md`
- "DO-178C … Probability Target" per level and "Software criticality DO-178C Level A ~10⁻⁹ per hour" are wrong. DO-178C deliberately assigns *no* probabilities to software; the targets belong to the failure-condition classification in AC 25.1309 / ARP4754A.
- The verification table says "Level B: MC/DC 100%". MC/DC is Level A only; B requires decision coverage. This also contradicts `nuclear-safety-pra.md`.
- `delegationVaR = quantile × horizon` scales wrongly.
- "ES_95 might be $15,000 (3×)": for lognormal(ln 1000, 1) the ES95 is about $8.6K.
- The IBM figures are 2023 ($4.45M, 204/73 days). IBM 2025 reports a $4.44M global average and a US figure of about $10.2M.
- "FDA 510(k) → Match human performance" is wrong. 510(k) is equivalence to a predicate device.

**Effort: S**

**P1-19. Incident database page is out of date.** `incident-database.md`
- It omits the OECD AI Incidents Monitor, the MIT AI Risk Repository, AVID and MITRE ATLAS.
- It omits the *mandatory* incident reporting now in force: EU AI Act Art. 73 serious-incident reporting (high-risk systems, applying Aug 2026) and the GPAI systemic-risk duties under Art. 55; California SB 53 critical-safety-incident reporting (2026).
- The "Further reading" titles look approximate or unverifiable: "Learning from AI Failures (Yampolskiy)", "Incident Response for ML Systems (Google)".

**Effort: M**

**P1-20. Damage distributions: wrong intervals and stale VSL.** `damage-distributions.md`
- Every lognormal "90% CI" is too wide by about ±2σ. Examples: lognormal(ln 50000, 1.0) has a true 90% CI of [$9.7k, $259k], not "[$6k, $400k]"; breach σ = 1.2 gives [$28k, $1.44M], not "[$20k, $2M]". The means are correct.
- VSL "US DOT and EPA range from $7M–$12M" is stale. DOT's 2024 guidance is about $13M.

**Effort: S**

**P1-21. Several cross-domain pages duplicate longer research pages.** Merge each into its `research/` counterpart and keep one canonical page:

| Cross-domain page | Research counterpart |
|---|---|
| `mechanism-design.md` (595 words) | `research/system-design/mechanism-design.md` (1,199 words, same headings) |
| `linear-logic-types.md` | `research/trust-behavior/linear-logic-trust-budgets.md` (6,616 words) |
| `nuclear-safety-pra.md` | `research/system-design/nuclear-aerospace-deep-dive.md` |
| `euler-allocation.md` | `research/risk-methods/financial-risk-budgeting.md` |
| `experimental/.../cross-domain-benchmarks.md` | `cross-domain-methods` itself |

Also: `open-source-trust` partly overlaps `entanglements/cross-domain/software-dependency-patterns`, and `access-control` overlaps `entanglements/case-studies/intelligence-failures` in places. **Effort: M**

**P1-22. Oversight and power cases make factual errors about US government.**
- `oversight-dilemma.md` treats the baseline "unmonitored President" as having "unchecked authority" over appointments and treaties. Both need Senate consent.
- `organizational-trust.md` says the Treasury Secretary "approve[s]/den[ies] mergers". Bank mergers go to the Fed, OCC and FDIC. Voter "trust 0.52 (election margin)" conflates vote share with trust.
- `power-dynamics-cases.md` says central banks "Cannot target asset prices directly". The BOJ ran yield-curve control from 2016 to 2024 and the Fed pegged yields from 1942 to 1951. The page also ignores the 2025–26 Fed-independence fights (the attempted removal of Gov. Cook).
- Recommendation systems "Create filter bubbles" and "would resist changes that reduce engagement" are stated as fact. The 2023 Meta/academic election studies (Guess et al., *Science*/*Nature*) found small polarization effects from feed changes.

**Effort: M**

**P1-23. The Anti-patterns page is not a case study and argues against current practice.** `ai-systems/anti-patterns.md`
- It is design guidance, not a case study; move it to `design-patterns/`.
- "Context Accumulation … Each invocation starts fresh" and "Natural Language Interfaces Between Components" are stated as absolute rules against the dominant 2026 practice of memory-bearing coding agents and subagents passing NL briefs. Engage with the tradeoff.
- "Actual_Trust = Claimed_Trust × Verification_Coverage" is an undefined formula that violates TERMINOLOGY's rule on quantitative "trust".

**Effort: S**

### P2 — polish

- **P2-1. Template bloat.** Every human case ends with near-identical "Lessons for AI" and an 8-item "Key Takeaways" that restates the body. Cut to 3 takeaways that are specific to the case. Pages run 3–4k words where 1.5k would do: `oversight-dilemma`, `nuclear`, `open-source`, `jury`, `criminal`. **M**
- **P2-2. LLM-prose tells.** "This is not a bug—it's a feature", "The Math is Brutal", "terrifyingly fragile", "Wait—the Soviet system has *lower*…?", "Defense in depth works.", and emoji in diagrams (🎯🏛️🚨). Tone them down. **S**
- **P2-3. Near-miss page details.**
  - "Lowered auto-send threshold from confidence > 0.9 to > 0.95" is raising the threshold, not lowering it.
  - "Hard limits are unfoolable" overclaims, because they depend on LLM-based value extraction (`extract_values`).
  - Add the real Air Canada ruling (Feb 2024), which makes "we retract" legally risky.

  **S**
- **P2-4. Drift page chart.** The mermaid `xychart-beta` plots two lines with no legend. **S**
- **P2-5. Jury page details.**
  - Asch: "~30% of people conform" should be "~1/3 of critical trials; ~75% conformed at least once".
  - Hung-jury rate "~10%": NCSC (Hannaford-Agor 2002) found about 6% in state courts and about 2.5% federally.
  - England & Wales vs Scotland: Scotland uses 15 jurors and changed its majority rule and abolished "not proven" in 2025 (verify).
  - Russia: "6/8" needs checking.
  - France: assize rules changed, and *cours criminelles départementales* now run without juries.

  **S**
- **P2-6. Oversight page.** The ASCII "Oversight Cost Curve" is broken and contradicts its zone labels. "0.15 + 0.15 = 0.28" is bad notation; it should be 1−0.85². **S**
- **P2-7. Organizational page math.**
  - The cash table counts 2 shift supervisors once: $16, not $32.
  - The nonprofit mitigations sum to $15,500, which leaves a $6,000 margin, not "$5,000".
  - The city budget table headers are misaligned with its columns.
  - Recommend cutting the page anyway.

  **S**
- **P2-8. Expert elicitation details.**
  - "Aggregate using geometric mean (for probabilities)" should be the geometric mean of *odds* (Satopää et al. 2014).
  - The three-point example treats the mode as the median.
  - The beta fit computes beta(5.6, 1.4) and then writes beta(6, 2); the lognormal fit computes σ = 1.7 and then writes 1.5.
  - Cooke 1991's title is *Experts in Uncertainty*.
  - "Elicit (structured elicitation tool)" is wrong; Elicit is Ought's research assistant.
  - Add O'Hagan et al. 2006, the IDEA protocol and Cooke's Classical Model.

  **S**
- **P2-9. Pseudo-Squiggle that will not run.** Several pages label code as `squiggle` that is not valid Squiggle: `if x <= 3: 0.5` blocks, Python-style `for … in enumerate`, `baseRate * 2-5×`, `weights:` keyword syntax, `mixture([d1,d2],[w])` (verify against the current Squiggle API). For a QURI site, make these run or label them as pseudo-code. **M**
- **P2-10. Broken text and stale planning.** `architecture-comparator.mdx` has "Document your analysis in the a decomposition worksheet". `cross-domain-methods/overview.md` still lists "Planned Topics … not yet written". "Emerging AI Safety Frameworks" should now cover RSP/ASL-3 (May 2025), OpenAI Preparedness v2, DeepMind FSF, safety cases, the EU GPAI Code of Practice and SB 53. **S**
- **P2-11. Unbounded multiplicative trust.** `organizational-trust` and `oversight-dilemma` use edge weights such as "0.92" with no defined semantics, which TERMINOLOGY rejects. **S, if the pages are kept**
- **P2-12. Alliance cascades.** "Bilateral reasoning put the chance … at perhaps 5% … roughly a **20× underestimate**" is invented and repeated in the takeaways. Remove it. Clark's *Sleepwalkers* argues contingency rather than near-certainty, so cite the historiographic debate. **S**
- **P2-13. Benchmarks timeline.** The "Short-term (1–3 years) / Medium-term (3–7 years)" horizons are undated; date or remove them. **S**
- **P2-14. Access-control currency.** Clearance reinvestigation periods ("5–6 years TS") have been superseded by Trusted Workforce 2.0 continuous vetting. GAMMA is a sub-compartment of SI. Add confused deputy (Hardy 1988), OAuth 2.1 / MCP authorization, and non-human-identity governance; these are directly relevant to agents. **S**

---

## Per-page triage

| Page | Verdict | Notes |
|---|---|---|
| case-studies/index.md | **Keep** (update) | Reflect cuts/merges; add real-incident table |
| ai-systems/case-study-sydney.md | **Rewrite** | Add Microsoft's real 5-turn fix + sources; drop $ model; soften "ignorance is safety" |
| ai-systems/case-study-success.md | **Rewrite** | Fix internal contradictions; remove decimal fake benchmarks; or cut |
| ai-systems/case-study-near-miss.md | **Rewrite** | Fix 1000×; pair with Air Canada/Chevy real cases |
| ai-systems/case-study-drift.md | **Rewrite** | Reconcile numbers; note model miscalibration |
| ai-systems/anti-patterns.md | **Merge** → design-patterns/least-x-principles (or own design-patterns page) | Not a case study |
| human-systems/alliance-cascades.md | **Keep** | Remove "20×"; light citations |
| human-systems/trust-across-civilizations.md | **Rewrite** | Cut invented tables; fix monastery/Fuchs/RN; cite Leeson |
| human-systems/organizational-trust.md (hidden) | **Cut** | Archived, invented numbers, superseded |
| human-systems/jury-trust.md | **Rewrite** | Math + legal errors; plea-bargain context; half the length |
| human-systems/criminal-trust.md | **Rewrite** | 'Ndrangheta fix; Gambetta; drop ∞ tables |
| human-systems/open-source-trust.md | **Rewrite** (high value) | Fix 1000×; 2024–26 incidents; AI supply chain |
| human-systems/nuclear-launch-authority.md | **Rewrite** | Drop DR tables/Dead Hand ranking; fix Perimeter, France, Lesson 5 |
| human-systems/oversight-dilemma.md | **Cut** (or condense to 600-word thought experiment in design-patterns) | Probability errors, invented $; politically fraught |
| power-dynamics-cases.md | **Rewrite** (qualitative) or cut | Uses rejected RACAP; AlphaFold error |
| cross-domain-methods/overview.md | **Rewrite** | Fix SIL/"three lines"; remove "planned topics"; add AI frameworks |
| cross-domain-methods/lessons-from-failures.md | **Rewrite** (or merge into entanglements/historical-cases) | Add Knight, 737 MAX, CrowdStrike; sources |
| cross-domain-methods/mechanism-design.md | **Merge** → research/system-design/mechanism-design.md | Fix H-M; add scoring rules |
| cross-domain-methods/attack-surface-metrics.md | **Rewrite** | Ordinal-product problem; TERMINOLOGY alignment |
| cross-domain-methods/nuclear-safety-pra.md | **Merge** → research/system-design/nuclear-aerospace-deep-dive.md | Modeled vs observed CDF |
| cross-domain-methods/euler-allocation.md | **Rewrite** (merge with research/risk-methods/financial-risk-budgeting) | Expected loss is linear; CoVaR error |
| cross-domain-methods/asil-decomposition.md | **Rewrite** | Decomposition table, series/parallel, SOTIF/8800 |
| cross-domain-methods/linear-logic-types.md | **Merge** → research/trust-behavior/linear-logic-trust-budgets.md | False Rust/TS claims |
| cross-domain-methods/carbon-budgets.md | **Rewrite** (halve) | Budget figure; fungibility disanalogy |
| cross-domain-methods/access-control-systems.md | **Keep** (fix) | Best page in scope; fix Hanssen, Cuckoo's Egg, RFC, quote |
| experimental/index.md | **Rewrite** | Remove "calibrated"; state status honestly |
| experimental/probabilistic-estimation/index.md | **Keep** (minor) | |
| …/tools/index.md | **Rewrite** | Only list tools that work |
| …/tools/risk-calculator.mdx | **Rewrite** | Rebuild on @quri/squiggle-lang; per-period loss sim |
| …/tools/trust-updater.mdx | **Cut** (or fix NaN + modifier) | Per REVISION_PLAN 4c |
| …/tools/sensitivity-dashboard.mdx | **Cut** | Per REVISION_PLAN 4c |
| …/tools/architecture-comparator.mdx | **Cut** | Model contradicts framework thesis |
| …/estimates/index.md | **Rewrite** | Deliver source/last-updated or drop the promise |
| …/estimates/probability-priors.md | **Rewrite** | Units, taxonomy, real benchmark grounding |
| …/estimates/damage-distributions.md | **Keep** (fix CIs, VSL, IBM) | Most defensible estimates page |
| …/estimates/mitigation-effectiveness.md | **Rewrite** | Confidence labels; canonical ρ model |
| …/estimates/trust-calibration.md | **Rewrite** | Modifier; rule-of-three; defection caveat |
| …/estimates/cross-domain-benchmarks.md | **Merge** → cross-domain-methods (drop "AI current" column) | |
| …/estimates/expert-elicitation.md | **Keep** (minor fixes; promote out of experimental) | Good page |
| …/estimates/incident-database.md | **Rewrite** | Remove fabricated AIID shares; add AIM, EU AI Act, SB 53 |

**Counts (40 pages):** Keep 6 · Rewrite 24 · Merge 5 · Cut 5.

---

## Facts to verify (before acting on corrections)

1. Microsoft Bing chat limits announced Feb 17, 2023: 5 turns/session, 50/day. Also that the model was GPT-4-based (Microsoft, Mar 14, 2023).
2. 1979 NORAD training-tape incident vs the June 3, 1980 chip incident: which displayed "2,200" missiles? The page attributes 2,200 to 1979. Web results tie Brzezinski's "2,200" call to 1980 in some accounts and 1979 in others; resolve against the NSArchive documents.
3. Able Archer 83: was it "Soviet intelligence assets reported it was exercise"? The usual narrative credits Lt. Gen. Perroots' non-escalation and Gordievsky's later reporting.
4. Perimeter/Dead Hand: whether human duty officers must authorize the command-rocket launch (Hoffman 2009, Yarynich).
5. France: any PM counter-signature convention for nuclear employment. Likely none; check the 1964 and 1996 decrees.
6. ISO 26262-9 decomposition list (secondary-source confirmed: C → B(C)+A(C) | C(C)+QM(C); A+A is not allowed for C) and ISO 26262-6 coverage tables per ASIL.
7. DO-178C Level A objective count (71) and that MC/DC applies only to Level A.
8. Hanssen damage assessment (DOJ OIG 2003 report).
9. Fuchs: how many years he accelerated the Soviet bomb (estimates range 1–2 to 2–4).
10. Benedictine chapter frequency and confession practice; Monte Cassino continuity.
11. Second Mafia War dates and casualties; 'Ndrangheta kinship structure and low pentiti rate.
12. Hung-jury rates (NCSC 2002), share of US convictions by plea, Russia's jury voting rule, Scotland's 2025 reform.
13. Remaining 1.5°C carbon budget: IGCC 2025 gives about 130 GtCO₂ from Jan 2025 (web-checked headline; confirm the likelihood level).
14. US DOT VSL 2024/2025 guidance value; IBM Cost of a Data Breach 2025 figures.
15. CSA CBRA tier thresholds (Low 1–6 / Medium 7–24 / High 25+) against the Nov 2025 whitepaper.
16. CVSS aggregation formula "Γ(V) = 10 − (1/σ)f(V)": find a source or delete it.
17. Weekly downloads for core-js, colors, left-pad (2016 peak) and node-ipc; current npm/PyPI package counts.
18. xz: affected distributions and versions (5.6.0/5.6.1), and that the payload was in the release tarball, not git.
19. LTCM "2–3 years of history" and leverage figures; "March 2020 risk-parity drawdowns 13–43%".
20. Current Squiggle syntax for mixtures (`mx`/`mixture` signatures), whether bare non-final expressions are allowed, and whether underscores are valid in identifiers. This determines whether the exported "Squiggle code" runs.
21. "Elicit", "Expert Knowledge and Its Application (Kadane & Wolfson)", "Learning from AI Failures (Yampolskiy)", "Incident Response for ML Systems (Google)": check that these citations exist as titled.
22. AIID incident count (page: "1,000+"), and whether any AIID taxonomy supports the 35/20/15/10/10/5 split (expect: no).

---

## Top 5 recommendations

1. **Cut the fake-quantitative layer from the human case studies; keep the history.** Delete the P × $ tables and every conclusion they drive: Dead Hand "safest", presidency $65B, pirate "10× democracy discount", WW1 "20×", criminal ∞-tables, Treasury $4.4B. Fix the factual inversions in P0-2, P0-4, P0-12, P1-3 and P1-4. Cut `oversight-dilemma` and `organizational-trust`. This is the single biggest credibility gain per hour. **(M–L)**
2. **Fix or remove the tools, and make the "Squiggle" claim true.** Rebuild one calculator on `@quri/squiggle-lang` with per-period Bernoulli × damage simulation, which is what `REVISION_PLAN` 4c specified. Cut Trust Updater, Sensitivity Dashboard and Architecture Comparator. Correct the track-record modifier everywhere to (1−post)/(1−prior). **(M)**
3. **Replace invented AI scenarios with 6–10 real 2023–2026 agent incidents.** Use Sydney with Microsoft's actual fix, Air Canada, Chevy, Replit, the Amazon Q wiper, chalk/Shai-Hulud, slopsquatting/MCP, and the OpenAI board crisis. Map each to framework concepts: privilege overhang, exposure envelope, verification layer. Keep at most one clearly labeled hypothetical. **(L)**
4. **Do a practitioner-accuracy pass on cross-domain-methods and merge the duplicates.** Fix ASIL (table, series/parallel, SOTIF/8800), Euler (expected loss is linear; CoVaR), mechanism design (multitask; scoring rules), Rust/TS claims, and modeled vs observed nuclear CDF. Merge mechanism-design, linear-logic, nuclear-pra and euler into their `research/` counterparts, and absorb cross-domain-benchmarks. Have one domain practitioner per page review it. **(M–L)**
5. **Make the experimental registry honest or unpublish it.** Remove the fabricated AIID shares and the "AI current" benchmark column. Downgrade all confidence labels to Speculative unless sourced. State units on every prior. Add `source` / `last-updated` fields or drop the promise. Apply the site's canonical ρ model to mitigation stacking. Update constants (IBM 2025, DOT VSL, IGCC 2025), and add the EU AI Act Art. 73, SB 53 and OECD AIM incident-reporting regimes. Until that is done, mark the section `draft` and hide it from the sidebar. **(M–L)**

---

## Counts

- Findings: **P0: 13 · P1: 23 · P2: 14** (50 total)
- Triage: **Keep 6 · Rewrite 24 · Merge 5 · Cut 5** (40 pages)
