# Getting Started Restructure Brief

Status: EXECUTED 2026-06-09. All tasks complete; content-loss audit clean
(Core Path list byte-identical; introduction.md fully preserved/relocated;
one waived nav gap patched). Build clean, 0 broken links, #the-core-path resolves.

Goal: the Getting Started sidebar currently opens with four near-synonym titles
(Overview / Five-Minute Intro / Introduction / Core Concepts), three of its eight
pages are meta-navigation, and ~13 different "reading paths" are offered across the
section. Restructure to 7 items, every title self-explanatory, one path-chooser.

Target sidebar (labels in astro.config.mjs, Getting Started group):
Overview · Five-Minute Intro · Core Concepts · The Core Path · For Engineers ·
Common Mistakes · FAQ
(Keep label "Overview" — "Start Here" is already the pinned Core Path badge.)

Model policy: Opus for prose merges/rewrites (A, B), Sonnet for mechanical work
(C, D) and the content-loss audit (E). Main loop reviews at the end.

## Task A (Opus) — Merge Introduction into the section index
- Rewrite `src/content/docs/getting-started/index.md` as the single orientation page:
  1. "The Problem" and "Why AI Systems?" sections moved VERBATIM-or-tightened from
     `introduction.md` (preserve all citations: Gwern, Greenblatt et al.).
  2. Introduction's "The Approach, in One Paragraph" + its two scope/generality
     pointers, compressed.
  3. ONE compact "Choose your path" table (compress the current 4-path block;
     the Core Path row is the featured one).
  4. Key Takeaways note (from introduction.md) and a short See Also.
- Delete `src/content/docs/getting-started/introduction.md`.
- Do NOT touch astro.config.mjs (Task D owns it).
- Do not restate the DR formula; link to /getting-started/core-concepts/#the-formula.

## Task B (Opus) — Slim reading-order.md to "The Core Path"
File: `src/content/docs/getting-started/reading-order.md`
- Page title/h1 → "The Core Path". KEEP the `#the-core-path` anchor working
  (other pages link to it) — if the h2 "The Core Path" becomes redundant under the
  new h1, keep an explicit anchor.
- KEEP: the 12-stop Core Path; a compressed "Paths by Goal" (each goal ≤2 lines,
  6 goals may merge to 4–5 if overlapping); the time-budget table (3 rows max);
  See Also.
- CUT: Section Dependency Graph, Prerequisites by Section, Section Overviews,
  How Sections Connect (all of it — The Core Logic, Section Relationships,
  Why This Order), and Common Reading Mistakes.
- MOVE: the four "Common Reading Mistakes" anti-patterns into
  `src/content/docs/getting-started/common-mistakes.md` as one new compact
  section ("Reading Mistakes") at the end, reformatted to match that page's
  voice — not pasted wholesale.
- Target: reading-order.md lands at ~800–1000 words (from ~2,300).

## Task C (Sonnet) — Slim For Engineers
File: `src/content/docs/getting-started/for-engineers.md`
- Replace the two opening path sections ("Skip the Theory Path",
  "Understand-Then-Build Path") with one short paragraph: in a hurry →
  Quick Reference + Quick Start + Minimal Viable Framework (keep those 3 links);
  want depth → The Core Path (/getting-started/reading-order/#the-core-path).
- Keep everything else unchanged (pattern tables, implementation checklist,
  integration points, debugging, "What Engineers Often Skip").

## Task D (Sonnet, after A) — Config, redirects, link sweep, frontmatter
- astro.config.mjs Getting Started group: remove the 'Introduction' item;
  relabel 'Reading Order & The Core Path' → 'The Core Path'.
- Add redirect: '/getting-started/introduction/' → '/getting-started/'
  (match the existing redirects block's format).
- Update the ~5 inbound links to /getting-started/introduction/ (4 content files;
  grep for them) to point at /getting-started/ — adjust surrounding link text so
  it still reads correctly (e.g. "full Introduction" → "Getting Started overview").
- Delete now-ignored `sidebar.order` frontmatter fields from all
  getting-started/*.md files (sidebar is hardcoded in config; the fields are
  dead weight). Keep `sidebar.label`/badge fields if any exist.

## Task E (review) — after A–D
- Sonnet content-loss audit: diff deleted/cut material (introduction.md, the cut
  reading-order sections) against the merged destinations; list anything unique
  that was dropped (claims, citations, links). Real losses get restored.
- `pnpm build` clean; internal-link sweep 0 broken (script: /tmp/link_sweep.py);
  confirm #the-core-path anchor still resolves from other pages.
- Main loop: read the final index.md and reading-order.md end-to-end for flow;
  screenshot the sidebar.
- Commit: "Getting Started restructure: one front door, one meta page".
