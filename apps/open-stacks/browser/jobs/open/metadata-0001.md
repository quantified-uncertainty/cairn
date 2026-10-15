---
id: "metadata-0001"
type: "metadata"
title: "Find authors or dates for 15 items in Old technical oddities"
priority: "low"
status: "open"
created: "2026-10-15"
key: "metadata:oddities"
target: {"lane":"oddities","laneName":"Old technical oddities","label":"Old technical oddities"}
inputs: [{"id":"ia:TelegraphAndTelephoneAge","t":"Telegraph And Telephone Age: Telegraphy-Telephony-Radio, (Jan. - Dec., 1917)","missing":["a"]},{"id":"ia:australianhandb00unkngoog","t":"The Australian handbook (incorporating New Zealand, Fiji, and New Guinea) and shippers' and importers' directory","missing":["a"]},{"id":"ia:electricalreview69unse","t":"The electrical review","missing":["a"]},{"id":"ia:australianalman01unkngoog","t":"Australian Almanac","missing":["a"]},{"id":"ia:englishmechanic14unkngoog","t":"The English mechanic and world of science","missing":["a"]},{"id":"ia:englishmechanic09unkngoog","t":"The English mechanic and world of science : with which are incorporated \"The Mechanic\" \"scientific opinion\" and \"The British And Foreign Mechanic\" Volume 85","missing":["a"]},{"id":"ia:englishmechanic12unkngoog","t":"English mechanic and world of science : with which are incorporated \"The Mechanic\" \"scientific opinion\" and \"The British And Foreign Mechanic\" Volume 98","missing":["a"]},{"id":"ia:allensindianmai02unkngoog","t":"Allen's Indian Mail, and Register of Intelligence for British and Foreign ...","missing":["a"]},{"id":"ia:popularelectri3161910chic","t":"Popular electricity in plain English","missing":["a"]},{"id":"ia:chessplayerschr08unkngoog","t":"The Chess player's chronicle","missing":["a"]},{"id":"ia:britishchessmag03unkngoog","t":"The British chess magazine","missing":["a"]},{"id":"ia:britishchessmag01unkngoog","t":"The British Chess Magazine","missing":["a"]},{"id":"ia:britishchessmag02unkngoog","t":"The British Chess Magazine","missing":["a"]},{"id":"ia:britishchessmag04unkngoog","t":"The British Chess Magazine","missing":["a"]},{"id":"ia:chessjournal00unkngoog","t":"The Chess journal","missing":["a"]}]
wants: {"all":true,"count":15}
output: ["data/overrides.json","corpus.json"]
acceptance: ["every listed item has an entry with job metadata-0001 in data/overrides.json: the missing fields, or unknown with why","corpus.json rebuilt with node build-corpus.mjs --merge"]
gen: 1
---

## What to do

These items lack an author or a date. Find each from the item's own page or file (the title page, arXiv, the publisher, the Internet Archive's metadata). Record it in `data/overrides.json` (`a`, `y`, `d`) with `why`, `fixed` and `job: "metadata-0001"`. When a field cannot be found, set `unknown: ["a"]` (or `["y"]`) with `why` (README section 7).

## Items

- Telegraph And Telephone Age: Telegraphy-Telephony-Radio, (Jan. - Dec., 1917) (ia:TelegraphAndTelephoneAge): no author
- The Australian handbook (incorporating New Zealand, Fiji, and New Guinea) and shippers' and importers' directory (ia:australianhandb00unkngoog): no author
- The electrical review (ia:electricalreview69unse): no author
- Australian Almanac (ia:australianalman01unkngoog): no author
- The English mechanic and world of science (ia:englishmechanic14unkngoog): no author
- The English mechanic and world of science : with which are incorporated "The Mechanic" "scientific opinion" and "The British And Foreign Mechanic" Volume 85 (ia:englishmechanic09unkngoog): no author
- English mechanic and world of science : with which are incorporated "The Mechanic" "scientific opinion" and "The British And Foreign Mechanic" Volume 98 (ia:englishmechanic12unkngoog): no author
- Allen's Indian Mail, and Register of Intelligence for British and Foreign ... (ia:allensindianmai02unkngoog): no author
- Popular electricity in plain English (ia:popularelectri3161910chic): no author
- The Chess player's chronicle (ia:chessplayerschr08unkngoog): no author
- The British chess magazine (ia:britishchessmag03unkngoog): no author
- The British Chess Magazine (ia:britishchessmag01unkngoog): no author
- The British Chess Magazine (ia:britishchessmag02unkngoog): no author
- The British Chess Magazine (ia:britishchessmag04unkngoog): no author
- The Chess journal (ia:chessjournal00unkngoog): no author

## Finish

`node build-corpus.mjs --merge`, then `node jobs.mjs check metadata-0001 --live`, then `node jobs.mjs done metadata-0001 --note "…"`, then commit the files `done` lists as "Stacks job metadata-0001: Find authors or dates for 15 items in Old technical oddities".
