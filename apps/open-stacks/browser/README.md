# Stacks Browser

A desktop app for browsing many open books and papers quickly, the way you would scan a bookstore table or walk the stacks, with no waiting when you open something.

```bash
cd apps/open-stacks/browser
node server.mjs            # then open http://localhost:4747
node build-corpus.mjs      # optional: rebuild corpus.json from the live APIs (a few minutes)
```

Needs Node 20 or newer and no other dependencies. Fetched files are cached in `~/.cache/open-stacks` (set `STACKS_CACHE` to change it).

## What it is

- **Feed**: one book or paper at a time, showing 3 real pages side by side (scanned page images, PDF pages, or typeset text). `j`/`k` move to the next or previous item, `l`/`h` turn pages, `r` jumps to a random spot, `Enter` opens the full reader at that page.
- **Wall**: a dense grid of title pages and covers. Hovering a tile riffles through pages spread across the whole book. Click it to open in the feed, or press `Enter` on a focused tile to open the reader.
- **Reader**: every page of the item, loaded as you scroll, with the next pages prefetched.
- **Quick look**: `i` shows details and links, `m` filters to more like this, `g` goes to a page, `/` searches titles, authors and subjects, `s` saves, `x` means less like this, and `+`/`-` change the number of pages shown.

## Why it is fast

Open sources are slow: an Internet Archive page image takes 1–3 s, and Gutenberg and author-hosted PDFs do not allow cross-site requests. `server.mjs` is a caching proxy with a priority prefetch queue. While you look at one item, the UI asks it to fetch the next ~30 items' visible pages (12 in parallel, nearest first) and the rest of any item you linger on. In a test from a cold cache, moving to the next item took a median of about 50 ms after 1–2 s on each item, and turning pages about 20–40 ms.

## Sources

Every item can be opened legally and for free:

| Kind | Source | Count |
|---|---|---|
| Scans | Internet Archive public-domain books (pre-1929, English, technical and odd subjects) | ~3,600 |
| Papers | arXiv (forecasting, scoring rules, uncertainty, AI evaluation, alignment, decision theory...) | ~1,450 |
| Texts | Project Gutenberg nonfiction in science, mathematics, philosophy, economics and technology | ~5,600 |
| Textbooks | Author-hosted free editions (MacKay, Bishop, Boyd, Sutton & Barto, ...) | 8 |

Edit `build-corpus.mjs` to change subjects or add sources. The proxy only fetches from the allowlisted open hosts in `server.mjs`.

Part of [Open Stacks](../): see the wiki chapters on [the Access Ladder](../src/content/docs/access/access-ladder.md) and [the Reference Architecture](../src/content/docs/building/reference-architecture.md).
