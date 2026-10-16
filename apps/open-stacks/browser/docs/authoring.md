---
status: reference
updated: 2026-10-16
---

# Writing for the Stacks Browser

*For agents and people who write material for the reader to read in the Stacks Browser. Checked against the code on 16 October 2026: the bundle format, metadata, pictures and math below are covered by `test/local-bundle.test.mjs` and `test/local-bundle-ui.mjs` (headless Chromium, not Firefox). Timings are from a 4-core Linux test box with synthetic files.*

**Short answer: write a bundle.** A folder named `<something>.stack` holding an `index.md` (or `index.html`), its pictures in `assets/`, and an optional `cover.jpg`. Put it in one of the reader's Local folders. It appears in the Local lane within a few seconds as one item, reflows to the reader's font and column width, opens in milliseconds, and its pictures always load, because every path is relative to the folder.

## Which format

| Format | Reflows to the screen | How fast it opens here | Use it for |
|---|---|---|---|
| **Markdown bundle** (`index.md`) | yes: columns, the reader's font, size and measure, stable pages of about 280 words | fastest: the server converts it on each open (a 30 KB file in 2-4 ms) | anything written for this reader: notes, digests, reports, guides |
| **HTML bundle** (`index.html`) | yes, the same | as fast (1-3 ms on the server); scripts, styles, forms and frames are removed | output of another tool (pandoc, a Google Docs export, a saved page), MathML |
| A single `.md` or `.html` file | yes | the same | text without pictures |
| **EPUB** | yes, one section per chapter | converted once (a 12-chapter book: 8 ms) and kept in the cache; after that 1-2 ms | books |
| **PDF** | no: fixed pages, scaled to fit (two-column papers can be split) | slowest first page: Local-folder PDFs are drawn by pdf.js in the browser (about 570 ms for a first spread, against about 120 ms for corpus PDFs the server renders when a native engine is present; the server does not render Local files) | layouts that must stay exact: typeset math, posters, forms, scans |
| LaTeX (`.tex`) | not read | | compile to PDF (`latexmk -pdf`), or convert to an HTML bundle with pandoc (below) |
| Word, RTF, OpenDocument | yes | converted on a Mac by `textutil`, kept in the cache; not opened on other systems | existing documents; for pictures export HTML instead |

The cost of a flow document (Markdown, HTML, EPUB) in the browser is layout, and it grows with length: re-opening a 2,500-word bundle took 15 ms to its first spread, a 30,000-word EPUB 59 ms (warm, in memory). Split a very long work into several bundles, one per part, when each part stands on its own.

**From LaTeX**: `pandoc paper.tex -s --mathml -o index.html` in a folder named `Paper.stack`, with the figures beside it as PNG, JPEG or SVG (a browser cannot show a PDF or EPS figure in a page; convert them first, for example `pdftocairo -png -singlefile fig.pdf fig`). Pandoc writes the figure paths as they are in the `.tex`, so keep them relative.

**From Google Docs, one document**: File › Download › Web page (`.html`, zipped), then unzip it into a Local folder (double-click the zip in Finder). The folder that makes, one `.html` file beside an `images/` folder and nothing else, is read as a bundle as it is: one item with its pictures, titled from the page's title or first heading, else the folder's name. File › Download › EPUB Publication (`.epub`) also keeps the pictures.

**From Google Docs, many at once** (download now, read later): in Google Drive in the browser, select the documents (⌘-click, or ⌘A in a folder) and choose Download. Drive converts each Doc to Word (`.docx`) and hands you one zip; unzip it into a Local folder. On a Mac each Word file opens as a flowing document (converted by `textutil`: text, headings and lists, no pictures), and folders in the zip stay folders in the Library. For a whole Drive, Google Takeout (Drive › Multiple formats › Documents: DOCX, or PDF to keep layout and pictures) gives the same kind of zip. The zip itself can stay beside its unpacked folder (it is left out); the Local lane does not open zips. The `.gdoc` files Google Drive for desktop puts on a Mac are links to the web, not documents, and are left out too.

## The bundle

A folder is one item, not a folder of the Library, when its name ends in `.stack` (any case), it has an `index.md` or `index.html` at its top, or it holds only one HTML file and an `images/` folder (a Google Docs export, above). A configured Local folder itself is never a bundle, only folders inside it.

```
Field Report.stack/            one item in the folder above it
├── index.md                   the text (index.md, then index.markdown, index.html, index.htm, index.xhtml)
├── cover.jpg                  the wall cover (cover.png, .webp, .avif, .gif also work)
├── stack.json                 optional: metadata that wins over the index file's
├── assets/
│   ├── fig-1.png              ![Figure 1: …](assets/fig-1.png)
│   └── fig-2.jpg
└── data/
    └── table.csv              a link target: opens as a file in a new tab
```

- Only the index file is the text. Other `.md` or `.html` files, subfolders and pictures inside the bundle are not listed as items or folders; they are there for the index to link to.
- With both `index.md` and `index.html`, the Markdown is the text (the HTML is usually made from it). A `.stack` folder without an index file takes its first Markdown or HTML file by name.
- A folder that has an `index.md` for some other reason (a notes vault) also becomes one item. Rename that file if its folder should stay a folder.
- The item's id comes from the folder's path, so renaming or moving the folder makes it a new item (reading position and notes stay with the old one).
- Editing the index, `stack.json` or the cover shows up within seconds; the folder is watched.

## Metadata

| Field | Markdown front matter | HTML head | `stack.json` |
|---|---|---|---|
| title | `title:` (else the first heading) | `<title>` (else the first `<h1>`) | `"title"` |
| authors | `authors:` (a list) or `author:` | `<meta name="author">` (one or several) | `"authors": [...]` or `"author"` |
| date | `date: 2025-07-14` (a year alone gives only the year) | `<meta name="date">` or `dcterms.date` | `"date"` |
| source | `source:` or `url:` (http or https) | `<link rel="canonical">` | `"source"` or `"url"` |
| summary | `summary:` (or `description:`) | `<meta name="description">` | `"summary"` |
| tags | `tags: [a, b]` or a list | `<meta name="keywords">` | `"tags": [...]` |
| cover | `cover.*` at the top | the same | `"cover": "assets/x.jpg"` (a path inside the bundle) |

```markdown
---
title: A Field Report on Synthetic Stacks
authors:
  - Ada Example
  - Bo Sample
date: 2025-07-14
source: https://example.org/field-report
summary: One or two sentences: what this is and why it is worth reading.
tags: [forecasting, evals]
---
```

The source becomes the title's link to the original and "The source" in the side panel; the summary is the item's abstract; tags are searched, and one that is the id of a tag in `data/tags.json` puts the item in that tag. Without a title the cleaned folder name is used (`Field Report.stack` → "Field Report").

## Pictures

- **Relative paths only**: `assets/fig-1.png`, `images/deep/fig-3.png`. They are served from inside the reader's folder through `/local/rel/…`. Absolute paths, `file:` URLs, dotfiles, symbolic links and paths that leave the configured folder are refused (a broken picture, never a leak). Pictures on the web (`https://…`) load as they do for web pages.
- **Formats**: JPEG for photographs, PNG for screenshots and line art, WebP for either, SVG for diagrams (shown as a picture: scripts in it never run). AVIF, GIF and BMP work.
- **Size**: about 2,000 px on the long side at most, and a few hundred KB each. A column is about 31 em wide (40 em zoomed): 600-800 CSS px, 1,200-1,600 device pixels on a Retina screen, so more pixels cost decoding time and memory without showing. Pictures are shown at most 42 % of the window high by default (Settings changes it).
- **Width and height**: you need not write them. The server reads each picture's size from its file and adds `width` and `height`, so the reader keeps the picture's box before it loads and the pages do not move when it arrives (checked with pictures held back 2.5 s: 13 columns before and after). If you do write them, write the real pixel size; they set the box's shape.
- **Alt text** on every picture: the browser shows it when the picture cannot load, and it is the only account of the picture a text-only reader of the file gets. `![A line chart of yearly cost, falling from 9 to 2](assets/cost.png)`.

## Figures, captions, tables

- HTML: `<figure><img src="assets/fig-1.png" alt="…"><figcaption>Figure 1. …</figcaption></figure>`. A figure is never split across two columns.
- Markdown has no figure syntax here: put the picture in a paragraph of its own and the caption in the next one, in italics (`*Figure 1. …*`).
- Markdown tables (pipes, with alignment) become tables; wide tables are better as pictures or split.
- Code blocks (fenced, with a language) are kept as preformatted text; nothing is highlighted.

## Math

What renders, as built today (checked in headless Chromium; MathML and KaTeX output also render in Firefox, the reader's browser, but this was not run there):

| Where | Write | Rendered by |
|---|---|---|
| Markdown | `$a^2+b^2=c^2$`, `$$\int_0^1 x\,dx$$`, `\(…\)`, `\[…\]` | KaTeX 0.16.22 (fetched once from jsDelivr through the server's cache) |
| HTML | MathML: `<math>…</math>` (pandoc `--mathml`) | the browser itself: no library, the fastest |
| HTML | pandoc `--katex` or `--mathjax` output (`<span class="math inline">\(…\)</span>`), or prerendered KaTeX | KaTeX |
| EPUB | MathML in the chapters | the browser |
| PDF | anything | as typeset |

- `$` follows pandoc's rule: no space just inside the dollars and no digit right after the closing one, so "$5 and $10" stays text. Write `\$` for a literal dollar sign.
- `\label`, `\nonumber` and `\notag` are dropped (there are no equation numbers); a `\newcommand` in one formula holds for the formulas after it.
- TeX KaTeX cannot parse stays visible as TeX, as does TeX written as plain text in HTML (`$x$` outside a math span) and in `.txt` files. Without the network on the very first use, Markdown math stays as TeX.

## Links

- `#section` links jump inside the document; Markdown headings get ids from their text (`## Results` → `#results`).
- `https://` links open in a new tab.
- A relative link to another file (`data/table.csv`, `../Other.stack/index.md`) opens that file as the browser shows it, in a new tab; it does not open it as an item in the reader.

## Where bundles go

- In a **Local folder**: Settings (`,`) › Local folders, or `STACKS_LOCAL_DIRS` (README, "Your own folders"). By default that is iCloud Drive's "Recent Things to Read", so a bundle saved there on any device appears on the Mac's reader.
- **Agents** writing material for the reader (a job in `jobs/README.md`, or a person asking) write a bundle into the Local folder that person names. Never into this repository, which is public and holds no reading material of the reader's, and never into the cache folder (`~/.cache/open-stacks`).
- Nothing in a bundle runs: no scripts, styles, forms, frames or event handlers survive, and the page is served with a sandbox. Interactive material belongs on a web page, linked as the source.

## Checklist for an agent

1. One folder, `<Title>.stack`, holding `index.md` with front matter (title, authors, date, source, summary, tags).
2. Pictures in `assets/`, linked by relative path, at most about 2,000 px, each with alt text; a `cover.jpg` when one picture stands for the whole.
3. Math as `$…$` and `$$…$$` in Markdown, or MathML in HTML.
4. Written into the Local folder you were given; it shows up in the Local lane within seconds.
