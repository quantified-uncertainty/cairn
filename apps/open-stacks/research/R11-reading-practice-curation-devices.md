# Reading practice, curation and (non-VR) reading devices — research dossier

**Date:** 2026-10-15
**Track:** R11 (Open Stacks / CAIRN)
**Scope:** (1) how serious readers choose what to read, and how curation compares with search and recommender systems; (2) what the evidence says about reading methods: inspectional and syntopical reading, skimming, speed reading, screen vs. paper, listening vs. reading, spaced repetition, annotation; (3) non-VR reading hardware and software: e-ink tablets, the iPad mini, large and e-ink monitors, PDF/EPUB quality, text-to-speech, NotebookLM (now branded "Gemini Notebook"), and ergonomics of long sessions. The deliverable is a matrix mapping reading modes to tools, devices and methods, with evidence grades.

**Method.** About 50 web searches (the session's shared search budget ran out partway through), then direct fetches of primary pages: vendor product pages and storefront catalogs (reMarkable, Boox's Shopify catalog JSON, Kobo, Apple, Amazon's newsroom), help centers (Google's Gemini Notebook, Libby, Anki), pricing pages (Readwise, Obsidian, Speechify, ElevenReader), project blogs (Zotero, Open Syllabus, ACX), and full-text papers where open access allowed it (Delgado et al. 2018; Salmerón et al. 2024 preprint; Clinton-Lisell 2023; Strukelj & Niehorster 2018; Benedetto et al. 2013; Chang et al. 2015; Salganik et al. 2006). Several publisher sites (Wiley, SAGE, ScienceDirect, PNAS) returned 403 errors. For those papers I used open preprints, repository copies, or abstracts quoted in later papers, and say so where it matters.

**Legend for claim status.**
- **[P]**: verified on a primary source (vendor page, paper full text or abstract, official blog or help page) during this session.
- **[S]**: reported by a secondary source (press, review site, aggregator, search-result snippet).
- **[I]**: my inference or calculation.
- **[R]**: my recollection from before this session, not re-verified. Used sparingly and flagged.
- Confidence appears as [~NN%] or high/medium/low. Sources older than about two years are flagged "(stale?)".
- Numbers in brackets like [12] refer to the numbered Sources list at the end.

---

## Executive summary

1. **The screen-vs-paper gap is real, small, and conditional.** Four meta-analyses agree on a small paper advantage for comprehension. Delgado et al. 2018 found g = −0.21 across 54 studies and 171,055 participants [30]. Clinton 2019 and Kong et al. 2018 found effects of about 0.21–0.25 [32]. Salmerón et al. 2024 found the gap is roughly half that size for handheld devices: g = −0.113 between-participants and −0.103 within-participants [34]. The gap grows under time pressure and for expository (informational) text, and Delgado found it *grew* over publication years [30]. **Implication:** for deep study of informational text, read self-paced and avoid scrolling under time pressure. The device matters less than the behavior. [P, high]
2. **Listening is about as good as reading for competent adults, with a caveat.** Clinton-Lisell's 2022 meta-analysis (46 studies, 4,687 participants) found no reliable overall difference, but self-paced reading had a small edge [39]. Reading *while* listening adds nothing when reading is self-paced: g = 0.06, not significant [40]. No included study let listeners control their own pace, so modern audio apps at 1.5–3× are untested [39]. [P/S, medium-high]
3. **Speed reading, as sold, does not work. Skimming is a legitimate, distinct mode.** Rayner et al. 2016 conclude that readers are unlikely to go from about 250 to 500–750 wpm without losing comprehension [35]. Eye-tracking work shows skilled skimmers "satisfice": they read until the rate of new information drops, then jump ahead, and doing so improves memory for the important content [38]. [P, high]
4. **Retrieval practice and spacing are the best-supported retention methods. Highlighting and rereading are the worst.** Dunlosky et al. rate practice testing and distributed practice "high utility" and highlighting, rereading and summarization "low" [41]. Most annotation apps are built around highlights, so they are optimized for the weakest technique unless highlights get turned into questions. [P, high]
5. **The spaced-repetition stack is mature and cheap.** Anki's FSRS scheduler (Anki 23.10+, default desired retention 90%) [46] is benchmarked on about 10,000 Anki collections and roughly 350–520 million evaluated reviews [47]. Michael Nielsen estimated a lifetime cost of 4–7 minutes per card and about 15–20 minutes per day for 10,000 cards [42]. MarginNote 4 ships FSRS inside a PDF/EPUB reader [58]. [P, high]
6. **Most "mnemonic medium" evidence is correlational.** Quantum Country readers who show 5+ days of retention rarely forget afterward (median accuracy around 95%), but Matuschak himself says the data are correlative. The one causal test was an informal 2019 experiment [44]. Orbit remains an experimental research platform [45]. [P/S, medium]
7. **Recommenders out-predict friends but are trusted less, and they under-serve niche readers.** In Yeomans et al. 2019, a simple collaborative filter predicted joke preferences better than spouses and close friends (61% vs. 57% per press coverage), yet people preferred recommendations they believed came from humans [21][22]. In books, most algorithms fail "Niche" and "Diverse" readers and favor bestsellers [23]. Social-influence signals raise both inequality and unpredictability of success [25]. **Implication:** for a serious reader, *curator- and syllabus-based* signals beat crowd popularity signals. [P, medium-high]
8. **Open Syllabus is the largest open curation signal by far.** Version 2.14 (May 22, 2026) holds 32.9 million syllabi and 4.4 million unique titles; the release blog counts 94 million citations, while the dataset documentation counts 147 million extracted citations to books and articles [1][2]. [corrected in verification] Its Galaxy is a recommender built on the co-assignment graph [2]. The free tier persists; premium access now goes through VitalSource, and a CC-NC open data release is promised but undated [1][3]. [P, high]
9. **The hand-curated signals are small but deep.** Five Books has 1,700+ expert interviews and about 8,000 recommendations [4]. Patrick Collison's bookshelf lists about 600 entries and, by its own account as of mid-2026, has not been updated in about 10 years [7]. ACX alternates book (even years) and non-book (odd years) review contests, with prizes of at least $2,500/$1,000/$500 in 2026 [10]. LessWrong's Book Reviews tag lists about 405 posts [14]. [P, high]
10. **E-ink hardware turned over in 2025–2026.** The reMarkable 2 is discontinued, replaced by the **Paper Pure** ($399, 10.3", 226 ppi, no front light, announced May 2026) [71][72]. The **Paper Pro** list price rose from $579 at its 2024 launch to $629 [68][73]. Amazon's **Kindle Scribe (3rd gen, 11")** went on sale December 10, 2025 at $499.99, alongside the **Scribe Colorsoft** ($629.99) and a no-front-light Scribe ($429.99) [75]. Boox listed the **Note Air6 C** (10.3" color, Android 16, $579.99 US) in September 2026 [79][80]. [P, high]
11. **For PDFs, screen size dominates.** A US-letter PDF shown full-page on a 10.3" 4:3 e-ink screen renders 10-pt type at about 7.3 pt; on 13.3" at about 9.4 pt; on an iPad mini at about 5.4 pt. Margin-cropping recovers about 25% [I, calculation]. Zotero 10 (August 2026) added a **reflowable Reading Mode for PDFs** you can annotate in, which partly addresses the small-screen problem [54]. [P/I, high]
12. **Android e-ink (Boox) is the only mainstream e-ink platform that runs Libby, O'Reilly and arbitrary custom apps.** Kindle and reMarkable are closed. Kindle can still receive Libby loans in the US via "Send to Kindle (U.S. only)" [91]. Boox's current line runs Android 15–16 with Google Play [80][86]. [P, high]
13. **NotebookLM is now "Gemini Notebook".** The notebooklm.google domain 301-redirects to notebook.google, and the help center is titled "Gemini Notebook" [67][64]. I found no announcement and no rename date. Audio Overviews come in four formats (Deep Dive, Brief, Critique, Debate) and 80+ languages, with an English-only interactive mode. The free tier allows 100 notebooks × 50 sources, each up to 500,000 words or 200 MB, and EPUB is accepted [62][63][65]. [P, high]
14. **Cheap text-to-speech is now commodity.** ElevenReader gives 10 hours/month free (about a 400-page book) and costs $11/month or $99/year for unlimited imports [61]. Zotero 9 (April 2026) added Read Aloud for PDFs and EPUBs, with 2 hours/month of free standard voices [53]. Speechify Premium is $29/month billed monthly [60]. [P, high]
15. **Ergonomics evidence favors e-ink and front-lit, low-luminance reading at night.** In a small N = 12 study, visual fatigue rose only after LCD reading; e-ink matched paper [96]. Reading on a max-brightness iPad for about 4 hours before bed suppressed melatonin by about 55% and delayed sleep onset by about 10 minutes relative to a printed book (N = 12) [97]. The AOA recommends the 20-20-20 rule and placing screens 15–20° below eye level at 20–28 inches [95]. [P, medium: small samples]

---

## Detailed findings

### 1. Curation: how serious readers choose what to read

#### 1.1 The landscape of curation signals

| Signal | What it is | Scale (as of 2026) | Access / price | Status Oct 2026 | Source |
|---|---|---|---|---|---|
| **Open Syllabus** (Analytics, Galaxy, Course Matcher) | Citations extracted from college syllabi; Galaxy = recommender on the co-assignment graph | 32,941,092 syllabi; ~48B words; 94M citations (blog) vs 147M extracted citations (docs) [corrected in verification]; 4.4M unique titles; 8,620 schools (blog) vs "roughly 11,000" (docs) | Most data free; premium via VitalSource; data requests "usually involve a payment"; CC-NC open release promised, undated | Active; v2.14 released 2026-05-22 | [1][2][3] [P] |
| **Five Books** | Expert interviews, each on 5 books in a field | 1,700+ interviews, ~8,000 recommendations, 2+ new interviews/week | Free; Amazon affiliate funded | Active | [4] [P] |
| **Great Books canons** (St. John's College; Britannica *Great Books of the Western World*) | Fixed canonical curricula | St. John's: 4-year all-required list since 1937. GBWW: 54 vols (1952), 60 vols (1990), plus a *Syntopicon* index of 102 "Great Ideas" | Mostly public domain texts | Stable | [28][29] [P] |
| **Personal public shelves** (Patrick Collison; Gwern) | Individuals' annotated lists | Collison ~600 entries (green = "particularly great", light blue = "substantially above average"); Gwern: star-rated reviews since ~1997 | Free | Collison: "not been updated in around 10 years" (as of mid-2026). Gwern's book page last modified 2022-10-13 (stale?) | [7][8] [P] |
| **Long-form review communities** (ACX contest, LessWrong) | Reader-written long reviews, community-voted | LessWrong Book Reviews tag ~405 posts; ACX contest finalists often 2,000–10,000 words | Free | ACX 2026 = book reviews (deadline May 20); 2025 was "non-book" | [10][13][14] [P] |
| **Curated link newsletters** (The Browser) | 5 human-picked articles/day | Claims 150,000+ readers | Free daily newsletter plus paid tier; last price I could verify: $5/mo or $49/yr (Dec 2018, stale) | Active | [15][16][17] [P/S] |
| **Social cataloging** (Goodreads; StoryGraph) | Crowd ratings, shelves, Listopia lists | Goodreads ~150M registered members [S]; StoryGraph ~5M users (Jan 2026) [S, low] | Free; Goodreads API closed (Gwern cites "the removal of the API" as one reason he left in 2020) | Goodreads added a DNF shelf and Amazon shopping from shelves in March 2026 [S] | [8][18][19][20][98] |
| **Bookstore tables** | Physical store curation | Barnes & Noble under James Daunt (CEO since 2019) gave stores autonomy; CNN-reported +7% traffic; 60 new stores in 2024; bought Bay Area chain Books Inc. (Sept 2025, $3.25M) | Free to browse | Active | [26] [S via Wikipedia] |

**Observations.**

- **Syllabi are revealed preference by teachers.** A book that appears on many syllabi has passed a selection filter where someone stakes a semester of students' time on it. The co-assignment graph ("books taught together") is a ready-made similarity metric that does not depend on popularity among casual readers. The Galaxy productizes it [2]. [I, medium-high]
- **The curators have stalled; the curation hasn't.** Collison's page explicitly says it is kept "for posterity" and may be removed [7]. Gwern's book review page was last modified in 2022 [8]. The most-cited individual shelves are snapshots from the 2010s. The ACX and LessWrong review ecosystems remain active [10][14]. [P]
- **Tyler Cowen's method is mostly triage and volume.** In his own 2006 post: "The best way to read quickly is to read lots"; "I start ten or so books for every one I finish"; "I am ruthless in my discards"; he scanned the library's new-books shelf several times a week and a bookstore new-arrivals table weekly [6]. (stale? The post is from 2006, but later interviews repeat the "abandon freely" theme [S].) This is inspectional reading at industrial scale: many cheap samples, few deep reads. [P]
- **Michael Nielsen's syntopic recipe for a new field:** read the 5–10 most important papers deeply and many more shallowly [42]. That is a concrete, quantitative version of Adler's advice. [P]

#### 1.2 Curation vs. search vs. recommender systems: the evidence

| Finding | Study | Evidence quality | Source |
|---|---|---|---|
| A collaborative filter using only other people's ratings predicted which jokes a person would like better than their spouse or close friend did (reported 61% vs 57%). People still rated recommendations higher when they *believed* a human made them. Explaining the algorithm raised its ratings. | Yeomans, Shah, Mullainathan & Kleinberg 2019, *J. Behavioral Decision Making* | Experimental, but the domain is jokes, not books | [21][22] [S: press summaries; paper not opened] |
| Most of 9 state-of-the-art recommenders show popularity bias on book data. They fail "Niche" and "Diverse" readers despite their larger profiles. Bestseller-focused readers get the best recommendations. More personalization came with more popularity bias. | Naghiaei et al., Bias@ECIR 2022 (Book-Crossing dataset) | Offline evaluation; one dataset | [23] [P: abstract] |
| A non-personalized item-to-item recommender in Danish public libraries is strongly popularity-biased; exposure for less-popular author nationalities dropped by up to 40% depending on settings | CWI, ECIR 2026 | Audit study | [24] [S: search snippet] |
| Showing people what others downloaded increased both *inequality* and *unpredictability* of success. Quality only partly determined outcomes: "the best songs rarely did poorly, and the worst rarely did well, but any other result was possible." | Salganik, Dodds & Watts 2006, *Science* (14,341 participants) | Large field experiment (music, not books) (stale? but foundational) | [25] [P] |

**Synthesis [I, medium].**

- **Search** answers questions you already know how to ask.
- **Recommenders** answer "what do people like me like?", which is weak for exactly the reader this wiki targets: someone with idiosyncratic, research-driven tastes that popularity-biased models handle worst [23].
- **Expert curation** (Five Books, syllabi, a trusted person's shelf) answers "what does a person who knows this field think is foundational?". It carries a costly signal and a stated rationale, and Yeomans et al. suggest people trust and use exactly that [21].
- **The best design is probably a hybrid:** curator-weighted retrieval ("show me books recommended by ≥2 independent experts in field X and assigned on ≥50 syllabi"), with the recommender used for long-tail exploration and explanations always shown.
- **Social-proof counters** (Goodreads ratings counts) should be de-emphasized for discovery, given the Salganik result that they amplify noise [25].

### 2. Reading methods

#### 2.1 Adler: inspectional and syntopical reading, and the original "Syntopicon"

- *How to Read a Book* was first published in 1940. The heavily revised 1972 edition was co-authored with Charles Van Doren. It defines four levels: elementary, inspectional, analytical and syntopical. Part 4 covers syntopical reading: building understanding of a subject by reading several books on it [27] [P]. The 1972 edition's Appendix A lists 137 recommended entries [27] [P].
- The five syntopical steps, from the book [R, high]: (1) find the relevant passages; (2) bring the authors to terms, establishing a neutral vocabulary; (3) frame neutral questions; (4) define the issues, i.e. where authors answer differently; (5) analyze the discussion. Steps 2–4 are what LLMs are unusually good at, and what human readers find most laborious [I].
- **The Syntopicon is a 1952 precursor to an LLM syntopical tool.** Britannica's *Great Books of the Western World* (54 volumes, 1952; 60 volumes, 1990) included a two-volume *Syntopicon* that indexed 102 "Great Ideas". Indexers re-read each work with one idea in mind and collated passages, aiming at "random access" to the canon [28] [P]. Sales: only 1,863 sets in 1952; 50,000 in 1961 after switching to door-to-door sales; about 1 million total per Alex Beam [28] [S via Wikipedia]. **This is the closest historical analogue to a "cross-book idea index" and a strong design reference for an LLM-built version** [I].

#### 2.2 Skimming and inspectional reading: what eye-tracking shows

- **Duggan & Payne 2009** (*J. Exp. Psych.: Applied* 15(3):228–242) studied skimming expository text under time pressure as "foraging" [37] [P: bibliographic record]. Their **2011 CHI reanalysis** of the eye-movement data found that skimmers directed attention to the most important information, which improved later memory for the text's meaning. They propose readers **satisfice**: read a section until the rate of information gain falls below a threshold, then skip to the next section [38] [P: abstract]. My recollection of the 2009 paper is that skimming at twice normal speed lost comprehension relative to normal reading but beat reading only half the text normally [R, ~65%].
- **Strukelj & Niehorster 2018** (*J. Eye Movement Research*, N = 60) compared regular reading, thorough reading, skimming and spell checking on single pages. Skimming had shorter fixations, longer saccades, fewer regressions, shorter reading time spread evenly across the page, and **lower comprehension** (p < .001) [36] [P].
- **Practical upshot [I]:** skimming is a different task, not "faster reading". It works when the goal is triage or locating the important parts, and it is improved by structure such as headings, abstracts and topic sentences. That is exactly what an LLM-generated outline or "inspectional summary" supplies. Whether LLM outlines *improve* human skimming or *replace* it, with the retention cost that implies, is untested as far as I found.

#### 2.3 Speed reading

- **Rayner, Schotter, Masson, Potter & Treiman 2016**, *Psychological Science in the Public Interest* 17(1):4–34. Readers face "a trade-off between speed and accuracy". It is unlikely that readers can go from about 250 wpm to 500–750 wpm while understanding the text as well. If thorough understanding is not the goal, skimming or speed reading gets through text faster with moderate comprehension. Gains come from practice and language skill such as vocabulary, not from eye-movement tricks [35] [P: abstract].
- Press summaries add that eye movements account for at most about 10% of reading time, and that apps which prevent rereading (RSVP, Spritz-style) hurt comprehension [S, medium].
- **Implication for tool builders [I]:** do not build RSVP readers. Build triage tools: outlines, "is this worth reading" summaries, and novelty detection that helps users skip. That is "satisficing" support, not speed reading.

#### 2.4 Screen vs. paper: the meta-analyses

| Meta-analysis | Scope | Overall effect (− = paper better) | Moderators | Source |
|---|---|---|---|---|
| Delgado, Vargas, Ackerman & Salmerón 2018, *Educational Research Review* 25:23–38 | 2000–2017; 38 between- + 16 within-participant studies; 171,055 participants | g = −0.21 (both designs) | Larger under **time constraints** than self-paced. Present for **informational** or mixed texts, not for purely narrative ones. **Paper advantage increased with publication year.** | [30] [P: full text] |
| Kong, Seo & Zhai 2018, *Computers & Education* 123:138–149 | 17 studies, 2000–2016 | ≈ −0.21 (comprehension); no difference in reading speed | No significant moderators; gap trending smaller over time, but not significant | [30][33] [P via Delgado; S] |
| Clinton 2019, *J. Research in Reading* | 33 studies, 2,799 participants, all randomized | Small negative effect for screens; the range across the three meta-analyses is reported as g = 0.21–0.25 | Effect limited to **expository** texts; no difference for narrative. No reliable difference in reading time. Readers were **better calibrated (less overconfident) on paper**. | [31][32] [P/S] |
| Salmerón, Altamura, Delgado, Karagiorgi & Vargas 2024, *J. Educational Psychology* 116(2):153–172 | Handheld devices (tablets etc.) vs print | g = −0.113 (k = 38, between); g = −0.103 (k = 21, within) | Larger for **undergraduates** than school students, and for individually assessed participants | [34] [P: preprint] |

**Notes and caveats.**

- Clinton (now Clinton-Lisell), author of one of these meta-analyses, later wrote that her own subsequent experiments "have not observed the screen inferiority effect" [S: search snippet, Yahoo/Hechinger]. Treat individual studies as noisy.
- Almost all included studies used LCD/LED screens. I found **no meta-analysis isolating e-ink** [I]. The proposed mechanisms (the "shallowing hypothesis", worse metacognitive calibration on screens, scrolling disrupting spatial memory of the text) suggest that *behavior* (pace, scrolling, multitasking) matters more than pixel technology. That is inference, not established fact [I, medium].
- Effect-size context from Clinton-Lisell 2023: the *harm* from seductive details g = 0.33, the benefit of refutation texts g = 0.41, the benefit of graphics g = 0.39 [32]. [corrected in verification] So the medium effect is smaller than many instructional-design effects [P].

#### 2.5 Listening vs. reading (audiobooks, TTS) and reading-while-listening

| Study | Design | Result | Source |
|---|---|---|---|
| Clinton-Lisell 2022, *Review of Educational Research* | 46 studies (1955–2020), 4,687 participants, competent readers | No significant overall difference (g = 0.07, p = .23). Small reading advantage when reading was **self-paced** (g = 0.13, p = .049), not when experimenter-paced (g = −0.32, p = .16). Reading helped for inferential (g = 0.36) and general (g = 0.15) but not literal (g = −0.01) comprehension. [confirmed in verification: published abstract, RER 92(4):543–582, doi:10.3102/00346543211060871] **No study allowed listener-controlled pace.** | [39] [P: abstract via Crossref; S: Tech & Learning 2022-03-21] |
| Clinton-Lisell 2023, *Educational Research: Theory and Practice* 34(3):133–155 | 30 studies, N = 1,945, 62 effect sizes | Reading-while-listening vs reading only: g = 0.18 overall, but **only** when the experimenter set the reading pace (g = 0.41). Self-paced: g = 0.06, 95% CI [−0.07, 0.19], not significant. | [40][32] [P] |

**Implications [I].**

- For competent adult readers, audio is a near-substitute for *narrative* and general comprehension. For dense expository material where you need to stop, re-read and compare, self-paced visual reading keeps a small edge.
- Audio is ideal for the *survey* mode (walking, commuting) and for *re-exposure*. It is weaker for deep study.
- "Read along with TTS" (Speechify-style highlighting) shows no measurable comprehension benefit for self-paced readers [40]. Its value is pacing, attention and accessibility, which are not measured in these studies.

#### 2.6 Retention: spaced repetition, retrieval practice, the mnemonic medium

**Learning-technique evidence (Dunlosky et al., *American Educator*, Fall 2013, summarizing their 2013 PSPI monograph)** [41] [P]:

| Utility | Techniques |
|---|---|
| **High** | Practice testing; distributed practice |
| **Moderate** | Interleaved practice; elaborative interrogation; self-explanation |
| **Low** | Summarization; highlighting/underlining; rereading; keyword mnemonic; imagery for text |

(stale? 2013, but this is the standard reference, and later meta-analyses on testing and spacing broadly agree [R].)

**Spacing effect sizes cited by Gwern** (essay last modified 2019-05-17) [9] [P]:
- Donovan & Radosevich 1999 meta-analysis: d = 0.42.
- Kornell 2009: spacing beat massing for 90% of participants, yet 72% believed massing was more effective.
- Roediger & Karpicke 2006: about 60% vs. 40% recall at one week, testing vs. restudy.

**Tools.**

| Tool | What it is | Status / price (Oct 2026) | Evidence | Source |
|---|---|---|---|---|
| **Anki + FSRS** | Open-source SRS; FSRS scheduler opt-in since 23.10; default desired retention 90%; recommended max 97% | Free (desktop, AnkiWeb, AnkiDroid); AnkiMobile paid [R] | srs-benchmark: FSRS-6 log loss 0.3460 vs ACT-R 0.4033, HLR 0.4694, Ebisu v2 0.4989; neural RWKV models do better (0.2773) | [46][47] [P] |
| **Orbit** (Andy Matuschak) | Embeds review prompts in web texts ("mnemonic medium"); generalization of Quantum Country | Open-sourced; "experimental platform … first and foremost a vehicle for research" | Quantum Country: after 5+ days of demonstrated retention, median accuracy ~95%; lapses <2% of repetitions for most readers. Correlational, plus one informal 2019 experiment (delayed-review readers −4 pp vs control +7 pp) | [44][45] [P/S] |
| **MarginNote 4** | PDF/EPUB reader + mind maps + FSRS flashcards + AI summaries/quiz generation | iPad/Mac; 14-day trial; lifetime or subscription (prices not on homepage) | Vendor claims ~30% less review time than "traditional Anki schedulers" (unverified marketing) | [58] [P: vendor claim] |
| **Readwise** | Resurfaces highlights from Kindle, Apple Books etc. via Daily Review; Reader app | Full $9.99/mo billed annually ($119.88/yr) or $12.99 monthly; Lite $5.59/mo; 50% academic discount; 30-day trial | Daily Review of highlights is closer to *rereading* (low utility) than retrieval, unless highlights are converted to cloze/Q&A [I via 41] | [51] [P] |

**Nielsen's practice (2018)** [42] [P]:
- About 10,000 cards over about 2.5 years, at roughly 15–20 minutes per day.
- Estimated lifetime review cost of 4–7 minutes per card over 20 years, versus about 2 hours per card with conventional weekly flashcards.
- Reading the AlphaGo paper with Anki took several hundred cards over a few days spread across weeks, after which follow-up papers were easy to read.
- Quote: "Anki makes memory a *choice*, rather than a haphazard event."

#### 2.7 "Read less, deeper" vs. "browse widely": the debate

| Position | Proponent and claim | Source |
|---|---|---|
| **Browse widely, abandon freely** | Cowen: speed comes from volume and background knowledge; start ~10 books per finish; "ruthless in my discards" | [6] [P] |
| **Engage, don't just read** | Karnofsky (Cold Takes, 2021-10-20): "the value of reading a book once (without active engagement) is awkwardly small". Reading reviews and critiques, re-reading after time passes, and writing your own summary yield more understanding per hour. He later clarified this applies to casual learning outside one's expertise. | [48] [P] |
| **Books are a broken medium** | Matuschak (2019-05-11): "books are surprisingly bad at conveying knowledge, and readers mostly don't realize it". Rejects "transmissionism"; proposes new media that embody learning science, e.g. Quantum Country | [43] [P] |
| **Forgotten reading still trains the model** | Paul Graham (Dec 2014): "Reading and experience train your model of the world", even when specifics are forgotten. Argues for rereading important books | [49] [P] |
| **Deep core + shallow periphery** | Nielsen: 5–10 key papers deep, many shallow | [42] [P] |

**Synthesis [I].** These positions are compatible once reading is split into modes:
- **survey** (wide, cheap, abandon-friendly: Cowen);
- **deep study** of a small core (Nielsen, Adler's analytical reading);
- **active engagement** artifacts such as critiques, summaries, cards and reviews (Karnofsky, Matuschak);
- **periodic re-exposure** (Graham, spaced repetition).

The debate is mostly about time allocation across modes. LLM tools mainly lower the cost of survey and engagement artifacts, and possibly of deep study, if they are used as Socratic partners rather than substitutes.

**A caution on LLM substitution.** Kosmyna et al. (MIT Media Lab, arXiv 2506.08872, revised 2025-12-31; 54 participants, 18 in the crossover session) found that LLM-assisted *essay writing* showed the weakest EEG connectivity, and that LLM users struggled to quote their own essays [50] [P]. This is a writing task, a small sample, and not peer-reviewed as of the arXiv version. It is suggestive for "summary instead of reading" workflows, but not direct evidence [I, low-medium].

#### 2.8 Annotation and note-taking tools (Oct 2026)

| Tool | Core use | Platforms | Price (Oct 2026) | Notable 2025–26 change | Source |
|---|---|---|---|---|---|
| **Zotero** | Reference manager plus PDF/EPUB/snapshot reader and annotations | Win/Mac/Linux, iOS, Android | Free; paid storage (prices not verified) | Zotero 8 (announced 2026-01-22 [P]) [corrected in verification], **9 (2026-04-10): Read Aloud** (PDF/EPUB/snapshots; 2 h/mo free standard voices; unlimited standard + up to 2 h premium for Storage subscribers). **10 (2026-08-17): reflowable "Reading Mode" for PDFs**, smarter Read Aloud (skips citations, headers, tables, equations), advanced search with annotation conditions. Read Aloud on iOS (2026-10-05). Faster release cycle announced 2026-01-22. | [52][53][54] [P] |
| **Readwise / Reader** | Highlight aggregation, spaced resurfacing, read-later | Web, iOS, Android | $9.99/mo (annual) | (Readwise outlived Pocket, which Mozilla shut down [59]; Omnivore also closed in late 2024 [R]) | [51][59] [P] |
| **Hypothesis** | Social web/PDF annotation; LMS integration | Web | Pricing page not captured | Now positioned as "social annotation platform for higher education", 300+ institutions; footer "Annotation Unlimited, PBC". Vendor outcome claims (+32% retention etc.) are uncited. | [56] [P] |
| **LiquidText** | Multi-document "workspace": pull excerpts, link across docs | iPadOS, Windows, macOS | Separate pricing page (not captured) | No AI features mentioned on homepage | [57] [P] |
| **MarginNote 4** | Reader → cards → mind maps → FSRS review; AI summaries/quiz | iPad, Mac | Trial; lifetime/subscription | FSRS built in; "immersive" recall mode | [58] [P] |
| **Obsidian** | Local Markdown notes / PKM | All | Free; Sync $4/mo (annual); Publish $8/mo (annual); optional commercial $50/user/yr | — | [55] [P] |

**Pocket shutdown.** Mozilla's farewell page confirms the closure, citing a shift in "browsing habits" [59] [P]. I recall the dates as July 8, 2025 for the shutdown and an export deadline in October 2025 [R, ~85%].

### 3. Devices

#### 3.1 E-ink tablets and note-takers (US prices, October 2026)

| Device | Screen | Color? | Front light | OS / apps | US price | Launched / status | Source |
|---|---|---|---|---|---|---|---|
| **reMarkable Paper Pro** | 11.8", 2160×1620 (≈229 ppi [I]), "Canvas Color" (E Ink Gallery 3) | Yes | Yes | Closed reMarkable OS; PDF, ebooks; Word/Google Docs → notebooks | **$629** with Marker; $679 with Marker Plus | Launched Sept 2024 at **$579** | [68][73] [P] |
| **reMarkable Paper Pro Move** | 7.3" Canvas Color | Yes | Yes [S] | Closed | **$449** / $499 (Marker Plus) / $549–599 folio bundles | Launched 2025-09-03 | [69] [P]; [S: launch date] |
| **reMarkable Paper Pure** | 10.3" Canvas (E Ink Carta 1300 [S]), 1872×1404, 226 ppi | No | **No** | Closed; USI-type Marker (reMarkable 2 pens incompatible) | **$399**; $449 with Marker Plus + Sleeve Folio | Announced 2026-05-06; ships early June 2026; **replaces the discontinued reMarkable 2** | [70][71][72] [P/S] |
| reMarkable **Connect** subscription | — | — | — | Handwriting search, AI handwriting-to-text, Send to Slack/Miro | $3.99/mo or $39/yr; 50-day trial | — | [71][72] [S] |
| **Kindle Scribe (3rd gen)** | 11", 400 g, 5.4 mm | No | Yes | Closed Kindle OS; Google Drive and OneDrive import; annotated-PDF export; OneNote export; Send to Kindle (PDF, DOCX, TXT, EPUB) | **$499.99** (TechCrunch, Feb 2026, lists the non-color Scribe at $549.99; perhaps the 64 GB tier [I, ~60%]) | On sale 2025-12-10 | [74][75][76] [P/S] |
| **Kindle Scribe Colorsoft** | 11" color (filter + nitride LEDs) | Yes | Yes | As above; AI notebook search ("Ask Notebooks"); **Story So Far** and **Ask This Book** (US only) | **$629.99** (32 GB) / $679.99 (64 GB) | On sale 2025-12-10; "Fig" color Jan 2026 | [74][75][76] [P/S] |
| **Kindle Scribe (no front light)** | 11" | No | No | As above | **$429.99** | Slipped to 2026; Amazon lists it as a current model | [74][75] [P/S] |
| **Kobo Elipsa 2E** | 10.3" E Ink Carta 1200, 1404×1872, **227 ppi** | No | Yes (ComfortLight PRO) | Closed Kobo OS; Dropbox and Google Drive; write on ebooks/PDFs; built-in OverDrive library borrowing [R, high] | **$399.99** (incl. Stylus 2) | Launched April 2023; no successor announced; reviewers call it stagnant | [77][78] [P/S] |
| **Boox Note Air6 C** | 10.3" Kaleido 3; 300 ppi B/W, 150 ppi color | Yes | Yes (warm/cold) | **Android 16**, Google Play, 6 GB/64 GB, microSD; built-in "AI Assistant" for selected text | **$579.99** (US; $656.99 with keyboard cover) | Listed 2026-09-15 | [79][80] [P] |
| **Boox Note Mini C** | 8.52" Kaleido 3; 300/150 ppi | Yes | Yes | Android 16, Google Play, 300 g | **$579.99** | Listed 2026-09-15; ships ~Oct 2026 | [79][81] [P] |
| **Boox Note Air5 C** | 10.3" Kaleido 3; 300/150 ppi | Yes | Yes | Android 15, EMR Pen3 | **$529.99** | Oct 2025 | [79][87] [P/S] |
| **Boox Go 10.3 (Gen II)** | 10.3" Carta 1200, 2480×1860, **300 ppi** | No | Lumi edition only | Android 15, 4 GB/64 GB, Google Play | **$419.99**; Lumi (front light) **$449.99** | Mar 2026 | [79][86][88] [P] |
| **Boox Note Max** | 13.3", 3200×2400, 300 ppi | No | **No** | Android 13 | **$629.99** | Oct 2024 | [79][83] [P] |
| **Boox Tab X C** | 13.3" Kaleido 3; 300 ppi B/W, 150 ppi color | Yes | Yes | Android 13 | **$819.99** | Apr 2025 | [79][84] [P] |
| **Boox Palma 3** | 6.13" phone-shaped, 300 ppi | No | Yes | Android 16, 6 GB/128 GB, 195 g | **$339.99** | Listed 2026-09-15 | [79][82] [P] |

Boox device listings are from Boox's own storefront catalog (`products.json`) and product pages fetched 2026-10-15 [79]. "Listed" dates are Shopify publish dates, not necessarily ship dates.

**Device takeaways.**

1. **Openness.** Boox is the only mainstream e-ink line with Google Play. It is the only one that runs **Libby** natively and the **O'Reilly** Android app (1M+ downloads, updated 2026-10-14 [92]), plus any custom reading app you build [80][86][89]. Kindle gets library books only through Libby's "Send to Kindle (U.S. only)" [91]. Kobo has built-in OverDrive [R]. reMarkable has no library integration [I, high].
2. **PDF size.** For academic PDFs, the 13.3" class (Note Max, Tab X C) is the only e-ink size that shows a letter/A4 page at near-print scale; see §3.3.
3. **Color e-ink costs resolution.** Kaleido 3 color is 150 ppi versus 300 ppi monochrome [80][84]. For text-heavy reading, monochrome Carta 1200/1300 panels remain sharper [I, high].
4. **Price drift upward [P].** Paper Pro rose from $579 to $629. The iPad mini 128 GB is now $599 (see 3.2); I recall $499 at its October 2024 launch [R, ~85%]. I did not verify the cause (tariffs and memory costs are plausible [I, low]).
5. **AI is arriving on-device in closed ecosystems.**
   - Kindle: Ask This Book and Story So Far, US only [74].
   - Boox: an AI Assistant on selected text [80].
   - reMarkable: AI handwriting conversion via Connect [72].
   None of these exposes an API for custom LLM workflows [I, medium].

#### 3.2 LCD/OLED alternatives and monitors

| Device | Key specs | Price | Notes | Source |
|---|---|---|---|---|
| **iPad mini (A17 Pro)** | 8.3", 2266×1488, 326 ppi, 500 nits, 293 g; Apple Pencil Pro / USB-C | **$599** (128 GB Wi-Fi); $699 (256 GB); $899 (512 GB) | Best-in-class handheld for EPUB plus apps (Libby, Kindle, Zotero, Readwise Reader, MarginNote, LiquidText). Too small for full-page PDFs. | [93][94] [P] |
| **Boox Mira Pro** (e-ink monitor) | 25.3" e-ink, 3200×1800, 145 ppi; HDMI/DP/USB-C; VESA | **$1,799.99** (monochrome); color version listed | A desk e-ink monitor for long reading sessions on a computer. Expensive and niche. | [79][85] [P] |
| **Conventional large monitors** | e.g. 27–32" 4K in portrait orientation | (not researched) | A portrait 4K panel shows a two-page PDF spread or one page at above-print size. The AOA distance guidance applies. | [95] [I] |

#### 3.3 PDF and EPUB quality: the arithmetic [I, calculation]

A US-letter page (8.5×11 in) displayed whole, with 10-pt body text:

| Screen | Physical area (portrait) | Full-page scale → 10 pt renders as | Margins cropped (6.5×9 in text block) → |
|---|---|---|---|
| 13.3" 4:3 (Note Max, Tab X C) | 10.64 × 7.98 in | 0.94 → **9.4 pt** | 1.18 → 11.8 pt |
| 11.8" 4:3 (Paper Pro) | 9.44 × 7.08 in | 0.83 → 8.3 pt | 1.05 → 10.5 pt |
| 11" (Kindle Scribe; 4:3 assumed) | 8.80 × 6.60 in | 0.78 → 7.8 pt | 0.98 → 9.8 pt |
| 10.3" 4:3 (Note Air6 C, Go 10.3, Elipsa 2E, Paper Pure) | 8.24 × 6.18 in | 0.73 → **7.3 pt** | 0.92 → 9.2 pt |
| 8.52" (Note Mini C; 4:3 assumed) | 6.82 × 5.11 in | 0.60 → 6.0 pt | 0.76 → 7.6 pt |
| 8.3" iPad mini (≈3:2) | 6.94 × 4.56 in | 0.54 → **5.4 pt** | 0.70 → 7.0 pt |

**Consequences.**

- On ≤10.3" screens, two-column papers need column-by-column zoom or reflow. Boox's NeoReader supports cropping and reflow; Zotero 10's Reading Mode reflows PDFs while keeping annotations [54].
- EPUB reflows natively on every device, so it is a non-issue at any size.
- **For builders:** converting PDFs to clean, reflowable EPUB/HTML (with equations and figures preserved) is one of the highest-leverage small-screen interventions.

#### 3.4 Text-to-speech and "audio-first" tools (Oct 2026)

| Tool | What it reads | Free tier | Paid | Notes | Source |
|---|---|---|---|---|---|
| **ElevenReader** (ElevenLabs) | PDF, DOCX, EPUB, Markdown, TXT, web links, scanned text | **10 h/month** text-to-audio (~400-page book), 1,000+ voices, up to 4.0× | **Ultra $11/mo or $99/yr**: unlimited imports, offline, custom voices, smart import that skips headers and footers | Audio export only via web/ElevenLabs apps; 5M+ installs | [61] [P] |
| **Speechify** | Docs, web, scans | 10 "robotic" voices, up to 1.5× | **Premium $29/mo** (monthly billing; yearly "save 60%"), up to 5×, 1,000+ voices, AI summaries/chat, AI podcasts (add-on) | Most expensive option | [60] [P] |
| **Zotero Read Aloud** | PDFs, EPUBs, snapshots in your library | 2 h/mo standard voices (free account) | Storage subscribers: unlimited standard, ~2 h premium | Skips citations, headers, footers, tables, equations; "annotate the sentence you just heard"; position syncs; iOS since 2026-10-05 | [53][54][52] [P] |
| **Gemini Notebook (ex-NotebookLM) Audio Overviews** | Generated *discussion* of sources (not the text itself) | Free (Standard limits) | AI Plus 2×, AI Pro 4×, AI Ultra 5–20× Pro limits | Formats: **Deep Dive** (2 hosts), **Brief** (1 speaker, <2 min), **Critique**, **Debate**. Lengths Shorter/Default/Longer (Longer English-only). 80+ languages. Interactive "Join" mode (English). "may contain inaccuracies". | [62][63][66] [P] |
| **OS built-ins** (iOS Speak Screen / Safari "Listen to Page"; Android "Reading mode" / Chrome "Listen to this page") | Any on-screen text | Free | — | Not verified this session; quality typically below neural TTS | [R, medium] |

**Gemini Notebook (formerly NotebookLM) facts** [P]:
- Free "Standard" tier: 100 notebooks × 50 sources.
- Plus: 200 × 100. Pro: 500 × 300. Ultra: 500 × 500–600 [62].
- Each source can be up to 500,000 words or 200 MB.
- Sources can be PDF, **EPUB**, Google Docs/Slides/Sheets, web URLs (text only; paywalled pages fail), YouTube transcripts, and audio files [65].
- "Downloads may be restricted for notebooks with Play Books ebook sources" [63], which implies a Play Books integration.
- Data is not used for training unless you give feedback [64].
- Quotas are compute-based, refresh every 5 hours, and have a weekly cap [66].

**Audio Overviews as reading substitutes [I, medium].** An Audio Overview is a *derivative* (a summary-conversation), not the text. The listening-vs-reading evidence (§2.5) applies to hearing the *same* text, not a summary. Treat Audio Overviews as an inspectional-reading aid: "what is this book about; is it worth my time; what are the main claims". Use them for warm-up before deep study or for review after it. Do not treat them as equivalent to reading. No study I found measured comprehension or retention from AI audio summaries versus reading the source.

#### 3.5 Ergonomics of long reading sessions

| Finding | Detail | Evidence | Source |
|---|---|---|---|
| E-ink ≈ paper for visual fatigue; LCD worse | Benedetto et al. 2013 (PLOS ONE): N = 12, >1 h sessions. Visual fatigue rose only after LCD (Kindle Fire HD); blink rate fell most on LCD; e-ink and paper did not differ | Small within-subjects study (stale? 2013; hardware has changed) | [96] [P] |
| Evening light-emitting reading disrupts sleep | Chang et al. 2015 (PNAS): N = 12, ~4 h before bed for 5 nights; iPad at max brightness vs printed book. Melatonin suppressed 55.12%; melatonin onset >1.5 h later; sleep latency 25.65 vs 15.75 min; less REM; sleepier next morning | Tightly controlled inpatient crossover; small N; max brightness | [97] [P] |
| Screen placement and breaks | AOA: center of screen 15–20° below eye level, 20–28 in away; **20-20-20 rule**; after 2 h continuous use, rest eyes 15 min; risk greatest at ≥2 h/day continuous use | Professional guidance | [95] [P] |

**Practical protocol [I].**
- Front-lit e-ink (warm light at night) for long-form evening reading. Avoid max-brightness LCD within hours of bed [97].
- For desk reading, use a large monitor or an e-ink monitor positioned per the AOA, or a 13.3" e-ink tablet on a stand at the same angle.
- Use 25–50-minute blocks with distance-gaze breaks [95].
- Use a page-turn remote or a tilted stand to reduce neck flexion. That last point is my inference; I found no study specific to e-ink tablets.

---

## Deliverable: reading-mode × tool/device/method matrix

**Evidence grades:**
- **A**: multiple meta-analyses or large consistent literature.
- **B**: at least one controlled experiment or large benchmark, or a single meta-analysis with caveats.
- **C**: practitioner consensus, expert testimony or vendor claims.
- **D**: my inference; untested.

| Reading mode | Goal | Best methods (grade) | Best tools / software (grade) | Best devices (grade) | Avoid (grade) |
|---|---|---|---|---|---|
| **1. Survey / skim / triage** ("inspectional reading") | Decide what deserves deep reading; map a field | Adler inspectional reading: title, ToC, index, intro and conclusion, skim chapters (C). Satisficing skim (B: Duggan & Payne). Abandon freely (C: Cowen). Read reviews and critiques first (C: Karnofsky). Use curator signals over crowd ratings (B: Naghiaei; Salganik). | Open Syllabus Galaxy and co-assignment (C). Five Books (C). Gemini Notebook "Brief" Audio Overview or chat over many sources (D). LLM-generated structural outlines (D). Library "new books" shelves and tables (C). | Large monitor or iPad for fast flipping (D). Audio while walking (B for comprehension parity of *same text*; D for summaries). E-ink is poor here: slow page flips and search (C). | RSVP/"speed reading" apps (A-/B: Rayner). Popularity-ranked lists as the main filter (B). |
| **2. Targeted lookup** | Find a specific fact, passage, definition or argument | Formulate the question first; check the original passage (C) | Full-text search across a personal library (Zotero advanced search, Readwise) (C). Source-grounded LLM Q&A with inline citations (Gemini Notebook; Kindle "Ask This Book" for supported books) (C/D). Syntopicon-style idea indexes (C historical). | Laptop or monitor (D). iPad mini for mobile lookup (D). | Trusting an LLM answer without opening the cited passage (D; vendors warn of inaccuracies [63]). |
| **3. Deep study** (analytical and syntopical reading) | Understand, evaluate, integrate | Self-paced, no time pressure (A: Delgado moderator). Paper or e-ink for expository texts (A for paper > LCD; D for e-ink specifically). Self-explanation and elaborative interrogation (B/moderate: Dunlosky). Write your own summary or critique (C: Karnofsky). Nielsen's 5–10 core papers deep (C). Syntopical: neutral terms, questions, issues (C: Adler). | Zotero (annotate, Reading Mode reflow) (C). LiquidText or MarginNote for multi-document excerpts (C). LLM as Socratic interlocutor, not summarizer (D; caution [50]). | 13.3" e-ink for PDFs (D, from scale arithmetic). 10.3" e-ink for EPUB/reflowed text (D). Printed paper for key texts (A for comprehension; B for calibration [31]). | Scrolling LCD under time pressure (A). Reading-while-listening when self-paced: no benefit (A-/B [40]). Highlight-only reading (A-/high confidence low utility [41]). |
| **4. Review / retention** | Keep what you learned available | Practice testing + spacing (A: "high utility" [41]). Turn highlights into questions (D, derived from A). Periodic rereading of key books (C: Graham) at spaced intervals (D). | Anki with FSRS at 85–90% desired retention (B: benchmark [47]; A for underlying spacing). Orbit / mnemonic-medium prompts embedded in text (B-/C: correlational [44]). MarginNote 4 (C). Readwise Daily Review *only if* converted to recall prompts (D). | Phone for 15–20 min/day reviews (C: Nielsen). Audio re-exposure via TTS during commutes (D). | Highlight resurfacing as rereading (A-/low utility). Cramming (A). |
| **Cross-cutting: ergonomics** | Sustain long sessions | 20-20-20; breaks after 2 h (C: AOA) | Warm front light at night (B: Chang) | E-ink ≈ paper for fatigue (B, small N) | Max-brightness LCD in the evening (B) |

---

## Numbers that matter

| Quantity | Value | Date | Source | Status |
|---|---|---|---|---|
| Open Syllabus syllabi | 32,941,092 (~48B words) | v2.14, 2026-05-22 | [1][2] | P |
| Open Syllabus citations / unique titles | 94M (blog) or 147M extracted (docs) / 4.4M [corrected in verification] | 2026-05-22 | [1][2] | P (conflict) |
| Open Syllabus institutions | 8,620 (blog) vs ~11,000 (docs) | 2026 | [1][2] | P (conflict) |
| Open Syllabus research dataset | ~7.5M syllabi, 2010–2017, for academic/nonprofit research | announced 2025-05-29 | [3] | P |
| Bot share of traffic at open-data providers (panel figure, not specific to OS) | 86% | 2026 | [1] | P (secondary within primary) |
| Five Books | 1,700+ interviews; ~8,000 recommendations; ≥2 new/week | Oct 2026 | [4] | P |
| Collison bookshelf | ~600 entries; ~half read; not updated in ~10 years | mid-2026 | [7] | P |
| *Great Books of the Western World* | 54 vols (1952), 60 vols (1990); Syntopicon of 102 ideas; 1,863 sets sold in 1952 | — | [28] | S |
| ACX review contest prizes | 2021: $5,000/$2,500/$1,250 (+$1,250 readers' choice); 2026: ≥$2,500/$1,000/$500 | 2021-07-10; 2026-02-20 | [11][10] | P |
| LessWrong Book Reviews tag | ~405 posts | Oct 2026 | [14] | P |
| The Browser readers | 150,000+ (claimed) | Oct 2026 | [15] | P (vendor claim) |
| Salganik music market | 14,341 participants | 2006 | [25] | P |
| Screen vs paper (Delgado) | g = −0.21; 54 studies; 171,055 participants | 2018 | [30] | P |
| Screen vs paper, handheld (Salmerón) | g = −0.113 (k = 38) / −0.103 (k = 21) | 2024 | [34] | P |
| Range of three earlier meta-analyses | g = 0.21–0.25 favoring paper | 2018–2019 | [32] | P |
| Listening vs reading (Clinton-Lisell) | 46 studies, 4,687 participants; overall n.s. (g = 0.07, p = .23); self-paced reading g = 0.13 [confirmed in verification] | 2022 | [39] | P |
| Reading-while-listening, self-paced | g = 0.06, CI [−0.07, 0.19] | 2023 | [40] | P |
| Typical reading rate / speed-reading claim | ~250 wpm; doubling or tripling to 500–750 wpm unlikely without comprehension loss | 2016 | [35] | P |
| Spacing meta-analytic effect | d = 0.42 (Donovan & Radosevich 1999) | cited 2019 | [9] | P (via Gwern) |
| Nielsen's Anki load | ~10,000 cards / 2.5 yr; 15–20 min/day; 4–7 min lifetime per card | 2018 | [42] | P |
| FSRS-6 benchmark log loss | 0.3460 (vs ACT-R 0.4033; HLR 0.4694) on ~10k collections | 2026 page | [47] | P |
| Anki FSRS default desired retention | 90% (warning above 97%) | Oct 2026 | [46] | P |
| Quantum Country retention after 5+ days demonstrated | median ~95% accuracy; lapses <2% of repetitions (median reader) | ~2021–22 notes | [44] | S |
| Readwise Full | $9.99/mo annual ($119.88/yr); $12.99 monthly | Oct 2026 | [51] | P |
| Obsidian Sync / Publish | $4 / $8 per month (annual billing) | Oct 2026 | [55] | P |
| ElevenReader free / Ultra | 10 h/mo free; $11/mo or $99/yr | Oct 2026 | [61] | P |
| Speechify Premium | $29/mo (monthly billing) | Oct 2026 | [60] | P |
| Zotero free Read Aloud | 2 h/mo standard voices | 2026-04-10 | [53] | P |
| Gemini Notebook free tier | 100 notebooks × 50 sources; ≤500k words or 200 MB per source | Oct 2026 | [62][65] | P |
| reMarkable Paper Pro | $629 (was $579 at Sept 2024 launch) | Oct 2026 | [68][73] | P |
| reMarkable Paper Pure | $399; 10.3"; 226 ppi; 360 g [S] | May 2026 | [70][71][72] | P/S |
| reMarkable Connect | $3.99/mo or $39/yr | 2026 | [71][72] | S |
| Kindle Scribe / Colorsoft / no-light | $499.99 / $629.99 / $429.99; 11", 400 g, 5.4 mm | Dec 2025 | [75][74] | S/P |
| Kobo Elipsa 2E | $399.99; 227 ppi | Oct 2026 | [77] | P |
| Boox Note Air6 C | $579.99; 10.3"; 300/150 ppi; Android 16; 440 g | Sept 2026 | [80] | P |
| Boox Note Max | $629.99; 13.3"; 3200×2400 (300 ppi); Android 13 | Oct 2026 | [83] | P |
| Boox Mira Pro e-ink monitor | $1,799.99; 25.3"; 3200×1800 (145 ppi) | Oct 2026 | [85] | P |
| iPad mini (A17 Pro) | $599 (128 GB); 8.3"; 326 ppi; 293 g | Oct 2026 | [93][94] | P |
| Letter PDF on 10.3" e-ink | 10-pt → ~7.3 pt full-page; ~9.2 pt margin-cropped | — | §3.3 | I |
| Evening iPad reading vs book | melatonin −55%; sleep latency +~10 min | 2015 | [97] | P |
| AOA 20-20-20 / placement | every 20 min look 20 ft for 20 s; 15–20° below eye level; 20–28 in | Oct 2026 | [95] | P |

---

## Surprises and recent changes (2024–2026)

1. **NotebookLM has been rebranded "Gemini Notebook".** notebooklm.google redirects (301) to notebook.google, and the help center (support.google.com/gemininotebook) uses the new name throughout. It also mentions notebooks inside Gemini Apps and Google Search AI Mode [67][64]. I could not find the rename date or announcement [P for current state; date unknown].
2. **Zotero became a reading app with TTS and reflow.** Zotero moved to a faster release cycle (announced 2026-01-22): Zotero 9 in April 2026 (Read Aloud) and Zotero 10 in August 2026 (Reading Mode reflow for PDFs, advanced search). Read Aloud reached iOS on 2026-10-05 [52][53][54]. The free, open-source reference manager now covers a chunk of what Speechify and LiquidText sell.
3. **The reMarkable 2 is gone.** The Paper Pure ($399, no front light) replaced it in May 2026, and old pens don't work with it [71][72].
4. **E-ink and tablet list prices rose.** Paper Pro went from $579 to $629 [68][73]. The iPad mini 128 GB is $599 [94], versus my recollection of $499 at its 2024 launch [R].
5. **Closed e-readers are getting LLM features:** Kindle's Ask This Book, Story So Far and AI notebook search (US-only) [74][76], Boox's AI Assistant [80], and reMarkable's AI handwriting conversion [72].
6. **The screen-inferiority effect did not shrink over time.** Delgado et al. found the paper advantage *increased* with publication year, contrary to the "digital natives will adapt" expectation [30]. But the handheld-specific meta-analysis found about half the effect size [34].
7. **One meta-analysis author partly walked back the finding.** Clinton-Lisell reported that her own later experiments did not observe screen inferiority [S].
8. **Patrick Collison's widely cited bookshelf is effectively archived.** As of mid-2026 it says it has not been updated in about 10 years [7].
9. **Open Syllabus is under AI-scraper pressure and changing its business model.** It added Cloudflare human-verification prompts (since March 2026). Data requests rose from about one per month to several per week. Premium access is routed through VitalSource, and a CC-NC open data release is promised [1][3].
10. **Barnes & Noble bought Books Inc.** (a Bay Area chain) in September 2025 for $3.25M, after a turnaround built on store-level curation [26] [S]. This is relevant for physical browsing in the Bay Area.
11. **Read-later consolidation.** Mozilla shut down Pocket [59], and Omnivore closed in late 2024 [R]. Readwise Reader is one of the few large survivors [I].
12. **Gemini Notebook accepts EPUB** and mentions Play Books ebook sources [65][63]. Purchased ebooks may increasingly flow into LLM notebooks inside Google's ecosystem [I].
13. **Boox is shipping Android 16 on e-ink** (Note Air6 C, Note Mini C, Palma 3, September 2026) [80][81][82]. Some 2024–25 13.3" models remain on Android 13 [83][84].

---

## Contested or uncertain points

- **Size and mechanism of screen inferiority.** Estimates range from g ≈ −0.10 (handheld) to −0.25 (mixed screens). Is it the medium (light-emitting screens, scrolling) or behavior (shallower processing, overconfidence)? Clinton's calibration finding favors behavior. **E-ink has not been isolated meta-analytically** [30][31][34]. Confidence that e-ink matches paper for comprehension: [~55%], no direct evidence.
- **Listening vs reading at modern speeds.** No study in the 2022 meta-analysis let listeners control pace [39]. Whether 1.5–2× audio preserves comprehension for expository text is open. I did not verify specific speeded-audio studies in this session.
- **Clinton-Lisell 2022 exact effect sizes.** g = 0.07 overall (p = .23) and g = 0.13 self-paced (p = .049) match the published abstract (Crossref record for doi:10.3102/00346543211060871); the RER full text still returned 403. [corrected in verification]
- **Duggan & Payne 2009 specifics** ("skim beats reading half") are from my recollection [R, ~65%].
- **Mnemonic medium causality.** Quantum Country retention data are correlational; the only causal test was informal [44].
- **LLM summaries harming learning.** Kosmyna et al. concerns writing, not reading, with small N and preprint status [50]. Extrapolation to Audio Overviews is speculative.
- **Recommender vs human.** Yeomans et al. is about jokes [21]. Book-specific head-to-head tests of expert lists vs algorithms on reader satisfaction were not found.
- **Prices with conflicting reports:**
  - Kindle Scribe non-color: $499.99 [75] vs $549.99 [76], possibly storage tiers [I, ~60%].
  - Paper Pro Move folio bundles show two prices on reMarkable's own page [69].
  - The Browser's current price is unverified; the last firm figure is from 2018 [17].
- **Open Syllabus institution count:** 8,620 vs ~11,000 [1][2]. These probably count different things: schools with syllabi in the release vs all sources [I].
- **Open Syllabus citation count:** the v2.14 blog says 94 million citations; the dataset documentation says 147 million extracted citations to books and articles, across the same 4.4 million unique works [1][2]. The two may count matched vs all extracted citations [I]. [corrected in verification]
- **StoryGraph and Goodreads user counts** are secondary or low-quality [20][98].
- **Gemini Notebook rename date and scope.** Whether "NotebookLM" survives as a name anywhere (e.g., enterprise) is unknown.

---

## Implications for someone building tools to explore literature

1. **Design for modes, not for "reading".** The evidence supports separate interfaces for triage, lookup, deep study and retention, with different devices for each (matrix above). A single "AI reading assistant" that summarizes everything collapses the survey and deep-study modes and risks substituting summaries for study [I].
2. **Build triage around satisficing.** Help users *skip well*:
   - per-section "new information" scores relative to what they have already read;
   - structural outlines;
   - "what kind of book is this; what problem does it solve" (Adler's first questions).

   This matches how good skimmers already behave [38], unlike speed-reading gimmicks [35].
3. **Prefer curator signals.** Usable inputs:
   - Open Syllabus (free tiers; CC-NC release pending) [1][3];
   - expert-list *metadata and links* (Five Books, ACX/LessWrong reviews);
   - public bookshelves.

   Avoid Goodreads as a data dependency: its API is gone [8]. Expect anti-scraping friction even from nonprofits (Cloudflare challenges at Open Syllabus) [1]. Legal detail belongs to R09: store links and metadata, not copied reviews [I].
4. **Turn highlights into retrieval.** Highlighting is low-utility; testing and spacing are high-utility [41].
   - Every highlight → candidate question (LLM-drafted, user-edited) → export to Anki/FSRS (`.apkg`) or an Orbit-like embedded prompt [45][46].
   - Keep the user in the loop. The generation effect and prompt quality matter (Matuschak's prompt-writing notes) [R].
5. **Target Android e-ink as a first-class surface.** A PWA or Android app built with Claude Code runs on Boox (Android 15–16, Google Play) [80][86]. Constraints:
   - grayscale or 150-ppi color;
   - slow refresh, so no animation and pagination over scrolling;
   - high contrast.

   For Kindle, output **EPUB via Send to Kindle** [76]. For reMarkable and Kobo, output PDF/EPUB and use their cloud import (Google Drive, Dropbox, OneDrive) [70][77].
6. **PDF → reflowable text is a killer feature for small screens.** On 8–10" screens letter PDFs render at 5–7 pt (§3.3). Zotero 10 validates demand [54]. A pipeline of LLM/OCR → clean EPUB with figures, equations and references linked would help every device except 13.3" e-ink.
7. **Cheap audio is a solved commodity.** ElevenReader (10 h/mo free), Zotero Read Aloud and OS built-ins cover it [61][53]. Build *on* audio instead: audio triage feeds of candidate books, and "listen, then annotate the sentence you just heard" (a Zotero pattern) [53].
8. **Use Gemini Notebook as a component, not a product to clone.** Its limits are generous: 50 sources × 500k words free, so one notebook can hold about 25 million words, roughly 250 books [62][65] [I]. EPUB is accepted [65]. Custom tools could prepare curated source bundles (a syllabus, a Five Books list) for it. Caveats: no official public API was verified this session, and the interactive features are English-first.
9. **Make provenance and explanations visible.** People trust recommendations they understand. Explaining the algorithm raised ratings in Yeomans et al. [21]. Show *why* a book is suggested: "assigned with X on 312 syllabi; recommended by 2 Five Books experts in economics".
10. **Respect sleep and eyes by default.** Dark or warm themes after sunset, reminders to take a break every 20–50 minutes, and e-ink-friendly rendering [95][97].

---

## Ideas sparked

1. **Syntopicon-2 (LLM syntopical workbench).** Pick a question ("Is economic growth slowing?"). The tool:
   - pulls candidate passages from 10–30 books and papers;
   - performs Adler's step 2, "bringing authors to terms": a neutral glossary mapping each author's vocabulary onto shared terms;
   - frames neutral questions and builds an **issue map** showing which authors answer each question how, with passage-level citations.

   Output: a navigable "controversy table", plus a reading plan of the minimum passages needed to verify each cell. Historical precedent: Britannica's 102-idea Syntopicon [28].
2. **Inspectional-reading card for every book.** Auto-generate Adler's inspectional answers (kind of book, one-sentence unity, outline, key terms, problems addressed), plus a **forecast**: "P(this book changes my view on Q) = 0.15". Log the outcome after reading and track Brier scores. Over time the user learns which signals (curator, syllabus count, review quality) predict value. A calibration diary for reading.
3. **Satisficing scroll bar.** A reader whose scrollbar is a heatmap of *novelty relative to your library*: embedding distance of each paragraph from everything you have read or highlighted. Red means new to you, grey means you have seen it before. Add a "skip to next novel section" key. This operationalizes Duggan & Payne's satisficing [38].
4. **Curator graph explorer.** A Galaxy-like map where edges are "recommended by the same expert", "co-assigned on syllabi" and "reviewed in the same ACX/LessWrong thread", not "liked by similar users". A "two independent curators" filter counters popularity bias [23][25].
5. **Review-first queue (Karnofsky mode).** Before opening a book, assemble the 3 best reviews and the 2 strongest critiques. Ask the user to predict the book's weakest chapter. Then decide: skip, read selectively, or read fully [48].
6. **Highlight → question compiler.** Every highlight in Zotero, Kindle or Readwise becomes a draft retrieval prompt with its source passage attached. Approve, edit or reject on a phone in 2 minutes a day, then send to Anki/FSRS. Show "highlights converted to retrieval: 38%" as a metric [41][46].
7. **Spaced re-reading scheduler.** Instead of flashcards, schedule *chapters* of the 10–20 most important books for re-reading at expanding intervals (1 month, 6 months, 2 years). Each re-read starts with a 3-question self-test of what you remember (Graham + spacing) [49][9].
8. **Audio triage feed.** Each morning, generate 10 two-minute "Brief"-style overviews of candidate books and papers from a curated pool (new open-access releases, syllabus staples). Listen on a walk and say "keep" or "drop". Survivors go to the e-ink queue as reflowed EPUBs. This is a reading funnel with measurable conversion rates [63].
9. **E-ink "desk of books".** On a 13.3" Boox (Note Max or Tab X C), a split view of two books on the same topic, synchronized by an LLM-aligned outline. Turning to "causes of the Industrial Revolution" in book A shows the corresponding section of book B. This is syntopical reading on hardware that can display it [83][84].
10. **Margin sparring partner.** Select a passage and ask "How would [author of another book in my library] respond?" The answer must quote that other book's actual passages, not just generate. This is a Socratic use of LLMs that keeps the reader doing the integrative work, given the cognitive-debt concerns [50].
11. **Virtual new-books table.** A daily shelf of 30 newly available *free* titles (open-access monographs, new public-domain entries, new arXiv surveys) shown as covers plus first pages. Swipe through it Cowen-style and log the abandon rate [6].
12. **Calibration-on-paper toggle.** Clinton found readers more overconfident on screens [31]. After a section, the tool asks for a confidence rating, then a quick quiz. Over time it shows the user's *personal* screen-vs-paper or e-ink calibration gap, an n-of-1 experiment.

---

## Sources

1. Open Syllabus, "Spring 2026 Update" — https://blog.opensyllabus.org/Spring-2026-Update — 2026-05-22
2. Open Syllabus, Dataset Documentation — https://docs.opensyllabus.org/ — accessed 2026-10-15
3. Open Syllabus, "spring 2025 news" — https://blog.opensyllabus.org/spring-2025-news — 2025-05-29
4. Five Books, Interviews index — https://fivebooks.com/interviews/ — accessed 2026-10-15
5. Five Books, Experts — https://fivebooks.com/experts/ — accessed via search 2026-10-15
6. Tyler Cowen, "How to read fast", Marginal Revolution — https://marginalrevolution.com/marginalrevolution/2006/12/how_to_read_fas.html — 2006-12-12 (stale?)
7. Patrick Collison, Bookshelf — https://patrickcollison.com/bookshelf — accessed 2026-10-15 (page note dated "mid 2026")
8. Gwern Branwen, Book Reviews — https://gwern.net/review/book — created 2013-08-23, modified 2022-10-13
9. Gwern Branwen, Spaced Repetition for Efficient Learning — https://gwern.net/spaced-repetition — modified 2019-05-17 (stale?)
10. Astral Codex Ten, "Book Review Contest Rules 2026" — https://www.astralcodexten.com/p/book-review-contest-rules-2026 — 2026-02-20
11. Astral Codex Ten, "Book Review Contest: Winners" — https://www.astralcodexten.com/p/book-review-contest-winners — 2021-07-10
12. Astral Codex Ten, "Book Review Contest 2024 Winners" — https://www.astralcodexten.com/p/book-review-contest-2024-winners — 2024-10-11
13. Astral Codex Ten, "Non-Book Review Contest 2025 Winners" — https://www.astralcodexten.com/p/non-book-review-contest-2025-winners — 2025-10-17
14. LessWrong, Book Reviews / Media Reviews tag — https://www.lesswrong.com/w/book-reviews — accessed 2026-10-15
15. The Browser, About — https://thebrowser.com/about — accessed 2026-10-15
16. The Browser, Join — https://thebrowser.com/join/ — accessed 2026-10-15
17. Substack, "The Substack Christmas gift guide" (The Browser $5/$49) — https://on.substack.com/p/the-substack-christmas-gift-guide — 2018-12-11 (stale)
18. Goodreads, About us — https://www.goodreads.com/about/us — accessed 2026-10-15
19. Releasebot, Goodreads release notes (aggregator) — https://releasebot.io/updates/goodreads — through 2026-05-01 (via search)
20. The StoryGraph (Wikipedia mirror; via search) — https://wiki.pingponghomelab.duckdns.org/content/wikipedia_en_all_nopic_2026-03/The_StoryGraph — 2026-03 snapshot (low reliability)
21. Psychology Today, "Why ask a machine for a recommendation?" (Yeomans et al. 2019) — https://www.psychologytoday.com/ca/blog/choice-matters/201905/why-ask-machine-recommendation — 2019-05
22. HBS Working Knowledge, "It's no joke: AI beats humans at making you laugh" (search result; fetch 403) — https://hbswk.hbs.edu/item/it-s-no-joke-ai-beats-humans-at-making-you-laugh — ~2019
23. Naghiaei, Rahmani & Dehghan, "The Unfairness of Popularity Bias in Book Recommendation" — https://arxiv.org/abs/2202.13446v1 — 2022-02
24. CWI, audit of Danish public-library recommender (ECIR 2026; search result) — https://ir.cwi.nl/pub/36328 — 2026
25. Salganik, Dodds & Watts, "Experimental Study of Inequality and Unpredictability in an Artificial Cultural Market", *Science* — https://www.princeton.edu/~mjs3/salganik_dodds_watts06_full.pdf — 2006 (stale? foundational)
26. Wikipedia, "Barnes & Noble" — https://en.wikipedia.org/wiki/Barnes_%26_Noble — accessed 2026-10-15
27. Wikipedia, "How to Read a Book" — https://en.wikipedia.org/wiki/How_to_Read_a_Book — accessed 2026-10-15
28. Wikipedia, "Great Books of the Western World" — https://en.wikipedia.org/wiki/Great_Books_of_the_Western_World — accessed 2026-10-15
29. St. John's College, Great Books Reading List — https://www.sjc.edu/academic-programs/undergraduate/great-books-reading-list — accessed 2026-10-15
30. Delgado, Vargas, Ackerman & Salmerón, "Don't throw away your printed books", *Educational Research Review* 25 (author copy) — https://www.uv.es/lasalgon/papers/Delgado%202018%20dont%20throw%20away%20your%20printed%20books.pdf — 2018
31. Learning Scientists blog, guest post by V. Clinton on her meta-analysis — https://www.learningscientists.org/blog/2019/9/12-1 — 2019-09-12
32. Clinton-Lisell, "Does Reading while Listening to Text Improve Comprehension…?" (full text; cites 0.21–0.25 range) — https://files.eric.ed.gov/fulltext/EJ1403866.pdf — 2023
33. Kong, Seo & Zhai, "Comparison of reading performance on screen and on paper" (record; via search) — https://researchconnect.buffalo.edu/en/publications/comparison-of-reading-performance-on-screen-and-on-paper-a-meta-a/ — 2018
34. Salmerón et al., "Reading comprehension on handheld devices vs. on paper" (preprint of *J. Educ. Psych.* 116(2)) — https://www.uv.es/lasalgon/papers/Salmeron%202023%20manuscript_tablets.pdf — 2023/2024
35. Rayner et al., "So much to read, so little time", *PSPI* 17(1) (WUSTL record) — https://profiles.wustl.edu/en/publications/so-much-to-read-so-little-time-how-do-we-read-and-can-speed-readi/ — 2016
36. Strukelj & Niehorster, "One page of text: Eye movements during regular and thorough reading, skimming, and spell checking" — https://pmc.ncbi.nlm.nih.gov/articles/PMC7198234/ — 2018
37. Duggan & Payne, "Text skimming: the process and effectiveness of foraging through text under time pressure" (Bath record) — https://researchportal.bath.ac.uk/en/publications/text-skimming-the-process-and-effectiveness-of-foraging-through-t/ — 2009
38. Duggan & Payne, "Skim reading by satisficing: evidence from eye tracking" (CHI '11 record) — https://researchportal.bath.ac.uk/en/publications/skim-reading-by-satisficing-evidence-from-eye-tracking/ — 2011
39. Tech & Learning, "Listen Without Guilt: Audiobooks Offer Similar Comprehension As Reading" (Clinton-Lisell 2022) — https://www.techlearning.com/news/listen-without-guilt-audiobooks-offer-similar-comprehension-as-reading — 2022-03-21
40. UND Scholarly Commons, Clinton-Lisell 2023 record/abstract — https://commons.und.edu/ehb-fac/75 — 2023
41. Dunlosky et al., "Strengthening the Student Toolbox", *American Educator* — https://www.aft.org/ae/fall2013/dunlosky — Fall 2013 (stale? canonical)
42. Michael Nielsen, "Augmenting Long-term Memory" — http://augmentingcognition.com/ltm.html — 2018-07
43. Andy Matuschak, "Why books don't work" — https://andymatuschak.org/books/ — 2019-05-11
44. Andy Matuschak, working notes on Quantum Country retention (via search) — https://notes.andymatuschak.org/zS5uKLsoTbkJSadTv2U3Z4G3uEBrFxTLy5E and https://notes.andymatuschak.org/z2cKiAiZ8tAWiz4ZUoTaaBv — ~2019–2022
45. Orbit repository (Andy Matuschak) — https://github.com/andymatuschak/orbit — accessed 2026-10-15
46. Anki Manual, Deck Options (FSRS) — https://docs.ankiweb.net/deck-options.html — accessed 2026-10-15
47. open-spaced-repetition, srs-benchmark — https://github.com/open-spaced-repetition/srs-benchmark — accessed 2026-10-15
48. Holden Karnofsky, "Reading books vs. engaging with them", Cold Takes — https://www.cold-takes.com/reading-books-vs-engaging-with-them/ — 2021-10-20
49. Paul Graham, "How You Know" — https://paulgraham.com/know.html — 2014-12 (stale? essay)
50. Kosmyna et al., "Your Brain on ChatGPT" — https://arxiv.org/abs/2506.08872 — 2025-06-10 (v2 2025-12-31)
51. Readwise, Pricing — https://readwise.io/pricing — accessed 2026-10-15
52. Zotero blog index — https://www.zotero.org/blog/ — accessed 2026-10-15
53. Zotero, "Zotero 9" — https://www.zotero.org/blog/zotero-9/ — 2026-04-10
54. Zotero, "Zotero 10" — https://www.zotero.org/blog/zotero-10/ — 2026-08-17
55. Obsidian, Pricing — https://obsidian.md/pricing — accessed 2026-10-15
56. Hypothesis, About — https://web.hypothes.is/about/ — accessed 2026-10-15
57. LiquidText homepage — https://www.liquidtext.net/ — accessed 2026-10-15
58. MarginNote homepage — https://www.marginnote.com/ — accessed 2026-10-15
59. Pocket, Farewell page — https://getpocket.com/farewell — accessed 2026-10-15
60. Speechify, Pricing — https://speechify.com/pricing/ — accessed 2026-10-15
61. ElevenReader homepage/pricing — https://elevenreader.io/ — accessed 2026-10-15
62. Google, "Learn about Gemini Notebook's plans" — https://support.google.com/notebooklm/answer/16213268 — accessed 2026-10-15
63. Google, "Generate Audio Overview in Gemini Notebook" — https://support.google.com/gemininotebook/answer/16212820 — accessed 2026-10-15
64. Google, "Learn about Gemini Notebook" — https://support.google.com/gemininotebook/answer/16164461 — accessed 2026-10-15
65. Google, "Add or discover new sources" (Gemini Notebook) — https://support.google.com/gemininotebook/answer/16215270 — accessed 2026-10-15
66. Google, "Manage your usage limits" (Gemini Notebook) — https://support.google.com/gemininotebook/answer/17670842 — accessed 2026-10-15
67. notebooklm.google (301 → https://notebook.google/, page title "Gemini Notebook") — https://notebooklm.google/ — observed 2026-10-15
68. reMarkable, Paper Pro product page — https://remarkable.com/products/remarkable-paper/pro — accessed 2026-10-15
69. reMarkable, Paper Pro Move product page — https://remarkable.com/products/remarkable-paper/pro-move — accessed 2026-10-15
70. reMarkable, Paper Pure product page — https://remarkable.com/products/remarkable-paper/pure — accessed 2026-10-15
71. Good e-Reader, "Everything you need to know about the Remarkable Paper Pure" — https://goodereader.com/blog/remarkable-news/everything-you-need-to-know-about-the-remarkable-paper-pure — ~2026-05
72. tbreak, "reMarkable Paper Pure launches…" — https://tbreak.com/remarkable-paper-pure-price-2026/ — 2026-05-06
73. Notebookcheck, "reMarkable Paper Pro … released at $579" — https://www.notebookcheck.net/reMarkable-Paper-Pro-Brand-new-E-Ink-tablet-with-an-11-8-inch-color-touchscreen-and-front-light-released-at-579.884166.0.html — 2024-09-04
74. Amazon, Kindle Scribe lineup announcement page — https://aboutamazon.com/news/devices/new-amazon-kindle-scribe-color — accessed 2026-10-15 (updated 2026)
75. The Gadgeteer, "Amazon's next-gen Kindle Scribe lineup goes on sale December 10…" — https://the-gadgeteer.com/2025/12/07/amazons-next-gen-kindle-scribe-lineup-goes-on-sale-december-10-with-no-preorders/ — 2025-12-07
76. TechCrunch, "Kindle Scribe Colorsoft review" — https://techcrunch.com/2026/02/06/kindle-scribe-colorsoft-review-e-ink-color-tablet — 2026-02-06
77. Kobo, Elipsa 2E product page — https://ereader.kobo.com/en-us/products/kobo-elipsa-2e — accessed 2026-10-15
78. The eBook Reader Blog, "The Kobo Elipsa Was a Flop…" — https://blog.the-ebook-reader.com/?p=27229 — 2025-05-02
79. BOOX official store catalog (Shopify products feed) — https://shop.boox.com/products.json — accessed 2026-10-15
80. BOOX Note Air6 C product page — https://shop.boox.com/products/noteair6c — accessed 2026-10-15
81. BOOX Note Mini C product page — https://shop.boox.com/products/noteminic — accessed 2026-10-15
82. BOOX Palma 3 product page — https://shop.boox.com/products/palma3 — accessed 2026-10-15
83. BOOX Note Max product page — https://shop.boox.com/products/notemax — accessed 2026-10-15
84. BOOX Tab X C product page — https://shop.boox.com/products/tabxc — accessed 2026-10-15
85. BOOX Mira Pro product page — https://shop.boox.com/products/boox-mira-pro — accessed 2026-10-15
86. BOOX Go 10.3 (Gen II) product page — https://shop.boox.com/products/go103gen2 — accessed 2026-10-15
87. The eBook Reader Blog, "New Boox Note Air5 C runs Android 15…" — https://blog.the-ebook-reader.com/2025/10/20/new-boox-note-air5-c-runs-android-15-and-supports-emr-stylus/ — 2025-10-20
88. 9to5Google, "Boox Go 10.3 Gen II review" — https://9to5google.com/2026/07/28/boox-go-10-3-gen-ii-review/ — 2026-07-28
89. Root Nation, "BOOX Go 10.3 Gen II Lumi review" (search result; fetch 403) — https://root-nation.com/en/gadgets-en/e-readers-en/en-boox-go-10-3-gen-ii-lumi-review/ — 2026
90. Libby Help, "What devices are compatible with Libby?" — https://help.libbyapp.com/en-us/6105.htm — updated 2026-02-26
91. Google Play, Libby listing — https://play.google.com/store/apps/details?id=com.overdrive.mobile.android.libby — updated 2026-08-26
92. Google Play, O'Reilly listing — https://play.google.com/store/apps/details?id=com.safariflow.queue — updated 2026-10-14
93. Apple, iPad mini Tech Specs — https://www.apple.com/ipad-mini/specs/ — accessed 2026-10-15
94. Apple, Buy iPad mini — https://www.apple.com/shop/buy-ipad/ipad-mini — accessed 2026-10-15
95. American Optometric Association, Computer Vision Syndrome — https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome — accessed 2026-10-15
96. Benedetto et al., "E-Readers and Visual Fatigue", PLOS ONE — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0083676 — 2013-12-27 (stale?)
97. Chang, Aeschbach, Duffy & Czeisler, "Evening use of light-emitting eReaders negatively affects sleep…", PNAS — https://pmc.ncbi.nlm.nih.gov/articles/PMC4313820/ — 2014/2015 (stale? foundational)
98. CBC News on StoryGraph sign-up surge (search result) — https://www.cbc.ca/1.7392369 — 2024-11

---

## Verification pass (independent)

Run 2026-10-15 by an independent fact-checker. Method: re-opened each cited source; extracted the cited PDFs to text; pulled the Boox storefront JSON and product pages and the Kobo page directly; checked the notebooklm.google redirect with an HTTP HEAD request; read published abstracts from Crossref metadata where publisher sites returned 403. The shared web-search budget was exhausted at the start of this pass, so no new independent web searches were possible. Newer or contradicting information was looked for only through direct fetches of primary and vendor pages. Inline fixes are marked "[corrected in verification]"; upgrades from secondary to primary sourcing are marked "[confirmed in verification]".

| # | Claim | Verdict | Correction / note | Source |
|---|---|---|---|---|
| 1 | Delgado et al. 2018: g = −0.21; 38 between- + 16 within-participant studies; 171,055 participants; 2000–2017; moderators: time constraints, informational vs narrative, publication year | confirmed | Abstract matches word for word (within-participant dc = −.21). Citation: *Educ. Res. Rev.* 25:23–38 (Crossref). | Delgado author PDF (uv.es); Crossref 10.1016/j.edurev.2018.09.003 |
| 2 | Salmerón et al. 2024: g = −0.113 (k = 38, between); g = −0.103 (k = 21, within) | confirmed | Matches the preprint abstract. *J. Educ. Psych.* 116(2):153–172 confirmed on Crossref. "About half of 0.21–0.25" is the author's own inference and is arithmetically fair. | uv.es preprint; Crossref 10.1037/edu0000830 |
| 3 | Clinton-Lisell 2023: 30 studies, N = 1,945; g = 0.18 overall; experimenter-paced g = 0.41; self-paced g = 0.06, CI [−0.07, 0.19], n.s. | confirmed | Exact match (self-paced p = .34). *ERTP* 34(3):133–155. | files.eric.ed.gov/fulltext/EJ1403866.pdf; commons.und.edu/ehb-fac/75 |
| 4 | Clinton-Lisell 2022 (RER): 46 studies, 4,687 participants; no overall difference; small self-paced reading advantage; no listener-paced studies | confirmed | The published abstract gives g = 0.07 (p = .23) overall and g = 0.13 (p = .049) self-paced, so the values are no longer just from search snippets. Clinton-Lisell 2023 confirms that no included study had self-paced listening. RER 92(4):543–582; online 2021-12-29. | Crossref 10.3102/00346543211060871; Tech & Learning 2022-03-21; EJ1403866 p. 135 |
| 5 | Rayner et al. 2016, PSPI 17(1):4–34: 250 → 500–750 wpm unlikely without comprehension loss; speed–accuracy trade-off | confirmed | The abstract says doubling or tripling typical speeds is unlikely to preserve comprehension. | profiles.wustl.edu record |
| 6 | Dunlosky et al.: practice testing and distributed practice high utility; highlighting, rereading and summarization low | confirmed | The AFT article's wording is "most effective" / "promising" / "less useful"; the high/moderate/low labels come from the 2013 PSPI monograph. Keyword mnemonic and imagery for text are also low. | aft.org/ae/fall2013/dunlosky |
| 7 | Open Syllabus v2.14 (2026-05-22): 32.9M syllabi, 94M citations, 4.4M titles, 8,620 schools; docs 32,941,092 syllabi, ~48B words, ~11,000 institutions; Galaxy co-assignment recommender; VitalSource premium; CC-NC release undated | corrected | The citation count conflicts. The blog says "94 million citations", but the dataset docs say "147 million extracted citations to books and articles, spread across 4.4 million unique works". Everything else checks out: 8,620 (blog) vs ~11,000 (docs; also "22,238 institutions" in the linked database); Galaxy is described in the docs; VitalSource comes from the 2025-05-29 post, not the 2026 one; the CC-NC release is "coming shortly", with no date. | blog.opensyllabus.org/Spring-2026-Update; docs.opensyllabus.org; blog.opensyllabus.org/spring-2025-news |
| 8 | Naghiaei et al. 2022: most of 9 algorithms fail Niche/Diverse users and favor Bestseller-focused users (Book-Crossing) | confirmed | 9 algorithms plus 2 baselines. The personalization vs popularity-bias trade-off is stated for the Diverse and Bestseller-focused groups. | arxiv.org/abs/2202.13446v1 |
| 9 | reMarkable Paper Pure $399 / $449 bundle; 10.3", 226 ppi, no front light; announced 2026-05-06; replaces discontinued rM2; Paper Pro $629 (launched $579, Sept 2024); Connect $3.99/mo or $39/yr | confirmed | remarkable.com shows "Starts at $399" and Paper Pro "From $629" ($679 with Marker Plus). Good e-Reader confirms Carta 1300, 1872×1404, 226 PPI, 360 g, and that the rM2 is discontinued. Notebookcheck confirms the $579 launch price on 2024-09-04. | tbreak; remarkable.com Pure and Pro pages; goodereader.com; notebookcheck.net |
| 10 | Kindle Scribe 3rd gen (11", 400 g, 5.4 mm) $499.99; Colorsoft $629.99; on sale 2025-12-10; no-front-light $429.99; AI features US-only | confirmed | Amazon's page says Story So Far and Ask This Book are for U.S. books and Send to Alexa+ is "(U.S. only)". Unresolved: TechCrunch (2026-02-06) lists the regular Scribe at $549.99 and names no storage tier for that price, so the "64 GB tier" explanation is still unverified. The current Amazon list price could not be fetched. | the-gadgeteer.com 2025-12-07; aboutamazon.com; techcrunch.com 2026-02-06 |
| 11 | Boox Note Air6 C $579.99 US; Kaleido 3, 300/150 ppi; Android 16; 6/64 GB; 440 g; AI Assistant; listed Sept 2026. Note Max $629.99, 300 ppi, Android 13, no front light | confirmed | Storefront JSON: Air6 C $579.99 (keyboard bundle $656.99), published 2026-09-15. Note Max $629.99 (compare-at $689.99), 3200×2400, Android 13, "No Front Light". | shop.boox.com/products/noteair6c(.json); shop.boox.com/products/notemax(.json) |
| 12 | NotebookLM is now "Gemini Notebook"; notebooklm.google 301 → notebook.google; free tier 100 × 50 sources, 500k words / 200 MB; EPUB; four Audio Overview formats; 80+ languages; interactive mode English-only | confirmed | HTTP 301 observed 2026-10-15, and the page title is "Gemini Notebook". All limits and formats match the help pages. The rename date is still unknown. | curl -I notebooklm.google; support.google.com/gemininotebook/answer/16215270, /16212820; support.google.com/notebooklm/answer/16213268 |
| 13 | Zotero 9 (2026-04-10) Read Aloud for PDFs/EPUBs/snapshots, 2 h/mo free; Zotero 10 (2026-08-17) reflowable, annotatable PDF Reading Mode | confirmed | Both posts match. The Zotero 8 date was also confirmed (announced 2026-01-22). | zotero.org/blog/zotero-9/, /zotero-10/, /blog/ |
| 14 | ElevenReader free 10 h/mo (~400-page book); Ultra $11/mo or $99/yr; Speechify Premium $29/mo monthly | confirmed | Nuance: Ultra gives "unlimited text to audio" for imports plus 20 h/mo of premium catalog titles. Speechify's yearly price is not shown, only "Save 60%". | elevenreader.io; speechify.com/pricing |
| 15 | Anki FSRS opt-in (23.10+), default 90%, warning above 97%; srs-benchmark FSRS-6 0.3460 vs ACT-R 0.4033, HLR 0.4694, ~10k collections | confirmed | The figures are from the "without same-day reviews" table (9,999 collections, ~350M reviews). With same-day reviews, FSRS-6 scores 0.3842 vs ACT-R 0.3898, a much smaller gap. | docs.ankiweb.net/deck-options.html; github.com/open-spaced-repetition/srs-benchmark |
| 16 | Readwise Full $9.99/mo annual ($119.88/yr) or $12.99 monthly; Lite $5.59/mo; 50% academic | confirmed | Lite is billed annually. 30-day trial. | readwise.io/pricing |
| 17 | Chang et al.: ~4 h max-brightness iPad vs book, N = 12; melatonin −55%; DLMO >1.5 h later; sleep latency 25.65 vs 15.75 min; sleepier next morning | confirmed | 55.12 ± 20.12% suppression; DLMO 22:31 vs 21:01; REM 109 vs 121 min. Melatonin analyses used n = 11. | pmc.ncbi.nlm.nih.gov/articles/PMC4313820 |
| 18 | Five Books: 1,700+ interviews, ~8,000 recommendations, 2+ new/week | confirmed | Page wording: "more than one thousand seven hundred interviews, or eight thousand book recommendations"; "at least two new interviews per week". | fivebooks.com/interviews |
| 19 | Collison bookshelf ~600 entries, about half read; "As of mid 2026 … not been updated in around 10 years" | confirmed | Exact quote present, plus "kept around for posterity". | patrickcollison.com/bookshelf |
| 20 | iPad mini (A17 Pro, 8.3", 326 ppi, 293 g) from $599 / 128 GB | confirmed | $599 / $699 / $899 for 128/256/512 GB Wi-Fi; still A17 Pro, no newer model. The $499 launch price was not re-checked online. It matches the checker's own pre-2026 knowledge of the October 2024 launch. | apple.com/shop/buy-ipad/ipad-mini; apple.com/ipad-mini/specs |

**Other statements spot-checked (most suspicious first).**

| Statement | Verdict | Note | Source |
|---|---|---|---|
| Open Syllabus "94M citations" (exec summary, table, numbers) | corrected | See claim 7; fixed inline in three places and added to Contested points. | docs.opensyllabus.org |
| "seductive details g = 0.33" listed as effect-size context | corrected | In Clinton-Lisell 2023 this is the *negative* effect of seductive details on learning; fixed inline. | EJ1403866 p. 147 |
| Yeomans et al. 2019: algorithm 61% vs spouses/friends 57% | unverifiable | The Psychology Today summary gives no percentages, and HBS Working Knowledge returned 403. The direction (algorithm beats close others; people prefer human recommenders; explanations raise ratings) is confirmed. | psychologytoday.com 2019-05 |
| Clinton 2019: 33 studies, 2,799 participants, all randomized | confirmed | Crossref abstract: random assignment only, studies from 2008–2018, k = 33, n = 2,799. *J. Res. Reading* 42(2):288–325. | Crossref 10.1111/1467-9817.12269 |
| Boox Note Mini C priced the same as the Air6 C ($579.99) | confirmed | Storefront JSON: $579.99, "To Be Shipped Around October"; Palma 3 $339.99; Tab X C $819.99; Go 10.3 Gen II $419.99; Mira Pro $1,799.99. | shop.boox.com/products/*.json |
| Great Books sales: 1,863 sets (1952), 50,000 (1961), ~1M total per Alex Beam | confirmed | Matches Wikipedia wording. | en.wikipedia.org/wiki/Great_Books_of_the_Western_World |
| Kosmyna et al.: v2 2025-12-31; 54 participants, 18 in session 4 | confirmed | — | arxiv.org/abs/2506.08872 |
| Strukelj & Niehorster N = 60; Benedetto et al. N = 12, Kindle Fire HD vs Paperwhite vs paper | confirmed | Benedetto sessions averaged 73 min. | PMC7198234; journals.plos.org pone.0083676 |
| Nielsen: ~10,000 cards / 2.5 yr; 15–20 min/day; 4–7 min lifetime per card; ~2 h per card with weekly flashcards | confirmed | — | augmentingcognition.com/ltm.html |
| Gwern spacing figures (d = 0.42; Kornell 90%/72%; ~60% vs ~40%) | confirmed | — | gwern.net/spaced-repetition |
| ACX 2026 prizes ≥$2,500/$1,000/$500, deadline May 20 | confirmed | — | astralcodexten.com/p/book-review-contest-rules-2026 |
| Kobo Elipsa 2E $399.99, 227 PPI | confirmed | — | ereader.kobo.com |
| Pocket shutdown July 8, 2025; export deadline October 2025 | unverifiable | The farewell page gives no dates and the Mozilla KB page did not load. Still [R]; consistent with the checker's own knowledge (export open until 2025-10-08). | getpocket.com/farewell |
