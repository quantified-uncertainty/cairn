// Read-aloud audio from Gemini's TTS model (the browser's own voice needs no
// server). Ported from Starfleet's server/app/speech.py.
//
//   GET  /tts   -> { enabled, model, voices, all, defaultVoice }: is a key set, which voices
//   POST /tts   { text, voice?, model?, priority? } -> audio/wav, or { error, code }
//
// Needs GEMINI_API_KEY (or GOOGLE_API_KEY). STACKS_TTS_MODEL picks the model
// (default gemini-3.8-flash-tts, Starfleet's), STACKS_TTS_URL a gateway or a
// test double in place of Google's API.
//
// - The passage and nothing else is sent: 3.8 reads its input as a transcript,
//   so a lead-in like "Read aloud:" would be read aloud.
// - Google answers 24 kHz 16-bit PCM (headerless audio/L16, or a WAV from 3.8);
//   it is served as WAV (no MP3 encoder without a new dependency). The browser
//   times words off this same WAV (silence-based, readaloud.js).
// - Made once: cached on disk under CACHE/tts/ by sha256(model|voice|text);
//   two asks for one passage in flight share one call.
// - Checked, not trusted: an answer with no audio, or audio too short for its
//   text (a truncation seen in the field), is retried; so are 5xx and
//   timeouts. A 429 is reported at once (the client backs off).
// - Two lanes: the passage a listener waits for ("now") never queues behind
//   ones made ahead ("ahead"). Parallel requests measured no slower than one.
// - A slow attempt is hedged: the same request again, the first answer kept.
// - An hourly character budget bounds a runaway (STACKS_TTS_HOURLY_CHARS).
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, utimesSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

const BASE = (process.env.STACKS_TTS_URL || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
const MODEL = process.env.STACKS_TTS_MODEL || 'gemini-3.8-flash-tts';
const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

// Starfleet's eight (no two share a style; Gacrux loses the fewest words when
// played fast), default first; any of Google's thirty prebuilt names is accepted.
const VOICES = ['Kore', 'Puck', 'Charon', 'Aoede', 'Gacrux', 'Achird', 'Autonoe', 'Erinome'];
const ALL = new Set([...VOICES, 'Zephyr', 'Fenrir', 'Leda', 'Orus', 'Callirrhoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
  'Despina', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Pulcherrima', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat']);

const MAX_CHARS = 4000;
const MAX_CHARS_PER_SECOND = 25; // faster than any voice: shorter audio is a truncated answer
const ATTEMPTS = 3;
const LANES = { now: 4, ahead: 6 };
const HOURLY = Number(process.env.STACKS_TTS_HOURLY_CHARS) || 1_000_000; // ~18 h of speech, ~$35
const DISK_MAX = 2 * 1024 ** 3; // ~12 h of 24 kHz WAV

/** Measured on 3.8 Flash TTS: about 2.4 s plus 16 ms a character. */
const expected = (chars) => 2.4 + 0.016 * chars;
const attemptTimeout = (chars) => Math.round(Math.min(30, expected(chars) * 3 + 6) * 1000);
const hedgeAfter = (chars) => Math.round(Math.max(4, expected(chars) * 1.6) * 1000);

const err = (message, code, status, retry = false) => Object.assign(new Error(message), { code, status, retry });

/** Raw little-endian PCM wrapped in a RIFF header. */
function wav(pcm, rate = 24000, channels = 1, bits = 16) {
  const h = Buffer.alloc(44); const block = channels * bits / 8;
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * block, 28); h.writeUInt16LE(block, 32); h.writeUInt16LE(bits, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
/** Seconds of audio in a 16-bit WAV, from its own header. */
function seconds(audio) {
  try {
    const rate = audio.readUInt32LE(24), ch = audio.readUInt16LE(22);
    const at = audio.indexOf('data', 12);
    return (audio.length - (at >= 0 ? at + 8 : 44)) / (rate * ch * 2);
  } catch { return 0; }
}
const spokenChars = (t) => (t.match(/[\p{L}\p{N}]/gu) || []).length;

function semaphore(n) {
  let free = n; const waiting = [];
  return async (fn) => {
    if (free > 0) free--; else await new Promise((r) => waiting.push(r));
    try { return await fn(); } finally { const next = waiting.shift(); if (next) next(); else free++; }
  };
}

export default function (app) {
  const dir = join(app.CACHE, 'tts');
  mkdirSync(dir, { recursive: true });
  const gates = { now: semaphore(LANES.now), ahead: semaphore(LANES.ahead) };
  const inflight = new Map(); // cache key -> { p, waiting }
  const spent = [];           // [time, chars] in the last hour
  const stats = { ttsMade: 0, ttsHits: 0, ttsFailed: 0 };
  let diskBytes = null;

  const cacheKey = (model, voice, text) => createHash('sha256').update(`${model}|${voice}|${text}`).digest('hex');
  const fileOf = (k) => join(dir, k + '.wav');

  function budgetLeft() {
    const now = Date.now();
    while (spent.length && now - spent[0][0] > 3600e3) spent.shift();
    return HOURLY - spent.reduce((n, [, c]) => n + c, 0);
  }
  function charge(chars) {
    if (budgetLeft() < chars) throw err(`Read-aloud used its hourly budget here (${HOURLY.toLocaleString()} characters); it frees up as the hour rolls on`, 'budget', 429);
    spent.push([Date.now(), chars]);
  }
  function refund(chars) { const k = spent.findLastIndex(([, c]) => c === chars); if (k >= 0) spent.splice(k, 1); }

  function keep(k, audio) {
    try {
      const tmp = fileOf(k) + '.tmp';
      writeFileSync(tmp, audio); renameSync(tmp, fileOf(k));
      if (diskBytes != null) diskBytes += audio.length;
      if (diskBytes == null || diskBytes > DISK_MAX) prune();
    } catch (e) { console.warn('tts: could not cache a passage:', e.message); }
  }
  /** Let go of the least recently heard passages past DISK_MAX. */
  function prune() {
    const files = readdirSync(dir).filter((f) => f.endsWith('.wav')).map((f) => { const s = statSync(join(dir, f)); return { f, t: s.mtimeMs, n: s.size }; });
    diskBytes = files.reduce((n, x) => n + x.n, 0);
    if (diskBytes <= DISK_MAX) return;
    for (const x of files.sort((a, b) => a.t - b.t)) {
      try { unlinkSync(join(dir, x.f)); diskBytes -= x.n; } catch { /* gone */ }
      if (diskBytes < DISK_MAX * 0.8) break;
    }
  }

  /** One request to Google; resolves to a playable WAV or throws (err.retry marks what a retry may fix). */
  async function once(text, voice, model, signal) {
    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    };
    let res;
    try {
      res = await fetch(`${BASE}/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey() },
        body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(attemptTimeout(text.length))]),
      });
    } catch (e) {
      if (signal.aborted) throw err('cancelled', 'cancelled', 499);
      throw err(e.name === 'TimeoutError' ? 'Google took too long to answer' : `Could not reach Google (${e.cause?.code || e.message})`, 'failed', 502, true);
    }
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      let detail = raw.slice(0, 200); try { detail = JSON.parse(raw).error.message || detail; } catch { /* not JSON */ }
      const msg = `Google answered ${res.status}: ${detail}`;
      if (res.status === 429) throw err(msg, 'busy', 429);
      throw err(msg, 'failed', 502, res.status >= 500);
    }
    let j; try { j = await res.json(); } catch { throw err('Google answered with something that is not JSON', 'failed', 502, true); }
    const cand = j?.candidates?.[0];
    const part = cand?.content?.parts?.find((p) => p?.inlineData?.data)?.inlineData;
    if (!part) throw err(`Google answered without audio (finish: ${cand?.finishReason || 'unknown'})`, 'failed', 502, true);
    const raw = Buffer.from(part.data, 'base64');
    // 3.8 sends its own RIFF header; the previews sent bare audio/L16;rate=24000.
    const audio = raw.subarray(0, 4).toString('latin1') === 'RIFF' ? raw : wav(raw, Number(/rate=(\d+)/.exec(part.mimeType || '')?.[1]) || 24000);
    const s = seconds(audio);
    if (s <= 0.2 || spokenChars(text) / s > MAX_CHARS_PER_SECOND) throw err(`Google's audio was cut short (${s.toFixed(1)} s for ${text.length} characters)`, 'failed', 502, true);
    return audio;
  }

  /** One attempt, and the same again if it is slow; the first good answer wins, the other is aborted. */
  async function hedged(text, voice, model) {
    const a = new AbortController(), b = new AbortController();
    const first = once(text, voice, model, a.signal);
    let t; const slow = new Promise((r) => { t = setTimeout(() => r('slow'), hedgeAfter(text.length)); });
    const r = await Promise.race([first.then((v) => ({ v }), (e) => ({ e })), slow]);
    clearTimeout(t);
    if (r !== 'slow') { if (r.e) throw r.e; return r.v; }
    try { charge(text.length); } catch { return first; } // no budget for a second: wait on the first
    const second = once(text, voice, model, b.signal);
    try {
      return await Promise.any([first.then((v) => { b.abort(); return v; }), second.then((v) => { a.abort(); return v; })]);
    } catch (agg) {
      throw agg.errors.find((e) => e.code === 'busy') || agg.errors.find((e) => e.code !== 'cancelled') || agg.errors[0];
    }
  }

  async function synthesize(text, voice, model, priority, job) {
    if (!apiKey()) throw err('Gemini voices need GEMINI_API_KEY (or GOOGLE_API_KEY) set where the server runs', 'no_key', 503);
    return gates[priority === 'now' ? 'now' : 'ahead'](async () => {
      for (let n = 1; ; n++) {
        // Nobody is waiting any more (a skip, a stop): do not spend the quota.
        if (job.waiting <= 0) throw err('cancelled', 'cancelled', 499);
        charge(text.length);
        try { return await hedged(text, voice, model); } catch (e) {
          if (e.code === 'busy') refund(text.length); // Google's quota answer made and cost nothing
          if (!e.retry || n >= ATTEMPTS) throw e;
          console.warn(`tts: attempt ${n} failed (${e.message}); retrying`);
          await new Promise((r) => setTimeout(r, 500 * n));
        }
      }
    });
  }

  app.route('GET', '/tts', (req, res) => app.json(res, { enabled: !!apiKey(), model: MODEL, voices: VOICES, all: [...ALL], defaultVoice: VOICES[0] }));

  app.route('POST', '/tts', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON', code: 'bad' }, 400); }
    const text = String(b.text || '').trim();
    const voice = ALL.has(b.voice) ? b.voice : VOICES[0];
    const model = /^[\w.-]{1,80}$/.test(b.model || '') ? b.model : MODEL;
    if (!text || text.length > MAX_CHARS) return app.json(res, { error: `text must be 1-${MAX_CHARS} characters`, code: 'bad' }, 400);
    const k = cacheKey(model, voice, text); const f = fileOf(k);
    const answer = (audio, hit) => {
      res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': audio.length, 'X-TTS-Cache': hit ? 'hit' : 'miss', 'Cache-Control': 'private, max-age=86400' });
      res.end(audio);
    };
    if (existsSync(f)) {
      stats.ttsHits++;
      try { const now = new Date(); utimesSync(f, now, now); } catch { /* fine */ }
      return answer(readFileSync(f), true);
    }
    let job = inflight.get(k);
    if (job) job.waiting++;
    else {
      job = { waiting: 1 }; // counted before the job starts: it checks for listeners at once
      job.p = synthesize(text, voice, model, b.priority, job)
        .then((audio) => { keep(k, audio); stats.ttsMade++; return audio; })
        .finally(() => inflight.delete(k));
      job.p.catch(() => {});
      inflight.set(k, job);
    }
    let left = false;
    res.on('close', () => { if (!res.writableEnded && !left) { left = true; job.waiting--; } });
    try {
      const audio = await job.p;
      if (!left) answer(audio, false);
    } catch (e) {
      if (e.code !== 'cancelled') { stats.ttsFailed++; console.warn('tts:', e.message); }
      if (!left && !res.headersSent) app.json(res, { error: e.message, code: e.code || 'failed' }, e.status || 502);
    } finally { if (!left) { left = true; job.waiting--; } }
  });

  app.status(() => ({ tts: !!apiKey(), ...stats }));
}
