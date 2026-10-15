---
title: Reading Interfaces
description: What research prototypes and products show about reading at different depths (Ai2's Semantic Reader prototypes, LiquidText, MarginNote, explorable explanations, Distill, the mnemonic medium, Gwern.net's popups, StretchText and semantic zoom, and the skimming literature), with study results, costs at October 2026 prices, and which ideas carry over from papers to books.
---

*Status: draft, October 2026. Product features and statuses are as of October 2026. Study results are as their authors report them; the Semantic Reader papers, FABLES, Page Previews, Quantum Country and Duggan & Payne were re-checked against the primary sources on 2026-10-15. Most results come from small lab studies (6–60 participants, 2001–2025) on papers and essays, not books; the exceptions are Wikipedia's Page Previews A/B tests and Quantum Country's usage data. Every statement about books is inference unless a source is cited. Sources: the [R06 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md), the [R11 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R11-reading-practice-curation-devices.md), and primary sources linked inline.*

## The short version

- **The interfaces with evidence behind them add a layer to the original text. They do not replace it.** Overview+detail beat fisheye distortion. Wikipedia's hover previews added engagement and almost nobody turned them off. Paper Plain put plain-language gists *beside* the original sections and found no loss of comprehension; in its pilots, readers double-checked the gists against the original text. Interfaces that replace the text, such as speed-reading apps or a summary read instead of the book, have weak or negative evidence. [I, medium-high]
- **Ai2's Semantic Reader program is the best-evaluated body of work:** ten prototypes and 300+ study participants. Three features shipped: definitions on demand, skimming highlights, and personalized inline citations. As of October 2026 all three cover arXiv papers only, and skimming highlights cover only English-language CS papers. ([Semantic Reader](https://www.semanticscholar.org/product/semantic-reader))
- **Many of these ideas stalled because someone had to write the extra layer**: definitions, gists at several levels, interactive models, review prompts, link annotations. LLMs remove most of that writing cost. A book-length layer now costs about a cent with Haiku 5.5 batch, or 20–30 cents with Sonnet 5.5 batch. Checking that layer does not get cheaper: in FABLES, an annotator who had already read the book took about 11 hours, paid \$200, to check five summaries of it. [I, from verified prices]
- **Retention is the best-evidenced and most neglected depth.** Practice testing and distributed practice are rated "high utility"; highlighting, rereading and summarization are rated "low" ([Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266); [summary](https://www.aft.org/ae/fall2013/dunlosky)). Most annotation tools are built around highlighting.
- **Almost none of this research tested books.** Of the ideas covered here, those that transfer best are position-sensitive definitions for textbooks, chapter-level gists linked to source spans, hover cards for references, and reusing human-written overviews (Relatedly's trick). Paper-specific facets (Goal/Method/Result) and citation personalization transfer least well.

## Six depths of reading

Reading is several tasks with different interface needs, and the evidence sorts by task. The table extends the reading-mode matrix in R11 (see [Reading Modes and Devices](/environments/reading-modes-and-devices/)).

| Depth | The reader's question | What the evidence favors | Interfaces that target it |
|---|---|---|---|
| **Triage** (seconds per item) | Is this worth opening? | Accurate *information scent* (cues about content you can't see yet); previews that don't navigate away | Wikipedia Page Previews, Gwern.net popups, TLDRs, citation cards |
| **Skim** (minutes per item) | What does it say, and where? | Structure that supports satisficing; highlights that are faceted, evenly spread and adjustable in density | Scim, Google Scholar PDF Reader's AI outlines, section gists |
| **Lookup** | What does this term, symbol or citation mean *here*? What does this work say about my question? | Definitions in place (ScholarPhi: significantly faster answers); jumping to the answering passage (Paper Plain's favorite feature) | ScholarPhi, CiteSee, footnote popups, Paper Plain's key-question index, Google Scholar Quick Read |
| **Deep study** | Do I understand it, and do I believe it? | Self-paced reading; excerpts that keep their links to the source; manipulable models | LiquidText, MarginNote, explorable explanations, Distill |
| **Synthesis** | How do several works fit together? | Reuse of human-written overviews; threads with provenance | Relatedly, Threddy, LiquidText's multi-document workspace |
| **Retention** | Will I still know this in a year? | Retrieval practice and spacing | Quantum Country, Orbit, Anki with FSRS, MarginNote 4 |

A common failure is a single "AI reading assistant" that summarizes everything [I]. It serves triage well. It also invites the reader to skip deep study and retention, the two depths where the learning happens. If you build one tool, give each depth its own view and make the summary view the easiest one to leave.

## Skimming: what the eye-tracking says

Skimming is a different task from reading, not a faster version of it. The research agrees on four points:

- **Speed reading, as sold, does not work.** [Rayner et al. 2016](https://profiles.wustl.edu/en/publications/so-much-to-read-so-little-time-how-do-we-read-and-can-speed-readi/) (*Psychological Science in the Public Interest* 17(1)) conclude that going from about 250 words per minute to 500–750 while keeping comprehension is unlikely. Gains come from practice and language skill such as vocabulary, not from eye-movement tricks. Secondary summaries add that apps which prevent rereading (RSVP, Spritz-style) hurt comprehension [S, medium].
- **Skimming has a distinct eye-movement signature and costs comprehension.** In [Strukelj & Niehorster 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC7198234/) (N = 60), skimming meant shorter fixations, longer saccades, fewer regressions, and significantly lower comprehension (p under .001) than regular reading.
- **Good skimmers satisfice, and skimming beats reading part of the text only for the main ideas.** Duggan & Payne gave readers of expository text only enough time to read half of each document ([2009](https://pubmed.ncbi.nlm.nih.gov/19751073/), *J. Exp. Psych.: Applied* 15(3):228–242). Skimming the whole text improved memory for the important ideas relative to reading half of it, but not memory for less important details or for inferences. A second experiment found no advantage of skimming over reading the first or second half of every paragraph. With a website-like layout, the skimming advantage depended on how easily readers could navigate between pages. Their [2011 eye-tracking analysis](https://researchportal.bath.ac.uk/en/publications/skim-reading-by-satisficing-evidence-from-eye-tracking/) found that skimmers directed attention to the most important information, which improved their memory for it. Their model: read a section until the rate of new information falls below a threshold, then skip to the next one.
- **Highlights help skimmers when the density is right.** Scim (below) found faster information finding with no loss of accuracy. The Semantic Reader team warns that "too few highlights will present the guise of an inept tool, and too many will slow a reader down" ([Lo et al. 2023](https://arxiv.org/abs/2303.14334)). Scim's authors suggest about one highlight per paragraph as a rule of thumb from their pilot studies ([Fok et al. 2023](https://arxiv.org/abs/2205.04561)).

**What this implies for design** [I]: a skimming aid should feed the satisficing decision by showing where the new information is and when to move on, and it should make jumping cheap, since Duggan & Payne's skimming advantage disappeared when navigation was hard. Useful signals are section gists, an always-visible outline whose entries jump to the passage, and novelty measured against what the reader has already read (an embedding distance from their library and highlights, which no shipping tool computes, as far as I found). Expect skimming to deliver the main ideas, not details or inferences; anything you need to reason with gets read in full. Don't build RSVP readers.

**The open question is replacement.** An LLM outline might improve skimming, or replace it, with the retention cost that implies. I found no study that separates the two. The nearest evidence is Kosmyna et al. ([arXiv 2506.08872](https://arxiv.org/abs/2506.08872)): people who wrote essays with an LLM showed weaker EEG connectivity and struggled to quote their own essays. It is a preprint about writing, not reading, with 54 participants; treat it as a caution, not evidence [low-medium].

## The Semantic Reader program

Between about 2020 and 2023, a multi-institution team led by Ai2 built ten research prototypes around five reader challenges: discovery, efficiency, comprehension, synthesis and accessibility. They ran usability studies with more than 300 participants ([Lo, Chang, Head et al. 2023](https://arxiv.org/abs/2303.14334)). It is the closest thing this field has to a sustained, evaluated research program.

| Prototype | Mechanism | Study | Result | Shipped? |
|---|---|---|---|---|
| [ScholarPhi](https://arxiv.org/abs/2009.14237) (CHI 2021) | Tooltips with position-sensitive definitions of terms and symbols; a "declutter" filter that shows every use of a term; equation diagrams; automatic glossary | Pilots with 24 researchers; evaluation with 27, using hand-extracted definitions so the interface was tested apart from the models | Answered questions "in significantly less time, while viewing significantly less of the paper": about 45 seconds faster per task than a plain PDF reader, with no difference in correctness. 24 of 27 expected to use definition tooltips "often" or "always"; 23 of 27 said so for equation diagrams. The team's definition-recognition model scored 73% precision and 74% recall on the W00 benchmark | Yes: "definitions on demand," now generated by an LLM from context |
| [CiteSee](https://arxiv.org/abs/2302.07302) (CHI 2023) | Inline citations colored by the reader's history (cited, saved, opened) and highlighted by predicted relevance | Lab study, 10 participants; field deployment, 6 participants for 1–2 weeks | Beat three baselines in the lab. In the field, re-encountered citations were 8.2% of all citations but 37% of the paper cards opened. A prior survey found inline citations drove about 21% of paper discoveries | Yes: personalized citations (desktop only; needs a Semantic Scholar library) |
| [Scim](https://arxiv.org/abs/2205.04561) (IUI 2023) | Highlights faceted by content type (objective, novelty, method, result), spread evenly, density adjustable globally and locally | Lab study, 19 participants; diary study, 12 participants over 2 weeks | Found information "in significantly less time … with comparable effort and accuracy." Highlights helped in 74 of 105 diary sessions (70.4%). Most useful for text-dense papers and papers outside the reader's field | Yes: skimming highlights labeled Goal/Method/Result |
| [Paper Plain](https://arxiv.org/abs/2203.00130) (TOCHI 2023) | For lay readers of medical papers: term definitions, plain-language section gists (GPT-3), and a key-question index that jumps to the passage answering each question, with a gist of the answer | 24 participants recruited on Upwork, within-subjects, against a standard PDF reader | Reading was significantly easier and readers more confident, with similar comprehension. The key-question index was the clear favorite, used more than section gists or definitions | No |
| [Threddy](https://arxiv.org/abs/2208.03455) (UIST 2022) | While reading, clip sentences from related-work sections into a hierarchy of "threads" that keep their citations; recommends papers from those threads | 9 participants against Google Docs | Significantly more clips and references collected; higher flow scores | No |
| [Relatedly](https://arxiv.org/abs/2302.06754) (CHI 2023) | Search across *existing* related-work paragraphs from many papers, with diversity re-ranking, de-emphasis of redundant content, and paragraph headings generated by a fine-tuned BART summarizer | 15 participants, within-subjects, against a baseline paper list | Participants wrote topic outlines rated more coherent, insightful and comprehensive | No |

**What the program shows** (quotes are from [Lo et al. 2023](https://arxiv.org/abs/2303.14334); interpretation is mine):

1. **Model errors were the binding constraint.** ScholarPhi's interface worked with hand-extracted definitions; at 73% precision and 74% recall, the automatic extractor of the time would have shown about a quarter wrong definitions and missed about a quarter of real ones. The overview warns that "even slight errors in these models can have detrimental effects on the readers," and Scim's authors report that misclassified highlights made readers skeptical of the whole tool.
2. **LLMs changed the economics during the program.** "Until recently, interface design could require months of development of bespoke AI models." LLMs let the team "experiment with a wide range of new NLP capabilities at relatively low cost."
3. **Relatedly is the most portable idea.** It avoids generating syntheses by reusing human-written ones: related-work paragraphs are expert overviews that already exist. Only headings were machine-written, and only where the authors' own were generic or missing. The hallucination risk is therefore small, and smaller still if generated headings are labeled. [I]
4. **Paper Plain's result is the one most relevant to "reading at a different depth."** Gists beside the text made reading easier at no cost in comprehension, but readers liked navigation to the answering passage best. In pilots, readers checked vague gists against the original, so the designers kept every gist on demand, next to its source text: an added layer, not a replacement.

**Coverage, October 2026.** Semantic Reader works on "most arXiv papers on Semantic Scholar" ([product page](https://www.semanticscholar.org/product/semantic-reader), October 2026; an older [FAQ](https://www.semanticscholar.org/faq) entry says "250k+ (and counting!)"). Skimming highlights cover "most English-language arXiv papers in computer science fields." Google's Scholar PDF Reader (a free Chrome extension) added [AI outlines](https://scholar.googleblog.com/2024/11/ai-outlines-in-scholar-pdf-reader-skim.html) on 2024-11-03: "an extended table of contents" with a few bullets per key section, each linking to the passage, "as yet, available for selected papers in English." It added [highlights and comments](https://scholar.googleblog.com/2025/11/mark-it-up-highlight-and-comment-in.html) saved to your Scholar Library in November 2025. Neither covers books. See [AI Research Assistants](/finding/ai-research-assistants/) for the rest of the paper-reading tool landscape.

**If you read CS arXiv papers, use Semantic Reader.** It is free, and its three shipped features are the ones with study results behind them. Turn on personalized citations by saving at least one paper to your library; they work on desktop only. Scim's diary-study readers found highlights most useful in text-dense papers and papers outside their field, so expect the least from them in your own specialty [I].

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

Readers looked at about a fifth more pages while opening fewer. The previews replaced navigations instead of adding them. [Page Previews](https://www.mediawiki.org/wiki/Page_Previews) has been on all Wikipedias since July 2018. These data are from 2018 and from an encyclopedia, not from long-form reading [possibly stale].

### Gwern.net: the most developed single-author version

[Gwern.net's design page](https://gwern.net/design) (last modified 2023-04-20) describes a reading interface built for "iceberg-like pages where most information is hidden":

- **Recursive popups.** Hovering a link opens the target as a full popup. Popups can be nested, moved, resized and pinned. On mobile they become tappable popovers.
- **Link annotations.** Each annotated link has a mini-page with metadata, abstract and excerpts. Some are hand-written; others are "automatically extracted from sources (eg. Arxiv/BioRxiv/MedRxiv/Crossref)." The point is to let readers judge a source before visiting it.
- **Collapsible sections.** Code-folding-style disclosure keeps the surface short. Combined with lazy transclusion, it builds very large "virtual" pages.
- **Link bibliographies.** Every link on a page, in order, with annotations expanded, so a reader can skim them all at once.
- **Also:** sidenotes on wide screens; backlinks with context (since 2021); "similar links" from an embedding nearest-neighbor lookup, with no guarantee of relevance; local archives, because "every link dies someday."

Each feature lets the reader choose a depth on the spot: a link becomes a popup, an abstract, an excerpt, or the full source. Gwern.net is effectively StretchText (next section) applied to the references rather than the prose.

### The risk: generated scent can mislead

An LLM can write an annotation for every link, citation and book mention, which removes the bottleneck of one author's time. The risk is misleading information scent. Liu, Zhang & Liang audited four generative search engines in 2023 ([arXiv 2304.09848](https://arxiv.org/abs/2304.09848)). Only 51.5% of generated sentences were fully supported by their citations, and only 74.5% of citations supported their sentence. Across the four engines, citation precision correlated r = −0.96 with perceived utility: the answers that looked most helpful were the worst supported. Foraging theory predicts that confident but wrong scent sends readers down bad paths (see [Foraging and Exploratory Search](/interfaces/exploratory-search/)). These are 2023 systems; current error rates are probably lower, but I could not find a comparable 2026 audit.

**Design rule** [I, high]: a hover card shows source material first and generated text second, and labels which is which:

1. the abstract, table of contents, or the cited passage itself
2. a generated "why this is cited here" gloss, built from the citing sentence plus the cited work's abstract (building on CiteRead, a Semantic Reader prototype that shows citing sentences inside the cited paper)
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
| Paper Plain gists (2022–23) | A plain-language gist per section (GPT-3), on demand beside the original | Research prototype; medical papers | n = 24: easier reading, same comprehension |
| [Google Scholar PDF Reader AI outlines](https://scholar.googleblog.com/2024/11/ai-outlines-in-scholar-pdf-reader-skim.html) (Nov 2024) | An "extended table of contents" with a few bullets per key section, each linked to its passage | Selected English papers | None published that I found |
| [Google Scholar Quick Read](https://scholar.googleblog.com/2026/08/quick-read-see-how-paper-answers-your.html) (Aug 2026) | A digest of one paper conditioned on your search query: overview, Answers, Approach, Considerations | Papers you have access to, including subscribed articles through publisher partners; English; signed-in users | None published |
| Kindle "Story So Far" and "Ask This Book" ([Amazon](https://aboutamazon.com/news/devices/new-amazon-kindle-scribe-color), page undated) | A spoiler-free recap up to your position; answers about a highlighted passage | "Thousands of Kindle books in the U.S.," on Kindle devices and the Kindle iOS app; closed | None published |
| Gemini Notebook (formerly NotebookLM) Audio Overviews ([help](https://support.google.com/gemininotebook/answer/16212820)) | Spoken discussions: Deep Dive, Brief, Critique, Debate | Up to 50 sources free, each up to 500,000 words; EPUB accepted | None on comprehension; Google warns they "may contain inaccuracies" |
| Google's Learn Your Way (Sept 2025) | A textbook chapter re-leveled to the reader's grade level, with quizzes and other formats | One chapter; Labs experiment | RCT, n = 60, ages 15–18: 78% vs 67% on a retention test 3–5 days later. See [Generative Interfaces](/interfaces/generative-interfaces/) |

**Faithfulness is the remaining constraint.** [FABLES](https://arxiv.org/abs/2404.01261) had readers check 3,158 claims from LLM summaries of 26 recently published books, all but one of them fiction. The best 2024 model, Claude 3 Opus, had 90.9% of its claims judged faithful; GPT-4 reached 78% and Mixtral 69%. Most unfaithful claims concerned events and character states, and summaries over-weighted the ending. The best LLM judge reached only F1 = 58.2 at catching unfaithful claims, so machines could not yet check the summaries. Current frontier models are probably better, but I found no 2026 rerun on books. I expect the best current model to have fewer than half of Claude 3 Opus's 9.1% of claims not judged faithful [~70%]. R07 notes that Vectara's 2026 short-document leaderboard still shows 7–14% hallucination rates for frontier models, though its method is not comparable.

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
| **LiquidText** | Pull excerpts out onto a workspace; connect notes and ideas to many passages, "across pages and documents"; pinch to bring distant parts of a document into view together ("Just pinch and it comes together") | iPadOS, Windows, macOS; LIVE sync is a subscription; no prices or AI features on the homepage | Research origin: Tashman & Edwards, CHI 2011 (114 citations). I could not read its evaluation; the abstract is elided in the Semantic Scholar record | [liquidtext.net](https://www.liquidtext.net/) |
| **MarginNote 4** | PDF, EPUB, web and video reader where every excerpt becomes a card; excerpt, mind-map node and flashcard are "same card, three forms"; FSRS scheduling; "Immersive Recall" blurs your excerpts until you have tried to recall them; AI chapter summaries, key terms and quiz questions that "can be accepted, edited, or rejected" | iPad and Mac; 14-day trial; lifetime or subscription (prices not on the homepage) | Vendor claims FSRS gives "30% less review time than traditional Anki schedulers," uncited. Anki itself has offered FSRS since 23.10, so this is not an advantage over current Anki | [marginnote.com](https://www.marginnote.com/) |
| **Threddy** (prototype) | Clip sentences into threads while reading, keeping their citations; thread-based recommendations | Research prototype | n = 9 against Google Docs: more clips and references, higher flow | [arXiv 2208.03455](https://arxiv.org/abs/2208.03455) |
| **Zotero 10** | Reflowable "Reading Mode" for PDFs that you can annotate in; Read Aloud (since Zotero 9); advanced search over annotations | Free and open source; Win/Mac/Linux, iOS, Android | None published | [Zotero 10](https://www.zotero.org/blog/zotero-10/) (2026-08-17) |

**MarginNote 4 shows where this category is heading**: highlight, then card, then scheduled review, inside the reader, with AI drafts the reader approves. The approval step matters. Highlighting alone is a "low utility" technique ([Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266)), so a highlight earns its keep only when it becomes a retrieval prompt. Readwise's Daily Review, which resurfaces highlights, is closer to rereading than to retrieval unless highlights are converted to questions [I].

**An LLM version of LiquidText** [I] would pre-extract candidate excerpts (claims, definitions, numbers, caveats) with their locations. The reader accepts or rejects them, and the workspace becomes a table of claims with provenance. For a forecasting-minded reader, the natural next column is a credence, with a link to the evidence that moved it.

## Explorable explanations and Distill

Bret Victor's ["Explorable Explanations"](https://worrydream.com/ExplorableExplanations/) (2011; postscript February 2024) proposed text as "an *environment to think in*." It describes three forms: reactive documents, where the reader changes the author's assumptions and sees the consequences; explorable examples; and contextual information. The 2024 postscript reframes the goal as "a written *argument* whose assertions are backed by explorable computational models." Victor also warns against widgets that "dump the user in a sandbox": the interactivity should serve the argument.

[Distill](https://distill.pub/) (2016–2021) was the most serious attempt to publish such work at research quality. It published about 32 articles, the last dated 2021-09-02. Its [hiatus note](https://distill.pub/2021/distill-hiatus/) (2021-07-02) names the cost. The editors' largest job was feedback and mentorship, "more than 50 hours of help" on some early articles with diagrams, writing and scientific communication; each article "still requires significant work," done "in a volunteer capacity," and "these frictions have caused our team to struggle with burnout." The editors predicted that "the future for most types of articles is probably self-publication."

**What changed, and what did not** [I]:

- An LLM can now generate a working interactive model of a formula or simulation in minutes (see [Generative Interfaces](/interfaces/generative-interfaces/)). Building the interactive pieces is now cheap. The feedback and review that took Distill's editors 50+ hours on some articles is cheaper with LLM help, but not gone.
- The verification cost is not. A reactive document with a wrong model teaches the wrong intuition *convincingly*. A fluent wrong summary is easy to distrust; a slider that behaves plausibly is not.
- **The best fit is a well-specified model taken from a book or paper**, checked against the source's own worked examples. Examples in this reader's domains: Bayes' rule with adjustable base rates, the Kelly criterion, the bias–variance trade-off, the decomposition of a Brier score, an SIR epidemic model. Each has a closed form or a reference implementation to test against.
- **The worst fit is a generated "simulation" of a verbal argument.** The model's assumptions then belong to the LLM, not the author.

For textbooks, this is the highest-value use of generated interactivity [~70%]. Many textbook formulas already have worked examples in the text, and those examples serve as test cases.

## The mnemonic medium and spaced repetition

### What Quantum Country showed

Andy Matuschak and Michael Nielsen's [Quantum Country](https://quantum.country/) embeds spaced-repetition prompts inside an essay. Their October 2019 report, ["How can we develop transformative tools for thought?"](https://numinous.productions/ttft/), gives the results:

- **The first essay** takes about 4 hours to read and contains 112 prompts. Review intervals step from in-text to 5 days, 2 weeks, a month and so on, reaching about 4 months after five successful reviews.
- **After 6 repetitions,** most users had about 6,000 days of total demonstrated retention across the 112 prompts, or roughly 54 days per prompt, for about 95 minutes of total review.
- **Six months after release,** 195 users had demonstrated a month of retention on at least 80% of the prompts.
- **An informal 8-prompt experiment:** readers whose review was delayed fell from 91% to 87% accuracy (n = 25), while readers on the regular schedule rose from 89% to 96% (n = 16).
- **The authors' own caveats:** they retracted one earlier claim after finding a data-analysis error. They wanted card writing taken "as seriously as Nabokov took sentence writing" and say "we didn't reach that level."

Matuschak's later working notes reportedly say that readers who reach five or more days of demonstrated retention rarely forget afterward (median accuracy around 95%), and that the data are correlational. This comes from search results via R11; the note URLs returned 404 when re-checked on 2026-10-15 [S, unverified]. **The causal evidence for the mnemonic medium as such is one informal experiment.** The evidence for its ingredients is much stronger.

As of October 2026, Quantum Country is live with four essays and Patreon support. Its successor platform, [Orbit](https://github.com/andymatuschak/orbit), is open source and describes itself as an experimental platform, "first and foremost a vehicle for research" (October 2026).

### The underlying evidence is strong

| Technique | Evidence | Source |
|---|---|---|
| Practice testing and distributed practice | Rated "high utility" in the standard review; highlighting, rereading and summarization rated "low" | [Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266) |
| Spacing | Meta-analytic d = 0.42 (Donovan & Radosevich 1999). In Kornell 2009, spacing beat massing for 90% of participants, yet 72% believed massing worked better | [Gwern's review](https://gwern.net/spaced-repetition) (2019) |
| Testing vs restudy | About 60% vs 40% recall after one week (Roediger & Karpicke 2006) | same |
| FSRS scheduler | On about 10,000 Anki collections, FSRS-6 log loss 0.3460 vs 0.4033 for ACT-R and 0.4694 for HLR, measured without same-day reviews. With same-day reviews the gap narrows to 0.3842 vs 0.3898 | [srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark) |
| Long-run cost | Nielsen estimated 4–7 minutes of lifetime review per card, and 15–20 minutes a day for about 10,000 cards | [Nielsen 2018](http://augmentingcognition.com/ltm.html) |

Anki has offered FSRS since version 23.10, with a default desired retention of 90% ([Anki manual](https://docs.ankiweb.net/deck-options.html), October 2026).

### The arithmetic for books

At Quantum Country's density of 112 prompts per 4 hours of reading, a book that takes 20 hours to study yields about 560 prompts. At Quantum Country's measured rate (95 minutes per 112 prompts for six reviews each), the first six reviews, spread over several months, take about 8 hours. At Nielsen's 4–7 minutes per card over 20 years, the lifetime total is about **37–65 hours per book** [I]. Over a lifetime, the mnemonic layer costs more time than the reading.

That argues for being selective. Write prompts for the 5–10 works you want to master, the "deep core" of Nielsen's advice to read the 5–10 most important papers in a field deeply and many more shallowly ([Nielsen 2018](http://augmentingcognition.com/ltm.html)), and only for the parts you will build on. Don't write prompts for everything you read.

### Who writes the prompts

Matuschak and Nielsen wrote every prompt by hand, and writing good prompts is hard. They note the standard advice that learners should write their own cards, since making a card is itself an act of understanding. Quantum Country breaks that rule, and they report that "preliminary user feedback suggests it has worked out adequately." An LLM can draft 3–5 prompts per section of a whole book for 1–26 cents (see the cost table below). **Whether machine-drafted prompts produce the same retention as expert-written or self-written ones is untested.** I found no published controlled comparison; one web search in October 2026 turned up system papers and a six-student formative study ([SmartFlash](https://arxiv.org/abs/2602.14431)), not retention trials [~70% that none exists]. The generation effect suggests that the reader's own editing matters [I].

**What to do now:** treat LLM prompts as drafts the reader accepts, edits or deletes, as MarginNote 4 does. Track your own retention on drafted and self-written prompts separately. It is a cheap n-of-1 experiment, and there is no published answer to wait for.

## What transfers to books

Most of this research used papers and essays. Papers have a standard structure (abstract, method, results), open full text on arXiv, and dense machine-readable citations. Books have less standard structure and are less often available as open text. In exchange, they come with human-written navigation: tables of contents, indexes, glossaries, chapter summaries, further-reading sections. The table is my assessment [I]; no study has tested any of these on books.

| Idea (evidence on papers or essays) | Book version | What it needs | Transfer | Main obstacle |
|---|---|---|---|---|
| **Position-sensitive definitions** (ScholarPhi: faster answers, n = 27) | A glossary that knows where you are: notation and terms as defined *up to this page* in a 600-page textbook | Full text; LLM extraction of definitions with locations | **High** [~75% a textbook study would replicate the time savings] | Accuracy: ScholarPhi was tested with hand-extracted definitions, and its automatic model scored 73% precision and 74% recall on a benchmark; an LLM's accuracy on textbooks is unmeasured |
| **Section gists beside the text** (Paper Plain: easier, same comprehension, n = 24) | A zoom ladder from book to chapter to section, linked to source spans | Full text; one generation pass per book; a coverage strip | **High** | Faithfulness (FABLES: 90.9% of claims faithful at best, 2024 models, mostly fiction) and omission bias |
| **Hover cards** (Page Previews: +20–22% distinct pages) | Popups for endnotes, cited works and books mentioned in the text, showing catalog record and table of contents first and the generated gloss second | Reference resolution from book endnotes to catalog records (messier than paper references) | **High** for nonfiction | Endnote parsing; generated scent that misleads |
| **Reusing human overviews** (Relatedly: better outlines, n = 15) | Index the introductions, literature reviews, "further reading" sections and bibliographic essays of open books, plus syllabi, as expert mini-maps of a field | Open-licensed books; topic indexing | **High** | Licensing of reused text: store pointers and short excerpts (see [The Legal Map](/building/legal-map/)) |
| **Faceted skim highlights** (Scim: faster, 70.4% of diary sessions helped) | New facets: Claim / Evidence / Example / Caveat for nonfiction; Definition / Theorem / Example / Exercise for textbooks | A per-genre facet scheme; density control | **Medium** | Goal/Method/Result is paper-specific; book facets are untested |
| **Excerpt workspaces** (LiquidText, Threddy) | Syntopical reading across several books on one question, as in Adler | Exists today (MarginNote handles PDF and EPUB) | **High** (book-agnostic) | None technical; little outcome evidence |
| **Explorables** (Victor, Distill) | Interactive versions of a textbook's formulas, checked against its worked examples | Full text; code generation; tests | **Medium-high** for quantitative textbooks, **low** for argument-driven books | A plausible wrong model teaches persuasively |
| **Mnemonic medium** (Quantum Country: correlational, about 54 days per prompt after 6 reviews) | Reader-approved prompt drafts per section, exported to Anki or FSRS | Full text; a review app | **Medium** | Review load (about 8 hours in the first months and 37–65 lifetime hours per book at essay density); untested machine prompts |
| **Personalized citation coloring** (CiteSee: 37% of cards opened from 8.2% of citations) | "You've read or saved this" marks on works cited in a book | Reading history; book citation graphs, which are sparse | **Low-medium** | Few book-to-book citation graphs; endnotes cite many old and gray sources |

**Text access is the common obstacle.** Every high-transfer idea above needs the full text. For a personal tool, the clean sources are public-domain and open-licensed books (see [Open-Access Books and Textbooks](/access/open-books/) and [The Public Domain and Open Corpora](/access/public-domain/)) plus EPUBs and PDFs you own, processed locally. For in-copyright books you do not hold, a tool is limited to metadata, tables of contents and snippets (see [Searching Inside Books You Don't Have](/finding/searching-inside-books/)).

Closed e-readers are adding some of these layers. [Kindle](https://aboutamazon.com/news/devices/new-amazon-kindle-scribe-color) has Story So Far and Ask This Book for "thousands of Kindle books in the U.S.," and the [Boox Note Air6 C](https://shop.boox.com/products/noteair6c) has an AI assistant for selected text. R11 found no public API for custom workflows on either (October 2026) [I, medium]. If you want to build your own layers, Zotero 10 is the most capable open host. It reflows PDFs, supports annotation, reads aloud, and has a local HTTP API with full-text endpoints. R04 also documents a community MCP server, zotero-mcp, that lets Claude Code search, read and annotate a Zotero library.

### What it costs to generate the layers

Assume a 100,000-word nonfiction book of about 150,000 input tokens, read once in chunks of about 10,000 tokens, at October 2026 batch prices ([Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing): Haiku 5.5 \$0.05 / \$0.25 and Sonnet 5.5 \$1 / \$5 per million input / output tokens). Token counts are rough (±50%), and the pricing reference gives no tokenizer adjustment for Haiku 5.5 or Sonnet 5.5 [I]:

| Layer | Output tokens per book (assumed) | Haiku 5.5 batch, per book | Sonnet 5.5 batch, per book | 10,000 books (Haiku / Sonnet) |
|---|---|---|---|---|
| Gist ladder (section, chapter, book) | ~10,000 | ~\$0.01 | ~\$0.20 | ~\$100 / ~\$2,000 |
| Position-sensitive glossary | ~15,000 | ~\$0.01 | ~\$0.23 | ~\$110 / ~\$2,250 |
| Prompt drafts (4 per section, ~90 sections) | ~22,000 | ~\$0.01 | ~\$0.26 | ~\$130 / ~\$2,600 |
| Hover cards for ~300 references (~500 tokens of context each) | ~24,000 | ~\$0.01 | ~\$0.27 | ~\$140 / ~\$2,700 |
| Aspect strips: per-chapter relevance to standing interests (R06 estimate) | — | ~\$0.009 | ~\$0.17 | ~\$86 / ~\$1,725 |

For comparison, FABLES paid annotators who had already read a book \$200 to check five summaries of it, about \$40 per summary; each book took about 11 hours ([Kim et al. 2024](https://arxiv.org/html/2404.01261v2)). A \$40 check costs about 200 Sonnet-batch gist ladders or 4,000 Haiku-batch ones, before counting the hours spent reading the book, and a full gist ladder has more claims to check than a FABLES summary. **Checking a layer costs two to three orders of magnitude more than generating it** [I]. The design consequences [I, high]:

- Generate once per book and model version, and cache the result.
- Show each item's verification status: unchecked, auto-checked, or human-checked.
- Spend human attention on a random sample and on the books you will study deeply.

See [Costs and Effort](/building/costs-and-effort/) for the full budget.

## Recommendations

**For reading now (October 2026):**

- **CS papers on arXiv:** Semantic Reader, set up as described above.
- **Other papers:** Google Scholar PDF Reader (free Chrome extension) gives AI outlines for selected English papers, one-click previews of cited articles, and highlights and comments saved to your Scholar Library (features as of its November 2025 blog post). For a specific question about a paper you can access, Scholar Quick Read gives a query-focused digest; open the passages it relies on before you cite it. Zotero 10 adds PDF reflow, annotation and Read Aloud for files you hold.
- **A textbook or book you want to master:** MarginNote 4 (iPad and Mac), or Zotero plus Anki with FSRS. Convert highlights into questions, and budget about 8 hours of review in the first months for a 20-hour book at Quantum Country's density. The main obstacle is the discipline to write or edit prompts, not the software.
- **Several books on one question:** LiquidText or MarginNote, used as excerpt workspaces with links back to the source. No AI is needed for the core workflow.
- **Skip** speed-reading apps, highlight-only workflows, and summaries read *instead of* the books you mean to study. Use summaries and Audio Overviews for triage and warm-up.

**For building** (with Claude Code, over the [reference architecture](/building/reference-architecture/)), in order of evidence per unit of effort [I]:

1. **Hover cards everywhere**: source first, generated gloss second, labeled. This has the largest-sample evidence and the cheapest implementation.
2. **An overview strip beside an undistorted reading view**: chapter and section gists linked to spans, a coverage strip, and the reader's own highlights, with every entry jumping to its passage. In the 2001 study, 19 of 20 readers preferred overview+detail; Paper Plain's gists beside the text worked, and its readers liked navigation to the answering passage best.
3. **A position-sensitive glossary for textbooks.** ScholarPhi's interface worked when fed clean, hand-extracted definitions; the automatic extractor was the weak link. Current LLMs probably beat the 2021 extractor [~75%], but no one has published their accuracy on this task, so hand-check a sample of 50 definitions before trusting the glossary.
4. **Reader-approved prompt drafts exported to FSRS**, with drafted and self-written prompts tracked separately.
5. **"Relatedly for books"**: index human-written field overviews from open books and present them as expert maps. This is cheap, and its hallucination risk is low.
6. **Keep one durable data layer** (annotations, excerpts, prompts, trails, credences) and generate many small views over it. This follows the "tools, not apps" pattern in Ink & Switch's [*Malleable software*](https://www.inkandswitch.com/essay/malleable-software/) (June 2025): shared data, many small composable tools. The essay also warns that AI code generation alone does not make software malleable.

**Measure** [I] time to answer a factual question about a chapter, distinct items engaged per session (the Page Previews metric), 30-day retention for prompted vs unprompted material, and the share of highlights converted into retrieval prompts. Clicks and session length do not measure learning. See [The Design Space](/building/design-space/) and the [Prototype Gallery](/building/prototype-gallery/) for mockups of several of these.

## Open questions

- **Do LLM-drafted spaced-repetition prompts give retention comparable to expert-written or self-written ones?** A reader could resolve this for themselves by splitting one textbook's sections between drafted-and-edited and self-written prompts and comparing FSRS retention after 90 days. A published RCT would settle it in general.
- **Does a position-sensitive glossary save time on textbooks the way ScholarPhi did on papers?** Test: time-to-answer on notation questions in chapters 8–12 of an open-licensed statistics or ML textbook, with and without the glossary.
- **How faithful are October 2026 frontier models' chapter gists for nonfiction?** FABLES used 2024 models on 25 novels and one nonfiction book. A FABLES-style rerun on 10 open-licensed nonfiction books would cost about \$2,000 in annotation at FABLES' rate of \$200 per book, plus the cost of having annotators read the books first.
- **Do generated outlines improve skimming or replace it?** A Duggan–Payne-style study with half-time reading and three arms (skim alone, skim with an outline, outline alone), testing main ideas, details and inferences one week later, would answer this.
- **Does Scim-style faceted highlighting help on book chapters, and which facets?** Claim / Evidence / Caveat for nonfiction is an untested guess.
- **What highlight density is optimal?** Scim's authors suggest about one highlight per paragraph from pilot studies, and Scim let readers adjust it. No study compares densities; logging the densities readers settle on would give a prior, and a within-subjects comparison would test it.
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
