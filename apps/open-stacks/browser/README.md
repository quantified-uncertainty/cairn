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

| Lane | Items | What | Source |
|---|---|---|---|
| DeepMind safety | 593 | Google DeepMind's safety papers and posts | arXiv, DeepMind, Alignment Forum |
| AI safety | 548 | landmark papers and reports, plus top Alignment Forum posts | arXiv, labs, Alignment Forum |
| Old technical oddities | 437 | the most-read public-domain technical scans | Internet Archive |
| Forecasting | 356 | papers, open PDFs and the best posts | journals, authors, forums |
| LessWrong | 289 | top posts by karma | LessWrong API |
| QURI wikis | 155 | QURI's wiki sites, in their own section order | the sites |
| Technical books | 105 | free, legal technical textbooks (Murphy, Prince, Kochenderfer, Think Bayes…) | author / publisher hosted |
| LLM papers | 70 | landmark language-model papers | arXiv |
| Information theory | 26 | Shannon, MacKay and other free texts | author / publisher hosted |
| Cybernetics | 25 | Ashby and other legally free classics | various |
| TTRPG manuals | 24 | openly licensed rulebooks and SRDs | publishers, Gutenberg |

The curated lanes come from `seeds.json` and `data/lanes/*.json` (every arXiv ID and URL was checked against the live source). `node build-corpus.mjs` rebuilds `corpus.json` from the network; `node build-corpus.mjs --merge` adds new lane-file items offline without moving any existing item (`--all-lanes` takes every curated item the corpus lacks).

## Your own folders

The **Local** lane shows files from folders on your own machine, read where they are. Point it at a folder in Settings (`,`) › Local folders, one folder per line, or when you start the server:

```bash
STACKS_LOCAL_DIRS="~/Papers:~/Documents/Books" node server.mjs   # ':' or new lines between folders
```

With neither, it reads `~/Library/Mobile Documents/com~apple~CloudDocs/Recent Things to Read` (the iCloud Drive folder of that name) when it exists. Each folder is a folder of the lane in the Library (`L`) and its subfolders are folders under it, so `j`/`k`, staying in a folder, search, the wall, sorts, tags and reading memory work as for any lane. In a folder, files come by name (2 before 10, so series, chapters and a book's "spreads" and "pages" versions stay together); Settings can put the newest first, and Newest (`S`) sorts the whole lane by date either way.

- **What opens:** PDF, EPUB, Markdown, web pages saved as `.html`, plain text, and on a Mac Word, RTF and OpenDocument files (converted with macOS's `textutil`). A folder of pictures (maps, handouts) is one item that shows them all, and a folder of sound files one item with a player for each. Zip archives, Kindle books, DjVu and comic archives are listed with a note, not opened. Hidden files, `.DS_Store`, empty files and downloads still in progress are left out, and so is a zip that sits beside its own unpacked folder.
- **iCloud:** a file iCloud keeps only in the cloud is dimmed in the Library. On macOS 14 and later, opening it (or its cover showing on the wall) downloads it. An older `.icloud` placeholder becomes an item that says it is not downloaded, asks iCloud for it when you open it, and gives the command to run yourself (`brctl download '…'`, also in the side panel's "Why this").
- **Changes:** a file you add, change or download appears within a few seconds (the folders are watched; a rescan runs every two minutes as well). One you remove says so until you reload.
- **Privacy:** nothing is copied or uploaded. Files are read in place; what the app keeps about them (titles, authors, page counts read from the files, and EPUB, Markdown and Word files converted to HTML) stays under the cache folder, in `local/`. Summaries and reading guides of your own files are made only when you ask (`a`, or "make one"), since they send the text to Claude; Settings › Local folders makes them automatic. Your files never appear in agent jobs (the job files live in this repository), and only pages served by this app can read them: other web sites cannot, and the server answers on this machine only.
- On a Mac, the app that runs `node` (Terminal, say) needs permission to read the folder: if Settings › Local folders says "no permission", allow it in System Settings › Privacy & Security › Files and Folders. Titles come from the files' own metadata (`pdfinfo` when poppler is installed, else Spotlight, else the PDF itself), or a cleaned file name.

## Using it

The screen is mostly pages. A thin line under the header shows where you are in the item; hover it to look through the item (the page number opens under it), click to go there (`p` pins a strip of page thumbnails under the pages). The side panel (`i` to hide) shows why the item is here, an AI summary, the outline, your note, related items and today's trail. Press `?` for all keys.

The header has three layouts. **Two bars**: the top bar (views, lanes, tools), then the item's title, authors, date, links and place over the pages. **One bar**: the item moves into the top bar, between a view picker and a lane picker on the left and Search, the Focus button and the gear on the right; the rest (Saved, Export, `?`, the wheel mode, the server status) is under `⋯`. **Focus** (`d`, or the corners button): only the pages, with no bars and no side panel and the position line at the very top of the window; point at the top edge, or press `d` again, to show the bar over the pages (they do not move), and `Esc` (or the button) to leave. Settings › Appearance › Header picks Auto, Two bars or One bar for each screen (Auto: one bar in a window under 1500 × 900 px, as on a 14-inch MacBook, two above); Position bar puts the line at the top or the bottom; Focus can also go full screen. When the bar is short of room it gives way in order: the lane chips become a lane picker (chips show only when every lane fits), the status text goes, the view tabs become a picker, labels become icons, then the less used tools go under `⋯`; the item header drops the next item's title, then the authors and the PDF link, the lane, and the source links. Keys:

- `Space` (or `PageDown`) the next page, then the next item · `Backspace` (or `Shift+Space`, `PageUp`) go back: undo the last move, save or skip
- `j`/`k` next/previous item (hold to skim through items, 5 to 14 a second; release opens the one you are on) · `l`/`h` (or arrows) turn pages (hold to riffle) · `z` or `Enter` zoom to one page · `Esc` up a level (unzoom, then leave Focus, then the wall) · `r` random spot
- `d` Focus: only the pages · `d` again shows (and hides) the bar over them · `Esc` leaves
- Mouse wheel: one notch, one step (continue: down = next page, then the next item, up = go back; `W` or a middle click switches continue, items, pages). At the end of a document the wheel stops: pause, then scroll again to go on · trackpad: one step per stroke, up/down items, sideways pages; pinch out zooms into a page, pinch in zooms back out
- Messages appear briefly, low in the middle of the pages: a big icon, a few words, and a second line when needed
- `a` summarize now (otherwise automatic after 5 s on an item) · `s` save · `x` less like this · `m` more like this
- `C` crop margins (on by default) · `c` split two-column pages into columns · `+`/`-` pages per spread
- `n` write a note (exports to Markdown from Saved) · `o` open the original · `0`–`7` lanes · `/` search · `w` wall
- `O` (or a click on the position line) every page of the item at once, about 30 to a screen: `+`/`-` or a pinch for 6-120, hover to enlarge, click (or arrows, a page number, Enter) to read there, `Esc` to return; the track scrolls it, Space goes a screen and then on to the next item's pages
- `L` the Library in the side panel: the stack you are walking, always in the order `j`/`k` go: By topic, every lane as a tree of folders (a wiki's own sections, topics, years); For you, Newest and Oldest, a list (`S` cycles the sort, chosen per lane). Type to filter, arrows to move, Enter opens an item, or on a folder stays in it: `j`/`k` and Space walk only its items ("› Reasoning 7/10 ✕" by the lane in the header) until `u` or ✕ leaves it, on the same item
- Stay in a tag: at the top of the side panel (Item and Library), the current item's tags as chips: clusters a model suggested (`data/tags.json`: "DeepSeek", "Math reasoning", "Recent LLMs (2024–25)"…), its first author, its folders, its year. Click one and you stay on the page, but `j`/`k` now walk only that tag's items, in the current sort ("3/9 ✕" on the chip); `;` stays in the item's next tag (`:` the previous; past the last, the whole lane again), `u` or ✕ leaves, Back undoes. Hover a chip for what it is and its items around this one
- Up next: when the pages leave an empty band under them (four pages across, wide pages), it shows the next items of the stack as small covers with their titles and dates, the one before this dimmed at the left (one line of titles when the band is narrow). `j` goes to the first; click one to jump ahead (Back returns, `k` walks back through what you skipped); the header names the stack and where you are in it. `U` (or Settings › Navigation) hides it
- `Y` the Dashboard: items agents added that you have not read, your reading (time, pages, streaks, most valuable reads), what it learned from your reading, how that moved For you, and the agent jobs. `j`/`k` move between rows, Enter opens, `s` keeps and `x` dismisses a new item, `r` refreshes, `Esc` returns
- `!` (or ⚑ in the item header) flag a problem with this item for an agent: it writes a job file in `jobs/open/`, which is part of the public repository, so the dialog says what goes in it (the item, the page, your note, and a picture of the page only if you tick the box)
- `,` (outside the wall), `Ctrl+,` or `⌘,` (or the gear in the top bar) Settings; Firefox on a Mac keeps `⌘,` for its own settings, so use `,` there. Settings covers: background and paper colours, the header layout, Focus and where the position line sits, dark-mode page filters, fonts and spacing for posts, pages per spread and fit, the wheel and middle click, the side panel's sections, the summary model and daily AI budget, the reading voice, and the cache. Changes apply at once.

## Why it is fast

Open sources are slow (an Internet Archive page image takes 1-3 s). `server.mjs` is a caching proxy with a prioritised prefetch queue, and the page plans ahead around where you are:

- pages ahead of you in the direction you are paging, further ahead the faster you page, already decoded and cropped in memory;
- one spread behind you, in case you turn back;
- the next random spot, chosen in advance;
- the next items' first spreads;
- on the server: sharp pages near you, the next 25 items, legible mid-resolution pages further out, then strip thumbnails.

In tests from a cold cache, page turns in long scanned books took 25-47 ms and moving to the next item usually 40-200 ms.

**PDF pages drawn on the server.** When a native PDF engine is available (on a Mac, Apple's own renderer through a small Swift helper the server builds on first start if the Xcode command-line tools are installed; else poppler, `brew install poppler`; else MuPDF), the server renders PDF pages ahead of you on all cores but one, and the browser shows them as images, as it does scans: the first spread of a PDF in about 120 ms instead of about 570 (measured on a 4-core Linux box; `docs/performance/prerender.md`). Without an engine, or when a page is not ready within 0.7 s, pdf.js draws it in the browser as before. `STACKS_RENDER_ENGINE=none` turns it off.

**Compiled documents.** The disk cache is not the slow part (a hit costs about a millisecond); drawing PDF pages with pdf.js in the browser is. So while you read, the app compiles each item once, in idle moments, and keeps the result on disk as its *profile*: every page's shape, one crop box shared by the body pages (so the pages of a spread match in size), blank pages, two-column gutters, printed page numbers, the contents, where the references and appendix start, which pages to pair or show alone, the page-marked text, a small sprite sheet of every page, and the pages pdf.js drew for you, saved as images. Next time the item opens from those images, decoded off the main thread, without opening the PDF; hovering the track shows the sprite at once; and the spread has its final shape before the first page arrives. It works ahead of you through the next items in the lane. To compile the corpus overnight instead: `node compile.mjs --lanes ai-safety,llm --assets full` (it uses Playwright's Chromium or poppler if you have either, and does nothing otherwise). Profiles count toward the cache's size cap; with disk to spare, `STACKS_CACHE_MAX=100G` keeps more of them, and of everything else. `?bench=profile` measures the difference in your own browser.

## AI summaries

After 5 s on an item, the server sends its text (PDF text, Internet Archive OCR, or post HTML, with page markers) to Claude and caches a structured summary: why you might care, the gist, key points with page links (marked on the page strip), what is on the current pages, and a skip/skim/read/study verdict. It also summarizes the next two items in the background (toggle in the panel). Default model: `claude-haiku-5-5` (well under a cent a summary); pick Sonnet, Opus or Fable in the panel, or set `STACKS_MODEL`, for better summaries at 20-100x the price. Summaries are AI-generated and labelled as such.

**Reading guides.** After 15 s on an item (or "make now" in the panel), Claude also writes a reading guide: a skim path of 4-8 pages worth looking at and why, what you can skip, a one-line map of the sections, a glossary, and margin notes, small tabs on a page's edge beside a sentence worth a word of explanation (hover to read, click to light the sentence). Press `T` to make Space follow the skim path: each press goes to the next stop, then on to the next item; Backspace steps back. Stops, sections and skippable stretches are marked on the track. Every quote is checked against the text and notes whose quote is not found are thrown away. With Haiku a guide costs about half a cent, from the same daily budget as summaries. For many items at once, `node augment-batch.mjs --lanes ai-safety,llm` sends them as one batch at half price (it shows the estimate and asks first; about $4.50 for the whole corpus).

## Tags

`data/tags.json` holds the clusters behind the "Stay in" chips: `{built, source, tags: [{id, label, kind, desc, items: [item ids]}]}`, `kind` one of topic, method, org, series, benchmark, genre, era, community. The current file came from a pass by Claude over every item's title, abstract and note: 336 tags, every item in 2 to 6 of them. Tags are sorted by kind then label, item ids are in corpus order, and the file has one tag per line so diffs stay readable. Edit it by hand or have an agent edit it; the server picks up a change without a restart (`STACKS_TAGS` points it at another file).

After a corpus rebuild, `node tag-corpus.mjs` tags the items that are in no tag yet with `claude-haiku-5-5` and merges them in. It sends about 40 items per request with the whole vocabulary in front, cached after the first request. Existing tags and memberships are kept; a new tag the model proposes is written once it holds two items. The script prints the plan and a cost estimate first (under a cent for a few hundred items, about $0.09 for the whole corpus with `--all`), and stops when the estimate is more than what is left of today's AI budget (`STACKS_DAILY_BUDGET`) unless you pass `--yes`. `--dry-run` prints the plan only; `--lanes`, `--ids` and `--limit` narrow the run; `STACKS_MOCK_AI=1` gives deterministic mock tags without calling the API. Run it with the server stopped if you care about the spend record: the server keeps its own copy of today's spend and can overwrite what the script wrote, as with `augment-batch.mjs`.

## Learning from your reading, and new items from agents

The app keeps a record of your reading on your machine (time on each item, pages seen, how you left it, saves, `x` and `m`) and learns from it which topics, folders, tags, authors and kinds of item you read deeply and which you skip. That reweights For you: what you are likely to read rises, items you finished or skipped sink, lanes you read more get a larger share of All, and the item on screen and the next three never move under you. The side panel's "Why this" shows the reasons for each item ("+0.15 LLM papers › Reasoning", "▲ 580 places in All"), and the Dashboard (`Y`) shows everything it learned, with + (boost), − (mute) and ∅ (ignore) to correct it, and a switch to rank without it.

The app does not search the web itself. From what it learned, and from gaps in the library (items that fail to open, missing authors or dates, broken images, problems you flag with `!`), it writes **open jobs** to `jobs/open/`, one Markdown file each, listing public titles and ids only, never your reading. An agent such as Claude Code does them by following `jobs/README.md`: the Dashboard's "Copy instructions for your agent" puts the prompt on the clipboard. Items an agent adds show a **NEW** badge (item header, Library rows, wall tiles, Up next) until you have read them for 20 s or turned a page; the NEW chip in the top bar walks them (Shift+click: the Dashboard), and each says in the side panel which job added it, from where, and like which items you read, with Keep and Dismiss. Everything about your reading stays under the cache folder. Design: `docs/learning/spec.md`.
