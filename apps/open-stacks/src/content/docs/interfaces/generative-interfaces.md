---
title: Generative Interfaces
description: What the evidence says about generating content and UI on the fly for reading and research, from Google's Generative UI study, the MCP Apps and A2UI standards, generated encyclopedias (STORM, Grokipedia, Wikipedia's WP:LLM ban) and the Learn Your Way RCT, to citation, book-summary and long-context error rates. Includes costs and latency at October 2026 prices, a split between what to curate, precompute or generate, and a provenance design with claim-level labels and catalog-gated references.
---

*Status: draft, October 2026. Prices are as of 2026-10-15. Claude prices follow the wiki's [pricing reference](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/pricing-reference.md). Gemini and OpenAI prices come from the R07 dossier's fetches of their pricing pages on 2026-10-14/15. Every cost and latency figure is my arithmetic from those prices and assumed token counts, not a measurement. The generative-UI study measured preference, not accuracy. The faithfulness and long-context studies tested 2023–2025 models; I found no comparable 2026 results. The current status of Gemini's dynamic view, Learn Your Way, and parts of Grokipedia's timeline are unverified and flagged inline. NoCha leaderboard figures beyond the paper are my computation from the leaderboard's data file (fetched 2026-10-15). Sources: the [R07 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R07-generative-interfaces.md) and primary sources linked inline.*

## The short version

- **People prefer generated interfaces. No one has shown they read more accurately with them.** In Google's Generative UI study, generated interactive pages beat markdown answers in 82.8% of pairwise comparisons, but pages built by human experts still won 50.0% of theirs, against 35.3% for generated pages. Raters judged pre-cached pages on preference; accuracy was not measured; generation "can often take a minute or two" ([Leviathan et al. 2026](https://arxiv.org/abs/2604.09577)).
- **The standards constrain what the model generates.** MCP Apps (the first official MCP extension, 2026-01-26) has tools point at sandboxed HTML templates. Google's A2UI has agents send declarative JSON that picks from a catalog of pre-approved components. For a literature explorer, the model should emit data and choose components; free-form HTML belongs behind an explicit "build me a custom view" button. [I, high]
- **Generated encyclopedias fail predictably.** STORM's articles were better organized than a retrieval baseline but no more verifiable (3.80 vs 3.85 on a 7-point scale), with about 15% of sentences unsupported by their citations. Grokipedia copied Wikipedia, cited low-credibility sites, and let machine edits outnumber human ones. English Wikipedia now strictly prohibits using LLMs to generate or rewrite article content ([WP:LLM](https://en.wikipedia.org/wiki/Wikipedia:LLM), March 2026 RfC).
- **The learning evidence is one small RCT.** In Learn Your Way, 60 students aged 15–18 scored 78% vs 67% on a retention test 3–5 days after studying one chapter with the tool or a PDF reader. Extra embedded quizzes could explain part of the gain.
- **The main errors are misattribution and omission, not fabrication.** With retrieval, invented references are rare and mechanically catchable. Real sources cited for claims they do not support are common: 40–80% citation accuracy across deep-research systems ([DeepTRACE](https://arxiv.org/abs/2509.04499)). The best 2024 book summaries had 90.9% of claims judged faithful and over-weighted the ending, and the best LLM judge caught unfaithful claims at F1 = 58.2 ([FABLES](https://arxiv.org/abs/2404.01261)). On NoCha's novel-reading claim pairs, the best leaderboard model (gpt-5, mid-2025) gets 68.5%, where chance is 25%.
- **Generation is cheap; checking and per-reader duplication cost money.** A chapter explainer costs about \$0.11 on Claude Sonnet 5.5. Batch summaries of 10,000 books cost about \$440 on Haiku 5.5 (about \$100 if each request stays under 100K tokens) and \$3,500 on Opus 5.5. One human faithfulness check of one book cost \$200 in FABLES, as much as about 290 Opus 5.5 book summaries.
- **Recommended split** [I, high]: curate whatever carries bibliographic or legal weight (references, rights status, quotes); precompute and spot-check what many readers see; generate per reader only what is personal. No reference is shown unless it resolves to a catalog record, no quote unless it matches verbatim, and every generated sentence carries a provenance type and a check status.

## Generated interfaces: what was built and measured

### Google's Generative UI study

Google launched two "generative interfaces" experiments in the Gemini app on 2025-11-18 ([Google blog](https://blog.google/products/gemini/gemini-3-gemini-app/)): *visual layout*, a magazine-style view, and *dynamic view*, in which Gemini "design[s] and code[s] a custom user interface in real-time" for each prompt. Generative UI also reached Google Search's AI Mode for U.S. Pro and Ultra subscribers. I could not verify their status as of October 2026.

The research behind them is *Generative UI: LLMs are Effective UI Generators* (Leviathan, Valevski, Kalman and nine co-authors; [arXiv 2604.09577](https://arxiv.org/abs/2604.09577), v1 2026-02-24). The model writes HTML, CSS and JavaScript, with tools for image generation, image search and web search, a very long system prompt, and post-processors that repair common breakages. Raters compared pairs of outputs for 100 LMArena prompts (8 excluded) and a set of information-seeking prompts, two raters per pair, on a 3-point preference scale. "Generation time is not a factor in the evaluation and we show raters pre-cached results."

| Format (LMArena prompts) | Elo |
|---|---|
| Website built by a human expert (released as the PAGEN dataset) | 1800.3 |
| **Generative UI** (Gemini 3) | **1736.2** |
| Generative markdown (standard chatbot output) | 1437.7 |
| Top Google search result | 1352.2 |
| Generative plain text | 1173.7 |

- Generative UI beat markdown in 82.8% of comparisons (90.5% on the information-seeking set). Against expert pages it won 35.3%, lost 50.0% and tied 14.7%.
- The system prompt mattered: full prompt 1553 Elo, minimal prompt 1496, prompt without its "core philosophy" section 1451.
- **The capability is recent, at least for open-ended prompts.** On the LMArena set, Gemini 2.0 Flash-Lite produced broken output 60% of the time and 2.0 Flash 29%; Gemini 2.5 Flash, 2.5 Pro and 3 produced none. On the information-seeking set the older models erred far less (0–1%).
- **Stated limitations:** "slow generation speed, which can often take a minute or two"; streaming cuts the wait "by about a half". Google's blog adds "there are occasional inaccuracies in the outputs" ([Google Research](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/)).

**What it does not show** [I]. Whether readers learn more or are misled more: no rater checked facts. For research reading, an attractive page that is 5% wrong is worse than a plain one that is 1% wrong, and this design cannot tell them apart. A 1–2 minute wait rules the approach out for browsing; it fits a "make me a study page for this chapter" action generated once and cached.

### Shipped experiments and products

| Product | What is generated | Status (October 2026) | Lesson [I] |
|---|---|---|---|
| [Imagine with Claude](https://www.anthropic.com/news/claude-sonnet-4-5) | The whole application at the moment of use: "No functionality is predetermined" | Research preview for Max subscribers for five days from 2025-09-29; no sign it became a product [~80%] | Generating the whole app is still a demo |
| [Claude artifacts](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) with AI calls | Pages that call Claude from JavaScript; usage "counts against each person's own plan limits" | Available; persistent storage up to 20 MB per artifact (text only); can use viewers' connected apps except tools that need per-action approval | The builder pays no inference, so a free published tool is affordable. Open Stacks' prototypes use this with precomputed fallbacks ([Prototype Gallery](/building/prototype-gallery/)) |
| [Websim](https://websim.com/) | Began as an "imagined internet" of generated pages | Live on 2026-10-15, now "Create games and apps for free"; shutdown rumors trace to a user page and a competitor's satire | Generated look-alike pages drift to games. A fabricated page that looks real is play in a toy and a liability in research |
| [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6) (2025-12-22) | Typed tool calls rendered as developer-built React components | Recommended path; the older `streamUI` route is "currently experimental" | Practice moved from model-written UI to model-chosen components |

## The standards that emerged

Between November 2025 and January 2026, generated UI inside chat clients got cross-vendor standards (status as of October 2026):

| Standard | What the agent sends | Rendering and trust | Status | Source |
|---|---|---|---|---|
| **MCP Apps** (SEP-1865) | Tool metadata (`_meta.ui.resourceUri`) pointing at a `ui://` resource of bundled HTML/JS | Sandboxed iframe, JSON-RPC over `postMessage`. Hosts can prefetch and review templates and require consent for UI-initiated tool calls; servers should offer a text fallback | Proposed 2025-11-21 by MCP maintainers at OpenAI and Anthropic with the MCP-UI creators, who folded MCP-UI into it. First official MCP extension on 2026-01-26; Claude, Goose and VS Code Insiders at launch; ChatGPT "rolling out starting this week" | [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) |
| OpenAI Apps SDK | An MCP server plus a UI component | iframe in ChatGPT; app review | Submissions opened 2025-12-17 [S]. By October 2026 OpenAI's developer site presents "Plugins" combining skills, MCP servers and "optional UI"; the relationship is unclear | [developers.openai.com](https://developers.openai.com/apps-sdk) |
| **A2UI** (Google) | Declarative JSON naming components from a client-side catalog; no executable code | Native widgets (Lit, Angular, Flutter); "Safe like data, but expressive like code"; inherits host styling and accessibility | Announced 2025-12-15. Repo lists v0.9.1 as production, v1.0 as release candidate, "early stage public preview"; Apache-2.0; AG-UI/CopilotKit compatible | [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/); [GitHub](https://github.com/google/A2UI) |
| **AI SDK typed tool parts** | Tool calls; message parts such as `tool-displayWeather` with `input-available`, `output-available`, `output-error` states | Developer-written React components | AI SDK 6 | [ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces) |

They rest on three architectures. Output sizes and latencies are my estimates.

| Architecture | Examples | Model output per view | Latency | Safety and caching | Use it for |
|---|---|---|---|---|---|
| **Free-form code** | Gemini dynamic view, artifacts | 10k–15k+ tokens of HTML/CSS/JS | 1–2 minutes (Google's figure) | Needs a sandbox; broken pages; cacheable per prompt only | Explicit "build me a custom view" requests, in the background |
| **Declarative composition** | A2UI | Hundreds of tokens of JSON | Seconds | Data, not code; templates static, JSON small and cacheable | Lenses: timeline, argument map, comparison table, reading path |
| **Fixed component per tool** | AI SDK tool parts, MCP Apps templates | Tool arguments only | Tool time plus well under a second | Developer code only; the MCP Apps proposal says the template/data split "enables better caching" | Book cards, quote finders, availability routing |

**Decision** [I, high]. Build a literature explorer on the second and third architectures: the model fills a component schema from cached, checked data (claim indices, catalog records, passages). Keep free-form generation as a labeled, unchecked escape hatch. If you want the explorer inside the chat clients researchers already use, expose its views (book card, reading path, concept map, quote finder) as MCP tools with `ui://` templates; one server then renders in Claude, ChatGPT, VS Code and Goose. See [The Design Space](/building/design-space/) for where these lenses sit among other interface options.

## Generated encyclopedias and how they fail

### STORM and Co-STORM

STORM (Shao et al., NAACL 2024; [arXiv 2402.14207](https://arxiv.org/abs/2402.14207)) is the most careful design for generated articles. It discovers perspectives on a topic, simulates writers with those perspectives questioning a source-grounded "expert", builds an outline, then writes with citations. Ten experienced Wikipedia editors rated 20 article pairs on a 1–7 scale. It used gpt-3.5-turbo and gpt-4, so absolute numbers are stale.

| Criterion | Outline-driven RAG baseline | STORM | p |
|---|---|---|---|
| Organization | 3.25 | 4.00 | 0.005 |
| Coverage | 3.58 | 4.00 | 0.084 |
| Relevance | 3.93 | 4.15 | 0.347 |
| **Verifiability** | **3.85** | **3.80** | 0.843 |

- The headline "+25% organized, +10% broader" is the gain in the share of articles rated 4 or higher: 70.0% vs 45.0% for organization, 67.5% vs 57.5% for coverage ([full text](https://arxiv.org/html/2402.14207v2)).
- About 15% of sentences were unsupported by their citations. The most common cause was "improper inferential linking": two true, cited facts joined by a connection neither source makes.
- [Co-STORM](https://arxiv.org/abs/2408.15232) (EMNLP 2024) lets the user steer a panel of LLM agents that maintain a shared mind map. 70% of study participants preferred it to a search engine and 78% to a RAG chatbot.

**Takeaway** [I]. Process structure improves organization, not verifiability. For exploration, Co-STORM's "steer a panel, keep a living map" fits better than a static article.

### Grokipedia

xAI's Grokipedia is the large-scale case study. The timeline follows [Wikipedia's synthesis](https://en.wikipedia.org/wiki/Grokipedia) of press reports (fetched 2026-10-15), so dates after launch are secondary [S, medium]:

- **2025-10-27:** launch with 885,279 articles; users can suggest changes, not edit.
- **December 2025:** AI-generated suggestions overtake human ones (Tow Center analysis); later they exceed three-quarters of proposed changes.
- **Early 2026:** more than 5.6M articles. **February:** the Wikipedia community deprecates it as a source.
- **March–April 2026:** a rewrite mislabels accepted edits; editing stops and the site is "effectively frozen". **2026-09-30:** v0.3 ships after autonomous updating resumes.

Measured problems:

- **Copying and stripped citations.** PolitiFact found the "Monday" article was a 96% Copyscape match to Wikipedia's, cited only Wikipedia, and dropped its 22 references. It also found a wrong book chapter cited for Clausewitz, Instagram reels used as sources, and unsupported added claims ([Poynter, 2025-11-13](https://www.poynter.org/fact-checking/2025/grokipedia-wikipedia-copy-ai-errors/)).
- **Low-credibility sources:** "dozens of citations to sites like Stormfront and Infowars" (Triedman and Mantzarlis, [arXiv 2511.09685](https://arxiv.org/abs/2511.09685)).
- **Selective divergence.** In about 18,000 paired articles, 66% were "more extensively rewritten": longer, more complex, fewer references. Overall political leaning was similar, but on religion, history, literature and art Grokipedia cited more right-leaning sources (Mohammadi, Yasseri et al., *PNAS*, May 2026; checked via the [TCD release](https://www.tcd.ie/news_events/articles/2026/grokipedia-research/)).
- **Circular sourcing.** In January 2026 *The Guardian* reported GPT-5.2 citing Grokipedia, and *The Verge* reported Gemini, Copilot and Perplexity using it for some queries [S].

### EndlessWiki: generate once, serve to everyone

[EndlessWiki](https://www.seangoedecke.com/endless-wiki/) (2025-09-25) generates a page with Kimi K2 on Groq when someone first clicks a link to it, in "only a few hundred ms", stores it, and serves it to everyone afterwards (more than 62,000 pages by the post's date). Links carry an `origin` parameter that the server checks, so typed URLs cannot trigger generation. Costs still rose from one heavy user and, probably, crawlers. Lessons [I]: fast inference makes generation on navigation feel native; a write-through cache is the basic economics; generated link graphs need rate limits and per-user cost attribution.

### Wikipedia's response

- **[WP:LLM](https://en.wikipedia.org/wiki/Wikipedia:LLM)**, a content guideline since a March 2026 RfC: "The use of large language models (LLMs) to generate or rewrite article content is strictly prohibited." Exceptions: grammar-level corrections to one's own writing, human-reviewed, and LLM-assisted translation. Persistent violators are blocked, on "evidence beyond basic stylistic or linguistic indications".
- **[WikiProject AI Cleanup](https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup)** (from December 2023) uses speedy-deletion criterion G15 for pages "clearly entirely LLM-generated". A hoax article created in January 2023 passed Articles for Creation and was found to be fictional only in December 2023.
- **[Simple Article Summaries](https://www.mediawiki.org/wiki/Reading/Web/Content_Discovery_Experiments/Simple_Article_Summaries).** In a December 2024 browser-extension test, readers opened pre-generated summaries on 8.09% of eligible pageviews, and 75.2% of 101 respondents found them useful. A usability study (n = 8) found readers confused about whether the summary was part of the article. A June 2025 pause after editor objections was widely reported but is not on the project page [unverified].

The largest human-curated reference work has judged generated prose a net cost to it. For a personal tool this means: never push generated text into Wikipedia, and expect generated pages to be distrusted unless they show how each claim was checked.

### Failure modes and mitigations

| Failure mode | Evidence | Mitigation [I] |
|---|---|---|
| Copying a source and stripping its citations | Grokipedia "Monday": 96% match, 22 references dropped | Show the source alongside; keep its references |
| Unsupported links between true facts | STORM: ~15% unsupported sentences | Label synthesized claims; show every span they join |
| Low-credibility citations | Grokipedia: Stormfront, Infowars | Ground only in a curated corpus (open books, papers, the reader's library) |
| Selective rewriting on contested topics | PNAS 2026 | Show perspectives side by side with sources |
| Machine-only edit loops | AI suggestions over three-quarters of edits; months frozen | A human in the loop for anything shared; edit history; version stamps |
| Circular sourcing into other AIs | Assistants citing Grokipedia [S] | `noindex` and machine-readable provenance on generated pages |
| Cost blow-ups from crawlers and heavy users | EndlessWiki | Generate once and share; rate-limit; sign-in to trigger generation |
| Readers mistaking a summary for the source | Wikimedia usability study | Distinct container; "AI-generated" label with model and date |

## Learning tools

### Learn Your Way: the one RCT

Google's [Learn Your Way](https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/) (2025-09-16) re-levels a textbook chapter to a chosen grade "while keeping its scope", swaps in examples tied to the learner's interests, and generates immersive text with embedded questions, quizzes, narrated slides, an audio "lesson", mind maps and timelines.

- **Design:** 60 Chicago-area students aged 15–18, up to 40 minutes on one chapter (adolescent brain development), randomized to Learn Your Way or a PDF reader.
- **Results:** about 9% higher on an immediate quiz; 78% vs 67% on a retention test 3–5 days later (the blog calls this both "11 percentage points" and "11% higher"); 93% vs 67% wanted to use the tool again.
- **Publication:** Heldreth et al., [arXiv 2509.18664](https://arxiv.org/abs/2509.18664), in *Frontiers in Artificial Intelligence* 9:1783117 (2026). The abstract reports no effect sizes or p-values.
- Three pedagogy experts gave outputs from ten OpenStax textbooks average ratings of 0.85 or higher on every criterion, including accuracy (scale unstated).

**How much to update** [I]. The treatment bundled re-leveling, personalized examples and more practice items. Practice testing is among the best-supported learning techniques (see [Reading Interfaces](/interfaces/reading-interfaces/)), so the embedded quizzes alone could explain part of the gain, and novelty effects are likely. My credence that a well-designed generated study view improves retention over a static PDF for novices is about 60%; for experts, whose bottleneck is selection and synthesis, much lower. The study a builder needs compares a generated view with the same text plus the same number of quiz items. I found none. I could not verify whether Learn Your Way accepts user uploads as of October 2026.

### Gemini Notebook (formerly NotebookLM)

NotebookLM was renamed **Gemini Notebook** on 2026-07-16, with more than 30 million users and 600,000 organizations, and gained a sandboxed "secure cloud computer" per notebook for code grounded in the user's sources ([Google blog](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)). It is the reference product for "bring your sources, get study artifacts": Audio Overviews (with Brief, Critique and Debate formats), narrated-slide Video Overviews (from [2025-07-29](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/)), mind maps, reports, flashcards and quizzes whose "explain" option cites the source, and ready-made OpenStax textbook notebooks (from [2025-09-08](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/)).

**Copy** its strict grounding, inline citations, many formats from one source set, and curated open-textbook starters. **Its gaps for a literature explorer** [I]: notebooks are silos with no library-wide graph; sources per notebook are capped (third-party guides disagree on the numbers); and audio and video carry no claim-level provenance, so you cannot click from a spoken sentence to its passage. A 2026 critique summarized on [Wikipedia](https://en.wikipedia.org/wiki/NotebookLM) argues Audio Overviews flatten sources into one format [S].

### Other tools and cautionary cases

| Tool or case | What happened | Source |
|---|---|---|
| Google Illuminate | A Labs experiment (May 2026) turning arXiv-style papers or public URLs into 5–8 minute two-host audio with a synced transcript. The transcript links to the audio, not to the paper's passages | [MakeUseOf](https://www.makeuseof.com/notebooklm-alternative-illuminate-better-research-tool/) [S] |
| Khanmigo | Socratic tutoring at \$4/month or \$44/year for learners, free for teachers (2026-10-15). No independent learning-outcome RCT found | [khanmigo.ai](https://www.khanmigo.ai/pricing) |
| Cosmopedia (2024) | 30M+ synthetic textbooks and articles (~25B tokens) from Mixtral, built to train models; the authors acknowledge hallucinations. An infinite textbook library is cheap; an accurate one is not | [Hugging Face](https://huggingface.co/blog/cosmopedia) |
| *Mastering Machine Learning* (Springer Nature, 2025, \$169) | Of 18 of its 46 citations checked, about two-thirds did not exist or had substantial errors | [Retraction Watch](https://retractionwatch.com/2025/06/30/springer-nature-book-on-machine-learning-is-full-of-made-up-citations/) |
| *Chicago Sun-Times* insert (May 2025) | An AI-generated summer reading list "included nonexistent books and made-up quotes"; widely reported as 10 of 15 titles fake (not re-verified) | [Wikipedia](https://en.wikipedia.org/wiki/Chicago_Sun-Times) [S] |

**Re-leveling has thin evidence** [I]. Apart from the n = 60 RCT, I found no rigorous test of whether level-adapted summaries of books or papers keep the important claims. Simplification predictably drops hedges, qualifications and minority positions, so a reading-level slider should come with a *loss ledger* (below).

## The risk evidence

### Citations: fabrication fell, misattribution did not

| Study or event | Date | Setting | Finding |
|---|---|---|---|
| [Walters & Wilder](https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/) | 2023-09 | ChatGPT literature reviews, no retrieval | 55% of GPT-3.5 and 18% of GPT-4 citations fabricated; 43% and 24% of real ones had substantive errors (stale models) |
| [Tow Center / CJR](https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php) | 2025-03 | 8 AI search engines, 1,600 queries asking for the news article behind an excerpt | More than 60% answered incorrectly; Perplexity 37%, Grok 3 94% |
| [DeepTRACE](https://arxiv.org/abs/2509.04499) | 2025-09 | Deep-research and search modes (GPT-4.5/5, Perplexity, Copilot, Gemini, You.com) | Citation accuracy 40–80%; one-sided on debate questions (LLM-judged) |
| STORM | 2024 | Generated encyclopedia articles | ~15% of sentences unsupported by their citations |
| [GPTZero](https://gptzero.me/news/neurips/) | 2026-01 | 4,841 NeurIPS 2025 accepted papers | At least 100 human-confirmed hallucinated citations in 51–53 papers |
| [Charlotin database](https://www.damiencharlotin.com/hallucinations/) | 2026-10-15 | Court filings | 2,190 cases; tags (overlapping): fabricated 1,796, misrepresented 926, false quotes 584 |

The pattern [I, high]: retrieval nearly eliminates invented references, and a resolution check catches most of the rest; [AI Research Assistants](/finding/ai-research-assistants/) reports a 2026 study in which a URL-checking loop cut non-resolving links to under 1%. **Misattribution has not fallen.** A real source cited for something it does not say is now the dominant error, at 15–60% depending on system and measure. Anthropic's [Citations API](https://platform.claude.com/docs/en/build-with-claude/citations) returns `cited_text` with character, page or block locations and guarantees valid pointers into the supplied documents. A valid pointer proves the span exists. It does not prove the span supports the sentence.

### Book-length summaries

In **FABLES** (Kim et al., COLM 2024; [arXiv 2404.01261](https://arxiv.org/abs/2404.01261)), annotators who had read each of 26 books published in 2023–24 judged 3,158 claims from LLM summaries, at \$200 per book (about 11 hours).

| Model (2024) | Faithful | Unfaithful | Partial support |
|---|---|---|---|
| Claude 3 Opus | 90.89% | 2.10% | 6.65% |
| GPT-4 | 78.15% | 4.55% | 15.98% |
| GPT-3.5-Turbo | 71.52% | 11.26% | 13.08% |
| Mixtral | 68.67% | 11.47% | 17.20% |

- Most unfaithful claims concern events and character states and take indirect reasoning to detect.
- Omissions show "a systematic over-emphasis on events near the end of the book".
- **Automatic checking failed:** the best LLM rater, Claude 3 Opus with the whole book, reached F1 = 58.2 on unfaithful claims.
- [BooookScore](https://arxiv.org/abs/2310.00785) (ICLR 2024) found eight types of coherence error in GPT-4 summaries of 100 books; hierarchical merging was more coherent than incremental updating, which kept more detail.

**Implication** [I]. Treat a generated book summary as about 90% faithful at best on 2024 evidence, with omissions the reader cannot see. My guess is that 2026 frontier models have at least halved the unfaithful-claim rate [~70%], but no one has published a rerun, and omission and framing errors escape faithfulness metrics entirely.

### Long-context reading

| Benchmark | What it tests | Headline |
|---|---|---|
| **NoCha** ([Karpinska et al., EMNLP 2024](https://arxiv.org/abs/2406.16264)) | Minimally different true/false claim pairs about recent novels; a pair counts only if both claims are right (chance 25%) | Best model in the paper, GPT-4o: 55.8% of pairs. Humans verified individual claims with 97.4% accuracy (152 claims; claim-level, not directly comparable) |
| NoCha [leaderboard](https://novelchallenge.github.io/), last updated 2025-07-18 (my computation from its data file) | 1,164 pairs, including a November 2024 expansion | gpt-5 68.5% (775 of 1,132 attempted); o3 67.8%; o1-preview 67.4% (481 attempted); Gemini 2.5 Pro 64.2%; GPT-4.1 61.5%. No 2026 models |
| [NoLiMa](https://arxiv.org/abs/2502.05167) (ICML 2025) | Retrieval when question and answer share few words | At 32K tokens, 11 of 13 models fell below half their short-context score; GPT-4o went from 99.3% to 69.7% |
| [Context Rot](https://www.trychroma.com/research/context-rot) (Chroma, July 2025) | 18 models, controlled tasks of growing length | Performance falls with length alone; **shuffled haystacks scored better than coherent ones** |
| [Vectara leaderboard](https://github.com/vectara/hallucination-leaderboard) (2026-09-22) | Hallucination in short-document summaries | Frontier models 7–14% (claude-opus-4-7 12.0%, gpt-5.5 9.3%). Judge- and dataset-dependent; not a guide to book reading |

**Whole book or retrieval?** The NoCha data include a simple retrieval baseline: BM25 picks the top 25 chunks and GPT-4o answers. On the 723 pairs that full-context GPT-4o (August 2024) also attempted, retrieval got 292 right (40.4%) against 402 (55.6%) with the whole book (my computation from the leaderboard data). BM25 is a weak retriever, so this is a floor for retrieval, not a verdict. What generalizes [I, medium-high]: global reasoning over a book is harder than lookup; long inputs degrade quality even when they fit; and models' explanations are less reliable than their labels. The practical design is a hybrid: the whole book in a cached prompt, plus retrieved and highlighted passages, plus section-level checks.

### Three kinds of error

| Error | Frequency in grounded systems | Machine-detectable? | Check |
|---|---|---|---|
| **Fabrication** (invented work, case or quote) | Low with retrieval; 18–55% without it (2023) | Yes: resolve against catalogs; match quotes verbatim | Hard gate before display |
| **Misattribution and unsupported inference** | Common: ~15% of sentences (STORM) to 20–60% of citations (DeepTRACE) | Partly: entailment models triage; LLM judges are unreliable | Show the span; label the check; sample for human review |
| **Omission and framing** | Systematic (FABLES end bias; Grokipedia's divergence) | Mostly no | Coverage strip, loss ledger, side-by-side perspectives |

The first row is an engineering problem with a known solution. Design the interface around the second and third.

## Costs and latency at October 2026 prices

### Prices

USD per million tokens (MTok), as of October 2026. Batch requests are asynchronous at about 50% of standard prices for all three providers.

| Model | Input | Output | Cache read | Batch in / out | Source |
|---|---|---|---|---|---|
| Claude Fable 5.1 | \$10 | \$50 | \$0.25 | \$5 / \$25 | [pricing reference](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/pricing-reference.md) |
| Claude Opus 5.5 | \$4 | \$20 | \$0.20 (0.05×) | \$2 / \$10 | same |
| Claude Sonnet 5.5 | \$2 | \$10 | \$0.20 (0.1×) | \$1 / \$5 | same |
| Claude Haiku 5.5, prompt up to 100K tokens | \$0.10 | \$0.50 | \$0.01 | \$0.05 / \$0.25 | same; cache read from [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Haiku 5.5, prompt over 100K tokens | \$0.50 | \$2.50 | \$0.05 | \$0.25 / \$1.25 | same |
| Gemini 3.1 Flash-Lite | \$0.25 | \$1.50 | \$0.025 | about half | [Google](https://ai.google.dev/gemini-api/docs/pricing) |
| gpt-6-luna | \$0.10 | \$0.50 | \$0.01 | about half | [OpenAI](https://developers.openai.com/api/docs/pricing) |

- Claude cache writes cost about 1.25× input (5-minute TTL); a 1-hour TTL is available (2× per R07).
- R07 recorded Sonnet 5.5 cache reads at \$0.10 on the live page; this page follows the pricing reference's \$0.20. At \$0.10 the cached Sonnet rows below drop by at most \$0.015.
- Claude's current tokenizer produces up to 1.35× as many tokens as older ones: multiply Claude rows by up to 1.35. Thinking tokens bill as output, and Opus 5.5 cannot turn thinking off (see [Costs and Effort](/building/costs-and-effort/)); add 20–100% to output cost for hard reasoning.

### Worked examples

Token counts are my assumptions; totals are my arithmetic.

| Task | Tokens in / out | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Gemini 3.1 Flash-Lite | gpt-6-luna |
|---|---|---|---|---|---|---|
| Chapter explainer, uncached | 33k / 4k | \$0.21 | \$0.11 | \$0.005 | \$0.014 | \$0.005 |
| Same, chapter cached | 33k cached / 4k | \$0.087 | \$0.047 | \$0.002 | — | — |
| Declarative lens (claim index to component JSON) | 8k / 0.5k | \$0.042 | \$0.021 | \$0.001 | \$0.003 | \$0.001 |
| Free-form generative-UI page | 10k / 15k | \$0.34 | \$0.17 | \$0.009 | \$0.025 | \$0.008 |
| RAG question | 10k / 0.5k | \$0.05 | \$0.025 | \$0.001 | \$0.003 | \$0.001 |
| Question against a whole cached book | 150k cached + 0.2k / 0.5k | \$0.041 (cache write \$0.75) | \$0.035 (write \$0.38) | \$0.009 (write \$0.09) | — | — |
| Whole-book summary | 150k / 5k | \$0.70 | \$0.35 | \$0.09 (over-100K tier) | \$0.045 | \$0.018 |
| Summaries for 10,000 books, batch | 1.5B / 50M | \$3,500 | \$1,750 | \$440 | \$225 | \$90 |

Fable 5.1 costs 2.5× Opus 5.5 on every uncached row (\$8,750 for the 10,000-book batch).

**What the numbers imply** [I]:

1. **For one researcher, generation is not a budget item.** A hundred cached-book questions a day on Sonnet 5.5 cost about \$3.50, plus about \$0.38 per book written to cache. Twenty Opus 5.5 chapter explainers cost about \$4. Spend effort on the reference gate and provenance display, not on cost.
2. **For a shared tool, multiply by readers.** If 1,000 readers each generate explainers for a 20-chapter book on Sonnet 5.5, that is 20,000 × \$0.11 = \$2,200; generating once and serving the cached copy costs \$2.20 plus checking.
3. **Keep Haiku 5.5 requests under 100K tokens.** The long-prompt tier is 5× for the whole request. Two chunks plus a merge pass cost about \$0.02 per book, or about \$100 per 10,000 books in batch, against \$440.
4. **Once the book is cached, a whole-book question costs less than an uncached RAG question on Opus 5.5** (\$0.041 vs \$0.05), and only about 17% more than on Sonnet 5.5 before thinking tokens, because both read cache at \$0.20. If the NoCha pattern holds for current models, send global questions ("how does the author's view of X change?") to the whole cached book.
5. **Verification costs more than generation.** One FABLES-style check (\$200 per book) equals about 290 standard-price Opus 5.5 book summaries or 4,500 Haiku 5.5 batch summaries. Generate once, check once, serve many times.

### Latency

Google's free-form pages take "a minute or two"; EndlessWiki's short pages on Groq took "a few hundred ms". Output time is roughly output tokens divided by throughput. At an assumed 50–150 tokens per second for frontier models (I could not verify current speeds), a 500-token lens takes 3–10 seconds, a 4k-token explainer 27–80 seconds, and a 15k-token HTML page 2–5 minutes, before thinking time [I]. Anything that blocks a click should produce under about 1k output tokens, stream, or be precomputed. Batch jobs are asynchronous (Anthropic documents completion within 24 hours; from R07, not re-verified).

### Caching

- **Provider caching.** With a 5-minute TTL, two uses of a prefix already beat no caching on Claude (1.25 + 0.05 or 0.1, against 2). Put the book and system prompt first and the question last. Gemini caches implicitly on 2.5 and newer models above minimum prefix lengths ([docs](https://ai.google.dev/gemini-api/docs/caching)).
- **Application caching matters more.** Store each artifact under hash(source text version, prompt version, model ID, reading level, output type), with its provenance and review status. Anyone asking for the same thing gets the stored copy: EndlessWiki's write-through pattern with versioning.
- **Template/data split.** As in MCP Apps, generate data (claims, quotes, structure) per request; keep presentation in static templates.
- **Two-speed prefetch.** While the reader is on a page, a small model (Haiku 5.5 or gpt-6-luna, under a cent per item) prefetches explainers for the next pages. If the reader stays, a strong model regenerates in the background and shows the diff.
- **Regenerate on model upgrades.** Store model and date with every artifact and batch-regenerate the most-viewed ones when a better model ships.

## What to curate, precompute, or generate

The split follows from the error evidence: curate what fails mechanically and damagingly, precompute what many people see, generate what is personal. Costs are from the tables above.

| Layer | Examples | Produced by | Checked by | Cost (Oct 2026) |
|---|---|---|---|---|
| **Curate, or take from an authoritative source** | Bibliographic records and identifiers; rights and license status; verbatim quotes and canonical text; expert reading lists; subject taxonomies | Catalogs ([Open Library](https://openlibrary.org/), [Crossref](https://www.crossref.org/), [OpenAlex](https://openalex.org/)), publishers, librarians, the reader | The source itself | Free data plus your hours |
| **Precompute, cache, spot-check** | Book and chapter summaries at 2–3 levels; claim indices with source spans; concept graphs; glossaries; quiz banks; NoCha-style claim pairs for self-testing | Batch API with a strong model, then automatic resolution, verbatim and entailment checks | Humans on a random sample and on anything heavily used | \$90–\$3,500 per 10,000 books for summaries |
| **Generate per reader** | Grounded answers; re-leveling for one reader; comparisons across chosen works; lenses from a component catalog; links from the reader's notes into the library | Fast models for drafts, strong models on request | Automatic gates only; labeled unchecked | \$0.001–\$0.35 per item |
| **Never generate** | References without catalog resolution; quotes that do not match verbatim; numbers without a source span; claims about rights or availability | — | — | — |

The "never" row lists exactly the documented failures: the Springer book, the Sun-Times list, Grokipedia, the court filings. Rights errors also carry legal risk (see [The Legal Map](/building/legal-map/)).

**Generate, then promote** [I]. On-the-fly artifacts that many readers request ("explain chapter 3 for a novice") enter a review queue once N readers have asked. After human review they join the shared, versioned layer with edit history: EndlessWiki's economics with Wikipedia-style review, avoiding Grokipedia's machine-only loop.

### How many claims to spot-check

Standard binomial arithmetic turns "spot-check" into a sampling plan [I]:

- **Bounding a rate.** If n randomly sampled claims show no errors, the 95% upper bound on the error rate is about 3/n (the rule of three): 100 clean claims bound it below 3%, 300 below 1%.
- **Estimating a rate** near 10% to within ±3 points at 95% takes about 1.96² × 0.1 × 0.9 / 0.03² ≈ 384 claims.
- **Span checks and whole-book checks cost very different amounts.** A span check asks whether the claim is supported by its cited passage; it takes minutes and catches misattribution. A whole-book check asks what the summary misread or left out, and needs someone who has read the book: FABLES paid \$200 per book for about 121 claims each (3,158 ÷ 26). Run span checks on a random sample across the shelf and whole-book checks only on books you will rely on.
- **Stratify** by artifact type and model, since error rates differ, and publish the resulting rates on the artifacts.

### Decision rules

- **Building for yourself:** generate on request with Sonnet 5.5 or Opus 5.5, cache by content hash, and put the effort into the reference gate and provenance labels. Expect a few dollars a day at most.
- **Building for many readers:** batch-precompute summaries and claim indices for the target shelf, audit on a written sampling plan, and generate only personal artifacts live. The obstacle is reviewer time, not tokens.
- **Rich interactive views:** define a component catalog (book card, timeline, argument map, comparison table, coverage strip) and have the model emit A2UI-style JSON over checked data. Offer free-form HTML only on request, in the background, labeled unchecked.
- **A study tool today, without building:** Gemini Notebook with your own sources or its OpenStax notebooks. Click through its citations, and treat Audio Overviews as warm-up, since spoken claims carry no provenance.
- **Relying on a book summary for a decision:** read the passages behind the claims that matter. At 2024 faithfulness rates, a 120-claim summary from the best model contains around 10 claims that are unsupported or only partly supported.

## A provenance design

The goal: for every generated sentence, the reader can see where it came from and how it was checked, and no reference reaches the screen unless it points at a real catalog record. [I throughout, built on the evidence above]

### Claim-level labels

Each generated sentence carries exactly one provenance type:

| Type | Display | Required evidence | Gate |
|---|---|---|---|
| **Quoted**: verbatim from a source | Quotation marks and a locator; click opens the page | A span that matches after normalizing whitespace and quote marks | Hard: if the match fails, it is not shown as a quote |
| **Paraphrased**: restates one span | Dotted underline; hover shows the span | One span locator (Citations API `cited_text` or your own offsets) | Soft: the entailment result is shown |
| **Synthesized**: joins two or more spans | A distinct marker opening all spans and a one-line statement of the inference | Every span, plus the stated link | Always labeled, since "improper inferential linking" was STORM's top error |
| **Model knowledge**: no span | Grey and visually distinct | None | Hidden by default for factual claims |

Each claim also shows how it was checked, from a fixed vocabulary: *unchecked*; *auto: span resolves*; *auto: entailment (model, score)*, shown as triage and never as a checkmark given FABLES' F1 of 58.2; *two model families agree* (single-model claims are highlighted); *human: span-checked (date)*; *human: whole-book checked (date)*.

### Catalog-resolution gating for every displayed reference

Every reference from any model passes a resolver before display. This gate is fully automatable and removes the most damaging error.

1. **Constrain at generation.** The model may cite only identifiers already in its context (catalog record IDs, DOIs, arXiv IDs, ISBNs), emitted as structured output. Anything it "remembers" is a *suggestion* that must pass step 2.
2. **Resolve.** DOIs at Crossref, arXiv IDs at arXiv, ISBNs and works at Open Library, title–author pairs at OpenAlex or Open Library search. Map each result to a record in your own catalog, which routes the reader to a readable copy ([The Access Ladder](/access/access-ladder/)).
3. **Compare metadata.** Title similarity, first author's surname, year within one. A real identifier attached to the wrong work fails.
4. **Match quotes.** If you hold the text, require a verbatim match. If not, show "quote unverified: text not available".
5. **Triage support** with an entailment check between claim and span, shown as a label.
6. **Display one of four states:** resolved and span-checked; resolved, support unchecked; resolved with a metadata mismatch (warning); unresolved (struck through, "could not verify", with a search link). An unresolved reference never looks like a citation.
7. **Log failures** per model and prompt version. That gives your own pipeline's fabrication rate, which is better evidence for you than any published one.

### Other displays

- **Coverage strip.** A thin bar across the book's chapters, shaded by how many summary claims each supplied; it exposes end-of-book bias at a glance. Clicking a gap asks what the summary skipped there.
- **Loss ledger.** Beside re-leveled text, the claims, hedges and qualifiers dropped at the simpler level, each linked to its original sentence.
- **Boundary and stamps.** A distinct container labeled "AI-generated" with model, prompt version, source hash and date, and a regeneration history with diffs.
- **Machine-readable labels.** `noindex` and provenance metadata, so other systems do not recycle generated pages as sources.
- **Calibration ledger.** Reader-flagged errors by artifact type and model, shown as rates ("chapter summaries: 2.1 flagged errors per 100 claims, last 90 days"). Flags undercount true errors, so show the sampled audit rate beside them.

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

[A Reference Architecture](/building/reference-architecture/) already labels every LLM-generated catalog field with model, prompt version, grounding level and date; this record extends that labeling from fields to individual sentences. The [Prototype Gallery](/building/prototype-gallery/) has working mockups.

## Open questions

- **How do 2026 frontier models score on NoCha and FABLES?** The NoCha leaderboard stopped at mid-2025 models, and FABLES used 2024 models. A FABLES-style rerun on 10 recent books would cost about \$2,000 in annotation at FABLES' rate.
- **Does a generated study view beat the same text with the same quizzes?** A three-arm RCT (PDF; PDF plus identical quizzes; full tool) would separate generated content from the testing effect that Learn Your Way's design confounds.
- **Can 2026 small models produce valid free-form HTML?** Rerunning the released PAGEN prompts on Haiku 5.5, Gemini 3.1 Flash-Lite and gpt-6-luna would show whether cheap models can serve the escape hatch.
- **How accurate are 2026 entailment checkers on book-summary claims?** The baseline is F1 = 58.2. Above roughly 85, the "auto-checked" label could carry real weight.
- **Does whole-book context beat modern retrieval on global questions for 2026 models?** The only head-to-head I found pits BM25 top-25 against GPT-4o (40.4% vs 55.6% of NoCha pairs). Hybrid retrieval with reranking would be the fair test.
- **What share of real errors do readers flag?** Seeding known errors into sample artifacts and counting flags would give the calibration ledger its multiplier.
- **What do re-leveled summaries lose?** Count claims and hedges present at the expert level and absent at the novice level across, say, 50 open-textbook chapters.
- **Is the Sonnet 5.5 cache-read price \$0.10 or \$0.20 per MTok,** and what are the current statuses of Gemini's dynamic view and Learn Your Way's uploads?

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
