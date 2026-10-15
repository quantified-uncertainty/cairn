---
title: Cruxes
description: The nine uncertainties that most change what a reader or tool builder should do, each with a resolution test, the decisions it flips, the evidence as of October 2026, a lean with a probability, and the observation that would move it. They cover how much of a reading list is legally free, maps versus ranked search, LLM summaries for triage, building versus buying discovery, VR, generated interfaces for experts, whether legal access is shrinking, whether page-level book search survives, and AI clauses in licenses.
---

*Status: draft, October 2026. This chapter adds no new measurements. Every figure comes from the linked chapters, which cite the primary sources and carry their dates (most were checked on 2026-10-15); an editorial pass the same day re-checked about fifteen of the most load-bearing figures, from the HTRC shutdown notice to the FABLES and Biener results, against their primary sources. A bracketed probability attributed to a chapter is that chapter's estimate; one marked "mine" is my judgment from the evidence listed, and those leans are the parts most open to challenge. The evidence is weak in known ways: the book-coverage samples are small and favor famous titles, the summary and citation audits tested 2023–2025 models, the VR studies used older headsets, Open Library's field counts were not independently reproduced, and every build-hour figure is an estimate. Sources: the linked chapters, the [research dossiers](https://github.com/quantified-uncertainty/cairn/tree/main/apps/open-stacks/research), and primary sources linked inline.*

[What to Do First](/start-here/decision-guide/) gives a plan. This page lists the uncertainties that would change it. A crux here is a question whose answer would change an action, not just a fact you would like to know. Each entry states the question with a resolution test, the decisions that flip on it, the evidence and the chapters that hold it, a lean with a probability, and the observation that would move the lean. Several can be settled for your own case in an hour or a weekend, even where the general question stays open; those routes are flagged.

## The cruxes at a glance

| # | Crux | Lean (October 2026) | Decisions it flips | What would move it |
|---|---|---|---|---|
| 1 | How much of a real reading list is legally free | 33–52% of famous technical lists; probably 15–35% of a random syllabus draw [~70%, mine] | Text-first or catalog-first tool; purchase budget | A 300-title random syllabus test; for you, a one-hour test of your own list |
| 2 | Whether browsing and maps beat ranked search | Lists win targeted retrieval [~85%]; structure beside a list helps newcomers [~65%] | Build effort on search, facets and routing, or on shelves and maps | A month-long within-person A/B test with logged foraging rates |
| 3 | Whether LLM summaries are faithful enough to triage reading | Triage-grade when grounded in full text [~75%, mine]; not citation-grade; metadata blurbs are not triage-grade [~70%, mine] | Precompute summaries or lead with source text; model choice | A FABLES-style rerun on non-fiction with 2026 models |
| 4 | Whether a personal catalog beats paid discovery tools | Buy paper discovery [~80%]; build book and chapter routing, which no product does [~80%] | Subscribe or build; which tier | An independent rerun of the recall benchmark; logged build hours |
| 5 | Whether VR is worth it for reading | Not for reading itself; chance you still read in a headset after a two-week test [~20%] | Buy a headset; build a reading room | A Biener-style week on 35+ PPD hardware; your own two-week test |
| 6 | Whether generated interfaces help expert readers | Navigation layers help [~65%, mine]; generated study views do not beat the source plus equal practice [~70%, mine] | Generated explainers or source-first lenses | A three-arm trial with graduate readers |
| 7 | Whether legal access is shrinking or growing | Paper reading grows [~70%, mine]; remote book access flat to down; reuse rights shrink [~75%, mine] | Which actions are time-sensitive | A dated route registry rerun yearly |
| 8 | Whether page-level search inside in-copyright books survives | HTRC data downloadable in mid-2027 [~60%]; HathiTrust's interactive search survives [~80%, mine] | Mirror now; design page routing around which service | HathiTrust's hosting decision after December 2026 |
| 9 | Whether AI clauses make tool-building on licensed content impossible | Catalog-and-route tools stay fine; feeding O'Reilly or Elsevier text to a model stays barred without a license [~85%, mine] | Link or ingest; whether a subscription or affiliation buys AI rights | An individual AI-use license; a consortium license that allows cloud LLMs |

## Actions that hold whichever way the cruxes resolve

Some steps are right on every branch. Take them first.

- **Get the in-person library cards.** Cards issued in person to residents are not the routes that are closing (crux 7), and a San Francisco Public Library (SFPL) card plus legal free copies reached 28 of 33 famous technical books ([Public Libraries](/access/public-libraries/)).
- **Link to licensed content; do not feed it to a model.** That is correct whether or not AI clauses are ever loosened (crux 9), and it keeps a personal tool in the Legal Map's low-risk zone [~90%, [The Legal Map](/building/legal-map/)].
- **Mirror the HTRC Extracted Features for your fields.** A 10,000-volume subset is about 2.4–3.9 GB under CC BY 4.0, so mirroring costs almost nothing if the host survives and saves the page-search layer if it does not (crux 8).
- **Archive the CC BY versions of any OpenStax book a commercial or shared tool depends on.** New and updated versions have been CC BY-NC-SA since 2026-04-22 (crux 7).
- **Show source text first and generated text second, labeled.** That is the safe design if summaries are good (crux 3) and the necessary one if they are not.
- **Test before buying:** your list's coverage before a subscription (crux 1), a returnable headset before a purchase (crux 5), and the weekend build before the month build (crux 4).

## 1. How much of a reading list is legally free

**The crux.** Draw about 300 book titles at random from public syllabi in statistics, ML, economics and philosophy, published since 1990. What share has a complete, current-edition text that is legally free: public domain, openly licensed, or posted in full by the author or publisher? Famous-book samples say a third to a half. The open record for commercial textbook series says a few percent.

**Why it matters.** The answer sets how much of a list a tool can treat as "ask the text" rather than "ask the catalog". In the 30-book worked example in [The Access Ladder](/access/access-ladder/), a personal tool can hold the full text of 13 books, or 16 if you scan the three print books you buy; the other 14 can enter it only as metadata, tables of contents, notes and links.

- **At around 50% free,** a full-text pipeline (chunk search, chapter gists, quote checking) serves most of the list. Purchases stay near the worked example's \$111–\$138 for all 30 titles.
- **At around 20% free,** most of the list is catalog-only. Build effort should go to the catalog, table-of-contents extraction, page-level search and routing, and buying books becomes a recurring budget line rather than a residue.

**Evidence.**

- **Famous technical lists are a third to a half free.** In R01's 55 frequently recommended books, 17 of 33 post-1990 technical textbooks are free (52%; a 95% interval of roughly 35–69% from sample size alone). Without ML the figure is 9 of 23 (39%); ML alone is 8 of 10. Popular non-fiction since 1990 was 1 of 10, and in-copyright classics from 1930–1989 were 0 of 6 ([Open-Access Books and Textbooks](/access/open-books/), 2026-10-15). In R03's 33 famous technical books, 11 (33%) had a legal free text (*The Access Ladder*).
- **Those lists are biased upward.** The 55-book list was chosen by an LLM, and free books are discussed more online; *Open-Access Books* puts [~75%] on the bias pushing the free share up.
- **The long tail is barely open.** On 2026-10-15 the DOAB export listed 3 *Graduate Texts in Mathematics* volumes (of roughly 300), and none from *Undergraduate Topics in Computer Science* or CRC's *Texts in Statistical Science* ([DOAB](https://directory.doabooks.org/)). Open Library's search API counted 1.86M works with a public ebook and 2.91M borrowable on 2026-10-15, against about 41.7M works in its 2026-09-30 dump: about 4.5% and 7%. R05's dump count was not independently reproduced ([Catalogs and Metadata](/finding/catalogs-and-metadata/)).
- **Papers are a different regime.** The free legal tools reached 73% of 875 works cited in 2023 reviews (58% in the final version), but only 1 of 37 cited books and 36% of work published before 2001 ([Walters, *PNAS* 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/), recomputed in [Open Papers and Preprints](/access/open-papers/)).
- **The free canon is fragile.** On 2026-10-15 the host of *The Elements of Statistical Learning* was unreachable, and Google's *Site Reliability Engineering* is free in its first edition but not its second ([What to Do First](/start-here/decision-guide/)).

**Lean.** *Open-Access Books* puts [~80%] on the canonical core staying above 20% free even after correcting for bias, and [~75%] on the free share of all modern textbooks being well under 20%. A random syllabus draw sits between the two. My lean is [~70%] that its free share falls between 15% and 35%, and [~85%] that it falls below the 52% of R01's famous post-1990 technical books. Field dominates: a reader of ML, Bayesian statistics and forecasting lives near the famous-list figures, while a reader of algorithms, microeconomic theory or decision theory lives near the tail. *The Access Ladder* treats every coverage figure as an upper estimate for a less famous list [~70%], and that applies to library coverage as well as free copies.

**What would change it.** The population answer needs the 300-title syllabus test proposed in *The Access Ladder*, with coverage reported by rung and field. Your own answer needs an hour: run the protocol in [Cheap Subscriptions](/access/subscriptions/) on the 20–40 titles you expect to read. If more than about 40% come out free, plan a text-first tool. Under about 25%, plan a catalog-first one. In between, build the catalog first and add full text for the free share (my suggested thresholds).

## 2. Whether browsing and maps beat ranked search for discovery

**The crux.** A reader enters an unfamiliar subfield. Does adding a browse view (a call-number shelf, LLM-labeled clusters or a 2D map, each linked to the result list) to a ranked list with facets raise the number of relevant works found per hour, or what the reader knows a week later? And separately: for finding specific relevant works, does any map beat a good list?

**Why it matters.** It decides where interface effort goes: search, facets and the access resolver, or shelves, maps and virtual rooms. It also decides whether the map and shelf mockups in the [Prototype Gallery](/building/prototype-gallery/) deserve to become daily tools.

**Evidence.**

- **Lists win targeted retrieval.** Chen and Yu's 2000 meta-analysis of visualization for retrieval found no significant combined effect, and individual cognitive ability mattered more than the interface. In every list-versus-map comparison *Maps of Knowledge* found, the list did as well or better ([Maps of Knowledge](/interfaces/maps-of-knowledge/)).
- **Structure helps people learn a collection.** Scatter/Gather used without search was worse at retrieval, but gave users "a more coherent conceptual image" of the collection and a richer query vocabulary ([Pirolli et al. 1996](https://doi.org/10.1145/238386.238489)). Metro Maps, placed beside a search engine, gave 73% subarea coverage against 46% (*Maps of Knowledge*). Of 32 art-history students, 90–91% preferred the Flamenco faceted interface to a baseline, and they were also more successful with it ([Yee et al. 2003](https://flamenco.berkeley.edu/papers/flamenco-chi03.pdf); [Foraging and Exploratory Search](/interfaces/exploratory-search/)).
- **Physical shelves measurably drive discovery.** In OhioLINK's 2007–08 borrowing data, a book was 9.5 to 21.7 times as likely to be borrowed on a day a shelf neighbour was borrowed as on the day before ([McKay, Smith & Chang 2014](https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658)). In two Danish public libraries, 10–12% of users found material only by exploring ([Björneborn 2008](https://informationr.net/ir/13-4/paper370.html)). But no virtual shelf browser has published a comparable figure, and the standalone ones died: Harvard's StackLife no longer resolves ([Browsing the Stacks](/finding/browsing-the-stacks/)).
- **2D layouts scramble neighbours.** On a t-SNE map of 20.7M PubMed papers, only 6.2% of a paper's 10 nearest neighbours in 2D were among its 10 nearest in the original space, though topic regions held together ([González-Márquez et al. 2024](https://doi.org/10.1016/j.patter.2024.100968)).
- **The evidence base is thin.** The 124 exploratory-search user studies with simulated work tasks from 2010–2021 had a median sample of 24 ([Medlar et al. 2023](https://arxiv.org/abs/2312.13695)). No controlled study tests an LLM-labeled browse interface over books. Users also preferred 3D layouts that gave no benefit, so preference alone is weak evidence.

**Lean.** *Maps of Knowledge* puts [~85%] on maps not beating a good ranked list for targeted retrieval, and [~65%] on maps added to search helping newcomers cover a field. So build both, linked so that a selection in either filters the other, with facets before maps [~80%, *Foraging and Exploratory Search*]. Shelves and maps are orientation tools. Build them after search, facets and routing work, not instead of them.

**What would change it.** A within-person test over a month: a ranked list plus facets against the same plus LLM-labeled clusters of the results, logging relevant items found per minute and a periodic "write what you know about this field" probe (*Foraging and Exploratory Search*). A virtual stacks browser that logs impressions and reports neighbour uptake against the 9× physical-shelf bar. A null result on both would push the lean to "list plus facets only". A clear win on the knowledge probe would move shelves and maps up the build order.

## 3. Whether LLM summaries are faithful enough to triage reading

**The crux.** Two linked questions with resolution tests. First, rerun FABLES with October 2026 frontier models on 10 openly licensed non-fiction books: is the share of claims not judged faithful under 5%? Second, give a model a topic and a shelf of books: do its chapter summaries flag at least 90% of the chapters that substantively treat the topic, against ground truth from the full text or page-level counts?

**Why it matters.** Triage by summary is the main labor-saving promise of a personal catalog: read gists of 1,000 books, open 20.

- **If summaries are triage-grade,** precompute them for the whole shelf and spend human checking only on books you will rely on.
- **If not,** lead with source text (tables of contents, abstracts, back-of-book indexes, located pages) and use generated text only as labeled pointers into it.

It also decides model choice. One-paragraph blurbs from metadata and tables of contents for 100,000 books cost about \$15 on Claude Haiku 5.5 batch and \$600 on Opus 5.5 at October 2026 prices. A FABLES-style human check costs about \$40 per summary ([Costs and Effort](/building/costs-and-effort/)).

**Evidence.**

- **The best book-scale study used 2024 models and fiction.** In FABLES (26 books, all but one fiction, 3,158 claims), 90.9% of Claude 3 Opus's claims were judged faithful, 2.1% unfaithful and 6.65% partly supported. GPT-4 reached 78%. Summaries over-weighted the end of the book, and the best automatic checker caught unfaithful claims at only F1 = 58.2 ([Kim et al. 2024](https://arxiv.org/abs/2404.01261); [Generative Interfaces](/interfaces/generative-interfaces/)).
- **No 2026 rerun exists.** Vectara's short-document leaderboard (2026-09-22) still shows 7–14% hallucination for frontier models, by a method not comparable to book reading ([Vectara](https://github.com/vectara/hallucination-leaderboard)).
- **Synthesis adds its own error.** In STORM's generated articles an automatic check found about 15% of sentences unsupported by their citations; the most common cause was two true facts joined by a link neither source makes ([Shao et al. 2024](https://arxiv.org/abs/2402.14207)).
- **Gists beside the text work; gists instead of the text are untested or worse.** Paper Plain's section gists made medical papers easier to read with the same comprehension (n = 24), and in pilots readers checked vague gists against the original ([Reading Interfaces](/interfaces/reading-interfaces/)). In seven experiments (n = 10,462), people who learned a topic from LLM syntheses reported shallower knowledge than people using web search, even when the syntheses carried links ([Melumad & Yun 2025](https://doi.org/10.1093/pnasnexus/pgaf316)).
- **Most books in a catalog have no text to summarize.** At most 2.5% of Open Library editions carry a table of contents, and 3.6% a description (R05's count, not reproduced; [Catalogs and Metadata](/finding/catalogs-and-metadata/)). For a book the tool cannot read, the "summary" is a metadata blurb, and [A Reference Architecture](/building/reference-architecture/) lists invented chapter content among its failure modes.

**Lean.** *Generative Interfaces* puts [~70%] on the best 2026 models leaving fewer than half of Claude 3 Opus's 9.1% of claims not judged faithful. My leans:

- full-text-grounded chapter summaries are good enough to decide which chapters to open [~75%], because a triage error costs one skipped or wasted chapter and a coverage strip can expose the end-of-book bias;
- they are not good enough to cite, or to replace reading the chapter you will rely on [~85%];
- metadata-only blurbs are not triage-grade at chapter level [~70%].

So this crux binds only on the share of a list the tool can read, which cruxes 1 and 9 set.

**What would change it.** A FABLES-style rerun on 10 openly licensed non-fiction books would cost about \$2,000 in annotation at FABLES' rate, plus the annotators' reading time. A cheaper test reuses the worked example in [Searching Inside Books You Don't Have](/finding/searching-inside-books/): HTRC page counts located the proper-scoring-rules treatment in 43 books, 17 of them with a section of three or more pages. Generate blurbs for those 43 from metadata and tables of contents, and count how many of the 17 the blurbs flag. An entailment checker scoring above about F1 = 85 on book-summary claims would also change the design, because "auto-checked" labels would then carry weight.

## 4. Whether a personal catalog beats paid discovery tools

**The crux.** Two questions, one per kind of literature.

- **Papers:** on your own queries, judged by people reading full text, does a Claude Code agent calling free tools match a paid deep-search engine's recall?
- **Books and chapters:** does any product route a topic to chapters across books, papers and lectures, and on to the best legal copy? Will one exist by the end of 2027?

**Why it matters.** It splits the build-or-buy decision. As of October 2026 a paid discovery seat costs \$144–\$588 a year, and four of them (Elicit, Undermind, Consensus, Claude Pro) cost \$1,124. A month-tier build takes 100–140 hours including human checking (80–120 without), worth \$5,000–\$21,000 at \$50–\$150 an hour, plus \$510–\$1,360 of spending in the worked example ([Costs and Effort](/building/costs-and-effort/)). Content is a separate purchase whatever you build.

**Evidence.**

- **The engines lead on papers.** On Undermind's own benchmark (vendor-run, 23 queries, a GPT-5.6 judge reading abstracts), Undermind found 85% of the top 20 relevant papers within 10 minutes. Claude Opus 5 in Claude Code with web search found 47%, and GPT-5.6 in Codex 50% ([Undermind](https://www.undermind.ai/)).
- **No AI search is exhaustive.** In an independent test against four completed evidence syntheses, Elicit's search recovered 39.5% of the included studies against 94.5% for the librarian-built searches, at 5.5 times the precision ([Lau & Golder 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/); [AI Research Assistants](/finding/ai-research-assistants/)).
- **Books are nearly invisible to the paid tools.** Elicit searches "academic papers", and Undermind and Consensus describe only papers. The exceptions are Google Scholar, which is free and says it searches books, and Scite, which claims to index them.
- **Nobody sells chapter routing.** R10 found no tool that clusters works and resolves the best legal free copy across books, papers and lectures, and *Costs and Effort* puts [~80%] on none existing.
- **Build hours are unmeasured.** They are R10's estimates for one strong developer, and *Costs and Effort* puts about 50% on a first-time builder exceeding the upper end.

**Lean.** For papers, buy [~80%, *Costs and Effort*]: a seat costs less than the hours to match it, and Undermind, Asta, Scite and OpenAlex can be called from Claude as MCP tools. For books and chapters, build, starting with the weekend tier (about \$22 and 12–20 hours, per *What to Do First*). My lean is [~25%] that a product doing chapter-level routing across books appears by the end of 2027: the paper tools are built on paper metadata, and book text sits behind licenses that bar AI input (crux 9).

**What would change it.** An independent rerun of Undermind's benchmark on forecasting, decision-theory and statistics queries, judged by people reading full text, with a well-tooled Claude Code agent as a contender. Published hour logs from real weekend and month builds. A product that indexes book chapters and routes each to an access option. For your own case: after a few weeks with the weekend build, count the relevant books and chapters it surfaced that your paid stack did not.

## 5. Whether VR is worth it for reading

**The crux.** After a week of adaptation, does reading technical material in a 35+ pixels-per-degree (PPD) headset match a 27-inch 4K monitor over 60–120-minute sessions? "Match" here uses the first three conditions of the keep rule in *VR and Spatial Computing*: reading speed at least 90% of the monitor's, quiz scores no more than one question in five lower, and eye strain no more than one point worse on a 7-point scale.

**Why it matters.** A yes would justify \$1,299.99–\$3,699 of hardware and the days to weeks that [Building a Virtual Reading Room](/environments/virtual-reading-room/) estimates for a custom room. A no confines VR to travel, small spaces, distraction control and multi-document layouts.

**Evidence** ([VR and Spatial Computing](/environments/vr-and-spatial-computing/)).

- **Pixels.** A 27-inch 4K or 5K monitor at 60 cm gives 67–90 PPD. The Quest 3S gives about 20 and the Vision Pro about 34. Meta's announced VR Glasses promise 37 (\$1,299.99, spring 2027; [Meta](https://about.fb.com/news/2026/09/introducing-meta-vr-glasses-3d-movies-immersive-live-sports-100-grams/)). Headset text must be 3–4 times larger in visual angle, so one or two pages are legible in view.
- **Speed survives low resolution; legibility does not.** Among 29 observers, reading took about 7% longer at 13 PPD than at about 60, while legibility effects were about ten times larger ([Kilpeläinen & Häkkinen 2023](https://doi.org/10.3389/frvir.2023.1243387)).
- **The one controlled work week went against VR.** Sixteen people on a Quest 2 reported 35% higher task load, 48% more eye strain and 16% lower perceived productivity than in a physical setup held to the same 1366×768 resolution. Three of 16 preferred VR, and two more recruits quit on day one ([Biener et al. 2022](https://arxiv.org/abs/2206.03189)).
- **Some people adapt fully.** Four of 10 self-selected long-term Vision Pro users work in it 5–8 hours a day ([Biener et al. 2025](https://arxiv.org/abs/2509.05067)).
- **No study compares comprehension on 2025–2026 headsets with a monitor.** Spatial memory is the strongest argument for space: a memory palace viewed in an Oculus DK2 raised recall by 8.8 points over a monitor (n = 40), but free 3D depth did not help.

**Lean.** *VR and Spatial Computing* puts [~60%] on a well-designed 35+ PPD headset roughly matching a monitor on comprehension while reading slightly slower and tiring readers more, and [~70%] on a visible deficit at 20 PPD for dense technical material. Its prior that a reader in this audience is still reading in a headset after the two-week test is [~20%], anchored on Biener's 3 of 16. Don't buy a headset to read better.

**What would change it.** A Biener-style week on current 35+ PPD hardware against a real 4K monitor, with a comprehension test rather than self-report. Independent reviews of Meta VR Glasses' text sharpness and comfort in 2027. For you alone: the two-week test with a returnable Quest 3S (\$349.99 since 2026-04-19, [Meta](https://www.meta.com/blog/update-meta-quest-pricing/)), judged on days 6–10 only, as specified in *VR and Spatial Computing*.

## 6. Whether generated interfaces help expert readers

**The crux.** Readers with graduate training in a field study a technical chapter. Does a generated study view (explainers, re-leveled text, generated diagrams and quizzes) beat the same chapter with the same number of quiz items on a test a week later? Separately, do generated navigation layers (definitions on demand, section gists beside the text, structured views over checked data) let them choose the right chapter faster?

**Why it matters.** It decides whether to spend effort and per-reader tokens on generated explainers and free-form pages, or on source-first navigation, provenance labels and retention tools. A chapter explainer costs about \$0.11 on Claude Sonnet 5.5 as of October 2026 ([Generative Interfaces](/interfaces/generative-interfaces/)), so money is not the constraint. Whether the view helps, and whether its errors mislead, is.

**Evidence.**

- **People prefer generated pages; no one has checked whether they learn more from them.** In Google's Generative UI study, generated interactive pages beat markdown answers in 82.8% of comparisons. Pages built by human experts still won 50.0% of their comparisons against generated pages, which won 35.3%. Raters judged pre-cached pages on preference, not accuracy, and generation "can often take a minute or two" ([Leviathan et al. 2026](https://arxiv.org/abs/2604.09577)).
- **The only learning RCT used novices.** In Learn Your Way, 60 students aged 15–18 scored 78% against 67% on a retention test 3–5 days later, and the tool's extra embedded quizzes could explain part of that gain ([Heldreth et al. 2025](https://arxiv.org/abs/2509.18664)).
- **The measured help is mostly for readers outside their field.** Paper Plain tested lay readers. Scim's skimming highlights were most useful in text-dense papers and papers outside the reader's field ([Scim](https://arxiv.org/abs/2205.04561); [Reading Interfaces](/interfaces/reading-interfaces/)).
- **Accurate navigation layers help researchers.** With ScholarPhi's definition tooltips, 27 researchers answered questions about 45 seconds faster per task with no loss in correctness, but the definitions were hand-extracted; the automatic extractor of the time scored 73% precision and 74% recall ([Head et al. 2021](https://arxiv.org/abs/2009.14237)). The Semantic Reader team's overview warns that "even slight errors in these models can have detrimental effects on the readers" ([Lo et al. 2023](https://arxiv.org/abs/2303.14334)).
- **Synthesis can cost learning.** Melumad and Yun's result (crux 3) cuts against generated replacements, though its topics were everyday ones, learning was self-reported, and its authors flag advanced science and math as a possible exception.

**Lean.** *Generative Interfaces* puts [~60%] on a well-designed generated study view improving retention over a static PDF for novices, and is "much less confident" for experts. My leans: for experts in their own field, a generated study view does not beat the source plus equal practice items [~70%]; generated navigation layers linked to source spans do help experts select and look things up [~65%]. Build declarative views over cached, checked data, and keep free-form page generation behind an explicit request [~85%, *Generative Interfaces*].

**What would change it.** The three-arm trial *Generative Interfaces* proposes (a PDF; the PDF plus identical quizzes; the full tool), run on graduate readers with a delayed knowledge test. In your own tool, a within-person comparison of chapter-selection time and later "was it worth reading?" ratings, with and without gists.

## 7. Whether legal access is shrinking or growing

**The crux.** Rerun this wiki's samples in October 2028. Is \$0 legal coverage higher or lower than in October 2026? Score three quantities separately, because they move in different directions:

1. free reading of new papers;
2. free remote reading of in-copyright books;
3. the right to reuse what you can read (license terms, AI clauses, API access).

**Why it matters.** If access is shrinking, the cheap steps are time-sensitive: in-person cards, archived CC BY versions, mirrored datasets, and a resolver that stores last-verified dates for each route. If it is growing, waiting is cheap and paid access loses value each year.

**Evidence that it is growing.**

- **Open-access share of articles in OpenAlex:** 22% (2015), 42% (2020), 59% (2022 and 2023) and 47% (2024) ([Herb 2025](https://rogue-scholar.org/records/1t1dg-xha78)). Part of the 2024 dip is lag, and *Open Papers and Preprints* puts [~75%] on an upward revision. Delta Think, which counts only paid-for OA, says OA's share "has hovered around 50%" since 2022 ([Delta Think](https://deltathink.com/news-views-market-sizing-update-2025-has-oa-recovered-its-mojo), 2025-10-21): a plateau, not a climb.
- **Funder mandates.** NIH requires accepted manuscripts from 2025-07-01 onward in PubMed Central at publication with no embargo ([NIH](https://grants.nih.gov/policy-and-compliance/policy-topics/public-access)). DOE, NSF (new awards from 2026-01-22) and USDA have policies in effect; defense, NIST and NOAA had no updated policy as of SPARC's [2026-05-04 update](https://sparcopen.org/our-work/2022-updated-ostp-policy-guidance/) ([Open Papers and Preprints](/access/open-papers/)).
- **The public domain advances a year every 1 January.** Works published in 1931, among them Ramsey's, de Finetti's and Gödel's, are in the US public domain by 2027-01-01 at the latest ([Duke CSPD](https://cspd.law.duke.edu/publicdomainday/2026/); [The Public Domain and Open Corpora](/access/public-domain/)).
- **Preprints keep growing.** arXiv took a record 40,363 submissions in September 2026 ([arXiv stats](https://arxiv.org/stats/monthly_submissions)) and has been an independent nonprofit, free to read, since 2026-07-01.

**Evidence that it is shrinking.**

- **Out-of-area library routes are closing.** LAPL's instant e-card is now for Los Angeles City residents only, because "licensing agreements with our digital content vendors require" it ([LAPL](https://lapl.org/library-card/borrowing-policies-and-information)). Orlando's Orange County Library System stopped issuing fee cards on 2026-07-31 ([OCLS](https://ocls.org/using-library/types-cards/what-are-types-cards/)). San Antonio added a \$30 annual fee for county residents outside the city from 2026-10-01 ([SAPL](https://guides.mysapl.org/librarycards)). JSTOR says public-library access is walk-in only ([Public Libraries](/access/public-libraries/)).
- **Lending shrank.** After the district court ruled for the publishers in *Hachette v. Internet Archive*, the Archive says more than 500,000 books became unavailable to borrow, partly because publishers outside the suit demanded removal ([Internet Archive help](https://help.archive.org/help/why-are-so-many-books-listed-as-borrow-unavailable-at-the-internet-archive/)). The Second Circuit affirmed on 2024-09-04, and the Archive did not seek Supreme Court review.
- **Reuse rights are tightening.** OpenStax moved new and updated titles to CC BY-NC-SA on 2026-04-22, after a March post blaming AI-accelerated commercial reuse ([OpenStax](https://openstax.org/blog/openstax-licensing)). Elsevier's terms (revised 2026-03-12) bar use with AI tools unless a license allows it, and JSTOR's (updated 2026-04-24) bar LLM training. OpenAlex has metered its API since 2026-02-24, though its snapshot stays free. HTRC's services closed on 2026-09-30. Bronze open access can be withdrawn at any time.

**Lean.** The three quantities diverge.

- **Free reading of new papers keeps growing** [~70%, mine], slowly, through funder mandates and preprints rather than paid-for OA, which has plateaued.
- **Free remote reading of books is flat to slightly down.** *Public Libraries* puts [~70%] on another widely recommended out-of-area route in the US closing or narrowing by the end of 2027. In-person cards for residents, the backbone of the Bay Area plan, are not the routes closing.
- **Rights to reuse are shrinking** [~75%, mine]. *Open-Access Books* puts about even odds [~50%] on another large open-textbook producer moving new titles to a non-commercial license by the end of 2027.

A reader loses little from this. A builder loses more, and loses it first.

**What would change it.** A registry of routes with last-verified dates, rerun every year, counting closures and openings (an open question in *The Access Ladder*). OpenAlex's settled OA shares for 2024 and 2025. A large library reopening non-resident e-cards. A publisher selling individuals an AI-use license (crux 9).

## 8. Whether page-level search inside in-copyright books survives

**The crux.** On 2027-06-30:

- Can HTRC Extracted Features 2.5 still be downloaded from an official HathiTrust or HTRC host?
- Does HathiTrust's full-text search still return page numbers and per-page hit counts for search-only volumes to a person using a browser?
- Does Internet Archive search-inside still return in-copyright hits through its JSON API?

**Why it matters.** "Which books discuss X, and on which pages?" is one of the few questions a personal tool can answer across in-copyright books without holding their text. The worked run in [Searching Inside Books You Don't Have](/finding/searching-inside-books/) found printed page locations in 43 books in about 15 minutes, for \$0. If the chain breaks, page-finding falls back to Google Books snippets and Amazon previews. Both ration what they show, and Google's API terms forbid building databases from responses ([Google APIs Terms](https://developers.google.com/terms)).

**Evidence.**

- **The research center is gone; the data remains for now.** "HTRC has discontinued its services as of September 30, 2026"; its Data Capsules, the sanctioned way to run code over in-copyright HathiTrust text, are gone, and the derived datasets remain without an account ([HTRC](https://analytics.hathitrust.org/)). EF 2.5 gives per-page token counts for 18.7M volumes, 9.97M of them in copyright (April 2025 snapshot, CC BY 4.0). Its files downloaded over an undocumented HTTPS route on 2026-10-15; the documented rsync route was not tested. (The 17.1M-volume figure in *The Legal Map* is the 2020 EF 2.0, the only release HTRC's Derived Datasets page lists.)
- **HathiTrust search is open to people, closed to scripts.** It covers 11,408,072 search-only volumes (Hathifiles, 2026-10-01). Scripted requests returned HTTP 403 on 2026-10-15; the catalog API and the Hathifiles stayed open.
- **IA search-inside finds books, not pages.** Its JSON API is scriptable at 1–3 requests a second, but its `page_num` field is the scan's length, not the hit page, and the per-page endpoint refuses restricted books.
- **The legal footing for search is settled.** *Authors Guild v. HathiTrust* (2014) and *Authors Guild v. Google* (2015) held search with page numbers or limited snippets to be fair use ([opinion](https://cases.justia.com/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.pdf)). *Hachette* concerned lending, not search.
- **Recent books fall off the cliff anyway.** Of the worked run's candidates published since 2010, 4 of 31 were lendable or page-searchable, against 82% of those published before 1990.

**Lean.** *Searching Inside Books* puts [~60%] on EF 2.5 still being downloadable from an official host on 2027-06-30, and [~80%] on no replacement for the Data Capsules existing as of October 2026. My leans: HathiTrust's interactive search still works for people on 2027-06-30 [~80%], given settled law and HTRC's closing note that "Access to the HathiTrust Digital Library remains open"; a sanctioned scripted route exists by then [~15%]; IA's search-inside JSON still answers [~75%]. For most readers the recency cliff matters more than whether these services survive.

**What would change it.** HathiTrust's statement on hosting after the research center formally closes at the end of 2026. An rsync test of the EF 2.5 module in January 2027. Any HathiTrust API key or allow-list for non-consumptive research. Whatever happens, mirror your fields now (4.4 TB for the full set); the CC BY 4.0 license lets a mirror be shared.

## 9. Whether AI clauses make tool-building on licensed content impossible

**The crux.** Can an unaffiliated US researcher lawfully send licensed full text (O'Reilly, Elsevier, JSTOR, Perlego) to an LLM in a personal tool? And will any of these sell an individual a license that permits it by the end of 2027?

**Why it matters.** It sets the architecture of every tool in Part V: whether licensed books and papers can be "ask the text" or only "ask the catalog". It also decides whether paying for O'Reilly or JPASS buys material for an AI reading tool, and whether an institutional affiliation is worth its price for text-and-data-mining (TDM) rights.

**Evidence.**

- **O'Reilly** (agreement updated 2024-10-09) forbids storing or transmitting content "as input or a prompt to a machine learning or AI system" without the copyright owner's written permission ([O'Reilly](https://www.oreilly.com/membership-agreement/)). *The Legal Map* rates sending it to a cloud model red.
- **Elsevier** (terms revised 2026-03-12) bars using content "in combination with an artificial intelligence tool", including to "analyse", unless a license or subscription agreement permits it ([Elsevier](https://www.elsevier.com/legal/elsevier-website-terms-and-conditions)).
- **JSTOR** (terms updated 2026-04-24) bans LLM training, scraping and systematic downloading. On *Cheap Subscriptions*' reading, its terms do not address prompting an outside model ([JSTOR](https://about.jstor.org/terms/)).
- **Unchecked.** Perlego's terms could not be found. Springer+, Everand, Kindle Unlimited, Kobo Plus and DeepDyve were not checked for AI clauses ([Cheap Subscriptions](/access/subscriptions/)).
- **Local models do not escape the clauses.** O'Reilly's and Elsevier's wording covers a model on your laptop as much as a cloud API [~80%, [University and Employer Access](/access/academic-and-employer/)].
- **Routes that exist.** Elsevier and Springer Nature grant non-commercial TDM to researchers at subscribing academic institutions ([Elsevier](https://www.elsevier.com/about/policies-and-standards/text-and-data-mining); [Springer Nature](https://www.springernature.com/gp/researchers/text-and-data-mining)). The EU's TDM exception for research organisations (DSM Directive Art. 3) and the UK's for non-commercial research (CDPA s.29A) cannot be overridden by contract. US users have no equivalent, and whether a US court would treat an AI-use ban as preempted or unconscionable for an individual is unsettled.
- **AI over licensed text is arriving inside incumbents' platforms.** Google Scholar's Quick Read (August 2026) digests "subscribed articles" enabled by "scholarly publishing partners", and Kindle's "Ask This Book" answers questions about supported books inside Amazon's closed apps ([Reading Interfaces](/interfaces/reading-interfaces/)). That publishers will keep AI rights for such platforms rather than sell them to individuals is my inference [~65%].
- **The catalog layer stays open.** Titles, identifiers, tables of contents, availability, deep links, your notes and openly licensed text are all usable. *The Legal Map* puts [~90%] on a personal tool carrying little legal risk if it avoids the red rows and keeps licensed PDFs away from cloud models unless the license allows it.

**Lean.** "Impossible" is the wrong word. A tool *on* licensed content, as a catalog and router, is fine. A tool that feeds licensed text *into* a model is barred for O'Reilly and Elsevier content without a separate license [~85%, mine, from the terms above]. My leans are [~20%] that any of the four sells individuals an AI-use license by the end of 2027, and [~70%] that AI rights flow instead through institutional TDM deals and the platforms' own AI features.

**What would change it.** A published individual AI-use addendum from a major platform. A consortium license, such as one of the University of California's, that permits analysis with cloud LLMs; Elsevier's terms say such a license would control. A US ruling on whether copyright preempts an AI-use ban in a consumer contract. Perlego's terms, read in full.

## How the cruxes interact

- **Cruxes 1 and 9 together set the "ask the text" share.** In the worked example it is 13 of 30 books, or 16 with scanned purchases. Crux 3 matters only inside that share; outside it, a summary is a metadata blurb.
- **Crux 4 depends on 1, 3 and 9.** A personal catalog's unique value lies in books, and books are where text access is lowest. So the catalog's value comes mostly from routing and page location (crux 8), not from summaries [~70%, mine]. The build order in *What to Do First* already reflects this: the access-profile script and the HTRC mirror come before the weekend shelf with its summaries.
- **Cruxes 2 and 6 are the same bet at two scales.** Both leans favor structure and generated text placed beside sources, not in place of them. One within-person experiment logging foraging rate and a delayed knowledge probe would inform both.
- **Cruxes 7 and 8 are about time.** They turn some actions into now-or-never: a card that stops being issued, a dataset that stops being hosted, a CC BY version that stops being updated.

## Which to resolve first

Rank by cost to resolve against the decisions at stake.

| Cost | Crux | How | Decision it settles |
|---|---|---|---|
| Five minutes to an hour | The small cruxes below | Test a login, ask a desk, read a terms page | Whether JPASS, O'Reilly Individual or the \$25 Extension card is ever worth buying |
| One hour | 1, for your own list | The coverage protocol in *Cheap Subscriptions* | Text-first or catalog-first tool; subscription choice |
| A weekend, about \$22 | 4 and 3, for your own case | The weekend build, then count what it found that paid tools did not | Whether to build the month tier |
| Two weeks, mostly refundable | 5, for you | The returnable headset test | Keep or return |
| About \$2,000 | 3, for everyone | FABLES-style rerun on 10 open non-fiction books | Whether "auto-summarize the shelf" is safe |
| Several days of work [estimate] | 1, for everyone | The 300-title syllabus sample, every rung | Every coverage figure in Part I |
| A funded study | 5 and 6, for everyone | A Biener-style week on current headsets; a three-arm trial with graduate readers | Whether VR or generated views help experts |
| Ongoing | 7 and 8 | A dated route registry; watch HathiTrust in January 2027 | Which actions are time-sensitive |

### The small cruxes

These are cheap to settle and each flips a purchase. Estimates are the named chapters' probabilities that the answer is yes.

| Question | Estimate | What it decides | How to settle it | Source |
|---|---|---|---|---|
| Does SFPL's JSTOR link work from home? | [~50%] | Whether JPASS (\$199 a year) ever makes sense | Any cardholder, five minutes | [Public Libraries](/access/public-libraries/) |
| Does O'Reilly for Public Libraries carry the full book catalog? | [~70%] | Whether O'Reilly Individual (\$499 a year) adds anything for a cardholder | Sample sitemap titles through a library login | [The Access Ladder](/access/access-ladder/) |
| Do O'Reilly's AI clauses bind library patrons? | [~75%] | Whether library O'Reilly text may go into Claude | Read the terms shown at first login | [Public Libraries](/access/public-libraries/) |
| Does a 3-unit "Start Anytime" course qualify for UC Berkeley's \$25 card? | [~60%] | A route to remote university access at about \$835 per six months | Ask the library's Privileges Desk, naming the course | [University and Employer Access](/access/academic-and-employer/) |
| Does an LAPL card issued in person to a Californian outside the City include Libby? | [~80%] | Whether an LA trip adds CLRS and three humanities titles | Ask at the desk | [Public Libraries](/access/public-libraries/) |
| What do Perlego's terms say about AI input? | Unverified | Whether Perlego can feed an AI reading tool | Read the terms after signing up | [Cheap Subscriptions](/access/subscriptions/) |

## Open questions

- **Are these the right nine?** Their weights depend on how a reader's time splits between books, papers and lectures. A two-week reading log from 20–30 researchers in this audience would show whether the book cruxes (1, 3, 8, 9) or the paper cruxes (4, 7) should lead.
- **What share of a random syllabus sample is legally free, and what share is reachable at \$0?** About 300 post-1990 titles in statistics, ML, economics and philosophy, routed through every rung of *The Access Ladder*, with coverage by rung and field and error bars.
- **Do catalog-only blurbs flag the right books?** For the 43 books located in the proper-scoring-rules run, generate blurbs from metadata and tables of contents alone, and count how many of the 17 books with a section of three or more pages they identify.
- **How faithful are October 2026 models on non-fiction book summaries?** A FABLES-style rerun on 10 openly licensed books, reporting unfaithful, partly supported and omitted claims separately.
- **Does a structure pane beside a ranked list raise what a newcomer finds and learns?** One within-person month, logging relevant items per minute and a weekly knowledge probe; the same design can test generated gists (cruxes 2 and 6).
- **Does a 35+ PPD headset match a 4K monitor on comprehension after a week of adaptation?** A Biener-style replication on current hardware with a comprehension test.
- **How fast are legal routes opening and closing?** A registry of library cards, author-hosted books, lending status, dataset hosts and license terms, each with a last-verified date, recounted every year.
- **Will any platform license AI use to an individual?** Ask O'Reilly, Elsevier and JSTOR for terms for a single non-commercial researcher, and record the answers with dates.

## Related pages

- [What to Do First](/start-here/decision-guide/): the plan these cruxes would change
- [Open Stacks](/start-here/introduction/): why the wiki keeps the catalog separate from the content
- [The Access Ladder](/access/access-ladder/): the coverage samples behind crux 1 and the worked example
- [Open-Access Books and Textbooks](/access/open-books/): the 55-book test and the long-tail evidence
- [Open Papers and Preprints](/access/open-papers/): OA shares, funder mandates and the Walters recomputation
- [Public Libraries](/access/public-libraries/): which out-of-area routes are closing
- [Cheap Subscriptions](/access/subscriptions/): license terms and the one-hour coverage test
- [University and Employer Access](/access/academic-and-employer/): TDM rights and AI clauses in institutional licenses
- [Browsing the Stacks](/finding/browsing-the-stacks/) and [Maps of Knowledge](/interfaces/maps-of-knowledge/): the evidence for crux 2
- [Foraging and Exploratory Search](/interfaces/exploratory-search/): information scent and the shallow-learning result
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): the page-location chain behind crux 8
- [AI Research Assistants](/finding/ai-research-assistants/): recall and citation audits behind crux 4
- [Reading Interfaces](/interfaces/reading-interfaces/) and [Generative Interfaces](/interfaces/generative-interfaces/): the evidence for cruxes 3 and 6
- [VR and Spatial Computing](/environments/vr-and-spatial-computing/): the headset evidence and the two-week test
- [The Legal Map](/building/legal-map/): the risk ratings behind crux 9
- [Costs and Effort](/building/costs-and-effort/): build hours and the build-or-buy table
- [Open Problems](/reference/open-questions/): the wiki-wide list of unresolved questions
