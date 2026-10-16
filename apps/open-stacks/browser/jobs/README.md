# Stacks jobs: the playbook for agents

The Stacks Browser (this folder, `apps/open-stacks/browser` in the cairn repository) learns from what its reader reads and writes **open jobs** for an outside agent: find more open works like the ones read most, follow an author, grow a lane, fix items that do not open, find copies of broken images, tag items, fill in missing authors and dates, or look into a problem the reader flagged. Each job is one Markdown file in `jobs/open/`. This file is all an agent needs to do any of them.

Work from `apps/open-stacks/browser`. Node 20 or later; no other installs are needed for jobs.

## 1. The loop

```
node jobs.mjs next                              # the highest-priority open job, in full
#   … do it: edit the data files the job names (sections 3-7)
node build-corpus.mjs --merge                   # fold your additions into corpus.json (no network, about 1 s)
node jobs.mjs check <id> --live                 # every criterion must pass
node jobs.mjs done <id> --note "…"              # writes the Result, moves the job to jobs/done/
#   commit with the exact git add / git commit lines that `done` prints
```

- **Check without `--live` while you work** (it sends nothing); run `--live` once, at the end: it fetches every new URL again.
- **One commit per job**, with exactly the files `done` lists. Never `git add -A`.
- **Never push** unless the person who sent you asked you to.
- **Do at most 5 jobs or 60 minutes per session** unless told otherwise, then summarise what you did (jobs done, items added, anything dropped and why).
- `node jobs.mjs list` shows all open jobs; `node jobs.mjs show <id>` prints one; `node jobs.mjs list --all` includes closed ones.
- A job you cannot or should not do: `node jobs.mjs drop <id> --why "…"` (for example: nothing open exists; the job is wrong). Commit what it prints.

## 2. Hard rules

1. **Only legal, open sources.** A work must be free to read without a login, a subscription or a loan. Never use a shadow library (Library Genesis, Z-Library, Sci-Hub, Anna's Archive and the others in `jobs/hosts.json` `deny`), whatever it holds. Never bypass a login or paywall. No lending-library scans (Internet Archive items in `inlibrary`, `printdisabled` or `lendinglibrary`, or with `access-restricted-item`).
2. **Respect each source's limits** (section 6): one connection, the spacing given, back off on 429.
3. **Never touch the reader's own data**: the cache folder (`~/.cache/open-stacks` or `$STACKS_CACHE`), their settings and their reading memory. You do not need any of it.
4. **Public and neutral.** This repository is public. `why`, `via` and notes say what an item is and how it was found, never anything about a person ("you", "your", "I", reading times, what someone read). `check` lints for this.
5. **Touch only the job you are doing**, and only the files it names (the `output` list, plus `jobs/hosts.json` when you add an open host).
6. **Keep commits to the files `done` lists.**

## 3. Item format

Added items go in `data/lanes/<lane>.added.json`, one file per lane. Create the file when it is missing:

```json
{"lane": "llm", "label": "Added by agent jobs", "notes": "Items added by agent jobs (jobs/README.md). Each has added, job, via and why.",
 "items": []}
```

Each item:

| Field | Rule |
|---|---|
| `id` | `arxiv:<id without version>` (old style too: `arxiv:math/0406077`); `lw:<_id>` (LessWrong and Alignment Forum); `eaf:<_id>`; `ia:<identifier>`; `pdf:<host><path>` (host without `www.`); `web:<host><path>` (no trailing slash) |
| `kind` | `pdf`, `html` (forum posts), `web` (other web pages), `scan` (Internet Archive page images), `text` |
| `t`, `a` | Title and authors as on the work (`"First Author, Second Author et al."` for more than three). Use the organisation when there is no person |
| `y` and/or `d` | At least one. `y` a number; `d` is `YYYY-MM` or `YYYY-MM-DD` |
| `url`, `page` | `https://` only. `url` is what the reader opens: the open copy itself, never a `doi.org` link (a DOI resolves to the publisher, often a paywall; put it in `doi` or `page`). `page` is the landing page. Both are required. A LessWrong, Alignment Forum or EA Forum post always takes its `lw:`/`eaf:` id and the GraphQL `url`, never a `web:` id |
| `why` | 20-200 characters, one line, neutral: what the work is and why it belongs ("A critic-free RL recipe for long reasoning chains; follows DeepSeekMath's GRPO.") |
| `tags` | 1-4 tags. When `data/tags.json` exists, use its ids; otherwise reuse the tags the seeds carry in `corpus.json` (`"aggregation"`, `"theory"`…) rather than new words |
| `added` | Today's date, `YYYY-MM-DD` |
| `job` | The job id, e.g. `"discover-0007"` |
| `via` | `{"source": …, "query": "the query or call that found it", "seeds": ["ids it was found from"]}`; `source` is one of `arxiv`, `semantic-scholar`, `openalex`, `lesswrong`, `alignment-forum`, `eaforum`, `internet-archive`, `quri`, `publisher`, `author-site`, `wayback`, `manual`, `other` |
| Optional | `ab` (the abstract, at most 2,000 characters), `words` (posts), `license`, `doi`, `score` (karma or citations), `xpost` (the crosspost's id: `eaf:…` for a LessWrong post, `lw:…` for an EA Forum post), `twin` (section 4), `lane` (when it differs from the file's) |

`node jobs.mjs skeleton <arxiv|lw|af|eaf|ia|pdf|web> <id or URL> --job <job id>` prints an item with `id`, `kind`, `url` and `page` already right; fill in the rest.

Examples (illustrative, not real items):

```json
{"id": "arxiv:2610.11111", "kind": "pdf", "t": "Critic-Free Reinforcement Learning for Long Reasoning Chains", "a": "Ada Lovelace, Alan Turing et al.", "y": 2026, "d": "2026-10-02",
 "url": "https://arxiv.org/pdf/2610.11111", "page": "https://arxiv.org/abs/2610.11111",
 "why": "A critic-free RL recipe for long reasoning chains; follows DeepSeekMath's GRPO.", "tags": ["reasoning", "rl"],
 "ab": "…", "added": "2026-10-16", "job": "discover-0007",
 "via": {"source": "semantic-scholar", "query": "recommendations positives=arXiv:2402.03300,arXiv:2501.12948", "seeds": ["arxiv:2402.03300"]}}

{"id": "lw:AbCdEfGhIjKlMnOpQ", "kind": "html", "t": "A Post Title", "a": "username", "y": 2026, "d": "2026-09-30",
 "url": "https://www.lesswrong.com/graphql?query=%7Bpost(input%3A%7Bselector%3A%7B_id%3A%22AbCdEfGhIjKlMnOpQ%22%7D%7D)%7Bresult%7BhtmlBody%7D%7D%7D",
 "page": "https://www.lesswrong.com/posts/AbCdEfGhIjKlMnOpQ/a-post-title", "words": 4200, "score": 210,
 "why": "…", "tags": ["ai-control"], "added": "2026-10-16", "job": "discover-0007",
 "via": {"source": "lesswrong", "query": "posts view:top after:2026-06-01 tag ai-control"}}
```

- **LessWrong and Alignment Forum** posts share LessWrong's ids: `url` is the GraphQL `htmlBody` URL above (`https://www.lesswrong.com/graphql?query=` + the URL-encoded `{post(input:{selector:{_id:"<id>"}}){result{htmlBody}}}`), `page` the post page. For an Alignment Forum post also set `"src": "Alignment Forum"`.
- **EA Forum**: the same pattern on `https://forum.effectivealtruism.org/graphql?query=…`, id `eaf:<_id>`.
- **Internet Archive scans**: `kind: "scan"`, `ia` (the identifier), `n` (its `imagecount`), and both `url` and `page` set to `https://archive.org/details/<identifier>`. Published 1930 or earlier, or with an open licence in `license`.
- **An open PDF elsewhere** (a publisher's open-access PDF, an author's page): `id: "pdf:host/path.pdf"`, `kind: "pdf"`, `url` the PDF, `page` the landing page.
- **A web article**: `id: "web:host/path"`, `kind: "web"`, `url` and `page` the article.

**Which lane.** Put each item in the lane it fits best (the job suggests one). `node jobs.mjs lookup --lane <lane>` lists a lane's folders and counts. Lanes: `ai-safety`, `deepmind-safety` (Google DeepMind's own safety work), `forecasting`, `quri` (QURI's wikis), `llm` (landmark and current LLM papers), `textbooks`, `lesswrong`, `information-theory`, `cybernetics`, `ttrpg`, `oddities` (old public-domain technical scans). The library's folders are assigned by `--merge`; you do not set `path` or `ord`.

## 4. Duplicates

`check` rejects an item that matches anything in `corpus.json` or any lane file, or another item of the same job, by any of these keys:

- the id; the arXiv id from any URL or from the DOI `10.48550/arXiv.<id>` (versions ignored);
- the DOI (from `doi`, or a `doi.org` page);
- `lw:`/`eaf:` ids, including `xpost` (a crosspost is the same post);
- the Internet Archive identifier, and the work (normalised title, first author's surname, year): one book often exists as several scans;
- the URL (host without `www.`, path without trailing slash, no query);
- the normalised title (letters and digits) when it has at least 4 words, or a shorter title with the same first author's surname.

Before adding anything, look it up: `node jobs.mjs lookup "<title, arXiv id, DOI or URL>"`.

**The same work in another form** (an arXiv paper and its LessWrong post, a blog post and its crosspost): add the missing form only when it differs (the post is a summary, or adds discussion); then set `"twin": "<the corpus id of the other form>"` so the title check lets it through. Otherwise skip it.

## 5. Is it open?

- **arXiv**: always free to read. Record `license` when it is easy (the RSS feed's `dc:rights`, or OAI-PMH `<license>`); optional.
- **Semantic Scholar**: `externalIds.ArXiv` means open through arXiv, even when `isOpenAccess` is false (it is false for arXiv papers). Otherwise use `openAccessPdf.url` only when its `status` is GREEN, GOLD, HYBRID or BRONZE; skip CLOSED. Map the DOI `10.48550/arXiv.<id>` to `arxiv:<id>`.
- **OpenAlex**: an index, not a source of truth. Check the title against the PDF (one record for DeepSeekMath's DOI carries another paper's title), and do not trust its "closed" (Gneiting and Raftery 2007 is marked closed, yet the author's PDF is open).
- **Forums** (LessWrong, Alignment Forum, EA Forum): free to read. Claim no licence.
- **Internet Archive**: published 1930 or earlier, or `possible-copyright-status: NOT_IN_COPYRIGHT`. Exclude the collections `inlibrary`, `printdisabled` and `lendinglibrary`, and `access-restricted-item: true`. An uploader's licence on a public-domain scan can be shown, but the year decides.
- **QURI wikis**: the institute's own sites.
- **Anything else**: the publisher's open-access copy or the author's own page, never a copy someone else uploaded. If the host is not yet in `jobs/hosts.json`, add it to `allow` with a one-line reason (section 10).

## 6. Sources

Send a `User-Agent` that names the tool, e.g. `OpenStacksBrowser/0.3 jobs (https://github.com/quantified-uncertainty/cairn)`. Record each query you run in the item's `via.query`, and name the ones that added nothing in `done --note`, so the job's Result (shown in the reader's Dashboard) lists every query sent for it.

### 6.1 arXiv API

- `https://export.arxiv.org/api/query?search_query=…&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending` returns Atom XML. Fields in `search_query`: `ti:`, `au:`, `abs:`, `cat:`, `all:`; `AND`, `OR`, `ANDNOT`, parentheses, quoted phrases, and `submittedDate:[YYYYMMDDHHMM TO YYYYMMDDHHMM]`. Also `id_list=2402.03300,2501.12948` for lookups.
- **At most one request every 3 seconds**, one connection.
- Shapes that work: `(cat:cs.AI OR cat:cs.LG OR cat:cs.CL) AND abs:"scalable oversight"`; `au:"Rohin Shah"`; `(au:"A" OR au:"B") AND submittedDate:[202606010000 TO 202610152359]`.
- Single words explode ("strategy" matched 1,072 papers in a month); even phrases catch homonyms ("AI control" was on topic for 3 of 8). Read every abstract before adding. An `OR` of five `abs:` phrases ("forecast aggregation" and variants, cs/stat/econ categories, 36 months) matched 54 papers, and 10 of the first 40 were on topic: time-series forecasting papers match too.
- For a topic, `sortBy=relevance` surfaces the papers people cite; `sortBy=submittedDate` is for "what is new". In a test run, `(cat:cs.LG OR cat:cs.CL) AND abs:"GRPO" AND ti:"reasoning"` over 24 months matched 443 papers, and relevance order put well-known analyses in the first 25.
- Entry ids carry a version (`2402.03300v3`): strip it. A malformed query returns HTTP 400; an unknown id returns zero results.

### 6.2 Semantic Scholar

- Recommendations: `POST https://api.semanticscholar.org/recommendations/v1/papers?limit=20&fields=title,year,authors,externalIds,openAccessPdf,abstract,venue,publicationDate` with `{"positivePaperIds": ["arXiv:2402.03300", "DOI:10.…"], "negativePaperIds": []}`. **One topic per call**: mixed seeds return generic papers.
- Follow-up work: `GET /graph/v1/paper/arXiv:<id>/citations?fields=title,year,externalIds,openAccessPdf,publicationDate&limit=100` (sort by `publicationDate` yourself). Lookups: `POST /graph/v1/paper/batch` with `{"ids": [...]}`.
- Recommendations come only from recent papers (in a test run, all 20 were from the last three months), so they find what is new; for older follow-up work use citations or arXiv.
- Without a key, about two thirds of calls returned 429 in testing: send **at most 1 request per second**, back off from 4 s doubling to 30 s, give up after about 3 minutes and use another source. Keyword search ranks poorly; prefer recommendations and citations.
- Take author ids from a paper's `authors` list, not from author search (one person can have several profiles).

### 6.3 OpenAlex

- `https://api.openalex.org/works/doi:<doi>` (a single lookup is free); lists (`/works?filter=…`) cost 1 credit and searches 10. Without a key, everyone on the same IP shares $0.10 a day; a free key gives $1 a day. **Never register a key on anyone's behalf**, whatever an error message suggests.
- Good for DOI literature and open-access URLs (`best_oa_location.pdf_url`); check titles against the source.

### 6.4 LessWrong, Alignment Forum, EA Forum (GraphQL)

- `https://www.lesswrong.com/graphql` (covers the Alignment Forum: same ids, `af: true`) and `https://forum.effectivealtruism.org/graphql`; GET `?query=` or POST `{"query": …}`.
- Top posts since a date: `{posts(input:{terms:{view:"top",after:"2026-06-01",limit:50}}){results{_id title slug baseScore postedAt wordCount af user{displayName} fmCrosspost{isCrosspost foreignPostId}}}}`.
- In a tag: find its id with `{tags(input:{terms:{view:"tagBySlug",slug:"ai-control"}}){results{_id name postCount}}}`, then `view:"top"` with `filterSettings:{tags:[{tagId:"<id>",filterMode:"Required"}]}`.
- By author: `{user(input:{selector:{slug:"<slug>"}}){result{_id}}}`, then `{posts(input:{terms:{view:"userPosts",userId:"<id>",sortedBy:"new",limit:20}}){results{…}}}`.
- Many lookups in one call with aliases: `{a:post(input:{selector:{_id:"…"}}){result{title}} b:post(…){…}}`.
- **At least 1 second between calls, at most 2 at once.** Errors come back as HTTP 200 with `errors[]`; an unknown tag gives `results: []`.
- Skip tiny tags (nothing recent) and huge ones (`ai`, `rationality`, `community`). The EA Forum's top posts are mostly community posts: filter by a topical tag. Crossposts between LessWrong and the EA Forum have different ids linked by `fmCrosspost.foreignPostId`: add one, and set `xpost` to the other. Linkposts carry a `url`; when it points to arXiv, add the arXiv item instead.

### 6.5 Internet Archive

- `https://archive.org/advancedsearch.php?q=<query>&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=imagecount&fl[]=downloads&sort[]=downloads+desc&rows=50&output=json` with, for example, `mediatype:texts AND subject:("probabilities") AND year:[1700 TO 1930] AND imagecount:[40 TO 1500] AND -collection:(inlibrary OR printdisabled OR lendinglibrary)`.
- Then check each candidate's `https://archive.org/metadata/<identifier>`: `imagecount`, `collection`, `access-restricted-item`.
- **At least 1 second between calls.** One work often exists as several scans: add one (the most complete, most downloaded) and look the work up first.

### 6.6 QURI wikis

- `https://delegation-risk.quantifieduncertainty.org/sitemap-0.xml`, the same for `evaluation-engineering.` and `reasoning-processes.`; `priors.quantifieduncertainty.org` has no sitemap, so use its home page's links. New pages are the set difference against the corpus's `web:<host><path>` ids.
- Add them to `data/lanes/quri.added.json` (`kind: "web"`, `a` and `src` the site's name), merge, then run `node build-corpus.mjs --tree-only` (it fetches the sidebars, network) to place them.

### 6.7 Publisher and author pages

- Open-access PDFs only: the publisher's OA copy, the author's own page, an institutional repository. Proceedings sites listed in `jobs/hosts.json` (`openreview.net`, `proceedings.mlr.press`, `aclanthology.org`…) are open.

## 7. Job types

| Type | Done means | Look first | Edit | Drop when |
|---|---|---|---|---|
| `discover` | Between `wants.min` and `wants.max` new open items on the target, close to the seeds | Section 6 in the order the job lists | `data/lanes/<lane>.added.json`, then `--merge` | Nothing open and new exists, or the target is not a real topic |
| `follow-author` | 1-10 new open works by that author | arXiv `au:`, Semantic Scholar author papers, forum `userPosts` | the same | The author has nothing new and open |
| `grow-lane` | 8-25 strong open items in the lane | The sources that fit the lane (the job lists them) | the same | The lane is already complete for what is open |
| `fix-item` | Every listed item has an entry in `data/overrides.json` with the job id: a working legal open copy (`url`, `page`, `kind`…), or `"drop": true` with `why` | The item's own page, arXiv, the publisher, the Internet Archive, the Wayback Machine (`https://web.archive.org/web/2024*/<url>`; the raw copy is `https://web.archive.org/web/<timestamp>id_/<url>`) | `data/overrides.json`, then `--merge` | Never: drop the items instead |
| `media` | Every listed image has an entry in `data/media-fixes.json`: `{"from": "<working URL>", "why", "added", "job"}` or `{"from": null, "gone": true, "why", "added", "job"}` | Other sizes in the post's source, the author's site, the Wayback Machine (`id_` form) | `data/media-fixes.json` (no merge needed; the app applies it) | Never: mark images gone instead |
| `tag` | Every listed item is in at least one tag | The items' titles and abstracts | `data/tags.json`: add ids to tags' `items`; a new tag needs `id`, `label`, `kind`, `desc` | `data/tags.json` does not exist |
| `metadata` | Every listed item has its missing `a`/`y`/`d` in `data/overrides.json`, or `"unknown": ["a"]` with `why` | The title page, arXiv, the publisher, IA metadata | `data/overrides.json`, then `--merge` | Never |
| `thread` | Every listed item has a thread in `data/threads.json` (4-7 posts, the hook first) whose quotes `node threads.mjs verify --ids …` found again in the source | The item's whole text; the format and rules in `docs/feeds/threads.md` | `data/threads.json` (no merge needed; the app reads it) | The sources cannot be read (say which in `--why`) |
| `flag` | The cause is found; the data is fixed (a duplicate: keep the best copy, `"drop": true` with `why` on the others), or an app bug is described in the Result (fix code only when small and clearly in scope, with a test) | The flagged item and page; the picture in `jobs/assets/` if any | whatever the cause needs | The flag is not a problem (say why in `--note`) |

`data/overrides.json` holds fixes to any item:

```json
{"v": 1, "items": {
  "arxiv:1606.06565": {"url": "https://…", "page": "https://…", "why": "the old PDF link moved", "fixed": "2026-10-16", "job": "fix-item-0002"},
  "web:example.org/gone": {"drop": true, "why": "no open copy exists anywhere", "fixed": "2026-10-16", "job": "fix-item-0002"},
  "ia:someoldbook00auth": {"a": "Jane Author", "y": 1903, "why": "from the title page", "fixed": "2026-10-16", "job": "metadata-0001"}
}}
```

Fields it may set: `t`, `a`, `y`, `d`, `url`, `page`, `pdf`, `kind`, `n`, `ia`, `tags`, `lane`, or `drop: true`; plus `why`, `fixed`, `job`, and for metadata jobs `unknown: ["a"]`.

**Writing material for the reader** (a digest, notes, a reading guide, a report: when a job or the person who sent you asks for one): write it as a bundle, a folder `<Title>.stack/` with `index.md` (front matter: title, authors, date, source, summary, tags), pictures in `assets/` by relative path and an optional `cover.jpg`, into the Local folder that person names. It appears in the reader's Local lane within seconds. Never write it into this repository or the cache folder. Formats, speed, pictures and math: `docs/authoring.md`.

## 8. Rebuild cheaply

`node build-corpus.mjs --merge` appends every lane-file item not yet in `corpus.json`, applies `data/overrides.json`, and places what changed in the library tree. It makes no network requests and takes about a second. It folds in every `*.added.json`, other agents' too; that is expected. Items in the curated lane files (`data/lanes/*.json` without `.added`) wait for the full build: when `--merge` reports some "not in corpus.json yet", leave them out of your job.

**Never run the full build** (`node build-corpus.mjs` with no option): it refetches every lane (about 15 minutes, hundreds of requests). Run it only if a job says so.

## 9. Check, done, drop, commit

`node jobs.mjs check <id> --live` prints one line per criterion, ✓ or ✗:

- *job file parses*: the frontmatter is one `key: <JSON>` per line. Do not edit job files by hand except the body.
- *N items with job … (wants a to b)*: count the items carrying `"job": "<id>"`.
- *item rules*: each message names the field and the rule (section 3).
- *duplicates*: names the corpus item it matches and the key (section 4).
- *open host*: a deny-listed host is a hard failure; an unknown host needs an `allow` entry with a reason (section 10).
- *corpus.json has every item*: run `node build-corpus.mjs --merge`.
- *privacy*: `why`, `via` or the job file read like a person's reading history; reword neutrally.
- *--live*: each new URL is fetched once (a 2 KB range): PDFs must be PDFs, forum URLs must return a post body, IA items must be open. At most one request per host per second.

`node jobs.mjs done <id> --note "one or two sentences"` re-runs the check, refuses on a failure (`--force` closes anyway and records the failure), writes `## Result` (items added and changed, files, sources and queries, your note), moves the file to `jobs/done/`, and prints the commit:

```
git add jobs/done/discover-0007.md jobs/open/discover-0007.md data/lanes/llm.added.json corpus.json
git commit -m "Stacks job discover-0007: Find 10 open works on LLM papers › Reasoning"
```

Run exactly that. A flag job needs `--note`.

## 10. Troubleshooting

- **429s**: back off as section 6 says; switch sources rather than hammering one. Semantic Scholar is the usual culprit; arXiv and the forums rarely throttle at the given spacing.
- **A check that will not pass**: read the ✗ line; it names the item and the rule. If the job itself is wrong (a bad target, nothing open exists), drop it with a reason.
- **A host that is open but not yet known**: add it to `jobs/hosts.json` `allow`, `"host.example": "why it is open"`. `check` lists it for review, and `done` adds `jobs/hosts.json` to the files to commit.
- **A post page answers 403 to scripts**: the EA Forum (and other sites behind Cloudflare) answer `curl` and `check --live` with a bot challenge (`cf-mitigated: challenge`). `check` accepts that for `page`, which the reader opens in a browser; the post's GraphQL `url` must still return a body.
- **A redirect fails `--live`**: `url` must end on an open host, never a shadow library or a login page. Link the final open copy directly.
- **Merge conflicts in `corpus.json`**: it is generated. Take either side, then rerun `node build-corpus.mjs --merge`.
- **The lookup finds a near miss** (same title, different work): if the authors and year differ, it is a different work; the check's title key also compares the first author for short titles.
- **Nothing in `jobs/open/`**: the app writes jobs when it runs (once a day, or Refresh jobs in its Dashboard, key `Y`). If you work in a clone without the app, the reader must commit and push `jobs/open/` first.
