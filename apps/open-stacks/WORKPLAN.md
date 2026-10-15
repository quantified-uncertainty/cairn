# Open Stacks — work plan and status

Paused 2026-10-15. This file records where the build stopped and what remains, so work can resume in a later session.

## Done

- **App scaffold**: config, prototype wrapper (`scripts/build-prototypes.mjs`), datasets in `public/prototypes/data/` with fetch scripts in `scripts/`.
- **Research**: dossiers R01–R11, each with an independent verification pass; `research/pricing-reference.md`; ideation panel results (`research/ideation-panel.json`: 49 concepts, 18 curated, judged).
- **Gap research**: R12 (grey literature) and R13 (lectures, talks and podcasts) written. R12's verification pass was interrupted; R13 has not been verified.
- **Chapters written and reviewed (24)**: access/{open-books, public-domain, open-papers, subscriptions, public-libraries, academic-and-employer, shadow-libraries, access-ladder}; finding/{catalogs-and-metadata, browsing-the-stacks, searching-inside-books, ai-research-assistants, curation}; interfaces/{exploratory-search, maps-of-knowledge, reading-interfaces, generative-interfaces}; environments/{reading-modes-and-devices, vr-and-spatial-computing, virtual-reading-room}; building/{legal-map, reference-architecture, costs-and-effort}.
- **Chapter written, review interrupted**: start-here/decision-guide.
- **Prototypes built** (in `prototypes/`): crux-table, gearbox, chapter-lenses, terra-incognita, evidence-ledger, bindery. Critique passes for gearbox and evidence-ledger were interrupted. Partial builds exist for page-flags, sieve, round-reading-room and circulation-desk; epoch-slider and front-table were not started.

## Remaining

1. **Research**: finish R14 (personal library and owned ebooks); verify R12, R13, R14.
2. **Chapters**: access/grey-literature (R12), access/your-own-library (R14), finding/lectures-and-media (R13); review start-here/decision-guide; write start-here/introduction and start-here/cruxes; building/design-space (from the ideation panel and Part III); building/prototype-gallery (MDX with screenshots); reference/{directory, glossary, open-questions, methodology}.
3. **Prototypes**: finish page-flags, sieve, round-reading-room, circulation-desk; build epoch-slider and front-table; run the design-critique and QA pass on all twelve (screenshots at desktop and phone widths, light and dark; mock generation path; verbatim-quote checks).
4. **Consistency pass across chapters**. Known item: reference-architecture says Open Library search-inside returns page numbers and snippets. Searching Inside Books found that `page_num` equals the scan's page count for restricted books, so it gives no hit location for them. Also reconcile the Sonnet 5.5 cache-read price: the live pricing page says \$0.10, the model reference \$0.20.
5. **Integration**: final numbered sidebar in `astro.config.mjs` (31 chapters plus reference); the chapter table on `src/content/docs/index.mdx`; a CI build step for `open-stacks` in `.github/workflows/ci.yml`; `pnpm --filter open-stacks build` and `python3 scripts/check-built-links.py`; list the app in the meta site's monorepo overview.
6. **Publish**: each prototype as a Claude artifact with the `sample` capability and its data files, plus a gallery artifact linking them.

The writing guide and builder guide used for chapters and prototypes are summarized in `CLAUDE.md`. Chapters follow the sibling wikis' conventions: status line, dated prices, bracketed confidence, Open questions and Related pages.

## Published previews (private Claude artifacts, 2026-10-15)

| Prototype | Artifact |
|---|---|
| Crux Table | https://claude.ai/artifact/NfB6CNT35snSUPoYRrN1Za |
| Chapter Lenses | https://claude.ai/artifact/K1PVr9531iHK8UzTPLgT2o |
| Gearbox | https://claude.ai/artifact/KrMw11cnbYaQY6SLNAezfN |
| Terra Incognita | https://claude.ai/artifact/C61F6xfzE2gcy8Nza43KfD |
| Evidence Ledger | https://claude.ai/artifact/7rwYi9NXr5xpBR3NKoyxdB |
| The Bindery | https://claude.ai/artifact/FYmB19bci2Xm2hu9jddBta |

Republish from the same file path to update each one in place.
