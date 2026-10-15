# Metadata indicators

How to show an item's metadata (kind, field, technicality, maths, contents, reading time, standing) at the top left of the reader, and in a micro form for wall tiles, library rows and search results. You should be able to tell what you are about to read in under a second.

*Status, 2026-10-15: this is a design, not built yet. Fourteen designs were prototyped as one static page using the app's palette and ten real corpus items. Three records (Attention, the geometric-mean post, Shannon) are copied from `data/meta/calibration.json`; the other seven are plausible records written to the rules in [`schema.md`](schema.md). Standing is the real within-lane percentile of corpus `score`. The chosen design was also injected into the live app's header for three items and screenshotted. No project code was changed.*

## What the reader should get at a glance

On landing on an item, the reader asks in roughly this order:

1. **What kind of thing is this?** A theory paper, an essay, game rules, a puzzle book?
2. **What is it about, specifically?** Agent foundations › logical uncertainty, not just "AI safety".
3. **How hard is it?** Two separate questions: how much field background it assumes, and how much maths it makes you work through. They diverge often. Among the ten sample items, `tech` 3 comes with `math` 0, 1, 2 and 3.
4. **How long will it take?**
5. **What is it made of?** Proofs, original data, code.
6. **Is it any good, and should I read it?** Standing in its lane and the AI verdict.
7. **How old is it, relative to its field?** Classic, frontier or period piece.

The header already shows the type icon, title, lane, authors, date and position (`pp. 1–2 of 131`). The indicator adds 1–7 without pushing out what is already there.

## Metadata the indicator reads

The record format is defined in [`schema.md`](schema.md) and `data/meta-schema.json`, and is merged as `it.meta`. The indicator uses:

| Field | Scale | Where it shows |
|---|---|---|
| `genre` (20) + `stance` (9) | enum | type line (genre noun); card (genre "that" stance) |
| `field` (2–4 levels), `also` | taxonomy path | type line (two most specific levels); card (full path, plus `also`) |
| `tech` | 1–5: General, Informed, Technical, Specialist, Expert | tile row 1; card |
| `math` + `mathAreas` | 0–5: None, Arithmetic, School, Undergraduate, Graduate, Research | tile row 2; card |
| `formal` / `empirical` / `code` | 0 none · 1 some · 2 central | type line (level 2 only); card (levels 1 and 2) |
| `mins` | careful-reading minutes, from the schema's pace rule | tile (number + unit); micro; card |
| `prereqs`, `audience`, `gist` | text / enum | card only |
| `era` | classic · historical · established · recent · frontier | type line (`classic`, `frontier` and `period piece` only); card |
| `lang` | ISO 639-1 | type line, after the genre ("Game rules · German"), when present |
| `basis` | title · blurb · abstract · known · text | hollow segments when `title`; card footer |
| standing (computed client-side) | within-lane percentile of corpus `score` | type line (bucketed); card (with its source) |
| read fraction (memory feature), verdict (summaries) | measured / AI | card "You" row; library rows keep their progress bar; verdict pill |

Standing is computed from the corpus, not the classifier. It is the within-lane percentile of `score`. It is `null` when every item in the lane has the same score (LLM papers, Information theory, Cybernetics, TTRPG), and for ordered lanes (QURI wikis), where `score` is tree order and not quality. The source is named in the card: karma for LessWrong, curator score for curated lanes, downloads for Internet Archive oddities.

## Precedents

| Precedent | What it teaches | Taken or rejected |
|---|---|---|
| Tufte's sparklines and data-ink ([Tufte](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/)) | Word-sized graphics at typographic resolution can sit inline with text | Taken: the tile is word-sized and inline. The document strip (M) is a literal sparkline |
| Cleveland & McGill 1984 ranking ([summary](https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html)) | Position on a common scale beats length, then angle and area, then colour | Taken: tech and maths are aligned bars sharing one baseline. Rejects pies (E) and areas (I) |
| Nutrition Facts label (Burkey Belser, 1994; [Wikipedia](https://en.wikipedia.org/wiki/Burkey_Belser)) | Fixed order, bold labels, heavy rules, words not charts. The design team rejected pie and bar charts | Taken for the hover card. As a header strip (G) it is too loud |
| Bloomberg Terminal | Expert density: fixed slots, mono numerals, colour only for exceptions | Taken: fixed slots and mono numbers, with amber only for maths |
| AIGA/DOT transit symbols, airport signs | A few glyphs, used consistently everywhere | Taken: the same two rows in the header and in every micro form |
| Ski-trail ratings ([Piste](https://en.wikipedia.org/wiki/Piste)) | Shape and colour both carry level, and anyone who skis knows them. Ratings are relative to the resort | Rejected (D): four tiers for a five-level scale, regional, and a black diamond disappears on a dark background |
| Harvey balls ([Wikipedia](https://en.wikipedia.org/wiki/Harvey_balls)) | Quarter-filled circles in comparison matrices | Rejected (E): fifths of a 12 px circle cannot be told apart |
| Chess ECO codes, arXiv categories, ACM CCS ([ECO](https://en.wikipedia.org/wiki/Encyclopaedia_of_Chess_Openings), [arXiv](https://arxiv.org/category_taxonomy), [CCS 2012](https://www.acm.org/publications/class-2012-intro)) | 500 codes (A00–E99) learned by players. The CCS is a poly-hierarchy (one concept, several parents), like `field` + `also` | Codes kept for plain text (B, and schema §12), not for the header: invented codes for non-arXiv fields would need learning first |
| Periodic-table tile | Symbol plus numbers in fixed corners | Rejected (C): two-letter field symbols clash with element symbols (Lu, Ag, Ar), and 8 px corner numbers are too small |
| Steam review labels ([thresholds](https://www.steampageanalyzer.com/blog/steam-review-score-thresholds), community-documented) | Words for coarse buckets ("Very Positive"), and no label below 10 reviews | Taken: standing is shown in buckets ("top 10%"), and not at all without a signal |
| IMDb / Goodreads chip lines | "PG-13 · 2h 49m · 2014": a plain line people already read | Kept as option A; its parts make up the type line |
| Letterboxd half-stars, Altmetric donut ([Altmetric](https://www.altmetric.com/about-us/our-data/donut-and-altmetric-attention-score/)) | Fine-grained ratings; a multi-coloured ring for mixed sources | Rejected: a half-star implies precision an AI rating doesn't have, and a ring of colours needs a legend |
| Magic: The Gathering card | Cost pips, a type line ("Creature — Elf Druid"), a rarity colour and a P/T box | Type line taken. "5/5" and rarity gems (H) are ambiguous outside the game |
| Wikipedia quality scale (FA, GA, B, C, Start, Stub) ([assessment](https://en.wikipedia.org/wiki/Wikipedia:Content_assessment)) | Quality and importance are rated separately | Taken: difficulty and standing are never merged into one glyph |
| Radar glyphs ([critique](https://observablehq.com/blog/avoid-radar-charts)) | The filled area depends on axis order and is read as area | Rejected (I) |
| Chernoff faces ([Morris, Ebert & Rheingans](https://engineering.purdue.edu/~ebertd/papers/Chernoff_990402.PDF)) | Features differ in salience. The study found no clear advantage over other glyphs, and judging features was a serial, not pre-attentive, process | Rejected (J): the faces also read as emotions (tech 5 looked like an angry paper) |

## The fourteen options

| | Design | Header form | Micro form |
|---|---|---|---|
| A | Spec line | A second line under the title: `Theory paper · Logic › Logical uncertainty · Tech 5/5 · Math 5/5 (logic, …) · proofs · 131 pp · top 25%` | `Theory · T5 M5 · 131p` |
| B | Call number | A mono chip before the title: `math.LO │ T5·M5 │ ∎ │ 131p │ p79` | `math.LO 55 131p` |
| C | Element tile | A 34 px square with a two-letter field symbol, tech and maths in the top corners and length at the bottom; tinted by domain | A 16 px tile with the symbol, then `5·5` |
| D | Slope marks | A ski mark for tech, then `∫5` and the length | The same marks at 10 px |
| E | Harvey balls | `T◕ M◕ L◑ Q◕ R○` (tech, maths, length, quality, read) | Three balls |
| F | Signal bars | `T ▁▃▅▇█  ∫ ▁▃▅▇█  131 pp`: bars of rising height | The two bar groups at 9 px, then the length |
| G | Facts label | A boxed "Reading facts" strip: **Tech** 5 \| **Math** 5 \| 131 pp \| Proofs | none |
| H | Card type line | Cost pips (log time) and a `5/5` box after the title, a rarity gem, and a "Paper — Theory" type line | Pips and `5/5` |
| I | Radar glyph | A 30 px pentagon: tech, maths, length, standing, recency | 16 px pentagon |
| J | Chernoff face | A 30 px face: width = length, eyes = maths, brows = tech, smile = standing | 16 px face |
| L | Difficulty map | A 6 × 5 dot grid with one lit dot at (maths, tech), then the length | 18 × 15 px grid |
| M | Document strip | A 120 px sparkline: maths density per page (amber), figures (ticks), read coverage (green) | 48 px strip |
| N | Tag chips | `Logical uncertainty` `Proofs` `Expert` `Math-heavy` `Long read` | One chip |
| K | **Spec tile + type line** | A 32 px tile before the title, with TECH and MATH as aligned five-step bars plus the reading time, and a type line under the title | Two stacked 5-segment rows (29 × 8 px), then the time |

## Screenshots

All screenshots are in `/tmp/claude-0/-home-user-cairn/0193788b-bfb6-55ba-996b-2cd5efef9d2b/scratchpad/builders/meta-design/shots/`. Each comes at 1× and at 2× (`@2x`).

- `d-A.png` … `d-N.png`, `d-K.png`: one per design. Each shows the header for all ten items at the stage's real width (1398 px), wall shelf labels, search results and library rows.
- `d-final.png`: the chosen design for ten items plus the not-classified state, with micro forms in all three compact places.
- `d-card.png`: hover cards for *Logical Induction*, the Christiano post and Dudeney (a title-only guess).
- `d-anatomy.png`: the tile at 3×.
- `inapp-arxiv.png`, `inapp-lw.png`, `inapp-bstj.png`: the design injected into the running app. The arXiv shot has the hover card open; the `@2x` versions are crops of the header.

The prototype page is `…/meta-design/indicators.html`, built by `build.mjs` from `tpl.html` and `data.js`. `shot.mjs` takes the gallery screenshots and `inapp.mjs` the in-app ones.

## Critique

Each design is scored 1–5 on six criteria:

- **Glance:** can you get the answer in under a second?
- **Info/px:** how many facts it shows for its footprint.
- **Learn:** how quickly a new user can read it.
- **Honest:** no fake precision; unknown and missing values are distinct; judgments are labelled as such.
- **Consistent:** the same slots across paper, post, book, wiki and scan.
- **Fit:** how well it sits on the minimal main screen.

Footprints were measured in the prototype on the *Logical Induction* row.

| | Design | New facts | Footprint (px) | Glance | Info/px | Learn | Honest | Consistent | Fit | Total | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| K | Spec tile + type line | 9 | 129×32 + ~450×15 | 5 | 4 | 4 | 5 | 5 | 4 | **27** | The two bars share a baseline, so "hard and long" or "light and short" reads at once. Words in the type line teach the tile. Adds 13 px of header height |
| F | Signal bars | 3 | 115×13 | 4 | 4 | 4 | 4 | 5 | 4 | 25 | Best runner-up; the micro form is legible. Full bars read as "good signal", not "hard", and it carries no field or genre |
| A | Spec line | 8 | 681×17 | 2 | 3 | 5 | 5 | 4 | 4 | 23 | Fully clear, but it is prose: the numbers sit mid-sentence and must be read |
| L | Difficulty map | 3 | 77×25 | 2 | 3 | 3 | 5 | 5 | 3 | 21 | Exact and honest, but the exact cell is hard to read at 5 px, and the 30 idle dots are texture |
| G | Facts label | 4 | 181×30 | 4 | 2 | 5 | 5 | 3 | 1 | 20 | Very readable. The white box is the loudest thing on screen, and its width varies by item, so titles jump |
| M | Document strip | 4 | 164×16 | 2 | 5 | 3 | 5 | 2 | 3 | 20 | The most data, all measured, but it answers "where is the maths?" rather than "how hard is it?" Posts have no pages. It belongs on the track bar |
| H | Card type line | 6 | 94×16 + type line | 3 | 4 | 2 | 3 | 4 | 3 | 19 | Cost pips work. "5/5" doesn't say which number is which, and rarity colours need MTG. The type line is kept |
| B | Call number | 6 | 198×20 | 2 | 5 | 1 | 3 | 3 | 3 | 17 | The densest, but it must be decoded, and "p79" looks more precise than it is. Kept for plain text and export |
| D | Slope marks | 3 | 92×14 | 3 | 3 | 3 | 2 | 4 | 2 | 17 | The double diamond does say "expert" instantly. The black diamond has to be drawn as an outline on a dark background, which breaks the convention |
| E | Harvey balls | 5 | 134×12 | 1 | 3 | 3 | 3 | 4 | 3 | 17 | 3/5 and 4/5 look identical at 12 px; five balls read as noise |
| C | Element tile | 5 | 34×34 | 3 | 4 | 1 | 2 | 4 | 2 | 16 | Charming and memorable, but Lu, Ag and Ar are real elements, and the domain colours compete with lane colours |
| N | Tag chips | 6 | 365×18 | 3 | 1 | 5 | 2 | 2 | 1 | 14 | Vague adjectives ("Advanced" or "Expert"?), and the chip count and width vary per item |
| I | Radar glyph | 5 (unreadable) | 30×30 | 1 | 2 | 1 | 1 | 3 | 2 | 10 | Every item becomes a similar amber blob; the area changes with axis order |
| J | Chernoff face | 4 (unreadable) | 30×30 | 1 | 2 | 1 | 1 | 3 | 1 | 9 | Faces read as moods, so a hard paper looks angry |

What the screenshots showed:

- Variable-width elements (B, G, N, and early drafts of K) make titles jump from item to item. The tile must be fixed width.
- In list contexts the micro meters only form a scannable column when the length text has a fixed width.
- At 1×, 3 px tall segments still read as "mostly full" or "mostly empty" (`d-final.png`, library rows). The micro form should not be smaller than this.

## Final spec

### Layout

```
┌────────────────────┐
│ TECH ■■■■■ │ 9½ │  ▤ Logical Induction                                              2/1948 · pp. 8–10 of 131
│ MATH ■■■■■ │ H  │  Theory paper · Agent foundations › Logical uncertainty · ▮ proofs · top 25% · Scott Garrabrant… · Sep 2016   AI SAFETY  STUDY
└────────────────────┘
```

`#item-head` becomes a two-row grid, 40 px tall (from about 27 px today: 6 + 2 px padding and a 19 px title line):

- `grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: 19px 15px; column-gap: 12px; row-gap: 0; padding: 3px 16px; align-items: center`.
- Column 1, spanning both rows: the **spec tile**.
- Row 1: `#loadpct`, the type icon and the title (`h1`, `16px/19px` serif, unchanged), and `#pos` on the right (column 3).
- Row 2: the **type line**. This replaces today's `.meta` (lane, authors, date, star), whose contents move into it.

The extra 13 px is about 1% of a 1050 px window. In the in-app screenshots the pages still fit, although the header was enlarged after layout. In the real feature, `showFeed` calls `paintHead` before it measures `#spread`, so the header must be complete synchronously within that call (see Implementation notes).

### Spec tile

| Part | Spec |
|---|---|
| Box | `display: inline-grid; grid-template-columns: auto 36px; column-gap: 7px; height: 32px; padding: 0 6px; margin-left: -6px; border-radius: 3px`. Measured 129 × 32 px. The fixed 36 px time column keeps every title at the same x |
| Labels | `TECH`, `MATH`: `600 8px/1 var(--mono)`, `letter-spacing: .06em`, colour `--spec-label` |
| Rows | Label column, then five segments. `column-gap: 5px; row-gap: 3px`. Tech is on top, maths below |
| Segment | 8 × 6 px, `border-radius: 1px`, 2 px gap; a row is 48 px wide |
| Segment colours | Tech lit `--seg-on` `#d9d1c3`; maths lit `--seg-math` = `--accent` `#e2a54a`; unlit `--seg-off` `#4a443a` |
| Time column | `border-left: 1px solid var(--line); padding-left: 7px; height: 26px`. Number `500 13px/1 var(--mono)` in `--ink`; unit `7.5px` mono, upper case, `--ink-3` (`MIN`, `H`) |
| Time format | From `mins`: under 60, whole minutes (`35 MIN`); 60–599, half-hours (`1½`, `4`, `9½ H`); 600 and over, whole hours. The pages stay in `#pos` |
| Hover / focus | Background `--bg-3`; focus ring `0 0 0 2px var(--accent)` |

Tokens, defined in `ui/features/meta.css`, derived so they follow theme settings:

```css
:root {
  --seg-on: #d9d1c3;
  --seg-math: var(--accent);
  --seg-off: color-mix(in srgb, var(--ink) 24%, var(--bg));         /* ≈ #4a443a */
  --spec-label: color-mix(in srgb, var(--ink-2) 40%, var(--ink-3));  /* ≈ #857d70 */
}
```

### States

| State | When | Tile | Type line | Micro |
|---|---|---|---|---|
| Rated | record present, `basis` ≠ `title` | Solid lit segments | As below | Solid |
| Guessed | `basis: title` | Lit segments drawn hollow: transparent with a 1 px inset outline in the row's lit colour (`box-shadow: inset 0 0 0 1px …`) | Unchanged; the card footer says "Guessed from the title only" in `--warn` | Hollow |
| No maths | `math: 0` | Maths row all unlit | – | Unlit row |
| Not classified | `meta.json` is loaded but has no record for this item | Rows show `–` in `--ink-3`; time `–` | `Paper · not classified yet` (italic, `--ink-3`) · byline · lane | Two dashed 1 px lines (2 px dash, 2 px gap, `--ink-3`), time blank |
| No metadata at all | `/meta.json` is missing or empty | The tile is hidden and the header falls back to today's one-line layout | – | Nothing |

A missing rating is never drawn as 0: "not classified" uses dashes, and "no maths" uses unlit segments.

### Type line

`11.5px/15px var(--sans)`, with `·` separators in `--ink-3` (6 px margins). It is a single line; overflow is hidden. In order:

1. **Genre noun**, in `--ink`: Empirical study, Method paper, Theory paper, Benchmark, Survey, Position paper, Policy document, Technical report, Essay, Explainer, Textbook, Monograph, Handbook, Reference, Game rules, Periodical, Collection, Puzzle book, Fiction, Announcement. If there is a `lang`, the language name follows ("Game rules · German").
2. **Field**: the two most specific levels of `field` joined by ` › ` (`Agent foundations › Logical uncertainty`), in `--ink-2`. It is the first part to truncate with an ellipsis.
3. **Contents**, only at level 2 ("central"), in `--ink-3`, each a glyph plus a word:
   - `▮ proofs`: a 5 × 8 px filled bar, the tombstone ∎;
   - `⚗ data`: Lucide `flask-conical`, 11 px;
   - `</> code`: Lucide `code`, 11 px.

   Level 1 appears only in the card, so "cites some evidence" doesn't clutter half the corpus.
4. **Era**, only for `classic`, `frontier` and `historical` (shown as "period piece"), in italic serif, `--ink-2`.
5. **Standing**, in buckets: `top 1%`, `top 2%`, `top 5%`, `top 10%`, `top 25%`, `top half`. `10px` mono, `--ink-2`. Nothing is shown below the median or without a signal.
6. **Byline · date**, in `--ink-3`. Authors are capped at 260 px with an ellipsis, as today.
7. **Lane**, as today (`10px` mono caps, `--accent`), then the ★ if saved, then the **verdict pill** (existing `.pill` colours, `9px/14px`) once a summary exists.

### Hover card

The card opens 300 ms after the pointer enters the tile, or at once on focus or with the `d` key ("details"; free as of this writing). It stays open while the pointer is over the tile or the card, and closes 150 ms after leaving, with Esc, or on the next item. Clicking the tile or pressing Enter pins it open. It sits below the tile, left-aligned (`top: 42px; left: 10px` within `#item-head`), 380 px wide, above the spread (`z-index` 50; `#peek` uses 45).

Contents, top to bottom:

1. **Title** (`500 13.5px` serif), then the **gist** (italic `13px` serif, `--ink-2`).
2. **"{Genre noun} that {stance}"** · full field path, then `also …` in `--ink-3`.
3. A 3 px `--ink-2` rule, as on a nutrition label, then label/value rows. Labels are `600 9px` mono caps in `--ink-3`, 64 px wide; rows have 1 px `--line` dividers.

   | Row | Example (*Logical Induction*) |
   |---|---|
   | Tech | ■■■■■ **5 Expert** · written for researchers |
   | Math | ■■■■■ **5 Research**: logic, computability, probability |
   | Contains | ▮ proofs are the structure · 3 figures. Level-1 wording: "some derivations or proof sketches", "cites evidence", "snippets or pseudocode". With none: "no proofs, data or code" |
   | Assumes | first-order logic · computability · Dutch-book arguments (or "nothing in particular") |
   | Length | **9½ h** careful reading of the main body (555 min) · 131 pp. Posts and wikis show the word count. Reference and puzzle genres add "made for dipping into" |
   | Standing | **top 25%** by curator score among AI-safety items. With no signal, the reason in `--ink-3`: "no quality signal in this lane" or "wiki pages are ordered by tree, not ranked" |
   | Era | 2016 · established |
   | You | read 35% / not opened yet · AI verdict `STUDY` |

4. **Footer** (`10.5px`, `--ink-3`): "Genre, field, tech and maths are AI ratings from {basis}; a ±1 difference between raters is normal. Time follows the schema's pace rule." When `basis` is `title`, this is preceded by **Guessed from the title only.** in `--warn`.

### Micro form (up to 18 px tall)

| Part | Spec |
|---|---|
| Meter | `.mm`: 29 × 8 px; two rows 3 px tall with a 2 px gap; segments 5 × 3 px with 1 px gaps. Same colours and states as the tile; tech on top |
| Time | `10px` mono, `--ink-3`, fixed 30 px width, right-aligned: `35m`, `4h`, `9½h` |
| Wall shelf label (16 px, `#grid .meta`) | `dot · author · [meter][time] · verdict pill`. The date leaves the label on cover styles that already print the year (`ARXIV · 2016`); where a cover doesn't, keep the date and drop the time on tiles narrower than 160 px |
| Library rows (24 px, `.lr-i`) | `icon · title · [meter][time] · progress (.lr-p)`. With fixed widths, the meters form a column |
| Search results | `icon · title · genre · leaf field (250 px, --ink-3) · [meter][time] · lane · year` |
| Related list, History | Optional; same `[meter][time]` pair before the source label |

### Accessibility

- **Tile:** a `<button type="button" class="spec">` with `aria-expanded` and `aria-controls="spec-card"`, and an `aria-label` that states every glyph in words. Example: "Theory paper on AI, Alignment, Agent foundations, Logical uncertainty. Technicality 5 of 5, Expert. Maths 5 of 5, Research: logic, computability, probability. About 9 and a half hours of careful reading. Proofs are the structure. Top 25% by curator score among AI-safety items." For a title-only record, append "Ratings guessed from the title only." When not classified: "Paper, not classified yet. 35 pages."
- **Card:** `role="tooltip"` and `id="spec-card"`; the tile gets `aria-describedby="spec-card"` while it is open.
- **Micro meter:** `role="img"`, with the same text as `aria-label` and as `title`, so mouse users get a native tooltip.
- **Colour is never the only channel.** Rows are told apart by position (tech on top) and by label; amber versus ink is redundant. Level is the count of lit segments; guessed versus rated is fill versus outline.
- **Contrast** (WCAG ratio on `--bg` / on `--bg-3`):

  | Colour | On `--bg` | On `--bg-3` |
  |---|---|---|
  | lit tech | 12.2 | 10.4 |
  | lit maths | 8.6 | 7.3 |
  | label | 4.6 | 3.9 |
  | unlit | 1.9 | 1.6 |

  Unlit segments are the empty track and carry no information beyond their count, so the low ratio is deliberate.
- **Motion:** none. Keyboard: Tab reaches the tile, Enter or Space pins the card, Esc closes it.

### Implementation notes

- **Files:** `ui/js/features/meta.js` and `ui/features/meta.css`. The feature reads `it.meta` (already merged by `corpus.js`) through one adapter, `specOf(it)`, so later schema changes touch one function.
- **Header:** `paintHead` (`ui/js/feed.js`) rebuilds `#item-head` on every paint. The smallest core change is one added line at its end, `emit('head:painted', { it, el })`. The feature then adds the tile, moves `.meta` into the type line, and sets `#item-head.spec-on` for the grid. `#loadpct` and `#pos` must keep their ids, because other code updates them.
- **Compact places** need similar small hooks, or a shared `registerDecor(place, fn)` in `util.js`:
  - wall: `makeTile` in `ui/js/wall.js` (the `.meta` shelf label);
  - library: the item-row branch in `ui/js/features/library.js` (before `.lr-p`);
  - search: `paintResults` in `ui/js/search.js`.
- **Plain text** (export, copy, logs): use the schema's code form (§12 of `schema.md`, close to design B), e.g. `AI›Align›AgentFdn›Logical uncertainty   Th·pro   T5 M5(logic)   ◇data○  ⊢●  ‹›○   9h15 · '16 Es`.

## Follow-ups

- **Document strip (M) on the track bar.** Draw maths density per page and figure ticks under `#track`. These are measured from the text layer, not judged, and they answer "where are the hard parts?" The track already has a layer registry (`registerTrackLayer` in `feed.js`).
- **Personal pace.** Once the memory feature has enough dwell data, scale `mins` by the reader's own pace for each tech/maths band, and say so in the card.
- **Calibration check.** If `tech` and `math` turn out almost perfectly correlated across the full batch (an open question in `schema.md`), the maths row could become a single number. The ten items here suggest they won't be: `tech` 3 appears with `math` 0, 1, 2 and 3.

## Open questions

- Should the card open on hover at all, or only on focus, click or `d`? Accidental pop-ups over the page while reaching for the title may annoy; try 300 ms first.
- Is half-hour rounding still too precise for title-only guesses? The time could show `~4 H` when `basis` is `title`.
- Should standing compare within lane + type (posts against posts) rather than within lane? Mixed lanes such as AI safety hold both papers and blog-style reports.
- On the wall, does the shelf label have room for the meter at the smallest tile size (130 px)? If not, move the meter onto the cover's bottom corner next to the page count.
