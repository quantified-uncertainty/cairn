---
title: Costs and Effort
description: What a personal "catalog of everything" costs in money and hours as of October 2026. LLM enrichment at 1k, 100k and 10M works, embeddings, storage, static vs server hosting, Claude Code effort tiers, where costs blow up, a worked example with the arithmetic, and when building beats buying subscriptions.
---

*Status: draft, October 2026. Prices are as of 2026-10-15 unless another date is given. Claude prices follow the wiki's [pricing reference](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/pricing-reference.md) (Anthropic's model reference, cached 2026-10-06) and were re-checked against [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing) on 2026-10-15; where the two disagree (Sonnet 5.5 cache reads), both are given. Other API prices come from the verified tables in the [R10 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md). Subscription prices come from the [R03](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md) dossier, which has no independent verification pass (I re-checked O'Reilly, JPASS, Everand and DeepDyve on 2026-10-15), and the [R04](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md) dossier. Every total is my arithmetic from those prices. Per-item token counts are assumptions, and every hour figure is an estimate, not a measurement.*

## The short version

- **Your hours, not model tokens, are the main cost.** R10 estimates a usable month-tier build at 80–120 hours of focused work with Claude Code (unmeasured). At \$50–150/hour that is \$4,000–18,000, against a model bill of \$490–1,260 in the [worked example](#worked-example-a-month-tier-probability-and-decisions-shelf).
- **Model choice is the biggest money lever.** At October 2026 batch prices, a one-paragraph blurb (from metadata plus table of contents) for each of 100,000 books costs **\$15** on Claude Haiku 5.5, **\$300** on Sonnet 5.5 and **\$600** on Opus 5.5, before tokenizer and thinking overhead. Per token, Fable 5.1 costs 100× Haiku 5.5. Run a small model over the long tail and a strong model over a curated core of 1k–10k books.
- **Five things cause most surprise bills:** Haiku 5.5 prompts over 100K tokens cost 5×; Claude's tokenizer counts about 30% more tokens than older Claude tokenizers; thinking tokens bill as output, and Opus 5.5 and Fable 5.1 cannot turn thinking off; a re-run after a prompt change costs the whole job again; and checking quality costs far more than generating text.
- **Host statically by default.** A static site plus range-request databases on free hosting should serve a 100k-work catalog for \$0 a month (R10's design [~80%]). You need a server only for chunk-level semantic search over full text, or for writes shared between users.
- **Building does not replace buying content.** A catalog routes you to texts; it does not give you the right to read them. A build competes with paid *discovery*, such as an Elicit Pro seat at \$588 a year. Content subscriptions (O'Reilly, Perlego, JPASS) stay a separate decision, and a free library card comes first ([The Access Ladder](/access/access-ladder/)).
- **What to do:** build the weekend tier first (≈\$22, 12–20 hours) to learn whether you would use the tool. Buy paper discovery (\$144–588 a year) rather than rebuilding it. Spend build hours on what you cannot buy: chapter-level routing across books.

## Prices this chapter uses

USD per million tokens (MTok), as of October 2026. Batch requests are asynchronous and cost 50% of the standard price on every provider listed here.

| Model | Standard in / out | Batch in / out | Notes | Source |
|---|---|---|---|---|
| Claude Haiku 5.5 (prompt up to 100K tokens) | \$0.10 / \$0.50 | \$0.05 / \$0.25 | Thinking on by default; default effort `medium`. `thinking: disabled` is accepted at effort `high` or below | [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Haiku 5.5 (prompt over 100K tokens) | \$0.50 / \$2.50 | \$0.25 / \$1.25 | 5× the short-prompt rate, applied to the whole request | same |
| Claude Sonnet 5.5 | \$2 / \$10 | \$1 / \$5 | Full 1M context at the standard rate. `thinking: {type: "between_tools"}` turns off up-front thinking, at effort `high` or below | same |
| Claude Opus 5.5 | \$4 / \$20 | \$2 / \$10 | Thinking always on; effort (default `medium`) is the only control | same |
| Claude Fable 5.1 | \$10 / \$50 | \$5 / \$25 | Thinking always on | same |
| OpenAI gpt-5-nano | \$0.05 / \$0.40 | \$0.025 / \$0.20 | Reasoning tokens billed as output (R10, not re-verified) | [OpenAI](https://developers.openai.com/api/docs/pricing) |
| OpenAI gpt-5.6-luna | \$0.20 / \$1.20 | \$0.10 / \$0.60 | | same |
| OpenAI gpt-5-mini | \$0.25 / \$2.00 | \$0.125 / \$1.00 | | same |
| Gemini 3.5 Flash-Lite | \$0.30 / \$2.50 | \$0.15 / \$1.25 | Output price includes thinking | [Google](https://ai.google.dev/gemini-api/docs/pricing) |
| Gemini 3.8 Flash | \$0.75 / \$3.75 until 2026-12-31; \$1.50 / \$7.50 from 2027-01-01 | \$0.375 / \$1.875, then \$0.75 / \$3.75 | Introductory price ends at year-end | same |

Five details change the arithmetic for Claude models:

1. **The Haiku 5.5 long-prompt tier.** Per Anthropic's pricing page, a request "whose prompt is over 100,000 tokens pays higher prices". Prompt length counts *all* input tokens, cache reads and writes included, and each request is priced on its own. Sonnet 5.5, Opus 5.5 and Fable 5.1 have no such tier: a 900k-token request is billed at the same per-token rate as a 9k-token one ([long context pricing](https://platform.claude.com/docs/en/about-claude/pricing#long-context-pricing)).
2. **The tokenizer.** Claude 4.7 and later models, including all four current ones, use a tokenizer that "produces approximately 30% more tokens for the same text" than the previous Claude tokenizer (pricing page); Anthropic's model reference gives 1.0–1.35×. The per-item counts on this page are generic estimates, not Claude counts (Institutional Books, for example, counts with OpenAI's `o200k_base`, per its [dataset card](https://huggingface.co/datasets/institutional/institutional-books-1.0)). I found no published ratio between current Claude counts and `o200k_base` counts, so the 1.35× applied below is a planning multiplier, not a bound [~50% that it covers the real ratio for English prose]. Run `count_tokens` on a sample before any large job.
3. **Thinking.** Per Anthropic's [thinking configuration table](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting) and [effort page](https://platform.claude.com/docs/en/build-with-claude/effort) (both fetched 2026-10-15):
   - **Haiku 5.5** thinks by default at effort `medium` and accepts `disabled` at effort `high` or below.
   - **Sonnet 5.5** rejects `disabled`; send `between_tools` instead.
   - **Opus 5.5 and Fable 5.1** cannot turn thinking off. Opus 5.5 defaults to effort `medium`.
   - Thinking tokens are billed as output tokens. For bulk jobs they are the largest hidden line item (see [Where costs blow up](#where-costs-blow-up)).
4. **Caching.**
   - **Writes** cost 1.25× input with a 5-minute TTL, or 2× with a 1-hour TTL.
   - **Reads** cost \$0.20/MTok on Opus 5.5 (0.05× input), \$0.25 on Fable 5.1 (0.025×) and \$0.01 on Haiku 5.5 for short prompts (0.1×).
   - **Sonnet 5.5 reads** are in conflict: Anthropic's pricing page listed **\$0.10** (0.05×) on 2026-10-15, as R10 also recorded, while the wiki's pricing reference and Anthropic's bundled model reference (both cached 2026-10-06) say \$0.20 (0.1×). I lean to the live page [~80%]. No total here depends on it.
   - **Bulk jobs** gain little, because most of each prompt is the item itself. Pack 10–50 items per request to amortize the shared instructions (R10's suggestion).
5. **Data residency.** US-only inference (`inference_geo: "us"`) multiplies every token price by 1.1 on Claude 4.6 and later models ([pricing page](https://platform.claude.com/docs/en/about-claude/pricing#data-residency-pricing)).

## How to estimate any job

`cost = N × (tokens_in × price_in + (tokens_out + tokens_thinking) × price_out) / 1,000,000 × tokenizer_factor × (1 + rerun_fraction)`

Two reference points:

- **Haiku 5.5, batch.** A million short items at 1,000 tokens in and 200 out: 1,000 MTok × \$0.05 + 200 MTok × \$0.25 = **\$50 + \$50 = \$100**.
- **Sonnet 5.5, batch.** The same million items: 1,000 × \$1 + 200 × \$5 = **\$2,000**. Opus 5.5 doubles that.

Output tokens cost 5× input tokens on every Claude model. A job that writes long chapter summaries, or that thinks before writing, is dominated by output even when it reads far more than it writes.

## What common enrichment jobs cost

Three jobs cover most of what a catalog needs. The per-item token counts follow R10:

- **Blurb from metadata plus table of contents (TOC):** 1,500 tokens in, 300 out. Gives a one-paragraph description, a level, prerequisites and tags.
- **Full-text book summary:** chapter summaries plus a book summary, by map-reduce over chunks.
  - A modern ~115,000-word nonfiction book: about 155k tokens in and 5k out, prompts included.
  - A scanned library volume: about 255k in and 6k out. Institutional Books averages ~246k tokens per volume (242B tokens over 983,004 volumes).
- **Paper abstract to one-line summary plus tags:** 500 tokens in, 150 out.

**Cost per item, batch pricing (October 2026, my arithmetic):**

| Job | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | Fable 5.1 | gpt-5-nano | Gemini 3.5 Flash-Lite |
|---|---|---|---|---|---|---|
| Blurb from metadata + TOC | \$0.00015 | \$0.003 | \$0.006 | \$0.015 | \$0.0001 | \$0.0006 |
| Modern book, full text (chunked under 100K) | \$0.009 | \$0.18 | \$0.36 | \$0.90 | \$0.005 | \$0.03 |
| Same book, sent unchunked | \$0.045 (long-prompt tier) | \$0.18 | \$0.36 | \$0.90 | — | — |
| Scanned volume, full text (chunked) | \$0.014 | \$0.29 | \$0.57 | \$1.43 | \$0.008 | \$0.046 |
| Paper abstract | \$0.0000625 | \$0.00125 | \$0.0025 | \$0.00625 | \$0.00004 | \$0.00026 |

**Job totals at typical sizes (batch).** Claude rows are at base token counts; multiply by your measured tokenizer factor (this page uses 1.35). The rows assume thinking is off (Haiku, Sonnet) or ignored: the Opus 5.5 and Fable 5.1 rows exclude thinking tokens those models always spend, so they are lower bounds.

| Model (batch) | 100k books, meta + TOC | 10k books, full text | 10k scanned volumes | 1M paper abstracts | 10M works, abstract or blurb level |
|---|---|---|---|---|---|
| Claude Haiku 5.5, chunked under 100K | **\$15** | **\$90** | \$143 | **\$62.50** | **\$625** |
| Claude Haiku 5.5, unchunked | n/a | \$450 | \$713 | n/a | n/a |
| Claude Sonnet 5.5 | \$300 | \$1,800 | \$2,850 | \$1,250 | \$12,500 |
| Claude Opus 5.5 | \$600 | \$3,600 | \$5,700 | \$2,500 | \$25,000 |
| Claude Fable 5.1 | \$1,500 | \$9,000 | \$14,250 | \$6,250 | \$62,500 |
| OpenAI gpt-5-nano | \$9.75 | \$48.75 | \$76 | \$42.50 | \$425 |
| OpenAI gpt-5.6-luna | \$33 | \$185 | \$291 | \$140 | \$1,400 |
| OpenAI gpt-5-mini | \$48.75 | \$244 | \$379 | \$212.50 | \$2,125 |
| Gemini 3.5 Flash-Lite | \$60 | \$295 | \$458 | \$262.50 | \$2,625 |
| Gemini 3.8 Flash, 2026 price | \$112.50 | \$675 | \$1,069 | \$469 | \$4,688 |
| Gemini 3.8 Flash, from 2027-01-01 | \$225 | \$1,350 | \$2,138 | \$938 | \$9,375 |

How to use this:

- **Chunk long books for Haiku 5.5.** A whole modern book in one request lands in the long-prompt tier and costs 5× (\$450 vs \$90 per 10k books). Chunks must stay under 100K *Claude* tokens. Size them with `count_tokens` on the model you will run; if you must cut by another tokenizer's count, cut at about 65k to leave a margin (my inference, given the unmeasured ratio above). Chunking also yields chapter-level summaries, the unit you want for "find the best chapter on X" ([A Reference Architecture](/building/reference-architecture/)).
- **Reuse before you generate.** For papers, Semantic Scholar's 2026-10-06 release already ships 58M TLDRs and 120M SPECTER2 embeddings ([release manifest](https://api.semanticscholar.org/datasets/v1/release/latest)). Check each dataset's license before you redistribute anything derived from it.
- **The cheapest row is not always the best value.** In the 2024 FABLES study (26 books, 3,158 annotated claims), the share of claims in book-length summaries judged faithful was 90.9% for Claude 3 Opus, 78% for GPT-4 and 69% for Mixtral ([Kim et al. 2024](https://arxiv.org/abs/2404.01261)). Those are 2024 models, and I found no 2026 equivalent.
- **Where a small model is enough.** My judgment, with no 2026 evidence: a small model is adequate for TOC-grounded blurbs [~70%], because the task is close to extraction, and noticeably worse for full-text chapter summaries [~65%].
- **Test before you choose.** Run a 200-item blind comparison on your own corpus before committing to a model.

## Costs at three scales

The scales follow R10:

- **1k works:** a curated core shelf, all in full text.
- **100k works:** metadata plus TOC for every work, and full text for a 10k open subset.
- **10M works:** metadata and abstract level only, with precomputed vectors where possible.

Book parsing assumes 300 pages per book. LLM ranges run from base token counts to ×1.35. All totals are my arithmetic.

| Line item | 1k works | 100k works | 10M works |
|---|---|---|---|
| Data acquisition | \$0 (Gutenberg, OpenStax, DOAB, HathiTrust public domain, arXiv) | \$0 from dumps and OAI-PMH. The OpenAlex API is free up to \$1/day with a free key | \$0 for snapshots. 1.2–2.4 TB of disk (≈\$100–300 one-time per R10, prices unverified), or \$18–36/month on Cloudflare R2 |
| Parsing / OCR | 300k pages: \$0 if born-digital; up to ~\$60 self-hosted olmOCR; ≈\$375 LlamaParse basic | 3M pages for the subset: \$0–600 self-hosted; ≈\$3,750 LlamaParse | Not parsed. Reuse OpenAlex TEI or s2orc where licensed |
| LLM enrichment (batch) | Haiku \$9–12; Sonnet \$180–243; Opus \$360–486 | Meta + TOC: Haiku \$15–20, gpt-5-nano \$10, Sonnet \$300–405. Full-text subset: Haiku \$90–122, Sonnet \$1,800–2,430 | Haiku \$625–844; gpt-5-nano \$425; Flash-Lite \$2,625; Sonnet \$12,500–16,875 |
| Embeddings | ~155M tokens: \$0 inside Voyage's free tokens, else ~\$3 | Meta + TOC (100M tokens): \$0–13. Full-text subset (1.5B): \$30–195 | 3B tokens: \$60–600, or \$0 for papers by reusing SPECTER2 |
| Vector and text storage | ~1–10 GB | ~20–200 GB | Index 0.3–41 GB, depending on dimensions and quantization; raw lake 1.2–2.4 TB |
| Hosting per month | \$0 (static) | \$0–20 (static plus range-request databases) | \$0–50 static shards; turbopuffer minimums of \$16 or \$256; or a \$40–150 VPS with pgvector (R10 estimate, unverified) |
| **One-time total** | **≈\$10 (Haiku, born-digital) to ≈\$860 (Opus, hosted parsing)** | **≈\$135 (Haiku throughout) to ≈\$3,600 (Sonnet, self-hosted OCR); ≈\$6,800 with hosted parsing** | **≈\$600 (gpt-5-nano, cheapest embeddings, local disk) to ≈\$18,000 (Sonnet)** |
| Main cost risk | Overusing frontier models | Unchunked prompts on Haiku; thinking tokens; hosted parsing | Model choice; re-runs; the Gemini 3.8 Flash price doubling on 2027-01-01 |

Two consequences:

- **At 10M works, the model choice is the budget.** The gap between gpt-5-nano or Haiku 5.5 (\$425–844) and Sonnet 5.5 (\$12,500+) is larger than every other line combined. Use a small model at this scale unless a pilot shows it fails.
- **At 100k works, the parsing route can cost more than the LLM.** LlamaParse's basic tier is \$1.25 per 1,000 pages; olmOCR self-reports under \$200 per million pages ([olmOCR README](https://github.com/allenai/olmocr)). Prefer born-digital EPUB and HTML wherever they exist, and self-host OCR for the rest.

## Embeddings

Prices as of October 2026, from R10, which verified them on each provider's page.

| Corpus (tokens) | text-embedding-3-small or voyage-4-lite (\$0.02/MTok) | voyage-4 (\$0.06) | text-embedding-3-large (\$0.13) | Gemini Embedding 2 (\$0.20; batch \$0.10) |
|---|---|---|---|---|
| 100k books, meta + TOC (~100M) | \$2 (Voyage: \$0 within the free tokens) | \$6 (\$0 within the free tokens) | \$13 | \$20 / \$10 |
| 10k books, full text (~1.5B) | \$30 | \$90 | \$195 | \$300 / \$150 |
| 1M abstracts (~300M) | \$6 | \$18 | \$39 | \$60 / \$30 |
| 10M works (~3B) | \$60 | \$180 | \$390 | \$600 / \$300 |

- **Voyage's free allowance** is 200M tokens for each Voyage-4 model, and it does not apply to batch usage ([Voyage pricing](https://docs.voyageai.com/docs/pricing)).
- **Self-hosting is the free alternative.** Qwen3-Embedding (0.6B/4B/8B, Apache-2.0, 32k context) and EmbeddingGemma-300M run locally, and EmbeddingGemma can embed queries in the browser via transformers.js. R10 guesses one rented GPU embeds 1.5B tokens in a day or two for tens of dollars [low–medium confidence; not benchmarked].
- **Papers:** use SPECTER2 as shipped.
- **The only embedding decision that moves the total** is whether you embed full-text *chunks* at all.

## Parsing, transcription and data access

| Item | Price (as of Oct 2026) | Notes |
|---|---|---|
| Born-digital text (Gutenberg EPUB/HTML, OpenStax, LibreTexts ZIMs, arXiv LaTeX) | \$0 parsing | Skip PDF parsing wherever you can |
| olmOCR, self-hosted | Under \$200 per million pages (self-reported) | Needs an NVIDIA GPU with at least 12 GB ([README](https://github.com/allenai/olmocr)) |
| LlamaParse basic | \$1.25 per 1,000 pages; 10k free credits a month | Agentic tiers cost more ([pricing](https://www.llamaindex.ai/pricing)) |
| OpenAI gpt-transcribe | \$0.0045/min: 1,000 lecture hours cost \$270 | Whisper API is \$0.006/min, or \$360 per 1,000 hours ([OpenAI](https://developers.openai.com/api/docs/pricing)) |
| OpenAlex snapshot | \$0. About 745 GB of JSONL; AWS Open Data pays the transfer | Quarterly ([snapshot](https://help.openalex.org/access/snapshot/)) |
| OpenAlex API | Free key gets \$1/day. List calls \$0.10 per 1,000, search \$1 per 1,000, PDFs \$10 per 1,000 | \$1/day buys about 10,000 list calls or 100 PDFs ([example costs](https://help.openalex.org/access/example-costs/)) |
| arXiv full text | Requester-pays S3, ~9.2 TB as of April 2025 | You pay AWS transfer; processing inside us-east-1 avoids internet egress ([arXiv](https://info.arxiv.org/help/bulk_data_s3.html)) |

## Storage

Sizes from R10's calculations.

| Item | Size |
|---|---|
| One 1024-d vector | fp32 4 KB; int8 1 KB; binary 128 B. At 256-d: int8 256 B, binary 32 B |
| 10M works, one vector each | fp32 1024-d: 41 GB; int8 256-d: 2.6 GB; binary 256-d: 320 MB |
| 10k books × ~300 chunks (3M chunks) | fp32 1024-d: 12.3 GB; int8: 3.1 GB; binary: 0.4 GB |
| Full text, 10k books × ~150k tokens | ~6 GB plain UTF-8, ~2 GB compressed |
| Raw metadata lake for the 10M tier | 1.2–2.4 TB: ≈1.24 TB core files, ≈1.5 TB with Semantic Scholar citations, ≈2.3 TB with SPECTER2 |

Storage is a decision about quantization, not money:

- **Store vectors at 256–512 dimensions in int8 or binary, and rescore.** R10 estimates this cuts vector storage 8–32× at a modest recall loss. It matters because static hosts cap file and site sizes (next section).
- **The full 2.4 TB lake on R2** costs about \$36 a month at \$0.015/GB-month ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). A local disk is cheaper within a year.

## Hosting: static or server

| Setup | Scale it handles | Monthly cost (Oct 2026) | Catch |
|---|---|---|---|
| Static site with Pagefind on GitHub Pages or Cloudflare Pages | "Tens of thousands of pages"; about 100–300 kB transferred per search on a 10k-page site ([Pagefind](https://pagefind.app/)) | \$0 | GitHub Pages: published sites up to 1 GB, soft bandwidth limit of 100 GB/month ([limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Cloudflare Pages Free: 20,000 files per site, 25 MiB per file ([limits](https://developers.cloudflare.com/pages/platform/limits/)). One HTML page per work stops at about 20k works on Cloudflare's free plan |
| Static shell plus range-request databases on object storage | 100k to 10M records. SQLite FTS5 through [sql.js-httpvfs](https://github.com/phiresky/sql.js-httpvfs); Parquet through [DuckDB-Wasm](https://duckdb.org/docs/current/clients/wasm/overview.html) | \$0 within R2's free tier (10 GB-month storage, 10M Class B reads a month, free egress); then \$0.015/GB-month and \$0.36 per million reads | DuckDB-Wasm has a 4 GB memory cap. sql.js-httpvfs never evicts its cache and calls itself "mainly written for small personal projects". Untested at 10M works [R10, medium confidence] |
| Static semantic search: transformers.js query embedding, IVF centroids, binary shards | 10M works × 256-d binary = 320 MB; about 1–3 MB fetched per query (R10 estimate, unbenchmarked) | \$0–1 | R10's design, not built. Binary quantization loses recall and needs int8 rescoring |
| Managed vector database | Large | Qdrant Cloud free tier: 0.5 vCPU, 1 GB RAM, 4 GB disk ([Qdrant](https://qdrant.tech/pricing/)). turbopuffer minimums: \$16, \$256 or \$4,096+ a month ([turbopuffer](https://turbopuffer.com/pricing)) | turbopuffer's per-GB rates were not visible on its pricing page |
| VPS with Postgres and pgvector | Chunk-level search over full text; shared writes | \$40–150 (R10 estimate, unverified) | You run it, patch it and back it up |

The decision rule:

- **Stay static** until you need semantic search over full-text chunks or multi-user writes. A 100k-work catalog fits in about 50 MB of int8 vectors plus a few hundred MB of metadata (my estimate), inside every free tier above if you shard files under 25 MiB.
- **Above about 20k works,** stop generating one HTML page per work. Render work pages client-side from sharded data files.

**Query-time LLM costs** (standard prices, not batch) are small for one reader:

- **Haiku 5.5, retrieval-augmented question:** 10k tokens in and 500 out cost about \$0.0013 (10k × \$0.10/MTok + 500 × \$0.50/MTok).
- **Opus 5.5, same question:** about \$0.05 before thinking tokens.
- **Opus 5.5, questions against a whole cached 150k-token book:** the first request writes the cache for about \$0.75 (150k × \$5/MTok). Each later question within the TTL reads it for \$0.03, plus about \$0.01 of output and any thinking.
- **Haiku 5.5, the same book uncached:** the 150k-token prompt crosses the long-prompt tier, so each question costs about \$0.075 in input alone.

At 300 questions a month, retrieval-augmented question answering costs about \$0.40 on Haiku and \$15 on Opus. R04 estimates (its inference) that 50 deep-research sessions a month through APIs cost about \$50–150, comparable to an Elicit Pro seat.

## Where costs blow up

Ranked by how often I expect each to bite on a first build [subjective]:

1. **Thinking tokens on bulk jobs.** They are billed as output, at 5× the input price on every Claude model.
   - **Illustration:** suppose each blurb in the 100k-book job thinks for an extra 500 tokens. Output rises from 30M to 80M tokens. On Haiku 5.5 the job goes from \$15 to 150 × \$0.05 + 80 × \$0.25 = **\$27.50**. On Opus 5.5, which cannot disable thinking, it goes from \$600 to 150 × \$2 + 80 × \$10 = **\$1,100**.
   - **Mitigation:** for extraction-like jobs, disable thinking on Haiku 5.5 (at effort `high` or below) or send `between_tools` on Sonnet 5.5. On Opus 5.5, set effort to `low`; its default is `medium`.
   - **Measure first:** run a 1% pilot and read `usage.output_tokens` before submitting the rest.
2. **Re-runs.** A prompt tweak after the full run costs the full run again.
   - **Mitigation:** store `model`, `prompt_version` and `generated_at` on every generated field. Pilot on 1–2% of items across about three prompt versions. Regenerate only the items a change affects.
   - **Budgeting:** hold one full re-run in contingency for a first build [~60% that you will want one].
3. **Long prompts on Haiku 5.5.** \$450 instead of \$90 for 10k books. Caching a book does not escape the tier. Chunk below 100K Claude tokens.
4. **Tokenizer inflation.** Use 1.35× your generic estimates as a working figure, not a ceiling, until `count_tokens` on a sample says otherwise.
5. **Verification.** Checking costs far more than generating, in money and hours.
   - **Human checking:** FABLES paid annotators \$200 per book to check five summaries of it, about \$40 per summary; each book took about 11 hours on average ([Kim et al. 2024](https://arxiv.org/html/2404.01261v2)). One \$40 human check costs as much as about 4,400 Haiku 5.5 or 110 Opus 5.5 full-text summaries at batch prices.
   - **LLM checking:** in that study the best automatic checker (Claude 3 Opus given the whole book) reached only F1 = 58.2 on unfaithful claims. An LLM judge that reads the source costs about as much as generating the summary.
   - **What to do instead:** have an LLM judge read a stratified sample as triage, then have a human read a few hundred blurbs and a handful of chapters. Budget that in hours (see the worked example).
6. **Model choice drift.** It is easy to prototype on Opus and forget to switch. Opus 5.5 is 40× Haiku 5.5 per token; Fable 5.1 is 100×.
7. **Price changes.** Gemini 3.8 Flash's introductory price doubles on 2027-01-01. Re-price any long-running job after year-end.
8. **Hosted parsing.** LlamaParse's basic tier costs more than 6× olmOCR's self-reported cost per page, and agentic tiers cost more again.
9. **Metered APIs used as bulk sources.** OpenAlex PDFs cost \$10 per 1,000 beyond the free \$1/day; bulk-load from the snapshot. Open Library forbids bulk metadata harvesting through its API; use the monthly dumps.
10. **Small multipliers.** US-only inference adds 1.1×. Cache writes cost 1.25× input and pay off only if the cache is read again within the TTL.

## Worked example: a month-tier "probability and decisions" shelf

A plausible first serious build for a researcher in forecasting and Bayesian statistics:

- **Catalog:** 100,000 works (books and textbooks), each with a blurb, a level and tags generated from metadata plus TOC.
- **Core shelf:** 2,000 openly licensed books with chapter-level summaries.
- **Papers:** 1,000,000 paper abstracts (arXiv and OpenAlex) with one-line summaries.
- **Search:** semantic search over all of it, served statically.

The model plan is Haiku 5.5 (thinking disabled) for the long tail and Sonnet 5.5 (`between_tools`) for the core shelf, all through the Batch API.

**1. Blurbs, 100,000 works on Haiku 5.5 batch.**
- Input: 100,000 × 1,500 = 150M tokens × \$0.05/MTok = \$7.50.
- Output: 100,000 × 300 = 30M tokens × \$0.25/MTok = \$7.50.
- **Subtotal: \$15.00.**

**2. Core shelf, 2,000 books on Sonnet 5.5 batch,** map-reduce over chunks.
- Input: 2,000 × 155,000 = 310M tokens × \$1/MTok = \$310.
- Output: 2,000 × 5,000 = 10M tokens × \$5/MTok = \$50.
- **Subtotal: \$360.**
- The same job on Haiku 5.5 would cost 2,000 × \$0.009 = \$18. You are paying \$342 for the quality difference; test it on 20 books first.

**3. Papers, 1,000,000 abstracts on Haiku 5.5 batch.**
- Input: 1,000,000 × 500 = 500M × \$0.05 = \$25.
- Output: 1,000,000 × 150 = 150M × \$0.25 = \$37.50.
- **Subtotal: \$62.50.** Reusing Semantic Scholar TLDRs where they exist and are licensed for your use cuts this.

**4. Embeddings with voyage-4-lite.**
- Tokens: blurbs and TOCs 100M, core-shelf chunks 310M, abstracts 300M; 710M in total.
- Billable: 710M minus 200M free = 510M × \$0.02 = **\$10.20.** Using SPECTER2 for the papers drops this to \$4.20.

**5. LLM verification on Sonnet 5.5 batch.**
- A 2% sample of blurbs: 2,000 items × 1,800 tokens in = 3.6M × \$1 = \$3.60, plus 2,000 × 200 tokens out = 0.4M × \$5 = \$2.00. Total \$5.60.
- A 10% sample of the core shelf: 200 books × 160k tokens in (the book plus its summaries) = 32M × \$1 = \$32, plus 200 × 2k out = 0.4M × \$5 = \$2. Total \$34.
- **Subtotal: \$39.60.**

**6. One clean pass:** \$15.00 + \$360 + \$62.50 + \$10.20 + \$39.60 = **\$487.30.**

**7. High case.** This is a planning figure, not a ceiling: it assumes thinking stays off and uses 1.35× for the tokenizer.
- The Claude lines total \$477.10.
- Pilots: three prompt versions on 1% of each generation job, 3 × 1% × \$437.50 = \$13.13.
- One full re-run of the three generation jobs: \$437.50.
- Tokenizer: (\$477.10 + \$13.13 + \$437.50) × 1.35 = \$1,252.44.
- Plus embeddings: + \$10.20 = **≈\$1,263.**

**8. Hosting.**
- **Vectors:** about 51 MB of int8 vectors for 100k blurbs (512-d) and about 154 MB for 600k core-shelf chunks (256-d int8). The 1M papers add 32 MB binary plus 256 MB of int8 for rescoring.
- **Metadata:** a few hundred MB.
- **Fit:** inside R2's 10 GB free tier, but close to GitHub Pages' 1 GB site cap. Put the shards on R2 and the shell on Pages. **\$0/month.**

**9. Claude Code.** Claude Code is included in all paid Claude plans: Pro is \$20/month or \$200/year, Max from \$100/month with 5× or 20× Pro's usage ([claude.com/pricing](https://claude.com/pricing), fetched 2026-10-15). Paid plans limit usage per 5-hour session and per week. I found no figure for how many hours of agentic coding Pro allows. Budget **\$20–100** for the month, and move to Max if Pro's weekly limit stops you in the first week.

**10. Hours.**
- **Build:** R10's month tier is 80–120 hours.
- **Human verification**, which R10 does not itemize (my assumptions):
  - 200 blurbs checked against their TOCs at about 2 minutes each: about 7 hours.
  - 10 chapter summaries checked against the chapters: about 11 hours, assuming a chapter takes a tenth of a FABLES book (about 11 hours per book, which covered reading it and checking five summaries).
- **Total:** about **100–140 hours.**

**Bottom line:**
- **Money:** \$510–1,360 all-in, model bill plus one month of subscription.
- **Time:** 100–140 hours.
- **Cheaper variant:** Haiku instead of Sonnet on the core shelf brings the money to roughly \$165–425, subscription included. Choose it unless the 20-book test shows a gap you care about.
- **The hours dominate under every assumption.** At \$50/hour they are worth \$5,000–7,000; at \$150/hour, \$15,000–21,000.

## Effort tiers with Claude Code

The hours are R10's inference for one technically strong developer driving Claude Code, counted as focused work, not calendar time. Nobody has measured them, and I put ~50% on a first-time builder exceeding the upper end. R10 expects about a third of build effort to go to ID crosswalks and edition clustering, which is harder than search.

| Tier | Hours | Money (Oct 2026) | What it delivers | Main risks |
|---|---|---|---|---|
| **Weekend** | 12–20 | ≈\$22. Claude Pro \$20; Haiku 5.5 batch blurbs for 10k works = 10,000 × \$0.00015 = \$1.50; embeddings \$0 inside Voyage's free tokens; hosting \$0 | A browsable, searchable "free shelf" of about 10k works from two or three clean sources (Gutenberg catalog, OpenStax API, DOAB OAI, or the Open Library works dump filtered to public ebooks), with summaries, client-side semantic search over a vector file under 50 MB, and a topic map | Learning the Batch API; Pagefind index size; messy subject headings |
| **Month** | 80–120 (100–140 with verification) | ≈\$135–3,600 one-time (the 100k-work tier), plus \$20–100 a month for Claude. See the worked example | 8–10 source adapters; a unified work record; first-pass edition clustering with a 300–500-pair labeled evaluation set; a rights resolver giving a "best free copy" link; a full-text pipeline for 1–10k open books; chapter-level and hybrid search; a reading queue; an OPDS feed; an MCP server so Claude can query the catalog | Clustering precision and recall; OCR noise; rate limits (Open Library 1–3 requests/s, Crossref's polite pool); license tagging |
| **Quarter** | 300–450 | ≈\$600–18,000 one-time (the 10M tier, local disk included), plus \$60–300 of Claude subscriptions | 10M works with incremental updates (OpenAlex quarterly, Open Library monthly, Hathifile daily, Semantic Scholar weekly); scalable entity resolution with LLM adjudication of ambiguous pairs; a rights engine with jurisdiction rules; a static sharded semantic index; several interfaces (map, shelf, syllabus builder, prerequisite graph); quality dashboards and a cost ledger | Scale bugs; drift between sources; keeping LLM fields fresh; the maintenance burden |

Which tier to aim for:

- **To find out whether you would use such a tool at all,** do the weekend tier. It costs about one month of a discovery subscription (≈\$22, most of it the Claude Pro month), and its adapters and work records carry over to the month tier.
- **If your reading is books and textbooks scattered across sources,** the month tier is where the value is. R10 found no tool that routes chapters across books, papers and lectures to the best legal copy, and I know of none [~80%] (see [Build or buy](#build-or-buy)).
- **Do the quarter tier only if the catalog will be shared** with a group or community, or if the 10M scope is the point. The marginal reader of a static catalog costs nothing; maintenance does not.

Valuing the hours at \$50–150/hour:

| Tier | Hours | Value of hours | Money spent | Hours as share of total |
|---|---|---|---|---|
| Weekend | 12–20 | \$600–3,000 | ≈\$22 | about 96–99% |
| Month | 100–140 | \$5,000–21,000 | \$510–1,360 (worked example) | about 79–98% |
| Quarter | 300–450 | \$15,000–67,500 | ≈\$650–18,100 | about 45–99% |

## Build or buy

Subscriptions sell two things: **content** (the right to read) and **discovery** (finding what to read). A personal catalog is a discovery product, so it competes only with the second group.

| Option | What you get | Annual cost (Oct 2026) | Catch | Source |
|---|---|---|---|---|
| A free public library card (for example SFPL, free to California residents) | Libby, O'Reilly for Public Libraries, ProQuest eBook Central and article databases | \$0 | No cross-source discovery; holds queues on popular titles | R03; [Public Libraries](/access/public-libraries/) |
| O'Reilly Individual | 66,609 book titles in its sitemap; strong on Packt, Wiley, O'Reilly, Pearson and Manning; nothing from MIT Press, CUP, OUP or core Springer | \$499 (\$49/month) | Its membership agreement (2024-10-09) forbids using content "as input or a prompt to a machine learning or AI system" | [pricing](https://www.oreilly.com/pricing/); [agreement](https://www.oreilly.com/membership-agreement/) |
| Perlego Complete | About 1.5M titles, strong in the humanities and social sciences | \$199 (\$27/month); R03 saw A/B-tested variants | Weak on technical publishers (33 O'Reilly titles, no Pearson) | [pricing](https://www.perlego.com/pricing/) |
| Everand Plus | 3 "unlocks" a month from a 1.5M+ catalog | ≈\$204 (\$16.99/month; no annual plan listed) | Unlimited reading ended | [plans](https://support.scribd.com/hc/en-us/articles/40678839226644-Everand-plans-Standard-Plus-and-Deluxe) |
| JSTOR JPASS | Unlimited online reading plus 120 PDF downloads (about \$1.66 each) | \$199 | Only JSTOR's 2,400+ journals | [JPASS](https://about.jstor.org/products/jpass/) |
| DeepDyve | Streaming of 35M+ paywalled papers | \$499 (\$59/month) | Printing capped at 40 pages a month | [pricing](https://www.deepdyve.com/pricing) |
| Elicit Pro | AI search and extraction over 138M papers; systematic-review workflow | \$588 (\$49/month billed annually) | No books. Paywalled papers fall back to abstracts | [pricing](https://elicit.com/pricing) |
| Undermind Pro | Agentic deep paper search; its 2024 whitepaper describes estimating how much was missed from the discovery curve | \$192 (\$16/month billed annually) | No books or non-paper sources | [pricing](https://www.undermind.ai/pricing) |
| Consensus Pro | Paper search, a "Consensus Meter", 15 deep reviews and 500 API/MCP calls a month | \$144 (\$20 month-to-month) | No books | [plans](https://intercom.help/consensus-d118a252369c/en/articles/10087865-subscription-plans) |
| Claude Pro | Chat, Research, Claude Code | \$200 (\$20/month) | Searches the web, not your index, unless you build one | [claude.com/pricing](https://claude.com/pricing) |

What the comparison shows:

1. **Content stays a separate purchase whatever you build.** The worked example's \$510–1,360 buys a map of 100,000 works, not the right to read them. Climb [The Access Ladder](/access/access-ladder/) first: free cards, then targeted purchases. That decides where the catalog's "read it here" links can point.
2. **For papers, buy discovery rather than build it.** In Undermind's own benchmark (vendor-run; 23 queries; a GPT-5.6 judge reading abstracts), its pipeline found 85% of the top-20 papers within 10 minutes, against 47% for Claude Opus 5 in Claude Code and 50% for GPT-5.6 in Codex ([Undermind](https://www.undermind.ai/)). A \$144–588/year seat is cheaper than the hours to match it [~80%]. Several of these tools expose API or MCP access (Consensus, Scite), so a built catalog can call them as components ([AI Research Assistants](/finding/ai-research-assistants/)).
3. **For books and chapters, there is little to buy.** The AI research assistants are paper-centric: Elicit searches "academic papers", and Undermind and Consensus speak only of "papers" (R04). A catalog that places textbook chapters on a topic map and routes each to the best legal copy is the part you have to build.
4. **The money breaks even quickly; the hours do not.** The month-tier bill equals one to two years of an Elicit Pro seat. The 100–140 hours, at \$50–150/hour, would pay for 4–19 years of all four discovery seats in the table (Elicit, Undermind, Consensus and Claude Pro: \$1,124 a year). Build when at least one of these holds:
   - the product does not exist to buy;
   - the building is itself valuable to you (learning, research on interfaces);
   - enough people will share the catalog that per-seat pricing would cost more.
5. **Licensed content limits what a build may do.** O'Reilly's agreement forbids using its content as AI input, and JSTOR's terms (updated 2026-04-24) ban automated downloading and LLM training (R03). Link to licensed content you can read; do not enrich from it unless its terms allow. Enrichment should come from metadata, TOCs, open full text and abstracts ([The Legal Map](/building/legal-map/)).

## Open questions

- **What is the current Claude tokenizer's multiplier on book-length English prose, measured against `o200k_base`?** Run `count_tokens` on 100 Gutenberg and 100 Institutional Books volumes and report the distribution. The answer moves every Claude total here by tens of percent and decides whether 1.35× is a safe planning factor.
- **How many thinking tokens do Haiku 5.5 (default `medium` effort) and Opus 5.5 (effort `low`) spend per item on blurb and chapter-summary jobs?** A 1,000-item pilot logging `usage.output_tokens` would show whether the Opus rows in the job-totals table are 1.2× or 2× too low.
- **How large is the quality gap between Haiku 5.5 and Sonnet 5.5 on TOC-grounded blurbs and on chapter summaries?** A blinded 200-item comparison with human raters, reported as a win rate with a confidence interval, would decide whether the \$342 Sonnet premium in the worked example is worth paying.
- **How faithful are 2026 models on book-length summaries, and what does a chapter-level human check cost?** No published FABLES-style study covers 2026 models.
- **Does the static 10M-work design serve queries at 1–3 MB each, with acceptable recall, from R2?** A benchmark reporting recall@10 against an exact index would answer it.
- **What is Sonnet 5.5's cache-read price?** Anthropic's pricing page said \$0.10/MTok on 2026-10-15; the wiki's pricing reference says \$0.20. Re-fetch the page and update `research/pricing-reference.md` if \$0.10 holds.
- **How many hours of agentic Claude Code work do Pro's 5-hour and weekly limits allow?** A builder logging limit hits through a month-tier build would show whether that tier needs Max.
- **How many hours do real builds take?** Anyone building one of these tiers could log hours by phase (adapters, clustering, enrichment, UI, verification) and publish them.

## Related pages

- [A Reference Architecture](/building/reference-architecture/): the pipeline these costs attach to.
- [The Legal Map](/building/legal-map/): what you may enrich, store and share.
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/): what to build with the catalog.
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the free dumps behind the \$0 acquisition line.
- [AI Research Assistants](/finding/ai-research-assistants/): the discovery tools on the "buy" side.
- [Generative Interfaces](/interfaces/generative-interfaces/): caching and faithfulness for generated text.
- [Cheap Subscriptions](/access/subscriptions/), [Public Libraries](/access/public-libraries/) and [The Access Ladder](/access/access-ladder/): the content side of build-or-buy.
- [What to Do First](/start-here/decision-guide/).
