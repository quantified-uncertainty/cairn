# Stacks Browser

A desktop app for browsing many open books, papers and posts quickly, the way you would scan a bookstore table or walk the stacks, without waiting when you open something. Part of [Open Stacks](../).

```bash
cd apps/open-stacks/browser
npm install                       # once (only needed for AI summaries)
export ANTHROPIC_API_KEY=sk-...   # optional: enables summaries
node server.mjs                   # then open http://localhost:4747
```

Needs Node 20+. Everything you open is cached in `~/.cache/open-stacks` (`STACKS_CACHE` to change), along with your notes and summaries.

## Lanes

| Lane | What | Source |
|---|---|---|
| LessWrong | top 300 posts by karma | LessWrong API |
| AI safety | landmark papers, plus top Alignment Forum posts | arXiv, Alignment Forum |
| LLM papers | landmark language-model papers | arXiv |
| Information theory | Shannon, MacKay and other free texts | author / publisher hosted |
| Cybernetics | Ashby and other legally free classics | various |
| TTRPG manuals | openly licensed rulebooks and SRDs | publishers, Gutenberg |
| Old technical oddities | the most-read public-domain technical scans | Internet Archive |

The curated lanes come from `seeds.json` (every arXiv ID and URL was checked against the live source). `node build-corpus.mjs` rebuilds `corpus.json`.

## Using it

The screen is mostly pages. A thin strip at the bottom shows where you are in the item; hover it (or press `p`) for page thumbnails. The side panel (`i` to hide) shows why the item is here, an AI summary, the outline, your note, related items and today's trail. Press `?` for all keys:

- `j`/`k` next/previous item · `l`/`h` (or arrows) turn pages · `z` or `Enter` zoom to one page · `r` random spot
- `a` summarize now (otherwise automatic after 5 s on an item) · `s` save · `x` less like this · `m` more like this
- `C` crop margins (on by default) · `c` split two-column pages into columns · `+`/`-` pages per spread
- `n` write a note (exports to Markdown from Saved) · `o` open the original · `0`–`7` lanes · `/` search · `w` wall

## Why it is fast

Open sources are slow (an Internet Archive page image takes 1-3 s). `server.mjs` is a caching proxy with a prioritised prefetch queue, and the page plans ahead around where you are:

- pages ahead of you in the direction you are paging, further ahead the faster you page, already decoded and cropped in memory;
- one spread behind you, in case you turn back;
- the next random spot, chosen in advance;
- the next items' first spreads;
- on the server: sharp pages near you, the next 25 items, legible mid-resolution pages further out, then strip thumbnails.

In tests from a cold cache, page turns in long scanned books took 25-47 ms and moving to the next item usually 40-200 ms.

## AI summaries

After 5 s on an item, the server sends its text (PDF text, Internet Archive OCR, or post HTML, with page markers) to Claude and caches a structured summary: why you might care, the gist, key points with page links (marked on the page strip), what is on the current pages, and a skip/skim/read/study verdict. It also summarizes the next two items in the background (toggle in the panel). Default model: `claude-opus-5-5` at low effort (about 3 cents a summary); set `STACKS_MODEL=claude-haiku-5-5` for roughly 40x cheaper. Summaries are AI-generated and labelled as such.
