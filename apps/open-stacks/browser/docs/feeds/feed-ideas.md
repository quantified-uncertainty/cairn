# Skimmable feeds: ideas, designs and a ranking

This document collects ideas for feeds built from the parts of papers, posts, books and wikis that can be taken in at a glance, laid out for a large desktop screen. The reader browses a great deal of AI safety, LLM, forecasting and technical material. They already like the Figures view (`R`; `ui/js/features/figures.js` and `server/routes/65-figures.mjs`) and the wall's hover scrubbing. The document proposes 29 feeds, three layouts to show them in, one hover behaviour shared by all of them, and an order to build them in.

Three requests from the reader shape it:

- **Lead with a picture.** A view that shows an item as a tile should show the item's top figure, or its top few, not a typeset title page: "these pages are boring". See section 1.
- **Multi-column feeds and boards.** "Like a twitter feed, but multi-column", and "maybe even a pinterest board style". See section 2.
- **Hover to peek.** "Hovering the small ones open it large on right side (over other content)", in the new feeds and in Figures. See section 3.

Paths are relative to `apps/open-stacks/browser/`. Effort is S (under about 150 lines), M (about 150-500) or L (more, or model calls at scale). Densities assume a 4K monitor at a scaled resolution of about 3200 × 1800 CSS px (Firefox on macOS); at 1x (3840 px wide), add about 20%.

## What the probes found

Before designing anything, I checked what each source provides for free (October 2026). The samples were:

- six arXiv HTML papers from the corpus, fetched at under one request a second;
- two samples of 60 top LessWrong posts, through GraphQL;
- the hOCR of one Internet Archive scan;
- one QURI wiki page.

| Source | What is there | Measured |
|---|---|---|
| Corpus | 1,948 items: 777 PDFs (677 of them arXiv papers), 515 HTML posts (mostly LessWrong, Alignment Forum and forecasting), 217 web pages (155 of them QURI wiki pages) and 437 IA scans | 770 items have an abstract (`ab`), 1,000 have `tags` and 1,793 have a year |
| arXiv HTML (LaTeXML) | Typed blocks: `ltx_theorem_definition`, `_theorem`, `_lemma`, `_proposition` and `_example`; `ltx_float_algorithm` with `ltx_listing` lines; display equations (`ltx_equation`) with TeX in `alttext` plus MathML; `ltx_tabular` tables; `ltx_abstract`; section titles | "Power-seeking can be probable and predictive" (2304.06528): 9 definitions, 2 theorems, 3 propositions, 21 equations. "Human Control" (2305.19861): 26 theorem-like blocks, 4 algorithms, 47 equations. "Attention Is All You Need": no theorems, 10 equations |
| arXiv figure references | Every "Figure 3" in the text is `<a class="ltx_ref" href="#S1.F3" title="Figure 3 ‣ 1.1 Motivations ‣ 1 Introduction ‣ …">`, so the citing sentence and its section path come for free | 4-26 figure references per paper. Figure 1 was the most-referenced figure in 3 of the 6 papers; in the other 3, a later figure was |
| arXiv result sentences | "We find that …", "We show that …" | 13 such sentences in Constitutional AI (2212.08073), nearly all of them crisp findings |
| LessWrong GraphQL | `tableOfContents`, `extendedScore.reacts` (inline reacts, with the text they quote) and `htmlBody` | 60 of 60 posts have a table of contents. 39 of 60 have inline reacts on quoted spans: 294 distinct spans; the commonest react types are important, agree, typo, laugh, disagree and hitsTheMark. 8 of 60 have a TL;DR, 0 of 60 an "Epistemic status" line, 27 of 60 images, and 12 of 60 explicit credences ("~70%", "greater than 50% chance") |
| IA scans (hOCR) | `ocr_photo` regions with page bounding boxes, alongside the word boxes that `server/routes/50-ocr.mjs` already reads | 13 photo regions in the first 27 pages of *Telegraph engineering*, one of them the cover. hOCR runs to about 22 KB a page |
| QURI wikis | Starlight sites whose headings carry the argument | "Epistemic Culture": The claim · Cases · What the cases suggest · The candidness problem · Rollout |
| Cached summaries (`server/routes/30-summarize.mjs`) | Per item: `claim`, `method`, `evidence.strength`, `limitations`, `counterpoint`, `concepts[{term, gloss}]` and `key_points[{point, page, quote, quote_ok}]`, with each quote checked against the text | Ready-made input for claim, limitation, counterpoint and glossary cards, but only for items already summarized |

Two conclusions follow:

- **Most of the best feeds need no model at all.** Authors and LaTeXML already label the definitions, theorems, algorithms, figure citations and contribution lists, and LessWrong readers have already marked the lines they found important.
- **The figure route's parser is the core of most extractors.** `parse`, `walk`, `text` and `clean` in `65-figures.mjs` should move into a shared `server/latexml.mjs`.

## 1. The first fix: lead with the best picture

The wall's paper covers are typeset title pages (`coverPaper` in `ui/js/wall.js`), and the new feeds' text cards could easily become walls of type as well. Every tile and card should lead with the item's best visual, so the eye can sort a screen of 40 items in a few seconds.

### Which picture

Score each figure in the `/figures` list:

| Signal | Score | Why |
|---|---|---|
| In-text references to it | +2 × log2(1 + refs) | The figure the authors keep pointing at is usually the result |
| It is Figure 1 | +2.5 | The teaser, drawn to sum up the paper |
| Referenced from the abstract or introduction | +1.5 | The main result |
| Caption has result words (`outperform`, `improv`, `scal`, `vs`, `%`, `×`, `accuracy`, `rate`) | +1 | A plot of a result rather than a set-up diagram |
| Appendix figure (id starts with `A`) | −2 | Secondary material |
| A table | −2 | Tables read badly at tile size |
| A grid of more than six parts (sample outputs) | −1 | Too busy at tile size |
| Under 300 px wide, or a logo | −3 | Not worth the space |

### One picture or a few

- **One:** show only the top figure when its score beats the second by more than 1.5, or when the tile is under about 260 px wide.
- **A few:** otherwise, on tiles 380 px wide or more, show a mosaic. The top figure takes two thirds of the width and the next two are stacked beside it.
- **Hover:** moving the pointer across the tile scrubs left to right through the top five figures, the way the wall already scrubs pages. The peek panel (section 3) shows the figure under the pointer at full size.

### Items without arXiv figures

- **Posts:** the wall's lead image (`leadImage`, already kept in `wallMeta`); else the first SVG or diagram in the body; else a typographic cover with the TL;DR or the claim (F15, F9) set large.
- **Non-arXiv PDFs:** the page with the largest graphic, cropped with the crop code in `render.js`. pdf.js `getOperatorList()` finds it from image paints and dense path drawing.
- **Scans:** keep the cover scan. The first plate (F4) becomes a second frame for hover scrubbing.
- **Wiki pages:** the first `<svg>` or `<img>` in the article body.

### Build (S-M)

- `65-figures.mjs`: count the `ltx_ref` links to each figure. Keep the first citing sentence, and the section path from the link's `title`. Return them as `refs`, `cited` and `sec`, and bump `VER` to 8.
- `figures.js`: a `leadFigures(it, n)` helper.
- `wall.js`: a `coverPaper` variant that draws the top figure or figures with `figArt`. The title stays as a two-line label under the art. Until the figure list loads, the tile shows today's cover.

## 2. Three layouts

All feeds share one card format and use one of three layouts. Each layout is a view registered with `registerView`, with the feed type picked in its header.

### Deck: a multi-column stream, after TweetDeck

Columns of equal width, 460-520 px each (60-70 characters a line at 15 px serif), so six or seven fit across. The Deck has two modes:

- **Columns by type** (the default). Each column is one feed, for example Figures in context, Findings, Numbers, Highlights, Limitations and Definitions. All columns cover the same lane in the same order, and each scrolls on its own. Hovering a card lights up the same item's cards in the other columns, as the `kin` class in `figures.js` already does within the river.
- **Rows by item**, after Elicit's table of papers. The columns scroll together and each row is one item, so a row shows a paper's lead figure, finding, best number, limitation and highlight side by side. That is about 7 items, or 35 cards, a screen.

A single feed can also flow across all the columns in reading order, Twitter-style, with each card going to the shortest column as tiles do in the figure river.

### Board: masonry, after Pinterest and Are.na

Visual cards of mixed sizes, each placed in the shortest column (`place()` in `figures.js`, which should move to a shared `ui/js/masonry.js`). Columns are at least 290 px wide, so 10-11 fit across.

- **For:** figures, plates, tables, equations, stat tiles and section maps, mixed or one kind at a time.
- **Saving:** saved cards collect into named boards. A card can sit on several boards, as an Are.na block sits in several channels.

### Stack: vertical snap, after TikTok, three across

Large cards (about 1,000 × 1,600 px), three side by side, scrolling one row at a time with CSS scroll snap.

- **For:** abstracts (F13) and paper threads (F22).
- **Pace:** it suits lean-back reading and the conveyor in `docs/navigation-ergonomics.md` (item 10).
- **Signal:** the time spent on each card is a free relevance signal, as it is on TikTok.

### Card format (shared)

- **Lead:** the content itself, set to be seen at a glance: a figure, a number in large type, a quote, MathML or react chips.
- **Avatar:** a 40 px crop of the item's lead figure (section 1) with a ring in the lane colour, so the same paper is recognizable across columns, like a Twitter avatar. Posts use their lead image or a monogram.
- **Source line:** the title (italic serif, one line), the year, and where the snippet is, for example `§3.2 · p. 7`.
- **Provenance:** `✓` when a quote was found verbatim in the text. `AI` when a model wrote the text (cards from summaries), matching how the summary section already labels its output.

### Actions (the same on every card)

Principle 1 in `docs/navigation-ergonomics.md` asks for the same verbs on every input and in every view:

| Verb | Input | What it does |
|---|---|---|
| Peek | hover (section 3) | Shows the card large on the right, with its context |
| Dive | `Enter` or click | Opens the item at the exact spot and briefly highlights the passage (below) |
| Keep | `s` | Saves the snippet, and the item |
| Note | `n` | Adds the quote and its page to the item's note, with `appendQuote(it, text, page)` from `notes.js` |
| More | `m` | Filters to cards like this one (same concept, then same item, then same tags) and calls `learn` |
| Less | `x` | Hides the card and lowers the weight of its type and its item |
| Thread | `t` | Shows all of this item's cards as a thread (F22) |
| Original | `o` | Opens the source at the exact place. arXiv HTML has anchors (`arxiv.org/html/<id>#S3.F2`). Posts and wikis get text fragments (`#:~:text=…`), which Firefox supports from version 131 |

**Dive to the exact spot.**

1. Find the page. `findPage(it, f)` in `figures.js` already finds a caption's page in a PDF from normalized text needles; generalize it to take any snippet's verbatim text.
2. Go there with `goPage(k)`.
3. Highlight the sentence with `highlight('snip', words)` from `text.js`.

Flow documents use the same needles on their stable pages. Scans use the page and the OCR box.

## 3. Peek: hovering opens the card large on the right

Peek is one shared module, `ui/js/peek.js`, used by Figures, the new feeds and, optionally, the wall. It replaces the caption popover in Figures (`#fg-pop`), which today shows the caption next to the tile.

### Behaviour

- **Opening.** The panel opens after 200 ms of hovering over a card. Only real pointer movement counts: browsers also fire mouse events when content scrolls under a still pointer, which `figures.js` already ignores. Once the panel is open, moving to another card swaps its content at once, as in a menu bar.
- **Position.** A fixed panel covers the right 45% or so of the viewport (1,300-1,450 px at 3200 px wide), full height below the top bar, with a shadow on its left edge. It lies over the cards and never moves them, so nothing shifts. If the hovered card is itself in the right 45%, the panel opens on the left instead, so it never covers the card under the pointer.
- **Closing.** The panel closes when the pointer has been outside both the card and the panel for 250 ms. A pointer moving from the card towards the panel keeps it open (the "safe triangle" of hover menus), so the reader can move into the panel to scroll a long caption or click a thumbnail. `Esc` closes it. Scrolling leaves it open until the pointer moves.
- **Pinning.** `z` pins the panel open. While pinned, it follows the keyboard selection, so `j`/`k` or the arrow keys page through the cards with the panel showing each one. `z` again unpins it. The current full-screen lightbox moves to `Shift+Z`.
- **No blank frame.** After 100 ms of hover, start loading the large image and `decode()` it. The panel opens with the card's own small image scaled up, then swaps in the sharp one.
- **Reduced motion.** With reduced motion on, the panel has no slide animation; it only appears and disappears.

### Contents by card type

| Card | The panel shows |
|---|---|
| Figure | The figure at panel width, the full caption, the citing sentences with their section paths, the paper's other figures as a strip you can scrub by hovering, the title, authors and year, and the actions |
| Text card | The passage with a paragraph of context before and after, the paper's lead figure, and the item's other cards of the same kind |
| Plate | The plate large, with the text before and after it |
| Section map | The outline, with the first sentence under each heading |

### Signals

`features/telemetry.js` counts peeks, how long each lasts, and how many lead to a Dive. These are the strongest implicit judgments the feeds get, and they set the type and item weights used for ranking (section 5).

### Build (M, about 250 lines)

- **Interface:** `peek.attach(root, {cardOf(el), render(card, panel), side?})`.
- **Figures adopts it first:** `showPop` and `#fg-pop` go, `figArt` draws the large art, and `paintLb` stays for `Shift+Z`.

## 4. The feeds

The 29 feeds fall into four groups: pictures, sentences, structure, and feeds that work across items. Each entry covers:

- the card;
- its density on the big screen;
- anything special about its interactions;
- how it mixes and ranks items;
- what extraction it needs;
- a verdict on how good or noisy it is likely to be.

### Pictures

**F1. Lead figure board.** One card per item: its best figure, or its best few (section 1).
- **Card:** the figure at column width (a three-figure mosaic on wide columns), a two-line title, the lane dot, the year, and "+7 figures".
- **Density:** 10-11 columns, about 40-50 items a screen.
- **Interaction:** hovering scrubs through the top five figures. Peek shows the figure under the pointer, and Dive opens the item at that figure's page.
- **Mixing:** lane order (`state.order`), one card per item.
- **Extraction:** `/figures` with `refs`, `cited` and `sec`, plus the fallbacks for posts, PDFs and scans in section 1.
- **Verdict:** the most insight per second of any feed here, and the direct fix for boring covers. The risks are a cartoon teaser chosen over the result plot (the reference count corrects most of these) and grids of sample outputs.

**F2. Figure in context: the figure, its caption and the sentence that cites it.** An upgrade to every Figures card.
- **Card:** the figure, then the sentence that cites it, with the figure reference picked out. For example: "We find that harmlessness and HH scores improve monotonically with respect to number of revisions … (Figure 5)". Then the caption, cut to one line. The citing sentence says what to look for, as Our World in Data's chart titles state the takeaway.
- **Density:** as in the Figures river, about 50 a screen; the citing sentence adds about 40 px to each card.
- **Interaction:** Peek shows every citing sentence with its section path. Dive lands on the citing sentence's page, not just the figure's.
- **Mixing:** as today: lane order, six figures per paper, then "+N more".
- **Extraction:** the LaTeXML `ltx_ref` links to the figure's id, and the sentence around each (the `ltx_p` text split at sentence ends). Prefer the body to the appendix, and sentences with result words. When the only citation is "see Figure 3", fall back to the caption's first sentence.
- **Verdict:** high value, low noise and cheap, since the parser already exists.

**F3. Results tables with a headline.**
- **Card:** the table scaled to fit, as today, keeping its bold cells (LaTeXML marks the best results `ltx_font_bold`). Above it, a headline built from the bold cells' row and column headers, for example "Ours 71.2 vs best baseline 64.5 · MMLU".
- **Density:** about 20 a screen.
- **Mixing:** at most one table per paper per screen.
- **Extraction:** the existing table HTML, filtered to tables that are at least half numbers, have bold cells and are not in an appendix.
- **Verdict:** medium. Results tables are dense with insight but slow to read. Hyperparameter and notation tables are noise, and the filter removes most of them.

**F4. Plates from old books.** Illustrations from the 437 Internet Archive scans.
- **Card:** the cropped plate on a paper tone, with the book's title, year and subject. Its caption comes from the OCR line just below or above it, for example "FIG. 214.—Duplex telegraph". Plates vary widely in shape, which makes this the most Pinterest-like board.
- **Density:** 12 columns, about 60-70 a screen.
- **Interaction:** Peek shows the plate large with the paragraph before and after it. The Internet Archive Book Images collection on Flickr did the same, attaching the surrounding text to each of its 2.6 million extracted images. Dive opens the scan at that page, zoomed.
- **Mixing:** by subject (telegraph, mechanics, navigation, slide rule, chess, cryptography …), interleaving books, with at most three plates per book per screen.
- **Extraction:** `ocr_photo` boxes from the hOCR. Drop boxes under 3% or over 85% of the page, the cover leaf, and boxes that contain many OCR words (text mistaken for a picture). Crop in the browser from the page image the proxy already caches. hOCR is about 22 KB a page, or 8 MB for a 350-page book, so fetch it only for books coming into view and cache just the list of boxes.
- **Verdict:** very cool, though more delight than insight; nothing else in the oddities lane skims as well. The noise is ornaments, decorative initials and library stamps, which the size filter mostly removes.

**F5. Equations.**
- **Card:** the display equation in MathML (LaTeXML supplies it), its number, and the sentence that introduces or explains it ("where *r* is the reward model's score …").
- **Density:** about 30 a screen.
- **Mixing:** key equations only: those referenced at least twice (`href="#S2.E3"`, counted as for figures), or introduced with "objective", "loss", "we define" or "bound".
- **Verdict:** noisy in general, since most equations are bookkeeping. Filtered, it is worth having for the theory-heavy DeepMind safety and information theory papers.

**F6. Theorems, propositions and definitions.**
- **Card:** a chip for the kind (Definition, Theorem, Lemma or Proposition) and its name if it has one ("Theorem 1 (Retargetability)"). Below that, the statement in MathML, a thin bar showing the length of its proof (`ltx_proof`), and its reference count.
- **Density:** about 20 a screen.
- **Extraction:** the `ltx_theorem_*` blocks, which the authors labelled. No model calls.
- **Verdict:** high value for theory papers ("Human Control" has 26 such blocks) and absent elsewhere. Low noise. Definitions also feed the glossary (F12).

**F7. Algorithm boxes.**
- **Card:** the algorithm in monospace with line numbers, under its title ("Algorithm 1: …").
- **Extraction:** `ltx_float_algorithm` and its `ltx_listing` lines.
- **Verdict:** niche and rare: "Human Control" has 4 and most papers have none. But a ten-line algorithm is often the fastest way to see what a method does.

**F8. Best pages, the fallback board.** For PDFs without HTML and scans without plates.
- **Card:** the item's best page, cropped to its content. The best page is the first of these that exists:
  - the `enrich.json` `best` pages;
  - the summary's `best_page` (oddities) or `steal` pages (TTRPG);
  - the page with the largest graphic (section 1).
- **Verdict:** medium. It makes sure no board falls back to title pages.

### Sentences

**F9. Findings.** One-sentence results.
- **Card:** the sentence in 15 px serif, with the cue ("We find that") in grey and the finding in full ink. Then the avatar and the source line, and an evidence chip (weak, moderate or strong) when the item has a summary.
- **Density:** 6-7 columns, about 40-60 a screen.
- **Mixing:** interleave items, with at most two cards per item per screen. Within an item, the abstract and conclusion come before the results, and specific findings (with a number or a named comparison) before general ones.
- **Extraction:** sentences with "we find", "we show", "we demonstrate" or "our results (show|suggest|indicate)" in the abstract, introduction, results and conclusion. Also the summary's `claim` and its `key_points` with verified quotes.
- **Verdict:** high value, medium noise (hedged restatements, "we find that our method works"). Ranking by specificity and removing near-duplicates fixes most of it.

**F10. Numbers.** Striking quantitative results, as stat tiles.
- **Card:** the number in large type ("100×", "−42%", "3% → 71%"), a short line naming the metric, the sentence with the number marked, and the avatar.
- **Density:** 8 columns, about 60 tiles a screen.
- **Extraction:** sentences with a number and a comparison (`×`, `%`, "fold", "from X to Y", "orders of magnitude", "times faster"). Leave out years, citations, section numbers and hyperparameters such as learning rates and batch sizes. A cheap model pass can write the "metric · baseline" line and drop the meaningless numbers.
- **Mixing:** by the size of the change, and by position (abstract first).
- **Verdict:** the fastest text feed to skim, and the closest to a good Twitter hook. Medium-high noise without the model pass.

**F11. Credences and forecasts.**
- **Card:** a 0-100% bar showing the stated probability or range, the verbatim sentence, the author and the date. A "past due" flag marks forecasts whose date ("by 2024") has passed, which turns the feed into a calibration game.
- **Extraction:** a percentage or odds in the same sentence as a credence word (chance, probability, credence, "I'd bet", "my median", expect, likely). 12 of 60 top LessWrong posts have one.
- **Mixing:** by topic, or by resolution date.
- **Verdict:** cool for a forecasting reader, though rare outside posts. Medium noise, from statistics mistaken for credences; requiring a credence word handles most of it.

**F12. Glossary.**
- **Card:** the term in large type, a gloss of under 15 words, and the source. Several definitions of one term stack into one card ("Mesa-optimizer · 4 definitions"), and Peek shows them side by side, making a small comparison feed of its own.
- **Extraction:** `ltx_theorem_definition` blocks; the summary's `concepts`; the patterns "we call X", "X refers to" and "<strong>X</strong> is"; QURI concept pages, whose title is the term and whose first paragraph is the gloss.
- **Verdict:** high value for learning a field's vocabulary. Low noise when the sources are labelled.

**F13. Abstracts as cards (Stack).**
- **Card:** a tall card with the lead figure on its top half. Below it come the title, then the abstract with the result sentence in full ink and the rest a shade lighter, in the spirit of Semantic Reader's skimming highlights, which colour the goal, method and result sentences. Then a verdict chip and the actions.
- **Density:** three a screen, snapping a row at a time. The conveyor can advance at reading pace.
- **Extraction:** `ab` (770 items), the post summary's gist, and `what_it_is` for scans.
- **Verdict:** medium insight per second, but the best lean-back mode. The lead figure keeps it from being a wall of text.

**F14. Contributions lists.**
- **Card:** the title, then the authors' own 3-5 bullets ("Our contributions are: …"), each cut to two lines.
- **Extraction:** the first `ltx_itemize` or `ltx_enumerate` in the introduction, within about 600 characters after a cue: "contribution", "we make the following", "in summary" or "our main". Constitutional AI's introduction lists its findings as bullets in this way.
- **Verdict:** high value for papers, since the authors have already compressed the paper; low noise. Paper Digest's one highlight sentence per conference paper is the same idea, in a single line.

**F15. TL;DRs and author summaries.**
- **Card:** "TL;DR" in small caps and the text, at most three lines. An epistemic status line follows in grey when there is one.
- **Extraction:** the first of these that exists:
  - an explicit TL;DR (8 of 60 top posts);
  - a first section titled Summary or Overview;
  - the post's highlight excerpt;
  - the AI gist, labelled as such.
- **Verdict:** high value when the author wrote it, but few posts have one. Mix it with F13 as one feed: the author's own summary.

**F16. Community highlights (LessWrong inline reacts).** The lines LessWrong readers marked.
- **Card:** the quoted span as a pull quote, with react chips and counts (Important 3 · Hits the mark 2 · Disagree 1), weighted by the reactors' karma, plus the post's title and karma. It shows counts, not names.
- **Sub-feeds:** contested lines (both agree and disagree reacts), lines that changed someone's mind, and cruxes.
- **Extraction:** `extendedScore.reacts`, from the same GraphQL call that fetches the post. 39 of 60 top posts have them, about 7.5 spans each. Drop the `typo`, `seen`, `thanks`, `offtopic` and `laugh` reacts.
- **Verdict:** the best signal-to-noise of any text feed, because people chose the lines, as in Kindle's Popular Highlights. Older posts, written before reacts existed, have few.

**F17. Openers.**
- **Card:** the first two or three sentences, with a small-caps lead-in like the wall's post covers.
- **Extraction:** the body's first paragraph. For scans, the first paragraph of chapter 1, skipping the front matter with `/ocr/labels`.
- **Verdict:** good for essays, whose openings are written to hook the reader. Poor for papers ("Large language models have shown remarkable …"), so papers are left out.

**F18. Conclusions and closing lines.**
- **Card:** the first sentences of the conclusion or discussion, skipping restatements ("In this paper, we …"). For posts, the last paragraph.
- **Verdict:** medium-high value. Conclusions often hold the honest takeaway and its caveats.

**F19. Limitations and open problems.**
- **Card:** an amber edge, the limitation, its section ("Limitations", "Future work") and the avatar.
- **Open problems view:** only sentences with "open question", "remains unclear", "we leave" or "future work should", making a board of research directions.
- **Extraction:** sections with those headings, cue sentences, and the summary's `limitations` (labelled AI).
- **Verdict:** very useful to an AI safety reader looking for what is unsolved. Medium noise ("future work could try other datasets"), reduced by dropping generic sentences.

**F20. Pull quotes and surprising sentences.**
- **Card:** a large serif quote of one or two sentences, with the author.
- **Extraction:** the cheap way is sentences with "surprisingly", "counterintuitively" or "contrary to". The better way is a model that ranks candidate sentences for surprise, quotability and specificity, with each quote verified verbatim (`skel` and the quote check in `30-summarize.mjs`).
- **Verdict:** delightful at its best, noisy without the model.

**F21. Claim and strongest critique.**
- **Card:** split in two. The claim is on top and the counterpoint below (the summary's `counterpoint`, labelled AI), with any human disagreement, such as LessWrong disagree reacts on the claim's line.
- **Verdict:** high value for posts. It needs a summary for every item: about 3 cents each with Opus at low effort, or about 40 times less with Haiku.

### Structure

**F22. Paper threads.** Each item as a short thread, the way good authors post their papers.
- **Cards:** a group of five, in order:
  1. the hook (a finding or the TL;DR);
  2. the lead figure with its citing sentence;
  3. the best number;
  4. a limitation or critique;
  5. "open".
- **Collapsed:** the hook and the figure, marked "1/5". It expands in place or in the peek panel.
- **Density:** in the Deck, about 12 collapsed threads a screen; in the Stack, 3 expanded.
- **Extraction:** the best card of each kind from the other extractors. No new parsing.
- **Verdict:** very high insight per item, because it is a curated digest of the paper, though only as good as the extractors underneath. alphaXiv's generated blog posts and Twitter paper threads both work this way.

**F23. Section maps.**
- **Card:** the title, then the outline as a spine of labelled bars, each as long as its section is in words. Hovering a section peeks its first paragraph; clicking jumps there.
- **Density:** 6-8 columns, about 18 a screen.
- **Extraction:** whichever outline the item has:
  - LessWrong posts: `tableOfContents` (60 of 60);
  - arXiv papers: the LaTeXML section titles;
  - other PDFs: their outlines (`pdfOutline` in `docs.js`);
  - wiki pages: their headings;
  - scans: the contents page, read through OCR and mapped to leaves with `/ocr/labels`.
- **Verdict:** high value for books, wikis and long posts, where the structure is the summary; cheap.

**F24. Flashcards and daily review.**
- **Card:** a question, with the answer shown on peek. Cloze cards hide the number in a number card or the term in a definition. Image-occlusion cards hide a figure's legend.
- **Extraction:** from definitions, theorems, numbers and key points, with a model phrasing the questions.
- **Review:** in the style of Readwise, 10-20 saved snippets come back each day at spaced intervals, with keep, less often and never.
- **Verdict:** for remembering rather than discovering. Build it once saving snippets is common.

### Across items

**F25. Concept boards.** One board per concept (induction heads, sandbagging, calibration, power-seeking …), holding every definition, finding, figure and number that mentions it.
- **Interaction:** `m` on any card offers boards for its concepts. Boards can be saved and named.
- **Extraction:** tags (1,000 items), the summary's `concepts` and LaTeXML definitions. Terms are normalized, then embeddings merge synonyms.
- **Verdict:** high value. Feasibility is medium, mostly because the term matching has to be right.

**F26. Claims versus counter-claims.**
- **Layout:** for a question or claim, supporting cards on the left, contrasting cards on the right and a meter on top, as Consensus and scite do.
- **Extraction:** a model pairs findings (F9) across items by topic and stance.
- **Verdict:** very good when it works, but expensive and noisy. Build it after F9 and F25.

**F27. Timeline of an idea.**
- **Layout:** a horizontal time axis with each card at its item's year and a swimlane per lane, scrolling sideways.
- **Extraction:** concept boards (F25) plus each item's year (`y`) or date (`d`).
- **Verdict:** good for questions like "how did the power-seeking argument develop?". It depends on F25.

**F28. What others say about it (citation contexts).** For each item, the sentences in other corpus papers that cite it.
- **Card:** the citing sentence, both papers' avatars, and optionally a tag (supports, contrasts or uses), following scite.
- **Extraction:** match LaTeXML bibliography entries (arXiv ids and titles) to corpus items. The citing sentences are those with `ltx_cite` links to the matched entries.
- **Verdict:** high value: it shows how a paper was received and used, within the reader's own corpus. Feasibility is medium, because of title matching.

**F29. Mixed board ("For you").** Every visual and text card type on one home board, Pinterest-style.
- **Rules:** no more than two cards per item per screen, and about three visual cards for every two text cards. Type weights are learned from peeks, Dives and `x`.
- **Verdict:** the landing feed, once five or six extractors exist.

## 5. Ranking

"Hits a minute" is 60 × hit rate ÷ seconds a card takes, where a hit is a card that teaches something or gets opened. Both inputs are guesses, to be replaced with telemetry: peeks and Dives per card shown, by card type. The rank weighs hits a minute against effort, and against how much of the corpus a feed covers.

| Rank | Feed | Layout | Source | Covers | Effort | s/card | Hit rate | Hits/min | Noise |
|---|---|---|---|---|---|---|---|---|---|
| 1 | F1 Lead figure board (and wall covers) | Board | `/figures` + refs; fallbacks | everything | S-M | 2 | 15% | 4.5 | low |
| 2 | F2 Figure in context | Board | LaTeXML references | 677 arXiv | S | 4 | 20% | 3.0 | low |
| 3 | F16 Community highlights | Deck | LessWrong reacts | ~500 posts (fewer before 2023) | S | 4 | 20% | 3.0 | low |
| 4 | F9 Findings | Deck | cue sentences + summaries | papers | S | 4 | 15% | 2.3 | medium |
| 5 | F10 Numbers | Deck, Board | cue sentences (+ model) | papers, posts | M | 3 | 15% | 3.0 | medium-high |
| 6 | F22 Paper threads | Deck, Stack | the other extractors | everything | M | 12 | 45% | 2.3 | low-medium |
| 7 | F14 Contributions | Deck | LaTeXML lists | most arXiv | S | 8 | 25% | 1.9 | low |
| 8 | F23 Section maps | Board | outlines, TOCs | everything | S | 6 | 15% | 1.5 | low |
| 9 | F4 Plates | Board | hOCR | 437 scans | M | 1.5 | 8% | 3.2 | medium |
| 10 | F6 Theorems and F12 Glossary | Board, Deck | LaTeXML, summaries, QURI | theory papers, wikis | S | 4-8 | 10-12% | 0.8-1.8 | low |
| 11 | F11 Credences | Deck | cue sentences | posts, forecasting | S | 4 | 15% | 2.3 | medium |
| 12 | F15 TL;DRs | Deck | post HTML | ~13% of top posts | S | 6 | 25% | 2.5 | low |
| 13 | F19 Limitations and open problems | Deck | headings, cues, summaries | papers | S | 5 | 12% | 1.4 | medium |
| 14 | F28 Citation contexts | Deck | LaTeXML bibliographies | arXiv citing arXiv | M | 5 | 20% | 2.4 | low-medium |
| 15 | F13 Abstract stack | Stack | `ab`, summaries | 770+ | S | 15 | 30% | 1.2 | low |
| 16 | F18 Conclusions | Deck | sections | papers, posts | S | 8 | 15% | 1.1 | medium |
| 17 | F3 Tables with headlines | Board | LaTeXML tables | arXiv | M | 6 | 10% | 1.0 | medium-high |
| 18 | F8 Best pages | Board | pdf.js, `enrich.json`, summaries | PDFs, scans | M | 2 | 6% | 1.8 | medium |
| 19 | F21 Claim and critique | Deck | summaries | summarized items | S + cost | 10 | 25% | 1.5 | low |
| 20 | F29 Mixed board | Board | all | everything | M | 3 | 15% | 3.0 | medium |
| 21 | F25 Concept boards | Board | tags, concepts | everything | M-L | 20 a row | 40% | 1.2 | medium |
| 22 | F20 Pull quotes | Deck | model | everything | M | 4 | 12% | 1.8 | medium-high |
| 23 | F17 Openers | Deck | first paragraphs | posts, books | S | 6 | 10% | 1.0 | medium |
| 24 | F24 Flashcards and review | Stack | saved snippets + model | saved | M | 8 | 20% | 1.5 | low |
| 25 | F5 Equations | Board | LaTeXML | arXiv | S | 4 | 4% | 0.6 | high |
| 26 | F27 Timeline | special | F25 | concepts | M | 30 | 40% | 0.8 | medium |
| 27 | F26 Claims versus counter-claims | special | model pairing | papers | L | 20 | 40% | 1.2 | high |
| 28 | F7 Algorithm boxes | Board | LaTeXML | few papers | S | 10 | 5% | 0.3 | low (rare) |

The mixed board (F29) scores well but ranks 20th because it needs the extractors above it first.

## 6. Extraction plan

### Tiers

| Tier | What | Cost | Feeds |
|---|---|---|---|
| T0 structure | LaTeXML classes and references, hOCR photo boxes, LessWrong GraphQL fields, wiki headings | free | F1-F7, F12, F14, F16, F23, F28 |
| T1 cues | Patterns over sentences, with the section each is in | free | F9-F11, F15, F17-F20 |
| T2 summaries | Fields of the cached summaries, with quotes already verified | already paid per item | F9, F12, F19, F21 |
| T3 model | Pull quotes, number lines, question wording, stance pairing; quotes checked verbatim and unverified ones dropped | about $1-2 a pass over the whole corpus with Haiku | F10, F20, F24, F26 |

The T3 cost is extrapolated from the README: a summary costs about 3 cents with Opus at low effort and about 40 times less with Haiku. That puts a full pass within the default `STACKS_DAILY_BUDGET` of $3, but it should run as a batch on request, not in the background.

### Server

- **`server/latexml.mjs`:** the parser moved out of `65-figures.mjs`, shared by figures and snippets.
- **`server/routes/66-snips.mjs`:** `GET /snips?id=&kinds=&bg=1` returns `{v, id, snips: [...]}`. Results are cached under `CACHE/snips/`, with a `VER` that is bumped whenever the parser changes, as for figures. The extractors, one per source:

  | Extractor | Reads |
  |---|---|
  | `arxiv` | the LaTeXML HTML |
  | `lw` | the post's GraphQL: `htmlBody`, `extendedScore` and `tableOfContents` |
  | `web` | Starlight, Distill and Transformer Circuits HTML |
  | `scan` | hOCR photo boxes and the contents page |
  | `summary` | the cached summaries |

- **Warming:** `warm.mjs` precomputes snippets for a lane.
  - arXiv HTML is fetched at no more than one request a second. 677 papers take about 12 minutes, and Figures has usually cached most of them already.
  - LessWrong reacts and contents come in the same call as the post.
  - hOCR is fetched only when needed.

### A snippet

```js
{ id, item, kind,               // 'finding' | 'number' | 'figure' | 'plate' | 'definition' | …
  text, html, img,              // whichever the card needs
  at: { anchor, page, bbox },   // where it is: an HTML id, a 0-based page, an OCR box
  sec, cue,                     // section path; why it was picked ("we find that", "ltx_theorem_definition")
  score,                        // salience within the item
  src,                          // 'latexml' | 'cue' | 'summary' | 'reacts' | 'hocr' | 'model'
  ok }                          // the quote was found verbatim in the text
```

### Client

- **Card types:** `registerCard(kind, {render(snip, width), peek(snip, panel), score?})` in `util.js`, so each feed is one feature file (`ui/js/features/feed-<kind>.js`). This follows ARCHITECTURE.md's advice to prefer adding a feature over editing core files.
- **Layouts:** `deck.js`, `board.js` and `stack.js` are the three views.

### Noise controls (shared)

- Keep only verified quotes.
- Bound lengths: findings 60-280 characters, for example.
- Leave out references, acknowledgements and appendices by default.
- Remove near-duplicates by skeleton similarity.
- Cap the cards per item.
- Tune a threshold per card type from `x` presses.
- Drop the LessWrong `typo`, `seen`, `thanks`, `offtopic` and `laugh` reacts.

## 7. Prior art worth stealing

| Pattern | Where | Use here |
|---|---|---|
| Skimming highlights: goal, method and result sentences coloured over the PDF, with an adjustable count | [Semantic Reader](https://www.semanticscholar.org/faq/what-are-skimming-highlights) (from the Scim prototype) | Highlighting in abstract cards (F13); a density slider for findings |
| One-line TLDRs under every search result | Semantic Scholar | A one-line source line on every card |
| Citation cards: hover an in-text citation to see the cited paper's TLDR | Semantic Reader | Peek on inline references; F28 |
| Trending feed with short blurbs; generated blog posts with figures | [alphaXiv](https://www.alphaxiv.org/changelog) | Paper threads (F22); reading activity as a ranking signal |
| Thumbnail-led paper cards with upvotes | Hugging Face Daily Papers | Lead figure on every card (section 1) |
| A strip of page thumbnails under every paper | the original arxiv-sanity | Hover scrubbing; the wall's contact sheets |
| Rows are papers, columns are extracted fields, each cell backed by a quote | Elicit | The Deck's rows-by-item mode |
| Citing sentences, marked supporting, contrasting or mentioning | scite | F28 and F26 |
| A meter showing how many papers say yes or no | Consensus | F26 |
| Graphs and timelines of related papers | Connected Papers, Litmaps | F27; more like this |
| One machine-written highlight sentence per conference paper | [Paper Digest](https://paperdigest.org/2022/02/iclr-2022-highlights) | F9 and F14 as a one-line-per-paper lane digest |
| Leaderboards built from results tables | Papers with Code | Later: F3 and F10 charted across papers |
| A daily review of old highlights, with keep and less often | Readwise | F24 |
| Cloze deletion, image occlusion, spaced repetition; prompts embedded in an essay | Anki; Quantum Country | F24 |
| Masonry; a pin's close-up with "more like this" under it; boards | Pinterest | The Board layout; Peek's more-like-this strip |
| One block in many channels | Are.na | Saving cards to several boards; F25 |
| Full-screen vertical snap; watch time as the signal | TikTok | The Stack layout; peek dwell as feedback |
| Many feeds as side-by-side columns | TweetDeck (X Pro) | The Deck layout |
| Paper threads: hook, key figure, numbered points, caveat | Twitter and Bluesky | F22 |
| Hover a link for its lead image and first paragraph; recursive hover popups | Wikipedia Page Previews; gwern.net | Peek's timing and contents |
| Chart titles that state the finding | Our World in Data | F2: the citing sentence as the figure's title |
| Book images extracted from OCR'd scans, posted with the text before and after and a link to the page | [Internet Archive Book Images](https://blog.archive.org/2014/08/29/millions-of-historic-images-posted-to-flickr/) (Kalev Leetaru, 2014) | F4 |
| Most-highlighted passages | Kindle Popular Highlights; Medium's top highlight | F16 |
| Readers react to quoted spans | [LessWrong reacts](https://www.lesswrong.com/w/lesswrong-reacts) | F16, used directly as a source |
| Figures linked to the text on hover, margin notes | Distill, Transformer Circuits | Peek shows the citing context |

## 8. Build order

1. **Peek panel, adopted by Figures** (M). This answers the hover request in the view the reader already uses.
2. **Lead figure** (S-M): `refs`, `cited` and `sec` in `/figures`; wall paper covers that show the top figure or figures and scrub through figures on hover; the F1 board. This answers "these pages are boring".
3. **Citing sentences on Figures cards** (F2; S, from the same parse).
4. **Snippets route** (M): `latexml.mjs` and `66-snips.mjs`, with T0 and T1 extractors.
   - For arXiv: findings, numbers, contributions, theorems and definitions, limitations, section maps.
   - For LessWrong: reacts, TL;DRs, tables of contents.
5. **The Deck** (M), with columns by type and rows by item.
6. **Paper threads** (F22; S once step 4 exists).
7. **Plates** (F4; M).
8. **Later:** the mixed board; then the model tier (pull quotes, number lines); then the feeds across items (concept boards, citation contexts, timelines, claims versus counter-claims).

## 9. Open questions

- **Hit rates.** Do peeks and Dives per card bear out the hit-rate guesses? Measure after step 3.
- **Names on reacts.** Should LessWrong react cards show reactors' names? Proposed: counts only.
- **Ordering in the Deck.** Should cards follow lane order, as the figure river does, or be ranked globally by score? Proposed: lane order across items, score within an item.
- **MathML.** Firefox renders LaTeXML's MathML well; check Chrome before relying on it for the equation and theorem cards.
- **Model spending.** How much a day should T3 spend? Proposed: Haiku, in batches the reader starts.
