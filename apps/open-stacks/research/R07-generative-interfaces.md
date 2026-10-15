# LLM-native and generative interfaces: content and UI generated on the fly — research dossier

- **Date:** 2026-10-15
- **Track:** R07 (Open Stacks research sweep)
- **Scope:** Generative UI (Google Generative UI and Gemini "dynamic view"/"visual layout", Imagine with Claude, Claude Artifacts, Websim, v0, Vercel AI SDK, MCP Apps / MCP-UI / OpenAI Apps SDK, A2UI); "infinite" generated encyclopedias (STORM/Co-STORM, Grokipedia, EndlessWiki) and how they fail; AI-augmented textbooks and study tools (Learn Your Way, NotebookLM / Gemini Notebook, Illuminate, Khanmigo, generated textbooks and course generators); personalized reading levels; evidence on hallucinated citations, book-summary faithfulness (BooookScore, FABLES), and long-context reading (NoCha, NoLiMa, LongBench v2, Context Rot); cost and latency at October 2026 API prices; caching; what a literature explorer should generate, precompute, or leave to humans; how to show provenance and uncertainty.
- **Method:** About 20 web searches (standard and extended) before the session's shared web-search quota ran out, then about 60 direct fetches of primary pages (arXiv abstracts and HTML/PDF full text, official blogs, pricing pages, documentation, GitHub READMEs, Wikipedia policy pages). The Google Generative UI paper was read from its full PDF text. Pricing comes from the Anthropic, Google, OpenAI and Vercel pricing pages as fetched on 2026-10-15. Because the search quota ran out, some 2026 product statuses could not be re-checked; these are flagged.
- **Evidence labels used below:**
  - **[P]** verified on a primary source (the organization's own page, the paper itself, official docs)
  - **[S]** reported by a secondary source (press, aggregator, Wikipedia summary of press)
  - **[I]** my inference or calculation
  - **[T]** from my training knowledge, not re-verified in this session
  - Confidence: high / medium / low, or "[~70%]"-style where useful. Sources older than about two years are flagged "(possibly stale)".
- **Key sources:** Leviathan et al., *Generative UI: LLMs are Effective UI Generators* (arXiv 2604.09577, Feb 2026); MCP Apps announcements (Nov 2025, Jan 2026); Google A2UI announcement and repo; Shao et al. STORM (NAACL 2024); Triedman & Mantzarlis on Grokipedia (Nov 2025) and Mohammadi et al. (PNAS, May 2026); Google Learn Your Way (Sept 2025; Frontiers in AI 2026); Kim et al. FABLES (COLM 2024); Karpinska et al. NoCha (EMNLP 2024); Vectara hallucination leaderboard (updated 2026-09-22); Anthropic, Gemini and OpenAI pricing pages (2026-10-15); English Wikipedia's LLM guideline (RfC March 2026).

---

## Executive summary

1. **Generative UI works well enough to prefer, but is slow and judged on looks, not truth.** Google's Generative UI system (Gemini 3 Pro plus tools, a long system prompt, and post-processors) beat standard markdown answers in 82.8% of pairwise human comparisons and matched or beat human-expert-built pages in 50% of comparisons (expert pages won the other 50%). But generation "can often take a minute or two", and raters saw pre-cached pages and judged preference, not factual accuracy. [P, high] ([arXiv 2604.09577](https://arxiv.org/abs/2604.09577))
2. **Newer models can do generative UI; older ones could not.** In the same paper, Gemini 2.0 Flash-Lite produced broken output 60% of the time and Gemini 2.0 Flash 29%. Gemini 2.5 and 3 had 0% on the LMArena prompt set. Generative UI only became feasible in about 2025. [P, high]
3. **There are now standard ways to deliver generated UI.** *MCP Apps* (SEP-1865) became the first official MCP extension on 2026-01-26. It merges MCP-UI and the OpenAI Apps SDK pattern: a tool links to a `ui://` HTML resource, which the host renders in a sandboxed iframe and talks to over JSON-RPC via `postMessage`. Claude (web and desktop), Goose, VS Code Insiders and ChatGPT supported it at launch. Google's *A2UI* (Apache-2.0; v0.9.1 is the current production release, v1.0 is a release candidate) takes the opposite approach: agents send declarative JSON chosen from a catalog of pre-approved native components, never executable code. [P, high]
4. **"Infinite" encyclopedias fail in predictable ways.** Grokipedia launched 2025-10-27 with about 885k articles. It reportedly grew past 5.6M [S]. Studies found it heavily derived from Wikipedia (PolitiFact/Copyscape: the "Monday" article was a 96% match). It cites low-credibility sources ("dozens of citations" to Stormfront and Infowars), and on religion, history, literature and art it leans toward more right-leaning sources (PNAS, May 2026, ~18k article pairs). By December 2025, AI-generated edit suggestions outnumbered human ones, and the site was effectively frozen from about April to September 2026. Wikipedia deprecated it as a source. [P/S, medium-high]
5. **English Wikipedia now prohibits LLM-written article content.** The content guideline WP:LLM, backed by a March 2026 RfC, says using LLMs "to generate or rewrite article content is strictly prohibited". The only exceptions are copyedits of one's own text and assisted translation, and persistent violators are blocked. Speedy-deletion criterion G15 covers pages that are clearly entirely LLM-generated. The largest human-curated reference work has decided generated prose is a net negative for it. [P, high]
6. **STORM is the most credible design for generated articles, and still not publication-ready.** STORM uses multi-perspective question-asking and outline-first retrieval. Wikipedia editors rated its articles more organized (+25% absolute) and broader (+10%) than a RAG baseline, but no more verifiable (3.80 vs 3.85 on a 7-point scale). About 15% of its sentences were unsupported by their citations, most often through "improper inferential linking". In Co-STORM, 70% of users preferred it to a search engine and 78% to a RAG chatbot. [P, high (2024, possibly stale)]
7. **The best learning-gain evidence for AI-augmented textbooks is real but small.** In Google's *Learn Your Way* RCT, 60 Chicago-area students aged 15–18 used either the tool or a PDF reader. The tool group scored 78% vs 67% on a retention test 3–5 days later (+11 points) and about 9% higher immediately after. It is one chapter, one session, and a small sample; it was published in *Frontiers in AI* in 2026. [P, medium (the effect is plausible, but n=60)]
8. **NotebookLM is now "Gemini Notebook".** It was renamed 2026-07-16 and has more than 30M users and 600k organizations. It is the leading source-grounded study tool: audio overviews (Brief, Critique and Debate formats), narrated-slide Video Overviews (from 2025-07-29), mind maps, flashcards and quizzes (from 2025-09-08), ready-made OpenStax textbook notebooks, and now a sandboxed "secure cloud computer" in each notebook for code execution. [P, high]
9. **Fabricated citations are still common, and on the record.** Measured rates:
   - 55% (GPT-3.5) and 18% (GPT-4) of references fabricated in 2023 [P, possibly stale]
   - at least 100 hallucinated citations in about 51–53 NeurIPS 2025 accepted papers (GPTZero, Jan 2026) [P]
   - citation accuracy of 40–80% across deep-research and search systems (DeepTRACE, Sept 2025) [P]
   - more than 60% of 1,600 queries answered incorrectly by eight AI search engines (Tow Center, Mar 2025) [P]
   - 2,190 legal cases with AI-hallucinated material as of 2026-10-15 (Charlotin database) [P]
   - a $169 Springer Nature ML textbook (2025) in which about 2/3 of the citations checked were fabricated or wrong [P]
10. **Book-length summaries are mostly faithful but omit things in a systematic way, and machines can't yet check them.** In FABLES (26 books from 2023–24), the best model then, Claude 3 Opus, had 90.9% of its summary claims judged faithful. GPT-4 had 78%, Mixtral 69%. Most unfaithful claims concern events and character states. Summaries over-weight the ending. The best LLM faithfulness checker reached only F1 = 58.2 on unfaithful claims. Human checking cost about $200 per book (~11 hours). [P, high (2024 models, possibly stale)]
11. **Long-context reading is weaker than retrieval scores suggest.** On NoCha (1,001 true/false claim pairs about 67 recent novels), the best 2024 model (GPT-4o) got 55.8% of pairs right, versus ~97% for human readers. On NoLiMa, 11 of 13 models fell below half their short-context score by 32K tokens. Chroma's "Context Rot" study of 18 models found degradation from input length alone. [P, high for 2024–25 models; current frontier models are probably better, but I could not verify current scores]
12. **On-the-fly generation is cheap per item at October 2026 prices, so the binding constraints are latency, verification and the cost of serving many readers.** Calculated examples [I]:
    - a 33k-token-in / 4k-token-out chapter explainer: about $0.21 on Claude Opus 5.5, $0.11 on Sonnet 5.5, $0.005 on Haiku 5.5, $0.014 on Gemini 3.1 Flash-Lite (inputs uncached)
    - a whole 150k-token book summary: about $0.70 (Opus 5.5) to $0.02 (gpt-6-luna)
    - precomputing summaries for 10,000 books via batch APIs: roughly $90–$3,500 depending on model
    - the verification bottleneck: one human check costs more than 100 generations ($200 per book in FABLES)
13. **Caching changes which architecture is cheapest.** Claude Opus 5.5 and Sonnet 5.5 cache reads cost 0.05× base input ($0.20 and $0.10 per MTok); 5-minute and 1-hour cache writes cost 1.25× and 2×. Gemini caching is 5–10% of input price, and Gemini 4 Argon supports implicit caching only. OpenAI cached input is about 10% of input. A question against a whole cached 150k-token book costs about $0.04 on Opus 5.5, close to an uncached 10k-token RAG call [I]. App-level persistence matters more still: EndlessWiki generates each page once, stores it in MySQL, and serves it to everyone. [P/I]
14. **Design rule this suggests [I]:**
    - Human-curate the facts that carry legal or bibliographic weight: rights status, bibliographic records, quotes, reading lists.
    - Precompute and spot-check anything many readers will see: summaries at several levels, concept maps, quiz banks, claim indices.
    - Generate on the fly only per-reader artifacts: questions, re-leveling, comparisons, layouts/"lenses".
    - Always show provenance at the claim level and say how each claim was checked.

---

## Detailed findings

### 1. Generative UI: the state of the art (2025–2026)

#### 1.1 Google: Generative UI research and Gemini "visual layout" / "dynamic view"

**What shipped [P].** On 2025-11-18, alongside Gemini 3, Google launched two "generative interfaces" experiments in the Gemini app. **Visual layout** is a "magazine-style" view with photos and modules. **Dynamic view** has Gemini "design and code a custom user interface in real-time" for each prompt; Google's example is a tappable, scrollable explanation of the Van Gogh Gallery. Users "may initially see only one of them" because Google was comparing the two. Generative UI also appeared in Google Search AI Mode for Google AI Pro and Ultra subscribers in the U.S. (users select "Thinking"). ([Google blog, 2025-11-18](https://blog.google/products/gemini/gemini-3-gemini-app/); [Google Research blog, 2025-11-18](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/))

**The paper [P].** *Generative UI: LLMs are Effective UI Generators* by Leviathan, Valevski, Kalman, … Manyika and Matias (13 authors). arXiv 2604.09577, v1 submitted 2026-02-24; the project page's BibTeX says 2025. ([arXiv](https://arxiv.org/abs/2604.09577); [project page](https://generativeui.github.io/))

- **System.** The LLM writes HTML/CSS/JS. It is given tools (image generation, image search, web search), a very long system prompt (format guidelines, a tool manual, and "tips for avoiding common errors"; reproduced in the appendix), and post-processors. The post-processors inject JavaScript to catch client-side errors, fix JS errors from model parsing issues, and repair missing Tailwind directives.
- **Evaluation.** 100 prompts sampled from LMArena (8 excluded), plus a custom set of information-seeking prompts. Pairwise human ratings on a 3-point scale, each pair shown to 2 raters. **"Generation time is not a factor in the evaluation and we show raters pre-cached results."**

| Format (LMArena prompts) | ELO |
|---|---|
| Website built by a human expert (PAGEN) | 1800.3 |
| **Generative UI** | **1736.2** |
| Generative markdown (standard chatbot output) | 1437.7 |
| Website (top Google search result) | 1352.2 |
| Generative plain text | 1173.7 |

Head-to-head:
- Generative UI beat markdown **82.8%** of the time (90.5% on the information-seeking set).
- Against expert pages, Generative UI won 35.3%, experts won 50.0%, and the rest were neutral. "At least comparable in 50% of cases" means wins plus ties [I].

| Backbone model (LMArena set) | ELO | Output errors |
|---|---|---|
| Gemini 3 | 1706.7 | 0% |
| Gemini 2.5 Pro | 1653.6 | 0% |
| Gemini 2.5 Flash | 1623.9 | 0% |
| Gemini 2.0 Flash | 1332.9 | 29% |
| Gemini 2.0 Flash-Lite | 1183.0 | 60% |

**Prompt ablation:** full prompt 1553 ELO, minimal prompt 1496, prompt without its "core philosophy" section 1451.

**Stated limitations:**
- "slow generation speed, which can often take a minute or two". Streaming partial pages cuts the wait "by about a half".
- occasional JS/CSS/HTML errors
- the blog adds that outputs "occasionally contain inaccuracies"

**PAGEN** is a dataset of pages built by human experts (Upwork contractors) for the same prompts, released for benchmarking.

**Assessment for a literature explorer [I]:**
- The evidence shows people *prefer* generated interactive pages to markdown. It says nothing about whether they *learn more* or are *misled more*: raters judged preference on pre-cached pages, and the paper did not measure accuracy.
- A 1–2 minute wait is unacceptable for browsing but fine for a "make me a study page for this chapter" action that is generated once and cached.
- The error table matters for model choice. Small, cheap models were unusable for free-form HTML in early 2025. That should be re-tested with 2026 small models (Haiku 5.5, Gemini 3.x Flash-Lite, gpt-6-luna) before relying on them.
- **Current status unknown.** I could not verify whether dynamic view and visual layout are still separate experiments, merged, or generally available as of October 2026 [unverified].

#### 1.2 Anthropic: "Imagine with Claude" and Claude Artifacts

**Imagine with Claude [P].** A "temporary research preview" released with Claude Sonnet 4.5 on 2025-09-29: "Claude generates software on the fly. No functionality is predetermined; no code is prewritten." It was open to Max subscribers "for the next five days" at claude.ai/imagine. ([Anthropic, 2025-09-29](https://www.anthropic.com/news/claude-sonnet-4-5); secondary walkthrough: [DataCamp, 2025-09-30](https://datacamp.com/tutorial/imagine-with-claude))
- I found no evidence it became a product; it most likely ended after the five-day window [I, ~80%].
- Its significance is conceptual: the whole application, not only the content, is generated at the moment of use, which is a more extreme form of Google's dynamic view.

**Claude Artifacts with AI-powered apps [P].**
- **AI-powered artifacts** (Simon Willison's same-day write-up is dated 2025-06-25; Anthropic's post shows July 2025 with a 2025-07-31 update adding Team/Enterprise): artifacts can call Claude from JavaScript. Each user signs in, and "usage counts against [their] subscription". The creator pays nothing and no API keys are needed. Limits at launch: no external API calls, no persistent storage, text-only completion API. ([Claude blog](https://claude.com/blog/claude-powered-artifacts); [Simon Willison, 2025-06-25](https://simonwillison.net/2025/Jun/25/ai-powered-apps-with-claude/))
- **As of 2026-10-15, the Help Center lists [P]** ([Claude Help Center](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them)):
  - template types (Docs, Slides, Design; Dashboards and Motion in beta)
  - **persistent storage**, personal or shared, limited to 20 MB per artifact, text only (Pro/Max/Team/Enterprise)
  - **connected apps**: artifacts can use the user's connectors, including custom ones, with per-tool approval
  - export to Word/PDF/Markdown/Google Docs and PowerPoint/Google Slides
  - "Legacy artifacts" are those made before 2026-09-16; new ones of that kind can't be created
- **Why this matters [I].** The "user pays for their own inference" model makes a free, shareable literature tool affordable to *publish*: the builder hosts nothing and pays for no tokens. The Open Stacks prototypes already use this pattern through the artifact runtime's `sample` capability, with precomputed fallbacks.

#### 1.3 Websim

- **[T]** Websim (launched 2024) began as an "imagined internet": type any URL and an LLM generates a plausible page for it. It is the purest consumer example of on-the-fly generated websites.
- **[P, as of 2026-10-15]** websim.com is live and now describes itself as "Create games and apps for free and help make the internet fun again", with a © 2026 footer and no shutdown notice. ([websim.com](https://websim.com/))
- **Rumors of a March 2026 shutdown are unconfirmed.** They come from a user-made "farewell" page on websim.com ([link](https://websim.com/@Trey6383/farewell-websim)) and a satirical promotional page by a competitor, Berrry, whose "announcement" is attributed to "a very concerned cat" ([link](https://websim-rip.berrry.app/)).
- **Funding records disagree:** PitchBook lists an $11M seed in January 2025; Tracxn says unfunded. [S, low] ([PitchBook](https://pitchbook.com/profiles/company/664288-30))
- **Lesson [I].** Generated "imagined pages" drifted toward games and toys, not reference use. A fabricated page that looks real is a feature in play and a liability in research.

#### 1.4 v0 and the Vercel AI SDK

**v0 pricing [P, page undated, fetched 2026-10-15]** ([v0.app/pricing](https://v0.app/pricing)):

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | 7 messages/day |
| Plus | $30/user/month (the page also shows "$90" beside it; probably a crossed-out list price) | $30 monthly credits + $2 daily login credits |
| Business | $100/user/month | as Plus, plus training opt-out by default |
| Enterprise | custom | SSO, RBAC, SLAs |

| v0 model (per MTok) | Input | Cache write | Cache read | Output |
|---|---|---|---|---|
| v0 Mini | $0.20 | $0.25 | $0.02 | $1.20 |
| v0 Pro | $2 | $2.50 | $0.20 | $10 |
| v0 Max | $5 | $6.25 | $0.50 | $25 |
| v0 Max Fast | $10 | $12.50 | $1 | $50 |

A secondary source says the "Team" plan was renamed "Plus" in July 2026 [S, low].

**Vercel AI SDK [P].**
- AI SDK 6 was released 2025-12-22. It added `ToolLoopAgent`, tool-execution approval (`needsApproval`), stable MCP support (`@ai-sdk/mcp`), and typed tool components flowing into `useChat`. ([Vercel blog](https://vercel.com/blog/ai-sdk-6))
- The recommended generative-UI pattern is now "tool result → typed React component": message `parts` such as `tool-displayWeather`, with states `input-available`, `output-available` and `output-error`. ([AI SDK docs](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces))
- The older React Server Components approach (`streamUI`) is "currently experimental", and the docs recommend AI SDK UI for production. ([AI SDK RSC](https://ai-sdk.dev/docs/ai-sdk-rsc))
- **Why this matters [I].** The mainstream engineering consensus has moved *away* from models emitting arbitrary UI and *toward* models choosing from typed, developer-built components. This is the same direction as A2UI, and it is safer and much faster than Google's free-form HTML.

#### 1.5 Protocols for generated UI: MCP Apps, MCP-UI, OpenAI Apps SDK, A2UI

| Approach | What the model or agent sends | Rendering | Trust model | Status (Oct 2026) | Source |
|---|---|---|---|---|---|
| **MCP Apps** (SEP-1865; merges MCP-UI and the OpenAI Apps SDK) | Tool metadata (`_meta.ui.resourceUri`) pointing at a `ui://` resource of bundled HTML/JS | Host renders it in a **sandboxed iframe**; two-way JSON-RPC over `postMessage` | Hosts can prefetch and review templates before rendering; messages can be logged; optional user consent for UI-initiated tool calls; servers should include a text-only fallback | Proposed 2025-11-21; **official extension 2026-01-26**, "the first official MCP extension"; Claude web/desktop, Goose and VS Code Insiders at launch, ChatGPT "this week" | [MCP blog 2025-11-21](https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/); [MCP blog 2026-01-26](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) [P] |
| **MCP-UI** | HTML resources (e.g. `rawHtml`) | iframe | — | "Now standardized into MCP Apps"; a legacy adapter is kept | [mcpui.dev](https://mcpui.dev/) [P] |
| **OpenAI Apps SDK / ChatGPT apps** | MCP server + UI component | iframe in ChatGPT | App review and a directory | Submissions opened 2025-12-17 [S]. As of 2026-10, OpenAI's developer site presents ChatGPT "Plugins" that combine skills, MCP servers and "optional UI" [P, but the details of the rename are unclear] | [OpenAI, Dec 2025](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/) (fetch blocked; search-result summary); [developers.openai.com/apps-sdk](https://developers.openai.com/apps-sdk) |
| **A2UI** (Google) | **Declarative JSON** naming components from a client-side catalog of pre-approved components; no executable code | Native widgets (Lit, Angular, Flutter GenUI SDK; React/Compose/SwiftUI on the roadmap) | "Safe like data, but expressive like code"; inherits host styling and accessibility | Announced 2025-12-15 at v0.8; repo now says **v0.9.1 production, v1.0 release candidate**, 16.7k stars, Apache-2.0 | [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/); [GitHub](https://github.com/google/A2UI) [P] |
| **AG-UI / CopilotKit** | Agent↔UI event protocol; can carry A2UI | — | — | "Day-zero compatibility" with A2UI | [Google Developers Blog](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) [P] |
| **Vercel AI SDK typed tool parts** | Tool calls; the developer maps each tool to a React component | React | Developer code only | AI SDK 6 (Dec 2025) | [ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces) [P] |

**Three architectures [I].** They trade expressiveness against safety, speed and caching:
1. **Free-form code generation** (Google dynamic view, Imagine with Claude, Websim, artifacts): most expressive, slowest (minutes), hardest to secure and to cache. Errors are visible as broken pages.
2. **Declarative composition from a catalog** (A2UI, json-render-style schemas): moderately expressive, fast (the model emits a small JSON tree), safe, and highly cacheable.
3. **Fixed component per tool** (AI SDK tool parts, MCP Apps templates): least expressive per call, but templates are static. The MCP Apps proposal says separating the static template from dynamic tool results "enables better caching".

**For a literature explorer, option 2 or 3 should be the default, with option 1 reserved for explicit "build me a custom view" requests [I, high].**

---

### 2. "Infinite" generated encyclopedias and wikis

#### 2.1 STORM and Co-STORM (Stanford OVAL)

**STORM [P]** ("Synthesis of Topic Outlines through Retrieval and Multi-perspective Question Asking"; Shao, Jiang, Kanell, Xu, Khattab, Lam; NAACL 2024; [arXiv 2402.14207](https://arxiv.org/abs/2402.14207)).
- **Pipeline:** discover perspectives → simulate conversations in which writers with those perspectives question a "topic expert" grounded in internet sources → build an outline → write the article with citations.
- **Evaluated on** FreshWiki, a set of recent, high-quality Wikipedia articles.

Results (2024 models, possibly stale):
- Compared with an outline-driven RAG baseline, a **25% absolute increase** in articles judged organized and **10%** in broad coverage.
- Human evaluation: 10 experienced Wikipedia editors, 20 article pairs, 1–7 scale ([full text](https://arxiv.org/html/2402.14207v2)).

| Criterion | oRAG baseline | STORM | p |
|---|---|---|---|
| Organization | 3.25 | 4.00 | 0.005 |
| Coverage | 3.58 | 4.00 | 0.084 |
| Interest | 3.63 | 4.03 | 0.077 |
| Relevance | 3.93 | 4.15 | 0.347 |
| **Verifiability** | **3.85** | **3.80** | 0.843 |

- Pairwise preference: STORM 26, baseline 14.
- Citation recall 84.83% and precision 85.18%, judged automatically by Mistral-7B.
- About **15% of sentences unsupported** by their citations. The most common error was "improper inferential linking", followed by inaccurate paraphrasing and citing irrelevant sources.
- Editors flagged "source bias transfer" and "over-association of unrelated facts".
- Models used: gpt-3.5-turbo for question asking, gpt-4 for outlining and writing; 5 perspectives × 5 conversation rounds.

**Co-STORM [P]** (EMNLP 2024; [arXiv 2408.15232](https://arxiv.org/abs/2408.15232)).
- The user watches, and occasionally steers, a discussion among LLM agents (moderator plus experts) that maintains a shared mind map.
- Built on the WildSeek dataset of real information-seeking goals.
- In the human evaluation, **70%** of participants preferred it to a search engine and **78%** to a RAG chatbot.

**Status [P].** The GitHub repo has 31.6k stars and an MIT license. The latest news item is the `knowledge-storm` v1.1.0 release (2025-01, adding litellm). "More than 70,000 people have tried our live research preview." I could not confirm current activity. ([GitHub](https://github.com/stanford-oval/storm))

**Takeaway [I].** STORM shows that *process structure* (perspectives, questions, outline before prose) improves organization and breadth. It does *not* improve verifiability: about 1 in 7 sentences are not supported by their citations. For a literature explorer, Co-STORM's "user steers a panel and gets a living mind map" pattern looks like a better fit for exploration than a static generated article.

#### 2.2 Grokipedia (xAI): a large-scale case study in failure modes

**Timeline [P/S]** ([Wikipedia: Grokipedia](https://en.wikipedia.org/wiki/Grokipedia), fetched 2026-10-15; underlying press citations noted there):
- **2025-10-27:** v0.1 launches with more than 800,000 articles. PolitiFact sampled from 885,279. Users cannot edit; they can suggest changes, which Grok reviews.
- **2025-11-21:** v0.2. Grok implements approved suggestions.
- **December 2025:** per a Tow Center analysis (CJR, 2026-02-12), "AI-generated edit suggestions overtook human submissions". They later made up more than three-quarters of proposed changes.
- **Early 2026:** more than 5.6M articles (*The Conversation*, 2026-01-14) [S].
- **February 2026:** the Wikipedia community deprecated Grokipedia as a source (verifiability, circular sourcing, copyrighted material). Its search visibility fell sharply.
- **March to April 2026:** a rewrite mislabeled accepted edits. Suggestion handling, and then autonomous editing, stopped; the site was "effectively frozen".
- **September 2026:** autonomous updating resumed. **v0.3 released 2026-09-30.**

**Measured problems:**
- **Derivation from Wikipedia [P].** Triedman & Mantzarlis (Cornell Tech; [arXiv 2511.09685](https://arxiv.org/abs/2511.09685), 2025-11-12) compared a nearly full scrape against Wikipedia. Articles are "much longer" but "highly derivative of Wikipedia", including articles without CC notices. They found "dozens of citations to sites like Stormfront and Infowars". The rewriting concentrated on Wikipedia's highest-quality articles, especially biographies, politics, society and history.
- **Copying, broken citations and unsupported additions [P].** PolitiFact, republished by Poynter on 2025-11-13 ([link](https://www.poynter.org/fact-checking/2025/grokipedia-wikipedia-copy-ai-errors/)):
  - The "Monday" article was a 96% Copyscape match to Wikipedia's, but cited only Wikipedia, dropping Wikipedia's 22 references.
  - It cited the wrong book chapter for Clausewitz's "culminating point".
  - It cited Instagram reels as sources.
  - It added an unsupported claim about the musician Feist's father.
  - It added an uncited, probably wrong claim about the order in which Nobel prizes are presented.
  - There is no edit history.
- **Selective divergence [P, press release; paper paywalled].** Mohammadi, Yasseri et al., *PNAS*, May 2026: about 18,000 paired articles drawn from the most-edited Wikipedia pages. 66% are "more extensively rewritten": longer, more complex, with fewer references. Overall political leaning is similar, but on religion, history, literature and art Grokipedia cites more right-leaning news sources. ([TCD release, 2026-05-19](https://www.tcd.ie/news_events/articles/2026/grokipedia-research/); [PNAS](https://www.pnas.org/doi/10.1073/pnas.2603294123))
- **Downstream contamination [S].** In January 2026, *The Guardian* reported GPT-5.2 frequently citing Grokipedia, and *The Verge* reported Gemini, Copilot and Perplexity using it for some queries. Generated encyclopedias can become training and retrieval sources for other models, which risks circular sourcing.

#### 2.3 EndlessWiki and hobby "infinite wikis"

**EndlessWiki [P]** (Sean Goedecke, 2025-09-25; [post](https://www.seangoedecke.com/endless-wiki/)):
- **How it works:** every page is generated by Kimi K2 on Groq when someone first clicks a link to it, and pages take "only a few hundred ms". Each page is written once to a MySQL table and served to everyone after that.
- **Scale:** more than 62,000 pages and 200,000 links.
- **Anti-abuse:** each link carries an `origin` parameter, and the server checks that the origin page really links to the target, so people cannot generate arbitrary pages by typing URLs.
- **Failure modes:**
  - one power user, plus probably search crawlers, drove inference costs up
  - turning links into clickable divs only partly deters crawlers
  - quality is limited to what the model already knows (no retrieval)
- **Lessons [I]:**
  1. Fast inference makes "generate on navigation" feel native.
  2. Generating once and serving to everyone (a write-through cache) is the basic economic pattern.
  3. Generated link graphs invite crawling, so generation must be rate-limited and costs attributed per user.

#### 2.4 How Wikipedia has responded (2023–2026)

- **WP:LLM is now a content guideline [P].** "The use of large language models (LLMs) to generate or rewrite article content is strictly prohibited." The exceptions are LLM-suggested corrections to one's own writing (spelling and grammar level, with human review, and the text must stay "supported by the sources cited") and LLM-assisted translation. "Persistent use … outside of the above exceptions is considered disruptive" and "will result in an editor being blocked". Sanctions need "evidence beyond basic stylistic or linguistic indications". It is backed by an RfC from March 2026; the page was last edited 2026-10-13. ([Wikipedia:LLM](https://en.wikipedia.org/wiki/Wikipedia:LLM))
- **WikiProject AI Cleanup [P].** Founding sign-ups date from 2023-12-04. Under **G15**, any page "clearly entirely LLM-generated" can be speedily deleted. The project warns that AI text often cites real sources that do not support the claims, or invents sources. Examples include an AI-written article ("Leninist historiography") with fake sources, and a hoax article ("Amberlihisar") that passed review in January 2023 and was not found until December 2023. ([WikiProject AI Cleanup](https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup))
- **Wikimedia's "Simple Article Summaries" [P].** Machine-generated, pre-generated simplified summaries (project started January 2025).
  - Browser-extension test (December 2024): summaries were opened on 8.09% of eligible pageviews (825 opens from 10,198 impressions). Of 101 "was this useful?" responses, 75.2% said yes.
  - A usability study (n=8) found confusion about whether the summary was part of the article.
  - Summaries were labeled "unverified" pending a moderation workflow. A two-week mobile pilot was planned for June 2025.
  - **[T, not re-verified]:** press in June 2025 reported the pilot was paused after editor objections. The project page I fetched does not record a pause.
  - ([MediaWiki](https://www.mediawiki.org/wiki/Reading/Web/Content_Discovery_Experiments/Simple_Article_Summaries))

#### 2.5 Failure modes of generated encyclopedias

| Failure mode | Evidence | Mitigation for a literature explorer [I] |
|---|---|---|
| Copying the training source and stripping its citations | Grokipedia "Monday": 96% match, 22 references dropped (PolitiFact) | Show the source text alongside; never present derived text as original; keep the source's references |
| Unsupported "inferential linking" between true facts | STORM: ~15% unsupported sentences, mostly improper inferential linking | Check each sentence against its cited span (entailment); mark synthesized claims differently |
| Citations to low-credibility sources | Grokipedia: Stormfront, Infowars (Triedman & Mantzarlis) | Allowlist sources; show source reputation; prefer curated corpora (OA books, papers) |
| Selective rewriting on contested topics | PNAS 2026: shifts on religion, history, literature, art | Show disagreement (Co-STORM style perspectives); show diffs against a reference text |
| Machine-only editing loops | AI suggestions over 3/4 of edits by Dec 2025; site frozen Apr–Sep 2026 | A human in the loop for anything persistent and shared; edit history and version stamps |
| Circular sourcing into other AIs | Reports of GPT-5.2, Gemini and Perplexity citing Grokipedia (Jan 2026) [S] | Label generated pages machine-readably (e.g. `noindex`, provenance metadata) |
| Cost blow-ups from crawlers and power users | EndlessWiki | Generate once and share; rate-limit; require authentication for generation |
| Readers confusing generated summary with source | Wikimedia usability study | Make the visual boundary obvious; label it "AI-generated, unverified" |

---

### 3. AI-augmented textbooks, study tools and course generators

#### 3.1 Google "Learn Your Way" (AI-augmented textbook)

**What it does [P].** From the [Google Research blog, 2025-09-16](https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/) (Elidan, Haramaty):
- The learner picks a grade level and interests (e.g. sports, music). The source text is re-leveled for that grade "while keeping its scope", and generic examples are swapped for ones tied to the learner's interests.
- All other formats are generated from the personalized text: immersive text with images and embedded questions, section quizzes, slides with narration, an "audio lesson" (simulated teacher–student dialogue that raises and corrects misconceptions), mind maps, and timelines.

**Learning-gain RCT [P].**
- **Design:** 60 Chicago-area students aged 15–18 with similar reading levels, up to 40 minutes on one chapter (adolescent brain development), randomized to Learn Your Way or a PDF reader.
- **Results:**
  - immediate quiz: about **9%** higher
  - retention test 3–5 days later: **78% vs 67%**
  - 100% vs 70% said it made them more comfortable with the assessment
  - 93% vs 67% wanted to use it again
- **Publication:** the paper ([arXiv 2509.18664](https://arxiv.org/abs/2509.18664); v2 2026-03-26) was published in *Frontiers in Artificial Intelligence* 9:1783117 (2026). The abstract reports no effect sizes or p-values.

**Expert quality ratings [P].** Ten OpenStax textbooks, three personalization settings, three pedagogy experts. Average ratings were ≥0.85 on all criteria, including accuracy and coverage (the scale is not specified in the blog; probably 0–1).

**Caveats [I]:**
- one topic, one session, n=60, and the control was a PDF reader rather than another active-learning method
- novelty effects are likely
- the tool group had more practice items (embedded quizzes), which could explain part of the gain through the testing effect

Still, this is better evidence than most "AI textbook" claims. Availability: a Google Labs research experiment. I could not verify whether, as of October 2026, users can upload their own PDFs (the site is rendered client-side and the fetch returned only the title) [unverified].

#### 3.2 NotebookLM, renamed Gemini Notebook

**Timeline [P unless noted]:**
- **September 2024:** Audio Overviews, two-host podcast-style discussions of the user's sources [S: Wikipedia].
- **2025-07-29:** **Video Overviews**, first as narrated slides that pull "images, diagrams, quotes, and numbers from your documents", customizable by topic, goals and audience (English first). Studio redesign: multiple outputs of the same type, mind maps, reports. ([Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/))
- **2025-09-08** ([Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/)):
  - **flashcards and quizzes** with an "explain" option that cites the source
  - report formats (Briefing Doc, Study Guide, Blog Post, custom)
  - **Learning Guide**, a tutoring mode
  - **ready-made notebooks built on OpenStax textbooks** (Biology, AP Biology, Chemistry, Psychology, and others)
  - new Audio Overview formats: **Brief, Critique, Debate**
  - integration with Canvas and Schoology through Gemini LTI
- **Late 2025 to 2026 [S: Wikipedia]:** infographics and slide decks (November 2025), data tables (December 2025), "cinematic" video overviews, and 60-second vertical "short video overviews" (July 2026).
- **2026-07-16:** **renamed Gemini Notebook.**
  - "the same standalone product with deeper Google integration and a secure cloud computer": each notebook gets a sandbox in which Gemini can write and run code for analysis grounded in the user's sources
  - more than 30 million users and 600,000 organizations
  - available first to AI Ultra and Workspace customers, then to all Pro users on the web
  - notebooks sync with the Gemini app
  - ([Google blog](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/); [Workspace Updates](https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html))

**Limits [S, low confidence].** Third-party guides list 50 sources per notebook (free), 100 (Plus) and 300 (Pro), with each source up to 500,000 words or 200 MB. Daily output quotas differ between sources. ([notebooklm-guide.com](https://notebooklm-guide.com/notebooklm-system-limits-benchmarks/))

**Critiques [S].** A 2026 study by Jill Walker Rettberg, as summarized on Wikipedia, argues that Audio Overviews flatten content into a standard format and add American framing irrelevant to the source. In 2026 a journalist sued Google alleging the podcast voice imitated his; Google denies it. ([Wikipedia: NotebookLM](https://en.wikipedia.org/wiki/NotebookLM))

**Assessment [I].** NotebookLM / Gemini Notebook is the benchmark for "bring your own sources → generated study artifacts". Its design choices are worth copying:
- strict grounding in the uploaded sources
- inline citations
- many output formats generated from one source set
- curated open-textbook starter notebooks

Its weak points for a literature explorer:
- notebooks are closed silos with no cross-notebook library graph
- there is a cap on sources per notebook
- generated audio and video carry no claim-level provenance (you cannot click from a spoken sentence to the passage behind it)

#### 3.3 Google Illuminate

- **[S, 2026-05-18]** Still "labeled as a Google Labs experiment". It is optimized for arXiv-style papers and public URLs; it does not accept local PDFs or paywalled pages.
- It makes a 5–8 minute two-host audio discussion with a synced, clickable transcript and MP3 download. Users can set audience (beginner, general, expert), tone and length, or write a free-form prompt.
- About 20 generations a day; episodes are kept for 30 days unless saved.
- ([MakeUseOf](https://www.makeuseof.com/notebooklm-alternative-illuminate-better-research-tool/))
- **[P, 2026-10-15]** illuminate.google.com loads with an "Experiment" label; no further detail could be fetched. ([illuminate.google.com](https://illuminate.google.com/))
- **Assessment [I].** Illuminate's transcript-synced audio is the closest existing product to "audio with provenance", but the transcript links to the audio, not to the source paper's passages.

#### 3.4 Khanmigo

**[P]** Pricing ([khanmigo.ai/pricing](https://www.khanmigo.ai/pricing), fetched 2026-10-15):
- **Teachers:** free (lesson planning, rubrics, summaries of student work, and similar).
- **Learners and parents:** **$4/month or $44/year** (tutoring, guided writing and debate, coding feedback, career coaching; the family plan adds child accounts and moderation alerts).
- **Districts:** price on request (SSO, rostering, data).

**[S]** One third-party source lists a district add-on at $15 per student per year. **I found no independent learning-outcome RCT for Khanmigo in this session [unverified].**

**Relevance [I].** Khanmigo's Socratic, "don't just give the answer" design suits tutoring more than literature exploration. Its low consumer price shows what people expect to pay for a single-purpose AI learning tool.

#### 3.5 LLM-generated textbooks and course generators

- **Cosmopedia (Hugging Face, 2024-03-20) [P, possibly stale].** More than 30M synthetic textbooks, blog posts, stories and WikiHow-style articles (~25B tokens), generated by Mixtral-8x7B with over 10k H100 GPU-hours. Topics were seeded from Stanford courses, Khan Academy, OpenStax and WikiHow, plus 112 web-derived topic clusters (more than 80% of prompts).
  - Duplication was under 1%, but only after explicit instructions to vary format.
  - Stock openings ("Once upon a time") persisted.
  - The authors acknowledge hallucinations, including in history and math.
  - ([HF blog](https://huggingface.co/blog/cosmopedia))
  - **Lesson [I]:** an "infinite textbook library" is technically easy and cheap. It was built for *training models*, not for humans to read; without grounding it inherits the generator's errors.
- **A commercially published, LLM-generated book with fabricated references [P].** *Mastering Machine Learning: From Basics to Advanced* (Springer Nature, April 2025, $169). Of 18 of its 46 citations that were checked, about two-thirds did not exist or had substantial errors. The book had no AI-use declaration, which Springer's policy requires. ([Retraction Watch, 2025-06-30](https://retractionwatch.com/2025/06/30/springer-nature-book-on-machine-learning-is-full-of-made-up-citations/))
- **Course and "learning chat" generators.** Oboe markets itself as "Chat that actually teaches you": structured, cited, personalized, with a free sign-up; no pricing was shown in October 2026 [P, thin] ([oboe.com](https://oboe.com/)). NotebookLM's Learning Guide (above) and Learn Your Way are the strongest grounded examples. **[T, not re-verified]** ChatGPT "study mode" (July 2025), Gemini "Guided Learning" (August 2025) and Claude's learning mode for education (2025) are general-purpose tutoring modes, not textbook generators.
- **Published reading recommendations [S].** In May 2025 the *Chicago Sun-Times* and *Philadelphia Inquirer* ran a licensed "Best of Summer" insert whose AI-generated reading list "included nonexistent books and made-up quotes". The writer said he used AI and did not fact-check. ([Wikipedia: Chicago Sun-Times](https://en.wikipedia.org/wiki/Chicago_Sun-Times)) **[T]:** widely reported as 10 of 15 titles being fake; not re-verified here.

#### 3.6 Personalized reading: adaptive-level summaries

- **Re-leveling is now an established technique.** Learn Your Way re-levels to grade "while keeping its scope". NotebookLM, Illuminate and Wikimedia's Simple Summaries all let the reader choose an audience level. [P]
- **The evidence is thin [I].** Apart from Learn Your Way's n=60 RCT, I found no rigorous evaluation of whether level-adapted summaries of *books or papers* keep the important claims. FABLES-style omission errors are the obvious risk: simplification drops nuance, hedges and minority positions.
- **Design implication [I].** Any reading-level slider should come with a "what was simplified away" view, a diff of claims present at the expert level but missing at the novice level, and a one-click path back to the original passage.

#### 3.7 Comparison of learning and study tools (as of October 2026)

| Tool | Generates | Grounded in | Price | Learning-gain evidence | Status | Source |
|---|---|---|---|---|---|---|
| Learn Your Way | Re-leveled text, quizzes, slides+narration, audio lesson, mind maps, timelines | One textbook chapter | Free (Labs) | RCT n=60: +11 pts retention | Labs experiment; current scope unverified | [P] |
| Gemini Notebook (ex-NotebookLM) | Audio/Video Overviews, mind maps, flashcards, quizzes, reports, infographics, slides; code sandbox | The user's sources (OpenStax starter notebooks) | Free tier; Pro/Ultra plans | None found (testimonials only) | GA; renamed 2026-07-16 | [P] |
| Illuminate | 5–8 min audio discussion with synced transcript | arXiv/public URLs | Free | None | Labs experiment (May 2026) | [S] |
| Khanmigo | Socratic tutoring, writing feedback | Khan content and general model knowledge | $4/mo learner; free for teachers | None independent found | GA | [P] |
| STORM / Co-STORM | Wikipedia-style article; mind-map discourse | Web search or the user's documents (VectorRM) | Free / open source (MIT) | Preference study (70%/78%) | Research preview; repo quiet since 2025 [~60%] | [P] |
| Grokipedia | Encyclopedia articles | Wikipedia and web, opaque | Free | n/a; documented errors and bias | v0.3 (2026-09-30); deprecated as a Wikipedia source | [P/S] |

---

### 4. Risks and evidence

#### 4.1 Hallucinated citations: what the rates look like

| Study / event | Date | Setting | Finding | Label |
|---|---|---|---|---|
| Walters & Wilder, *Scientific Reports* 13:14045 | 2023-09-07 | ChatGPT writing literature reviews | **55%** of 222 GPT-3.5 citations fabricated; **18%** of 414 GPT-4 citations fabricated; among real citations, 43% (GPT-3.5) and 24% (GPT-4) had substantive errors | [P] (possibly stale) ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/)) |
| Tow Center / CJR | 2025-03-06 | 8 AI search engines, 1,600 queries to identify a news article from an excerpt | **>60%** answered incorrectly overall; Perplexity 37%; Grok 3 94% (154/200 citations led to error pages); ChatGPT Search 134/200 wrong and declined to answer 0 times | [P] ([CJR](https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php)) |
| DeepTRACE (Salesforce) | 2025-09-02 | Deep-research and search systems (GPT-4.5/5, Perplexity, Copilot, Gemini, You.com) | **Citation accuracy 40–80%**; many statements unsupported by the system's own cited sources; one-sided on debate questions even in deep-research modes | [P] ([arXiv 2509.04499](https://arxiv.org/abs/2509.04499)) |
| STORM | 2024 | Generated Wikipedia-style articles | ~15% of sentences unsupported by their citations | [P] |
| Springer ML book | 2025-06-30 | Published $169 textbook | ~2/3 of 18 checked citations fabricated or substantially wrong | [P] |
| GPTZero / NeurIPS | 2026-01-21 | 4,841 of 5,290 NeurIPS 2025 accepted papers scanned | **≥100 hallucinated citations** in 51–53 papers, each confirmed by a human expert; the tool catches ~99/100 flawed citations but also flags unfindable real works | [P] ([GPTZero](https://gptzero.me/news/neurips/)) |
| Charlotin AI Hallucination Cases database | updated 2026-10-15 | Court filings | **2,190 cases**; tags: Fabricated 1,796, Misrepresented 926, False Quotes 584, Outdated Advice 36 | [P] ([database](https://www.damiencharlotin.com/hallucinations/)) |
| Grokipedia (PolitiFact) | 2025-11 | Generated encyclopedia | Wrong chapters cited, reels used as sources, claims not in the cited source | [P] |

**Interpretation [I]:**
- Outright *fabrication* of references has fallen sharply when models can retrieve. The 2023 rates of 18–55% came from models without retrieval.
- *Misattribution* has not fallen: a real source cited for a claim it does not support. That is now the dominant failure, at 20–60% of citations depending on the system (DeepTRACE, Tow Center, STORM).
- Anthropic's Citations API returns `cited_text` with character, page or block locations and guarantees "valid pointers to the provided documents". `cited_text` does not count toward output tokens, and citations cannot be combined with structured outputs. A valid pointer proves the quoted span exists; it does *not* prove the span supports the claim. ([Anthropic docs](https://platform.claude.com/docs/en/build-with-claude/citations)) [P]

#### 4.2 Faithfulness of book-length summaries

**BooookScore [P]** (Chang, Lo, Goyal, Iyyer; ICLR 2024; [arXiv 2310.00785](https://arxiv.org/abs/2310.00785)).
- 1,193 human annotations of GPT-4 summaries of 100 recent books identified **8 types of coherence error**.
- BooookScore, the automatic metric (share of sentences free of those errors), saved an estimated $15K and 500 hours of human evaluation.
- *Hierarchical merging* of chunk summaries scored higher than *incremental updating*, but the incremental approach gave more detail, which annotators sometimes preferred.
- GPT-4 and Claude 2 outperformed open models.

**FABLES [P]** (Kim, Chang, Karpinska, Garimella, Manjunatha, Lo, Goyal, Iyyer; COLM 2024; [arXiv 2404.01261](https://arxiv.org/abs/2404.01261); [full text](https://arxiv.org/html/2404.01261v2)). (2024 models, possibly stale.)
- 3,158 claims from LLM summaries of 26 books published in 2023–24, annotated by people who had read each book in full.
- Cost: $5.2K total, $200 per book (~11 annotator-hours).

| Model (2024) | Faithful | Unfaithful | Partial support |
|---|---|---|---|
| Claude 3 Opus | 90.89% | 2.10% | 6.65% |
| GPT-4 | 78.15% | 4.55% | 15.98% |
| GPT-4-Turbo | 77.62% | 7.64% | 12.08% |
| GPT-3.5-Turbo | 71.52% | 11.26% | 13.08% |
| Mixtral | 68.67% | 11.47% | 17.20% |

- Most unfaithful claims concern **events and character states** and need indirect reasoning over the narrative to detect.
- **Omissions** follow a typology, with "a systematic over-emphasis on events near the end of the book".
- **LLM-as-judge for faithfulness fails.** The best automatic rater, Claude 3 Opus given the whole book, reached only F1 = 58.2 on unfaithful claims.
- Summarization method: hierarchical merging. Chunk sizes were 2,048 tokens for GPT-3.5/GPT-4/Mixtral, 100k for GPT-4-Turbo and 180k for Claude 3 Opus. The best result came from the model that saw the most of the book at once [I: suggestive, confounded with model quality].

**Implications [I]:**
- Generated book summaries should be treated as roughly 90% faithful at best, with omissions that are invisible to the reader.
- Automated verification is not reliable enough to replace human spot checks.
- A coverage visualization (which chapters the summary draws on) directly addresses the end-of-book bias.

#### 4.3 Long-context reading benchmarks

| Benchmark | Date | What it tests | Headline | Label |
|---|---|---|---|---|
| **NoCha** (Karpinska, Thai, Lo, Goyal, Iyyer; EMNLP 2024) | 2024-06 (leaderboard updated 2025-07-18) | 1,001 minimally different true/false claim pairs about 67 recent novels; scored by pairs (both claims right) | Best model then, GPT-4o: **55.8%**; no open-weight model above chance; humans ~97%; global-reasoning pairs and speculative fiction much harder; models' explanations often wrong even when the label is right | [P] ([arXiv](https://arxiv.org/abs/2406.16264); [leaderboard](https://novelchallenge.github.io/); [repo](https://github.com/marzenakrp/nocha)) |
| **NoLiMa** (ICML 2025) | 2025-02 | Needle retrieval with minimal lexical overlap between question and needle | At 32K, **11 of 13** models fell below 50% of their short-context baseline; GPT-4o dropped from 99.3% to 69.7% | [P] ([arXiv 2502.05167](https://arxiv.org/abs/2502.05167)) |
| **LongBench v2** | 2024-12 | 503 multiple-choice questions, 8k–2M words | Human experts 53.7% with a 15-minute limit; best direct-answer model 50.1%; o1-preview 57.7% | [P] ([arXiv 2412.15204](https://arxiv.org/abs/2412.15204)) |
| **Context Rot** (Chroma) | 2025-07-14 | 18 models; controlled-difficulty tasks of increasing length | Performance falls with input length alone; distractors hurt more as length grows; Claude models abstained more, GPT models hallucinated more; **shuffled haystacks scored better than coherent ones** | [P] ([Chroma](https://www.trychroma.com/research/context-rot)) |
| Vectara Hallucination Leaderboard (HHEM-2.3) | updated 2026-09-22 | Summarizing short documents (~7,700 articles of 50–24k words) | Best 1.8%; frontier models **7–14%** (e.g. claude-opus-4-7 12.0%, claude-sonnet-4-6 10.6%, gpt-5.5 9.3%, gemini-3-pro-preview 13.6%, gemini-2.5-pro 7.0%) | [P] ([GitHub](https://github.com/vectara/hallucination-leaderboard)) |

**Caveats [I]:**
- NoCha and FABLES numbers are for 2024 models. The 2026 frontier (Claude Opus 5.5, Gemini 3.x/4, GPT-6) is probably much better, but I could not fetch current NoCha leaderboard scores. Do not assume the problem is solved.
- Vectara's leaderboard is not a good model-selection tool for reading tasks. Its rates depend heavily on the judge model and dataset (a harder dataset since late 2025), and several large frontier models score *worse* than small ones, which probably reflects verbosity and added inference rather than poorer reading.
- **What does generalize:**
  1. Global reasoning over a whole book is harder than retrieval.
  2. Long inputs degrade quality even when everything fits in the context window.
  3. Model explanations are less reliable than model labels.

So "put the whole book in context" is viable for cost (section 5) but should be combined with retrieval and section-level checks.

#### 4.4 Is generated content worse, or just differently wrong?

**[I]** Across the evidence:
- **Fabrication** (invented books, papers, cases) is rare once outputs are grounded and checked against catalogs, and it is mechanically detectable (GPTZero catches ~99/100).
- **Misattribution and unsupported inference** are common (15–60%) and need semantic checks.
- **Omission and framing bias** (FABLES ending bias; Grokipedia's selective divergence; the critique of NotebookLM's flattening) are largely invisible and hard to measure without a reference.

Interfaces should be designed around the last two.

---

### 5. Cost and latency of on-the-fly generation at October 2026 prices

#### 5.1 Price table (USD per million tokens; fetched 2026-10-15) [P]

| Provider / model | Input | Output | Cache read | Notes | Source |
|---|---|---|---|---|---|
| Claude Fable 5.1 | $10 | $50 | $0.25 (0.025×) | Most capable widely released Claude model | [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) |
| **Claude Opus 5.5** | **$4** | **$20** | **$0.20 (0.05×)** | 5m cache write $5; 1h write $8; 1M context at standard price; fast mode $8/$40 | same |
| Claude Opus 5 | $5 | $25 | $0.50 | | same |
| **Claude Sonnet 5.5** | **$2** | **$10** | **$0.10 (0.05×)** | 5m write $2.50; 1h write $4 | same |
| Claude Sonnet 5 | $2 | $10 | $0.20 | Introductory price made permanent | same |
| **Claude Haiku 5.5** | **$0.10** (≤100k prompt) / $0.50 (>100k) | **$0.50** / $2.50 | $0.01 / $0.05 | Prices tier by prompt length | same |
| Claude Haiku 4.5 | $1 | $5 | $0.10 | | same |
| Anthropic Batch API | 50% off input and output | | | Stacks with caching | same |
| Anthropic web search | $10 per 1,000 searches + tokens | | | | same |
| Gemini 4 Argon | $2 → $4 from 2026-12-01 | $10 → $20 | $0.10 → $0.20 | Implicit caching only | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) (updated 2026-10-14) |
| Gemini 3.1 Pro Preview | $2 (≤200k) / $4 | $12 / $18 | $0.20 / $0.40 + $4.50/MTok-hour storage | | same |
| Gemini 3.8 / 3.6 Flash | $0.75 → $1.50 from 2027-01-01 | $3.75 → $7.50 | $0.075 | | same |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | $0.025 | | same |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | $0.01 | | same |
| Gemini Batch/Flex | ~50% off | | | | same |
| gpt-6-astra | $10 | $50 | $1.00 | | [OpenAI pricing](https://developers.openai.com/api/docs/pricing) |
| gpt-6-sol / gpt-6.1-sol | $2 | $10 | $0.20 / $0.10 | | same |
| gpt-6-luna | $0.10 | $0.50 | $0.01 | | same |
| gpt-5.5 | $5 | $30 | $0.50 | >272k input: $10/$45 | same |
| OpenAI Batch/Flex | ~50% off | | | | same |
| v0 Mini / Pro / Max | $0.20 / $2 / $5 | $1.20 / $10 / $25 | $0.02 / $0.20 / $0.50 | App-builder credits | [v0](https://v0.app/pricing) |

**Tokenizer caution [P].** Claude 4.7 and later models use a tokenizer that "produces approximately 30% more tokens for the same text". A 100,000-word book is therefore about 130k tokens on older tokenizers and about 170k on new Claude models [I: words-to-tokens ratio assumed at ~1.3].

#### 5.2 Worked cost examples [I: my calculations from the table above]

Assumptions: no thinking-token overhead (add 20–100% to output cost for hard reasoning tasks); standard tier unless noted.

| Task | Tokens (in / out) | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Gemini 3.1 Pro | Gemini 3.1 Flash-Lite | gpt-6-luna |
|---|---|---|---|---|---|---|---|
| Chapter explainer (chapter plus instructions), uncached | 33k / 4k | $0.21 | $0.11 | $0.005 | $0.11 | $0.014 | $0.005 |
| Same, with the chapter in cache | 33k cached / 4k | $0.087 | $0.043 | ~$0.002 | — | — | — |
| Generative-UI page (Google-style long system prompt, HTML output) | 10k / 15k | $0.34 | $0.17 | $0.009 | $0.20 | $0.025 | $0.008 |
| Whole-book summary | 150k / 5k | $0.70 | $0.35 | $0.09 (>100k tier) | $0.36 | $0.045 | $0.018 |
| Same, Batch API | 150k / 5k | $0.35 | $0.175 | $0.044 | $0.18 | $0.023 | $0.009 |
| Question against a whole cached book | 150k cached + 0.2k / 0.5k | ~$0.04 (first 5-min cache write ≈ $0.75) | ~$0.02 (write ≈ $0.375) | ~$0.009 | — | — | — |
| RAG question (10k retrieved, uncached) | 10k / 0.5k | ~$0.05 | ~$0.025 | ~$0.001 | ~$0.026 | ~$0.003 | ~$0.001 |
| **Precompute summaries for 10,000 books (Batch)** | 1.5B / 50M | **~$3,500** | **~$1,750** | **~$440** | **~$1,800** | **~$225** | **~$90** |

**What this means [I]:**
1. **Per-reader generation is cheap enough to be a non-issue for one researcher.** Even heavy use (500 Opus-class generations a day at about $0.20 each) is about $100/day, and a Sonnet/Haiku mix brings that to single dollars.
2. **For a shared tool, multiply by readers.** With 1,000 readers each generating their own summary of the same book, generation costs scale 1,000×. Shared generation, write-through caching, and precomputation are the main levers.
3. **With a cached book, whole-book questions cost about the same as a modest RAG call on Opus or Sonnet**, because cache reads are 0.05× the input price. RAG still wins on cost per question at scale and on *quality* for very long inputs (Context Rot, NoLiMa). The whole-book approach wins on global questions ("how does the narrator's view of X change?"). A hybrid makes sense: cached whole-book context plus retrieved, highlighted passages.
4. **Verification costs more than generation.** One FABLES-style human faithfulness check ($200 per book) costs about as much as 300 Opus 5.5 book summaries. This is the strongest economic argument for generating once, checking once, and serving many times.

#### 5.3 Latency

| System | Latency | Source |
|---|---|---|
| Google Generative UI (full HTML page) | "often … a minute or two"; streaming halves the time to a usable page | [P] paper |
| EndlessWiki (Kimi K2 on Groq; short wiki page) | "only a few hundred ms" per new page | [P] |
| Claude Opus 5.5 fast mode | "up to 2.5x higher output tokens per second" at 2× price ($8/$40) | [P] Anthropic pricing/docs via the claude-api skill reference, cached 2026-10-06 |
| Batch APIs (Anthropic, Gemini, OpenAI) | asynchronous; Anthropic documents completion within 24 hours [T] | [P/T] |

**Rule of thumb [I].** Output time ≈ output tokens ÷ throughput. At roughly 50–150 tokens/s on frontier models (my assumption; I could not fetch current per-model speed data), a 4k-token explainer takes 30–80 s and a 15k-token HTML page 2–5 minutes. Anything a reader must *wait for* should be under about 1k output tokens or streamed, or precomputed.

#### 5.4 Caching strategies

**Provider-level prompt caching [P]:**
- **Anthropic:** cache writes cost 1.25× (5-minute TTL) or 2× (1-hour TTL). Reads cost 0.1× generally, 0.05× on Opus 5.5 and Sonnet 5.5, and 0.025× on Fable 5.1.
  - **[I]** With a 5-minute TTL, two uses of a prefix already beat no caching (1.25 + 0.1 < 2). With a 1-hour TTL you need about three (2 + 0.2 < 3).
- **Gemini:** implicit caching is on by default for 2.5 and newer models. Minimum prefixes are 4,096 tokens (Gemini 4 Argon, 3.x) and 2,048 (2.5). Explicit caching is not available on Gemini 4 Argon or in the Interactions API. Cache reads are 5–10% of input; explicit caches also pay storage (e.g. $4.50 per MTok-hour on 3.1 Pro). ([Gemini caching docs](https://ai.google.dev/gemini-api/docs/caching); [pricing](https://ai.google.dev/gemini-api/docs/pricing))
- **OpenAI:** cached input is about 10% of input (e.g. gpt-6-sol $0.20 vs $2.00). [P]

**Application-level caching [I, informed by EndlessWiki and MCP Apps]:**
1. **Content-addressed artifact store.** Key = hash(source text version, prompt template version, model ID, reading level, output type). Store the artifact, its provenance and its review status. Any reader asking for the same thing gets the stored copy. This is EndlessWiki's write-through pattern with versioning.
2. **Template/data split.** MCP Apps separates static `ui://` templates, which hosts can prefetch and cache, from dynamic tool results. Generate *data* (claims, quotes, structure) per request and keep *presentation* in templates.
3. **Speculative prefetch.** Pre-generate the likely next views (the next chapter, linked concepts) with a cheap model while the reader is reading. Upgrade to a strong model only if the reader dwells there.
4. **Keep prompt prefixes stable.** Put the book and system prompt first and the user question last, to maximize prefix-cache hits.
5. **Invalidate when models improve.** The Generative UI paper's model table shows quality rising sharply across generations. Store model and date with each artifact, and regenerate in batches when a better model ships.

---

### 6. Generate on the fly, precompute, or curate?

**Recommended split for a literature explorer [I, with the evidence behind each row]:**

| Layer | Examples | Who or what produces it | Why |
|---|---|---|---|
| **Human-curated (or authoritative-source) only** | Bibliographic records (titles, authors, editions, identifiers); rights and license status; verbatim quotes; canonical text; expert reading lists; subject taxonomies (e.g. LC outline) | Catalogs (Open Library, Crossref, OpenAlex), publishers, librarians, the user | Fabricated or misattributed references are the most common and most damaging error (sections 4.1, 3.5). Wikipedia now bans generated article prose. Rights errors have legal consequences. |
| **Precomputed, cached and spot-checked** | Book and chapter summaries at 2–3 levels; key-claim indices with source spans; concept and entity graphs; glossaries; quiz banks; "prerequisites" links; NoCha-style true/false claim pairs for self-testing; embeddings | Batch API with strong models; automatic entailment checks; human spot checks on a sample | Many readers see the same artifact, so check once and serve many times. Batch pricing is 50% off. Faithfulness is ~90% at best and machine checkers are weak (F1 58), so human sampling is needed. |
| **Generated on the fly** | Answers to the reader's questions (grounded, with citations); re-leveling for one reader; comparisons across chosen works; layouts and "lenses" (timeline, debate map) built from a component catalog; links from the reader's notes to the library; "why read this next" explanations | Fast or cheap models for drafts; strong models when the reader asks; templates from a fixed catalog | Per-reader, so caching rarely helps. Cheap at 2026 prices. Latency can be handled by streaming and short outputs. |
| **Never generate** | Citations without catalog resolution; "quotes" that don't match the source verbatim; numbers without a source span; claims about rights or availability | — | These are exactly the documented failures (Springer book, Sun-Times list, Grokipedia, legal filings). |

**A middle category: generated, then promoted [I].** On-the-fly artifacts that many readers request (e.g. "explain chapter 3 for a novice") can be *promoted* into the precomputed layer once enough people ask for them and they pass a check. This is Wikipedia's model of human review applied to a cache.

### 7. How to show provenance and uncertainty in generated content

Patterns drawn from the evidence, each marked [I] unless a source is given:

1. **Claim-level provenance with types.** Each generated sentence carries one of:
   - (a) **Quoted:** verbatim, with a locator. The Citations API's `cited_text` with char/page/block locations makes this cheap [P].
   - (b) **Paraphrased** from a span: show the span on hover.
   - (c) **Synthesized** across several spans: show all of them, and the reasoning connecting them, since STORM's most common error was "improper inferential linking".
   - (d) **Model knowledge, unsourced:** visually distinct, e.g. grey italics, and off by default for factual claims.
2. **Say how each claim was checked:** "auto-checked by entailment model X", "two models agreed", "human-verified on date", or "unchecked". Never show a checkmark for an LLM-judge pass without saying so; FABLES shows LLM judges are unreliable.
3. **Coverage strip.** For summaries, a thin bar across the book's chapters showing where the summary drew its claims. This exposes FABLES' "over-emphasis on events near the end" and Wikimedia's "what was left out" concern.
4. **Clear visual boundary and label.** Wikimedia's usability study found readers confused the generated summary with the article. Use a distinct container, an "AI-generated" label, and the model and date.
5. **Version stamps and regeneration history.** Model ID, prompt version, source hash and date, so stale artifacts can be found and regenerated. This also answers Grokipedia's "no edit history" problem.
6. **Show disagreement, not a smooth answer.** DeepTRACE found deep-research systems "highly one-sided" on debate queries. For contested topics, show perspectives side by side (Co-STORM style) with their sources.
7. **Uncertainty from cheap signals:**
   - agreement between models from different families
   - self-consistency across samples
   - whether a claim's support span was found
   - the reader's own flags, aggregated into an empirical error rate per artifact type ("in the last 30 days readers flagged 3 errors per 100 claims in chapter summaries")
8. **Generated references must resolve.** Before showing a reference, resolve it against Crossref, OpenAlex, ISBN or Open Library. Unresolved references are shown struck through, with "could not verify". GPTZero shows this is automatable at a ~99% catch rate [P].

---

## Numbers that matter

| Quantity | Value | Date | Source | Label / confidence |
|---|---|---|---|---|
| Generative UI vs markdown, pairwise preference | 82.8% (LMArena set); 90.5% (info-seeking set) | Feb 2026 | [arXiv 2604.09577](https://arxiv.org/abs/2604.09577) | [P] high |
| Generative UI vs human-expert page | Expert wins 50.0%, GenUI wins 35.3%, ties 14.7% [I] | Feb 2026 | same | [P] high |
| Generative UI generation time | "often … a minute or two"; streaming cuts it ~50% | Feb 2026 | same | [P] high |
| Output-error rate, Gemini 2.0 Flash-Lite vs Gemini 3 (GenUI) | 60% vs 0% | Feb 2026 | same | [P] high |
| MCP Apps became an official extension | 2026-01-26 | Jan 2026 | [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) | [P] high |
| A2UI production version | v0.9.1 (v1.0 RC); 16.7k GitHub stars | Oct 2026 | [GitHub](https://github.com/google/A2UI) | [P] high |
| Claude artifact persistent storage limit | 20 MB per artifact, text only | Oct 2026 | [Claude Help Center](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) | [P] high |
| Imagine with Claude availability | 5 days, Max subscribers, from 2025-09-29 | Sep 2025 | [Anthropic](https://www.anthropic.com/news/claude-sonnet-4-5) | [P] high |
| v0 Plus / Business price | $30 / $100 per user per month | Oct 2026 | [v0](https://v0.app/pricing) | [P] medium (page undated; "$90" ambiguity) |
| STORM vs RAG: organized / broad coverage | +25% / +10% absolute | 2024 | [arXiv 2402.14207](https://arxiv.org/abs/2402.14207) | [P] high (possibly stale) |
| STORM unsupported sentences | ~15% | 2024 | [full text](https://arxiv.org/html/2402.14207v2) | [P] high (possibly stale) |
| Co-STORM preferred over search engine / RAG chatbot | 70% / 78% | 2024 | [arXiv 2408.15232](https://arxiv.org/abs/2408.15232) | [P] high (possibly stale) |
| Grokipedia articles at launch / early 2026 | ~885k / >5.6M | Oct 2025 / Jan 2026 | [Poynter](https://www.poynter.org/fact-checking/2025/grokipedia-wikipedia-copy-ai-errors/); [Wikipedia](https://en.wikipedia.org/wiki/Grokipedia) | [P]/[S] medium |
| Grokipedia articles "more extensively rewritten" | 66% of ~18,000 pairs | May 2026 | [TCD/PNAS](https://www.tcd.ie/news_events/articles/2026/grokipedia-research/) | [P] medium-high |
| Grokipedia "Monday" match to Wikipedia | 96% (Copyscape) | Nov 2025 | Poynter/PolitiFact | [P] high |
| Wikipedia ban on LLM-generated article content | Content guideline; RfC March 2026 | Oct 2026 | [WP:LLM](https://en.wikipedia.org/wiki/Wikipedia:LLM) | [P] high |
| Learn Your Way retention (3–5 days) | 78% vs 67% (n=60) | Sep 2025 | [Google Research](https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/) | [P] high (effect estimate: medium) |
| Gemini Notebook users | >30M people; >600k organizations | Jul 2026 | [Google blog](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/) | [P] high |
| Khanmigo learner price | $4/month or $44/year; teachers free | Oct 2026 | [khanmigo.ai](https://www.khanmigo.ai/pricing) | [P] high |
| Fabricated citations, GPT-3.5 / GPT-4 (no retrieval) | 55% / 18% | Sep 2023 | [Sci. Reports](https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/) | [P] high (stale) |
| AI search engines wrong on citation-identification queries | >60% of 1,600 | Mar 2025 | [CJR](https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php) | [P] high |
| Deep-research citation accuracy | 40–80% | Sep 2025 | [DeepTRACE](https://arxiv.org/abs/2509.04499) | [P] medium (LLM-judged) |
| NeurIPS 2025 accepted papers with hallucinated citations | ≥100 citations in 51–53 papers (of 4,841 scanned) | Jan 2026 | [GPTZero](https://gptzero.me/news/neurips/) | [P] medium-high |
| Court cases with AI-hallucinated material | 2,190 | 2026-10-15 | [Charlotin](https://www.damiencharlotin.com/hallucinations/) | [P] high |
| FABLES faithful-claim rate (best, Claude 3 Opus) | 90.89% | 2024 | [FABLES](https://arxiv.org/html/2404.01261v2) | [P] high (stale models) |
| FABLES best LLM-judge F1 on unfaithful claims | 58.2 | 2024 | same | [P] high |
| Human faithfulness annotation cost | $200 per book (~11 h); $5.2K for 26 books | 2024 | same | [P] high |
| NoCha best model (GPT-4o) vs humans | 55.8% vs ~97% pair accuracy | 2024 | [arXiv](https://arxiv.org/abs/2406.16264); [repo](https://github.com/marzenakrp/nocha) | [P] high (stale models) |
| NoLiMa: models below 50% of baseline at 32K | 11 of 13 | 2025 | [arXiv](https://arxiv.org/abs/2502.05167) | [P] high |
| Vectara summarization hallucination, frontier models | ~7–14% (best 1.8%) | 2026-09-22 | [GitHub](https://github.com/vectara/hallucination-leaderboard) | [P] medium (method-dependent) |
| Claude Opus 5.5 / Sonnet 5.5 / Haiku 5.5 prices | $4/$20; $2/$10; $0.10/$0.50 per MTok | 2026-10-15 | [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) | [P] high |
| Opus 5.5 / Sonnet 5.5 cache read multiplier | 0.05× | 2026-10-15 | same | [P] high |
| Batch discount (Anthropic, Gemini, OpenAI) | 50% | 2026-10 | pricing pages | [P] high |
| Gemini 3.1 Flash-Lite | $0.25 in / $1.50 out | 2026-10-14 | [Gemini](https://ai.google.dev/gemini-api/docs/pricing) | [P] high |
| gpt-6-luna | $0.10 in / $0.50 out | 2026-10-15 | [OpenAI](https://developers.openai.com/api/docs/pricing) | [P] high |
| Whole-book (150k-token) summary cost, Opus 5.5 / Haiku 5.5 | ~$0.70 / ~$0.09 | 2026-10 | calculation | [I] |
| EndlessWiki new-page latency | "a few hundred ms" (Kimi K2 on Groq) | Sep 2025 | [post](https://www.seangoedecke.com/endless-wiki/) | [P] high |

---

## Surprises and recent changes (2024–2026)

1. **English Wikipedia banned LLM-generated article prose** (WP:LLM, RfC March 2026). This is much stricter than the 2023–2025 practice of tagging and cleanup. [P]
2. **Grokipedia nearly stopped.** AI-generated edits overtook human ones by December 2025, the site froze from about April to September 2026, v0.3 shipped 2026-09-30, and Wikipedia deprecated it as a source. Studies tie it to circular sourcing into other assistants. [P/S]
3. **NotebookLM is now "Gemini Notebook"** (2026-07-16), with a code-execution sandbox in each notebook and more than 30M users: grounded study tools are now mainstream. [P]
4. **MCP Apps went from proposal to the first official MCP extension in about two months** (2025-11-21 to 2026-01-26), with OpenAI and Anthropic co-authoring. Generated UI inside chat now has a cross-vendor standard. [P]
5. **Google published generative UI as a measured research result.** Pre-cached generative UI is preferred to markdown 83% of the time, and the ability arrived abruptly with Gemini 2.5/3 (older small models broke 29–60% of pages). [P]
6. **Prices fell and caching got much cheaper.** Opus-class input is now $4/MTok, with cache reads at 0.05× ($0.20). Haiku 5.5 is $0.10/$0.50 and gpt-6-luna $0.10/$0.50. Gemini 4 Argon offers implicit caching only. The 1M-token context is billed at the standard rate on Claude 4.6+ (except Haiku 5.5). Whole-book prompting is now cheap. [P]
7. **Fabricated references reached prestigious venues:** a $169 Springer textbook (2025) and NeurIPS 2025 accepted papers (≥100 hallucinated citations). [P]
8. **The consensus on how to build generated UI moved toward constraint.** The Vercel AI SDK marks RSC/`streamUI` experimental in favor of typed tool parts; Google's A2UI uses a declarative component catalog; MCP Apps runs templates in sandboxed iframes. Free-form "the model writes the app" remains a research demo (Imagine with Claude lasted 5 days). [P/I]
9. **OpenAI appears to have re-framed ChatGPT apps as "Plugins"** (skills + MCP servers + optional UI) on its developer site by October 2026. [P, details unclear]
10. **Long context is not the same as long-document understanding.** Shuffled text scored *better* than coherent text in Context Rot's experiments, a strong hint that model "reading" is not human-like reading. [P]

---

## Contested or uncertain points

1. **Do generative interfaces improve understanding, or only preference?** The Google study measured preference on pre-cached pages, not learning or accuracy. Learn Your Way measured learning, with n=60 on one chapter. No large RCT exists for generative UI in reading or learning. [I; ~60% that a well-designed generated study view improves retention over a static PDF for novices; much lower confidence for experts]
2. **How faithful are 2026 frontier models on book-length summaries?** FABLES and NoCha used 2024 models. I could not retrieve current leaderboards. Vectara's 2026 numbers (7–14% for frontier models) come from short-document summarization with a different method and are not comparable. [unverified]
3. **Grokipedia's article count and status.** The ">5.6M" figure is second-hand (*The Conversation*, via Wikipedia), and the freeze and resumption timeline comes from Wikipedia's synthesis of press reports. [S, medium]
4. **Websim's status.** The site is live as of October 2026, but shutdown rumors and funding records conflict. [low]
5. **Whether Gemini's dynamic view and visual layout are still separate experiments or generally available** in October 2026. [unverified]
6. **The OpenAI Apps SDK to "Plugins" change.** OpenAI's developer site now centers on Plugins with optional UI; I could not fetch openai.com announcements (HTTP 403), so the exact relationship and dates are unclear. [medium-low]
7. **NotebookLM / Gemini Notebook quotas.** Sources-per-notebook and daily output limits differ across third-party guides; Google's help pages were not fetched. [low]
8. **The status of Wikimedia's Simple Article Summaries.** A June 2025 pause was widely reported [T], but the project page does not say so. [medium-low]
9. **Is LLM-as-judge good enough for automated provenance checks in 2026?** FABLES (F1 58.2) says no for 2024 judges. DeepTRACE uses an LLM judge it reports agrees with humans. Current entailment models (e.g. HHEM-2.3) are used in production leaderboards. [contested; recommend treating automatic checks as triage, not verification]
10. **Whole-book in context vs RAG.** At October 2026 cache prices the costs are similar per question [I]. Quality comparisons depend on question type (global vs local) and are not settled for 2026 models.

---

## Implications for someone building tools to explore literature

1. **Build on a curated spine, with generated lenses on top.** Keep bibliographic data, rights status, canonical texts and quotes authoritative: from catalogs, not models. Use generation for *views* of that spine (summaries, maps, explanations, layouts), and keep every generated view traceable to spine objects. [I, high]
2. **Default to declarative and component-based generated UI.** Have the model produce a JSON description of views from a fixed component catalog (A2UI-like, or AI SDK typed tool parts) rather than free-form HTML. It is faster (hundreds rather than tens of thousands of output tokens), safer, cacheable and consistently styled. Keep free-form HTML generation (artifact-style) as an explicit "build me a custom view" escape hatch. [I, high]
3. **Ship inside the chat clients people already use.** MCP Apps lets one MCP server render the same interactive literature widget (book card, reading path, concept map) in Claude, ChatGPT, VS Code and Goose. Claude artifacts' "user pays for their own inference" model makes a free, published tool cost the builder nothing for inference. [P/I]
4. **Precompute what is shared, and generate what is personal.** Batch-precompute summaries, claim indices and quiz banks for a target corpus: about $90–$3,500 per 10,000 books depending on model. Cache them content-addressed and spot-check them. Generate per-reader answers and re-leveling on demand. [I]
5. **Budget for verification, not generation.** Human checking ($200 per book in FABLES) costs far more than generation. Use automated checks (resolving citations, matching quotes verbatim, entailment) for triage. Have humans verify a sample and anything promoted to "shared". Show readers the verification status. [P/I]
6. **Treat citation resolution and verbatim-quote matching as hard gates.** They are mechanically checkable, and failing them is the most damaging error. [P/I]
7. **Plan for omission, not only hallucination.** Coverage visualizations, "what was simplified" diffs, and perspective views address errors that faithfulness metrics miss. [I]
8. **Use speed as a design input.** Anything that blocks a click should produce under about 1k output tokens, be streamed, or be prefetched. Generative-UI-scale outputs (10k+ tokens) belong in background jobs whose results are cached. [I]
9. **Label generated content for machines too.** Use `noindex` and provenance metadata (model, date, sources) on generated pages so they are not recycled as sources for other AIs; Grokipedia shows how that circular sourcing happens. [I]
10. **Respect community norms on contributing back.** Do not push generated prose into Wikipedia (WP:LLM). Contribute verified facts, data and citations through normal human editing. [P]

---

## Ideas sparked

1. **Provenance-typed reading pane.** Every generated sentence is styled by type:
   - verbatim quote: solid underline; click to jump to the page
   - paraphrase of one span: dotted underline; hover shows the span
   - synthesis across spans: a small "∴" marker that opens the spans and a one-line explanation of the link (targets STORM's "inferential linking" error)
   - unsourced model knowledge: grey, hidden by default

   Built on the Citations API's `cited_text` locators.
2. **Coverage strip for summaries.** A thin horizontal bar of the book's chapters, shaded by how many summary claims come from each. Clicking a gap generates "what happens in chapter 7 that the summary skipped?" on demand. This addresses FABLES' end-of-book bias directly.
3. **Self-test claim pairs (NoCha for readers).** For every precomputed book, generate minimal true/false claim pairs anchored to passages. Two uses: (a) the model's pass rate on its own pairs, run against the full text, becomes a rough reliability score shown on the summary; (b) readers can quiz themselves after reading, using retrieval practice of the kind Learn Your Way's embedded quizzes provided.
4. **Lens palette over a fixed spine.** A command bar of A2UI-style declarative lenses: timeline, argument map, character web, prerequisite tree, "debate view" (Co-STORM perspectives with sources), "numbers in this book". The model only fills a component schema, so lenses render in under a second from cached claim indices. A "make a custom lens" button falls back to free-form artifact generation.
5. **Generate-then-promote cache ("living wiki without the Grokipedia failure").** On-the-fly explanations are stored by content hash. When N readers request the same one, it enters a review queue; once human-verified, it is promoted to a shared, versioned page with edit history. This is EndlessWiki's economics with Wikipedia-style review.
6. **Two-model disagreement highlighter.** Generate key summaries with two model families (e.g. Claude Sonnet 5.5 and Gemini 3.x Flash). Claims that only one model makes are highlighted as "low agreement: check the source". The extra cost is pennies per book at batch prices.
7. **Reading-level slider with a loss ledger.** Re-level any passage (Learn Your Way style), and beside it list the claims, hedges and qualifiers dropped at the simpler level, each linked to the original sentence.
8. **Resolver-gated bibliography.** Every reference produced by any model passes through a resolver (Crossref, OpenAlex, ISBN/Open Library, arXiv) before it is shown. Unresolved references are struck through with "could not verify" and a search link. The interface also collects a per-model rate of fabricated references.
9. **Audio overview with source anchors.** NotebookLM/Illuminate-style audio, where each spoken segment carries a link to its source span and segments marked as speculation or analogy are labeled in the transcript. Tapping the transcript plays the audio *and* scrolls the book.
10. **Speculative, two-speed generation.** While the reader is on page *p*, a small model (Haiku 5.5 or gpt-6-luna, about $0.005 per item) prefetches explainers for the next pages and linked concepts. If the reader opens one and stays more than ~10 s, a strong model (Opus 5.5) regenerates it in the background and the changes are shown as a diff, so the reader can see what the better model corrected.
11. **"Generated content half-life" badges.** Each artifact shows its model and date. When a better model ships, a batch job regenerates the most-viewed artifacts and shows the diffs, so improvement is visible and old errors do not persist.
12. **Calibration ledger.** Reader-reported errors are aggregated by artifact type and model into displayed rates ("chapter summaries: 2.1 flagged errors per 100 claims, last 90 days"). Readers get an empirical prior instead of a vague "AI may make mistakes".
13. **Literature explorer as an MCP App.** Expose the explorer's views (book card, reading path, concept map, quote finder) as MCP tools with `ui://` templates, so a researcher can call "show me the reading path from Bayesian basics to scoring rules" inside Claude or ChatGPT and get an interactive widget backed by the curated catalog.
14. **Open-textbook course generator with a hard grounding constraint.** Generate a personal syllabus that draws *only* on open textbooks and papers (OpenStax, OA monographs, arXiv), with time estimates and prerequisite links. Every lesson's content is a re-leveled view of a real open source, never free generation; NotebookLM's OpenStax notebooks show this is feasible.

---

## Sources

1. Generative UI: A rich, custom, visual interactive user experience for any prompt (Google Research blog) — https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ — 2025-11-18
2. Leviathan et al., Generative UI: LLMs are Effective UI Generators (arXiv 2604.09577; full PDF read) — https://arxiv.org/abs/2604.09577 (PDF: https://arxiv.org/pdf/2604.09577) — v1 2026-02-24
3. Generative UI project page — https://generativeui.github.io/ — 2025
4. Gemini 3 brings upgraded smarts and new capabilities to the Gemini app (Google blog) — https://blog.google/products/gemini/gemini-3-gemini-app/ — 2025-11-18
5. Introducing Claude Sonnet 4.5 (Anthropic; Imagine with Claude) — https://www.anthropic.com/news/claude-sonnet-4-5 — 2025-09-29
6. Imagine with Claude tutorial (DataCamp; secondary) — https://datacamp.com/tutorial/imagine-with-claude — 2025-09-30
7. Build and share AI-powered apps with Claude (Claude blog) — https://claude.com/blog/claude-powered-artifacts — 2025-06/07 (update 2025-07-31)
8. Simon Willison, Build and share AI-powered apps with Claude — https://simonwillison.net/2025/Jun/25/ai-powered-apps-with-claude/ — 2025-06-25 (search result)
9. What are artifacts and how do I use them? (Claude Help Center) — https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them — fetched 2026-10-15
10. Websim homepage — https://websim.com/ — fetched 2026-10-15
11. "WebSim Shutdown – Moving to Berrry" (satirical/promotional) — https://websim-rip.berrry.app/ — 2026
12. "websim is shutting down" (user page on websim.com) — https://websim.com/@Trey6383/farewell-websim — ~2026
13. Websim company profile (PitchBook; search result) — https://pitchbook.com/profiles/company/664288-30 — 2026
14. v0 pricing — https://v0.app/pricing — fetched 2026-10-15 (undated)
15. AI SDK: Generative User Interfaces — https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces — fetched 2026-10-15
16. AI SDK RSC (experimental notice) — https://ai-sdk.dev/docs/ai-sdk-rsc — fetched 2026-10-15
17. AI SDK 6 (Vercel blog) — https://vercel.com/blog/ai-sdk-6 — 2025-12-22
18. MCP Apps: Extending servers with interactive user interfaces (MCP blog; SEP-1865) — https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/ — 2025-11-21
19. MCP Apps – Bringing UI Capabilities To MCP Clients (MCP blog) — https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ — 2026-01-26
20. MCP blog, Apps tag index — https://blog.modelcontextprotocol.io/tags/apps/ — fetched 2026-10-15
21. MCP-UI — https://mcpui.dev/ — fetched 2026-10-15
22. OpenAI developers: Apps SDK / Plugins — https://developers.openai.com/apps-sdk — fetched 2026-10-15
23. Developers can now submit apps to ChatGPT (OpenAI; search-result summary, fetch blocked) — https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/ — 2025-12-17
24. Introducing A2UI (Google Developers Blog) — https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/ — 2025-12-15
25. google/A2UI GitHub repository — https://github.com/google/A2UI — fetched 2026-10-15
26. Shao et al., Assisting in Writing Wikipedia-like Articles From Scratch with LLMs (STORM) — https://arxiv.org/abs/2402.14207 (full text https://arxiv.org/html/2402.14207v2) — 2024-02/04
27. Jiang et al., Into the Unknown Unknowns (Co-STORM) — https://arxiv.org/abs/2408.15232 — 2024-08/10
28. stanford-oval/storm GitHub repository — https://github.com/stanford-oval/storm — fetched 2026-10-15
29. Grokipedia (Wikipedia article; secondary synthesis) — https://en.wikipedia.org/wiki/Grokipedia — fetched 2026-10-15
30. Triedman & Mantzarlis, What did Elon change? A comprehensive analysis of Grokipedia — https://arxiv.org/abs/2511.09685 — 2025-11-12
31. Grokipedia selectively drawing on more right-leaning news sources (Trinity College Dublin release on the PNAS paper) — https://www.tcd.ie/news_events/articles/2026/grokipedia-research/ — 2026-05-19
32. Mohammadi et al., Selective divergence between Grokipedia and Wikipedia articles (PNAS; paywalled, 403) — https://www.pnas.org/doi/10.1073/pnas.2603294123 — 2026-05
33. Grokipedia touts AI-powered depth. The reality: heavily borrowed Wikipedia entries (Poynter/PolitiFact) — https://www.poynter.org/fact-checking/2025/grokipedia-wikipedia-copy-ai-errors/ — 2025-11-13
34. Sean Goedecke, EndlessWiki — https://www.seangoedecke.com/endless-wiki/ — 2025-09-25
35. Wikipedia:LLM (content guideline) — https://en.wikipedia.org/wiki/Wikipedia:LLM — last edited 2026-10-13
36. Wikipedia:WikiProject AI Cleanup — https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup — fetched 2026-10-15
37. Simple Article Summaries (MediaWiki project page) — https://www.mediawiki.org/wiki/Reading/Web/Content_Discovery_Experiments/Simple_Article_Summaries — fetched 2026-10-15
38. Learn Your Way: Reimagining textbooks with generative AI (Google Research blog) — https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/ — 2025-09-16
39. Heldreth et al., An Experimental Evaluation of an AI-Powered Interactive Learning Platform (arXiv 2509.18664; Frontiers in AI 2026) — https://arxiv.org/abs/2509.18664 — 2025-09-23, v2 2026-03-26
40. NotebookLM is now Gemini Notebook (Google blog) — https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/ — 2026-07-16
41. Google Workspace Updates: NotebookLM is now Gemini Notebook (search result) — https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html — 2026-07
42. What's new in NotebookLM: Video Overviews and an upgraded Studio (Google blog) — https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/ — 2025-07-29
43. 6 NotebookLM features to help students learn (Google blog) — https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/ — 2025-09-08
44. NotebookLM (Wikipedia; secondary timeline) — https://en.wikipedia.org/wiki/NotebookLM — fetched 2026-10-15
45. NotebookLM Limits 2026 (third-party guide; search result) — https://notebooklm-guide.com/notebooklm-system-limits-benchmarks/ — 2026
46. Illuminate (Google Labs) — https://illuminate.google.com/ — fetched 2026-10-15
47. MakeUseOf, "I thought NotebookLM was Google's best research tool until I tried this one" (Illuminate) — https://www.makeuseof.com/notebooklm-alternative-illuminate-better-research-tool/ — 2026-05-18
48. Khanmigo pricing — https://www.khanmigo.ai/pricing — fetched 2026-10-15
49. Cosmopedia: how to create large-scale synthetic data for pre-training (Hugging Face) — https://huggingface.co/blog/cosmopedia — 2024-03-20
50. Springer Nature book on machine learning is full of made-up citations (Retraction Watch) — https://retractionwatch.com/2025/06/30/springer-nature-book-on-machine-learning-is-full-of-made-up-citations/ — 2025-06-30
51. Oboe — https://oboe.com/ — fetched 2026-10-15
52. Walters & Wilder, Fabrication and errors in the bibliographic citations generated by ChatGPT (Scientific Reports, PMC copy) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/ — 2023-09-07
53. GPTZero, hallucinated citations in NeurIPS 2025 accepted papers — https://gptzero.me/news/neurips/ — 2026-01-21
54. Jaźwińska & Chandrasekar, AI search has a citation problem (CJR Tow Center) — https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php — 2025-03-06
55. Venkit et al., DeepTRACE: Auditing Deep Research AI Systems — https://arxiv.org/abs/2509.04499 — 2025-09-02
56. Damien Charlotin, AI Hallucination Cases database — https://www.damiencharlotin.com/hallucinations/ — updated 2026-10-15
57. Chicago Sun-Times (Wikipedia; AI reading list incident) — https://en.wikipedia.org/wiki/Chicago_Sun-Times — fetched 2026-10-15
58. Kim et al., FABLES: Evaluating faithfulness and content selection in book-length summarization (COLM 2024) — https://arxiv.org/abs/2404.01261 (full text https://arxiv.org/html/2404.01261v2) — 2024-04/09
59. Chang et al., BooookScore (ICLR 2024) — https://arxiv.org/abs/2310.00785 — 2023-10 / 2024-04
60. Karpinska et al., One Thousand and One Pairs: A "novel" challenge for long-context language models (NoCha, EMNLP 2024) — https://arxiv.org/abs/2406.16264 — 2024-06/10
61. NoCha leaderboard — https://novelchallenge.github.io/ — updated 2025-07-18
62. NoCha repository — https://github.com/marzenakrp/nocha — fetched 2026-10-15
63. Modarressi et al., NoLiMa: Long-Context Evaluation Beyond Literal Matching (ICML 2025) — https://arxiv.org/abs/2502.05167 — 2025-02/07
64. Bai et al., LongBench v2 — https://arxiv.org/abs/2412.15204 — 2024-12
65. Hong, Troynikov, Huber, Context Rot (Chroma) — https://www.trychroma.com/research/context-rot — 2025-07-14
66. Vectara Hallucination Leaderboard — https://github.com/vectara/hallucination-leaderboard — updated 2026-09-22
67. Anthropic API pricing — https://platform.claude.com/docs/en/about-claude/pricing — fetched 2026-10-15
68. Anthropic Citations documentation — https://platform.claude.com/docs/en/build-with-claude/citations — fetched 2026-10-15
69. Gemini Developer API pricing — https://ai.google.dev/gemini-api/docs/pricing — last updated 2026-10-14
70. Gemini API context caching documentation — https://ai.google.dev/gemini-api/docs/caching — fetched 2026-10-15
71. OpenAI API pricing — https://developers.openai.com/api/docs/pricing — fetched 2026-10-15
72. Google Search AI Mode / Gemini 3 generative UI coverage (PPC Land; secondary, search result) — https://ppc.land/google-launches-gemini-3-with-generative-ui-for-dynamic-search-experiences/ — 2025-11
