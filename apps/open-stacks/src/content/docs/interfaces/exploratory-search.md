---
title: Foraging and Exploratory Search
description: The theory and evidence on how people explore large information spaces (information foraging, berrypicking, the sensemaking loop, Shneiderman's mantra, exploratory search) and the interfaces built on it (Scatter/Gather, faceted search, fisheye views, TileBars, overview+detail), with what cheap LLM metadata now unblocks and twelve design principles for a literature explorer.
---

*Status: draft, October 2026. Claude prices are first-party rates as of October 2026; OpenAlex and Semantic Scholar figures are from their October 2026 pages and releases. Most of the interface evidence comes from small lab studies run between 1996 and 2008, several known only through Marti Hearst's 2009 book on search user interfaces. LLM-era results (2023–2026) are as their authors report them. Quotes and numbers were re-checked on 2026-10-15 against the sources linked inline; [T] marks training knowledge I could not re-check, and [I] marks my inference. Sources: the [R06 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md), [R05](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md) and [R10](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md) for Open Library and Semantic Scholar counts, and primary sources linked inline.*

Browsing a literature is not a slower kind of search. Someone looking for one known paper needs a good ranked list. Someone trying to learn a field needs to see its structure, pick up its vocabulary, and follow leads they could not have named at the start. Forty years of research on that second task produced consistent design advice, much of which went unbuilt because someone had to write the labels, categories and summaries by hand. This chapter covers the theory, the classic interfaces and the evidence for each, then what LLMs change and what they don't.

## The short version

- **Two jobs, two interfaces, linked.** Ranked lists win targeted retrieval. Clusters and facets win learning a collection's structure. Scatter/Gather used without search was *worse* than similarity search at finding relevant documents, but gave users "a more coherent conceptual image" of the collection and a richer query vocabulary ([Pirolli et al. 1996](https://doi.org/10.1145/238386.238489)). Build both, and make every selection in one a filter on the other.
- **Faceted navigation and overview+detail are the two ideas that clearly worked.** 90–91% of 32 art-history students preferred the Flamenco faceted interface to a Google-Images-style baseline, and 97% said it helped them learn more about the collection ([Yee et al. 2003](https://flamenco.berkeley.edu/papers/flamenco-chi03.pdf)). For document comprehension, "no alternative has been found to be more effective" than overview+detail ([Cockburn, Karlson & Bederson 2008](https://www.microsoft.com/en-us/research/wp-content/uploads/2008/01/cockburn-ComputingSurveys09.pdf)). Fisheye distortion of text and 3D layouts did not hold up.
- **The historical blocker was labels and metadata, and LLMs remove most of it.** In 2009, automated category assignment was "about 75% correct on average" ([Hearst, ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html)). Since October 2026, OpenAlex's fine-tuned LLM classifier is right 94.5% of the time on the 64% of works where it is confident; its published tests mostly use AI judges, and against arXiv authors' own categories its field-level agreement is 83% ([OpenAlex](https://help.openalex.org/hc/en-us/articles/24736129405719-Topics)). Facet-labeling 10,000 books costs about \$1 in tokens on Claude Haiku 5.5 batch (estimate below).
- **The new constraint is the quality of the scent.** Generated summaries are information scent (cues about content you can't see yet), and fluent scent can be wrong. In a 2023 audit only 51.5% of generative-search sentences were fully supported by their citations ([Liu et al.](https://arxiv.org/abs/2304.09848)). In seven experiments (n = 10,462), people who learned a topic from LLM syntheses reported shallower knowledge than people who used web search, even when the syntheses carried web links ([Melumad & Yun 2025](https://doi.org/10.1093/pnasnexus/pgaf316)). When learning is the goal, lead with the sources and treat generated text as a pointer into them.
- **The theory names features current tools lack:** Bates's six berrypicking moves as one-click actions, Shneiderman's neglected *history* and *extract* tasks, and support for the sensemaking loop (evidence files, schemas, hypotheses). Many AI research assistants collapse all of this into one query and one answer [I].
- **The evidence base is thin, so measure your own tool.** A review of 124 exploratory-search user studies from 2010–2021 found a median sample of 24; 75% drew only on students and other academics, and five had more than 100 participants ([Medlar et al. 2023](https://arxiv.org/abs/2312.13695)). I found no controlled study of an LLM-labeled exploratory interface over books.

## Lookup, learn, investigate

**Mechanism.** Gary Marchionini's "Exploratory search: from finding to understanding" ([*CACM* 49(4), 2006](https://doi.org/10.1145/1121949.1121979)) separates three kinds of search activity:

| Activity | What the searcher wants | What supports it |
|---|---|---|
| **Lookup** | A known item or a fact: a number, a name, one paper | Well-formed queries, ranked results ("analytic strategies") |
| **Learn** | To understand a topic: knowledge acquisition, comprehension, comparison | Browsing, many iterations, judging many results |
| **Investigate** | To analyze, synthesize, evaluate or discover: a literature review, a forecast's evidence base | Browsing plus querying; high recall |

Exploratory search is the learn and investigate rows. The guest editors' introduction to that *CACM* special section summarizes Marchionini's argument: exploratory search "is based on learning and investigation, and requires support for browsing strategies, whereas lookup or retrieval can be best supported by analytic strategies" ([White, Kules, Drucker & schraefel 2006](https://www.microsoft.com/en-us/research/uploads/prod/2016/11/Supporting-Exploratory-Search.pdf)). The Marchionini article is paywalled; the table follows that introduction and the 2023 review cited below.

White and Roth's *Exploratory Search: Beyond the Query-Response Paradigm* (2009) puts **uncertainty** at the center: the searcher may not know the domain, the vocabulary, or even the goal. Their model has two phases, exploratory browsing while uncertainty is high and focused searching as it falls ([summary in Medlar et al. 2023](https://arxiv.org/abs/2312.13695); [Wikipedia](https://en.wikipedia.org/wiki/Exploratory_search)). For a reader entering, say, causal inference from a forecasting background, the first hour is browsing; the useful queries come later.

**Evidence that learning is the payoff.**

- O'Day and Jeffries interviewed 15 business analysts and found "the main value of the search was found to reside in the accumulated learning," not in the final result set ([Hearst, ch. 3](http://searchuserinterfaces.com/book/sui_ch3_models_of_information_seeking.html)).
- Kuhlthau's field study of 385 library users at 21 sites, mostly students writing research papers, found that half "did not show evidence of successfully reaching a focused perspective" at any time during their search (Hearst, ch. 3). Exploratory search often fails at the learning step, not the retrieval step [I].

**Evidence about the evidence.** Exploratory search is hard to evaluate: more time spent is not failure, and there is no single right answer. The 2006 editors wrote that "no metrics exist to determine how well a system supports exploration." Medlar, Kotkov and Głowacka's [systematic review](https://arxiv.org/abs/2312.13695) of 231 publications from 2010–2021 (172 with user studies) found:

- 77% of studies evaluated a new experimental system rather than how people search.
- 20.7% concerned scientific-literature search, most of them over computer-science articles.
- In the 124 studies with simulated work tasks, sample sizes ranged from 2 to 381, with a median of 24 (20 for within-subject designs).
- 75% drew only on students and other academics. Validated questionnaires were rare.

Treat any single result below as a direction, not an effect size.

**What follows for a literature explorer** [I]. Most of what a broad reader does is learn and investigate. The success metric should be learning and coverage, not precision at 10: did the reader meet the field's canonical works and its main disagreements, and can they write a better map of it after 20 minutes? Lookup still needs a fast, boring ranked list.

## Information foraging

**Mechanism.** Pirolli and Card's information foraging theory ([*Psychological Review* 106(4), 1999](https://doi.org/10.1037/0033-295X.106.4.643)) borrows optimal foraging theory from behavioral ecology. It "assumes that search strategies evolve toward those that maximize the ratio of valuable information gained to unit of cost for searching and reading" ([Hearst, ch. 3](http://searchuserinterfaces.com/book/sui_ch3_models_of_information_seeking.html)). It has three parts:

- **Patches.** Information comes in clumps: a journal issue, a results page, a bibliography, a shelf. In the conventional patch model the forager maximizes `R = G / (T_B + T_W)`, total gain over time spent between patches plus time within them, and Charnov's marginal value theorem says to leave a patch when its marginal rate of gain falls to the average rate available elsewhere [T; ~85% that this matches the 1999 paper's notation, which I could not open].
- **Information scent.** "Cues that provide searchers with concise information about content that is not immediately perceptible": titles, snippets, link text, thumbnails, abstracts. "The detection of diminishing information scent is involved in decisions to leave an information patch" (both quoted from Hearst, ch. 3).
- **Diet.** Which kinds of items are worth pursuing at all, given what else is available.

For a decision theorist this is an explore–exploit problem with an optimal-stopping rule per patch, and scent is the forager's prior on each unopened item.

**Evidence.**

- Pirolli (2007) notes that "small perturbations in the accuracy of information scent can cause qualitative shifts in the cost of browsing" (Hearst, ch. 3). The practical lesson: scent quality has nonlinear effects.
- Furnas's navigability proposition: for a target to be findable, "the path to that target must have good scent at every link" (Hearst, ch. 3). One bad label at the top of a hierarchy hides everything below it.
- SNIF-ACT (Fu & Pirolli 2007) predicted users' link choices on real websites from word-relatedness statistics ([Wikipedia summary](https://en.wikipedia.org/wiki/Information_foraging); medium confidence, as I did not read the paper).
- Jakob Nielsen applied the theory to web usability, including an essay titled "Deceivingly strong information scent costs sales" (title via Wikipedia). Scent that promises more than the content delivers can be worse than weak scent, because users commit to the wrong path [I].

**What LLMs unblock.** An LLM is above all a **scent generator**: a one-line TLDR, a "why this is cited here" gloss, a chapter gist, a cluster label. Semantic Scholar's TLDRs began as a research dataset of 5.4K summaries of 3.2K papers ([SciTLDR, 2020](https://arxiv.org/abs/2004.15011)); its 2026-10-06 dataset release holds about 58M (per R10). For books, where about 2.5% of Open Library editions carry a table of contents (R05's count of the September 2026 dump, not independently reproduced; see [Catalogs and Metadata](/finding/catalogs-and-metadata/)), generated scent is often the only scent available.

**What LLMs make worse.** Generated scent is fluent, so it reads as strong whether or not it is accurate. Two results bear on this:

- **Accuracy.** Liu, Zhang and Liang audited four generative search engines in 2023 (Bing Chat, NeevaAI, perplexity.ai, YouChat). Only 51.5% of generated sentences were fully supported by their citations, and only 74.5% of citations supported their sentence ([arXiv 2304.09848](https://arxiv.org/abs/2304.09848)). These are 2023 systems; I found no comparable 2026 audit.
- **Learning.** Melumad and Yun ran seven experiments with 10,462 participants in total, four in the paper and three preregistered replications in its supplement ([*PNAS Nexus*, October 2025](https://doi.org/10.1093/pnasnexus/pgaf316)). People who researched a topic through an LLM synthesis (ChatGPT; a simulated chatbot showing the same facts as a simulated results page; or Google's AI Overview) reported shallower knowledge than people who used ordinary web results. In Experiment 2, with the facts held constant, they spent less time with the results: 83.65 s against 124.32 s, F(1, 1,977) = 58.75. They wrote sparser, less original advice, which blind recipients rated less helpful (3.553 vs 3.816 in Experiment 4, AI Overview vs ordinary Google results). The effect held in a replication where the LLM summaries carried real-time web links. The authors' explanation is foraging-shaped: a synthesis removes the work of finding and combining sources, and that work is where learning happens. Caveats: learning was measured by self-report and by text analysis of the advice, not by a knowledge test; the topics were everyday ones (planting a vegetable garden, leading a healthier lifestyle) researched to advise a friend; and the authors note the effect might not hold for advanced science or math, where a synthesis might help comprehension.

**Design consequences** [I]:

- Treat generated text as scent pointing into sources, not as the destination. Show the source's own words (abstract, table of contents, cited passage) first and the generated gloss second, labeled as generated. Links appended to a synthesis are not enough, per the replication above.
- Make scent a forecast you can score: a "worth reading?" probability per item, checked against the reader's later ratings and recalibrated.
- Measure foraging directly: relevant items found per minute of attention, and time to first relevant item, logged and compared across features.

## Berrypicking

**Mechanism.** Marcia Bates's ["The Design of Browsing and Berrypicking Techniques for the Online Search Interface"](https://pages.gseis.ucla.edu/faculty/bates/berrypicking.html) (1989) observed that real searches evolve: "the query itself (as well as the search terms used) is continually shifting, in part or whole." The need is satisfied "not by a single final retrieved set" but by bits picked up along the way, as a berry-picker moves through a field. She names six strategies and argues that "the searcher with the widest range of search strategies available is the searcher with the greatest retrieval power."

| Bates's strategy | Her 1989 interface recommendation | 2026 implementation [I] | Cost for papers / books [I] |
|---|---|---|---|
| **Footnote chasing** (backward chaining) | "Ability to jump back and forth between text and references" | Reference lists from OpenAlex or Semantic Scholar; GROBID for PDFs | Near zero / medium (book bibliographies need extraction) |
| **Citation searching** (forward chaining) | "Make jumps in any direction ad infinitum" | Cited-by lists from OpenAlex or Semantic Scholar | Near zero / poor (book-to-book citation data is sparse) |
| **Journal run** | "Easy jumps between contents lists and articles and back again" | Source filters in OpenAlex; LLM triage of a volume's abstracts. For books: a publisher's series | Low / low |
| **Area scanning** | Shelf-list browsing at several levels of the classification, able to "jump the rails"; "the quintessential form of browsing in manual environments" | Call-number order (LCC) or an embedding neighborhood. See [Browsing the Stacks](/finding/browsing-the-stacks/) | Medium / medium |
| **Subject search** in abstracting and indexing services | "Rapid browsing of many references without cost" | LCSH, OpenAlex topics, or LLM-assigned facets | Low / low |
| **Author searching** | Group an author's full texts in one place and make it easy to "flip through" them | Author IDs in OpenAlex; ORCID | Near zero / medium (author disambiguation) |

Bates's general recommendations still read like a feature list: call each technique up "with a single command"; "make it easy to highlight or otherwise flag information and references to be sent to a temporary store"; and use a virtual version of the physical library as an orientation device. She also noted that "hypertext approaches appear tailor-made for berrypicking searching."

**Evidence.** Bates cites Stenstrom and McBride's 1979 survey of social-science faculty. Over 87% said they got references from abstracting journals "only occasionally, rarely, or never." Instead they "relied far more heavily on footnote chasing: 69 percent." Information science had "generally assumed" that subject searching in abstracting and indexing services was "clearly superior to the others"; for these researchers it was a minor route.

**What LLMs unblock.** For papers, each of the six moves is now an API call or a short agent step (for books, citation data and bibliographies are thinner; see the last column), and an agent can run all six from a seed item in parallel. The useful output is the *union with provenance*: each result tagged "found by footnote chase from X" or "co-shelved with Y." That keeps the path visible, which is what makes berrypicking a learning process.

**What current tools do instead.** Many AI research assistants collapse berrypicking into one query and one synthesized answer [I] (see [AI Research Assistants](/finding/ai-research-assistants/)). The Melumad and Yun result suggests this costs learning [~60% that the effect transfers to technical literatures; untested, and the authors themselves flag advanced topics as a possible exception]. A January 2026 perspectives paper by Azzopardi and Roegiest argues that generative AI shifts people from foraging to "information farming," cultivating their own structured yields with prompts ([arXiv 2601.12544](https://arxiv.org/abs/2601.12544)). It reports no new study; I read it as a hypothesis to test, not a finding.

## The sensemaking loop

**Mechanism.** Russell, Stefik, Pirolli and Card (1993) framed sensemaking as a cost structure: people pursue the representation and strategy with the best expected return, and switch when returns diminish. Pirolli and Card (2005), from cognitive task analysis of intelligence analysts, describe two nested loops ([Hearst, ch. 3](http://searchuserinterfaces.com/book/sui_ch3_models_of_information_seeking.html)):

1. "An information foraging loop consisting of seeking, filtering, reading, and extracting information."
2. "A sensemaking loop consisting of iterative development of a mental model" that fits the evidence.

Their diagram's intermediate products run from external sources to a "shoebox" of collected items, an evidence file of extracted snippets, a schema, hypotheses, and a final presentation [T, high; the 2005 paper's host was unreachable]. They also name "leverage points" where tools could cut costs: on the foraging side, the trade-off between exploring, enriching and exploiting a collection, and the cost of scanning for relevant items; on the sensemaking side, the limited span of attention for evidence and hypotheses, the narrow range of hypotheses people generate, and confirmation bias [T, medium; checked only against a course summary of the paper].

**Evidence (small and qualitative).**

- Cowley et al. (2005) observed nine analysts in a simulated task. On average they split their time equally among a web browser, a word processor and the file system, so searching and reading took only about a third of it (Hearst, ch. 3).
- Patterson et al. (2001) gave 10 professional analysts a 2,000-document collection containing 9 "high-profit" documents. What separated those who found them from those who didn't was "the persistence of the analysts." The authors asked for tools that "would allow the easy manipulation, viewing, and tagging of small text bundles" (Hearst, ch. 3).
- Hearst's verdict in 2009: "the standard Web search interface does not do a good job of supporting the sensemaking process."

**What LLMs unblock.** LLMs fit the middle of the pipeline unusually well. They can extract candidate claims, definitions and data into an evidence file, propose a schema for a pile of excerpts, and, most usefully, run targeted searches for disconfirming evidence, the leverage point people neglect. Recent prototypes target this loop. Sensecape (UIST 2023) supports moving between levels of abstraction and between foraging and sensemaking; its within-subject study found users explored more topics ([arXiv 2305.11483](https://arxiv.org/abs/2305.11483); no effect sizes in the abstract). The active-reading workspaces that treat an excerpt with a link to its source as the basic unit (LiquidText, Threddy) are covered in [Reading Interfaces](/interfaces/reading-interfaces/).

For a forecasting-minded reader the natural end of the sensemaking loop is a set of hypotheses with credences, each linked to the evidence that moved it [I]. An LLM can then propose "the evidence that would most change this credence" and go looking for it, a crude value-of-information search.

## Shneiderman's mantra

**Mechanism.** Ben Shneiderman's ["The Eyes Have It"](https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf) (1996) gives the Visual Information-Seeking Mantra, "overview first, zoom and filter, then details-on-demand," and prints it ten times. It lists seven tasks (overview, zoom, filter, details-on-demand, relate, history, extract) and seven data types (1D, 2D, 3D, temporal, multidimensional, tree, network). Textual documents fall under 1D.

**Status of the evidence.** Shneiderman says the mantra "proved to be only a starting point," and closes by saying that tools such as "dynamic queries, treemaps, fisheye views, parallel coordinates, starfields, and perspective walls … will have to be tamed and validated." It is a design heuristic, not an empirical law. For text collections the evidence suggests a different order. Clustering a query's *retrieved* results concentrated relevant documents: they "tended to fall mainly into one or two out of five clusters" ([Hearst & Pedersen 1996](https://doi.org/10.1145/243199.243216)). I know of no comparable result for whole-collection overviews. Hearst's 2009 verdict on visualization for search is that it "has not yet proven itself for search interfaces" ([ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)).

**Two neglected tasks.** *History* ("keep a history of actions to support undo, replay, and progressive refinement") and *extract* ("allow extraction of sub-collections and of the query parameters") are exactly what berrypicking needs. Most discovery tools still lack both [I]: there is no record of the path and no way to export the basket with the queries that produced it.

**Amended for literature** [I, medium-high]: search first, then show structure over the results, filter, then details on demand, and keep the history.

## Scatter/Gather: clustering as navigation

**Mechanism.** Cutting, Karger, Pedersen and Tukey ([SIGIR 1992](https://doi.org/10.1145/133160.133214)) conceded that document clustering had failed as a way to improve retrieval. They proposed it instead as "an information access tool in its own right." The system clusters the collection and shows a summary of each cluster. The user picks some clusters ("gather"), the system re-clusters that subset on the fly ("scatter"), and the loop repeats. Their contribution was linear-time clustering fast enough for interactive use.

**Evidence.**

- **Pirolli, Schank, Hearst & Diehl** ([CHI 1996](https://doi.org/10.1145/238386.238489)): compared with keyword search, Scatter/Gather "induces a more coherent conceptual image of a text collection, a richer vocabulary for constructing search queries, and communicates the distribution of relevant documents over clusters." But "Scatter/Gather without a search facility was less effective than a standard similarity search" at finding relevant documents ([Hearst, ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html)).
- **Hearst & Pedersen** (SIGIR 1996): relevant documents fell mainly into 1–2 of 5 clusters of retrieved results, and precision and recall were higher within the best cluster.
- **Number of groups.** Käki (2005) showed 27 participants 10, 20 or 40 groups of results; "20, and especially 40 groups were perceived as too many." Hearst's summary: "fewer is better" (ch. 8).
- **Graphics vs text.** Graphical cluster displays were "much harder to use than textual representations" for non-experts (Kleiboemer et al. 1996). Participants disliked Grokker's nested-circle display and preferred the textual Vivisimo, with no significant difference in speed or accuracy (Rivadeneira & Bederson 2003; [Hearst, ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)).

**Why clustering lost to categories.** Hearst's synthesis (ch. 8) names the labels, not the interaction. Polythetic clusters have a "lack of predictability" and conflate many dimensions. Their labels vary in level of description, and users "dislike organizations that show inconsistent levels of description." Comparisons favored meaningful categories over clusters (Rodden et al. 2001; Pratt et al. 1999, which found a "strong subjective preference for category organization"). The commercial clustering engines faded: IBM bought Vivisimo in 2012, Grokker and Kartoo closed around 2009–2010, and Google's Wonder Wheel was removed around 2010 [T, medium].

**What LLMs unblock.** The interaction model was never refuted; the labels were. Since 2024, LLM labels have done well on the few benchmarks tried:

| System | What it does | Result | Source |
|---|---|---|---|
| Knowledge Navigator (2024) | Revisits Scatter/Gather explicitly. Clusters up to 1,000 retrieved papers into a two-level hierarchy of named topics and subtopics; the user drills in and retrieves more | LLM names (GPT-4o or Mixtral-8x7B) matched **88%** of expert subtopics on CLUSTREC-COVID. A searcher needs to inspect 2.3–3.18 of 50 clusters to cover 80% of a topic's documents, vs 20.4 for random clusters. The science-specific SPECTER2 embedding lagged general-purpose embedders | [arXiv 2408.15836](https://arxiv.org/abs/2408.15836) |
| Clio (Anthropic, 2024) | Embed, k-means, LLM labels, recursive hierarchy, map view | 94% accuracy reconstructing a known topic distribution (vs 5% random). About \$48.81 per 100,000 conversations, calculated at 2024 Claude prices, not billed. Named failure mode: "overly broad labels" | [arXiv 2412.13678](https://arxiv.org/abs/2412.13678) |
| LLooM (CHI 2024) | Clusters become concepts with explicit inclusion criteria; every document is scored against each criterion | 93% coverage of examples vs 77.7% for BERTopic; 2.0× as many high-quality topics | [arXiv 2404.12259](https://arxiv.org/abs/2404.12259) |

TopicGPT and the map-oriented tools built on the same pipeline are compared in [Maps of Knowledge](/interfaces/maps-of-knowledge/).

**What it costs per interaction** [I, at October 2026 prices from this wiki's pricing reference and [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing)]. Assume one "gather" re-clusters about 200 retrieved items locally from precomputed embeddings, then labels 10 clusters in one call with 8 exemplar titles and abstracts each: about 21,000 tokens in and 1,500 out. That is about \$0.003 on Claude Haiku 5.5, \$0.06 on Sonnet 5.5, and \$0.11 on Opus 5.5 (up to a third more on Opus because of its tokenizer). A hundred gathers a day on Sonnet costs about \$6.

**What remains.** Hearst's warning about inconsistent levels returns when an LLM labels each cluster on its own: one sibling becomes "Statistics" and the next "Bayesian hierarchical models for small-area estimation." Labels also drift between runs. The 88% figure comes from one biomedical benchmark. The fixes are cheap: label siblings in one prompt at a stated granularity, write an inclusion criterion per cluster, keep 10–20 clusters or fewer per level, keep a "doesn't fit" bucket, and always pair the clusters with search. Map-style displays of the same clusters, and their distortions, are covered in [Maps of Knowledge](/interfaces/maps-of-knowledge/).

## Faceted search: Flamenco

**Mechanism.** Facets are independent dimensions of metadata (date, place, medium, author, topic), each possibly hierarchical, shown with counts of matching items. Users narrow or broaden along any facet in any order, mixed with keyword search, and the structure of the collection stays visible throughout. Flamenco ("FLexible information Access using MEtadata in Novel COmbinations") was Hearst's group's research system, built in the early 2000s.

**Evidence.** Yee, Swearingen, Li and Hearst ([CHI 2003](https://flamenco.berkeley.edu/papers/flamenco-chi03.pdf)) tested 32 art-history students on a collection of 35,000 fine-arts images against a baseline modeled on Google Image search. From the paper:

- **Preference:** 90% preferred the faceted interface overall (the abstract; the results section says 91%). 97% said it helped them learn more about the collection, 75% found it more flexible, and 72% found it easier to use. 88% said it was more useful "for the types of searching they usually do."
- **Success:** on "find all" tasks, 81% of faceted users retrieved all the aquatints against 57% with the baseline, and 77% retrieved all the woodcuts against 21%. Baseline users hit empty results 82 times, faceted users 26 times. Part of the baseline's failure was users not trying both singular and plural query terms.
- **Time:** faceted users took longer: 12 min 6 s against 9 min 30 s on one task (about 27% longer) and about 9 min against 7 min 45 s on the other (about 16% longer). The authors attribute much of the gap to the prototype's latency (3.7 s per step against 0.3 s for the baseline) and to system errors in 5 of 32 sessions.
- **Caveats:** for a simple single-facet task ("roses") about half preferred the baseline. Seeing the faceted interface first lowered the baseline's ratings.

**What "an order of magnitude slower" means.** The paper's conclusion says the interface "was often an order of magnitude slower" than the baseline, and Hearst's book repeats the phrase. The measurement behind it is the system's *processing time* per step; users' task times were 16–27% longer. So the preference result is less paradoxical than it is usually told: users preferred a system that was slow to respond and more successful.

**The cost barrier.** Facets have "the drawback of requiring the category structure to be designed and assigned to items." Categories "require manual curation," and automated assignment was "about 75% correct on average" ([Hearst, ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html), citing Sebastiani 2002). The largest hand-built web directories closed: Yahoo Directory in 2014, DMOZ in 2017 [T, high]. Faceted search survived where someone already maintains structured data: by 2009 Hearst called it "the de facto standard way to support the integration of browsing and search on information-rich Web sites" (ch. 8), and library catalogs use it too [T, high].

**What LLMs unblock.**

- **Bulk assignment.** Since October 2026 OpenAlex assigns its 4,516 topics with a fine-tuned Qwen3-8B, trained on 2 million works whose topics Claude Opus 5.5 chose. It is at least 90% confident on about 64% of works and right 94.5% of the time on those. Its primary topic matched two blind AI judges 81.7% of the time (89.6% at field level); on arXiv papers its field matches the authors' own category 83% of the time, against 75% for the previous classifier. About 10% of works get no topic ([OpenAlex help](https://help.openalex.org/hc/en-us/articles/24736129405719-Topics), updated 2026-10-07). The page does not say what "right" is judged against, the arXiv figure is the only human reference, and Hearst's 75% measured a different task, so the comparison gives a direction, not a size.
- **Cheap facets for a personal catalog** [I]. Assigning five or six facets (field, level, era, method, prerequisites) to 10,000 books from catalog record plus summary, at about 1,000 tokens in and 150 out per book, is 10M input and 1.5M output tokens: about \$0.90 on Haiku 5.5 batch or \$17.50 on Sonnet 5.5 batch. R06's estimate for 1M paper abstracts is about \$88 on Haiku 5.5 batch. These are token costs; checking a sample by hand costs more, in attention.
- **Query-induced facets** [I, untested]. For any result set, an LLM can propose the 4–6 facets that split *this* set well (study design, mathematical level, stance, era) and classify the set on the fly. No cataloger would pre-assign "uses a Bayesian or frequentist framing," but a reader comparing textbooks wants exactly that. I found no evaluation of per-query facet induction.

**What remains.** Facet sprawl and systematic errors. Hearst's design warnings still apply: avoid "clutter, dead ends, and confusion" (ch. 8). Show each generated value's confidence, let the reader correct it, and keep corrections as labeled examples.

## Fisheye, overview+detail, zooming

These are the ways an interface lets a reader see a focus and its context together. Cockburn, Karlson and Bederson's survey ([*ACM Computing Surveys* 41(1), 2008](https://www.microsoft.com/en-us/research/wp-content/uploads/2008/01/cockburn-ComputingSurveys09.pdf); 784 citations in Semantic Scholar on 2026-10-15) sorts them by how they separate the two:

| Approach | How focus and context are separated | Examples | Main cost |
|---|---|---|---|
| **Overview+detail** | In space: two views side by side | Minimap, page thumbnails, outline pane | Screen space; effort to relate the two views |
| **Zooming** | In time: one view, changing scale | Pad++, map zoom, Prezi | Reorienting after every zoom |
| **Focus+context** | No seam: the focus is shown inside the context, often by distortion | Fisheye views, Perspective Wall, hyperbolic trees | Distortion; moving targets |
| **Cue-based** | Highlight or suppress items in place | Search-hit highlighting, scrollbar marks | Few, if the cues are accurate |

**Mechanism of the fisheye.** Furnas's "generalized fisheye view" ([CHI 1986](https://doi.org/10.1145/22627.22342)) computes a degree of interest for each item given the current focus, `DOI(x | y) = API(x) − D(x, y)`: a priori interest minus spatial or semantic distance from the focus (formula as given in the survey). Items below a threshold are dropped, so the display shows the local neighborhood in detail plus globally important landmarks. The formula decides *what* to show; most later work (Sarkar & Brown's geometric fisheyes, hyperbolic trees) concerned *how*, usually by distorting scale, a split Furnas himself drew in 2006 (per the survey).

**Evidence for reading.** Hornbæk and Frøkjær (CHI 2001; extended as "Reading patterns and usability in visualizations of electronic documents," *ACM TOCHI* 10(2), 2003) compared three readers for scientific articles: plain linear text; overview+detail, with thumbnails of each page beside the text; and a fisheye that kept headings and the first and last paragraph of each section at full size and shrank the rest until clicked.

- With 20 participants, "all but one participant preferred the overview detail interface," and they "did not like the fisheye view" ([Hearst, ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)).
- The survey's summary of the 2003 paper: "Comprehension highest with O+D, lowest with fisheye. Fisheye had fastest reading, O+D slowest." The fisheye "encouraged faster reading, but … this speed was at the cost of comprehension." The survey adds that both beat plain linear text on some measures.

That fisheye is structurally an extractive summary view: headings plus first and last paragraphs. An LLM "skim mode" is the same design with better extraction, and the Hornbæk–Frøkjær result predicts the same trade, faster reading and worse comprehension [I, medium].

**Evidence elsewhere.**

- Hornbæk, Bederson and Plaisant (2002), map navigation: adding an overview to a zoomable map *slowed* tasks when semantic zoom was on, because the semantic labels made the overview redundant. Participants still preferred the overview, saying it helped them orient. Spatial recall was better *without* it.
- Baudisch, Lee and Hanna (2004), web pages: participants generally preferred overview+detail; the fisheye "polarised opinions."
- Fisheye menus performed worse than ordinary hierarchical menus (Hornbæk & Hertzum 2007). Distortion causes target-acquisition problems because items move under the cursor.
- Code folding is the fisheye that survived: fisheye code views were "generally no worse and often better than flat code listings" (Cockburn & Smith 2003; Jakobsen & Hornbæk 2006). It *elides* rather than distorts.
- For long documents, Cockburn et al.'s (2006) space-filling thumbnails show every page at a stable location. The survey reports it let users "quickly form and exploit their spatial memory," "significantly outperforming other panning, zooming and overview+detail interfaces, particularly when tasks involved revisiting previously seen pages."

**The survey's conclusions** (section 8): overview+detail interfaces are widely preferred, and "for particular tasks, such as document comprehension, no alternative has been found to be more effective"; users "should be able to browse the overview without influencing the detail view, but changes in the detail view should be immediately reflected in the overview." Zooming "is easy to do badly," though animated transitions help. Distortion-oriented displays "are likely to impair the user's ability to make relative spatial judgments, and they can cause target acquisition problems." "None of these approaches is ideal," and results depend heavily on the task.

**What LLMs unblock.** The overview can now be *semantic*: section gists, "where the argument is," "where the results are," aspect strips (next section). Furnas's a priori interest `API(x)` can be estimated per section by a model, and per reader from their interests, which makes elision-style fisheyes (fold the low-interest sections, as code folding does) practical for books. Distortion stays off the table: its problem is perceptual, not a lack of metadata. Multi-level gists and semantic zoom inside a document are covered in [Reading Interfaces](/interfaces/reading-interfaces/).

## TileBars: where in the document

**Mechanism.** Hearst's [TileBars](https://people.ischool.berkeley.edu/~hearst/research/tilebars.html) (1995) splits a query into topics ("term sets"). Each result document becomes a rectangle proportional to its length, divided into segments (by TextTiling or fixed blocks). Each row is a term set, each column a segment, and darker tiles mean more hits. The pattern shows whether the query's topics co-occur *in the same passage* or only somewhere in the document. Clicking a tile jumps to that passage. A search for "calibration" and "historical case studies" can tell a book with one chapter on both from a book that mentions each in passing.

**Evidence.** Thin. Hearst's project page reports no formal user study of TileBars itself; a simplified variant shipped in the Pagis Pro97 product. Derivatives (Hearst, ch. 10):

- HotMap (Hoeber & Yang 2006; 21 students): no significant timing differences, but preferred to standard Google.
- Heimonen and Jhaveri (2005): "11 of the 18 participants did not notice the graphic."
- Reiterer et al. (2005; 40 participants, 12 tasks each): a field-sortable list ranked first, TileBars second, the web-style list third.

**Why it stalled.** It depended on literal term matches and on users splitting queries into term sets. Hearst noted that TileBars can mislead when users omit query words that describe a topic.

**What LLMs unblock** [I]. The aspect detector can be semantic ("does this chapter discuss calibration?") rather than lexical, and the segments can be chapters. Precompute strips for a fixed vocabulary of the reader's standing interests, and compute new aspects on demand. R06 estimates about \$86 on Haiku 5.5 batch to build aspect strips for 10,000 books (15 chunks of 10,000 tokens per book). The risk is a hallucinated aspect, so hovering a tile should show the supporting sentence. The back-of-book index is a hand-made version of the same display and should be shown first where it exists. Of the ideas in this chapter, this is the one most clearly blocked by annotation cost and least tried since [I].

## What the evidence adds up to

| Idea | Best evidence | Verdict | What blocked it | LLM-era status | Remaining risk |
|---|---|---|---|---|---|
| Ranked list | As good as or better than visualizations for retrieval in the comparisons found; a meta-analysis found no significant overall effect of visualization (Chen & Yu 2000) | Necessary, not sufficient | — | Unchanged | Teaches little about structure |
| Scatter/Gather | Better structure learning; worse retrieval than similarity search when used without search (Pirolli et al. 1996) | Interaction sound, labels poor | Label quality | Labels match experts 88% of the time on one benchmark | Inconsistent levels; drift |
| Faceted search | 90–91% preference; higher find-all success (n = 32) | **Worked** | Manual assignment; ~75% automated | Fine-tuned LLM classifiers; per-query facets | Systematic errors; sprawl |
| Overview+detail | 19 of 20 readers preferred it; best comprehension | **Worked** | Not blocked, but overviews were only thumbnails or headings | Semantic overviews (gists, aspect marks) | Faithfulness of gists |
| Fisheye (distortion) | Disliked for text; faster reading, worse comprehension; menu and target problems | Failed for reading | Not metadata: perception | Unchanged; elision version viable | — |
| TileBars | Little formal evaluation; mixed derivatives | Niche | Literal term matching | Semantic per-chapter aspects | Hallucinated aspects |
| Generated synthesis instead of foraging | 7 experiments, n = 10,462: shallower self-reported learning | New risk | — | Default in AI assistants | Learning loss; misleading scent |

Three patterns hold across the rows [I, medium-high]:

1. **Preference is weak evidence.** Users preferred the zoomable-map overview that slowed them down and (in [Maps of Knowledge](/interfaces/maps-of-knowledge/)) a 3D interface that gave no benefit. Flamenco fits this pattern less well than it is usually told, since its users were also more successful. In exploratory search preference may track something real, such as confidence or learning [~55%], but log what users do as well as what they say.
2. **What failed for perceptual reasons stays failed.** Distortion of text, 3D, and too many clusters. LLMs fix labels, not eyes.
3. **What failed for annotation cost is now cheap to retry.** Clusters, facets, aspect strips and semantic overviews. The binding constraint has moved from cost to accuracy. The Semantic Reader team put it this way: "even slight errors in these models can have detrimental effects on the readers" ([Lo et al. 2023](https://arxiv.org/abs/2303.14334)).

## Design principles for a literature explorer

Each principle states the evidence it rests on and my confidence that it holds for a book-and-paper explorer [I unless sourced].

1. **Search first, then structure the results.** Cluster and facet the *retrieved set*, not the whole collection. Keep a whole-catalog view for orientation only. Evidence: Hearst & Pedersen 1996; Knowledge Navigator. [~80%]
2. **Two linked panes: structure and list.** A structure pane (clusters, facets or a map) and a ranked list, each filtering the other. Neither alone serves both lookup and learning. Evidence: Pirolli et al. 1996; Chen & Yu 2000. [~85%]
3. **Facets before maps.** Faceted navigation has the strongest positive evidence and was the web's "de facto standard" for combining browsing with search by 2009 (Hearst, ch. 8). Maps have a few small positive studies, of maps that users steered or that sat beside a search engine, and none showing a passive overview beating a list (see [Maps of Knowledge](/interfaces/maps-of-knowledge/)). Generate facet values in batch, show confidence, accept corrections. [~80%]
4. **Few, consistent clusters with stated criteria.** About 10–20 per level, siblings labeled together at one granularity, an inclusion criterion per cluster, and a "doesn't fit" bucket. Evidence: Käki 2005; Hearst ch. 8; LLooM. [~80%]
5. **Honest scent.** Source text first, the generated gloss second, labeled. Every generated sentence links to its span, and unsupported ones are flagged. Make "worth reading?" a forecast scored against the reader's later ratings. Evidence: foraging theory; Liu et al. 2023. [~85%]
6. **Don't let synthesis replace foraging when the goal is learning.** Lead with the path (the clusters, sources and passages) and put the synthesis after it, not on top with links appended; appended links did not remove the effect in Melumad & Yun's replication. Evidence: Melumad & Yun 2025, on everyday topics and self-reported learning. [~60% that the effect transfers to technical literatures; whether a source-first layout fixes it is untested]
7. **Berrypicking moves as first-class buttons.** Footnote chase, cited-by, series or journal run, shelf scan, subject, author: one click each on any item, with results tagged by how they were found. An agent can run all six to depth 2 and propose a short reading path with a reason for each step. Evidence: Bates 1989; Stenstrom & McBride 1979. [~75%]
8. **A basket and a trail.** A persistent temporary store, a history of every step, and export of the basket with the queries that produced it. These are Shneiderman's *history* and *extract* tasks and Bates's "temporary store." A trail is also a shareable artifact. [~75%]
9. **Overview+detail, never distortion.** An always-visible outline or minimap beside an undistorted reading view. Browsing the overview should not move the detail view, and the overview should track the detail immediately. Elide low-interest sections (code-folding style) if you must; never shrink text. Evidence: Hornbæk & Frøkjær; Cockburn, Karlson & Bederson. [~85%]
10. **Aspect strips for long documents.** A TileBars-style strip per book in result lists, with rows for the reader's standing interests, chapter columns, LLM-judged relevance, and the supporting sentence on hover. [~60% that it beats a table of contents plus in-book search; untested]
11. **Support the sensemaking loop.** An evidence file of excerpts with provenance, a schema or outline, and hypotheses with credences linked to evidence. Have the model search specifically for disconfirming evidence. Evidence: Pirolli & Card 2005; Patterson et al. 2001. [~70%]
12. **Measure foraging and learning, not clicks.** Log relevant items per minute and time to first relevant item, and run a periodic "write what you know about field X" probe. Compare features within yourself over weeks. Treat preference as weak evidence. Evidence: Medlar et al. 2023 on the field's thin evaluation base. [~85%]

**If you are choosing what to build first:**

| If you want... | Do this | Main obstacle |
|---|---|---|
| To find a specific known work fast | A good ranked list with title, author and identifier search; nothing else | Catalog quality, not interface (see [Catalogs and Metadata](/finding/catalogs-and-metadata/)) |
| To learn an unfamiliar field in an afternoon | Query, then an LLM-labeled Scatter/Gather over the results beside a synced list; supplement with human-written overviews such as syllabi and review articles ([Curation](/finding/curation/)) | Label consistency; budget time to read and fix labels |
| To narrow a personal catalog of thousands of books | Batch-generated facets (field, level, era, method, prerequisites) with counts | Facet sprawl; spot-check a sample of 100 per facet |
| To decide which chapter of which book to read | Aspect strips per book, plus the back-of-book index and searching inside books ([Searching Inside Books You Don't Have](/finding/searching-inside-books/)) | Full text needed for chapter-level aspects; legality (see [The Legal Map](/building/legal-map/)) |
| To build a literature review you can defend | Berrypicking moves plus basket plus trail, feeding an evidence file with hypotheses | Discipline to log the path |
| To get an answer quickly and move on | An AI research assistant's synthesis is fine for lookup | Accuracy of the synthesis; you will probably learn less (Melumad & Yun) |

## Open questions

- Does an LLM-labeled Scatter/Gather over search results raise relevant books found per minute compared with a ranked list plus facets, for one reader over a month? A within-person A/B test with logged foraging rate would answer it for that reader.
- Does the Melumad–Yun shallow-learning effect hold when the LLM output is a *structured map of sources* (labeled clusters with links) rather than prose? Links appended to prose did not remove it. A cheap online experiment on a technical topic, with a knowledge test rather than self-report, would answer it and decide principle 6.
- How accurate is LLM facet assignment on books, especially humanities and older monographs, when judged against Library of Congress Subject Headings or a librarian on a sample of 500?
- Does a semantic aspect strip help readers pick the right chapter faster than a table of contents plus in-book search? No study of TileBars-style displays over books exists that I found.
- Does an LLM gist view reproduce the Hornbæk–Frøkjær fisheye result (faster reading, lower comprehension) on books?
- Has anyone evaluated query-induced facets, where an LLM proposes the facets for each result set?
- How often do LLM cluster labels for the same set change across runs and models, and does the change cost users anything measurable (re-finding, trust)?
- Is there a controlled study of an LLM-era research assistant that measures disconfirming-evidence search, Pirolli and Card's neglected leverage point?

## Related pages

- [Maps of Knowledge](/interfaces/maps-of-knowledge/): science maps, embedding maps, 2D distortion and why 3D failed
- [Reading Interfaces](/interfaces/reading-interfaces/): hover previews, semantic zoom and gists inside a document, active-reading workspaces
- [Generative Interfaces](/interfaces/generative-interfaces/): generated views, faithfulness evidence and provenance design
- [Browsing the Stacks](/finding/browsing-the-stacks/): area scanning by call number
- [AI Research Assistants](/finding/ai-research-assistants/): the tools that collapse berrypicking into one answer
- [Catalogs and Metadata](/finding/catalogs-and-metadata/) and [Searching Inside Books You Don't Have](/finding/searching-inside-books/)
- [Curation: Syllabi, Experts and Reviews](/finding/curation/)
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/)
- [A Reference Architecture](/building/reference-architecture/) and [Costs and Effort](/building/costs-and-effort/)
