---
title: About the Research
description: How Open Stacks was made and how far to trust it. Thirteen research dossiers written by AI agents on 2026-10-15, with a fourteenth in progress; independent verification passes that checked 322 claims in R01–R11 and corrected 50; adversarial reviews of the chapters; the ideation panel and scripted quote checks behind the prototypes; known limitations and cross-chapter conflicts; and how to report errors.
---

*Status: draft, October 2026. Describes the process as of 2026-10-15. Verification counts are this page's tally of the verdict columns in R01–R11. The examples come from those tables and from the chapters; the external primary sources linked inline were re-opened on 2026-10-15 and match. When this page was written, R12's verification pass had been interrupted, R13 had not been verified, R14 was not in the repository, and the cross-chapter consistency pass had not run. Sources: the [research README](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/README.md), the dossiers linked below, the [work plan](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/WORKPLAN.md) and the [ideation panel record](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/ideation-panel.json).*

## The short version

- **AI agents wrote everything here, and other AI agents checked it.** Every dossier is dated 2026-10-15, and the repository history shows the research, verification and first chapters were all committed that day. No page records a human fact-check.
- **The verification passes found real errors.** Across R01–R11 the checkers examined 322 claims they judged load-bearing or suspicious. They confirmed 264 (82%), corrected 50 (16%), could not verify 7 and found 1 stale. Some corrections moved headline numbers: the share of R01's 55 canonical books readable free and legally in English, counting library lending, fell from 65% to 55%.
- **The 16% applies only to selected claims.** Each of R01–R11 runs to about 12,000–16,000 words, and its table checks 26–33 claims. The error rate of the rest is unknown.
- **What to do:** before you spend money or cite a number, re-open the linked source. Treat coverage percentages as upper estimates for your own, less famous reading list. Read bracketed probabilities as the writer's stated lean, not as measurements. When two pages disagree, prefer the one with a dated measurement. [Report errors](#reporting-errors) as GitHub issues.

## How the wiki was made

| Stage | What the agents did | What it catches | What it misses |
|---|---|---|---|
| 1. Research tracks | One agent per track: web search while the shared quota lasted, then direct fetches, official APIs, bulk exports and its own counts | Facts reachable from public pages and data | Bot-walled sites; anything found only by open-ended search |
| 2. Verification | A second agent re-opened cited sources, re-ran counts, corrected inline (`[corrected in verification]`) and appended a verdict table | Misread sources, arithmetic, stale pages, false quotations | Newer contradicting reports; every claim it did not select |
| 3. Chapters | One agent per chapter, from assigned dossiers, under a shared guide | Synthesis into decisions | Dossier errors verification missed |
| 4. Chapter review | Adversarial fact-check and edit; re-opened primary sources and re-ran queries | Computable numbers left as guesses, quote wording, changed prices | Conflicts between chapters |
| 5. Prototypes | Ideation panel; builds on real data with scripted quote checks, screenshot QA and a design critique | Fabricated quotations and identifiers, broken layouts | Whether a verified quotation's attached stance is right |

The [research README](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/README.md) sets the precedence rule: where a chapter and a dossier disagree, the chapter is the current position, because chapters received a further check. Claude prices follow a separate [pricing reference](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/pricing-reference.md), which overrides the dossiers.

## The research tracks

Tracks R01–R11 were planned at the start. A completeness critic then proposed gap-filling tracks, which became R12–R14. Each dossier opens with a method section that says what was searched, fetched, measured and blocked. It ends with an "Ideas sparked" section, a sources list and, for R01–R11, the verification table.

| Track | Scope | Checked / corrected | Dossier |
|---|---|---|---|
| R01 | Open-access books and textbooks, author-hosted editions, public-domain libraries; a 55-book free-coverage test | 30 / 5 | [R01](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R01-open-books.md) |
| R02 | Open-access papers: OA share, preprint servers, aggregators, policy; shadow libraries as landscape only | 27 / 5 | [R02](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R02-open-papers-and-shadow-libraries.md) |
| R03 | Subscriptions, used books, Bay Area public libraries, university and employer access; a 33 + 20 title spot-check | 27 / 3 | [R03](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md) |
| R04 | AI research assistants and paper-discovery tools, with the evidence on recall and citation accuracy | 28 / 4 | [R04](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md) |
| R05 | Book discovery, catalog metadata, tables of contents, shelf browsing, search-inside | 29 / 4 | [R05](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md) |
| R06 | Research on interfaces for exploring large information spaces, from Scatter/Gather to embedding maps | 26 / 4 | [R06](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md) |
| R07 | Generative UI, generated encyclopedias, faithfulness evidence, generation costs | 30 / 6 | [R07](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R07-generative-interfaces.md) |
| R08 | VR and spatial computing as reading and work environments | 29 / 7 | [R08](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R08-spatial-computing-reading-environments.md) |
| R09 | Copyright, fair use, TDM exceptions, licenses and API terms for tool builders (mainly US) | 33 / 4 | [R09](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md) |
| R10 | Architecture and costs of a personal "catalog of everything" | 30 / 5 | [R10](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md) |
| R11 | Reading methods, curation, non-VR reading devices | 33 / 3 | [R11](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R11-reading-practice-curation-devices.md) |
| R12 | Grey literature: forums, blogs, reports, working papers, government documents | Pass interrupted; no table | [R12](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R12-grey-literature-and-community-archives.md) |
| R13 | Lectures, courses, talks and podcasts treated as literature | Not yet verified | [R13](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R13-lectures-talks-and-podcasts.md) |
| R14 | Your own library: owned books and ebooks | In progress; not yet in the repository | [research folder](https://github.com/quantified-uncertainty/cairn/tree/main/apps/open-stacks/research) |

**Read each dossier's legend.** Every dossier tags the evidence behind a claim, but the letters differ. In R02, R03, R06, R07 and R11, **[P]** means "verified on a primary source". In R09 and R10, **[P]** means "prior knowledge, not re-verified". The other dossiers mark primary verification as [V] or (V). Unchecked recollection appears as [T], [K], [R] or [U].

## The verification passes

Each checker worked independently of the dossier's author. It re-opened every cited source for the claims it selected and re-ran measurements where it could: R01's checker re-downloaded the 281 MB DOAB export and recomputed the counts with its own scripts, and R03's re-read all 27 O'Reilly sitemap files. It then fixed the text inline.

**What the passes caught** (all from the dossiers' tables):

- **Bad joins.** Open Library's "borrowable" flag is a work-level maximum that includes translations. Six of R01's "borrowable" books were lendable only in translation, or as a study guide. Free-to-read in English, including controlled lending, fell from 36/55 (65%) to 30/55 (55%).
- **String-matching bugs.** R01's "5 *Graduate Texts in Mathematics* in DOAB" came from a substring match: "Undergraduate Texts in Mathematics" contains the string. The correct count is 3.
- **Overcounts.** R03 put Packt at about 9,800 titles in O'Reilly's sitemap. The ISBN prefixes allow at most 6,443, so Wiley (about 9,200) and O'Reilly (about 9,000), not Packt, are the largest publishers there.
- **Legal substance.** R09's summary said training on "lawfully acquired" books had won twice in district court. But the Kadrey order says "There is no dispute that Meta torrented LibGen and Anna's Archive" ([Dkt. 598](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf)).
- **Incomparable numbers.** R07 set NoCha's 97% human accuracy beside GPT-4o's 55.8%. The human figure is claim-level accuracy on 152 claims from six books; the model figure is pair accuracy ([Karpinska et al.](https://arxiv.org/html/2406.16264)).
- **Quotation marks around words the source does not contain.** R10 quoted a Semantic Scholar licence phrase, "where licensing allows", that is not in the [dataset manifest](https://api.semanticscholar.org/datasets/v1/release/latest), which says "Paper abstract text, where available". R07 quoted Google as saying its outputs "occasionally contain inaccuracies"; the [blog](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) says "there are occasional inaccuracies in the outputs".
- **Prices and versions.** R04 gave Elicit's price history as \$780, then \$79, then \$169. Its source, [CostBench](https://costbench.com/software/ai-research-tools/elicit/price-history/), has tracked Elicit only since 2026-05-17 and logs a single change, \$79 to \$169 per user per month. R02's OpenAlex snapshot figures were already one release old: a [2026-10-14 snapshot](https://openalex.s3.amazonaws.com/RELEASE_NOTES.txt) had appeared.

**What "confirmed" means.** No verification pass ran an open-ended web search beyond a first query, because the shared quota was spent. So "confirmed" means "matches the cited source on 2026-10-15", not "no contrary reporting exists". A confirmed price or count is good as of that date. A confirmed claim that something has *not* happened (no newer ruling, no final rule, no discontinuation) is weaker, because nobody searched for the contrary. No claim was marked "refuted", but corrections range from wording to substance: 5 of the 50 are labeled "minor", while others reversed a claim (R09's "lawfully acquired", R03's largest publisher).

## Chapters and their review

Chapter writers worked from assigned dossiers under a shared guide: follow the verification tables, treat "unverifiable" claims as uncertain, never invent a source, number, URL or quote, date every price and status, mark inference inline, and open with a status line saying what is and is not verified. The guide is not in the repository; the app's [CLAUDE.md](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/CLAUDE.md) summarizes its conventions. Chapters then went through an adversarial fact-check and edit that re-opened primary sources. The work plan records 23 chapters reviewed and the decision guide's review interrupted; each page's status line records what its review re-checked.

Examples where a chapter corrects or sharpens its dossier:

- **An inferred estimate replaced by a computation.** R02 estimated that free legal routes reach 70–80% of a cited-literature sample [~60%, inference]. [Open Papers](/access/open-papers/) recomputed the figure from the item-level data Walters published with his *PNAS* study: 73% for any version and 58% for the final version. The same method reproduces Walters' all-tools figures (93.7% and 89.0%, against his reported 94% and 89%).
- **A famous result traced to the paper.** The Flamenco paper's conclusion, repeated in Hearst's book and R06, calls the faceted interface "often an order of magnitude slower" than the baseline. [Exploratory Search](/interfaces/exploratory-search/) found that the figure is system processing time per step (3.7 s against 0.3 s); users' task times were 16–27% longer ([Yee et al. 2003](https://flamenco.berkeley.edu/papers/flamenco-chi03.pdf)).
- **A dossier error in statistics.** R01 called ±13 points the "binomial standard error" at n = 55. That is roughly the 95% half-width; the standard error is about 7 points. [Open-Access Books](/access/open-books/) gives the corrected figures.
- **A dossier misreading of an API.** R05 read Open Library search-inside's `page_num` as the page of the hit. [Searching Inside Books](/finding/searching-inside-books/) found that it equalled the scan's total image count in all 20 hits checked; a re-check of four of those hits for this page gave the same result.
- **Conflicts shown, not resolved by fiat.** On 2026-10-15 [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing) listed Sonnet 5.5 cache reads at \$0.10/MTok, while the cached model reference said \$0.20. [Costs and Effort](/building/costs-and-effort/) gives both and states its lean; none of its totals depends on the difference.

## The ideation panel and the prototypes

The prototypes came from a structured panel, recorded in [ideation-panel.json](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/ideation-panel.json). Seven persona agents, from an information-visualization researcher to a reading scientist, proposed seven concepts each. Merging folded 48 of the 49 into 18 specified candidates. Three judge agents each scored one criterion (usefulness, novelty, demo-ability); totals ran from 13 to 20. These scores are structured opinions about written specs, not measurements. Twelve concepts were selected for builds; [The Design Space](/building/design-space/) explains the choice.

A builder guide (also not in the repository) set hard rules. Prototypes run on real open data: 7,127 Open Library works, 29,007 English Project Gutenberg records outside the literature classes, 1,457 arXiv papers and nine public-domain full texts. AI-written content is labeled as such. Every quotation must match its source exactly after whitespace normalization, checked by script, or be dropped, and no work, page number or quote may be invented. Live generation needs a precomputed fallback. Each build needed at least two rounds of screenshot QA (desktop in light and dark, phone width, a stubbed generation path). A separate design-critique pass re-runs the quote checks with its own scripts, including quoted fragments inside AI-written summaries; per the work plan, it had started on Gearbox and the Evidence Ledger and was interrupted on both. On 2026-10-15 ten of the twelve had page sources in the repository; the Epoch Slider existed only as build scripts and data, and the Front Table only as early build scripts.

The precomputed data passed: 164 of 164 Crux Table quotations, 348 of 348 Chapter Lenses pointers, and 258 Gearbox quotations and anchors, none dropped. The checks also caught errors in the sources themselves. Exact recomputation in Chapter Lenses found two misprints in the Gutenberg Laplace text ("1/10" and "6/10" where the arithmetic needs 9/10); its transcriber's note lists both corrections, but the file applies neither. An Epoch Slider date audit checked 2,757 Open Library dates, corrected 46 and dropped 22. A verified quotation proves the words exist. It does not prove that the stance attached to them is right.

## Known limitations

- **Search ran out.** The web-search quota shared by all agents ran out during the first sweep. R03, R06 and R09 ran no searches, R01 one, and R02 and R05 about 8–10. R04 ran out partway, and R07, R08, R10 and R11 ran about 20–50 searches. No verification pass searched beyond a first query. The work therefore leans on direct fetches of known primary pages: reliable for what it reaches, weak at finding newer or contradicting reports. Absence of evidence in a dossier is weak evidence. Search worked again for R12 and R13.
- **Blocked sites.** Many sites blocked automated access (HTTP 403, JavaScript challenges, Cloudflare), among them doabooks.org, MIT Press, HathiTrust, Everand's catalog, Kobo, ACM, IEEE, LibraryThing, Wiley, ScienceDirect, PNAS, EUR-Lex and openai.com. Claims about these sources rest on secondary pages or stay unverified, and the dossiers say which.
- **Small, LLM-chosen samples.** The book-coverage figures rest on samples research agents chose: R01's 55 canonical books, drawn from "my own sense of the canon, which comes from web text", and R03's 33 technical and 20 humanities titles, "hand-picked samples biased toward famous books". Free books are discussed online more, so "canonical" and "free" are partly circular, and a less famous list will probably score lower [~75%]. Standard errors are about 7 points at n = 55 and 9–11 points at n = 20–33. R01 judges that another list could put its 52% modern-technical-textbook figure anywhere from 35% to 60%. The paper-coverage figures come from an external study ([Walters 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/), 875 works) whose seven fields (chemistry, materials science, cardiology, public health, economics, education, psychology) include none of ML, statistics, physics or philosophy.
- **AI-written throughout.** Agents wrote, checked and edited every page. Where sources were blocked, some claims rest on the agents' recollection; those are tagged. Much of the cited evidence on summarization and long-context reading tested 2023–2025 models.
- **Dated, and decaying.** Prices, catalog sizes, case statuses and product statuses are as of 2026-10-15. Some changes were already scheduled: Gemini 4 Argon's API price doubles on 2026-12-01 ([Google](https://ai.google.dev/gemini-api/docs/pricing)), and Berkeley Public Library began requiring a PIN for Libby and Kanopy logins on 2026-10-15, the research date itself ([BPL](https://www.berkeleypubliclibrary.org/)).
- **Unfinished, and inconsistent in places.** R12 and R13 lack completed verification passes, R14 was in progress, and the cross-chapter consistency pass had not run. Known conflicts on 2026-10-15:
  - [A Reference Architecture](/building/reference-architecture/) still says Open Library search-inside returns page numbers; [Searching Inside Books](/finding/searching-inside-books/) shows it returns the scan's length.
  - [The Shadow Libraries](/access/shadow-libraries/) says no legal-only combined coverage figure exists; [Open Papers](/access/open-papers/) computes one (73%).
  - [Maps of Knowledge](/interfaces/maps-of-knowledge/) repeats Flamenco's "order of magnitude slower" without the processing-time caveat.
  - [Costs and Effort](/building/costs-and-effort/)'s status line says R03 has no verification pass; it has one.
- **Not legal advice.** The legal chapters map risk for builders; a real product decision needs a lawyer.

## How to read a claim on this site

| What you see | What it means | Treat it as |
|---|---|---|
| A primary link plus a date | An agent read that page, API or paper on that date; for R01–R11, a second agent re-opened the load-bearing ones | Good as of that date; re-open it before acting on a price or status |
| "recomputed", "my count", "our query" | Computed from bulk or item-level data | The strongest evidence here; read the method note |
| [S] or "(secondary)" | Press, Wikipedia or an aggregator | Directional |
| [I] or "inference" | The writer's reasoning from stated premises | An argument; check the premises |
| [~70%] | The writer's subjective probability | A stated lean, not calibrated against outcomes |
| [T], [K], [R], [U] (or [P] in R09/R10) | Recollection, not re-verified | The weakest tier; verify before use |
| Coverage percentages | Small, hand-picked samples | An upper estimate for a less famous list |
| "vendor-run" | The vendor's own benchmark | Discount it |

**What to re-check first, before acting:** prices and product statuses, which decay fastest; legal statuses with dates still pending, such as the *Kadrey* distribution-claim hearing (2027-02-25, from a secondary source) and the unscheduled OpenAI MDL summary-judgment hearing ([The Legal Map](/building/legal-map/)); any claim that something does not exist or has not happened; and anything tagged as recollection.

## Reporting errors

Open an issue on [quantified-uncertainty/cairn](https://github.com/quantified-uncertainty/cairn/issues) with "Open Stacks" in the title. Include:

- the page URL;
- the claim as written;
- what you believe is correct;
- a link to a primary source, with the date you checked it.

Price and status changes are the most useful reports, because they decay fastest. If a chapter and its dossier disagree, say which one you think is wrong.

## Open questions

- **What is the error rate of claims nobody checked?** Draw 50 claims at random from the chapters, stratified by evidence tag, and verify each against its source. Compare the rate with the 16% correction rate on selected claims.
- **How much does the agent review miss?** Seed 20 known errors (wrong dates, swapped figures, paraphrases inside quotation marks) into one chapter, run the same review prompt, and count what survives. Give a human reviewer the same chapter for comparison.
- **How biased are the LLM-chosen samples?** Re-run R01's 55-book coverage test on the most-assigned titles in Open Syllabus for the same six fields, and compare the free share.
- **How fast does the wiki decay?** Re-check every price in the [Subscriptions](/access/subscriptions/) and [Costs and Effort](/building/costs-and-effort/) tables on 2027-01-15. Report the share that changed.
- **Do R12–R14 hold up?** Run their verification passes and publish the verdict counts beside R01–R11's.

## Related pages

- [Open Stacks](/start-here/introduction/): what the wiki covers and why
- [Cruxes](/start-here/cruxes/): the uncertainties that most change what to do
- [The Design Space](/building/design-space/): the ideation panel's scores and why twelve concepts were built
- [Prototype Gallery](/building/prototype-gallery/): the builds, with what is real, precomputed and mocked
- [Open Problems](/reference/open-questions/): open questions across the wiki
- [Directory of Sources and Tools](/reference/directory/): every source and tool, with links
