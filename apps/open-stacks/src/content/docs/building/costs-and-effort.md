---
title: Costs and Effort
description: What a personal "catalog of everything" costs in money and hours as of October 2026. LLM enrichment at 1k, 100k and 10M works, per-job prices for summaries and abstracts, embeddings, storage, static vs server hosting, Claude Code effort tiers, the places costs blow up, a worked example with the arithmetic, and how building compares with buying subscriptions.
---

*Status: draft, October 2026. Prices are as of 2026-10-15 unless another date is given. Claude prices follow the wiki's [pricing reference](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/pricing-reference.md) (Anthropic's model reference, cached 2026-10-06), spot-checked against [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing) on 2026-10-15. Other providers' prices come from the verified tables in the [R10 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md). Every total on this page is my own arithmetic from those prices. Token counts per item are assumptions, and the hour estimates are inference, not measurements. Subscription prices come from the [R03](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md) and [R04](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md) dossiers. Primary sources are linked inline.*

## The short version

- **Model tokens are no longer the main cost.** Batch prices as of October 2026 put a one-paragraph blurb for each of 100,000 books (from metadata plus table of contents) at **\$15** on Claude Haiku 5.5, **\$300** on Sonnet 5.5 and **\$600** on Opus 5.5. A one-line summary of 1M paper abstracts costs **\$62.50** on Haiku 5.5.
- **Your hours are the main cost.** R10 estimates a usable month-tier build at 80–120 hours of focused work with Claude Code. At any plausible value of a researcher's time, that dwarfs the \$490–1,260 model bill in the [worked example](#worked-example-a-month-tier-probability-and-decisions-shelf).
- **Model choice is the biggest money lever.** Per token, Fable 5.1 costs 100× what Haiku 5.5 costs. Run a small model over the long tail and a strong model over a curated core of 1k–10k books.
- **Most surprise bills come from five things:**
  - Haiku 5.5 prompts over 100K tokens cost 5×.
  - The tokenizer adds up to 35% more tokens.
  - Thinking tokens are billed as output, and thinking cannot be switched off on Opus 5.5 or Fable 5.1.
  - Every full re-run after a prompt change costs the whole job again.
  - Checking quality costs far more than generating text.
- **Host statically by default.** A static site plus range-request databases on free hosting serves a 100k-work catalog for \$0 a month. You need a server only for chunk-level semantic search over full text, or for writes shared between users.
- **Building does not replace buying content.** A catalog routes you to texts; it doesn't give you the right to read them. What a build replaces is paid *discovery*, such as an Elicit Pro seat at \$588 a year. Content subscriptions (O'Reilly, Perlego, JPASS) stay a separate decision, and a free library card should come first ([The Access Ladder](/access/access-ladder/)).

## Prices this chapter uses

USD per million tokens (MTok), as of October 2026. Batch requests are asynchronous and cost 50% of the standard price on every provider listed here.

| Model | Standard in / out | Batch in / out | Notes | Source |
|---|---|---|---|---|
| Claude Haiku 5.5 (prompt up to 100K tokens) | \$0.10 / \$0.50 | \$0.05 / \$0.25 | Thinking is on by default. `thinking: disabled` is accepted at effort `high` or below | [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Haiku 5.5 (prompt over 100K tokens) | \$0.50 / \$2.50 | \$0.25 / \$1.25 | 5× the short-prompt rate, applied to the whole request | same |
| Claude Sonnet 5.5 | \$2 / \$10 | \$1 / \$5 | Full 1M context at the standard rate. `thinking: {type: "between_tools"}` turns off up-front thinking | same |
| Claude Opus 5.5 | \$4 / \$20 | \$2 / \$10 | Thinking is always on; effort is the only control | same |
| Claude Fable 5.1 | \$10 / \$50 | \$5 / \$25 | Thinking is always on | same |
| OpenAI gpt-5-nano | \$0.05 / \$0.40 | \$0.025 / \$0.20 | Reasoning tokens are billed as output (R10, not re-verified) | [OpenAI](https://developers.openai.com/api/docs/pricing) |
| OpenAI gpt-5.6-luna | \$0.20 / \$1.20 | \$0.10 / \$0.60 | | same |
| OpenAI gpt-5-mini | \$0.25 / \$2.00 | \$0.125 / \$1.00 | | same |
| Gemini 3.5 Flash-Lite | \$0.30 / \$2.50 | \$0.15 / \$1.25 | Output price includes thinking | [Google](https://ai.google.dev/gemini-api/docs/pricing) |
| Gemini 3.8 Flash | \$0.75 / \$3.75 until 2026-12-31; \$1.50 / \$7.50 from 2027-01-01 | \$0.375 / \$1.875, then \$0.75 / \$3.75 | The introductory price ends at year-end | same |

Five details change the arithmetic for Claude models:

1. **The Haiku 5.5 long-prompt tier.** Anthropic's pricing page says a request whose prompt is over 100,000 tokens "pays higher prices". Prompt length counts *all* input tokens, cache reads and writes included, and each request is priced on its own. Sonnet 5.5, Opus 5.5 and Fable 5.1 have no such tier: a 900k-token request is billed at the same per-token rate as a 9k-token one ([pricing page, long context](https://platform.claude.com/docs/en/about-claude/pricing#long-context-pricing)).
2. **The tokenizer.** Claude models from Opus 4.7 onward, which includes all four current models, use a newer tokenizer. It produces about 1.0–1.35× as many tokens for the same text as older Claude tokenizers; the pricing page puts it at "approximately 30% more". The token counts in this chapter are generic estimates. For example, the Institutional Books corpus counts with OpenAI's `o200k_base` ([dataset card](https://huggingface.co/datasets/institutional/institutional-books-1.0)). I therefore quote Claude totals at the base count and at 1.35× as an upper bound. Measure your own text with `count_tokens` before a large job.
3. **Thinking.** Per Anthropic's [thinking configuration table](https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting) (fetched 2026-10-15):
   - **Haiku 5.5** thinks by default and accepts `disabled` at effort `high` or below.
   - **Sonnet 5.5** rejects `disabled`; send `between_tools` instead.
   - **Opus 5.5 and Fable 5.1** cannot turn thinking off at all.
   - Thinking tokens are billed as output tokens, so for bulk jobs they are the largest hidden line item (see [Where costs blow up](#where-costs-blow-up)).
4. **Caching.**
   - **Writes** cost about 1.25× input with a 5-minute TTL.
   - **Reads on Opus 5.5** cost \$0.20/MTok.
   - **Reads on Sonnet 5.5** are \$0.20/MTok in the pricing reference (0.1× input), but the live pricing page listed **\$0.10** (0.05×) on 2026-10-15. Check before you rely on either.
   - **Reads on Haiku 5.5** are listed on the pricing page at \$0.01/MTok for short prompts.
   - **Bulk jobs** rarely benefit, because each item's prompt is different. Pack 10–50 items per request to amortize the instructions instead (R10's suggestion).
5. **Data residency.** Requesting US-only inference (`inference_geo`) multiplies every token price by 1.1 on current models ([pricing page](https://platform.claude.com/docs/en/about-claude/pricing)).

## How to estimate any job

The cost of a batch job is

`cost = N × (tokens_in × price_in + (tokens_out + tokens_thinking) × price_out) / 1,000,000 × tokenizer_factor × (1 + rerun_fraction)`

Two reference points are useful as rules of thumb:

- **Haiku 5.5, batch.** A million short items at 1,000 tokens in and 200 out costs 1,000 MTok × \$0.05 + 200 MTok × \$0.25 = **\$50 + \$50 = \$100**.
- **Sonnet 5.5, batch.** The same million items cost 1,000 × \$1 + 200 × \$5 = **\$2,000**. Opus 5.5 doubles that again.

Output tokens are 5× the price of input tokens on every Claude model. A job that writes long chapter summaries, or that thinks before writing, is dominated by output even when it reads far more than it writes.

## What common enrichment jobs cost

Three jobs cover most of what a catalog needs. The per-item token counts follow R10:

- **Blurb from metadata plus table of contents (TOC):** 1,500 tokens in, 300 out. This gives a one-paragraph description, a level, prerequisites and tags.
- **Full-text book summary:** chapter summaries plus a book summary, written by map-reduce over chunks.
  - A modern ~115,000-word nonfiction book is about 155k tokens in and 5k out, prompts included.
  - A scanned library volume is about 255k in and 6k out. Institutional Books averages ~246k tokens per volume (242B tokens over 983,004 volumes).
- **Paper abstract to one-line summary plus tags:** 500 tokens in, 150 out.

**Cost per item, batch pricing (October 2026, my arithmetic):**

| Job | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | Fable 5.1 | gpt-5-nano | Gemini 3.5 Flash-Lite |
|---|---|---|---|---|---|---|
| Blurb from metadata + TOC | \$0.00015 | \$0.003 | \$0.006 | \$0.015 | \$0.0001 | \$0.0006 |
| Modern book, full text (chunked under 100K) | \$0.009 | \$0.18 | \$0.36 | \$0.90 | \$0.005 | \$0.03 |
| Same book, sent unchunked | \$0.045 (long-prompt tier) | \$0.18 | \$0.36 | \$0.90 | — | — |
| Scanned volume, full text (chunked) | \$0.014 | \$0.29 | \$0.57 | \$1.43 | \$0.008 | \$0.046 |
| Paper abstract | \$0.0000625 | \$0.00125 | \$0.0025 | \$0.00625 | \$0.00004 | \$0.00026 |

**Job totals at typical sizes (batch).** Claude rows are at base token counts; multiply them by up to 1.35 for the tokenizer.

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

How to read this:

- **Chunk long books for Haiku 5.5.** Sending a whole modern book in one request moves it into the long-prompt tier and costs 5× (\$450 vs \$90 per 10k books). The chunks must stay under 100K *Claude* tokens. If your counts come from another tokenizer, cut at about 70–75k to leave room for the 1.35× factor (my inference). Chunking also yields chapter-level summaries, which are the unit you want for "find the best chapter on X" ([A Reference Architecture](/building/reference-architecture/)).
- **Reuse before you generate.** For papers, Semantic Scholar's 2026-10-06 release already ships 58M TLDRs and 120M SPECTER2 embeddings ([release manifest](https://api.semanticscholar.org/datasets/v1/release/latest)). Check each dataset's license before you redistribute anything derived from it.
- **The cheapest rows are not always the best value.** Summary quality differs by model. In the 2024 FABLES study, the share of claims in book-length summaries judged faithful was 90.9% for Claude 3 Opus, 78% for GPT-4 and 69% for Mixtral ([Kim et al. 2024](https://arxiv.org/abs/2404.01261)). Those are 2024 models, and I found no 2026 equivalent.
- **Where a small model is enough.** I'd expect a small model to be adequate for TOC-grounded blurbs [~70%], because the task is close to extraction. I'd expect it to be noticeably worse for full-text chapter summaries [~65%].
- **Test before you choose.** Run a 200-item blind comparison on your own corpus first.

## Costs at three scales

The scales follow R10:

- **1k works:** a curated core shelf, all in full text.
- **100k works:** metadata plus TOC for every work, and full text for a 10k open subset.
- **10M works:** metadata and abstract level only, with precomputed vectors where possible.

Book parsing assumes 300 pages per book. All totals are my arithmetic.

| Line item | 1k works | 100k works | 10M works |
|---|---|---|---|
| Data acquisition | \$0 (Gutenberg, OpenStax, DOAB, HathiTrust public domain, arXiv) | \$0 from dumps and OAI-PMH. The OpenAlex API is free up to \$1/day with a free key | \$0 for snapshots. 1.2–2.4 TB of disk (≈\$100–300 one-time per R10, prices unverified), or \$18–36/month on Cloudflare R2 |
| Parsing / OCR | 300k pages: \$0 if born-digital; up to ~\$60 self-hosted olmOCR; ≈\$375 LlamaParse basic | 3M pages for the subset: \$0–600 self-hosted; ≈\$3,750 LlamaParse | Not parsed. Reuse OpenAlex TEI or s2orc where licensed |
| LLM enrichment (batch) | Haiku \$9–12; Sonnet \$180–243; Opus \$360–486 | Meta + TOC: Haiku \$15–20, gpt-5-nano \$10, Sonnet \$300–405. Full-text subset: Haiku \$90–122, Sonnet \$1,800–2,430 | Haiku \$625–844; gpt-5-nano \$425; Flash-Lite \$2,625; Sonnet \$12,500–16,875 |
| Embeddings | ~155M tokens: \$0 inside Voyage's free tokens, else ~\$3 | Meta + TOC (100M tokens): \$0–13. Full-text subset (1.5B): \$30–195 | 3B tokens: \$60–600, or \$0 for papers by reusing SPECTER2 |
| Vector and text storage | ~1–10 GB | ~20–200 GB | Index 0.3–41 GB, depending on dimensions and quantization; raw lake 1.2–2.4 TB |
| Hosting per month | \$0 (static) | \$0–20 (static plus range-request databases) | \$0–50 static shards, or turbopuffer from \$16 or \$256 minimums, or a \$40–150 VPS with pgvector (R10's VPS range is unverified) |
| **One-time total** | **≈\$10 (Haiku, born-digital) to ≈\$860 (Opus, hosted parsing)** | **≈\$135 (Haiku throughout) to ≈\$3,600 (Sonnet, self-hosted OCR); ≈\$6,800 with hosted parsing** | **≈\$600 (gpt-5-nano, cheapest embeddings, local disk) to ≈\$18,000 (Sonnet)** |
| Main cost risk | Overusing frontier models | Unchunked prompts on Haiku; thinking tokens; hosted parsing | Model choice; re-runs; the Gemini 3.8 Flash price doubling on 2027-01-01 |

Two observations:

- **At 10M works the model choice is the whole budget.** The gap between gpt-5-nano or Haiku 5.5 (\$425–844) and Sonnet 5.5 (\$12,500+) is larger than every other line combined.
- **At 100k works the parsing route can cost more than the LLM.** LlamaParse's basic tier is \$1.25 per 1,000 pages, against olmOCR's self-reported cost of under \$200 per million pages ([olmOCR README](https://github.com/allenai/olmocr)). Prefer born-digital EPUB and HTML wherever they exist.

## Embeddings

Prices as of October 2026, from R10, which verified them on each provider's page.

| Corpus (tokens) | text-embedding-3-small or voyage-4-lite (\$0.02/MTok) | voyage-4 (\$0.06) | text-embedding-3-large (\$0.13) | Gemini Embedding 2 (\$0.20; batch \$0.10) |
|---|---|---|---|---|
| 100k books, meta + TOC (~100M) | \$2 (Voyage: \$0 within the free tokens) | \$6 (\$0 within the free tokens) | \$13 | \$20 / \$10 |
| 10k books, full text (~1.5B) | \$30 | \$90 | \$195 | \$300 / \$150 |
| 1M abstracts (~300M) | \$6 | \$18 | \$39 | \$60 / \$30 |
| 10M works (~3B) | \$60 | \$180 | \$390 | \$600 / \$300 |

Notes:

- **Voyage's free allowance.** Voyage gives 200M free tokens *per model*, and they don't apply to batch usage ([Voyage pricing](https://docs.voyageai.com/docs/pricing)).
- **Self-hosting is the free alternative.** Qwen3-Embedding (0.6B/4B/8B, Apache-2.0, 32k context) and EmbeddingGemma-300M can run locally, and EmbeddingGemma can embed queries in the browser.
- **Time on a rented GPU.** R10 guesses that one rented GPU embeds 1.5B tokens in a day or two for tens of dollars [low–medium confidence; not benchmarked].
- **Papers.** Use SPECTER2 as shipped.
- **Embeddings are cheap next to everything else.** The only choice here that changes the total much is whether you embed full-text *chunks* at all.

## Parsing, transcription and data access

| Item | Price (as of Oct 2026) | Notes |
|---|---|---|
| Born-digital text (Gutenberg EPUB/HTML, OpenStax, LibreTexts ZIMs, arXiv LaTeX) | \$0 parsing | Skip PDF parsing entirely where you can |
| olmOCR, self-hosted | Under \$200 per million pages (self-reported) | Needs an NVIDIA GPU with at least 12 GB ([README](https://github.com/allenai/olmocr)) |
| LlamaParse basic | \$1.25 per 1,000 pages; 10k free credits a month | Agentic tiers cost more ([pricing](https://www.llamaindex.ai/pricing)) |
| OpenAI gpt-transcribe | \$0.0045/min, so 1,000 lecture hours cost \$270 | Whisper API is \$0.006/min, or \$360 per 1,000 hours ([OpenAI](https://developers.openai.com/api/docs/pricing)) |
| OpenAlex snapshot | \$0. About 745 GB of JSONL; AWS Open Data pays the transfer | Quarterly ([snapshot](https://help.openalex.org/access/snapshot/)) |
| OpenAlex API | Free key gets \$1/day. List calls cost \$0.10 per 1,000, search \$1 per 1,000, PDFs \$10 per 1,000 | \$1/day buys about 10,000 list calls or 100 PDFs ([example costs](https://help.openalex.org/access/example-costs/)) |
| arXiv full text | Requester-pays S3, ~9.2 TB as of April 2025 | You pay AWS transfer; processing inside us-east-1 avoids internet egress ([arXiv](https://info.arxiv.org/help/bulk_data_s3.html)) |

## Storage

These sizes are from R10's calculations.

| Item | Size |
|---|---|
| One 1024-d vector | fp32 4 KB; int8 1 KB; binary 128 B. At 256-d: int8 256 B, binary 32 B |
| 10M works, one vector each | fp32 1024-d: 41 GB; int8 256-d: 2.6 GB; binary 256-d: 320 MB |
| 10k books × ~300 chunks (3M chunks) | fp32 1024-d: 12.3 GB; int8: 3.1 GB; binary: 0.4 GB |
| Full text, 10k books × ~150k tokens | ~6 GB plain UTF-8, ~2 GB compressed |
| Raw metadata lake for the 10M tier | 1.2–2.4 TB: ≈1.24 TB core files, ≈1.5 TB with Semantic Scholar citations, ≈2.3 TB with SPECTER2 |

Storage is a decision about quantization, not about money:

- **Store at 256–512 dimensions in int8 or binary, and rescore.** R10 estimates this cuts vector storage 8–32× at a modest recall loss. This matters only because static hosts cap file and site sizes (next section).
- **Holding the full 2.4 TB lake on R2** would cost about \$36 a month at \$0.015/GB-month ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). A local disk is cheaper over a year.

## Hosting: static or server

| Setup | Scale it handles | Monthly cost (Oct 2026) | Catch |
|---|---|---|---|
| Static site with Pagefind on GitHub Pages or Cloudflare Pages | "Tens of thousands of pages"; about 100–300 kB transferred per search on a 10k-page site ([Pagefind](https://pagefind.app/)) | \$0 | GitHub Pages: published sites up to 1 GB, soft bandwidth limit of 100 GB/month ([limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Cloudflare Pages Free: 20,000 files per site, 25 MiB per file ([limits](https://developers.cloudflare.com/pages/platform/limits/)). One HTML page per work therefore stops at about 20k works on Cloudflare's free plan |
| Static shell plus range-request databases on object storage | 100k to 10M records. SQLite FTS5 through [sql.js-httpvfs](https://github.com/phiresky/sql.js-httpvfs); Parquet through [DuckDB-Wasm](https://duckdb.org/docs/current/clients/wasm/overview.html) | \$0 within R2's free tier (10 GB-month storage, 10M reads a month, free egress); then \$0.015/GB-month and \$0.36 per million reads | DuckDB-Wasm has a 4 GB memory cap. sql.js-httpvfs never evicts its cache and calls itself "mainly written for small personal projects". Untested at 10M works [R10, medium confidence] |
| Static semantic search: transformers.js query embedding, IVF centroids, binary shards | 10M works × 256-d binary = 320 MB; about 1–3 MB fetched per query | \$0–1 | R10's design, not benchmarked. Recall loss from binary quantization needs int8 rescoring |
| Managed vector database | Large | Qdrant Cloud free tier: 0.5 vCPU, 1 GB RAM, 4 GB disk ([Qdrant](https://qdrant.tech/pricing/)). turbopuffer minimums: \$16, \$256 or \$4,096+ a month ([turbopuffer](https://turbopuffer.com/pricing)) | turbopuffer's per-GB rates were not visible on the pricing page |
| VPS with Postgres and pgvector | Chunk-level search over full text; shared writes | \$40–150 (R10 estimate, unverified) | You run it, patch it and back it up |

The decision rule:

- **Stay static** until you need semantic search over full-text chunks or multi-user writes. A personal or small-group catalog of 100k works fits in about 50 MB of int8 vectors plus a few hundred MB of metadata (my estimate). That is inside every free tier above.
- **Above about 20k works,** stop generating one HTML page per work. Render work pages client-side from sharded data files.

**Query-time LLM costs** (standard, not batch, prices) are small for one reader:

- **Haiku 5.5, retrieval-augmented question:** 10k tokens in and 500 out cost about \$0.0013 (10k × \$0.10/MTok + 500 × \$0.50/MTok).
- **Opus 5.5, same question:** about \$0.05.
- **Opus 5.5, a question against a whole cached 150k-token book:** the first request writes the cache for about \$0.75 (150k × \$5/MTok). Each later question reads it for \$0.03, plus about \$0.01 of output.
- **Haiku 5.5, the same uncached book:** the 150k-token prompt crosses the long-prompt tier, so each question costs about \$0.075 in input alone.

At 300 questions a month, retrieval-augmented question answering costs about \$0.40 on Haiku and \$15 on Opus. R04 estimates that 50 deep-research sessions a month through APIs cost about \$50–150, comparable to an Elicit Pro seat.

## Where costs blow up

Ranked by how often I expect each to bite on a first build [subjective]:

1. **Thinking tokens on bulk jobs.** They are billed as output, which costs 5× input on every Claude model.
   - **Illustration:** suppose each blurb in the 100k-book job thinks for an extra 500 tokens. Output rises from 30M to 80M tokens. On Haiku 5.5 the job goes from \$15 to 150 × \$0.05 + 80 × \$0.25 = **\$27.50**. On Opus 5.5, which cannot disable thinking, it goes from \$600 to 150 × \$2 + 80 × \$10 = **\$1,100**.
   - **Mitigation:** for extraction-like jobs, disable thinking on Haiku 5.5 (at effort `high` or below) or send `between_tools` on Sonnet 5.5. On Opus 5.5, set effort to `low`; its default is `medium`.
   - **Measure first:** run a 1% pilot and read `usage.output_tokens` before you submit the rest.
2. **Re-runs.** A prompt tweak after the full run costs the full run again.
   - **Mitigation:** store `model`, `prompt_version` and `generated_at` on every generated field. Pilot on 1–2% of items across three or so prompt versions. Regenerate only the items a change affects.
   - **Budgeting:** one full re-run is a realistic contingency for a first build [~60% that you'll want one].
3. **Long prompts on Haiku 5.5.** Prompts over 100K tokens cost 5× (\$450 instead of \$90 for 10k books).
   - Cache reads count toward the threshold, so a cached book does not escape it.
   - Chunk below 100K Claude tokens with a margin for the tokenizer.
4. **Tokenizer inflation.** Plan on 1.0–1.35× your estimated Claude tokens until `count_tokens` on a sample says otherwise.
5. **Verification.** Checking costs far more than generating, in both money and hours.
   - **Human checking:** FABLES paid about \$200 per book, roughly 11 annotator-hours, to check a book-length summary against the book ([Kim et al. 2024](https://arxiv.org/abs/2404.01261)). That is about 22,000 Haiku 5.5 full-text summaries, or about 550 Opus 5.5 ones at batch prices.
   - **LLM checking:** in that study the best LLM checker reached only F1 = 58.2 on unfaithful claims (2024 models). An LLM judge that reads the source costs about as much as generating the summary.
   - **Sampling instead of checking everything:** have an LLM judge read a stratified sample. A human then reads a few hundred blurbs and a handful of chapters. Budget that as hours, not dollars (see the worked example).
6. **Model choice drift.** It is easy to prototype on Opus and forget to switch. Opus 5.5 is 40× Haiku 5.5 per token, and Fable 5.1 is 100×.
7. **Price changes.** Gemini 3.8 Flash's introductory price doubles on 2027-01-01. Re-price any long-running job after year-end.
8. **Hosted parsing.** LlamaParse's basic tier costs at least 6× olmOCR's self-reported cost per page, and agentic tiers cost more again.
9. **Metered APIs used as bulk sources.**
   - **OpenAlex PDFs** cost \$10 per 1,000 beyond the free \$1/day; bulk-load from the snapshot instead.
   - **Open Library** forbids bulk metadata harvesting through its API; use the monthly dumps.
10. **Small multipliers.** US-only inference adds 1.1×. Cache writes cost 1.25× input and only pay off when the cache is read again within the TTL.

## Worked example: a month-tier "probability and decisions" shelf

A plausible first serious build for a researcher in forecasting and Bayesian statistics has four parts:

- **Catalog:** 100,000 works (books and textbooks), each with a blurb, a level and tags generated from metadata plus TOC.
- **Core shelf:** 2,000 openly licensed books with chapter-level summaries.
- **Papers:** 1,000,000 paper abstracts (arXiv and OpenAlex) with one-line summaries.
- **Search:** semantic search over all of it, served statically.

The model plan is Haiku 5.5 for the long tail and Sonnet 5.5 for the core shelf, all through the Batch API.

**1. Blurbs, 100,000 works on Haiku 5.5 batch.**
- Input: 100,000 × 1,500 = 150M tokens × \$0.05/MTok = \$7.50.
- Output: 100,000 × 300 = 30M tokens × \$0.25/MTok = \$7.50.
- **Subtotal: \$15.00.**

**2. Core shelf, 2,000 books on Sonnet 5.5 batch.** Map-reduce over chunks, with up-front thinking off via `between_tools`.
- Input: 2,000 × 155,000 = 310M tokens × \$1/MTok = \$310.
- Output: 2,000 × 5,000 = 10M tokens × \$5/MTok = \$50.
- **Subtotal: \$360.**
- The same job on Haiku 5.5 would be 2,000 × \$0.009 = \$18. The quality difference is what you are paying \$342 for; test it on 20 books first.

**3. Papers, 1,000,000 abstracts on Haiku 5.5 batch.**
- Input: 1,000,000 × 500 = 500M × \$0.05 = \$25.
- Output: 1,000,000 × 150 = 150M × \$0.25 = \$37.50.
- **Subtotal: \$62.50.** Reusing Semantic Scholar TLDRs where they exist and are licensed for your use would cut this.

**4. Embeddings with voyage-4-lite.**
- Tokens: blurbs and TOCs 100M, core-shelf chunks 310M, abstracts 300M, so 710M in total.
- Billable: 710M minus the 200M free tokens = 510M × \$0.02 = **\$10.20.** Using SPECTER2 for the papers drops this to \$4.20.

**5. LLM verification on Sonnet 5.5 batch.**
- A 2% sample of blurbs: 2,000 items × 1,800 tokens in = 3.6M × \$1 = \$3.60. Plus 2,000 × 200 tokens out = 0.4M × \$5 = \$2.00. That makes \$5.60.
- A 10% sample of the core shelf: 200 books × 160k tokens in (the book plus its summaries) = 32M × \$1 = \$32. Plus 200 × 2k out = 0.4M × \$5 = \$2. That makes \$34.
- **Subtotal: \$39.60.**

**6. One clean pass:** \$15.00 + \$360 + \$62.50 + \$10.20 + \$39.60 = **\$487.30.**

**7. Realistic upper bound.**
- The Claude lines total \$477.10.
- Add pilots: three prompt versions on 1% of each generation job, 3 × 1% × \$437.50 = \$13.13.
- Add one full re-run of the three generation jobs: \$437.50.
- Scale for the tokenizer: (\$477.10 + \$13.13 + \$437.50) × 1.35 = \$1,252.44.
- Add embeddings: + \$10.20 = **≈\$1,263.**

**8. Hosting.**
- **Vectors:** about 51 MB of int8 vectors for 100k blurbs (512-d) and about 154 MB for 600k core-shelf chunks (256-d int8). The 1M papers add 32 MB binary plus 256 MB of int8 for rescoring.
- **Metadata:** a few hundred MB.
- **Fit:** this is inside R2's 10 GB free tier but uncomfortably close to GitHub Pages' 1 GB site cap. Put the shards on R2 and the shell on Pages. **\$0/month.**

**9. Claude Code.** Claude Code is included in all paid Claude plans: Pro is \$20/month or \$200/year, Max from \$100/month ([claude.com/pricing](https://claude.com/pricing), fetched 2026-10-15). I did not verify whether Pro's usage limits cover 20–30 hours a week of agentic coding. Budget **\$20–100** for the month.

**10. Hours.**
- **Build:** R10's month tier is 80–120 hours.
- **Human verification:** R10 does not itemize it, so I add it.
  - Checking 200 blurbs against their TOCs at about 2 minutes each is about 7 hours.
  - Checking 10 chapter summaries against the chapters is about 11 hours, assuming a chapter takes about a tenth of FABLES' ~11 hours per book.
- **Total:** about **100–140 hours.**

**Bottom line:**
- **Money:** \$510–1,360 all-in, model bill plus one month of subscription.
- **Time:** 100–140 hours.
- **Cheaper variant:** swapping Sonnet for Haiku on the core shelf brings the money to roughly \$165–425, subscription included.
- **The dominant cost** is the hours under every assumption. At \$50/hour they are worth \$5,000–7,000; at \$150/hour, \$15,000–21,000. Substitute your own rate.

## Effort tiers with Claude Code

The hours are R10's inference for one technically strong developer driving Claude Code, counted as focused work rather than calendar time. Nobody has measured them. I'd put ~50% on a first-time builder exceeding the upper end of the range. R10 also expects about a third of build effort to go to ID crosswalks and edition clustering, which is harder than search.

| Tier | Hours | Money (Oct 2026) | What it delivers | Main risks |
|---|---|---|---|---|
| **Weekend** | 12–20 | ≈\$22. Claude Pro \$20; Haiku 5.5 batch blurbs for 10k works = 10,000 × \$0.00015 = \$1.50; embeddings \$0 inside Voyage's free tokens; hosting \$0 | A browsable, searchable "free shelf" of about 10k works from two or three clean sources (Gutenberg catalog, OpenStax API, DOAB OAI, or the Open Library works dump filtered to public ebooks), with summaries, client-side semantic search over a vector file under 50 MB, and a topic map | Learning the Batch API; Pagefind index size; messy subject headings |
| **Month** | 80–120 (100–140 with verification) | ≈\$135–3,600 one-time (the 100k-work tier), plus \$20–100 a month for Claude. See the worked example | 8–10 source adapters; a unified work record; first-pass edition clustering with a 300–500-pair labeled evaluation set; a rights resolver giving a "best free copy" link; a full-text pipeline for 1–10k open books; chapter-level search; hybrid search; a reading queue; an OPDS feed; an MCP server so Claude can query the catalog | Clustering precision and recall; OCR noise; rate limits (Open Library 1–3 requests/s, Crossref's polite pool); license tagging |
| **Quarter** | 300–450 | ≈\$600–18,000 one-time (the 10M tier), plus disk, plus \$60–300+ of Claude subscriptions | 10M works with incremental updates (OpenAlex quarterly, Open Library monthly, Hathifile daily, Semantic Scholar weekly); scalable entity resolution with LLM adjudication of ambiguous pairs; a rights engine with jurisdiction rules; a static sharded semantic index; several interfaces (map, shelf, syllabus builder, prerequisite graph); quality dashboards and a cost ledger | Scale bugs; drift between sources; keeping LLM fields fresh; the maintenance burden |

Which tier to aim for:

- **To find out whether you would use such a tool at all,** do the weekend tier. It costs less than a month of most discovery subscriptions, and its output is reusable.
- **If your reading is books and textbooks scattered across sources,** the month tier is where the value is. R10 found no tool that routes chapters across books, papers and lectures to the best legal copy, and I know of none [~80%] (see [Build or buy](#build-or-buy)).
- **Do the quarter tier only if the catalog will be shared** with a group or community, or if the 10M scope is the point. The marginal reader of a static catalog costs nothing; maintenance does not.

Valuing the hours makes the comparison concrete. At \$50–150/hour:

| Tier | Hours | Value of hours | Money spent | Hours as share of total |
|---|---|---|---|---|
| Weekend | 12–20 | \$600–3,000 | ≈\$22 | about 96–99% |
| Month | 100–140 | \$5,000–21,000 | \$510–1,360 (worked example) | about 79–98% |
| Quarter | 300–450 | \$15,000–67,500 | ≈\$650–18,100 | about 45–99% |

## Build or buy

Subscriptions sell two different things: **content** (the right to read) and **discovery** (finding what to read). A personal catalog is a discovery product, so it competes only with the second group.

| Option | What you get | Annual cost (Oct 2026) | What it does not do | Source |
|---|---|---|---|---|
| A free public library card (for example SFPL, free to California residents) | Libby, O'Reilly for Public Libraries, ProQuest eBook Central and article databases | \$0 | Discovery across sources; holds queues | R03; [Public Libraries](/access/public-libraries/) |
| O'Reilly Individual | 66,609 book titles in its sitemap; strong on Packt, Wiley, O'Reilly, Pearson and Manning; nothing from MIT Press, CUP, OUP or core Springer | \$499 (\$49/month) | Its membership agreement forbids using content "as input or a prompt to a machine learning or AI system" | [pricing](https://www.oreilly.com/pricing/); [agreement](https://www.oreilly.com/membership-agreement/) |
| Perlego Complete | About 1.5M titles, strong in the humanities and social sciences | \$199 (\$27/month) | Weak on technical publishers | [pricing](https://www.perlego.com/pricing/) |
| Everand Plus | 3 "unlocks" a month from a 1.5M+ catalog | \$204 (\$16.99/month) | Unlimited reading ended | [plans](https://support.scribd.com/hc/en-us/articles/40678839226644-Everand-plans-Standard-Plus-and-Deluxe) |
| JSTOR JPASS | Unlimited online reading plus 120 PDF downloads (about \$1.66 each) | \$199 | Papers in JSTOR's 2,400+ journals only | [JPASS](https://about.jstor.org/products/jpass/) |
| DeepDyve | Streaming of 35M+ paywalled papers | \$499 (\$59/month) | Printing capped at 20–40 pages a month | [pricing](https://www.deepdyve.com/pricing) |
| Elicit Pro | AI search and extraction over 138M papers; systematic-review workflow | \$588 (\$49/month billed annually) | Books. Full text of paywalled papers (it falls back to abstracts) | [pricing](https://elicit.com/pricing) |
| Undermind Pro | Deep paper search with a discovery-curve estimate of what was missed | \$192 (\$16/month billed annually) | Books; synthesis across non-paper sources | [pricing](https://www.undermind.ai/pricing) |
| Consensus Pro | Paper search, a "Consensus Meter", 15 deep reviews and 500 API/MCP calls a month | \$144 (\$20 month-to-month) | Books | [plans](https://intercom.help/consensus-d118a252369c/en/articles/10087865-subscription-plans) |
| Claude Pro | Chat, Research, Claude Code | \$200 (\$20/month) | A catalog; it searches the web, not your index, unless you build one | [claude.com/pricing](https://claude.com/pricing) |

What the comparison shows:

1. **Content stays a separate purchase whatever you build.** The worked example's \$510–1,360 buys a map of 100,000 works, not the right to read them. Climb [The Access Ladder](/access/access-ladder/) first: free cards, then targeted purchases. That decides what the catalog's "read it here" links can point to.
2. **For papers, buying discovery beats building it in the short run.** In Undermind's own benchmark (vendor-run, 23 queries), its pipeline found 85% of the top-20 papers within 10 minutes, against 47–50% for Claude Opus 5 in Claude Code and GPT-5.6 in Codex, as judged by an LLM reading abstracts. A \$150–600/year seat is cheaper than the hours to match it.
   - Most of these tools expose API or MCP access (Consensus, Scite).
   - A built catalog can call them as components instead of imitating them ([AI Research Assistants](/finding/ai-research-assistants/)).
3. **For books and chapters, there is little to buy.** The AI research assistants are paper-centric: Elicit searches "academic papers", and Undermind and Consensus speak only of "papers" (R04). A catalog that places textbook chapters on a topic map and routes each one to the best legal copy is the part you can only build.
4. **The money break-even is quick, the hours break-even slow.** The month-tier bill roughly equals one to two years of one Elicit Pro seat. The 100–140 hours would buy many years of every discovery tool above. Build when at least one of these holds:
   - the product does not exist to buy;
   - the building is itself valuable to you (learning, research on interfaces);
   - the catalog will be shared by enough people that per-seat pricing would cost more.
5. **Licensed content limits what a build may do.** O'Reilly's agreement forbids AI input, and JSTOR's terms (updated 2026-04-24) ban automated downloading and LLM training. A catalog may *link* to licensed content you can read, but may not *enrich from* it. Enrichment should come from metadata, TOCs, open full text and abstracts ([The Legal Map](/building/legal-map/)).

## Open questions

- **What is the real Claude-tokenizer multiplier on book-length English prose, measured against `o200k_base`?** Run `count_tokens` on 100 Gutenberg and 100 Institutional Books volumes and report the distribution. The answer moves every Claude total here by up to 35%.
- **How many thinking tokens do Haiku 5.5 (default `medium` effort) and Opus 5.5 (effort `low`) spend per item on blurb and chapter-summary jobs?** A 1,000-item pilot logging `usage.output_tokens` would settle whether the Opus line in the job-totals table is 1.2× or 2× too low.
- **How large is the quality gap between Haiku 5.5 and Sonnet 5.5 on TOC-grounded blurbs and on chapter summaries?** A blinded 200-item comparison with human raters, reported as win rate with a confidence interval, would decide whether the \$342 Sonnet premium in the worked example is worth paying.
- **How faithful are 2026 models on book-length summaries?** No published FABLES-style study covers them, and no one has measured what a chapter-level human check costs.
- **Does the static 10M-work design actually serve queries at 1–3 MB each, with acceptable recall, from R2?** It is untested. A benchmark with recall@10 against an exact index would answer it.
- **What is Sonnet 5.5's cache-read price?** The pricing reference says \$0.20/MTok and the live pricing page said \$0.10 on 2026-10-15.
- **Do Claude Pro's usage limits support 80–120 hours a month of Claude Code, or does a month-tier build need Max?**
- **How many hours do real builds take?** Anyone building one of these tiers could log hours by phase (adapters, clustering, enrichment, UI, verification) and publish them. Every hour figure on this page is an estimate.

## Related pages

- [A Reference Architecture](/building/reference-architecture/): the pipeline these costs attach to.
- [The Legal Map](/building/legal-map/): what you may enrich, store and share.
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/): what to build with the catalog.
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the free dumps behind the \$0 acquisition line.
- [AI Research Assistants](/finding/ai-research-assistants/): the discovery tools on the "buy" side.
- [Generative Interfaces](/interfaces/generative-interfaces/): caching and faithfulness for generated text.
- [Cheap Subscriptions](/access/subscriptions/), [Public Libraries](/access/public-libraries/) and [The Access Ladder](/access/access-ladder/): the content side of build-or-buy.
- [What to Do First](/start-here/decision-guide/).
