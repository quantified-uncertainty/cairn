# Stacks Browser architecture

How the pieces fit, for anyone adding a feature. The README covers running and using it.

## Server (`server.mjs`, `server/`)

- `server/config.mjs` exports `HERE`, `PORT` (`--port N` or `STACKS_PORT`), `HOST` (`--host H` or `STACKS_HOST`; see below), `isLoopback(host)`, `CACHE` (`STACKS_CACHE`, default `~/.cache/open-stacks`), `MODEL` (`STACKS_MODEL`), `UA` and `hasKey()`.
- `server/cache.mjs` is the disk cache for open sources: `allowed(url)`, `cached(url)`, `ensure(url)` (fetch once into the cache), `meta(url)`, `read(url)`, `paths(url)`, `key(str)` (sha1), `enqueue(urls, pri, group)` (the prefetch queue) and `stats`.
- `server/routes/*.mjs` load in name order. Each exports `default function (app)`; `app` has:
  - `route(method, pathOrRegExp, async (req, res, url, match) => {})`, where method is `'GET'`, `'POST'` or `'*'`;
  - `status(() => ({...}))` to add fields to `GET /status`;
  - `onStart(fn)` to run after the server starts listening;
  - helpers `json(res, obj, code)`, `send(res, code, body, type)` and `body(req)` (parsed JSON);
  - `cache`, `CACHE`, `HERE`, `MODEL`, `UA` and `hasKey`.
- Static files come from `ui/`. `/corpus.json` and `/enrich.json` (optional) come from the browser folder. `/features.json` lists `ui/js/features/*.js` and `ui/features/*.css`.

### Who can reach the server

- **Host.** The default `HOST` is `localhost`, so `server.mjs` listens on both 127.0.0.1 and ::1. Browsers and Node may try either address for `localhost` (macOS lists ::1 first), and `webview.js` loads live pages from the other loopback name. Without IPv6, the server listens on 127.0.0.1 alone. Any other host, such as `0.0.0.0`, is used as given. When the host is not loopback, the server prints a warning that lists the addresses other machines can use. `--open` and the startup line show `http://localhost:PORT`, or the host itself when it is a specific address.
- **CORS.** `send()` and `json()` set no `Access-Control-Allow-Origin` header, so other origins cannot read notes, summaries, events or status. Only `/proxy` sends `Access-Control-Allow-Origin: *`, because it serves public open-source content. Don't add the header to a response that carries the reader's data.
- **Writes.** `POST /export` and `POST /export/remarkable` also refuse requests whose `Origin` differs from `Host`. Other POST routes have no such check.

## Client (`ui/js/`)

`main.js` imports the core modules, then every feature module listed in `/features.json`, then calls `boot()`. A feature is one file in `ui/js/features/` plus, optionally, one stylesheet in `ui/features/`. Prefer adding a feature over editing core files.

| Module | Holds |
|---|---|
| `util.js` | `h()`, `$()`, `P(url)` (the proxy URL), `store`, `lru`, `fmtDate`, `toast`, `css()`, and the hooks below |
| `corpus.js` | `items` (merged with `enrich.json`), `LANES`, `COUNTS`, `LANE_WEIGHTS`, `LANE_COLORS`, `byId`, `tokens`, `related(i)` |
| `state.js` | `state` (view, lane, order, pos, `start` (Map item → page or column), `hist` (turn history), `per`, `zoom`, `crop`, `cols`, `font`, `panel`, `wheel`, `marks`, `status`, …), `current()`, `buildOrder`, `learn` |
| `docs.js` | `openDoc(it)`: scan → `{n}`, pdf → `{n, pdf}` (a pdf.js document), html/web/text → a *flow* doc `{flow: true, html, n, texts, outline}`; `isFlow(it)`, `scanUrl`, `pdfjs()`, `extractors` (per kind), `prepareFlow`, `pdfOutline` |
| `render.js` | `renderPage(it, k)` → panels `[{canvas, k, box, srcW, srcH, part?, pdfScale?}]` or `[{blank: true, k}]`; `box` is the crop in fractions of the source page |
| `flow.js` | live column layout of flow docs: `live` (`{flow, port, sheet, g: {cols, colw, gap, pitch, font}, n: columns, first/running: column → stable page, vpCol}`), `flowRange(s)`, `vpToCol(vp)`, `elToCol(el)` |
| `feed.js` | `showFeed()`, `paintHead`, `paintPos`, `paintScrub`, `layoutPanels` |
| `nav.js` | `go`, `jumpTo`, `goPage(k)`, `turn(dir)`, `randomSpot`, `toggleZoom`, the wheel, and most keys |
| `prefetch.js` | `planAround`, `startOf(i)` (uses `it.best`), `serverPrefetch`, `velocity` |
| `panel.js` | the side panel and the built-in sections (why, outline, related, today) |
| `summary.js` | the summary section, `summarizeItem`, `extractText` |
| `notes.js` | the note section, `appendQuote(it, text, page)` |
| `text.js` | words on screen: `registerTextSource`, `currentWords()`, `highlight(name, words)`, `reveal(word)` |
| `wall.js`, `search.js`, `chrome.js` | the wall view, search, and the top bar, keys overlay, key dispatcher and status line |

### Hooks (`util.js`)

- `on(name, fn)` and `emit(name, detail)` drive an event bus. The events are:
  - `item:shown {i, it}`;
  - `spread:rendered {i, it, s, els, doc, flow?}`; for rasters, `els[j]._pnl` is the panel and `els[j].dataset.k` the page;
  - `summary:updated {id, summary}`;
  - `nav {type, i, it, ...}`;
  - `view:changed {view}`;
  - `panel:painted`, `status`, `boot` and `flow:jump`.
- `registerKey(keys, fn, {help: [label, text], view: 'feed' | null, order})`. The keys overlay is generated from these help entries.
- `registerSection({id, title, order, render(it, i) → Node | null})` adds a side-panel section, rendered as `#sec-<id>`. Built-in orders: why 10, summary 20, outline 30, note 40, related 50, today 60.
- `registerView(name, {label, key, order, roots: () => [elements], show(), hide()})` adds a top-level view. Create its root element inside `#main`. Feed and Wall are views too.
- `registerTextSource(async ({i, it}) → {words, start} | null)` (`text.js`). A word is `{text, page, range?, el?}`.

### Units

- **Raster items (scan, pdf):** page `k` is 0-based. `state.start` holds the first page shown.
- **Flow items:** `state.start` holds a *column*. Stable pages (`data-vp` on blocks, about 280 words each) are what summaries cite, the strip shows and `goPage(k)` takes.

## Data

- `build-corpus.mjs` writes `corpus.json` from the LessWrong/Alignment Forum APIs, `data/lanes/*.json` (curated lane files) and `seeds.json`.
- `enrich.json` (optional) adds per-item `rel` (0–1 relevance), `hook` (one line) and `best` (0-based best pages).
