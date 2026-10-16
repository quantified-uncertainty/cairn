# Compiled documents: a profile for every item

This spec defines a **profile** for each item in the corpus: a compiled form of the document, built once and kept on disk, that says how to show it and what is in it. It has three parts:

- **Analysis** (deterministic, cheap): page shapes, one consistent crop box for the body pages, blank pages, two-column gutters, printed page labels, figure regions, whether there is a text layer, a table of contents, the front matter, references and appendix ranges, and how to lay out 1, 2 or 3 pages at a time.
- **Assets**: pre-rendered, pre-cropped page images, a sprite sheet of every page, and the page-marked text.
- **Augmentation** (written by Claude): a skim path, skip ranges, a section map with one-line summaries, a glossary, margin notes anchored to verbatim quotes, explanations of the detected figures, display hints, a hook and tags.

It also answers the reader's question about caches (section 1): what the caches hold today, what is slow, and why Redis or more memory would not help while compiling documents ahead of time would.

Two builders work in parallel. One owns analysis and assets, the other the augmentation. Section 10 says who owns which file, and sections 4, 7 and 8 fix the interfaces between them. Paths are relative to `apps/open-stacks/browser/`. Effort is S (under about 150 lines), M (about 150-500) or L.

## Contents

0. [Summary](#0-summary)
1. [Where the time goes, and what the caches get wrong](#1-where-the-time-goes-and-what-the-caches-get-wrong)
2. [Conventions](#2-conventions)
3. [Storage, budget and eviction](#3-storage-budget-and-eviction)
4. [The profile JSON (schema 1)](#4-the-profile-json-schema-1)
5. [Analysis: how each field is computed](#5-analysis-how-each-field-is-computed)
6. [Assets](#6-assets)
7. [HTTP API](#7-http-api)
8. [Augmentation](#8-augmentation)
9. [Consumers](#9-consumers)
10. [File ownership and interfaces](#10-file-ownership-and-interfaces)
11. [Acceptance tests](#11-acceptance-tests)
12. [Settings, rollout, risks and open questions](#12-settings-rollout-risks-and-open-questions)

## 0. Summary

| | Today | With profiles |
|---|---|---|
| First spread of an item not yet opened in the browser (PDF on disk) | pdf.js parses the PDF, loads fonts and draws 3 pages on the main thread: **770-1,870 ms** measured | 3 pre-cropped WebP images decoded off the main thread: **71-96 ms** measured, plus a few ms over loopback |
| Turning to a page that is not rendered yet | pdf.js draws it: median 28-91 ms, p90 43-1,150 ms (image-heavy pages are the slow ones) | a display image if one exists (decode 33-53 ms, off the main thread), else pdf.js as today |
| Hovering the track | a 700-px pdf.js render for every page under the pointer (a cache-key bug means it never reuses the sharp render) | a cell of the sprite sheet: a CSS background change, under one frame |
| Crop, blank pages, page shape | measured per page on the main thread (`getImageData`), every visit, every session; each page cropped to its own ink | read from the profile; one crop box for all body pages, so pages in a spread match |
| Spread layout | learned from the first rendered pages, then laid out a second time | known before the first paint: aspects, blanks, landscape pages, facing pages |
| Contents, references, appendix | the PDF outline, if any, once the PDF is open | outline, LaTeXML sections or detected headings, with pages, before the PDF is open |
| Reading aids | the summary (5 s after arriving) | a skim path that Advance can follow, a section map, a glossary, margin notes, figure explanations |

Profiles are produced in three ways, none of which needs a new dependency:

- **In the reader's browser, in idle time.** pdf.js already loaded; analysis costs 35-70 ms a page for text papers (measured), done one page per idle slice. The renders the app already makes are written back as display images.
- **By a batch script, `compile.mjs`.** It uses Playwright's headless Chromium when present (the same code as the browser), else poppler (`pdftoppm`, `pdftotext`) when present, else does nothing. Neither is ever required.
- **By Claude, for the augmentation.** `claude-haiku-5-5` by default, about half a cent an item, or half that through the Message Batches API for the whole corpus, metered against the existing daily budget.

Disk: about 3 MB for a 30-page paper, about 2 GB for the whole corpus, evicted by the existing LRU.

## 1. Where the time goes, and what the caches get wrong

### 1.1 The caches today

| Layer | Holds | Cap | Cost of a hit |
|---|---|---|---|
| Server disk cache (`server/cache.mjs`), `~/.cache/open-stacks/<sha1>` | Originals: PDFs, Internet Archive page images, post JSON, web pages | `STACKS_CACHE_MAX`, default 8 GiB (`cache.mjs:56`), least recently used evicted first | About 1 ms from `/proxy`: macOS keeps recently read files in RAM |
| The operating system's file cache | Recently read cache files | Free RAM | Well under 1 ms |
| Firefox's HTTP cache | Every `/proxy` response (`Cache-Control: public, max-age=31536000, immutable`, `10-proxy.mjs:13`) | Firefox's own cache size | Repeats never reach the server |
| Browser memory, per tab | pdf.js documents: 16 (`docs.js:66`). Rendered, cropped pages: 30 when pages render taller than 1600 px, else 48 (`render.js:91`). Page images: 60. Low-resolution track renders: 120 (`feed.js:303`). The wall's own pdf.js documents: 40, and 260 thumbnails (`wall.js:225, 247`). The figure finder's own text-only documents: 3 (`figures.js:68`) | **Counted in items, not bytes** | Instant, while it lasts |
| Derived facts | Crop boxes, blank pages, gutters, page shapes, figure regions, outlines | **Not kept**: recomputed every visit and lost on reload | — |

### 1.2 What is slow, measured

Measured on 2026-10-15 in this container: headless Chromium (Playwright 1.56), 4 vCPUs, software rendering, pdf.js 4.10.38 (the app's version), PDFs read from local disk. The reader's Mac with Firefox will differ; section 11 says how to measure there. Papers: *Attention Is All You Need* (1706.03762, 15 pp.), *Constitutional AI* (2212.08073, 34 pp.), *Power-seeking can be probable and predictive* (2304.06528, 7 pp.), and an image-heavy 11-page report.

| Measure | 1706.03762 | 2212.08073 | 2304.06528 | Image-heavy |
|---|---|---|---|---|
| Open (parse) with pdf.js | 135 ms | 114 ms | 128 ms | 134 ms |
| **First spread, cold**: open, fonts, 3 pages at 1600 px | **843 ms** | **767 ms** | **833 ms** | **1,865 ms** |
| **Same 3 pages as WebP images**: decode only | **71 ms** | **82 ms** | **74 ms** | **96 ms** |
| One page at 2000 px with pdf.js, median / p90 | 31 / 194 ms | 28 / 43 ms | 40 / 86 ms | 91 / 1,147 ms |
| Decode one 2000-px WebP, median | 33 ms | 38 ms | 37 ms | 53 ms |
| Analysis per page (400-px render, text, operator list), median | 50 ms | 35 ms | 70 ms | 154 ms |
| Encode one 2000-px page as WebP (`toBlob`, off the main thread) | 262 ms | 282 ms | 265 ms | 390 ms |
| Sprite of every page at 120 px, WebP | 19.7 KB | 47.1 KB | 10.2 KB | 19.9 KB |

Average sizes per page of 1706.03762, cropped to its text (Pillow): WebP at 2000 px tall is 172 KB (quality 70) or 195 KB (quality 80); at 1600 px, 143 KB (quality 80); JPEG at 2000 px, 324 KB. A thumbnail 200 px tall is 4.4 KB. poppler on the same machine: `pdftoppm` renders and encodes a 2000-px JPEG in 134 ms a page and a 400-px greyscale page for analysis in 16-42 ms (379 ms on the image-heavy report); `pdftotext` reads a whole paper in 150-280 ms.

What this says:

- **A cold PDF costs most of a second before anything shows, and almost all of it is pdf.js in the browser.** The bytes are already on disk.
- **For a page in an open document, pdf.js is fast on text pages** (about 30 ms) but slow on image-heavy ones (p90 above 1 s). Images help most on cold items, heavy pages, scrubbing and the wall.
- **Drawing happens on the main thread.** pdf.js builds the drawing in its worker but executes it on the main thread, so prefetch renders compete with key presses. Image decoding (`createImageBitmap`, `img.decode()`) runs on decoder threads.

### 1.3 Problems found in the code

Line numbers are as of 2026-10-15; `feed.js`, `render.js`, `prefetch.js` and `cache.mjs` are being edited by other work, so the function names are the stable reference.

1. **A cache-key bug.** `cachedRender` (`render.js:95`) looks up `${id}|${k}|${crop}|${cols}`, but renders are stored under `keyOf(it, k)`, which adds `|${cropPad ?? ''}`. It never finds anything. So hovering the track always draws a fresh 700-px page with pdf.js (`quickPdf`), even for pages already rendered sharp, and it keeps up to 120 of those low-resolution canvases. Fix: `export const cachedRender = (it, k) => renders.get(keyOf(it, k)) || null;`. One line; the analysis builder ships it first.
2. **Derived work is thrown away.** Every visit re-runs `analyze()` on every page (a `getImageData` on the main thread, 6-21 ms a page here), re-learns the page shape and, the first time, lays the spread out twice (`feed.js:106`). The figure finder (`figpeek.js`) re-detects regions every session. Nothing survives a reload.
3. **Each page is cropped to its own ink.** Pages in a spread get different shapes, and a half-empty last page of a section is cropped tight and then scaled up to the full height, so its text looks larger than its neighbours'. One crop box for the body pages fixes this (section 5.4).
4. **The memory caches are sized for a small laptop.** 30 rendered pages at about 1,420 × 1,840 px are about 250-300 MB; 120 track renders about 180 MB. On a 64 GB machine that is a few percent of RAM. More RAM changes nothing unless these caps change, and the caps are not the bottleneck: rebuilding what was evicted is.
5. **The same PDF is parsed up to three times** (feed, wall, figure finder), each copy in its own worker. This is deliberate, to keep their work apart, but it triples parse time and memory for the current item.
6. **The 8 GiB disk cap now churns.** After 4 s on a scan, the feed asks the server for the whole book at 1000 px (the `book` prefetch in `feed.js`): up to 1,500 pages, about 50-100 MB a book. About 100 books fill the cache, and eviction then removes pages the reader will want again. With disk to spare, `STACKS_CACHE_MAX=100G` costs nothing.
7. **Prediction is right, but what it predicts is kept only briefly.** `planAround` renders the next 3 items' first spreads into memory, and the server fetches the next 25 items' bytes. When the reader skips faster than that (`j j j`), jumps (search, wall, related, random), or reloads, the work is gone or not done yet.

### 1.4 Redis, more memory, a bigger computer?

- **Redis would not help.** A cache hit already costs about 1 ms: macOS keeps the hot cache files in RAM, which is all an in-memory store would add, and Firefox's HTTP cache answers repeats without asking the server. The slow parts are elsewhere: the network on a cold miss (archive.org takes 1-3 s a page; arXiv is limited to 2 requests a second), pdf.js on the main thread (most of a second for a cold spread), and work that is redone every visit.
- **64 GB is plenty.** The app's working set is a few GB: the disk cache's hot files plus one Firefox tab. A machine with more RAM would sit idle. A faster CPU makes pdf.js somewhat faster, and more cores make a batch compile finish sooner, but neither removes the work.
- **What helps is doing the expensive work once, ahead of time, and storing the result as small files**: page images that decode off the main thread, a sprite for scrubbing, and the facts about each page. That is what a profile is.
- **The "predict what is needed in a few minutes" engine already exists in its simplest and best form: the lane order.** `state.order` says what comes next, and telemetry already sends it to the server as the warm hint. The compiler follows it: profiles for the next 50 items in idle time, display images for the next 10 items' opening spreads, and an overnight batch (`node compile.mjs`) for the corpus.

## 2. Conventions

- **Pages are 0-based `k` everywhere in profiles and augmentations**, as in the raster code (`state.start`). Printed page labels are a separate field. Text sent to a model keeps the summarizer's `[p. N]` markers with `N = k + 1`; the model answers with 1-based pages; the server stores `k = page - 1`. Flow documents (posts, web pages, texts) use stable pages (`data-vp`, about 280 words each) as `k`.
- **Boxes are `[x0, y0, x1, y1]`**, fractions of the full source page with 4 decimals, the same frame as `box` in `render.js` (whose objects are `{x0, y0, x1, y1}`; `profile-core.js` exports `toBox(a)` and `toArr(b)`).
- **Page sizes** are PDF points at scale 1 with the page's rotation applied (pdf.js `getViewport({scale: 1})`), or the full-size image's pixels for scans.
- **Identity.** A profile belongs to an item and a source: `pid = sha1(id + '|' + srcKey)`, where `srcKey` is the item's `url` for PDFs, posts, web pages and texts, and `ia:<identifier>` for scans. The client addresses profiles by item `id` (plus `src` when it shows the item from another source, as when an arXiv PDF is read as HTML); the server resolves the item in `corpus.json` with `enrich.json` merged (`loadCorpus()` in `60-warm.mjs`).
- **Versions.**
  - `schema`: the format's major version, 1 here. A reader treats any other value as no profile.
  - `gen`: the analysis code's generation, a constant `GEN` in `profile-core.js`, bumped whenever an algorithm in section 5 changes. A profile with `gen < GEN` is served with `stale: "gen"`; the client keeps using it and recompiles in idle time.
  - `rev`: incremented on every write of `profile.json` (an asset added, an upload merged). The ETag is `"<pid>.<rev>"`.
  - Augmentations carry `schema: 1` and `prompt`, an integer bumped when the prompt or output schema changes (section 8).
- **Producers** (`by`): `browser`, `playwright` (the same code in headless Chromium) or `poppler`. When two uploads disagree, `browser` and `playwright` outrank `poppler` at the same `gen`; a higher `gen` outranks both.
- **No silent failure, no hard dependency.** Every consumer works without a profile, with any field missing, and with any asset missing. A missing asset is a 404 and the client falls back to what it does today.

## 3. Storage, budget and eviction

### 3.1 Layout on disk

```
CACHE/profiles/
  index.json               {"v":1, "profiles": {"<pid>": {"id","kind","n","gen","rev","by","bytes","heavy","at","used","usedHeavy"}}}
  <pid>/profile.json       the analysis layer and the asset records (section 4)
  <pid>/text.txt           page-marked text: "[p. 1] …\n[p. 2] …"
  <pid>/s<j>.webp          sprite sheet j (0, 1, …), 1,024 pages a sheet
  <pid>/t<k>.webp|.jpg     thumbnail of page k
  <pid>/d<k>.webp|.jpg     display image of page k
CACHE/augment/<sha1(id + '|' + model)>.json   augmentation (section 8); never evicted, like summaries/
CACHE/augment/batches/<batchId>.json          Message Batches bookkeeping
```

- Every write goes to a temporary name and is renamed into place. `profile.json` is rewritten after each asset write.
- `index.json` is rewritten at most every 2 s (debounced), and on exit. If it is missing or unreadable at startup, `server/profile.mjs` rebuilds it in the background from the `profile.json` files (about 2,000 files, well under a second).
- `bytes` is the profile's total on disk, `heavy` the display images and thumbnails. `at` is when it was written; `used` and `usedHeavy` are when the profile and its heavy assets were last served (epoch seconds).

### 3.2 Budget per profile

`budgetFor(n) = min(12 MiB, 1 MiB + 70 KiB × n)`, from `profile-core.js`: 2.0 MiB for 15 pages, 3.05 MiB for 30, 7.8 MiB for 100, 12 MiB from 161 pages on.

- Scans store **no display images**, because the proxy already caches the Internet Archive's page images. Their profiles are the JSON, the sprite and the text: about 0.3-0.6 MB for a 350-page book.
- Posts, web pages and texts store the JSON and the text only.
- Display images are admitted by priority (section 6.4). An upload that does not fit is admitted only by evicting display images of lower priority in the same profile; otherwise the server answers 409 `budget`.

Estimated totals for the current corpus (1,948 items): 777 PDFs at about 1.5-3 MB, 437 scans at about 0.5 MB, 734 posts and pages at about 0.1 MB, so **about 1.5-2.5 GB**.

### 3.3 Eviction through the cache's LRU

Profiles take part in the existing least-recently-used eviction through a small, additive hook in `server/cache.mjs` (the analysis builder adds it; other routes are unaffected):

```js
// server/cache.mjs: other stores join the size cap and the LRU order.
const tenants = new Map();
/** registerTenant(name, { entries: () => [{ k, s, a }], remove: async (k) => bytesFreed })
 *  k: the tenant's own key; s: bytes; a: last access (epoch seconds). */
export function registerTenant(name, t) { tenants.set(name, t); }
export function tenantGrew() { evictSoon(); }
const tenantBytes = () => [...tenants.values()].reduce((n, t) => n + t.entries().reduce((m, e) => m + e.s, 0), 0);
```

- `evict()` compares `total + tenantBytes()` with `MAX`. It merges the tenants' entries, tagged with their tenant's name, into its LRU list, and calls `remove(k)` for tenant entries as it reaches them. `cacheState()` reports `tenantBytes`.
- `server/profile.mjs` registers the tenant `profiles` with **two entries per profile**: `<pid>:heavy` (display images and thumbnails, `a = usedHeavy`) and `<pid>:core` (everything else, `a = used + 30 days`). The bias makes the LRU drop the heavy assets of a profile long before its JSON, sprite and text, which are small and the most useful.
- Removing `heavy` deletes those files and drops their records from `profile.json` (`rev + 1`). Removing `core` deletes the directory.
- A soft cap `STACKS_PROFILE_MAX` (default 4 GiB) also applies: above it, `profile.mjs` evicts its own `heavy` entries, oldest first, even when the main cache has room.
- Augmentations in `CACHE/augment/` are never evicted: they cost money and are about 10 KB each.

## 4. The profile JSON (schema 1)

Field by field. Fields marked *optional* may be absent; consumers must cope. Unknown fields are ignored (a later minor addition does not bump `schema`).

```ts
type Box = [number, number, number, number];   // x0, y0, x1, y1: fractions of the page, 4 decimals

interface Profile {
  schema: 1;
  gen: number;                 // analysis generation (GEN in profile-core.js) that produced the analysis fields
  rev: number;                 // set by the server; ETag "<pid>.<rev>"
  id: string;                  // item id, e.g. "arxiv:1706.03762"
  pid: string;                 // sha1(id + '|' + srcKey), set by the server
  kind: 'pdf' | 'scan' | 'html' | 'web' | 'text';
  src: {
    url?: string;              // pdf, html, web, text
    ia?: string;               // scans
    size?: number;             // bytes of the source the analysis read (pdf)
    sha1?: string;             // sha1 of those bytes, computed by the server from its cached copy
    vpWords?: number;          // flow documents: words per stable page (280 today)
  };
  by: 'browser' | 'playwright' | 'poppler';
  at: string;                  // ISO time of the analysis
  ms: number;                  // analysis time, all pages, in ms
  n: number;                   // pages (stable pages for flow documents)

  pages: Page[];               // one per page, in order; [] for flow documents
  crop: {
    pad: number;               // default padding the producer used (0.012); clients apply their own (state.cropPad)
    groups: {                  // unpadded crop boxes; see section 5.4
      body?: Box; recto?: Box; verso?: Box; land?: Box;
    };
  };
  aspect: {
    page: number;              // median width / height of body pages, uncropped
    body: number;              // width / height of the body crop box at the default pad
  };
  layout: {
    alone: number[];           // pages shown by themselves at any pages-per-spread
    skip: number[];            // blank pages: a thin strip, never counted
    pair: 0 | 1 | null;        // facing pages: at 2 per spread, spreads start on pages with k % 2 === pair
    starts: { '2': number[]; '3': number[] };   // first page of every spread at 2 and 3 per spread
                               // (1 per spread: every page that is not in skip)
  };
  toc: Toc[];                  // [] when nothing was found
  ranges: {                    // inclusive [first, last] page, or null
    front: [number, number] | null;
    body: [number, number];
    refs: [number, number] | null;
    appendix: [number, number] | null;
    index: [number, number] | null;
  };
  text: {
    layer: 'pdf' | 'ocr' | 'html' | 'none';
    pages: number;             // fraction of pages with at least 30 words
    words: number;             // total words, -1 if unknown
  };
  labels: 'pdf' | 'ia' | null; // where the printed page labels in pages[].lab came from
  figures: number | null;      // regions found in pages[].fig; null when figure detection has not run
  hints: Hint[];               // analysis display hints (section 5.8)
  assets: Assets;              // set by the server from what has been uploaded
  stale?: 'gen' | 'src' | null;// added by the server on GET
}

interface Page {
  k: number;
  w: number; h: number;        // page size (section 2)
  rot?: 90 | 180 | 270;        // the PDF's /Rotate, when not 0
  ink: Box | null;             // unpadded ink box; null when blank; without the running head and foot (head, foot)
  head?: [number, number];     // PDFs: the running head left out of ink, [y0, y1] (section 5.4, step 0)
  foot?: [number, number];     // PDFs: the running foot (a page number, a repeated footer) left out of ink
  blank: boolean;
  gut: number | null;          // two-column gutter, x as a fraction of the page
  dens: number;                // ink fraction inside the ink box, 0-1
  cg: 'body' | 'recto' | 'verso' | 'land' | 'own';
  crop?: Box;                  // unpadded; only when cg === 'own'
  words: number;               // words in the text layer or OCR; -1 if unknown
  role: 'cover' | 'front' | 'toc' | 'body' | 'refs' | 'appendix' | 'index' | 'blank';
  lab?: string;                // printed page label: "iv", "17"
  fig?: Fig[];                 // absent until figure detection has run on this page
}

interface Fig {
  b: Box;
  kind: 'figure' | 'table' | 'plate' | 'algorithm';
  lab?: string;                // "Figure 3", "Table 2"
  cap?: string;                // caption, first 200 characters
}
// A figure's id is "<k>.<j>": page k, the j-th entry of pages[k].fig. Augmentations refer to figures by this id.

interface Toc { t: string; k: number | null; d: 0 | 1 | 2; src: 'outline' | 'latexml' | 'heads' | 'flow' }

type HintCode = 'one-up' | 'two-up' | 'three-up' | 'split-columns' | 'facing-pages' | 'skip-front'
              | 'landscape' | 'zoom-figures' | 'sequential' | 'ocr-poor';
interface Hint { code: HintCode; why: string }

interface Assets {
  H: number | null;            // full-page height in px at which the display images were rendered
  display: { [k: string]: { f: string; v: string; w: number; h: number; box: Box; H: number; pri: number; bytes: number } };
  thumb:   { [k: string]: { f: string; v: string; w: number; h: number; box: Box; bytes: number } };
  sprite: null | {
    ch: number; cw: number;    // cell size in px (120 × round(120 × aspect.body))
    cols: number;              // cells per row
    per: 1024;                 // pages per sheet
    box: 'crop' | 'full';      // cells show each page through cropOf(k) at the default pad, letterboxed in the cell
    sheets: { j: number; f: string; v: string; w: number; h: number; bytes: number }[];
  };
  text: null | { f: 'text.txt'; v: string; chars: number; bytes: number; src: 'pdf' | 'ocr' | 'flow' | 'pdftotext' };
  bytes: number;               // total on disk, JSON included
  budget: number;              // budgetFor(n)
}
```

`f` is the file name inside the profile's folder and `v` the first 10 hex digits of the sha1 of its bytes. A display image's `box` is the region of the page it shows; `w × h` its pixels; the full page would be `w / (box[2] - box[0])` by `h / (box[3] - box[1])` px.

An example, with illustrative values and the arrays cut short. The display image's `box` is the body box padded by 0.012 and then by the 0.02 bleed; at `H` = 1800 the full page is 1,391 × 1,800 px, so the image is 1,091 × 1,627 px. The sprite cell is `round(120 × 0.6662)` = 80 px wide, and with 15 pages the sheet is one row:

```json
{
  "schema": 1, "gen": 1, "rev": 7, "id": "arxiv:1706.03762", "pid": "3f1c…", "kind": "pdf",
  "src": { "url": "https://arxiv.org/pdf/1706.03762", "size": 2215244, "sha1": "9be0…" },
  "by": "browser", "at": "2026-10-16T09:12:03Z", "ms": 812, "n": 15,
  "pages": [
    { "k": 0, "w": 612, "h": 792, "ink": [0.1405, 0.0891, 0.8611, 0.9182], "blank": false, "gut": null, "dens": 0.081,
      "cg": "body", "words": 512, "role": "body", "lab": "1" },
    { "k": 2, "w": 612, "h": 792, "ink": [0.1716, 0.0821, 0.8301, 0.9192], "blank": false, "gut": null, "dens": 0.134,
      "cg": "body", "words": 214, "role": "body", "lab": "3",
      "fig": [{ "b": [0.3021, 0.0807, 0.6973, 0.6211], "kind": "figure", "lab": "Figure 1",
                "cap": "Figure 1: The Transformer - model architecture." }] }
  ],
  "crop": { "pad": 0.012, "groups": { "body": [0.1405, 0.0815, 0.8611, 0.9212] } },
  "aspect": { "page": 0.7727, "body": 0.6662 },
  "layout": { "alone": [], "skip": [], "pair": null, "starts": { "2": [0, 2, 4, 6, 8, 10, 12, 14], "3": [0, 3, 6, 9, 12] } },
  "toc": [ { "t": "1 Introduction", "k": 0, "d": 0, "src": "heads" }, { "t": "3 Model Architecture", "k": 1, "d": 0, "src": "heads" } ],
  "ranges": { "front": null, "body": [0, 9], "refs": [10, 11], "appendix": [12, 14], "index": null },
  "text": { "layer": "pdf", "pages": 1, "words": 6012 },
  "labels": "pdf", "figures": 6, "hints": [],
  "assets": {
    "H": 1800,
    "display": { "0": { "f": "d0.webp", "v": "a1b2c3d4e5", "w": 1091, "h": 1627, "box": [0.1085, 0.0495, 0.8931, 0.9532], "H": 1800, "pri": 90, "bytes": 168311 } },
    "thumb": {},
    "sprite": { "ch": 120, "cw": 80, "cols": 15, "per": 1024, "box": "crop",
                "sheets": [ { "j": 0, "f": "s0.webp", "v": "0f9e8d7c6b", "w": 1200, "h": 120, "bytes": 19650 } ] },
    "text": { "f": "text.txt", "v": "5a4b3c2d1e", "chars": 41872, "bytes": 42210, "src": "pdf" },
    "bytes": 251204, "budget": 2123776
  }
}
```

## 5. Analysis: how each field is computed

All pure computation lives in **`ui/js/profile-core.js`**: no DOM, no imports, so the browser loads it as an ES module and Node imports it from `compile.mjs`, `server/profile.mjs` and the tests. It exports `SCHEMA`, `GEN`, `HINTS`, `budgetFor`, `analyzeLum`, `bandTexts`, `bandKey`, `pageRoles`, `runningBands`, `cropGroups`, `cropOf`, `layoutOf`, `spreadStarts`, `snapStart`, `spreadAt`, `tocFromHeads`, `hintsOf`, `finalize`, `validate`, `toBox`, `toArr`. `render.js`'s `analyze()` is refactored to call `analyzeLum`, so the feed without a profile and the compiler give identical boxes.

### 5.1 Ink, blank pages and gutters: `analyzeLum(lum, W, H)`

Input: the page's luminance (0-255) on a grid 240 px wide. It is the existing algorithm in `render.js`, moved:

- The background is the 80th percentile of luminance; ink is darker than `bg - max(45, 0.25 × bg)`.
- Near-solid dark bands at the borders (rows or columns more than 35% ink within the outer 12%) are scanner beds and page edges; step past them, then ignore a further 1.5% (sides) and 1% (top and bottom).
- **Blank** when ink covers under 0.25% of the remaining area.
- The **ink box** trims rows and columns with less than 0.4% ink. It is returned **unpadded**.
- The **gutter** is the longest ink-free vertical run in the middle third (38-62%) of the box, if at least `max(2 px, 1.2% of the box width)`.
- `dens` is ink pixels over the ink box's area.
- **Bands** (born-digital pages, `analyzeLum(lum, W, H, {scan: false, bands: true})`, asked for by the compilers only, so the feed's own analysis costs nothing more): `bands: {top, bot, both}`. `top` is the first run of ink rows of the ink box, its inner gaps under 1.5% of the page (a rule just under a header's text belongs to it), followed by a clear gap of at least 1.5% and then more ink, and at most 6% of the page high: `{y0, y1, next, ink}`, where `next` is where the rest of the page starts and `ink` the ink box without the band (columns trimmed again, margin strips dropped again). Failing a 1.5% gap, a 1% gap gives a band marked `tight` (a figure set close under the header). `bot` is the same from the bottom (`prev`: where the rest ends); `both` is the ink box without either. They are the candidates for a running head and foot; section 5.4 decides.

Sources of the grid:

| Producer | Pages | Source |
|---|---|---|
| browser, playwright | PDF | pdf.js render at 400 px tall into a canvas, drawn into a 240-px-wide canvas, `getImageData` |
| browser, playwright | scan | the Internet Archive's `w200` page image through `/proxy` (the track already prefetches them), drawn 240 px wide |
| poppler | PDF | `pdftoppm -gray -scale-to-y 400 -scale-to-x -1` writes PGM files; Node reads the binary PGM (a short text header, then one byte per pixel) and box-averages to 240 px wide |

### 5.2 Text facts

- **PDFs, in the browser:** `page.getTextContent()`. `words` counts `\S+` runs. A line's size is `hypot(transform[2], transform[3])`; the **body size** is the median size weighted by characters over the document. **Heading candidates** are lines that are the first or second line of a block, up to 90 characters, and either at least 1.15 × the body size or in a font whose name matches `/Bold|Black|Semibold|Heavy/`, and that start with a numbering pattern (`/^(\d+(\.\d+){0,2}|[A-H](\.\d+)*|[IVX]+)\.?\s+\p{Lu}/u`) or are one of Abstract, Introduction, Background, Related Work, Method(s), Results, Discussion, Conclusion(s), Limitations, References, Bibliography, Acknowledg(e)ments, Appendix.
- **PDFs, poppler:** `pdftotext -layout file.pdf -` splits pages at form feeds (`\f`). Heading candidates come from the same patterns on short lines, without sizes.
- **Band text** (PDFs): `bandTexts(bands, lines)` gives each band of section 5.1 the text in it, from the page's lines with their places (`{t, x, y0, y1}`, fractions of the page, y down): pdf.js lines through the page's viewport (baseline to 0.75 × the size above it), or `pdftotext -bbox-layout` lines for poppler. A line belongs to a band when it reaches into the band (±0.4%) or lies beyond it toward the page's edge, with its middle on the band's side of the gap (a thin page number or rule may not show on the grid at all). The band gets `t` (its lines, left to right, top to bottom) and `ty` (the top of its first line). `bandKey(t)` is what must match for two bands to repeat: letters, digits as `#` (page numbers), a roman numeral at either end as `#`, everything else dropped.
- **Scans:** `GET /ocr/text?ia=` (already served by `50-ocr.mjs`) gives each page's text; `words` from it. Printed labels from `GET /ocr/labels?ia=`.
- **Flow documents:** `prepareFlow()`'s `texts` (stable pages) and `outline`.
- `text.layer` is `pdf` when at least 30% of a PDF's pages have 30 or more words, `none` for a PDF below that, `ocr` for scans, `html` for flow documents.

The page-marked text (`text.txt`) is built from the same sources: `[p. N] ` followed by the page's text, one page per line, at most 3 MB.

### 5.3 Roles and ranges: `pageRoles(pages, heads, kind)`

Applied in this order; the first rule that matches sets a page's role:

1. `blank` for blank pages.
2. **Scans:** page 0 is `cover`. **Front matter** is every page before the first page whose printed label is the arabic numeral 1; without labels, before the first heading matching `/^(chapter|part)\s+(1|i|one)\b|^introduction$/i` within the first 15% of pages. A front page with a heading `/^(contents|table of contents)$/i` is `toc`. Papers have no front matter.
3. **References** start on the first page at or after 40% of the document with a heading or a line of at most 40 characters matching `/^(\d+\.?\s*)?(references|bibliography|works cited|literature cited)\b/i`.
4. **Appendix** starts on the first page after the start of the references (or after 50% of the document when there are none) with a heading matching `/^(appendix|appendices|supplementary (material|information))\b/i`, or a lettered heading (`/^[A-H](\.\d+)*\s+\p{Lu}/u`) after the references. The references end on the page before.
5. **Index** (books): a run of pages at the end where at least 40% of lines match `/,\s*\d+([–-]\d+)?(,\s*\d+([–-]\d+)?)*$/`.
6. Everything else is `body`.

`ranges` are the first and last pages of each role. `ranges.body` runs from the first body page to the last body page before the references or appendix.

### 5.4 Crop groups: `cropGroups(pages, kind)`

Goal: body pages share one crop box, so a spread's pages have the same shape and the same text size; pages that would lose ink under that box get their own; landscape pages form their own group.

0. **Running heads and feet** (PDFs; `runningBands(pages)`, in `finalize` before the groups): a page's top (bottom) band of section 5.1 is left out of its ink box when it repeats, so the group box leaves it out and `cropOf`'s rule of never cutting a page's ink does not take it back in. It is looked at in three scopes, all pages, the even pages and the odd pages (journals alternate: "PROPER LOCAL SCORING RULES 3" on odd pages, the authors on even ones), each over the portrait, non-blank pages with a group role:
   - the **slot** is the place (the band text's top, ±0.5% of the page height) where the most bands of the scope are; it counts only when at least half the scope's pages have a band there;
   - a band in the slot is **running** when its `bandKey` is that of another band in the slot (a paper's one running head; a book's chapter head on the pages of its chapter), or, except on the first page, when the slot holds at least 3/4 of the scope and the band has its shape: the outer edge, and the inner edge or the start of the rest of the page, within 0.5% of the slot's medians (a book's section head seen on one page: the same line and rule, other words). A `tight` band counts only with both its edges within 0.5% of the slot's.
   - Never running: a band with no text (scanned PDFs, a rule alone), a page's own header (a first page's journal line, a conference footer), section titles, figures that reach the top, a header on only some pages (none of these is in a slot, or repeated), landscape pages, and scans (their OCR text has no places, and geometry alone is too risky).
   - A running page's `ink` becomes the band's `ink` (or `both`), and `head` / `foot` record the bands left out. A page that is nothing but its head and foot keeps them.
1. **Candidates:** pages that are not blank, whose role is `body`, `refs`, `appendix` or `index`, whose `w / h` is within 4% of the median `w / h` of such pages, and whose `dens` is under 0.6 (not a full-bleed image).
2. **Groups:**
   - PDFs: one group, `body`.
   - Scans with at least 8 candidates of each parity: `recto` and `verso` by `k % 2` (scanned margins alternate); otherwise `body`.
   - Pages whose `w / h` is more than 1.15 × the median: `land`, if there are at least 2; otherwise each is `own`.
3. **A group's box** is the 10th percentile of its candidates' `x0` and `y0` and the 90th percentile of their `x1` and `y1` (the union with outliers ignored), from at least 3 pages; with fewer, the plain union.
4. **Membership:** every non-blank page joins its group if its ink box fits inside the group box enlarged by 0.01 on each side. Title pages and short last pages usually fit. A page that does not fit gets `cg: 'own'` and `crop` = the union of the group box and its ink box, so nothing is ever cut off.
5. `cropOf(P, k, pad)` gives the box to show: `own` pages' `crop`, else their group's box, enlarged by `pad` (the reader's `state.cropPad`, default 0.012) and clamped to `[0, 1]`. Blank pages have no box.

`aspect.body` is the body box's width over its height at the default pad, times the median page `w / h`.

### 5.5 Layout: `layoutOf(P)` and `spreadStarts(P, per)`

- `skip`: blank pages.
- `alone`: landscape pages in a portrait document (`w / h` above 1.15 × the median); `own` pages whose crop is more than 1.3 times as wide (relative to its height) as the body box (wide tables, fold-outs); and, for scans, page 0.
- `pair`, for scans with printed labels: `d` is the most common value of `(k - L) mod 2` over pages with a numeric label `L`. Even-numbered pages are versos, the left half of an open book, so spreads start on pages with `k % 2 === d`: `pair = d`. Scans without labels: `pair = 1` (the cover alone, then pairs). PDFs: `null`.
- **`spreadStarts(P, per)`** walks the pages:

  ```
  starts = []; k = 0
  while k < n:
    starts.push(k); count = 0
    if per == 2 and pair != null and k % 2 != pair:   # restore facing-page parity
      k += 1; then also consume any skip pages; continue
    while k < n and count < per:
      if k in skip: k += 1; continue                 # rides along, not counted
      if k in alone: if count == 0: k += 1; count = per   # alone fills the spread
                     else: break                     # stop before it
      else: k += 1; count += 1
    while k < n and k in skip: k += 1                 # trailing blanks join this spread
  ```

  `layout.starts` stores the result for 2 and 3 pages per spread (for 1, every page that is not in `skip` starts a spread). A 400-page book needs about 2 KB for both.
- `snapStart(P, s, per)` is the largest start not after `s` (binary search); `spreadAt(P, s, per)` lists the pages from `s` up to the next start.

"Screen count" in the reader's request is read as pages per spread, 1 to 3, which is what `state.per` means. The same starts serve the laptop and the 4K screen; only how many fit differs.

### 5.6 Table of contents

The first source that gives at least 3 entries wins:

1. **The PDF outline**, through `pdfOutline()` in `docs.js` (depth 0-1, up to 80 entries, pages resolved): `src: 'outline'`.
2. **arXiv LaTeXML sections**, server-side in `POST /profile`: when the item is an arXiv paper and `https://arxiv.org/html/<id>` (or the ar5iv fallback) is in the disk cache (the figure route usually fetched it already), the server reads the `h2`/`h3` elements with class `ltx_title_section` / `ltx_title_subsection`, strips tags, and maps each title to a page by finding `skel(title)` in `skel(page text)` from `text.txt`, searching forward from the previous section's page. Unmatched titles keep `k: null`. `src: 'latexml'`. (`skel` is the letters-and-digits normalizer exported by `30-summarize.mjs`.)
3. **Detected headings** (section 5.2), deduplicated, numbered or named ones only: `src: 'heads'`.
4. **Flow documents:** `prepareFlow()`'s outline (h1-h4): `src: 'flow'`.

Scans get no table of contents from analysis in this version; the augmentation's section map fills that gap (section 8).

### 5.7 Figures

When `ui/js/features/figpeek.js` is loaded, the compiler calls its exported `regionsOf(it, k)` (figpeek's own detector and cache, unchanged) in its lowest-priority pass, for pages with role `body` or `appendix` and `dens` of at least 0.02, at most 60 pages an item. Each region becomes a `Fig` (`b` from its `x0..y1`, `kind`, `lab` and `cap` from its caption, cut to 200 characters). `figures` counts them, and stays `null` until the pass has run. The poppler producer leaves it `null`.

### 5.8 Analysis hints: `hintsOf(P)`

| Code | When |
|---|---|
| `one-up` | median page `w / h` at least 1.25 (slides, landscape reports) |
| `facing-pages` | a scan with `pair` set and at least 70% of pages labelled |
| `split-columns` | at least 60% of body pages have a gutter |
| `skip-front` | front matter of at least 4 pages |
| `landscape` | at least one `alone` landscape page |
| `ocr-poor` | a PDF with `text.layer: 'none'`, or a scan without OCR words |

`zoom-figures`, `sequential`, `two-up` and `three-up` come only from the augmentation. `HINTS` in `profile-core.js` lists all ten codes with a one-line meaning; both layers use it.

## 6. Assets

### 6.1 Kinds

| Kind | Size | Format | For | Who makes it |
|---|---|---|---|---|
| `display` | full-page height `H` = the producer's render height (`RENDER_H` in `render.js`: 1,400-2,200 px; about 1,840 px on the 4K screen), cropped to `cropOf(k)` plus a 0.02 bleed, or exactly the shown box for write-backs | WebP, quality 0.8; JPEG 0.85 when the browser cannot encode WebP; JPEG 80 from poppler | page turns and cold item switches | write-back of the feed's own renders; batch |
| `sprite` | cells 120 px tall, `round(120 × aspect.body)` wide; one row when `n ≤ 32`, else 32 columns; 1,024 pages a sheet | WebP, quality 0.6 (JPEG 0.7 fallback) | track scrubbing, the page strip, overview grids, wall hover | browser in idle time; playwright |
| `thumb` | 200 px wide, cropped to `cropOf(k)` | WebP 0.7 | wall contact sheets and larger hovers | browser in idle time, current item only; playwright |
| `text` | — | UTF-8, `[p. N]` markers | augmentation, find, feeds | browser; playwright; poppler (`pdftotext`) |

A sprite cell shows page `k` through `cropOf(P, k, 0.012)`, scaled to the cell's height (or width, if wider) and centred on white. For scans, the cells are drawn from the `w200` page images.

### 6.2 Where cells are

```
j = floor(k / 1024); i = k % 1024
x = (i % cols) × cw;  y = floor(i / cols) × ch;  sheet = sprite.sheets[j]
```

`spriteCell(P, k, displayHeight)` in `ui/js/profile.js` returns the CSS for a cell shown `displayHeight` px tall: `background-image`, `background-size: (sheet.w × s)px (sheet.h × s)px` and `background-position: (−x × s)px (−y × s)px`, with `s = displayHeight / ch`.

### 6.3 Producers

**In the browser** (`ui/js/features/compile.js`), in idle time:

1. **Core analysis** (sections 5.1-5.6), one page per idle callback, using its own pdf.js document on its own worker (`new lib.PDFWorker({name: 'compile'})`, `disableFontFace: true`, as the wall does), so it never queues behind the feed's renders. Then `POST /profile` and `POST /profile/text`.
2. **Sprite**: each page rendered about 120 px tall straight into its cell of a sheet canvas (5-13 ms a page measured), 8 pages per idle callback; then `toBlob` and upload.
3. **Write-back**: after `spread:settled`, each panel on screen that pdf.js rendered (`pnl.src === 'pdfjs'`) for a profiled item without a display image for that page is encoded with `canvas.toBlob(cb, 'image/webp', 0.8)` (the encoding runs off the main thread) and uploaded with its own `box` (the box shown) and `H = RENDER_H`. The same is done for renders `planAround` made for the next items (`renderedNow(x, k)` from `render.js`), so prefetch work becomes durable.
4. **Figures** (section 5.7), then **thumbnails** for the current item.

Scheduling rules:

- `requestIdleCallback(step, {timeout: 2000})`; a unit starts only if `deadline.timeRemaining() > 8` ms. Any `nav` event pauses compiling until 300 ms after the next `spread:settled`.
- Order: the current item (all levels), then the next 3 items in `state.order` (core and sprite), then the next 4-10 (core), then the next 11-50 (core, PDFs only, and only when the server reports the PDF cached via `POST /cached`).
- Scans: core and sprite only for the current item and the next 3, once their `w200` images are cached (the track hover already asks the server for them); compile asks the server to prefetch them at priority 25 when they are not.
- Flow documents: core (n, words, outline, text) on `item:settled`, from the `openDoc` result the feed already has.

**Batch** (`compile.mjs`):

```
node compile.mjs [--lanes ai-safety,llm] [--items 200] [--ids id1,id2] [--engine auto|playwright|poppler]
                 [--assets core|full] [--height 1800] [--jobs 3] [--port 4747] [--force] [--dry]
```

- It talks to a running server (`--port`) so budgets, the index and eviction apply; if none answers on `/status`, it starts `node server.mjs --port <free port>` as a child for the run.
- Items come in the reader's order first (`CACHE/warm-hint.json`, as `planWarm()` uses it), then by relevance; `--ids` overrides. Items with a current profile (`gen === GEN`, same `src.sha1`) are skipped unless `--force`.
- **`--engine playwright`** (chosen by `auto` when `playwright` resolves): headless Chromium opens `http://127.0.0.1:<port>/?compile=batch`, waits for `window.__stacksCompile`, and calls `__stacksCompile(id, {assets})` for each item, `--jobs` pages at a time. Same code, same output as the browser. `--assets full` adds display images for pages with priority 50 or more (section 6.4) at `--height`.
- **`--engine poppler`** (chosen by `auto` when `pdftoppm` is on the PATH): PDFs only. Fetch the PDF through `/proxy` (so it lands in the cache); `pdfinfo -f 1 -l <n>` for page sizes and rotation; `pdftoppm -gray -scale-to-y 400 -scale-to-x -1` for analysis; `pdftotext -layout` for words, headings and `text.txt`; `pdftotext -bbox-layout` for the places of the lines in the running heads and feet (section 5.2); `pdftoppm -jpeg -jpegopt quality=80 -r <dpi> -x -y -W -H -f k -l k` for cropped display images of priority 50 and up. No sprite, no thumbnails, no figures (`figures: null`), `by: 'poppler'`. The browser fills in the rest later.
- **Neither available:** print "Nothing to do: the app compiles in idle time. Optional: npm i -g playwright && npx playwright install chromium, or brew install poppler." and exit 0.
- Expected speed (measured parts): poppler analysis 16-42 ms a page on text papers, display images 134 ms a page; with 3 jobs, the 777 PDFs (about 23,000 pages) take roughly 15-30 minutes plus downloads (arXiv allows 2 requests a second, so 677 arXiv PDFs need at least 6 minutes on a cold cache).

### 6.4 Display image priorities

| Priority | Pages |
|---|---|
| 90 | the opening spread (`startOf(i)` and the `per` pages after it, at the reader's usual `per`) |
| 80 | skim path stops (from the augmentation, when present) |
| 70 | best pages: `it.best`, the summary's key point pages |
| 60 | pages the reader has looked at (write-back) |
| 50 | pages with figures |
| 10 | any other page (`--assets full` with `--all-pages` only) |

The server keeps the highest-priority set that fits the profile's budget (section 3.2).

## 7. HTTP API

All routes are on the loopback server (`HOST` 127.0.0.1). `id` is a corpus item id; an unknown id is 400 `{"error": "unknown id"}`. `src`, when given, must be a URL the proxy allows (`cache.allowed`). JSON errors have the shape `{"error": "<code>", ...}`.

### 7.1 Profiles (`server/routes/90-profile.mjs`, analysis builder)

**`GET /profile?id=<id>[&src=<url>]`**
- 200: the `Profile`, with `stale` set: `"gen"` when `gen < GEN`, `"src"` when the cached source's bytes no longer match `src.sha1`, else `null`. Headers: `Cache-Control: no-cache`, `ETag: "<pid>.<rev>"`; `If-None-Match` gives 304.
- 404: `{"error": "none"}` when there is no profile.

**`GET /profiles?ids=<id>,<id>,…`** (up to 200 ids): the short form for the wall and for prefetch.
- 200: `{"<id>": Brief | null}`, where `Brief = {pid, rev, gen, kind, n, aspect: {page, body}, crop: {groups}, layout: {pair}, sprite: Assets['sprite'], display: number[] /* pages with a display image */, stale}`.

**`POST /profile`** (JSON, up to 4 MB): an analysis upload.
- Body: a `Profile` without `rev`, `pid`, `assets` and `stale` (the server sets them), plus optional `"force": true`.
- The server validates with `validate()` from `profile-core.js` (types, `n` matching `pages.length` for rasters, every `k` in range, boxes inside `[0, 1]` with `x0 < x1` and `y0 < y1`, `head` and `foot` spans in `[0, 1]` outside the ink box), recomputes `pid`, computes `src.sha1` from its own cached copy of the source when it has one, adds LaTeXML sections (section 5.6), and merges: the upload replaces the stored analysis unless the stored one has a higher `gen`, or the same `gen` and a higher-ranked `by` (409 `{"error": "older", "have": {"gen", "by"}}` unless `force`). Assets are kept; display images whose `box` no longer contains `cropOf(k)` at the default pad are dropped.
- 200: `{"ok": true, "rev", "profile"}`. 400: `{"error": "invalid", "detail"}`.

**`POST /profile/text?id=`** (`text/plain; charset=utf-8`, up to 3 MB): replaces `text.txt`. 200: `{"ok": true, "chars", "bytes"}`. 404 when there is no profile yet.

**`POST /profile/asset?id=&size=display|thumb|sprite&k=<page>|j=<sheet>&w=&h=&box=x0,y0,x1,y1&H=&pri=`** with the image bytes as the body (`image/webp` or `image/jpeg`; the server checks the magic bytes: `RIFF….WEBP` or `FF D8 FF`).
- Limits: display 2 MB, thumb 64 KB, sprite 2 MB. For a sprite sheet, `cw`, `ch` and `cols` are also given as query parameters, and the first sheet's values must match later sheets'.
- 200: `{"ok": true, "f", "v", "bytes", "used", "budget"}`.
- 409: `{"error": "budget", "used", "budget", "minPri"}` when the image does not fit and nothing of lower priority can make room.
- 413 too large, 415 wrong type, 404 no profile (post the analysis first).

**`GET /profile/asset?id=&size=display|thumb|sprite&k=|j=&v=`**: the image.
- When `v` matches the stored file: `Cache-Control: public, max-age=31536000, immutable`. Otherwise (or without `v`): `Cache-Control: no-cache`. The client always takes `v` from the profile.
- 404 when the asset is gone (evicted, never made). Serving a display image or thumbnail updates `usedHeavy`; serving anything updates `used`.

**`POST /profile/forget {"id"}`**: deletes the profile (tests; "recompile this item"). 200 `{"ok": true}`.

**`GET /status`** gains `profiles: {count, bytes, max, heavyBytes, compiledToday, byEngine: {browser, playwright, poppler}, stale}`.

### 7.2 Augmentation (`server/routes/91-augment.mjs`, augmentation builder)

**`GET /augment?id=&model=`**: the cached augmentation for that model (default `STACKS_MODEL`, Haiku), or `null`. Never calls the model. The response includes `stale: true` when the profile's `src.sha1` differs from the augmentation's `srcSha1`, or its `prompt` is older than the current prompt version.

**`POST /augment`** `{id, model?, force?, text?, title, authors, year, lane, laneId, kind}`: makes an augmentation, streaming NDJSON in the shape `/summarize` uses:
- `{"type": "partial", "aug": {...}}` lines as the JSON streams (quotes not yet verified are marked `ok: null`);
- then `{"type": "final", "aug": {...}, "spend": {...}}`, or `{"type": "error", "error": "...", "code": "no_key" | "no_sdk" | "budget" | "refusal" | "no_text" | "error", "spend": {...}}`.
- A request for an item already being augmented joins that job, as summaries do. `text` is optional (section 8.2).

**`GET /augment/stream?id=&model=`**: attaches to a job in flight and streams its partials and final, or sends the cached final at once; 404 `{"error": "none"}` when there is neither. This lets a reloaded page or a second view pick up a running job.

**`POST /augment/batch`** `{ids?: string[], lanes?: string[], limit?: number, model?: string, maxUsd?: number, dry?: boolean}`: submits a Message Batch (section 8.6).
- 200: `{"batch": "<batchId>" | null, "n", "est", "skipped": [{"id", "why"}]}`; with `dry`, nothing is submitted.

**`GET /augment/batch?id=`**: `{id, status: "submitted" | "in_progress" | "ended" | "canceled", counts: {succeeded, errored, expired, canceled, processing}, est, cost, at}`. **`GET /augment/batches`**: the list.

**`GET /status`** gains `augment: {made, cached, batches: {active, items}, mockAI}`.

## 8. Augmentation

### 8.1 What it is, and what it is not

One model call per item writes the whole layer: the skim path, skip ranges, section map, glossary, margin notes, figure explanations, display hints, hook and tags. To avoid duplicating work done elsewhere:

- **The summary** (`30-summarize.mjs`) keeps the verdict, gist, claim, method, evidence, limitations and key points. The augmentation does not repeat them; its prompt includes the cached summary's gist and key points with "complement this; do not repeat it".
- **The feeds' highlights** (`data/highlights.json`, built by the feeds workflow; see `data/highlights.sample.json`: per item `claim`, `passage`, `number`, each with a verified `quote`, a `loc` and a `why`) stay the source of pull quotes, findings and numbers. The augmentation reads the item's entry when present and passes its passages to the model as candidate skim stops; it never writes highlights.
- **`it.hook`** from `enrich.json` wins over the augmentation's `hook` wherever both exist.

### 8.2 Text

The server builds the model's text in this order (`textFor()` in `server/augment.mjs`):

1. `text` in the request body, when the client sent one (whole document, `[p. N]` markers).
2. The profile's `text.txt`.
3. PDFs: `pdftotext -layout` on the cached PDF when `pdftotext` is on the PATH; pages split at form feeds.
4. Scans: the per-page OCR text from the server's own `GET /ocr/text?ia=`.
5. Posts and web pages: the cached source with tags stripped and cut into roughly 280-word pages in block order (`textSrc: 'html-approx'`; pages are hints, quotes do the anchoring).
6. Otherwise the error `no_text`.

The text is capped at `STACKS_AUG_CHARS` (default 90,000 characters, about 25,000 tokens, which keeps Haiku 5.5 on its lower rate card for prompts up to 100,000 tokens). Longer documents keep the first 30,000 characters, then each later page's first 600 characters (its headings), then fill the rest with evenly spaced whole pages. `coverage` records the fraction sent.

### 8.3 The call

```js
// server/augment.mjs, through app.ai (section 10.3)
const params = {
  model,                                   // default 'claude-haiku-5-5'
  max_tokens: 12000,                       // adaptive thinking is on by default on Haiku 5.5 and counts toward this
  output_config: { effort: 'low', format: { type: 'json_schema', schema: AUG_SCHEMA } },
  messages: [{ role: 'user', content: [
    { type: 'text', text: docBlock(meta, text) },        // same <document> block the summarizer uses
    { type: 'text', text: facts(profile, summary, highlights) + '\n\n' + AUG_PROMPT },
  ] }],
};
```

- Streamed through `app.ai.generate()` from `30-summarize.mjs`, which already handles mock mode, the refusal fallback for Opus, Sonnet and Fable (Haiku has no server-side fallback), and streaming text deltas. Read content blocks by type, not position: Haiku 5.5 can return `thinking` blocks first.
- Citations are not used: they cannot be combined with `output_config.format`. Quotes are verified on the server instead, as for summaries.
- `facts()` lists: pages and kind; the table of contents with pages (up to 60 entries, `[p. N]` numbering); the reference and appendix ranges; the detected figures as `id | page | label | caption (first 160 characters)` (up to 30); the summary's gist and key points if cached; the item's highlights if present.

`AUG_PROMPT`:

> You are preparing a reading guide for a researcher who skims many documents on a large screen and decides in seconds where to look. The document above has page markers [p. N]. Using the document and the facts above, write:
>
> 1. plan: a skim path of 4-8 stops in page order. Each stop is a page worth looking at and why, in under 18 words: the main claim, the key figure or table, the method in a nutshell, the main result, the most important limitation, the conclusion. Prefer pages where the point is visible (a figure, a results table, a summary box). Never stop in the references. When one sentence on that page carries the point, copy it as quote; otherwise leave quote empty.
> 2. skip: page ranges a skimmer can safely skip (boilerplate, long proofs, hyperparameter tables, references, acknowledgements), each with a short reason.
> 3. sections: the sections in order, with the first page of each and one line (under 20 words) on what the section establishes, not what it "discusses". If a table of contents is given above, use exactly its titles and pages.
> 4. glossary: 3-12 terms a reader new to this area needs, each defined in under 20 words as this document uses it, with the page where it is defined or first used, and the defining sentence copied as quote when there is one.
> 5. notes: up to 12 margin notes, at places where a careful reader would want a short explanation: an unstated assumption, notation, a step that is easy to misread, a number that needs context. Anchor each note with one sentence copied from that page as quote, and say in under 35 words something the sentence does not say. Do not restate the sentence.
> 6. figures: for each figure id listed above (and only those), what it shows and what to look for, each in under 20 words.
> 7. display: up to 3 codes from the list in the schema that would help show this document, each with a reason.
> 8. hook: one specific line under 110 characters that would make this reader want to open it, without hype. tags: 3-6 lowercase topic tags.
>
> Every quote is checked character for character against the text, and a note whose quote cannot be found is thrown away. Copy quotes exactly: no paraphrase, no joined sentences, no ellipses, no [p. N] markers. Be faithful to the text and do not invent content.

`AUG_SCHEMA` (what the model returns; pages are 1-based, from the markers). Bounds are stated in descriptions and enforced by the server after parsing, because structured-output schemas do not reliably enforce numeric bounds:

```js
const page = { type: 'integer', description: 'page number from the [p. N] markers' };
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const list = (items, description) => ({ type: 'array', items, description });
export const AUG_SCHEMA = obj({
  hook: { type: 'string', description: 'One line, under 110 characters.' },
  tags: list({ type: 'string' }, '3-6 lowercase topic tags.'),
  minutes: { type: 'integer', description: 'Minutes to follow the skim path.' },
  plan: list(obj({ page, why: { type: 'string' },
    kind: { type: 'string', enum: ['start', 'claim', 'method', 'result', 'figure', 'limit', 'conclusion', 'example', 'definition'] },
    quote: { type: 'string', description: 'One verbatim sentence from that page, or "".' } }), '4-8 stops in page order.'),
  skip: list(obj({ from: page, to: page, why: { type: 'string' } }), 'Ranges safe to skip.'),
  sections: list(obj({ title: { type: 'string' }, page, depth: { type: 'integer', enum: [0, 1, 2] },
    summary: { type: 'string', description: 'Under 20 words.' } }), 'Sections in order.'),
  glossary: list(obj({ term: { type: 'string' }, definition: { type: 'string' }, page,
    quote: { type: 'string', description: 'The defining sentence, verbatim, or "".' } }), '3-12 terms.'),
  notes: list(obj({ page, quote: { type: 'string' }, note: { type: 'string', description: 'Under 35 words.' } }), 'Up to 12.'),
  figures: list(obj({ fid: { type: 'string' }, what: { type: 'string' }, look: { type: 'string' } }), 'Only the listed figure ids.'),
  display: list(obj({ code: { type: 'string', enum: HINT_CODES }, why: { type: 'string' } }), 'Up to 3.'),
});
```

### 8.4 Checks and the stored form

The server turns the model's answer into the stored augmentation, `CACHE/augment/<sha1(id + '|' + model)>.json`:

```ts
interface Augment {
  schema: 1; prompt: number;   // prompt version (bump with any change to AUG_PROMPT or AUG_SCHEMA)
  id: string; model: string;   // "claude-haiku-5-5", or "… (mock)" in mock mode
  family: string;              // familyOf() from 30-summarize.mjs
  at: string; cost: number; batch?: true;
  textSrc: 'client' | 'profile' | 'pdftotext' | 'ocr' | 'html-approx';
  textChars: number; coverage: number; srcSha1: string | null; n: number;
  hook: string; tags: string[]; minutes: number;
  plan: { k: number; why: string; kind: string; quote?: string; ok?: boolean }[];
  skip: { a: number; b: number; why: string }[];
  sections: { t: string; k: number; d: 0 | 1 | 2; sum: string; toc: boolean }[];
  glossary: { term: string; def: string; k: number; quote?: string; ok: boolean }[];
  notes: { k: number; quote: string; note: string; ok: true }[];
  figs: { fid: string; k: number; what: string; look: string }[];
  display: { code: HintCode; why: string }[];
  dropped: { notes: number; quotes: number; figs: number; stops: number };
  partial?: true; truncated?: true;
}
```

Checks, with `skel()`, `indexText()` and `findQuote()` from `30-summarize.mjs` (section 10.3):

- **notes:** keep only notes whose quote is found; `k` = the page where it was found, minus 1. At most 12, at most 4 per page. Others are counted in `dropped.notes`.
- **plan:** clamp `k` to `[0, n − 1]`; sort by `k`; drop stops on the same page as an earlier stop, and stops inside `ranges.refs` or a skip range (unless `kind` is `figure`); keep at most 8. Quotes that are not found are removed (`ok: false`, `dropped.quotes + 1`).
- **glossary:** 3-12 entries; verify quotes (`ok`), and correct `k` to the page where the quote was found.
- **sections:** clamp `k`; drop entries whose page goes backwards; `sum` cut to 160 characters. When the profile has a table of contents, titles that match one of its entries (equal `skel()`, or one a prefix of the other) take that entry's page, and `toc: true`.
- **figs:** only ids present in the profile; `k` from the id.
- **skip:** clamp, merge overlapping ranges.
- **display:** only `HINTS` codes, at most 3. **hook:** at most 120 characters. **tags:** lowercase, words joined by hyphens, at most 6.

Partials are sent with quotes unchecked (`ok: null`); notes appear in the final form only.

### 8.5 Cost and budget

- Haiku 5.5 costs $0.10 per million input tokens and $0.50 per million output tokens for prompts up to 100,000 tokens. A 30-page paper, with its text at the 90,000-character cap, is about 26,000 input tokens and 3,000-4,000 output tokens: **about $0.004-0.005**, or about **half that in a batch**. The whole corpus (1,948 items) is about $9 at standard prices, **about $4.50 as batches**.
- Every call reserves its estimate against the daily budget first (`app.ai.reserve()`), and is charged its real cost after (`app.ai.charge()`), in the same `spend.json` as summaries. A refused reservation returns the error code `budget`.
- **Automatic augmentation** runs after 15 s on an item (`augDelay`), only when the item has none, the budget has room, and `augAuto` is on. There is no background augmentation of the next items; the corpus is done by batch, which the reader starts.
- Possible saving later (not in scope): the summary, the augmentation and "ask" all send the same document block; caching it (`cache_control`) across the three calls within 5 minutes would cut their input cost by about a third.

### 8.6 Batches (`augment-batch.mjs`, `POST /augment/batch`)

```
node augment-batch.mjs [--lanes ai-safety,llm] [--ids …] [--limit 500] [--model claude-haiku-5-5]
                       [--max-usd 2] [--dry] [--status] [--port 4747]
```

- With a server running, the CLI sends `POST /augment/batch` and polls `GET /augment/batch`; the server does the work, so spend accounting stays in one process. Without a server, it imports `server/augment.mjs` and runs the same code standalone (no other process writes `spend.json` then).
- Items: those without a current augmentation for the model, in the reader's order, then by relevance. Items without text (section 8.2) are skipped and listed.
- Estimate before submitting: the sum of `(chars / 3.5 × input price + 3,500 × output price) / 1e6 × 0.5`. The batch is cut to fit `--max-usd` (default: what is left of today's budget) and the estimate is reserved at submission. `--dry` prints the count and estimate only.
- Requests: `client.messages.batches.create({ requests: [{ custom_id, params }] })`, where `params` is the call in section 8.3 without streaming, and `custom_id = 'a' + sha1(id + '|' + model).slice(0, 40)` (ids contain `:` and `.`, which custom ids do not allow; the map is kept in `CACHE/augment/batches/<batchId>.json`). The `fallbacks` parameter is not allowed in batches; Haiku does not use it anyway.
- Polling every 60 s with `client.messages.batches.retrieve(id)` until `processing_status === 'ended'`; then `for await (const r of await client.messages.batches.results(id))`, matched by `custom_id` (results come in any order). `succeeded`: parse the text blocks, check (section 8.4), write, charge `costOf(model, usage) × 0.5`. `errored` with `invalid_request`: listed, not retried. Other errors and `expired`: listed for a re-run. Batch state survives restarts (`CACHE/augment/batches/`), and polling resumes on start.
- Limits: up to 100,000 requests or 256 MB per batch; most finish within an hour, all within 24 hours; results are kept 29 days. One batch covers the corpus.

### 8.7 Mock mode

With `STACKS_MOCK_AI=1` (and `STACKS_MOCK_DELAY`), `mockAugment(text, profile)` builds a deterministic answer from the item's own sentences (seeded by the id): stops at pages `round(n × [0, 0.12, 0.3, 0.5, 0.7, 0.9])`, sections from the table of contents or every fifth page, glossary terms from capitalized phrases, notes on real sentences with **one quote deliberately altered** so that the drop path is exercised, an explanation for each listed figure, and `display` from the analysis hints. It streams through `generate()`'s mock path, so the whole interface works without a key or network, and batches run synchronously.

## 9. Consumers

### 9.1 The client profile module (`ui/js/profile.js`, analysis builder)

A small core module, so that core modules can use profiles without depending on a feature:

```js
export function profileOf(it)            // sync: Profile, null (known to have none) or undefined (not asked yet)
export function loadProfile(it, { force } = {})   // Promise<Profile|null>; GET /profile, de-duplicated, keeps 300
export function loadProfiles(items)      // Promise<void>; GET /profiles for those not known yet (wall, prefetch)
export function cropOf(P, k, pad = state.cropPad ?? 0.012)   // box object {x0, y0, x1, y1} or null
export function pageAspect(P, k, pad)    // shown width / height of page k, crop applied
export function assetUrl(P, size, kOrJ)  // URL with v, or null
export function spriteCell(P, k, displayHeight)  // {backgroundImage, backgroundSize, backgroundPosition} or null
export { spreadStarts, snapStart, spreadAt, HINTS, GEN } from './profile-core.js';
// emits 'profile:updated' {id, profile} whenever a profile arrives or changes
```

### 9.2 `render.js` (analysis builder)

- **Fix `cachedRender`** (section 1.3).
- `renderPage(it, k)` with a profile `P = profileOf(it)` that has page `k`:
  - **Blank page:** return `[{blank: true, k}]` at once, with nothing fetched or drawn.
  - **Display image** when `state.crop` is on, the image's `box` contains `cropOf(P, k)`, and its `H` is at least 0.9 × `RENDER_H`: `fetch(url)` → `blob` → `createImageBitmap(blob)` → `createImageBitmap(bitmap, sx, sy, sw, sh)` for the exact crop (two for a column split at `gut`) → a canvas with a `bitmaprenderer` context and `transferFromImageBitmap()`. Decoding and cropping happen off the main thread and nothing is copied for display. The panel keeps the existing shape: `{canvas, k, box, srcW, srcH, part?, pdfScale}`, with `src: 'asset'`. Consumers that read `canvas.width` and `height` or draw the canvas as an image source (`textlayer.js`, `figpeek.js`, `export.js`, the scrub clone) keep working.
  - **PDF without a display image:** pdf.js renders as today, but crops with `cropOf(P, k)` instead of `analyze()` (`src: 'pdfjs'`).
  - **Scan:** `fetch(P(scanUrl(it, k, 1000)))` → `createImageBitmap` → crop to `cropOf(P, k)` as above (`src: 'scan'`), with no `getImageData` on the main thread.
- Without a profile, nothing changes.
- `state.useAssets` (default true) turns the display-image path off, for the benchmark.
- Optional, same owner: cap rendered pages by bytes rather than count (`state.renderMB`, default 1,200), since the reader has 64 GB.

### 9.3 `feed.js` (analysis builder)

- **Page shape before the first paint:** `aspectOf(it)` uses `P.aspect.body` (crop on) or `P.aspect.page` (crop off) when there is a profile, so `fitPer` is right the first time and the second layout pass (`feed.js:106`) never runs. Placeholders take each page's own `pageAspect(P, k)`, so landscape and `own` pages do not jump.
- **Spreads:** with a profile, `s = snapStart(P, s, per)` and the pages are `spreadAt(P, s, per)`: blank pages are known before rendering (no extra render loop), `alone` pages stand alone, and facing pages pair as printed. `state.shown` is the number of pages the spread covers, so `turn()` in `nav.js` is unchanged.
- **Track scrub** (`fillScrub`): in this order, the full render if already in memory (now found, thanks to the fix), the sprite cell (synchronous, as a CSS background on the scrub element), the display image, and only then `quickPdf`. For scans, the sprite cell, then the `w200` image as today.
- **Page strip** (`#scrub .th`): sprite cells when there is a sprite.
- **A hook for track layers**, for the augmentation's section segments and skim ticks:

  ```js
  // feed.js
  const trackLayers = new Map(); // name -> fn
  /** registerTrackLayer(name, fn): fn({ i, it, n, s, c, el }) paints inside el, a
   *  div.tr-layer[data-layer=name] that feed.js creates once inside .tr-bar and empties when
   *  the item changes. Called from paintTrack(), and again whenever repaintTrack() is called. */
  export function registerTrackLayer(name, fn) { … }
  export function repaintTrack() { … }   // repaint every layer for the current item
  ```

  The analysis builder uses it too, for one layer: the front matter, references and appendix as faint bands (`ranges`).

### 9.4 `prefetch.js` (analysis builder)

- `startOf(i)`: after the existing rules (where the reader left it, `it.best`), and in place of the heuristics for scans and long PDFs, use `P.ranges.body[0]` when the profile has front matter, then `snapStart`.
- `planAround(i, s)`:
  - `loadProfiles()` for the next 10 items in one request, so their shapes, crops, blank pages and sprites are known before the reader arrives.
  - For a next item whose profile has display images for its opening spread, `renderPage()` takes the image path: **no pdf.js open and no parse until the reader turns past those pages.** Because `P.n` is known, the `openDoc` task that today precedes the first render of an item not yet opened is skipped.
  - After `item:settled`, the current PDF is opened in idle time (as the text layer needs it anyway), so the first turn past the images does not wait for a parse.
  - On `item:settled`, preload the current item's sprite (one image, 10-50 KB for a paper).
- The server prefetch bands are unchanged: profile assets are local and need no fetching ahead.

### 9.5 The compiler feature (`ui/js/features/compile.js`, analysis builder)

Section 6.3, plus:

- `window.__stacksCompile(id, {assets: 'core' | 'full'})` for the batch, when the page was opened with `?compile=batch`.
- A benchmark, `?bench=profile` (section 11.1), that runs the measurements in the reader's own Firefox and prints a table to the console and to `/stats.html`'s diagnostics, like `layerTimes` in `textlayer.js`.
- Diagnostics: `export const compileTimes = []` (ms per page, per item, per level).
- Optional (stretch): an **overview grid**, key `O`: every page of the current item as sprite cells over the stage; hover enlarges, click goes there, `Esc` closes. In `ui/features/compile.css`.

### 9.6 The augmentation feature (`ui/js/features/augment.js`, `ui/features/augment.css`, augmentation builder)

- **Loading:** on `item:settled`, `GET /augment?id=&model=` (the model from `store('augmodel')`, default Haiku). If there is none, count down `augDelay` (15 s) and then `POST /augment` (when `augAuto` is on and the budget has room), streaming into the panel. The client sends `text` only when the item has no profile text: whole-document text from `openDoc` (all pages' `getTextContent()` for PDFs up to 300 pages, in idle time; `d.texts` for flow documents; `/ocr/text` for scans).
- **Panel sections** (`registerSection`):
  - `guide`, order 25, "Reading guide": the skim path as a list (page, kind, reason; click goes there), the skip ranges, the display hints with an "apply" link that sets `state.per` or `state.cols` for this view, the hook when `it.hook` is absent, and the skim path toggle. "AI-generated" and the cost are shown as the summary shows them.
  - `sections`, order 31, "Sections": the section map, title, page and one-line summary, lit for the pages on screen (as the outline is). While it shows, `#panel` gets the class `has-aug-sections`, and `augment.css` hides the built-in outline (`#panel.has-aug-sections #sec-outline { display: none }`).
  - `glossary`, order 36, "Glossary": terms with definitions; click goes to the page and lights the quote.
- **Margin notes:** on `spread:settled` (never on a turn), for each page panel on screen that has notes, find each note's quote among `currentWords()` (`text.js`) with `findSpan(words, quote, k)` (`summary.js`). Put a small marker in the page's outer margin at the height of the quote's first word: the left edge of the leftmost page, the right edge otherwise, inside the page's box. Hover or focus shows the note in a popover (about 320 px wide, labelled "AI"); click lights the quote with `highlight('quote', …)`. Notes whose quote is not on screen are skipped quietly. At most 4 markers a page. Figure explanations get a marker beside the figure's box (`pages[k].fig`), when the profile has it. Setting `notes` (default on).
- **Skim path stepper** (`registerStepper(fn, 30)`), when skim mode is on (`store('skim')`, default off; toggled from the guide section and key `T`, checked to be free in `keymap` at boot):
  - Advance (`dir` 1): if a stop lies after the spread on screen, call `before('skim stop')` from `nav.js`, set `state.start.set(i, snapStart(P, stop.k, per))`, call `showFeed()`, emit `nav {type: 'tour', i, it, k}`, light the stop's quote if it has one, and return true. After the last stop, move to the next item with `go(state.pos + 1)` (unless `e?.repeat`) and return true. Without a plan, return false.
  - Back (`dir` -1): return false, so `features/back.js` undoes the last step from its stack.
  - The head shows `stop 3/6 · p. 12` while skim mode is on.
  - This is the "tour stops" idea of `docs/navigation-ergonomics.md` (item 8), fed by the augmentation. If a separate `tour.js` is built later, it should take its stops from `skimStops(it)`, exported here.
- **Track** (`registerTrackLayer('augment', fn)`): section boundaries as thin ticks (title on hover), skim stops as small triangles above the bar, skip ranges hatched. `repaintTrack()` when an augmentation arrives.
- Emits `augment:updated {id, aug}`.

### 9.7 Others (not owned by either builder)

- **Wall** (`wall.js`): covers and contact sheets for PDFs can use sprite cells (`loadProfiles` for the tiles in view, then `spriteCell`) instead of opening up to 40 pdf.js documents, and depth views can use display images and thumbnails. This belongs to the wall's own task (Wall v2).
- **Figure peek** (`figpeek.js`): can read `pages[k].fig` from the profile before running its detector. Optional, for its owner.
- **Feeds** (`docs/feeds/`): a profile's `ranges` can keep references and appendices out of snippets, and its sprite can supply the "best page" tiles (F8).

## 10. File ownership and interfaces

### 10.1 Who owns what

| File | Analysis and assets builder (A) | Augmentation builder (B) |
|---|---|---|
| `ui/js/profile-core.js` (new, pure) | owns | imports `HINTS` |
| `ui/js/profile.js` (new) | owns | imports |
| `ui/js/features/compile.js`, `ui/features/compile.css` (new) | owns | — |
| `server/profile.mjs`, `server/routes/90-profile.mjs` (new) | owns | imports `readProfile`, `profileTextPath` |
| `compile.mjs` (new) | owns | — |
| `ui/js/render.js`, `ui/js/feed.js`, `ui/js/prefetch.js` | owns the edits in section 9 | — |
| `server/cache.mjs` | additive tenant hook only (section 3.3) | — |
| `server/augment.mjs`, `server/routes/91-augment.mjs` (new) | — | owns |
| `augment-batch.mjs` (new) | — | owns |
| `ui/js/features/augment.js`, `ui/features/augment.css` (new) | — | owns |
| `server/routes/30-summarize.mjs` | — | additive exports only (section 10.3) |
| Tests: `test/profile-*.mjs` / `test/augment-*.mjs` | owns its own | owns its own |
| `ARCHITECTURE.md`, `README.md` | appends a "Profiles" subsection and a paragraph under "Why it is fast" | appends an "Augmentation" subsection and a paragraph under "AI summaries" |

Neither builder edits `nav.js`, `panel.js`, `summary.js`, `util.js`, `main.js`, `textlayer.js`, `figpeek.js`, `wall.js` or `settings.js`; everything they need from those files is already exported (`before`, `go`, `findSpan`, `skel`, `registerStepper`, `registerSection`, `regionsOf`, `currentWords`, `highlight`). Other workflows are editing `feed.js`, `render.js`, `prefetch.js` and `cache.mjs` right now (the fast path, reopeners, `progressOf`), so A rebases onto the latest versions and keeps edits small and local.

### 10.2 Day 0: interfaces first

A lands, before anything else, a small commit with:

- `profile-core.js` with `SCHEMA`, `GEN`, `HINTS`, `budgetFor` and stubs that throw "not implemented" for the rest;
- `profile.js` with `profileOf` returning `undefined`, `loadProfile` resolving `null`, and `profile:updated` documented;
- `registerTrackLayer` and `repaintTrack` in `feed.js`;
- the `cachedRender` fix;
- `server/profile.mjs` exporting `readProfile(id) → Profile | null` and `profileTextPath(id) → path | null`, both returning null for now.

B builds against these from the start, and its code must work when they return nothing: no profile means no figures, no table of contents and client-extracted text.

### 10.3 What B adds to `30-summarize.mjs`

Additive, about 10 lines, no behaviour change:

- `export { indexText, findQuote }` (today module-private), next to the existing `skel`, `parsePartial`, `familyOf` and `PRICES` exports.
- At the end of the default export: `app.ai = { generate, reserve, charge, costOf, spendInfo, pickModel, MOCK };`. Routes load in name order, so `91-augment.mjs` finds it. This keeps one `spend.json` writer and one daily budget for both summaries and augmentations.

### 10.4 Events and keys

| Name | Emitted by | Detail |
|---|---|---|
| `profile:updated` | `profile.js` (A) | `{id, profile}` |
| `augment:updated` | `augment.js` (B) | `{id, aug}` |
| `nav {type: 'tour'}` | `augment.js` (B) | `{i, it, k}`: a skim path step |

Keys: `T` skim path on or off (B); `O` overview grid (A, stretch). Both check `keymap.has()` at boot and stay unbound, with a console warning, if taken.

## 11. Acceptance tests

Numbers are checked two ways: in this container with `test/profile-bench.mjs` (Playwright, headless Chromium, the reference numbers in section 1.2), and on the reader's Mac in Firefox with `?bench=profile`. The bench uses arxiv:1706.03762, arxiv:2212.08073, arxiv:2304.06528, arxiv:2504.01849 (a long report), `ia:mathematicalwrin00jonerich` (a 348-page scan) and lw:uMQ3cqWDPHhjtiesc (a long post). Latencies are from the action to `spread:rendered`, p50 and p90 over at least 20 trials, with the browser's memory caches cleared between trials (`render.js` exports `dropRenders()` for this) and the server's disk cache warm.

### 11.1 Speed (A)

| # | Test | Pass |
|---|---|---|
| P1 | Cold item switch: PDF on disk, not opened in the browser, profile with display images for the opening spread | p50 ≤ 150 ms, p90 ≤ 250 ms. Without images (`state.useAssets = false`) the same switch is the baseline, about 770-1,870 ms here; record it on the Mac |
| P2 | Page turn to pages already in memory | no regression: ≤ 50 ms p90 (README: 25-47 ms) |
| P3 | Page turn to a page not in memory that has a display image | p90 ≤ 80 ms, against pdf.js p90 of 43-1,150 ms here |
| P4 | Track scrub with the sprite loaded: pointer move to the cell on screen | ≤ 16 ms p95 (one frame); no pdf.js render while the pointer moves over pages with sprite cells |
| P5 | Main thread while compiling in idle time (34-page paper) | at most 2 long tasks over 50 ms attributable to the compiler (PerformanceObserver `longtask`, compile on versus off); compiling stops within 20 ms of a `nav` event |
| P6 | Analysis cost | browser: median ≤ 70 ms a page on text papers, ≤ 160 ms on image-heavy pages; scans ≤ 5 ms a page from `w200` images; a 30-page paper's core analysis done within 30 s of arriving if the reader is idle |
| P7 | Profile size and speed | `profile.json` ≤ 40 KB for a 30-page paper and ≤ 120 KB for a 400-page scan; `GET /profile` ≤ 5 ms server time; `GET /profiles` for 50 ids ≤ 20 ms |
| P8 | Disk | a 30-page paper with every level ≤ 3.2 MB (`budgetFor(30)` is 3.05 MiB); its sprite ≤ 60 KB; 300 compiled papers ≤ 1 GB |
| P9 | Batch | poppler: ≥ 6 pages a second of analysis with 3 jobs on 4 cores; playwright: ≥ 3 pages a second |
| P10 | The `cachedRender` fix | hovering the track over a page already rendered draws no new pdf.js page (count `quickPdf` calls: 0) |

### 11.2 Analysis correctness (A, Node unit tests on `profile-core.js`, with fixtures saved from the browser)

| # | Test | Pass |
|---|---|---|
| C1 | Consistent crop | in the 5 sample PDFs, ≥ 90% of non-blank pages have `cg: 'body'`; shown body pages share one aspect within 0.5% |
| C2 | Nothing cut | for every page, the ink box lies inside `cropOf(P, k, 0)` (by construction; a property test over random boxes too) |
| C3 | Blank pages | on the sample scan, every page marked blank is blank (precision 1.0) and ≥ 90% of blank leaves are found, against hand labels |
| C4 | Contents | PDFs with an outline: the toc equals `pdfOutline()` exactly; arXiv papers without one: ≥ 80% of LaTeXML sections mapped to within 1 page of the hand-checked page |
| C5 | References | `ranges.refs` starts on the page with the "References" heading in 5 of 5 sample papers |
| C6 | Facing pages | on the sample scan at 2 per spread, ≥ 95% of spreads are a verso and its recto by printed labels; landscape pages are alone |
| C7 | Fallbacks | delete a display image file: the page renders through pdf.js with no error, and the next `GET /profile` no longer lists it. No profile at all: the feed behaves exactly as before (a snapshot of panel boxes) |
| C8 | Staleness | bump `GEN`: `GET /profile` says `stale: "gen"`, the client keeps the old crops and recompiles in idle; change the cached PDF's bytes: `stale: "src"` |
| C9 | No tools | `compile.mjs --engine auto` with neither Playwright nor poppler prints its message and exits 0 |
| C10 | Eviction | with a small `STACKS_CACHE_MAX`, `heavy` groups go before any `core`; `profile.json` stays valid after each removal; no 500s from `/profile` routes while evicting |
| C11 | API contract | a script covers every status code in section 7.1: 400 bad id, 404 none, 409 older, 409 budget, 413, 415, 304 with `If-None-Match`, and `immutable` only when `v` matches |
| C12 | Running heads and feet | a header repeated on every page (ICLR), alternating per parity (Annals), page-number footers and a book's chapter and section heads are left out of the crop; a first page's own header, a header on a few pages, section titles, a figure at the top and scans are not (`test/profile-core.test.mjs`, synthetic pages) |

### 11.3 Augmentation quality (B)

Run on 20 items (10 papers, 5 posts, 5 scans) with `claude-haiku-5-5`, and on all of them in mock mode.

| # | Test | Pass |
|---|---|---|
| A1 | Shape | 100% parse and pass `validateAugment()` (exported by `server/augment.mjs`) |
| A2 | Quotes | ≥ 90% of margin-note quotes verified on papers and posts, ≥ 75% on scans (OCR noise); no unverified note is ever stored or shown |
| A3 | Skim path | 4-8 stops on ≥ 90% of items; every `k` in range, ascending, none in the references or a skip range (unless a figure); for papers, the first stop in the first 15% of pages; with 3 or more sections, the stops touch at least 3 of them |
| A4 | Sections | pages never go backwards; with a table of contents, ≥ 90% of titles match it; every summary ≤ 160 characters |
| A5 | Glossary | 3-12 terms; the term appears on page `k` (case-insensitive) for ≥ 85% of them |
| A6 | Figures | explanations only for listed ids (100%); one for ≥ 80% of listed ids |
| A7 | Cost | ≤ $0.006 an item at standard prices and ≤ $0.003 in a batch on the 10 papers; the batch estimate within 25% of the charged cost |
| A8 | Latency | first partial ≤ 2 s, final ≤ 20 s at p90 for a 30-page paper (standard API) |
| A9 | Usefulness | the reader marks 10 random skim paths "useful" or not: at least 7 useful; recorded in this folder |
| A10 | Mock mode | deterministic for a given id; exactly one note dropped per item for the altered quote; the interface works with no key and no network |
| A11 | Budget | with the budget nearly used, `POST /augment` returns `code: "budget"` without calling the model; a batch never reserves past `--max-usd` |
| A12 | Interface | margin notes appear only after `spread:settled` and add no long task over 50 ms; with skim mode on, Advance visits the stops in order and then the next item, and Back returns to the previous stop |

## 12. Settings, rollout, risks and open questions

### 12.1 Settings (kept in `store`; the Settings sheet's owner can surface them later)

| Key | Default | Owner | Meaning |
|---|---|---|---|
| `compile` | true | A | compile in idle time |
| `compileAhead` | 10 | A | items ahead to compile (core; up to 50) |
| `writeBack` | true | A | save the feed's renders as display images |
| `useAssets` | true | A | show display images when available |
| `augAuto` | true | B | make an augmentation after `augDelay` on an item |
| `augDelay` | 15000 | B | ms |
| `augmodel` | `claude-haiku-5-5` | B | model for augmentations |
| `skim` | false | B | Advance follows the skim path |
| `notes` | true | B | show margin notes |

Server: `STACKS_PROFILE_MAX` (default 4 GiB), `STACKS_AUG_CHARS` (default 90,000), and the existing `STACKS_CACHE_MAX` (README: suggest raising it, section 1.3).

### 12.2 Order of work

1. Day 0 (A): the interface commit (section 10.2), including the `cachedRender` fix.
2. A: `profile-core.js` with its unit tests, then the server store and routes, then the browser compiler's core level, then the consumers in `render.js`, `feed.js` and `prefetch.js`, then the sprite, write-back and batch.
3. B, in parallel: the `app.ai` exports, `server/augment.mjs` with mock mode, the routes, the panel sections, then margin notes, the stepper and the track layer, then batches.
4. Together: run section 11 on the Mac, then a first corpus batch for the reader's top lanes (`--max-usd` within one day's budget).

### 12.3 Risks

- **Image text is less sharp than pdf.js when the screen needs more pixels than the image has.** Images are used only when their `H` is at least 0.9 × `RENDER_H`; zoom (`z`) and figure peek still render from the PDF.
- **Write-back fills the disk with pages nobody revisits.** The budget per profile and the `heavy`-first eviction bound it; priority 60 is below opening spreads and skim stops.
- **Idle compiling competes with reading.** It runs one unit per idle callback, stops on any `nav`, uses its own pdf.js worker, and can be turned off; P5 checks it.
- **A crop box can be wrong for a document** (odd scans, mixed page sizes). The `own` rule keeps content, `C` still turns cropping off, and a bumped `GEN` recompiles everything lazily.
- **Model text can be wrong.** Quotes are verified and unverified notes are dropped; every AI-written line is labelled; skim mode is off by default and Back undoes any step.
- **Concurrent edits.** `feed.js`, `render.js`, `prefetch.js` and `cache.mjs` are changing under other workflows; small, local edits and the day-0 interfaces limit conflicts.

### 12.4 Open questions for the reader

1. **Disk:** how much may the cache use? With 100 GB or more, set `STACKS_CACHE_MAX=100G` and let the batch compile with display images for every page (`--assets full --all-pages`, about 6-8 GB for the PDFs).
2. **Overnight batch:** is it acceptable to install Playwright's Chromium (about 150 MB) or poppler (`brew install poppler`) for the overnight compile? Neither is needed for the app to work.
3. **Corpus augmentation:** run the whole corpus as one batch (about $4.50 once, above the default $3 daily budget), or lane by lane within the daily budget?
4. **Skim mode:** should Advance follow the skim path by default on long papers once A9 shows the paths are useful?
