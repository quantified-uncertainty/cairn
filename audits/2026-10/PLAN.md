# CAIRN Wiki Improvement Plan — October 2026

This plan comes from seven read-only audits run on 2026-10-15. Each audit read its section in full or close to it. About 115 of the cited arXiv IDs were checked against the arXiv API (all 70 in Reasoning Processes, about 45 in the DR research section). The full findings, with quoted evidence and per-page triage, are in the sibling files:

| Report | Scope | Score | P0 / P1 / P2 |
|---|---|---|---|
| `dr-core.md` | Delegation Risk: home, getting-started, delegation-risk/, power-dynamics/, reference/, plan docs | 4/10 | 16 / 27 / 15 |
| `dr-patterns-entanglements.md` | DR design-patterns/ (29) + entanglements/ (26) | 4/10 | 13 / 20 / 14 |
| `dr-research.md` | DR research/ (28 pages, 91k words) | 3.5/10 | 9 / 14 / 11 |
| `dr-cases-methods-experimental.md` | DR case-studies/, cross-domain-methods/, experimental/, interactive tools | 4/10 | 13 / 23 / 14 |
| `eval-eng.md` | Evaluation Engineering | 5.5/10 | 8 / 18 / 13 |
| `reasoning.md` | Reasoning Processes (+ label-swap harness) | 6/10 | 5 / 12 / 9 |
| `meta-infra.md` | Meta wiki (3/10) + shared infrastructure (5/10) | 3 / 5 | 9 / 18 / 16 |
| **Total** | ~390k words, ~220 pages | | **73 / 132 / 92** |

**Read the scores as a ranking, not as measurements.** The audit agents share my priors, they had no web access for most fact checks, and each report lists claims that still need checking ("facts to verify" / "citations to verify"). The P0 items I spot-checked held up: the Factor(T,U) "41%→70%" figure is on 3 pages; RACAP appears 32 times; arXiv 2401.09876 is cited as a human-trust paper.

---

## 0. Decisions (resolved 2026-10-15; see BRIEF.md)

Resolved: D1 = (b) contract; D2 = delete with redirects; D3 = (i) plus (ii) for headline numbers; D4 = research exploration, not definitive; D5 = yes, run and publish; D6 = rebuild as CAIRN Handbook; D7 = yes.

### Original options

These change what everything downstream does.

**D1. What is Delegation Risk for?** It is 297k words at roughly 4/10, which makes it most of the work and most of the reputational exposure. Three options:
- (a) Repair everything in place. This costs the most and leaves a still-bloated site. I don't recommend it.
- (b) **Contract hard to a core of about 80–120k words (recommended).** Keep the defensible spine: the risk = Σ P×D framing, risk-propagation, runtime accounting, the entanglement tax with beta-factor math, and the scheming/control evidence page. Fix that core rigorously, keep about 15–20 AI-specific patterns, and cut or merge the rest. The audits' triage already proposes roughly: research 28→10 pages, entanglements 26→12, patterns 45→15–20, and about 10 cases/tools cut.
- (c) Freeze it as an archived "v1" with a banner, and put the effort into the two newer wikis.

**D2. Where the cut content goes.** Delete it with redirects, or move it to an `archive/` area that is unlisted and noindexed? I recommend deleting with redirects; git keeps the history.

**D3. The invented-numbers policy.** The audits found invented dollar×probability tables everywhere, often presented as data, with conclusions drawn from them. Three possible rules:
- (i) Ban invented quantities unless the page labels them "illustrative" and draws no conclusion from them.
- (ii) Require a Squiggle-style distribution plus a source or elicitation note.
- (iii) Remove them.

I recommend (i) as the floor and (ii) for the handful of headline numbers.

**D4. Reasoning Processes identity.** Is it a "textbook for a new field" (what the site says now) or a "research agenda for building strong reasoners" (what CLAUDE.md says)? This decides whether a "Building Strong Reasoners" chapter gets written.

**D5. Spend on real experiments.** Two cheap runs would give the sites their first empirical results:
- The label-swap harness on about 5 current models. It costs cents, after the harness bugs are fixed.
- A hand-labelled sample of RoastMyPost flags and a Squiggle AI calibration check.

Do you want those run, and do you want the results published, null results included?

**D6. Meta wiki.** About 63% of it documents the removed `apps/longterm`, and it has 101 broken links. Should I rebuild it as a "CAIRN Handbook" hub (recommended), or delete it?

**D7. Stack upgrade.** Astro 5→7 and Starlight to 0.42, Node 22, deleting `@cairn/ui` (7.3k lines, almost unused) and Tailwind (unused). Include this in this round, or keep it as separate infrastructure work?

---

## 1. Cross-cutting workstreams (all sites)

**W1. Citation integrity** (P0; the highest-leverage single item)
- Fix every confirmed error. The research audit alone found 34, for example:
  - Factor(T,U) is reported as 41%→63% by Sandoval & Rushing (Dec 2025). Three pages say "41%→70%, Redwood 2024".
  - arXiv 2401.09876 is a particle-detector paper.
  - Irving & Askell is miscited as the QuALITY experiments.
  - NUREG/CR-4780 has the wrong authors.
  - Battaglini is cited for the opposite of what the paper shows.
  - Holmström–Milgrom is cited for the opposite of its lesson.
  - The FCIC quote is misquoted.
- Remove any precise percentage that the cited paper doesn't contain.
- **Add a CI check** (`scripts/check-citations.py`) that pulls metadata for every arXiv link and flags mismatches in year or first author. It runs against all four sites.
- A web-verified pass on the "facts to verify" lists, about 22 + about 15 items.

**W2. Math correctness** (P0)
- **Delegation Risk core:**
  - The power/agency formulas contradict DR = ΣP×D.
  - RACAP is still used everywhere even though the canon rejected it.
  - The exposure-ledger "consolidation" rule points the wrong way.
  - The cascade claims a "67% reduction" that only moves risk up the hierarchy.
  - The walkthrough arithmetic is wrong ($203.75 vs $204.75; Frank's risk is $1,100 on one page and $440 on another).
- **Delegation Risk patterns:**
  - Super-additive expected loss.
  - The same-model redundant verifier formula is wrong.
  - The "Brier-style" stake rewards underconfidence.
  - Break-even tables contradict their own formula.
  - The "worse than useless" human-oversight example's numbers show oversight is better.
- **Delegation Risk research:**
  - Four errors in `correlated-failure-modeling.md`, including a joint failure probability higher than the single-model one and an invented "n ≥ (3f+1)/(1−β)" rule.
  - A linearity-of-expectation error.
  - The VCG payment sign is reversed.
  - A Bayesian model "proves" a schemer trustworthy after 10 good outcomes.
- **Delegation Risk tools and estimates:**
  - Trust Updater returns NaN past about 170 observations.
  - The risk calculator ignores its uncertainty input.
  - The track-record modifier should be (1−posterior)/(1−prior).
- **Reasoning Processes:** the Funding Effect's likelihood-ratio derivation is wrong (a pure multiplier cancels; the sign flip needs an unstated selection effect), and the Deterrence chapter reuses it. Re-audit every `[exact]` and `[standard shape]` label.
- **Evaluation Engineering:** the ~70% panel agreement has no chance correction; at an 80% base rate, chance agreement is already 68%.
- **Method:** each fix is re-derived by a separate verifier, with Monte Carlo where possible, as the June pass did for risk-propagation.

**W3. Currency to late 2026** (P0/P1)
- **Delegation Risk:**
  - Replace GPT-4, AutoGPT, LangChain, CNN/RNN "diversity" and the revoked 2023 Executive Order framing.
  - Add **prompt injection / third-party hijack as a first-class harm channel**.
  - Cover MCP and tool supply chains, sandboxes, harness hooks, CaMeL-style capability separation, CoT monitorability, evaluation awareness, emergent misalignment and adaptive attacks on monitors.
  - Cite the measured cross-model error correlation papers (Goel et al. 2025, Kim et al. 2025).
  - Add the AI-insurance market (Armilla/Lloyd's, AIUC-1, insurers' AI exclusions).
  - Add the regulation in force: EU AI Act general-purpose-model obligations and Art. 73, SB 53, DORA.
- **Real incident case studies** to replace the invented AI scenarios: Sydney, Air Canada, Replit's database deletion, the Amazon Q wiper prompt, the npm Shai-Hulud compromises, malicious MCP servers.
- **Reasoning Processes:** add reasoning models and the 2025–26 LLM forecasting results.
- **Evaluation Engineering:** add judge-gaming evidence (a null answer scoring 86.5% on AlpacaEval 2.0; hidden "positive review" prompts found in arXiv papers), the LLM peer-review studies, and automated essay scoring.

**W4. Anti-slop style pass** (P1)
- Remove templated TL;DR / Key Insight / "Key Takeaways" boxes, bold-everything, emoji, Game of Thrones analogies, uniform section scaffolds, and tables made for their own sake.
- Write a short `STYLE.md` per repo (or one shared) that codifies this, so later edits don't regress.
- Measure the result by word count and by a held-out LLM style-judge comparison before and after (on the methodology, see D5).

**W5. Terminology canon**
- Enforce `TERMINOLOGY.md` in the 55 patterns/entanglements pages, which currently use none of the canon terms.
- Remove quantitative "trust" wherever it isn't defined.
- Make one "Least-X" list, not five.
- Add a lint script that greps for terms the canon has retired (RACAP, harmonic propagation, etc.).

**W6. Cross-wiki integration**
- Reasoning Processes calls correlated failure "the field's biggest hole" but never links to Delegation Risk's 5k-word page on it.
- Evaluation Engineering never links to about 8 key Reasoning Processes pages.
- Add a shared footer or hub that links the three wikis and QURI.

**W7. Infrastructure and presentation** (pending D7)
- **Delegation Risk:** fix the stale live `llms.txt` (it points to `delegation-risk.org` and paths that 404), and remove the withdrawn-PDF header link and the `[domain]` placeholder.
- **CI:** cover all four sites (link checker across every app, the starter build, lint), and move it to Node 22.
- **Builds:** fix the 72 "squiggle" code-language warnings.
- **Dead code:** delete `@cairn/ui` and Tailwind.
- **Per-site presentation:** distinct favicons, OG images, `robots.txt`.
- **Repo hygiene:** move the app-root planning docs into `docs/` or `audits/`.

---

## 2. Per-site work lists

### Delegation Risk (assuming D1 = b)
1. **Math and canon fixes in the core path** (W2/W5 items above, about 16 P0s in `dr-core.md`).
2. **Support or retire the headline "~50× entanglement tax".**
   - Ground the ρ table in the measured LLM correlation papers.
   - Show the tax as a function of ρ, not one number.
   - Add an adversarial section: against an adaptive attacker, assume ρ→1, because beta-factor math models passive failures.
3. **Rewrite or update the stale core pages:** strong-tools, the verifiability hierarchy, related-approaches (which contradicts the current thesis), and the FAQ (which contradicts the flagship thesis). Delete the roadmap.
4. **Finish the undone plan phases that matter:**
   - A principal-agent page: Holmström, Jensen–Meckling, Arrow/Shavell, ambiguity premiums.
   - One calibrated coding-agent example, worked end to end.
5. **Contract by section:**
   - Research: 28→~10 pages. Make the scheming/monitoring page the flagship, with reported numbers instead of the invented "Safety Level" tables. Delete the 10k-word prototype-architecture page.
   - Entanglements: 26→~12.
   - Patterns: 45→15–20. Give each a prior-art line and a "what's different for 2026 agents" section, and state the independence assumption on every redundancy pattern.
   - Power dynamics: one speculative page.
   - Cases: strip the invented quantification. Fix the factual inversions: Hanssen, Williams v. Florida, Dead Hand, the French command chain, 'Ndrangheta, Fuchs.
   - Cross-domain methods: accuracy fixes (ASIL decomposition, Euler/CoVaR, linear-logic compile-error claims, modeled vs observed core-damage frequencies), then merge four duplicates into research.
   - Tools: rebuild one calculator on real Squiggle and cut the other three.
   - Experimental: hide it, or make the estimates registry honest (remove the fabricated AI Incident Database stats, put units on every prior).
6. **Remove leftovers:** the deleted-fiction teaser on `insurers-dilemma.md`, the v1 PDF link, the stale `llms-full.txt`.

### Evaluation Engineering
1. **Fix the 4 claims an expert would reject:** "no direct evidence" of judge gaming, "barely measured", the agreement rate without chance correction, and the FCIC misquote.
2. **Reconcile the thesis with the book's own funding finding.** Make incentives and funding first-class design variables. Redo the "accuracy × quantity × cost" frame to include robustness to gaming and legitimacy.
3. **Place the audit pattern in its lineage:** DARPA SCORE / Replication Markets, prediction-powered inference, essay-scoring validity, Trust-or-Escalate. Address the name clash with AI "evals" (METR, Inspect).
4. **Write the practitioner core:**
   - A "Measuring an Evaluator" chapter: κ, panel baselines, prediction-powered inference, error bars.
   - The capability ladder: mentioned five times, never written.
   - A launch checklist.
   - Methods as a sourced table.
5. **Rebuild or replace the older chapters:** Epistemic Culture has zero citations. Retire the "all you need" hero slogan.
6. **Code the ~110-system catalogue** to actually test the funding-vs-method claim. This would be the book's empirical contribution.

### Reasoning Processes
1. Fix the Funding Effect and Deterrence math, and re-check every `[exact]` label (persuasion budget, differential privacy, Kelly).
2. Fix the harness defects:
   - Two templates show "bias" for a rational judge.
   - "Candidate 1: 50" parses as 1%.
   - Reasoning-model output is unparseable.

   Then run the harness (D5) and publish the results.
3. Fix about 11 misattributed citations. Add the missing literature: iterated amplification, AHP, Knight & Leveson, the superforecasting literature, Community Notes, adversarial collaboration.
4. Add a 2026 evidence section and rewrite Cruxes with probabilities. Write Ch. 18 and Chs. 20–22, or remove their placeholder links. Remove the stale "June 2026" status lines.
5. Finish the readability pass (cut Ch. 6 by about 35%, de-duplicate two passages), and decide D4.

### Meta → CAIRN Handbook (assuming D6 = rebuild)
1. Cut or move all the longterm-era pages. This also removes the 101 broken links.
2. Make the homepage a hub for the three wikis.
3. Write three pages that are true of this repo: adding a wiki, the build/llms/link tooling, and the review workflow (how these audit passes are run).
4. Fix the workshop:
   - Node 22+ instead of `sudo npm install`.
   - The native Claude Code installer and code.claude.com links.
   - The correct web-app flow: `claude/*` branches with Vercel previews, not production.
   - Remove the February 2026 event block.

---

## 3. Proposed execution plan for the Ultra round

Ordered so that cheap, high-certainty, credibility-critical work lands first, and so that cuts land before polish. Polishing pages that are about to be deleted wastes effort.

| Phase | Work | Parallelism | Gate |
|---|---|---|---|
| **1. Triage & cut** | Apply D1/D2/D6 decisions: delete/merge pages with redirects, meta rebuild skeleton | 1 agent per section | build + link check clean |
| **2. Correctness** | W1 citations + W2 math on surviving pages; add citation-check & canon-lint scripts | 1 agent per site/section; each fix independently re-verified by a second agent | scripts pass; verifier sign-off per P0 |
| **3. Currency & substance** | W3 additions, new chapters (principal-agent, measuring-an-evaluator, capability ladder, real incidents), D5 experiments | 1 agent per chapter | adversarial review agent per new page |
| **4. Prose** | W4 style pass, W5 canon sweep, W6 cross-links | 1 agent per section | word-count delta + style-judge diff |
| **5. Infra** | W7 (+ D7 upgrade if approved) | 1–2 agents | all 4 sites build, CI green |
| **6. Final QA** | Fresh-eyes read of each site's front door + core path; re-run audits for score delta | 1 per site | re-audit scores reported honestly |

Each phase gets its own PR, or one PR per site within a phase, so you can review in chunks of a manageable size. Phase 1 and the citation half of Phase 2 are the parts I'm most confident in. Phase 3 is where most of the quality upside and most of the risk sit, because new prose written by a model can reintroduce the same failure modes.

**Rough size:** phases 1–2 are about 10–15 agent-tasks; phases 3–4 are about 20–30. Doing all of it is a few Ultra workflows, not one.
