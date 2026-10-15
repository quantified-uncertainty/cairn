# AI research assistants and paper/literature discovery tools (2024–2026): research dossier

**Track:** R04 · **Compiled:** 2026-10-15 · **For:** Open Stacks (QURI / CAIRN)

**Scope.** This dossier covers tools that help a researcher *find*, *triage*, *synthesize* and *read* scholarly literature:

- AI search and synthesis engines: Elicit, Consensus, Scite, Undermind, Google Scholar Labs, Ai2 Asta/ScholarQA/Paper Finder/OpenScholar, FutureHouse → Edison Scientific (PaperQA2/3, Kosmos).
- General "Deep Research" agents: OpenAI, Gemini, Claude, Perplexity.
- Notebook-style tools: NotebookLM, renamed Gemini Notebook.
- Generators: Stanford STORM/Co-STORM.
- Feeds and trend trackers: Hugging Face Papers, Papers with Code, alphaXiv, Emergent Mind, arxiv-sanity, Scholar Inbox, Semantic Scholar Research Feeds.
- Citation-graph explorers: Connected Papers, Litmaps, ResearchRabbit, Inciteful, Local Citation Network.
- Reading and library tools: Semantic Reader, Scholar PDF Reader, Zotero and its AI plugins, Readwise Reader.
- General search APIs used for academic work: Kagi, Exa, Perplexity.

It also covers the published evidence on accuracy, citation hallucination and recall, and the "books gap".

**Method.**

- Searches covered: vendor pricing pages, help centers and changelogs; arXiv and journal articles (evaluations, benchmarks); vendor blogs; trade press; GitHub READMEs.
- Live checks were made where possible: HTTP redirects (Papers with Code, FutureHouse platform, OpenScholar demo, Inciteful), raw API responses (OpenAlex rate-limit headers), JavaScript bundles (Connected Papers plan limits) and RSS/Atom feeds (Google Scholar blog post bodies).
- **Caveat:** partway through, the shared web-search budget for this session ran out. Later verification relied on fetching known primary URLs directly. Some items could not be checked on a primary page and are marked as such: OpenAI Deep Research limits, Perplexity limits, Connected Papers prices, Edison pricing and the Consensus corpus sources.

**Evidence labels used throughout.**

| Label | Meaning |
|---|---|
| **[V]** | Verified on a primary source (vendor page, paper, official blog, court/settlement site, or live HTTP check) on the date given |
| **[S]** | Reported by a secondary source (aggregator, trade press, blog review) |
| **[I]** | My inference |

Confidence is written as high, med or low, or as a percentage. Sources older than about two years are flagged **(possibly stale)**.

**Key sources.**

- Elicit, Consensus, Undermind, Scite, Litmaps, ResearchRabbit, Emergent Mind, Readwise, Kagi, Exa, Claude and OpenAlex pricing and docs pages.
- Lau & Golder 2025 (*Cochrane Evidence Synthesis and Methods*) and Acar & Floyd 2026 (*Issues in Information Systems*), both on Elicit recall.
- OpenScholar (*Nature*, Feb 2026), PaperQA2 (arXiv 2409.13740), PaperQA3 (Edison, Feb 2026), AstaBench (ICLR 2026).
- DeepTRACE (arXiv 2509.04499) and Rao, Wong & Callison-Burch 2026 (arXiv 2604.03173) on reference hallucination.
- Zhao et al. 2026 (arXiv 2605.07723) and the Lancet citation-fabrication study reported by STAT.
- Google Scholar blog Atom feed (Scholar Labs, Quick Read), Aaron Tay's reviews, and the Zotero blog and changelog.

---

## Executive summary

1. **The market has split into five jobs, and no single tool does all of them well.**
   - *Deep search* finds the right papers: Undermind, Google Scholar Labs, Ai2 Paper Finder, Elicit search.
   - *Deep research* writes a cited synthesis: OpenAI, Gemini, Claude and Perplexity Deep Research; Elicit Reports; Consensus Deep Search; Asta "Summarize literature"; Edison Literature.
   - *Graph browsing*: Connected Papers, Litmaps/ResearchRabbit, Inciteful, Local Citation Network.
   - *Feeds*: Scholar Inbox, Semantic Scholar Research Feeds, Hugging Face Papers, alphaXiv, Emergent Mind.
   - *Reading environments*: Semantic Reader, Scholar PDF Reader, Zotero 10, Readwise Reader, Gemini Notebook.

   A good personal stack combines about three of these. [I, high]

2. **Prices (Oct 2026) are low for individuals, except for systematic-review tooling.**
   - Elicit Pro is $49/user/month billed annually ($588) and Scale is $169 ($2,028) [V].
   - Consensus Pro is $20/month or $144/year; Consensus Deep is $65/month or $540/year [V].
   - Undermind Pro is $16/month billed annually [V].
   - Scite is $12 or $40/month billed yearly [V].
   - Litmaps Pro is $10/month billed annually ($120/year; academic email required) or $12.50 billed monthly [V] [corrected in verification]. ResearchRabbit RR+ is $10/month annual or $12.50 monthly [V].
   - Free and good: Semantic Scholar, Asta, Scholar Labs, Scholar Inbox, Hugging Face Papers, Inciteful, Local Citation Network, Zotero.

3. **Independent studies find search recall far below vendor claims.**
   - Elicit's own evaluations report 93.6–97% screening sensitivity and "95% search recall" [V, vendor].
   - The independent Cochrane-journal study of four real reviews found Elicit's *search* sensitivity averaged **39.5%** (range 25.5–69.2%), against **94.5%** for the original searches. Its precision was much better: **41.8% vs 7.55%** [V].
   - An accounting-education study found 1–15% convergence with an expert benchmark [V].
   - Read this as: AI search is a high-precision first pass, not a replacement for exhaustive search. [high]

4. **Plain LLMs fabricate references; retrieval-grounded agents mostly don't. But "real citation" ≠ "supporting citation."**
   - Plain models: GPT-4o hallucinated 78–90% of citations in the OpenScholar study [V]. GPT-3.5/GPT-4 fabricated 55%/18% of references in 2023 [V, possibly stale].
   - Search-grounded systems fabricate 3–13% of URLs [V]. Deep research agents do *worse* than plain search-augmented LLMs: 10.7% vs 4.8% pooled [V].
   - A simple post-hoc URL checker in an agent loop cut non-resolving links to under 1% [V].
   - Statement-level support remains poor: DeepTRACE measured 40–80% citation accuracy and very high unsupported-statement rates for some deep research engines [V].

5. **Fabricated citations are now measurable in the published literature.**
   - About 146,932 hallucinated citations in 2025 across arXiv, bioRxiv, SSRN and PubMed Central (2.5M papers, 111M references; Paul Ginsparg, arXiv's founder, is a co-author) [V].
   - A Lancet study found 1 in 277 papers in early 2026 had at least one fabricated reference, up from 1 in 2,828 in 2023 [S, STAT].
   - Any tool we build should verify every reference it emits. [high]

6. **Google has entered properly.**
   - Scholar Labs launched Nov 18, 2025 for a limited group. The June 3, 2026 update made it "~10x faster", scans "up to 3x more papers" and allows 10x more daily searches; the post states Labs "is available for all logged in users" but does not say when the waitlist ended, and the updated version shipped in English first [V] [corrected in verification].
   - Scholar Quick Read (Aug 25, 2026) gives an Answers / Approach / Considerations digest of a paper for your query. It works only for papers you have access to, through publisher partnerships for subscribed articles [V].
   - Google's advantage is index size: Aaron Tay found it beat Undermind on at least one query for that reason [S]. Scholar Labs finds papers; it does not synthesize. [V]

7. **FutureHouse's literature agents now live at Edison Scientific.**
   - platform.futurehouse.org 301-redirects to platform.edisonscientific.com [V].
   - PaperQA3 (Feb 18, 2026) reads figures and tables across "over 150M research papers and patents". Academics get about 20 free calls a day [V].
   - Edison raised a $70M seed round in Dec 2025 [V]. Kosmos, its "AI Scientist", reads about 1,500 papers per run, and 79.4% of its report statements were judged accurate [V].

8. **Ai2 consolidated its tools into Asta (Aug 26, 2025).**
   - The OpenScholar demo now redirects to asta.allen.ai [V]. OpenScholar itself was published in *Nature* on Feb 4, 2026, with a 45M open-access-paper datastore [V].
   - AstaBench (ICLR 2026): about 2,400 problems and 57 agents; the best agent (Asta v0) scored 53.0%. Ai2's own conclusion is that AI remains "far from solving" research assistance [V].

9. **Papers with Code is gone.** paperswithcode.com now 302-redirects to Hugging Face Trending Papers [V]. The sunset happened in late July 2025 [S]. The SOTA leaderboards were not carried over in comparable form [S].

10. **NotebookLM is now "Gemini Notebook" (renamed Jul 16, 2026).**
    - Each notebook now gets a cloud computer that can run code; at launch this was limited to Google AI Ultra and eligible Workspace business customers, with Pro users on the web to follow "over the coming weeks" [V] [corrected in verification].
    - Each source can hold up to 500,000 words, and a notebook can hold 50 (free) to 300 (Pro, $19.99) or 600 (top Ultra) sources [S].
    - It is the only mainstream tool that comfortably holds *whole books*, but only books you upload.

11. **The books gap is real and structural.**
    - Elicit (138M papers from Semantic Scholar, PubMed and OpenAlex), Consensus, Undermind, Asta, Scholar Inbox and the citation-graph tools are all paper-centric [V for Elicit; I for the rest, high].
    - Book-scale public infrastructure is getting *thinner*: HathiTrust Research Center Analytics shut down on Sept 30, 2026 [V].
    - The legal climate for books and AI is now defined by Bartz v. Anthropic. Training on lawfully acquired books was held to be fair use (June 23, 2025). The $1.5B settlement over pirated copies received final approval on July 20, 2026 [V].

12. **Builder infrastructure is open but increasingly metered.**
    - The Semantic Scholar API covers 214M papers and 2.49B citations, with a 1 RPS introductory key [V].
    - **OpenAlex now prices API usage in dollars.** Keyless calls share a $0.10/day budget per IP address (observed in live response headers). A free key gets $1/day. A list call costs $0.10 per 1,000, search $1 per 1,000, and a PDF download $10 per 1,000. Annual plans start at $5,000/year, and a PDF-sync add-on covers 50M+ open-access PDFs [V].
    - Scite, Consensus, alphaXiv, Asta and Zotero (via zotero-mcp) all expose MCP or API access [V].

13. **Zotero is the best substrate for a Claude-Code-built personal research tool.**
    - It shipped three major versions in 2026: 8 (Jan 22), 9 (Apr 10; Read Aloud) and 10 (Aug 17; reflowable PDF Reading Mode) [V].
    - It has a local HTTP API with `/fulltext` endpoints [V].
    - The community zotero-mcp server (about 5.4k stars) exposes 38 tools, including semantic search, page-range reads and annotation writing [V].

14. **Benchmarks are mostly vendor-run and LLM-judged on abstracts.**
    - Undermind's 2026 benchmark covers 23 queries, uses a GPT-5.6 judge reading abstracts, and compares against GPT-5.6 in Codex and Claude Opus 5 in Claude Code. It claims 85% recall of the top-20 papers vs 43–50% for those agents [V, vendor].
    - Even the best automated judge in Ai2's SciArena predicted expert preferences only 65.1% of the time [V].
    - Treat leaderboard claims as directional.

15. **The most transferable interaction ideas come from small tools**, not the big synthesizers:
    - Undermind's *discovery-curve convergence estimate* (fit an exponential to "relevant papers found vs papers examined" to estimate how many remain).
    - Scholar Inbox's *per-user logistic regression on thumbs-up/down* over paper embeddings.
    - Semantic Reader's *citation cards and Goal/Method/Result skimming highlights*.
    - Scite's *supporting/contrasting citation statements*.
    - ResearchRabbit's *iteration checkpoints and branching*.
    - Scholar Quick Read's *query-conditioned paper digest*.

---

## Detailed findings

### 1. Taxonomy: what job each tool does

| Job | What "good" means | Leading tools (Oct 2026) | Main failure mode |
|---|---|---|---|
| Deep search (find papers) | High recall *and* precision on a complex natural-language need | Undermind, Google Scholar Labs, Ai2 Paper Finder (in Asta), Elicit search, Consensus search | Silent misses (low recall), no estimate of what was missed |
| Deep research (synthesize) | Faithful, cited, balanced synthesis | OpenAI/Gemini/Claude/Perplexity Deep Research; Elicit Reports; Consensus Deep Search; Asta Summarize; Edison Literature | Unsupported statements, one-sidedness, invented or irrelevant citations |
| Systematic-review workflow | Screening and extraction with audit trail | Elicit Systematic Review (Pro+), Consensus Deep, scite | Search recall far below Cochrane standards |
| Graph browsing | See structure and neighbors of seed papers | Connected Papers, Litmaps, ResearchRabbit, Inciteful, Local Citation Network | Depends on citation-metadata coverage; papers only |
| Feeds and alerts | Daily ranked "what's new for me" | Scholar Inbox, S2 Research Feeds, HF Papers, alphaXiv, Emergent Mind, Litmaps/RR alerts, Undermind alerts | Popularity bias (social-signal feeds), arXiv-only coverage |
| Reading environment | Faster, deeper reading of one document | Semantic Reader, Scholar PDF Reader, Zotero 10, Readwise Reader, Gemini Notebook | Limited coverage (Semantic Reader is arXiv-only), no cross-book reasoning |

### 2. AI search and synthesis engines

#### 2.1 Elicit

- **What it does.** Semantic search, a paper table with LLM-extracted columns, "Research Reports", a "Research Agent", and a dedicated Systematic Review workflow (screening plus extraction) [V elicit.com/pricing].
- **Corpus.** "Elicit searches across over 138 million academic papers from Semantic Scholar, PubMed, and OpenAlex." It can also search ClinicalTrials.gov [V support.elicit.com, accessed 2026-10-15].
- **Full text.**
  - It uses full text only when the paper is open access, or when you have a subscription *and* use the Elicit browser extension.
  - Otherwise, "Elicit uses the paper's title and abstract" [V].
  - So most paywalled content is analyzed from abstracts only. [high]
- **Pricing (accessed 2026-10-15)** [V]:

| Plan | Price | Notable limits |
|---|---|---|
| Basic | Free | Unlimited search over 138M papers; "limited usage" of Research Agent and Reports; unlimited chat with full-text papers |
| Pro | $49/user/month, billed annually ($588/yr) | Systematic Review workflow screening up to 5,000 papers; reports extract from up to 135 sources |
| Scale | $169/user/month, billed annually ($2,028/yr) | 5× Pro usage; reports from up to 200 sources; 30 columns at a time |
| Enterprise | Custom | Screen 40,000 papers, extract 40 columns |

- **Pricing churn.**
  - CostBench (an aggregator, tracking Elicit only since May 17, 2026) logged one repricing: the top tier went from $79 to $169/user/month between its May 17 and June 16, 2026 snapshots, alongside renames ("Pro" → "Scale", "Team" → "Enterprise") [S, costbench.com price history] [corrected in verification].
  - CostBench shows 4 tiers in every snapshot (May 17 – Oct 11, 2026), so it records no plan removal and no $780 price [corrected in verification].
- **Status.** Independent company, actively developing. [V]
- **Distinctive interaction.** The "papers × questions" spreadsheet: each row a paper, each column an LLM-extracted attribute with a quote. This is still the best UI pattern for comparing many studies. [I, high]
- **Evidence.** See §6. Vendor numbers are very high; independent search-recall numbers are low.

#### 2.2 Consensus

- **What it does.**
  - Search over peer-reviewed literature, with "Pro" (single-pass synthesized answer) and "Deep Search"/"Deep review" modes.
  - The "Consensus Meter" shows the distribution of yes/no/possibly findings across studies.
  - "Study Snapshots" and "Ask Paper" chat. [V consensus.app; meter: my knowledge, med]
- **Corpus.** The homepage claims "Search 400M+ scientific papers" [V, claim, 2026-10-15]. Earlier secondary sources cited about 200M–220M [S]. The underlying sources were not verified: the help-center data pages returned 403. Consensus historically built on Semantic Scholar/OpenAlex-type metadata [I, med].
- **Pricing.** From a help-center article dated **2026-09-12** [V]:

| Plan | Monthly | Annual | Limits per month |
|---|---|---|---|
| Free | $0 | – | 10 Pro messages; 3 Deep reviews; 10 Study Snapshots; 30 API & MCP calls |
| Pro | $20 | $144 ($12/mo) | Unlimited Pro; 15 Deep reviews; 500 API & MCP calls |
| Deep | $65 | $540 ($45/mo) | Unlimited Pro; 200 Deep reviews; 2,000 API & MCP calls |
| Teams | Custom | Custom | 50 Deep reviews per user; up to 200 seats |
| Enterprise | Custom | Custom | >200 users |

- **Distinctive.** MCP and API calls are bundled into every plan, which is unusual and useful for agent builders. The Meter turns a question into an evidence-distribution visual. [V/I]

#### 2.3 Undermind

- **What it does.**
  - Asks clarifying questions, then runs an agentic search that "reads and evaluates hundreds of papers, follows citation trails until it's found everything".
  - Then offers reports, tables, chat with inline citations, and alerts [V undermind.ai].
  - A production search stops on its own after **2.9 minutes on average**. Resubmitting continues from existing results [V].
- **Corpus.** Not disclosed on the current page; the FAQ answers render client-side and could not be read. The **Jan 5, 2024 whitepaper** said Undermind then searched "the full texts of 2.3 million papers" on **arXiv only**, using GPT-4 as classifier [V whitepaper; **possibly stale**]. The Pro plan advertises "Deepest analysis of full texts" [V].
- **Pricing** [V undermind.ai/pricing, 2026-10-15]: Free ($0, "standard rate limits"); Pro **$16/month billed annually** ("10x higher usage limits"); Team $15/person/month annual; Enterprise custom. Secondary sources give $20 month-to-month [S].
- **Vendor benchmark (2026)** [V, vendor-run].
  - Setup: 23 complex queries; a gold standard built by GPT-5.6 Sol (xhigh) judging relevance *from abstracts*; agents given 10 minutes.

| System (at 10 min) | Recall, top-20 | Recall, all relevant | Precision |
|---|---|---|---|
| Undermind deep search | 85% | 75% | 58% |
| GPT-5.6 Sol (medium, Codex CLI) | 50% | 38% | 40% |
| Claude Opus 5 (medium, Claude Code) | 47% | 33% | 35% |
| GPT-5.6 Luna (high) | 43% | 30% | 40% |

- **Distinctive interaction: the convergence estimate.**
  - The 2024 whitepaper describes tracking the *discovery curve*: relevant papers found vs papers examined. It "decays exponentially". Fitting it lets the system estimate total relevant works, say when the search is complete, and support claims like "nothing exists on this topic" [V].
  - For a forecasting-minded reader, this is the single most important idea in this dossier: it turns "did I miss anything?" into an estimate with error bars. [I, high]

#### 2.4 Scite (Research Solutions)

- **What it does.**
  - "Smart Citations" show whether later papers supported, contrasted or merely mentioned a claim, with the citing sentence.
  - An AI Assistant is grounded so that "every claim … links back to the specific sentence in the specific paper".
  - MCP integration runs "inside Claude, ChatGPT, and any MCP-compatible assistant" [V scite.ai].
- **Coverage claims** [V, 2026-10-15]: "1.6B+" citations; "317M+ full-text scholarly articles"; "Search across 300M+ articles, preprints, books, patents, and datasets"; agreements with "Wiley, SAGE, and 42+ more publishers" (elsewhere "44+"). Some counts conflict on the same page.
- **Pricing** [V scite.ai/pricing]: Basic **$12/month billed yearly** (250 MCP credits/month, collections up to 1,000 papers, 7-day trial); Pro **$40/month billed yearly** (API access, 2,500 MCP credits/month, collections up to 10,000); Enterprise custom (adds regulatory datasets such as FAERS and MAUDE).
- **Status.** "Now part of Research Solutions" [V]. The acquisition date is not verified here; my recollection is late 2023 [I, med].
- **Distinctive.** Citation *stance* rather than citation *count*. This is the best existing signal for "is this claim contested?". It is one of the few tools that also claims to index books. [V claim]

#### 2.5 Google Scholar: Scholar Labs, Quick Read, PDF Reader

All items below are verified from the Google Scholar blog Atom feed, which carries the post bodies [V].

| Date | Launch | Key facts |
|---|---|---|
| 2024-03-18 | Scholar PDF Reader (Chrome extension) | In-text citations become links with previews; auto table of contents; figure links |
| 2024-11-03 | AI outlines in PDF Reader | "Extended table of contents" with bullets per section; selected English papers |
| 2025-11-10 | Highlights and comments in PDF Reader | Saved to the Scholar Library |
| 2025-11-18 | **Scholar Labs** | Breaks the question into "key topics, aspects and relationships", searches Scholar for each, evaluates results, explains per paper "how the paper helps answer your question", supports follow-ups. Logged-in, English, limited users, waitlist |
| 2026-06-03 | **Scholar Labs update** | "Finds results ~10x faster"; "Scans up to 3x more papers"; "10x more searches every day"; "available for all logged in users and supports questions in all languages" (update English-first) |
| 2026-08-25 | **Quick Read** | A "Quick read" link on results gives an overview plus *Answers*, *Approach*, *Considerations* for your query. "Quick Read links appear only for papers that you have access to. We have worked with many of our scholarly publishing partners to enable them for your subscribed articles." Logged-in; English articles |

- **Independent review.** Aaron Tay (Nov 20, 2025) [S, librarian with domain expertise]:
  - Scholar Labs is "Deep Search", not "Deep Research": it ranks and explains papers but does not synthesize across them.
  - At launch it stopped at milestones of 10/20/30/40 relevant papers, with a hard cap of 50, and appeared to evaluate at most the top ~300 results.
  - It was strict about query types, and results were sensitive to phrasing.
  - It is not suited to systematic reviews.
  - Its index size let it beat Undermind on at least one test.
  - The June 2026 "3x more papers" update probably loosened these caps [I].
- **Pricing.** Free [V/I].
- **Status.** Active and expanding.
- **Why it matters.** Google Scholar has the largest scholarly index, including books via Google Books [I, high; well known but not re-verified here]. Quick Read shows Google negotiating *full-text access* with publishers for AI features. That is a moat smaller tools cannot match. [I, med-high]

#### 2.6 Semantic Scholar and Ai2 (Asta, ScholarQA, Paper Finder, OpenScholar)

**Semantic Scholar** [V]:

- **Scale.** "214 Million" papers, "2.49 Billion" citations, "79 Million" authors (API page, 2026-10-15). The About page says "over 200 million".
- **TLDRs.** AI one-sentence summaries; "currently limited to the computer science and biomedical domains" (FAQ).
- **Research Feeds.**
  - A contrastively trained paper embedding finds "papers similar to those in each Library folder".
  - Recommendations are limited to papers "published in the last 3 months", refreshed daily.
  - Negative ratings refine results.
- **Semantic Reader.**
  - Citation cards inline, with TLDRs.
  - "Skimming highlights" labeled Goal/Method/Result.
  - Definitions on demand; Hypothesis annotations.
  - **Coverage: arXiv only, "more than 250k" papers**; skimming highlights only on most English CS arXiv papers.
- **Full text.** "We provide open access options where available"; institutional access via GetFTR/LibKey.
- **API.** Free; unauthenticated calls share "1000 requests per second" across all users; an introductory key gets "1 RPS on all endpoints". Datasets: S2AG, S2ORC, SUPP.AI.

**Ai2 ScholarQA** (blog, Jan 21, 2025; updated Mar 5, 2025) [V]:

- Retrieval over "snippets extracted from full-text papers" in a Vespa index of "8M+ full text papers and 108M+ abstracts", updated weekly.
- Generation in three steps: quote extraction, outline, then section-by-section writing. Backbone was Claude 3.5 Sonnet, later Claude 3.7 Sonnet. **Possibly stale on model details.**

**Ai2 Paper Finder** (blog, Mar 26, 2025) [V]:

- **Method.**
  - An LLM reformulates the query.
  - It searches three dense indices plus Semantic Scholar keyword search.
  - An LLM judges each candidate against decomposed sub-criteria.
  - It follows forward and backward citations from the most relevant papers.
  - A multi-armed bandit chooses which sources to sample.
- **Modes.** "Fast" by default; exhaustive on request ("work harder").
- **LitSearch results.** Full mode found perfectly relevant papers for 89% of queries and highly relevant papers for 98%; fast mode 85%/97%.

**Asta** (launched Aug 26, 2025) [V allenai.org/blog/asta]:

- **Components.** The Asta agentic assistant (Paper Finder plus "Summarize literature", with data analysis in beta), AstaBench, and Asta resources.
- **Scientific Corpus Tool.** "An MCP extension of our Semantic Scholar API" giving agents "free access" to "a 200M+ normalized index of papers".
- **Launch headline.** Asta v0 scored 53.0% on AstaBench, about 10 points above ReAct-gpt-5.
- **AstaBench (arXiv 2510.21652, ICLR 2026)** [V]: more than 2,400 problems, 57 agents across 22 classes. AI is "far from solving the challenge of science research assistance."
- **Citation behavior study** (Orduña-Malea & Lopezosa, arXiv 2606.08301, June 2026) [V]:
  - Asta's "Summarize literature" showed high citation intensity.
  - **Cited references changed notably across identical queries.**
  - Retrieved and cited sets often did not match, which the authors attribute to undisclosed selection steps.
  - Reproducibility is a problem for any LLM synthesizer. [I]
- **Pricing.** Free [I, med: no price shown; the tool is described as giving free access].

**OpenScholar** [V]:

- Preprint Nov 21, 2024 (arXiv 2411.14199); **published in *Nature*, Feb 4, 2026** (UW news).
- Datastore of **45 million open-access papers**.
- ScholarQABench: 3,000 queries plus 250 expert-written long answers across CS, physics, biomedicine and neuroscience.
- GPT-4o "hallucinates citations 78 to 90% of the time"; OpenScholar's citation accuracy is "on par with human experts".
- Experts preferred OpenScholar-8B answers over expert-written ones 51% of the time, OpenScholar+GPT-4o 70%, and GPT-4o alone 32%.
- The open-source demo **openscilm.allen.ai now 301-redirects to asta.allen.ai** (live check 2026-10-15).

**SciArena** (Ai2, July 1, 2025, with later update) [V]:

- A Chatbot-Arena-style platform where researchers vote on model answers to literature questions.
- The final leaderboard had o3 first, ahead of Claude Opus 4.1 and Gemini 3 Pro Preview.
- In SciArena-Eval, the best automated judge (o3) predicted human preferences only **65.1%** of the time.
- The interactive demo was to retire **July 15, 2026**.

#### 2.7 FutureHouse → Edison Scientific (PaperQA2, PaperQA3, Kosmos)

- **PaperQA2** (arXiv 2409.13740, Sept 2024; **possibly stale**) [V]:
  - On LitQA2 (questions whose answers are in paper bodies, not abstracts), PaperQA2 scored **precision 85.2% ± 1.1%** and **accuracy 66.0% ± 1.2%**.
  - Human PhD-level experts scored precision 73.8% ± 9.6% and accuracy 67.7% ± 11.9%.
  - The "superhuman" claim rests on **precision** (p = 0.0036). **Accuracy was not significantly different** (p = 0.66).
  - WikiCrow summaries had 13.5% cited-but-unsupported statements vs 24.9% for Wikipedia, and precision 86.1% vs 71.2%.
  - Cost: about $1–3 per query and $4.48 ± $1.02 per WikiCrow article.
  - It found 2.34 ± 1.99 contradictions per biology paper, 70% validated by experts.
- **Open source.** `Future-House/paper-qa` has about 9.4k stars and an Apache-2.0 license. It does RAG over local PDFs and pulls metadata from Semantic Scholar, Crossref, Unpaywall and OpenAlex. It moved to calendar versioning in Dec 2025 [V GitHub, 2026-10-15].
- **FutureHouse Platform** (May 1, 2025) [V]: agents Crow (general), Falcon (deep review), Owl (formerly "HasAnyone", for prior-art checks) and Phoenix (chemistry). They had "access to full text papers" from "a vast corpus of high-quality open-access papers".
- **Edison Scientific (2025 spinout)** [V]:
  - Raised **$70M** (seed), announced Dec 18, 2025 (SiliconANGLE). A $250M valuation was reported secondarily [S].
  - platform.futurehouse.org now 301-redirects to platform.edisonscientific.com [V]. The platform showed a "service outage" notice on 2026-10-15 [V, transient].
  - **PaperQA3 / Edison Literature (Feb 18, 2026)**:
    - Multimodal: reads figures and tables from "over 150M research papers and patents".
    - Parses with NVIDIA Nemotron Parse at "hundreds of thousands of pages per day".
    - Gives the LLM provenance metadata, such as whether a journal is predatory or a paper retracted.
    - Claims a "universal boost of 15% to 45% accuracy" over PaperQA2, and that "Edison Literature High" surpasses GPT-5.2 Pro. Exact numbers are only in charts [V, vendor].
    - Free with a platform subscription; "academics get about 20 free calls per day" [V].
    - A related post is titled "Bringing Trusted Research Into Kosmos with Springer Nature" (publisher partnership; terms not verified) [V title only].
  - **Kosmos** (arXiv 2511.02824, Nov 2025) [V]: reads 1,500 papers and runs 42,000 lines of code per run, for up to 12 hours. Independent scientists judged **79.4%** of statements accurate. One 20-cycle run equaled about 6 months of collaborator research time.
  - **Pricing.** A search snippet of the Edison pricing page described a free tier (10 credits/month), a **$200/month** tier with 650 credits and Kosmos access, top-ups at $1/credit, and .edu bonuses [S; the page returned 404 when fetched on 2026-10-15; low–med confidence].

### 3. General "Deep Research" agents

| Product | Launch | What's distinctive for literature work | Access and price (2026) | Status |
|---|---|---|---|---|
| **Gemini Deep Research** | Dec 11, 2024 (Gemini Advanced) [V] | Proposes an editable research plan before running. **API agent** `deep-research-preview-04-2026` and **Max** `deep-research-max-preview-04-2026` (preview) [V]. Accepts up to 3,000 files of up to 3,000 pages each, PDF/text inputs, `file_search` over your own stores, remote MCP servers [V] | Consumer: Google AI plans. API: standard token rates plus Search grounding at $14 per 1,000 after 5,000 free/month (Gemini 3+) [V]. Secondary estimate $1–3 per task standard and $3–7 Max, with about 80 and 160 searches per task [S tokencost, Apr 24, 2026] | Active; API in preview |
| **OpenAI Deep Research** | Feb 2025 [I; openai.com returned 403] | Long, cited reports from web plus connectors | Secondary 2026: Plus ~10 runs/month; Pro tiers ~50 ($100) to ~250 ($200) [S; low] | Active |
| **Perplexity Deep Research** | Feb 14, 2025 [V] | Launch claims: 21.1% on Humanity's Last Exam and 93.9% on SimpleQA; most tasks under 3 minutes [V, vendor]. "Academic" focus mode biases toward scholarly sources [S] | Pro $20/month or $200/year; Max $200/month; Education Pro $10 [S] | Active |
| **Claude Research** | Apr 15, 2025 (beta; Max/Team/Enterprise in US/JP/BR) [V] | Agentic multi-search with citations; Google Workspace (Gmail/Calendar/Docs) integration [V] | Research is included on every paid plan: Pro $20/month ($17 annual), Max from $100, Team $25/$125 per seat monthly; not on Free [V claude.com/pricing] | Active |
| **Kagi Assistant (Research mode)** | – | Kagi search plus flagship models. The default "Academic" lens just restricts to **.edu domains** [V] | Research mode only on Ultimate, $25/month [V] | Active |

**Key point.** None of these agents has privileged access to paywalled full text. They see the open web, open-access PDFs and abstracts. Where audited (§6), deep research configurations hallucinate *more* URLs than plain search-augmented models and carry many unsupported statements. [V for audits; I for access]

### 4. Notebook-style and generative tools

- **NotebookLM → Gemini Notebook** [V Google blog, Jul 16, 2026]:
  - "We're renaming NotebookLM to Gemini Notebook". Same product, now with a "secure cloud computer" per notebook for code execution, initially for Google AI Ultra and eligible Workspace business customers, with Pro on the web to follow [corrected in verification].
  - It also appears in the Gemini app, and soon in AI Mode in Search.
  - History: May 2023 "Project Tailwind" → NotebookLM 2024 → Audio Overviews Sept 2024 [S Wikipedia, which carries an LLM-content warning].
  - **Limits** [S elephas.app, updated Sept 28, 2026]:

    | Tier | Notebooks | Sources per notebook |
    |---|---|---|
    | Free | 100 | 50 |
    | Google AI Plus ($4.99) | 200 | 100 |
    | Google AI Pro ($19.99) | 500 | 300 |
    | Google AI Ultra ($99.99 20TB / $199.99 30TB) | 500 | 500 (20TB plan) / 600 (30TB plan) [corrected in verification] |

    Every tier caps each source at **500,000 words or 200MB**. Usage budgets now refresh on a rolling basis.
  - **Implication.** A 500k-word cap holds essentially any single book (most textbooks are 150k–400k words [I]). A Pro notebook could hold about 300 books' worth of *user-supplied* text. This is the closest mainstream product to "chat with a shelf of books". It is limited to what you can legally upload, and there is no discovery. [I, high]
- **Stanford STORM / Co-STORM** [V GitHub, 2026-10-15]:
  - 31.6k stars. Wikipedia-style article generation via multi-perspective question asking. Co-STORM (EMNLP 2024) adds human-in-the-loop discourse and a dynamic mind map.
  - The last README news item is **January 2025** (litellm integration, knowledge-storm v1.1.0), so development appears dormant [I, med].
  - The demo (storm.genie.stanford.edu) returned HTTP 200 on the root domain via curl on 2026-10-15 but 503 via the www host [V]. "More than 70,000 people" tried it [V].
  - Its value is now mainly as an open-source pattern: perspective-guided question generation plus outline-first writing, groundable on custom corpora via VectorRM [V].

### 5. Feeds and trend trackers

| Tool | What it ranks by | Coverage | Price | Status (2026-10-15) |
|---|---|---|---|---|
| **Hugging Face Papers** (Daily / Trending) | Community submissions and upvotes ("by AK and the research community"). Trending shows GitHub stars and code links [V] | arXiv, mainly ML | Free | Active; daily email digest [V] |
| **Papers with Code** | (was) SOTA leaderboards, tasks, datasets | – | – | **paperswithcode.com 302-redirects to huggingface.co/papers/trending** [V]. Sunset ~July 24–25, 2025 [S hyper.ai]. Leaderboards were not replicated [S] |
| **alphaXiv** | Discussion layer on arXiv papers (swap "arxiv" for "alphaxiv" in a URL), trending/feeds, "Grounded literature review", MCP server, "Autoresearch", browser extension [V/S] | arXiv | Free (no pricing shown) [V] | $7M seed, Nov 2025 (Menlo, Haystack) [S Axios]. Blog: "ArxivQA: Training Retrieval Agents for arXiv Search" (Mar 10, 2026); autoresearch agents reproducing papers (Sept 9, 2026) [V] |
| **Emergent Mind** | Trending arXiv papers using social discussion (X, Reddit, GitHub) [V testimonial]; AI summaries, explainer videos, "deep research mode", API [V] | arXiv (AI, math and more) | Basic free (5 articles/day, 50 API requests/month); Pro $12/month ($10 annual), 25/day; Max $30 ($25 annual), unlimited [V] | Active |
| **arxiv-sanity-lite** | Per-tag SVM over TF-IDF of abstracts [V README] | arXiv | Free, MIT, self-hostable | **Hosted site unreachable** on 2026-10-15 (connection reset / 503) [V]. Repo has 1.7k stars |
| **Scholar Inbox** (Tübingen, Geiger lab) | Per-user **logistic regression on explicit ratings** over GTE-large embeddings of title + abstract; 5k random negatives; a "map of science" for cold start; active learning [V ACL paper] | arXiv, bioRxiv, chemRxiv, medRxiv plus open proceedings (NeurIPS, ICLR, ICML, CVPR, ACL…) [V] | Free; team "plan to keep Scholar Inbox free of charge" [V, Dec 2023, possibly stale] | Active (site 200). Released a dataset of **800k ratings from 14.3k users**; user study with more than 1.1k participants [V] |
| **Semantic Scholar Research Feeds** | Contrastive embedding similarity to Library folders | All of S2, last 3 months | Free | Active [V] |

**Design lesson.**

- Social-signal feeds (HF, Emergent Mind, alphaXiv) amplify what is already popular.
- Content-based per-user classifiers (Scholar Inbox, arxiv-sanity, S2 Feeds) find niche relevance and are "unbiased by social factors", in Scholar Inbox's own words [V].
- A good personal feed would blend both, with the user controlling the mix. [I]

### 6. Citation-graph explorers

| Tool | Method | Data | Price | Status |
|---|---|---|---|---|
| **Connected Papers** | Single-seed or multi-origin similarity graph | (Semantic Scholar historically [I, med]) | Free: **5 graphs/month** [V JS bundle and 2022 post]. Academic and Business plans billed annually or quarterly [V]. Price ~$6/month academic annual [S, low] | Active |
| **Litmaps** | Citation maps with customizable axes; SPECTER-style similarity [S]; alerts | – | Free (20 inputs, 100 articles); **Pro $10/month billed annually ($120/year; academic email required) or $12.50 billed monthly** [V] [corrected in verification] | Active; **acquired ResearchRabbit (May 7, 2025)** with a US$1M round; ARR doubled to US$1M; combined users >2M [S itbrief] |
| **ResearchRabbit** | Seeds → similar/references/citations; Oct 30, 2025 revamp added semantic-similarity expansion, Litmaps-style axes, and "iteration checkpoints" with branching [S Tay] | "310+ million articles" [V] | Free (50 seeds, unlimited collections); **RR+ $10/month annual, $12.50 monthly**, country discounts; up to 300 seeds, advanced filters, "Signals" alerts [V] | Active; footer "© Litmap Limited" [V] |
| **Inciteful** | Seed papers → graph; similarity by co-citation and bibliographic coupling plus PageRank; "Literature Connector" between two papers [S] | OpenAlex, Semantic Scholar, Crossref [S ISTL, Mar 2026] | Free | **inciteful.xyz 301-redirects to incitefulmed.com/academic/** [V] |
| **Local Citation Network** | Seeds → "Top Cited"/"Top Citing" missing papers; co-authorship and co-citation networks; CSV/RIS/JSON export [V] | OpenAlex, Semantic Scholar, Crossref or Zotero Cita (switchable) [V] | Free, GPL-3, built "in my spare time" [V] | Active but maintainer-limited [S] |

**Shared limitation.** All are paper-graph tools built on open citation metadata: OpenAlex, Semantic Scholar, Crossref and the I4OC open-citations initiative. Books appear only as citation targets, never as navigable full-text nodes. [I, high]

### 7. Reading environments and library tools

- **Zotero** [V zotero.org changelog and blog]:
  - **2026 was a breakout year**, with a "faster release cycle" announced Jan 22, 2026.

  | Version | Date | Highlights |
  |---|---|---|
  | 8.0 | Jan 22, 2026 | Unified citation dialog; annotations in the items list; Reading Mode for web snapshots; Local HTTP API returns annotations and adds **`/fulltext` endpoints** |
  | 9 | Apr 10, 2026 | **Read Aloud** for PDF/EPUB/snapshots. "Zotero Voices": Standard tier unlimited for Storage subscribers, 2 hours/month for free accounts; Premium tier via external TTS. Recently Read collection |
  | 10 | Aug 17, 2026 | **Reading Mode for PDFs** (reflowable font, size and spacing; annotations work); smarter Read Aloud that skips citations, tables and equations; advanced search, undo/redo, batch editing. Built on a "new document-analysis system" |
  | 10.0.6 | Oct 7, 2026 | Latest at time of writing |
  | iOS Read Aloud | Oct 5, 2026 | – |

  - No first-party LLM features [V].
- **zotero-mcp** (community, 54yyyu) [V GitHub]:
  - About 5.4k stars. The MCP server and CLI are MIT-licensed; the "Zotero Agent" plugin is AGPL-3.0.
  - 38 tools: semantic search with local/OpenAI/Gemini/Ollama embeddings; reading metadata, BibTeX, full text and **PDF page ranges** (and page *images* when text extraction garbles math); writing highlights and area annotations; adding items; Scite counts and retraction alerts.
  - The Zotero Agent plugin adds an in-Zotero chat panel "driven by your own Claude Code, Codex or pi", answering with `zotero://` links that open the PDF at the cited page.
  - **This is essentially a ready-made "Claude Code over your library" stack.** [I, high]
- **Readwise Reader** [V readwise.io/pricing]:
  - Reader requires Readwise Full: **$9.99/month annual ($119.88) or $12.99 monthly**. Lite is $5.59/month annual and excludes Reader.
  - 50% academic discount; 30-day trial.
  - Handles articles, PDFs, EPUBs, RSS, YouTube transcripts [S].
  - Ghostreader is an LLM sidekick for definitions, simplification, Q&A and custom prompts [S].
  - Best-in-class *highlight → spaced resurfacing* loop; weak for discovery.
- **Semantic Reader** and **Scholar PDF Reader** are covered above. These are the two most thoughtful "augmented reading" designs, but both are limited to papers.

### 8. Search APIs for builders

| API | Academic relevance | Price (2026-10-15) | Notes |
|---|---|---|---|
| **Semantic Scholar API** | 214M papers, 2.49B citations; snippets; recommendations; S2ORC full-text subset | Free; key at 1 RPS intro [V] | Asta's Scientific Corpus Tool exposes it via MCP [V] |
| **OpenAlex API** | Open catalog of works, authors, institutions; CC0 metadata [I, high] | **Metered in USD** [V]: keyless budget $0.10/day *shared per IP*, observed in `x-ratelimit-limit-usd: 0.1` headers; free key $1/day; list/filter $0.10 per 1k; search or semantic search $1 per 1k; **PDF download $10 per 1k**; rerank +$1 per 1k; single-entity GET free. Annual plans: Member $5,000/yr ($20/day), Member+ $10,000/yr ($100/day), Partner from $20,000/yr. **PDF-sync add-on covers "more than 50 million open-access full-text PDFs" plus TEI XML** (annual plans only) | Rate limits: 10 RPS keyless, 30 with free key, 50 annual; semantic search 1 RPS. Pages updated Aug–Oct 2026 |
| **Exa** | Neural web search; `category: "publication"` returns "scholarly publications such as research papers, preprints, and journal articles" [V] | Search $7 per 1k (auto/fast), $4 per 1k (instant); contents $1 per 1k pages; Answer $5 per 1k; Deep search $12–15 per 1k; agent tiers $0.012–$1 per request; $10 free credit monthly [V] | Good for web-scale recall beyond scholarly indexes |
| **Gemini Deep Research API** | Agentic synthesis over web plus your file stores and MCP | Token rates plus grounding [V]; ~$1–3 per task [S] | Preview |
| **Consensus API/MCP** | Scholarly answers | 30 / 500 / 2,000 calls per month by plan [V] | Bundled with subscriptions |
| **Scite MCP/API** | Citation stance | 250 / 2,500 MCP credits per month; API on Pro [V] | – |
| **Edison API** | PaperQA3 literature agent | `literature-20260216` (and `-high`) [V]; pricing unverified | – |

### 9. Evidence: accuracy, hallucination and recall

#### 9.1 Search recall (finding everything)

| Study | Tool | Setup | Result | Label |
|---|---|---|---|---|
| Lau & Golder, *Cochrane Evid Synth Methods* 3(6):e70050, Sept 27, 2025 | Elicit Pro, Review mode (queries Feb–Mar 2025) | 4 completed evidence syntheses | **Sensitivity 39.5% avg (25.5–69.2%) vs 94.5% for the original searches; precision 41.8% vs 7.55%**. Per case: vaping 27.6%, physical activity 25.5%, fertility 69.2%, breast reconstruction 35.6% | [V] |
| Bernard et al. 2025 (BMC Med Res Methodol), as cited in Lau & Golder | Elicit (Apr 2023) | 1 case | 3 of 17 included studies (17.6% sensitivity) | [V, secondary citation; **possibly stale** tool version] |
| Acar & Floyd, *Issues in Information Systems* 27(3), 2026 | Elicit Pro, Review mode | Accounting-education review series (5 journals) | Precision and sensitivity "consistently in the 1–15% range" vs 98–100% for the benchmark. Some non-overlapping Elicit hits were relevant | [V] |
| Elicit, "How we evaluated…", Mar 18, 2025 | Elicit screening | 58 published systematic reviews, LLM-labeled | **Screening** recall 93.6% (≈96.4% with good criteria), specificity 62.8%; extraction "94–99% accurate" | [V, vendor] |
| Elicit, "Evaluating Elicit's SLR capabilities", May 6, 2026 (byline) | Elicit | Internal | "Single semantic search retrieves 95% of studies"; abstract screening 97% sensitivity, 93% specificity; full-text screening 99.5%/70%; extraction 96%; hallucination 1.0% across 5,100 data points (vs a medRxiv RCT) | [V, vendor] |
| Undermind whitepaper, Jan 5, 2024 | Undermind (arXiv-only, GPT-4) | ~300 user queries vs Google Scholar first 5 pages | ~10× more relevant results; captures more than 97% of Google Scholar's highly relevant hits | [V, vendor, **possibly stale**] |
| Undermind benchmark, 2026 | Undermind vs GPT-5.6 and Claude Opus 5 agents | 23 queries; LLM judge on abstracts | 85% vs 43–50% top-20 recall at 10 minutes | [V, vendor] |
| LitSearch (Ajith et al., EMNLP 2024) | Retrievers and commercial engines | 597 ML/NLP queries | BM25 vs best dense retriever: 24.8-point recall@5 gap; LLM reranking +4.4; commercial engines incl. Google Search "lag behind the best dense retriever by up to 32 recall points" | [V, **possibly stale**] |
| PaSa (ByteDance, arXiv 2501.10120, 2025) | RL-trained paper-search agent | RealScholarQuery | PaSa-7B beats Google + GPT-4o by 37.78 points recall@20 and 39.90 recall@50 | [V] |
| Ai2 Paper Finder, Mar 2025 | Paper Finder | LitSearch | Perfectly relevant paper found for 89% of queries (full mode) | [V, vendor] |

**Reconciling vendor and independent numbers** [I, high]:

1. **Screening ≠ searching.** Vendor numbers mostly measure *screening* a candidate set that already contains the right papers. Independent studies measure *search* recall against a review's final included set. Elicit's search also only sees 138M records, and for paywalled papers only abstracts.
2. **Selection effects.** Vendors pick queries from their own users. Independent studies pick hard, mature reviews with idiosyncratic inclusion criteria.
3. **LLM judges reading abstracts** (Undermind 2026, Elicit 2025) can share blind spots with the systems they judge.

**Rule of thumb.** Expect AI search to find 25–70% of what an exhaustive librarian-built search finds, but with 5–40× better precision. For exploratory reading, that trade is excellent. For a systematic review, it is a supplement.

#### 9.2 Citation fabrication and support

| Study | Systems | Metric | Result | Label |
|---|---|---|---|---|
| Walters & Wilder, *Sci Rep* 13:14045, Sept 7, 2023 | ChatGPT GPT-3.5 / GPT-4 | Fabricated references | **55% / 18%** fabricated; 43% / 24% of *real* ones had substantive errors | [V, **possibly stale**] |
| Chelli et al., *JMIR* 26:e53164, May 22, 2024 | GPT-3.5 / GPT-4 / Bard, generating SR references | Hallucination; precision; recall | 39.6% / 28.6% / 91.4% hallucinated; precision 9.4% / 13.4% / 0%; recall 11.9% / 13.7% / 0% | [V, **possibly stale**] |
| OpenScholar (Nov 2024 → *Nature* Feb 2026) | GPT-4o, no retrieval | Citation hallucination | **78–90%** | [V] |
| DeepTRACE (Venkit et al., arXiv 2509.04499, Sept 2025) | GPT-4.5/5, You.com, Perplexity, Copilot/Bing, Gemini (search and DR modes) | Citation accuracy; unsupported statements | Citation accuracy **40–80%**; unsupported-statement rates e.g. **Perplexity DR 97.5%**, YouChat DR 74.6% [S quoting paper]; DR modes "reduce overconfidence" but remain one-sided on debate queries | [V abstract; S for per-system numbers] |
| Rao, Wong, Callison-Burch (arXiv 2604.03173, Apr 3, 2026) | 10 systems on DRBench; 3 on ExpertQA | Hallucinated (never-existed) and non-resolving URLs | Hallucinated: claude-3.5/3.7-sonnet-with-search 3.0–3.2%; openai-deepresearch 3.5%; gemini-2.5-pro-with-search 4.8%; gpt-4o-search-preview 8.8%; **gemini-2.5-pro-deepresearch 13.3%** (18.5% non-resolving). Pooled: **DR agents 10.7% vs search-augmented LLMs 4.8%**. The `urlhealth` self-correction loop cut non-resolving links GPT-5.1 16.0%→0.6%, Gemini 2.5 Pro 6.1%→0.1%, Claude Sonnet 4.5 4.9%→0.8% | [V] |
| PaperQA2 (2024) | Agentic RAG over full text | Cited-but-unsupported | 13.5% vs Wikipedia's 24.9% | [V, possibly stale] |
| Kosmos (Nov 2025) | Multi-agent AI scientist | Statement accuracy | 79.4% | [V] |
| Asta citation study (June 2026) | Asta Summarize | Stability | Cited sets vary notably across identical runs | [V] |

**In-the-wild contamination:**

- Zhao et al. (arXiv 2605.07723, May 2026, co-author Paul Ginsparg): 111M references in 2.5M papers; **146,932** hallucinated citations in 2025 alone; surge from mid-2024; concentrated in small, early-career teams; arXiv moderation let ~78.8% through [V; the 78.8% figure is from phys.org, S].
- Lancet (Topaz et al., May 7, 2026): 2M+ papers and 97M citations; ~4,000 fabricated citations across ~2,800 papers. Rate went from **1 in 2,828 papers (2023) to 1 in 458 (2025) to 1 in 277 (first 7 weeks of 2026)** [S STAT].

**Takeaways** [I, high]:

1. Retrieval grounding fixes *existence* (the reference is real) much more than *support* (the reference says what's claimed).
2. Cheap deterministic verification (resolve the DOI or URL, fetch the snippet, check entailment) gets existence errors near zero. Any tool we build must do this.
3. Run-to-run instability (Asta) means a single synthesis should not be treated as *the* answer. Sample several runs and show the variance. Forecasters already think this way.

#### 9.3 Benchmarks of literature-synthesis quality

| Benchmark | Content | Result | Label |
|---|---|---|---|
| ScholarQABench (OpenScholar) | 3,000 queries; 250 expert answers | OpenScholar-8B beat GPT-4o by 6.1% and PaperQA2 by 5.5% on correctness (preprint; Nature version similar) | [V/S] |
| LitQA2 / LAB-Bench → LABBench2 (LitQA3, FigQA2, PatentQA) | Body-text and figure questions | PaperQA3 claims +15–45 points over PaperQA2 | [V, vendor, chart only] |
| AstaBench | 2,400+ problems, 11 benchmarks incl. ScholarQA-CS2 | Best 53.0% overall | [V] |
| SciArena | Human pairwise votes on literature answers | o3 top; best auto-judge 65.1% agreement with humans | [V] |

### 10. What these tools do badly, and the books gap

**Systematic weaknesses (cross-cutting)** [I unless noted]:

1. **Books and textbooks are nearly invisible.**
   - The discovery stack is built on paper metadata: Semantic Scholar, OpenAlex, Crossref, PubMed, arXiv.
   - Elicit explicitly searches "academic papers" [V]. Semantic Reader is arXiv-only [V]. Scholar Inbox ingests preprint servers and proceedings [V]. Paper Finder, Undermind and Consensus speak only of "papers".
   - Exceptions: Google Scholar (Google Books) and Scite (claims to include "books"), plus whatever you upload to Gemini Notebook, Claude Projects or Zotero.
2. **Full text is the exception.**
   - Ai2 ScholarQA had 8M full texts vs 108M abstracts [V]. Elicit falls back to abstracts for paywalled work [V]. OpenScholar used 45M open-access papers [V].
   - Google's Quick Read only works on papers you can access [V].
   - Answers that live in methods sections, figures or book chapters are systematically under-retrieved. That is exactly why LitQA2 was designed around non-abstract facts.
3. **Synthesis loses dissent.** DeepTRACE found one-sided answers on debate queries [V]. Only scite surfaces "contrasting" citations as a first-class signal.
4. **Outputs are not reproducible**, as in the Asta study [V], and are rarely versioned.
5. **No calibrated "how much did I miss?"** Undermind's discovery-curve estimate is the lone exception [V].
6. **Recency vs canon.** Feeds favor the last 3 months (S2 Feeds) or social virality (HF, Emergent Mind). Nothing helps you find the *best* 1975 textbook chapter on a topic.

**What a books-and-textbooks equivalent would look like** [I, design proposal, informed by the above]:

| Layer | Paper world (exists) | Book world (needed) | Candidate open inputs |
|---|---|---|---|
| Metadata graph | OpenAlex / S2 / Crossref citations | Editions ↔ works ↔ chapters ↔ subjects ↔ syllabi; book-to-paper citations | OpenAlex (has book and book-chapter work types [I, high]); Open Library; Library of Congress subjects; Open Syllabus-style co-assignment data [I] |
| Full-text index | S2ORC, CORE, OA PDFs (OpenAlex PDF sync: 50M+) | Chapter-level passages for public-domain and open-licensed books | **Institutional Books 1.0**: 983,004 public-domain Harvard volumes, ~242B tokens, 254 languages; **noncommercial, no-redistribution early-access terms** [V]. HathiTrust public-domain volumes (bulk analytics service HTRC closed Sept 30, 2026 [V]). Project Gutenberg [I]. Open textbooks (Open Textbook Library: **1,887** CC-licensed textbooks [V]). DOAB/OAPEN open-access monographs [I; page 403] |
| Snippet-only layer for in-copyright books | Abstracts | "Search inside" hit lists, tables of contents, back-of-book indexes, publisher previews | Google Books / Open Library search-inside [I]; user-owned EPUBs via Zotero `/fulltext` [V] |
| Deep search agent | Undermind / Paper Finder / Scholar Labs | "Which chapters of which books best answer X?", with a convergence estimate | Same agent pattern; chapter is the retrieval unit |
| Reader | Semantic Reader / Quick Read | Chapter "Quick Read" (Answers/Approach/Considerations), prerequisite cards, cross-book "how does book B treat this?" | Zotero 10 Reading Mode as the host [V] |
| Stance layer | scite supporting/contrasting | Reviews, errata, citing papers that dispute a book's claim | scite (claims books) [V claim]; OpenAlex citations to books [I] |

**Legal constraints.**

- *Bartz v. Anthropic* (N.D. Cal.) held on June 23, 2025 that training on lawfully acquired books was fair use, while pirated library copies went to trial.
- The resulting **$1.5B** class settlement got **final approval July 20, 2026**. First payments are expected "on or before November 15, 2026" [V Wikipedia; settlement site].
- For a personal tool, the clean path is: public-domain and open-licensed corpora, plus *user-owned* files processed locally, plus snippet or metadata layers for everything else. [I, high; not legal advice]

---

## Numbers that matter

| Quantity | Value | Date | Source | Label |
|---|---|---|---|---|
| Elicit corpus | 138M papers (Semantic Scholar + PubMed + OpenAlex) | 2026-10 | support.elicit.com | V |
| Elicit Pro / Scale | $49 / $169 per user/month, billed annually ($588 / $2,028) | 2026-10-15 | elicit.com/pricing | V |
| Elicit SR screening cap | 5,000 papers (Pro); 40,000 (Enterprise) | 2026-10-15 | elicit.com/pricing | V |
| Elicit independent search sensitivity | 39.5% avg (vs 94.5% traditional); precision 41.8% (vs 7.55%) | Sept 2025 | Lau & Golder, PMC12483133 | V |
| Elicit vendor screening recall | 93.6% (58 reviews); later 97% abstract sensitivity | Mar 2025; May 2026 | elicit.com/blog | V (vendor) |
| Consensus Pro / Deep | $20/month or $144/yr; $65/month or $540/yr; 15 / 200 Deep reviews | 2026-09-12 | Consensus help center | V |
| Consensus claimed corpus | "400M+ scientific papers" | 2026-10-15 | consensus.app | V (claim) |
| Undermind Pro | $16/month billed annually | 2026-10-15 | undermind.ai/pricing | V |
| Undermind avg search time | 2.9 min (production) | 2026 | undermind.ai | V |
| Undermind vendor recall (top-20, 10 min) | 85% vs 47–50% (Claude Opus 5 / GPT-5.6 agents) | 2026 | undermind.ai | V (vendor) |
| Scite Basic / Pro | $12 / $40 per month billed yearly | 2026-10-15 | scite.ai/pricing | V |
| Scite coverage | 1.6B+ citations; 300M+ sources; 44+ publisher partners | 2026-10-15 | scite.ai | V (claim) |
| Semantic Scholar | 214M papers; 2.49B citations; 79M authors | 2026-10-15 | semanticscholar.org/product/api | V |
| Semantic Reader coverage | arXiv only, >250k papers | 2026-10-15 | S2 FAQ | V |
| Ai2 ScholarQA index | 8M+ full text + 108M+ abstracts | Mar 2025 | allenai.org/blog/ai2-scholarqa | V |
| AstaBench | 2,400+ problems; 57 agents; best 53.0% | Aug 2025 / ICLR 2026 | allenai.org/blog/asta; arXiv 2510.21652 | V |
| OpenScholar datastore | 45M open-access papers | Feb 2026 | UW News | V |
| GPT-4o citation hallucination (no retrieval) | 78–90% | Nov 2024 / Feb 2026 | arXiv 2411.14199 | V |
| PaperQA2 LitQA2 | Precision 85.2% vs humans 73.8%; accuracy 66.0% vs 67.7% (n.s.) | Sept 2024 | arXiv 2409.13740 | V |
| PaperQA3 corpus | 150M+ papers and patents | Feb 18, 2026 | edisonscientific.com | V |
| Edison seed round | $70M | Dec 18, 2025 | SiliconANGLE | V |
| Kosmos | 1,500 papers and 42,000 LOC per run; 79.4% statements accurate | Nov 2025 | arXiv 2511.02824 | V |
| Deep-research URL hallucination | 10.7% (DR agents) vs 4.8% (search LLMs) pooled; worst 13.3% | Apr 2026 | arXiv 2604.03173 | V |
| URL-check loop effect | Non-resolving links to <1% (6–79× reduction) | Apr 2026 | arXiv 2604.03173 | V |
| DeepTRACE citation accuracy | 40–80% across systems | Sept 2025 | arXiv 2509.04499 | V |
| Hallucinated citations in literature | 146,932 in 2025 (arXiv/bioRxiv/SSRN/PMC) | May 2026 | arXiv 2605.07723 | V |
| Papers with ≥1 fabricated ref | 1/2,828 (2023) → 1/458 (2025) → 1/277 (early 2026) | May 2026 | STAT on Lancet study | S |
| Scholar Labs update | ~10× faster; 3× more papers scanned; 10× more searches/day | Jun 3, 2026 | Google Scholar blog | V |
| Gemini Notebook per-source cap | 500,000 words / 200MB; 50–600 sources by tier | Sept 2026 | elephas.app | S |
| Gemini DR API per task | ~$1–3 (standard), ~$3–7 (Max); grounding $14 per 1k after 5k free/month | Apr–Oct 2026 | tokencost (S); ai.google.dev pricing (V) | S/V |
| OpenAlex free key budget | $1/day; keyless $0.10/day shared per IP | Oct 2026 | help.openalex.org; live headers | V |
| OpenAlex unit costs | List $0.10 per 1k; search $1 per 1k; PDF $10 per 1k | Oct 2026 | help.openalex.org/access/example-costs | V |
| OpenAlex OA PDF sync | 50M+ PDFs (annual plans, from $5,000/yr) | Aug 2026 | help.openalex.org/access/pricing | V |
| Exa search | $7 per 1k requests (auto/fast) | 2026-10-15 | exa.ai/pricing | V |
| Litmaps Pro | $10/month billed annually ($120/yr, academic email); $12.50 billed monthly [corrected in verification] | 2026-10-15 | litmaps.com/pricing | V |
| RR+ | $10/month annual; $12.50 monthly | 2026-10-15 | researchrabbit.ai/pricing | V |
| Connected Papers free | 5 graphs/month | 2026-10-15 | connectedpapers.com JS bundle | V |
| Emergent Mind Pro / Max | $12 / $30 per month ($10 / $25 annual) | 2026-10-15 | emergentmind.com/pricing | V |
| Readwise Full (Reader) | $9.99/month annual; $12.99 monthly | 2026-10-15 | readwise.io/pricing | V |
| Kagi Ultimate (Research mode) | $25/month | 2026-10-15 | kagi.com/pricing | V |
| Claude Pro (incl. Research) | $20/month ($17 annual) | 2026-10-15 | claude.com/pricing | V |
| Scholar Inbox dataset | 800k ratings from 14.3k users | 2025 | ACL 2025 demo paper | V |
| Institutional Books 1.0 | 983,004 PD volumes; ~242B tokens; 254 languages | Jun 2025 | HF dataset; arXiv 2506.08300 | V |
| Open Textbook Library | 1,887 open textbooks | 2026-10-15 | open.umn.edu | V |
| Bartz v. Anthropic | $1.5B settlement; final approval Jul 20, 2026 | Jul 2026 | settlement site; Wikipedia | V |
| zotero-mcp | ~5.4k stars; 38 tools | 2026-10-15 | GitHub | V |
| STORM | 31.6k stars; last news Jan 2025 | 2026-10-15 | GitHub | V |

---

## Surprises and recent changes (2024–2026)

1. **HathiTrust Research Center Analytics shut down on Sept 30, 2026.** Accounts, Algorithms and Data Capsules are gone. Funding ends with 2026, and only Bookworm, derived datasets and one visualization remain [V]. This was the main sanctioned route for computational analysis of in-copyright books.
2. **OpenAlex moved to dollar-denominated metering.** Keyless access is throttled to a shared $0.10/day per IP. The live API returned `429` with `"Insufficient budget"` from this research environment. Free keys get $1/day, and PDFs cost $10 per 1,000 [V]. Tools that assumed "OpenAlex is free and unlimited" need a key and a budget planner.
3. **Zotero shipped versions 8, 9 and 10 in one calendar year**, adding Read Aloud and reflowable PDF Reading Mode, with no LLM features of its own [V]. The AI layer is happening in community MCP servers.
4. **NotebookLM was renamed "Gemini Notebook"** (Jul 16, 2026) and gained per-notebook code execution [V].
5. **Papers with Code now redirects to Hugging Face Trending Papers** [V], and the leaderboards were not carried over [S].
6. **FutureHouse's public platform became Edison Scientific's**: a 301 redirect, the $70M seed, and PaperQA3 multimodal over 150M papers and patents [V].
7. **Google Scholar went agentic and negotiated publisher full text.** Quick Read works on subscribed articles via publisher partners [V], which suggests a coming split between "AI over full text" (incumbents with licenses) and "AI over abstracts" (everyone else). [I]
8. **Vendors now benchmark against general coding agents.** Undermind's 2026 baselines are GPT-5.6 in the Codex CLI and **Claude Opus 5 in Claude Code** [V]. "Claude Code with web search" is the baseline a custom tool must beat. Specialized pipelines still claim roughly a 1.7× recall advantage.
9. **Deep research modes hallucinate *more* URLs than plain search-augmented chat** (10.7% vs 4.8%) [V]. Longer agent loops mean more opportunities to invent.
10. **The OpenScholar demo was folded into Asta** (redirect) even as the paper landed in *Nature* [V]. SciArena's demo was scheduled to retire July 15, 2026 [V]. Ai2 is consolidating.
11. **Elicit's top-tier price more than doubled in mid-2026** ($79 → $169/user/month between CostBench's May 17 and June 16, 2026 snapshots, alongside renames Pro → Scale and Team → Enterprise) [S] [corrected in verification]. Its current Pro is $49 annual-billed [V]. Elicit is moving up-market toward systematic-review buyers. [I]
12. **Consensus's corpus claim doubled** from ~200M to "400M+" [V claim vs S earlier]. The definition of "paper" probably broadened. [I]
13. **Fabricated citations are now a measurable feature of the literature**, roughly 6–10× higher by early 2026 than in 2023 [V/S]. Discovery tools that use citation graphs will increasingly ingest phantom edges. [I]
14. **The Kagi "Academic" lens is just a `.edu` site filter** [V], not a scholarly index.
15. **arxiv-sanity-lite's hosted instance appears down** [V, 2026-10-15]; the self-hostable code remains.

---

## Contested or uncertain points

- **Vendor vs independent recall (Elicit).** 93–97% (vendor, screening) vs 25–69% (independent, search) [V both]. These measure different things, and neither covers 2026 Elicit versions on diverse queries. Uncertainty about the current *search* recall of top tools on typical exploratory queries: wide, roughly 30–85% [I, low-med].
- **"Superhuman" literature agents.** PaperQA2's claim rests on precision. Accuracy matched humans, and the human baseline had high variance (±9.6–11.9) [V]. PaperQA3's gains are chart-only and vendor-run [V].
- **OpenScholar's comparisons** use GPT-4o-era baselines. A May 2026 commentary called them "now-deprecated" [S rogue-scholar]. Frontier models with search likely hallucinate far less than 78–90%; Rao et al. 2026 found 3–13% URL hallucination [V].
- **Deep research per-system unsupported-statement rates** (e.g., Perplexity DR 97.5%) come from a secondary summary of DeepTRACE. The abstract gives only 40–80% citation accuracy [V/S]. Product versions have changed since Sept 2025.
- **Usage limits** for OpenAI and Perplexity Deep Research in 2026 could not be verified on primary pages (403/404). Secondary sources conflict [low].
- **Edison pricing.** The $200/month and 650-credit tier came from a search snippet; the page returned 404 on fetch [low-med].
- **Connected Papers price.** Only the free 5-graph limit was verified; the ~$6/month academic figure is secondary [low].
- **Consensus corpus sources.** Help pages returned 403. The 400M+ claim cannot be decomposed [low].
- **Litmaps–ResearchRabbit relationship.** Trade press says "acquires" (May 2025) [S]. Aaron Tay noted some sources call it a partnership [S]. ResearchRabbit's footer reads "© Litmap Limited" [V], which supports the acquisition reading (~85%).
- **Does Scholar Labs use full text?** Tay treated it as unconfirmed [S]. Quick Read clearly uses full text for accessible papers [V].
- **Gemini Notebook limits by tier** are from a secondary blog; Google says limits change [S].
- **Scite's "317M+ full-text articles"** is a vendor claim that seems high relative to open-access availability. Probably it means citation statements extracted under publisher agreements, not readable full text for users [I, med].

---

## Implications for someone building tools to explore literature

1. **Don't rebuild deep search for papers; compose it.**
   - Use the free or cheap specialized engines as *tools* inside your agent: Asta's Scientific Corpus MCP and the S2 API, OpenAlex (budgeted), Scite MCP, Consensus MCP, Exa `publication`, and Edison Literature for biomedicine.
   - Undermind's own benchmark suggests specialized pipelines beat raw Claude Code plus web search by about 1.7× on top-20 recall [V, vendor]. Calling them beats imitating them.
2. **Make verification non-optional.** For every emitted reference:
   - resolve the DOI or URL (the `urlhealth` pattern got errors under 1%);
   - fetch the cited passage via S2 snippets, the OpenAlex PDF, or a local Zotero `/fulltext`;
   - run an entailment check and show a support badge.
3. **Estimate what you missed.** Implement Undermind-style discovery curves on every search session. Show "estimated remaining relevant items: N (80% CI)". This is cheap and suits a forecasting audience.
4. **Treat runs as samples.** Run synthesis k times (or with different retrieval seeds). Report agreement and disagreement and the union and intersection of citations. Asta's run-to-run variation makes this necessary [V].
5. **Build on Zotero for the personal corpus.**
   - Local API `/fulltext`, annotations-in-API, zotero-mcp's 38 tools, page-anchored `zotero://` links, and Reading Mode/Read Aloud for consumption.
   - Claude Code plus zotero-mcp is a working "library agent" today [V].
6. **Books need a different retrieval unit and a different legal plan.**
   - Make the retrieval unit the chapter, with tables of contents and back-of-book indexes as first-class signals.
   - Use public-domain and open corpora for full text (Institutional Books: noncommercial terms; Open Textbook Library; Gutenberg), user-owned EPUBs locally, and metadata or snippets for in-copyright works.
   - HTRC's closure removes one route, so plan around it.
7. **Budget for APIs.** OpenAlex: a full-text search costs $0.001 and a PDF $0.01. A $1/day free key supports ~1,000 searches or ~100 PDFs per day [V]. Exa: $0.007 per search. Gemini DR: ~$1–3 per task [S]. A personal tool doing 50 deep sessions a month costs roughly $50–150/month in API fees, comparable to an Elicit Pro seat [I].
8. **Personalization is solved cheaply.** Scholar Inbox shows a per-user logistic regression on ~78 positive ratings plus 5k random negatives over off-the-shelf embeddings works at scale [V]. No fine-tuning is needed.
9. **Surface dissent explicitly.** Use scite stance data plus LLM contradiction mining (PaperQA2 found ~2.3 contradictions per paper [V]) to counter the one-sidedness DeepTRACE measured.
10. **Expect access stratification.** Google and Edison are striking publisher deals [V]. Independent tools will remain abstract-heavy for paywalled work. Design the UX to *say* when an answer rests only on abstracts. [I]

---

## Ideas sparked

1. **Convergence Meter (any corpus).**
   - A sidebar that plots "new relevant items found vs items examined" live during any search (papers, chapters, lectures) and fits an exponential or capture-recapture model.
   - It shows "≈12 relevant items likely remain (80% CI 5–25)".
   - Run two independent retrieval strategies (e.g., Scholar Labs and OpenAlex semantic search) and use **Lincoln–Petersen capture-recapture** on their overlap to estimate total relevant items. This is a forecaster-native take on recall.
2. **Citation Courtroom.** Paste any deep-research report. Each citation gets three checks:
   - *exists*: resolves via DOI, OpenAlex or Crossref;
   - *says it*: retrieve the passage and run an entailment score;
   - *still stands*: scite contrasting count plus retraction flag.

   Output a red/amber/green margin and an overall "report reliability" score. It is cheap to build with urlhealth-style checks plus the S2 snippet API.
3. **Textbook Concordance.**
   - For a concept ("variational inference", "Kelly criterion"), show a grid of 10–30 open textbooks × the chapters and sections that treat it.
   - Include each book's notation, prerequisites, and a 3-line "how this book explains it".
   - Built from the Open Textbook Library (1,887), public-domain classics and the user's own EPUBs in Zotero.
   - The book-world analogue of Elicit's papers × questions table.
4. **Quick Read for chapters.** Google's Answers/Approach/Considerations template applied to *book chapters* and *lecture transcripts*, conditioned on the user's question, with page-anchored links (`zotero://` to the page).
5. **Shelf Inbox.**
   - A Scholar-Inbox-style personal recommender for *books*: per-user logistic regression on thumbs-up/down over embeddings of book descriptions, tables of contents and subject headings (Open Library / OpenAlex `book` works).
   - Includes a "map of the stacks" cold-start view and a weekly "three books you'd likely rate 5/5" digest with calibrated probabilities.
6. **Dissent Lens.** For any claim, show a balanced pair of panels: strongest supporting vs strongest contrasting evidence (scite stance plus LLM contradiction mining), with a "consensus meter" whose uncertainty band widens when the evidence base is small or retracted-prone.
7. **Run Ensembles for synthesis.**
   - Run the same question through Asta, Consensus Deep, Gemini DR and Claude Research.
   - Diff the claims, cluster them, and show agreement, outliers and citation overlap (Jaccard).
   - Treat each run as a forecaster. Aggregation is a QURI-flavored answer to run-to-run instability.
8. **Budget-aware OpenAlex Planner.** An agent tool that, given a research goal and a daily budget ($1 free), plans the mix of cheap list calls ($0.10 per 1k), searches ($1 per 1k) and PDF pulls ($10 per 1k). It caches aggressively and reports "cost per relevant paper found".
9. **Prerequisite Path Builder.** From a target paper, extract unfamiliar concepts (Semantic-Reader-style definitions), map each to the best open textbook chapter (Concordance), and order them topologically into a reading syllabus with time estimates. Zotero 10's Read Aloud handles the commute.
10. **Lecture ↔ Paper ↔ Chapter linker.** Align timestamps in open lecture transcripts with the papers and textbook sections they discuss (citation and entity matching), so a click in a video opens the chapter, and vice versa.
11. **Novelty Oracle (Owl for everything).** "Has anyone done X?" checked against papers (Paper Finder or Undermind), books (chapter index) *and* patents (Edison covers patents [V]). It returns a probability that X is novel, plus the closest three precedents.
12. **Spatial Stacks (VR/AR).** A walkable library where shelves are embedding clusters:
    - books as spines, papers as loose sheets pinned near the chapters they cite;
    - a "convergence fog" that thins as you explore a region;
    - contrasting-citation edges drawn as red threads.

    Built on the same graph as Litmaps/Inciteful but with books as first-class nodes.
13. **Recall Audit Harness.** A personal LitSearch: seed it with 30 papers or chapters you *know* should be found for 10 of your real questions. Periodically re-run Scholar Labs, Undermind, Elicit, Asta and your own tool, and chart recall over time. This turns vendor claims into your own measurements.
14. **Abstract-only warning label.** A UI convention for any synthesis: each sentence gets a tiny glyph for its evidence basis (full text, figure, abstract only, metadata only) so the reader knows when a claim rests on an abstract of a paywalled paper.

---

## Sources

1. Elicit: Pricing — https://elicit.com/pricing — accessed 2026-10-15
2. Elicit Help: which sources Elicit searches (138M papers; full-text rules) — https://support.elicit.com/en/articles/553025 — accessed 2026-10-15
3. Elicit Blog: How we evaluated Elicit Systematic Review — https://elicit.com/blog/how-we-evaluated-elicit-systematic-review — 2025-03-18
4. Elicit Blog: Evaluating Elicit's Systematic Literature Review Capabilities — https://elicit.com/blog/evaluating-elicit-slr — byline 2026-05-06
5. Lau & Golder, "Comparison of Elicit AI and Traditional Literature Searching in Evidence Syntheses Using Four Case Studies", *Cochrane Evidence Synthesis and Methods* 3(6):e70050 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/ — 2025-09-27
6. Acar & Floyd, "AI-assisted versus traditional systematic review approaches: Evidence from accounting education literature", *Issues in Information Systems* 27(3):191–208 — https://iacis.org/iis/2026/3_iis_2026_191-208.pdf — 2026
7. CostBench: Elicit pricing change logs (secondary) — https://costbench.com/changelog/elicit-price-increase-2026-06/ — 2026-06
8. Consensus Help: Subscription plans — https://intercom.help/consensus-d118a252369c/en/articles/10087865-subscription-plans — 2026-09-12
9. Consensus homepage — https://consensus.app/ — accessed 2026-10-15
10. Undermind homepage (features, benchmark) — https://www.undermind.ai/ — accessed 2026-10-15
11. Undermind pricing — https://www.undermind.ai/pricing — accessed 2026-10-15
12. Hartke & Ramette, "Benchmarking the Undermind Search Assistant" (whitepaper) — https://www.undermind.ai/whitepaper.pdf — 2024-01-05 (possibly stale)
13. Scite pricing — https://scite.ai/pricing — accessed 2026-10-15
14. Scite homepage — https://scite.ai/ — accessed 2026-10-15
15. Semantic Scholar API product page — https://www.semanticscholar.org/product/api — accessed 2026-10-15
16. Semantic Scholar FAQ — https://www.semanticscholar.org/faq — accessed 2026-10-15
17. Semantic Reader product page — https://www.semanticscholar.org/product/semantic-reader — accessed 2026-10-15
18. Semantic Scholar About — https://www.semanticscholar.org/about — accessed 2026-10-15
19. Ai2 Blog: Introducing Ai2 ScholarQA — https://allenai.org/blog/ai2-scholarqa — 2025-01-21 (Mar 5 update)
20. Ai2 Blog: Paper Finder — https://allenai.org/blog/paper-finder — 2025-03-26
21. Ai2 Blog: Asta — https://allenai.org/blog/asta — 2025-08-26
22. Bragg et al., "AstaBench" — https://arxiv.org/abs/2510.21652 — 2025-10-24 (v2 2026-04-21)
23. Orduña-Malea & Lopezosa, "Unraveling the Ai2 Asta Scholarly Research Assistant Citation System" — https://arxiv.org/abs/2606.08301 — 2026-06-06
24. UW News: OpenScholar in *Nature* — https://www.washington.edu/news/2026/02/04/in-a-study-ai-model-openscholar-synthesizes-scientific-research-and-cites-sources-as-accurately-as-human-experts/ — 2026-02-04
25. Asai et al., "OpenScholar" (preprint) — https://arxiv.org/abs/2411.14199 — 2024-11-21
26. Ai2 Blog: SciArena — https://allenai.org/blog/sciarena — 2025-07-01 (with later update)
27. Skarlinski et al., "Language agents achieve superhuman synthesis of scientific knowledge" (PaperQA2) — https://arxiv.org/abs/2409.13740v2 (HTML: https://arxiv.org/html/2409.13740v2) — 2024-09-26 (possibly stale)
28. FutureHouse: PaperQA2 / WikiCrow announcement — https://www.futurehouse.org/news/wikicrow — 2024-09-11
29. FutureHouse: Launching the FutureHouse Platform — https://www.futurehouse.org/research-announcements/launching-futurehouse-platform-ai-agents — 2025-05-01
30. Edison Scientific: Introducing PaperQA3 — https://edisonscientific.com/news/edison-literature-agent — 2026-02-18
31. Edison Scientific homepage — https://edisonscientific.com/ — accessed 2026-10-15
32. SiliconANGLE: Edison Scientific raises $70M — https://siliconangle.com/2025/12/18/edison-scientific-raises-70m-build-autonomous-ai-scientists-research — 2025-12-18
33. Mitchener et al., "Kosmos: An AI Scientist for Autonomous Discovery" — https://arxiv.org/abs/2511.02824 — 2025-11-04
34. GitHub: Future-House/paper-qa — https://github.com/Future-House/paper-qa — accessed 2026-10-15
35. Edison pricing page (search snippet only; 404 on fetch) — https://edisonscientific.com/pricing — snippet 2026; fetched 2026-10-15
36. Google Scholar Blog: Scholar Labs — https://scholar.googleblog.com/2025/11/scholar-labs-ai-powered-scholar-search.html — 2025-11-18
37. Google Scholar Blog: Scholar Labs update — https://scholar.googleblog.com/2026/06/scholar-labs-update-search-10x-faster.html — 2026-06-03
38. Google Scholar Blog: Quick Read — https://scholar.googleblog.com/2026/08/quick-read-see-how-paper-answers-your.html — 2026-08-25
39. Google Scholar Blog: AI outlines in Scholar PDF Reader — https://scholar.googleblog.com/2024/11/ai-outlines-in-scholar-pdf-reader-skim.html — 2024-11-03
40. Google Scholar Blog (index and Atom feed; PDF Reader launch 2024-03-18; highlights 2025-11-10) — https://scholar.googleblog.com/ — accessed 2026-10-15
41. Aaron Tay, "Scholar Labs Early Review" — https://aarontay.substack.com/p/scholar-labs-early-review-google — 2025-11-20
42. Claude Blog: Research (and Google Workspace) — https://claude.com/blog/research — 2025-04-15
43. Claude pricing — https://claude.com/pricing — accessed 2026-10-15
44. Google: Try Deep Research in Gemini — https://blog.google/products/gemini/google-gemini-deep-research/ — 2024-12-11
45. Google Cloud docs: Gemini Deep Research Agent — https://docs.cloud.google.com/gemini-enterprise-agent-platform/agents/google/deep-research — updated 2026-10-15
46. Gemini API docs: Deep Research — https://ai.google.dev/gemini-api/docs/deep-research — accessed 2026-10-15
47. Gemini API pricing — https://ai.google.dev/gemini-api/docs/pricing — accessed 2026-10-15
48. tokencost.app: Gemini Deep Research costs (secondary) — https://tokencost.app/blog/gemini-deep-research-agent-cost — 2026-04-24
49. Perplexity: Introducing Perplexity Deep Research — https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research — 2025-02-14
50. Asian Efficiency: Perplexity review (secondary) — https://www.asianefficiency.com/technology/perplexity-ai-review/ — re-verified Jul 2026
51. CometAPI: ChatGPT pricing 2026 (secondary; search result) — https://www.cometapi.com/chatgpt-pricing-2026-free-vs-go-vs-plus-vs-pro/ — 2026
52. Google Blog: NotebookLM is now Gemini Notebook — https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/ — 2026-07-16
53. Elephas: NotebookLM free vs Plus limits (secondary) — https://elephas.app/blog/notebooklm-free-vs-plus — updated 2026-09-28
54. Wikipedia: Gemini Notebook — https://en.wikipedia.org/wiki/Gemini_Notebook — accessed 2026-10-15
55. GitHub: stanford-oval/storm — https://github.com/stanford-oval/storm — accessed 2026-10-15
56. Hugging Face Trending Papers — https://huggingface.co/papers/trending — accessed 2026-10-15
57. Hugging Face Daily Papers — https://huggingface.co/papers — accessed 2026-10-15
58. Papers with Code (302 redirect to HF) — https://paperswithcode.com/ — checked 2026-10-15
59. hyper.ai: Papers with Code shutdown report (secondary) — https://hyper.ai/en/news/42900 — 2025-07
60. Emergent Mind homepage — https://www.emergentmind.com/ — accessed 2026-10-15
61. Emergent Mind pricing — https://www.emergentmind.com/pricing — accessed 2026-10-15
62. alphaXiv homepage — https://www.alphaxiv.org/ — accessed 2026-10-15
63. alphaXiv blog — https://www.alphaxiv.org/blog — accessed 2026-10-15
64. Axios Pro: alphaXiv seed (search result; secondary) — https://www.axios.com/pro/all-deals/2025/11/19/alphaxiv-seed-research-tracking-menlo-haystack — 2025-11-19
65. GitHub: karpathy/arxiv-sanity-lite — https://github.com/karpathy/arxiv-sanity-lite — accessed 2026-10-15
66. Flicke et al., "Scholar Inbox: Personalized Paper Recommendations for Scientists" — https://arxiv.org/abs/2504.08385 — 2025-04-11 (v2 2025-06-14)
67. Scholar Inbox ACL 2025 demo paper (PDF) — https://www.cvlibs.net/publications/Flicke2025ACLSDT.pdf — 2025
68. Tübingen AI Center: Stay ahead in research with Scholar Inbox — https://tuebingen.ai/news/stay-ahead-in-research-with-scholar-inbox — 2023-12-21 (possibly stale)
69. Connected Papers: Announcing Premium accounts — https://connectedpapers.substack.com/p/announcing-premium-accounts-multi-22-07-28 — 2022-07-28 (stale; limits re-verified in site JS 2026-10-15)
70. Litmaps pricing — https://www.litmaps.com/pricing — accessed 2026-10-15
71. ResearchRabbit pricing — https://www.researchrabbit.ai/pricing — accessed 2026-10-15
72. Aaron Tay, "ResearchRabbit's 2025 Revamp" — https://aarontay.substack.com/p/researchrabbits-2025-revamp-iterative — 2025-11-02
73. IT Brief: Litmaps acquires ResearchRabbit — https://itbrief.news/story/litmaps-acquires-researchrabbit-raises-1-million-for-ai — 2025-05-07
74. Jain, Behera & Kumar, "Citation Network-Based Research Discovery Using Inciteful", *ISTL* 113 — https://journals.library.ualberta.ca/istl/index.php/istl/article/view/2974 — 2026-03-18
75. Local Citation Network — https://localcitationnetwork.github.io/ — accessed 2026-10-15
76. Zotero changelog — https://www.zotero.org/support/changelog — accessed 2026-10-15
77. Zotero 8.0 changelog — https://www.zotero.org/support/8.0_changelog — 2026-01-22 onward
78. Zotero Blog: Zotero 9 — https://www.zotero.org/blog/zotero-9/ — 2026-04-10
79. Zotero Blog: Zotero 10 — https://www.zotero.org/blog/zotero-10/ — 2026-08-17
80. Zotero Blog index — https://www.zotero.org/blog/ — accessed 2026-10-15
81. GitHub: 54yyyu/zotero-mcp — https://github.com/54yyyu/zotero-mcp — accessed 2026-10-15
82. Readwise pricing — https://readwise.io/pricing — accessed 2026-10-15
83. Kagi pricing — https://kagi.com/pricing — accessed 2026-10-15
84. Kagi Help: Lenses — https://help.kagi.com/kagi/features/lenses.html — accessed 2026-10-15
85. Exa pricing — https://exa.ai/pricing — accessed 2026-10-15
86. Exa API docs: Search — https://exa.ai/docs/reference/search — accessed 2026-10-15
87. OpenAlex Help: Authentication — https://help.openalex.org/api/authentication/ — updated 2026-10-14
88. OpenAlex Help: Pricing — https://help.openalex.org/access/pricing/ — updated 2026-08-11
89. OpenAlex Help: Example costs — https://help.openalex.org/access/example-costs/ — accessed 2026-10-15
90. OpenAlex API live response headers (`x-ratelimit-limit-usd: 0.1`; 429 "Insufficient budget") — https://api.openalex.org/works?per_page=1 — observed 2026-10-15
91. Venkit et al., "DeepTRACE: Auditing Deep Research AI Systems…" — https://arxiv.org/abs/2509.04499 — 2025-09-02
92. Rao, Wong & Callison-Burch, "Detecting and Correcting Reference Hallucinations in Commercial LLMs and Deep Research Agents" — https://arxiv.org/html/2604.03173v1 — 2026-04-03
93. Walters & Wilder, "Fabrication and errors in the bibliographic citations generated by ChatGPT", *Sci Rep* 13:14045 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/ — 2023-09-07 (possibly stale)
94. Chelli et al., "Hallucination Rates and Reference Accuracy of ChatGPT and Bard for Systematic Reviews", *JMIR* 26:e53164 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11153973/ — 2024-05-22 (possibly stale)
95. Zhao et al., "LLM hallucinations in the wild: Large-scale evidence from non-existent citations" — https://arxiv.org/abs/2605.07723 — 2026-05-08
96. Phys.org: AI-generated fake citations flooding scientific literature — https://phys.org/news/2026-05-ai-generated-fake-citations-scientific.html — 2026-05-18
97. STAT: Lancet study finds steep rise in fraudulent citations — https://www.statnews.com/2026/05/07/lancet-study-finds-steep-rise-fraudulent-citations-academic-papers/ — 2026-05-07
98. Ajith et al., "LitSearch: A Retrieval Benchmark for Scientific Literature Search" — https://arxiv.org/abs/2407.18940 — 2024-07-10 (v2 2024-10-16; possibly stale)
99. He et al., "PaSa: An LLM Agent for Comprehensive Academic Paper Search" — https://arxiv.org/abs/2501.10120 — 2025-01-17 (v2 2025-05-27)
100. Hugging Face: Institutional Books 1.0 dataset card — https://huggingface.co/datasets/institutional/institutional-books-1.0 — accessed 2026-10-15
101. Cargnelutti et al., "Institutional Books 1.0" — https://arxiv.org/abs/2506.08300 — 2025-06-10
102. HTRC Analytics (closure notice) — https://analytics.hathitrust.org/ — accessed 2026-10-15
103. Wikipedia: Bartz v. Anthropic — https://en.wikipedia.org/wiki/Bartz_v._Anthropic — accessed 2026-10-15
104. Anthropic Copyright Settlement (official site) — https://www.anthropiccopyrightsettlement.com/ — accessed 2026-10-15
105. Open Textbook Library — https://open.umn.edu/opentextbooks — accessed 2026-10-15
106. Inciteful (301 → incitefulmed.com/academic/) — https://inciteful.xyz/ — checked 2026-10-15
107. OpenScholar demo (301 → asta.allen.ai) — https://openscilm.allen.ai/ — checked 2026-10-15
108. FutureHouse platform (301 → platform.edisonscientific.com) — https://platform.futurehouse.org/ — checked 2026-10-15

---

## Verification pass (independent)

**Date:** 2026-10-15. **Method:** each load-bearing claim was re-checked against its cited primary source by live fetch (WebFetch, or curl for redirects, headers, the Scholar Atom feed and raw pricing HTML). **Limitation:** the shared web-search budget was exhausted at the start of this pass, so the "search independently for newer information" step was limited to fetching other known primary pages directly: the settlement site, Wikipedia, CostBench, consensus.app/pricing, the Zotero changelog, GitHub and arXiv abstracts. Developments reported only in the news after these pages were last updated could have been missed.

| # | Claim | Verdict | Correction | Source |
|---|---|---|---|---|
| 1 | Elicit: Basic free; Pro $49/user/mo billed annually ($588), SR screens 5,000; Scale $169 ($2,028); Enterprise custom (40,000) | confirmed | – | https://elicit.com/pricing |
| 2 | Elicit searches 138M papers (Semantic Scholar, PubMed, OpenAlex); full text only for OA or subscribed papers via extension, else title + abstract | confirmed | – | https://support.elicit.com/en/articles/553025 |
| 3 | Lau & Golder (Sept 27, 2025): sensitivity 39.5% (25.5–69.2%) vs 94.5%; precision 41.8% vs 7.55% | confirmed | – | https://pmc.ncbi.nlm.nih.gov/articles/PMC12483133/ |
| 4 | Consensus plans (Sept 12, 2026): Free 10 Pro msgs / 3 Deep; Pro $20/mo or $144/yr (15 Deep, 500 API/MCP); Deep $65/mo or $540/yr (200 Deep, 2,000 API/MCP) | confirmed | consensus.app/pricing renders no prices server-side, so the help-center article is the only primary check | https://intercom.help/consensus-d118a252369c/en/articles/10087865-subscription-plans |
| 5 | Undermind Pro $16/mo annual; vendor benchmark 23 queries, judge reads abstracts, 85% top-20 recall at 10 min vs 47–50% (Claude Opus 5 in Claude Code, GPT-5.6 in Codex) | confirmed | The page also lists GPT-5.6 Luna (high) at 43%. The benchmark is vendor-run (the page says so) | https://www.undermind.ai/ ; https://www.undermind.ai/pricing |
| 6 | GPT-4o (no retrieval) 78–90% citation hallucination; OpenScholar (45M papers) matches experts; *Nature* Feb 4, 2026 | confirmed | – | https://www.washington.edu/news/2026/02/04/in-a-study-ai-model-openscholar-synthesizes-scientific-research-and-cites-sources-as-accurately-as-human-experts/ |
| 7 | 3–13% hallucinated URLs; DR 10.7% vs search LLMs 4.8%; Gemini 2.5 Pro DR 13.3%; urlhealth loop < 1% | confirmed | Per model: GPT-5.1 16.0→0.6%, Gemini 2.5 Pro 6.1→0.1%, Claude Sonnet 4.5 4.9→0.8% (6–79×) | https://arxiv.org/html/2604.03173v1 |
| 8 | PaperQA2 LitQA2: precision 85.2% vs 73.8% (p = 0.0036); accuracy 66.0% vs 67.7% (p = 0.66) | confirmed | – | https://arxiv.org/html/2409.13740v2 |
| 9 | PaperQA3 (Feb 18, 2026) multimodal, 150M+ papers and patents, ~20 free calls/day for academics; futurehouse 301 → edisonscientific; $70M seed Dec 18, 2025 | confirmed | 301 re-observed by curl | https://edisonscientific.com/news/edison-literature-agent ; https://siliconangle.com/2025/12/18/edison-scientific-raises-70m-build-autonomous-ai-scientists-research |
| 10 | Scholar Labs Nov 18, 2025 (limited); June 3, 2026 update made it available to all logged-in users, ~10x faster, 3x more papers, 10x more searches/day; Quick Read Aug 25, 2026 only for accessible papers | corrected (minor) | The June 3 post says Labs "is available for all logged in users" but does not say the update is what opened it. The updated version shipped in English first. All other figures confirmed from the Atom feed post bodies | https://scholar.googleblog.com/feeds/posts/default (Atom feed) |
| 11 | paperswithcode.com 302 → huggingface.co/papers/trending | confirmed | Re-observed by curl | https://paperswithcode.com/ |
| 12 | Asta launched Aug 26, 2025; Scientific Corpus Tool = free MCP extension of S2 API over 200M+ index; Asta v0 53.0% on AstaBench; OpenScholar demo → asta.allen.ai | confirmed | Ai2 notes Asta v0 is "an experimental agent not used in the production version". The openscilm 301 was re-observed | https://allenai.org/blog/asta |
| 13 | S2 API: 214M papers, 2.49B citations, 79M authors; intro key 1 RPS; Semantic Reader arXiv-only (250k+); TLDRs CS + biomed | confirmed | – | https://www.semanticscholar.org/product/api ; https://www.semanticscholar.org/faq |
| 14 | OpenAlex USD metering: free key $1/day; keyless $0.10/day; list $0.10/1k, search $1/1k, PDF $10/1k; annual from $5,000; PDF sync 50M+ | confirmed | Live header `x-ratelimit-limit-usd: 0.1` (429) re-observed. "Per IP" is an inference | https://help.openalex.org/access/example-costs/ ; https://help.openalex.org/access/pricing/ |
| 15 | NotebookLM → Gemini Notebook (Jul 16, 2026) with per-notebook cloud computer; 500k words/source; 50 / 300 / 600 sources | corrected (minor) | Code execution launched only for Google AI Ultra and eligible Workspace business customers, with Pro on the web "over the coming weeks". Ultra is 500 sources on the 20TB plan and 600 on the 30TB plan. Limits are from a secondary source (elephas.app, updated Sept 28, 2026); Google's post gives no limits | https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/ ; https://elephas.app/blog/notebooklm-free-vs-plus |
| 16 | HTRC Analytics ended Sept 30, 2026; accounts, Algorithms, Data Capsules discontinued | confirmed | – | https://analytics.hathitrust.org/ |
| 17 | Bartz v. Anthropic: fair use for lawfully acquired books (June 23, 2025); $1.5B settlement final approval July 20, 2026; first payments by Nov 15, 2026 | confirmed | The settlement site says the effective date has passed "assuming that no late-filed appeal is permitted to go forward". Wikipedia notes some opt-outs are suing separately | https://www.anthropiccopyrightsettlement.com/ ; https://en.wikipedia.org/wiki/Bartz_v._Anthropic |
| 18 | Zotero 8.0 (Jan 22), 9 (Apr 10, Read Aloud), 10 (Aug 17, PDF Reading Mode); latest 10.0.6 (Oct 7, 2026); 8.0 added `/fulltext`; zotero-mcp ~5.4k stars, 38 tools | confirmed | zotero-mcp had 5,404 stars on 2026-10-15. "38 tools" is the README's *default profile* | https://www.zotero.org/blog/ ; https://www.zotero.org/support/changelog ; https://www.zotero.org/support/8.0_changelog ; https://github.com/54yyyu/zotero-mcp |
| 19 | 146,932 hallucinated citations in 2025 (arXiv, bioRxiv, SSRN, PMC; 111M refs in 2.5M papers) | confirmed | The abstract calls it "a conservative estimate" | https://arxiv.org/abs/2605.07723 |
| 20 | Litmaps acquired ResearchRabbit May 7, 2025; Litmaps Pro $10/mo or $120/yr; RR+ $10/mo annual or $12.50 monthly | corrected | Litmaps Pro is $10/mo **billed annually** ($120/yr, academic email required) or **$12.50 billed monthly**: the page's JS sets "12.50" when "Monthly billing" is selected, and $120/yr is labeled "save 20%". RR+ prices and the "© Litmap Limited" footer are confirmed. The acquisition date is confirmed by trade press (IT Brief) only | https://www.litmaps.com/pricing ; https://www.researchrabbit.ai/pricing ; https://itbrief.news/story/litmaps-acquires-researchrabbit-raises-1-million-for-ai |
| x1 | Elicit pricing history (CostBench): $780 → $79 (Apr 2026) → $169 (June 16, 2026); a plan removed Sept 2026 | corrected | CostBench has tracked Elicit only since May 17, 2026. It logs a single repricing ($79 → $169/user/month between May 17 and June 16), plus renames Pro → Scale and Team → Enterprise. It shows 4 tiers in every snapshot. There is no $780 price, no April change and no September removal. Fixed in §2.1 and Surprises #11 | https://costbench.com/software/ai-research-tools/elicit/price-history/ |
| x2 | SciArena: o3 first, ahead of Claude Opus 4.1 / Gemini 3 Pro Preview; best judge o3 at 65.1%; demo retiring July 15, 2026 | confirmed | – | https://allenai.org/blog/sciarena |
| x3 | Lancet (Topaz et al.) via STAT: 2M+ papers, 97M citations, ~4,000 fabricated citations in ~2,800 papers; 1/2,828 → 1/458 → 1/277 | confirmed | – | https://www.statnews.com/2026/05/07/lancet-study-finds-steep-rise-fraudulent-citations-academic-papers/ |
| x4 | Orduña-Malea & Lopezosa, arXiv 2606.08301 (June 6, 2026), Asta citation instability | confirmed (paper exists; findings match abstract) | – | https://arxiv.org/abs/2606.08301 |
| x5 | Scholar Inbox: logistic regression, GTE-large, 5k random negatives, ~78 positive ratings per user, 800k ratings / 14.3k users, 1.1k-participant study | confirmed | The paper says "users have an average of 78 positive ratings" | https://www.cvlibs.net/publications/Flicke2025ACLSDT.pdf |
| x6 | Claude pricing: Pro $20 ($17 annual), Max from $100, Team $25/$125 per seat monthly; Research not on Free | confirmed | Team annual is $20/$100 per seat | https://claude.com/pricing |
| x7 | AstaBench (arXiv 2510.21652) at ICLR 2026, 2,400+ problems, 57 agents / 22 classes | confirmed | – | https://arxiv.org/abs/2510.21652 |
| x8 | Undermind whitepaper (Jan 5, 2024): arXiv full texts of 2.3M papers, GPT-4 classifier, exponential discovery curve | confirmed | – | https://www.undermind.ai/whitepaper.pdf |

**Other live re-checks (2026-10-15):**

- inciteful.xyz 301-redirects to incitefulmed.com/academic/.
- storm.genie.stanford.edu returned 200.
- arxiv-sanity-lite.com did not connect, consistent with "unreachable".
- scholar-inbox.com returned 200.
- These source URLs resolve (200): iacis.org (Acar & Floyd PDF), elicit.com blog posts, hyper.ai, tokencost.app, open.umn.edu.
