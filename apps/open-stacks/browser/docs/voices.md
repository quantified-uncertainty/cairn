# Voices for read-aloud

Which voices the Stacks Browser could read with besides today's two (the browser's own `speechSynthesis` and Gemini TTS), as of October 2026. It is written for the reader this app targets: an Apple Silicon Mac with 64 GB, Firefox, long listening sessions of technical prose, cost-conscious but willing to pay a little. Prices, versions and licences were checked on the web on 15 October 2026, and sources are at the end. Claims I could not check are marked with a confidence.

Every voice has to say *when* each word is spoken, because the read-aloud mode lights the word being said (`ui/js/features/readaloud.js`). Today the browser voice reports that itself (boundary events), and Gemini's audio is timed after the fact from its pauses (`silences` and `timeWords`, about 0.17 s mean error by Starfleet's measurement).

## Short answer

- **Today, free, no code:** install Apple's **Ava (Premium)** voice and pick it in Settings. Firefox reports each word as it is spoken, so highlighting is exact. Quality is decent but flatter than the cloud voices.
- **Best free local voice to build:** **Kokoro-82M** in the Node server through `kokoro-js`. It needs no Python and no native build. It is fast on a Mac CPU, and the model itself gives word times. It is clearly below Gemini: in blind tests listeners prefer Gemini about 77% of the time. About 3-4 days of work.
- **Best cheap cloud voice with word timestamps:** **Speechify Simba 3.2** (about $10-25 a month at an hour of listening a day), with **Inworld TTS-2 Flash** as the runner-up ($25 a month plan). Both rate close to Gemini (Gemini preferred about 54-58%), both return per-word times, and both are built for fast starts.
- **Gemini:** keep it as an option. It is still the best-rated voice the app has, and cheap until 31 December 2026, when its price doubles. Try Flash-Lite with no code change. Do not invest in Gemini word timing unless it stays your main voice.
- **"Little LLMs" you download:** the small ones (Kokoro, Pocket TTS, Kitten, Piper) are well below Gemini. The only open model close to Gemini is **Fish Audio Drama 3**, which is not little (about 22 GB, 26 GB of RAM in use), runs about 2x real time on an M3 Max, has no word times, allows personal use only, and came out on 1 October 2026. Worth a weekend experiment, not a default.

## How the options were judged

- **Quality.** Artificial Analysis Speech Arena Elo [1], a blind preference vote on short clips. The difference between two scores converts to a preference: P(A preferred) = 1 / (1 + 10^(-(Elo A - Elo B)/400)). The arena is short clips, not hours of technical prose, so it is a guide, not a verdict. Apple's voices, Pocket TTS, Piper and Supertonic are not on it.
- **Speed.** Real-time factor and time to first audio. Local figures come from vendor pages, a third-party benchmark (tts-bench [15], whose M4 numbers I could not re-check against its source), and a benchmark run here on 15 October 2026 on an overloaded 4-vCPU Linux box. Mac figures from that run are estimates (this box ÷ about 6, plausible range ÷4 to ÷9; confidence medium-low).
- **Usage for costs.** `readaloud.js` assumes 15 characters a second at 1x (`CPS`), and the default reading speed is 1.5x. So an hour of listening uses about 81,000 characters. Three cases are used below:

| Case | Listening | Characters a month |
|---|---|---|
| Light | 5 h a month | 0.41 M |
| Regular | 1 h a day, 30 h a month | 2.43 M |
| Heavy | 2 h a day, 60 h a month | 4.86 M |

Cached passages are paid once. Passages made ahead and then skipped are paid but never heard, which probably adds 5-15% (confidence low).

## 1. Best free and local option

### 1a. Today: an Apple Premium voice in Firefox (no code)

**Setup (10 minutes):**
1. Open System Settings → Accessibility → Read & Speak. This was called Spoken Content before macOS 26 [24].
2. Under System voice, choose Manage Voices…, then English. Download **Ava (Premium)**, and optionally Zoe (Premium) for US English or Jamie (Premium) or Serena (Premium) for UK English. Each is a download of a few hundred MB (confidence medium).
3. Restart Firefox so it lists the new voice (probably needed; confidence medium).
4. In Stacks, open Settings (`,`) → reading voice → "This browser", then pick Ava · Premium. If you have never chosen a voice, the app picks the best installed Premium voice by itself (`quality()` and `voices()` in `readaloud.js`).

**Highlighting:** exact and live. Firefox 155 (September 2026) moved its macOS speech backend to `AVSpeechSynthesizer`. That backend turns the system's `willSpeakRangeOfSpeechString` callback into `word` boundary events with a character index [21], which `readaloud.js` already uses (`onboundary` → `onword`). This was checked in Firefox's source, not by listening on a Mac (confidence medium-high).

**Limits:**
- The voice is not on the arena. My guess is roughly Kokoro's class: clean, but even-toned over long passages (confidence low).
- It cannot be cached or made ahead, though it needs neither: it starts at once.
- Siri voices are not offered to web pages (confidence medium).
- Apple's licence allows system voices for personal, non-commercial use only [23]. That is fine here; do not record or share the output.

### 1b. To build: Kokoro-82M in the Node server

Kokoro-82M [12] is the best small fixed-voice model. It has an Elo of 1061, and listeners prefer Gemini 3.8 Flash TTS (1272) about 77% of the time. It is clearly better than Azure Neural (1034) or Polly Neural (895), and pleasant for long listening, though a little flat on emphasis. The model card grades af_heart (A) and af_bella (A-) highest. The best British voice is bf_emma (B-), and the male voices grade C+ or lower.

**Why the server rather than Firefox:**
- Native ONNX Runtime was about 4x faster than the WebAssembly build in the benchmark.
- It needs no COOP/COEP headers (multi-threaded WebAssembly in the page needs them).
- One model load serves every tab.
- The server already caches and makes passages ahead.
- Firefox's WebGPU path for this model is untested (confidence medium-low).

**Setup:**

```bash
cd apps/open-stacks/browser
npm i kokoro-js        # 1.2.1, Apache-2.0
```

- `kokoro-js` pulls in `@huggingface/transformers` 3.x and `onnxruntime-node`, which ships prebuilt macOS arm64 binaries, so nothing compiles. It is heavy on disk: `onnxruntime-node` alone was 536 MB in the benchmark, because it ships every OS's binaries.
- The model, `onnx-community/Kokoro-82M-v1.0-ONNX-timestamped` [13], downloads from Hugging Face on first use: 86 MB for q8 or 326 MB for fp32. Use fp32 on the server; q8 was 36% slower on x86 (not checked on Apple CPUs).
- Make it an optional dependency, loaded with `import()`, so the app still runs without it.

**Speed (estimates for an Apple Silicon CPU; confidence medium-low):**
- About 7-9x real time on one thread (tts-bench on an M4 CPU: 9x [15]; Supertone's table on an M4 Pro: 7-8x [16]; this box ÷ 6: about 7.5x).
- A first passage of 60-100 characters should be ready in about 0.2-0.5 s once the model is warm.
- On the benchmark box, loading took 1.5 s and the first inference 2.4 s, so warm the model when the server starts.
- At 1.5x reading speed the voice needs only 1.5x real time, so one worker keeps well ahead.

**Word times:**
- The timestamped export returns `durations` (one per phoneme token, in 25 ms frames) next to `waveform`. They summed to within about 1% of the audio length.
- To map them onto page words:
  1. Phonemise each word of the passage on its own.
  2. Line that sequence up with the phonemes actually voiced, using an edit-distance match. This handles numbers that expand and words espeak merges.
  3. Sum the durations per word.
- In the benchmark this placed 121 of 121 words. After removing a constant lag of +0.09 to +0.13 s, word starts were within 42-57 ms (median) of a speech recogniser's, and 111-152 ms at the 90th percentile. That is about three times tighter than the silence heuristic.
- `kokoro-js`'s own `generate()` and `stream()` throw the durations away, so call `tts.model({ input_ids, style, speed })` directly.
- `kokoro-js` also does not export its phonemiser. Copy its English normaliser and the `phonemizer` call into the provider; the Apache-2.0 licence allows this, so keep the notice.

**Text handling:**
- Kokoro read "2023", "42%", "0.05" and "3.5" correctly.
- "<" was silent in every engine tested, so add a symbol normaliser (step 1 of the plan).
- One call takes at most 510 phoneme tokens, and numbers expand, so keep Kokoro passages to about 350 characters.

**Licence:**
- Weights and `kokoro-js` are Apache-2.0.
- The `phonemizer` package wraps espeak-ng, which is GPL-3.0. That is fine for personal use; check before shipping the app to others with it bundled (confidence medium).

**Cost:** nothing beyond disk (about 0.6-1 GB in all) and a few CPU-seconds per minute of speech.

### Other local models, and why not first

| Model | Verdict |
|---|---|
| Kokoro inside Firefox (WebGPU or WebAssembly) | Works, but WebAssembly ran about 4x slower than native. That is below real time on one thread and about 2x real time with 4 threads, which need COOP/COEP headers. It also means a 88-310 MB download into each browser profile. Firefox WebGPU was not tested. |
| Pocket TTS (Kyutai, 100M) + the `pocket-tts-timestamped` fork [17] | Fastest start: about 30-200 ms to first audio and 6-9x real time on an M4 CPU. It streams word times (about 40-50 ms error, per the fork's own figures). But it is Python plus PyTorch. The stock package garbled raw numbers ("twenty two three", "20204"), and the fork (1.3.0, released 15 October 2026) stopped early on both test passages. It is the second choice if a Python sidecar is acceptable. |
| Fish Audio Drama 3, 4-bit, via `mlx-audio` [18] | Best open quality: 1242, so Gemini is preferred only about 54% of the time. It runs about 2x real time on an M3 Max with under 200 ms to first audio when streaming, and uses about 26 GB of RAM. Its licence allows personal use only. It needs a reference voice clip and gives no word times, so it would need a separate aligner such as Qwen3-ForcedAligner [19]. Released 1 October 2026. |
| Breeze TTS 2 (3.5B) | 1219, non-commercial weights, Mac speed unpublished (guess about 1x; confidence low). |
| Qwen3-TTS 0.6B/1.7B | Apache-2.0 and about 1.8x real time with MLX on an M2 Max, but probably no better than Kokoro for English prose (confidence low-medium). No word times. |
| Piper [20] | Most accurate word timing (exact per phoneme) and about 33x real time, but an older, flatter sound. The engine is GPL-3.0, and the lessac voice's training data is for non-commercial research. |
| Kitten TTS 0.8 | Tiny and fast with exact durations, but the stock wrapper lowercases everything ("OpenAI" became "OpenEye") and splits at "et al.". Lower quality. |
| Supertonic 3 | Fast by vendor numbers but not in the independent benchmark. No per-word durations, and the project has been archived. |
| Chatterbox Turbo | About 2 s to first audio on an M4, and every output carries a watermark. |
| sherpa-onnx (`npm i sherpa-onnx-node`) [26] | A good Node runtime for Kokoro, Piper and Kitten with no compile step, but its TTS result has no word timestamps. |

## 2. Best cheap cloud option with word timestamps

**Recommendation: Speechify Simba 3.2, with Inworld TTS-2 Flash as the runner-up.** Both are close to Gemini in quality and both return per-word times. Neither latency was measured here; both are sold as streaming, real-time voices.

**Speechify Simba 3.2:**
- Elo 1244, ninth overall [1]; Gemini 3.8 Flash TTS is preferred about 54% of the time.
- English only, which suits this reader.
- `POST /v1/audio/speech` returns the audio plus speech marks for each word: `start` and `end` as character indices into the input, `start_time` and `end_time` in ms [7]. These map straight onto the engine contract's `wordTimes: [{ start, at }]`.
- An SSE endpoint, `/v1/audio/stream/with-timestamps`, streams the same marks (added July 2026 [8]).
- Gotchas:
  - Indices count characters after entities are decoded.
  - The first word may start after some leading silence.
  - The docs show two shapes for the marks (flat and nested), so check a real response before writing the parser.
  - The standard endpoint takes at most 2,000 characters.
- Price: plans cost $10, $99 and $499 a month [9]. Listings that cite Speechify give Starter as 1 M characters included, then $10 per 1 M, with 50 K characters a month free. I could not read the per-character rates on Speechify's own page (confidence medium).

**Inworld TTS-2 Flash / TTS-2:**
- Elo 1217 and 1260 [1]; Gemini preferred about 58% and 52% of the time.
- Set `timestampType: WORD` and the response lists every token of the input in order (words, spaces and punctuation), each with a start and end in seconds [6]. Character offsets follow by adding up the token lengths.
- Inworld warns that timestamps can add latency, especially on the non-streaming endpoint.
- Prices (inworld.ai/pricing, 15 October 2026 [5]):
  - On demand: $15 per 1 M characters for Flash, $25 for TTS-2.
  - Creator plan: $25 a month, paid back as $25 of credit, then $10 (Flash) or $20 (TTS-2) per 1 M. Credit rolls over for 3 months.
  - About 70 free minutes on demand.

**Monthly cost estimate** (characters from the usage table above; USD; caching not counted):

| Voice | Light (0.41 M) | Regular (2.43 M) | Heavy (4.86 M) |
|---|---|---|---|
| Speechify Simba 3.2, Starter | $10 | $24 | $49 |
| Inworld TTS-2 Flash (cheaper plan) | $6 on demand | $25 Creator | $49 Creator |
| Inworld TTS-2 (cheaper plan) | $10 on demand | $49 Creator | $97 Creator |
| Gemini 3.8 Flash TTS, to 31 Dec 2026 | $6 | $36 | $73 |
| Gemini 3.8 Flash TTS, from 1 Jan 2027 | $12 | $73 | $146 |
| Gemini 3.8 Flash-Lite TTS, to 31 Dec 2026 | $4 | $24 | $49 |
| Azure Neural (0.5 M free a month) | $0 | $29 | $66 |
| ElevenLabs Eleven v4 Turbo (arena's list price) | $16 | $97 | $194 |
| Kokoro or an Apple voice | $0 | $0 | $0 |

The Gemini rows are worked out from the per-token price: $9 per 1 M audio tokens, at 25 tokens per second of audio, is $0.81 per hour of 1x audio, or about $15 per 1 M characters.

**Set aside:**
- **ElevenLabs Eleven v4 / v4 Turbo** is the best-rated voice of all (1327; preferred over Gemini about 58%) and has per-character timestamps [11]. At about $40 per 1 M it costs 2-4 times as much. Choose it if quality matters more than money.
- **Cartesia Sonic 3.6** (1284) has word timestamps but costs about $49 per 1 M.
- **Alibaba Qwen-Audio-3.1-TTS-Plus** (1296, about $19 per 1 M) is strong, but I found nothing on word timestamps (unverified).
- **Azure Neural** has a free 0.5 M characters a month and exact WordBoundary events, but it rates below Kokoro (1034).
- **Azure HD 2.5** (1132, $22 per 1 M): Microsoft's pages disagree on whether HD voices send word boundaries.
- **Amazon Polly** Neural (895) and Generative (1063 at $30 per 1 M) are not worth it.
- **OpenAI's TTS** gives no timestamps.
- **Unofficial free Edge voices** (the `edge-tts` style libraries) do give word boundaries, but they use an undocumented endpoint meant for the Edge browser, so they can break or breach terms, and their quality is Azure Neural's.

## 3. What to do about Gemini

**What is true today:**
- **Quality:** Gemini 3.8 Flash TTS is fifth overall at 1272 [1], above every option in section 2 except ElevenLabs v4. The voice is not the problem.
- **Price:** $0.50 per 1 M text tokens in and $9 per 1 M audio tokens out (25 tokens per second of audio), until 31 December 2026. Both double on 1 January 2027 [3]. Batch and Flex cost half.
- **Free tier:** standard calls are free on the free tier, but its limits for the 3.8 TTS models are not on the rate-limits page (check AI Studio). Free-tier prompts may be used by Google to improve its products (confidence medium).
- **Why it is tricky** (from `server/routes/55-tts.mjs`):
  - It takes about 2.4 s plus 16 ms a character to make a passage, so the first audio waits about 4 s.
  - The minute quota answers 429.
  - Some answers come back truncated and must be retried, which is why the server hedges slow requests.
  - It needs an API key.
  - It gives no word times.

**Recommendations:**
1. **Keep it as an option, not the default.** Make Kokoro (or the Apple voice) the default once it exists. Choose Gemini for long sessions, where a 4 s start does not matter.
2. **Try Flash-Lite now, with no code change:**
   ```bash
   STACKS_TTS_MODEL=gemini-3.8-flash-lite-tts node server.mjs
   ```
   It rates 1246 (Gemini Flash preferred about 54%) and costs two-thirds as much. Whether it is faster is unmeasured. The model ID comes from LiteLLM's launch note [4], so confirm it in AI Studio.
3. **Revisit before January.** At the 2027 price, regular use costs about $73 a month, three times Speechify or Inworld Flash.
4. **Only if Gemini stays your main voice, give it real word times.**
   - Run a speech recogniser or forced aligner over each WAV and map its words to the passage with the existing `align()`.
   - In the benchmark, Parakeet-TDT 0.6B (int8 ONNX via `onnx-asr`, Python) placed word starts within about 45 ms (median) of exact times. It used about 0.17 CPU-seconds per audio-second on the slow box.
   - In Node, `sherpa-onnx-node` with a transducer model may give token times (confidence medium-low). `brew install whisper-cpp` with word timestamps is another route.
   - Qwen3-ForcedAligner [19] is the most accurate by its own report, but it is Python/MLX only.
5. **Pre-voicing saved items overnight at the Batch or Flex half price** would fit the pattern of `augment-batch.mjs`. It only pays off if you replay the same items, so it is low priority.

## 4. Integration plan for Stacks read-aloud

### What exists

- **Client** (`readaloud.js`):
  - Engines register through `registerEngine({ id, label, kind: 'events' | 'audio', sizes, voices(), available(), speak() })`.
  - An `audio` engine's `speak()` returns `{ buf | blob | url, wordTimes?: [{ start: char, at: seconds }] }`. Without `wordTimes`, words are timed from the WAV's pauses.
  - Passages are cut from whole sentences by `buildPassages()` with a size ramp per engine.
  - `make()` and `prefetch()` keep 3-4 passages in flight ahead of the voice (`depth()`), and `keepWindow()` drops them on a move.
  - One `<audio>` element plays at the reading speed, with pitch preserved.
- **Server** (`55-tts.mjs`), Gemini only:
  - A disk cache keyed by `sha256(model|voice|text)` with a 2 GB LRU (about 12 h of 24 kHz WAV).
  - Shared in-flight requests, and two lanes (`now` never waits behind `ahead`).
  - Hedging, an hourly character budget, and cancellation when nobody is waiting.

This is the right shape, so the plan extends it rather than replacing it.

### Where each engine runs, and where word times come from

| Engine | Runs in | Word timing source | Expected accuracy |
|---|---|---|---|
| Apple voice (`browser`) | Firefox, `speechSynthesis` | OS boundary events | Exact, live |
| `kokoro` | Node server, in a worker thread | Model `durations` → per-word phoneme alignment, minus about 0.1 s | About 50 ms median (benchmark) |
| `speechify` or `inworld` | Node server → vendor API | Vendor speech marks or word alignment | Vendor-exact (not measured) |
| `gemini` | Node server → Google | Silence heuristic (today) or an aligner (optional) | About 170 ms mean (today); about 50 ms with an aligner |
| Any engine, as a fallback | Client | Even spread by characters | Rough |

### Steps and effort

Estimates are rough, plus or minus 50%, for someone working in this codebase. They include tests, and tuning on the Mac where noted.

| # | Step | Effort |
|---|---|---|
| 0 | Install Ava (Premium) and pick it (section 1a). | 10 min, no code |
| 1 | Symbol normaliser for every engine | 0.5 day |
| 2 | One `/tts` route for many engines | 1 day |
| 3 | Kokoro provider | 2 days, plus 0.5 day tuning on the Mac |
| 4 | One cloud provider with timestamps (Speechify or Inworld) | 0.5-1 day |
| 5 | Passage cuts that repeat, and warming the next item | 1 day |
| 6 | Optional: an aligner for Gemini | 1-2 days (uncertain) |
| 7 | Optional: Apple voices as a cached server engine | 1 day |

**Step 1. Symbol normaliser for every engine.**
- Extend `spokenOf()` so a page word's spoken form says its symbols: `<` "less than", `>` "greater than", `≤` "at most", `≥` "at least", `±` "plus or minus", `≈` and a leading `~` "about", `×` "times", `→` "to", `&` "and", and Greek letters by name.
- Because this works per page word, highlighting still lines up.
- Add cases to the node unit test that covers the pure block.

**Step 2. One `/tts` route for many engines.**
- Split `55-tts.mjs` into the shared machinery (cache, in-flight sharing, lanes, cancellation; budget and hedging for paid engines only) and one provider module per engine:

```js
// server/tts/<id>.mjs
export default {
  id: 'kokoro', label: 'Kokoro (on this Mac)', paid: false,
  available() { return '' /* or why not, e.g. 'npm i kokoro-js to enable' */ },
  voices: ['af_heart', 'af_bella', 'bf_emma', 'am_michael'], defaultVoice: 'af_heart',
  sizes: [60, 160, 300, 350],      // characters per passage, the last repeating
  maxChars: 400,
  async synth({ text, voice, signal }) {
    // -> { wav: Buffer (16-bit mono), words?: [{ start, at }] }  start = char in text, at = seconds
  },
};
```

- `POST /tts { engine, text, voice, priority }` answers with the WAV. The word times go in a header, `X-TTS-Words: [[start, at], ...]`, which is about 1-2 KB for a 600-character passage.
- The cache key gains the engine: `sha256(engine|model|voice|text)`. Word times are stored beside the audio as `<key>.words.json`.
- `GET /tts` keeps its current Gemini fields and adds `engines: { id: { available, label, voices, defaultVoice, sizes } }`.
- In `readaloud.js`, one small factory registers every server engine that `GET /tts` lists. Its `speak()` posts to `/tts` and returns `{ buf, wordTimes: JSON.parse(res.headers.get('X-TTS-Words') || 'null') }`. That is about 40 lines; the Gemini engine becomes one instance of it.

**Step 3. Kokoro provider.**
- Load `kokoro-js` with `import()` in a `worker_thread`, so phonemising and inference never block the server that is also serving pages.
- Load the fp32 timestamped model at startup and run one warm-up sentence (a few seconds, once).
- Keep one queue in which `now` jumps ahead of `ahead`. Drop queued jobs nobody waits for any more; the route already tracks this as `job.waiting`.
- Start with 4 intra-op threads and tune on the Mac.
- For each passage:
  1. Normalise and phonemise it.
  2. If it exceeds 510 tokens, split it at a word and join the pieces.
  3. Run the model at speed 1. The `<audio>` element applies the reading speed, so the cache works at every speed.
  4. Turn the durations into word times as in section 1b, and subtract about 0.1 s.
  5. Write a 16-bit WAV at 24 kHz.
- The sizes ramp starts small (60 characters) so first audio comes in under a second, and stays under the 510-token limit.
- Unit-test the duration-to-word mapping on a saved fixture (phonemes plus durations), so CI needs no model.

**Step 4. One cloud provider with timestamps (Speechify or Inworld).**
- Reuse Gemini's budget, retry and hedging code.
- Map Speechify's word `chunks` (`start` → character, `start_time / 1000` → seconds) or Inworld's `wordAlignment` (add up the token lengths for character offsets).
- Ask for 24 kHz PCM or WAV; check each API's format list.
- Sizes can grow faster than Gemini's ramp, for example `[160, 400, 800]`, since these voices are built for fast starts. Measure first.

**Step 5. Passage cuts that repeat, and warming the next item.**
- Today passages depend on where reading started (the ramp), so a second listen from another spot misses the cache.
- Instead, cut each paragraph into the same passages from its start every time. Starting mid-paragraph then misses only the first passage.
- With "Next item" on, make the first passage of the next item when the current one has a few passages left. This is free with Kokoro, and a fraction of a cent with a cloud voice.

**Step 6. Optional: an aligner for Gemini.** Only if Gemini stays your main voice (section 3, point 4).

**Step 7. Optional: Apple voices as a cached server engine.**
- A small Swift helper using `AVSpeechSynthesizer.write(_:toBufferCallback:toMarkerCallback:)` (macOS 13+) [22] writes Premium-voice audio together with word markers that carry sample offsets.
- It needs the Xcode command line tools.
- It is only worth doing if Firefox's live voice misbehaves. It is untested (confidence medium).

**Suggested order:**
1. Step 0 today.
2. Steps 1-3 next: about 4 days, for a free local voice with exact highlighting.
3. Live with Kokoro and the Apple voice for a week. If neither is good enough for long sessions, do step 4 (Speechify first), and leave Gemini as the "best voice" choice until its January price change.
4. Step 5 whenever re-reading becomes common.
5. Steps 6 and 7 only if needed.

### Measure on the Mac before committing

- **Kokoro in Node:** real-time factor and first-audio time, fp32 against q8, at 1, 4 and 8 threads.
- **Ava (Premium) in Firefox 158:** confirm that `onboundary` fires once per word at speeds of 1.5x and above.
- **Gemini Flash against Flash-Lite:** time to first audio.
- **Speechify Simba 3.2 and Inworld TTS-2 Flash:**
  - time to first audio with timestamps on;
  - whether marks cover every word of a passage with citations and numbers;
  - how the voice sounds after 20 minutes of a dense paper.

## 5. Comparison table (as of October 2026)

The quality column gives the Speech Arena Elo [1], and in brackets how often Gemini 3.8 Flash TTS (1272) is preferred over that voice. Costs assume regular use: 30 h a month at 1.5x, which is 2.43 M characters.

| Option | Quality | Speed, first audio (Mac) | Word timestamps | Licence | Setup | Cost, regular use |
|---|---|---|---|---|---|---|
| Apple Ava (Premium), Firefox `speechSynthesis` | Not rated; guess near Kokoro (low) | Real time; starts at once | Yes: live OS boundary events (Firefox 155+) [21] | Apple licence: personal, non-commercial [23] | Download a voice; no code | $0 |
| Kokoro-82M, Node server [12][13][14] | 1061 (77%) | About 7-9x real time on CPU; about 0.2-0.5 s for a short first passage (estimate, medium-low) | Yes: model durations, about 50 ms median | Apache-2.0; espeak-ng is GPL | `npm i kokoro-js`; about 3-4 days of code | $0 |
| Kokoro-82M in Firefox | 1061 (77%) | WebAssembly about 4x slower than native; WebGPU untested | Yes (same model) | Apache-2.0 | COOP/COEP headers; 88-310 MB per profile | $0 |
| Pocket TTS + timestamped fork [17] | Not rated | 6-9x real time on M4 CPU; 30-200 ms | Yes: streamed, about 40-50 ms (fork's figures) | CC-BY-4.0 weights, MIT code | Python + PyTorch sidecar; number normaliser | $0 |
| Piper [20] | Not rated; flatter | About 33x real time (M4, tts-bench) | Yes: exact, per phoneme | GPL-3.0 engine; voice data varies | `pip install piper-tts` | $0 |
| Fish Audio Drama 3, 4-bit MLX [18] | 1242 (54%) | About 2x real time on M3 Max; under 200 ms streamed; about 26 GB RAM | No: needs an aligner | Personal use only | `pip install mlx-audio` + a reference clip | $0 |
| Speechify Simba 3.2 [7][8][9] | 1244 (54%) | Not measured; streaming model | Yes: word marks with character indices | Commercial API | API key; 0.5-1 day | About $24 a month |
| Inworld TTS-2 Flash [5][6] | 1217 (58%) | Not measured | Yes: word alignment | Commercial API | API key; 0.5-1 day | $25 a month (Creator) |
| Inworld TTS-2 [5][6] | 1260 (52%) | Not measured | Yes: word alignment | Commercial API | API key; 0.5-1 day | About $49 a month (Creator) |
| Gemini 3.8 Flash TTS (today) [3] | 1272 | About 2.4 s + 16 ms a character per passage (measured); first audio about 4 s | No: silence heuristic, about 170 ms mean | Google API terms | Built; needs `GEMINI_API_KEY` | About $36 a month; about $73 from Jan 2027 |
| Gemini 3.8 Flash-Lite TTS [3][4] | 1246 (54%) | Not measured | No | Google API terms | Set `STACKS_TTS_MODEL` | About $24 a month; about $49 from Jan 2027 |
| ElevenLabs Eleven v4 Turbo [1][11] | 1327 (Gemini preferred 42%) | Sold as low latency | Yes: per character | Commercial API | API key; 1 day | About $97 a month |
| Azure Neural [10] | 1034 (80%) | Fast | Yes: WordBoundary events | Commercial API | API key + SDK | About $29 a month (0.5 M free) |

## Sources

Read on 15 October 2026 unless noted.

1. Artificial Analysis, Speech Arena leaderboard (Elo and list prices): https://artificialanalysis.ai/text-to-speech/leaderboard
2. Artificial Analysis, open-weights view: https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice/open-weights
3. Google, Gemini API pricing (3.8 Flash TTS and Flash-Lite TTS; prices double on 1 Jan 2027; 25 audio tokens a second): https://ai.google.dev/gemini-api/docs/pricing
4. LiteLLM, Gemini 3.8 Flash TTS and Flash-Lite TTS model IDs: https://docs.litellm.ai/blog/gemini_3_8_flash_tts
5. Inworld pricing: https://inworld.ai/pricing
6. Inworld TTS timestamps (`timestampType: WORD`): https://docs.inworld.ai/tts/capabilities/timestamps (index: https://docs.inworld.ai/llms.txt)
7. Speechify, speech marks: https://docs.speechify.ai/build/guides/text-to-speech/speech-marks
8. Speechify changelog, `/v1/audio/stream/with-timestamps` (23 Jul 2026): https://docs.speechify.ai/build/changelog/2026/7/23
9. Speechify pricing (plan fees): https://speechify.ai/pricing. Per-character rates as cited by https://infrabase.ai/audio/speechifyai and https://humannessindex.vapi.ai/providers/speechify (third-party, medium confidence).
10. Azure Speech pricing (Neural $15 per 1 M; HD $22 per 1 M; F0 tier 0.5 M neural characters free a month): https://azure.microsoft.com/pricing/details/cognitive-services/speech-services, and the Azure retail prices API (https://prices.azure.com/api/retail/prices)
11. ElevenLabs, stream with timestamps (character alignment): https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps
12. Kokoro-82M model card: https://huggingface.co/hexgrad/Kokoro-82M
13. Kokoro timestamped ONNX export (`waveform` + `durations`): https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped
14. kokoro-js 1.2.1 (Apache-2.0; latest on npm as of 15 Oct 2026): https://www.npmjs.com/package/kokoro-js
15. tts-bench results (M4 figures; cited by an earlier research pass, not re-checked): https://github.com/5uck1ess/tts-bench/blob/master/docs/results.md
16. Supertone, speed table including Kokoro on M4 Pro: https://huggingface.co/Supertone/supertonic-2
17. Kyutai Pocket TTS: https://github.com/kyutai-labs/pocket-tts, and the timestamped fork: https://github.com/dpm63/pocket-tts-timestamped
18. Fish Audio Drama 3: https://huggingface.co/fishaudio/drama-3, and the mlx-audio notes: https://github.com/Blaizzy/mlx-audio/blob/main/docs/models/tts/fish-drama3.md
19. Qwen3-ForcedAligner-0.6B: https://huggingface.co/Qwen/Qwen3-ForcedAligner-0.6B
20. Piper alignments: https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/ALIGNMENTS.md
21. Firefox's macOS speech backend (AVSpeechSynthesizer, `word` boundary events): https://searchfox.org/mozilla-central/source/dom/media/webspeech/synth/cocoa/OSXSpeechSynthesizerService.mm
22. Apple, `AVSpeechSynthesizer.write(_:toBufferCallback:toMarkerCallback:)`: https://developer.apple.com/documentation/avfaudio/avspeechsynthesizer/write(_:tobuffercallback:tomarkercallback:)
23. Apple macOS software licence, section F (system voices: personal, non-commercial): https://www.apple.com/legal/sla/
24. AppleVis, macOS Tahoe changes (Spoken Content renamed Read & Speak): https://www.applevis.com/blog/macos-tahoe-new-features-changes-improvements-bugs-blind-deafblind-low-vision-users
25. Firefox 147 enables WebGPU on Apple Silicon: https://alternativeto.net/news/2026/1/firefox-147-brings-apple-silicon-webgpu-support-improved-video-playback-and-pip-and-more/
26. sherpa-onnx (Node bindings, no TTS timestamps): https://github.com/k2-fsa/sherpa-onnx
27. Local benchmark, 15 Oct 2026: Kokoro (fp32 and q8, Node, and onnxruntime-web WebAssembly), Pocket TTS, Kitten 0.8 and Piper. It used a 121-word passage from the AI-safety lane and a 24-word stress sentence, with word times checked against Parakeet-TDT 0.6B. It ran on an overloaded 4-vCPU Xeon, so Mac figures are estimates. The scripts are not in this repository.
