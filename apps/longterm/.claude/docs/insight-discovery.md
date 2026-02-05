# Insight Discovery Patterns

When improving pages, watch for these cross-page analytical patterns:

- **Stale Valuation** — Net worth/valuation figures that don't account for recent asset appreciation. Run `crux validate financials` to detect these automatically.
- **Cross-Page Contradiction** — Two pages cite different figures for the same data point (funding amounts, dates, headcounts).
- **Undrawn Conclusion** — Public facts on separate pages that, combined, yield a non-obvious result nobody states explicitly.
- **Missing Attribution** — Claims about scale ("well-funded", "influential") without tracing the sources.
- **Denominator Blindness** — Growth rates or percentages where the denominator changed significantly.
- **Survivorship Bias** — Lists that only track successes, omitting failures or shutdowns.

**Canonical example**: Jaan Tallinn's widely cited $900M-$1B net worth (2019 Forbes) didn't account for his Anthropic Series A stake ($2-6B+ at current valuation) or crypto appreciation. Combining data from the Tallinn page and the Anthropic Investors page revealed actual net worth of $3-10B+.

If you discover an insight, add it to the appropriate file in `src/data/insights/` with calibrated ratings (mean ~3 on a 1-5 scale; reserve 4+ for genuinely exceptional findings).
