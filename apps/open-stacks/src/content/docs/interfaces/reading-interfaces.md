---
title: Reading Interfaces
description: What research prototypes and products show about reading at different depths (Ai2's Semantic Reader prototypes, LiquidText, MarginNote, explorable explanations, Distill, the mnemonic medium, Gwern.net's popups, StretchText and semantic zoom, and the skimming literature), with study results, costs at October 2026 prices, and which ideas carry over from papers to books.
---

*Status: draft, October 2026. Product features and statuses are as of October 2026. Study results are as their authors report them; most come from small lab studies (9–60 participants) run between 2001 and 2023 on papers and essays, not books. Every statement about books is inference unless a source is cited. Sources: the [R06 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md), the [R11 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R11-reading-practice-curation-devices.md), and primary sources linked inline.*

## The short version

- **The interfaces with evidence behind them add a layer to the original text. They do not replace it.** Overview+detail beat fisheye distortion. Wikipedia's hover previews added engagement and almost nobody turned them off. Paper Plain put plain-language gists *beside* the original sections and found no loss of comprehension. Interfaces that replace the text, such as speed-reading apps or a summary read instead of the book, have weak or negative evidence. [I, medium-high]
- **Ai2's Semantic Reader program is the best-evaluated body of work:** ten prototypes and 300+ study participants. Three features shipped: definitions on demand, skimming highlights, and personalized citation cards. As of October 2026 all three cover arXiv papers only, and skimming highlights cover only English-language CS papers. ([Semantic Reader](https://www.semanticscholar.org/product/semantic-reader))
- **Many of these ideas stalled because someone had to write the extra layer**: definitions, gists at several levels, interactive models, review prompts, link annotations. LLMs remove most of that writing cost. A book-length layer now costs about a cent with Haiku 5.5 batch, or 20–30 cents with Sonnet 5.5 batch. Checking that layer does not get cheaper: one human faithfulness check of a book summary cost about \$200 in FABLES. [I, from verified prices]
- **Retention is the best-evidenced and most neglected depth.** Practice testing and spacing are rated "high utility". Highlighting and rereading are rated "low". Most annotation tools are built around highlighting. ([Dunlosky et al. 2013](https://www.aft.org/ae/fall2013/dunlosky))
- **Almost none of this research tested books.** Of the ideas covered here, those that transfer best are position-sensitive definitions for textbooks, chapter-level gists linked to source spans, hover cards for references, and reusing human-written overviews (Relatedly's trick). Paper-specific facets (Goal/Method/Result) and citation personalization transfer least well.

## Six depths of reading

Reading is several tasks with different interface needs, and the evidence sorts by task. The table extends the reading-mode matrix in R11 (see [Reading Modes and Devices](/environments/reading-modes-and-devices/)).

| Depth | The reader's question | What the evidence favors | Interfaces that target it |
|---|---|---|---|
| **Triage** (seconds per item) | Is this worth opening? | Accurate *information scent* (cues about content you can't see yet); previews that don't navigate away | Wikipedia Page Previews, Gwern.net popups, TLDRs, citation cards |
| **Skim** (minutes per item) | What does it say, and where? | Structure that supports satisficing; highlights that are faceted, evenly spread and adjustable in density | Scim, Google Scholar PDF Reader's AI outlines, section gists |
| **Lookup** | What does this term, symbol or citation mean *here*? | Definitions in place, which save time without hurting accuracy | ScholarPhi, CiteSee, footnote popups |
| **Deep study** | Do I understand it, and do I believe it? | Self-paced reading; excerpts that keep their links to the source; manipulable models | LiquidText, MarginNote, explorable explanations, Distill |
| **Synthesis** | How do several works fit together? | Reuse of human-written overviews; threads with provenance | Relatedly, Threddy, LiquidText's multi-document workspace |
| **Retention** | Will I still know this in a year? | Retrieval practice and spacing | Quantum Country, Orbit, Anki with FSRS, MarginNote 4 |

A common failure is a single "AI reading assistant" that summarizes everything. It serves triage well. It also invites the reader to skip deep study and retention, the two depths where the learning happens. The rest of this chapter goes depth by depth.

## Skimming: what the eye-tracking says

Skimming is a different task from reading, not a faster version of it. The research agrees on four points:

- **Speed reading, as sold, does not work.** [Rayner et al. 2016](https://profiles.wustl.edu/en/publications/so-much-to-read-so-little-time-how-do-we-read-and-can-speed-readi/) (*Psychological Science in the Public Interest* 17(1)) conclude that going from about 250 words per minute to 500–750 while keeping comprehension is unlikely. Gains come from practice and language skill such as vocabulary, not from eye-movement tricks. Secondary summaries add that apps which prevent rereading (RSVP, Spritz-style) hurt comprehension [S, medium].
- **Skimming has a distinct eye-movement signature and costs comprehension.** In [Strukelj & Niehorster 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC7198234/) (N = 60), skimming meant shorter fixations, longer saccades, fewer regressions, and significantly lower comprehension (p under .001) than regular reading.
- **Good skimmers satisfice.** Duggan & Payne studied skimming of expository text under time pressure as a form of foraging ([2009](https://researchportal.bath.ac.uk/en/publications/text-skimming-the-process-and-effectiveness-of-foraging-through-t/), *J. Exp. Psych.: Applied* 15(3)). Their [2011 reanalysis](https://researchportal.bath.ac.uk/en/publications/skim-reading-by-satisficing-evidence-from-eye-tracking/) of the eye-movement data found that skimmers directed attention to the most important information, which improved their memory for it. Their model: read a section until the rate of new information falls below a threshold, then skip to the next one. I recall that the 2009 paper also found skimming the whole text beat reading half of it carefully, but I could not verify this; the abstract is not openly available [~65%].
- **Highlights help skimmers when the density is right.** Scim (below) found faster information finding with no loss of accuracy. Its authors warn that "too few highlights will present the guise of an inept tool, and too many will slow a reader down" ([Lo et al. 2023](https://arxiv.org/abs/2303.14334)).

**What this implies for design** [I]:

- A skimming aid should feed the satisficing decision. The reader needs to know where the new information is and when to move on.
- Useful signals: section gists, an always-visible outline, and novelty measured against what the reader has already read. That last signal is an embedding distance from the reader's library and highlights, and no shipping tool computes it, as far as I found.
- Don't build RSVP readers.

**The open question is replacement.** An LLM outline might make skimming better, or it might replace skimming, with the retention cost that implies. I found no study that separates the two. The nearest evidence is Kosmyna et al. ([arXiv 2506.08872](https://arxiv.org/abs/2506.08872)): people who wrote essays with an LLM showed weaker EEG connectivity and struggled to quote their own essays. That study covers writing, not reading, with 54 participants (18 in the crossover session), and is a preprint. Treat it as a caution, not evidence [low-medium].

## The Semantic Reader program

From 2020 to 2023, a multi-institution team led by Ai2 built ten research prototypes around five reader challenges: discovery, efficiency, comprehension, synthesis and accessibility. They ran usability studies with more than 300 participants ([Lo, Chang, Head et al. 2023](https://arxiv.org/abs/2303.14334)). It is the closest thing this field has to a sustained, evaluated research program.

| Prototype | Mechanism | Study | Result | Shipped? |
|---|---|---|---|---|
| [ScholarPhi](https://arxiv.org/abs/2009.14237) (CHI 2021) | Tooltips with position-sensitive definitions of terms and symbols; a "declutter" filter that shows every use of a term; equation diagrams; automatic glossary | Formative work with 24 researchers; evaluation with 27 | Answered questions "in significantly less time, while viewing significantly less of the paper." All readers said they would use tooltips and formula diagrams "often or always." The definition-detection model was the bottleneck: 73% precision, 74% recall | Yes: "definitions on demand," now AI-generated from context |
| [CiteSee](https://arxiv.org/abs/2302.07302) (CHI 2023) | Inline citations colored by the reader's history (cited, saved, opened) and highlighted by predicted relevance | Lab study, 10 participants; field deployment, 6 participants for 1–2 weeks | Beat three baselines in the lab. In the field, re-encountered citations were 8.2% of all citations but 37% of the paper cards opened. A prior survey found inline citations drove about 21% of paper discoveries | Yes: personalized citations (desktop only; needs a Semantic Scholar library) |
| [Scim](https://arxiv.org/abs/2205.04561) (IUI 2023) | Highlights faceted by content type (objective, novelty, method, result), spread evenly, density adjustable globally and locally | Lab study, 19 participants; diary study, 12 participants over 2 weeks | Found information "in significantly less time … with comparable effort and accuracy." Highlights helped in 74 of 105 diary sessions (70.4%). Most useful for text-dense papers and papers outside the reader's field | Yes: skimming highlights labeled Goal/Method/Result |
| [Paper Plain](https://arxiv.org/abs/2203.00130) (TOCHI 2023) | For lay readers of medical papers: term definitions, plain-language section gists, and a key-question index linking to the passages that answer each question | 24 participants recruited on Upwork, within-subjects, against a standard PDF reader | Reading was significantly easier and readers more confident, with similar comprehension. Readers used the gists more than the definitions | No |
| [Threddy](https://arxiv.org/abs/2208.03455) (UIST 2022) | While reading, clip sentences from related-work sections into a hierarchy of "threads" that keep their citations; recommends papers from those threads | 9 participants against Google Docs | Significantly more clips and references collected; higher flow scores | No |
| [Relatedly](https://arxiv.org/abs/2302.06754) (CHI 2023) | Search across *existing* related-work paragraphs from many papers, with diversity re-ranking, de-emphasis of redundant content, and paragraph headings generated by a fine-tuned BART summarizer | 15 participants, within-subjects, against a baseline paper list | Participants wrote topic outlines rated more coherent, insightful and comprehensive | No |

**What the program shows** (quotes are from [Lo et al. 2023](https://arxiv.org/abs/2303.14334); interpretation is mine):

1. **Model errors were the binding constraint.** ScholarPhi's interface worked, but its 2021 definition extractor got about a quarter of definitions wrong or missed them. The authors warn that "even slight errors in these models can have detrimental effects on the readers."
2. **LLMs changed the economics during the program.** "Until recently, interface design could require months of development of bespoke AI models." LLMs let the team "experiment with a wide range of new NLP capabilities at relatively low cost." The shipped definitions feature is now AI-generated from context ([product page](https://www.semanticscholar.org/product/semantic-reader), October 2026).
3. **Relatedly is the most portable idea.** It avoids generating syntheses by reusing human-written ones: related-work paragraphs are expert overviews that already exist. Only the headings were machine-written. The hallucination risk is therefore small, and it shrinks further if the headings are clearly labeled. [I]
4. **Paper Plain's result is the one most relevant to "reading at a different depth."** Readers given gists beside the original text found reading easier and lost no comprehension. They also chose gists over definitions. The gists were an added layer, not a replacement.

**Coverage, October 2026.** Semantic Reader works on "most arXiv papers on Semantic Scholar." Per the Semantic Scholar FAQ cited in R04, that is more than 250,000 papers. Skimming highlights cover "most English-language arXiv papers in computer science fields." Google's [Scholar PDF Reader](https://scholar.googleblog.com/2024/11/ai-outlines-in-scholar-pdf-reader-skim.html) (a Chrome extension) added AI outlines in November 2024: an "extended table of contents" with bullets per section, for selected English papers. Neither covers books. See [AI Research Assistants](/finding/ai-research-assistants/) for the rest of the paper-reading tool landscape.

**If you read CS arXiv papers, use Semantic Reader.** It is free, and its three shipped features are the ones with study results behind them. Turn on personalized citations by saving at least one paper to a library on desktop, and lower the highlight density for papers in your own field. Scim's gains were largest outside the reader's field.

## Hover previews and link annotations

### The large-sample evidence

Hover previews are one of the few reading-interface ideas tested at scale. Wikimedia ran two A/B tests of Page Previews on English and German Wikipedia between October 2017 and February 2018 ([Wikimedia](https://www.mediawiki.org/wiki/Page_Previews/2017-18_A/B_Tests)):

| Metric (English / German) | Test 1 | Test 2 |
|---|---|---|
| Pageviews per session | −4% / −3% | −5% / −3% |
| Distinct pages interacted with per session | +22% / +20% | +21% / +21% |
| Back-button use | −8% / −2% | −9% / −3% |
| Previews seen (card open at least 1 s) per pageview | 0.26 | 0.27 |
| Sessions that disabled the feature | about 0.01% | about 0.01% |

Readers looked at about a fifth more pages while opening fewer. The previews replaced navigations instead of adding them. Page Previews has been on by default on all Wikipedias since July 2018. These data are from 2018 and from an encyclopedia, not from long-form reading [possibly stale].

### Gwern.net: the most developed single-author version

[Gwern.net's design page](https://gwern.net/design) (last modified 2023-04-20) describes a reading interface built for "iceberg-like pages where most information is hidden":

- **Recursive popups.** Hovering a link opens the target as a full popup. Popups can be nested, moved, resized and pinned. On mobile they become tappable popovers.
- **Link annotations.** Each annotated link has a mini-page with metadata, abstract and excerpts. Some are hand-written; others are "automatically extracted from sources (eg. Arxiv/BioRxiv/MedRxiv/Crossref)." The point is to let readers judge a source before visiting it.
- **Collapsible sections.** Code-folding-style disclosure keeps the surface short. Combined with lazy transclusion, it builds very large "virtual" pages.
- **Sidenotes** instead of footnotes on wide screens (2020).
- **Link bibliographies.** Every link on a page, in order, with annotations expanded, so a reader can skim them all at once.
- **Backlinks with context** (since 2021, rebuilt nightly).
- **"Similar links."** A nearest-neighbor lookup over neural embeddings, which the page says comes with "no guarantees of relevance."
- **Local archives** of linked pages, because "every link dies someday."

Each feature lets the reader choose a depth on the spot: a link becomes a popup, an abstract, an excerpt, or the full source. Gwern.net is effectively StretchText (next section) applied to the reference layer, not to the prose.

### The risk: generated scent can mislead

An LLM can write an annotation for every link, citation and book mention, which removes the bottleneck of one author's time. The risk is misleading information scent. Liu, Zhang & Liang audited four generative search engines in 2023 ([arXiv 2304.09848](https://arxiv.org/abs/2304.09848)). Only 51.5% of generated sentences were fully supported by their citations, and only 74.5% of citations supported their sentence. Foraging theory predicts that confident but wrong scent sends readers down bad paths (see [Foraging and Exploratory Search](/interfaces/exploratory-search/)). These are 2023 systems; current error rates are probably lower, but I could not find a comparable 2026 audit.

**Design rule** [I, high]: a hover card shows source material first and generated text second, and labels which is which:

1. the abstract, table of contents, or the cited passage itself
2. a generated "why this is cited here" gloss, built from the citing sentence plus the cited work's abstract (CiteSee-style)
3. whether the reader has seen the item before

## Multi-resolution text: StretchText, semantic zoom and generated gists

**The old idea.** Ted Nelson described [StretchText](https://en.wikipedia.org/wiki/StretchText) by 1967 and published it in 1970: text that expands or contracts in place, keeping its context. Zoomable interfaces (Pad, 1993; Pad++, 1994) added *semantic zoom*, where the representation changes with scale instead of just getting bigger. StretchText's uses stayed mostly literary, and it "has not achieved mass adoption on the World Wide Web." **The reason is cost: someone had to write every level** [I, high].

**The evidence on keeping context.** Hornbæk & Frøkjær (CHI 2001; reported in [Hearst 2009, ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)) compared linear, fisheye and overview+detail readers with 20 participants on technical articles:

- "All but one participant preferred the overview detail interface."
- Participants "did not like the fisheye view."
- They "achieved higher grades using the overview detail view," but spent more time in it when answering questions.

The lesson for multi-resolution text: show the overview *next to* the undistorted text. Do not squash the text itself.

**The LLM versions, as of October 2026:**

| Product or prototype | What it generates | Scope | Evidence |
|---|---|---|---|
| Paper Plain gists (2022–23) | A plain-language gist per section, beside the original | Research prototype; medical papers | n = 24: easier reading, same comprehension |
| [Google Scholar PDF Reader AI outlines](https://scholar.googleblog.com/2024/11/ai-outlines-in-scholar-pdf-reader-skim.html) (Nov 2024) | An "extended table of contents" with bullets per section | Selected English papers | None published that I found |
| Kindle "Story So Far" and "Ask This Book" ([Amazon](https://aboutamazon.com/news/devices/new-amazon-kindle-scribe-color)) | A recap up to your position; Q&A over the book | US books only; closed, with no API | None published |
| Gemini Notebook (formerly NotebookLM) Audio Overviews ([help](https://support.google.com/gemininotebook/answer/16212820)) | Spoken discussions: Deep Dive, Brief, Critique, Debate | Up to 50 sources free, each up to 500,000 words; EPUB accepted | None on comprehension; Google warns they "may contain inaccuracies" |
| Google's Learn Your Way (Sept 2025) | A textbook chapter re-leveled to the reader's grade level, with quizzes and other formats | One chapter; Labs experiment | RCT, n = 60, ages 15–18: 78% vs 67% on a retention test 3–5 days later. See [Generative Interfaces](/interfaces/generative-interfaces/) |

**Faithfulness is the remaining constraint.** In [FABLES](https://arxiv.org/abs/2404.01261) (26 books published 2023–24, 3,158 claims), the best 2024 model had 90.9% of its book-summary claims judged faithful (Claude 3 Opus). GPT-4 reached 78% and Mixtral 69%. Most unfaithful claims concerned events and character states, and summaries over-weighted the ending. The best LLM judge reached only F1 = 58.2 at catching unfaithful claims, so machines could not yet check the summaries. Current frontier models are probably better, but I found no 2026 rerun [~70% that error rates have at least halved; unverified].

**How to build a zoom ladder** [I]. A zoom ladder goes book → part → chapter → section → paragraph, with these properties:

- Every gist sentence links to the span it summarizes. Sentences without support are flagged.
- A *coverage strip* shows which chapters each level drew from, which exposes FABLES-style end-of-book bias (an idea from R07).
- Levels are generated once per book and model version, cached, and labeled with model and date.
- The original text stays one click away at every level.

Books already contain human-written levels that a zoom ladder should show before any generated ones: the table of contents, chapter introductions and summaries, the index, and the glossary. A back-of-book index is a hand-built answer to "where in this book is X discussed?" It is a TileBars display without the graphics. [I]

## Active reading workspaces: LiquidText, MarginNote and Threddy

These tools treat an *excerpt that keeps its link to the source* as the basic unit of deep reading. That is the "evidence file" of Pirolli and Card's sensemaking loop (see [Foraging and Exploratory Search](/interfaces/exploratory-search/)).

| Tool | Mechanism | Platforms and price (Oct 2026) | Evidence | Source |
|---|---|---|---|---|
| **LiquidText** | Pull excerpts out onto a workspace; link notes to many passages; pinch to bring distant passages or documents together; connect material "across pages and documents" | iPadOS, Windows, macOS; LIVE sync is a subscription; no prices or AI features on the homepage | Research origin: Tashman & Edwards, CHI 2011 (114 citations). I could not read its evaluation; the abstract is withheld in the Semantic Scholar record | [liquidtext.net](https://www.liquidtext.net/) |
| **MarginNote 4** | PDF and EPUB reader where every highlight becomes a card; cards, mind-map nodes and flashcards are "same card, three forms"; FSRS scheduling; "Immersive Recall" mode blurs the document so you recall before revealing; AI chapter summaries, key terms and quiz drafts that the reader accepts, edits or rejects | iPad and Mac; 14-day trial; lifetime or subscription (prices not on the homepage) | Vendor claims about 30% less review time than "traditional Anki schedulers." This is unverified marketing | [marginnote.com](https://www.marginnote.com/) |
| **Threddy** (prototype) | Clip sentences into threads while reading, keeping their citations; thread-based recommendations | Research prototype | n = 9 against Google Docs: more clips and references, higher flow | [arXiv 2208.03455](https://arxiv.org/abs/2208.03455) |
| **Zotero 10** | Reflowable "Reading Mode" for PDFs that you can annotate in; Read Aloud (since Zotero 9); advanced search over annotations | Free and open source; Win/Mac/Linux, iOS, Android | None published | [Zotero 10](https://www.zotero.org/blog/zotero-10/) (2026-08-17) |

**MarginNote 4 shows where this category is heading**: highlight, then card, then scheduled review, inside the reader, with AI drafts the reader approves. The approval step matters. Highlighting alone is a "low utility" technique ([Dunlosky et al.](https://www.aft.org/ae/fall2013/dunlosky)), so a highlight earns its keep only when it becomes a retrieval prompt. Readwise's Daily Review, which resurfaces highlights, is closer to rereading than to retrieval unless highlights are converted to questions [I].

**An LLM version of LiquidText** [I] would pre-extract candidate excerpts (claims, definitions, numbers, caveats) with their locations. The reader accepts or rejects them, and the workspace becomes a table of claims with provenance. For a forecasting-minded reader, the natural next column is a credence, with a link to the evidence that moved it.

## Explorable explanations and Distill

Bret Victor's ["Explorable Explanations"](https://worrydream.com/ExplorableExplanations/) (2011; postscript February 2024) proposed text as "an *environment to think in*." It describes three forms: reactive documents, where the reader changes the author's assumptions and sees the consequences; explorable examples; and contextual information. The 2024 postscript reframes the goal as "a written *argument* whose assertions are backed by explorable computational models." Victor also warns against widgets that "dump the user in a sandbox": the interactivity should serve the argument.

[Distill](https://distill.pub/) (2016–2021) was the most serious attempt to publish such work at research quality. It published about 32 articles, the last dated 2021-09-02. Its [hiatus note](https://distill.pub/2021/distill-hiatus/) (2021-07-02) names the cost: each article "still requires significant work," the editors worked "in a volunteer capacity," and "these frictions have caused our team to struggle with burnout." The editors predicted that "the future for most types of articles is probably self-publication."

**What changed, and what did not** [I]:

- An LLM can now generate a working interactive model of a formula or simulation in minutes (see [Generative Interfaces](/interfaces/generative-interfaces/)). The authoring cost that ended Distill is mostly gone.
- The verification cost is not. A reactive document with a wrong model teaches the wrong intuition *convincingly*. A fluent wrong summary is easy to distrust; a slider that behaves plausibly is not.
- **The best fit is a well-specified model taken from a book or paper**, checked against the source's own worked examples. Examples in this reader's domains: Bayes' rule with adjustable base rates, the Kelly criterion, the bias–variance trade-off, the decomposition of a Brier score, a SIR epidemic model. Each has a closed form or a reference implementation to test against.
- **The worst fit is a generated "simulation" of a verbal argument.** The model's assumptions then belong to the LLM, not the author.

For textbooks, this is the highest-value use of generated interactivity [~70%]. Many textbook formulas already have worked examples in the text, and those examples serve as test cases.

## The mnemonic medium and spaced repetition

### What Quantum Country showed

Andy Matuschak and Michael Nielsen's [Quantum Country](https://quantum.country/) embeds spaced-repetition prompts inside an essay. Their October 2019 report, ["How can we develop transformative tools for thought?"](https://numinous.productions/ttft/), gives the results:

- **The first essay** takes about 4 hours to read and contains 112 prompts. Review intervals step from in-text to 5 days, 2 weeks, a month and so on, reaching about 4 months after five successful reviews.
- **After 6 repetitions,** most users had about 6,000 days of total demonstrated retention across the 112 prompts, or roughly 54 days per prompt, for about 95 minutes of total review.
- **Six months after release,** 195 users had demonstrated a month of retention on at least 80% of the prompts.
- **An informal 8-prompt experiment:** readers whose review was delayed fell from 91% to 87% accuracy (n = 25), while readers on the regular schedule rose from 89% to 96% (n = 16).
- **The authors' own caveats:** they retracted one earlier claim after finding a data-analysis error, and they say Quantum Country's prompts did not meet their own standard.

Matuschak's later notes report that readers who reach five or more days of demonstrated retention rarely forget afterward (median accuracy around 95%). He also says the data are correlational [S, via R11]. **The causal evidence for the mnemonic medium as such is one informal experiment.** The evidence for its ingredients is much stronger.

Quantum Country is still live with four essays and Patreon support. Its successor platform, [Orbit](https://github.com/andymatuschak/orbit), is open source and describes itself as an experimental platform, "first and foremost a vehicle for research" (October 2026).

### The underlying evidence is strong

| Technique | Evidence | Source |
|---|---|---|
| Practice testing and distributed practice | Rated "high utility" in the standard review; highlighting, rereading and summarization rated "low" | [Dunlosky et al. 2013](https://www.aft.org/ae/fall2013/dunlosky) |
| Spacing | Meta-analytic d = 0.42 (Donovan & Radosevich 1999). In Kornell 2009, spacing beat massing for 90% of participants, yet 72% believed massing worked better | [Gwern's review](https://gwern.net/spaced-repetition) (2019) |
| Testing vs restudy | About 60% vs 40% recall after one week (Roediger & Karpicke 2006) | same |
| FSRS scheduler | On about 10,000 Anki collections, log loss 0.3460 vs 0.4033 for ACT-R and 0.4694 for HLR, measured without same-day reviews. With same-day reviews the gap narrows to 0.3842 vs 0.3898 | [srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark) |
| Long-run cost | Nielsen estimated 4–7 minutes of lifetime review per card, and 15–20 minutes a day for about 10,000 cards | [Nielsen 2018](http://augmentingcognition.com/ltm.html) |

Anki has offered FSRS since version 23.10, with a default desired retention of 90% ([Anki manual](https://docs.ankiweb.net/deck-options.html), October 2026).

### The arithmetic for books

At Quantum Country's density of 112 prompts per 4 hours of reading, a book that takes 20 hours to study yields about 560 prompts. At Nielsen's 4–7 minutes per card, that is about **37–65 hours of lifetime review per book** [I]. The mnemonic layer can easily cost more time than the reading.

That argues for being selective. Write prompts for the 5–10 works you want to master, which is Nielsen's "deep core" (see R11), and only for the parts you will build on. Don't write prompts for everything you read.

### Who writes the prompts

Matuschak and Nielsen wrote every prompt by hand, and writing good prompts is hard. An LLM can draft 3–5 prompts per section for any chapter for a fraction of a cent. **Whether machine-drafted prompts produce the same retention as expert-written ones is untested.** I found no published controlled comparison [~70% that none exists]. The generation effect suggests that the reader's own editing matters.

**What to do now:** treat LLM prompts as drafts the reader accepts, edits or deletes, as MarginNote 4 does. Track your own retention on drafted and self-written prompts separately. It is a cheap n-of-1 experiment, and there is no published answer to wait for.

## What transfers to books

Most of this research used papers and essays. Papers have a standard structure (abstract, method, results), open full text on arXiv, and dense machine-readable citations. Books have less standard structure and are less often available as open text. In exchange, they come with human-written navigation: tables of contents, indexes, glossaries, chapter summaries, further-reading sections. The table is my assessment [I]; no study has tested any of these on books.

| Idea (evidence on papers or essays) | Book version | What it needs | Transfer | Main obstacle |
|---|---|---|---|---|
| **Position-sensitive definitions** (ScholarPhi: faster answers, n = 27) | A glossary that knows where you are: notation and terms as defined *up to this page* in a 600-page textbook | Full text; LLM extraction of definitions with locations | **High** [~75% a textbook study would replicate the time savings] | Accuracy: ScholarPhi's 2021 extractor reached 73% precision and 74% recall; an LLM's rate on textbooks is unmeasured |
| **Section gists beside the text** (Paper Plain: easier, same comprehension, n = 24) | A zoom ladder from book to chapter to section, linked to source spans | Full text; one generation pass per book; a coverage strip | **High** | Faithfulness (FABLES: 90.9% at best in 2024) and omission bias |
| **Hover cards** (Page Previews: +20–22% distinct pages) | Popups for endnotes, cited works and books mentioned in the text, showing catalog record and table of contents first and the generated gloss second | Reference resolution from book endnotes to catalog records (messier than paper references) | **High** for nonfiction | Endnote parsing; generated scent that misleads |
| **Reusing human overviews** (Relatedly: better outlines, n = 15) | Index the introductions, literature reviews, "further reading" sections and bibliographic essays of open books, plus syllabi, as expert mini-maps of a field | Open-licensed books; topic indexing | **High** | Licensing of reused text: store pointers and short excerpts (see [The Legal Map](/building/legal-map/)) |
| **Faceted skim highlights** (Scim: faster, 70.4% of diary sessions helped) | New facets: Claim / Evidence / Example / Caveat for nonfiction; Definition / Theorem / Example / Exercise for textbooks | A per-genre facet scheme; density control | **Medium** | Goal/Method/Result is paper-specific; book facets are untested |
| **Excerpt workspaces** (LiquidText, Threddy) | Syntopical reading across several books on one question, as in Adler | Works on any PDF or EPUB today | **High** (book-agnostic) | None technical; little outcome evidence |
| **Explorables** (Victor, Distill) | Interactive versions of a textbook's formulas, checked against its worked examples | Full text; code generation; tests | **Medium-high** for quantitative textbooks, **low** for argument-driven books | A plausible wrong model teaches persuasively |
| **Mnemonic medium** (Quantum Country: correlational, about 54 days per prompt after 6 reviews) | Reader-approved prompt drafts per section, exported to Anki or FSRS | Full text; a review app | **Medium** | Review load (37–65 hours per book at essay density); untested machine prompts |
| **Personalized citation coloring** (CiteSee: 37% of cards opened from 8.2% of citations) | "You've read or saved this" marks on works cited in a book | Reading history; book citation graphs, which are sparse | **Low-medium** | Few book-to-book citation graphs; endnotes cite many old and gray sources |

**Text access is the common obstacle.** Every high-transfer idea above needs the full text. For a personal tool, the clean sources are public-domain and open-licensed books (see [Open-Access Books and Textbooks](/access/open-books/) and [The Public Domain and Open Corpora](/access/public-domain/)) plus EPUBs and PDFs you own, processed locally. For in-copyright books you do not hold, a tool is limited to metadata, tables of contents and snippets (see [Searching Inside Books You Don't Have](/finding/searching-inside-books/)).

Closed e-readers are adding some of these layers. Kindle has Story So Far and Ask This Book (US only), and Boox has an AI assistant for selected text. None exposes an API you can build on (R11, October 2026). Zotero 10 is the most capable open host: it reflows PDFs, supports annotation, reads aloud, and can be scripted.

### What it costs to generate the layers

Assume a 100,000-word nonfiction book of about 150,000 input tokens, read once in chunks of about 10,000 tokens, at October 2026 batch prices ([pricing reference](https://platform.claude.com/docs/en/about-claude/pricing): Haiku 5.5 \$0.05 / \$0.25 and Sonnet 5.5 \$1 / \$5 per million input / output tokens). Token counts are rough (±50%) [I]:

| Layer | Output tokens per book (assumed) | Haiku 5.5 batch, per book | Sonnet 5.5 batch, per book | 10,000 books (Haiku / Sonnet) |
|---|---|---|---|---|
| Gist ladder (section, chapter, book) | ~10,000 | ~\$0.01 | ~\$0.20 | ~\$100 / ~\$2,000 |
| Position-sensitive glossary | ~15,000 | ~\$0.01 | ~\$0.23 | ~\$110 / ~\$2,300 |
| Prompt drafts (4 per section, ~90 sections) | ~22,000 | ~\$0.01 | ~\$0.26 | ~\$130 / ~\$2,600 |
| Hover cards for ~300 references (~500 tokens of context each) | ~24,000 | ~\$0.01 | ~\$0.27 | ~\$140 / ~\$2,700 |
| Aspect strips: per-chapter relevance to standing interests (R06 estimate) | — | ~\$0.009 | ~\$0.17 | ~\$86 / ~\$1,725 |

For comparison, one human faithfulness check of one book summary cost about \$200 in FABLES (about 11 hours of an annotator's time). At Sonnet prices, **checking a layer costs roughly 1,000 times more than generating it.** The design consequences [I, high]:

- Generate once per book and model version, and cache the result.
- Show each item's verification status: unchecked, auto-checked, or human-checked.
- Spend human attention on a random sample and on the books you will study deeply.

See [Costs and Effort](/building/costs-and-effort/) for the full budget.

## Recommendations

**For reading now (October 2026):**

- **CS papers on arXiv:** use Semantic Reader. It is free, and its three features have study results behind them.
- **Other PDFs:** Google Scholar PDF Reader gives citation previews and AI outlines for selected English papers. Zotero 10 adds reflow and annotation.
- **A textbook or book you want to master:** MarginNote 4 (iPad and Mac), or Zotero plus Anki with FSRS. Convert highlights into questions, and budget for the review time computed above. The main obstacle is the discipline to write or edit prompts, not the software.
- **Several books on one question:** LiquidText or MarginNote, used as excerpt workspaces with links back to the source. No AI is needed for the core workflow.
- **Skip** speed-reading apps, highlight-only workflows, and summaries read *instead of* the books you mean to study. Use summaries and Audio Overviews for triage and warm-up.

**For building** (with Claude Code, over the [reference architecture](/building/reference-architecture/)), in order of evidence per unit of effort [I]:

1. **Hover cards everywhere**: source first, generated gloss second, labeled. This has the largest-sample evidence and the cheapest implementation.
2. **An overview strip beside an undistorted reading view**: chapter and section gists linked to spans, a coverage strip, and the reader's own highlights. Overview+detail has 25 years of preference evidence.
3. **A position-sensitive glossary for textbooks.** ScholarPhi's interface already worked; only the extractor was weak, and LLMs largely fix that.
4. **Reader-approved prompt drafts exported to FSRS**, with drafted and self-written prompts tracked separately.
5. **"Relatedly for books"**: index human-written field overviews from open books and present them as expert maps. This is cheap, and its hallucination risk is low.
6. **Keep one durable data layer** (annotations, excerpts, prompts, trails, credences) and generate many small views over it. Ink & Switch's [*Malleable software*](https://www.inkandswitch.com/essay/malleable-software/) (June 2025) argues for this: views are cheap to regenerate with AI, and the data is what lasts.

**Measure** [I]:

- Time to answer a factual question about a chapter.
- Distinct items engaged per session, the Page Previews metric.
- Retention at 30 days for prompted vs unprompted material.
- The share of highlights converted into retrieval prompts.

Clicks and session length do not measure learning. See [The Design Space](/building/design-space/) and the [Prototype Gallery](/building/prototype-gallery/) for mockups of several of these.

## Open questions

- **Do LLM-drafted spaced-repetition prompts give retention comparable to expert-written ones?** A reader could resolve this for themselves by splitting one textbook's sections between drafted-and-edited and self-written prompts and comparing FSRS retention after 90 days. A published RCT would settle it in general.
- **Does a position-sensitive glossary save time on textbooks the way ScholarPhi did on papers?** Test: time-to-answer on notation questions in chapters 8–12 of an open-licensed statistics or ML textbook, with and without the glossary.
- **How faithful are October 2026 frontier models' chapter gists for nonfiction?** FABLES used 2024 models and recent narrative books. A FABLES-style rerun on 10 open-licensed nonfiction books would cost about \$2,000 in annotation at FABLES' rate.
- **Do generated outlines improve skimming or replace it?** A Duggan–Payne-style study with three arms (skim alone, skim with an outline, outline alone) and a retention test one week later would answer this.
- **Does Scim-style faceted highlighting help on book chapters, and which facets?** Claim / Evidence / Caveat for nonfiction is an untested guess.
- **What highlight density is optimal?** The Semantic Reader team says "just the right density" matters but gives no number; Scim let readers choose. Logging the densities readers choose would give a prior.
- **Is the mnemonic medium causally better than reading followed by a separate review app?** Quantum Country's data are correlational. Orbit's platform could host an RCT.
- **Do hover cards on book references raise engagement the way Page Previews did on Wikipedia,** or does long-form reading make readers less willing to break flow?
- **Did LiquidText's CHI 2011 study measure outcomes, and has any active-reading workspace been tested against plain annotation for comprehension or synthesis quality?** I could not read the evaluation.

## Related pages

- [Foraging and Exploratory Search](/interfaces/exploratory-search/): information scent, berrypicking and the sensemaking loop that these interfaces serve
- [Maps of Knowledge](/interfaces/maps-of-knowledge/): overview displays for collections, not single documents
- [Generative Interfaces](/interfaces/generative-interfaces/): generated explainers, re-leveled text, and faithfulness evidence in more depth
- [Reading Modes and Devices](/environments/reading-modes-and-devices/): screen vs paper, listening vs reading, and the device matrix
- [AI Research Assistants](/finding/ai-research-assistants/): Semantic Scholar, Scholar PDF Reader, Zotero plugins
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): what you can do without the full text
- [The Legal Map](/building/legal-map/): limits on processing and reusing book text
- [A Reference Architecture](/building/reference-architecture/) and [Costs and Effort](/building/costs-and-effort/)
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/)
