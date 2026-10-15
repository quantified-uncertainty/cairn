---
id: "media-0001"
type: "media"
title: "Find copies of 2 broken images in AI safety"
priority: "low"
status: "open"
created: "2026-10-15"
key: "media:ai-safety"
target: {"lane":"ai-safety","laneName":"AI safety","label":"AI safety"}
inputs: [{"item":"lw:fRsjBseRuvRhMPPE5","t":"An overview of 11 proposals for building safe advanced AI","page":null,"url":"https://i.imgur.com/Tw4JypV.png","alt":""},{"item":"lw:fRsjBseRuvRhMPPE5","t":"An overview of 11 proposals for building safe advanced AI","page":null,"url":"https://i.imgur.com/E0xQNrF.png","alt":""}]
wants: {"all":true,"count":2}
output: ["data/media-fixes.json"]
acceptance: ["every listed image has an entry with job media-0001 in data/media-fixes.json: from (an open host or web.archive.org), or gone: true with why","every from URL answers with an image (check --live)"]
gen: 1
---

## What to do

These images in corpus items do not load (removed, blocked, or replaced by a placeholder). For each one, find the same image elsewhere: another size in the post's own source, the author's site, a mirror, or the Wayback Machine (the raw `id_` form, README section 7). Record it in `data/media-fixes.json` under `images["<image url>"]` as `{"from": "<working url>", "why", "added", "job": "media-0001"}`, or `{"from": null, "gone": true, "why", "added", "job": "media-0001"}` when no copy exists.

## Images

- In An overview of 11 proposals for building safe advanced AI (lw:fRsjBseRuvRhMPPE5): https://i.imgur.com/Tw4JypV.png
- In An overview of 11 proposals for building safe advanced AI (lw:fRsjBseRuvRhMPPE5): https://i.imgur.com/E0xQNrF.png

## Finish

`node jobs.mjs check media-0001 --live`, then `node jobs.mjs done media-0001 --note "…"`, then commit the files `done` lists as "Stacks job media-0001: Find copies of 2 broken images in AI safety".
