---
title: AI Research Assistants
description: The October 2026 landscape of AI tools for finding, synthesizing, browsing and reading scholarly literature, organized by job and priced; what independent audits show about their recall and citation accuracy; why books are missing; a recommended stack; and a Claude Code + web search + Zotero MCP baseline for building your own.
---

*Status: draft, October 2026. Prices, corpus sizes and product statuses are as of October 15, 2026 unless another date is given. The load-bearing figures were re-checked against primary sources on that date: the Elicit recall study, the URL-hallucination and DeepTRACE audits, the Lancet and Zhao et al. counts, the Undermind benchmark, and the Elicit, Undermind, Scite, Consensus and Claude prices. Some figures rest only on secondary sources and are marked as such: OpenAI and Perplexity Deep Research limits and prices, Edison and Connected Papers paid tiers, and Gemini Notebook tier limits. Vendor-run benchmarks are labeled as vendor-run. Sources: the [R04 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md) and primary sources linked inline.*

## The short version

- **No product does the whole job.** The market has split into five jobs: deep search (find the papers), deep research (write a cited synthesis), citation-graph browsing, feeds, and reading environments. A good personal stack uses about three tools, chosen for the jobs you actually do.
- **AI search is precise, not exhaustive.** In an independent test against four completed evidence syntheses, Elicit's search recovered on average 39.5% of the studies those reviews included, against 94.5% for the original librarian-built searches. Its precision was 5.5 times higher ([Lau & Golder 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/)). Elicit's own 93–97% figures mostly measure screening, which is a different task.
- **Grounded tools mostly cite real sources, but often misattribute them.** Search-grounded systems invented 3–13% of cited URLs; a loop that resolves every link cut non-resolving links to under 1% ([Rao, Wong & Callison-Burch 2026](https://arxiv.org/abs/2604.03173)). The larger error is a real source that does not support the sentence: deep research modes left 12.5% (GPT-5) to 97.5% (Perplexity) of their statements unsupported by any listed source ([DeepTRACE](https://arxiv.org/abs/2509.04499)).
- **Fabricated references are now in the published record**, at about ten times the 2023 rate: 1 in 277 papers in early 2026 had at least one, against 1 in 2,828 in 2023 ([STAT on the Lancet study](https://www.statnews.com/2026/05/07/lancet-study-finds-steep-rise-fraudulent-citations-academic-papers/)).
- **Books are nearly invisible.** Every major tool is built on paper metadata. The exceptions are Google Scholar, which says it searches books, and Scite, which claims to index them. Gemini Notebook holds whole books, but only the ones you upload.
- **What to use.** The free core is Google Scholar Labs, Ai2 Asta, Zotero 10, Scholar Inbox and Inciteful. The best paid upgrade is Claude Pro + Undermind Pro + Scite Basic. On annual billing it costs about \$45/month at Undermind's academic price, or about \$89 at its industry price. Pay for Elicit only if you do structured extraction or systematic reviews.
- **To build your own**, start from Claude Code + web search + [zotero-mcp](https://github.com/54yyyu/zotero-mcp). Undermind, Asta, Scite and OpenAlex all offer MCP servers: call them as tools rather than imitating them, and make reference verification non-optional. On Undermind's own benchmark, Claude Opus 5 in Claude Code with web search found 47% of the top-20 relevant papers in 10 minutes, against 85% for Undermind.

## Five jobs, five failure modes

Compare tools within a job, not across jobs. Each job fails in its own way, so each needs its own test.

| Job | What "good" means | Leading tools (Oct 2026) | Main failure mode |
|---|---|---|---|
| **Deep search** (find papers) | High recall *and* precision on a complex natural-language need | Undermind, Google Scholar Labs, Ai2 Paper Finder (in Asta), Elicit, Consensus | Silent misses, with no estimate of what was missed |
| **Deep research** (synthesize) | Faithful, cited, balanced synthesis | OpenAI, Gemini, Claude and Perplexity research modes; Elicit Reports; Consensus Deep reviews; Asta "Summarize literature"; Edison Literature | Unsupported statements, one-sidedness, invented or irrelevant citations |
| **Citation-graph browsing** | Show the structure and neighbors of seed papers | Connected Papers, Litmaps, ResearchRabbit, Inciteful, Local Citation Network | Only as good as open citation metadata; papers only |
| **Feeds** | A daily ranked "what's new for me" | Scholar Inbox, Semantic Scholar Research Feeds, Hugging Face Papers, alphaXiv, Emergent Mind | Popularity bias (social feeds); preprint-only coverage |
| **Reading environments** | Faster, deeper reading of one document | Semantic Reader, Scholar PDF Reader with Quick Read, Zotero 10, Readwise Reader, Gemini Notebook | Narrow coverage; no reasoning across books |

A systematic-review workflow (screening and extraction with an audit trail) is a sixth, specialized job. Elicit is the main product for it. Most readers of this wiki will not need it.

## The landscape, October 2026

Prices are list prices for an individual, checked October 15, 2026 unless noted. "Annual" means the monthly rate when billed yearly.

| Tool | Job | Corpus and full-text coverage | Price (Oct 2026) | Status (Oct 2026) | Distinctive feature |
|---|---|---|---|---|---|
| [Undermind](https://www.undermind.ai/) | Deep search; reports; alerts | Not disclosed. The site says it reads "full texts and figures". The Jan 2024 [whitepaper](https://www.undermind.ai/whitepaper.pdf) described full text of 2.3M arXiv papers (stale) | Free (standard rate limits). Pro: academic \$16/mo annual or \$20 monthly; industry \$60/mo annual or \$75 monthly ([pricing](https://www.undermind.ai/pricing); industry figures from the page's pricing toggle) | Active | Agentic search that follows citation trails, about 2.9 min per search; an [MCP server](https://www.undermind.ai/mcp) for Claude, Claude Code and ChatGPT, on the free plan too |
| [Google Scholar Labs](https://scholar.googleblog.com/2026/06/scholar-labs-update-search-10x-faster.html) | Deep search (no synthesis) | Google Scholar's index, which covers "articles, theses, books, abstracts and court opinions" ([about](https://scholar.google.com/intl/en/scholar/about.html)) | Free, logged in | Open to all logged-in users per the June 3, 2026 post | Explains, per paper, how it helps answer your question |
| [Ai2 Asta](https://allenai.org/blog/asta) (Paper Finder, Summarize literature) | Deep search; synthesis | Semantic Scholar, 200M+ papers. ScholarQA's index was 8M+ full texts and 108M+ abstracts in Mar 2025 ([Ai2](https://allenai.org/blog/ai2-scholarqa)) | Free [~80%; no price shown] | Active; absorbed the OpenScholar demo | Fast mode by default, exhaustive mode on request; free Scientific Corpus MCP |
| [Elicit](https://elicit.com/pricing) | Deep search; extraction table; reports; systematic review | 138M papers from Semantic Scholar, PubMed and OpenAlex. Full text only for open access, or with your subscription via its browser extension; otherwise title and abstract ([help](https://support.elicit.com/en/articles/553025)) | Basic free; Pro \$49/user/mo annual (\$588/yr); Scale \$169 (\$2,028/yr) | Active, independent | Papers × questions table with quoted extractions; Pro screens up to 5,000 papers |
| [Consensus](https://consensus.app/) | Search; synthesis ("Deep reviews") | Claims "400M+" papers; sources not verifiable (help pages returned 403) | Free (3 Deep reviews/mo); Pro \$20/mo or \$144/yr; Deep \$65/mo or \$540/yr ([help center, Sept 12, 2026](https://intercom.help/consensus-d118a252369c/en/articles/10087865-subscription-plans)) | Active | Consensus Meter (distribution of yes/no/possibly findings); API and MCP calls bundled in every plan |
| [Scite](https://scite.ai/) | Citation stance; grounded assistant | Claims 1.6B+ citations and 300M+ "articles, preprints, books, patents, and datasets"; publisher agreements | Basic \$12/mo annual; Pro \$40/mo annual ([pricing](https://scite.ai/pricing)) | Active; part of Research Solutions | Supporting / contrasting / mentioning citation statements; MCP (250 or 2,500 credits/mo) |
| [Edison Literature](https://edisonscientific.com/news/edison-literature-agent) (PaperQA3) | Synthesis, strongest in biomedicine | "Over 150M research papers and patents", including figures and tables | About 20 free calls/day for academics; paid tiers unverified (a \$200/mo tier was reported; low confidence) | Active; the FutureHouse platform redirects here | Reads figures and tables; tells the model when a source is retracted or from a predatory journal |
| [Gemini Deep Research](https://ai.google.dev/gemini-api/docs/deep-research) | Synthesis | Open web; your own files (up to 3,000); remote MCP servers | Google AI plans. API: token rates plus Search grounding at \$14 per 1,000 after 5,000 free/mo ([pricing](https://ai.google.dev/gemini-api/docs/pricing)); about \$1–3 per task ([secondary](https://tokencost.app/blog/gemini-deep-research-agent-cost)) | Active; API in preview | Shows an editable research plan before it runs |
| OpenAI Deep Research | Synthesis | Open web; connectors | Paid ChatGPT plans; 2026 run limits not verified (secondary reports conflict) | Active | Long cited reports; audited best of the deep research agents (see [the evidence](#fabricated-and-misattributed-citations)) |
| [Perplexity Deep Research](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research) | Synthesis | Open web; an "Academic" focus mode [secondary] | Pro \$20/mo; Max \$200/mo [secondary] | Active | Fast: most tasks under 3 minutes (vendor) |
| [Claude Research](https://claude.com/blog/research) | Synthesis | Open web; Google Workspace | Included on every paid plan: Pro \$20/mo (\$17 annual), Max from \$100; not on Free ([pricing](https://claude.com/pricing)) | Active | Reads your Gmail, Calendar and Docs alongside the web |
| [Kagi Assistant](https://kagi.com/pricing) (Research mode) | Synthesis | Kagi web search; the "Academic" lens is only a `.edu` domain filter ([docs](https://help.kagi.com/kagi/features/lenses.html)) | Ultimate \$25/mo | Active | Kagi search plus a choice of flagship models; no scholarly index |
| [Gemini Notebook](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/) (formerly NotebookLM) | Reading and synthesis over your sources | Only what you upload; up to 500,000 words per source; 50 (free) to 300 (Pro, \$19.99) or 500–600 (Ultra) sources per notebook ([secondary](https://elephas.app/blog/notebooklm-free-vs-plus)) | Free; Google AI plans | Renamed July 16, 2026; code execution started on Ultra and some Workspace plans | The one mainstream tool that comfortably holds whole books |
| [paper-qa](https://github.com/Future-House/paper-qa) | Synthesis over local PDFs | Your PDFs, with metadata from Semantic Scholar, Crossref, Unpaywall and OpenAlex | Free, Apache-2.0 (plus model costs) | Active; about 9.4k stars | Open-source agentic RAG over full text |
| [STORM / Co-STORM](https://github.com/stanford-oval/storm) | Article generation | Web, or a custom corpus | Free, open source | No README news since Jan 2025; probably dormant [~70%] | Questions from several perspectives, then an outline-first draft |
| [Connected Papers](https://www.connectedpapers.com/) | Graph browsing | Semantic Scholar, historically [~60%] | Free: 5 graphs/mo; paid about \$6/mo academic [secondary, low confidence] | Active | Similarity graph from one seed or several |
| [Litmaps](https://www.litmaps.com/pricing) | Graph browsing; alerts | Not disclosed | Free (20 inputs, 100 articles); Pro \$10/mo annual (\$120/yr, academic email) or \$12.50 monthly | Active; acquired ResearchRabbit in May 2025 ([IT Brief](https://itbrief.news/story/litmaps-acquires-researchrabbit-raises-1-million-for-ai)) | Citation maps with customizable axes |
| [ResearchRabbit](https://www.researchrabbit.ai/pricing) | Graph browsing; alerts | "310+ million articles" | Free (50 seeds); RR+ \$10/mo annual or \$12.50 monthly | Active; site footer reads "© Litmap Limited" | Iteration checkpoints you can branch from |
| [Inciteful](https://inciteful.xyz/) | Graph browsing | OpenAlex, Semantic Scholar, Crossref [secondary] | Free | Active; the domain now redirects to incitefulmed.com/academic/ | "Literature Connector" finds the paths between two papers |
| [Local Citation Network](https://localcitationnetwork.github.io/) | Graph browsing | OpenAlex, Semantic Scholar, Crossref, or your Zotero library | Free, GPL-3 | Active; one maintainer working in spare time | Lists the "top cited" papers your seed set is missing; CSV/RIS/JSON export |
| [Scholar Inbox](https://www.scholar-inbox.com/) | Feed | arXiv, bioRxiv, chemRxiv, medRxiv and open conference proceedings | Free | Active | A per-user classifier trained on your own thumbs-up/down ratings |
| [Semantic Scholar](https://www.semanticscholar.org/product/api) (Research Feeds, TLDRs) | Feed; search | 214M papers, 2.49B citations; feeds cover the last 3 months; TLDRs only in CS and biomedicine | Free | Active | Feeds built from the papers in your library folders |
| [Hugging Face Papers](https://huggingface.co/papers) | Feed | arXiv, mainly ML | Free | Active; paperswithcode.com now redirects here | Community upvotes; links to code |
| [alphaXiv](https://www.alphaxiv.org/) | Feed; discussion; literature review | arXiv | Free | Active; \$7M seed, Nov 2025 [secondary] | A discussion layer on any arXiv paper; MCP server |
| [Emergent Mind](https://www.emergentmind.com/pricing) | Feed; summaries | arXiv | Free (5 articles/day); Pro \$12/mo (\$10 annual); Max \$30 (\$25 annual) | Active | Ranks papers by discussion on X, Reddit and GitHub |
| [arxiv-sanity-lite](https://github.com/karpathy/arxiv-sanity-lite) | Feed | arXiv | Free, MIT, self-host | Hosted site unreachable on Oct 15, 2026 | Per-tag SVM over TF-IDF of abstracts; self-hostable code |
| Papers with Code | (Was leaderboards) | – | – | Gone; redirects to Hugging Face Trending Papers since about July 2025; leaderboards not carried over [secondary] | – |
| [Semantic Reader](https://www.semanticscholar.org/product/semantic-reader) | Reading | arXiv only, 250k+ papers; skimming highlights mostly on English CS papers | Free | Active | Inline citation cards; Goal / Method / Result skimming highlights |
| [Scholar PDF Reader and Quick Read](https://scholar.googleblog.com/2026/08/quick-read-see-how-paper-answers-your.html) | Reading | Any PDF in Chrome. Quick Read only for papers you can access, including subscribed articles through publisher partners | Free | Active; Quick Read launched Aug 25, 2026 | A digest of a paper for *your* query: Answers, Approach, Considerations |
| [Zotero 10](https://www.zotero.org/blog/zotero-10/) | Library; reading | Your own files | Free (Zotero Storage subscription optional) | 10.0.6, Oct 7, 2026; no first-party LLM features | Local HTTP API with `/fulltext`; reflowable PDF Reading Mode; Read Aloud |
| [zotero-mcp](https://github.com/54yyyu/zotero-mcp) | Bridge from agent to library | Your Zotero library | Free; server MIT, in-Zotero agent plugin AGPL-3.0 | Active; about 5.4k stars | 38 tools in its default profile: semantic search, page-range reads, writing annotations |
| [Readwise Reader](https://readwise.io/pricing) | Reading; resurfacing | Articles, PDFs, EPUBs, RSS, YouTube transcripts [secondary] | \$9.99/mo annual or \$12.99 monthly; 50% academic discount | Active | Resurfaces your highlights on a spaced schedule; Ghostreader LLM sidekick |

Five changes in 2025–26 shaped this table:

- **Consolidation.** Ai2 merged Paper Finder and ScholarQA into Asta (Aug 26, 2025). FutureHouse's tools moved to [Edison Scientific](https://edisonscientific.com/), which raised a [\$70M seed in Dec 2025](https://siliconangle.com/2025/12/18/edison-scientific-raises-70m-build-autonomous-ai-scientists-research). Litmaps bought ResearchRabbit, and Papers with Code closed.
- **Google entered.** Scholar Labs launched for a limited group on [Nov 18, 2025](https://scholar.googleblog.com/2025/11/scholar-labs-ai-powered-scholar-search.html). The June 3, 2026 update made it "~10x faster", has it scan "up to 3x more papers", and allows 10 times more searches per day.
- **Incumbents are licensing full text.** Quick Read reaches subscribed articles through Google's "scholarly publishing partners", and Edison has announced work with Springer Nature (terms not verified). Expect a split: AI over full text for incumbents with licenses, AI over abstracts for everyone else [~75%].
- **Elicit moved up-market.** Its top self-serve tier went from \$79 to \$169/user/month between mid-May and mid-June 2026, alongside plan renames ([CostBench](https://costbench.com/software/ai-research-tools/elicit/price-history/), secondary).
- **Builder infrastructure became metered.** OpenAlex has priced API calls in dollars since February 2026 (see [Building your own](#building-your-own-the-claude-code-baseline)).

### Deep search

Deep search tools take a paragraph-long need ("Bayesian model averaging under misspecification, with applications to forecasting ensembles") and return a ranked, explained list. They do not write the review.

- **Undermind** asks clarifying questions, then runs an agentic search that reads candidate papers and follows citation trails. A search stops on its own after 2.9 minutes on average, and resubmitting continues from the existing results ([Undermind](https://www.undermind.ai/)). Its 2024 whitepaper describes the idea most useful to forecasters: fit the *discovery curve* (relevant papers found against papers examined, which decays roughly exponentially) to estimate how many relevant papers remain. The current site does not say whether users see such an estimate, and no other tool reviewed here claims one. [Estimating what you missed](#estimating-what-you-missed) shows how to get one by hand.
- **Google Scholar Labs** breaks a question into "key topics, aspects and relationships", searches Scholar for each, and explains each hit. Aaron Tay's [early review](https://aarontay.substack.com/p/scholar-labs-early-review-google) (Nov 20, 2025) found that at launch it stopped at milestones of 10, 20, 30 and 40 relevant papers with a hard cap of 50, appeared to evaluate at most the top ~300 results, and was sensitive to phrasing. Its index size still let it beat Undermind on at least one test. The June 2026 "3x more papers" update probably loosened those caps [~70%]. Whether Labs reads full text is unconfirmed.
- **Ai2 Paper Finder** (inside Asta) reformulates the query and searches three dense indices plus Semantic Scholar keyword search. An LLM judges each candidate against sub-criteria, and the agent follows forward and backward citations from the best hits. It is fast by default; ask it to "work harder" for exhaustive mode ([Ai2](https://allenai.org/blog/paper-finder)).
- **Elicit and Consensus** also search, but their strength is what they do after search (below). Elicit reads only the abstract of most paywalled papers. Consensus's full-text coverage could not be checked.

### Deep research synthesis

Two classes of product write cited syntheses.

**General agents** (OpenAI, Gemini, Claude, Perplexity, Kagi) search the open web. None appears to have privileged access to paywalled full text [~85%]: they see open-access PDFs, abstracts and what the web says about a paper. Gemini's is the most configurable: its API agent (`deep-research-preview-04-2026`, plus a "Max" variant) accepts up to 3,000 of your own files and calls remote MCP servers, so you can point it at a curated corpus. OpenAI's did best of the deep research agents in both independent audits below; Gemini's invented the most URLs and Perplexity's left the most statements unsupported. Those were 2025 versions, so treat the ranking as a prior [~60% it still holds].

**Specialized engines** restrict themselves to scholarly sources and expose more structure:

- **Elicit's** papers × questions table is the best existing interface for comparing many studies. Each row is a paper and each column an extracted attribute with its supporting quote. Reports draw on up to 135 sources on Pro and 200 on Scale.
- **Consensus's** Meter turns a yes/no-shaped empirical question ("do minimum-wage increases reduce teen employment?") into a distribution over study findings. It is less useful for conceptual or mathematical questions [~75%].
- **Asta's "Summarize literature"** is free [~80%]. A June 2026 study found that its cited references "changed notably across identical queries", and that the retrieved and cited sets often did not match ([Orduña-Malea & Lopezosa](https://arxiv.org/abs/2606.08301)).
- **Edison Literature (PaperQA3)** reads figures and tables across more than 150M papers and patents, and passes provenance flags (retracted, predatory journal) to the model. Edison claims a 15–45% accuracy gain over PaperQA2 but shows the numbers only in charts (vendor-run). Its sibling Kosmos reads about 1,500 papers per run; independent scientists judged 79.4% of its report statements accurate ([Mitchener et al. 2025](https://arxiv.org/abs/2511.02824)).

Treat any single synthesis as one draw from a distribution, not as *the* answer. The [evidence below](#synthesis-quality-and-reproducibility) is why.

### Citation-graph browsing

Graph tools start from seed papers you already trust and show neighbors by citation, co-citation, bibliographic coupling or embedding similarity. Once you have 5–20 good seeds, they are the best way to map a field's structure, and they are free or about \$10/month.

- **Inciteful** and **Local Citation Network** are free and run on open metadata. Inciteful's "Literature Connector" finds the papers linking two works from different fields, which helps when you suspect that an econometrics result and an ML result are the same theorem. Local Citation Network lists the papers most cited by your seed set that you have not yet collected: a fast way to find the canon you are missing.
- **Litmaps and ResearchRabbit** (one company since May 2025) add monitoring alerts and saved maps. ResearchRabbit's [October 2025 revamp](https://aarontay.substack.com/p/researchrabbits-2025-revamp-iterative) added iteration checkpoints you can branch from, which matches how exploratory search actually proceeds.
- **Connected Papers** gives 5 free graphs a month.

All of them are built on open citation metadata (OpenAlex, Semantic Scholar, Crossref), so books appear only as citation targets, never as nodes you can open. The rise in fabricated citations (below) also means these graphs will increasingly contain phantom edges [~80%]. For the interface side of graphs, see [Maps of Knowledge](/interfaces/maps-of-knowledge/).

### Feeds

Feeds split by ranking signal:

- **Social-signal feeds** (Hugging Face Papers, Emergent Mind, alphaXiv) rank by upvotes or discussion. They tell you what your field is talking about, and they amplify what is already popular.
- **Content-based feeds** (Scholar Inbox, Semantic Scholar Research Feeds, arxiv-sanity-lite) learn from your own ratings or library. Scholar Inbox is the best documented. It trains a per-user logistic regression on your explicit ratings over GTE-large embeddings of titles and abstracts, with 5,000 random negatives. Its users average 78 positive ratings, and the team released 800k ratings from 14.3k users ([Flicke et al., ACL 2025 demo](https://www.cvlibs.net/publications/Flicke2025ACLSDT.pdf)). That is a cheap, transparent design you can copy.

Use one of each. Scholar Inbox covers preprint servers and open proceedings, not journals; Semantic Scholar Feeds cover all of Semantic Scholar but only the last three months. Nothing in this category helps you find the best 1975 textbook chapter on a topic. For that, see [Curation](/finding/curation/).

### Reading environments

Make Zotero the hub. It shipped three major versions in 2026: 8 (Jan 22; `/fulltext` in the local API), 9 (Apr 10; Read Aloud) and 10 (Aug 17; reflowable PDF Reading Mode, and a Read Aloud that skips citations, tables and equations) ([changelog](https://www.zotero.org/support/changelog)). It has no LLM features of its own; the AI layer lives in community MCP servers. Around it, use Semantic Reader for arXiv papers (its citation cards and skimming highlights are the most thoughtful augmented-reading design), Scholar PDF Reader for other PDFs, Quick Read when you want one paper's answer to your question, and Readwise Reader only if you want highlights resurfaced on a schedule. For books you own, Gemini Notebook is the closest mainstream product to "chat with a shelf": a 500,000-word source holds nearly any single book. It has no discovery. See [Reading Interfaces](/interfaces/reading-interfaces/) for the design history behind these.

## The evidence

### Recall: vendor claims and independent tests

| Study | Tool and setup | Result | Who ran it |
|---|---|---|---|
| [Lau & Golder 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/), *Cochrane Evidence Synthesis and Methods* | Elicit Pro, Review mode (Feb–Mar 2025), against 4 completed evidence syntheses | **Search sensitivity 39.5% average (range 25.5–69.2%) vs 94.5% for the original searches; precision 41.8% vs 7.55%** | Independent |
| Bernard et al. 2025, *BMC Medical Research Methodology*, as cited in Lau & Golder | Elicit (Apr 2023 version), 1 review | 3 of 17 included studies found (17.6%) | Independent; tool version stale |
| [Acar & Floyd 2026](https://iacis.org/iis/2026/3_iis_2026_191-208.pdf), *Issues in Information Systems* | Elicit Pro, Review mode, accounting-education literature | Precision and sensitivity "consistently in the 1–15% range" vs 98–100% for the benchmark | Independent |
| [Elicit, Mar 2025](https://elicit.com/blog/how-we-evaluated-elicit-systematic-review) | Screening, 58 published systematic reviews, LLM-labeled | Screening recall 93.6%; specificity 62.8% | Vendor |
| [Elicit, May 2026](https://elicit.com/blog/evaluating-elicit-slr) | Internal | "Single semantic search retrieves 95% of studies"; abstract screening 97% sensitivity | Vendor |
| [Undermind 2026](https://www.undermind.ai/) | 23 complex queries; gold set judged by GPT-5.6 from abstracts; agents had web search and shell access; 10 minutes each | Top-20 recall: Undermind 85%, GPT-5.6 Sol in Codex 50%, Claude Opus 5 in Claude Code 47%, GPT-5.6 Luna 43% | Vendor |
| [LitSearch](https://arxiv.org/abs/2407.18940) (EMNLP 2024) | 597 ML/NLP queries | Commercial engines, Google Search included, "lag behind the best dense retriever by up to 32 recall points" | Independent; 2024 systems |
| [PaSa](https://arxiv.org/abs/2501.10120) (2025) | RL-trained search agent | Beats Google + GPT-4o by 37.78 points recall@20 | Its developers (ByteDance) |

Three things reconcile the vendor and independent numbers:

1. **Screening is not searching.** Vendor figures mostly measure *screening* a candidate set that already contains the right papers. Independent studies measure whether *search* finds a review's final included studies. Elicit's search also sees only 138M records, and only abstracts for most paywalled papers.
2. **Selection effects.** Vendors draw queries from their own users. Independent studies pick mature reviews with idiosyncratic inclusion criteria, which are hard by construction.
3. **Shared blind spots.** An LLM judge reading abstracts (Undermind 2026, Elicit 2025) can miss the same relevant papers as the system it is grading.

My estimate for the current *search* recall of the best tools on a typical exploratory query, measured against an exhaustive expert search, is wide: 30–85% [low–medium confidence]. Neither side has tested 2026 versions on diverse exploratory queries. For browsing a new field, high precision at moderate recall is a good trade: you read more good papers per hour. For a systematic review or a novelty claim ("nobody has done X"), AI search supplements librarian-built database searches; it does not replace them.

### Fabricated and misattributed citations

| Study | Systems | Result |
|---|---|---|
| [Walters & Wilder 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/), *Sci Rep* | ChatGPT (GPT-3.5 / GPT-4), no retrieval | 55% / 18% of references fabricated; 43% / 24% of the real ones had substantive errors (stale models) |
| [Chelli et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11153973/), *JMIR* | GPT-3.5 / GPT-4 / Bard generating systematic-review references | 39.6% / 28.6% / 91.4% hallucinated (stale models) |
| [OpenScholar](https://arxiv.org/abs/2411.14199) (*Nature*, Feb 2026) | GPT-4o without retrieval | Citations hallucinated "78 to 90% of the time" |
| [Rao, Wong & Callison-Burch 2026](https://arxiv.org/abs/2604.03173) | 10 systems on DRBench: 2 deep research agents, 8 search-augmented models | Never-existed URLs: Claude 3.5/3.7 Sonnet with search 3.0–3.2%; OpenAI deep research 3.5%; Gemini 2.5 Pro with search 4.8%; GPT-4o search 8.8%; **Gemini 2.5 Pro deep research 13.3%**. Pooled, deep research 10.7% vs search-augmented 4.8%, but the deep research pool is two agents and mostly Gemini's URLs. A URL-checking loop cut non-resolving links: GPT-5.1 16.0% → 0.6%, Gemini 2.5 Pro 6.1% → 0.1%, Claude Sonnet 4.5 4.9% → 0.8% |
| [DeepTRACE](https://arxiv.org/abs/2509.04499) (Sept 2025) | GPT-4.5/5, You.com, Perplexity, Copilot, Gemini; search and deep research modes | Citation accuracy 40–80% across systems. Unsupported statements in deep research modes: GPT-5 12.5%, Gemini 53.6%, YouChat 74.6%, Copilot (Think Deeper) 90.2%, Perplexity 97.5% (Table 1). Most deep research answers to debate questions were one-sided (GPT-5 54.7%, Copilot 94.8%) |
| [PaperQA2](https://arxiv.org/abs/2409.13740) (2024) | Agentic RAG over full text, writing Wikipedia-style articles (WikiCrow) | 13.5% of cited statements unsupported vs 24.9% for Wikipedia |

Three conclusions follow:

1. **Retrieval fixes existence much more than support** [high confidence]. A grounded system's reference usually exists. Whether it says what the sentence claims is a separate and larger failure: in DeepTRACE, four of the five deep research modes left more than half their statements unsupported.
2. **Existence errors are cheap to eliminate** [high confidence]. Resolving every DOI or URL before output gets them under 1%. Any tool you use or build should do this. Support errors need a second step: fetch the cited passage and check that it entails the claim.
3. **Product differences are large and age fast** [medium confidence]. The spread between products (12.5% to 97.5% unsupported) dwarfs any average, and both audits tested 2025 versions. Whether deep research modes invent more URLs than plain search chat is unsettled: Rao et al.'s pooled gap rests on two agents, and OpenAI's deep research (3.5%) beat most of the search-augmented models.

### Fabricated references entering the literature

Two large studies in May 2026 measured fabricated references in published and preprint literature:

- [Zhao et al. 2026](https://arxiv.org/abs/2605.07723) audited 111M references in 2.5M papers across arXiv, bioRxiv, SSRN and PubMed Central. They report "a conservative estimate of 146,932 hallucinated citations in 2025 alone". Non-existent references rose sharply after widespread LLM adoption and were most common in fields with fast AI uptake and among small and early-career author teams.
- A study in *The Lancet* (Topaz et al.) of 2M+ papers and 97M citations found about 4,000 fabricated citations across about 2,800 papers. The share of papers with at least one went from 1 in 2,828 (2023) to 1 in 458 (2025) to 1 in 277 (first seven weeks of 2026) ([STAT](https://www.statnews.com/2026/05/07/lancet-study-finds-steep-rise-fraudulent-citations-academic-papers/)).

Two consequences for readers. First, a reference in a published paper is no longer strong evidence that the cited work exists or says what is claimed, especially in 2025–26 preprints. Second, citation-graph tools and citation counts now ingest these phantom edges. Verify every reference you carry forward, not only AI output.

### Synthesis quality and reproducibility

- **"Superhuman" claims rest on precision.** PaperQA2 beat PhD-level experts on LitQA2 precision (85.2% vs 73.8%, p = 0.0036). Accuracy was statistically indistinguishable (66.0% vs 67.7%, p = 0.66), and the human baseline varied widely ([Skarlinski et al. 2024](https://arxiv.org/abs/2409.13740)).
- **Experts sometimes prefer the machine.** In the OpenScholar study, experts preferred answers over expert-written ones 51% of the time for OpenScholar-8B, 70% for OpenScholar+GPT-4o, and 32% for GPT-4o alone ([UW News](https://www.washington.edu/news/2026/02/04/in-a-study-ai-model-openscholar-synthesizes-scientific-research-and-cites-sources-as-accurately-as-human-experts/)). The baselines are GPT-4o-era.
- **The field's own benchmark says the problem is unsolved.** On [AstaBench](https://arxiv.org/abs/2510.21652) (ICLR 2026; 2,400+ problems, 57 agents), the best agent at launch scored 53.0%. That agent, Asta v0, is "an experimental agent not used in the production version" ([Ai2](https://allenai.org/blog/asta)).
- **Automated grading is weak.** In Ai2's [SciArena](https://allenai.org/blog/sciarena), the best automated judge predicted researchers' pairwise preferences on literature answers only 65.1% of the time. Leaderboards graded by LLMs are directional at best.
- **Runs are not reproducible.** Asta's cited sets vary across identical queries. Treat runs as samples: run several, report the spread, and trust what is stable across them.

## The books gap

The discovery stack is built on paper metadata: Semantic Scholar, OpenAlex, Crossref, PubMed and arXiv. Elicit searches "academic papers". Semantic Reader is arXiv-only. Scholar Inbox ingests preprint servers and proceedings. Paper Finder, Undermind and Consensus speak only of papers. The exceptions are thin:

- **Google Scholar** says it searches books ([about page](https://scholar.google.com/intl/en/scholar/about.html)), so Scholar Labs can surface a monograph. How well Labs ranks books against papers is untested, and it does not read them for you.
- **Scite** claims its 300M+ sources include books. Its "317M+ full-text" figure probably means citation statements extracted under publisher agreements, not text you can read [~65%].
- **Your own files.** Gemini Notebook, Claude Projects and Zotero hold books you supply. None of them helps you find a book you don't know about.

Two other trends make the gap structural, not transitional:

- **Full text is the exception even for papers.** Ai2's ScholarQA index had 8M full texts against 108M abstracts (Mar 2025). OpenScholar used 45M open-access papers. Answers that live in methods sections, figures or book chapters are systematically under-retrieved, which is why LitQA2 was built around facts absent from abstracts.
- **Public book-scale infrastructure is shrinking.** HathiTrust Research Center Analytics, the main sanctioned route for computational analysis of in-copyright books, [shut down on Sept 30, 2026](https://analytics.hathitrust.org/). The legal climate is set by *Bartz v. Anthropic*: training on lawfully acquired books was held to be fair use on June 23, 2025, and the [\$1.5B settlement](https://en.wikipedia.org/wiki/Bartz_v._Anthropic) over pirated copies received final approval on July 20, 2026 ([settlement site](https://www.anthropiccopyrightsettlement.com/)). See [The Legal Map](/building/legal-map/).

A book-world equivalent of the paper stack would need different units and inputs:

| Layer | Paper world (exists) | Book world (needed) | Open inputs available |
|---|---|---|---|
| Retrieval unit | Paper, abstract | Chapter, table of contents, back-of-book index | Open Library and Internet Archive search-inside; tables of contents; see [Searching Inside Books](/finding/searching-inside-books/) |
| Full text | S2ORC, OpenAlex's 50M+ open-access PDFs | Public-domain and open-licensed books | [Institutional Books 1.0](https://huggingface.co/datasets/institutional/institutional-books-1.0) (983,004 public-domain Harvard volumes, ~242B tokens, noncommercial early-access terms); the [Open Textbook Library](https://open.umn.edu/opentextbooks) (1,887 textbooks); Project Gutenberg |
| Deep search | Undermind, Paper Finder, Scholar Labs | "Which chapters of which books best answer X?", with an estimate of what was missed | The same agent pattern, run over chapters |
| Reader | Semantic Reader, Quick Read | A Quick Read for a chapter; "how does book B treat this?" | Zotero 10 as host, with your own EPUBs |
| Stance | Scite's supporting and contrasting citations | Reviews, errata, and papers that dispute a book's claim | OpenAlex citations to books [inference] |

Until something like this exists, use AI tools for papers and other methods for books: catalogs and subject browsing ([Catalogs and Metadata](/finding/catalogs-and-metadata/), [Browsing the Stacks](/finding/browsing-the-stacks/)), syllabi and expert lists ([Curation](/finding/curation/)), and search-inside for books you don't have.

## A recommended stack

This stack is for a researcher who explores across fields (say, someone in ML reading into decision theory or causal inference) and sometimes needs to be right about a specific claim.

| Job | Free default | Upgrade worth paying for if... | Cost (Oct 2026) |
|---|---|---|---|
| Deep search | Google Scholar Labs, plus Asta Paper Finder in exhaustive mode; Undermind's free tier | Undermind Pro, if you run more than a few hard searches a week (Pro has "10x higher usage limits") | \$16/mo annual (academic); \$60 (industry) |
| Synthesis | Whichever research mode you already pay for (Claude, Gemini, ChatGPT), treated as a map, not a source | Consensus Pro, if your questions are empirical yes/no questions and you want MCP calls; Elicit Pro only for regular structured extraction or screening | \$12/mo annual; \$49/mo annual |
| Stance (is this claim contested?) | No good free option; Scite's 7-day trial, or read the citing papers by hand | Scite Basic, if you write claims others will check | \$12/mo annual |
| Graph browsing | Inciteful; Local Citation Network | Litmaps Pro or RR+, for monitoring alerts and bigger seed sets | \$10/mo annual |
| Feeds | Scholar Inbox (its users average 78 positive ratings, so expect to rate dozens of papers before it is good); Hugging Face Papers if you work in ML | – | Free |
| Library and reading | Zotero 10, Scholar PDF Reader, Semantic Reader for arXiv | Readwise Reader, if you want spaced resurfacing of highlights | \$9.99/mo annual |
| Books | Gemini Notebook over books you own; Zotero full text | Google AI Pro, for 300 sources per notebook [secondary] | \$19.99/mo |

The core paid bundle is Claude Pro (\$17 annual) + Undermind Pro + Scite Basic (\$12). At Undermind's academic price (\$16) it costs about \$45/month, less than one Elicit Pro seat (\$49), and covers synthesis, deep search and stance, with Undermind and Scite both callable from Claude through MCP. At Undermind's industry price (\$60) it costs about \$89; outside academia, start on Undermind's free tier and upgrade only if you hit its limits. Add Elicit only if extraction tables are a weekly task.

### Decision rules

| If you want to... | Do this | Main obstacle |
|---|---|---|
| Get oriented in a new field | Find 20–40 seed papers with Scholar Labs and Asta. Expand them in Inciteful or Local Citation Network. Read one deep research report as a map, then read the papers in Zotero | Textbooks and canonical older works won't surface; use [Curation](/finding/curation/) |
| Answer a specific empirical question | Build an Elicit or Consensus evidence table, then check Scite for contrasting citations on the key studies | Paywalled papers are read from abstracts; say so in your notes |
| Claim "nobody has done X" | Run two deep searches on different indexes (Scholar Labs, plus Undermind or Paper Finder), estimate what remains (below), then do a keyword database search | Recall of roughly 30–85% means absence of evidence is weak evidence |
| Keep up with arXiv | Scholar Inbox as your main feed; Hugging Face Papers or alphaXiv for what is trending | Social feeds amplify popularity; content feeds need ratings |
| Pick a general deep research agent | Prefer the one that audited best (OpenAI's, in 2025 tests); whichever you use, spot-check five citations per report against the cited passage | The audited versions date from 2025; your own spot check is the current evidence |
| Rely on a synthesis | Run it twice (or in two products), compare the cited sets, resolve every reference, and read the passage behind each key claim | Support errors, not invented references, are the main risk |
| Answer from methods, figures or tables | Use full-text tools: Edison Literature for biomedicine, paper-qa or Gemini Notebook over PDFs you hold, Quick Read where you have access | Abstract-only tools systematically miss these answers |
| Read paywalled full text through AI | Elicit's browser extension with your subscription, or Quick Read with institutional access; see [University and Employer Access](/access/academic-and-employer/) | Requires a subscription, usually institutional |

### Estimating what you missed

Undermind's discovery curve has a cheaper cousin you can run by hand: capture-recapture. Run two independent searches, judge relevance, and count the overlap. The Lincoln–Petersen estimate of the total relevant set is N ≈ n₁·n₂ / m. For example, suppose Scholar Labs finds 30 relevant papers, Undermind finds 24, and 18 appear in both. Then N ≈ 30 × 24 / 18 = 40. Your union has 36, so expect about 4 more out there.

The independence assumption is the catch. Two engines built on the same index (Semantic Scholar underlies Asta and is one of Elicit's sources) tend to miss the same papers. That positive dependence inflates the overlap and makes N an *underestimate*. Pair engines with different indexes, such as Google Scholar against a Semantic Scholar-based tool, and treat the result as a lower bound [~80% that the bias runs this way in practice].

## Building your own: the Claude Code baseline

For readers who build tools, the reference point is **Claude Code + web search + Zotero MCP**. Undermind's benchmark already uses part of it as a baseline: Claude Opus 5 in Claude Code with web search and shell access, but no specialized tools. At 10 minutes it reached 47% top-20 recall, 33% recall of all relevant papers and 35% precision, against Undermind's 85%, 75% and 58%. The gap is real but approximate (vendor-run, 23 queries, an LLM judge reading abstracts). The lesson is to **call the specialized engines as tools, not imitate them**. Whether a well-tooled agent closes the gap has not been measured; the recall audit below is how you find out for your own questions.

### Components

| Layer | Component | Cost (Oct 2026) | Notes |
|---|---|---|---|
| Agent | Claude Code | Included in every paid Claude plan: Pro \$20/mo (\$17 annual), Max from \$100 ([pricing](https://claude.com/pricing)). Or the API, at Anthropic's Oct 6, 2026 rates: Sonnet 5.5 \$2 / \$10 and Opus 5.5 \$4 / \$20 per million input / output tokens | Batch API at 50% off for bulk enrichment |
| Personal library | Zotero 10 local API (`/fulltext`, annotations) + [zotero-mcp](https://github.com/54yyyu/zotero-mcp) | Free | Semantic search over your library with local or hosted embeddings; reads PDF page ranges, or page images when math garbles; writes highlights; adds items. Its in-Zotero agent plugin answers with `zotero://` links that open the PDF at the cited page |
| Deep search | [Undermind MCP](https://www.undermind.ai/mcp) | On the free plan; Pro \$16 (academic) or \$60 (industry) per month, annual | The engine that beat raw Claude Code on the vendor's benchmark, called as a tool |
| Scholarly index | Asta's Scientific Corpus Tool (an MCP extension of the Semantic Scholar API, 200M+ papers); [S2 API](https://www.semanticscholar.org/product/api) key | Free; the introductory key gets 1 request/s | Snippet search lets you check what a paper actually says |
| Open metadata and open-access PDFs | [OpenAlex](https://help.openalex.org/access/pricing/) API or OurResearch's MCP server | Free key: \$1/day. List \$0.10, search \$1, PDF download \$10 per 1,000 calls. Keyless: \$0.10/day | About 1,000 searches or 100 PDFs a day on the free key. The MCP server reranks every search, which doubles its cost to about 500 searches a day ([OpenAlex](https://help.openalex.org/how-to/ai-assistants/)) |
| Web-scale recall | Built-in web search; [Exa](https://exa.ai/pricing) with `category: "publication"` | Exa: \$7 per 1,000 searches; \$10 free credit monthly | Reaches papers outside the scholarly indexes, such as working papers on personal sites [inference] |
| Stance | Scite MCP | 250 credits/mo on Basic (\$12/mo annual) | Supporting and contrasting counts; retraction alerts also via zotero-mcp |
| Evidence answers | Consensus MCP | 30 / 500 / 2,000 calls per month on Free / Pro / Deep | – |
| Full-text QA | [paper-qa](https://github.com/Future-House/paper-qa) over your PDFs | Free plus model tokens; about \$1–3 per query in the 2024 paper | Good for questions answered in methods and figures |

**Running cost** [my assumptions]. Suppose one deep session processes about 500k input tokens and writes about 20k output tokens, with no prompt caching. At API rates that costs about \$1.20 on Sonnet 5.5 and \$2.40 on Opus 5.5. Fifty sessions a month comes to \$60–120, plus a few dollars of OpenAlex or Exa calls: about one to two Elicit Pro seats. Prompt caching, which agent loops use heavily, would cut the input share. On a Claude subscription, sessions within the plan's usage limits cost nothing extra.

### What to add so it beats the products

The baseline's advantage is not search quality. It is that you can add the checks the products skip:

1. **Verification on every reference.** Resolve each DOI or URL before output; that is the `urlhealth` pattern that took non-resolving links under 1% in [Rao et al.](https://arxiv.org/abs/2604.03173). Then fetch the cited passage (an S2 snippet, an OpenAlex PDF, or Zotero `/fulltext`) and check that it supports the claim. Show the result as a badge.
2. **Two indexes and an overlap count.** Search at least two engines with different underlying indexes and log what each found. The capture-recapture estimate above then comes free.
3. **Evidence-basis labels.** Tag each claim as resting on full text (with page), a figure, an abstract only, or metadata only. Readers should know when a sentence rests on the abstract of a paywalled paper.
4. **Run ensembles.** For a synthesis you will rely on, run it k times, or through Asta, Consensus and Claude Research, and report agreed claims, outliers and citation overlap.
5. **A personal recall audit.** Pick 10 of your real questions, and list for each the 20–30 papers or chapters you know should be found. Re-run your tool and the commercial ones every few months, and chart recall. This turns vendor claims into your own measurements, on your own domain.

A minimal set of standing instructions for the agent's `CLAUDE.md`:

```markdown
## Literature rules
- Output no reference you have not resolved (DOI, arXiv ID or URL) in this session.
- For each claim attributed to a source, quote the supporting passage and label it:
  full text (with page), figure/table, abstract only, or metadata only.
- Search at least two indexes with different coverage (e.g. Semantic Scholar via Asta,
  and OpenAlex or web search). Report counts found by each and the overlap.
- Check key sources in Scite for contrasting citations and retractions.
- Save every relevant item to a Zotero collection named for the question, with the
  query that found it in a note. Cite library items with zotero:// page links.
```

The ideas most worth copying come from the small tools, not the big synthesizers: Undermind's discovery-curve estimate (from its 2024 whitepaper), Scholar Inbox's per-user classifier, Semantic Reader's citation cards and skimming highlights, Scite's citation stance, ResearchRabbit's branching checkpoints, and Quick Read's query-conditioned digest. [The Design Space](/building/design-space/) and [A Reference Architecture](/building/reference-architecture/) develop them; [Costs and Effort](/building/costs-and-effort/) has fuller budgets.

## Open questions

- What is the search recall of Scholar Labs (post-June 2026), Undermind, Asta Paper Finder and a well-tooled Claude Code agent on non-biomedical exploratory queries (forecasting, decision theory, statistics), judged by humans reading full text rather than an LLM reading abstracts?
- Does two-engine capture-recapture give calibrated estimates of missed papers? How large is the underestimate when both engines draw on Semantic Scholar or OpenAlex?
- Does Undermind's current product show users an estimate of remaining relevant papers, as its 2024 whitepaper proposed?
- Does Scholar Labs read full text, or only titles, abstracts and snippets? Did the June 2026 update remove the 50-paper cap Tay observed?
- Would a 2026 Elicit re-run of Lau & Golder's four case studies still show about 40% search sensitivity?
- What are statement-level support rates for the late-2026 versions of the major deep research products, and do deep research agents invent more URLs than search-augmented models once more than two agents are compared? A DeepTRACE re-run plus a wider Rao et al. sample would answer both.
- Will Google's and Edison's publisher full-text deals reach individuals without an institutional subscription, and on what terms?
- What does Consensus's "400M+" corpus count, given that Semantic Scholar has 214M papers? Does Scite's "317M+ full-text articles" mean readable text?
- Do OpenAlex, Semantic Scholar and the graph tools built on them detect and drop fabricated references? What fraction of 2025 citation edges are phantom?
- Will any product make the book chapter a first-class retrieval unit, and from which corpus: Institutional Books, HathiTrust public-domain volumes, or publisher licenses?

## Related pages

- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the open data these tools are built on
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): the snippet layer that partly fills the books gap
- [Browsing the Stacks](/finding/browsing-the-stacks/) and [Curation: Syllabi, Experts and Reviews](/finding/curation/): what to use for books and canon
- [Open Papers and Preprints](/access/open-papers/) and [University and Employer Access](/access/academic-and-employer/): getting the full text AI tools can't reach
- [Maps of Knowledge](/interfaces/maps-of-knowledge/) and [Reading Interfaces](/interfaces/reading-interfaces/): design history behind graph tools and augmented readers
- [Generative Interfaces](/interfaces/generative-interfaces/): synthesis as an interface
- [The Legal Map](/building/legal-map/): *Bartz v. Anthropic* and what a personal tool may ingest
- [A Reference Architecture](/building/reference-architecture/) and [Costs and Effort](/building/costs-and-effort/): building on the baseline above
- [Directory of Sources and Tools](/reference/directory/)
