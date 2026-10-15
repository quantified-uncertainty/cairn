---
title: Generative Interfaces
description: What the evidence says about generating pages, interfaces and study material on the fly for research reading, from Google's Generative UI study, the MCP Apps and A2UI standards, generated encyclopedias (STORM, Grokipedia) and Wikipedia's ban on LLM-written articles, and the Learn Your Way RCT to measured citation, book-summary and long-context error rates. Includes October 2026 costs and latencies, a split between what to curate, precompute and generate, and a claim-level provenance design.
---

*Status: draft, October 2026. Prices and product statuses are as of 2026-10-15, when the pricing pages were re-checked. Claude prices match the wiki's [pricing reference](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/pricing-reference.md) except the disputed Sonnet 5.5 cache-read price (see [Prices](#prices)). Costs and latencies are my arithmetic from those prices and assumed token counts, not measurements. The faithfulness and long-context studies tested 2023–2025 models; I found no comparable 2026 results. NoCha figures beyond the paper are my computation from the leaderboard's data file. Grokipedia's post-launch timeline is secondary, and the status of Gemini's dynamic view and Learn Your Way is unverified. Sources: the [R07 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R07-generative-interfaces.md) and primary sources linked inline, the main ones re-checked on 2026-10-15.*

## The short version

- **People prefer generated interfaces. No one has shown they read more accurately with them.** In Google's Generative UI study, generated interactive pages beat markdown answers in 82.8% of pairwise comparisons. Pages built by human experts still won 50.0% of their comparisons against generated pages, which won 35.3%. Raters judged pre-cached pages on preference, not accuracy. Generation "can often take a minute or two" ([Leviathan et al. 2026](https://arxiv.org/abs/2604.09577)).
- **The standards constrain what the model generates.** In MCP Apps (the first official MCP extension, 2026-01-26), tools point at sandboxed HTML templates. In Google's A2UI, agents send declarative JSON that picks from a catalog of pre-approved components. For a literature explorer, the model should emit data and choose components, and free-form HTML belongs behind an explicit "build me a custom view" button [~85%].
- **Generated encyclopedias fail predictably.** STORM's articles were better organized than a retrieval baseline but no more verifiable (3.80 vs 3.85 on a 7-point scale), and an automatic check found about 15% of sentences unsupported by their citations. Grokipedia copied Wikipedia, cited low-credibility sites, and let machine edits outnumber human ones. English Wikipedia now prohibits using LLMs to generate or rewrite article content ([WP:LLM](https://en.wikipedia.org/wiki/Wikipedia:LLM), March 2026 RfC).
- **The learning evidence is one small RCT.** In Learn Your Way, 60 students aged 15–18 studied one textbook topic with the tool or a PDF reader. On a retention test 3–5 days later they scored 78% vs 67%. Extra embedded quizzes could explain part of the gain.
- **The main errors are misattribution and omission, not fabrication.** With retrieval, invented references are rare and mechanically catchable. Real sources cited for claims they do not support are common: citation accuracy was 40–80% across deep-research systems ([DeepTRACE](https://arxiv.org/abs/2509.04499)). The best 2024 summaries of novels had 90.9% of claims judged faithful and over-weighted the ending; the best LLM judge caught unfaithful claims at F1 = 58.2 ([FABLES](https://arxiv.org/abs/2404.01261)). On NoCha's novel-reading claim pairs, the best leaderboard model (gpt-5, mid-2025) gets 68.5%, where chance is 25%.
- **Generation is cheap; checking and per-reader duplication cost money.** A chapter explainer costs about \$0.11 on Claude Sonnet 5.5. Batch summaries of 10,000 books cost about \$440 on Haiku 5.5 (about \$100 if each request stays under 100K tokens) and \$3,500 on Opus 5.5. In FABLES, a human check cost about \$40 per summary, as much as about 60 Opus 5.5 book summaries.
- **Recommended split** [~85%]: curate whatever carries bibliographic or legal weight (references, rights status, quotes). Precompute and spot-check what many readers see. Generate per reader only what is personal. Show a reference only if it resolves to a catalog record and a quote only if it matches verbatim. Give every generated sentence a provenance type and a check status.

## Generated interfaces: what was built and measured

### Google's Generative UI study

Google launched two "generative interfaces" experiments in the Gemini app on 2025-11-18 ([Google blog](https://blog.google/products/gemini/gemini-3-gemini-app/)). *Visual layout* is a magazine-style view. In *dynamic view*, Gemini "design[s] and code[s] a custom user interface in real-time" for each prompt. Generative UI also reached Google Search's AI Mode for U.S. Pro and Ultra subscribers. I found no report on either experiment after late 2025, so their status as of October 2026 is unverified.

The research behind them is *Generative UI: LLMs are Effective UI Generators* (Leviathan, Valevski, Kalman and nine co-authors; [arXiv 2604.09577](https://arxiv.org/abs/2604.09577), v1 2026-02-24). The model writes HTML, CSS and JavaScript, helped by image and web search tools, a very long system prompt, and post-processors that repair common breakages. Two raters judged each pair of outputs on a 3-point preference scale, for 100 LMArena prompts (8 excluded) and a set of information-seeking prompts. "Generation time is not a factor in the evaluation and we show raters pre-cached results."

| Format (LMArena prompts) | Elo |
|---|---|
| Website built by a human expert (released as the PAGEN dataset) | 1800.3 |
| **Generative UI** (Gemini 3) | **1736.2** |
| Generative markdown (standard chatbot output) | 1437.7 |
| Top Google search result | 1352.2 |
| Generative plain text | 1173.7 |

- Generative UI beat markdown in 82.8% of comparisons (90.5% on the information-seeking set). Against expert pages it won 35.3%, lost 50.0% and tied 14.7%. The abstract's "at least comparable in 50% of cases" counts wins plus ties.
- The system prompt mattered: full prompt 1553 Elo, minimal prompt 1496, prompt without its "core philosophy" section 1451.
- **The capability is recent, at least for open-ended prompts.** On the LMArena set, Gemini 2.0 Flash-Lite produced broken output 60% of the time and 2.0 Flash 29%; Gemini 2.5 Flash, 2.5 Pro and 3 produced none. On the information-seeking set the older models erred far less (0–1%).
- **Stated limitations:** "slow generation speed, which can often take a minute or two". Streaming cuts the wait "by about a half". Google's blog adds "there are occasional inaccuracies in the outputs" ([Google Research](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/)).

**What it does not show** [I]. No rater checked facts, so the study cannot say whether readers learn more or are misled more. An attractive page with more errors would still win. A 1–2 minute wait rules the approach out for browsing. It fits a "make me a study page for this chapter" action that is generated once and cached.

### Shipped experiments and products

| Product | What is generated | Status (October 2026) | Lesson [I] |
|---|---|---|---|
| [Imagine with Claude](https://www.anthropic.com/news/claude-sonnet-4-5) | The whole application at the moment of use: "No functionality is predetermined" | Research preview for Max subscribers for five days from 2025-09-29. I found no sign it became a product, and expect it did not [~80%] | Generating the whole app is still a demo |
| [Claude artifacts](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) with AI calls | Pages that call Claude from JavaScript; usage "counts against each person's own plan limits" | Available. Persistent storage up to 20 MB per artifact (text only). Artifacts can use viewers' connected apps, except tools that need per-action approval | The builder pays for no inference, so publishing a free tool is affordable. Open Stacks' prototypes use this with precomputed fallbacks ([Prototype Gallery](/building/prototype-gallery/)) |
| [Websim](https://websim.com/) | Began as an "imagined internet" of generated pages | Live on 2026-10-15, now "Create games and apps for free". Shutdown rumors trace to a user page and a competitor's satire | Generated look-alike pages drift to games. A fabricated page that looks real is play in a toy and a liability in research |
| [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6) (2025-12-22) | Typed tool calls rendered as developer-built React components | Recommended path; the older `streamUI` route is "currently experimental" | Practice moved from model-written UI to model-chosen components |

## The standards that emerged

Between November 2025 and January 2026, generated UI inside chat clients got cross-vendor standards (status as of October 2026):

| Standard | What the agent sends | Rendering and trust | Status | Source |
|---|---|---|---|---|
| **MCP Apps** (SEP-1865) | Tool metadata (`_meta.ui.resourceUri`) pointing at a `ui://` resource of bundled HTML/JS | Sandboxed iframe, JSON-RPC over `postMessage`. Hosts can prefetch and review templates and require approval for UI-initiated tool calls; servers "should provide text-only fallback" | Proposed 2025-11-21 by MCP core maintainers at OpenAI and Anthropic with the MCP-UI creators, absorbing MCP-UI. First official MCP extension on 2026-01-26: Claude, Goose and VS Code Insiders at launch, ChatGPT "starting this week" | [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/); [proposal](https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/) |
| OpenAI Apps SDK | An MCP server plus a UI component | iframe in ChatGPT; app review | Submissions opened 2025-12-17 [S]. OpenAI's developer site now presents "Plugins" (skills, MCP servers and "optional UI"); how they relate is unclear | [developers.openai.com](https://developers.openai.com/apps-sdk) |
| **A2UI** (Google) | Declarative JSON naming components from a client-side catalog; no executable code | Native widgets (Lit, Angular, Flutter); "safe like data, but expressive like code"; inherits host styling and accessibility | Announced 2025-12-15. Repo: v0.9.1 in production, v1.0 a release candidate, status "Early stage public preview"; Apache-2.0 | [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/); [GitHub](https://github.com/google/A2UI) |
| **AI SDK typed tool parts** | Tool calls; message parts such as `tool-displayWeather` with `input-available`, `output-available` and `output-error` states | Developer-written React components | AI SDK 6 | [ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces) |

They rest on three architectures. Output sizes and latencies are my estimates.

| Architecture | Examples | Model output per view | Latency | Safety and caching | Use it for |
|---|---|---|---|---|---|
| **Free-form code** | Gemini dynamic view, artifacts | 10k–15k+ tokens of HTML/CSS/JS | 1–2 minutes (Google's figure) | Needs a sandbox; pages can break; cacheable per prompt only | Explicit "build me a custom view" requests, run in the background |
| **Declarative composition** | A2UI | Hundreds of tokens of JSON | Seconds | Data, not code; templates are static and the JSON is small and cacheable | Lenses: timeline, argument map, comparison table, reading path |
| **Fixed component per tool** | AI SDK tool parts, MCP Apps templates | Tool arguments only | Tool time plus about a second | Developer code only; the MCP Apps proposal says the template/data split enables "better caching" | Book cards, quote finders, availability routing |

**Decision** [~85%]. Build a literature explorer on the second and third architectures: the model fills a component schema from cached, checked data (claim indices, catalog records, passages). Keep free-form generation as a labeled, unchecked escape hatch. To put the explorer inside the chat clients researchers already use, expose its views (book card, reading path, concept map, quote finder) as MCP tools with `ui://` templates. One server then renders in every MCP Apps host (at the January 2026 launch: Claude, Goose and VS Code Insiders, with ChatGPT rolling out). See [The Design Space](/building/design-space/) for where these lenses sit among other interface options.

## Generated encyclopedias and how they fail

### STORM and Co-STORM

STORM (Shao et al., NAACL 2024; [arXiv 2402.14207](https://arxiv.org/abs/2402.14207)) is the most carefully evaluated design for generated articles that I found. It discovers perspectives on a topic and simulates writers with those perspectives questioning a source-grounded "expert". It then builds an outline and writes with citations. Ten experienced Wikipedia editors rated 20 article pairs on a 1–7 scale. The system used gpt-3.5-turbo and gpt-4, so absolute numbers are stale.

| Criterion | Outline-driven RAG baseline | STORM | p |
|---|---|---|---|
| Organization | 3.25 | 4.00 | 0.005 |
| Coverage | 3.58 | 4.00 | 0.084 |
| Relevance | 3.93 | 4.15 | 0.347 |
| **Verifiability** | **3.85** | **3.80** | 0.843 |

- The headline "+25% organized, +10% broader" is the gain in the share of articles rated 4 or higher: 70.0% vs 45.0% for organization and 67.5% vs 57.5% for coverage ([full text](https://arxiv.org/html/2402.14207v2)).
- An automatic entailment check (Mistral 7B) found about 15% of sentences unsupported by their citations. In the authors' manual review of those sentences, the most common cause was "improper inferential linking": two true, cited facts joined by a connection neither source makes.
- [Co-STORM](https://arxiv.org/abs/2408.15232) (EMNLP 2024) lets the user steer a panel of LLM agents that maintain a shared mind map. In its user study, 70% of participants preferred it to a search engine and 78% to a RAG chatbot.

**Takeaway** [I]. Process structure improves organization, not verifiability. For exploration, Co-STORM's "steer a panel, keep a living map" fits better than a static article.

### Grokipedia

xAI's Grokipedia is the large-scale case study. The timeline follows [Wikipedia's synthesis](https://en.wikipedia.org/wiki/Grokipedia) of press reports (fetched 2026-10-15), so everything after launch is secondary [S]:

- **2025-10-27:** v0.1 launches with 885,279 articles (PolitiFact's count). Users can suggest changes but not edit.
- **December 2025:** AI-generated suggestions overtake human ones (a Tow Center analysis). Later they are more than three-quarters of proposed changes.
- **Early 2026:** more than 5.6M articles. **February:** the Wikipedia community deprecates it as a source.
- **March–April 2026:** a rewrite on 2026-03-14 mislabels some accepted edits as rejected. Implementation of suggestions, then autonomous editing, stops, and the site is "effectively frozen". **2026-09-30:** v0.3 ships after autonomous updating resumes.

Measured problems:

- **Copying and stripped citations.** PolitiFact found the "Monday" article was a 96% Copyscape match to Wikipedia's, cited only Wikipedia, and dropped its 22 references. It also found a wrong book chapter cited for Clausewitz, Instagram reels used as sources, and unsupported added claims ([Poynter, 2025-11-13](https://www.poynter.org/fact-checking/2025/grokipedia-wikipedia-copy-ai-errors/)).
- **Low-credibility sources:** "dozens of citations to sites like Stormfront and Infowars" (Triedman and Mantzarlis, [arXiv 2511.09685](https://arxiv.org/abs/2511.09685)).
- **Selective divergence.** In about 18,000 paired articles, 66% were "more extensively rewritten": longer, more complex, with fewer references. Overall political leaning was similar. On religion, history, literature and art, Grokipedia cited more right-leaning sources (Mohammadi, Yasseri et al., *PNAS*, May 2026; checked via the [TCD release](https://www.tcd.ie/news_events/articles/2026/grokipedia-research/), since the paper is paywalled).
- **Circular sourcing.** In January 2026, *The Guardian* reported GPT-5.2 citing Grokipedia. *The Verge* reported Google's AI Overviews, Gemini, Copilot and Perplexity using it for some queries [S].

### EndlessWiki: generate once, serve to everyone

[EndlessWiki](https://www.seangoedecke.com/endless-wiki/) (2025-09-25) generates a page with Kimi K2 on Groq when someone first clicks a link to it, in "only a few hundred ms". It stores the page and serves it to everyone afterwards; a later edit to the post reports more than 62,000 pages. Links carry an `origin` parameter that the server checks, so typed URLs cannot trigger generation. Costs still rose: one heavy user ran up inference bills, and commenters suspected crawlers. Lessons [I]:

- Fast inference makes generation on navigation feel native.
- A write-through cache is the basic economics.
- Generated link graphs need rate limits and per-user cost attribution.

### Wikipedia's response

- **[WP:LLM](https://en.wikipedia.org/wiki/Wikipedia:LLM)** has been a content guideline since a March 2026 RfC: "The use of large language models (LLMs) to generate or rewrite article content is strictly prohibited." The exceptions are human-reviewed corrections to one's own writing (spelling and grammar level) and LLM-assisted translation. Persistent violators are blocked, on "evidence beyond basic stylistic or linguistic indications".
- **[WikiProject AI Cleanup](https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup)** (from December 2023) uses speedy-deletion criterion G15 for pages "clearly entirely LLM-generated". One hoax article, created in January 2023, passed Articles for Creation and was exposed as fictional only in December 2023.
- **[Simple Article Summaries](https://www.mediawiki.org/wiki/Reading/Web/Content_Discovery_Experiments/Simple_Article_Summaries).** In a December 2024 browser-extension test, readers opened pre-generated summaries on 8.09% of pageviews where they were shown. Of 101 respondents, 75.2% found them useful. A usability study (n = 8) found readers unsure whether the summary was part of the article. *TechCrunch* [reported on 2025-06-11](https://techcrunch.com/2025/06/11/wikipedia-pauses-ai-generated-summaries-pilot-after-editors-protest/) that the planned mobile pilot was paused after editors objected [S]. The project page, last edited in February 2026, records no pause.

The largest human-curated reference work has judged generated prose a net cost to it. For a personal tool: never push generated text into Wikipedia, and expect generated pages to be distrusted unless they show how each claim was checked.

### Failure modes and mitigations

| Failure mode | Evidence | Mitigation [I] |
|---|---|---|
| Copying a source and stripping its citations | Grokipedia "Monday": 96% match, 22 references dropped | Show the source alongside; keep its references |
| Unsupported links between true facts | STORM: ~15% unsupported sentences | Label synthesized claims; show every span they join |
| Low-credibility citations | Grokipedia: Stormfront, Infowars | Ground only in a curated corpus (open books, papers, the reader's library) |
| Selective rewriting on contested topics | PNAS 2026 | Show perspectives side by side with sources |
| Machine-only edit loops | AI suggestions over three-quarters of edits; months frozen | A human in the loop for anything shared; edit history; version stamps |
| Circular sourcing into other AIs | Assistants citing Grokipedia [S] | `noindex` and machine-readable provenance on generated pages |
| Cost blow-ups from crawlers and heavy users | EndlessWiki | Generate once and share; rate-limit; require sign-in to trigger generation |
| Readers mistaking a summary for the source | Wikimedia usability study | Distinct container; "AI-generated" label with model and date |

## Learning tools

### Learn Your Way: the one RCT

Google's [Learn Your Way](https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/) (2025-09-16) re-levels textbook material to a chosen grade "while keeping its scope". It swaps in examples tied to the learner's interests. It then generates immersive text with embedded questions, quizzes, narrated slides, an audio "lesson", mind maps and timelines.

- **Design:** 60 Chicago-area students aged 15–18 with similar reading levels had up to 40 minutes to learn about adolescent brain development from a textbook. They were randomized to Learn Your Way or a PDF reader.
- **Results:** about 9% higher on an immediate quiz. On a retention test 3–5 days later they scored 78% vs 67% (the blog calls this both "11 percentage points" and "11% higher"). 93% vs 67% wanted to use the tool again.
- **Publication:** Heldreth et al., [arXiv 2509.18664](https://arxiv.org/abs/2509.18664), in *Frontiers in Artificial Intelligence* 9:1783117 (2026). The abstract reports no effect sizes or p-values.
- Three pedagogy experts rated outputs from ten OpenStax textbooks. Average ratings were 0.85 or higher on every criterion, including accuracy (scale unstated).

**How much to update** [I]. The treatment bundled re-leveling, personalized examples and more practice items. Practice testing is among the best-supported learning techniques (see [Reading Interfaces](/interfaces/reading-interfaces/)), so the embedded quizzes alone could explain part of the gain, and novelty effects are likely. A well-designed generated study view probably improves retention over a static PDF for novices [~60%]; for experts, whose bottleneck is selection and synthesis, I am much less confident. The study a builder needs compares a generated view with the same text plus the same number of quiz items. I found none. Google describes Learn Your Way as a Labs experiment that starts from a textbook PDF; I could not verify whether it accepts user uploads as of October 2026.

### Gemini Notebook (formerly NotebookLM)

NotebookLM was renamed **Gemini Notebook** on 2026-07-16, when Google reported more than 30 million users and 600,000 organizations ([Google blog](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)). Each notebook gained a "secure cloud computer" in which Gemini writes and runs code on the user's sources, first for AI Ultra and Workspace customers, then Pro users. It is the reference product for "bring your sources, get study artifacts": Audio Overviews (with Brief, Critique and Debate formats), narrated-slide Video Overviews (from [2025-07-29](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/)), mind maps, reports, flashcards and quizzes whose "explain" option cites the source, and ready-made OpenStax textbook notebooks (from [2025-09-08](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/)).

**Copy** its strict grounding, inline citations, many formats from one source set, and curated open-textbook starters. **Its gaps for a literature explorer** [I]: notebooks are silos with no library-wide graph; sources per notebook are capped (third-party guides disagree on the numbers); and audio and video carry no claim-level provenance, so you cannot click from a spoken sentence to its passage. A 2026 critique summarized on [Wikipedia](https://en.wikipedia.org/wiki/NotebookLM) argues that Audio Overviews flatten sources into one format [S].

### Other tools and cautionary cases

| Tool or case | What happened | Source |
|---|---|---|
| Google Illuminate | A Labs experiment (May 2026) that turns arXiv-style papers or public URLs into 5–8 minute two-host audio with a synced transcript. The transcript links to the audio, not to the paper's passages | [MakeUseOf](https://www.makeuseof.com/notebooklm-alternative-illuminate-better-research-tool/) [S] |
| Cosmopedia (2024) | 30M+ synthetic textbooks and articles (~25B tokens) from Mixtral, built to train models; the authors acknowledge hallucinations. An infinite textbook library is cheap; an accurate one is not | [Hugging Face](https://huggingface.co/blog/cosmopedia) |
| *Mastering Machine Learning* (Springer Nature, 2025, \$169) | Of 18 of its 46 citations that were checked, about two-thirds did not exist or had substantial errors | [Retraction Watch](https://retractionwatch.com/2025/06/30/springer-nature-book-on-machine-learning-is-full-of-made-up-citations/) |
| *Chicago Sun-Times* insert (2025-05-18) | An AI-generated summer reading list "included nonexistent books and made-up quotes"; the writer said he used AI and did not fact-check | [Wikipedia](https://en.wikipedia.org/wiki/Chicago_Sun-Times) [S] |

**Re-leveling has thin evidence** [I]. Apart from the n = 60 RCT, I found no rigorous test of whether level-adapted summaries of books or papers keep the important claims. Simplification predictably drops hedges, qualifications and minority positions. A reading-level slider should therefore come with a *loss ledger* (below).

## The risk evidence

### Citations: fabrication is catchable, misattribution is not

| Study or event | Date | Setting | Finding |
|---|---|---|---|
| [Walters & Wilder](https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/) | 2023-09 | ChatGPT literature reviews, no retrieval | 55% of GPT-3.5 and 18% of GPT-4 citations fabricated; 43% and 24% of the real ones had substantive errors (stale models) |
| [Tow Center / CJR](https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php) | 2025-03 | 8 AI search engines, 1,600 queries asking for the news article behind an excerpt | More than 60% answered incorrectly; Perplexity 37%, Grok 3 94% |
| [DeepTRACE](https://arxiv.org/abs/2509.04499) | 2025-09 | Deep-research and search modes (GPT-4.5/5, Perplexity, Copilot, Gemini, You.com) | Citation accuracy 40–80%; "highly one-sided" on debate questions (LLM judge validated against humans) |
| STORM | 2024 | Generated encyclopedia articles | ~15% of sentences unsupported by their citations (automatic check) |
| [GPTZero](https://gptzero.me/news/neurips/) | 2026-01 | 4,841 NeurIPS 2025 accepted papers | At least 100 human-confirmed hallucinated citations in 51–53 papers |
| [Charlotin database](https://www.damiencharlotin.com/hallucinations/) | 2026-10-15 | Court filings | 2,190 cases; overlapping tags: fabricated 1,796, misrepresented 926, false quotes 584 |

The pattern [~80%]: retrieval plus a resolution check nearly eliminates invented references ([AI Research Assistants](/finding/ai-research-assistants/) reports a 2026 study in which a URL-checking loop cut non-resolving links to under 1%). Fabrication still dominates where people paste from ungrounded chatbots, as the court-filing tags show. In grounded systems the dominant error is a real source cited for something it does not say, at roughly 15–60% depending on system and measure, and I found no study showing it falling. Anthropic's [Citations API](https://platform.claude.com/docs/en/build-with-claude/citations) returns `cited_text` with character, page or block locations and guarantees valid pointers into the supplied documents. A valid pointer proves the span exists. It does not prove the span supports the sentence.

### Book-length summaries

**FABLES** (Kim et al., COLM 2024; [arXiv 2404.01261](https://arxiv.org/abs/2404.01261)) used 26 books published in 2023–24, all but one of them fiction. Annotators who had already read a book judged five LLMs' summaries of it, 3,158 claims in all. Each annotator was paid \$200 for about 11 hours of work on one book: about \$40 per summary, \$5.2K in total.

| Model (2024) | Faithful | Unfaithful | Partial support |
|---|---|---|---|
| Claude 3 Opus | 90.89% | 2.10% | 6.65% |
| GPT-4 | 78.15% | 4.55% | 15.98% |
| GPT-3.5-Turbo | 71.52% | 11.26% | 13.08% |
| Mixtral | 68.67% | 11.47% | 17.20% |

- Most unfaithful claims concern events and character states and take indirect reasoning to detect.
- Omissions follow a pattern: "a systematic over-emphasis on events occurring towards the end of the book".
- **Automatic checking failed:** the best LLM rater, Claude 3 Opus with the whole book, reached F1 = 58.2 on unfaithful claims.
- [BooookScore](https://arxiv.org/abs/2310.00785) (ICLR 2024) found eight types of coherence error in GPT-4 summaries of 100 books. Hierarchical merging was more coherent than incremental updating, which kept more detail.

**Implication** [I]. On 2024 evidence from fiction, treat a generated book summary as about 90% faithful at best, with omissions the reader cannot see. I expect the best 2026 models to leave fewer than half of Claude 3 Opus's 9.1% of claims not judged faithful [~70%]. No one has published a rerun, though, and omission and framing errors escape faithfulness metrics entirely.

### Long-context reading

| Benchmark | What it tests | Headline |
|---|---|---|
| **NoCha** ([Karpinska et al., EMNLP 2024](https://arxiv.org/abs/2406.16264)) | Minimally different true/false claim pairs about recent novels; a pair counts only if both claims are right (chance 25%) | Best model in the paper, GPT-4o: 55.8% of pairs. Humans verified individual claims with 97.4% accuracy (152 claims; claim-level, so not directly comparable) |
| NoCha [leaderboard](https://novelchallenge.github.io/), last updated 2025-07-18 (my computation from its data file) | 1,164 pairs, including 164 added in November 2024; ranked, as the leaderboard does, by accuracy on attempted pairs | gpt-5 68.5% (775 of 1,132 attempted); o3 67.8%; o1-preview 67.4% (481 attempted); Gemini 2.5 Pro 64.2%; GPT-4.1 61.5%. No 2026 models, and no Claude model newer than Claude 3.5 Sonnet (October 2024) |
| [NoLiMa](https://arxiv.org/abs/2502.05167) (ICML 2025) | Retrieval when question and answer share few words | At 32K tokens, 11 of 13 models fell below half their short-context score; GPT-4o went from 99.3% to 69.7% |
| [Context Rot](https://www.trychroma.com/research/context-rot) (Chroma, July 2025) | 18 models, controlled tasks of growing length | Performance falls with length alone; **shuffled haystacks scored better than coherent ones** |
| [Vectara leaderboard](https://github.com/vectara/hallucination-leaderboard) (2026-09-22) | Hallucination in short-document summaries | Frontier models 7–14% (claude-opus-4-7 12.0%, gpt-5.5 9.3%). Judge- and dataset-dependent; not a guide to book reading |

**Whole book or retrieval?** The NoCha data include a simple retrieval baseline: BM25 picks the top 25 chunks and GPT-4o answers. Full-context GPT-4o (August 2024) attempted 723 pairs. On those pairs, retrieval got 292 right (40.4%) against 402 (55.6%) with the whole book (my computation from the leaderboard data). BM25 is a weak retriever, so this is a floor for retrieval, not a verdict. Three findings generalize [~75%]:

- Global reasoning over a book is harder than lookup.
- Long inputs degrade quality even when they fit.
- Models' explanations are less reliable than their labels.

The practical design is a hybrid: the whole book in a cached prompt, plus retrieved and highlighted passages, plus section-level checks.

### Three kinds of error

| Error | Frequency in grounded systems | Machine-detectable? | Check |
|---|---|---|---|
| **Fabrication** (invented work, case or quote) | Low with retrieval; 18–55% without it (2023) | Yes: resolve against catalogs; match quotes verbatim | Hard gate before display |
| **Misattribution and unsupported inference** | Common: ~15% of sentences (STORM, automatic check) to 20–60% of citations (DeepTRACE) | Partly: entailment models triage; LLM judges are unreliable | Show the span; label the check; sample for human review |
| **Omission and framing** | Systematic (FABLES end bias; Grokipedia's divergence) | Mostly no | Coverage strip, loss ledger, side-by-side perspectives |

The first row is an engineering problem with a known solution. Design the interface around the second and third.

## Costs and latency at October 2026 prices

### Prices

USD per million tokens (MTok), from the providers' pricing pages on 2026-10-15. All three providers offer asynchronous batch processing at 50% of standard prices.

| Model | Input | Output | Cache read | Batch in / out | Source |
|---|---|---|---|---|---|
| Claude Fable 5.1 | \$10 | \$50 | \$0.25 | \$5 / \$25 | [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Opus 5.5 | \$4 | \$20 | \$0.20 (0.05×) | \$2 / \$10 | same |
| Claude Sonnet 5.5 | \$2 | \$10 | \$0.10 (0.05×); disputed, see below | \$1 / \$5 | same |
| Claude Haiku 5.5, prompt up to 100K tokens | \$0.10 | \$0.50 | \$0.01 | \$0.05 / \$0.25 | same |
| Claude Haiku 5.5, prompt over 100K tokens | \$0.50 | \$2.50 | \$0.05 | \$0.25 / \$1.25 | same |
| Gemini 3.1 Flash-Lite | \$0.25 | \$1.50 | \$0.025 | \$0.125 / \$0.75 | [Google](https://ai.google.dev/gemini-api/docs/pricing) |
| gpt-6-luna, input up to 272K tokens | \$0.10 | \$0.50 | \$0.01 | \$0.05 / \$0.25 | [OpenAI](https://developers.openai.com/api/docs/pricing) |

- **Sonnet 5.5 cache reads are disputed.** Anthropic's pricing page listed \$0.10 (0.05×) on 2026-10-15, as the R07 and R10 dossiers also recorded; the wiki's pricing reference (cached 2026-10-06) says \$0.20 (0.1×). This page uses the live \$0.10 [~85%], as does the lean in [Costs and Effort](/building/costs-and-effort/). At \$0.20 the cached Sonnet rows below rise by at most \$0.015.
- Claude cache writes cost 1.25× input with a 5-minute TTL and 2× with a 1-hour TTL. Haiku 5.5's higher tier applies to the whole request once its prompt, counting cache reads and writes, passes 100K tokens.
- Claude 4.7 and later models use a tokenizer that produces about 30% more tokens for the same text (the model reference gives 1.0–1.35×): multiply Claude rows by up to 1.35. Thinking tokens bill as output, and Opus 5.5 cannot turn thinking off (see [Costs and Effort](/building/costs-and-effort/)); add 20–100% to output cost for hard reasoning [I].

### Worked examples

Token counts are my assumptions; totals are my arithmetic.

| Task | Tokens in / out | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Gemini 3.1 Flash-Lite | gpt-6-luna |
|---|---|---|---|---|---|---|
| Chapter explainer, uncached | 33k / 4k | \$0.21 | \$0.11 | \$0.005 | \$0.014 | \$0.005 |
| Same, chapter cached | 33k cached / 4k | \$0.087 | \$0.043 | \$0.002 | — | — |
| Declarative lens (claim index to component JSON) | 8k / 0.5k | \$0.042 | \$0.021 | \$0.001 | \$0.003 | \$0.001 |
| Free-form generative-UI page | 10k / 15k | \$0.34 | \$0.17 | \$0.009 | \$0.025 | \$0.009 |
| RAG question | 10k / 0.5k | \$0.05 | \$0.025 | \$0.001 | \$0.003 | \$0.001 |
| Question against a whole cached book | 150k cached + 0.2k / 0.5k | \$0.041 (cache write \$0.75) | \$0.020 (write \$0.38) | \$0.009 (write \$0.09) | — | — |
| Whole-book summary | 150k / 5k | \$0.70 | \$0.35 | \$0.09 (over-100K tier) | \$0.045 | \$0.018 |
| Summaries for 10,000 books, batch | 1.5B / 50M | \$3,500 | \$1,750 | \$440 | \$225 | \$90 |

Fable 5.1 costs 2.5× Opus 5.5 on every uncached row (\$8,750 for the 10,000-book batch).

**What the numbers imply** [I]:

1. **For one researcher, generation is not a budget item.** A hundred questions a day against a cached book on Sonnet 5.5 cost about \$2. Add \$0.38 each time the book is written to cache: each hit resets the 5-minute TTL, and a 1-hour write costs \$0.60. Twenty Opus 5.5 chapter explainers cost about \$4. Spend the effort on the reference gate and provenance display, not on cost.
2. **For a shared tool, multiply by readers.** Suppose 1,000 readers each generate explainers for a 20-chapter book on Sonnet 5.5. That is 20,000 × \$0.11 = \$2,200. Generating once and serving the cached copy costs \$2.20 plus checking.
3. **Keep Haiku 5.5 requests under 100K tokens.** The long-prompt tier charges 5× for the whole request. Two chunks plus a merge pass cost about \$0.02 per book at standard prices, or about \$100 per 10,000 books in batch, against \$440.
4. **Once a book is cached, a whole-book question costs less than an uncached 10k-token RAG question** on Opus 5.5 (\$0.041 vs \$0.05) and Sonnet 5.5 (\$0.020 vs \$0.025), before thinking tokens. On Haiku 5.5, retrieval stays about 7× cheaper (\$0.0013 vs \$0.0089) because a whole book crosses the long-prompt tier. If the NoCha pattern holds for current models, send global questions ("how does the author's view of X change?") to the whole cached book and lookups to retrieval.
5. **Verification costs more than generation.** Checking one summary FABLES-style (about \$40) costs as much as about 60 standard-price Opus 5.5 book summaries or 900 Haiku 5.5 batch summaries. It also needs a reader who already knows the book. Generate once, check once, serve many times.

### Latency

Google's free-form pages take "a minute or two"; EndlessWiki's short pages on Groq took "a few hundred ms". Output time is roughly output tokens divided by throughput. I assume 50–150 tokens per second for frontier models; I could not verify current speeds [I]. At those speeds, before thinking time:

- a 500-token lens takes 3–10 seconds;
- a 4k-token explainer takes 27–80 seconds;
- a 15k-token HTML page takes about 2–5 minutes.

Anything that blocks a click should produce under about 1k output tokens, stream, or be precomputed. Batch jobs are asynchronous. Anthropic says most batches finish within an hour, and requests not processed within 24 hours expire unbilled ([docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)).

### Caching

- **Provider caching.** With a 5-minute TTL, two uses of a prefix already beat no caching on Claude (1.25 + 0.05 or 0.1, against 2). Put the book and system prompt first and the question last. Gemini caches implicitly on 2.5 and newer models above minimum prefix lengths ([docs](https://ai.google.dev/gemini-api/docs/caching)).
- **Application caching matters more.** Store each artifact under hash(source text version, prompt version, model ID, reading level, output type), with its provenance and review status. Anyone asking for the same thing gets the stored copy. This is EndlessWiki's write-through pattern with versioning.
- **Template/data split.** As in MCP Apps, generate data (claims, quotes, structure) per request; keep presentation in static templates.
- **Two-speed prefetch.** While the reader is on a page, a small model (Haiku 5.5 or gpt-6-luna, under a cent per item) prefetches explainers for the next pages. If the reader stays, a strong model regenerates in the background and shows the diff.
- **Regenerate on model upgrades.** Store model and date with every artifact, and batch-regenerate the most-viewed ones when a better model ships.

## What to curate, precompute, or generate

The split follows from the error evidence. Curate what fails mechanically and damagingly, precompute what many people see, and generate what is personal. Costs are from the tables above.

| Layer | Examples | Produced by | Checked by | Cost (Oct 2026) |
|---|---|---|---|---|
| **Curate, or take from an authoritative source** | Bibliographic records and identifiers; rights and license status; verbatim quotes and canonical text; expert reading lists; subject taxonomies | Catalogs ([Open Library](https://openlibrary.org/), [Crossref](https://www.crossref.org/), [OpenAlex](https://openalex.org/)), publishers, librarians, the reader | The source itself | Free data plus your hours |
| **Precompute, cache, spot-check** | Book and chapter summaries at 2–3 levels; claim indices with source spans; concept graphs; glossaries; quiz banks; NoCha-style claim pairs for self-testing | Batch API with a strong model, then automatic resolution, verbatim and entailment checks | Humans on a random sample and on anything heavily used | \$90–\$3,500 per 10,000 books for summaries |
| **Generate per reader** | Grounded answers; re-leveling for one reader; comparisons across chosen works; lenses from a component catalog; links from the reader's notes into the library | Fast models for drafts, strong models on request | Automatic gates only; labeled unchecked | \$0.001–\$0.35 per item |
| **Never generate** | References without catalog resolution; quotes that do not match verbatim; numbers without a source span; claims about rights or availability | — | — | — |

The "never" row lists exactly the documented failures: the Springer book, the Sun-Times list, Grokipedia and the court filings. Rights errors also carry legal risk (see [The Legal Map](/building/legal-map/)).

**Generate, then promote** [I]. When N readers have asked for the same on-the-fly artifact ("explain chapter 3 for a novice"), it enters a review queue; after human review it joins the shared, versioned layer with edit history. That is EndlessWiki's economics with Wikipedia-style review, without Grokipedia's machine-only loop.

### How many claims to spot-check

Standard binomial arithmetic turns "spot-check" into a sampling plan [I]:

- **Bounding a rate.** If n randomly sampled claims show no errors, the 95% upper bound on the error rate is about 3/n (the rule of three). 100 clean claims bound it below 3%, and 300 below 1%.
- **Estimating a rate** near 10% to within ±3 points at 95% takes about 1.96² × 0.1 × 0.9 / 0.03² ≈ 384 claims.
- **Span checks and whole-book checks cost very different amounts.** A span check asks whether the claim is supported by its cited passage. It takes minutes and catches misattribution. A whole-book check asks what the summary misread or left out, and it needs someone who has read the book. FABLES paid \$200 per book to check about 121 claims across five summaries (3,158 ÷ 26), about \$1.65 per claim, and recruited annotators who had already read their books. Run span checks on a random sample across the shelf, and whole-book checks only on books you will rely on.
- **Stratify** by artifact type and model, since error rates differ, and publish the resulting rates on the artifacts.

### Decision rules

- **Building for yourself:** generate on request with Sonnet 5.5 or Opus 5.5, cache by content hash, and put the effort into the reference gate and provenance labels. Expect a few dollars a day at most.
- **Building for many readers:** batch-precompute summaries and claim indices for the target shelf, audit them on a written sampling plan, and generate only personal artifacts live. The obstacle is reviewer time, not tokens.
- **Rich interactive views:** define a component catalog (book card, timeline, argument map, comparison table, coverage strip) and have the model emit A2UI-style JSON over checked data. Offer free-form HTML only on request, in the background, labeled unchecked.
- **A study tool today, without building:** use Gemini Notebook with your own sources or its OpenStax notebooks. Click through its citations. Treat Audio Overviews as a warm-up, since spoken claims carry no provenance.
- **Relying on a book summary for a decision:** read the passages behind the claims that matter. At 2024 faithfulness rates for fiction, a 120-claim summary from the best model contains around 10 claims that are unsupported or only partly supported.

## A provenance design

The goal: for every generated sentence, the reader can see where it came from and how it was checked, and no reference reaches the screen unless it points at a real catalog record. [I throughout, built on the evidence above]

### Claim-level labels

Each generated sentence carries exactly one provenance type:

| Type | Display | Required evidence | Gate |
|---|---|---|---|
| **Quoted**: verbatim from a source | Quotation marks and a locator; click opens the page | A span that matches after normalizing whitespace and quote marks | Hard: if the match fails, it is not shown as a quote |
| **Paraphrased**: restates one span | Dotted underline; hover shows the span | One span locator (Citations API `cited_text` or your own offsets) | Soft: the entailment result is shown |
| **Synthesized**: joins two or more spans | A distinct marker that opens all spans and a one-line statement of the inference | Every span, plus the stated link | Always labeled, since "improper inferential linking" was STORM's top error |
| **Model knowledge**: no span | Grey and visually distinct | None | Hidden by default for factual claims |

Each claim also shows how it was checked, from a fixed vocabulary:

- *unchecked*;
- *auto: span resolves*;
- *auto: entailment (model, score)*, shown as triage and never as a checkmark, given FABLES' F1 of 58.2;
- *two model families agree* (claims made by only one model are highlighted);
- *human: span-checked (date)*;
- *human: whole-book checked (date)*.

### Catalog-resolution gating for every displayed reference

Every reference from any model passes a resolver before display. The gate can be automated and catches the most damaging error.

1. **Constrain at generation.** The model may cite only identifiers already in its context (catalog record IDs, DOIs, arXiv IDs, ISBNs), emitted as structured output. Anything it "remembers" is a *suggestion* that must pass step 2.
2. **Resolve.** Resolve DOIs at Crossref, arXiv IDs at arXiv, ISBNs and works at Open Library, and title–author pairs through OpenAlex or Open Library search. Map each result to a record in your own catalog, which routes the reader to a readable copy ([The Access Ladder](/access/access-ladder/)).
3. **Compare metadata.** Check title similarity, the first author's surname, and a year within one. A real identifier attached to the wrong work fails.
4. **Match quotes.** If you hold the text, require a verbatim match. If not, show "quote unverified: text not available".
5. **Triage support** with an entailment check between claim and span, shown as a label.
6. **Display one of four states:**
   - resolved and span-checked;
   - resolved, support unchecked;
   - resolved with a metadata mismatch (warning);
   - unresolved (struck through, "could not verify", with a search link). An unresolved reference never looks like a citation.
7. **Log failures** per model and prompt version. That gives your own pipeline's fabrication rate, which is better evidence for you than any published one.

### Other displays

- **Coverage strip.** A thin bar across the book's chapters, shaded by how many summary claims each supplied. It exposes end-of-book bias at a glance. Clicking a gap asks what the summary skipped there.
- **Loss ledger.** Beside re-leveled text, the claims, hedges and qualifiers dropped at the simpler level, each linked to its original sentence.
- **Boundary and stamps.** A distinct container labeled "AI-generated" with model, prompt version, source hash and date, and a regeneration history with diffs.
- **Machine-readable labels.** `noindex` and provenance metadata, so other systems do not recycle generated pages as sources.
- **Calibration ledger.** Reader-flagged errors by artifact type and model, shown as rates (for example, "chapter summaries: 2.1 flagged errors per 100 claims, last 90 days"). Flags undercount true errors, so show the sampled audit rate beside them.

### A claim record

A minimal record that supports all of the above (identifiers are placeholders):

```yaml
claim_id: c-0412
artifact: summary/OL0000000W/chapter-07/level-expert
text: "The author argues that proper scoring rules make honest reporting optimal."
type: paraphrase            # quote | paraphrase | synthesis | model_knowledge
spans:
  - work: openlibrary:OL0000000W     # must resolve to a catalog record
    locator: { page: 212, chars: [1043, 1311] }
    source_hash: sha256:...
checks:
  - { kind: span_resolves, result: pass }
  - { kind: entailment, model: claude-haiku-5-5, score: 0.91, result: pass }
human_review: null          # or { kind: span | whole_book, date: ... }
generator: { model: claude-sonnet-5-5, prompt: chapter-gist-v3, date: 2026-10-15 }
```

[A Reference Architecture](/building/reference-architecture/) already labels every LLM-generated catalog field with model, prompt version, grounding level and date. This record extends that labeling from fields to individual sentences. The [Prototype Gallery](/building/prototype-gallery/) has working mockups.

## Open questions

- **How do 2026 frontier models score on NoCha and FABLES?** The NoCha leaderboard stopped at mid-2025 models, and FABLES used 2024 models. A FABLES-style rerun on 10 recent books would cost about \$2,000 in annotation at FABLES' rate, if annotators have already read the books.
- **Does a generated study view beat the same text with the same quizzes?** A three-arm RCT (PDF; PDF plus identical quizzes; full tool) would separate generated content from the testing effect that Learn Your Way's design confounds.
- **Can 2026 small models produce valid free-form HTML?** Rerunning the released PAGEN prompts on Haiku 5.5, Gemini 3.1 Flash-Lite and gpt-6-luna would show whether cheap models can serve the escape hatch.
- **How accurate are 2026 entailment checkers on book-summary claims?** The baseline is F1 = 58.2. Above roughly 85, the "auto-checked" label could carry real weight.
- **Does whole-book context beat modern retrieval on global questions for 2026 models?** The only head-to-head I found pits BM25 top-25 against GPT-4o (40.4% vs 55.6% of NoCha pairs). Hybrid retrieval with reranking would be the fair test.
- **What share of real errors do readers flag?** Seeding known errors into sample artifacts and counting flags would give the calibration ledger its multiplier.
- **What do re-leveled summaries lose?** Count the claims and hedges present at the expert level and absent at the novice level across, say, 50 open-textbook chapters.
- **Is Sonnet 5.5's cache-read price \$0.10 or \$0.20 per MTok?** Anthropic's page said \$0.10 on 2026-10-15; the wiki's pricing reference says \$0.20. Re-fetch the page and update the reference.
- **Are Gemini's dynamic view and Learn Your Way still live in October 2026, and does Learn Your Way accept uploads?**

## Related pages

- [Reading Interfaces](/interfaces/reading-interfaces/): hover cards, gist ladders and spaced repetition, and what generating those layers costs
- [Foraging and Exploratory Search](/interfaces/exploratory-search/): why misleading generated scent is costly
- [Maps of Knowledge](/interfaces/maps-of-knowledge/): overview displays a lens catalog can render
- [AI Research Assistants](/finding/ai-research-assistants/): citation accuracy of current products
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the records every displayed reference must resolve to
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): the human-curated layer
- [The Legal Map](/building/legal-map/): limits on processing and showing book text
- [A Reference Architecture](/building/reference-architecture/) and [Costs and Effort](/building/costs-and-effort/)
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/)
- [Cruxes](/start-here/cruxes/)
