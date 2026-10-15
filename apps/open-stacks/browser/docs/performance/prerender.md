# Pre-rendered PDF pages, and caching and prefetching that keep up

This is the build spec for two things the reader asked for:

1. **Pre-render PDF pages on the server** with native PDF tools on all cores, into a disk cache of page images, so that PDFs turn the way scans already do (an image swap, about 66 ms median) instead of waiting for pdf.js on the main thread (770-1,870 ms for the first spread of a PDF the browser has not opened).
2. **Keep improving caching and prefetching**, where the download, readiness and ETA indicators show it hurts.

The reader uses the app only on macOS (an Apple-silicon MacBook, and a 32-inch 4K screen at 2x; 64 GB of RAM; Firefox), so macOS-only engines are fine. Section 1 is what was measured, sections 2-6 settle every design choice with exact interfaces, section 7 is the test plan with the numbers to hit and the one-command self-test for the Mac, and section 8 says who edits what. Paths are relative to `apps/open-stacks/browser/`. Effort: S (under about 150 lines), M (about 150-500), L (more).

It builds on the compiled-document profiles (`docs/profiles/spec.md`, "the profiles spec" below): the rendered pages go **into the profile asset store** (`server/profile.mjs`), so `render.js`'s existing display-image path, the sprite for the track, riffle and overview, and the LRU eviction all keep working.

## Contents

0. [Summary](#0-summary)
1. [Measurements](#1-measurements)
2. [Engines](#2-engines)
3. [The render service](#3-the-render-service)
4. [Display sizes](#4-display-sizes)
5. [The client](#5-the-client)
6. [Caching and prefetching beyond rendering](#6-caching-and-prefetching-beyond-rendering)
7. [Tests and numbers to hit](#7-tests-and-numbers-to-hit)
8. [Files, order of work, risks, questions](#8-files-order-of-work-risks-questions)
- [Appendix A: `server/native/stacks-render.swift`](#appendix-a-servernativestacks-renderswift)
- [Appendix B: `server/native/mu-worker.js`](#appendix-b-servernativemu-workerjs)
- [Appendix C: the geometry test PDF](#appendix-c-the-geometry-test-pdf)

## 0. Summary

**Decisions.**

| Question | Decision |
|---|---|
| Engine | **Quartz** first: a small Swift helper (CoreGraphics draws, ImageIO writes JPEG, PDFKit reads text), compiled once with `swiftc -O` into the cache when the Xcode Command Line Tools are present. Then **poppler** (`pdftoppm`), then **MuPDF** (`mutool run`, a persistent worker), then **none** (today's pdf.js path, unchanged). A benchmark the reader runs (`node prerender.mjs --bench`) picks among those present and saves the choice; `STACKS_RENDER_ENGINE` overrides. Analysis (greyscale grid and text) is routed separately to the fastest engine for it: Quartz, then MuPDF, then poppler |
| Format | **JPEG, quality 0.8**, sRGB. ImageIO cannot write WebP (section 1.10), and JPEG decodes 2.6 times faster than WebP in the browser (section 1.6). No PNG (5-8 times slower to write), no greyscale variant (no decode gain measured) |
| What is stored | Each page **cropped exactly to the profile's crop box** at the reader's padding, so the browser decodes it from a `Blob` without a crop rectangle (25-39 ms for a 2,200-px page here, against 96-132 ms and a 110-ms main-thread stall for today's display-image path). The whole page when the document has no analysis yet (only the first pages of a never-seen PDF), or when the reader turns cropping off |
| Size | One class per screen: whole-page height **2,200 px** for both of the reader's screens (1:1 on the laptop, 0.92 of physical pixels on the 4K screen at "looks like 2560 × 1440"); 1,800 or 1,400 for smaller screens; 3,300 on demand in fit-width mode. Landscape pages are capped at 1.3 times the class in width |
| Where | The profile store: `CACHE/profiles/<pid>/d<k>.jpg`, recorded in `profile.json` as display images, so `render.js` shows them as it shows display images today. Opening spreads are admitted by priority within the profile's budget, as now; every other page is a new **render class**, outside `budgetFor(n)`, with its own LRU entry and cap (`STACKS_RENDER_MAX`) |
| Pool | `cores − 1` worker processes (`STACKS_RENDER_WORKERS`), four lanes: **fg** (pages on screen now, a request is waiting; never queues behind background work), **near** (the next spreads, the next three items' first spreads), **ahead** (the rest of the document, the next twelve items' first spreads and sprites, likely jumps), **idle** (corpus warm-up, only when the reader is idle and the Mac is on AC power). Background lanes run at macOS utility or background QoS, which keeps them off the cores Firefox is using |
| Client | `render.js` asks `GET /render/page` (waits up to 1.5 s at fg priority) before falling back to pdf.js; `prefetch.js` sends `POST /render/hint` on every move; the loading badge and the track band count server-rendered pages as ready; the pdf.js document still opens lazily for the text layer, figure peek and read-aloud, with matching geometry |
| Disk | `STACKS_CACHE_MAX` defaults to a quarter of the cache volume (8-64 GiB) instead of 8 GiB; rendered pages may use 40% of it. Every page of every PDF in the corpus at 2,200 px is about 8 GB |

**Expected effect** (targets in section 7):

| | Today | With pre-rendering |
|---|---|---|
| First spread of a PDF not open in the browser | 770-1,870 ms with pdf.js (708-1,482 ms p50 in the app here); 219-529 ms p50 with today's display images | three pre-cropped JPEGs decoded off the main thread (about 130 ms for the decodes here, on a loaded 4-vCPU box); target ≤ 250 ms p90 on the Mac |
| First spread of a PDF on disk that was never rendered | 770-1,870 ms | one foreground render per page in parallel: about 100-200 ms of engine time per page here (poppler), target ≤ 400 ms p90 on the Mac |
| Turning to a page not yet in memory | pdf.js: median 28-91 ms, p90 43-1,150 ms | a 25-40 ms decode off the main thread; target turn p90 ≤ 80 ms |
| `j j j` through new items | each new PDF parsed and drawn in the browser; the next 3 items prepared only after you land | the next 12 items' first spreads rendered on the server ahead of you; target ≤ 150 ms p90 per hop at 3 hops a second |
| After a reload, or tomorrow | everything drawn again | pages are on disk; the server resumes its last plan at start |

## 1. Measurements

### 1.1 Setup

Measured on 2026-10-15 in this container: Linux, 4 vCPUs shared with other agents (load average 10-30 throughout), poppler 24.02, MuPDF 1.23.10 (installed for this test with `apt-get install mupdf-tools`), headless Chromium 141 (Playwright 1.56). Every comparison is interleaved and repeated, with the order shuffled each round; renders report **CPU time** (user + system of the child process, from `wait4`), which the other agents' load disturbs far less than wall time. Absolute numbers on the reader's Mac will be lower; the ratios are what the design rests on. Scripts and raw CSVs: `/tmp/claude-0/-home-user-cairn/0193788b-bfb6-55ba-996b-2cd5efef9d2b/scratchpad/builders/pr-design/` (`bench.py` and its CSVs for 1.2-1.4, `prep.py`, `decode.mjs`, `decode2.mjs`, `decode3.mjs` for 1.5-1.6, `switch-bench.mjs` and `switch-trace.mjs` for the app benchmark, `testpdf2.mjs` for 1.8, and the drafts `stacks-render.swift` and `mu-worker2.js` of the appendices).

Nine corpus PDFs, chosen to cover the kinds of page the reader meets:

| File | Item | Pages | Kind |
|---|---|---|---|
| attention | `arxiv:1706.03762` | 15 | LaTeX paper with figures |
| cai | `arxiv:2212.08073` | 34 | LaTeX paper |
| faking | `arxiv:2412.14093` | 137 | long paper, many figures |
| sleeper | `arxiv:2401.05566` | 71 | figure-heavy paper |
| srd | `ttrpg:srd521` | 364 | InDesign book, art and tables |
| dnd | `ttrpg:dnd-basic-2018` | 180 | InDesign book, full-page art |
| lasers | `ttrpg:lasers-feelings` | 1 | one landscape page |
| ashby | `book:ashby-intro-cybernetics` | 156 | scanned book; 152 pages carry `/Rotate 90` |
| bstj | `bstj:13-1-1` | 18 | scanned paper (images only), 10.6 MB |

Four to six pages of each (first, 30%, 60%, last, plus Figure 1 and the attention-map page of `attention`): 70 renders per configuration and size, two rounds.

### 1.2 Native renderers, one page per process

Each call starts the program, parses the PDF and renders one page (`-cropbox`, height `H`, width to scale). CPU ms per page (median / p90), wall ms (median), and output size (median / p90):

| Configuration | H | CPU ms | Wall ms | KB |
|---|---|---|---|---|
| `pdftoppm` JPEG q80 | 1,400 | 61 / 125 | 78 | 203 / 307 |
| `pdftoppm` JPEG q80 | 1,800 | 78 / 144 | 87 | 291 / 447 |
| `pdftoppm` JPEG q80 | 2,200 | **94 / 177** | 108 | **365 / 600** |
| `pdftoppm` JPEG q88 | 1,800 | 80 / 152 | 94 | 359 / 546 |
| `pdftoppm` raw PPM (no encoding) | 1,800 | 69 / 141 | 80 | 7,335 |
| `pdftoppm` PNG | 1,400 / 1,800 / 2,200 | 390 / 560 / 749 (median) | 438 / 611 / 834 | 285 / 399 / 489 |
| `pdftocairo` JPEG q80 | 1,400 / 1,800 / 2,200 | 73 / 85 / 94 (median) | 90 / 100 / 109 | 193 / 275 / 369 |
| `mutool draw` raw PNM (no encoding) | 1,800 | **42 / 78** | 48 | 2,445 |
| `mutool draw` PNG | 1,400 / 1,800 / 2,200 | 83 / 120 / 157 (median) | 96 / 138 / 178 | 244 / 341 / 393 |

Per document, CPU ms per page at 1,800 (`pdftoppm` JPEG / `mutool` raw / `pdftocairo` JPEG): cai 55 / 17 / 60, sleeper 64 / 24 / 75, faking 69 / 40 / 80, ashby 69 / 24 / 88, attention 98 / 42 / 95, bstj 98 / 47 / 85, srd 122 / 54 / 155, lasers 137 / 76 / 135, **dnd 342 / 160 / 153** (full-page painted art).

- **Rasterising is the cost; JPEG encoding is cheap** in poppler (69 ms raw, 78 ms with JPEG). MuPDF rasterises 1.6 times faster than poppler's Splash (42 against 69 ms) and Cairo is no faster than Splash except on painted art.
- **PNG is out**: 5-8 times the CPU of JPEG, and larger files.
- Quality 88 costs 23% more bytes than 80 for 3% more CPU; 80 is the choice, as in `compile.mjs` today (sizes in 1.5).

### 1.3 Persistent workers, page ranges and parallel processes

- **One process for 8 consecutive pages** (`pdftoppm -f a -l a+7`) instead of 8 processes: 56 instead of 79 ms CPU per page (−29%), wall 63 instead of 87 ms. Process start and parsing cost about 23 ms a call; a range spreads it.
- **A persistent MuPDF worker** (`mutool run`, the document kept open; Appendix B) at 2,200 px: rendering 68 ms median, **JPEG encoding 325 ms median** (MuPDF's `saveAsJPEG` writes 4:4:4 and is slow, though it links the same libjpeg-turbo as poppler), p90 of the two together 819 ms; the first page of a newly opened document renders in 97 ms. So MuPDF has the fastest rasteriser here and the slowest full path to a JPEG; it wins only for analysis (1.4). Its `readline()` returns at most 255 characters per call, and a Pixmap drawn through `new DrawDevice()` stayed blank; Appendix B works around both.
- **Parallel processes**: CPU per page stayed flat from 1 to 4 processes (88-101 ms at 1,800, both engines), so the work has no shared bottleneck and throughput is cores ÷ CPU per page. Wall-clock scaling here was capped by the other agents' load: best runs 10.7 pages a second with one process, 31 with three, 30 with four (medians 8.7, 22.1 and 17.1). On a Mac with 8-10 free cores, expect several times that (section 7 sets ≥ 60 pages a second).

### 1.4 The analysis pass

The profile's analysis needs every page as a greyscale grid (`analyzeLum`) and the page text (`pageRoles`, headings, words). Whole-document CPU, total and per page:

| Document | pages | `pdftoppm -gray` 400 px (what `compile.mjs` runs) | `mutool draw -c gray -w 240` | `pdftotext` | `mutool draw -F txt` |
|---|---|---|---|---|---|
| attention | 15 | 455 ms (30 / page) | 266 (18) | 126 (8.4) | 108 (7.2) |
| cai | 34 | 301 (8.9) | 224 (6.6) | 130 (3.8) | 107 (3.1) |
| sleeper | 71 | 1,990 (28) | 1,337 (19) | 399 (5.6) | 274 (3.9) |
| faking | 137 | 1,617 (12) | 1,524 (11) | 469 (3.4) | 338 (2.5) |
| ashby | 156 | 950 (6.1) | 580 (3.7) | 256 (1.6) | 256 (1.6) |
| dnd | 180 | 1,898 (10.5) | 1,622 (9.0) | 912 (5.1) | 596 (3.3) |
| srd | 364 | **19,982 (55)** | 1,857 (5.1) | **18,112 (50)** | 1,112 (3.1) |
| bstj | 18 | 1,119 (62) | 439 (24) | 15 (0.9) | 16 (0.9) |

`pdfinfo` for all pages: 10-38 ms a document. So: analysis must be split across workers (a 364-page book is 20 s of poppler on one core), MuPDF is 1.1-10 times faster for both halves, and `pdftotext` can be pathological (srd: 18 s; `server/augment.mjs` and `compile.mjs` both call it).

### 1.5 Formats and sizes

From lossless 2,200-px renders of 8 pages (Figure 1 of attention, attention p. 1, faking p. 83, sleeper p. 44, dnd p. 109, srd p. 219, bstj p. 6, ashby p. 95), resized to 2,000 px and encoded with libjpeg-turbo and libwebp (Pillow):

| Variant at 2,000 px | KB, by page | vs JPEG q80 |
|---|---|---|
| JPEG q80, 4:2:0 | 287, 351, 361, 458, 172, 539, 289, 774 | — |
| JPEG q88 | 346, 428, 441, 562, 219, 668, 363, 952 | +22% |
| JPEG q80, 4:4:4 (what MuPDF writes) | 325, 394, 397, 493, 228, 575, 317, 834 | +10% (dnd +32%) |
| JPEG q80, greyscale | 271, 331, 343, 441, 150, 519, 277, 747 | −4% |
| WebP q80 | 152, 205, 207, 276, 92, 335, 172, 452 | −42% |
| WebP q70 | 133, 179, 183, 241, 72, 294, 144, 388 | −50% |
| JPEG q80 cropped to the ink box | 270, 339, 348, 442, 162, 535, 289, 748 | −3% (white margins cost almost nothing) |
| JPEG q80 at 1,800 / 2,200 px | — | −13% / +19% |

Encoding with Pillow: JPEG 7-16 ms a page, WebP q80 220-316 ms (20 times slower). Only two pages of the eight had any visible colour (arXiv papers often do, through coloured citation links), so a greyscale variant saves almost nothing.

### 1.6 Decoding in the browser

`createImageBitmap(blob)`, headless Chromium at 2x, 20 rounds over the 8 pages, median of the per-page medians (ms):

| Variant | Decode | Notes |
|---|---|---|
| JPEG q80, 2,000 px | **33** | pages 24-56 |
| WebP q80, 2,000 px | **85** | 2.6 times JPEG; `img.decode()`: 59 against 30 |
| WebP q70 | 56 | |
| JPEG q88 / 4:4:4 / greyscale | 38 / 40 / 42 | none faster than plain 4:2:0 q80 |
| JPEG at 1,800 / 2,200 px | 29 / 39 | decode follows pixel count |
| Whole page 2,200 px **with a crop rectangle** (`createImageBitmap(blob, sx, sy, sw, sh)`) | 46 (first run 68) | the rectangle costs a copy |
| Page cropped on the server, 2,200 px, **no rectangle** | **25** (first run 33) | |
| Same, with a rectangle trimming a 0.02 bleed | 37 (first run 48) | |
| A rectangle cut from an already decoded bitmap | 10-13 | the cost of the copy alone |
| Three pages at once (`Promise.all`): JPEG 2,000 / 2,200 / 2,200 cropped / WebP 2,000 | 126 / 190 / 127 / 246 | a spread, on 4 loaded vCPUs |

`render.js` (as edited on 2026-10-15) loads display images through an `<img>` (`loadImg`: `decode()`, kept in the `imgs` cache) and cuts them with `createImageBitmap(img, sx, sy, sw, sh)`. Compared directly (14 rounds, 2,200 px, median / p90 ms):

| Path | Whole page | Cropped page |
|---|---|---|
| `<img>` `decode()`, then `createImageBitmap(img, rect)` (today) | 132 / 315 | 96 / 264 |
| `createImageBitmap(blob)`, no rectangle | 67 / 223 | **39** / 161 |
| **Longest main-thread stall per page**, median of the longest gap of a 0-ms timer | **110** (today's path) | **12** (blob path) |

In Chromium, `createImageBitmap` from an `<img>` with a rectangle runs on the main thread: about 110 ms of stalled input per 2,200-px page on this loaded box. From a `Blob` it decodes on a decoder thread.

So: **JPEG, cropped on the server to exactly the box shown, fetched as a `Blob` and decoded with `createImageBitmap(blob)` without a rectangle.** That is less than half the work of today's display-image path, without its main-thread stall, and less than half the decode time of WebP.

The app's own benchmark (`ui/js/profile-bench.js`, cold item switches, render and document caches dropped before each trial) on three papers compiled with `compile.mjs --engine poppler --assets full --height 2200`, so the opening spreads are poppler JPEGs:

| Screen (`RENDER_H`) | Item | No profile (pdf.js): p50 / p90 ms | Display images: p50 / p90 ms |
|---|---|---|---|
| 1,728 × 1,050 at 2x (1,785) | `1706.03762` | 708 / 1,222 | 388 / 591 |
| | `2212.08073` | 933 / 1,320 | 219 / 500 |
| | `2304.06528` | 1,396 / 1,788 | 381 / 538 |
| 2,560 × 1,440 at 2x (2,200) | `1706.03762` | 1,092 / 1,595 | 529 / 1,605 |
| | `2212.08073` | 1,482 / 4,532 | 396 / 853 |
| | `2304.06528` | 1,277 / 2,125 | 336 / 558 |

Twelve trials each, two pages shown, images of 316-549 KB (whole page plus a 0.02 bleed around the crop, from `compile.mjs`). Images make the switch 2-4 times faster, but it stays well above the decode time: a trace of four switches showed the first image cut starting 110-450 ms after `go()` (the `<img>` load and decode, and whatever else the main thread runs on `item:shown`), then the pages cut one after another at 40-120 ms each on the main thread (the `<img>` path above), for 259-732 ms in all. Section 5.1 takes the `<img>` steps out; T1 measures what remains.

### 1.7 What the browser costs today

From the profiles spec, section 1.2 (same container, headless Chromium, pdf.js 4.10.38): opening (parsing) a PDF 114-135 ms; **the first spread cold, 770-1,870 ms**; one page at 2,000 px with pdf.js, median 28-91 ms and p90 43-1,147 ms (image-heavy pages are the slow ones); the same three pages as WebP images, 71-96 ms to decode; analysis 35-154 ms a page; encoding a 2,000-px WebP in the browser (`toBlob`) 262-390 ms. pdf.js builds the drawing in its worker but executes it on the main thread, so prefetch renders compete with key presses; image decoding runs on decoder threads.

### 1.8 Geometry: crop box and rotation

A five-page test PDF (Appendix C: portrait; `/Rotate 90`; a CropBox inset 72 pt inside the MediaBox; landscape; CropBox and `/Rotate 270` together), rendered at 400 px:

- `pdfinfo` reports the **crop box** (468 × 648 pt for page 3), as pdf.js shows it. `pdftoppm` **without `-cropbox` renders the media box**: page 3 came out 310 × 400 px with the ink at x = 0.177 instead of 289 × 400 with the ink at 0.076. `compile.mjs`'s poppler engine passes no `-cropbox`, so on any PDF whose CropBox differs from its MediaBox its ink boxes and display images are offset from pdf.js (none of the nine sampled PDFs differ; publisher PDFs sometimes do). The shared module (2.7) fixes it.
- `pdftoppm -scale-to-y` applies **before** `/Rotate`: page 2 came out 400 px wide and 310 tall. Rendering must use `-r <dpi>` computed from the displayed (rotated) height, as `compile.mjs`'s display images already do.
- MuPDF's page bounds are the crop box with the rotation applied, y down: exactly what pdf.js shows (all five pages matched poppler with `-cropbox -r`).
- The Quartz helper must do both itself: `CGPDFPageGetDrawingTransform` never scales up, so Appendix A builds the transform for each `/Rotate` and clips to the crop box ∩ media box (pdf.js's `view`).

### 1.9 The profile budget

`budgetFor(n) = min(12 MiB, 1 MiB + 70 KiB × n)` was sized for WebP opening spreads. With `compile.mjs --assets full --all-pages --height 2200`, the store admitted **4 of 15 pages** of attention (images of 316-549 KB against a 2.03 MiB budget), 6 of 34 of cai and 3 of 7 of `2304.06528`. A pre-rendered paper needs about 10 times that budget, so rendered pages get their own class (3.6).

### 1.10 WebP on macOS

ImageIO decodes WebP (macOS 11 and later) but, as far as can be found, **cannot encode it**: `CGImageDestinationCreateWithURL` with `org.webmproject.webp` fails with "unsupported file format" in reports from 2021 and 2024 (Apple Developer Forums thread 688001), the type is missing from `CGImageDestinationCopyTypeIdentifiers()`, and Apple has announced no encoder. Confidence about 85% that this holds on macOS 15 and 26; the helper's `hello` reply reports `webp: true|false` from `CGImageDestinationCopyTypeIdentifiers()`, so the self-test settles it on the reader's Mac. It does not change the decision: JPEG decodes 2.6 times faster (1.6), disk is not the constraint, and `cwebp` is not installed. ImageIO also writes HEIC, which Firefox cannot show.

### 1.11 What it means

- **A turn costs a decode, not a render.** A pre-rendered, pre-cropped 2,200-px JPEG decodes in 25-40 ms off the main thread here; a spread of three in about 130 ms on this loaded box. On the Mac both are smaller.
- **The engine's cost lands on idle cores, ahead of the reader.** About 94 ms of CPU a page with poppler here, flat across processes; a 30-page paper on 8 cores is well under a second, the corpus (about 23,000 PDF pages) a few minutes at full tilt.
- **The foreground path must not depend on analysis**: analysis of a 364-page book is 2-20 s of CPU. The first pages of a never-seen PDF render whole and are cropped in the browser, as today.
- **Disk is cheap**: every page of every PDF at 2,200 px is about 23,000 × 350 KB ≈ 8 GB.

## 2. Engines

### 2.1 Order and detection

| Engine | Needs | Renders | Analysis (grey grid, text) | Sprite | Detected by |
|---|---|---|---|---|---|
| `quartz` | Xcode Command Line Tools (`swiftc`) | `stacks-render` helper, persistent, crop rectangles, JPEG via ImageIO | `lum` (CoreGraphics), `text` (PDFKit) | yes | `xcode-select -p` exits 0 **and** `xcrun --find swiftc` exits 0. Never run `/usr/bin/swiftc` blindly: without the tools it opens the "install developer tools" dialog |
| `poppler` | `brew install poppler` | `pdftoppm` per call (one page for fg, ranges of up to 8 for ahead and idle) | `pdftoppm -gray`, `pdftotext` (in page ranges) | no | `pdftoppm -v` and `pdfinfo -v` exit 0 |
| `mupdf` | `brew install mupdf-tools` | `mutool run` persistent worker, whole pages only | `lum` in the worker, text from `mutool draw -F txt` | no | `mutool -v` exits 0 and the worker answers `hello` |
| none | — | the client draws with pdf.js as today | the browser's compiler, as today | the browser's compiler | — |

Homebrew and MacPorts both require the Command Line Tools, so on the reader's Mac Quartz is available whenever the others are; poppler and MuPDF are fallbacks for a broken toolchain, and the engines this container can test. Without any engine, `/status` reports `render: {engine: null}` and the client never calls `/render/*`.

Sprites come from Quartz only. With poppler or MuPDF the browser's idle compiler (`features/compile.js`) keeps making them, as today.

### 2.2 The worker protocol

Quartz and MuPDF workers are long-lived child processes that read one JSON command per line on stdin and write one JSON reply per line on stdout, **in order**; the Node side keeps a FIFO of pending promises per worker. poppler is driven through the same interface by `server/pdfnative.mjs`, which spawns the CLI per command.

| `op` | Fields | Reply (besides `id`, `ok`, `ms`) |
|---|---|---|
| `hello` | — | `engine`, `v`, `os`, `cores`, `webp`, `heic` (Quartz) |
| `info` | `file` | `n`, `pages: [{w, h, rot?}]`: points, crop box ∩ media box, rotation applied |
| `render` | `file`, `k` (0-based), `h` (whole-page height in px), `box` (`[x0, y0, x1, y1]`, fractions of the displayed page, y down; default the whole page; MuPDF: whole page only), `q` (0-1), `out` (absolute path), `lane` | `w`, `h` (output px), `fw`, `fh` (whole page px), `rect` (`[x, y, w, h]` in the whole page), `pw`, `ph` (page size in points), `bytes` |
| `lum` | `file`, `ks`, `h` (400), `out` (path prefix) | `ks`; files `<out>-<k>.pgm`, 8-bit binary PGM, `h` px tall |
| `text` | `file`, `ks` (default all), `out` | `n`, `ks`; the pages' text joined by form feeds (`\f`), as `pdftotext` writes |
| `sprite` | `file`, `cells: [{k, box}]` (`box` null for a blank page: a white cell), `cw`, `ch`, `cols`, `q`, `out`, `lane` | `w`, `h`, `bytes` |
| `close` | `file` | — |
| `quit` | — | the process exits |

- Errors: `{id, ok: false, error}`; the worker keeps going.
- Outputs are written atomically: `<out>.part`, then renamed. MuPDF's scripting cannot rename, so its replies carry `part: true` and Node renames.
- Pixel rectangles are computed identically everywhere (and as `compile.mjs` does): `FW = round(pw × s)`, `FH = h`, `X0 = round(x0 × FW)`, `Y0 = round(y0 × FH)`, `W = round((x1 − x0) × FW)`, `H = round((y1 − y0) × FH)`, with `s = h / ph`. The stored box is `[X0 / FW, Y0 / FH, (X0 + W) / FW, (Y0 + H) / FH]`, 4 decimals.
- `lane` sets the thread's QoS in the Quartz helper (`fg` user-interactive, `near` user-initiated, `ahead` utility, `idle` background), which on Apple silicon steers background work to the efficiency cores. For poppler, background commands are spawned as `taskpolicy -c utility …` (ahead) or `taskpolicy -c background …` (idle) when `/usr/sbin/taskpolicy` exists; for MuPDF workers, `os.setPriority(pid, 10)` while they run background jobs and `0` for fg and near.

### 2.3 The Quartz helper

`server/native/stacks-render.swift`, Appendix A (about 210 lines). One process per pool slot, single-threaded, documents kept open (LRU of 8), every command inside `autoreleasepool` (a command-line tool has no run loop to drain ImageIO's and PDFKit's autoreleased objects).

- **Build**: on server start, in the background, `xcrun swiftc -O -o <bin>.part server/native/stacks-render.swift`, then rename to `<bin>` = `CACHE/render/bin/stacks-render-<first 10 hex of sha1(source + output of swiftc --version)>`. A cold build takes tens of seconds; until it is done, the next engine serves. A failed build writes `CACHE/render/build.log` and is not retried until the source or the compiler changes. Old binaries are deleted after a successful build.
- **Rendering**: an RGB bitmap context (sRGB, 8 bits, no alpha), filled white; the transform for the page's `/Rotate` and crop box (Appendix A, `pageTransform`), translated so the requested rectangle lands in the context; clipped to the crop box; `drawPDFPage`; `makeImage`; ImageIO JPEG with `kCGImageDestinationLossyCompressionQuality` = `q`.
- **Not drawn**: annotations and form widgets (`drawPDFPage` draws the page content only; pdf.js draws annotation appearances). The text layer is unaffected; a filled-in form would look empty. Acceptable for this corpus.

### 2.4 The MuPDF worker

`server/native/mu-worker.js` (Appendix B, about 60 lines), run as `mutool run mu-worker.js`. Ops `hello`, `info`, `render` (whole pages), `lum`, `close`, `quit`; long command lines are reassembled from `readline()`'s 255-character pieces. Text comes from `mutool draw -q -F txt -o <out> <file> <first>-<last>` (form feeds between pages, checked). Tested here against the geometry PDF and the corpus PDFs: sizes, crop box and rotation match poppler with `-cropbox`.

### 2.5 The poppler adapter

In `server/pdfnative.mjs`, no worker process:

- `info`: `pdfinfo -f 1 -l <n> <file>` (crop box sizes; `rot` swaps width and height, as `compile.mjs` `pdfinfo()` does today).
- `render`: `pdftoppm -cropbox -jpeg -jpegopt quality=<q×100> -r <72 × h / ph> -x X0 -y Y0 -W W -H H -f k+1 -l k+1 -singlefile <file> <out-without-.jpg>`, the rectangle passed for whole pages too (`-x 0 -y 0 -W FW -H FH`): with `-r` alone poppler rounds some pages up by a pixel (Appendix C). For ahead and idle, consecutive pages of the same size and crop box are batched into one call (`-f a -l b`, at most 8; the box is the same for body pages, which share a crop group), output names `<prefix>-<k+1>.jpg`, renamed one by one.
- `lum`: `pdftoppm -cropbox -gray -r <72 × 400 / ph> -f a -l b <file> <prefix>` in ranges of 32 pages of the same size, so ranges spread over the pool.
- `text`: `pdftotext -enc UTF-8 -f a -l b <file> <out>` in ranges of 32 pages (srd: 18 s on one core otherwise).

### 2.6 Choosing: the benchmark, `engine.json`, `STACKS_RENDER_ENGINE`

`node prerender.mjs --bench [--pages 24] [--h 2200]` (also run by `--self-test`):

1. Detects the engines (building the Quartz helper if needed).
2. Takes up to three PDFs already in the cache, preferring a long one, an image-heavy one and a paper (else, when a server answers, it fetches `arxiv:1706.03762` and `arxiv:2212.08073` through its `/proxy`, about 4 MB; else only the geometry PDF of Appendix C), and for each engine renders `--pages` pages spread through them at `--h`: first with one worker, in sequence (latency: p50, p90), then with `min(4, cores − 1)` workers (throughput, pages a second), then the analysis ops on all pages of the first document.
3. Picks **render** = the engine with the highest throughput among those whose p90 is within 1.5 times the best p90; **analysis** = the engine with the lowest lum + text time per page.
4. Writes `CACHE/render/engine.json`:

```json
{ "v": 1, "at": "2026-10-16T08:00:00Z", "cores": 10, "render": "quartz", "analysis": "quartz",
  "found": ["quartz", "poppler"],
  "results": { "quartz": { "p50": 41, "p90": 77, "pps": 93, "kb": 340, "lum": 4.1, "text": 6.0 },
               "poppler": { "p50": 92, "p90": 160, "pps": 41, "kb": 365, "lum": 21, "text": 9.3 } } }
```

(Values illustrative.) The server reads it at start. Without it, the default order applies: render quartz → poppler → mupdf; analysis quartz → mupdf → poppler. When the engines found differ from `found`, the server logs a one-line suggestion to run `--bench` again and uses the default order meanwhile. `STACKS_RENDER_ENGINE=quartz|poppler|mupdf|off` overrides the render engine (`off` disables the service); `STACKS_ANALYSIS_ENGINE` the analysis engine.

### 2.7 One module for engines and analysis, shared with `compile.mjs`

`server/pdfnative.mjs` (new, L) holds everything both the batch compiler and the render service need, so nothing is copied:

```js
export async function detect({ build = true } = {})
  // → { quartz: {ok, why?, bin?, os?, webp?}, poppler: {ok, version?}, mupdf: {ok, version?}, taskpolicy: boolean }
export function choice()               // → { render, analysis, from: 'env' | 'bench' | 'default' } (engine names or null)
export function startWorker(engine)    // → Worker: { engine, pid, send(cmd) → Promise<reply>, open: Set<file>, busy, kill() }
export const run = {                   // one op on a given worker (persistent engines) or by spawning (poppler)
  info(w, file), render(w, {file, k, h, box, q, out, lane}), lum(w, {file, ks, h, out, lane}),
  text(w, {file, ks, out, lane}), sprite(w, {file, cells, cw, ch, cols, q, out, lane}),
};
export function pgmLum(buf)            // moved here from compile.mjs (unchanged); compile.mjs re-exports it
export function pixelRect(pw, ph, h, box) // → {FW, FH, X0, Y0, W, H, box} (2.2), the one rounding rule
export async function analyzePdf(file, { id, url, exec, by })
  // exec(op, args, {pri}) runs an op on some worker; analyzePdf splits lum and text into ranges of
  // 32 pages, runs them in parallel through exec, and returns the raw object core.finalize() takes:
  // {id, kind: 'pdf', by, at, ms, src: {url}, pages: [{w, h, rot?, ...analyzeLum(), words}], heads, ixf, outline: []}
```

`compile.mjs` keeps its command line and its playwright engine; its `--engine poppler` path (`popplerItem`) becomes: fetch the PDF through `/proxy` as now, `analyzePdf(file, {exec: <spawn-based exec>, by: 'poppler'})`, `core.finalize`, upload as now, and its display images through `run.render` (which passes `-cropbox`). That fixes the crop-box bug (1.8) and the `pdftotext` stall in one place. The profile QA workflow owns `compile.mjs`; the change is a replacement of `pdfinfo()`, `pgmLum()` and the analysis loop by imports, with the existing tests (`test/profile-compile.test.mjs`) as the check.

`by` is the engine name (`quartz`, `mupdf`, `poppler`). `server/profile.mjs` gives `quartz` and `mupdf` the rank of `poppler` (1: below `browser` and `playwright`, which add font-size headings and figures).

## 3. The render service

### 3.1 Modules

- `server/render.mjs` (new, L): the pool, jobs, lanes, plans, power and idle state, storage through `server/profile.mjs`.
- `server/routes/16-render.mjs` (new, M): the HTTP API (3.9) and the `render` block of `/status`.
- `prerender.mjs` (new, M): the command line (3.10): `--bench`, `--self-test`, and batch pre-rendering.
- `server/pdfnative.mjs`, `server/native/stacks-render.swift`, `server/native/mu-worker.js` (section 2).

`render.mjs` exports:

```js
export async function start()      // detect engines, read engine.json, start the pool, resume CACHE/render/plan.json
export function page({ id, k, h, pad, crop, lane, size = 'display' }) // → Promise<{rec, file}> (dedupes; never rejects for 'not yet')
export function have({ id, k, h, pad, crop }) // → stored record or null (no work started)
export function hint(h)            // replace the plan (3.4)
export function stateOf(id, h)     // readiness for the badge (3.9)
export function addSource(fn)      // fn(it) → {file, srcKey?} | null: a local PDF for an item (3.5)
export function renderState()      // the /status block
```

### 3.2 Jobs

| Kind | Key | Work |
|---|---|---|
| `page` | `p:<pid>:<k>:<h>:<boxsig>` | one `render`; `boxsig` is the requested box rounded to 3 decimals, or `full` |
| `analysis` | `a:<pid>` | `info`, then `lum` and `text` in ranges of 32 pages as sub-jobs `a:<pid>:lum:<first>` and `a:<pid>:text:<first>` that any worker may take, then `core.finalize` and `putAnalysis` (in-process) and `putText` |
| `sprite` | `s:<pid>:<j>` | one `sprite` op per sheet (1,024 pages), Quartz only, after the analysis |
| `thumb` | `t:<pid>:<k>` | a `render` 200 px wide through the crop box, quality 0.7, ≤ 64 KB, for the wall (on request only) |

A job has `{key, kind, id, pid, k?, h?, box?, lane, pri, seq, waiters: Set, state: 'src' | 'blocked' | 'queued' | 'running' | 'done' | 'failed', tries}`.

- **Dedupe**: one job per key; a second request attaches as a waiter and, if its lane is higher, promotes the job (a queued job moves lanes; a running one is left alone).
- **Already there**: before a page job runs, `have()` is checked again (a write-back or another job may have made it).
- **Order inside a lane**: by `pri`, then by `seq` (newer plan first); a free worker prefers, among jobs within 5 priority points of the best, one on a document it already has open (persistent engines), so documents are not reopened needlessly.

### 3.3 Lanes and the pool

`W = STACKS_RENDER_WORKERS || max(1, os.availableParallelism() − 1)` workers (9 on a 10-core Mac, 3 here). Each lane may occupy at most this many workers at a time:

| Lane | Priority | Workers it may use | Runs when | QoS |
|---|---|---|---|---|
| `fg` | 100 | all `W` | a request is waiting (`GET /render/page?lane=fg`) | user-interactive |
| `near` | 80-95 | `max(1, W − 1)` | always | user-initiated |
| `ahead` | 40-79 | `max(1, W − 2)`; on battery `min(2, …)` | always | utility |
| `idle` | 0-39 | `max(1, floor(W / 2))` | the reader is idle **and** on AC power **and** rendered pages are under 90% of `STACKS_RENDER_MAX` | background |

- **fg never waits behind background work**: `near`, `ahead` and `idle` together can never hold the last worker, so a foreground job starts at once (or behind at most one other foreground job per worker). Running jobs are never pre-empted: a page takes 50-300 ms.
- **Idle** means: no `/render/hint`, `/render/page` or foreground `/proxy` request for 60 s, or the last hint said `idle: true` (the tab is hidden). **AC power**: `pmset -g batt` contains `'AC Power'` and `pmset -g` does not show `lowpowermode 1`, checked every 60 s (elsewhere: `/sys/class/power_supply/*/online`, else assumed on AC). `STACKS_RENDER_IDLE=off` turns the idle lane off.
- **Crash and hang**: a persistent worker that exits, or does not answer within 15 s (8 s for a fg job), is killed (`SIGKILL`) and restarted after 0.5 s, doubling to at most 60 s while it keeps failing. Its job is retried once on another worker. A page that fails twice is recorded in `CACHE/render/bad.json` (`{"<pid>:<k>": {engine, error, at}}`) and answered with 422, so the client draws it with pdf.js; a document that has crashed an engine 3 times is not given to that engine again (the next engine, else pdf.js). `.part` files older than an hour are deleted at start.
- **Memory**: each Quartz or MuPDF worker keeps at most 8 documents open; a worker that has run 500 jobs is replaced when idle (bounds any leak in a long session).

### 3.4 Plans from hints, cancellation, back-pressure

The client sends a hint on every move (5.2). The server turns it into a **plan**: lazily generated lists of jobs per lane, newest hint first. A new hint (higher `seq`) **replaces** the plan: queued `near`, `ahead` and `idle` jobs that the new plan does not also contain are dropped. Running jobs finish; foreground jobs are never dropped by a hint, only when their last waiter disconnects before they start (`req.on('close')`).

From a hint `{H, per, pad, crop, cur: {id, s, dir, v}, next: [[id, s0], …], jump: [[id, s0], …], riffle?, idle}`, with `spreads(P, s, per)` = `spreadAt` from the profile when there is one, else `per` consecutive pages:

| Lane | Pri | Jobs, in this order |
|---|---|---|
| near | 95 − 3d | `cur`: the next `2 + 2·min(v, 3)` spreads in direction `dir` (d = 1, 2, …) |
| near | 90 − 3j | `next[0..2]`: analysis if missing, then the opening spread at `s0` |
| near | 86 | `cur`: one spread the other way |
| near | 84 | `cur`: sprite (Quartz), when missing |
| near | 82 | with `riffle: true`: every page of `cur` from `s` in direction `dir`, then the other way |
| ahead | 79 → 70 | `cur`: pages within 20 before and 40 after `s`, reading direction first |
| ahead | 76 − j | `next[3..11]`: analysis, opening spread |
| ahead | 74 − j/2 | `jump[0..15]`: analysis, opening spread |
| ahead | 60 | sprites of `next[0..5]` |
| ahead | 55 | `cur`: the rest of the document |
| ahead | 50 | `next[0..2]`: their first 12 pages |
| idle | 30 | the warm-up list (`CACHE/warm-hint.json`, the first 20 items of each lane in the reader's order, round-robin across lanes): analysis, opening spread at the hinted start, sprite |
| idle | 20 | the same items: the next 10 pages |
| idle | 10 | the same items: whole documents, then the rest of the corpus's PDFs by `rank()` as `compile.mjs` orders them |
| idle | 5 | profiles with `gen < GEN` or `stale: 'src'`: analysis again |

- **Back-pressure**: the generators are pulled only while a lane has fewer than `4 × W` queued jobs, so a hint never materialises thousands of jobs, and dropped plans cost nothing.
- **Persistence**: the last hint is written to `CACHE/render/plan.json` (at most every 5 s). At start the server replays it at `ahead` priority, so after a restart or a reload the next items are being prepared before the browser asks.
- **Opening spreads** are marked `pri: 90` in the store (they enter the profile's budgeted set, 3.6); other pages are render class.

### 3.5 Documents not analysed yet, and documents still downloading

- **Source**: `addSource(fn)` hooks are asked first (the Internet Archive workflow can return a whole-book PDF for a long scan; any local PDF works: the pool only ever sees a file path); then, for `kind: 'pdf'`, the cached original `cache.paths(it.url).body` when `cache.cached(it.url)`. Scans are not rendered unless a source hook returns a file for them.
- **Still downloading**: a job whose PDF is not cached waits in state `src` **without holding a worker**: `cache.ensure(url, {fg: lane === 'fg'})` (foreground politeness for fg, background otherwise; arXiv's 2 requests a second still apply), and the job re-enters its queue when the file lands. No partial rendering: a PDF needs its cross-reference table, at the end of the file, and arXiv's PDFs are not linearised; they are 1-12 MB and arrive in 0.5-3 s. `GET /render/page` answers 202 `{state: 'download', got, total}` meanwhile (from `cache.progressOf`), which the client shows (5.3).
- **No analysis yet**: the analysis job is queued at the highest priority of any page job waiting for it. Page jobs in `near`, `ahead` and `idle` wait for it (state `blocked`) and are then rendered cropped. **Foreground page jobs never wait for it**: they render the whole page at once (`box` full), and the browser crops that page by its own ink as it does today. When the analysis lands, the cropped versions of those pages are queued at `near`; they replace the whole-page records. If an analysis takes more than 1 s, `near` page jobs stop waiting and render whole pages too.
- **Analysis already in the store**: a current profile (`gen === GEN`, not stale) of any producer is used as it is, including one from the browser; the render service never overwrites a higher-ranked analysis (`putAnalysis` refuses with 409 anyway).

### 3.6 Storage in the profile store

Rendered pages are display images of the profile (`assets.display[k]`), written through new, additive functions in `server/profile.mjs` (the profile QA workflow owns the file; these are additions, with tests):

```js
/** Move rendered JPEGs into the profile's folder and record them, in one profile.json write.
 *  recs: [{k, file, w, h, box, H, pri, by}]. pri ≥ 50: the budgeted set (admitted by priority within
 *  budgetFor(n), as putAsset does; when it does not fit, it is stored as render class instead).
 *  pri < 50: render class, recorded with r: 1, outside the budget. A page keeps one record: a new one
 *  replaces the old (file renamed over it) unless the old has H ≥ 0.9 × the new H and covers the new box.
 *  Returns {ok, rev, written: [k], skipped: [k]}. */
export function putRendered(id, src, recs)
/** The record of page k if it can be shown at whole-page height h with box `want` (an [x0,y0,x1,y1]), else null. */
export function displayOk(id, src, k, h, want)
/** A sprite sheet or thumbnail file made by the service (as putAsset, but renaming a file in). */
export function putAssetFile(id, src, q, file)
```

- A render-class record is the same shape as any display record (`{f, v, w, h, box, H, pri, bytes}`) plus `r: 1` and `by`, so `profileOf`, `displayFor`, `assetUrl` and `GET /profile/asset` serve it unchanged. `v` is the first 10 hex digits of the file's sha1, as now.
- **Batched writes**: `render.mjs` collects a document's finished pages and calls `putRendered` at most every 250 ms per document (at once for fg), so a 364-page book does not rewrite `profile.json` 364 times.
- **Accounting**: `sumAssets` keeps `assets.bytes` for the budgeted part (unchanged meaning) and adds `assets.rbytes` for render class; the index record gains `pages` (render-class bytes) and `usedPages` (when one was last served). `profileState()` gains `renderBytes`, and `byEngine` counts `quartz` and `mupdf`.
- **Eviction**: the profiles tenant registers a third entry per profile, `<pid>:pages` (`s = pages`, `a = usedPages − 1 day`), next to `:heavy` and `:core`; removing it deletes the render-class files and their records. So the LRU drops a document's full page set before its opening spread, and both long before its JSON, sprite and text. A soft cap `STACKS_RENDER_MAX` drops `:pages` entries, least recently used first, to 90% of the cap.
- **Analysis changes**: `putAnalysis` already deletes display images whose box no longer covers the page's crop. With exact crops, a new analysis or another padding invalidates them; `render.mjs` listens (a small `onProfileChanged(fn)` hook in `profile.mjs`) and re-plans that document at `near` when it is the current one, `ahead` otherwise.
- **Cropping off**: the client asks with `crop=0`; the service renders whole pages, which replace the cropped records of that document.

### 3.7 Disk budget, and `STACKS_CACHE_MAX`

- **`STACKS_CACHE_MAX` default** (in `server/cache.mjs`, additive): when the variable is not set, `MAX = clamp(0.25 × (bytes in the cache + free bytes on its volume), 8 GiB, 64 GiB)`, computed at start with `fs.statfsSync(CACHE)` (Node 18.15+) and logged once. A Mac with 500 GB free gets 64 GiB; this container, with 1-6 GB free, keeps 8 GiB. Also a floor of free space: when the volume has under 10 GiB free, eviction runs to free space down to 90% of the current total, whatever the cap. This answers the churn of the profiles spec (section 1.3, problem 6: whole-book scan prefetches of 50-100 MB filling 8 GiB).
- **`STACKS_RENDER_MAX`** default: 40% of `MAX` (25.6 GiB at 64 GiB). Every page of every PDF in the corpus at 2,200 px is about 8 GB, so the corpus fits three times over; the cap matters only on small disks.
- `STACKS_PROFILE_MAX` (4 GiB, the budgeted heavy assets) is unchanged.
- The idle lane stops at 90% of `STACKS_RENDER_MAX`; `ahead` keeps going (its pages are wanted soon, and the LRU drops older pages).

### 3.8 Failures, briefly

| Failure | Behaviour |
|---|---|
| No engine | `/status` `render.engine: null`; the client never calls the service |
| Swift build fails | next engine; `CACHE/render/build.log`; `/status` `render.quartz: {ok: false, why}` |
| Worker crash or hang | 3.3: kill, restart with backoff, retry once, then 422 for that page and pdf.js in the client |
| Encrypted PDF | `info` fails with `encrypted`; the item is marked bad for all engines; pdf.js as today |
| Disk full | writes fail: the lane pauses for 5 minutes, `/status` `render.diskFull: true`; eviction runs |
| PDF changed on the source | the profile goes `stale: 'src'` (existing sha1 check); idle re-analysis; pages re-rendered when used |

### 3.9 HTTP API (`server/routes/16-render.mjs`)

All loopback, JSON errors `{error, …}`.

**`GET /render/page?id=&k=&h=&pad=&crop=1&lane=fg&wait=1500[&size=display|thumb][&src=]`**

- If the store has a record that `displayOk` accepts, it is served at once (`touchProfile` with `heavy`). Otherwise a job is created or joined in `lane`; a `fg` request waits up to `wait` ms (at most 1,500), any other lane gets its answer at once. **No background request holds a connection**: Firefox opens at most 6 connections to one server (`network.http.max-persistent-connections-per-server`), and they are shared with `/proxy` downloads, summaries and the rest; only the pages on screen (at most 3) ever wait.
- 200: the JPEG. Headers: `Content-Type: image/jpeg`, `ETag: "<v>"`, `Cache-Control: no-cache` (the URL is not versioned; a repeat is a 304 over loopback), and `X-Render: {"w","h","box","H","v","pw","ph","by","ms","r"}` (`ms`: engine time, 0 when served from the store).
- 202: `{state: 'download' | 'queued' | 'blocked' | 'running', got?, total?, eta?}` when not ready within `wait`.
- 404 `{error: 'off' | 'unknown id' | 'not pdf'}`; 422 `{error: 'failed', detail}` (bad page or document).

**`POST /render/hint`** (JSON, at most 64 KB): the hint of 5.2. 200: `{ok: true, seq, engine, ready: {"<id>": {H, bits}}}` for `cur` and `next[0..3]`, where `bits` is a string of `'1'`/`'0'` per page: a display record good for `H` exists. Older `seq` values are ignored (200 with `stale: true`).

**`GET /render/state?id=&h=`** or **`?ids=a,b,…&h=`** (up to 16): `{id, n, H, bits, running: [k], queued, rate, eta, analysis: 'done' | 'queued' | 'running' | null, src: {done} | {got, total} | null, engine}` (with `ids`: `{"<id>": {…}}`); `rate` is pages a second for this document over the last 10 s, `eta` seconds until every page is ready at that rate. Answers at once.

**`POST /render/batch`** `{ids?, lanes?, items?, pages: 'opening' | 'all', h, lane: 'ahead' | 'idle'}`: queues documents outside the hint plan (used by `prerender.mjs`); 200 `{queued, items}`.

**`GET /render/engines`**: `detect()` and `engine.json`.

**`GET /status`** gains `render: {engine, analysis, workers, running: {fg, near, ahead, idle}, queued: {…}, done, failed, restarts, p50, p90, pagesPerSec, bytes, max, ac, idle, diskFull, quartz: {ok, why?}}`, and `mem: {total}` (`os.totalmem()`, for the client's memory budget, 5.4).

### 3.10 `prerender.mjs`

```
node prerender.mjs --bench [--pages 24] [--h 2200]          # 2.6; writes CACHE/render/engine.json
node prerender.mjs --self-test [--keep]                    # 7.2; PASS / FAIL lines, exit code
node prerender.mjs [--lanes ai-safety,llm] [--ids a,b] [--items 200] [--pages opening|all] [--h 2200] [--port 4747]
```

The batch form talks to a running server (as `compile.mjs` does; it starts one for the run if none answers) and sends `POST /render/batch` at `idle` priority, but marked so that it runs regardless of the idle conditions, then follows `GET /status` and prints progress (pages, pages a second, bytes). `--pages all` for the whole corpus is a few minutes of engine time plus downloads.

## 4. Display sizes

- **What one image pixel per device pixel needs.** The stage is about 960 CSS px tall on the laptop (1,728 × 1,050 window) and 1,350 on the 4K screen at "looks like 2560 × 1440"; pages are height-limited (two or three a spread); the body crop is about 0.84 of a paper's height. So the whole page needs `stage × devicePixelRatio / 0.84` px: **about 2,290 on the laptop**, and 3,210 in the 4K screen's 2x backing store, which macOS scales by 0.75 to the panel: **about 2,400 physical**.
- **One class, 2,200, serves both.** On the laptop it is 1:1 (2,290 is 4% over); on the 4K screen it is 0.92 of the physical pixels, which is not visible. Rendering 2,600 for the 4K screen would cost 40% more pixels to decode and store, and a second copy of every page when the reader moves between screens. Downscaling in the browser costs nothing measurable (the GPU draws the canvas scaled).
- **The rule** (in `render.js`, as `renderPx()`): `need = stageHeight × devicePixelRatio / 0.84`; class 1,400 when `need ≤ 1,450`, 1,800 when `≤ 1,850`, else 2,200. Computed at boot and on `resize`; sent as `h` in every request and `H` in every hint. A 1,080p screen at 1x gets 1,400.
- **`RENDER_H` stays** for the pdf.js fallback (1,400-2,200 from `screen.height`; 1,785-1,899 on the laptop, 2,200 on the 4K screen). `displayFor(P, k, RENDER_H)` accepts any image with `H ≥ 0.9 × RENDER_H`, so 2,200 images satisfy both screens.
- **Landscape pages**: `h = min(class, round(1.3 × class × ph / pw))`, so a landscape page is at most 2,860 px wide at the 2,200 class (lasers: 1,700 × 2,200 instead of 2,200 × 2,847).
- **Zoom** (`z`) shows one page at the same height-limited size, so it needs no other class. **Fit width** (`state.fit === 'width'`) shows a page across the stage, about 2.6 times taller than the stage: the client asks for `h = 3300` for the pages on screen (fg) and the next spread (near) only; the 3,300 record replaces the 2,200 one and serves both.
- **The client tells the server its screen** only through `h`/`H`; the server keeps no screen state. Two screens in one session simply ask for the same class.

## 5. The client

### 5.1 `render.js`

Additive changes (the Internet Archive workflow also edits this file, for scan sizes; coordinate):

1. `export function renderPx()` (section 4) and `export const serverRender = { on: false }`, set from `/status` (`render.engine != null`) at boot and on every status poll.
2. **Server pages.** In `renderPage1`, for a PDF, after the existing display-record path and before pdf.js:

```js
// A page the server has rendered, or renders now. Foreground: it waits up to 1.5 s, and anything
// but a 200 (202, 404, 422, offline) falls back to pdf.js as before. Prefetch ('near'): answered at
// once; a page not ready yet throws NotReady (renderPage drops that promise from `renders`).
export class NotReady extends Error {}
async function serverPage(it, k, pf, pg, lane = 'fg') {
  if (!serverRender.on || it.kind !== 'pdf') return null;
  const crop = state.crop !== false, pad = state.cropPad ?? DEFAULT_PAD;
  const q = `id=${enc(it.id)}&k=${k}&h=${renderPx()}&pad=${pad}&crop=${crop ? 1 : 0}&lane=${lane}&wait=${lane === 'fg' ? 1500 : 0}`;
  const r = await fetch('/render/page?' + q).catch(() => null);
  if (r?.status === 202 && lane !== 'fg') throw new NotReady(it.id + ' p. ' + (k + 1));
  if (!r || r.status !== 200) return null;
  const rec = JSON.parse(r.headers.get('X-Render')), blob = await r.blob();
  if (pf && pg) {
    ((pf.assets ||= {}).display ||= {})[k] = { f: '', v: rec.v, w: rec.w, h: rec.h, box: rec.box, H: rec.H, pri: 0, bytes: blob.size, r: 1 };
    const fw = rec.w / (rec.box[2] - rec.box[0]);
    return panelsFromBlob(blob, k, rec.box, crop ? cropOf(pf, k) : FULL, pg.gut, { pdfScale: fw / pg.w, src: 'server' });
  }
  // No analysis yet (the first pages of a never-seen PDF): the whole page, cropped by its own ink
  // as today; analyze() reads a 240-px copy of the decoded bitmap.
  const bm = await createImageBitmap(blob);
  const a = analyze(bm);
  if (a.blank) { bm.close(); return [{ blank: true, k }]; }
  return panelsFromBitmap(bm, k, rec.box, crop ? a.box : FULL, a.gutter, { pdfScale: bm.width / rec.pw, src: 'server' });
}
/** Panels from an encoded image showing region `ibox` of the page. One part covering the whole image
 *  (the server cropped it exactly): decoded as it is, no rectangle, no copy. Otherwise decoded once
 *  and cut (column splits, a padding that differs from the server's). Never through an <img>. */
async function panelsFromBlob(blob, k, ibox, box, gutter, extra) { … }
/** The same from a decoded ImageBitmap (closed when cut). */
function panelsFromBitmap(bm, k, ibox, box, gutter, extra) { … }
```

   `renderPage(it, k, {lane})` gains the option (default `'fg'`); `prefetch.js` passes `'near'`. A `near` request is answered at once: when the page is not ready (202) it rejects with a `NotReady` error and its promise is removed from `renders`, so a later foreground call asks again; it never falls back to pdf.js (that would put the work back on the main thread). The render key does not include the lane.
3. **The display-record path too**: `if (d)` in `renderPage1` fetches `assetUrl(pf, 'display', k)` as a `Blob` and calls `panelsFromBlob` instead of `loadImg` + `panelsFromImage` (1.6: the `<img>` path stalls the main thread about 110 ms a page here). Scans keep `loadImg` (that is the Internet Archive workflow's choice for its previews). Within `panelsFromBlob`, a single part whose rectangle is within 2 px of the whole image is decoded with `createImageBitmap(blob)` and no rectangle (25-39 against 37-46 ms with one, here).
4. `displayFor` (in `profile.js`) also accepts a record whose box is the whole page when cropping is off.
5. Decoded bitmaps go straight into a `bitmaprenderer` canvas (`bitmapCanvas`, as today), so nothing is copied for display.

The panel shape is unchanged: `{canvas, k, box, srcW, srcH, part?, pdfScale, src}`, with `srcW × srcH` the whole page at the image's scale and `pdfScale = srcW / page width in points`, exactly what a pdf.js render at that scale produces. `src: 'server'` marks them for the benchmark and for `compile.js` (which writes back only `src: 'pdfjs'` panels).

### 5.2 `prefetch.js`: hints

```js
// The server renders ahead of the reader (docs/performance/prerender.md, 3.4).
let hintSeq = 0, hintT = 0;
export function sendHint(extra = {}) { … }   // debounced 80 ms; immediately on item:shown
```

The body:

```json
{ "seq": 412, "H": 2200, "per": 2, "pad": 0.012, "crop": true,
  "cur": { "id": "arxiv:1706.03762", "s": 4, "dir": 1, "v": 1 },
  "next": [["arxiv:2212.08073", 0], ["arxiv:2304.06528", 0], ["ttrpg:srd521", 18]],
  "jump": [["arxiv:1606.06565", 0]],
  "riffle": false, "idle": false }
```

- **When**: from `planAround` (every move: item shown, spread settled, turn), on `stack:changed` and whenever `state.order` changes (sort, scope, Up Next), on `riffle` start (`riffle: true`), and on `visibilitychange` (`idle: document.hidden`).
- **`next`**: `state.order.slice(pos + 1, pos + 13)` with `startOf(i)` for each (which already includes where you left an item, `features/memory.js` reopeners, and `it.best`): the stack and Up Next, as `stack.js` `upNext(12)` gives them.
- **`jump`**: likely jumps that are not next in the order, gathered from an event so the views need no import: `emit('prefetch:candidates', {ids, from})` from the wall (tiles in view, the hovered tile first), search (the top 5 results as you type, debounced 200 ms), the panel's related list (on `panel:painted`), the library (the hovered row) and the feeds view (the hovered card). `prefetch.js` keeps the 16 most recent, hovered ones first.
- **`v` for hops**: `velocity()` counts page turns only. `nav.js` `go()` pushes `{at, dir}` to a new `state.hops`; at 2 or more hops in 1.5 s in one direction, `planAround` prepares the next 6 items' first spreads in the browser instead of 3, and only their first page beyond the third item.
- **Readiness**: the hint reply carries `ready` bits for `cur` and `next[0..3]`; after each hint, `GET /render/state?ids=` for those items every 250 ms for 2 s, then every second while the current item is incomplete (5.3 uses the same answers). No long-lived connection.
- **Decode or just fetch**: `planAround`'s render tasks (decoded into memory) stay as they are, through `renderPage(…, {lane: 'near'})`, but are scheduled only for pages the latest bits say are ready; pages that become ready are planned on the next answer. Beyond them, ready pages are fetched without decoding (`fetch` at low priority in the client scheduler), so the next decode reads from the HTTP cache: the next 8 spreads of the current item and the first spread of `next[3..5]`. When the service is on, `planAround` never starts a pdf.js render for a PDF; only a foreground request that the server could not answer in 1.5 s does.
- `loadProfiles` covers `jump` items too.

### 5.3 `feed.js`: what the reader sees

- **The badge and the track band count rendered pages.** `pollLoaded` today marks a PDF 100% ready as soon as its file is on disk, which hides exactly the PDF cost. With the service on, for PDFs: the readiness answers of 5.2 (every second while incomplete, every 2 s when nothing changed), `bits` = server-ready **or** already rendered in this tab (`renderedNow`). The band paints those bits; the badge reads `62% · 14 ready ahead · ~3 s`, and its tooltip `9 of 15 pages are rendered on your disk. 14 pages after these are ready to turn to instantly. Rendering 6.1 pages a second, about 3 s to go.` While the PDF itself is downloading, the badge shows the download as today (`↓ 40% of 3.2 MB`), from `state.src`. When every page is ready, the badge hides, as for scans.
- **The waiting note** (`waitingNote`, after 250 ms) says what the wait is: `Downloading p. 3 from arxiv.org · 1.2 s` while the source downloads, `Rendering p. 3 · 0.4 s` while the server renders it, and today's text otherwise.
- **The download note** (`showDownload`) also runs when the page count is known from a profile but the PDF is not on disk (today it runs only while `n` is unknown).
- **Track scrub** (`fillScrub`): the sprite cell at once (as now); then, with the service on, the page's image without the 250 ms delay when the page is ready (the bits say so), else a hint naming that page (`cur.s` = the page under the pointer, debounced 120 ms) and the image when the next readiness answer has it. `quickPdf` only when the service is off. `pointerenter` on the track sends a hint with `riffle: true`.
- **Riffle** (`riffleStart`): hint with `riffle: true` (every page of the item at `near`, sprite first); each riffle frame shows the sprite cell at once and the decoded image in the same frame when it is in memory, else when it decodes.

### 5.4 Memory caches by bytes

The reader has 64 GB; the caches count items. Change them to bytes, with a budget from the server (`/status` `mem.total`, since Firefox does not expose `navigator.deviceMemory`): `RENDER_BYTES = clamp(0.025 × total, 300 MB, 1.6 GB)` (1.6 GB on the reader's Mac).

| Cache (file) | Today | Then |
|---|---|---|
| rendered pages, `renders` (`render.js`) | 30 or 48 renders | `RENDER_BYTES`, each entry costing Σ canvas `w × h × 4` (about 11 MB for a cropped 2,200-px page: about 140 pages) |
| finished renders, `done` (`render.js`) | 400 entries | unchanged (references into `renders`) |
| page images, `imgs` (`render.js`) | 60 | 400 MB by `naturalWidth × naturalHeight × 4` |
| quick track renders, `quick` (`feed.js`) | 120 | 30 when the item has a sprite or the service is on (they are only the fallback) |
| pdf.js documents, `docs` (`docs.js`) | 16 | unchanged |

`lru()` in `util.js` gains a byte-counting variant, `lruBytes(map, key, make, capBytes, sizeOf)`, so the change is local.

### 5.5 pdf.js stays, lazily

The text layer (`features/textlayer.js`), figure peek (`features/figpeek.js`) and read-aloud (`features/readaloud.js`) need the pdf.js document; it still opens on `spread:settled` (the text layer) and in idle time after `item:settled` (`prefetch.js`), never on the path to the first paint. Geometry matches because the server renders the same rectangle pdf.js shows: the crop box ∩ media box, `/Rotate` applied (1.8, Appendix C), and the panel carries `box` (the region shown, in fractions of that page), `srcW × srcH` (the whole page at the image's scale) and `pdfScale` (`srcW` ÷ the page width in points); `placeLayer` in the text layer uses `srcW`, `srcH` and `box` only, and figure peek uses `srcW` and `srcH`. Test T7 checks word boxes over server images against pdf.js renders.

### 5.6 Other features

- **`features/compile.js`**: when `/status` reports a render engine, skip the write-back of pdf.js renders (`queueWrite`; the server renders better images and the browser's WebP encoding costs 262-390 ms of CPU a page) and skip sprites when the engine is Quartz; keep the analysis, figures and text, which the server does not do as well (font sizes, figures). Its `fresh` check already prevents it from replacing a current server analysis.
- **`panel.js` outline**: use the profile's `toc` when there is one, instead of `openDoc` on every `item:settled` (that parse is what opens the PDF for items shown from images).
- **The wall** (owned by the Wall v2 work): covers and contact sheets can come from the sprite and from `GET /render/page?size=thumb`, instead of up to 40 pdf.js documents of its own.

## 6. Caching and prefetching beyond rendering

Concrete problems in `prefetch.js`, `feed.js`, `cache.mjs` and their neighbours, each with its fix and the expected effect. Line numbers drift (other work is editing these files); function names are the stable reference.

| # | Problem (where) | Fix | Expected effect |
|---|---|---|---|
| 1 | **Predictions are lost on reload.** Everything `planAround` prepares lives in the tab's memory (`renders`, `done`), and the server's cache holds bytes, not pages. | Rendered pages on disk (3.6); the last plan replayed at server start (3.4). | After a reload, the first spread is a decode (≈ 100-150 ms) instead of 770-1,870 ms. |
| 2 | **`j j j` outruns the planner.** `planAround` prepares only the next 3 items' first spreads, starting when you land; `velocity()` ignores item hops; renders for skipped items keep running in the 4 client slots. | The server prepares the next 12 items (near for 3, ahead for 12) from every hint; hop velocity widens the browser's window to 6 (5.2). | A hop to a not-yet-opened PDF ≤ 150 ms p90 at 3 hops a second (T4). |
| 3 | **Jumps from search, the wall, related items, the library and feeds land cold.** `jumpTo` inserts the item; nothing was prepared. | `prefetch:candidates` events feed `jump` in the hint (5.2); their first spreads render in `ahead`. | A jump to an item hovered for ≥ 300 ms lands in ≤ 250 ms (T5). |
| 4 | **The PDF is parsed on every item, even when shown from images**: `panel.js` opens it for the outline on `item:settled`, the wall and figure finder each parse their own copy. | Outline from the profile's `toc`; the wall from sprites and thumbs (5.6). | One parse per item, in idle time. |
| 5 | **The badge says PDFs are 100% ready** as soon as the file is on disk (`pollLoaded`), and the band is full; the real wait (pdf.js) is invisible. | Readiness from `/render/state` (5.3). | The band shows what is really ready, and the ETA is real. |
| 6 | **The waiting note blames the network** (`waitingNote` names the PDF's host even when the wait is local rendering), and `showDownload` stays silent for a PDF whose page count is known but which is not on disk. | Separate download and render messages; download note whenever the file is missing (5.3). | The reader knows what the wait is. |
| 7 | **Memory caches count items** (`RENDER_CAP` 30/48, `imgs` 60, `quick` 120). | Bytes, budgeted from the machine's RAM (5.4). | About 140 decoded pages kept on the reader's Mac instead of 30; turning back through a paper never re-decodes. |
| 8 | **The 8 GiB cap churns** (profiles spec 1.3, problem 6). | Default from the volume's free space, 8-64 GiB, with a 10 GiB free-space floor; rendered pages capped at 40% (3.7). | No eviction of wanted pages on a large disk. |
| 9 | **Track hover renders with pdf.js** (`quickPdf`, 700 px) for PDFs without a sprite. | Quartz sprites for the current and next items; display images without the 250 ms delay when ready (5.3). | No pdf.js work while scrubbing; sharp pages under the pointer within a decode. |
| 10 | **Browser write-back spends 262-390 ms of CPU a page** encoding WebP (`features/compile.js`). | Off when a render engine runs (5.6). | That CPU goes back to the reader. |
| 11 | **Server prefetch downloads PDFs and stops** (`serverPrefetch` groups `next-items`, `later-items`): nothing parses or renders them until the browser does. | The plan's analysis and opening-spread jobs start the moment a planned PDF lands (3.5). | The next items are ready to show, not just on disk. |
| 12 | **`compile.mjs`'s poppler engine renders the media box** (no `-cropbox`), and `pdftotext` can take 18 s on one book. | `server/pdfnative.mjs` (2.7): `-cropbox`, text in parallel ranges, MuPDF or Quartz for text when present. | Correct crops on PDFs with a CropBox; book analysis in about a second. |
| 13 | **A profile arriving mid-visit redraws every page** (renders are keyed by `cropKey`, `prefetch.js` `profile:updated`). | Unchanged mechanism, but a redraw is now a decode from the HTTP cache, not a pdf.js render. | The re-plan costs tens of ms instead of seconds. |
| 14 | **The warm-up hint is used only for bytes** (`60-warm.mjs` fetches first spreads; `compile.mjs` orders its batch). | The idle lane renders those items' first spreads and sprites (3.4). | The first items of every lane open from images on the first day. |
| 15 | **`profileSoon` waits up to 60 ms** for the profile of an item not yet known. | Unchanged; `loadProfiles` now covers `next` and `jump` items, so it is rarely reached. | Fewer 60 ms stalls on jumps. |
| 16 | **Display images are cut on the main thread.** `render.js` loads them through `<img>` and cuts them with `createImageBitmap(img, rect)`: about 110 ms of main-thread stall per 2,200-px page here (1.6), and the pages of a spread are cut one after another. | `Blob` and `createImageBitmap(blob)`, no rectangle when the server cropped exactly (5.1). | The decode leaves the main thread; key presses during a switch are not delayed. |
| 17 | **Six connections per host.** Firefox opens at most 6 connections to the local server; long `/proxy` downloads (and any long-poll) can block the requests the reader is waiting for. | The render client holds connections only for pages on screen (at most 3, at most 1.5 s each); everything else answers at once (3.9, 5.2). The `/proxy` side is a separate task. | Rendering never adds to the queue of blocked requests. |

## 7. Tests and numbers to hit

### 7.1 Here (Linux, headless Chromium, poppler and MuPDF engines)

A Playwright benchmark, `test/render-bench.mjs` (new), against a test server with a fresh cache; 1,728 × 1,050 at 2x and 2,560 × 1,440 at 2x; three runs, interleaved with the service on and off (`STACKS_RENDER_ENGINE=off`):

| # | Test | Target |
|---|---|---|
| T1 | Cold first spread of a pre-rendered PDF not open in the browser (render and document caches dropped, HTTP cache warm), key press to `spread:rendered` | here: p50 ≤ 300 ms and at most a third of the service-off time in the same interleaved run (today's display images: 219-529 ms p50, pdf.js 708-1,482); on the Mac: p50 ≤ 150 ms, **p90 ≤ 250 ms** |
| T2 | Cold first spread of a PDF on disk with nothing rendered (fg on demand) | p90 ≤ 700 ms here with poppler; ≤ 400 ms on the Mac with Quartz |
| T3 | Turns through a 30-page paper, one every 400 ms (Space), after 2 s on page 1 | **p50 ≤ 40 ms, p90 ≤ 80 ms** (here and on the Mac: turns ahead are prepared, so this is a paint); one every 150 ms: p90 ≤ 120 ms; longest main-thread task during the run ≤ 50 ms |
| T4 | `j` at 3 a second through 12 PDFs not yet opened in the tab, the first after 2 s | first spread p90 ≤ 150 ms on the Mac (≤ 400 ms here); no `openDoc` on the path to any first paint |
| T5 | Jump (search result, wall tile, related item) to an item hovered ≥ 300 ms | ≤ 250 ms |
| T6 | Riffle at 20 pages a second for 3 s through a pre-rendered 100-page PDF | every frame shows a sprite cell or a page (no empty placeholder); ≥ 90% of riffle stops sharp within 100 ms; the release spread sharp within 80 ms |
| T7 | Geometry: text-layer word boxes over server images vs over pdf.js renders, 40 pages including Ashby (rotated), the CropBox page of Appendix C and the landscape page | ≤ 1 px apart at 2,200 px |
| T8 | Foreground under load: every worker busy with idle-lane jobs, then 20 fg page requests | fg p90 ≤ the engine's single-page p90 + 50 ms |
| T9 | Crash: `kill -9` a worker mid-job | worker back within 2 s; the request answered (retry or 422 → pdf.js) within its `wait`; no `.part` left after restart |
| T10 | Disk: render 2× `STACKS_RENDER_MAX` worth of pages | render-class bytes ≤ cap + 2%; opening spreads and `:core` survive; the index matches the files |
| T11 | Hints: 50 hints in 5 s (fast `j`) | queued jobs ≤ 4 × W per lane at every moment; no job for an item no longer in the plan starts after the hint that dropped it |
| T12 | Idle lane | 0 jobs while hints arrive or on battery (simulated); ahead ≤ 2 workers on battery |
| T13 | Connections, during T4 and T6 | never more than 3 open `/render/page` requests from the tab; no request to the server waits for a free connection because of the render client |

Unit and API tests (`node --test`): `test/render-protocol.test.mjs` (poppler and MuPDF adapters against Appendix C: sizes, rotation, crop box, pixel rectangles, `.part` handling, 255-character lines), `test/render-store.test.mjs` (`putRendered`, budget vs render class, `:pages` eviction, `displayOk`), `test/render-plan.test.mjs` (hint → plan, replacement, back-pressure, promotion, dedupe), `test/render-api.test.mjs` (the routes against a test server with `STACKS_RENDER_ENGINE=poppler`).

### 7.2 On the Mac: one command

```bash
cd apps/open-stacks/browser && node prerender.mjs --self-test
```

It needs nothing but Node; with the Command Line Tools it tests Quartz, and it tests poppler and MuPDF when Homebrew has them. It prints one line per check and exits 1 on any failure:

1. **Machine**: macOS version, chip and cores (`sysctl -n machdep.cpu.brand_string`, `hw.perflevel0.logicalcpu`, `hw.perflevel1.logicalcpu`), RAM, AC power, free disk, and which of `xcode-select -p`, `xcrun --find swiftc`, `pdftoppm`, `mutool`, `taskpolicy` exist.
2. **Build** the Quartz helper (or reuse it): time, and the `hello` reply, including whether ImageIO writes WebP (1.10).
3. **Geometry**: writes the Appendix C PDF to a temporary folder and, for every engine, runs `info` (sizes and rotation as expected), `lum` at 400 px (each page's marker squares and bar found within 1.5 px of where pdf.js puts them), and `render` at 2,200 px with a crop box (the JPEG's size, read from its SOF marker, as `pixelRect` says).
4. **Protocol**: a 2 KB command line; a missing file (an error reply, and the worker still answers `hello`); `kill -9` of a worker mid-render (the pool restarts it).
5. **Speed**: the benchmark of 2.6 (latency, throughput with `cores − 1` workers, lum and text per page) on cached PDFs, printed as a table, and saved to `CACHE/render/engine.json`.
6. **End to end** (when a server answers on `--port`, default 4747): `GET /render/page` for the first page of a cached paper, then the same again (served from the store), with times.

Then, in Firefox: open `http://localhost:4747/?bench=render`. That page (`ui/js/render-bench.js`, wired like `?bench=profile` in `features/compile.js`) runs T1, T3, T4 and T6 in the reader's own browser and prints the table to the console and to `/stats.html`'s diagnostics. Targets on the Mac are those of 7.1 (T1 p50 ≤ 150 ms and p90 ≤ 250 ms, T3 p90 ≤ 80 ms, T4 p90 ≤ 150 ms, T6), plus an ahead-lane throughput of **≥ 60 pages a second** at 2,200 px with Quartz (`/status` `render.pagesPerSec` during a batch).

## 8. Files, order of work, risks, questions

### 8.1 New files (the render builder owns them)

| File | Effort |
|---|---|
| `server/pdfnative.mjs` | L |
| `server/native/stacks-render.swift` (Appendix A) | M |
| `server/native/mu-worker.js` (Appendix B) | S |
| `server/render.mjs` | L |
| `server/routes/16-render.mjs` | M |
| `prerender.mjs` | M |
| `ui/js/render-bench.js` | M |
| `test/render-*.test.mjs`, `test/render-bench.mjs`, `test/fixtures/geometry.pdf` (from Appendix C) | M |

### 8.2 Edits outside them (minimal and additive; coordinate with the owners)

| File | Owner | Edit |
|---|---|---|
| `server/profile.mjs` | profile QA | `putRendered`, `displayOk`, `putAssetFile`, `onProfileChanged`; `rbytes`, `pages`, `usedPages`; the `:pages` tenant entry; `STACKS_RENDER_MAX` soft cap; `RANK` for `quartz` and `mupdf`; `byEngine` (3.6) |
| `compile.mjs` | profile QA | poppler path through `server/pdfnative.mjs`; `pgmLum` re-exported (2.7) |
| `server/cache.mjs` | IA workflow (archive.org parts) | the `MAX` default from the volume, the free-space floor (3.7) |
| `ui/js/render.js` | IA workflow (scan sizes) | `renderPx`, `serverRender`, `serverPage`, `NotReady`, `panelsFromBlob` and `panelsFromBitmap` (also for the existing display-record path, instead of `loadImg`), `renderPage(…, {lane})`, byte caps (5.1, 5.4) |
| `ui/js/profile.js` | profile QA | `displayFor` accepts whole-page records with cropping off |
| `ui/js/prefetch.js` | — | `sendHint`, candidates, hop velocity, fetch-ahead (5.2) |
| `ui/js/feed.js` | — | badge and band from `/render/state`, waiting and download notes, scrub and riffle (5.3); `quick` cap |
| `ui/js/nav.js` | — | `state.hops` in `go()` |
| `ui/js/util.js` | — | `lruBytes` |
| `ui/js/panel.js` | — | outline from the profile's `toc` |
| `ui/js/features/compile.js` | profile QA | skip write-back (and Quartz sprites) when the service runs; `?bench=render` hook |
| `ui/js/wall.js`, `search.js`, `features/library.js`, `features/feeds.js` | their owners | one `emit('prefetch:candidates', …)` line each |

### 8.3 Order of work

1. **Day 1**: `server/pdfnative.mjs` with the poppler and MuPDF engines, Appendix C as a fixture, `test/render-protocol.test.mjs`; `prerender.mjs --bench` and `--self-test` (the Quartz parts written, testable only on the Mac). `compile.mjs` switched over (fixes 1.8).
2. `profile.mjs` additions with `test/render-store.test.mjs`.
3. `render.mjs` and `16-render.mjs` with the plan and API tests, running on poppler here.
4. Client: `render.js` server pages and rectangle skip, hints, badge; T1-T6 here.
5. Section 6 fixes 4-17, byte caps.
6. The reader runs the self-test and `?bench=render` on the Mac; tune `W`, lane caps and the class from the numbers.

### 8.4 Risks

- **The Swift helper cannot be compiled or run here.** Mitigation: it is optional, small (Appendix A, written against documented APIs only), built and tested by `--self-test` before it is used, and the service falls back to poppler, MuPDF or pdf.js on any failure. The first run on the Mac may need a fix or two to the Swift source; the self-test output says where.
- **Quartz draws differently from pdf.js** (font rasterisation, no annotations or form fields). Mitigation: T7 checks geometry; text is drawn by Apple's own PDF renderer, which most readers prefer.
- **ImageIO's quality scale differs from libjpeg's**: 0.8 may give larger or smaller files than poppler's 80. The bench records KB per page; adjust `q` if a page averages over 450 KB at 2,200 px.
- **Heat and battery**: nine workers at full tilt on a laptop. Mitigation: background lanes at utility or background QoS (efficiency cores first), the idle lane only on AC, ahead capped at 2 workers on battery.
- **Disk growth**: bounded by `STACKS_RENDER_MAX` and the LRU; the free-space floor protects a nearly full disk.
- **Two writers to a profile** (the browser compiler and the service): `putAnalysis` ranks producers; display records are one per page and replaced only by a sharper or more complete image.
- **Exact crops are fragile to analysis changes**: a new analysis invalidates that document's images, which are re-rendered in the background while pdf.js covers the gap. A bleed would avoid that at the cost of a crop rectangle on every decode (+12 ms here); revisit if T3 shows invalidation churn.

### 8.5 Questions for the reader

1. One size (2,200 px) for both screens, or 2,600 for the 4K screen at the cost of 40% more decoding and a second copy when you switch screens?
2. The disk: rendered pages may use up to 40% of a cache that defaults to a quarter of the free space (up to 64 GiB). Enough, too much?
3. Warm-up of the whole corpus when the Mac is idle and plugged in: on by default?
4. Should pre-rendering also cover scans when the Internet Archive workflow downloads whole-book PDFs (`addSource`), or keep scans on page images?

## Appendix A: `server/native/stacks-render.swift`

Written for macOS 11 or later (Apple silicon ships with it), Swift 5.5 or later, against documented APIs only; not compiled here (no Swift toolchain in this container). The self-test (7.2) builds and checks it.

```swift
// stacks-render: renders PDF pages with Quartz (CoreGraphics + ImageIO) for the Stacks Browser. macOS only.
// Built once by server/pdfnative.mjs:
//   swiftc -O -o "$CACHE/render/bin/stacks-render-<sha1 of this file, 10 hex>" server/native/stacks-render.swift
// Protocol (docs/performance/prerender.md, section 2.2): one JSON command per line on stdin,
// one JSON reply per line on stdout, in order. Every reply has "id" (copied) and "ok".
//   {"id":1,"op":"hello"}
//   {"id":2,"op":"info","file":"/abs/doc.pdf"}
//   {"id":3,"op":"render","file":…,"k":0,"h":2200,"box":[0,0,1,1],"q":0.8,"out":"/abs/d0.jpg","lane":"fg"}
//   {"id":4,"op":"lum","file":…,"ks":[0,1,2],"h":400,"out":"/abs/dir/p"}         -> p-<k>.pgm (8-bit P5)
//   {"id":5,"op":"text","file":…,"ks":[0,1],"out":"/abs/t.txt"}                   -> those pages joined by \f
//   {"id":6,"op":"sprite","file":…,"cells":[{"k":0,"box":[x0,y0,x1,y1]},{"k":1,"box":null}],
//            "cw":80,"ch":120,"cols":32,"q":0.6,"out":"/abs/s0.jpg","lane":"ahead"}
//   {"id":7,"op":"close","file":…}      {"id":8,"op":"quit"}
// Boxes are fractions of the displayed page (rotation applied, y down), as everywhere in the app.
import Foundation
import CoreGraphics
import ImageIO
import PDFKit

setvbuf(stdout, nil, _IOLBF, 0)

struct Fail: Error, CustomStringConvertible { let description: String; init(_ s: String) { description = s } }

// ---------------------------------------------------------------- documents ----
var docs = [String: CGPDFDocument]()
var lru = [String]()
func doc(_ path: String) throws -> CGPDFDocument {
  if let d = docs[path] { lru.removeAll { $0 == path }; lru.append(path); return d }
  guard let d = CGPDFDocument(URL(fileURLWithPath: path) as CFURL) else { throw Fail("cannot open") }
  if d.isEncrypted && !d.isUnlocked && !d.unlockWithPassword("") { throw Fail("encrypted") }
  docs[path] = d; lru.append(path)
  while lru.count > 8 { docs.removeValue(forKey: lru.removeFirst()) }
  return d
}

/// A page as pdf.js shows it: the crop box (clipped to the media box), rotated by /Rotate.
struct Geom { let page: CGPDFPage; let box: CGRect; let rot: Int; let w: CGFloat; let h: CGFloat }
func geom(_ d: CGPDFDocument, _ k: Int) throws -> Geom {
  guard k >= 0, k < d.numberOfPages, let p = d.page(at: k + 1) else { throw Fail("no page \(k)") }
  let media = p.getBoxRect(.mediaBox)
  var box = p.getBoxRect(.cropBox).intersection(media)
  if box.isNull || box.width < 1 || box.height < 1 { box = media }
  let rot = ((Int(p.rotationAngle) % 360) + 360) % 360
  let swap = rot == 90 || rot == 270
  return Geom(page: p, box: box, rot: rot, w: swap ? box.height : box.width, h: swap ? box.width : box.height)
}
/// PDF user space -> the displayed page at scale s, Quartz orientation (origin bottom left).
func pageTransform(_ g: Geom, _ s: CGFloat) -> CGAffineTransform {
  let x0 = g.box.minX, y0 = g.box.minY, bw = g.box.width, bh = g.box.height
  switch g.rot {
  case 90:  return CGAffineTransform(a: 0, b: -s, c: s, d: 0, tx: -y0 * s, ty: (x0 + bw) * s)
  case 180: return CGAffineTransform(a: -s, b: 0, c: 0, d: -s, tx: (x0 + bw) * s, ty: (y0 + bh) * s)
  case 270: return CGAffineTransform(a: 0, b: s, c: -s, d: 0, tx: (y0 + bh) * s, ty: -x0 * s)
  default:  return CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: -x0 * s, ty: -y0 * s)
  }
}
func context(_ w: Int, _ h: Int, gray: Bool) throws -> CGContext {
  let cs = gray ? CGColorSpaceCreateDeviceGray() : CGColorSpace(name: CGColorSpace.sRGB)!
  let info = gray ? CGImageAlphaInfo.none.rawValue : CGImageAlphaInfo.noneSkipLast.rawValue
  guard let c = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: info) else { throw Fail("no context \(w)x\(h)") }
  c.setFillColor(gray ? CGColor(gray: 1, alpha: 1) : CGColor(red: 1, green: 1, blue: 1, alpha: 1))
  c.fill(CGRect(x: 0, y: 0, width: w, height: h))
  c.interpolationQuality = .high
  c.setShouldAntialias(true)
  c.setShouldSmoothFonts(false)
  return c
}
/// Region fr of page g, the whole page being fh px tall. Returns the image and its place in the full page (px).
func draw(_ g: Geom, fh: Int, fr: [CGFloat], gray: Bool) throws -> (img: CGImage, fw: Int, fh: Int, rect: [Int]) {
  let s = CGFloat(fh) / g.h
  let FW = max(1, Int((g.w * s).rounded())), FH = fh
  let X0 = Int((fr[0] * CGFloat(FW)).rounded()), Y0 = Int((fr[1] * CGFloat(FH)).rounded())
  let OW = max(1, min(FW - X0, Int(((fr[2] - fr[0]) * CGFloat(FW)).rounded())))
  let OH = max(1, min(FH - Y0, Int(((fr[3] - fr[1]) * CGFloat(FH)).rounded())))
  let c = try context(OW, OH, gray: gray)
  c.translateBy(x: CGFloat(-X0), y: CGFloat(-(FH - Y0 - OH)))
  c.concatenate(pageTransform(g, s))
  c.clip(to: g.box)
  c.drawPDFPage(g.page)
  guard let img = c.makeImage() else { throw Fail("no image") }
  return (img, FW, FH, [X0, Y0, OW, OH])
}
func fileSize(_ path: String) -> Int { var st = stat(); return stat(path, &st) == 0 ? Int(st.st_size) : 0 }
/// Write atomically: <out>.part, then rename.
func writeJPEG(_ img: CGImage, _ out: String, _ q: Double) throws -> Int {
  let tmp = out + ".part"
  guard let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: tmp) as CFURL, "public.jpeg" as CFString, 1, nil) else { throw Fail("no JPEG encoder") }
  CGImageDestinationAddImage(dst, img, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
  guard CGImageDestinationFinalize(dst) else { throw Fail("JPEG encode failed") }
  guard rename(tmp, out) == 0 else { throw Fail("rename failed") }
  return fileSize(out)
}
func writePGM(_ img: CGImage, _ out: String) throws {
  // A grey bitmap context's rows are stored top row first, as PGM wants.
  guard let data = img.dataProvider?.data, let p = CFDataGetBytePtr(data) else { throw Fail("no pixels") }
  var buf = Data("P5\n\(img.width) \(img.height)\n255\n".utf8)
  for y in 0..<img.height { buf.append(p + y * img.bytesPerRow, count: img.width) }
  try buf.write(to: URL(fileURLWithPath: out + ".part"))
  guard rename(out + ".part", out) == 0 else { throw Fail("rename failed") }
}

// ------------------------------------------------------------------ helpers ----
func setLane(_ lane: String?) {
  let q: qos_class_t
  switch lane ?? "" {
  case "fg": q = QOS_CLASS_USER_INTERACTIVE
  case "near": q = QOS_CLASS_USER_INITIATED
  case "idle": q = QOS_CLASS_BACKGROUND
  default: q = QOS_CLASS_UTILITY
  }
  pthread_set_qos_class_self_np(q, 0)
}
func reply(_ o: [String: Any]) {
  guard let d = try? JSONSerialization.data(withJSONObject: o), let s = String(data: d, encoding: .utf8) else { print("{\"ok\":false,\"error\":\"reply\"}"); return }
  print(s)
}
func str(_ c: [String: Any], _ k: String) throws -> String { guard let v = c[k] as? String, !v.isEmpty else { throw Fail("missing \(k)") }; return v }
func int(_ c: [String: Any], _ k: String) throws -> Int { guard let v = c[k] as? Int else { throw Fail("missing \(k)") }; return v }
func boxOf(_ v: Any?) -> [CGFloat]? {
  guard let a = v as? [Double], a.count == 4, a[0] < a[2], a[1] < a[3] else { return nil }
  return a.map { CGFloat(max(0, min(1, $0))) }
}

// --------------------------------------------------------------------- loop ----
while let line = readLine() {
  autoreleasepool {
    guard let data = line.data(using: .utf8), let c = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
      reply(["id": NSNull(), "ok": false, "error": "bad json"]); return
    }
    let id: Any = c["id"] ?? NSNull()
    let t0 = DispatchTime.now().uptimeNanoseconds
    var r: [String: Any] = ["id": id, "ok": true]
    do {
      setLane(c["lane"] as? String)
      switch c["op"] as? String ?? "" {
      case "hello":
        let types = (CGImageDestinationCopyTypeIdentifiers() as? [String]) ?? []
        r["engine"] = "quartz"; r["v"] = 1
        r["os"] = ProcessInfo.processInfo.operatingSystemVersionString
        r["cores"] = ProcessInfo.processInfo.activeProcessorCount
        r["webp"] = types.contains("org.webmproject.webp"); r["heic"] = types.contains("public.heic")
      case "info":
        let d = try doc(try str(c, "file"))
        var pages = [[String: Any]]()
        for k in 0..<d.numberOfPages {
          let g = try geom(d, k)
          var p: [String: Any] = ["w": Double(g.w), "h": Double(g.h)]
          if g.rot != 0 { p["rot"] = g.rot }
          pages.append(p)
        }
        r["n"] = d.numberOfPages; r["pages"] = pages
      case "render":
        let d = try doc(try str(c, "file")), g = try geom(d, try int(c, "k"))
        let fr = boxOf(c["box"]) ?? [0, 0, 1, 1]
        let x = try draw(g, fh: try int(c, "h"), fr: fr, gray: false)
        r["bytes"] = try writeJPEG(x.img, try str(c, "out"), (c["q"] as? Double) ?? 0.8)
        r["w"] = x.rect[2]; r["h"] = x.rect[3]; r["fw"] = x.fw; r["fh"] = x.fh; r["rect"] = x.rect
        r["pw"] = Double(g.w); r["ph"] = Double(g.h)
      case "lum":
        let d = try doc(try str(c, "file")), out = try str(c, "out"), h = (c["h"] as? Int) ?? 400
        var done = [Int]()
        for k in (c["ks"] as? [Int]) ?? [] {
          let g = try geom(d, k)
          try writePGM(try draw(g, fh: h, fr: [0, 0, 1, 1], gray: true).img, "\(out)-\(k).pgm")
          done.append(k)
        }
        r["ks"] = done
      case "text":
        let file = try str(c, "file"), out = try str(c, "out")
        guard let pd = PDFDocument(url: URL(fileURLWithPath: file)) else { throw Fail("PDFKit cannot open") }
        let ks = (c["ks"] as? [Int]) ?? Array(0..<pd.pageCount)
        var parts = [String]()
        for i in ks { parts.append(i >= 0 && i < pd.pageCount ? (pd.page(at: i)?.string ?? "") : "") }
        try parts.joined(separator: "\u{0C}").write(toFile: out + ".part", atomically: false, encoding: .utf8)
        guard rename(out + ".part", out) == 0 else { throw Fail("rename failed") }
        r["n"] = pd.pageCount; r["ks"] = ks
      case "sprite":
        let d = try doc(try str(c, "file"))
        let cw = try int(c, "cw"), ch = try int(c, "ch"), cols = max(1, try int(c, "cols"))
        let cells = (c["cells"] as? [[String: Any]]) ?? []
        let rows = max(1, (cells.count + cols - 1) / cols), W = cols * cw, H = rows * ch
        let ctx = try context(W, H, gray: false)
        for (i, cell) in cells.enumerated() {
          guard let k = cell["k"] as? Int, let b = boxOf(cell["box"]) else { continue } // blank page: a white cell
          let g = try geom(d, k)
          let bw = (b[2] - b[0]) * g.w, bh = (b[3] - b[1]) * g.h
          let s = min(CGFloat(cw) / bw, CGFloat(ch) / bh), dw = bw * s, dh = bh * s
          let cx = CGFloat((i % cols) * cw) + (CGFloat(cw) - dw) / 2
          let cy = CGFloat((i / cols) * ch) + (CGFloat(ch) - dh) / 2           // from the top
          ctx.saveGState()
          ctx.clip(to: CGRect(x: cx, y: CGFloat(H) - cy - dh, width: dw, height: dh))
          let FW = g.w * s, FH = g.h * s
          ctx.translateBy(x: cx - b[0] * FW, y: CGFloat(H) - (cy - b[1] * FH) - FH)
          ctx.concatenate(pageTransform(g, s))
          ctx.clip(to: g.box)
          ctx.drawPDFPage(g.page)
          ctx.restoreGState()
        }
        guard let img = ctx.makeImage() else { throw Fail("no sheet") }
        r["bytes"] = try writeJPEG(img, try str(c, "out"), (c["q"] as? Double) ?? 0.6)
        r["w"] = W; r["h"] = H
      case "close":
        let f = try str(c, "file"); docs.removeValue(forKey: f); lru.removeAll { $0 == f }
      case "quit":
        exit(0)
      default:
        throw Fail("unknown op")
      }
    } catch {
      r = ["id": id, "ok": false, "error": "\(error)"]
    }
    r["ms"] = Double(DispatchTime.now().uptimeNanoseconds - t0) / 1e6
    reply(r)
  }
}
```

## Appendix B: `server/native/mu-worker.js`

Tested here with MuPDF 1.23.10 on the geometry PDF and the corpus PDFs (`mutool run mu-worker.js`). Homebrew ships a newer MuPDF, whose scripting API changed in places in 1.24; the self-test checks `hello`, `info`, `render` and `lum` before the engine is used.

```js
// mu-worker.js: a persistent MuPDF render worker for the Stacks Browser (mutool run mu-worker.js).
// The JSON-line protocol of stacks-render (docs/performance/prerender.md, section 2.2), ops hello, info,
// render (whole pages only: no "box"), lum, close, quit. Text comes from `mutool draw -F txt` (pages end in \f).
// MuPDF's page bounds are the crop box with /Rotate applied, y down: the page as pdf.js shows it.
// Measured with MuPDF 1.23: readline() returns at most 255 characters, so a longer line arrives in pieces
// and is put back together here; a Pixmap drawn through new DrawDevice() stayed blank, so pages are drawn
// with page.toPixmap(); saveAsJPEG writes 4:4:4 JPEGs and is slow (about 325 ms for a 1700 x 2200 page).
var docs = {}, order = [];
function open(f) {
  if (docs[f]) { order.splice(order.indexOf(f), 1); order.push(f); return docs[f]; }
  var d = Document.openDocument(f);
  if (d.needsPassword() && !d.authenticatePassword('')) throw new Error('encrypted');
  docs[f] = d; order.push(f);
  while (order.length > 8) delete docs[order.shift()];
  return d;
}
function chunk() { try { return readline(); } catch (e) { return null; } }
function command() { // one JSON object, possibly split into 255-character pieces
  var acc = '', s;
  while ((s = chunk()) != null) {
    acc += s;
    if (!acc) continue;
    try { return JSON.parse(acc); } catch (e) { if (s.length < 255 || acc.length > 1e6) return { bad: acc.slice(0, 80) }; }
  }
  return null;
}
function draw(page, h, gray) {
  var b = page.getBounds(), s = h / (b[3] - b[1]);
  return { b: b, s: s, pix: page.toPixmap(Matrix.concat(Matrix.translate(-b[0], -b[1]), Matrix.scale(s, s)), gray ? ColorSpace.DeviceGray : ColorSpace.DeviceRGB, false, true) };
}
var c;
while ((c = command()) != null) {
  var t0 = Date.now(), r;
  try {
    if (c.bad) throw new Error('bad json: ' + c.bad);
    r = { id: c.id, ok: true };
    if (c.op === 'hello') { r.engine = 'mupdf'; r.v = 1; }
    else if (c.op === 'quit') break;
    else if (c.op === 'close') { delete docs[c.file]; }
    else if (c.op === 'info') {
      var d = open(c.file), n = d.countPages(), pages = [];
      for (var i = 0; i < n; i++) { var bb = d.loadPage(i).getBounds(); pages.push({ w: bb[2] - bb[0], h: bb[3] - bb[1] }); }
      r.n = n; r.pages = pages;
    } else if (c.op === 'render') {
      var page = open(c.file).loadPage(c.k);
      var x = draw(page, c.h, false), pix = x.pix;
      pix.saveAsJPEG(c.out + '.part', Math.round((c.q || 0.8) * 100));
      var W = pix.getWidth(), H = pix.getHeight();
      r.w = W; r.h = H; r.fw = W; r.fh = H; r.rect = [0, 0, W, H]; r.pw = x.b[2] - x.b[0]; r.ph = x.b[3] - x.b[1];
      r.part = true; // the caller renames <out>.part to <out>
    } else if (c.op === 'lum') {
      var dd = open(c.file), done = [];
      for (var j = 0; j < c.ks.length; j++) { draw(dd.loadPage(c.ks[j]), c.h || 400, true).pix.saveAsPNM(c.out + '-' + c.ks[j] + '.pgm'); done.push(c.ks[j]); }
      r.ks = done;
    } else throw new Error('unknown op ' + c.op);
  } catch (e) { r = { id: c && c.id, ok: false, error: String(e) }; }
  r.ms = Date.now() - t0;
  print(JSON.stringify(r));
}
```

## Appendix C: the geometry test PDF

`test/fixtures/geometry.pdf`, written by the generator below (Node, no dependencies; `prerender.mjs --self-test` embeds the same function). Every page has 36-pt black squares inset 36 pt from each corner of its visible box, and a 108 × 18 pt bar under the top-left square, which tells the orientation.

| Page | MediaBox | CropBox | `/Rotate` | Shown as (pt) | Checks |
|---|---|---|---|---|---|
| 1 | 612 × 792 | — | 0 | 612 × 792 | scale, y direction |
| 2 | 612 × 792 | — | 90 | 792 × 612 | rotation: the top-left square and its bar move to the top-right corner, the bar becoming vertical, left of the square, running down |
| 3 | 612 × 792 | 72 72 540 720 | 0 | 468 × 648 | crop box: squares at the corners of the crop box, not the media box |
| 4 | 792 × 612 | — | 0 | 792 × 612 | landscape, the 1.3 × class width cap |
| 5 | 612 × 792 | 36 108 576 756 | 270 | 648 × 540 | rotation and crop box together |

Measured here at 400 px tall (ink box as fractions of the shown page), MuPDF and `pdftoppm -cropbox -r` agreeing on every page: 1 `[0.058, 0.045, 0.939, 0.955]` (310 × 400 px), 2 `[0.046, 0.060, 0.954, 0.940]` (518 × 400), 3 `[0.076, 0.055, 0.924, 0.945]` (289 × 400), 4 as 2, 5 `[0.056, 0.068, 0.944, 0.932]` (480 × 400). Without `-cropbox`, page 3 comes out `[0.177, 0.138, 0.823, 0.863]` (the media box: wrong); with `-scale-to-y 400`, page 2 comes out 400 × 310 (scaled before rotation: use `-r`); with `-r` alone, poppler rounds some pages up by a pixel (401 rows for 400), so the adapter always passes `-x 0 -y 0 -W FW -H FH` (2.5).

```js
// The geometry test PDF (docs/performance/prerender.md, Appendix C), with no dependencies:
//   node geometry-pdf.mjs out.pdf
// Each page: 36-pt black squares inset 36 pt from the corners of its visible box (the CropBox, else the
// MediaBox), and a 108 x 18 pt bar under the top-left square, which tells the orientation.
import { writeFileSync } from 'fs';
export const PAGES = [
  { media: [0, 0, 612, 792] },
  { media: [0, 0, 612, 792], rot: 90 },
  { media: [0, 0, 612, 792], crop: [72, 72, 540, 720] },
  { media: [0, 0, 792, 612] },
  { media: [0, 0, 612, 792], crop: [36, 108, 576, 756], rot: 270 },
];
export function geometryPdf(pages = PAGES) {
  const objs = [];
  const add = (s) => objs.push(s);
  add(null); add(null); // 1: catalog, 2: pages
  const kids = [];
  for (const p of pages) {
    const [x0, y0, x1, y1] = p.crop || p.media;
    const sq = (x, y) => `${x} ${y} 36 36 re f\n`;
    const c = '0 0 0 rg\n' + sq(x0 + 36, y0 + 36) + sq(x1 - 72, y0 + 36) + sq(x0 + 36, y1 - 72) + sq(x1 - 72, y1 - 72) + `${x0 + 36} ${y1 - 102} 108 18 re f\n`;
    add(`<< /Length ${c.length} >>\nstream\n${c}endstream`);
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [${p.media.join(' ')}]${p.crop ? ` /CropBox [${p.crop.join(' ')}]` : ''}${p.rot ? ` /Rotate ${p.rot}` : ''} /Contents ${objs.length} 0 R /Resources << >> >>`);
    kids.push(objs.length);
  }
  objs[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offs = objs.map((o, i) => { const at = pdf.length; pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; return at; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
if (process.argv[2]) writeFileSync(process.argv[2], geometryPdf());
```
