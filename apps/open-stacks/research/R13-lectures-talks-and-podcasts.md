# Lectures, courses, talks and podcasts as literature (research dossier)

- **Date:** 2026-10-15. All "accessed" dates are 2026-10-15 unless stated. Every count, price and status below is "as of October 2026".
- **Track:** R13, lectures, courses, talks and podcasts treated as literature.
- **Scope:**
  - Open lecture sources (universities, research seminars, public lectures, conference talks, video repositories).
  - The free tier of course platforms. Paid plans belong to R03.
  - Podcasts with transcripts.
  - Local transcription and chaptering for lectures.
  - Learning evidence not already in R11 §2.5.
  - A "lecture as chapter" data model that extends R10's unified work record.
  - Legal rows in R09's green/yellow/red format.
  - A 60-item canonical sample paired with R01 §9 books.
- **Method:**
  - **Live measurements (2026-10-15), in place of search:**
    - The MIT Learn search API for all 2,589 OCW courses and 6,506 OCW videos.
    - A polite crawl of all 2,589 OCW `/download/` pages, plus 984 OCW `data.json` video records (robots.txt allows `/`).
    - The media.ccc.de GraphQL API (all 17,256 items) and the REST API.
    - DataCite (TIB AV-Portal and PIRSA DOI prefixes), Zenodo and Internet Archive search APIs.
    - A sparse clone of the ACL Anthology XML (128,493 papers).
    - 252 podcast RSS feeds: the Apple US top-200 plus a curated set of 54 high-signal shows, parsed item by item.
    - The Open ASR Leaderboard result CSVs, version of 2026-10-15.
    - Local ASR runs: two models on a CC-licensed MIT lecture, scored against MIT's own captions, and one model on a CC BY 37C3 talk, scored against its human subtitles.
    - A lexical slide-versus-speech comparison over six MIT 6.041SC lectures.
  - **Web search.** About 15 web searches before and during the work, used mainly for secondary context. The search budget held, but many primary sites block scripted access (see "bot walls" below).
  - **Not done.** I did not scrape YouTube; R09 rates that red. YouTube-hosted captions and chapters are therefore marked "not checked" (`?`).
- **Bot walls recorded as findings (HTTP status from this environment):**
  - **403:** Class Central, FutureLearn (www and about), edX support, Udacity support, Gresham College (to curl; WebFetch succeeded), IAS (`/video`, also to WebFetch), PIRSA (pirsa.org and doi.org/10.48660 resolution), ACM DL search, OpenLearn (to curl; its FAQ loaded via WebFetch), Harvard Stat 110 sites, and the Podcast Index API and `public.podcastindex.org`. GitHub API access to repositories not attached to this session is also refused.
  - **500:** c3subtitles.de.
  - **No connection:** `online.kitp.ucsb.edu`.
  - **Server error:** the Apple marketing-tools RSS chart.
- **Evidence legend:**
  - **[V]** verified on a primary source or live query in this session.
  - **[S]** secondary source.
  - **[I]** my inference or calculation.
  - **[K]** background knowledge, not re-verified this session.
  - Confidence is given in words or as a probability, for example [~70%].
  - "(stale?)" flags a source that may be out of date.
- **Cross-references (cited, not redone):**
  - R10 §1.4: YouTube quotas, `captions.download` requiring edit permission, transcript-scraper IP blocks, API transcription prices of $0.003–0.006/min, Podcast Index and Listen Notes one-liners, Audiobookshelf.
  - R09 row 29 and idea 11: YouTube developer policies of 2026-09-14.
  - R01 §6: MIT OCW, 2,500+ courses, CC BY-NC-SA.
  - R11 §2.5: listening versus reading.
  - R07 §3.2–3.3: Gemini Notebook audio overviews and Illuminate.

---

## Executive summary

1. **[OCW video is a minority of OCW] Only about 1 OCW course in 7 has downloadable video, and fewer than 1 in 10 has a full lecture-video series** [V, measured]:
   - 366 of 2,589 OCW courses (14.1%) list any downloadable video, 8,514 video items in all.
   - 247 courses (9.5%) have a "Lecture Videos" section, holding 6,173 lecture videos.
   - 177 of those courses have at least 10 lecture videos and 140 have at least 20.
   - By contrast, 1,303 courses (50%) are tagged "Lecture Notes", and 1,085 of them have no video or audio tag at all.
   - Most OCW is text. The video part is a curated core of about 150–250 full courses.
2. **[OCW publishes its own transcripts] Where OCW has video, it usually also has owner-published transcripts and captions, served from ocw.mit.edu itself** [V]:
   - In 984 sampled video records (first, middle and last video of each of the 366 courses), 77.5% had a transcript PDF, 78.6% WebVTT captions, 78.0% an archive.org MP4, and 100% a YouTube ID.
   - 196 of the 247 lecture-video courses had transcripts on every sampled lecture.
   - 163 courses have at least 10 lecture videos with transcripts. That is the realistic "fully readable OCW lecture course" set.
3. **[OCW terms on AI] OCW's terms now say explicitly what is allowed for AI training** (updated 2026-08-11) [V]:
   - Training is permitted only with attribution, for non-commercial models.
   - Derivative models must carry CC BY-NC-SA 4.0 or a compatible licence.
   - For a personal, non-commercial lecture index this is green. For a commercial product it is red unless MIT licenses it separately.
4. **[media.ccc.de is the best-structured open talk archive] It is the cleanest machine-readable open talk archive I found** [V, measured]:
   - Size: 17,256 items (17,128 unique) from 465 events, about 11,771 hours, covering 2000–2026.
   - Interfaces: a public REST and GraphQL API, a CDN for MP4/MP3/Opus, and timestamp deep links (`#t=` or `?t=`, including `1h2m3s` syntax).
   - Licences: these are stated in the media files, for example "Licensed to the public under … by/4.0" in the MP3 metadata. Only 18.8% of descriptions state one.
   - Subtitles: 12.9% of items have any. 654 items (about 525 hours) have a *final* human subtitle in the talk's language; 1,312 more are "todo" drafts.
   - Coverage by year: Congress talks from 30C3 to 37C3 have 98–99% subtitle coverage (36C3 is the exception at 82%), but none of the 1,132 talks from 2026 have any yet.
5. **[DOIs for talks exist] Two DOI prefixes already cover large talk archives** [V]:
   - TIB AV-Portal (10.5446) has 45,898 DataCite DOIs. They include 391 CCC talks, and licence and DOI appear on each media page.
   - Perimeter's PIRSA (10.48660) has 10,898 DOIs.
   - Zenodo holds 23,009 records typed "video" and 95,934 typed "presentation".
   - A talk can be cited like a paper; most conference talks still cannot.
6. **[ML conference talks are free but closed] They are free to watch but neither licensed nor bulk-downloadable** [V]:
   - The NeurIPS 2024/2025, ICML 2026 and ICLR 2025/2026 oral pages are served anonymously with SlidesLive embeds. The virtual sites say "all recordings will be available about a month after the conference." I did not test playback.
   - No licence is stated and there are no transcripts.
   - **ACL is the exception.** 15,790 of 128,493 Anthology papers (12.3%) have a video, and 13,284 are MP4s hosted on aclanthology.org under the Anthology's CC BY 4.0 notice for 2016+ material. Coverage peaked at 48% of 2021 papers. It was 13% for 2024 and 0% so far for 2025–2026.
7. **[Coursera audit is gone] Coursera replaced its audit tier on 2025-08-08 with a free preview of "the first module of nearly every course"** [V, Coursera blog]:
   - edX audit is still free but time-limited to the course's length [S; the support site returned 403].
   - FutureLearn's free tier lasts the course's duration, unlocks weekly and excludes tests [S; the site returned 403].
   - Udacity still advertises "Free programs" [V].
   - Coursera closed its all-stock merger with Udemy on 2026-05-11 [S, SEC filings via search].
   - The free MOOC tier is now a sampler. Open courseware (OCW, SEE, OYC, CS50, NPTEL) is the real free layer.
8. **[Podcast transcripts live on websites] High-signal podcasts mostly publish full transcripts on their own sites, not in their feeds** [V]:
   - 9 of the 10 sampled high-signal episodes had a full transcript on the owner's page: 80,000 Hours, Dwarkesh, EconTalk, Conversations with Tyler, Lex Fridman, The Gradient, AXRP, Mindscape and Clearer Thinking. The tenth, Odd Lots, had an auto-generated transcript.
   - Only 11 of the 54 curated feeds (20%) carry `<podcast:transcript>` at all.
   - Among the Apple US top-200, 28 of 198 feeds (14%) do, covering 14.2% of items. Most are host-generated: Omny, Buzzsprout, Flightcast.
9. **[Chapters are rare] Podcast and lecture chapters are rare** [V/S]:
   - Podcasts: 5 of 198 top-200 feeds (2.5%) and 7 of 54 curated feeds use `<podcast:chapters>`. Across the whole index, an independent nightly tracker reports 64,258 podcasts and 1,571,030 episodes with chapters, against 7,200,384 episodes with transcripts [S, Podcast Industry Insights]. That is about 0.9% and 4.3% of the 166.8M episodes it counts.
   - OCW lectures: only 84 of 6,506 OCW videos (1.3%) have three or more owner-written timestamp lines.
   - **Chaptering is a gap a tool can fill.**
10. **[Local ASR is good enough for lectures] Local ASR on a 4-vCPU machine with no GPU is accurate enough for lecture indexing, and very cheap** [V, measured]:
    - On a 51-minute MIT 6.041SC lecture (CC BY-NC-SA) scored against MIT's own captions, Whisper large-v3-turbo (int8, greedy) scored a WER of 2.24% and NVIDIA Parakeet-TDT-0.6B-v2 (int8 ONNX) 4.09%.
    - Most of Parakeet's extra "errors" are verbatim repetitions that MIT's clean-verbatim captions omit.
    - On a code-heavy 37C3 talk (CC BY 4.0) with human subtitles, Parakeet scored 8.68%, mostly on library names such as "picoTCP" and "smoltcp".
    - Speed on a 4-vCPU Xeon shared with other jobs: 7.0× real time for Parakeet and 2.6× for Whisper turbo.
    - That is roughly 140 and 380 CPU-hours per 1,000 lecture hours, against $180–360 per 1,000 hours for API transcription (R10).
11. **[Leaderboard] On the Open ASR Leaderboard (2026-10-15), open models sit about 1 WER point behind the best proprietary APIs and level with OpenAI's** [V data; I recomputation]:
    - The CSV's own `avg` column mixes in the URGENT and private test sets for some models but not others, so I recomputed a like-for-like mean over the 8 public English sets every model reports.
    - Best open models: Qwen3-ASR-1.7B 4.31, Canary-Qwen-2.5B 4.43, Cohere Transcribe 4.67 and Parakeet-TDT-0.6B-v2 4.70. Whisper large-v3 scores 5.78 and turbo 6.36.
    - Best proprietary: OtterAI speech-v3.1 3.36, ElevenLabs Scribe v2 3.97, OpenAI gpt-transcribe 4.57.
    - On long-form TED-LIUM, the closest public proxy for lectures, Whisper large-v3 scores 3.15, Parakeet-TDT v3 2.77 and Cohere Transcribe 2.23. The best API is ElevenLabs Scribe v2 at 2.12.
12. **[Slides carry little of the content] In lecture courses, slides are a small fraction of the content** [V, measured; I, interpretation]:
    - Across six 6.041SC lectures, the slide decks contain 2,991 words against 42,346 spoken, a ratio of 7.1%.
    - 75% of slide content-word types are spoken.
    - Only 32% of spoken content tokens use a word type that appears on the slides.
    - Every one of the six slide decks cites the textbook sections it covers ("Readings: Sections 1.1, 1.2" and so on). These are free gold labels for a lecture↔chapter linker.
13. **[Speed-watching] Speed-watching up to 2× costs little; 2.5× costs measurably** (Murphy et al., *Applied Cognitive Psychology* 2022) [V]:
    - Immediate comprehension was .65, .60, .62 and .55 at 1×, 1.5×, 2× and 2.5×. Only 1× versus 2.5× was significant (d = .24, n = 231).
    - 85% of 123 surveyed students already watch lectures sped up.
    - Video added to teaching helps more than video replacing it: g = 0.80 versus g = 0.28 over 105 RCTs (Noetel et al. 2021) [S].
14. **[Canonical sample] Everything in the 60-item sample is free to watch, but few items are open** [V/K]:
    - 45% of items carry an open licence.
    - 48% have an owner transcript.
    - 2% have owner chapters.
    - 30% permit bulk download.
    - For courses alone: 60% open licence, 45% owner transcript (plus 5 partial), 40% bulk download.
    - The open, transcribed, downloadable core is MIT OCW, Stanford SEE, Harvard CS50, Open Yale Courses, the Berkeley webcast mirror on Internet Archive, ACL videos and media.ccc.de.

---

## Detailed findings

### 1. Inventory of open lecture sources (Deliverable 1)

**How to read the tables:**

- "Owner transcript" means a transcript published by the rights holder, not YouTube auto-captions.
- "Bulk route" means a download, API or dump the owner provides.
- Counts are as of October 2026.

#### 1.1 Universities and course platforms with open video

| Source | Subject strengths | Courses or hours with full video | Licence (does it cover video, transcript, slides?) | Owner transcripts or human captions | Download / bulk / API route | Stable IDs | Last update seen | Evidence |
|---|---|---|---|---|---|---|---|---|
| **MIT OCW** (now also indexed in MIT Learn) | Maths, EECS, physics, economics; strongest on 2005–2020 core undergraduate courses | 2,589 courses in all. 366 have downloadable video (8,514 items). 247 have a lecture-video section (6,173 videos). 177 have ≥10 and 140 have ≥20 lecture videos. MIT Learn indexes 6,506 OCW videos totalling 4,546 h across 261 courses | CC BY-NC-SA 4.0 on video resources (981 of 984 sampled; 3 were CC BY-NC 4.0). The licence travels with each file in `data.json`, so it covers video, transcript PDF and slides unless a third-party credit says otherwise [V]. AI-training clause: attribution, non-commercial only, ShareAlike for derived models (terms updated 2026-08-11) [V] | Transcript PDF on 77.5% and WebVTT captions on 78.6% of sampled videos, served from ocw.mit.edu. Captions are "clean verbatim" [V; human origin I, high] | Per-course zip (excluding A/V); per-video archive.org MP4 (78%); `data.json` per resource; MIT Learn search API (`api.learn.mit.edu/api/v1/learning_resources_search/`) with facets; sitemaps per course; robots.txt `Allow: /` [V] | Course URL, resource UUID, YouTube ID, IA identifier [V] | Records modified 2026-10-14 [V] | [V] measured |
| **Stanford SEE** (Engineering Everywhere) | Intro CS, ML (CS229, 2008), linear systems, convex optimization, Fourier, robotics | 9 CC courses: CS106A, CS106B, CS107, CS223A, CS229, EE261, EE263, EE364A, EE364B. "Introduction to Logic" is listed but is not CC | "A Creative Commons license allows for free and open use, reuse, adaptation and redistribution" (version not stated on the page) [V] | Per-lecture "Transcripts HTML PDF" [V] | Per-lecture download links [V] | see.stanford.edu/Course/… [V] | Old content (2007–2008 recordings) [K]. **(stale?)** | [V] |
| **Stanford courses on YouTube** | CS229 (2018), CS224N (2024 playlist), CS231n (2017), CS336 (Spring 2026 playlist), StatLearning | Full playlists [V for CS224N and CS336 course pages; K for the others] | YouTube standard licence; no CC statement [K] | None on owner pages. CS224N says lecture videos for the current term are Canvas-only: "not possible to make these videos viewable by non-enrolled students" [V] | None; YouTube ToS bars downloading [V] | YouTube IDs; course pages | CS336 Spring 2026 page live [V] | [V]/[K] |
| **Harvard CS50** | Intro CS plus AI, Python, SQL, web | Every year, every lecture | CC BY-NC-SA 4.0 for the course [V] | "Subtitles" and "Transcripts" (English, Portuguese, Spanish) per lecture [V] | Direct MP4 (360p to 4K) and "Studio Zip" per week [V] | cs50.harvard.edu/x/weeks/N | 2026 edition live [V] | [V] |
| **Harvard Stat 110** | Probability (Blitzstein) | 34-lecture YouTube playlist [K] | Not checked (sites returned 403) | None known [K] | YouTube only [K] | YouTube | — | [K] |
| **Open Yale Courses** | Humanities, economics, philosophy, history, psychology | About 40 courses [K, ~70%] | "Most of the lectures and course material … licensed under a Creative Commons Attribution-Noncommercial-Share Alike 3.0 license" [V] | "available in video, audio, and text transcript formats" [V] | Per-lecture downloads [K] | oyc.yale.edu/<dept>/<course> [V] | Recorded around 2006–2011 [K]. **(stale?)** | [V] |
| **UC Berkeley webcasts** | CS 61A/61B/61C, statistics, economics, and more | After the DOJ accessibility finding (2016) Berkeley removed public access to 20,000+ videos in March 2017 [K]. The **Internet Archive mirror `ucberkeley-webcast` holds 11,546 items** (public date 2017-03-10), about 417–463 of them CS 61A lectures [V] | Item descriptions read "Creative Commons 3.0: Attribution-NonCommercial-NoDerivs" [V] | None [V, sample] | IA `advancedsearch` and S3-style download [V] | IA identifiers, e.g. `ucberkeley_webcast_euRQ4EN_XhI` [V] | Frozen in 2017 [V] | [V] |
| **Berkeley today** | — | Course Capture recordings live in bCourses (campus login): "This application does not host recordings" [V] | — | — | — | — | — | [V] |
| **CMU** (e.g. 15-445/645) | Databases, systems, ML | 15-445 Fall 2024 schedule links slides, notes and a video for each lecture [V] | Not stated [V] | None | YouTube | Course site | 2026 offering live [V] | [V] |
| **NPTEL** (India) | Engineering, CS, mathematics, management, humanities | 3,483 courses listed (2,553 "NOC" MOOC runs), led by mechanical (394), humanities (326), CS (306), electrical (305) and civil (303). "More than 70000 hours of video content, transcribed and subtitled"; "600+ courses … every semester" [V] | Site footer: "Distributed under Creative Commons Attribution-ShareAlike CC BY-NC-SA". The text is self-contradictory but the code is NC [V] | Transcripts claimed for 70k hours; "more than 12000 hrs" translated into Indian languages [V] | Per-course "downloads" tab (JS-rendered); YouTube channel; robots.txt allows all [V] | 9-digit course IDs, e.g. nptel.ac.in/courses/106106184 [V] | Current [V] | [V] |
| **Khan Academy** | School and early-undergraduate maths, science, economics | Thousands of short videos [K] | CC BY-NC-SA 4.0 statement in the ToS [V] | Transcripts on video pages [K] | No bulk route [K] | Content slugs | Current | [V]/[K] |
| **OpenLearn** (Open University) | Broad UK OU content | "nearly 1000 courses" / "over 1,000 free courses" (FAQ gives both) [V, WebFetch] | CC BY-NC-SA for OU-owned course content; third-party items licensed separately [V] | "Most audio and video has a transcript"; older items may not [V] | Each course in Word, PDF, Kindle and EPUB; A/V downloadable "where we have the intellectual property rights" [V] | Course URLs | Current | [V] FAQ via WebFetch (homepage 403 to curl) |
| **Individual-instructor series** | ML and statistics | Silver RL (2015); MacKay ITPRNN (2012); Aalto BDA; Missing Semester (IAP 2026); MIT 6.S191; fast.ai; Karpathy; 3Blue1Brown | Silver slides CC BY-NC 4.0 [V]; Aalto "text … and videos licensed under CC-BY-NC 4.0" [V]; Missing Semester CC BY-NC-SA [V]; 6.S191 "MIT license" [V]; MacKay none stated [V] | Generally none. Missing Semester notes are prose, not verbatim | MacKay: direct downloads [V]. Others on YouTube | — | Missing Semester 2026 [V] | [V] |

#### 1.2 Research seminars and summer schools

| Source | Strengths | Size | Licence | Transcripts | Bulk / IDs | Evidence |
|---|---|---|---|---|---|---|
| **Simons Institute** (Berkeley) | Theoretical CS, ML theory | Videos page links YouTube (`@SimonsInstituteTOC`); boot-camp talks dated 2026-10-14/15 [V] | Footer: "© 2013–2026 … All Rights Reserved" [V] | None stated [V] | YouTube | [V] |
| **PIRSA** (Perimeter Institute) | Theoretical physics | **10,898 DataCite DOIs** under 10.48660, latest created 2026-10-13 (talk 26090052) [V] | Not checked (403) | Unknown | DOIs `10.48660/<PIRSA no.>` [V]; PIRSA numbers encode year and month [S] | [V] DataCite; site 403 |
| **IAS** | Maths, physics | — | — | — | — | Site returned 403 |
| **SLMath (MSRI)** | Mathematics | "Video Library" (JS-rendered; not counted) [V page] | — | — | — | [V] page only |
| **Isaac Newton Institute** | Mathematics | Seminars embedded from YouTube ("accept video player cookies… or view content on YouTube") [V] | — | — | YouTube | [V] |
| **Fields, ICTP** | Mathematics, physics (ICTP has a development mission) | Pages live; archive JS-rendered [V] | — | — | — | Not counted |
| **KITP** | Theoretical physics | — | — | — | — | Connection failed |
| **MLSS and similar summer schools** | ML | Per-edition YouTube playlists [K] | YouTube standard [K] | None [K] | — | [K] |

#### 1.3 Public lectures

| Source | Size | Licence | Transcripts | Bulk | Evidence |
|---|---|---|---|---|---|
| **Gresham College** | "over 3,500 videos available on our website", "over 1,200 speakers" [V, WebFetch of /watch-now; scripted curl got 403]. Older figure: "over 2,000 lectures" [S, Wikipedia] **(stale)**. The podcast feed (Buzzsprout) carries 1,000 items back to 2018-02-15; 351 have `<podcast:transcript>` (HTML and JSON) [V] | No CC licence. Terms: "We positively encourage the use of the Gresham College lecture transcripts, audio and video files for educational purposes. However, we do not allow use of Gresham College materials for commercial, personal or institutional gain"; recordings' copyright is assigned to the College [V, terms page, undated] | Website transcripts (the terms name them) [V]; feed transcripts [V] | RSS audio; per-lecture downloads [S] | [V] |
| **Royal Institution** | YouTube channel; Christmas Lectures [K] | Not checked | — | — | [K] |
| **Long Now Foundation** | Talks page live [V]; **IA collection `longnow`: 6,642 items** [V] | — | — | IA | [V] |
| **TED** | Thousands of talks [K] | **CC BY-NC-ND 4.0** for personal or non-commercial sharing. "Transcripts and subtitles may be used under the same Creative Commons license in conjunction with the TED Talk video. Copyright on the transcripts is owned by TED and any edits … are not permitted without permission." Sharing must use TED's embeddable player. Commercial use, explicitly including employee training, needs a licence [V] | Yes: human transcript pages, e.g. `/talks/<slug>/transcript` returns 200 [V] | No bulk route; player required [V] | [V] |
| **Talks at Google** | YouTube channel [V page] | YouTube standard | None | — | [V] |

#### 1.4 Conference talks

| Source | Free without registration? | Licence | Transcripts | Bulk / API | Stable IDs | Evidence |
|---|---|---|---|---|---|---|
| **NeurIPS (SlidesLive)** | 2022–2025 virtual sites: "All recordings will be available about a month after the conference." The 2023, 2024 and 2025 oral pages are served anonymously with a SlidesLive embed (e.g. presentation 39031482); the SlidesLive page returns 200 with no "private" marker. I did not test playback [V] | Not stated | None | None | `neurips.cc/virtual/<yr>/oral/<id>`; SlidesLive ID | [V] |
| **ICML, ICLR (SlidesLive)** | Same pattern for ICML 2025/2026 and ICLR 2025/2026 oral pages [V] | Not stated | None | None | Same | [V] |
| **ACL Anthology** | Yes | Anthology footer: material from 2016 on is CC BY 4.0; before 2016, CC BY-NC-SA 3.0 [V] | None | **15,790 of 128,493 papers have `<video>`: 13,284 MP4s on aclanthology.org, 2,383 SlidesLive links and about 150 YouTube.** Share by year: 2020 34%, 2021 48%, 2022 35%, 2023 42%, 2024 13%, 2025–26 0% [V]. Metadata in the GitHub XML | Anthology ID, e.g. `aclanthology.org/2023.acl-long.1.mp4` (200, video/mp4) [V] | [V] measured |
| **USENIX** | "Any video, audio, and/or slides that are posted after the event are also free and open to everyone" [V] | Open access, no CC licence stated [V] | None | Slides PDF on usenix.org; videos on YouTube [V] | Presentation URL | [V] |
| **ACM DL video** | — | — | — | — | — | Search returned 403 |
| **media.ccc.de** (CCC and many other events) | Yes | Licence "displayed in the actual video file", e.g. MP3 metadata "Licensed to the public under http://creativecommons.org/licenses/by/4.0" [V]. Descriptions state a licence for 3,241 items (18.8%): CC BY 4.0 2,162; CC BY-SA 4.0 776; CC BY 3.0 137; CC BY-NC-ND 4.0 118; CC BY-NC 4.0 41 [V] | c3subtitles, crowd-written: 2,228 items have any subtitle; 654 are final in the original language, 1,312 "todo", 117 "auto", 73 draft [V] | REST `api.media.ccc.de/public/…` and GraphQL `media.ccc.de/graphql` with `items(first, offset)` and `subtitles{…}`; CDN downloads. 21 of 25 sampled subtitle URLs resolved and 4 returned 404 [V] | GUID, slug, `?t=` / `#t=` deep links (player code parses `t` from query or hash, seconds or `1h2m3s`) [V]; 391 TIB DOIs [V] | [V] measured |
| **PyCon and PyData** (via PyVideo) | "So far we have indexed 21,748 [videos] from 542 events" [V] | Mostly YouTube [K] | None | PyVideo index (GitHub `pyvideo/data`) [K] | — | [V]/[K] |
| **Strange Loop** | Ended; site footer "© 2009-2023"; "Check out our YouTube channel for all the conference videos" [V] | YouTube | None | — | — | [V] |
| **EA Global** | "Watch past talks" on the EAG page (e.g. EAG London 2024) [V] | YouTube standard [K] | None [K] | — | — | [V] |

#### 1.5 Scientific video infrastructure

| Platform | Size (DataCite or API) | What it adds | Evidence |
|---|---|---|---|
| **TIB AV-Portal** (Hannover) | **45,898 DOIs** (prefix 10.5446) | A DOI, licence (e.g. "CC Attribution 3.0 Germany"), series, publisher and subject on every media page; includes 391 CCC talks | [V] |
| **Zenodo** | 23,009 `video` records; 95,934 `presentation` records | DOIs, versioning, mostly CC licences [K] | [V] counts |
| **Internet Archive** | `ucberkeley-webcast` 11,546; `longnow` 6,642; `mit_ocw` 513 items (OCW's own uploads, e.g. `MIT6.041F10`, CC BY-NC-SA 3.0, uploader ocw-prod@mit.edu); `subject:lecture AND mediatype:movies` 7,029 | Stable identifiers, full-file download, metadata API | [V] |
| **Gaps** | Most seminar series sit on YouTube or JS-rendered sites without DOIs or licences | — | [I] |

### 2. Free access on course platforms, October 2026 (Deliverable 2)

| Platform | Free tier now | Change and date | What a reader can still do free | Status | Evidence |
|---|---|---|---|---|---|
| **Coursera** | "Preview the first module of nearly every course … for free". This "includes full access to key platform features, such as graded assignments and Coursera Coach" | **Audit replaced on 2025-08-08** ("This new model replaces our audit experience"). Also new: "Free Community Impact Courses", localized pricing, and financial aid for "full access to course content and certificates for free or at a reduced cost" | Week 1 of most courses. Full courses only via financial aid or community-impact courses | Merged with Udemy on 2026-05-11 (Udemy now a Coursera subsidiary; 0.800 COUR per UDMY share) [S] | [V] blog; [S] SEC via search |
| **edX** (2U) | Audit still free, but access lasts only the course's estimated length in weeks from enrolment. Graded items are verified-only in many courses (MITx since 2018-12-17) | Time-limited audit and verified-only archives began around 2018–2019 (MIT statement of 2018-12-17 [V]; exact edX-wide date [K, ~70%]). 2U went through Chapter 11 in 2024 [K] | Watch videos within the audit window | Support site returned 403 | [S] support articles via search; [V] MIT statement 2018 |
| **FutureLearn** | Free for the course's duration, "content delivered weekly", no tests, no post-course access [S] | Long-running "upgrade" model [S] | Sample a course while it runs | Site returned 403 | [S] |
| **Udacity** (Accenture) | Pricing page: "Free programs: Start building AI skills for free … Start Free Today" [V] | Acquired by Accenture in 2024 and folded into LearnVantage [S]; All Access subscription since 2023 [S] | A small free catalogue | Live | [V]/[S] |
| **Class Central** (tracker) | Could not be checked: 403 to scripted access and to WebFetch | — | — | Bot wall | [V] |

**Overlap with R03.**

- R03 lists LinkedIn Learning and "Udemy (Gale Presents) (4,000+ courses)" as free through San Francisco and Bay Area public-library cards. Udemy is now a Coursera subsidiary [S].
- Library-card Udemy access is therefore the only no-cost route into a Coursera-group catalogue beyond week-1 previews. I could not verify whether Gale's Udemy offering changed after the merger.

**Inference [I, ~80%].** For someone exploring literature, MOOC platforms have stopped being a free reading layer. The durable free layer is courseware published under an open licence: OCW, SEE, OYC, CS50, NPTEL, OpenLearn, ACL and CCC.

### 3. Podcasts as literature (Deliverable 3)

#### 3.1 Transcript availability for high-signal shows (verified 2026-10-15)

- **Site:** a full transcript on the owner's episode page, checked on the latest episode.
- **RSS tag:** number of items carrying `<podcast:transcript>` out of the items in the feed.
- **Chapters:** items carrying `<podcast:chapters>`.

| Show | Owner transcript on site | RSS transcript tag (items) | RSS chapters (items) | Transcript provenance | Evidence |
|---|---|---|---|---|---|
| 80,000 Hours | Yes | 196/358; 19 of the latest 20 (text/plain) | 267/358 | Edited, human-reviewed [I, ~80%] | [V] |
| Dwarkesh Podcast | Yes (Substack page, ~17k words) | 0/142 (Apple-specific workers.dev feed) | 0 | Unknown | [V] |
| EconTalk | Yes ("Explore audio transcript") | 0/1,071 | 0 | Unknown | [V] |
| Conversations with Tyler | Yes ("Read a transcript enhanced with helpful links") | 2/304 (SRT) | 0 | Edited, with added links [V] | [V] |
| Lex Fridman Podcast | Yes (`/<guest>-transcript`, 30,717-word page) | 0/502 | 0 (timestamps on page) | Unknown | [V] |
| The Gradient | Yes (Substack); last episode 2026-01-22 | 0/149 | 0 | Unknown | [V] |
| AXRP | Yes (axrp.net) | 0/63 | 0 | Unknown | [V] |
| Sean Carroll's Mindscape | Yes ("Click to Show Full Transcript") | 0/448 | 0 | Unknown | [V] |
| Clearer Thinking | Yes; "WeAmplify — Transcriptionists" credited | 0/326 | 0 | Human [V] | [V] |
| Future of Life Institute | Yes ("Full Transcript" on Transistor page) | 0/279 | 4 | Unknown | [V] |
| Practical AI | Yes | 71/377 (JSON, SRT, HTML, text, VTT) | 170 | Unknown | [V] |
| Manifold (Steve Hsu) | Yes | 170/173 | 111 | Unknown | [V] |
| Latent Space | Yes (Substack "Transcript") | 0/235 | 0 | Unknown | [V] |
| Cognitive Revolution | Yes (page; show notes flagged "AI-generated") | 0/386 | 0 | AI-assisted [V] | [V] |
| Rationally Speaking | Yes ("Transcript (PDF)") | 0/263; last episode 2025-12-15 | 0 | Unknown | [V] |
| Odd Lots; Cautionary Tales (Omny) | Platform | 1,283/1,287; 233/233 (SRT, VTT, text) | 0 | Auto (host-generated) [I, high] | [V] |
| Learning Bayesian Statistics (Riverside) | — | 32/222 (20 of the latest 20) | 0 | Auto [I] | [V] |
| In Our Time, Huberman, Freakonomics, Planet Money, Making Sense, The Rest Is History, Hard Fork | Site transcripts for some (NPR, Freakonomics) [K]; BBC page 403; Huberman 404 | 0 | 0 | — | [V] feeds |

**Verdict [V/I].**

- The shows this reader is most likely to want (80k Hours, Dwarkesh, EconTalk, CWT, AXRP, Mindscape, Clearer Thinking, FLI, The Gradient, Lex) almost all publish full transcripts on the web.
- Only 80k Hours, Manifold and Practical AI expose them in RSS.
- **A builder should harvest transcripts from owner pages, one adapter per site, and fall back to local ASR of the RSS enclosure.**

#### 3.2 Platform transcripts

- **Apple Podcasts** [V, Apple for Creators]:
  - Auto-generates transcripts on iOS 17.4 and later in 11 languages.
  - Creators can supply their own through the RSS transcript tag, or upload VTT/SRT for subscriber episodes.
  - Listeners can "select and copy up to 200 words" when sharing.
  - I found no export or API [V docs; I]. Private RSS feeds get no transcripts [V].
- **Spotify.** Auto transcripts for some shows [K]. No public transcript API known [K, ~80%]. Spotify's own research describes PODTILE, auto-chaptering of transcripts averaging "about 16,000 tokens" [V, arXiv 2410.16148].
- **YouTube.** No official route to other people's captions (R10 §1.4). Scraping is red (R09 row 29).
- **Bottom line [I].** Platform transcripts are reading aids inside apps, not data. Treat them as unavailable to tools.

#### 3.3 Podcasting 2.0 tag adoption (Measurement C, part 2)

- **Podcast Index directly: not possible.** The Podcast Index API and the public dump host returned 403 to scripted access, and I had no API key. Instead I measured feeds directly and used one independent nightly tracker.

| Measure | Value | Evidence |
|---|---|---|
| Apple US top-200 (198 parseable feeds): feeds declaring the `podcast` namespace | 120 (61%) | [V] |
| … feeds with ≥1 `<podcast:transcript>` | 28 (14.1%); 17,742 of 124,584 items (14.2%); 495 of the latest 3,666 items (13.5%) | [V] |
| … transcript MIME types used | text/vtt 26 feeds, text/plain 16, application/srt 13, application/x-subrip 8, text/html 8, application/json 7 | [V] |
| … hosts serving transcript-tagged feeds | Omny 13, Buzzsprout 8, Flightcast 4, Spreaker, Transistor, Audioboom 1 each. Megaphone (50 of the top 200) and Simplecast (37) had none | [V] |
| … feeds with `<podcast:chapters>` | 5 (2.5%); 302 items (0.2%) | [V] |
| Curated high-signal set (54 feeds) | Transcript tag 11 (20.4%); chapters 7 (13.0%); namespace 38 (70%) | [V] |
| Whole ecosystem (independent tracker, "updated nightly") | 7,200,384 episodes with transcripts; 64,258 podcasts and 1,571,030 episodes with chapters; 4,742,182 "discovered valid podcasts"; 166,806,600 episodes | [S] Podcast Industry Insights (Daniel J. Lewis) |
| Implied shares | Transcripts ≈ 4.3% of episodes; chapters ≈ 0.94% of episodes and 1.4% of podcasts | [I] |

#### 3.4 Podcast tools (free tiers first)

| Tool | What it gives | Price (October 2026) | Evidence |
|---|---|---|---|
| **Snipd** | Transcripts with speakers, AI chapters, "mentioned books", snips; export to Readwise, Notion, Obsidian, Markdown | Free: AI features on 2 episodes/week. Premium $6.99/month: unlimited AI on "1M+ processed episodes", 900 min/month of uploads | [V] |
| **Listen Notes API** | Search and metadata; transcripts on PRO | Free 150 requests/month. PRO $200 base with 5,000 requests, then $1.60 to $1.10 per 1,000. Enterprise by contract (with "flexible server-side caching policy"). Index: 3,823,503 podcasts, 195,632,248 episodes | [V] |
| **Podscan** | Monitoring firehose with transcripts | $100, $200 or $2,500 per month; overage $5 per 1,000; "73,327,965+ indexed episodes … millions with full transcripts" | [V] |
| **Podcast Index API** | Free with key (R10) | Free | Not reachable here |
| **Audiobookshelf** | Self-hosted RSS downloader (R10) | Free | R10 |

### 4. Transcription and chaptering for lectures (Deliverable 4)

#### 4.1 Local ASR trial (Measurement D)

**Setup [V].**

- **Hardware:** a cloud VM with 4 vCPUs (Intel Xeon at 2.1 GHz, AVX-512), 15 GB RAM and no GPU. Other agents' jobs shared the machine; load average ran from about 3 (OCW runs) to 15 (CCC run). Times are therefore pessimistic.
- **Software:**
  - faster-whisper 1.2.1 (CTranslate2 4.8.3), int8, `beam_size=1`, Silero VAD. I loaded audio with numpy because PyAV 19 broke faster-whisper's decoder call; that is worth knowing.
  - onnx-asr 0.12.0 (onnxruntime 1.31) with Silero VAD and int8 weights.
- **Audio:**
  - Main trial: MIT 6.041SC Lecture 1 (Tsitsiklis, "Probability Models and Axioms"), 3,070 s, from OCW's own archive.org MP4. CC BY-NC-SA 4.0.
  - Reference: OCW's WebVTT captions, 7,732 words after normalisation.
- **Normalisation:** lower-case, strip punctuation, number words to digits, okay→ok, and drop fillers, close to the Whisper normaliser.

**Results.**

| Model (local) | Size | Decode time | Real-time factor | Speed | WER vs OCW captions | S / D / I | Notes |
|---|---|---|---|---|---|---|---|
| **Whisper large-v3-turbo**, int8, greedy | 0.8B | 1,171 s | 0.38 | 2.6× real time | **2.24%** | 65 / 44 / 64 | Clean-verbatim style matches OCW's. Errors: "disjoint"→"disjoined" (8×), "one half"→"half", course numbers "6.041/6.431" garbled, "Tsitsiklis"→"Ciciclis" |
| **NVIDIA Parakeet-TDT-0.6B-v2**, int8 ONNX | 0.6B | 436 s | 0.14 | 7.0× real time | **4.09%** (4.77% before number and "okay" normalisation) | 110 / 35 / 171 | Insertions are mostly true verbatim repetitions that OCW's captions remove. Writes numbers as words ("sixteen"). "Tsitsiklis"→"Citikles"; "OpenCourseWare"→"courseware" |
| Second trial: Parakeet-TDT-0.6B-v2 on 37C3 "Fuzzing the TCP/IP stack" (CC BY 4.0, 2,379 s, human SRT reference, 6,518 words) | 0.6B | 1,031 s (machine load average 10–15) | 0.43 (contended) | 2.3× real time | **8.68%** | 211 / 160 / 195 | Code identifiers dominate: "picoTCP"→"pico TCP" (13×), "smoltcp"→"small TCP", "SYN"→"sin", "queues"→"cues", plus "going to"→"gonna". A Whisper-turbo run on this talk was stopped unfinished because of CPU contention |

**Caveats [I].**

1. OCW captions are clean verbatim. WER against them penalises verbatim models (Parakeet) and flatters models that also drop disfluencies (Whisper).
2. OCW lectures have been on YouTube with captions since about 2008–2013, so they may sit in Whisper's training data [~50%]. That would make Whisper's 2.24% optimistic.
3. Each trial is n = 1. Treat the OCW numbers as "a few percent", not as a ranking.

#### 4.2 ASR options, local versus API (Deliverable 4 table)

Leaderboard numbers are from the Open ASR Leaderboard result CSVs (version "15-10-2026") [V].

- **"8-set mean"** is my recomputation over the 8 public English sets every listed model reports: AMI, Earnings22, GigaSpeech, LibriSpeech clean and other, SPGISpeech, Voice Arena Monsoon and VoxPopuli.
- **"CSV avg"** is shown in brackets. It is *not* like-for-like: it includes URGENT2024 and, for some models, private test sets. Whisper large-v3's CSV avg is 7.84 against an 8-set mean of 5.78; Phi-4-multimodal, which lacks those sets, has 5.02 on both.
- **TED-LIUM** is the long-form set (alongside earnings21 and earnings22).
- **RTFx** is the leaderboard's measured inverse real-time factor on its datacentre GPU.

| Option | Licence | Short-form WER: 8-set mean (CSV avg) | Long-form TED-LIUM WER (lecture proxy) | Leaderboard RTFx (GPU, short/long) | My CPU trial | Cost per 1,000 audio hours |
|---|---|---|---|---|---|---|
| Whisper large-v3 | Apache-2.0 | 5.78 (7.84) | 3.15 | 471 / 69 | — | Local GPU: electricity only [I] |
| Whisper large-v3-turbo | MIT | 6.36 (8.39) | 3.23 | 811 / 148 | 2.24% WER, 2.6× real time on 4 vCPU | About 380 CPU-hours on 4 vCPU; ≈$57–76 at $0.15–0.20/h [I] |
| distil-large-v3.5 | MIT | 5.40 (7.02) | 4.50 | 898 / 156 | — | — |
| Parakeet-TDT-0.6B-v2 | CC BY 4.0 | 4.70 (6.43) | 3.07 | 6,148 / 956 | 4.09% WER, 7.0× real time on 4 vCPU | About 140 CPU-hours; ≈$21–28 at $0.15–0.20/h [I] |
| Parakeet-TDT-0.6B-v3 (multilingual) | CC BY 4.0 | 4.84 (6.51) | 2.77 | 6,228 / 1,003 | — | — |
| Canary-Qwen-2.5B | CC BY 4.0 | 4.43 (6.37) | 2.57 | 882 / 16 | — | — |
| Cohere Transcribe (03-2026) | Apache-2.0 | 4.67 (6.26) | 2.23 | 924 / 418 | — | — |
| Qwen3-ASR-1.7B | Apache-2.0 | **4.31** (5.75), best open | — | 836 | — | — |
| IBM granite-speech-3.3-8b | Apache-2.0 | 5.26 (5.26) | — | 263 | — | — |
| Phi-4-multimodal-instruct | MIT | 5.02 (5.02) | — | 163 | — | — |
| API: OpenAI gpt-transcribe | Proprietary | 4.57 (6.38) | — | — | — | $270 at $0.0045/min (R10) |
| API: ElevenLabs Scribe v2 | Proprietary | 3.97 (5.37) | **2.12**, best long-form | — | — | Not checked |
| API: OtterAI speech-v3.1 | Proprietary | **3.36** (3.88), best short-form | — | — | — | Not checked |
| API: AssemblyAI | Proprietary | Universal-3.5 Pro 4.34 (5.80) | Universal-3 Pro 2.32 | — | — | Not checked |

**Local cost per 1,000 hours [I, from the measured and leaderboard RTFs].**

- **CPU VM (measured):** Parakeet about 140 instance-hours and Whisper turbo about 380.
- **Consumer GPU** (e.g. RTX 4090, assumed 30–50% of leaderboard GPU throughput): Whisper turbo long-form at about 50–75× real time takes 13–20 GPU-hours, about 6–9 kWh at 450 W, or **≈$2–4 of electricity** at $0.40/kWh. Parakeet at several hundred × real time takes 2–4 hours and costs under $1.
- **Apple Silicon** (whisper.cpp or MLX ports of Whisper and Parakeet): not measured here. Expect tens of times real time on M-series Pro/Max chips [K, low]. Measure before relying on it.
- **APIs:** $180–360 per 1,000 hours (R10).
- **Bottom line:** local is 10–100× cheaper and keeps audio private.

#### 4.3 Spoken maths and code

- **What the trial showed [V].**
  - Neither model emits LaTeX or symbols: there were 0 instances of ∩, ∪ or "P(" in either output. Spoken notation comes out as words: "p of A" (6×), "omega" (6×), "union" (22–24×), "intersection" (6×), and "one half" (Parakeet) or "half" (Whisper).
  - Course numbers and proper nouns are the main errors.
  - OCW's own captions write maths in words too.
- **Practical recipe [I].**
  1. Let ASR produce words.
  2. Recover notation by aligning to the slide text, which has the symbols. OCW slides have them, although pdftotext garbles some glyphs, as in "P(A ∩ B)".
  3. Optionally ask an LLM to rewrite a transcript window into LaTeX *given the matched slide*.
- **Code-heavy talks.** Use the slide or screen OCR as the source of truth for identifiers.
- **Bias prompts.** faster-whisper's `initial_prompt` (or hotwords) seeded with the course glossary, taken from slide vocabulary, is the cheapest fix for names like "Tsitsiklis" [K].

#### 4.4 Aligning slide OCR to speech

- **Measured: how much the slides hold [V].**
  - Six 6.041SC lectures: transcripts 42,346 words, slides 2,991 words (7.1%).
  - 75% of slide content-word types are spoken.
  - Only 32% of spoken content tokens have their type on a slide.
- **Interpretation [I].**
  - Slides are a sparse, symbol-dense skeleton and speech carries most of the words.
  - Slide text is therefore a good *anchor* for alignment: almost every slide is talked through.
  - It is a poor *substitute* for the lecture.
- **Method sketch [I].**
  1. Detect slide changes from video frames (frame differencing) or take slide PDFs.
  2. OCR the frames, or use the PDF text.
  3. Embed each slide and each 30-second transcript window.
  4. Run monotonic dynamic time warping (DTW) over the similarity matrix. Lectures rarely go backwards.
  5. Emit `(slide_no, t_start, t_end)`.
- **Validation:** where both slides and transcripts exist (OCW, CS50, CCC slides PDFs), check the alignment by hand on a few lectures.

#### 4.5 Automatic chaptering

| Approach | Evidence | Fit for lectures |
|---|---|---|
| Owner chapters | 84 of 6,506 OCW videos (1.3%) [V]; 2.5% of top podcast feeds [V] | Gold where present; rare |
| YouTube auto-chapters | Exists for some videos [K]. Not retrievable under R09/R10 rules | Not usable as data |
| VidChapters-7M benchmark | 817K user-chaptered videos, 7M chapters, scraped from YouTube descriptions [V, arXiv 2309.13952] | The standard benchmark; creator chapters as labels |
| Chapter-Llama (2025) | LLM over timestamped transcripts plus selected frame captions: "45.3 vs 26.7 F1" over prior state of the art on VidChapters-7M; one forward pass for hour-long videos [V, arXiv 2504.00072] | Transcript-first works |
| ARC-Chapter (2025-11) | Trained on "over million-level long video chapters", bilingual and hierarchical; +14.0% F1 and +11.3% SODA over the previous best; new GRACE metric [V, arXiv 2511.14349] | Hierarchical chapters suit lectures |
| CausalChapter (2026-09) | Targets "content-dense lecture videos with long transcripts, smooth topic transitions" with segment-then-caption [V, arXiv 2609.08686] | Directly on target |
| Audio-only and LALM chaptering | AudioSeg beats text-based models on YTSeg; pauses give the largest acoustic gain [V, arXiv 2602.08979]. AudioChaps-R1 +49 F1 over Audio-Flamingo-3-Think [V, arXiv 2608.16539] | Useful when transcripts are poor |
| Podcasts | PODTILE (Spotify): +11% ROUGE; chapter titles improve sparse retrieval [V, arXiv 2410.16148] | Same pipeline for podcasts |

**Practical choice [I].**

1. Segment with an LLM over the timestamped transcript plus slide boundaries.
2. Use a cheap model (Claude Haiku 5.5 batch) at roughly 10k tokens in and 500 out per lecture.
3. For all 6,173 OCW lecture videos that is about 6,173 × (10,000 × $0.05 + 500 × $0.25) / 10⁶ ≈ **$4**. On Sonnet 5.5 batch it is about $77. Prices are from `pricing-reference.md`.

### 5. Learning evidence (not repeating R11 §2.5)

| Question | Evidence | Strength |
|---|---|---|
| **Video versus no video** | Noetel et al. 2021 (*Review of Educational Research*; 105 RCTs; 7,776 students): replacing teaching with video gives g = 0.28; supplementing with video gives g = 0.80. The authors note possible publication bias, and a preprint critique exists [S] | Moderate |
| **Playback speed** | Murphy, Hoover, Agadzhanyan, Kuehn & Castel 2022, *Appl. Cogn. Psychol.* 36, doi:10.1002/acp.3899 [V full text]. Experiment 1 (n = 231 UCLA undergraduates): immediate comprehension .65/.60/.62/.55 at 1×/1.5×/2×/2.5×; one-week delayed .59/.54/.53/.50. Main effect F(3,202) = 3.98, p = .009, η² = .06; only 1× > 2.5× (p_bonf = .004, d = .24). Watching twice at 2× helped only when the second viewing came just before the test. 85% of 123 surveyed students watch faster than normal; 91% believed slower was better for learning. Authors caution that results may differ "for videos with different speech rates, complexity or difficulty" | Moderate; short, non-technical videos |
| **Segmenting** | Rey et al. 2019, "A Meta-analysis of the Segmenting Effect", *Educational Psychology Review* (doi 10.1007/s10648-018-9456-4; title and authors verified via Crossref [V]). Small-to-moderate benefits for retention and transfer, with longer learning time [K; effect sizes not re-verified] | Moderate |
| **Interactive and searchable transcripts** | I found no strong RCT evidence in this pass [I]. Design rationale: search plus jump-to-time turns a lecture into a skimmable text, which is the inspectional-reading mode in R11 | Weak; a gap |
| **Slides and notes versus speech** | Measured above: slides hold about 7% of the words. The written notes for 6.041 are the textbook itself (B&T), cited section by section on every slide deck [V] | Measurement, n = 6 |

**Implications [I].**

- 1.5–2× playback is a reasonable default for lectures.
- The bigger win is *skipping*: a chapter index plus a searchable transcript lets a reader pick 12 minutes out of 80.
- Interleaving lecture segments with the matching textbook sections (the "supplementing" condition) is where video does best.

### 6. Indexing talks as chapters: data model and pipeline (Deliverable 5)

#### 6.1 Extension to R10's unified work record

```jsonc
{
  "work_id": "osw_01K…",
  "kind": "lecture",                       // lecture | course | talk | episode (R10 kinds)
  "title": "Lecture 1: Probability Models and Axioms",
  "part_of": {"work_id": "osw_course_6041sc", "position": 1},   // course or series membership
  "creators": [{"name": "John Tsitsiklis", "role": "lecturer", "ids": {"wikidata": null}}],
  "ids": {"ocw_uid": "…", "youtube": "j9WZyLZCBzs", "ia": "MIT6.041F10",
          "doi": null, "ccc_guid": null, "slideslive": null, "acl": null, "pirsa": null},
  "media": [{"role": "video", "url": "https://archive.org/download/MIT6.041F10/MIT6_041F11_lec01_300k.mp4",
             "duration_s": 3070, "licence": "CC-BY-NC-SA-4.0", "licence_source": "ocw data.json", "checked_at": "2026-10-15"}],
  "rights": {                                // per component: they differ (TED: transcript ≠ video terms)
    "video": "CC-BY-NC-SA-4.0", "transcript": "CC-BY-NC-SA-4.0", "slides": "CC-BY-NC-SA-4.0",
    "derived_index_publishable": true, "commercial_ok": false},
  "transcript": {"source": "owner_vtt|owner_pdf|c3subtitles_final|asr",
                 "asr_model": null, "wer_est": 0.022, "wer_basis": "vs owner captions",
                 "ref": "s3://…/j9WZyLZCBzs.vtt", "style": "clean_verbatim"},
  "slides": {"ref": "…/MIT6_041SCF13_L01.pdf", "pages": 4, "alignment": [{"slide": 1, "t0": 0, "t1": 410}]},
  "segments": [{
      "seg_id": "j9WZ…#0410-1185",
      "t0": 410.0, "t1": 1185.0,
      "title": "Sample spaces and the axioms",
      "title_source": "owner|llm:claude-haiku-5-5@v3|youtube_auto",
      "summary_ref": "…", "level": "intro",
      "entities": [{"wikidata": "Q…", "label": "probability axioms"}],
      "links": [{"target": "osw_book_bt2008", "locator": {"section": "1.2"},
                 "method": "explicit_reading|citation|entity|embedding",
                 "score": 0.91, "evidence": "slide 1: 'Readings: Sections 1.1, 1.2'"}],
      "deep_links": {"youtube": "https://youtu.be/j9WZyLZCBzs?t=410",
                     "mp4": "…lec01_300k.mp4#t=410,1185",
                     "page": "https://ocw.mit.edu/courses/…/resources/lecture-1-video/"}
  }],
  "provenance": {"segments": "llm@2026-10-15", "links": "embedder voyage-4-lite + rules v1"}
}
```

**Design rules [I].**

1. Store **rights per component**: video, transcript, slides, and derived index.
2. Use the segment as the unit of retrieval and linking.
3. Keep owner chapters and LLM chapters apart (`title_source`).
4. Keep the WER estimate and transcript style with the transcript.
5. Always store a deep link that a user can click without the tool, so the tool never needs to re-serve the media.

#### 6.2 Deep-link formats

| Host | Format | Evidence |
|---|---|---|
| YouTube | `https://youtu.be/<id>?t=<seconds>` or `watch?v=<id>&t=1h2m3s` | [K, high] |
| Direct MP4 or MP3 (OCW via IA, ACL, CCC CDN, TIB) | W3C Media Fragments `#t=start,end`, honoured by browsers' native players | [K, high] |
| media.ccc.de | `https://media.ccc.de/v/<slug>#t=<s>` or `?t=1h2m3s` (player parses `t` from query or hash) | [V, player JS] |
| OCW | Resource page URL. No timestamp parameter on OCW pages, so deep-link to YouTube or the IA MP4 instead | [V pages; I] |
| SlidesLive (NeurIPS/ICML/ICLR) | `slideslive.com/<id>`; timestamp parameter not verified | [V id; timestamp unknown] |
| PIRSA | `pirsa.org/<id>` or DOI `10.48660/<id>`; timestamp unknown (site 403) | [V DOI] |
| Apple Podcasts | Episode links with timestamps "appear in line with your transcript" when creators include them | [V] |

#### 6.3 Linking segments to papers and textbook sections

1. **Explicit references first [V/I].** Slide "Readings:" lines (6 of 6 in 6.041SC), syllabus reading lists, CS336's per-lecture paper lists, and talk ↔ paper pairs (ACL video ↔ Anthology paper; NeurIPS oral ↔ OpenReview) are high-precision links.
2. **Spoken citations.** Regex and LLM extraction of "as in the Vaswani paper", "Section 4.2". Resolve them with OpenAlex or Semantic Scholar (R10).
3. **Entities.** Wikidata or OpenAlex topics on segments and on book sections. A Jaccard-type prior.
4. **Embeddings.** Embed segment transcripts and book sections with the same model, and use reciprocal nearest neighbours with a threshold. Use (1) as labelled data to calibrate the thresholds: 6.041SC alone gives 25 lectures × about 2 sections.
5. **Human-in-the-loop.** Show the evidence string with each link.

**Costs [I].** Embedding all OCW lecture transcripts (about 4,500 h × 9,000 words/h ≈ 55M tokens) costs about $1 at $0.02/MTok (R10 prices).

#### 6.4 Existing projects

- **VidChapters / Chapter-Llama / ARC-Chapter:** chaptering models [V].
- **Snipd:** chapters plus "mentioned books" for podcasts [V].
- **Spotify PODTILE** [V].
- **TIB AV-Portal:** DOIs and automatic indexing of scientific video. Its automatic analysis features were not re-checked [K].
- **media.ccc.de API** [V]. **PyVideo** [V].
- **MIT Learn:** a unified search over OCW, MITx, podcasts and videos, with 10,000+ resources and facets [V].
- No project I found links lecture segments to textbook sections at scale [I, ~75%].

#### 6.5 Citation and DOIs for talks

- **DOIs (DataCite "Audiovisual"):** TIB AV-Portal (10.5446), PIRSA (10.48660), Zenodo [V].
- **Other stable identifiers:** ACL uses Anthology IDs plus MP4; OCW uses course URL plus resource UUID; CCC uses GUID.
- **Citation template [I]:** Lecturer (Year). *Title* [Video lecture, mm:ss–mm:ss]. Series. Publisher. DOI or URL. Licence.

**Pipeline sketch (plugs into R10's adapters → normaliser → enrichment → index) [I].**

```
harvest  ─┬─ OCW: MIT Learn API (courses, videos) + per-resource data.json (transcript, captions, IA MP4, licence)
          ├─ CCC: GraphQL items{subtitles, duration, conference} + REST recordings (mp3, srt)
          ├─ ACL: Anthology XML <video href> + paper metadata
          ├─ SEE / OYC / CS50: per-course page adapters (transcripts, MP4)
          ├─ Podcasts: RSS (enclosure, podcast:transcript, podcast:chapters) + owner-page transcript adapters
          └─ DOIs: DataCite prefixes 10.5446, 10.48660; Zenodo type=video
transcript ─ owner text ▸ final human subtitles ▸ local ASR (Parakeet CPU / Whisper turbo GPU), with WER spot-check
align     ─ slide PDFs or frame-OCR ⟷ transcript windows (monotonic DTW on embeddings)
segment   ─ LLM chaptering over timestamped transcript + slide boundaries (Haiku batch ≈ $0.0006/lecture)
link      ─ explicit readings ▸ spoken citations ▸ entities ▸ embeddings → book sections / papers (R10 records)
index     ─ segments as first-class rows; deep links; per-component rights; MCP tool "find segment for §X"
```

### 7. Legal points not already in R09 (Deliverable 6)

R09 sets the framework: fair use, the CC NC/ND analysis in §7, linking in §8, and the YouTube rows in row 29.

1. **Does OCW's CC BY-NC-SA cover transcripts and video? Yes, per file** [V].
   - Each video's `data.json` carries `"license": "https://creativecommons.org/licenses/by-nc-sa/4.0/"`, and transcripts and captions are OCW-hosted resources of the same course.
   - Exceptions are third-party materials credited on the page [K].
   - The 2026-08-11 terms add an AI-training clause: attribution, non-commercial models only, and ShareAlike on derived models [V].
2. **TED.** CC BY-NC-ND 4.0, the TED player is required, and transcripts are TED copyright and may not be edited [V].
   - A private, personal index is fine [I].
   - Publishing LLM summaries of TED transcripts is an adaptation; ND forbids sharing adaptations [I, high; R09 row 8].
3. **Downloading CC-licensed videos versus platform terms.**
   - The YouTube ToS (effective 2023-12-15) bars "access, reproduce, download … any part of the Service or any Content except … as expressly authorized by the Service" [V].
   - A CC licence from the *creator* does not lift YouTube's *contract* [I, high]. Fetch the same work from the licensor's own host instead: OCW via archive.org, CCC CDN, ACL, SEE, CS50 MP4s.
   - yt-dlp on YouTube is a ToS breach regardless of the CC licence [I; R09 row 29].
4. **Transcribing podcasts from RSS enclosures for personal use.**
   - RSS enclosures are offered for download. Private transcription for personal study is a strong fair-use case: non-commercial, transformative search use, no market substitution [I, ~80%].
   - Republishing full transcripts is not.
   - Note Apple's 200-word copy limit as a norm signal [V].
5. **Publishing derived chapter indexes and summaries.**
   - Timestamps, titles you write yourself and links are facts or your own expression, so green [I].
   - Short idea-level segment descriptions for CC BY or BY-SA works are green. For BY-NC works they are green only non-commercially. For ND works and all-rights-reserved talks, keep descriptions short and original (R09 rows 7–11).

| # | Tool behaviour | Rating | Why | Mitigation / safer variant | Non-US note |
|---|---|---|---|---|---|
| R13-1 | Download OCW lecture MP4s (from archive.org), transcripts and slides; index and summarise them for personal use | **Green** | CC BY-NC-SA 4.0 per file; OCW-hosted [V] | Attribute; keep non-commercial | Same licence worldwide |
| R13-2 | Publish a free lecture↔chapter index with LLM segment summaries of OCW lectures | **Green/yellow** | An adaptation under BY-NC-SA: allowed non-commercially, must be ShareAlike [V][I] | License the index CC BY-NC-SA; attribute MIT and the lecturer | Same |
| R13-3 | Same, in a paid product | **Red** (without an MIT licence) | NC, plus OCW's AI clause bars commercial use [V] | Metadata and deep links only, or license from MIT | Same |
| R13-4 | Bulk-harvest media.ccc.de via its API and CDN; transcribe and index | **Green** (CC BY / BY-SA items) / **yellow** (NC-ND or unstated) | Licence is in the file; the API is public [V] | Read the licence from file metadata; skip or link-only for ND | Same |
| R13-5 | Re-host ACL Anthology talk videos with transcripts | **Green** (2016+ material, CC BY 4.0) | Anthology licence notice [V] | Attribute; link the paper | Same |
| R13-6 | Download CC-licensed YouTube lectures with yt-dlp | **Red** (contract) | YouTube ToS bars downloading not "expressly authorized" [V] | Get the same file from the licensor's own host; otherwise link with `?t=` | Same |
| R13-7 | Transcribe podcast RSS audio locally for a private, searchable library | **Green/yellow** | Lawful download for listening; private, non-expressive search use [I] | Keep private; show short snippets plus deep links | Private-copy rules vary in the EU [K] |
| R13-8 | Publish full transcripts of third-party podcasts | **Red** | Reproduction of the whole work [I] | Link to owner transcripts; quote ≤ a few sentences | Red |
| R13-9 | Scrape owner-published podcast transcripts from websites into a private index | **Yellow** | Facts and private use are fine; site ToS and robots may bind [I] | Respect robots.txt and rate limits; private use; prefer the RSS `<podcast:transcript>` where offered | EU database right unlikely for a single show [I] |
| R13-10 | Embed or summarise TED talks in a published reader | **Yellow** (summary) / **green** (embed with the TED player plus link) | ND and transcript-edit bar [V] | Embed only; write short original descriptions | Same |
| R13-11 | Mirror SlidesLive conference videos | **Red** | No licence; platform-hosted [V] | Deep-link the virtual-site page | Red |
| R13-12 | Cite and resolve talk DOIs (TIB, PIRSA, Zenodo) in a catalogue | **Green** | Metadata, mostly from DataCite [V] | — | Green |
| R13-13 | Use Gresham College transcripts and recordings in a free personal study tool | **Green/yellow** | Terms "positively encourage" educational use but bar use "for commercial, personal or institutional gain" ("personal gain" is ambiguous); not CC [V] | Keep it free and non-commercial; link back; don't republish whole transcripts | UK terms |

### 8. Hands-on measurements

#### A. Canonical sample of 60 items

- **Coding:** Y = yes; N = no; P = partial; ? = not checked. YouTube captions and chapters were not scraped (R09 red).
- **"Owner transcript"** is a transcript on the owner's site or in the owner's feed.
- **"Chapters"** means owner-published chapters or timestamps on the owner page or feed.
- **"Bulk download permitted"** means the owner provides downloadable files under terms that allow saving them. YouTube-only is N.

| # | Item | Paired book (R01 §9) | Free | Licence | Owner transcript | Captions (lectures/talks) or RSS transcript tag (podcasts) | Chapters | Slides | Stable URL/DOI | Bulk download permitted | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | MIT OCW 6.041SC Probabilistic Systems Analysis (Tsitsiklis, F2013) | Bertsekas & Tsitsiklis (R01 #8) | Y | CC BY-NC-SA 4.0 | Y | Y | N | Y | Y | Y | V: data.json, slides PDF, IA MP4 |
| C2 | MIT OCW 18.06 Linear Algebra (Strang, S2010) | Strang, Intro to Linear Algebra (not free) | Y | CC BY-NC-SA 4.0 | Y | Y | N | N | Y | Y | V: data.json sample (3/3 transcripts, IA MP4) |
| C3 | MIT OCW 6.006 Introduction to Algorithms (S2020) | CLRS (R01 #53) | Y | CC BY-NC-SA 4.0 | Y | Y | N | Y | Y | Y | V |
| C4 | MIT OCW 6.034 Artificial Intelligence (Winston, F2010) | Russell & Norvig (R01 #16) | Y | CC BY-NC-SA 4.0 | Y | Y | N | P | Y | Y | V |
| C5 | MIT OCW 18.650 Statistics for Applications (F2016) | Wasserman / Casella & Berger (R01 #3, #4) | Y | CC BY-NC-SA 4.0 | Y | Y | N | Y | Y | Y | V |
| C6 | MIT OCW 6.0001 Intro to CS and Programming in Python (F2016) | Guttag (not free) | Y | CC BY-NC-SA 4.0 | Y | Y | N | Y | Y | Y | V |
| C7 | MIT OCW 8.04 Quantum Physics I (Adams, S2013) | Feynman Lectures Vol. III (free HTML) | Y | CC BY-NC-SA 4.0 | Y | Y | N | N | Y | Y | V |
| C8 | MIT OCW 18.065 Matrix Methods in Data Analysis and ML (Strang, S2018) | Strang, Linear Algebra and Learning from Data | Y | CC BY-NC-SA 4.0 | Y | Y | N | P | Y | Y | V |
| C9 | MIT OCW 6.S897 Machine Learning for Healthcare (S2019) | — | Y | CC BY-NC-SA 4.0 | Y | Y | N | Y | Y | Y | V |
| C10 | MIT OCW 18.S096 Matrix Calculus for ML and Beyond (IAP 2023) | course notes (arXiv) | Y | CC BY-NC-SA 4.0 | Y | Y | N | Y | Y | P | V: transcripts 3/3; no IA MP4 in sample |
| C11 | MIT OCW RES.18-005 Highlights of Calculus (Strang) | Strang, Calculus (free on OCW) | Y | CC BY-NC-SA 4.0 | Y | Y | N | N | Y | Y | V |
| C12 | MIT Missing Semester (IAP 2026) | Thomas & Hunt, Pragmatic Programmer (R01 #51) | Y | CC BY-NC-SA | P | ? | ? | Y | Y | N | V licence; videos on YouTube; notes not verbatim |
| C13 | MIT 6.S191 Introduction to Deep Learning | Goodfellow et al. (R01 #14) | Y | MIT licence (materials) | N | ? | ? | Y | Y | N | V licence statement; videos on YouTube |
| C14 | Stanford SEE CS229 Machine Learning (Ng, 2008) | ESL / PRML (R01 #11, #10) | Y | Creative Commons (SEE) | Y | ? | N | Y | Y | Y | V: 'Transcripts HTML PDF' + download links |
| C15 | Stanford SEE EE364A Convex Optimization I (Boyd) | Boyd & Vandenberghe (free PDF) | Y | Creative Commons (SEE) | Y | ? | N | Y | Y | Y | V |
| C16 | Stanford CS229 (Ng, Autumn 2018, YouTube) | ESL / PRML | Y | YouTube standard | N | ? | ? | Y | Y | N | K |
| C17 | Stanford CS224N NLP with Deep Learning (2024 playlist) | Jurafsky & Martin SLP3 (free draft) | Y | YouTube standard | N | ? | ? | Y | Y | N | V: course page names 2024 playlist |
| C18 | Stanford CS336 Language Modeling from Scratch (Spring 2026) | — (papers) | Y | YouTube standard | N | ? | ? | Y | Y | N | V: 'Recordings: YouTube playlist' |
| C19 | Stanford CS231n (2017, YouTube) | Prince, UDL (R01 #18) | Y | YouTube standard | N | ? | ? | Y | Y | N | K |
| C20 | Stanford StatLearning (Hastie & Tibshirani) | ISL (R01 #12) | Y | YouTube standard | N | ? | ? | Y | Y | N | K |
| C21 | Harvard Stat 110 Probability (Blitzstein) | Blitzstein & Hwang (R01 #2) | Y | YouTube standard | N | ? | ? | Y | Y | N | K (stat110 site 403) |
| C22 | Harvard CS50x 2026 | — | Y | CC BY-NC-SA 4.0 | Y | Y | ? | Y | Y | Y | V: subtitles, transcripts, MP4 per week |
| C23 | Yale OYC ECON 159 Game Theory (Polak) | Osborne & Rubinstein (R01 #25) | Y | CC BY-NC-SA 3.0 | Y | ? | N | N | Y | P | V licence + 'video, audio, and text transcript formats' |
| C24 | Yale OYC PHIL 176 Death (Kagan) | Parfit, Reasons and Persons (R01 #30) | Y | CC BY-NC-SA 3.0 | Y | ? | N | N | Y | P | V (site-level) |
| C25 | Yale OYC ECON 252 Financial Markets (Shiller, 2011) | — | Y | CC BY-NC-SA 3.0 | Y | ? | N | N | Y | P | V (site-level) |
| C26 | UC Berkeley CS 61A webcasts (Internet Archive mirror) | Abelson & Sussman, SICP (R01 #47) | Y | CC BY-NC-ND 3.0 | N | N | N | ? | Y | Y | V: IA collection (417 '61A' items) |
| C27 | CMU 15-445/645 Intro to Database Systems (Pavlo, F2024) | Kleppmann, DDIA (R01 #49) | Y | not stated | N | ? | ? | Y | Y | N | V schedule: slides, notes, video links |
| C28 | UCL/DeepMind RL course (Silver, 2015) | Sutton & Barto (R01 #15) | Y | slides CC BY-NC 4.0; videos YouTube | N | ? | ? | Y | Y | N | V |
| C29 | Cambridge ITPRNN lectures (MacKay, 2012) | MacKay, ITILA (R01 #17) | Y | not stated | N | N | N | Y | Y | Y | V: download links |
| C30 | Aalto BDA course (Vehtari) | Gelman et al., BDA3 (R01 #5) | Y | CC BY-NC 4.0 (text and videos) | N | ? | ? | Y | Y | Y | V licence |
| C31 | Statistical Rethinking lectures (McElreath) | McElreath (R01 #6; book not free) | Y | YouTube standard | N | ? | ? | Y | Y | N | K |
| C32 | Neural Networks: Zero to Hero (Karpathy) | Goodfellow / UDL | Y | YouTube standard | N | ? | ? | P | Y | N | K |
| C33 | fast.ai Practical Deep Learning | Howard & Gugger, fastbook | Y | YouTube standard | N | ? | ? | P | Y | N | V page; K licence |
| C34 | 3Blue1Brown Essence of Linear Algebra | linear-algebra texts | Y | YouTube standard | P | ? | ? | N | Y | N | K (captions repo; GitHub not reachable here) |
| C35 | NPTEL Deep Learning (IIT Ropar, 106106184) | Goodfellow (R01 #14) | Y | CC BY-NC-SA (site footer) | P | ? | N | ? | Y | P | V site-level; course page JS-rendered |
| C36 | NPTEL Introduction to Machine Learning (IIT Madras) | ISL / ESL | Y | CC BY-NC-SA (site footer) | P | ? | N | ? | Y | P | V site-level |
| C37 | Khan Academy Statistics and Probability | OpenStax Introductory Statistics | Y | CC BY-NC-SA 4.0 | P | ? | N | N | Y | N | V licence; K transcripts |
| C38 | Gresham College lectures (any professorship series) | — | Y | Educational use encouraged; no commercial use; not CC | Y | ? | N | P | Y | P | V terms (WebFetch); S downloads |
| C39 | MLSS 2020 (virtual Tübingen) | Murphy, PML (R01 #13) | Y | YouTube standard | N | ? | ? | Y | Y | N | K |
| C40 | Simons Institute boot camp talks (Fall 2026) | — | Y | All rights reserved (footer) | N | ? | ? | P | Y | N | V footer |
| T1 | NeurIPS 2024 oral 'Human Expertise in Algorithmic Prediction' (SlidesLive 39031482) | — | Y | not stated | N | ? | N | Y | Y | N | V page served anonymously; playback not tested |
| T2 | ICML 2026 oral 'dnaHNet' (SlidesLive 39083541) | — | Y | not stated | N | ? | N | Y | Y | N | V |
| T3 | ICLR 2025 oral 31916 (SlidesLive embed) | — | Y | not stated | N | ? | N | Y | Y | N | V |
| T4 | ACL 2023 long paper 1 video (aclanthology.org/2023.acl-long.1.mp4) | — | Y | CC BY 4.0 (Anthology materials 2016+) | N | N | N | N | Y | Y | V: HTTP 200 video/mp4 |
| T5 | USENIX OSDI '24 DistServe | — | Y | 'free and open to everyone' (no licence) | N | ? | ? | Y | Y | P | V: slides PDF, video link |
| T6 | 37C3 'Fuzzing the TCP/IP stack' | — | Y | CC BY 4.0 (in file metadata) | Y | Y | N | ? | Y | Y | V: API, CDN, human SRT |
| T7 | FOSS4G 2019 OSGeo AGM (TIB AV-Portal) | — | Y | CC BY 3.0 DE | N | ? | N | ? | Y | P | V: DOI 10.5446/43541 |
| T8 | PIRSA 26090052 (Perimeter Institute) | — | Y | not checked (403) | N | ? | N | ? | Y | ? | V DataCite DOI 10.48660/26090052 |
| T9 | TED: Ken Robinson, 'Do schools kill creativity?' | — | Y | CC BY-NC-ND 4.0 | Y | Y | N | N | Y | N | V policy + transcript page 200 |
| T10 | EA Global London 2024: Rory Stewart on aid agencies | — | Y | YouTube standard | N | ? | ? | N | Y | N | V listed on EAG page |
| P1 | 80,000 Hours Podcast, latest episode (2026-10-14) | — | Y | all rights reserved (assumed) | Y | Y | Y | n/a | Y | P | V: RSS text/plain transcript + podcast:chapters |
| P2 | Dwarkesh Podcast: Si Sheppard (2026-10-01) | — | Y | not stated | Y | N | N | n/a | Y | P | V: transcript on Substack page |
| P3 | EconTalk: Jesús Fernández-Villaverde, fertility collapse | — | Y | not stated | Y | N | N | n/a | Y | P | V page |
| P4 | Conversations with Tyler: Liaquat Ahamed | — | Y | not stated | Y | N | N | n/a | Y | P | V page |
| P5 | Lex Fridman Podcast: Andrew Scull | — | Y | not stated | Y | N | N | n/a | Y | P | V transcript page (30,717 words) |
| P6 | The Gradient: Nathan Benaich (2026-01-22) | — | Y | not stated | Y | N | N | n/a | Y | P | V Substack |
| P7 | AXRP ep. 50: Eli Lifland on AI 2027 | — | Y | not stated | Y | N | N | n/a | Y | P | V axrp.net |
| P8 | Mindscape: AMA October 2026 | — | Y | not stated | Y | N | N | n/a | Y | P | V page |
| P9 | Clearer Thinking ep. 326: Garrison Lovely | — | Y | not stated | Y | N | N | n/a | Y | P | V; transcriptionists credited |
| P10 | Odd Lots: Jeff Yan on Hyperliquid | — | Y | not stated | P | Y | N | n/a | Y | P | V: Omny auto transcripts in RSS |

**Coverage (as in R01 §9) [V for rows marked V; others K/S].** A "+P" figure counts partial cases; "?" counts items not checked.

| Group | Free | Open licence | Owner transcript | Captions / RSS transcript | Owner chapters | Slides | Stable URL/DOI | Bulk download |
|---|---|---|---|---|---|---|---|---|
| Courses (n = 40) | 40 (100%) | 24 (60%) +1 P | 18 (45%) +5 P | 12 (30%); 26 ? | 0 (0%); 18 ? | 23 (58%) +6 P, 3 ? | 40 (100%) | 16 (40%) +7 P |
| Talks (n = 10) | 10 (100%) | 3 (30%) +2 P, 1 ? | 2 (20%) | 2 (20%); 7 ? | 0; 2 ? | 4 (40%); 3 ? | 10 (100%) | 2 (20%) +2 P, 1 ? |
| Podcasts (n = 10) | 10 (100%) | 0 | 9 (90%) +1 P | 2 (20%) in RSS | 1 (10%) | n/a | 10 (100%) | 0 (10 P: RSS for listening) |
| **All (n = 60)** | **60 (100%)** | **27 (45%)** +3 P | **29 (48%)** +6 P | 16 (27%); 33 ? | **1 (2%)**; 20 ? | 27/50 (54%) +6 P | 60 (100%) | **18 (30%)** +19 P |

**Reading the sample [I].**

- **Courses split cleanly into two worlds:**
  - Institutional open courseware (OCW, SEE, CS50, OYC, the Berkeley mirror, NPTEL, Khan): open licence and, usually, owner transcripts.
  - Instructor or department YouTube series (Stanford CS229/224N/336, Stat 110, CMU, Karpathy, McElreath): free but closed, with no owner transcript and no download right.
- **The best ML/AI lectures are mostly in the closed world.** This mirrors R01's finding that ML *books* are unusually open. ML *lectures* are less so.
- **Pairings with R01 §9 books.**
  - For 23 of the 40 courses the paired book is in R01 §9. For 8 of them (C1, C3, C4, C5, C12, C24, C27, C31) the paired R01 book is *not* free while the course is. The nine books are B&T, CLRS, AIMA, Wasserman, Casella & Berger, *The Pragmatic Programmer*, Parfit, DDIA and McElreath.
  - So lectures widen free coverage in exactly the categories R01 found weakest: probability and statistics, decision theory and software engineering.

#### B. MIT OCW counts (methods and numbers)

**Method.**

- MIT Learn search API: `platform=ocw&resource_type=course`, 26 pages × 100, with `aggregations=course_feature`. OCW's robots.txt is `Allow: /`.
- All 2,589 `/download/` pages.
- For courses with video, the "See all" list pages, then `data.json` for the first, middle and last video (984 records). Four threads with a 0.2–0.25 s pause each.

**Numbers [V].**

| Measure | Value |
|---|---|
| OCW courses | 2,589; sitemap index lists 2,589 course sitemaps |
| Course-feature tags | Lecture Notes 1,303; Problem Sets 842; Exams 459; **Lecture Videos 299**; Instructor Insights 273; Open Textbooks 53; Podcasts 40; Lecture Audio 16 |
| Any video or audio feature tag | 421 |
| Notes-tagged with no video/audio tag | 1,085 |
| Courses with downloadable video (download page) | 366, holding 8,514 video items |
| Courses with a Lecture Videos section | 247, holding 6,173 lecture videos (median 22) |
| … with ≥10 / ≥20 / ≥30 lecture videos | 177 / 140 / 49 |
| Video records sampled | 984: transcript PDF 77.5%, WebVTT 78.6%, IA MP4 78.0%, YouTube 100% |
| Lecture-video courses with transcripts on all sampled lectures | 196 of 247 (79%) |
| Courses with ≥10 lecture videos and transcripts | 163 |
| MIT Learn OCW video index | 6,506 videos, 4,546 h, 261 courses; 84 (1.3%) with ≥3 owner timestamp lines |
| Most recent record modification | 2026-10-14 |

#### C. media.ccc.de and Podcast Index

- **media.ccc.de:** §1.4 has the figures. Method: GraphQL `items(first:250, offset)` paged to 17,256 items, plus REST `/public/events/<guid>` for recordings [V]. Subtitle coverage by Congress edition:

| Edition | 17C3–29C3 | 30C3 | 31C3 | 32C3 | 33C3 | 34C3 | 35C3 | 36C3 | 37C3 | 38C3 | 39C3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Subtitled / talks | 1 of 1,017 | 133/135 | 134/136 | 148/151 | 144/147 | 162/165 | 168/169 | 220/269 | 138/140 | 135/222 | 110/180 |

- **Podcasts:** Podcast Index itself was not reachable (403; no key). I measured the feeds directly instead (§3.3).

#### D. Local ASR (addendum)

- §4.1 has the main OCW result.
- **Second trial: 37C3 "Fuzzing the TCP/IP stack"** (CC BY 4.0 in the MP3 metadata). Reference: final human English SRT from c3subtitles, credited to a JYU course assignment.
  - **Result:** Parakeet-TDT-0.6B-v2 (int8) WER **8.68%** (S 211, D 160, I 195; 6,518 reference words after stripping `*Applause*`-style cues), about twice the OCW figure.
  - **Error pattern [V]:** project and library names ("picoTCP", "smoltcp"), protocol jargon ("SYN") and casual contractions.
  - **Implication [I]:** for code-heavy talks, seed a glossary from the slides or code repository (hotwords or prompt), and treat identifiers in ASR output as untrusted.
  - **Speed:** under heavy contention (load average 10–15 on 4 vCPUs) it ran at 2.3× real time against 7.0× on the less loaded OCW run. Quote the OCW figure as the throughput estimate.
  - **Not completed:** a Whisper large-v3-turbo run on the same talk was stopped after about 8 minutes because the shared machine was saturated.

---

## Numbers that matter

| Value | Date | Source | Confidence |
|---|---|---|---|
| OCW courses: 2,589; with downloadable video: 366 (14.1%); with lecture-video section: 247 (9.5%); ≥10 lectures: 177 | 2026-10-15 | MIT Learn API; OCW download pages [1][3] | High (measured) |
| OCW lecture videos: 6,173 in lecture sections; 8,514 video items overall | 2026-10-15 | [3] | High |
| OCW video records with owner transcript PDF / WebVTT / IA MP4 | 77.5% / 78.6% / 78.0% (n = 984) | [4] | High (sampled) |
| OCW courses with ≥10 lecture videos and transcripts | 163 | [3][4] | High |
| MIT Learn OCW videos and hours | 6,506 videos; 4,546 h; 261 courses | [1] | High |
| OCW videos with owner timestamps (≥3 lines) | 84 (1.3%) | [1] | High |
| OCW terms: AI training non-commercial with attribution and ShareAlike | Updated 2026-08-11 | [5] | High |
| media.ccc.de items / hours / events | 17,256 / 11,771 h / 465 | [32] | High |
| media.ccc.de items with any subtitle / final original-language subtitle | 2,228 (12.9%) / 654 (≈525 h) | [32] | High |
| media.ccc.de items with TIB DOIs | 391 | [32][34] | High |
| TIB AV-Portal DOIs (10.5446) | 45,898 | [34] | High |
| PIRSA DOIs (10.48660) | 10,898 | [35] | High |
| Zenodo video / presentation records | 23,009 / 95,934 | [36] | High |
| IA Berkeley webcast mirror | 11,546 items (CC BY-NC-ND 3.0) | [7] | High |
| ACL Anthology papers with video | 15,790 of 128,493 (12.3%); 13,284 self-hosted MP4 | [30] | High |
| NPTEL courses / video hours | 3,483 listed / "more than 70000 hours … transcribed and subtitled" | [16] | High (count) / medium (claim) |
| PyVideo index | 21,748 videos from 542 events | [37] | High |
| Coursera audit replaced by first-module preview | 2025-08-08 | [41] | High |
| Coursera–Udemy merger closed | 2026-05-11 | [46] | Medium (secondary via SEC search) |
| Apple top-200 feeds with `<podcast:transcript>` / `<podcast:chapters>` | 14.1% / 2.5% | [49] | High (measured) |
| Episodes with transcript tags / chapters (ecosystem) | 7,200,384 / 1,571,030 of 166.8M | [50] | Medium (independent tracker) |
| Listen Notes API | Free 150 requests/month; PRO $200 incl. 5,000; 3.82M podcasts, 195.6M episodes | [52] | High |
| Snipd Premium | $6.99/month; free tier 2 AI episodes/week | [54] | High |
| Whisper large-v3-turbo vs OCW captions | 2.24% WER; 2.6× real time on 4 vCPU (int8) | This study | Medium (n = 1) |
| Parakeet-TDT-0.6B-v2 vs OCW captions | 4.09% WER; 7.0× real time on 4 vCPU (int8) | This study | Medium (n = 1) |
| Parakeet-TDT-0.6B-v2 vs human subtitles, code-heavy 37C3 talk | 8.68% WER | This study | Medium (n = 1) |
| Short-form WER, 8-set public mean: best open / OpenAI gpt-transcribe / best proprietary | Qwen3-ASR-1.7B 4.31 / 4.57 / OtterAI 3.36 (CSV `avg` not like-for-like) | [66] recomputed | High (data); medium (choice of sets) |
| TED-LIUM long-form WER: Whisper large-v3 / Parakeet v3 / Cohere / ElevenLabs | 3.15 / 2.77 / 2.23 / 2.12 | [66] | High |
| Slides vs speech words (6.041SC, 6 lectures) | 2,991 vs 42,346 (7.1%) | This study | Medium |
| Speed: comprehension at 1×/1.5×/2×/2.5× | .65/.60/.62/.55 (n = 231) | [68] | High (as reported) |
| Video supplementing vs replacing teaching | g = 0.80 vs 0.28 (105 RCTs) | [S][69] | Medium |
| LLM chaptering of all OCW lectures | ≈$4 (Haiku 5.5 batch) / ≈$77 (Sonnet 5.5 batch) | [I] from pricing-reference | Medium |

---

## Surprises and recent changes (2024–2026)

1. **Coursera ended audit (2025-08-08) and then absorbed Udemy (2026-05-11)** [V][S]. Two of the three big MOOC brands now offer week-1 previews, and the third (edX) times out audits.
2. **OCW wrote an AI-training clause into its terms (2026-08-11)** [V]: non-commercial models only, with ShareAlike on the model. This is unusual: it tries to impose ShareAlike on *trained models*.
3. **ACL video coverage collapsed after 2023** [V]: 48% of 2021 papers had video, 13% of 2024 papers, and 0% of 2025–26 so far. Part of the 2025–26 gap may be ingestion lag [I, ~40%]. Either way, the openly licensed conference-video stream is thinning, while ML venues' talks stay on SlidesLive with no licence [V].
4. **CCC subtitling fell behind** [V]: 98–99% coverage for 30C3–37C3 (except 36C3 at 82%), 61% for 38C3, 61% for 39C3, and 0 of 1,132 items from 2026. Many recent subtitles are "(todo)" drafts, and c3subtitles.de returned HTTP 500.
5. **CS224N and similar Stanford courses keep current lectures behind Canvas** [V]. The public playlist lags by about two years. CS336 is the counter-example (Spring 2026 playlist).
6. **Open ASR caught up** [V]. Open models now sit about 1 WER point behind the best APIs on short-form (8-set mean), level with OpenAI's gpt-transcribe, and within 0.1–1 point on TED-LIUM long-form. The leaderboard's headline `avg` column is not like-for-like across models; recompute before ranking. On CPU, Parakeet-class models transcribe a lecture 7× faster than real time.
7. **New open ASR entrants in 2026:** Cohere Transcribe (03-2026, Apache-2.0), IBM granite-speech 4.1/5.0, Qwen3-ASR and Gemma 4 [V leaderboard]. Speed and accuracy are no longer the bottleneck; transcript *rights* are.
8. **Podcasting 2.0 transcript tags are now common at the host level** (Omny, Buzzsprout) but rare among high-signal independent shows [V]. Owner-site transcripts are where the quality is.
9. **Chaptering research moved to lectures specifically** (CausalChapter, 2026-09; ARC-Chapter, 2025-11) [V].

## Contested or uncertain points

- **Whether conference videos on SlidesLive play without login.** Pages serve embeds anonymously [V]; I could not test playback in this environment. [~80%] they are public about a month after each conference, per the virtual sites' own statements [V].
- **Human versus machine origin of "owner transcripts".** Clearer Thinking credits human transcriptionists [V] and CWT's are link-enhanced [V]. For most others provenance is unstated. Several shows likely use ASR plus light editing [I, ~60%]. Measure WER on a sample before trusting them for quotation.
- **WER against owner captions understates or overstates true accuracy.** "Clean verbatim" references penalise verbatim ASR, and possible training-data contamination (OCW on YouTube) may flatter Whisper [I].
- **OCW's ShareAlike-on-models clause.** Whether a licensor can require trained-model ShareAlike through terms of use, rather than through the CC licence itself, is untested [I]. A personal, non-commercial tool is unaffected.
- **NPTEL licence text** says "Creative Commons Attribution-ShareAlike" and "CC BY-NC-SA" in the same line [V]. Treat it as NC.
- **Podcast ecosystem tag shares** come from one independent tracker with no snapshot date beyond "updated nightly" [S]. My own top-200 measurement (14.1% of feeds, 14.2% of items) is higher than its ecosystem-wide 4.3% of episodes. That is consistent with large hosts auto-tagging popular shows [I].
- **Class Central, FutureLearn and edX details** rest on secondary sources because of 403s.
- **The learning-science effects** (Noetel, Rey) come from secondary summaries or background knowledge, not full texts. Murphy et al. was read in full.

## Implications for someone building tools to explore literature

1. **Start with the open, transcribed core.** OCW (163 transcribed full courses), SEE (9), CS50, OYC, the Berkeley IA mirror, ACL videos (15.8k), media.ccc.de (654 final-subtitled talks plus about 17k more by ASR), TIB and PIRSA DOIs, and podcasts with owner-site transcripts. That is several thousand hours of *readable* lectures with stable deep links.
2. **Treat lectures as chapters of books.** The slide "Readings" lines give free supervision: 6 of 6 sampled 6.041SC decks name B&T sections. Build the linker on courses with such lines, then generalise with embeddings.
3. **Transcribe locally.** Parakeet-TDT-0.6B on CPU (7× real time) or Whisper turbo on a GPU makes transcription nearly free. Spend money on chaptering and linking instead, which costs dollars per thousand lectures.
4. **Never re-serve media.** Store segments, deep links and rights per component. Get media from the licensor's own host (archive.org, CCC CDN, ACL), never from YouTube.
5. **Model rights per component and per licence family.** NC (OCW, OYC, CS50, NPTEL, Khan) means a public index must stay non-commercial and ShareAlike. ND (TED, the Berkeley mirror) means descriptions must be short and original.
6. **Chapters are the missing layer.** Owner chapters are found on 1–3% of items. An LLM chaptering pass over transcripts is cheap, about $4 for all OCW lectures on Haiku batch, and research results show transcript-first chaptering works.
7. **Use speed and segmenting evidence in the UI.** Default to 1.5×, allow 2×, and warn at 2.5×. Present 5–15-minute segments with a transcript side panel.

## Ideas sparked

1. **Lecture↔chapter linker (OCW × R01).** For each R01 §9 book without a free text (B&T, CLRS, AIMA, Wasserman, Casella & Berger), surface the OCW lecture segments that cover each section, using "Readings:" lines as gold labels and embeddings to generalise. Output: "Section 2.4 → 6.041SC L05 18:10–31:40".
2. **"Watch this 12-minute segment instead of reading §4.2."** Rank segments by coverage of a section's key terms per minute, transcript WER and licence openness, and offer a one-click deep link at 1.5×.
3. **Podcast claim index.** Harvest owner-site transcripts (80k Hours, Dwarkesh, EconTalk, CWT, AXRP, Mindscape, Clearer Thinking, FLI), extract claims and paper mentions, resolve them through OpenAlex, and link each claim to the papers it cites, with the timestamp. Keep it private (R13-9).
4. **media.ccc.de "subtitle completion" contribution.** Use local ASR to draft subtitles for the 1,132 untranscribed 2026 talks and hand them to c3subtitles' human workflow. It gives back to the commons and yields a high-quality corpus.
5. **OCW course reader.** Convert each of the 163 fully transcribed courses into an EPUB, with transcript chapters, slide images inline and timestamps as links. It can be read on e-ink (R11) and is permitted by CC BY-NC-SA with attribution.
6. **DOI-first talk catalogue.** Ingest TIB (45,898), PIRSA (10,898) and Zenodo video DOIs into the R10 catalogue as `kind: talk`, with DataCite metadata. Talks then become citable siblings of papers.
7. **Conference "talk ↔ paper" joins.** ACL Anthology video ↔ paper is trivial; NeurIPS/ICML/ICLR SlidesLive ID ↔ OpenReview ID comes from the virtual-site pages. Show "this paper has a 12-minute talk" in paper search.
8. **Speed-aware study planner.** Given a target book section and a time budget, assemble a playlist of segments at 1.5–2×, interleaved with the matching text pages. This follows the evidence that video supplementing text works best (g = 0.80).
9. **Transcript quality meter.** For each owner transcript, run a 5-minute local ASR spot check and report the disagreement rate. Flag low-quality "owner" transcripts before quoting them.
10. **Slide-anchored maths recovery.** Align ASR words to slide symbols and let an LLM rewrite each window into LaTeX given its slide. Build a searchable maths index of lectures, e.g. "where is P(A∩B)=P(A)P(B|A) derived?".
11. **Lecture-series "syntopicon".** Cluster segments across courses by concept (Bayes' rule in 6.041SC, Stat 110, 18.650, BDA), then compare how different lecturers explain it.
12. **MCP tool `find_segment(section|concept)`.** Lets Claude answer "show me a lecture explanation of X" with timestamps, inside the R10 catalogue.
13. **Course-platform free-tier watcher.** Track Coursera preview scope and edX audit windows, since Class Central blocks bots. Snapshot one course page per platform each month, and store the evidence.

---

## Sources

All accessed 2026-10-15 unless stated.

1. MIT Learn search API (OCW courses, videos, facets): https://api.learn.mit.edu/api/v1/learning_resources_search/?platform=ocw&resource_type=course
2. MIT OCW robots.txt and sitemap index: https://ocw.mit.edu/robots.txt ; https://ocw.mit.edu/sitemap.xml
3. MIT OCW course download pages, e.g.: https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/download/
4. MIT OCW resource `data.json`, e.g.: https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/resources/lecture-1-video/data.json ; captions https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/j9WZyLZCBzs_captions.webvtt
5. MIT OCW Privacy and Terms of Use (last updated 2026-08-11): https://ocw.mit.edu/pages/privacy-and-terms-of-use/
6. Internet Archive metadata, OCW item: https://archive.org/metadata/MIT6.041F10 ; advanced search: https://archive.org/advancedsearch.php
7. Internet Archive `ucberkeley-webcast` collection: https://archive.org/details/ucberkeley-webcast
8. Stanford Engineering Everywhere: https://see.stanford.edu/ ; https://see.stanford.edu/Course ; https://see.stanford.edu/Course/CS229 ; https://see.stanford.edu/Course/EE364A
9. Stanford CS224N (Winter 2026 page): https://web.stanford.edu/class/cs224n/
10. Stanford CS336 (Spring 2026): https://cs336.stanford.edu/
11. Stanford CS229: https://cs229.stanford.edu/
12. Harvard CS50 licence and week 0: https://cs50.harvard.edu/x/license/ ; https://cs50.harvard.edu/x/weeks/0/
13. Open Yale Courses: https://oyc.yale.edu/ ; https://oyc.yale.edu/economics/econ-159
14. UC Berkeley Course Capture: https://webcast.berkeley.edu/
15. CMU 15-445 Fall 2024 schedule: https://15445.courses.cs.cmu.edu/fall2024/schedule.html
16. NPTEL About and course list: https://nptel.ac.in/aboutUs ; https://nptel.ac.in/courses
17. Khan Academy Terms of Service: https://www.khanacademy.org/about/tos ; OpenLearn FAQ (WebFetch): https://www.open.edu/openlearn/about-openlearn/frequently-asked-questions-on-openlearn
18. David Silver teaching page: https://www.davidsilver.uk/teaching/
19. Aalto BDA course: https://avehtari.github.io/BDA_course_Aalto/
20. MIT Missing Semester: https://missing.csail.mit.edu/
21. MacKay ITPRNN lectures: https://www.inference.org.uk/itprnn_lectures/
22. MIT 6.S191: http://introtodeeplearning.com/
23. fast.ai course: https://course.fast.ai/
24. TED Talks usage policy: https://www.ted.com/about/our-organization/our-policies-terms/ted-talks-usage-policy ; transcript page example https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity/transcript
25. Long Now talks: https://longnow.org/talks/ ; IA collection `longnow` (count via advanced search)
26. Gresham College Lectures podcast feed: https://rss.buzzsprout.com/1904814.rss ; Gresham "Watch now" and terms pages (WebFetch; curl returned 403): https://www.gresham.ac.uk/watch-now ; https://www.gresham.ac.uk/terms-and-conditions
27. Wikipedia, Gresham College [S]: https://en.wikipedia.org/wiki/Gresham_College (via search; (stale?))
28. NeurIPS virtual sites and oral page: https://neurips.cc/virtual/2025/index.html ; https://neurips.cc/virtual/2024/oral/97946 ; SlidesLive https://slideslive.com/39031482
29. ICML 2026 oral: https://icml.cc/virtual/2026/oral/71035 ; ICLR 2025: https://iclr.cc/virtual/2025/oral/31916
30. ACL Anthology data (sparse clone of `data/xml`, 2026-10-15): https://github.com/acl-org/acl-anthology ; licence footer https://aclanthology.org/2024.acl-long.1/ ; video https://aclanthology.org/2023.acl-long.1.mp4
31. USENIX OSDI '24 DistServe page: https://www.usenix.org/conference/osdi24/presentation/zhong-yinmin
32. media.ccc.de REST and GraphQL APIs and About page: https://api.media.ccc.de/public/conferences ; https://media.ccc.de/graphql ; https://media.ccc.de/about.html ; talk https://media.ccc.de/v/37c3-12235-fuzzing_the_tcp_ip_stack
33. c3subtitles (HTTP 500 at access): https://c3subtitles.de/
34. DataCite API, TIB AV-Portal prefix: https://api.datacite.org/dois?prefix=10.5446 ; media page https://av.tib.eu/media/43541
35. DataCite API, PIRSA prefix: https://api.datacite.org/dois?prefix=10.48660 (pirsa.org returned 403)
36. Zenodo records API: https://zenodo.org/api/records?type=video ; https://zenodo.org/api/records?type=presentation
37. PyVideo: https://pyvideo.org/
38. Strange Loop: https://www.thestrangeloop.com/
39. EA Global: https://www.effectivealtruism.org/ea-global
40. Simons Institute videos (WebFetch): https://simons.berkeley.edu/videos
41. Coursera Blog, "Introducing Coursera's new course preview experience" (2025-08-08): https://blog.coursera.org/introducing-courseras-new-course-preview-experience/
42. MIT Open Learning, statement on edX platform updates (2018-12-17): https://openlearning.mit.edu/news/statement-regarding-edx-platform-updates-long-term-sustainability
43. edX support articles on audit access [S, via search; site 403]: https://support.edx.org/hc/en-us/articles/360013426573 ; https://support.edx.org/hc/en-us/articles/360013426233 ; https://support.edx.org/hc/en-us/articles/360021149373
44. FutureLearn partner help [S, via search; site 403]: https://partners.futurelearn.com/hc/en-us/articles/7855326914962
45. Udacity pricing: https://www.udacity.com/pricing ; Udacity All Access FAQ (2023) [S]: https://www.udacity.com/blog/your-udacity-all-access-questions-answered/
46. Coursera Form 8-K/A (2026-05-11) and 10-Q [S, via search]: https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000050/cour-20260511.htm
47. Class Central reports (HTTP 403): https://www.classcentral.com/report/
48. Apple Podcasts for Creators, "Transcripts on Apple Podcasts": https://podcasters.apple.com/support/5316-transcripts-on-apple-podcasts
49. Apple top podcasts RSS (US, 200) and iTunes Lookup/Search APIs: https://itunes.apple.com/us/rss/toppodcasts/limit=200/json ; https://itunes.apple.com/lookup ; plus the 252 feed URLs they returned
50. Podcast Industry Insights (Daniel J. Lewis), Podcasting 2.0 and Podcast Index statistics [S]: https://podcastindustryinsights.com/podcasting-2-0-statistics ; https://podcastindustryinsights.com/podcast-index-statistics
51. Podcast Index API (HTTP 403 without key): https://api.podcastindex.org/
52. Listen Notes API pricing: https://www.listennotes.com/api/pricing/
53. Podscan pricing: https://podscan.fm/pricing
54. Snipd pricing: https://www.snipd.com/pricing
55. 80,000 Hours podcast feed: https://feeds.transistor.fm/80000-hours-podcast
56. Dwarkesh Podcast episode: https://www.dwarkesh.com/p/si-sheppard
57. EconTalk episode: https://www.econtalk.org/the-great-fertility-collapse-with-jesus-fernandez-villaverde/
58. Conversations with Tyler episode: https://conversationswithtyler.com/episodes/liaquat-ahamed/
59. Lex Fridman transcript: https://lexfridman.com/andrew-scull-transcript/
60. The Gradient: https://thegradientpub.substack.com/p/nathan-benaich-2025
61. AXRP episode 50: https://axrp.net/episode/2026/08/03/episode-50-eli-lifland-ai-2027.html
62. Mindscape AMA October 2026: https://preposterousuniverse.com/podcast/2026/10/12/ama-october-2026/
63. Clearer Thinking episode 326: https://podcast.clearerthinking.org/episode/326/garrison-lovely-the-race-to-replace-us-with-ai
64. Odd Lots episode (Omny): https://omny.fm/shows/odd-lots/jeff-yans-plan-to-bring-the-entire-financial-industry-onto-hyperliquid
65. Latent Space episode: https://www.latent.space/p/lab-in-the-loop-at-compute-speed
66. Open ASR Leaderboard: space https://huggingface.co/spaces/hf-audio/open_asr_leaderboard ; results https://huggingface.co/datasets/hf-audio/open-asr-leaderboard-results (file `english_short_latest.csv`, rev fc33fde2) ; long-form https://huggingface.co/datasets/hf-audio/leaderboard_longform (rev 4f164c2c)
67. faster-whisper 1.2.1 and onnx-asr 0.12.0 (PyPI): https://pypi.org/project/faster-whisper/ ; https://pypi.org/project/onnx-asr/
68. Murphy, D. H., Hoover, K. M., Agadzhanyan, K., Kuehn, J. C., & Castel, A. D. (2022). Learning in double time. *Applied Cognitive Psychology* 36. https://doi.org/10.1002/acp.3899 (full text: https://castel.psych.ucla.edu/wp-content/uploads/sites/111/2022/03/Applied-Cognitive-Psychology-2021-Murphy-Learning-in-double-time-The-effect-of-lecture-video-speed-on-immediate-and.pdf)
69. Noetel, M. et al. (2021). Video improves learning in higher education: a systematic review. *Review of Educational Research*. https://doi.org/10.3102/0034654321990713 [S via AERA press release https://www.aera.net/Newsroom/Video-Improves-Learning-in-Higher-Education-A-Systematic-Review]
70. Rey, G. D. et al. (2019). A meta-analysis of the segmenting effect. *Educational Psychology Review*. https://doi.org/10.1007/s10648-018-9456-4 (Crossref metadata)
71. Yang, A. et al. VidChapters-7M (arXiv 2309.13952): https://arxiv.org/abs/2309.13952
72. Ventura, L. et al. Chapter-Llama (arXiv 2504.00072): https://arxiv.org/abs/2504.00072
73. ARC-Chapter (arXiv 2511.14349): https://arxiv.org/abs/2511.14349
74. PODTILE (arXiv 2410.16148): https://arxiv.org/abs/2410.16148
75. Beyond Transcripts: audio chaptering (arXiv 2602.08979): https://arxiv.org/abs/2602.08979
76. CausalChapter (arXiv 2609.08686): https://arxiv.org/abs/2609.08686
77. AudioChaps (arXiv 2608.16539): https://arxiv.org/abs/2608.16539
78. YouTube Terms of Service (effective 2023-12-15): https://www.youtube.com/t/terms
79. media.ccc.de player script (parses `t`): https://media.ccc.de/assets/application-9717c187fdea101e757d0a141034065e6d92f305dcb8637abd26bdac747a5066.js
80. Internal: R01 §6 and §9; R03 (library-card Udemy and LinkedIn Learning); R07 §3.2–3.3; R09 §7–8 and green/yellow/red rows 7–11 and 29; R10 §1.4 and the unified work record; R11 §2.5; `pricing-reference.md`.
