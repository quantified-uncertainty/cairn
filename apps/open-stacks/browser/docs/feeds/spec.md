# Feeds: build spec

*15 October 2026. The yields come from [extraction-yields.md](extraction-yields.md), the designs from [feed-ideas.md](feed-ideas.md) and the highlight format from [llm-highlights.md](llm-highlights.md). The LaTeXML ids, the parse times and the LessWrong GraphQL fields below were checked for this spec against four cached arXiv papers and two live posts. The acceptance numbers are targets set from those measurements; nothing here has been built yet.*

This spec is for two builders working in parallel. The SERVER builder writes the extraction routes and a warm script; the UI builder writes the Feeds view, the hover panel (Peek) and a small change to the Figures view. Section 3 is the JSON contract between them. Paths are relative to `apps/open-stacks/browser/`.

## 0. What gets built

The reader's latest request sets the default: *"ideally this view shows top few pictures/graphs, or just top graph, as is best. these pages are boring!"* Three rules follow from it:

- **Feeds opens on Pictures.** The first feed is one card per item showing its top graph, or its top two or three when no single figure clearly wins (section 2).
- **Every text card carries a picture.** Each card has the item's top picture as a 48 px avatar, so a column of findings is still a column of pictures. Highlight cards lead with their figures.
- **Hover shows the picture large.** Resting the pointer on any card, here or in the Figures view, opens it large in a panel on the right, over the content, with no layout shift (section 4.2).

The build has five parts:

| What | Who | Where |
|---|---|---|
| Typed parts of every item, cached on disk, plus feeds of one part type across a lane | SERVER | `server/lib/extract.mjs`, `server/routes/66-extract.mjs` |
| Overnight warming and a yields report | SERVER | `extract-warm.mjs` |
| The Feeds view: a masonry Board and TweetDeck-style Columns, nine feed types | UI | `ui/js/features/feeds.js`, `ui/features/feeds.css` |
| Peek: hover a small card, see it large on the right | UI | `ui/js/features/peek.js` (styles in `feeds.css`) |
| Peek in the existing Figures view | UI | a change of at most 40 lines to `ui/js/features/figures.js` |

## 1. The feeds to build now

Nine feeds. The yields column gives the measured share of items with at least one usable card of that kind (extraction-yields.md); the per-item cap applies when a feed lists cards, and caps keep any one paper from flooding a screen.

| Feed (`type`) | One card shows | Sources | Yield (measured) | Cap per item | Layout notes |
|---|---|---|---|---|---|
| `pictures` (default) | The item's top graph, or a mosaic of its top 2-3 | arXiv figures, post preview and body images, web `og:image` and body images, scan plates | arXiv 28/30 with a figure; posts 63% with a preview image, 80% with body images; QURI 9%; plates in 2/8 books | 1 card per item | Board default; true aspect ratios |
| `findings` | One result sentence, or the authors' list of contributions or claims | arXiv cue sentences ("we find that"), contributions, bold-led lists; post claim lists | arXiv results sentences 77%, contributions 30%, bold-led lists 40%; post claim lists 67% | 3 | Cue phrase in grey, the claim in full ink |
| `numbers` | A stat tile: the number large, its sentence below with the number marked | Result sentences with a quantity; probability sentences in posts and wikis | arXiv 77% (4.0 a paper, ~75% precision); posts 53%; QURI 30% | 3 | The fastest feed to skim |
| `tables` | A real table, scaled to the card, with its caption | arXiv HTML tables; QURI and other web tables; post tables | arXiv 90% (5.8 a paper); QURI 46% of pages (158 tables) | 3 | Rendered from sanitized HTML |
| `equations` | A display equation in MathML, with the sentence that introduces it | LaTeXML `table.ltx_equation` | arXiv 53% numbered (3.1 a paper) | 3 | Key equations only (section 3.3) |
| `definitions` | A term and its definition, or a definition or theorem block | `ltx_theorem_*` blocks, definitional sentences with an emphasized term, wiki definition lists | Theorem-like blocks in 13% of papers (2.8 each); definitional sentences 83% (~50% good); QURI definition lists common | 4 | Chip: DEFINITION, THEOREM, TERM |
| `limits` | A limitation, or an open question | Limitations and future-work sections, cue sentences, "Open questions" lists | arXiv limitations 27%, future work 27%; QURI open-question lists on ≥ 25 pages | 3 | Amber left edge |
| `posts` | The author's own voice: TL;DR, epistemic status, a bold pull line, the opening, or a blockquote | LessWrong, Alignment Forum and EA Forum `htmlBody` | TL;DR 20%, status 7%, bold one-liners and lead-ins 27%, blockquotes 47% | 3 | Posts only |
| `highlights` | Model-picked (or hand-picked) figures, claim, number, passage and question for one item | `data/highlights.json`, else `data/highlights.sample.json` (12 items) | Whatever the file holds | 1 card per item | Labelled AI (or "sample") |

**Plates are inside Pictures.** A scan's top picture is its first verified plate, so Pictures in the Old technical oddities lane is a board of plates. Plates are expected in about a quarter of the books (2 of 8 sampled), so the feed is thin but nothing else in that lane gives pictures. Section 3.3 gives the candidate rule; the UI confirms each candidate with an ink test before showing it (section 4.5).

**Not in this build:**

- Non-arXiv PDFs (85) and the 4% of arXiv items without HTML: no parts. The server has no PDF parser; client-side PDF extraction is a later step.
- LessWrong inline reacts: both posts probed for this spec returned an empty `reacts` object, so the shape could not be confirmed.
- Mermaid diagrams on QURI pages (about 25), hOCR inline figures in scans, citing sentences under figures, paper threads, concept boards, the mixed "For you" board.
- Wall covers that show the lead figure. That is the Wall v2 task, which can read `lead` from `GET /extract` (section 3.4).

## 2. The top picture: one graph or a few

The server picks each item's pictures and says whether to show one or a few (`lead` in section 3.4). In order of precedence:

1. **A highlight exists** (`data/highlights*.json` has the item and its `figures` resolve): use its figures in order and its `show`. arXiv refs (`S1.F1`) match figure ids; post and web refs (`img6`, `tbl0`) match the block markers of section 3.3; scan refs (`k27`) become a plate at page 27, with no ink test. Refs that do not resolve are dropped; if none resolve, go to step 2.
2. **arXiv, heuristic.** Candidates are image figures (`!f.table`, with `img`) in the main text (`at < 0.7`, id not starting with `A`) whose caption has at least 20 characters, or which are Figure 1. Score each:

   | Signal | Score |
   |---|---|
   | Figure 1 with `at < 0.15` (the teaser: 24 of 30 papers) | +2.0 |
   | Distinct top-level sections that cite it (`a.ltx_ref` whose `href` ends `#<fig id>`, not inside a figure or caption), up to 3 | +1.0 each |
   | Result words in the caption: `accuracy, performance, loss, rate, scaling, vs, versus, compared, improv, outperform, increas, decreas, over training, as a function of, %, ×` | +0.5 |
   | Example words in the caption: `example, prompt, transcript, screenshot, sample output, interface, illustrat` | −0.7 |
   | More than 6 parts (a grid of samples) | −1.0 |
   | Both sides under 250 px | −2.0 |

   Sort by score. `show` is `one` when there is one candidate or the top beats the second by 1.5 or more; otherwise `few`, with the second and, if it scores within 1.0 of the top, the third.

   Why distinct sections rather than reference counts: in the hand picks, plain counts chose a lookup chart cited 26 times over the result figure (Alignment faking). Counting distinct citing sections fixes that case. In all six hand-picked papers, Figure 1 was the first or second pick, so a two-up mosaic of Figure 1 and the best other figure covers the hand pick 6 times out of 6.
3. **Posts.** `socialPreviewImageUrl` first, then body images in order (skipping URLs matching `emoji|icon|avatar|logo|gravatar|latex|codecogs|badge|favicon` and `data:` URIs over 100 KB). `show` is `one` when there is a preview image; `few` when there is no preview and at least two body images; otherwise `one`.
4. **Web pages.** `og:image` or `twitter:image`, then body images as for posts. `show: 'one'`.
5. **Scans.** Plate candidates in rank order (section 3.3), up to 12, each with `verify: true`. `show: 'one'`; the UI shows the first that passes.
6. Otherwise `show: 'none'` and no Pictures card.

The same `lead` gives the avatars on text cards: its first picture's main image.

## 3. Server (SERVER builder)

### 3.1 Files

| File | Status | Contents |
|---|---|---|
| `server/lib/extract.mjs` | new | Pure functions, no I/O: `fromLatexml`, `fromPost`, `fromWeb`, `fromOcr`, `leadOf`, `sentences`, the regexes, scoring, `cardsFor(feed, ex, per)`, `FEEDS`, `VER` |
| `server/routes/66-extract.mjs` | new | The routes, the disk cache, the walk, read-ahead, the arXiv gate, verdicts, highlights loading, `/status` fields |
| `extract-warm.mjs` | new | The CLI: warm, `--report`, `--sample` |
| `server/routes/65-figures.mjs` | one line appended | `export { parse, walk, text, clean, hasClass, decode, tex };` Nothing else changes; `VER` stays 7 |

The parser in `65-figures.mjs` was written for LaTeXML. It tolerates stray close tags, and posts (CKEditor) and Starlight pages are well-formed, so it should serve for them too; check it on 5 posts and 5 QURI pages in step 3 of section 6. Importing the module for its named exports does not register its routes again. No other server file changes: not `server.mjs`, `cache.mjs` or the other routes.

### 3.2 Sources

| Kind | `src` | Fetch | Notes |
|---|---|---|---|
| arXiv (`arxiv:` ids), HTML available | `latexml` | HTML (`url` is the final URL after redirects, `cache.meta(u).final \|\| u`): `https://arxiv.org/html/<aid>`, then `https://ar5iv.labs.arxiv.org/html/<aid>`, through `cache.ensure` and `cache.read` (the same URLs `/figures` uses, so usually already cached). Figures: loopback `GET /figures?id=arxiv:<aid>[&bg=1]`, which also writes the inline SVGs that `/figures/svg` serves | A source whose body lacks `ltx_document` does not count: ar5iv answers 200 with the abstract page for papers it lacks. Neither source → `err: 'no-html'`, cached |
| Posts (`kind: 'html'`, GraphQL URL) | `post` | `it.url` through the cache (the JSON holds `htmlBody`). Preview: `GET https://<host>/graphql?query=` + `encodeURIComponent('{post(input:{selector:{_id:"<id>"}}){result{socialPreviewImageUrl}}}')`, through the cache (the field was confirmed on a live post for this spec) | `<host>` is `it.url`'s host; `<id>` is the item id after `lw:` or `eaf:` |
| Web (`kind: 'web'`) | `web` | `it.url` through the cache; resolve relative URLs against `cache.meta(url).final \|\| url` | |
| Scans (`kind: 'scan'`) | `ocr` | Loopback `GET /ocr/text?ia=<ia>` and `/ocr/labels?ia=<ia>` | `/ocr/text` already maps hOCR pages to access leaves, which avoids the Tractatus offset pitfall in extraction-yields.md section 6 |
| Non-arXiv PDFs, `text`, arXiv without HTML | `none` | none | `err: 'unsupported'` or `'no-html'`; answered at once |

Loopback base: `http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${app.PORT}`, with `HOST` from `server/config.mjs`.

**Politeness.** Every arXiv HTML fetch this route starts (foreground or background) waits for a shared gate that admits one per 1,000 ms; cached URLs skip the gate. LessWrong and EA Forum: at most 2 fetches at a time from this route. archive.org: at most 2 books at a time. During development, test on 30 items a lane, not the whole corpus.

### 3.3 Extraction rules

All text is collapsed to single spaces. Sentences are split on `(?<=[.!?])\s+(?=[A-Z(\["“])`, without splitting after `e.g.`, `i.e.`, `et al.`, `Fig.`, `Eq.`, `Sec.`, `vs.`, `cf.`, `Tab.`, `approx.` or a single capital initial. Sentence cards keep 50-320 characters. Math inside sentences comes through `text()` as Unicode-ish TeX, which reads well; equation and theorem cards keep the MathML through `clean()`.

**Where text comes from.**

- *LaTeXML.* Paragraphs are `p.ltx_p` not inside `figure`, `figcaption`, `.ltx_bibliography`, `.ltx_note`, `.ltx_theorem` or `table.ltx_equation*`. A paragraph's anchor is its nearest ancestor with an id (`S4.p2`; abstract paragraphs are `p1`, `p2`… under `abstract1`). Its section is the nearest `section` ancestor; the section title is its heading's `ltx_tag` text plus `text()` of the heading (read the tag separately: `text()` skips `ltx_tag`). Appendix: a section id starting with `A`, or class `ltx_appendix`. Text cards skip sections titled `/related work|background|preliminar|notation|acknowledg|reference|author contribution|checklist|reproducib/i`; findings and numbers also skip the appendix.
- *Posts and web pages.* The leaf blocks of llm-highlights.md section 3: `p`, `li`, `h1`-`h6`, `figcaption`, `pre`, `td`, `th`, `dt`, `dd` with text and none of the others inside; a double `<br>` also breaks a paragraph. They are numbered `p0`, `p1`… in document order; images `img0`… and tables `tbl0`… are numbered separately. A block's section is the nearest preceding heading. Web content root: `.sl-markdown-content` (Starlight; drop `.sr-only`, `.sl-anchor-link`, `.pagination-links`, and on `priors.quantifieduncertainty.org` every `aside.starlight-aside`, which are boilerplate there), else `d-article`, `article`, `main`, `[role=main]`, `.post-content`, `.entry-content`, `#content`, else `body`.
- *Scans.* Only plates (below).

**Every text part gets:**

- `loc.quote`: the sentence, or the first 40 words of a longer part, verbatim;
- `ctx.before` and `ctx.after`: the neighbouring sentences, up to 360 characters each;
- `loc.href`:
  - arXiv: `<url>#<anchor>`;
  - posts: `it.page + '#:~:text=' + encodeURIComponent(the first 8 words of the quote)`;
  - web pages: `<url>#<heading id>`, or a text fragment when there is no heading id;
  - scans: `https://archive.org/details/<ia>/page/n<k>`.

**Part rules.** At most 12 parts of each type per item are stored, best first. Duplicates are removed when two parts' letter-and-digit skeletons share their first 60 characters or their word sets overlap by more than 70%.

| Part `type` | Rule | `score` (0-1) |
|---|---|---|
| `figure` | Every image figure from `/figures`; these only feed `lead` | section 2 score, rescaled |
| `image` | Post and web images (rule in section 2), `caption` from `figcaption`, `loc.anchor` `img<k>`, `loc.quote` from the paragraph before | position |
| `plate` | Scan pages `k` with fewer than 25 OCR words and `4 ≤ k < n − 8`. Rank 0: text matches `/\b(fig\.?\|figure\|plate\|pl\.\|frontispiece)\b/i`; rank 1: 8-100 characters; rank 2: the rest. Up to 12 a book. `caption`: the OCR text (≤ 120 characters) or null. `img`: `https://archive.org/download/<ia>/page/n<k>_w400.jpg`. `loc.page` = `k`, `loc.label` from `/ocr/labels`, `verify: true` until a verdict exists; a part whose verdict is false is dropped | 1 − rank/3 |
| `finding` | Sentences matching `/\b(we\|our (results\|experiments\|analysis\|findings\|evaluations?))\s+(also\s+)?(find\|found\|show\|showed\|demonstrate\|observe\|observed\|discover\|conclude\|confirm\|reveal\|establish)s?\b/i`, `/\bour results (suggest\|indicate\|show)\b/i` or `/\b(surprisingly\|counterintuitively\|strikingly\|contrary to (prior\|previous\|common))\b/i`, and not `/\b(as we (will )?show\|we will show\|we hope\|shown in (Figure\|Table\|Section))\b/i`. `cue` is the matched phrase | 0.4, +0.2 in the abstract, introduction or conclusion, +0.2 with a number, +0.1 for a "surprisingly"-type cue |
| `claims` | (a) Contributions: the yields regex in the introduction's top-level paragraphs, with the following `ul.ltx_itemize` or `ol.ltx_enumerate` (2-8 items), or inline "First, … Second, …". (b) Bold-led lists outside the appendix: 2-10 items, nearly all starting with bold or a `Label:`. (c) Posts and web: bold-led lists, or lists of 3-12 items directly after a heading or paragraph matching `/\b(claims?\|takeaways?\|summary\|key points\|in short\|main points\|conclusions?)\b/i`. `html` is `clean()` of the list, at most 5 items of at most 220 characters each | (a) 0.9, (b) 0.7, (c) 0.6 |
| `number` | Sentences matching the results regex in extraction-yields.md section 2 ("Results"), or, in posts and wikis, `\b\d+(\.\d+)?\s?% (chance\|probability\|likely\|confiden)`, `(probability\|chance\|odds) (of\|that)[^.]{0,60}\d+\s?%` or `\bp\s?=\s?0?\.\d+`. Drop setup sentences (`/\b(learning rate\|batch size\|epochs?\|warm-?up\|weight decay\|dropout\|seed\|hyperparameter\|we (use\|set) )\b/i`). `value` is the matched quantity as written; "from X to Y" becomes "X → Y" | 0.5, +0.2 in the abstract or introduction, +0.2 for a "×", "fold" or order-of-magnitude change, +0.1 for a change of 2× or more |
| `table` | arXiv: `/figures` entries with `table && html`, 2-25 rows, 2-10 columns, `html` ≤ 40 KB, label not starting "Fig", `at < 0.9`, id not starting `A`; `label`, `caption`, `rows` and `cols` from the entry. Web and posts: `clean()` of each `<table>` of the same size, with the caption from `<caption>` or the paragraph before | 0.3, +0.3 when ≥ 30% of cells are numeric, +0.2 with bold cells (`ltx_font_bold`, `<b>`, `<strong>`), +0.2 in the main text |
| `equation` | `table.ltx_equation` (and whole `table.ltx_equationgroup`s) with a `<math>` whose `alttext` has 15-400 characters. Key equations only: cited at least once by an `a.ltx_ref` to its id, or introduced by a sentence matching `/\b(objective\|loss\|we define\|defined as\|bound\|minimi[sz]e\|maximi[sz]e\|update rule\|reward\|expected)\b/i`. `html`: `clean()` of the `<math>` with `display="block"`. `text`: the TeX. `label`: the `ltx_tag_equation` text ("(3)") or none. `ctx.before`: the sentence before it in the same `ltx_para`; `ctx.after`: the next sentence when it starts with `where`, `here`, `with` or `in which` | 0.4, +0.2 a citation (up to +0.4), +0.2 with an introducing cue |
| `definition` | (a) `div.ltx_theorem` whose class has a suffix starting `ltx_theorem_defin` or `ltx_theorem_assum`; `label`: the title's `ltx_tag` text plus its `text()` ("Definition 3.2 (Bregman divergence)"); `html`: `clean()` of the block without its title, ≤ 4 KB. (b) Sentences matching the definitions regex in extraction-yields.md section 2, without "we denote", that contain an emphasized term (`em`, `i`, `b`, `strong`, `.ltx_emph`, `.ltx_font_italic`, `.ltx_font_bold`) or a quoted phrase of at most 6 words; `label`: the term. (c) Posts and web: `dt`/`dd` pairs, and list items or paragraphs of the form `<strong>Term</strong>: gloss` (gloss 20-300 characters) | (a) 0.9, (b) 0.5, (c) 0.6; +0.1 each per citing section |
| `theorem` | `div.ltx_theorem` with a kind starting `theorem`, `prop`, `corollary` or `claim`, and `lemma` only when cited from two or more sections; same fields as (a) above | 0.6, +0.1 per citing section |
| `limitation` | (a) The first 2-3 sentences (≤ 420 characters) of a section or subsection titled `/limitation\|threats to validity\|caveat\|weakness/i`. (b) Main-text sentences matching `/\b(a limitation of\|one limitation\|limited to\|we do not (address\|study\|evaluate\|consider)\|does not (generalize\|account for))\b/i`. Drop generic sentences under 18 words that match `/\b(other\|more\|additional\|different\|larger) (datasets\|models\|tasks\|domains\|languages\|benchmarks)\b/i` | (a) 0.8, (b) 0.5 |
| `question` | (a) In sections titled `/future work\|future direction\|open (problem\|question)s?\|outstanding questions\|unsolved\|cruxes/i`: each list item (≤ 300 characters, up to 4), else the first 2 sentences. (b) Sentences matching `/\b(remains? (unclear\|open\|unknown)\|an open question\|we leave .{0,60}(to\|for) future work\|future work (should\|could\|might)\|is not yet (known\|clear))\b/i`. (c) QURI, other web pages and posts: list items under a heading matching (a)'s regex | (a) 0.8, (c) 0.8, (b) 0.5 |
| `tldr` | Posts: a paragraph matching `^\W{0,3}(tl;?dr\|tldr\|summary\|in short\|short version\|bottom line\|key takeaways?\|executive summary\|abstract\|overview)\b\W` in the first 40 blocks, or a heading of that name, and what follows up to the next heading or 900 characters. When the paragraph is only the label, take the next `ul` or `p`. `html` keeps lists | 1.0 |
| `status` | Posts: `^\W{0,3}(epistemic (status\|state\|effort)\|confidence)\b` in the first 30 blocks | 0.9 |
| `pull` | Posts: a paragraph of 20-250 characters at least 80% bold, not starting `/^(figure\|fig\.\|table\|chart)\b/i`; or a paragraph of up to 400 characters that starts with a bold run of 15-200 characters (`html` keeps the bold) | 0.7 |
| `opener` | Posts with no `tldr`: the first paragraph of 120-400 characters that does not start with `(Originally posted`, `Crossposted`, `This is a linkpost` or `Epistemic` | 0.5 |
| `quote` | Posts: a top-level `blockquote` of 40-600 characters; at most one a post | 0.4 |

**Highlights.** On each request the route checks the modification time of `data/highlights.json`, falling back to `data/highlights.sample.json` (format in llm-highlights.md section 4), and reloads it when it changed. A file change discards the in-memory feed states (section 3.7).

### 3.4 `GET /extract?id=<item id>[&bg=1]`

`bg=1` marks background work (read-ahead, warming), which yields to the reader as `/figures` does. An unknown id returns 404 `{error}`; a malformed one 400.

```ts
type Extract = {
  v: number;                        // VER of server/lib/extract.mjs (starts at 1)
  id: string;                       // corpus item id
  at: number;                       // build time, epoch ms
  ms: number;                       // build duration
  src: 'latexml' | 'post' | 'web' | 'ocr' | 'none';
  url: string | null;               // the document the parts came from; anchors resolve against it
  err?: 'no-html' | 'unsupported' | 'empty';
  lead: Lead;                       // the top picture(s), section 2
  parts: Part[];                    // document order; ≤ 12 per type
  hl: Highlight | null;             // the item's entry in data/highlights*.json, as stored there
};

type Lead = {
  show: 'one' | 'few' | 'none';
  pics: Pic[];                      // best first; ≤ 3, except scans: ≤ 12 candidates with verify
  by: 'hl' | 'score' | 'post' | 'web' | 'plate';
};

type Pic = {
  pid: string;                      // 'figure:S1.F1' | 'image:img3' | 'plate:k27' | 'table:tbl0'
  type: 'figure' | 'image' | 'plate' | 'table';
  img?: string;                     // absolute URL, or '/figures/svg?…' for inline SVG
  w?: number | null; h?: number | null;   // known for arXiv figures; null: the UI measures
  parts?: { img: string; w: number; h: number; inline?: boolean }[];
  lay?: number | (string | number | any[])[];  // as /figures; figArt() in figures.js draws it
  inline?: boolean;
  html?: string; rows?: number; cols?: number; // type 'table'
  label?: string; caption?: string | null;
  loc: Loc; at: number;
  verify?: boolean;                 // plates: the UI must pass the ink test before showing it
};

type Part = {
  pid: string;                      // `${type}:${anchor}` or `${type}:${anchor}:${n}` (sentence n of a paragraph);
                                    // unique within the item; '~2' appended on a clash
  type: 'figure' | 'image' | 'plate' | 'finding' | 'claims' | 'number' | 'table' | 'equation'
      | 'definition' | 'theorem' | 'limitation' | 'question' | 'tldr' | 'status' | 'pull' | 'opener' | 'quote';
  text: string;                     // plain text, always present, ≤ 1,200 characters (equations: the TeX)
  html?: string;                    // sanitized by clean(): tables, MathML, theorem statements, lists
  img?: string; w?: number | null; h?: number | null; parts?: any[]; lay?: any; inline?: boolean;  // pictures
  label?: string;                   // 'Table 2', '(3)', 'Definition 3.2 (Bregman divergence)', a term
  caption?: string | null;
  value?: string;                   // numbers: '24.1%', '5-18x', '79.9% → 22.6%'
  cue?: string;                     // verbatim substring of text that triggered the match
  sec?: string;                     // section title path, ≤ 80 characters: '4.2 Results'
  ctx?: { before?: string; after?: string };   // ≤ 360 characters each
  rows?: number; cols?: number;
  loc: Loc;
  at: number;                       // 0-1 position in the source
  score: number;                    // 0-1 salience within the item and type
  verify?: boolean; verdict?: boolean;         // plates
};

type Loc = {
  anchor?: string;                  // element id in `url`: 'S4.p2', 'S2.E3', 'S4.T2', 'Thmdefinition2';
                                    // posts and web: 'p41', 'img6', 'tbl0' or a heading id
  page?: number;                    // 0-based raster page: a scan's access leaf k (as /ocr and goPage count)
  label?: string;                   // printed page label (scans)
  quote?: string;                   // verbatim needle, 8-40 words, for findPage and highlighting
  href?: string;                    // the original at that place
};
```

**No `vp`.** The server never sends a stable page (`vp`). Stable pages are cut in the browser by `prepareFlow` (about 280 words each) from HTML the server never sees in that form. The UI finds the stable page from `loc.quote`, starting near `at` (section 4.6).

**Caching.** Results are stored at `CACHE/extract/<safe(id)>.json`, with `safe` as in `65-figures.mjs`, and served from disk while `v === VER`.

- `no-html`, `unsupported` and `empty` results are cached as well.
- Network failures are not cached.
- `hl` is attached when the result is served, never stored, so a new highlights file takes effect at once.

Example, abridged, for an item in the sample highlights (`arxiv:2503.14499`); the `hl` value is its entry in `data/highlights.sample.json`:

```json
{
  "v": 1, "id": "arxiv:2503.14499", "at": 1760551200000, "ms": 74, "src": "latexml",
  "url": "https://arxiv.org/html/2503.14499v4",
  "lead": { "show": "one", "by": "hl", "pics": [
    { "pid": "figure:S1.F1", "type": "figure", "img": "https://arxiv.org/html/2503.14499v4/plots/bootstrap/headline-log.png",
      "w": 1200, "h": 700, "label": "Figure 1",
      "caption": "The length of tasks (measured by how long they take human professionals) that generalist autonomous frontier model agents can complete with 50% reliability has been doubling approximately every 7 months for the last 6 years (Section 3).",
      "loc": { "anchor": "S1.F1", "href": "https://arxiv.org/html/2503.14499v4#S1.F1" }, "at": 0.02 } ] },
  "parts": [
    { "pid": "number:S4.p4:0", "type": "number", "value": "5-18x",
      "text": "We find large differences in the speed at which different human groups complete the internal PR tasks, with contractors taking 5-18x longer to fix issues than repo maintainers.",
      "cue": "We find", "sec": "4 External validity",
      "loc": { "anchor": "S4.p4", "quote": "We find large differences in the speed at which different human groups complete the internal PR tasks",
               "href": "https://arxiv.org/html/2503.14499v4#S4.p4" },
      "ctx": { "before": "…", "after": "…" }, "at": 0.41, "score": 0.9 }
  ],
  "hl": { "claim": "…", "figures": [ "…" ], "show": "one" }
}
```

(The `w`, `h`, `at`, `sec` and `ctx` values above are placeholders; the strings come from the sample file.)

### 3.5 `GET /extract/feed?type=&lane=&offset=&limit=[&per=][&wait=]`

| Parameter | Values | Default |
|---|---|---|
| `type` | `pictures`, `findings`, `numbers`, `tables`, `equations`, `definitions`, `limits`, `posts`, `highlights` | required (400 otherwise) |
| `lane` | `all` or a lane id from `corpus.json` | `all` |
| `offset` | cards already received, ≥ 0 | 0 |
| `limit` | 1-100 | 40 |
| `per` | 1-10, the per-item cap | the feed's cap (section 1) |
| `wait` | 0-8,000 ms: answer as soon as `limit` cards are ready, or after this long with what is ready (possibly none) | 1,500 |

**Which parts each feed takes.**

| Feed | Part types |
|---|---|
| `pictures` | `lead` (one `LeadCard` per item with `show` ≠ `none`) |
| `findings` | `finding`, `claims` |
| `numbers` | `number` |
| `tables` | `table` |
| `equations` | `equation` |
| `definitions` | `definition`, `theorem` |
| `limits` | `limitation`, `question` |
| `posts` | `tldr`, `status`, `pull`, `opener`, `quote` |
| `highlights` | `hl` (one `HlCard` per item that has one) |

Within an item, cards come best score first, cut to `per`. Items come in lane order.

- **One lane.** The order of `items` in `corpus.json` filtered to the lane (curated, roughly by quality).
- **`all`.** A deterministic weighted round-robin over lanes using `corpus.laneWeights`: the algorithm of `buildOrder` in `ui/js/state.js` without the reader's affinities and without noise.
- **`highlights`** walks only the items in the highlights file, in lane order.

```ts
type FeedResponse = {
  v: number; type: string; lane: string;
  offset: number;
  next: number;                     // offset + cards.length: the next request's offset
  cards: Card[];
  leads: Record<string, Avatar | null>;   // item id -> its top picture, for every item in `cards`
  walked: number;                   // items examined so far in this list
  total: number;                    // items in this lane's list
  done: boolean;                    // the list is exhausted: no card will ever appear past `next`
  pending: number;                  // items being extracted for this feed right now
  ms: number;
};
type Card = Part & { cid: string; id: string };          // cid = `${id}#${pid}`
type LeadCard = { cid: string; id: string; type: 'lead'; show: 'one' | 'few'; pics: Pic[]; by: string; score: number };
type HlCard = {
  cid: string; id: string; type: 'highlight';             // cid = `${id}#hl`
  claim: string; question: string;
  passage: { quote: string; why: string; ok: boolean; loc: Loc };
  number: { value: string; what: string; quote: string; ok: boolean; loc: Loc } | null;
  pics: Pic[]; show: 'one' | 'few' | 'none';
  sample: boolean;                  // true when read from highlights.sample.json
};
type Avatar = { img: string; w?: number | null; h?: number | null; inline?: boolean };
```

`HlCard.pics` come from the item's extract when it exists (true sizes, multi-part layouts); otherwise from the highlight's own `img`, `label` and `caption`, with `w` and `h` null. `HlCard.passage.loc` and `number.loc` come from the highlight's `loc`, mapped to `Loc`: an arXiv block marker becomes `anchor`, a scan's `k120` becomes `page`, and the quote becomes `quote`. The card keeps passages with `ok: false`, and the UI hides them.

**Paging is append-only.** Within one server run, the card list for each `(type, lane)` only grows, so `offset` always means the same card.

- An item whose extraction failed with a network error is retried once, after the walk reaches the end of the list; its cards are appended there.
- Plate verdicts (section 3.6) change `/extract` at once, but change an existing feed list only when that list is next rebuilt. The UI drops `verdict === false` plates itself.

Example (numbers, AI safety, abridged):

```json
{ "v": 1, "type": "numbers", "lane": "ai-safety", "offset": 0, "next": 40, "walked": 23, "total": 541,
  "done": false, "pending": 3, "ms": 212,
  "leads": { "arxiv:2503.14499": { "img": "https://arxiv.org/html/2503.14499v4/plots/bootstrap/headline-log.png", "w": 1200, "h": 700 } },
  "cards": [ { "cid": "arxiv:2503.14499#number:S4.p4:0", "id": "arxiv:2503.14499", "pid": "number:S4.p4:0",
               "type": "number", "value": "5-18x", "text": "We find large differences …", "loc": { "anchor": "S4.p4", "quote": "…" },
               "at": 0.41, "score": 0.9 } ] }
```

### 3.6 Other routes and status

- **`POST /extract/verdict {id, pid, ok}`** stores the UI's ink-test verdict for a plate in `CACHE/extract/verdicts.json` (keyed `id#pid`) and returns `{ok: true}`. From then on, `/extract` drops plates with `ok: false` and marks plates with `ok: true` as `verdict: true` without `verify`.
- **`app.status`** adds `extract: {cached, built, failed, queue, fg, bg, gateWaits, feeds: {"type|lane": {cards, walked, done}}}`.

### 3.7 Walking, read-ahead and the event loop

- **Feed state.** In memory, per `(type, lane)`: `{cards, walked, retry, done, busy}`. Concurrent requests for the same feed share one walk.
- **Rebuilt when.** A state is rebuilt from the disk cache, at about 1 ms an item, after a restart, a `VER` change or a highlights file change.
- **Foreground walk.** Up to 3 items at a time, in order. Cards are appended in item order, even when a later item finishes first.
- **Read-ahead.** After answering, the route queues background extraction (`bg`) for the next 24 unwalked items of that list. Background extraction runs 2 at a time across all feeds and waits while `cache.queueState().foreground > 0` (polling every 100 ms, for up to 5 s at a time), so the reader's page loads come first.
- **CPU.** Parsing and extraction run one item at a time, on a single CPU queue, with `await new Promise(setImmediate)` between items. Measured for this spec: `parse()` of LaTeXML takes 21-87 ms for 0.2-1.1 MB pages; the figure extraction adds 25-100 ms. Budget: p90 ≤ 250 ms and max ≤ 800 ms per item, including 2.6 MB papers. Over budget, profile; the event loop must not stall page proxying.

### 3.8 `extract-warm.mjs`

```bash
node extract-warm.mjs                          # every lane, feed order, every item (needs the server)
node extract-warm.mjs --lanes ai-safety,llm --items 200 --conc 2
node extract-warm.mjs --report                 # yields per feed and source, read from CACHE/extract (no server, no network)
node extract-warm.mjs --sample 40 --feed findings [--seed 7]   # 40 random cards as text, for hand labelling
```

- **Warming.** It calls `GET /extract?id=…&bg=1` with `--conc` at most 3 (default 2). The server's arXiv gate applies.
- **Progress.** It prints a line every 10 items, and Ctrl-C stops it cleanly.
- **No server.** Warming then exits with instructions; `--report` and `--sample` still work, because they only read files.
- **`--report` output.** One table row per feed and source kind, with these columns:
  - items examined;
  - items with at least one card;
  - cards, before and after the cap;
  - mean cards per contributing item.

  It also prints the share of arXiv items with `no-html` and the `lead.show` mix. These are the numbers the acceptance tests in section 5 read.

## 4. UI (UI builder)

### 4.1 Files

| File | Status | Contents |
|---|---|---|
| `ui/js/features/peek.js` | new | The hover panel, a reusable module |
| `ui/js/features/feeds.js` | new | The Feeds view: data, layouts, card renderers, keys, dive, telemetry |
| `ui/features/feeds.css` | new | Feeds (`fd-` classes, `#feeds`) and Peek (`#pk-panel`, `pk-` classes) |
| `ui/js/features/figures.js` | edit, ≤ 40 lines | Add `export` to `figArt` and `openFigure`; Peek on river tiles instead of the caption popover; `Z` pins; Esc and `hide()` close it |

Nothing else changes. Core modules, `webview.js`, `figpeek.js`, `wall.js` and `index.html` stay as they are. The id `#peek` is already taken (the page-strip preview in `feed.js`), so the panel is `#pk-panel`.

### 4.2 Peek (`peek.js`)

```js
export function attachPeek(root, {
  selector,                 // CSS selector of card elements inside root, e.g. '.fd-card' or '.fg-tile'
  cardOf(el),               // card element -> card object, or null (not peekable)
  render(card, body, ctx),  // fill `body` (cleared first); ctx = {width, height, pinned}; may be async
  delay = 200,              // ms of pointer rest before opening
  grace = 250,              // ms outside both card and panel before closing
}) -> detach()
export function showPeek(root, card, el)   // open or swap at once (keyboard selection while pinned)
export function closePeek()
export function pinPeek(on)                // on undefined: toggle; returns the new state
export function peekState()                // {open, pinned, card, side}
```

**Behaviour:**

- **Opening.** The panel opens 200 ms after the pointer comes to rest on a card. Only real pointer movement counts: the handler ignores `pointermove` events whose coordinates did not change, as `figures.js` does, because content scrolling under a still pointer must not open or swap anything.
- **Swapping.** Once the panel is open, moving onto another card swaps the content at once, with no delay.
- **Position.** `position: fixed`; `top` = the bottom of `#bar`; `bottom: 0`; width `clamp(480px, 42vw, 1400px)` (about 1,340 px on a 3,200 px screen). It sits on the right, unless the hovered card's horizontal centre is under the panel's area; then it opens on the left, so it never covers the card under the pointer. It overlays the content and never moves anything: nothing in the view changes size or position when it opens or closes.
- **Closing.** The panel closes after the pointer has been outside both the card and the panel for 250 ms. While the pointer moves toward the panel's side, the grace stretches to 450 ms, so the reader can reach the panel to scroll a long caption or click inside it. `Esc` closes it; a click outside both closes it; `view:changed` closes and unpins it. Scrolling the view does not close it.
- **Pinning.** A pinned panel does not close on leave. It follows the keyboard selection through `showPeek`, and hovering another card still swaps it after the 200 ms rest.
- **Images.** The renderer first draws the card's own (already loaded) image scaled up, then swaps in the sharper source after `img.decode()`.
- **Inside the panel.** Scrolling inside scrolls only the panel (`overscroll-behavior: contain`). The panel never takes focus.
- **Layering.** `z-index: 19`: above Settings (18), below search (20), the keys overlay (30) and the Figures lightbox (35). It is closed while the lightbox is open.
- **Motion.** It fades in with a 16 px slide over 120 ms, and only fades under `prefers-reduced-motion`.
- **Listeners.** `peek.js` adds listeners only to the roots passed to `attachPeek` and to the panel itself, plus one document `keydown` for `Esc` while open, and one `view:changed` listener.

**Figures view wiring (the `figures.js` edit):**

- `attachPeek(root, {selector: '.fg-tile', cardOf: (el) => tileOf.get(el)?.f ? tileOf.get(el) : null, render: peekFigure})`.
- `peekFigure` (about 25 lines, in `figures.js`):
  - `figArt(f, width − 40, 0.62 × innerHeight)` on white;
  - the label and the full caption;
  - title · authors · year;
  - a strip of the paper's other figures from `ready.get(it.id)`, 64 px high; hovering a thumbnail swaps the large art, which is the wall's scrubbing transplanted;
  - a hint line: `Enter open at the figure · z enlarge · Z pin · o arXiv`.
- Remove the river's caption popover. `hoverTile` no longer starts `popTimer`, and `select()` no longer shows the popover. The `#fg-pop` popover stays for the side panel's figure strip.
- Keys: `Z` toggles `pinPeek()`. `Esc` closes the peek before it closes the lightbox or leaves the view. `hide()` calls `closePeek()`. `z` (lightbox), `Enter`, `o` and the arrows are unchanged.

### 4.3 The Feeds view

`registerView('feeds', {label: 'Feeds', key: 'D', order: 2.5, roots: () => [root], show, hide})`. `D` is not bound anywhere; the global keys already taken are `f w R y i I p b ? / E L` and the digits. The root is `<section id="feeds">` inside `#main`. Its state survives `hide()`/`show()`: the cards, the scroll positions, the selection and the open feed. That way browser Back after a dive (`route.js` records views) returns to the same spot.

**Header** (one line, mono 11 px, like `.fg-head`):

```
Feeds · AI safety · [Board | Columns] · Pictures Findings Numbers Tables Equations Definitions Limits Posts Highlights · 212 cards · 340 of 541 items · reading 3… · hint
```

The type chips are the compact switcher:

- In Board, a chip selects the one feed shown.
- In Columns, a chip toggles that feed's column on or off; the order is fixed as listed.
- Each chip shows its count once known.
- Settings are kept in `store('feeds')`:
  - `{layout, type, streams, colMin, streamW}`;
  - defaults `layout: 'board'`, `type: 'pictures'`, `streams: ['pictures', 'findings', 'numbers', 'definitions', 'limits', 'posts']`, `colMin: 300`, `streamW: 480`.

**Board (Pinterest-style masonry).**

- **Columns.** As many as fit at `colMin` (240, 300, 380 or 480 px; `-` and `=` step through them), with 16 px gaps: 10 columns at 3,200 px and 300 px.
- **Placement.** Each card goes into the shortest column, as `place()` in `figures.js` does. A card is placed only once its height is known (below), and then gets an explicit `height`. Cards are never re-placed, except on resize, a density change or an undone hide.
- **Loading.** An `IntersectionObserver` on a sentinel 1,600 px below the bottom loads the next page.

**Columns (TweetDeck-style).**

- **Streams.** One stream per chosen feed, `streamW` wide (400, 480 or 560 px; `-` and `=`), each with a sticky header (name, count, ×) and its own vertical scroll and sentinel.
- **Width.** Streams that do not fit scroll the deck sideways (native horizontal overflow).
- **Cards.** They stack in feed order, and their natural height is fine here, because appending at the bottom moves nothing above.
- **Kin.** Hovering a card adds `.kin` to every card of the same item in every stream; a Map from item id to elements keeps this cheap.

**Card heights, measured without layout shift.**

- **Known aspect.** An arXiv figure's box is `colW / clamp(w/h, 0.62, 3.2)`.
- **Unknown aspect.** For images with `w` or `h` null (post and web images), the UI preloads with `new Image()` and `decode()` (at most 6 at a time, 1,200 ms timeout). It then places the card with the true aspect, clamped, or with a 16:10 box and `object-fit: contain` on timeout.
- **Text, tables and equations.** These are measured in batches: the batch's cards are appended to a hidden measuring column of exactly `colW`, all heights are read in one pass (one forced layout), and the cards are then moved into place. A table is measured at its natural size and scaled by `s = min(1, (colW − 20) / scrollWidth)`; its box height is `min(scrollHeight × s, 460)`, with a fade at the bottom when cut.
- **Limits.** Text cards are at most 520 px; longer text is cut with a fade, and Peek shows all of it.
- **Plates.** They are placed only after the ink test (section 4.5) passes, in a box with the page's aspect from the w200 thumbnail.

### 4.4 Cards

**Every card has:**

- **Body.** By type, in the table below.
- **Footer row.**
  - **Avatar.** 48 × 48 px, from `leads[id]`: the item's top picture with `object-fit: contain` on white, with a 2 px ring in the lane colour. Without one, a monogram: the title's first letter in serif, on a lane-colour tint.
  - **Title.** Italic serif, one line, ellipsis.
  - **Year and place.** The year, and where the card comes from (`§4.2`, `p. 37` for scans).
  - **Lane dot.**
- **Marks.** A `✓` when a quote was verified (highlights), `AI` on model-written text and `sample` on sample highlights.
- **Style.** Background `var(--bg-2)`, border `1px solid var(--line)`, radius 4 px. Figures and plates sit on white or paper, as printed. Text is 14.5px/1.45 `var(--serif)`.
- **States.** Selected cards get the accent outline of `.fg-tile.sel`.

Lead and highlight cards leave out the avatar: their picture is already the body.

| Card | Body |
|---|---|
| `lead`, `show: 'one'` | The figure, drawn by `figArt` (imported from `figures.js`) for arXiv, `<img>` otherwise. Caption: label plus 2 lines |
| `lead`, a `table` pick | Drawn as in the `table` card (highlights can pick a wiki page's table) |
| `lead`, `show: 'few'` | On cards ≥ 380 px wide, a mosaic: the first picture across 2/3 of the width, the others stacked in the last third, each `object-fit: contain`. On narrower cards, the first picture with a "+2" chip; moving the pointer along the card's bottom 28 px scrubs through the picks, as the wall's tiles do |
| `lead`, plate | The page image (`P(img)`, w400) on paper tone; caption = OCR text, 1 line; book title and year |
| `finding` | The sentence, with `cue` in `var(--ink-3)` and the rest in full ink |
| `claims` | `html` list, at most 6 lines, with a fade |
| `number` | `value` in 30 px semibold, accent colour; below, the sentence with the value wrapped in `<mark>` |
| `table` | `label` and caption (1 line); `html` inside `<div class="fg-tbl-in fd-tbl">` so the LaTeXML border rules in `figures.css` apply, on `var(--paper)` with dark ink |
| `equation` | `ctx.before`, last 200 characters, in grey; `html` MathML in `font-family: "Stacks Math", math` at 1.25em (the font is declared in `webview.css`); `label` aligned right |
| `definition`, `theorem` | Chip (DEFINITION, THEOREM or TERM); `label` in bold; `html` or `text`, at most 8 lines, with a fade |
| `limitation`, `question` | 3 px amber left edge; chip (LIMITATION or OPEN QUESTION); text; `sec` in grey |
| `tldr`, `status`, `pull`, `opener`, `quote` | Chip (TL;DR, EPISTEMIC STATUS, PULL, OPENING, QUOTE); text or `html` in 15.5 px serif |
| `highlight` | The pictures as for `lead`; `claim` (semibold serif); a number tile (`value` large, `what` small) when present; `passage.quote` as a pull quote with `✓`, unless `ok` is false, in which case it is hidden; `why` in grey with an `AI` mark; `question` in italic |

**Images.**

- arXiv figures and post or web images load directly, with `referrerPolicy = 'no-referrer'`, `loading = 'lazy'` and `decoding = 'async'`.
- archive.org images go through `P()`, as the wall's do.
- A broken image marks the card `broken`. Pictures cards that break before placement are dropped; after placement, a "picture unavailable" label replaces the image at the same size.

**Peek content by card.**

| Card | Peek shows |
|---|---|
| `lead`, `highlight` | Every pick at panel width (each up to 70vh) with label and full caption. The paper's other figures as a hover-scrub strip (`figuresOf(it)`, exported by `figures.js`). Title, authors, year, lane, and `it.ab` or `it.why`. Highlights add the question as heading, the claim, the number and the passage with its `why` |
| Text cards | The text in 20 px serif, with `ctx.before` and `ctx.after` in grey around it; `sec`; the item's top picture up to 360 px high; up to 4 other cards of the same item in this feed that are already loaded |
| `table` | The table at natural size, scrollable both ways, with label and full caption |
| `equation` | The MathML at 1.6em; `ctx.before` and `ctx.after`; the TeX in small mono, selectable |
| Plate | The page at w1000 (`P(scanUrl(it, k, 1000))`); caption; title; printed page label |

Every peek ends with a line of keys: `Enter open here · q quote to note · s save · x hide · o original · z pin`.

### 4.5 Loading, ordering and hiding

- **Requests.** One function makes them: `getFeed(type, lane, offset, limit = 40)` → `GET /extract/feed?...&wait=1500`. At most 3 are in flight per view, and one per stream.
- **Short pages.** When a response has fewer cards than `limit` and `done` is false, the sentinel shows "Reading N more items…" (`pending`) and the request repeats at the new `offset` at once.
- **The end.** When `done` arrives with no cards at all, the view shows an empty state: why the feed is empty in this lane (its sources, section 1), and chips for lanes known to have cards.
- **Lane changes.** A lane change (digits or chips) rebuilds the open feed; the previous `(layout, type, lane)` state is kept in memory, the last 6 of them, for instant return.
- **Plates.**
  - **Before placing.** A `LeadCard` whose pics have `verify` is placed only after one of its candidates passes the ink test. Candidates are tried in order, 2 at a time per card and 4 in all.
  - **The ink test**, on the w200 thumbnail through `P()` (same origin, so the canvas is readable):
    - Crop 6% left and right and 8% top and bottom.
    - Compute grey as `0.299r + 0.587g + 0.114b`, and take `bg` as the 90th percentile of grey.
    - Measure `dark`, the share of pixels below `bg − 60`; `mid`, the share in `[bg − 60, bg − 25)`; and `rowsInk`, the share of rows with more than 2% dark pixels.
    - A page passes when `rowsInk ≥ 0.2`, `dark < 0.6` and `mid < 0.2`.
    - The test takes ≤ 3 ms an image.
  - **Verdicts.** Every verdict is sent to `POST /extract/verdict`. A card whose candidates all fail is never placed.
  - **Dev hook.** `window.__feeds.verifyAll(lane)` runs the test over every candidate in a lane in idle time.
- **Hiding.**
  - **`x`.** Hides the selected card: it becomes a 28 px "Hidden · u undo" stub, so nothing around it moves. The stubs collapse at the next re-layout.
  - **`X`.** Hides every card of that item in this feed.
  - **`u`.** Undoes the last hide.
  - **Storage.** Hidden ids are kept in `store('feeds:hidden')` (card ids, the newest 5,000) and `store('feeds:hiddenItems')` (`{feed: [item ids]}`). Incoming cards that match are dropped before placement.

### 4.6 Opening a card at its place

`openCard(card, {pdf = false})`, on click or `Enter`:

1. Find the item: `i = byId.get(card.id)`. Close the peek and log `open` (section 4.9).
2. Go to the place:
   - **(a) Scans** (`loc.page` set): the item at page `k`, as `openFigure` does for raster pages (`state.start.set(i, k)`, then into the feed).
   - **(b) arXiv items with `loc.anchor`, and `pdf` false.** The web view at the anchor: the HTML version when it exists, because its anchors are exact.
     1. Jump to the item (as `openFigure` does).
     2. If it is not already read as HTML (`it._pdf` unset), switch it through the existing `H` binding: `keymap.get('H')?.fn({})` (`keymap` is exported by `util.js`; `H` acts on the current item). This keeps `webview.js` unchanged.
     3. Set `pendingDive = {i, anchor, quote}`.
     4. One `spread:rendered` listener does a single comparison and returns, unless `pendingDive.i === i` and `live?.id === it.id`. When they match, it looks up `live.flow.querySelector('[id="' + CSS.escape(anchor) + '"]')`. If the element is found: `state.start.set(i, elToCol(el)); showFeed()`. If not, it falls back to (c).
     5. If the `H` binding is missing (the webview feature failed to load), it falls back to (c).
   - **(c) Everything else**, and arXiv with `pdf: true` (`Shift+Enter` or `Shift+click`). Call `openFigure(i, {id: 'fd:' + card.cid, label: TYPE_LABEL[card.type], caption: card.loc.quote || card.caption || card.text, at: card.at})`. Its `findPage` searches PDF page text or a flow document's stable pages (`d.texts`) for the quote, starting near `at`. It then lands with `goPage(k)`, which goes through `vpToCol` for flow documents. It waits at most 350 ms before opening, then moves when the page is found, and only if the reader has not moved.
3. Mark the place. Run `currentWords()` once the spread is rendered, find the run of words whose skeleton matches the quote's first 12 words, and `highlight('fd', run)` for 4 s. If no run is found, skip silently.

**Other actions:**

- **`o`** opens `loc.href` in a new tab; without one, `it.page || it.url`.
- **`q`** quotes the card into the item's note with `appendQuote(it, text, page)` from `notes.js`:
  - `text` is `loc.quote || text`; tables, figures and plates use `label: caption`; equations use `label TeX`.
  - `page` is `k + 1` for scans, the PDF page if `findPage` has already resolved it, and `null` otherwise.
- **`s`** saves the card's item, mirroring `toggleSave` in `nav.js` for an item that is not current: `state.saved`, `learn(it, 1)`, `store.set('saved', …)` and `paintSaved()` from `chrome.js`. A toast confirms it.
- **Warm-up on peek.** When a peek opens, the UI prepares the click:
  - for PDFs, `POST /prefetch {urls: [it.url], pri: 50, group: 'feeds-open'}`;
  - for arXiv HTML, `fetch('/web/arxiv?id=…')`, which resolves the version and caches the page;
  - for a peek that lasts over 600 ms, `openDoc(it)`, as Figures does on hover.

  Only the peeked card's item is prepared, never every visible card.

### 4.7 Keys and wheel

The view's keys are handled by one `window` `keydown` listener in the capture phase, active only when `state.view === 'feeds'` and nothing else claims the key: no modifier keys, no focused input, and `#keys`, `#search` and the Settings sheet hidden. This is the pattern of `wall.js` and `figures.js`. Do not use `registerKey` for view keys: `keymap` holds one binding per key, so a `feeds` binding for `j` would replace the main feed's. Digits, `/`, `?`, `i`, `L`, `b`, `w`, `f`, `R` and `y` are not intercepted, so lanes, search, help and view switches keep working.

| Key | Action |
|---|---|
| `j` / `k` | Next / previous card. Board: reading order (top, then column); Columns: within the stream |
| `←` `→` `↑` `↓` | Spatial moves: up and down within a column or stream; left and right to the nearest card by vertical centre |
| `Space` / `Shift+Space` | Scroll 85% of a screen (Board: the view; Columns: the selected stream) |
| `Enter`, click | Open at the place (section 4.6) |
| `Shift+Enter`, Shift+click | arXiv: the PDF page instead of the HTML |
| `z` | Pin or unpin the peek; pinned, it follows the selection |
| `q` | Quote the card into the item's note |
| `s` | Save or unsave the item |
| `x` / `X` / `u` | Hide this card / this item's cards in this feed / undo |
| `o` | The original, at the place |
| `[` / `]` | Previous / next feed (Board), or stream (Columns) |
| `c` | Board ↔ Columns |
| `-` / `=` | Density: column width (Board) or stream width (Columns) |
| `Esc` | Close the peek; otherwise back to the feed (`setView('feed')`) |
| `D` (global) | Open Feeds |

Add `keyHelp` entries, as `figures.js` does, so the `?` overlay lists them.

**Wheel and trackpad.** Native scrolling throughout, with no `attachWheel`. The Board scrolls as a whole; in Columns, the stream under the pointer scrolls, and a horizontal stroke or Shift+wheel scrolls the deck sideways. While the pointer is over the panel, the wheel scrolls the panel only.

### 4.8 Performance rules

- **No cost to the main feed's page turns.** `feeds.js` and `peek.js` add no listeners to `nav`, `item:shown`, `gesture:step` or `gesture:pinch`, and exactly one to `spread:rendered` (the pending-dive check: one comparison). Neither module does anything while another view is showing, except finishing an open dive and posting telemetry.
- **Offscreen cards are cheap.** Every placed card has `content-visibility: auto` and an explicit `contain-intrinsic-size` set to its measured size. Images are lazy.
- **Bounded work per batch.** Measuring and placing a batch of 40 cards takes ≤ 40 ms of main-thread time. Image preloads run off the critical path.
- **DOM limit.** No more than 2,000 cards per view; past that, the sentinel shows "End of this session's feed · Esc to the feed".
- **Hover and scroll handlers** do no layout reads except the panel's side choice: one `getBoundingClientRect` per open or swap.

### 4.9 Telemetry

Events go to `POST /events` (`70-events.mjs`), buffered and flushed every 15 s, and with `sendBeacon` on `pagehide`. Each is `{t, type: 'feeds', act, feed, cid, ms?}`, where `act` is one of:

- `view`: the view opened, with the feed;
- `peek`: with `ms`, how long the peek stayed open;
- `open`;
- `quote`;
- `save`;
- `hide`;
- `hideItem`.

Together these are the per-feed "hits a minute" signal that feed-ideas.md section 5 asks for.

## 5. Acceptance tests

Run the yields tests after `node extract-warm.mjs` over the whole corpus. That is one arXiv HTML fetch a second at most, so allow about 40 minutes cold. Read them with `--report`, and measure precision by hand with `--sample 40 --feed <type>` (40 random cards, judged "worth a glance" or not).

The corpus today:

| Kind | Items |
|---|---|
| arXiv | 677 (about 650 with HTML) |
| Other PDFs | 85 |
| Posts | 500 (453 LessWrong or Alignment Forum, 47 EA Forum) |
| Web pages | 232 (155 QURI) |
| Scans | 452 |

### 5.1 Yields

| Feed | Floor (items with ≥ 1 card) | Floor (cards after the cap) | Measured basis |
|---|---|---|---|
| Pictures | arXiv with HTML ≥ 85%; posts ≥ 70%; web ≥ 15%; scans with a verified plate ≥ 10% (after `verifyAll('oddities')`) | ≥ 900 | figures 93%, preview images 63% plus body images 80%; plates 2/8 |
| Findings | arXiv with HTML ≥ 70%; posts ≥ 30% | ≥ 1,200 | results sentences 77%, contributions 30%, claim lists 67% |
| Numbers | arXiv ≥ 65%; posts ≥ 40%; QURI ≥ 25% | ≥ 1,100 | 77%, 53%, 30% |
| Tables | arXiv ≥ 80%; QURI ≥ 40% | ≥ 1,200 | 90%, 46% |
| Equations | arXiv ≥ 35% | ≥ 400 | 53% numbered, before the key filter |
| Definitions | arXiv ≥ 35%; QURI ≥ 20% | ≥ 400 | blocks 13%; emphasized definitional sentences; definition lists |
| Limits | arXiv ≥ 35%; QURI ≥ 12% | ≥ 350 | limitations 27%, future work 27%, cue sentences; ≥ 25 QURI pages with open questions |
| Posts | posts ≥ 90%; TL;DR ≥ 10%; status ≥ 2%; pull ≥ 20% | ≥ 800 | 20%, 7%, 27% (the 60-post sample had 13% TL;DRs and 0% status lines) |
| Highlights | every item in the file, with a resolvable id, gets one card (12/12 for the sample) | = file size | |

The card floors sit about 15-25% under the projections in extraction-yields.md, because its samples were small (30 papers, 15 posts, 10 wiki pages, 8 books). `no-html` must cover ≤ 6% of arXiv items (measured 3.9%).

### 5.2 Precision

40 random cards each, judged by hand:

| Feed | Precision floor |
|---|---|
| Pictures | ≥ 90% (a real figure or plate, not a logo, ornament or blank page) |
| Tables | ≥ 85% (real data or results) |
| Posts | ≥ 75% |
| Findings | ≥ 70% |
| Numbers | ≥ 70% |
| Limits | ≥ 70% |
| Definitions | ≥ 60% |
| Equations | ≥ 60% (a key equation, not bookkeeping) |

Plates also need no false positive in a contact-sheet check of 40 verified plates (the yields study had 3 true plates and no false ones once the leaves were mapped).

### 5.3 The top picture

- **Without highlights.** Move `data/highlights*.json` aside, so only the heuristic runs. For the six arXiv items in the sample, the hand-picked first figure must be among the lead's shown pictures in at least 5 of 6, and Figure 1 must be in the lead for at least 80% of 30 random arXiv items whose Figure 1 has `at < 0.15`.
- **With the sample.** `lead.by === 'hl'` for all 12 items, with the same pictures in the same order, apart from refs that fail to resolve, which must be logged.
- **One or a few.** `show: 'few'` must be at most 60% of arXiv leads. If it is higher, the 1.5 margin is too strict; report the mix with `--report`.

### 5.4 Latency

Measured on the reader's machine class, with a server already running:

| Measure | Target |
|---|---|
| `/extract`, result on disk | p50 ≤ 10 ms, p90 ≤ 30 ms |
| `/extract`, building from cached HTML (no network) | arXiv p90 ≤ 250 ms, max ≤ 800 ms; posts p90 ≤ 60 ms; web p90 ≤ 80 ms; scans p90 ≤ 80 ms with `/ocr/text` cached |
| `/extract/feed`, `limit=40`, the first 3 pages' items on disk | p90 ≤ 120 ms |
| `D` to the first cards painted, warm cache, Pictures, all lanes, 3,200 × 1,800 | ≤ 500 ms; the first screen full ≤ 1.2 s |
| `D` to the first card, cold (empty `CACHE/extract`, HTML not cached, AI safety lane) | ≤ 5 s, and 20 cards ≤ 25 s; "Reading N more items…" visible within 300 ms |
| Peek visible after the pointer comes to rest | ≤ 220 ms (the 200 ms delay plus ≤ 20 ms); a swap while open ≤ 50 ms; sharp image ≤ 600 ms when cached |
| Server responsiveness during a cold walk | `/proxy` page requests for the main feed are delayed by ≤ 50 ms p90 compared with an idle server |

### 5.5 Smoothness and layout

- **Scrolling.** `window.__feeds.bench()` scrolls the open view at 2,000 px/s for 10 s using requestAnimationFrame. It records frame intervals and `longtask` entries and returns `{frames, p50, p95, over33, over50, longTasks}`. With a Board of at least 400 Pictures cards at 3,200 × 1,800 CSS px (a 4K panel, scaled), the targets are:
  - median frame ≤ 16.7 ms;
  - ≤ 1% of frames over 50 ms;
  - no long task over 100 ms.

  The same run with a pinned peek following `j` presses must keep ≤ 2% of frames over 33 ms.
- **No layout shift.** Record the rectangles of the first 60 placed cards, relative to their scroll container, at placement. Ten seconds later, and again after all their images have loaded, no rectangle has moved more than 1 px. Opening, swapping and closing the peek moves no card at all (0 px).
- **No cost to the main feed.** 50 page turns in the main feed with the feature loaded, then 50 with `feeds.js` and `peek.js` removed. Telemetry `lat` p50 must agree within 5%.

### 5.6 Behaviour

- **Opening at the place.** 20 cards: 5 arXiv via HTML, 5 arXiv via `Shift+Enter` to the PDF, 5 posts and 5 scans. The landing view must contain the card's quote or caption in at least 18 of 20, with a median time to land of ≤ 1.5 s warm.
- **Keys.**
  - None of the view's keys act in other views.
  - From Feeds, the global keys (`0`-`9`, `/`, `?`, `i`, `w`, `f`, `R`, `y`, `L`, `b`) still work.
  - `j` in the main feed still moves to the next item after visiting Feeds.
- **Figures view.**
  - Hovering a tile opens the peek on the right, or on the left when the tile lies under the panel, after 200 ms.
  - Moving from the tile into the panel keeps it open; leaving both closes it within 300 ms.
  - `z` still opens the lightbox and `Z` pins.
  - The side panel's figure strip still shows its popover.
- **Notes and hiding.**
  - `q` appends a `> quote (p. N)` line to the right item's note, even when that item is not the current one.
  - Hidden cards stay hidden after a reload; `u` restores the last one.
- **Highlights.** No passage with `ok: false` is ever shown; every model-written line carries `AI`, and every sample card carries `sample`.

## 6. Build order and handoff

The server's first two milestones unblock the UI's real data; until they land, the UI builder can develop against a temporary `ui/js/features/feeds.fixture.json` built from the examples in section 3 (deleted before handoff).

| Step | SERVER | UI |
|---|---|---|
| 1 | Export line in `65-figures.mjs`; `lib/extract.mjs` for LaTeXML (all part types, lead); `GET /extract` with the disk cache. Check on 10 arXiv papers from the AI safety lane, including `2305.19861` (26 theorem-like blocks, 4 algorithms) and `1706.03762` | `peek.js`, and the Figures view wired to it. This ships alone and answers the hover request in the view the reader already uses |
| 2 | `GET /extract/feed`: walking, read-ahead, the arXiv gate, the CPU queue | Feeds view: Board with Pictures (lead cards, mosaic, avatars), loading, Peek for lead cards. This answers "top graph or top few" |
| 3 | Posts, web pages, scans (plate candidates), highlights | Columns layout; renderers for every card type; Peek for every type |
| 4 | `POST /extract/verdict`, `/status`, `extract-warm.mjs` with `--report` and `--sample` | Opening at the place, quote, save, hide and undo, keys, telemetry, the ink test, the `__feeds` hooks |
| 5 | Run section 5.1-5.4 server rows; report | Run section 5.4-5.6 UI rows; report |

Each builder hands back:

- the files;
- the measured numbers against section 5;
- the cases that fell short.

Neither builder commits or edits files outside their list. The integrator then updates `ARCHITECTURE.md` (the routes, the view, the Peek module) and the README's key list.

## 7. Risks and open questions

- **The arXiv opening rule.** Opening arXiv cards in the HTML view makes `H`'s choice stick for that item: `webview.js` remembers it per item. If the reader prefers PDFs, swap the defaults so that `Enter` opens the PDF and `Shift+Enter` the HTML. This is a one-line change.
- **Plates depend on the browser.** The server has no JPEG decoder, so plates are confirmed only when the UI has looked. A pure-JS decoder dependency (for example `jpeg-js`) would let `extract-warm.mjs` verify overnight, at the cost of the project's first non-AI dependency.
- **Precision of text cards.** Findings and numbers rely on regexes measured at about 75% precision on 20 sentences. Hide events (`x`) by part type and cue are the data for tuning thresholds after a week of use.
- **MathML in Chrome.** It renders LaTeXML's MathML through MathML Core (Chrome 109 and later). Spot-check 20 equation cards in both Chrome and Firefox before calling the equations feed done.
- **Highlights at scale.** A Haiku batch over the corpus (about $3, llm-highlights.md section 7) would make `lead.by === 'hl'` the norm. The Highlights feed and the lead override are built to take that file unchanged.
