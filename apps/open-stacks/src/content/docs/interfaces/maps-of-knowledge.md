---
title: Maps of Knowledge
description: What science maps, citation-graph tools, embedding maps and topic models can and cannot do for a reader, from the evidence on whether maps help people find relevant work and why 3D information spaces failed. Ends with a costed specification, with its limits, for a 2D map of a personal 10,000-book catalog.
---

*Status: draft, October 2026. Tool versions, prices and product statuses are as of 2026-10-15 and go stale fast. Most of the interface evidence comes from small studies run between 1996 and 2015, several known only through Marti Hearst's 2009 book. I found no user study of a map over a book collection, and none comparing an LLM-labeled map with a ranked list. Sources: the [R06 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md); [R04](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md), [R05](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md) and [R10](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md) for tool prices, Open Library and Open Syllabus figures, and embedding costs; and primary sources linked inline. The Metro Maps, Sedlmair et al., PubMed-landscape, Argo Scholar, Bow Tie and Choe et al. results, and the date of VOSviewer's security incident, are not in R06; they were checked against primary sources on 2026-10-15.*

People like maps of a literature. Thirty years of evidence say maps help less than they seem to: ranked lists beat them for finding a specific item, the 2D projection scrambles nearest neighbors, and 3D adds cost without benefit. Two findings point the other way. Maps and clusters help newcomers learn the *shape* of a field. And automatic organization used to fail mainly on bad labels, which LLMs have largely fixed on the few benchmarks tested.

## The short version

- **Use a map for orientation and a list for retrieval, and link the two.** In Chen & Yu's 2000 meta-analysis of visualization for information retrieval, the combined effect was not statistically significant, and individual differences in cognitive ability mattered more than the interface ([Hearst 2009, ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)). A 2015 controlled study of a citation-visualization search tool found no retrieval gain from its visual features ([Hoeber & Khazaei](https://doi.org/10.1108/OIR-10-2014-0259)). The positive controlled results come from maps that taught a field's structure (Scatter/Gather), that users steered themselves (Apolo), or that sat beside a search engine (Metro Maps). None shows a passive overview beating a list.
- **Treat map position as an index of regions, not a measure of similarity.** On a t-SNE map of 20.7M PubMed papers, on average only **6.2%** of a paper's 10 nearest neighbors in 2D were among its 10 nearest neighbors in the original 768-dimensional space. Topic regions still held together: 10-nearest-neighbor label accuracy was 62.6% in 2D vs 69.7% in full dimension ([González-Márquez et al. 2024](https://doi.org/10.1016/j.patter.2024.100968)).
- **Spend LLM money on labels, the historical bottleneck.** Hearst (2009), citing a 2002 survey, put automated categorization at "about 75% correct on average" ([ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html)). In 2024, LLM cluster names matched 88% of expert-assigned subtopics on one biomedical benchmark ([Knowledge Navigator](https://arxiv.org/abs/2408.15836)).
- **Stay in 2D.** Spatial memory works (Data Mountain), but in a direct comparison a 3D version performed no better than a flat one, and users preferred the 3D one anyway ([Cockburn & McKenzie 2001](http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/chi01DM.pdf)). For reduced data, "interactive 3D rarely helps but often hurts" ([Sedlmair, Munzner & Tory 2013](https://doi.org/10.1109/TVCG.2013.153)).
- **Self-host the map.** The open-source stack (datamapplot, Toponymy, Latent Scope, Apple's Embedding Atlas) is active and usable as of October 2026, though Toponymy is still labeled beta. The best-known hosted vendor, Nomic, has pivoted away from maps. By my estimate from assumed token counts, a labeled 2D map of 10,000 books costs about \$2 in model calls on Claude Haiku 5.5 batch, or about \$40 on Sonnet 5.5 batch (details below), plus a weekend of building.

## Five kinds of map

"Map of knowledge" covers several different objects. They encode different signals and fail in different ways.

| Family | What position or links encode | Examples (status Oct 2026) | Built for | Main failure |
|---|---|---|---|---|
| **Bibliometric science maps** | Citation, co-citation, bibliographic coupling, co-authorship or term co-occurrence across a field | Börner's atlases and *Places & Spaces*; VOSviewer; CiteSpace; Paperscape | Communicating a field's structure; bibliometric analysis | Hard to read without training; often decorative in review papers |
| **Seed graphs** | Similarity to one or a few seed papers | Connected Papers, Litmaps, ResearchRabbit, Inciteful, Local Citation Network; research systems Apolo, Bow Tie and Argo Scholar | Finding neighbors of a known paper | Papers only; inherits gaps in citation data; books absent |
| **Embedding maps** | Text similarity (vector embeddings) projected to 2D | datamapplot, Latent Scope, Embedding Atlas, WizMap, Nomic Atlas; the PubMed landscape map | Seeing the shape of a large corpus | The 2D projection scrambles nearest neighbors |
| **Co-use maps** | How often items are used together (assigned, borrowed) | Open Syllabus Galaxy | Structure revealed by experts' choices | Data mostly licensed; by its makers' account it draws "oohs and aahs" more than use |
| **Topic hierarchies** (often not spatial) | Membership in named clusters or topics | LDA, BERTopic, TopicGPT, LLooM, Knowledge Navigator, Clio, OpenAlex Topics | Labeling, faceting, narrowing | Label quality and consistency |

The families combine. A modern embedding map is usually an embedding layout plus a topic hierarchy for labels. OpenAlex built its topic list by clustering citations and then had an LLM name the clusters.

## Science maps: built to communicate, used to analyze

**Börner's lineage.** Katy Börner's *Atlas of Science* (2010), *Atlas of Knowledge* (2015) and *Atlas of Forecasts* (2021), with the *Places & Spaces: Mapping Science* exhibit (100 maps in its first decade), are the canonical body of science maps. *Atlas of Macroscopes* (2025) covers the 40 interactive "macroscopes" of its second decade ([Wikipedia](https://en.wikipedia.org/wiki/Katy_B%C3%B6rner); [scimaps.org](https://scimaps.org/)). Per Wikipedia, the exhibit "seeks to educate the general public about science mapping." These maps are made for communication and science policy, not retrieval. I found no study measuring whether they help a reader find works.

**Analyst tools.** VOSviewer and CiteSpace are what bibliometricians actually use:

| Tool | Map types | Data | Price and version (Oct 2026) | Notes |
|---|---|---|---|---|
| [VOSviewer](https://www.vosviewer.com/) (CWTS Leiden) | Citation, co-citation, coupling, co-authorship, term co-occurrence; VOS layout and clustering | OpenAlex, Scopus, Web of Science, Dimensions, Europe PMC, Crossref, Semantic Scholar, Lens | Free ("can be used freely for any purpose," per its [download page](https://www.vosviewer.com/download)); v1.6.21, June 12, 2026 | Its software paper has 20,117 citations (Semantic Scholar, 2026-10-15). A malicious Windows executable was served from the site on August 31, 2026, 3:30–13:20 CEST. The site's notice omits the year; [TU Dortmund](https://itmc.tu-dortmund.de/en/newsdetail/vorlage-sicherheitsluecke-phishing-gefahr-1-7-4-1-1-3-1-1-66823/) gives it, and [Leiden University](https://www.universiteitleiden.nl/en/malfunction-reports/news/26-09-03-vosviewer-eng) announced the incident on 3 September 2026. If you downloaded the Windows build that day, follow the site's instructions |
| [CiteSpace](https://citespace.podia.com/) (Chaomei Chen) | Co-citation clusters, burst detection, timelines, dual-map overlays | Web of Science, Scopus and other exports | Paid: \$65 (1 year), \$110 (1 year, two computers), \$155 (2 years); v7.0.2, Aug 25, 2026 | 6.4.R2 Advanced adds "GPT-augmented cluster summarization" |
| [Paperscape](https://paperscape.org/) | arXiv papers as particles, "references acting as attractive forces between papers"; circle size from citation counts | arXiv | Free | Page shows "Last updated: ?" on 2026-10-15; treat as possibly stale |
| [Open Knowledge Maps](https://openknowledgemaps.org/) | Per-query maps of clustered search results | BASE: "more than 400 Million outputs ... from over 11.000 sources" | Free; non-profit; open source | Claims over one million users |

These tools succeed with *experts doing analysis*. That fits Hearst's broader judgment that "for analytical tasks, visualization of textual information appears more promising" than for search ([ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)). One side effect: VOSviewer and CiteSpace figures have become a fixture of bibliometric review papers. That shows the maps are popular. It does not show they are valid.

## Seed graphs: Connected Papers and its relatives

Seed graphs start from a paper you already know. [Connected Papers](https://www.connectedpapers.com/about) describes its method: "we analyze an order of ~50,000 papers and select the few dozen with the strongest connections to the origin paper." Similarity "is based on the concepts of Co-citation and Bibliographic Coupling," laid out as a "Force Directed Graph," over the Semantic Scholar corpus. "Connected Papers is not a citation tree": two papers that never cite each other can sit side by side.

| Tool | Method | Price (Oct 2026) | Catch |
|---|---|---|---|
| [Connected Papers](https://www.connectedpapers.com/) | Co-citation plus coupling; force-directed graph | Free: 5 graphs/month (in the site's code, checked by R04 and again for this chapter). Paid academic and business plans exist; prices unverified | Papers only |
| [Litmaps](https://www.litmaps.com/pricing) | Citation maps with user-chosen axes; alerts | Free (20 inputs, 100 articles); Pro \$10/month billed annually (\$120/year, academic email) or \$12.50 monthly | Acquired ResearchRabbit in May 2025 per trade press [~85%] |
| [ResearchRabbit](https://www.researchrabbit.ai/pricing) | Seeds expand to similar, references and citations; a 2025 revamp added semantic expansion and checkpoints | Free (50 seeds); RR+ \$10/month annual, \$12.50 monthly | Footer reads "© Litmap Limited" |
| [Inciteful](https://inciteful.xyz/) | Co-citation, coupling and PageRank; a "Literature Connector" between two papers | Free | Domain now redirects to incitefulmed.com/academic/ |
| [Local Citation Network](https://localcitationnetwork.github.io/) | Finds the most-cited and most-citing papers missing from your set; OpenAlex, Semantic Scholar or Crossref | Free, GPL-3 | Maintained in the author's spare time |

Connected Papers, Inciteful and Local Citation Network draw on open citation data (Semantic Scholar, OpenAlex, Crossref). R04 classes all five tools as papers-only: books appear, if at all, as cited works, not as items you can explore from. Coverage for books is the subject of [Catalogs and Metadata](/finding/catalogs-and-metadata/). R04's comparison of these tools is in [AI Research Assistants](/finding/ai-research-assistants/).

**The evidence that graph tools help discovery is thin and mixed.**

- **Apolo** ([Chau, Kittur, Hong & Faloutsos, CHI 2011](https://poloclub.github.io/polochau/papers/11-chi-apolo.pdf)) compared an interactive citation-network tool with Google Scholar. Twelve participants (between-subjects) had 25 minutes to find papers for updating a 2000 survey's related work, in a network of about 83,000 articles within three citation hops of the survey. Two expert judges (agreement, by cosine similarity, 0.97 and 0.86 on the two themes) rated Apolo users' finds significantly more relevant (t(9.7) = 2.32, reported p below 0.022). Apolo was not a passive overview: users created groups seeded with example papers, belief propagation scored every other node against them, and "familiar landmarks do not shift, unless the user decides to shift" them.
- **Metro Maps of Science** ([Shahaf, Guestrin & Horvitz, KDD 2012](https://www.cs.cmu.edu/~dshahaf/kdd2012-shahaf-guestrin-horvitz.pdf)) gave graduate students a precomputed "metro map" of reinforcement-learning research (35,000+ ACM papers) plus Google Scholar; a control group had Google Scholar alone. Of 30 recruited, 4 were discarded; sessions lasted 40 minutes; one expert judge did not know which condition found each paper. Map users scored 84.5% vs 74.2% on normalized paper relevance and found 1.62 vs 1.2 seminal papers. The largest gap was breadth: 73.1% vs 46.4% of the research directions they listed were among the field's top-10 subareas. The paper reports no significance tests and calls itself a pilot.
- **Bow Tie Academic Search** ([Hoeber & Khazaei, *Online Information Review* 2015](https://doi.org/10.1108/OIR-10-2014-0259)) is the closest test I found of a citation visualization against ordinary search. In a controlled lab study, 24 graduate students ran academic searches with a traditional search interface and with the visual tool. Per the abstract, the core visualization and exploration features "did not reveal differences in retrieval effectiveness or efficiency." The query-refinement features helped, and participants preferred the visual tool. I read only the abstract, which does not describe the baseline in detail.
- **Choe, Kim, Park & Seo** ([IEEE VIS 2024 short paper](https://hci.snu.ac.kr/research/fields-bridges-and-foundations-how-researchers-browse-citation-network-visualizations)) watched 18 researchers browse a simplified citation network. Following explicit citation connections picked relevant papers more reliably than reading the spatial layout. Participants nonetheless relied on the layout more often, and it misled and frustrated them.
- **Argo Scholar** ([Li et al. 2022](https://arxiv.org/abs/2210.13510)) had 122 participants, but it was an observational study with Likert ratings and no control condition. It shows that people like incremental graph exploration, not that they find more with it.

## Embedding maps: the 2026 commodity stack

The pipeline is now a template:

1. Embed each document.
2. Cluster in the full-dimensional space (HDBSCAN, or the Tutte Institute's EVoC, 0.3.1 as of March 2026).
3. Project to 2D with [UMAP](https://arxiv.org/abs/1802.03426) or t-SNE.
4. Have an LLM name the clusters at several levels.
5. Render with WebGL or WebGPU.

| Tool | What it does | Version (date) | License | Use it for |
|---|---|---|---|---|
| [datamapplot](https://github.com/TutteInstitute/datamapplot) (Tutte Institute) | "static plots, or simple interactive plots" of labeled maps; search, zoom, pan | 0.7.3 (2026-05-31) | MIT | Publication-quality static maps; a quick interactive HTML map |
| [Toponymy](https://github.com/TutteInstitute/toponymy) (Tutte) | LLM cluster naming "on multiple scales, from broad themes to fine-grained topics"; Anthropic, OpenAI, Cohere or local models | 0.5.4 (2026-09-04); beta, "Things can and will break" | MIT | The labeling layer |
| [Latent Scope](https://github.com/enjalot/latent-scope) | Embed, UMAP, cluster (EVoC, HDBSCAN, k-means, GMM), LLM labels, explore; runs locally; flat-file outputs | 1.0.0 (2026-07-12); curation planned for 1.1 | MIT | The fastest local end-to-end tool |
| [Embedding Atlas](https://apple.github.io/embedding-atlas) (Apple) | "Up to a few million points" via WebGPU; density contours; automatic clustering and labels; nearest-neighbor search; cross-filtered metadata charts; agents can query it "via Model Context Protocol" | 0.25.0 (2026-10-03); [paper](https://arxiv.org/abs/2505.06386) | MIT | An interactive explorer with metadata facets |
| [WizMap](https://arxiv.org/abs/2306.09328) | Multi-resolution summaries; runs in the browser with no backend | ACL 2023 demo | Open source | A reference design for zoomable summaries |
| [BERTopic](https://arxiv.org/abs/2203.05794) | Embed, reduce, cluster, keywords by class-based TF-IDF | 0.17.4 (2025-12-03) | MIT | A baseline topic model |
| Nomic Atlas | Hosted maps (deepscatter renderer) | Python client last released 2025-11-11 | Commercial | Not recommended for new long-lived work (below) |

Versions are from PyPI and npm, checked 2026-10-15.

**A worked example at scale.** "The landscape of biomedical research" ([González-Márquez et al., *Patterns*, April 2024](https://doi.org/10.1016/j.patter.2024.100968)) mapped 20,687,150 PubMed papers with PubMedBERT embeddings and t-SNE. The authors chose t-SNE because, in their tests on PubMed abstracts, it beat UMAP on both kNN recall and kNN accuracy. The interactive version, built with deepscatter, is [still live](https://static.nomic.ai/pubmed.html) as of 2026-10-15. Its colors come from 38 keywords matched against journal titles, so only 34.4% of papers carry a label. Unusually, the authors measured how much their own projection distorts the data (see [How much a 2D projection distorts](#how-much-a-2d-projection-distorts)).

**arXiv maps.** Besides Paperscape (above), IAIFI's [paper map](https://research.iaifi.org/specter), which places the institute's papers among nearby arXiv papers, uses SPECTER2 embeddings, DensMAP (a density-preserving UMAP variant) and HDBSCAN. Its caveat is typical of map makers: "Local neighborhoods are trustworthy, but long-range distances are only approximate." The PubMed measurement below says even the first half of that sentence needs qualifying.

**Nomic's pivot.** As of October 2026, [nomic.ai](https://www.nomic.ai/) sells an AI platform for architecture, engineering and construction (\$20/month Individual; \$40/user/month Business with a 25-seat minimum). Neither its homepage nor its pricing page mentions Atlas. Atlas survives at atlas.nomic.ai and in the docs at docs.nomic.ai. I put ~60% on Atlas being in maintenance mode or sunset within two years (R06's estimate, which I share). If you have maps there, export the coordinates and labels and re-render them with datamapplot or Embedding Atlas.

## Topic models and labels: the bottleneck that moved

Automatic organization used to fail on labels, not on grouping.

- **Before LLMs.** Categories "require manual curation," and automated assignment was "about 75% correct on average" (Hearst in 2009, citing Sebastiani 2002). Clustering traded away consistency and comprehensibility. Single-term labels on a 1998 Kohonen map of web pages were "misleading" ([Hearst, ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html) and [ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)). [LDA](https://www.jmlr.org/papers/v3/blei03a.html) (2003) produced word lists that needed heavy interpretation. BERTopic (2022) moved to embedding clusters but still labeled them with keywords.
- **After LLMs (2024–2026):**

| System | What it does | Result | Source |
|---|---|---|---|
| Knowledge Navigator | Two-level hierarchy of named topics over retrieved papers | LLM names matched **88%** of expert subtopics (CLUSTREC-COVID). Covering 80% of a topic's documents took inspecting 2.3–3.18 of 50 clusters, vs 20.4 for random clusters. SPECTER2 *lagged* general-purpose embedders | [arXiv 2408.15836](https://arxiv.org/abs/2408.15836) |
| TopicGPT | LLM-written topic labels and descriptions | Harmonic-mean purity 0.74 vs 0.64 for the best baseline | [arXiv 2311.01449](https://arxiv.org/abs/2311.01449) |
| LLooM | Concepts with explicit inclusion criteria; every document scored against each criterion | Covered 93% of examples vs 77.7% for BERTopic; 2.0× as many high-quality topics. BERTopic's "women, power, female" became "Criticism of traditional gender roles" | [arXiv 2404.12259](https://arxiv.org/abs/2404.12259) |
| Clio | Embed, k-means, LLM labels, recursive hierarchy, 2D map | Reconstructed a known topic distribution with 94% accuracy (vs 5% random). Estimated cost \$48.81 per 100,000 conversations, calculated at 2024 Claude prices rather than billed. Named failure: "overly broad labels" | [arXiv 2412.13678](https://arxiv.org/abs/2412.13678) |
| OpenAlex Topics | 4 domains, 26 fields, 252 subfields, 4,516 topics. Since October 2026 a fine-tuned Qwen3-8B assigns them from title, abstract and source name; it was trained on 2M works labeled by Claude Opus 5.5 | Right 94.5% of the time on the ~64% of works where it is at least 90% confident. Primary topic agreed with two blind AI judges 81.7% of the time (89.6% at field level), vs 24.8% (44.0%) for the old classifier. About 10% of works get no topic | [OpenAlex help](https://help.openalex.org/hc/en-us/articles/24736129405719-Topics), updated 2026-10-07 |

Two problems carry over into the LLM era, by R06's reading; neither has been measured for LLM labels. Hearst's 2009 finding that users "dislike organizations that show inconsistent levels of description" applies when an LLM labels each cluster on its own: one sibling becomes "Statistics" and the next "Bayesian hierarchical models for small-area estimation." And labels can drift between runs. The fixes are cheap:

- Label all siblings in one prompt, with a target level of granularity.
- Require an inclusion criterion for each cluster (the LLooM pattern).
- Keep a "doesn't fit" bucket.
- Store the model and date with every label.

The 88% figure comes from one biomedical benchmark. Whether it holds for a humanities-heavy book collection is untested.

## The evidence on maps for finding work

| Study | Setup | Result | Source |
|---|---|---|---|
| Chen & Yu 2000, meta-analysis | Six visualization-for-retrieval studies from five papers | "The combined effect of visualization in the studies was not statistically significant"; cognitive ability dominated | [Hearst ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html) |
| Chen et al. 1998 | Yahoo directory vs a Kohonen self-organizing map of the same pages | 11 of 15 map starters found an interesting page within 10 minutes, and 8 of those re-found it in Yahoo. 14 of 16 Yahoo starters found one, but only 2 of those 14 could re-find it on the map. Labels "misleading" | Hearst ch. 10 |
| Pirolli et al. 1996 | Scatter/Gather clustering vs keyword search | A more coherent picture of the collection and richer query vocabulary; *worse* than similarity search for pure retrieval | [Hearst ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html) |
| Hearst & Pedersen 1996 | Clustering retrieved results | Relevant documents fell mainly into 1–2 of 5 clusters | Hearst ch. 8 |
| Sebrechts et al. 1999 | Text vs 2D vs 3D views; 15 participants; tasks designed to favor visuals | Text fastest; 2D faster than 3D; gaps shrank with practice | Hearst ch. 10 |
| Tory et al. 2007 | Point vs landscape spatializations | Points beat landscapes; 2D landscapes beat 3D landscapes | Hearst ch. 10 |
| Apolo 2011; Metro Maps 2012; Bow Tie 2015; Argo Scholar 2022; Choe et al. 2024 | Graph and map tools for papers (details [above](#seed-graphs-connected-papers-and-its-relatives)) | Two small positive controlled results (Metro Maps untested for significance); one controlled null (Bow Tie); one uncontrolled survey; one study in which reading the layout misled | — |
| Open Syllabus Galaxy, 2024 self-report | Co-assignment map of the top ~1M assigned titles | Draws "a lot of oohs and aahs" but not "substantive conversation." The team blames "the lack of habits of interpretation of large-scale plots" | [Galaxy Brain post](https://blog.opensyllabus.org/Galaxy-Brain), June 28, 2024 |

My reading of this evidence, with credences:

1. **Maps do not beat a good ranked list for targeted retrieval** [~85%]. In every comparison with a plain list, directory or search box that I found (Kohonen map vs Yahoo, Sebrechts, Scatter/Gather without search, Bow Tie), the list did as well or better, and the meta-analysis found no significant overall effect.
2. **Maps added to search help newcomers cover a field** [~65%]. Scatter/Gather's vocabulary effect and Metro Maps' 73% vs 46% subarea coverage point the same way. Both use structured, labeled organizations, not unlabeled scatterplots.
3. **The positive discovery results come from *steered*, *stable* maps.** Apolo let users define groups and kept landmarks fixed. Metro Maps drew explicit lines of research. Neither was a passive galaxy view. When Choe et al.'s participants trusted the layout over explicit links, they chose worse.
4. **No controlled study I found shows a Connected-Papers-style graph or an embedding map beating a good ranked list for finding relevant papers** [~65% that none exists]. R06 could not search the web, and this chapter rests on a few searches. The nearest test, Bow Tie, found no retrieval difference. These tools' popularity rests on preference and adoption.
5. **Preference is weak evidence.** Users significantly preferred 3D in a study where it gave no benefit. They preferred the Flamenco faceted interface though it was "an order of magnitude slower," preferred Bow Tie with no retrieval gain, and rated Argo Scholar well with no comparison. Preference may track something real in exploratory work (engagement, confidence) [~55%], so log what users do as well as what they say.

## Why 3D information spaces mostly failed

The 1990s bet was that depth would hold more items and exploit spatial memory. The results:

- **WebBook and Web Forager** ([Card, Robertson & York, CHI 1996](https://doi.org/10.1145/238386.238446)): a 3D "book" of web pages in a hierarchical 3D workspace. The authors called them "exercises to play off against analytical studies of information workspaces." I found no performance evaluation of them, and the design did not spread.
- **Data Mountain** ([Robertson et al., UIST 1998](https://www.microsoft.com/en-us/research/publication/data-mountain-using-spatial-memory-for-document-management/)): users placed 100 page thumbnails on an inclined 2½D plane. In a 32-user study comparing Internet Explorer 4's Favorites with two versions of Data Mountain, the application had a reliable effect on retrieval time in Data Mountain's favor (F(2,18) = 4.84, p below .02). In a follow-up, nine users retrieved pages "not significantly slower" about six months later. They had seen their layouts once more at a six-week pilot and got five minutes of review before the trials ([Czerwinski et al. 1999](https://www.microsoft.com/en-us/research/publication/the-contribution-of-thumbnail-image-mouse-over-text-and-spatial-location-memory-to-web-page-retrieval-in-3d/)). With thumbnails replaced by blank icons, performance recovered quickly, so the layout carried the memory, not the pictures.
- **3D or not 3D?** ([Cockburn & McKenzie, CHI 2001](http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/chi01DM.pdf)) built 2D and 3D versions of a Data-Mountain-like system that "differ only in the number of dimensions." Users were faster with 2D, but not significantly. They significantly *preferred* 3D.
- **Physical and virtual 2D, 2½D and 3D** ([Cockburn & McKenzie, CHI 2002](http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf)): 69 participants, 2,070 trials. Mean retrieval times were 3.7 s (2D), 3.8 s (2½D) and 4.8 s (3D), F(2,63) = 2.5, **p = .09, only marginal**. Clutter ratings rose with dimensions, but significantly only for the physical models. The abstract's conclusion that 3D "hinders retrieval" is stronger than its statistics.
- **Revisiting 2D vs 3D** ([Cockburn 2004](http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/revisiting2Dv3D.pdf)) re-ran a pro-3D experiment with tighter controls: "The effectiveness of spatial memory is unaffected by the presence or absence of three-dimensional perspective effects."
- **Search-result and scatterplot visualizations.** Hearst's 2009 summary: "3D has been found to be inferior, or at best equivalent to 2D or textual interfaces." [Sedlmair, Munzner & Tory (2013)](https://doi.org/10.1109/TVCG.2013.153) had two coders judge class separation in 816 scatterplots, drawn from 75 datasets, four reduction methods and three plot types (2D, interactive 3D, scatterplot matrices). They found 2D "often 'good enough'"; if it is not, try a different reduction method in 2D; and "interactive 3D rarely helps but often hurts."

Why it failed (R06's synthesis, which I share with high confidence): literature is text, and text at depth or in perspective is hard to read (Sebrechts et al. named "the lack of legibility of the text" as a core problem); occlusion and navigation cost time and working memory on every view change; and the benefit people wanted, spatial memory, is fully available in 2D. Designers who judged by users' enthusiasm were misled. So "3D failed" means "3D gave no measurable benefit, cost more, and sometimes made things worse," not "3D was dramatically worse." The same reasoning applies to VR reading rooms: use layout, not depth, for organizing ([VR and Spatial Computing](/environments/vr-and-spatial-computing/), [Building a Virtual Reading Room](/environments/virtual-reading-room/)).

## How much a 2D projection distorts

Any projection of thousands of points into two dimensions distorts. The question is how much, and in which way.

- **Chari & Pachter** ([*PLOS Computational Biology*, 2023](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011288)) tested t-SNE and UMAP on single-cell data.
  - Each point's 30 nearest neighbors in 2D overlapped poorly with its true neighbors: mean Jaccard distance "consistently above 0.7." The mismatch generally grew with dataset size.
  - Ratios of maximum to minimum distance were inflated 4- to 200-fold.
  - By the Johnson–Lindenstrauss lemma, keeping pairwise distances for 10,000 points within 20% "would require at least 1,842 dimensions."
  - Their advice is that 2D embeddings be "treated more as cartoon diagrams to be displayed post-analysis."
  - The domain is genomics, but the geometric argument applies to any embedding. A 2025 correction changed only the data-availability statement.
- **The PubMed landscape** gives the literature-specific numbers. Only 6.2% of 2D nearest neighbors (k = 10) were true nearest neighbors in the 768-dimensional space. Yet 2D neighbors predicted a paper's journal-keyword label 62.6% of the time (69.7% in full dimension) and its publication year with an RMSE of 10.2 years (8.4 in full dimension).

These results reconcile the two camps. **"Nearby" on the map usually means "related." "Nearest" on the map almost never means "most similar."** Distances between distant regions carry little meaning. Chari & Pachter would not use 2D maps for exploration at all. Map makers say local regions are trustworthy. I lean toward a middle position [~80%]: use the map to find and name regions, and compute every similarity claim ("more like this," "what sits between X and Y") in full dimension.

## A map for a 10,000-book catalog

This section specifies a map for the personal catalog at the center of this wiki. Assume 10,000 books, textbooks and monographs; a reader interested in probability, statistics, ML, decision theory, forecasting, economics and philosophy; and texts scattered across open repositories, libraries and paywalls.

### What goes into the layout

The layout signal decides what "near" means. For books the options differ sharply in coverage:

| Layout signal | What "near" means | Availability for books (Oct 2026) | Cost | Catch |
|---|---|---|---|---|
| Embedding of catalog record plus LLM summary | Similar descriptions | Any book with metadata | Under \$2 (below) | Reflects blurbs, not contents. R05 counts tables of contents on only 2.5% of Open Library editions (its own count of the September 2026 dump, which the verification pass could not reproduce) |
| Embedding of full text, per chapter | Similar contents | Only texts you can lawfully process (see [The Legal Map](/building/legal-map/)) | About \$30 for 10,000 books of full text at \$0.02/MTok (R10) | Coverage is limited to readable texts |
| Library of Congress Classification (LCC) shelf order | A cataloger's placement | 14.7M Open Library works carry an LCC (R05) | Free | One class per book; categories are a century old; one-dimensional |
| Co-assignment (Open Syllabus) | Taught together | 32.9M syllabi, 4.4M works (v2.14). Free tier capped at 2019 data; raw graph licensed only (R05) | Institutional | Not openly downloadable |
| Citation or co-citation | Cited together | Good for papers; book-to-book citation data is sparse | Free (OpenAlex, Semantic Scholar) | Weak for books |
| The reader's own placement (Data Mountain) | Where *you* put it | Yours | Your time | Practical for hundreds of items, not 10,000 [~75%] |

Precomputed vectors exist for some books. The Library of Congress publishes experimental 1024-dimension embeddings (Amazon Titan Text Embeddings V2) of its bibliographic records, about 190 GB gzipped and split by LCC class (R05). Using them for a personal catalog means joining on LCCN and downloading large files. Whether their quality beats a fresh embedding of title plus summary is untested.

Recommendation: lay the map out from the record-plus-summary embedding. Offer LCC shelf order and, where you have the data, co-assignment as alternative layouts. Books that land far apart under two layouts ("taught together but described differently") are worth a look.

### The specification

1. **Two synchronized panes: map and ranked list.** Selecting a region filters the list. Searching highlights hits on the map. Search comes first: the map's most useful mode is often a map of *one query's results* (Hearst & Pedersen 1996; Knowledge Navigator). The whole-catalog map is for orientation and spatial memory.
2. **10–15 labeled regions at the top level, about 10 subregions each, and a third level labeled lazily on zoom.** Hearst summarizes the cluster-count evidence as "fewer is better." In Käki's 2005 experiment (27 participants, one-minute tasks), users shown 40 groups were slower and selected fewer relevant documents than with 10 or 20 (not significant), and rated 20, and especially 40, "too many" ([Hearst, ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html)). At 10,000 books, 10–15 regions average roughly 670–1,000 books each, and subregions 67–100.
3. **LLM labels with discipline.** Label siblings together. Write an inclusion criterion per region. Keep a "doesn't fit" bucket. Show each label's model and date. Add a **label-fit score**: a second model sorts a held-out sample of each region's books among the sibling labels, and a region scoring under about 70% gets flagged [threshold is my guess]. This makes the label's information scent measurable.
4. **A frozen layout.** Positions never move unless the reader moves them. New books arrive in an inbox strip and are placed with UMAP's [`transform`](https://umap-learn.readthedocs.io/en/latest/transform.html) or [openTSNE](https://pypi.org/project/openTSNE/), both of which add new points to an existing map. Re-run the full layout only on request and with an animation. Let the reader pin and drag books. This follows Data Mountain, whose users recalled layouts only they had arranged months later, and Apolo, which kept landmarks fixed.
5. **Honest neighbors.** Hovering a book draws lines to its true 10 nearest neighbors in full dimension, even across the map, and lists them. Each region shows a local neighbor-preservation score (the share of 2D neighbors that are true neighbors). Never label an axis and never show a distance as a number. Choe et al.'s researchers chose better by following explicit links than by reading positions.
6. **Points, not landscapes, and no 3D.** Draw books as points (Tory 2007) that turn into covers or spines on zoom (semantic zoom). Use density contours for regions. No terrain, no depth.
7. **One overlay at a time, from the reader's own data.** Read or unread, owned, rating, notes, and, for this wiki's purposes, the **access route**: readable free now, via your library, via a subscription, or not available (see [The Access Ladder](/access/access-ladder/)). A map colored by "can I read this tonight?" answers a question a topic map alone cannot.
8. **Books as constellations, where you have the text.** A single point for Jaynes's *Probability Theory: The Logic of Science* has to sit somewhere between statistics, physics and philosophy of science, and ends up in none of them. Where chapter text or a table of contents exists, plot chapters as points and draw the book as a faint polygon around them [inference; untested].
9. **Measure it.** Log relevant items found per minute of browsing, time to first relevant item, and (monthly) a "write what you know about field X" probe. Run a within-person comparison: map-plus-list weeks against list-only weeks.

### What it costs

Assumptions [inference]:

- Each book's record plus summary is about 600 tokens; this sets the embedding cost.
- There are about 1,000 clusters across three levels.
- Labeling calls send a short form of each book (title plus a one-line summary, about 140 tokens). Each call sends about 25 sample books: about 3,500 tokens in and 150 out.
- Each label-fit call sends 10 held-out books in the same short form, plus the sibling labels and their inclusion criteria: about 4,000 tokens in and 200 out.
- Prices are first-party rates from this wiki's pricing reference (2026-10-06), with the Batch API at 50% off.

| Step | Tokens | Claude Haiku 5.5 batch | Claude Sonnet 5.5 batch |
|---|---|---|---|
| Summaries from metadata plus table of contents (1,500 in / 300 out per book) | 15M in, 3M out | \$1.50 | \$30 |
| Embeddings of record plus summary | 6M | \$0.12 at \$0.02/MTok (text-embedding-3-small or voyage-4-lite); \$0 with a local model | — |
| Cluster labels, three levels | 3.5M in, 0.15M out | \$0.21 | \$4.25 |
| Label-fit check (10 held-out books per cluster) | 4M in, 0.2M out | \$0.25 | \$5 |
| **Core map total** | | **about \$2** | **about \$40** |
| Optional: chapter embeddings from full text | ~1.5B | ~\$30 at \$0.02/MTok | — |
| Optional: per-chapter "aspect strips" (R06 appendix) | 1.5B in, 45M out | ~\$86 | ~\$1,725 |

Running the labels on Claude Opus 5.5 at standard (non-batch) prices would cost about \$17, or about \$23 if its newer tokenizer counts the full 1.35 times as many tokens for the same text. At these prices, pick the label model on quality, not cost: use the best model you have for the label pass. R10 estimates the build itself at a weekend (12–20 hours) for about 10,000 works with summaries, embeddings, a static site and a UMAP topic map. The real costs are your attention and the time spent checking labels. Fuller cost tables are in [Costs and Effort](/building/costs-and-effort/), and the data model is in [A Reference Architecture](/building/reference-architecture/).

### Honest limits

- **The projection misplaces individual books.** Expect most of a book's 2D neighbors not to be its true nearest neighbors. The PubMed figure is 6.2% kNN recall over 20.7M points. Chari & Pachter found the mismatch grows with dataset size, so a 10,000-book map should do better, but I still expect recall under 50% [~70%; a guess, not a measurement]. Measure it on your own data.
- **UMAP vs t-SNE is an empirical choice.** The PubMed authors found t-SNE beat UMAP on kNN recall and accuracy for their data. Compute recall for both on your embeddings and keep the better one. Both can place new books into a frozen map.
- **Labels describe the metadata, not the books.** With tables of contents on roughly 2.5% of Open Library editions, summaries of obscure books come mostly from title, subjects and the model's prior knowledge, which is good for a well-known book and can be invented for an obscure 1970s monograph. A label-fit check catches incoherent regions, not a confident wrong summary of one book.
- **The map depends on the embedding model.** Knowledge Navigator found the domain-specific SPECTER2 *worse* than general embedders for clustering papers; no equivalent evaluation exists for books. Try two models and inspect where they disagree. Contested regions are often interdisciplinary and deserve a closer look, not a label.
- **UMAP and t-SNE are stochastic.** Different seeds give different maps. Fix the seed, and freeze the result (item 4 above).
- **Multi-topic books are the hardest case and the most valuable.** A single point averages them away (item 8 above).
- **Spatial ability varies.** Some readers will get little from any map (Chen & Yu). The list pane must stand on its own.
- **Interpretation is a skill.** Open Syllabus says its Galaxy draws "oohs and aahs" but not "substantive conversation." A map needs verbs: gather a region, compare two regions, show what is between them, list what I haven't read here.

## What to do

| If you want to... | Do this | Main obstacle |
|---|---|---|
| See the shape of your catalog this weekend | Latent Scope 1.0 locally, or embed plus UMAP plus Toponymy labels rendered in Embedding Atlas; datamapplot for a static HTML or poster map | Label quality; budget an hour to read and fix labels |
| Choose a 2D projection | Compute kNN recall (k = 10) for UMAP and openTSNE on your own embeddings; keep the better one and freeze it | Recall will be low either way; similarity still has to come from full dimension |
| Find the next relevant paper given one you know | A seed graph (Connected Papers' free 5/month, Litmaps, Local Citation Network) *plus* a ranked search. Follow the graph's links, not its layout | Papers only; no evidence that graphs beat lists |
| Learn an unfamiliar field fast | LLM-labeled cluster hierarchy over search results, Scatter/Gather style, with a synced list. Supplement with human-written overviews (syllabi, review articles; see [Curation](/finding/curation/)) | Labels at inconsistent levels; fix by labeling siblings together |
| Analyze a field bibliometrically | VOSviewer (free) on an OpenAlex query; CiteSpace if you need burst detection and will pay \$65–155 | Learning curve; the figures persuade more than they prove |
| Build a "galaxy" of everything in 3D or VR | Don't, for retrieval. Make a 2D map with a stable layout | 3D is preferred in demos and gives no measured benefit |
| Keep maps you made in Nomic Atlas | Export coordinates and labels now; re-render with datamapplot or Embedding Atlas | Atlas's future is uncertain [~60% maintenance or sunset within two years] |

The interaction patterns that sit around a map are covered elsewhere: Scatter/Gather, berrypicking and foraging theory in [Foraging and Exploratory Search](/interfaces/exploratory-search/); shelf order in [Browsing the Stacks](/finding/browsing-the-stacks/); generated per-query views in [Generative Interfaces](/interfaces/generative-interfaces/).

## Open questions

- Does an LLM-labeled map plus a synced list increase relevant books found per minute, compared with a faceted list alone, for one reader over a month? A within-person A/B test with logged foraging rate would answer this for that reader.
- What kNN recall (k = 10) do UMAP, DensMAP and t-SNE achieve on 10,000 book-level embeddings of record plus summary? Does chapter-level embedding change it?
- Does LLM cluster naming reach Knowledge Navigator's 88% expert agreement on a humanities and social-science book collection, judged against Library of Congress Subject Headings or a librarian?
- Does a frozen map layout produce measurable spatial memory for a 10,000-item library over months, as Data Mountain did for 100 pages?
- Has anyone, since Bow Tie (2015), run a controlled comparison of a citation-graph or embedding-map tool against a ranked list on expert-judged relevance? A systematic search of CHI, CHIIR, IEEE VIS and JASIST, which neither R06 nor this chapter ran, would settle it.
- Was Bow Tie's null result about the display or about the weak labels of its era? Re-running its tasks with LLM-labeled clusters would separate the two.
- Are the Library of Congress's experimental record embeddings good enough to lay out a personal book map, compared with a fresh embedding of title plus summary?
- Will Open Syllabus license co-assignment data for personal, non-commercial tools, and at what price?
- Is Nomic Atlas still receiving releases by mid-2027? Check PyPI for the `nomic` client.

## Related pages

- [Foraging and Exploratory Search](/interfaces/exploratory-search/): scent, berrypicking, Scatter/Gather, facets
- [Reading Interfaces](/interfaces/reading-interfaces/): overview+detail and semantic zoom inside a document
- [Generative Interfaces](/interfaces/generative-interfaces/)
- [Browsing the Stacks](/finding/browsing-the-stacks/): LCC shelf order
- [Catalogs and Metadata](/finding/catalogs-and-metadata/)
- [AI Research Assistants](/finding/ai-research-assistants/): citation-graph tools in context
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): Open Syllabus
- [VR and Spatial Computing](/environments/vr-and-spatial-computing/) and [Building a Virtual Reading Room](/environments/virtual-reading-room/)
- [A Reference Architecture](/building/reference-architecture/) and [Costs and Effort](/building/costs-and-effort/)
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/)
