# LLM pricing reference (Claude), for cost chapters

Source: Anthropic's model reference as cached by the Claude API skill on 2026-10-06 (first-party API rates; Bedrock and Vertex price separately). Use these figures in the wiki rather than secondary reports. Where a dossier disagrees, this file wins.

| Model | Model ID | Input \$/MTok | Output \$/MTok | Cache read \$/MTok | Notes |
|---|---|---|---|---|---|
| Claude Fable 5.1 | `claude-fable-5-1` | 10.00 | 50.00 | 0.25 | most capable widely released model; 1M context |
| Claude Opus 5.5 | `claude-opus-5-5` | 4.00 | 20.00 | 0.20 | cache read = 0.05x input |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2.00 | 10.00 | 0.20 | cache read = 0.1x input (not 0.05x, as R07 says) |
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0.10 | 0.50 | — | prompts up to 100K tokens; above 100K: 0.50 / 2.50 (5x) |

- **Batch API**: 50% of standard price, asynchronous.
- **Cache writes**: about 1.25x the input price (5-minute TTL; a 1-hour TTL is available).
- **Tokenizer**: Opus 4.7 and later (including Opus 5.5 and Fable 5.1) use a tokenizer that produces about 1.0–1.35x as many tokens as older Claude tokenizers for the same text; re-baseline with `count_tokens`.
- **Context**: 1M tokens on Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5; 128K max output.

Worked check (matches R10's estimates): summarizing 100,000 books from metadata plus table of contents at ~1,500 input and ~300 output tokens each is 150M input + 30M output tokens. On Haiku 5.5 with batch pricing: 150 × \$0.05 + 30 × \$0.25 = \$7.50 + \$7.50 = \$15. On Sonnet 5.5 batch: 150 × \$1 + 30 × \$5 = \$300.
