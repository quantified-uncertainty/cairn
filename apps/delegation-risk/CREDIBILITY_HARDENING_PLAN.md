# Credibility Hardening Plan (Phase 3.5)

Source: 9-agent full-corpus review, 2026-06-10 (all findings below carry file references and,
where applicable, the correct values — executors should NOT need to re-derive anything).
Goal: purge fabricated empiricism, reconcile signature numbers, propagate the canonical math
to the periphery. This precedes Phase 4 (calibration): calibrated examples next to fabricated
citations won't be believed.

**Model policy** (per 1M tokens: Fable $10/$50 · Opus 4.8 $5/$25 · Sonnet 4.6 $3/$15 · Haiku 4.5 $1/$5):
Haiku for banners/sweeps/greps; Sonnet for all prescribed edits (the punch list states the
target text or value); Opus only for the two editorial rewrites and final spot-audit;
Fable only for Batch 5 (three small canon edits, ~1 page each). Run batches as cheap-model
sessions or subagents pointed at this file; each batch lists its own verification step.

Canonical model (do not re-litigate): P(all n layers fail) = (1−ρ)·∏pᵢ + ρ·min(pᵢ);
identical layers: Tax = (1−ρ) + ρ·p^(1−n); common-cause floor ρ·min(p) is unreachable by
adding layers. Canonical homes: delegation-risk/risk-propagation.md (rule),
entanglements/fundamentals/formal-definitions.md (tax derivation).

All paths below relative to `apps/delegation-risk/src/content/docs/`.

---

## Batch 0 — External fact verification (Sonnet + WebSearch, ~30 min)

The review's real-history corrections came from reviewer knowledge, not web checks.
Verify before Batch 4 acts on them:
- [x] Petrov incident Sept 26 1983 vs Able Archer 83 Nov 7–11 1983 (i.e. NOT "ongoing").
      → CONFIRMED: Petrov = Sep 26 1983 (Wikipedia); Able Archer 83 = Nov 7–11 1983 (Wikipedia/Nuclear Museum) — the two events are 6 weeks apart, Able Archer was not "ongoing" during Petrov.
- [x] German criminal courts use lay judges (Schöffen) in mixed panels — "Germany: no jury,
      professional judges only" is wrong as stated.
      → CONFIRMED: Wikipedia/Britannica confirm Schöffengerichte are mixed panels (1–2 professional judges + 2 lay judges); "professional judges only" is false except for narrow political-crime cases.
- [x] Ramos v. Louisiana (2020): unanimity constitutionally required for state criminal convictions.
      → CONFIRMED: 590 U.S. 83 (2020) held Sixth Amendment unanimity requirement incorporated against states, overturning Apodaca v. Oregon; previously only Louisiana and Oregon allowed non-unanimous verdicts (Wikipedia/SCOTUS).
- [x] Nuclear CDF: NRC target ~1e-4/reactor-yr, modern plants ~1e-5; 1e-9/flight-hour is the
      FAA/EASA catastrophic-condition target (aviation).
      → CONFIRMED: NRC subsidiary goal = 1e-4/reactor-yr (nrc.gov glossary); EPRI 2008 industry average ~2e-5; FAA AC 25.1309-1 and EASA set 1e-9/flight-hour for catastrophic conditions (faa.gov, sassofia.com).
- [x] WASH-1400 (Rasmussen) 1975 predates TMI 1979.
      → CONFIRMED: WASH-1400 published October 1975 (NRC docs, Wikipedia); Three Mile Island accident March 1979; TMI accelerated adoption of PRA methods introduced by WASH-1400.
- [x] Anthropic disclosed Constitutional Classifiers compute overhead (~23.7%).
      → CONFIRMED: Anthropic's original Constitutional Classifiers paper (anthropic.com/research/constitutional-classifiers, arXiv 2501.18837) discloses 23.7% inference overhead on production traffic; the 2026 Constitutional Classifiers++ reduced this to ~1%.
- [x] ISO 26262: ASIL decomposition addresses systematic faults via independence + rigor;
      it does not multiply hardware failure rates (ASIL B random-HW target ~1e-7/h).
      → CONFIRMED: ASIL B PMHF target = 100 FIT = 1e-7/h (ISO 26262 Part 5; functionalsafetyengineer.com); decomposition targets systematic fault independence via rigor/independence requirements, not multiplication of random-HW rates.
- [x] Knight & Leveson 1986 N-version programming experiment (for Batch 7 citation).
      → CONFIRMED: "An Experimental Evaluation of the Assumption of Independence in Multiversion Programming," IEEE Trans. Software Eng. 12(1) 1986 (Semantic Scholar, KTH PDF); 27 independently-written programs tested on 1M cases; found statistically significant correlated failures — foundational result that redundant software fails dependently.
Record results inline here; mark any failed check so Batch 4 skips that item.

## Batch 1 — Labeling & banners (Haiku, mechanical)

- [x] Add the standard `:::caution[Illustrative Example]`-style banner (copy the one in
      case-studies/ai-systems/case-study-success.md) to all four worked examples:
      design-patterns/examples/{research-assistant,code-deployment,trading-system,healthcare-bot}-example.md.
- [x] Add a fiction banner (model on case-studies/anomaly-chronicles/index.md's framing) to the
      6 unlabeled Chronicles pages: containing-mr-x.md, year-ten.md, power-struggles.md,
      mr-x-perspective.md, protocol-catalog.md, insurance-bot-spec.md. protocol-catalog.md and
      insurance-bot-spec.md are styled as real reference docs — banner must be at the very top.
- [x] case-studies/index.md: frontmatter description says "Real-world examples" over a table of
      hypotheticals — change description, and tag hypothetical rows in the index tables
      (Code Review Bot "8 months in production", "$50K error caught" etc.).
- [x] experimental/probabilistic-estimation/index.md: change "Calibrated priors" claim to
      "plausible starting priors (uncalibrated)".
Verify: grep each touched file for the banner; pnpm build.

## Batch 2 — Provenance purge (Sonnet, prescribed deletions/relabels)

- [x] research/trust-behavior/correlated-failure-modeling.md: bibliography entry ~line 951
      admits "Carlini... (Hypothetical paper matching research description)". Delete the entry
      AND the body claims resting on it (~line 35: "73% and 68% success rates" GPT-4→Claude/Gemini
      transfer). Also fix: Hendrycks et al. 2021 (MMLU) contains no failure-correlation data —
      remove the "C ≈ 2.4 GPT-J/GPT-NeoX" attribution; Lee et al. 2022 is within-corpus dedup,
      not "50-60% overlap between C4/Pile/Common Crawl" — remove or re-source. Keep the file's
      good beta-factor worked example (β=0.1, 1e-4 vs 7e-10) — that part is sound.
- [x] research/risk-methods/risk-measurement-and-pricing.md §§2.6–4: every number labeled
      "Empirical measurements (from trust-website cost-benefit analysis)" (e.g. "Median latency:
      2.3s → 4.1s", "Data leak 0.5%/mo, $50,000") — relabel as illustrative hypotheticals; the
      "trust-website" source is the site's own invented worked example.
- [x] design-patterns/tools/empirical-tests.md: the results tables ("73% fewer successful
      attacks", "37× faster scheming detection") are synthetic with no code/source. Either
      convert to clearly-marked hypothetical predictions ("what we'd expect to measure") or
      delete the tables; strengthen the caveat box either way.
- [x] getting-started/common-mistakes.md: opens "the most frequent mistakes teams make when
      implementing delegation risk frameworks" — no such teams exist. Reframe as anticipated
      failure modes.
- [x] getting-started/faq.md: "Red team results: Systems designed with these constraints are
      harder to exploit" — unsourced; delete or reframe as expectation.
- [x] case-studies/human-systems/nuclear-launch-authority.md: "~45% chance of escalation per
      expert estimates" is fabricated (and "$22.5T saved" computed from it) — delete both;
      present the Petrov counterfactual qualitatively.
- [x] case-studies/ai-systems/{case-study-success,case-study-drift,case-study-near-miss}.md:
      invented benchmarks inside labeled hypotheticals ("GPT-4 missed this pattern 40% of the
      time", "manipulated 3/10 times", "block rate 12/12", "4.2/5 satisfaction") — rephrase as
      explicitly invented-for-the-scenario, no decimal-precision fake data.
- [x] experimental/probabilistic-estimation/estimates/mitigation-effectiveness.md ~lines 277-287:
      "$111.11 per 1% reduction" cost-effectiveness table — delete or relabel as illustrative
      arithmetic on illustrative inputs.
- [x] entanglements/research/ai-debate-entanglement.md: claims resting on "Anthropic Internal
      Studies (as reported in various publications)" — remove or replace with checkable citations.
Verify (Haiku): grep -rn for "trust-website", "45%", "111.11", "Hypothetical paper" → 0 hits
in content; pnpm build.

## Batch 3 — Known-value arithmetic fixes (Sonnet; correct values given)

- [x] case-studies/ai-systems/case-study-sydney.md ~lines 247-256: 0.01 × $1M × 1M conv/day
      = **$10B/day**, not "$10M/day"; the framework version is **$10M/day**, not "$10K/day"
      (the 1000× ratio is unchanged). Also soften "users... leave their spouses" → one
      documented user (Kevin Roose).
- [x] delegation-risk/walkthrough.md Part 2: post-GPS total is 5 + 0.50 + 10 = **$15.50**
      (not $16.50); post-bond residual = delay $10 + accidental loss $5 ≈ **$15** (not $5.25).
      Recompute the Part 2 running totals consistently.
- [x] case-studies/human-systems/nuclear-launch-authority.md Part 7: UK false-positive DR
      derived as 4.2e-5 × $50T = **$2.1B** but tabulated as $210M — make table match derivation;
      France's row has no derivation — derive or cut.
- [x] cross-domain-methods/asil-decomposition.md lines ~51-53: "1e-8 = 1e-4 × 1e-4" contradicts
      the page's own table (ASIL B ≈ 1e-7/h). Rewrite using the page's own figures and add one
      sentence: ISO 26262 decomposition is about independence against systematic faults, not
      multiplying random-hardware rates (pending Batch 0 check).
- [x] cross-domain-methods/linear-logic-types.md: line ~53 says `!A` = "as many A's as you
      need" (correct); line ~99 says "`!T` — must use exactly once" (wrong — that's the bare
      linear type). Fix line 99. Line ~29 glosses ⊕ as external choice — that's `&` (with);
      ⊕ is internal choice (the provider picks). Fix the gloss.
- [x] design-patterns/examples/trading-system-example.md: budget table sums to $49,500/99%
      but text claims $50,000/100% — reconcile.
- [x] design-patterns/examples/research-assistant-example.md: TL;DR claims "~$1,770/month" but
      the page has no budget table — add the table or cut the number.
- [x] design-patterns/principles-to-practice.md: "Code Deployer: 55%" listed under the Research
      Assistant example (contamination) and percentages sum to 89% — fix both.
- [x] delegation-risk/overview.md flagship verifier example: stated total **$671** is not
      supported by the shown table (only malicious-code row changes $100→$1, giving
      1770 − 99 = $1,671). Rebuild the table so every row's change is shown and the total is
      auditable (if the verifier also catches buggy code, show that row's reduction explicitly).
      This one needs care — assign Opus.
- [x] delegation-risk/overview.md Step 2: "Risk_inheritance = 0.95 × 0.85 = 0.8075" followed by
      "~19% of potential damage propagates" — the named quantity and its interpretation are
      complements. Rewrite so the quantity, its meaning, and the arithmetic agree — Opus.
- [x] delegation-risk/risk-propagation.md + exposure-cascade.md both have sidebar order: 5 —
      renumber.
Verify (Haiku): grep for the old wrong values ($671, $16.50, $5.25, "$10M/day" in sydney,
"$210M") → 0 hits; pnpm build.

## Batch 4 — Real-history corrections (Sonnet; gated on Batch 0)

- [x] nuclear-launch-authority.md: "Able Archer exercise ongoing" during Petrov (Sept 1983) is
      false — replace with RYaN-era paranoia framing.
      → NO CHANGE NEEDED: file already uses RYaN-era framing (done by prior batch); Able Archer
        appears only as a separate 1983 table row, not concurrent with Petrov.
- [x] case-studies/human-systems/jury-trust.md: (a) "Germany: 0 (no jury), professional judges"
      → mixed Schöffen panels; (b) add Ramos v. Louisiana (2020) and update "most US
      jurisdictions require unanimous"; (c) the unanimity table's "P(acquit guilty) ≈ 86%" is an
      independence-model artifact contradicted by the page's own Part 6 — label the table
      explicitly as a naive independence toy model and add one line noting jurors deliberating
      in one room are a textbook entangled committee (this also removes a self-contradiction
      with the site's flagship claim).
      → DONE: All three fixes applied.
- [x] Nuclear/aviation figure sweep: cross-domain-methods/overview.md TL;DR + line ~19
      ("nuclear plants achieve 1e-9", "nuclear... targets like 1e-9 per flight hour") →
      attribute 1e-9/flight-hour to aviation, ~1e-4 target / ~1e-5 achieved CDF to nuclear.
      Same fix in getting-started/core-concepts.md ("1e-9 per reactor-year") and check
      delegation-risk/overview.md ("~1e-6") and glossary (already correct) so all pages agree.
      → DONE: overview.md TL;DR and line ~19 fixed; core-concepts.md note fixed; overview.md
        updated ~1e-6 → ~1e-5 with NRC target noted; glossary confirmed correct (no change).
- [x] cross-domain-methods/nuclear-safety-pra.md line ~9: PRA "developed after TMI" →
      WASH-1400 (1975) predates TMI (1979); TMI accelerated adoption.
      → DONE: Fixed.
- [x] research/trust-behavior/empirical-scheming-reduction.md: Constitutional Classifiers
      overhead "not disclosed" → ~23.7% (per Batch 0); fix date/ID mismatches flagged in review:
      arXiv 2512.02157 labeled "December 2024", OpenAI/Apollo "(2024)" vs "2025 joint research",
      Panigrahy "(2024)" with 2509 ID — make labels match the IDs.
      → NOTE: Constitutional Classifiers fix applied to risk-measurement-and-pricing.md (where
        the claim actually lives); 2512.02157 year fixed in empirical-scheming-reduction.md;
        OpenAI/Apollo heading changed from (2024)→(2025); Panigrahy fixed in
        formal-verification-limits.md (where it actually lives). Build passes.
Verify: re-read changed passages; pnpm build.

## Batch 5 — Canon authoring (FABLE ONLY — three small edits, then stop)

This is the only batch needing top-tier judgment. Total scope: ~3 pages of new/edited text.

- [x] 5a. DONE (2026-06-10). DECISION: canonical example = three 90% layers, rho=0.5 ->
      P(all miss) = 0.5*0.001 + 0.5*0.1 = 0.0505 ~= 95% protection, tax ~= 50x (matches the
      existing entanglements diagram and the corpus's most-repeated example; NOT the plan's
      rho=0.3 suggestion). Written as "The Canonical Example" section (anchor
      #the-canonical-example) in entanglements/index.md. Homepage SWITCHED from the
      five-layer/99.999% version to this three-layer version; "10-100x" kept as the general
      range with ~50x as the instance. Batch 6 must replace all restated illustrations with
      this example or a link to /entanglements/#the-canonical-example.
      Original item: **Canonical example block.** Write ONE canonical entanglement illustration (suggest:
      three 90% verifiers, ρ=0.3 → mixture gives 0.7×0.001 + 0.3×0.1 = 3.07% failure ≈ 31× tax;
      state both the 99.9% naive and ~97% actual protection) as a short reusable passage in
      entanglements/index.md or core-concepts.md, with exact arithmetic shown. Decide the
      homepage headline: either keep "five 90% layers → 95% vs 99.999%" and change the claimed
      ratio (that example is ~5,000× in miss-rate at ρ≈0.5), or switch the homepage to the
      canonical 31× example to match the "10–100×" claim. One choice, written down here.
- [x] 5b. DONE. risk-propagation.md now has section "What ρ means and how to estimate it":
      rho = beta-factor mixing weight = phi (failure-indicator Pearson) for equal-p layers;
      NOT latent/copula correlation (latent 0.4 ~= phi 0.19 at p=0.1), NOT Jaccard joint-failure
      share (~=0.05 for independent layers at p=0.1). Canonical recipe: (1) same labeled
      challenge set, (2) pairwise phi = [P(both miss) - pA*pB]/sqrt(pA(1-pA)pB(1-pB)),
      (3) rho = max pairwise phi, (4) unmeasured + shared provider/training/context -> assume
      rho >= 0.5. All table/calculator rho declared phi-scale. The k=2 "deliberate conservatism"
      paragraph rewritten as a scale artifact: mixture exact at k=2 on matched scales, genuinely
      conservative k>=3. Batch 6 propagates this recipe to modeling.md and types.md.
      Original item: **ρ semantics.** (i) Add a short "what ρ is and how to estimate it" passage to
      risk-propagation.md: the model's ρ is a mixing weight; for identical layers it equals the
      failure-indicator Pearson correlation; it is NOT the latent-Gaussian ρ (latent 0.4 ≈
      indicator 0.185 at p=0.1) and NOT a Jaccard index. State which scale the "Realistic
      Correlation Estimates" table is on. (ii) Correct the k=2 "deliberate conservatism" claim —
      it's an artifact of comparing latent ρ to mixing weight; genuine conservatism appears
      k≥3. (iii) Write the canonical 4-sentence ρ-estimation recipe that Batch 6 propagates to
      modeling.md and types.md.
- [x] 5c. DONE. core-concepts.md propagation section rewritten: serial chains apply the
      mixture to WORKING probabilities (correlation helps; product conservative as-is), parallel
      layers to MISS probabilities (correlation hurts; correction safety-critical), linking the
      canonical example. Insider-voice "retired rules" litany replaced with a link; the false
      "other pages cross-link rather than restating" claim softened to "authoritative form."
      Original item: **core-concepts.md serial-chain fix** (~lines 100-104): the parallel "all fail"
      mixture is applied to a serial chain — wrong event semantics. Rewrite per
      risk-propagation.md (apply mixture to working probabilities for chains) and restore the
      bias-direction asymmetry (product already conservative for chains; correction matters for
      parallel stacks). Also delete the false claim that the formula appears "only here" —
      or make it true by doing Batch 6's dedup.

## Batch 6 — Canon propagation (Sonnet, executing Batch 5's outputs)

- [x] entanglements/mitigation/solutions.md §5: REWRITE against the canonical model. Delete
      `Effective_layers = Nominal × (1 − avg_correlation)` and the "7+ layers reaches 99.9% at
      ρ=0.5" claim (the floor ρ·p = 5% makes 99.9% unreachable at any layer count; 3 layers at
      ρ=0.5 ≈ 1.3 effective layers, ~94.95% protection — values verified). Reframe §5's advice
      as: added layers buy little; reducing ρ is what moves the floor.
      → DONE: Rewrote §5 with layer-count table showing 5% floor, intervention table showing how
        ρ reduction moves the floor, updated budgeting worksheet. Deleted Effective_layers formula.
- [x] entanglements/fundamentals/types.md: replace the incoherent ρ formula
      (`P(both fail | one fails) / P(either fails)`, which also can't produce the page's
      "ρ < 0" case) with Batch 5b's recipe.
      → DONE: Replaced with phi coefficient formula + 4-sentence recipe + link to risk-propagation.
- [x] entanglements/detection/modeling.md pseudocode (~line 352): `both_fail/either_fail` is a
      Jaccard index (≈0.053 for independent 10% layers), not the model's ρ — replace with the
      5b recipe (phi/indicator correlation) and note the scale explicitly.
      → DONE: Pseudocode now computes phi = (p_both - p_a*p_b)/sqrt(...); added scale note.
- [x] entanglements/detection/correlation-calculator.md Example 1: averaging pairwise ρs
      (0.5,0.2,0.2→0.3) into the single-ρ table — add the point-of-use caveat (single shared-ρ
      limitation already stated in formal-definitions; link it).
      → DONE: Added caveat on averaging (can understate), max-pairwise advice, link to
        formal-definitions. Added phi-scale note at top with recipe link.
- [x] Number-consistency sweep: replace every restated entanglement illustration (five-minute-
      intro "closer to 91%", common-mistakes + for-engineers "92%, not 99.9%", homepage example
      per 5a's decision) with the canonical block or a link to it. Then the "10–100×" claim
      matches its example everywhere.
      → DONE: five-minute-intro: "closer to 91%" → "~95%, ~50× tax" + link to canonical example.
        common-mistakes: "92%" → "~95%, ~50× tax" + link. for-engineers: same. quick-reference
        and faq.md had no three-verifier variant. 99.999% in correlation-calculator five-layer
        table is the independent baseline (correct); reading-order.md usage is correct ("not
        99.999% safe" framing). No further changes needed.
- [x] getting-started/faq.md "Isn't this just defense in depth?" answer: rewrite around the
      entanglement tax (currently doesn't mention it — the novelty story must match the
      homepage). Use 5a's canonical example.
      → DONE: Rewrote with 3-point structure: (1) entanglement tax + canonical ~50× example,
        (2) quantified risk budgeting, (3) accident/defection decomposition.
- [x] design-patterns/tools/trust-propagation.mdx: rule labeled "Weakest Link" actually computes
      1−∏(1−Tᵢ) (at-least-one-succeeds) — rename correctly or fix the formula.
      → DONE: Renamed to "At Least One Succeeds (parallel redundancy)" in dropdown, description,
        and section heading. Added note that true weakest-link = min(Tᵢ), not this formula.
Verify (Haiku): grep for "91%", "92%, not 99.9", "Effective_layers", "both_fail" → only
canonical forms remain; pnpm build + link sweep.

## Batch 7 — Prior-art honesty (Sonnet draft + Opus 30-min review)

- [x] Add a "Where this comes from" subsection to entanglements/research/research-connections.md
      (currently surveys ten fields but omits reliability engineering — the closest one):
      Knight & Leveson 1986 (independently-built redundant software fails dependently),
      Reason's Swiss-cheese model (used unattributed in modeling.md — attribute it there too),
      nuclear β-factor common-cause-failure literature (Mosleh; NUREG/CR-4780). Frame: "CCF
      analysis applied to AI delegation, extended to active influence and adversarial
      coordination" — the extension is the novel part; say so.
      → DONE: New section "Reliability Engineering & Common-Cause Failure (the closest prior art)"
        added as FIRST surveyed field in research-connections.md (~490 words). Covers Knight &
        Leveson 1986, Fleming/NUREG/CR-4780/Mosleh CCF lineage, Reason 1990 Swiss-cheese, and
        positioning paragraph on active influence + adversarial coordination as the novel AI
        extensions. Swiss-cheese attribution (Reason, 1990) added inline in modeling.md. Summary
        table updated with Reliability Eng./CCF row.
- [x] Cross-link from formal-definitions.md and reference/related-approaches.md.
      → DONE: formal-definitions.md "beta-factor...borrowed from nuclear safety" now links to the
        new CCF section. reference/related-approaches.md has a new "vs Reliability Engineering /
        Common-Cause Failure Analysis" entry (~160 words) with cross-link. Build: 163 pages, clean.

## Batch 8 — Index/cross-ref rot sweep (Haiku finds, Sonnet fixes)

- [x] entanglements/index.md promises Madoff and Three Mile Island case studies
      (historical-cases.md has neither) and advertises hidden-coordination.md with four content
      bullets (it's a merge tombstone) — fix the index to match reality.
      → DONE: Removed Madoff/TMI bullets from Historical Case Studies listing. Removed Hidden
        Coordination section entirely (Detecting Influence section already existed above it).
- [x] Design-patterns TL;DRs naming nonexistent patterns: "Output Sampling" (verification.md),
      "Anomaly Aggregation"/"Behavioral Baselines" (monitoring.md), "Information Firewalls"/
      "Context Stripping" (information.md), "Cross-Validation" (multi-agent.md). Dangling refs:
      Semantic Firewall, Privilege Bracketing, Circuit Breaker Cascade, Watchdog Timer,
      Prediction Market Aggregation. index.md "Patterns in Practice" claims trading example
      uses "Capability Airlock" (it doesn't). Fix or delete each reference.
      → DONE: TL;DRs repointed to real patterns on each page. All Related Patterns dangling refs
        replaced: Privilege Bracketing→Cooling Off Period; Semantic Firewall→Gateway Chokepoint
        (structural.md, index.md threat table, challenges.md, modeling.md); Circuit Breaker
        Cascade→Graceful Degradation Ladder/Blast Radius Containment/Dead Man's Switch (4 recovery,
        2 temporal, 1 monitoring locations); Watchdog Timer→deleted; Prediction Market
        Aggregation→Graduated Autonomy. Trading example row: Capability Airlock→Bulkhead Isolation.
- [x] entanglements/index.md opening says five layers/99.999% while its diagram shows
      three/99.9% — align.
      → Already correct: opening was three layers/99.9%; diagrams and Canonical Example consistent;
        no five-layer/99.999% remnants found on this page.
Verify: link sweep clean; spot-grep the named ghosts → 0 hits. Build: 163 pages, clean.

## Batch 9 — Final verification (Haiku + one Opus spot-audit)

- [x] pnpm build clean (163 pages / 172 HTML); link sweep: 27,520 internal links, 0 broken
      pages, 0 broken anchors (two %CF%81-encoded ρ anchors verified as browser-valid).
- [x] Grep sweeps clean: $671, $16.50, $5.25, $210M, "Hypothetical paper", trust-website,
      111.11, Effective_layers, "closer to 91%", "92%, not 99" → 0 hits; Sydney $10B/$10M
      correct; remaining 1e-9 mentions all correctly aviation-attributed (fixed one
      Aviation/nuclear-grade conflation in cross-domain-benchmarks.md).
- [x] Opus coherence audit of the 6 most-edited pages: clean except one seam (solutions.md
      layer table 2→3 row juxtaposition) — fixed inline; canonical numbers confirmed
      consistent across homepage/five-minute-intro/faq/entanglements index.
- Original: pnpm build; full internal-link sweep (172 pages baseline); Haiku grep-sweep for
  all old values listed in Batches 2-3 verify lines; One Opus agent re-reads the 6 most-edited pages (homepage, core-concepts,
      risk-propagation, solutions.md, sydney, nuclear-launch-authority) end-to-end for
      coherence — NOT a re-review, just "did the edits leave seams".

---

## Deferred (separate decisions, not this phase)

- Intro-stack collapse (5 competing intros → 1) and "lead with the tax" restructure — editorial,
  Opus-led, ~1 day. High value but touches navigation; do after the above lands.
- One worked example using canonical ρ-corrected math end-to-end — this IS Phase 4b; keep it there.
- research/theory/ trust-* suite cuts (trust-accounting, trust-at-scale, trust-protocols,
  trust-optimization flagged deletable) — fold into the existing Phase 1-style merge process.
- Anomaly Chronicles trim (~25k → ~5k words) and oversight-dilemma reframe — Ozzie judgment call.
- power-dynamics equation reconciliation (DR = Cap×Misalign vs accident channel; Capability =
  Power×Agency vs Strong Tools) — either Fable for an afternoon or badge section speculative.
- Principal-agent foundations page — already Phase 5.

## Cost shape

Discovery is done (this plan embeds it). Execution is ~90% Sonnet/Haiku on prescribed edits:
roughly 2-4M Sonnet tokens + sweep Haiku ≈ low tens of dollars. Fable appears only in Batch 5
(~3 pages of writing). Sequencing: 0 → (1,2,3 in parallel) → 4 → 5 → 6 → (7,8 parallel) → 9.
