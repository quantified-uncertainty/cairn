# Interfaces for exploring large information spaces: what was tried, what worked, what failed — research dossier

- **Date:** 2026-10-15
- **Track:** R06 (Open Stacks research sweep)
- **Scope:**
  - **Theory:** information foraging, berrypicking, Shneiderman's mantra, the sensemaking loop, exploratory search.
  - **Classic interface mechanisms:** Scatter/Gather, faceted search, fisheye views, TileBars, WebBook/Web Forager, Data Mountain, zoomable UIs and semantic zoom, StretchText; the evidence on overview+detail vs focus+context; why 3D information visualization failed.
  - **Literature maps:** science maps, VOSviewer, CiteSpace, citation-graph views, embedding maps (UMAP, Nomic Atlas, datamapplot, Toponymy, Latent Scope, WizMap, Apple Embedding Atlas), topic models (LDA, BERTopic, TopicGPT, LLooM), Open Syllabus Galaxy, arXiv maps; and whether maps help people find relevant work.
  - **Reading interfaces:** the Ai2 Semantic Reader research line (ScholarPhi, CiteSee, Scim, Paper Plain, Threddy, Relatedly), LiquidText, explorable explanations, Distill, tools for thought and the mnemonic medium, Ink & Switch's malleable software, the Memex/Mundaneum/Xanadu lineage, and Gwern.net's design.
  - For each idea: the mechanism, the evidence, and what it implies for an LLM-augmented literature explorer. Special attention goes to ideas that were good but blocked by the cost of metadata or annotation.
- **Method, and an important limitation:**
  - The session's shared web-search budget was already used up by other agents before this track's first query. **No WebSearch results were available.** Every source below was reached by fetching a known primary URL directly: arXiv abstracts and full-text PDFs (read with `pdftotext`), author-hosted PDFs (Microsoft Research, University of Canterbury, Georgia Tech), Marti Hearst's free online book *Search User Interfaces*, official product pages and docs, GitHub READMEs, the PyPI and npm registries, Wikipedia, and Wikimedia's research pages.
  - Bibliographic facts for paywalled ACM papers (year, venue, authors, citation counts, and abstracts where not elided) come from the Semantic Scholar Graph API (`https://api.semanticscholar.org/graph/v1/paper/DOI:<doi>?fields=title,year,venue,citationCount,abstract,authors`), queried on 2026-10-15.
  - ACM Digital Library pages returned HTTP 403, so a few classic results (the Cockburn–Karlson–Bederson survey's conclusions, Furnas's formula, Marchionini's three-part framework) come from my training knowledge and are labeled **[T]**.
  - Absence of evidence in this dossier is weak evidence. I could not search for recent user studies I don't already know about.
- **Evidence labels:**
  - **[P]** verified on a primary source in this session (the paper itself, the organization's page, official docs or registry)
  - **[P-via-Hearst]** a study result as reported in Hearst (2009), which I read verbatim; the original paper was not opened
  - **[S]** secondary source
  - **[I]** my inference or calculation
  - **[T]** training knowledge, not re-verified in this session
  - Confidence: high / medium / low, or "[~70%]". Sources older than about two years are flagged "(possibly stale)". Most HCI evidence here is 1990s–2010s; it is *historically* reliable but tested on old hardware, small samples and pre-LLM content.
- **Key sources:**
  - Hearst, *Search User Interfaces* (Cambridge UP, 2009; chapters 3, 8, 10)
  - Robertson et al. 1998 (Data Mountain) and Czerwinski et al. 1999
  - Cockburn & McKenzie 2001 and 2002; Cockburn 2004
  - Lo, Chang, Head et al. 2023 (*The Semantic Reader Project*) and the five prototype papers it summarizes
  - Katz, Levy & Goldberg 2024 (*Knowledge Navigator*); Tamkin et al. 2024 (*Clio*); Lam et al. 2024 (*LLooM*); Pham et al. 2024 (*TopicGPT*)
  - OpenAlex Topics documentation (classifier replaced October 2026)
  - Chari & Pachter 2023 (*The specious art of single-cell genomics*)
  - Wikimedia's Page Previews A/B tests (2017–18)
  - Matuschak & Nielsen 2019 (*How can we develop transformative tools for thought?*); Ink & Switch 2025 (*Malleable software*); Gwern.net's design page
  - Tool pages for VOSviewer, CiteSpace, datamapplot, Toponymy, Latent Scope, Embedding Atlas, Nomic and Open Syllabus

---

## Executive summary

1. **Forty years of HCI research gives a consistent verdict: lists and text beat pictures for finding things, but structure helps for understanding a space.**
   - Chen & Yu's meta-analysis found "the combined effect of visualization in the studies was not statistically significant." Individual cognitive differences mattered more than the interface. [P-via-Hearst, high; 2000, possibly stale] [1]
   - Hearst's 2009 conclusion: "information visualization has not yet proven itself for search interfaces." [P, high] [1]
   - Scatter/Gather was *worse* than similarity search for pure retrieval, but gave users "a more coherent conceptual image" of the collection and a richer query vocabulary (Pirolli et al. 1996). [P, high] [10][2]
   - Design rule [I]: a literature explorer should use maps and clusters for orientation and learning, and ranked lists for retrieval, with the two linked.

2. **The two ideas from this history that clearly worked in the market are faceted navigation and overview+detail.**
   - Flamenco (Yee et al. 2003): 32 art-history students, ~35,000 images. 91% preferred the faceted interface overall, even though it was "an order of magnitude slower" than the baseline. [P-via-Hearst, high] [2]
   - Hornbæk & Frøkjær (2001): 20 readers; all but one preferred an overview+detail reader, and they wrote higher-graded essays with it. Fisheye views were disliked. [P-via-Hearst, high] [1]
   - Faceted search became standard in e-commerce and library catalogs [T, high]. Fisheye distortion never did [T, high].

3. **The main thing that held back automatic organization was the cost and quality of labels and metadata, and LLMs largely remove that block.**
   - In 2009, Hearst wrote that categories "require manual curation" and "automated methods are about 75% correct on average." Clustering traded away "consistency, coherence, and comprehensibility." Single-term cluster labels on a 1998 Kohonen map were "misleading." [P, high] [2][1]
   - Since 2024:
     - Knowledge Navigator's LLM "cluster reader" produced subtopic names matching **88%** of expert-assigned subtopics on CLUSTREC-COVID. A searcher needs to inspect only **2.3–3.18 of 50 clusters** to cover 80% of a topic's documents (vs 20.4 for random clusters). [P, high] [33]
     - Clio reconstructed known topic distributions with **94%** accuracy for about **$48.81 per 100,000 conversations**. [P, high] [34]
     - LLooM's LLM-written concepts covered **93%** of examples vs **77.7%** for BERTopic. [P, high] [31]
   - This is the single most important finding of this track for tool builders. [I]

4. **OpenAlex now assigns its 4,516 topics with a fine-tuned LLM.** As of October 2026 the classifier is a fine-tuned Qwen3-8B that reads title, abstract and source name.
   - When at least 90% confident (about 64% of works) it is right about 94.5% of the time.
   - Its primary topic matched two AI judges' blind choices 81.7% of the time (89.6% at field level).
   - About 10% of works get no topic.
   - The topic list itself was built by citation clustering, with an LLM writing each topic's name and description. [P, high; very recent] [35]

5. **3D information spaces failed on evidence, not just taste, and the spatial-memory benefit they claimed is available in 2D.**
   - Data Mountain (1998) beat Internet Explorer Favorites for 32 users with 100 pages. Users could still find pages after about 6 months. [P, high] [15][16]
   - But a 2D version performed as well. In Cockburn & McKenzie 2001, 2D was slightly faster (not significant), yet users significantly *preferred* 3D. [P, high] [17]
   - In a 69-person study with 2,070 trials, retrieval time rose from 2D (3.7 s) to 2½D (3.8 s) to 3D (4.8 s). The effect was only marginal (p = .09). Users rated the physical 2½D and 3D models significantly more "cluttered" than 2D, but clutter ratings did not differ significantly across the virtual interfaces. [corrected in verification] [P, high] [18]
   - Sebrechts et al. (1999): text was faster than 2D, which was faster than 3D. Tory et al. (2007): points beat landscapes and 2D beat 3D. [P-via-Hearst, high] [1]
   - Implication for VR reading rooms (see R08) [I]: use spatial layout, not depth.

6. **Embedding maps (UMAP plus clustering plus LLM labels) are now a commodity, but 2D maps distort neighborhoods badly.**
   - Open-source tooling is mature and active in 2026 [P, high] [26–30][45]:
     - datamapplot 0.7.3 (May 2026)
     - Toponymy 0.5.4 (Sept 2026; LLM topic naming at several scales)
     - Latent Scope 1.0.0 (July 2026)
     - Apple's Embedding Atlas 0.25.0 (Oct 2026; MIT license, WebGPU, millions of points, automatic labels, MCP access)
   - Chari & Pachter (2023) found that a point's 30 nearest neighbors in 2D share little with its true neighbors: mean Jaccard distance "consistently above 0.7." [P, high (single-cell data; the geometric argument generalizes) [I]] [37]
   - Treat map position as a hint, not a measurement. [I]

7. **Nomic, the best-known commercial "data map" vendor, has pivoted.** Nomic's homepage and pricing (2026) now sell an AI platform for architecture, engineering and construction (AEC) at $20/month (Individual) and $40/user/month (Business). The nomic.ai homepage and pricing page no longer mention Atlas at all. It survives as an "Atlas Docs" link on the separate docs site (docs.nomic.ai, where the Atlas section is now headed "Nomic Developer Platform") and at atlas.nomic.ai. [corrected in verification] The `nomic` Python client was last released 2025-11-11. [P, high that the focus changed; Atlas's future status is unknown, ~60% it is in maintenance mode] [39][40][41][45]

8. **The most successful research-to-product line in reading interfaces is Ai2's Semantic Reader.**
   - Ten prototypes with 300+ study participants [P] [42].
   - Features that shipped: Scim's skimming highlights (Goal/Method/Result), ScholarPhi's "definitions on demand," and CiteSee's personalized citation coloring. Semantic Reader covers "most arXiv papers." [P, high] [48]
   - Measured effects:
     - ScholarPhi: 27 participants answered questions in significantly less time while viewing less of the paper [P] [43]
     - Scim: 19 participants found information faster; 70.4% of 105 diary sessions said highlights helped [P] [45a]
     - Paper Plain: 24 lay readers found papers significantly easier, with no loss of comprehension [P] [46]

9. **The Semantic Reader authors said in 2023 that LLMs change the economics.**
   - "Until recently, interface design could require months of development of bespoke AI models." LLMs let them "experiment with a wide range of new NLP capabilities at relatively low cost."
   - They also warn that "even slight errors in these models can have detrimental effects on the readers." [P, high] [42]
   - This captures the tension in this whole dossier: the annotation cost is gone, and the accuracy budget has become the binding constraint. [I]

10. **Hover previews, the core of Gwern.net's design, have real A/B evidence at Wikipedia scale.**
    - Wikimedia's Page Previews (2017–18, English and German Wikipedia):
      - pageviews per session fell 3–5%
      - distinct pages interacted with per session rose 20–22%
      - back-button use fell 2–9%
      - about 0.26–0.27 previews were "seen" (≥1 s) per pageview
      - only ~0.01% of sessions disabled the feature [P, high (2018, possibly stale)] [55]
    - For a literature explorer [I]: hover annotations let readers judge many more items without leaving the page.

11. **"Tools for thought" stalled for economic reasons, not because the ideas failed.**
    - Distill paused in July 2021 after about 32 articles, citing volunteer editorial load and "burnout." [P] [50][51]
    - Matuschak & Nielsen describe a public-goods problem (tools are costly to build and easy to copy). They admit Quantum Country did not reach their own card-writing standard. [P] [52]
    - Quantum Country (112 cards in the first essay, ~4 hours of reading) shows the mnemonic medium works: after 6 reviews, about 54 days of demonstrated retention per card for about 95 minutes of total review. [P, medium (self-reported, 2019)] [52]
    - Authoring cost was the blocker in both cases. LLMs cut it, but they also lower average quality. [I]

12. **Theory still predicts the right design targets.**
    - Bates's berrypicking (1989) lists six concrete moves: footnote chasing, citation searching, journal runs, area scanning, subject search, author search. Each is now a cheap API or agent operation. [P] [5]
    - Pirolli & Card's two loops (foraging, then sensemaking) say most of the value is in the second loop: schemas, evidence files, hypotheses. Search tools mostly ignore it. [P-via-Hearst] [3]
    - Shneiderman's mantra ("overview first, zoom and filter, then details-on-demand") was offered as a "starting point." Its own paper says the tools "will have to be tamed and validated." [P] [6]

13. **Generated summaries are a new kind of information scent, and it can be misleading.**
    - Liu, Zhang & Liang (2023) audited four generative search engines. Only 51.5% of generated sentences were fully supported by their citations, and only 74.5% of citations supported their sentence. [P, high (2023 systems, possibly stale)] [57]
    - Foraging theory predicts that misleadingly strong scent sends users down bad paths. Nielsen's 2004 "Deceivingly strong information scent costs sales" made the same point for web links. [P title via Wikipedia] [7]

14. **Science-mapping tools keep growing but split on price.** As of 2026 [P, high] [21–24]:
    - VOSviewer (CWTS Leiden) is at 1.6.21 (2026-06-12) and reads OpenAlex, Scopus, Web of Science, Dimensions, Europe PMC, Crossref, Semantic Scholar and Lens. Its 2009/2010 software paper has 20,117 citations (Semantic Scholar).
    - CiteSpace 7.0.2 (2026-08-25) is now sold at $65, $110 or $155. Its 6.4.R2 Advanced edition adds "GPT-augmented cluster summarization."
    - The VOSviewer site also warns that a malicious Windows executable was served for download on August 31 (year not stated; ~70% it was 2026).

15. **Only one controlled study I could verify shows a map-style tool helping people find more relevant papers, and it is small.** Apolo (CHI 2011): 12 participants, between-subjects, an 83,000-article citation network; expert judges found Apolo users located "significantly more relevant papers." [P, medium (n=12; 2011, possibly stale)] [25]
    - I could not search for newer evaluations of Connected Papers–style graphs or embedding maps. Their popularity rests on preference, not measured retrieval benefit. [I, medium]

---

## Detailed findings

### 1. Theory: how people actually look for and make sense of literature

#### 1.1 Information foraging (Pirolli & Card, PARC, 1990s; *Psychological Review* 1999)

- **Mechanism.** People seeking information behave like foraging animals. They estimate the rate of gain from an "information patch" (a site, a journal issue, a search result page), stay while returns beat the expected return elsewhere, and leave when they diminish. Navigation is guided by **information scent**: "cues that provide searchers with concise information about content that is not immediately perceptible" (titles, snippets, link text, thumbnails). [P-via-Hearst, high] [3]
- **Furnas's navigability proposition**, as quoted by Hearst: for a target to be findable, "the path to that target must have good scent at every link." [P-via-Hearst] [3]
- **Evidence.**
  - SNIF-ACT (Fu & Pirolli 2007) modeled web navigation from word-relatedness statistics and predicted users' link choices. [P via Wikipedia's summary, medium] [7]
  - Hearst reports that "small changes in scent accuracy can produce large shifts in browsing cost." [P-via-Hearst] [3]
  - Nielsen (2003, 2004) applied the theory to web usability, including "Deceivingly Strong Information Scent Costs Sales." [P title, via Wikipedia] [7]
- **Implications for an LLM explorer [I]:**
  - LLMs are, above all, **scent generators**: TLDRs, "why this matters to you" lines, chapter gists. Semantic Scholar's TLDRs started as a research dataset of 5.4K summaries over 3.2K papers (SciTLDR, 2020) [P] [56]. Per sibling dossier R10, there are now 58M TLDRs in the S2 dataset.
  - Scent should be *calibrated*. A fluent summary of an irrelevant book is the "deceivingly strong scent" failure. Generated scent should carry provenance (which passage it came from) and some indication of confidence.
  - Foraging theory gives a measurable objective: **rate of relevant items found per minute of attention**. A literature explorer can log this directly and A/B test features against it.

#### 1.2 Berrypicking (Marcia Bates, 1989)

- **Mechanism.** Real searches **evolve**: "the query itself (as well as the search terms used) is continually shifting, in part or whole." The need is satisfied "not by a single final retrieved set" but by bits gathered along the way. [P] [5]
- **Six strategies** Bates names [P] [5]:

| Bates's strategy | 1989 description | 2026 implementation cost [I] |
|---|---|---|
| Footnote chasing (backward chaining) | Follow references in a work | Near zero: OpenAlex/Semantic Scholar reference lists; GROBID for PDFs |
| Citation searching (forward chaining) | Find later works citing a known one | Near zero for papers. Poor for books (few book-to-book citation graphs) |
| Journal run | Scan the volumes of a core journal (Bradford's law) | Low: OpenAlex source filters; LLM triage of a whole volume's abstracts |
| Area scanning | Browse what's shelved nearby; "the quintessential form of browsing in manual environments" | Medium: needs a call-number ordering (LCC/DDC) or an embedding neighborhood. See R05 on virtual shelves |
| Subject search in A&I services | Controlled-vocabulary lookup | Low: LCSH, OpenAlex topics, or LLM-assigned facets |
| Author searching | An author's other work | Near zero for papers; medium for books (author disambiguation) |

- **Bates's design recommendations (1989)** [P] [5]:
  - let users run each technique "as a package"
  - move easily between full text and references
  - browse without restarting
  - flag items for later
  - use a library-like visual metaphor
  - "the searcher with the widest range of search strategies available is the searcher with the greatest retrieval power"
- **Evidence.** O'Day & Jeffries interviewed 15 business analysts and found "the main value of the search was found to reside in the accumulated learning." [P-via-Hearst] [3]
- **Implication [I].** Most current AI research assistants collapse berrypicking into one query and one answer. A berrypicking-native tool would expose the six moves as first-class actions on any item, keep a persistent basket, and record the path (see §4.6, Memex trails). An agent can run all six moves in parallel from a seed and present the *union with provenance*: "found via footnote chase from X."

#### 1.3 Shneiderman's Visual Information-Seeking Mantra (1996)

- **Mechanism.** "Overview first, zoom and filter, then details-on-demand." The paper prints it ten times. It lists seven tasks (overview, zoom, filter, details-on-demand, relate, history, extract) and seven data types (1D, 2D, 3D, temporal, multidimensional, tree, network). [P, high] [6]
- **Status of evidence.** The paper presents the mantra as "only a starting point." It closes by saying novel tools "such as dynamic queries, treemaps, fisheye views, parallel coordinates, starfields, and perspective walls … will have to be tamed and validated." [P] [6]
  - It is a design heuristic, not an empirically derived law. The 1D category explicitly includes "textual documents."
  - Hearst's review (§2) suggests that for text, *overview* often loses to a well-ranked list.
- **The often-forgotten tasks.** *History* ("keep a history of actions to support undo, replay, and progressive refinement") and *Extract* ("allow extraction of sub-collections and of the query parameters") are exactly what berrypicking needs and what most discovery tools still lack. [P/I] [6]

#### 1.4 The sensemaking loop (Russell, Stefik, Pirolli & Card 1993; Pirolli & Card 2005)

- **Mechanism.**
  - Russell et al. framed sensemaking as a cost structure: users pursue "the strategy that has the highest expected utility" and switch when another looks better. [P-via-Hearst] [3]
  - Pirolli & Card (2005), from cognitive task analysis of intelligence analysts, describe two nested loops [P-via-Hearst] [3]:
    1. "an information foraging loop consisting of seeking, filtering, reading, and extracting information"
    2. "a sensemaking loop consisting of iterative development of a mental model" that fits the evidence
  - Their diagram's intermediate artifacts are [T, high]: external data sources → "shoebox" → evidence file → schema → hypotheses → presentation. Their "leverage points" are places where tools could cut cost (e.g. the cost of attention when scanning, and confirmation bias when generating hypotheses).
- **Evidence (small, qualitative)** [P-via-Hearst] [3]:
  - Cowley et al. (2005), 9 analysts: time split roughly equally among browser, word processor and file system.
  - Patterson et al. (2001), 10 analysts, ~2,000 documents with 9 "high-profit" documents: persistence separated those who found them from those who did not.
- **Implication [I].** Literature tools are heavily skewed toward the foraging loop: search, recommend, summarize. The sensemaking loop (organizing claims into a schema, weighing evidence, tracking hypotheses) is where a researcher's time and errors go.
  - LLMs fit the middle of this pipeline unusually well: extracting claims into an evidence file, proposing schemas, listing disconfirming evidence.
  - For a forecasting-minded reader, "hypotheses with credences linked to evidence" is the natural end state.
  - Recent LLM-era HCI prototypes target this loop. Sensecape (UIST 2023) supports multilevel abstraction and moving between foraging and sensemaking; its within-subject study found it let users "explore more topics." [P, medium (no numbers in abstract)] [58]

#### 1.5 Exploratory search (Marchionini 2006; White & Roth 2009)

- **Mechanism.** Marchionini (*CACM* 2006, "Exploratory search: from finding to understanding") distinguishes three activities [T, high; metadata P] [9]:
  - **lookup:** fact retrieval, known-item search
  - **learn:** knowledge acquisition, comprehension, comparison
  - **investigate:** analysis, synthesis, evaluation, discovery
  - Exploratory search is the learn and investigate part, and it needs both querying and browsing.
  - White & Roth's *Exploratory Search: Beyond the Query-Response Paradigm* (Morgan & Claypool, 2009) consolidated the area. [P metadata via Wikipedia] [8]
- **Evidence and evaluation problems.**
  - Standard IR metrics don't fit: spending more time is not failure, and "correct" summaries are subjective. [P via Wikipedia] [8]
  - Kuhlthau's study (385 participants at 21 sites) found half never reached a focused perspective. [P-via-Hearst] [3]
- **Implication [I].** A literature explorer for a broad reader is mostly an *exploratory* search system. Its success metric should be learning and coverage, not precision@10. Two tests that can be automated with LLM judges plus human spot checks:
  - Can the user write a better map of a field after 20 minutes? (Relatedly's evaluation design, §4.1)
  - Did the user encounter the field's canonical works and its main disagreements?

---

### 2. Interface mechanisms for large text collections: what was tried

#### 2.1 Summary table

| Idea (year) | Core mechanism | Best evidence | Verdict | Was it blocked by annotation or metadata cost? | LLM-era status [I] |
|---|---|---|---|---|---|
| **Scatter/Gather** (Cutting, Karger, Pedersen & Tukey 1992) [12] | Cluster the collection, show cluster summaries, user picks clusters, re-cluster ("scatter") on the fly; linear-time Buckshot/Fractionation | Worse than similarity search for retrieval, better at conveying topic structure (Pirolli et al. 1996) [10]; relevant docs fall in 1–2 of 5 clusters of top results (Hearst & Pedersen 1996) [11] | Research success; commercial descendants (Vivisimo/Clusty, Grokker) faded | **Yes:** cluster labels were poor, inconsistent and polythetic [2] | **Unblocked:** LLM labels match expert subtopics 88% of the time (Knowledge Navigator) [33] |
| **Faceted search / Flamenco** (Hearst et al., ~2000–2003) [2][14] | Hierarchical, orthogonal metadata facets with counts, combined with keyword search | 91% preferred over an image-search baseline despite being ~10× slower (n=32) [2] | **Worked.** Standard in e-commerce and library catalogs [T] | **Yes:** facets must be "designed and assigned"; automated assignment ~75% correct (2002–2009) [2] | **Unblocked:** LLM/fine-tuned classifiers (OpenAlex 2026) [35]; per-query facet induction |
| **Fisheye views** (Furnas 1986) [13] | Show items by degree of interest: a priori importance minus distance from focus [T] | Disliked by readers; overview+detail preferred by 19 of 20 (Hornbæk & Frøkjær 2001) [1] | Mostly failed for reading; survives in code folding and outliners [T] | Partly: a priori importance needs a model of what matters | LLM-estimated "importance" is possible, but the distortion is still the problem [I] |
| **TileBars** (Hearst 1995) [13a] | Each result is a bar of document segments; rows = query aspects; shade = term density per segment | Little formal evaluation; derivative HotMap preferred to Google with no time difference (n=21); 11 of 18 users didn't notice a similar graphic [1] | Niche; shipped in Pagis Pro97 [13a] | **Yes:** relied on literal term matches; Hearst noted it misleads when users omit synonyms [13a] | **Unblocked:** LLM can tag each segment with *semantic* aspects; good for books |
| **WebBook / Web Forager** (Card, Robertson & York 1996) [14a] | 3D "book" of web pages; hierarchical 3D workspace | Design exercise; no strong performance evidence | Failed to spread | No; the barrier was interaction and 3D | Spatial ideas carry over to 2D; 3D does not [I] |
| **Data Mountain** (Robertson et al. 1998) [15] | User places page thumbnails on an inclined 2.5D plane; spatial memory for retrieval | Beat IE Favorites for 32 users; retention after ~6 months (n=9) [15][16]; 2D equivalent as good [17] | **Spatial memory works; 3D unnecessary** | No | Persistent user-arranged 2D "boards" of books and papers [I] |
| **Zoomable UIs / Pad++** (Perlin & Fox 1993; Bederson & Hollan 1994) [19][20] | Infinite 2D canvas with zoom; **semantic zoom** changes representation by scale | Mixed; Prezi became the first mass-market ZUI (50M users by 2014) [20] | Niche for documents; ubiquitous for maps | Semantic zoom needed multi-level content authored by hand | **Unblocked:** LLM summaries at each zoom level |
| **StretchText** (Nelson, described 1967, published 1970) [20a] | Text expands in place to more detail | Mostly hypertext-fiction experiments; "has not achieved mass adoption on the World Wide Web" [20a] | Failed for lack of authored levels | **Yes:** authors had to write every level | **Unblocked:** LLM-generated levels (Paper Plain "gists") [46] |
| **3D information visualization** (Cone Trees, landscapes, 3D file managers; 1990s) | Use depth to hold more items | Inferior or equivalent to 2D/text in comparisons [1][17][18][19a] | **Failed** | No | Same verdict for VR reading rooms (R08) |

#### 2.2 Scatter/Gather and the clustering-engine era

- **Mechanism.** Cutting et al. argued that clustering had failed as a *retrieval-improvement* technique ("too slow" and "does not appreciably improve retrieval"), but could work "as an information access tool in its own right." They contributed "fast (linear time) clustering algorithms which support this interactive browsing paradigm." [P, high] [12]
- **Evidence:**
  - **Pirolli, Schank, Hearst & Diehl (CHI 1996).** Compared with keyword search, Scatter/Gather "induces a more coherent conceptual image of a text collection, a richer vocabulary for constructing search queries, and communicates the distribution of relevant documents over clusters." [P, abstract] [10] But "Scatter/Gather without a search facility was less effective than a standard similarity search" at finding relevant documents. [P-via-Hearst] [2]
  - **Hearst & Pedersen (SIGIR 1996).** When top-ranked results are clustered, relevant documents "tended to fall mainly into one or two out of five clusters," and precision and recall were higher within the best cluster. This was evidence for the cluster hypothesis. [P, abstract and Hearst] [11][2]
  - **Why clustering lost to categories** (Hearst's synthesis) [P] [2]:
    - polythetic clusters' "lack of predictability, their conflation of many dimensions simultaneously"
    - labels that "vary widely in level of description" (Clusty on "cats")
    - users "dislike organizations that show inconsistent levels of description"
    - graphical cluster views "much harder to use than textual representations" for non-experts (Kleiboemer et al. 1996)
    - categories preferred over clusters in comparisons (Rodden et al. 2001; Pratt et al. 1999)
  - **Grokker vs Vivisimo** (Rivadeneira & Bederson 2003): participants disliked Grokker's nested-circle display and preferred the textual Vivisimo, with "no significant differences in terms of speed and accuracy." [P-via-Hearst] [1]
  - **Cluster count:** with 40 groups, users were slower and found fewer relevant documents than with 10 or 20 (not significant), and rated 20 and especially 40 "too many." Hearst's summary: "fewer is better." [P-via-Hearst] [1]
  - **Commercial fate** [T, medium]: Vivisimo was acquired by IBM (2012). Grokker and Kartoo shut down around 2009–2010. Google's "Wonder Wheel" query map (2009) was removed around 2010.
- **What LLMs change [P for numbers, I for interpretation]:**
  - **Knowledge Navigator** (Katz, Levy & Goldberg, arXiv 2408.15836, Aug 2024) explicitly revisits Scatter/Gather. It organizes retrieved scientific papers into "a navigable, two-level hierarchy of named and descriptive scientific topics and subtopics." [P] [33]
    - Its authors say that methods like Scatter/Gather "failed to produce good representations of documents in practice" and struggled to generate interpretable clusters.
    - With modern embeddings, a searcher needs to check only 2.3–3.18 clusters out of 50 (5–7% of the collection) to cover 80% of a topic's documents, against 20.4 clusters (41%) under random assignment.
    - The LLM cluster reader (GPT-4o or Mixtral-8x7B) produced names matching 88% of expert subtopics. Random clusters got generic names, with 6% coverage.
    - Surprise: SPECTER2, a science-specific embedding model, *lagged* general-purpose embeddings (text-embedding-3-large, SFR-Mistral) for this task.
  - **Clio** (Anthropic, arXiv 2412.13678, Dec 2024) is Scatter/Gather at industrial scale. It embeds, runs k-means, has an LLM summarize and label, recursively builds "a multi-level hierarchy," and offers a 2D map view. [P] [34]
    - It reconstructed a synthetic 19,476-transcript topic distribution with 94% accuracy (vs 5% random).
    - Estimated cost was $48.81 per 100,000 conversations, about $0.0005 each. This is the paper's calculation at Claude 3 Haiku and Claude 3.5 Sonnet prices, assuming ~1,000-token conversations, not a measured bill. [corrected in verification]
    - Its stated failure modes include "overly broad labels" and hierarchy errors.
  - **LLooM** (CHI 2024) turns clusters into **concepts with explicit inclusion criteria**, and scores every document against each criterion. [P] [31]
    - Across four analysis scenarios it surfaced on average 2.0 times as many high-quality topics as BERTopic.
    - It covered 93% of examples vs 77.7%.
    - It beat GPT-4 zero-shot and BERTopic by at least 17.9% and 16.0% concept coverage on unseen datasets and nuanced concepts.
  - **TopicGPT** (NAACL 2024): LLM-written topic labels and descriptions reached harmonic-mean purity 0.74 against human-annotated Wikipedia topics, vs 0.64 for the strongest baseline. [P] [32]
- **Implication [I].** The Scatter/Gather interaction model (pick clusters, re-cluster the subset, repeat) was never refuted. Its labels were. A modern Scatter/Gather with LLM labels, explicit inclusion criteria and a synchronized ranked list is the most evidence-backed "new" interface a builder could ship. Hearst's warnings still hold:
  - keep labels at consistent levels
  - few clusters (about 10–20 or fewer)
  - always pair with search

#### 2.3 Faceted search (Flamenco and successors)

- **Mechanism.** Flamenco ("FLexible information Access using MEtadata in Novel COmbinations") uses hierarchical faceted metadata. Users can "both narrow and broaden a query while the collection's structure stays consistent," mixed freely with keyword search. [P] [14]
- **Evidence.** Yee, Swearingen, Li & Hearst (CHI 2003) [P-via-Hearst, high] [2]:
  - 32 art-history students, a ~35,000-item museum image collection, compared with a Google-Images-style baseline.
  - "88% said that Flamenco was more useful for the types of searching they usually do and 91% said they preferred Flamenco to the baseline overall."
  - For a single-facet task ("roses"), about 50% preferred the baseline.
  - This held even though "the faceted interface was an order of magnitude slower than the baseline."
  - Caveat: "the order in which interfaces were viewed had a strong effect on these ratings."
- **The cost barrier.** Facets have "the drawback of requiring the category structure to be designed and assigned to items." Categories "require manual curation," and automated assignment was "about 75% correct on average" (citing Sebastiani 2002). [P] [2]
  - Human-curated web directories, the other large manual-classification effort, closed: Yahoo Directory (2014) and DMOZ (2017). [T, high]
- **What has changed:** OpenAlex's October 2026 switch to a fine-tuned Qwen3-8B topic classifier (§summary item 4) [P] [35]. An LLM can also induce *query-specific* facets ("study design," "era," "level," "prerequisites") that no cataloger would pre-assign. [I]
- **Implication [I].**
  - Faceted navigation is the safest bet for a personal catalog of books, papers and lectures.
  - Generate facet values with a cheap model in batch, show confidence, let users correct, and treat corrections as training signal.
  - Watch Hearst's design warnings: "clutter, dead ends, and confusion." [P] [2]

#### 2.4 Fisheye views, overview+detail, zooming: the comparative evidence

- **Fisheye (Furnas 1986).** A "degree of interest" function trades a priori importance against distance from the current focus, so the display shows the local neighborhood in detail plus globally important landmarks. [T, high; bibliographic record P, 2,195 citations] [13]
- **Hornbæk & Frøkjær (CHI 2001)**, the study most relevant to reading [P-via-Hearst, high] [1]:
  - 20 participants wrote essays and answered questions about technical articles in linear, fisheye and overview+detail readers.
  - "All but one participant preferred the overview detail interface"; participants "did not like the fisheye view."
  - They "achieved higher grades using the overview detail view, but spent more time in this view in the question answering tasks."
- **Cockburn, Karlson & Bederson**, "A review of overview+detail, zooming, and focus+context interfaces" (*ACM Computing Surveys* 41(1), 2008; 784 citations) [P metadata] [19b]. The full text was not reachable (ACM 403). From training knowledge [T, medium]:
  - Overview+detail is the most consistently preferred and rarely harmful.
  - Zooming separates views in time and loads working memory.
  - Distortion-based focus+context can help some navigation tasks but hurts target acquisition and judgments of spatial relationships.
  - Results are strongly task-dependent, with no universal winner.
- **Related [T, medium-low]:** Hornbæk, Bederson & Plaisant (TOCHI 2002) found users preferred a zoomable interface *with* an overview, though the overview did not always make navigation faster.
- **Implication [I].** For long documents and books:
  - Use an always-visible overview (a minimap or outline with section labels and highlight density, as in Scim's sidebar) next to a normal reading view.
  - Don't distort the text.
  - LLMs make the overview *semantic*: section gists, "where is the argument," "where are the results."

#### 2.5 TileBars and "where in the document" displays

- **Mechanism.** The query is split into topics ("term sets"). Each document is shown as a rectangle proportional to its length, divided into segments by TextTiling or 100-token blocks. Each row is a term set and each column a segment, with darker tiles meaning more hits. The pattern shows whether topics co-occur *in the same passage* or only in passing. Clicking jumps to the best passage. [P] [13a]
- **Evidence:**
  - Hearst's own page reports no formal user study of TileBars itself. A TileBars-suited ranking beat vector-space ranking on very short queries at high precision (SDAIR 1996). A simplified "MatchBars" variant shipped in Pagis Pro97. [P] [13a]
  - Derivatives [P-via-Hearst] [1]:
    - HotMap (Hoeber & Yang 2006, 21 students): "No significant timing differences … but the visualization was preferred to standard Google."
    - Heimonen & Jhaveri (2005): "11 of the 18 participants did not notice the graphic."
    - Reiterer et al. (2005, 40 participants): a field-sortable list was the favorite, then TileBars; bar charts were significantly worse than a web-style list.
- **Why it stalled.** It depended on users splitting queries into term sets and on literal term matches. Hearst noted that TileBars "can mislead when users omit query words that describe a topic." [P] [13a]
- **What LLMs change [I].**
  - The aspect detector can be semantic: "does this chapter discuss *calibration*?" rather than "does it contain the string 'calibration'?"
  - Segments can be chapters, not 100-token blocks.
  - Aspect strips can be precomputed per book for a fixed vocabulary of the reader's interests, and computed on the fly for new aspects.
  - Cost estimate for 10,000 books (see the cost appendix): roughly $90 with a small model in batch.
  - This is the most underused "good idea blocked by annotation cost" in this dossier.

#### 2.6 Spatial and 3D workspaces: WebBook, Web Forager, Data Mountain, and why 3D failed

- **WebBook and Web Forager (CHI 1996).** A "3D interactive book of HTML pages," "interaction with objects at a higher level of aggregation than pages," embedded in "a hierarchical 3D workspace." The authors called them "exercises to play off against analytical studies of information workspaces." [P, abstract] [14a]
- **Data Mountain (UIST 1998)** [P, high] [15]:
  - 32 experienced IE4 users stored 100 web pages. Retrieval cues were title, thumbnail, summary, or all three.
  - Data Mountain "reliably facilitated speedy retrieval of web pages when compared to IE4." Reaction time effect: F(2,18) = 4.84, p < .02.
  - Users made fewer incorrect retrievals with the revised second version.
- **Czerwinski et al. (INTERACT 1999)** [P] [16]:
  - Nine subjects returned about 6 months after building their layouts. Their retrieval times "were not significantly slower" even though they "had not seen their web page layout for several months." They had seen it once more in a pilot about 6 weeks after the first session, and they got 5 minutes to review it before the trials. [corrected in verification]
  - Removing thumbnails (blank icons) caused an initial drop, then "within a short period of time" no difference. The layout, not the pictures, carried the memory.
- **Cockburn & McKenzie, "3D or not 3D?" (CHI 2001)** [P, high] [17]:
  - The 2D and 3D versions of a Data-Mountain-like system "differ only in the number of dimensions."
  - Users were "faster at storing and retrieving pages … when using the 2D interface, but not significantly so."
  - Yet "subjective assessments showed a significant preference for the 3D interface."
- **Cockburn & McKenzie (CHI 2002)**, physical and virtual 2D / 2½D / 3D models [P, high] [18]:
  - 69 CS students, 2,070 trials, mean retrieval 4.13 s.
  - Means were 3.7 s (2D), 3.8 s (2½D) and 4.8 s (3D), F(2,63) = 2.5, **p = .09 (marginal)**. Density effects were strong: 3.2 / 4.2 / 5.0 s, p < .001.
  - Users rated higher-dimensional interfaces more "cluttered." This was significant only for the physical models (2D 2.7 vs 3.4 for both 2½D and 3D); virtual-interface clutter ratings did not differ significantly. [corrected in verification] The researchers often heard "where did I put that group" in the 3D physical condition.
  - Conclusion: "for relatively sparse information retrieval tasks (up to 99 data items), 3D hinders retrieval."
  - Note that the abstract states this more strongly than the statistics support.
- **Cockburn (2004), "Revisiting 2D vs 3D Implications on Spatial Memory."** Re-ran Tavanti & Lind's (2001) pro-3D experiment with tighter controls. "The effectiveness of spatial memory is unaffected by the presence or absence of three-dimensional perspective effects." Items are better remembered when "personally meaningful and visually distinctive." [P, high] [19a]
- **Search-result visualization in 3D** [P-via-Hearst] [1]:
  - "3D has been found to be inferior, or at best equivalent to 2D or textual interfaces."
  - Sebrechts et al. (1999, 15 participants, 32 tasks designed to *favor* visual interfaces): "the textual view was significantly faster than the other two, and … 2D was faster than 3D." Times converged with familiarity, and "the lack of legibility of the text" was a core problem.
  - Tory et al. (2007): "point-based spatializations were superior to landscapes, and 2D landscapes were superior to 3D landscapes."
  - Westerman & Cribbin (2000): 3D's extra meaning did "not outweigh the associated additional cognitive demands."
- **Why 3D failed (synthesis) [I, high]:**
  1. **Text legibility.** Literature is text, and text in perspective or at depth is hard to read.
  2. **Occlusion and navigation cost.** Every view change costs time and working memory.
  3. **The benefit people wanted, spatial memory, is fully available in 2D** (Cockburn 2001, 2004).
  4. **Preference ≠ performance.** Users often like 3D. Designers who evaluate by enthusiasm get misled, which is a warning for VR demos too.
  5. Individual differences in spatial ability dominate the results (Chen & Yu 2000). [P-via-Hearst] [1]

#### 2.7 Zoomable UIs, semantic zoom and StretchText

- **ZUIs.** Pad (Perlin & Fox 1993) introduced an infinite zoomable canvas. Pad++ (Bederson & Hollan, UIST 1994) and later Jazz and Piccolo followed. Piccolo is "no longer actively maintained" (successor Piccolo2D). Prezi (2009) "was the first ZUI to reach mainstream adoption" and passed 50M users by 2014. [P via Wikipedia] [20][19]
- **Semantic zoom** changes *representation* with scale rather than magnifying it. Pad's calendar shows years when zoomed out and days when zoomed in. [P] [20]
- **StretchText** (Ted Nelson; concept by 1967, published September 1970): text "expands or contracts content where it sits," keeping context. Its uses were mostly literary (*Victory Garden* 1991; *The Jew's Daughter* 1998; a Tractatus demo), and it "has not achieved mass adoption on the World Wide Web." [P] [20a]
- **Why these stalled [I].** Semantic zoom and StretchText both need content written *at several levels of detail*, and authors rarely have time to write three versions of everything. That is an annotation-cost problem.
- **LLM unblocking [P/I]:**
  - Paper Plain generates section "gists" on demand. Readers used passage summaries more often than definition tooltips. [P] [42][46]
  - Sensecape builds multilevel abstraction for LLM exploration. [P] [58]
  - A literature explorer can offer a **zoom ladder** from field to subfield to book to chapter to section to paragraph, each level with a generated gist and a link to the source span. The risk is faithfulness (R07: FABLES found about 90% of claims faithful for the best 2024 model).

---

### 3. Literature maps

#### 3.1 Tools and projects compared (status as of October 2026)

| Tool / project | Map type | Data | Price / license | Status 2026 | Source |
|---|---|---|---|---|---|
| **VOSviewer** (CWTS Leiden) | Bibliometric networks (citation, co-citation, coupling, co-authorship, term co-occurrence) with VOS layout and clustering | OpenAlex API, Scopus, WoS, Dimensions, Europe PMC, Crossref, Semantic Scholar, Lens | Free download [T, high]; VOSviewer Online built into Dimensions [P] | v1.6.21, 2026-06-12. Malware-download warning for Aug 31 (year not stated) | [21][22] |
| **CiteSpace** (Chaomei Chen) | Co-citation clusters, emerging-trend and burst detection, dual-map overlays, timelines | WoS/Scopus exports and others | **Paid:** $65 (1 yr), $110, $155 (2 yr) [P]; formerly free [T, medium] | v7.0.2, 2026-08-25. 6.4.R2 Advanced adds "GPT-augmented cluster summarization" | [23][24] |
| **Places & Spaces: Mapping Science** (Börner, Indiana) | Curated exhibit of science maps | Varies | Exhibit / books | 100 maps in the first decade; *Atlas of Macroscopes* (2025) covers 40 interactive "macroscopes" | [20b] |
| **Paperscape** (George & Knegjens) | arXiv as particles; references are attractive forces (n-body); circle size = citations | arXiv | Free | Live; "Last updated: ?" (stale?) | [24a] |
| **Open Knowledge Maps** | Per-query knowledge maps of clustered results | BASE: "400 million outputs," 11,000+ sources; PubMed [T] | Free; non-profit; open source | Claims >1M users | [24b] |
| **Open Syllabus Galaxy** | Co-assignment map of titles across syllabi | 32.9M syllabi (site, 2026); Analytics v2.13 = 27.6M (May 2025) | Galaxy free; premium via VitalSource partnership (May 2025) | Live | [24c][24d][24e] |
| **Connected Papers** | Seed-paper similarity graph (co-citation and bibliographic coupling) [T] | Semantic Scholar [T/R04] | Free 5 graphs/month (R04, verified from JS bundle) | Active | R04 |
| **Apolo** (CMU, CHI 2011) | Interactive citation-network sensemaking: user-defined groups, belief propagation, rank-in-place, stable landmarks | 83,000-article Google Scholar crawl | Research prototype | Historical | [25] |
| **Nomic Atlas** | Hosted embedding maps (deepscatter WebGL) | User uploads | Nomic pricing page no longer mentions Atlas | Nomic pivoted to AEC agents; Atlas docs still linked; client last released 2025-11-11 | [39][40][41][45] |
| **datamapplot** (Tutte Institute) | Static and interactive labeled embedding maps (search, zoom, pan) | Any embeddings | MIT | 0.7.3, 2026-05-31; ~1.0k GitHub stars | [26][45] |
| **Toponymy** (Tutte Institute) | LLM naming of clusters at multiple scales | Any embeddings | MIT; beta ("Things can and will break") | 0.5.4, 2026-09-04; supports Anthropic, OpenAI, Cohere, local models | [27][45] |
| **EVoC** (Tutte Institute) | "Embedding Vector Oriented Clustering" | — | — | 0.3.1, 2026-03-27 | [45] |
| **Latent Scope** (enjalot) | Embed → UMAP → cluster (EVoC/HDBSCAN/k-means/GMM) → LLM label → explore; local-first | Any text/image | MIT | 1.0.0, 2026-07-12; "curate" step planned for 1.1; 794 stars | [28][45] |
| **WizMap** (Georgia Tech/Apple, ACL 2023) | Multi-resolution embedding summaries; map UI in the browser | Millions of points (WebGL, Web Workers; no backend) | Open source | — | [29] |
| **Embedding Atlas** (Apple) | Embedding map plus cross-filtered metadata charts, density contours, automatic clustering and labels, nearest-neighbor search, MCP access for agents | "Up to a few million points" via WebGPU | MIT | 0.25.0 on PyPI and npm, 2026-10-03; paper arXiv 2505.06386 | [30][30a][45] |
| **BERTopic** | Embed → reduce → cluster → class-based TF-IDF topic words | Any | MIT | 0.17.4, 2025-12-03 | [36][45] |
| **OpenAlex Topics** | 4,516 topics / 252 subfields / 26 fields / 4 domains | All OpenAlex works | CC0 data (OpenAlex) [T] | Fine-tuned Qwen3-8B classifier since October 2026 | [35] |

#### 3.2 Science maps: what they're for

- **Börner's lineage** (*Atlas of Science* 2010, *Atlas of Knowledge* 2015, *Atlas of Forecasts* 2021; the Places & Spaces exhibit; *Atlas of Macroscopes* 2025) treats maps mainly as tools for **communication and policy**: showing the structure of science, flows of funding, and emerging areas. They were not built as retrieval interfaces. [P] [20b]
- **VOSviewer and CiteSpace** are analyst tools for bibliometricians writing reviews, with enormous academic uptake (S2 citation counts on 2026-10-15: VOSviewer software survey 20,117; CiteSpace II 2,807). [P] [22][24]
  - Their success is a sign that *experts doing analysis* benefit from maps, which matches Hearst's point that visualization suits "analytical tasks" better than search. [P/I] [1]
  - A side effect [I, medium]: VOSviewer/CiteSpace figures have become a ritual in bibliometric review papers. Map popularity ≠ map validity.

#### 3.3 Embedding maps and topic models: the LLM-era stack

- **The pipeline** (now a template):
  1. Embed documents (SPECTER2 for papers; general text embedders often do better, per Knowledge Navigator [33]).
  2. Reduce to 2D with UMAP (McInnes, Healy & Melville 2018; claims t-SNE-level quality, "arguably" more global structure, and "superior run time performance") [P] [38].
  3. Cluster in high dimensions (HDBSCAN, EVoC).
  4. Label clusters with an LLM at several levels (Toponymy, Latent Scope, Clio, Knowledge Navigator).
  5. Render (datamapplot, deepscatter, Embedding Atlas, WizMap).
- **Topic models.**
  - LDA (Blei, Ng & Jordan 2003) gave each document a mix of word-distribution topics [T, high]. Its outputs (word lists) needed heavy interpretation.
  - BERTopic (2022) moved to embedding clusters with class-based TF-IDF keywords. [P] [36]
  - TopicGPT and LLooM replaced keywords with natural-language labels, descriptions and explicit criteria. LLooM's example: BERTopic's "women, power, female" vs LLooM's "Criticism of traditional gender roles." [P] [31][32]
- **The cost of running the pipeline is now trivial** [I, using verified prices]:
  - Embedding 1M abstracts (~300M tokens) costs about $6 at $0.02/MTok (text-embedding-3-small, per R10), or $0 using Semantic Scholar's precomputed SPECTER2 vectors (120M papers, per R10).
  - Hierarchical labeling of a few thousand clusters costs well under $30 even with Claude Opus 5.5 ($4 / $20 per MTok) [P price] [59].
- **The distortion problem (Chari & Pachter 2023)** [P, high] [37]:
  - In 2D t-SNE/UMAP embeddings, a point's 30 nearest neighbors overlap poorly with its neighbors in the original space (mean Jaccard distance "consistently above 0.7").
  - Correlations of neighbor rankings at the global level were "low (≤ 0.4)."
  - Max/min distance ratios were inflated 4–200×.
  - By the Johnson–Lindenstrauss lemma, preserving pairwise distances to within 20% for 10,000 points needs at least 1,842 dimensions.
  - Two batch-correction methods looked similar in the original space but "opposite" in UMAP.
  - The domain is single-cell genomics, but the geometric argument applies to any embedding. [I, high]
  - A correction to the article was issued 2025-11-04. [P]
- **Implication [I].** Use the 2D map as an *index of regions*, not as a similarity measure:
  - On hover, show the item's true high-dimensional neighbors (which may be far away on the map).
  - Compute clusters in the original space, not in 2D.
  - Label regions with LLM names at several zoom levels.
  - Never imply that distance on the map means anything quantitative.

#### 3.4 Do maps help users find relevant work? The evidence

| Study | Setup | Result | Source |
|---|---|---|---|
| Chen & Yu 2000 meta-analysis | Six IR-focused visualization studies from five papers (Hearst's description) | "The combined effect of visualization in the studies was not statistically significant." Cognitive differences dominated. Holding ability constant, simpler visual-spatial interfaces did better | [1] (P-via-Hearst; possibly stale) |
| Chen et al. 1998 | Yahoo category directory vs Kohonen self-organizing map of the same pages | Of 15 who started on the map, 11 found an interesting page within 10 minutes and 8 of those re-found it in Yahoo. Of 16 who started in Yahoo, 14 found one, but only 2 of the 14 could re-find it on the map. Single-term labels "misleading" | [1] |
| Sebrechts et al. 1999 | Text vs 2D vs 3D cluster views; 15 participants | Text fastest; 2D faster than 3D; differences shrink with practice | [1] |
| Pirolli et al. 1996 | Scatter/Gather vs keyword search | Better topic-structure learning; worse pure retrieval | [10][2] |
| Tory et al. 2007 | Point vs landscape spatializations | Points beat landscapes; 2D beats 3D | [1][19c] |
| Apolo, Chau et al. 2011 | 12 participants updating a survey's related work; 83k-paper citation graph | Expert-judged: "significantly more relevant papers" than the control | [25] |
| Open Syllabus Galaxy, 2024 self-report | Large-scale co-assignment map | Attracts "admiration" but "little substantive debate"; readers lack "habits for interpreting large-scale plots" | [24d] |
| Knowledge Navigator 2024 | Embedding clusters with LLM labels over retrieval results | 2.3–3.18 of 50 clusters cover 80% of a topic's documents; 88% label match | [33] |

- **Bottom line [I, medium-high]:**
  1. Maps and clusters help people **learn the shape of a field** and **narrow down** when labels are good and users can also search.
  2. They do not beat lists for **targeted retrieval**.
  3. Label quality was the historical bottleneck, and LLMs have largely fixed it.
  4. The only positive controlled discovery result I could verify (Apolo) involved a map that was **user-steered**, with user-defined groups, machine-learned relevance and *stable* positions. It was not a passive overview.
  5. I found no recent controlled study showing that a Connected-Papers-style graph or an embedding map beats a good ranked list for finding relevant papers. Because search was unavailable this session, I'd put **~60%** on "no strong such study exists."

---

### 4. Reading interfaces

#### 4.1 The Ai2 Semantic Reader research program

The program, 2020–2023, is a multi-institution effort. It produced ten research prototypes, ran usability studies with 300+ participants, and released a production reader. It is organized around five reader challenges: discovery, efficiency, comprehension, synthesis, accessibility. [P, high] [42]

| Prototype | Mechanism | Study and numbers | Shipped? |
|---|---|---|---|
| **ScholarPhi** (Head et al., CHI 2021) [43] | Position-sensitive definitions of terms and symbols in tooltips; "declutter" filter showing every use of a term; equation diagrams; auto-glossary | Formative studies with 24 researchers. Evaluation with 27 participants: answered questions "in significantly less time, while viewing significantly less of the paper." All readers said they'd use tooltips and formula diagrams "often or always." **Definition detection was the bottleneck**: a state-of-the-art model reached 73% precision / 74% recall | "Definitions on demand" (AI-generated, context-based) in Semantic Reader [48] |
| **CiteSee** (Chang et al., CHI 2023) [44] | Inline citations colored by the reader's history (cited, saved, opened) and highlighted by predicted relevance; paper cards | Lab study, 10 participants: the "Reencountered" strategy beat three baselines significantly. Field deployment, 6 participants, 1–2 weeks: reencountered citations were 8.2% of citations but 37% of paper cards opened. A prior survey found inline citations accounted for ~21% of paper discoveries | "Personalized in-line citations" (desktop, needs a library) [48] |
| **Scim** (Fok et al., IUI 2023) [45a] | Faceted highlights (objective, novelty, method, result), evenly distributed and adjustable in density | Lab study, 19 participants: found information "in significantly less time … with comparable effort and accuracy." Diary study, 12 participants over 2 weeks: 74 of 105 sessions (70.4%) said highlights helped. Best for text-dense papers and papers outside one's field | "Skimming highlights" (Goal/Method/Result) for most English CS arXiv papers [48] |
| **Paper Plain** (August et al., TOCHI 2023) [46] | For lay readers: term definitions, section "gists" (LLM-generated), key-question index linking to answering passages | 24 Upwork participants, within-subjects: "significantly easier time reading," more confident, with similar comprehension. Readers used gists more than definitions | Not as such |
| **Threddy** (Kang et al., UIST 2022) [47] | Clip sentences from related-work sections into a hierarchy of "threads," keeping provenance and citations; thread-based recommendations | 9 participants vs Google Docs: significantly more clips and references collected; higher flow scores | No |
| **Relatedly** (Palani et al., CHI 2023) | Search across *existing related-work paragraphs* from many papers; auto-generated paragraph titles (from a fine-tuned BART summarization model, not a modern LLM) [corrected in verification]; diversity ranking; tracks explored references | Within-subjects study (n=15) against a baseline paper list emulating a scholarly search engine [corrected in verification]: participants wrote summaries rated "significantly more coherent, insightful, and detailed after 20 minutes" | No |
| Others: CiteRead, Ocean, Papeo, SciA11y | Citances placed in the cited paper; low-vision hyperlinks; paper–video fusion; screen-reader HTML | See [42] | SciA11y lives on as papertohtml.org demo [42] |

- **Key lessons [P quotes, I synthesis]:**
  - Highlights need "just the right density (too few highlights will present the guise of an inept tool, and too many will slow a reader down)." [42]
  - "Even slight errors in these models can have detrimental effects on the readers." [42]
  - Relatedly works around costly synthesis by **reusing human-written related-work sections**, a clever way to get expert overviews without generation. The same trick applies to books: introductions, literature reviews, "further reading" sections and syllabi. [I]
  - Coverage: Semantic Reader is limited to arXiv papers (per R04, more than 250k), and skimming highlights only to CS. **Books are not covered by any of this research.** That is an open niche. [P/I] [48]

#### 4.2 LiquidText

- **Research origin:** Tashman & Edwards, "LiquidText: a flexible, multitouch environment to support active reading," CHI 2011 (114 citations). [P metadata] [49a]
- **Mechanism** [T, high]: excerpts are dragged out of the document onto a workspace, the document can be "collapsed" to bring distant passages together, and comments link to many passages.
- **Product (2026):** notes, highlights and excerpts linked to their sources across documents; iPadOS, Windows and macOS; "LIVE" cloud-sync subscription. The homepage mentions **no AI features**, and the pricing page returned 404 on 2026-10-15. [P] [49]
- **Implication [I].** LiquidText's core move, *excerpts as first-class objects that keep links to their source*, is exactly the "evidence file" of the sensemaking loop. An LLM-era version would pre-extract candidate excerpts (claims, definitions, data) and let the reader accept or reject them.

#### 4.3 Explorable explanations and Distill

- **Bret Victor, "Explorable Explanations" (2011-03-10; postscript February 2024)** [P] [50a]:
  - "I want text to be used as an *environment to think in*."
  - Three forms: *reactive documents* (readers change the author's assumptions and see the consequences), *explorable examples*, and *contextual information*.
  - He warns that most interactive widgets "dump the user in a sandbox." The 2024 postscript reframes the goal as "a written *argument* whose assertions are backed by explorable computational models."
- **Distill (2016–2021)** [P] [50][51]:
  - Hiatus announced 2021-07-02 ("After five years, Distill will be taking a break"). Reasons: each article "still requires significant work," "all of this is done by our editors in a volunteer capacity," and "these frictions have caused our team to struggle with burnout." The editors predicted that "the future for most types of articles is probably self-publication."
  - The homepage lists about 32 articles; the latest is dated 2021-09-02.
- **The blocking cost [I].** Interactive explanations are expensive to author. Distill's bottleneck was editorial mentorship and production, not ideas.
  - LLMs can now generate interactive explainers on demand (R07 covers generative UI), which removes the authoring barrier.
  - The verification barrier remains: a reactive document whose model is wrong teaches wrong intuitions convincingly.
  - Best fit: generate explorables for *well-specified models*, such as a formula in a textbook or a simulation described in a paper, and check them against the source.

#### 4.4 Tools for thought and the mnemonic medium

- **"How can we develop transformative tools for thought?"** (Matuschak & Nielsen, October 2019) [P] [52]:
  - The mnemonic medium embeds spaced-repetition cards in an essay.
  - Quantum Country's first essay ("Quantum computing for the very curious," about 4 hours of reading) had 112 questions. Review intervals step from "in-text" to 5 days, 2 weeks, a month, and so on, reaching about 4 months after five successful reviews.
  - Results:
    - After 6 repetitions, most users reached about 6,000 days of total demonstrated retention, roughly 54 days per question, for about 95 minutes of total review.
    - Six months after release, 195 users had demonstrated a month of retention on at least 80% of cards.
    - In an informal 8-card experiment, the delayed-review group's accuracy fell from 91% to 87% (n=25), while the regular-review group rose from 89% to 96% (n=16).
    - The authors retracted one earlier claim after finding a data-analysis error.
  - Why the field stalls: a public-goods problem, "insight through making," and hard-to-describe effects. They admit Quantum Country did not reach their own card-writing standard.
  - Quantum Country is still live with four essays and Patreon support. [P] [53]
- **"Why books don't work"** (Matuschak, 2019-05-11): books rely on "transmissionism" and leave all the metacognitive work to the reader. "We can make new forms instead." [P] [54]
- **The blocking cost [I].** Good prompts are hard to write. Matuschak and Nielsen hand-wrote every card. LLMs can draft prompts for any book chapter at negligible cost, but the evidence that *machine-written* prompts produce the same retention is missing. I could not search; [~70%] that no published controlled comparison exists. A tool should treat LLM prompts as drafts the reader edits and accepts.

#### 4.5 Ink & Switch: malleable software (June 2025)

- **Authors:** Geoffrey Litt, Josh Horowitz, Peter van Hardenberg, Todd Matthews. [P] [55a]
- **Thesis:** "a software ecosystem where anyone can adapt their tools to their needs with minimal friction." "Computerizing work led to a loss of agency."
- **Patterns:** a gentle slope from user to creator; "tools, not apps" (shared data, composable tools); communal creation.
- **On AI:** "AI code generation alone does not address all the barriers to malleability." "Bringing AI coding tools into today's software ecosystem is like bringing a talented sous chef to a food court." AI-assisted development "can make it much faster to edit your tools" *inside* a malleable environment (their Patchwork and Potluck prototypes).
- **Implication [I].** For a researcher building a personal literature explorer with Claude Code, the architectural lesson is to keep **one durable, open data layer** (catalog, annotations, trails, credences in SQLite/Parquet/JSON) and generate many small, disposable views over it. Avoid building one monolithic app.

#### 4.6 Memex, Mundaneum, Xanadu: the lineage and its lessons

- **Memex (Vannevar Bush, "As We May Think," *The Atlantic*, July 1945).** A microfilm desk that is an "enlarged intimate supplement to his memory." It was built around **associative trails**: chains of linked items with comments and side trails, *shareable with colleagues*. Bush imagined "a new profession of trail blazers" who map useful routes through the record. [P via Wikipedia; the Atlantic page could not be fetched] [56a]
- **Mundaneum (Paul Otlet and Henri La Fontaine; initiative 1895, Palais Mondial 1910).** "More than 12 million index cards and documents," classified with the Universal Decimal Classification. Partly destroyed after the 1940 invasion; the museum in Mons opened in 1998. [P via Wikipedia] [56b]
- **Project Xanadu (Ted Nelson, from 1960).** Transclusion ("virtual copies"), links visible and followable from all endpoints, royalties for any portion accessed, and "tumbler" addressing. Udanax source was released in 1998, XanaduSpace in 2007, OpenXanadu in 2014. *Wired* (1995) called it "the longest-running vaporware story in the history of the computer industry." [P via Wikipedia] [56c]
- **Lessons [I]:**
  1. **Trails are the underrated idea.** A reading path with reasons is a valuable, shareable artifact, and almost no tool treats it as one. LLM agents can now be Bush's "trail blazers," drafting trails for a human to edit.
  2. Otlet's Mundaneum was a hand-built *chunk-level* index: facts on cards, classified. That is what an LLM extraction pipeline produces, at a cost per card that is now negligible.
  3. Xanadu failed by requiring a whole new infrastructure (stable addressing, universal two-way links, payments) before delivering value. Gwern.net (below) gets most of the value (backlinks, transclusion, previews) as a layer on top of the ordinary web. Build layers, not platforms.

#### 4.7 Gwern.net's design

Gwern.net is the most developed public example of a "reading interface for a large linked corpus" built by one author. [P, high] [57a]

- **Recursive popups:** hover (desktop) or tap (mobile) a link to preview it; popups nest and can be dragged, pinned or resized. The popup script is credited to Said Achmiz (2019, MIT license).
- **Link annotations:** each annotated link has a "mini-page" with metadata, abstract and excerpts, hand-written or auto-extracted from arXiv, bioRxiv, medRxiv and Crossref. Rationale: let readers judge a source before visiting it.
- **Link icons:** "hundreds" of icons for filetype, domain, topic or author.
- **Sidenotes and margin notes:** after Tufte CSS. The sidenote essay dates from 2020.
- **Collapsible sections:** a short surface over deep material ("iceberg" structure).
- **Link bibliographies:** every link on a page, in order, with annotations expanded.
- **Backlinks with context:** since 2021, built nightly.
- **"Similar links":** nearest neighbors by neural embeddings, sorted so neighboring items are adjacent.
- **Local archives:** every link mirrored, because "every link dies someday."
- **Transclusion:** content embedded from other pages on demand.
- **Hierarchical tags, reader mode, inflation-adjusted dollar amounts.**
- **Evidence for previews at scale.** Wikimedia's Page Previews A/B tests (enwiki and dewiki, two tests, Oct 2017–Feb 2018) [P, high] [55]:

| Metric | Test 1 | Test 2 |
|---|---|---|
| Pageviews per session | −4% / −3% | −5% / −3% |
| Distinct pages interacted with per session | +22% / +20% | +21% / +21% |
| Back-button use | −8% / −2% | −9% / −3% |
| Previews seen (≥1 s) per pageview | 0.26 | 0.27 |
| Disable rate | ~0.01% of sessions | ~0.01% |

  - "No negative impact was observed" on fundraising.
  - Page Previews has been on all Wikipedias since July 2018. [P] [55b]
- **Implication [I].** Popup annotation is one of the few reading-interface ideas with large-sample evidence. It is a perfect LLM use: every citation, footnote and book mention gets a generated "what this is and why it's cited here" card. Show the source abstract first, the generated gloss second, and label which is which.

---

### 5. The "blocked by annotation cost" ledger

| Idea | What it needed | Why it was expensive then | What's possible now | Remaining risk |
|---|---|---|---|---|
| Faceted browsing | Facet schema and per-item values | Manual cataloging; automated ~75% correct [2] | LLM or fine-tuned classifier (OpenAlex: 94.5% on its confident 64%) [35] | Systematic errors; facet sprawl |
| Scatter/Gather | Coherent clusters with good labels | Labels inconsistent and misleading [1][2] | Embeddings plus LLM labels (88% expert match) [33]; Clio-style hierarchies [34] | Over-broad labels; label drift between runs |
| TileBars | Per-segment aspect detection | Literal terms only; synonyms missed [13a] | Per-chapter semantic aspect tags [I] | Hallucinated aspect presence; needs spot checks |
| ScholarPhi | Term and definition extraction | Bespoke models at 73% precision [43] | LLM definitions in context (shipped) [48] | "Slight errors … detrimental" [42] |
| StretchText / semantic zoom | Multiple authored levels | Authors had to write every level | Generated gists per level [46] | Faithfulness ~90% at best (R07, FABLES) |
| Explorable explanations | Hand-built interactive models | Distill burnout [50] | Generated explorables (R07) | Wrong model taught persuasively |
| Mnemonic medium | Expert-written prompts | Writing hard; QC fell short of its own standard [52] | LLM-drafted prompts the user edits | Unknown retention effect [~70% no RCT] |
| Memex trails | Human trail blazers | Time | Agent-drafted trails with reasons | Plausible but shallow paths |
| Gwern-style annotations | Hand-written or scraped abstracts | One author's time | LLM annotation per link [I] | Mislabeling; scent inflation (51.5% support) [57] |
| Related-work synthesis (Relatedly) | Expert overviews | Generation unreliable in 2022–23 | Reuse human paragraphs plus machine-generated titles (fine-tuned BART in 2023; an LLM today) [corrected in verification] [42] | Licensing of reused text [42] |

---

### 6. What failed for reasons LLMs will not fix

- **3D and depth**: perceptual and cognitive, not a metadata problem. [P] [17][18][19a][1]
- **Fisheye distortion of text**: readers dislike it. [P-via-Hearst] [1]
- **Maps replacing lists for retrieval**: lists win. [P-via-Hearst] [1]
- **Too many clusters or options**: "fewer is better." [P-via-Hearst] [1]
- **Individual differences**: spatial ability predicts who benefits from visualizations. [P-via-Hearst] [1]
- **2D embedding distortion**: mathematical. [P] [37]

---

## Numbers that matter

| Fact | Value | Date of info | Source | Label / confidence |
|---|---|---|---|---|
| Flamenco preference vs baseline | 91% preferred overall; 88% "more useful"; ~10× slower; n=32; ~35,000 images | 2003 (via 2009 book) | [2] | P-via-Hearst, high |
| Automated category assignment accuracy (pre-LLM) | "about 75% correct on average" | 2002/2009 | [2] | P, high (stale) |
| Chen & Yu meta-analysis | Combined effect of visualization not significant | 2000 | [1] | P-via-Hearst, high (stale) |
| Hornbæk & Frøkjær 2001 | 19 of 20 preferred overview+detail; higher essay grades | 2001 | [1] | P-via-Hearst, high |
| Kohonen map vs Yahoo | Only 2 of 14 Yahoo-first users re-found their page on the map | 1998 | [1] | P-via-Hearst, high |
| Scatter/Gather best-cluster concentration | Relevant docs mostly in 1–2 of 5 clusters | 1996 | [11][2] | P, high |
| Data Mountain | 32 users, 100 pages, reliable speed advantage over IE4 Favorites; F(2,18)=4.84, p<.02 | 1998 | [15] | P, high |
| Spatial memory retention | 9 users, ~6 months later, not significantly slower | 1999 | [16] | P, high |
| 2D vs 2½D vs 3D retrieval | 3.7 / 3.8 / 4.8 s; p = .09; 69 users; 2,070 trials | 2002 | [18] | P, high |
| 3D preference paradox | 2D faster (n.s.) but 3D significantly preferred | 2001 | [17] | P, high |
| Knowledge Navigator label match | 88% of expert subtopics | 2024 | [33] | P, high |
| Clusters to inspect for 80% coverage | 2.3–3.18 of 50 (vs 20.4 random) | 2024 | [33] | P, high |
| Clio | 94% reconstruction accuracy; $48.81 per 100k conversations | Dec 2024 | [34] | P, high |
| LLooM vs BERTopic coverage | 93% vs 77.7%; 2.0× high-quality topics | 2024 | [31] | P, high |
| TopicGPT purity | 0.74 vs 0.64 best baseline | 2024 | [32] | P, high |
| OpenAlex topics | 4,516 topics; Qwen3-8B; 94.5% right when ≥90% confident (64% of works); 81.7% primary-topic agreement; ~10% unclassified | Oct 2026 | [35] | P, high |
| UMAP/t-SNE neighbor distortion | Mean Jaccard distance of 30-NN > 0.7 | 2023 | [37] | P, high |
| Semantic Reader program | 10 prototypes; 300+ participants | 2023 | [42] | P, high |
| ScholarPhi | n=27; significantly faster answers; definition detection 73% P / 74% R | 2021 | [43] | P, high |
| Scim | n=19 lab; 70.4% of 105 diary sessions "helped" | 2023 | [45a] | P, high |
| CiteSee field study | Reencountered citations 8.2% of citations but 37% of cards opened | 2023 | [44] | P, high |
| Paper Plain | n=24; easier reading, same comprehension | 2022–23 | [46] | P, high |
| Wikipedia Page Previews | +20–22% distinct pages; −3 to −5% pageviews; ~0.01% disable | 2017–18 | [55] | P, high (stale) |
| Generative search verifiability | 51.5% of sentences fully supported; 74.5% of citations supportive | 2023 | [57] | P, high (2023 systems) |
| Quantum Country | 112 cards; ~54 days per card retention after 6 reviews (~95 min total review) | 2019 | [52] | P, medium |
| Distill | ~32 articles; hiatus 2021-07-02 | 2021 | [50][51] | P, medium (count) / high (date) |
| VOSviewer | v1.6.21 (2026-06-12); 2010 paper 20,117 citations | 2026 | [21][22] | P, high |
| CiteSpace | v7.0.2 (2026-08-25); $65 / $110 / $155 | 2026 | [23] | P, high |
| Open Syllabus | 32.9M syllabi; Galaxy free | 2026 / 2025 | [24c][24e] | P, high |
| Embedding Atlas | "Up to a few million points"; v0.25.0 (2026-10-03); MIT | 2026 | [30][45] | P, high |
| Claude Haiku 5.5 / Sonnet 5.5 / Opus 5.5 | $0.10/$0.50; $2/$10; $4/$20 per MTok; Batch −50% | 2026-10-15 | [59] | P, high |
| Prezi users | 50M by 2014 (first mainstream ZUI) | 2014 | [20] | P via Wikipedia, medium |
| Mundaneum | >12 million index cards | historical | [56b] | P via Wikipedia, high |

---

## Surprises and recent changes (2024–2026)

1. **Nomic pivoted away from data maps.** Its 2026 homepage and pricing sell agents for architecture, engineering and construction ($20/month Individual; $40/user/month Business with a 25-seat minimum). Neither page mentions Atlas; it survives only on the docs site (docs.nomic.ai, "Atlas Docs") and at atlas.nomic.ai. [corrected in verification] The open-source `deepscatter` npm package's latest stable release (2.15.2) dates from 2024-03-26, but 3.0.0 prereleases continued until 3.0.0-next.51 on 2025-05-29. [corrected in verification] [P] [39][40][41][45] Anyone planning to rely on hosted Atlas maps should plan for self-hosted alternatives: datamapplot, Embedding Atlas, Latent Scope.
2. **OpenAlex moved topic assignment to a fine-tuned 8B LLM in October 2026.** The topic list was built by citation clustering plus LLM naming. This is the clearest case of LLMs taking over a classic cataloging job at scale. [P] [35]
3. **Apple released a production-quality open-source embedding explorer** (Embedding Atlas, 2025; v0.25.0 in October 2026). It has MCP access so AI agents can query the map. [P] [30][30a]
4. **The Tutte Institute stack** (datamapplot, EVoC, Toponymy) matured, and Toponymy turns multi-level LLM cluster naming into a library. [P] [26][27][45] Latent Scope reached 1.0 in July 2026. [P] [28][45]
5. **CiteSpace is now a paid product** ($65–$155) with GPT cluster summaries. VOSviewer stays free [T] and added Europe PMC and new Scopus formats. VOSviewer's site warns of a malicious download on August 31 (year unstated). [P] [21][23]
6. **Open Syllabus partnered with VitalSource** (May 2025) for financial and technical support, and passed 27.6M syllabi (May 2025), then 32.9M (site, 2026). The Galaxy remains free. [P] [24c][24e]
7. **Börner published *Atlas of Macroscopes*** (2025), covering 40 interactive "macroscopes" from Places & Spaces' second decade. [P] [20b]
8. **Bret Victor added a 2024 postscript** to *Explorable Explanations*, reframing it as arguments backed by explorable computational models. [P] [50a]
9. **Ink & Switch's *Malleable software* (June 2025)** argued that AI coding alone doesn't produce malleability. This is directly relevant to people building personal tools with Claude Code. [P] [55a]
10. **A historical surprise:** Cockburn & McKenzie's often-cited 2002 "3D hurts" result was statistically *marginal* (p = .09). Their 2001 study found no significant 2D/3D difference but a significant *preference* for 3D. "3D failed" means "3D gave no measurable benefit and made things worse," not "3D was dramatically worse." [P] [17][18]
11. **SPECTER2 underperformed general embedders** for topic clustering of scientific papers in Knowledge Navigator's evaluation. Don't assume a domain-specific embedding is best for maps. [P] [33]

---

## Contested or uncertain points

1. **Does 3D help spatial memory?**
   - Tavanti & Lind (2001) reported a 3D advantage. Cockburn (2004) replicated with controls and found none. [P] [19a]
   - Robertson et al.'s Data Mountain advantage over IE Favorites is real, but probably came from *spatial layout plus thumbnails*, not depth [P/I] [15][17].
   - Status: 2D spatial memory benefit, high confidence; extra benefit from 3D, low confidence (≤20%).
2. **Preference vs performance.** Users significantly preferred 3D (2001), Flamenco despite being 10× slower (2003), and HotMap with no speed gain (2006). [P] [17][2][1]
   - Is preference a proxy for something real (engagement, confidence, learning) that speed metrics miss? For exploratory search, plausibly yes [I, ~55%].
   - Treat enthusiastic demo feedback as weak evidence.
3. **Is the visual information-seeking mantra right for text?** It is a heuristic from 1996, and Shneiderman himself called for validation. For text collections, "overview first" often loses to "search first, then overview of the results" (Hearst & Pedersen's clustering of *retrieved* sets beat clustering whole collections). [P/I] [6][11]
4. **Embedding maps: useful or "specious"?** Chari & Pachter argue 2D embeddings are unreliable for analysis. Map advocates argue they are good for orientation. Both can be true: use maps to *find regions*, high-dimensional neighbors to *judge similarity*. [P/I] [37]
5. **Do LLM labels fully solve the clustering problem?** Knowledge Navigator's 88% match is on one benchmark (CLUSTREC-COVID). Clio reports "overly broad labels" as a failure mode. Hearst's "inconsistent levels of description" problem may return with LLMs that label each cluster independently. [P/I] [33][34][2] Mitigation: label all siblings in one prompt and enforce a level of granularity.
6. **Generated summaries as scent: helpful or harmful for learning?** Verifiability audits (51.5% fully supported sentences) show the risk [P] [57]. I recall a 2025 *PNAS Nexus* study by Melumad & Yun reporting shallower learning from LLM summaries than from web search, but **I could not verify it this session** [T, low]. Treat it as unconfirmed.
7. **Do machine-written spaced-repetition prompts work as well as expert-written ones?** Unknown. No verified controlled comparison [~70% none exists]. [I]
8. **Nomic Atlas's future.** Live (atlas.nomic.ai returns a page titled "Nomic Atlas"; docs link to "Atlas Docs"), but outside the company's stated focus. I estimate ~60% it is in maintenance mode or will be sunset within two years. [I, low-medium]
9. **Maps for discovery.** Apolo's positive result (n=12) is the only one I verified. The common belief that Connected Papers–style graphs help discovery rests mostly on user enthusiasm and adoption, not controlled measurements. [I, medium]
10. **Cockburn–Karlson–Bederson survey conclusions** are given here from training knowledge (the ACM DL blocked access). The gist (overview+detail widely preferred; zooming costs time and memory; distortion hurts some tasks) is consistent with the Hornbæk results I did verify. [T, medium]

---

## Implications for someone building tools to explore literature

1. **Two linked panes: a structure pane (clusters, facets, map) and a ranked list.** Every selection in one filters the other. This follows both Hearst's evidence that lists win retrieval and Pirolli's evidence that clusters teach structure. [I, high]
2. **Spend LLM budget on labels and metadata, the historical bottleneck, before spending it on chat.**
   - Batch-label facets, cluster names at two or three levels, per-chapter aspect strips, glossaries, and per-link annotations.
   - At October 2026 prices this is cheap (see the cost appendix).
   - Store the model and date with every generated label and regenerate when models improve (R07). [I, high]
3. **Few, consistent clusters.** About 10–20 per level, siblings labeled together, an explicit inclusion criterion per cluster (LLooM-style), and a "doesn't fit" bucket. [P/I] [1][31]
4. **Stable space.** If you have a spatial view (map, board, shelf), keep positions stable across sessions so spatial memory accrues. Let users *place* things (Data Mountain, Apolo's pinned landmarks). No 3D. [P/I] [15][16][25]
5. **Don't trust map distances.** Compute neighbors in full dimension, show true neighbors on hover, and cluster before projecting. [P/I] [37]
6. **Make berrypicking moves first-class** (chase footnotes, find citers, run a journal or series, scan the shelf, search the subject, find the author) and log a **trail** for every session. Trails become shareable artifacts and training data for a personal relevance model. [P/I] [5][56a]
7. **Support the sensemaking loop, not just foraging.** Provide an evidence file (excerpts with provenance, as in LiquidText and Threddy), a schema or outline, and hypotheses with credences and linked evidence. For a forecasting-oriented reader, track predictions about books ("I expect this to change my view on X") and score them. [P/I] [3][47][49a]
8. **Hover annotations everywhere,** with source text first, the generated gloss second, and clear labels. Page Previews shows a ~20% increase in distinct pages engaged with almost no opt-outs. [P/I] [55]
9. **Semantic zoom for long texts.** Offer an overview strip (O+D) and multi-level gists with links back to source spans. Never distort the text. [P/I] [1][46]
10. **Budget for errors, not tokens.** The Semantic Reader team found "slight errors" harmful. Generative search had only 51.5% fully supported sentences. Build verification into the UI: quote-backed claims, entailment checks, spot-check queues. [P/I] [42][57]
11. **Build malleably.** Keep one open data layer and many small generated views (Ink & Switch). With Claude Code, the marginal view is cheap, so the data model is what lasts. [P/I] [55a]
12. **Measure foraging rate and learning, not clicks.** Log relevant items per minute, time to first relevant item, and a periodic "write what you know about field X" probe judged against a rubric. [I]

---

## Ideas sparked

1. **Scatter/Gather 2.0 ("Gather desk").** Query or pick a shelf. Then:
   - The tool shows 8–15 LLM-labeled clusters, each with an inclusion criterion, 3 exemplar titles, a size, and a "scent quality" badge (how well the label fits a sample, checked by a second model).
   - Check clusters and press *Gather* to re-cluster the union. Every gather is logged as a trail step.
   - A ranked list stays synced beside it.
   - Precompute embeddings; generate labels on the fly with a small model. Cost per gather is about $0.001. [I]
2. **Aspect TileBars for books.** Each book in a result list becomes a strip of chapters. Rows are the user's standing interests (e.g. "calibration," "historical case studies," "Bayesian methods," "AI forecasting"). Cell shading is LLM-judged relevance per chapter, with hover showing the supporting sentence. Click to open the chapter at that passage. Precompute for a fixed interest vocabulary and compute lazily for new aspects.
3. **Query-induced facets.** For any result set, an LLM proposes 4–6 facets that split *this* set well (study design, era, mathematical level, prerequisite knowledge, stance). Counts are computed by batch classification of the set. Users can pin facets they like into a personal facet schema, and corrections feed back as examples.
4. **Berrypicking console.** On any item, six buttons (Bates's moves) each return a small list annotated with how it was found. A shared "basket" with a trail log underlies everything. One more button, *Blaze trail*, has an agent run all six moves to depth 2 and propose a 10-item reading path with a sentence of justification per step.
5. **Memex trails as a file format.** `trail.json` holds ordered items, the move that found each, the reader's comment, timestamps and credence changes. Trails can be published as pages (Gwern-style annotated lists), forked and merged. "Trail blazer" becomes a role: a person or an agent drafts trails for others.
6. **Stable 2D "Mountain" of the reader's library.** Covers and paper thumbnails on a flat canvas that only the user rearranges; the system never re-lays it out. New items arrive in an inbox strip. An optional "suggest placement" ghost-position comes from embeddings. This builds spatial memory over years (Data Mountain plus Cockburn's 2D result).
7. **Honest embedding map.** A datamapplot or Embedding Atlas map with Toponymy labels at three zoom levels.
   - Hovering an item draws lines to its *true* 10 nearest neighbors in full dimension, even across the map.
   - A "distortion meter" shows the local neighborhood-preservation score.
   - A toggle switches between an embedding layout and a citation or co-assignment layout. The interesting items are the ones that move a lot ("taught together but semantically far").
8. **Overview strip for every long document.** A Scim-like minimap with LLM section gists, Goal/Method/Result (or Claim/Evidence/Caveat) highlight ticks, and the reader's own highlights and questions. Density is adjustable. A "where would a skeptic object?" layer marks contested passages.
9. **Universal hover cards (Gwern for everything).** Every citation, footnote, book mention and URL in any reading view gets a popup:
   - the canonical record (abstract, TOC)
   - a "why this is cited here" gloss built from the citing sentence plus the cited abstract (CiteSee/CiteRead)
   - whether the reader has seen it before
   - a local archive link
   - the generated part labeled and source-linked
10. **Zoom ladder (semantic zoom for a field).** Field → subfield → book → chapter → section → paragraph, each level with a gist. Pinch or scroll moves between levels instead of between pixels. Every gist sentence links to its source span, and unsupported sentences are visibly flagged (scent honesty).
11. **Relatedly for books.** Mine the "introduction," "literature review," "further reading" and "bibliographic essay" sections of open books (and syllabi from Open Syllabus where licensed) as *human-written field overviews*. Index them by topic and present them as a navigable set of expert-written mini-maps. LLM titles go on paragraphs; the paragraphs themselves are human.
12. **Sensemaking board with credences.** A Pirolli–Card board with columns (shoebox → evidence → schema → hypotheses), where hypotheses carry probabilities and evidence items carry likelihood ratios.
    - The LLM proposes "evidence that would most change this credence" and runs targeted searches for it, like a value-of-information agent.
    - Fits a forecaster's habits.
13. **Mnemonic layer, drafted by LLM and edited by the reader.** While reading, the tool drafts 3–5 prompts per section. The reader accepts, edits or deletes them, and only accepted prompts enter review. Track retention and compare LLM-drafted vs reader-written prompts in a personal A/B test, since there is no published answer.
14. **"Worth reading?" calibrated scent.** For each candidate item, the tool predicts the probability that the reader will rate it ≥4/5, or that it will change their view, with a calibration plot from the reader's past ratings. Information scent becomes a forecast that can be scored.
15. **Malleable view gallery.** Keep one SQLite or Parquet catalog of works, annotations, trails and credences, and have Claude Code generate many small views: a timeline of a debate, a who-cites-whom across books, an "unread canon" checklist from co-assignment data. Views are disposable; the data persists (Ink & Switch).
16. **Disagreement map.** Run two labeling models (or two embedding models) and visualize where they disagree on cluster membership. Contested regions are often interdisciplinary areas, and that is where a reader should look closely rather than trust a label.

---

## Appendix: cost sketches at October 2026 prices [I, using P prices]

Prices from Anthropic's pricing page (2026-10-15) [59]:

| Model | Input / output per MTok | Batch input / output |
|---|---|---|
| Haiku 5.5 (prompts ≤100k) | $0.10 / $0.50 | $0.05 / $0.25 |
| Sonnet 5.5 | $2 / $10 | $1 / $5 |
| Opus 5.5 | $4 / $20 | $2 / $10 |

| Task | Tokens (assumed) | Haiku 5.5 batch | Sonnet 5.5 batch |
|---|---|---|---|
| Facet-label 1M paper abstracts (1,000 in / 150 out each) | 1B in, 150M out | ~$88 | ~$1,750 |
| Aspect strips for 10,000 books (15 × 10k-token chunks, 300 tokens out per chunk) | 1.5B in, 45M out | ~$86 | ~$1,725 |
| ScholarPhi-style glossary for 1M arXiv papers (12k in / 1.5k out) | 12B in, 1.5B out | ~$975 | ~$19,500 |
| Hierarchical labels for 5,000 clusters (1k in / 50 out) | 5M in, 0.25M out | ~$0.31 | ~$6 |
| Embeddings for 1M abstracts (text-embedding-3-small at $0.02/MTok, per R10) | 300M | ~$6 (or $0 with SPECTER2) | — |

These are upper-bound sketches. Real token counts vary ±50%. The conclusion is robust: **the metadata that blocked 1990s–2000s interfaces now costs tens to hundreds of dollars per million items**. The real costs are verification and human attention.

---

## Sources

Numbers match bracketed citations above. "Accessed" means fetched in this session on 2026-10-15. Paywalled ACM papers were checked through the Semantic Scholar Graph API record for their DOI (base `https://api.semanticscholar.org/graph/v1/paper/DOI:`); the exact URL is given.

1. Hearst, M. *Search User Interfaces*, ch. 10 "Information Visualization for Search Interfaces" — http://searchuserinterfaces.com/book/sui_ch10_visualization.html — 2009 (accessed 2026-10-15; possibly stale)
2. Hearst, *Search User Interfaces*, ch. 8 "Integrating Navigation with Search" — http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html — 2009
3. Hearst, *Search User Interfaces*, ch. 3 "Models of the Information Seeking Process" — http://searchuserinterfaces.com/book/sui_ch3_models_of_information_seeking.html — 2009
4. Hearst, *Search User Interfaces*, table of contents — http://searchuserinterfaces.com/book/ — 2009
5. Bates, M. J. "The Design of Browsing and Berrypicking Techniques for the Online Search Interface" — https://pages.gseis.ucla.edu/faculty/bates/berrypicking.html — 1989
6. Shneiderman, B. "The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations" (IEEE Visual Languages 1996) — https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf — 1996
7. Wikipedia, "Information foraging" — https://en.wikipedia.org/wiki/Information_foraging — accessed 2026-10-15
8. Wikipedia, "Exploratory search" — https://en.wikipedia.org/wiki/Exploratory_search — accessed 2026-10-15
9. Marchionini, G. "Exploratory search" (CACM 2006), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/1121949.1121979?fields=title,year,venue,citationCount,abstract,authors — 2006
10. Pirolli, Schank, Hearst & Diehl, "Scatter/gather browsing communicates the topic structure of a very large text collection" (CHI 1996), S2 record with abstract — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/238386.238489?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 1996
11. Hearst & Pedersen, "Reexamining the cluster hypothesis: scatter/gather on retrieval results" (SIGIR 1996), S2 record with abstract — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/243199.243216?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 1996
12. Cutting, Karger, Pedersen & Tukey, "Scatter/Gather: a cluster-based approach to browsing large document collections" (SIGIR 1992), S2 record with abstract — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/133160.133214?fields=title,year,venue,citationCount,abstract,authors — 1992
13. Furnas, G. "Generalized fisheye views" (CHI 1986), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/22627.22342?fields=title,year,venue,citationCount,abstract,authors — 1986
13a. Hearst, "TileBars" project page — https://people.ischool.berkeley.edu/~hearst/research/tilebars.html — c. 1997
14. Flamenco Project home — http://flamenco.berkeley.edu/ — accessed 2026-10-15 (undated)
14a. Card, Robertson & York, "The WebBook and the Web Forager" (CHI 1996), S2 record with abstract — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/238386.238446?fields=title,year,venue,citationCount,abstract,authors — 1996
15. Robertson et al., "Data Mountain: Using Spatial Memory for Document Management" (UIST 1998) — https://www.microsoft.com/en-us/research/publication/data-mountain-using-spatial-memory-for-document-management/ and PDF https://www.microsoft.com/en-us/research/wp-content/uploads/1998/01/p153-robertson.pdf — 1998
16. Czerwinski, van Dantzich, Robertson & Hoffman, "The Contribution of Thumbnail Image, Mouse-over Text and Spatial Location Memory to Web Page Retrieval in 3D" (INTERACT 1999) — https://www.microsoft.com/en-us/research/publication/the-contribution-of-thumbnail-image-mouse-over-text-and-spatial-location-memory-to-web-page-retrieval-in-3d/ and PDF https://www.microsoft.com/en-us/research/wp-content/uploads/1999/01/interact99.pdf — 1999
17. Cockburn & McKenzie, "3D or Not 3D? Evaluating the Effect of the Third Dimension in a Document Management System" (CHI 2001) — http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/chi01DM.pdf — 2001
18. Cockburn & McKenzie, "Evaluating the Effectiveness of Spatial Memory in 2D and 3D Physical and Virtual Environments" (CHI 2002) — http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf — 2002
19. Bederson & Hollan, "Pad++" (UIST 1994), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/192426.192435?fields=title,year,venue,citationCount,abstract,authors — 1994
19a. Cockburn, "Revisiting 2D vs 3D Implications on Spatial Memory" (AUIC 2004) — http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/revisiting2Dv3D.pdf — 2004
19b. Cockburn, Karlson & Bederson, "A review of overview+detail, zooming, and focus+context interfaces" (ACM Computing Surveys), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/1456650.1456652?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 2008/2009
19c. Tory, Sprague, Wu, So & Munzner, "Spatialization Design: Comparing Points and Landscapes" (TVCG 2007), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1109/TVCG.2007.70596?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 2007
20. Wikipedia, "Zooming user interface" — https://en.wikipedia.org/wiki/Zooming_user_interface — accessed 2026-10-15
20a. Wikipedia, "StretchText" — https://en.wikipedia.org/wiki/StretchText — accessed 2026-10-15
20b. Wikipedia, "Katy Börner" — https://en.wikipedia.org/wiki/Katy_B%C3%B6rner — accessed 2026-10-15
21. VOSviewer home — https://www.vosviewer.com/ — accessed 2026-10-15 (v1.6.21 dated 2026-06-12)
22. van Eck & Waltman, "Software survey: VOSviewer" (Scientometrics), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1007/s11192-009-0146-3?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 2009/2010
23. CiteSpace (Podia store) — https://citespace.podia.com/ — accessed 2026-10-15 (v7.0.2 dated 2026-08-25)
24. Chen, C. "CiteSpace II" (JASIST 2006), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1002/asi.20317?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 2006
24a. Paperscape — https://paperscape.org/ — accessed 2026-10-15
24b. Open Knowledge Maps — https://openknowledgemaps.org/ — accessed 2026-10-15
24c. Open Syllabus home — https://www.opensyllabus.org/ — accessed 2026-10-15
24d. Open Syllabus blog, "Galaxy Brain" — https://blog.opensyllabus.org/Galaxy-Brain — 2024-06-28
24e. Open Syllabus blog, "Spring 2025 News" — https://blog.opensyllabus.org/spring-2025-news — 2025-05-29
25. Chau, Kittur, Hong & Faloutsos, "Apolo: Making Sense of Large Network Data by Combining Rich User Interaction and Machine Learning" (CHI 2011) — https://poloclub.github.io/polochau/papers/11-chi-apolo.pdf — 2011
26. TutteInstitute/datamapplot (GitHub README) — https://github.com/TutteInstitute/datamapplot — accessed 2026-10-15
27. TutteInstitute/toponymy (GitHub README) — https://github.com/TutteInstitute/toponymy — accessed 2026-10-15
28. enjalot/latent-scope (GitHub README) — https://github.com/enjalot/latent-scope — accessed 2026-10-15
29. Wang, Hohman & Chau, "WizMap" (ACL 2023 demo) — https://arxiv.org/abs/2306.09328 — 2023
30. Apple, Embedding Atlas — https://apple.github.io/embedding-atlas — accessed 2026-10-15
30a. Ren, Hohman, Lin & Moritz, "Embedding Atlas: Low-Friction, Interactive Embedding Visualization" — https://arxiv.org/abs/2505.06386 — 2025-05 (v2 2025-07)
31. Lam et al., "Concept Induction: Analyzing Unstructured Text with High-Level Concepts Using LLooM" (CHI 2024) — https://arxiv.org/abs/2404.12259 (full text https://arxiv.org/pdf/2404.12259) — 2024-04
32. Pham et al., "TopicGPT" (NAACL 2024) — https://arxiv.org/abs/2311.01449 — 2023-11 / 2024-04
33. Katz, Levy & Goldberg, "Knowledge Navigator: LLM-guided Browsing Framework for Exploratory Search in Scientific Literature" — https://arxiv.org/abs/2408.15836 (full text https://arxiv.org/pdf/2408.15836) — 2024-08
34. Tamkin et al., "Clio: Privacy-Preserving Insights into Real-World AI Use" — https://arxiv.org/abs/2412.13678 (full text https://arxiv.org/pdf/2412.13678) — 2024-12
35. OpenAlex Help, "Topics" — https://help.openalex.org/hc/en-us/articles/24736129405719-Topics — accessed 2026-10-15 (describes the October 2026 classifier)
36. Grootendorst, "BERTopic" — https://arxiv.org/abs/2203.05794 — 2022-03
37. Chari & Pachter, "The specious art of single-cell genomics" (PLOS Comp Bio) — https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011288 — 2023-08-17 (correction 2025-11-04)
38. McInnes, Healy & Melville, "UMAP" — https://arxiv.org/abs/1802.03426 — 2018 (v3 2020)
39. Nomic home — https://www.nomic.ai/ — accessed 2026-10-15
40. Nomic pricing — https://www.nomic.ai/pricing — accessed 2026-10-15
41. Nomic docs and Atlas docs — https://docs.nomic.ai/ and https://docs.nomic.ai/atlas (also https://atlas.nomic.ai/, title only) — accessed 2026-10-15
42. Lo, Chang, Head et al., "The Semantic Reader Project" — https://arxiv.org/abs/2303.14334 (full text https://arxiv.org/pdf/2303.14334) — 2023-03/04
43. Head et al., "Augmenting Scientific Papers with Just-in-Time, Position-Sensitive Definitions of Terms and Symbols" (ScholarPhi, CHI 2021) — https://arxiv.org/abs/2009.14237 (full text https://arxiv.org/pdf/2009.14237) — 2020/2021
44. Chang et al., "CiteSee" (CHI 2023) — https://arxiv.org/abs/2302.07302 (full text https://arxiv.org/pdf/2302.07302) — 2023-02
45. Package registries (latest version and upload time): https://pypi.org/pypi/datamapplot/json, https://pypi.org/pypi/latentscope/json, https://pypi.org/pypi/bertopic/json, https://pypi.org/pypi/umap-learn/json, https://pypi.org/pypi/toponymy/json, https://pypi.org/pypi/evoc/json, https://pypi.org/pypi/nomic/json, https://pypi.org/pypi/embedding-atlas/json, https://registry.npmjs.org/deepscatter, https://registry.npmjs.org/embedding-atlas — accessed 2026-10-15
45a. Fok et al., "Scim: Intelligent Skimming Support for Scientific Papers" (IUI 2023) — https://arxiv.org/abs/2205.04561 (full text https://arxiv.org/pdf/2205.04561) — 2022/2023
46. August et al., "Paper Plain" — https://arxiv.org/abs/2203.00130 (full text https://arxiv.org/pdf/2203.00130) — 2022-02
47. Kang, Chang, Kim & Kittur, "Threddy" (UIST 2022) — https://arxiv.org/pdf/2208.03455 — 2022-08
48. Semantic Scholar, "Semantic Reader" product page — https://www.semanticscholar.org/product/semantic-reader — accessed 2026-10-15
49. LiquidText home — https://www.liquidtext.net/ — accessed 2026-10-15 (pricing page https://www.liquidtext.net/pricing returned 404)
49a. Tashman & Edwards, "LiquidText: a flexible, multitouch environment to support active reading" (CHI 2011), S2 record — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/1978942.1979430?fields=title,year,venue,citationCount,abstract,authors,openAccessPdf,externalIds — 2011
50. Distill Editorial Team, "Distill Hiatus" — https://distill.pub/2021/distill-hiatus/ — 2021-07-02
50a. Victor, B. "Explorable Explanations" — https://worrydream.com/ExplorableExplanations/ — 2011-03-10 (postscript 2024-02)
51. Distill home — https://distill.pub/ — accessed 2026-10-15
52. Matuschak & Nielsen, "How can we develop transformative tools for thought?" — https://numinous.productions/ttft/ — 2019-10
53. Quantum Country — https://quantum.country/ — accessed 2026-10-15
54. Matuschak, "Why books don't work" — https://andymatuschak.org/books/ — 2019-05-11
55. Wikimedia, "Page Previews/2017-18 A/B Tests" — https://www.mediawiki.org/wiki/Page_Previews/2017-18_A/B_Tests — 2018
55a. Litt, Horowitz, van Hardenberg & Matthews (Ink & Switch), "Malleable software" — https://www.inkandswitch.com/essay/malleable-software/ — 2025-06
55b. Wikimedia, "Page Previews" — https://www.mediawiki.org/wiki/Page_Previews — 2014–2018 (accessed 2026-10-15)
56. Cachola, Lo, Cohan & Weld, "TLDR: Extreme Summarization of Scientific Documents" — https://arxiv.org/abs/2004.15011 — 2020
56a. Wikipedia, "Memex" — https://en.wikipedia.org/wiki/Memex — accessed 2026-10-15 (The Atlantic original could not be fetched)
56b. Wikipedia, "Mundaneum" — https://en.wikipedia.org/wiki/Mundaneum — accessed 2026-10-15
56c. Wikipedia, "Project Xanadu" — https://en.wikipedia.org/wiki/Project_Xanadu — accessed 2026-10-15
57. Liu, Zhang & Liang, "Evaluating Verifiability in Generative Search Engines" (Findings of EMNLP 2023) — https://arxiv.org/abs/2304.09848 — 2023
57a. Gwern Branwen, "Design" (Gwern.net design page) — https://gwern.net/design — accessed 2026-10-15 (features dated 2010–2023 within)
58. Suh, Min, Palani & Xia, "Sensecape" (UIST 2023) — https://arxiv.org/abs/2305.11483 — 2023; also Jiang et al., "Graphologue" — https://arxiv.org/abs/2305.11473 — 2023
59. Anthropic, "Pricing" (Claude API docs) — https://platform.claude.com/docs/en/about-claude/pricing — accessed 2026-10-15
60. Sibling dossiers (internal, not re-verified here): `R04-ai-research-assistants.md` (Connected Papers free tier, Litmaps/ResearchRabbit, Semantic Reader coverage); `R07-generative-interfaces.md` (FABLES faithfulness, generative UI); `R10-catalog-architecture-and-costs.md` (Semantic Scholar SPECTER2/TLDR counts, embedding prices); `R08` (spatial computing)

---

## Verification pass (independent)

Independent fact-check on 2026-10-15. Method: each load-bearing claim was re-checked against its cited primary source, re-fetched in this pass. PDFs were read with `pdftotext`, and live product, pricing and registry pages were re-fetched. The shared WebSearch budget ran out on this pass's first query, so "newer or contradicting information" was checked by re-fetching the live primary pages (pricing pages, help centers, package registries, PLOS correction notices), not by open web search. Corrected sentences above carry "[corrected in verification]".

| # | Claim | Verdict | Correction / note | Source |
|---|---|---|---|---|
| 1 | Chen & Yu 2000: combined effect of visualization not significant; cognitive differences dominated; Hearst: "information visualization has not yet proven itself for search interfaces" | confirmed | Both quotes are verbatim in ch. 10 (six studies from five papers) | http://searchuserinterfaces.com/book/sui_ch10_visualization.html |
| 2 | Flamenco: 32 art-history students, ~35,000 images, 91% preferred, 88% more useful, "order of magnitude slower"; automated categorization "about 75% correct" | confirmed | Baseline was "a Google images-type interface"; the 75% figure cites Sebastiani 2002 | http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html |
| 3 | Scatter/Gather: coherent picture and richer vocabulary, but worse than similarity search without search; relevant docs in 1–2 of 5 clusters | confirmed | S2 abstract and Hearst ch. 8 both match | https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/238386.238489?fields=title,year,abstract ; Hearst ch. 8 |
| 4 | Hornbæk & Frøkjær 2001: 19 of 20 preferred O+D, higher grades, disliked fisheye | confirmed | Hearst says "achieved higher grades using the overview detail view" without saying the grades were for essays. The original paper was not reachable (ACM), so "essay grades" is a reasonable but unverified reading | http://searchuserinterfaces.com/book/sui_ch10_visualization.html |
| 5 | Cockburn & McKenzie 2002: 69 users, 2,070 trials, 3.7/3.8/4.8 s, F(2,63)=2.5, p=.09, 3D more cluttered; 2001: 2D faster n.s., 3D significantly preferred | confirmed | Clutter difference was significant only for the physical models (2D 2.7 vs 3.4); virtual ratings did not differ. Wording clarified above | http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf ; http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/chi01DM.pdf |
| 6 | Data Mountain: 32 IE4 users, 100 pages, faster than IE Favorites; 9 users not slower after ~6 months without seeing layouts | corrected | Main study confirmed (F(2,18)=4.84, p<.02; between-groups). Follow-up: the 9 users returned ~6 months after creating their layouts but had seen them once more in a 6-week pilot, and got 5 minutes' review before trials. The paper says "not seen ... for several months" | https://www.microsoft.com/en-us/research/wp-content/uploads/1998/01/p153-robertson.pdf ; https://www.microsoft.com/en-us/research/wp-content/uploads/1999/01/interact99.pdf |
| 7 | Knowledge Navigator: 88% subtopic match; 2.3–3.18 of 50 clusters for 80% coverage vs 20.4 random; SPECTER2 lagged | confirmed | Table 1 and Table 2 match exactly (GPT-4o and Mixtral both 88% ± 4) | https://arxiv.org/abs/2408.15836 |
| 8 | Clio: 94% vs 5% random; $48.81 per 100k conversations (~$0.0005 each); embeddings + k-means + LLM hierarchy | confirmed | The $48.81 is a calculated estimate at Claude 3 Haiku and 3.5 Sonnet prices with assumed token counts, not a measured cost. Clarified above | https://arxiv.org/abs/2412.13678 |
| 9 | LLooM 93% vs 77.7% coverage, 2.0× high-quality topics; TopicGPT purity 0.74 vs 0.64 | confirmed | Both verbatim in the abstracts | https://arxiv.org/abs/2404.12259 ; https://arxiv.org/abs/2311.01449 |
| 10 | OpenAlex Oct 2026 Qwen3-8B classifier; 4,516/252/26/4; 94.5% on the ~64% at ≥90% confidence; 81.7% (89.6% field); ~10% unclassified | confirmed | Page last updated 2026-10-07. It adds that the classifier was trained on 2M works labeled by Claude Opus 5.5, and that the old classifier endpoint lasts until 2027-01-13 | https://help.openalex.org/hc/en-us/articles/24736129405719-Topics |
| 11 | Chari & Pachter: 30-NN Jaccard distance consistently > 0.7; neighbor-rank correlations ≤ 0.4 | confirmed | The rank correlations are for cell-*type* neighbor rankings. The 2025-11-04 correction only fixes the Data Availability statement; the numbers are unaffected | https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011288 ; https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013655 |
| 12 | Nomic sells AEC agents ($20 Individual; $40/user Business, 25-seat min); no Atlas mention except a docs link; `nomic` client last released 2025-11-11 | confirmed | Prices, seat minimum and nomic 3.9.0 (2025-11-11) confirmed. The "footer link" wording elsewhere was wrong: nomic.ai has no Atlas link at all. "Atlas Docs" is on docs.nomic.ai, and atlas.nomic.ai still serves "Nomic Atlas". Fixed above | https://www.nomic.ai/pricing ; https://www.nomic.ai/ ; https://docs.nomic.ai/ ; https://pypi.org/pypi/nomic/json |
| 13 | Semantic Reader Project: 10 prototypes, 300+ participants; highlights, definitions and personalized citations shipped; covers most arXiv papers; highlights only English CS | confirmed | Product page: "most English-language arXiv papers in computer science fields" | https://arxiv.org/abs/2303.14334 ; https://www.semanticscholar.org/product/semantic-reader |
| 14 | ScholarPhi n=27; Scim n=19, 74/105 = 70.4%; Paper Plain n=24, easier, no comprehension loss | confirmed | All numbers match the papers | https://arxiv.org/abs/2205.04561 ; https://arxiv.org/abs/2009.14237 ; https://arxiv.org/abs/2203.00130 |
| 15 | Page Previews: +20–22% distinct pages, −3 to −5% pageviews, −2 to −9% back button, 0.26–0.27 previews/pageview, ~0.01% disable | confirmed | "Seen" = card open ≥1,000 ms. Rolled out to all Wikipedias in July 2018 | https://www.mediawiki.org/wiki/Page_Previews/2017-18_A/B_Tests |
| 16 | Generative search: 51.5% sentences fully supported; 74.5% citations supportive | confirmed | Bing Chat, NeevaAI, perplexity.ai and YouChat, 2023 | https://arxiv.org/abs/2304.09848 |
| 17 | CiteSpace $65 (1 yr) / $110 / $155 (2 yr); v7.0.2 2026-08-25; 6.4.R2 Advanced "GPT-augmented cluster summarization"; VOSviewer 1.6.21 (2026-06-12) reads OpenAlex, Scopus, WoS, Dimensions, Europe PMC… | confirmed | $110 is 1 year on 2 computers. VOSviewer has read Dimensions exports since 1.6.9 (2018). The year of the Aug 31 malware notice is still not stated on the page | https://citespace.podia.com/ ; https://www.vosviewer.com/ |
| 18 | Quantum Country: 112 cards; ~54 days per card after 6 reviews for ~95 min; 195 users with a month's retention on ≥80% within six months | confirmed | Verbatim in the essay (6,000 / 112 ≈ 54 days) | https://numinous.productions/ttft/ |
| 19 | Claude prices: Haiku 5.5 $0.10/$0.50 (≤100k prompts), Sonnet 5.5 $2/$10, Opus 5.5 $4/$20; Batch halves both; ~$88 for 1M abstracts | confirmed | Batch: Haiku 5.5 $0.05/$0.25, Sonnet 5.5 $1/$5, Opus 5.5 $2/$10; Haiku 5.5 over 100k is $0.50/$2.50. All appendix arithmetic recomputed and correct ($87.50, $86.25, $975, $0.31, $1,750, $1,725, $19,500) | https://platform.claude.com/docs/en/about-claude/pricing |

**Other statements spot-checked:**

| Statement | Verdict | Correction / note | Source |
|---|---|---|---|
| `deepscatter` npm "last published 2024-03-26" | corrected | 2024-03-26 is the latest *stable* release (2.15.2); prereleases continued to 3.0.0-next.51 on 2025-05-29 | https://registry.npmjs.org/deepscatter |
| Nomic "Atlas is reduced to a footer link" (exec summary 7; Surprises 1) | corrected | The nomic.ai homepage and pricing HTML contain no "Atlas" string; the link lives on docs.nomic.ai | https://www.nomic.ai/ ; https://docs.nomic.ai/ |
| Relatedly "LLM-generated paragraph titles" | corrected | The titles came from a fine-tuned BART summarization model; within-subjects n=15 vs a baseline paper list. The "significantly more coherent, insightful, and detailed after 20 minutes" wording is from the Semantic Reader overview [42] | https://arxiv.org/abs/2302.06754 ; https://arxiv.org/abs/2303.14334 |
| Package versions (datamapplot 0.7.3, Toponymy 0.5.4, Latent Scope 1.0.0, EVoC 0.3.1, Embedding Atlas 0.25.0, BERTopic 0.17.4) | confirmed | All match PyPI/npm dates exactly | PyPI JSON API; https://registry.npmjs.org/embedding-atlas |
| S2 citation counts (VOSviewer 20,117; CiteSpace II 2,807; Furnas 2,195; Cockburn et al. 784; LiquidText 114) | confirmed | Identical on 2026-10-15 | Semantic Scholar Graph API |
| Distill ~32 articles, latest 2021-09-02; Victor postscript Feb 2024 and its quotes | confirmed | 33 dated items including the hiatus note | https://distill.pub/ ; https://worrydream.com/ExplorableExplanations/ |
| CiteSee (10 lab, 6 field, 8.2% vs 37%, ~21% prior survey), Threddy (n=9 vs Google Docs), Apolo (12, between-subjects, ~83,000 articles), Open Syllabus 32.9M | confirmed | All match | https://arxiv.org/abs/2302.07302 ; https://arxiv.org/pdf/2208.03455 ; https://poloclub.github.io/polochau/papers/11-chi-apolo.pdf ; https://www.opensyllabus.org/ |
