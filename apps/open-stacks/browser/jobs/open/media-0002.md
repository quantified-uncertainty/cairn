---
id: "media-0002"
type: "media"
title: "Find copies of 1 broken image in Forecasting"
priority: "low"
status: "open"
created: "2026-10-15"
key: "media:forecasting"
target: {"lane":"forecasting","laneName":"Forecasting","label":"Forecasting"}
inputs: [{"item":"eaf:m65R6pAAvd99BNEZL","t":"Use resilience, instead of imprecision, to communicate uncertainty","page":null,"url":"https://i.imgur.com/SJZRToh.png","alt":""}]
wants: {"all":true,"count":1}
output: ["data/media-fixes.json"]
acceptance: ["every listed image has an entry with job media-0002 in data/media-fixes.json: from (an open host or web.archive.org), or gone: true with why","every from URL answers with an image (check --live)"]
gen: 1
---

## What to do

These images in corpus items do not load (removed, blocked, or replaced by a placeholder). For each one, find the same image elsewhere: another size in the post's own source, the author's site, a mirror, or the Wayback Machine (the raw `id_` form, README section 7). Record it in `data/media-fixes.json` under `images["<image url>"]` as `{"from": "<working url>", "why", "added", "job": "media-0002"}`, or `{"from": null, "gone": true, "why", "added", "job": "media-0002"}` when no copy exists.

## Images

- In Use resilience, instead of imprecision, to communicate uncertainty (eaf:m65R6pAAvd99BNEZL): https://i.imgur.com/SJZRToh.png

## Finish

`node jobs.mjs check media-0002 --live`, then `node jobs.mjs done media-0002 --note "…"`, then commit the files `done` lists as "Stacks job media-0002: Find copies of 1 broken image in Forecasting".
