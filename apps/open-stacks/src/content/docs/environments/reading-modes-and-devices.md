---
title: Reading Modes and Devices
description: Reading at four depths (survey, lookup, deep study, review) and what the evidence says about each, including Adler's inspectional and syntopical reading, skimming and speed reading, the screen-vs-paper and listening-vs-reading meta-analyses, and spaced repetition. Also covers annotation workflows, a device table (e-ink, iPad mini, monitors, text-to-speech) with October 2026 prices, formats, library-app support and PDF legibility, and a graded matrix of modes against methods, tools and devices.
---

*Status: draft, October 2026. Prices are US list prices as of 15 October 2026 unless another date is given. Device prices rose during 2025–26 and go stale fastest. Study results are reported as their authors give them. Not verified this session: built-in OverDrive borrowing on Kobo e-readers, EPUB support on reMarkable, the current Kindle Scribe price (two reports conflict), and one meta-analysis author's reported partial retraction. I found no study that compares e-ink with paper on comprehension. Sources: the [R11 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R11-reading-practice-curation-devices.md) and primary sources linked inline.*

## The short version

- **Reading is four tasks, not one:** survey, targeted lookup, deep study and review. Each has its own evidence base and its own best device. The old argument between "read fewer books, more deeply" and "browse widely" is mostly about how to split time across these modes.
- **Paper beats screens on comprehension, but by little and only in some conditions.** Across 54 studies and 171,055 participants the paper advantage is g = −0.21 ([Delgado et al. 2018](https://doi.org/10.1016/j.edurev.2018.09.003)). For tablets and other handheld devices it is about half that, g ≈ −0.11 ([Salmerón et al. 2024](https://doi.org/10.1037/edu0000830)). The gap shows up in expository text read under time pressure. In Delgado's data it grew with publication year rather than shrinking. **What to do:** read the 5–10 works you need to master self-paced, paginated and on paper or e-ink. Don't scroll through them on a laptop against a deadline.
- **Listening is about as good as reading for competent adults.** The overall difference is g = 0.07, not significant, though self-paced reading keeps a small edge ([Clinton-Lisell 2022](https://doi.org/10.3102/00346543211060871)). Reading along while listening adds nothing when you set your own pace. No study has tested listening at 1.5–3×, the speeds people actually use. Audio fits survey and re-exposure. It fits deep study less well.
- **Speed reading, as sold, does not work. Skimming is a separate skill and a legitimate one.** Good skimmers read a section until new information dries up, then move on ([Rayner et al. 2016](https://profiles.wustl.edu/en/publications/so-much-to-read-so-little-time-how-do-we-read-and-can-speed-readi/); [Duggan & Payne 2011](https://researchportal.bath.ac.uk/en/publications/skim-reading-by-satisficing-evidence-from-eye-tracking/)).
- **Retention comes from testing and spacing, not from highlighting.** Practice testing and distributed practice are rated "high utility". Highlighting and rereading are rated "low" ([Dunlosky et al. 2013](https://www.aft.org/ae/fall2013/dunlosky)). Anki with the FSRS scheduler is free and mature. Most annotation tools are built around highlights, so their output has to be turned into questions before it does much good.
- **For PDFs, screen size matters more than screen technology.** A US-letter page shown whole turns 10-pt type into about 7.3 pt on a 10.3" e-ink screen, 9.4 pt on 13.3", and 5.4 pt on an iPad mini [my calculation]. **Boox is the only e-ink line that runs Libby and the O'Reilly app**, because it ships Android with Google Play. Kindle receives Libby loans only in the US. reMarkable has no library integration at all.
- **What to buy:** probably nothing, if you read PDFs at a desk with a 27–32" 4K monitor. If you want e-ink for library ebooks plus apps, the Boox Go 10.3 Gen II Lumi (\$449.99) is the cheapest fit. For full-page PDFs on e-ink, it is the 13.3" Boox Note Max (\$629.99). For handwriting on PDFs with no apps, the reMarkable Paper Pure (\$399). Buy e-ink for eye comfort, evening reading and fewer distractions. Don't buy it for comprehension: no one has measured that.

## Four reading modes

[Reading Interfaces](/interfaces/reading-interfaces/) splits reading into six depths for interface design. This page uses four, because devices and study methods split more coarsely: survey absorbs triage and skimming, and deep study absorbs synthesis.

| Mode | The reader's question | Adler's closest level | Time per item | What good practice looks like |
|---|---|---|---|---|
| **1. Survey / skim / triage** | Is this worth my time? What kind of work is it, and where are the important parts? | Inspectional | Seconds to an hour | Many cheap samples; abandon freely; read structure (table of contents, index, abstract, conclusion) before prose |
| **2. Targeted lookup** | What exactly does this source say about X, and where? | Inspectional / analytical | Minutes | Formulate the question first; search; read the passage in context, not the snippet |
| **3. Deep study** | Do I understand this, and do I believe it? How do these works fit together? | Analytical and syntopical | Hours to weeks | Self-paced; explain to yourself; write a summary or critique; compare authors on neutral terms |
| **4. Review / retention** | Will I still know this in a year? | (none; Adler has no retention level) | Minutes a day | Retrieval practice at expanding intervals; periodic rereading of the core |

Five well-known positions on how to read turn out to be advice about different rows of this table:

| Position | Claim | Mode it is about | Source |
|---|---|---|---|
| **Browse widely, abandon freely** | Tyler Cowen (2006): "The best way to read quickly is to read lots"; "I start ten or so books for every one I finish"; "I am ruthless in my discards" | Survey | [Marginal Revolution, 2006-12-12](https://marginalrevolution.com/marginalrevolution/2006/12/how_to_read_fas.html) |
| **Deep core, shallow periphery** | Michael Nielsen (2018): to enter a field, read the 5–10 most important papers deeply and many more shallowly | Survey + deep study | [Augmenting Long-term Memory](http://augmentingcognition.com/ltm.html) |
| **Engage, don't just read** | Holden Karnofsky (2021): "the value of reading a book once (without active engagement) is awkwardly small." Reviews, critiques, rereading and writing your own summary give more per hour. He later limited this to casual learning outside one's expertise | Deep study | [Cold Takes, 2021-10-20](https://www.cold-takes.com/reading-books-vs-engaging-with-them/) |
| **Books are a broken medium** | Andy Matuschak (2019): "books are surprisingly bad at conveying knowledge, and readers mostly don't realize it" | Review | [Why books don't work](https://andymatuschak.org/books/) |
| **Forgotten reading still trains the model** | Paul Graham (2014): "Reading and experience train your model of the world", even after the specifics are gone; reread important books | Review | [How You Know](https://paulgraham.com/know.html) |

These positions are compatible [I, medium-high]. Cowen describes survey done at industrial scale. Nielsen sets the ratio between survey and deep study. Karnofsky and Matuschak say deep study without engagement artifacts or retrieval practice is wasteful. Graham argues for spaced re-exposure. Read together, they suggest a portfolio: survey many works cheaply, study a few deeply, and put a fixed daily budget into review of that few.

## Adler: inspectional and syntopical reading

Mortimer Adler's *How to Read a Book* was first published in 1940. The 1972 edition was heavily revised with Charles Van Doren. It defines four cumulative levels: elementary, inspectional, analytical and syntopical ([Wikipedia](https://en.wikipedia.org/wiki/How_to_Read_a_Book)). Of the four, inspectional and syntopical reading matter most for a reader with thousands of candidate books.

**Inspectional reading** answers "what kind of book is this, and is it worth reading analytically?" in limited time. The book splits it into two moves. I summarize them from the book; I did not re-verify them this session [R, high]:

1. **Systematic skimming.** Read the title page and preface, the table of contents, the index, and the publisher's blurb. Then look at the chapters that seem pivotal, dip into a few paragraphs, and read the last few pages.
2. **Superficial reading.** Read straight through without stopping at the parts you don't understand. Then decide whether the book deserves a second, analytical reading.

The test of an inspectional reading is whether you can answer Adler's first questions: what the book is about as a whole, and how it is organized. That is close to what an LLM-generated outline supplies. The difference is that the reader has not done the work [I].

**Syntopical reading** builds an understanding of a *subject* from several books. As I recall the book [R, high], it has five steps:

1. Find the relevant passages in each book. This is retrieval, not reading.
2. **Bring the authors to terms.** Build a neutral vocabulary and map each author's words onto it.
3. Frame neutral questions that every author can be read as answering.
4. **Define the issues:** where authors answer the same question differently.
5. Analyze the discussion: order the issues and judge the arguments.

Take the interpretation of probability as an example. Step 2 means noticing that "probability" refers to a limiting frequency in one author and a degree of belief in another before you compare their claims. Step 4 produces a table of authors × questions such as "can a single event have a probability?". In practice, steps 2–4 are where human syntopical reading stalls: it takes days of collation before any judgment happens. They are also steps current LLMs do well, given passages with citations [I, medium]. Step 5 is the reader's own work. The caution about LLMs doing the integrating for you applies here (see [Retention](#retention-testing-and-spacing)).

**The Syntopicon was the 1952 version of this tool.** Britannica's *Great Books of the Western World* (54 volumes in 1952; 60 in 1990) came with a two-volume *Syntopicon*. It indexed 102 "Great Ideas" across the set, and its indexers reread each work with one idea in mind and collated the passages ([Wikipedia](https://en.wikipedia.org/wiki/Great_Books_of_the_Western_World)). It sold only 1,863 sets in 1952. After the publisher switched to door-to-door sales it sold 50,000 in 1961, and about a million in total according to Alex Beam [S, via Wikipedia]. As a design reference for a cross-book idea index, it shows a fixed list of ideas, passage-level pointers, and human curation at a cost no one would pay again. An LLM can rebuild the pointers for any idea list. The open question is whether anyone will check them. The design consequences are in [The Design Space](/building/design-space/).

## Skimming and speed reading

[Reading Interfaces](/interfaces/reading-interfaces/) covers the eye-tracking literature in detail. Four findings matter for choosing methods and devices:

- **Speed reading does not deliver what it promises.** Rayner, Schotter, Masson, Potter and Treiman (2016, *Psychological Science in the Public Interest* 17(1):4–34) conclude that readers are unlikely to go from about 250 words per minute to 500–750 without losing comprehension. Readers face "a trade-off between speed and accuracy". Gains come from practice and language skill, such as vocabulary, not from eye-movement training ([record](https://profiles.wustl.edu/en/publications/so-much-to-read-so-little-time-how-do-we-read-and-can-speed-readi/)). Secondary summaries add that apps which prevent regressions (RSVP, Spritz-style) hurt comprehension [S, medium].
- **Skimming costs comprehension and works differently from reading.** In [Strukelj & Niehorster 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC7198234/) (N = 60), skimming meant shorter fixations, longer saccades, fewer regressions and significantly lower comprehension than regular reading.
- **Good skimmers satisfice.** Duggan and Payne's eye-movement data show skimmers reading each section until the rate of new information falls below a threshold, then skipping ahead. Directing attention this way improved memory for the important content ([2011 CHI reanalysis](https://researchportal.bath.ac.uk/en/publications/skim-reading-by-satisficing-evidence-from-eye-tracking/); original study [2009](https://researchportal.bath.ac.uk/en/publications/text-skimming-the-process-and-effectiveness-of-foraging-through-t/)). I recall that the 2009 paper found skimming the whole text beat reading half of it carefully, but I could not verify this [~65%].
- **Structure makes skimming work.** Headings, abstracts, topic sentences and outlines feed the satisficing decision [I, from the above].

**What to do.** Don't use RSVP or "speed reading" apps. For survey, read the structure first, then satisfice section by section. Large, fast screens suit skimming better than e-ink, whose page turns and search are slow (see the [matrix](#the-matrix-modes-against-methods-tools-and-devices)).

## Screen versus paper

### The meta-analyses

| Meta-analysis | Scope | Effect (negative favors paper) | Moderators | Source |
|---|---|---|---|---|
| Delgado, Vargas, Ackerman & Salmerón 2018, *Educational Research Review* 25:23–38 | 2000–2017; 38 between- and 16 within-participant studies; 171,055 participants | g = −0.21 (both designs) | Larger under **time constraints** than self-paced. Present for **informational** and mixed texts, not purely narrative ones. **The paper advantage grew with publication year** | [DOI](https://doi.org/10.1016/j.edurev.2018.09.003); [author copy](https://www.uv.es/lasalgon/papers/Delgado%202018%20dont%20throw%20away%20your%20printed%20books.pdf) |
| Kong, Seo & Zhai 2018, *Computers & Education* 123:138–149 | 17 studies, 2000–2016 | ≈ −0.21 on comprehension; no difference in reading speed | No significant moderators; the gap trended smaller over time, not significantly | [record](https://researchconnect.buffalo.edu/en/publications/comparison-of-reading-performance-on-screen-and-on-paper-a-meta-a/) |
| Clinton 2019, *Journal of Research in Reading* 42(2):288–325 | 33 studies (2008–2018), 2,799 participants, random assignment only | Small paper advantage. The three 2018–19 meta-analyses span g = 0.21–0.25 | **Expository** texts only; no difference for narrative. No reliable difference in reading time. Readers were **better calibrated** (less overconfident) on paper | [DOI](https://doi.org/10.1111/1467-9817.12269); [author's summary](https://www.learningscientists.org/blog/2019/9/12-1) |
| Salmerón, Altamura, Delgado, Karagiorgi & Vargas 2024, *Journal of Educational Psychology* 116(2):153–172 | Handheld devices (tablets, e-readers, phones) vs print | g = −0.113 (k = 38, between); g = −0.103 (k = 21, within) | Larger for undergraduates than school students, and for participants assessed individually | [DOI](https://doi.org/10.1037/edu0000830); [preprint](https://www.uv.es/lasalgon/papers/Salmeron%202023%20manuscript_tablets.pdf) |

### How big is g = −0.21?

On normal-distribution assumptions, the average paper reader outscores about 58% of screen readers. A randomly chosen paper reader beats a randomly chosen screen reader about 56% of the time. At the handheld estimate of −0.11, that falls to about 53% [my calculation].

For scale, Clinton-Lisell's 2023 paper lists other effects on comprehension from the same literature. Seductive details reduce comprehension by g = 0.33. Refutation texts improve it by 0.41, and graphics by 0.39 ([Clinton-Lisell 2023](https://files.eric.ed.gov/fulltext/EJ1403866.pdf)). Choosing paper is worth about half as much as adding a good diagram [I].

### What the moderators say about mechanism

Three moderators point to behavior more than pixels:

- **Time pressure enlarges the gap** (Delgado).
- **The gap appears only for expository text** (Delgado, Clinton). Expository text is where readers have to stop, go back and integrate.
- **Readers are more overconfident on screens** (Clinton). Overconfident readers stop studying too early.

The "shallowing hypothesis" ties these together: people have learned to treat screens as places for fast, shallow reading, and carry that habit into tasks that need depth. A second mechanism is that scrolling disrupts spatial memory for where things are in a text. Both are plausible and neither is settled [I, medium].

Two findings cut the other way. The handheld meta-analysis found half the effect. And Clinton-Lisell later wrote that her own subsequent experiments "have not observed the screen inferiority effect". I saw that statement only in a search snippet and did not locate the source [S, unverified].

**Almost every included study used LCD or LED screens.** I found no meta-analysis, and no well-powered single study, that isolates e-ink. My credence that a front-lit, paginated e-ink device matches paper on comprehension of expository text is [~55%]. That rests on the mechanism argument (pagination, no notifications, slow interaction that discourages skimming), not on data.

### What to do

- **The behavior matters more than the device.** For deep study, read self-paced, on paginated rather than scrolling layouts, with no deadline in the room. This follows from the moderators [A for time pressure; D for pagination].
- **Print or use e-ink for the core.** For the 5–10 works per field you intend to master, the cost of printing is trivial against hours of study. The expected gain is small but positive [~75% that it is positive for expository text].
- **Don't worry about screens for survey and lookup.** The effect is a comprehension effect. Survey and lookup don't aim at full comprehension, and screens win there on speed and search.
- **Check your own calibration.** After a chapter, predict your quiz score, then take the quiz. Do this on two devices and compare. Clinton's calibration result makes this a cheap n-of-1 test [I].

## Listening versus reading

| Study | Design | Result | Source |
|---|---|---|---|
| Clinton-Lisell 2022, *Review of Educational Research* 92(4):543–582 | 46 studies (1955–2020), 4,687 competent readers | No overall difference: g = 0.07, p = .23. Small reading advantage when reading was **self-paced**: g = 0.13, p = .049. No advantage when the experimenter set the pace: g = −0.32, p = .16. Reading helped for inferential comprehension (g = 0.36) and general comprehension (0.15), not literal (−0.01). **No included study let listeners control the pace** | [DOI](https://doi.org/10.3102/00346543211060871) |
| Clinton-Lisell 2023, *Educational Research: Theory and Practice* 34(3):133–155 | 30 studies, N = 1,945, 62 effect sizes: reading while listening vs reading only | g = 0.18 overall, but **only** when the experimenter set the pace (g = 0.41). Self-paced: g = 0.06, 95% CI [−0.07, 0.19], p = .34 | [full text](https://files.eric.ed.gov/fulltext/EJ1403866.pdf) |

**Reading of the evidence** [I, medium-high]:

- **Narrative and general comprehension: audio is a near-substitute.** If a book is an argument you will hear once and absorb the gist of, a walk with an audiobook or TTS loses little.
- **Dense expository text: read it.** The self-paced reading edge sits in inferential comprehension, which is the part that matters for a statistics text or a decision-theory paper. Equations and tables don't survive TTS anyway. Zotero's Read Aloud skips equations and tables by design.
- **Speeded listening is untested.** Listening at 1.5–3× is how audio apps get used, and the meta-analysis contains no listener-paced studies at all. I would not assume parity at 2× for expository material [~60% that comprehension drops measurably].
- **Reading along with TTS has no comprehension benefit for self-paced readers.** Speechify-style highlighting may still help with attention, pacing or accessibility. Those weren't measured.
- **A generated summary is not the text.** Gemini Notebook's Audio Overviews and similar tools produce a *discussion* of the source. The studies above compare hearing and reading the same words. They say nothing about summaries. I found no study measuring comprehension or retention from AI audio summaries against reading the source. Treat them as a survey-mode tool: what the book is about, whether it is worth your time, what its main claims are.

## Retention: testing and spacing

The learning-technique evidence is older and sturdier than the screen-vs-paper literature ([Dunlosky et al. 2013](https://www.aft.org/ae/fall2013/dunlosky), summarizing their *Psychological Science in the Public Interest* monograph):

| Utility | Techniques |
|---|---|
| **High** | Practice testing; distributed practice |
| **Moderate** | Interleaved practice; elaborative interrogation; self-explanation |
| **Low** | Summarization; highlighting and underlining; rereading; keyword mnemonic; imagery for text |

Summarization rated "low" sits awkwardly with Karnofsky's advice to write your own summary. As I recall the monograph, the low rating reflects how unevenly untrained students summarize, not evidence that a good summary is useless [R, ~70%]. This page keeps the written summary as an engagement artifact for deep study. It does not replace retrieval practice.

Supporting effect sizes, as collected by [Gwern](https://gwern.net/spaced-repetition) (2019):

- **Spacing:** meta-analytic d = 0.42 (Donovan & Radosevich 1999).
- **Kornell 2009:** spacing beat massing for 90% of participants, yet 72% believed massing worked better.
- **Testing vs restudy:** about 60% vs 40% recall after one week (Roediger & Karpicke 2006).

**The tooling is mature and cheap:**

- **Anki** has offered the FSRS scheduler since version 23.10. The default desired retention is 90%, and the manual warns against going above 97% ([Anki manual](https://docs.ankiweb.net/deck-options.html), October 2026).
- **FSRS benchmark.** On about 10,000 Anki collections, excluding same-day reviews, FSRS-6 reaches a log loss of 0.3460, against 0.4033 for ACT-R and 0.4694 for HLR. With same-day reviews included, the gap shrinks to 0.3842 vs 0.3898 ([srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark)). FSRS is the best mainstream scheduler, but the margin depends on how it is measured.
- **Cost in time.** Michael Nielsen reported about 10,000 cards over 2.5 years at 15–20 minutes a day. He estimated 4–7 minutes of lifetime review per card, against about 2 hours per card for conventional weekly flashcards. His summary: "Anki makes memory a *choice*, rather than a haphazard event" ([Nielsen 2018](http://augmentingcognition.com/ltm.html)).

**The highlight problem.** Kindle, Kobo, Zotero, Readwise and most e-ink note apps are built around the highlight, which is the low-utility technique. Readwise's Daily Review resurfaces highlights. That is closer to rereading than to retrieval unless the highlights are converted into questions [I, derived from Dunlosky]. The fix is mechanical: each highlight worth keeping becomes a question, a cloze deletion or a prompt, written or edited by you and scheduled by FSRS.

**A budget, not a habit.** At Quantum Country's density of prompts, one book studied this way costs roughly 37–65 hours of lifetime review [I; the calculation is in [Reading Interfaces](/interfaces/reading-interfaces/), under the mnemonic medium]. That is affordable for the deep core and unaffordable for everything. Write prompts for the works in deep study, not for survey reading.

**A caution on letting an LLM do the work.** In Kosmyna et al. ([arXiv 2506.08872](https://arxiv.org/abs/2506.08872), revised 2025-12-31), people who wrote essays with an LLM showed the weakest EEG connectivity and struggled to quote their own essays. It is a writing task, the sample is 54 people (18 in the crossover session), and it is a preprint. It suggests, but does not show, that reading summaries instead of sources, or accepting LLM-drafted cards without editing, may also leave less behind [low-medium].

## Annotation workflows

| Tool | Core use | Platforms | Price (Oct 2026) | Notes | Source |
|---|---|---|---|---|---|
| **Zotero** | Reference manager plus PDF, EPUB and web-snapshot reader with annotations | Windows, macOS, Linux, iOS, Android | Free; paid storage (prices not verified) | Zotero 9 (2026-04-10) added Read Aloud. Zotero 10 (2026-08-17) added a reflowable, annotatable Reading Mode for PDFs and search over annotations. Read Aloud reached iOS on 2026-10-05 | [Zotero 9](https://www.zotero.org/blog/zotero-9/), [Zotero 10](https://www.zotero.org/blog/zotero-10/), [blog](https://www.zotero.org/blog/) |
| **Readwise / Reader** | Collects highlights from Kindle, Apple Books and others; spaced "Daily Review"; read-later app | Web, iOS, Android | Full \$9.99/mo billed annually (\$119.88/yr) or \$12.99 monthly; Lite \$5.59/mo billed annually; 50% academic discount; 30-day trial | One of the few large read-later services left [I] after Pocket closed on July 8, 2025 ([Kobo help](https://help.kobo.com/hc/en-us/articles/360017763753)) | [pricing](https://readwise.io/pricing) |
| **MarginNote 4** | Reader → cards → mind maps → FSRS review; AI summaries and quiz drafts | iPad, Mac | 14-day trial; lifetime or subscription (prices not on homepage) | Vendor claims about 30% less review time than "traditional Anki schedulers"; this is unverified marketing | [marginnote.com](https://www.marginnote.com/) |
| **LiquidText** | Multi-document workspace: pull excerpts out, link across documents | iPadOS, Windows, macOS | Separate pricing page (not captured) | No AI features on the homepage | [liquidtext.net](https://www.liquidtext.net/) |
| **Hypothesis** | Social annotation on web pages and PDFs; LMS integration | Web | Not captured | Positioned for higher education (300+ institutions); its outcome claims are uncited | [about](https://web.hypothes.is/about/) |
| **Obsidian** | Local Markdown notes | All | Free; Sync \$4/mo and Publish \$8/mo (annual billing); optional commercial license \$50/user/yr | Plain files you can process with your own scripts | [pricing](https://obsidian.md/pricing) |
| **Anki** | Spaced repetition with FSRS | Desktop, web, Android (free); iOS (paid) | Free except AnkiMobile | The endpoint of every workflow below | [manual](https://docs.ankiweb.net/deck-options.html) |

Four workflows cover most of what this audience reads [I; each step uses only documented features]:

1. **Papers and PDFs: Zotero → notes → Anki.** Collect papers into Zotero, read and annotate in its reader on a desktop or tablet, and use Reading Mode on small screens. Write a three-sentence summary per paper in a Zotero note or in Obsidian; that is the "engagement artifact". Turn the 3–10 claims you will build on into Anki cards. Cost: \$0.
2. **Ebooks (purchased or library): device highlights → Readwise → cards.** Highlight on a Kindle or in Apple Books and let Readwise collect the highlights. Once a week, turn the highlights you want to keep into questions and move them into Anki. Readwise's own resurfacing is rereading, not retrieval. Cost: \$119.88/yr, or \$0 if you copy highlights by hand.
3. **Several books on one question: a syntopical workspace.** In LiquidText or MarginNote on an iPad, pull excerpts from each book into one workspace and group them under neutral questions (Adler's steps 2–4). The output is a table of authors × questions with links back to passages. An LLM can draft the neutral glossary and the question list from your excerpts. Check every cell against the linked passage.
4. **Handwriting on e-ink: annotate → export → file.** Kindle Scribe exports annotated PDFs and sends notebooks to OneNote. reMarkable and Kobo import from cloud drives. File the exported PDF back in Zotero so annotations live next to the reference. Handwritten marginalia are not searchable unless you convert them (reMarkable's Connect subscription, \$3.99/mo or \$39/yr, includes handwriting conversion).

The common rule is that **an annotation workflow should end in a question you will be tested on, or a summary you wrote.** If it ends in a pile of highlights, it is the low-utility technique.

## Devices

### E-ink tablets and readers

The last column is the size at which 10-pt body text appears when a whole US-letter page is fitted to the screen in portrait. Full calculations are in the [next table](#what-a-pdf-looks-like-on-each-screen). All prices are US list prices as of 15 October 2026.

| Device | Screen | Price (Oct 2026) | Formats and import | Library apps | Letter PDF, 10 pt → | Catch | Source |
|---|---|---|---|---|---|---|---|
| **Boox Note Max** | 13.3" mono, 3200×2400, 300 ppi | \$629.99 | Any Android reader; Boox's NeoReader crops and reflows PDFs | **Libby and O'Reilly** via Google Play | **9.4 pt** | **No front light.** Android 13 (Oct 2024 model) | [Boox](https://shop.boox.com/products/notemax) |
| **Boox Tab X C** | 13.3" Kaleido 3 color; 300 ppi mono, 150 ppi color | \$819.99 | Android | Libby, O'Reilly | 9.4 pt | Color halves resolution; Android 13 (Apr 2025) | [Boox](https://shop.boox.com/products/tabxc) |
| **reMarkable Paper Pro** | 11.8" color (Canvas Color), 2160×1620 (≈229 ppi), front light | \$629 (\$679 with Marker Plus); launched at \$579 in Sept 2024 | PDF and ebooks; Word and Google Docs import | None | 8.3 pt | Closed OS; no third-party apps | [reMarkable](https://remarkable.com/products/remarkable-paper/pro); [launch price](https://www.notebookcheck.net/reMarkable-Paper-Pro-Brand-new-E-Ink-tablet-with-an-11-8-inch-color-touchscreen-and-front-light-released-at-579.884166.0.html) |
| **Kindle Scribe (3rd gen)** | 11" mono, front light, 400 g | \$499.99 at launch; a Feb 2026 review lists \$549.99 (unresolved) | Send to Kindle (PDF, DOCX, TXT, EPUB); Google Drive and OneDrive import; annotated-PDF export | **Libby loans via "Send to Kindle (U.S. only)"**; no O'Reilly | 7.8 pt (4:3 assumed) | Closed; "Ask This Book" and "Story So Far" are US-only | [Amazon](https://aboutamazon.com/news/devices/new-amazon-kindle-scribe-color); [Gadgeteer](https://the-gadgeteer.com/2025/12/07/amazons-next-gen-kindle-scribe-lineup-goes-on-sale-december-10-with-no-preorders/); [TechCrunch](https://techcrunch.com/2026/02/06/kindle-scribe-colorsoft-review-e-ink-color-tablet) |
| Kindle Scribe Colorsoft | 11" color, front light | \$629.99 (32 GB); \$679.99 (64 GB) | As above, plus AI notebook search | As above | 7.8 pt | Color filter lowers effective resolution [I] | as above |
| Kindle Scribe (no front light) | 11" mono | \$429.99 | As above | As above | 7.8 pt | No front light | as above |
| **Boox Note Air6 C** | 10.3" Kaleido 3; 300/150 ppi; front light | \$579.99 | Android 16; built-in AI Assistant on selected text | Libby, O'Reilly | 7.3 pt | Color is 150 ppi | [Boox](https://shop.boox.com/products/noteair6c) |
| **Boox Go 10.3 (Gen II)** | 10.3" Carta 1200 mono, 2480×1860, 300 ppi | \$419.99; **Lumi (front light) \$449.99** | Android 15, Google Play | Libby, O'Reilly | 7.3 pt | Base model has no front light | [Boox](https://shop.boox.com/products/go103gen2) |
| **Kobo Elipsa 2E** | 10.3" Carta 1200, 227 ppi, front light | \$399.99 (stylus included) | EPUB and PDF; Dropbox and Google Drive; write on ebooks and PDFs, except DRM-protected PDFs | OverDrive built in [R, ~90%, not re-verified] | 7.3 pt | Launched April 2023; no successor announced | [Kobo](https://ereader.kobo.com/en-us/products/kobo-elipsa-2e) |
| **reMarkable Paper Pure** | 10.3" Carta 1300, 226 ppi | \$399; \$449 with Marker Plus and Sleeve Folio | PDF and documents from Google Drive, OneDrive, Word; EPUB [R] | None | 7.3 pt | **No front light**; reMarkable 2 pens don't fit. Replaced the discontinued reMarkable 2 (announced 2026-05-06) | [reMarkable](https://remarkable.com/products/remarkable-paper/pure); [Good e-Reader](https://goodereader.com/blog/remarkable-news/everything-you-need-to-know-about-the-remarkable-paper-pure) |
| Boox Note Mini C | 8.52" Kaleido 3; 300/150 ppi | \$579.99 | Android 16 | Libby, O'Reilly | 6.0 pt (4:3 assumed) | Ships around October 2026 | [Boox](https://shop.boox.com/products/noteminic) |
| reMarkable Paper Pro Move | 7.3" color, front light [S] | \$449 (\$499 with Marker Plus) | As Paper Pro | None | under 5 pt [I, aspect ratio assumed] | Note-taker, not a PDF reader | [reMarkable](https://remarkable.com/products/remarkable-paper/pro-move) |
| **Boox Palma 3** | 6.13" phone-shaped, 300 ppi, front light | \$339.99 | Android 16, Google Play | Libby, O'Reilly | Not usable for full pages | Pocket EPUB and Libby reader | [Boox](https://shop.boox.com/products/palma3) |

**What the table shows:**

1. **Openness decides library access.** Libby runs on iOS 10+ and Android 7.1+ ([Libby Help](https://help.libbyapp.com/en-us/6105.htm), updated 2026-02-26), so it installs on any current Boox. The O'Reilly Android app has more than a million downloads and was updated 2026-10-14 ([Google Play](https://play.google.com/store/apps/details?id=com.safariflow.queue)). Libby's own listing offers "Send ebooks to Kindle (U.S. only)" ([Google Play](https://play.google.com/store/apps/details?id=com.overdrive.mobile.android.libby), updated 2026-08-26). Outside the US, a Kindle gets nothing from Libby. Kobo's built-in OverDrive is from my recollection. reMarkable has no route [I, high]. For a reader whose main source is a Bay Area library card stack (see [Public Libraries](/access/public-libraries/)), the choice is between Boox and a phone or tablet. One thing I did not test: whether a library-sponsored O'Reilly account signs in through the Android app.
2. **Color costs sharpness.** Kaleido 3 shows color at 150 ppi against 300 ppi for monochrome. For text, a monochrome Carta panel is sharper [I, high]. Color helps with figures and highlights, not prose.
3. **Prices drifted up.** The Paper Pro rose from \$579 to \$629. The iPad mini 128 GB is \$599, against my recollection of \$499 at its October 2024 launch [R, ~85%]. I did not verify the cause.
4. **On-device AI is arriving, inside closed ecosystems.** Kindle has Ask This Book and Story So Far (US-only), Boox has an AI Assistant for selected text, and reMarkable has AI handwriting conversion through Connect. None of these exposes an API for your own LLM workflows [I, medium]. Boox is the exception in a different way: being Android, it runs whatever reader app or progressive web app you build.

### Tablets and monitors

| Device | Key specs | Price (Oct 2026) | Library apps | Letter PDF, 10 pt → | Catch | Source |
|---|---|---|---|---|---|---|
| **iPad mini (A17 Pro)** | 8.3" LCD, 2266×1488, 326 ppi, 500 nits, 293 g; Apple Pencil Pro | \$599 (128 GB); \$699 (256 GB); \$899 (512 GB) | Libby; O'Reilly app (needs iOS 18.5+); Kindle; plus Zotero, MarginNote, LiquidText, Readwise Reader | **5.4 pt** (7.0 cropped) | Too small for full-page PDFs; light-emitting | [specs](https://www.apple.com/ipad-mini/specs/); [store](https://www.apple.com/shop/buy-ipad/ipad-mini); [O'Reilly on the App Store](https://apps.apple.com/us/app/oreilly/id881697395) |
| **27" 4K monitor** | 3840×2160, ≈163 ppi | Not researched | Anything (browser, desktop apps) | 12.0 pt as a two-page spread; 15.6 pt for one page in portrait | Desk only; light-emitting | [I, calculation] |
| **32" 4K monitor** | ≈138 ppi | Not researched | Anything | 14.3 pt as a two-page spread | Desk only | [I, calculation] |
| **Boox Mira Pro** (e-ink monitor) | 25.3", 3200×1800, 145 ppi; HDMI, DisplayPort, USB-C; VESA mount | \$1,799.99 | Whatever your computer runs | 11.3 pt as a two-page spread | Expensive and niche; e-ink refresh on a desktop | [Boox](https://shop.boox.com/products/boox-mira-pro) |

In my judgment the iPad mini is the best handheld for EPUB plus apps [I]. It does everything the reading stack needs except show a full PDF page at a usable size, and its screen is light-emitting (see [Long sessions](#long-sessions-eyes-and-sleep)).

### What a PDF looks like on each screen

A US-letter page is 8.5 × 11 in. With its margins cropped off, a typical text block is about 6.5 × 9 in. Fitting either to the screen in portrait gives the following [I, calculation; 4:3 aspect assumed where noted]:

| Screen | Usable area (portrait) | Full page: 10 pt renders as | Margins cropped: 10 pt renders as |
|---|---|---|---|
| 13.3" 4:3 (Note Max, Tab X C) | 7.98 × 10.64 in | **9.4 pt** | 11.8 pt |
| 11.8" 4:3 (Paper Pro) | 7.08 × 9.44 in | 8.3 pt | 10.5 pt |
| 11" (Kindle Scribe; 4:3 assumed) | 6.60 × 8.80 in | 7.8 pt | 9.8 pt |
| 10.3" 4:3 (Note Air6 C, Go 10.3, Elipsa 2E, Paper Pure) | 6.18 × 8.24 in | **7.3 pt** | 9.2 pt |
| 8.52" (Note Mini C; 4:3 assumed) | 5.11 × 6.82 in | 6.0 pt | 7.6 pt |
| 8.3" iPad mini (≈3:2) | 4.56 × 6.94 in | **5.4 pt** | 7.0 pt |

Monitors for comparison: a 27" 4K panel shows a two-page spread with 10 pt at about 12 pt, and a 32" panel at about 14 pt.

**Consequences:**

- **Two-column papers on screens of 10.3" or less need column zoom or reflow.** Boox's NeoReader crops and reflows. Zotero 10's Reading Mode reflows PDFs and keeps annotations working ([Zotero 10](https://www.zotero.org/blog/zotero-10/)). I have not tested how either handles equations and figures.
- **EPUB is not a problem at any size.** It reflows natively. Where a book exists as both EPUB and PDF, take the EPUB for small screens, unless page fidelity matters, as it does with dense mathematics or figures.
- **Only 13.3" e-ink shows a whole letter page near print size.** If most of what you read is papers and you want e-ink, buy the big one or plan to reflow.

### Text-to-speech and audio tools

| Tool | What it reads | Free tier | Paid (Oct 2026) | Notes | Source |
|---|---|---|---|---|---|
| **ElevenReader** | PDF, DOCX, EPUB, Markdown, TXT, web links, scanned text | **10 h/month** of text-to-audio (about a 400-page book), 1,000+ voices, up to 4.0× | Ultra **\$11/mo or \$99/yr**: unlimited text-to-audio for your imports, 20 h/mo of premium catalog titles, offline, smart import that skips headers and footers | Audio export only through the web and ElevenLabs apps | [elevenreader.io](https://elevenreader.io/) |
| **Zotero Read Aloud** | PDFs, EPUBs and snapshots in your Zotero library | 2 h/month standard voices with a free account | Storage subscribers: unlimited standard voices plus about 2 h of premium | Skips citations, headers, footers, tables and equations; annotate "the sentence you just heard"; on iOS since 2026-10-05 | [Zotero 9](https://www.zotero.org/blog/zotero-9/); [Zotero 10](https://www.zotero.org/blog/zotero-10/) |
| **Speechify** | Documents, web pages, scans | 10 "robotic" voices, up to 1.5× | Premium **\$29/mo** billed monthly (yearly billing advertised as "save 60%"; price not shown); up to 5× | Most expensive option | [pricing](https://speechify.com/pricing/) |
| **Gemini Notebook Audio Overviews** (formerly NotebookLM) | A generated *discussion* of your sources, not the sources | Free tier: 100 notebooks × 50 sources; each source up to 500,000 words or 200 MB; EPUB accepted | Higher limits on Google AI plans | Four formats: Deep Dive, Brief, Critique, Debate. 80+ languages; interactive mode English-only. Google warns the output "may contain inaccuracies". Rename date unknown | [plans](https://support.google.com/notebooklm/answer/16213268); [Audio Overviews](https://support.google.com/gemininotebook/answer/16212820); [sources](https://support.google.com/gemininotebook/answer/16215270) |
| **OS built-ins** (iOS Speak Screen, Android and Chrome read-aloud) | Any on-screen text | Free | — | Not checked this session; usually below neural TTS in quality [R, medium] | — |

**What to do:** start with ElevenReader's free 10 hours a month for books and Zotero Read Aloud for papers in your library. Pay for ElevenReader Ultra (\$99/yr) only if you listen to more than one book a month. Speechify Premium costs about 2.6 times as much per month as ElevenReader Ultra billed monthly, and has no advantage I could document. Use Audio Overviews for survey, to decide whether a book deserves reading, not as a substitute for reading it.

### Long sessions: eyes and sleep

| Finding | Detail | Strength | Source |
|---|---|---|---|
| E-ink ≈ paper for visual fatigue; LCD worse | Benedetto et al. 2013: N = 12, sessions averaging 73 min. Visual fatigue rose only after reading on an LCD (Kindle Fire HD). E-ink (Kindle Paperwhite) and paper did not differ | Small within-subjects study; 2013 hardware | [PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0083676) |
| Evening reading on a light-emitting screen disrupts sleep | Chang et al. 2015: N = 12, about 4 h before bed for 5 nights, iPad at maximum brightness vs a printed book. Melatonin suppressed 55% (n = 11 for melatonin analyses), melatonin onset more than 1.5 h later, sleep latency 25.65 vs 15.75 min, less REM sleep, sleepier the next morning | Tightly controlled inpatient crossover; small N; maximum brightness | [PNAS (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4313820/) |
| Screen placement and breaks | Center of the screen 15–20° below eye level, 20–28 in away. The 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds. After 2 hours of continuous use, rest the eyes for 15 minutes | Professional guidance | [AOA](https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome) |

**What to do:** for long-form reading in the evening, use front-lit e-ink with warm light, or paper, and avoid a bright tablet in the hours before bed. At a desk, place the monitor, or a 13.3" e-ink tablet on a stand, per the AOA guidance. Work in 25–50-minute blocks with breaks to look into the distance. The block length is my inference [I]; the break rule is the AOA's.

### Which device for which reader

| If most of your reading is… | Get | Cost (Oct 2026) | Main obstacle |
|---|---|---|---|
| Papers and PDFs, at a desk | The 27–32" 4K monitor you probably own, in portrait or as a two-page spread; Zotero | \$0 extra | Light-emitting; email and tabs one click away |
| Papers and PDFs, away from a desk, on e-ink | Boox Note Max (13.3"); Tab X C if you need a front light | \$629.99; \$819.99 | Note Max has no front light; both run Android 13; 13.3" is not pocketable |
| Library ebooks plus O'Reilly plus your own apps, on e-ink | Boox Go 10.3 Gen II Lumi; or Palma 3 for a pocket | \$449.99; \$339.99 | Android on e-ink is slow and fiddly; letter PDFs at 7.3 pt |
| Kindle purchases plus US library loans, with handwriting | Kindle Scribe (3rd gen) | \$499.99 (possibly \$549.99) | Closed system; no O'Reilly; AI features US-only |
| Handwritten notes on PDFs, no apps, no distractions | reMarkable Paper Pure, or Paper Pro if you need a front light and color | \$399; \$629 | No library apps; no front light on the Pure |
| Everything, including color figures and every app | iPad mini | \$599 | 5.4-pt PDFs; light-emitting screen at night |
| Listening while walking or commuting | ElevenReader free tier; Zotero Read Aloud | \$0 (ElevenReader Ultra \$99/yr) | Speeded listening for expository text is untested |

If you already own a laptop, a monitor and a phone, the cheapest improvement for deep study is to print the core works. Buy e-ink only for evening reading or freedom from distraction [I, medium]. The comprehension case for e-ink over a tablet is plausible but unmeasured.

## The matrix: modes against methods, tools and devices

**Evidence grades:**

- **A:** several meta-analyses or a large, consistent literature.
- **B:** at least one controlled experiment or large benchmark, or a single meta-analysis with caveats.
- **C:** practitioner consensus, expert testimony or vendor claims.
- **D:** my inference; untested.

| Mode | Methods (grade) | Tools and software (grade) | Devices (grade) | Avoid (grade) |
|---|---|---|---|---|
| **1. Survey / skim / triage** | Adler's inspectional reading: structure first, then a superficial read-through (C). Satisficing skim (B: Duggan & Payne). Abandon freely (C: Cowen). Read reviews and critiques before the book (C: Karnofsky). Prefer curator and syllabus signals to crowd ratings (B; see [Curation](/finding/curation/)) | Open Syllabus and Five Books for candidates (C). Gemini Notebook "Brief" overviews or chat across many sources (D). LLM-generated outlines (D) | Large monitor or iPad for fast flipping and search (D). Audio while walking (B for parity when it is the same text; D for summaries). E-ink is poor here: slow page turns and search (C) | RSVP and speed-reading apps (A−/B: Rayner). Popularity-ranked lists as the main filter (B) |
| **2. Targeted lookup** | Formulate the question first; read the passage in context (C) | Full-text search over your own library: Zotero, including annotations, and Readwise (C). Source-grounded LLM Q&A with citations: Gemini Notebook; Kindle "Ask This Book" for supported US titles (C/D). A Syntopicon-style idea index (C, historical) | Laptop or monitor (D). iPad mini on the move (D) | Trusting an LLM answer without opening the cited passage (D; vendors warn of inaccuracies) |
| **3. Deep study** (analytical and syntopical) | Self-paced, with no time pressure (A: Delgado moderator). Paper for expository text (A over LCD); e-ink as a substitute (D). Self-explanation and elaborative interrogation (B: moderate utility). Write your own summary or critique (C: Karnofsky). 5–10 core works per field (C: Nielsen). Syntopical steps: neutral terms, neutral questions, issues (C: Adler) | Zotero with annotations and Reading Mode (C). LiquidText or MarginNote for excerpts across documents (C). An LLM as a sparring partner that must quote passages, not as a summarizer (D; caution from Kosmyna) | Print for the core texts (A for comprehension; B for calibration). 13.3" e-ink for PDFs (D, from the scale arithmetic). 10.3" e-ink for EPUB and reflowed text (D) | Scrolling an LCD under time pressure (A). Reading along with TTS when self-paced, which adds nothing (A−/B). Highlight-only reading (A: low utility) |
| **4. Review / retention** | Practice testing plus spacing (A: high utility). Turn highlights into questions (D, derived from A). Periodic rereading of key books at spaced intervals (C: Graham; D for the schedule) | Anki with FSRS at the default 90% retention (B: benchmark; A for spacing itself). Prompts embedded in the text, Orbit-style (B−/C: correlational data). MarginNote 4 (C). Readwise Daily Review *only if* highlights become questions (D) | Phone for 15–20 minutes a day of review (C: Nielsen). Audio re-exposure on commutes (D) | Resurfacing highlights as a substitute for retrieval (A−: low utility). Cramming (A) |
| **Across all modes: long sessions** | 20-20-20; rest after 2 h (C: AOA) | Warm or dark themes at night (B: Chang) | E-ink ≈ paper for fatigue (B, small N) | Maximum-brightness tablet in the evening (B) |

The matrix's main point [I, medium-high]: **a single "AI reading assistant" that summarizes everything serves mode 1 and quietly removes modes 3 and 4.** Those are the modes where understanding and retention happen. A good setup puts survey on fast screens and audio, deep study on paper or e-ink at the reader's own pace, and review on a phone with FSRS. LLMs belong mainly in survey (outlines, triage), lookup (cited answers) and the collation steps of syntopical reading.

## If you build tools

For readers building their own stack with Claude Code (see [A Reference Architecture](/building/reference-architecture/) and [The Design Space](/building/design-space/)), the evidence above points to six priorities [I]:

1. **Design per mode.** Survey wants outlines, novelty against what you have already read, and a fast "drop" action. Deep study wants an undistorted text and excerpts that link back to their source. Review wants questions, not highlights.
2. **Treat PDF → clean reflowable text as a core feature.** On 8–10" screens, letter PDFs render at 5–7 pt. A pipeline that produces EPUB or HTML with equations, figures and reference links intact helps every device except 13.3" e-ink. Zotero 10's Reading Mode shows there is demand.
3. **Make Android e-ink a first-class target.** A progressive web app or Android app runs on Boox. Design for grayscale or 150-ppi color, pagination instead of scrolling, no animation, and high contrast. For Kindle, deliver EPUB through Send to Kindle. For reMarkable and Kobo, deliver PDF or EPUB through their cloud-drive imports.
4. **Compile highlights into questions.** Each highlight becomes a draft prompt with its source passage attached. The reader approves or edits it in a couple of minutes a day, and approved prompts export to Anki. Track the share of highlights converted.
5. **Build on audio, not around it.** TTS is a commodity, with 10 hours a month free. The open opportunity is an audio *triage* feed: short overviews of candidate books, with "keep" or "drop" by voice. Survivors go to the e-ink queue.
6. **Don't build RSVP or "read faster" features.** The evidence is against them.

## Open questions

- **Does front-lit, paginated e-ink match paper on comprehension of expository text?** No meta-analysis isolates e-ink. A within-subjects study (paper vs 10.3" e-ink vs iPad, self-paced and timed, with calibration measured) would settle it. An individual can run a rough version by alternating devices across chapters of one textbook and logging quiz scores and predicted scores.
- **Does listening at 1.5–2× preserve inferential comprehension for expository text?** The 2022 meta-analysis contains no listener-paced studies. A test needs speed conditions and inferential questions on, say, a chapter of an econometrics text.
- **Does an AI audio summary before reading improve comprehension of the source, or replace the reading?** Three arms (summary then read, read only, summary only) with a one-week retention test.
- **Can a library-sponsored O'Reilly account (for example SFPL's) sign in through the O'Reilly Android app on a Boox?** Testable in ten minutes with a card.
- **Is the Kindle Scribe (3rd gen) list price \$499.99 or \$549.99, and does it depend on storage tier?** Amazon's listing could not be fetched for this page.
- **Does Kobo's built-in OverDrive borrowing still work on the Elipsa 2E as of October 2026, and in which countries?** This page's claim rests on recollection.
- **How well do Zotero 10's Reading Mode and Boox NeoReader reflow two-column arXiv papers with equations and figures?** Test on 20 papers from different fields and count broken equations, lost figures and misordered text.
- **Where is Clinton-Lisell's statement that her later experiments did not find screen inferiority, and what were those experiments?** Finding it would show whether the 2019 effect is shrinking.
- **For cards drawn from books, which FSRS desired retention (85%, 90% or 95%) minimizes lifetime review minutes per retained item?** The FSRS simulator can estimate this from one's own review log.

## Related pages

- [Reading Interfaces](/interfaces/reading-interfaces/): the skimming literature, active-reading workspaces and the mnemonic medium in more depth
- [VR and Spatial Computing](/environments/vr-and-spatial-computing/): headsets and display glasses as reading surfaces
- [Building a Virtual Reading Room](/environments/virtual-reading-room/)
- [Public Libraries](/access/public-libraries/) and [Cheap Subscriptions](/access/subscriptions/): what Libby and O'Reilly give you, and where
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): the signals behind survey-mode choices
- [AI Research Assistants](/finding/ai-research-assistants/): Gemini Notebook, Semantic Scholar and Zotero plugins
- [Lectures, Talks and Other Media](/finding/lectures-and-media/): audio and video as reading substitutes
- [The Design Space](/building/design-space/) and [A Reference Architecture](/building/reference-architecture/)
- [What to Do First](/start-here/decision-guide/)
