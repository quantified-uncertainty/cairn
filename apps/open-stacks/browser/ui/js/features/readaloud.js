// Read aloud as a mode. The voice reads the page's own words, the word being
// said is lit, the pages follow the voice, and while the mode is on the voice
// is the main focus: a large player sits under the pages (the pages shrink to
// make room, so it never covers the text) and the keys, the wheel and clicks
// move the voice instead of the pages. Ported from Starfleet v3
// (web/src/readAloud/*.ts, components/readAloud/ReadAloud.tsx).
//
// Starting: v (or Read in the top bar) reads from the first word on screen (the
// first word of the visible columns, or of the first page on screen), without
// moving the view; Alt+click a word reads from that word. In the mode:
//   click a word          the voice goes there at once. A link reads too; click
//                         it again (or Cmd/Ctrl/Shift+click it) to follow it
//   ← →, h l, the wheel   back / forward a sentence; hold a key to skip faster
//   Shift+← →             back / forward a paragraph
//   ↑ ↓  (< >)            faster / slower
//   Space, v              pause / play
//   Esc, V, ×             leave the mode
//   j k                   another item: the mode ends, or with "Next item" on
//                         the reading goes on there (and at the end of an item)
// The pages turn when the spoken word leaves the screen; a page the reader turns
// holds that for HOLD_MS.
//
// Voices are engines (registerEngine, exported):
//   { id, label, kind: 'events' | 'audio', sizes: [characters per passage, the
//     last repeating], voices() -> [{ id, label, group? }], available() -> '' | why not,
//     speak(...) }
//   events: speak({ text, voice, rate, onstart, onword(charIndex), onend, onerror(code) })
//           -> { stop(), rate?, key?, startMs? }; also cancel(). The browser's
//           speechSynthesis, whose boundary events say which word it is on.
//   audio:  speak({ text, voice, priority: 'now' | 'ahead', signal, passage })
//           -> Promise<{ buf | blob | url, type?, wordTimes?: [{ start: char, at: seconds }] }>.
//           Gemini (POST /tts, server/routes/55-tts.mjs). Played by one <audio>
//           at the reading speed; passages ahead are made while one plays.
//           Without wordTimes, words are placed by the audio's own pauses
//           (16-bit WAV, timeWords) or by characters.
// A local voice (Kokoro-82M through kokoro-js, a Mac server voice) is one more
// 'audio' engine: registerEngine({ id: 'kokoro', label: 'Kokoro', kind: 'audio', ... }).
//
// What is read: flow documents give DOM words (code blocks and footnote marks
// skipped, a URL said as "a link"); a PDF page is read from its pdf.js text
// (line-end hyphens joined, page numbers and sideways margin stamps dropped,
// paragraphs found from the line layout) and lined up with the text layer's
// word spans (features/textlayer.js pageModel; data-wi); a scan reads its OCR
// word boxes the same way, or with none, its djvu.txt share by estimate, unlit.
// Words are cut into sentences (navigation, the lit sentence) and into
// passages of whole sentences (what an engine says at once).
import { $, h, P, store, on, registerKey, keyHelp, toast, sleep } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { isFlow, openDoc } from '../docs.js';
import { live } from '../flow.js';
import { highlight } from '../text.js';
import { showFeed } from '../feed.js';
import { go } from '../nav.js';

// ==== pure: passages and word timing (no DOM; the node unit test runs this block) ====
export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
/** Passage sizes in characters, the last one repeating. Browser: under the
 *  ~15 s after which Chrome's online voices stop mid-utterance. Gemini: a ramp,
 *  so each passage can be made while the one before it plays (Starfleet
 *  measured ~2.4 s + 16 ms a character to make; ~15 characters a second said). */
export const SIZES = { browser: [160, 180], gemini: [120, 200, 320, 600] };

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const FOOTMARK = new RegExp(`^(?:\\[\\^?\\d{1,3}(?:[,–-]\\s?\\d{1,3})*\\]|\\^\\d{1,3}|[${SUP}]+)$`);
const SUP_TAIL = new RegExp(`[${SUP}]+(?=[^\\p{L}\\p{N}]*$)`, 'u');
/** What the voice says for one word on the page: '' for a footnote mark, "a link" for a URL. */
export function spokenOf(t) {
  if (FOOTMARK.test(t)) return '';
  t = t.replace(/\[\^?\d{1,3}\]/g, '').replace(SUP_TAIL, '');
  if (/(?:https?:\/\/|www\.)\S/i.test(t)) t = t.replace(/(?:https?:\/\/|www\.)[^\s<>"”’)\]]+/gi, 'a link');
  return t;
}

const ENDS = /[.!?…]["'”’)\]]*$/;          // ends a sentence...
const ABBR = /^[("'“‘[]*(?:e\.g|i\.e|etc|vs|cf|al|Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|Fig|Figs|Eq|Eqs|No|Vol|pp|ch|Sec|approx|resp|viz|ca)\.$/i;
const INITIAL = /^[("'“‘[]*[A-Z]\.$/;      // ...unless it is an abbreviation or an initial
const CLOSED = /[.!?:;…]["'”’)\]]*$/;      // a voice pauses after this

/** Sentences of words[from..to) as runs of spoken tokens { say, j, glue }.
 *  A word is { text, say?, para?, glue? }: `say` replaces spokenOf(text) (a
 *  line-end hyphen dropped); a change of `para` (paragraph, heading, list item,
 *  cell) ends a sentence, with a full stop if it has none, so the voice pauses
 *  after a heading; `glue` says the next word continues this one with no space
 *  ("<em>word</em>s"). */
function cutSentences(words, from, to) {
  const sents = []; let cur = [];
  const close = (dot) => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    if (dot && !CLOSED.test(last.say)) last.say += '.';
    sents.push(cur); cur = [];
  };
  for (let j = from; j < to; j++) {
    const w = words[j]; const say = w.say ?? spokenOf(w.text);
    if (say) cur.push({ say, j, glue: !!w.glue });
    const next = words[j + 1];
    if (!next || j + 1 >= to) close(!!next && next.para !== w.para); // the end of the words, or of this chunk of them
    else if (next.para !== w.para) close(true);
    else if (say && !w.glue && ENDS.test(say) && !ABBR.test(say) && !INITIAL.test(say)) close(false);
  }
  return sents;
}
/** The sentences of words[from..to) as [first word said, last word said]. */
export function sentencesOf(words, from = 0, to = words.length) {
  return cutSentences(words, from, to).map((s) => [s[0].j, s[s.length - 1].j]);
}

/** Cut words[from..to) into passages of whole sentences (see cutSentences). A
 *  sentence longer than a passage is cut at word boundaries. `first` continues
 *  a size ramp. Returns [{ text, toks: [{ at, end, j, s, g }], sents: [[j0, j1]] }]:
 *  each spoken token knows its character span, its page word j, its sentence s
 *  (the page words of the whole sentence, even one cut across passages), and
 *  whether it is glued to the token before it (g). */
export function buildPassages(words, from, to, sizes, first = 0) {
  const sents = cutSentences(words, from, to);
  const out = []; let p = null;
  const size = () => sizes[Math.min(first + out.length, sizes.length - 1)];
  const flush = () => { if (p?.toks.length) out.push(p); p = null; };
  for (const s of sents) {
    const len = s.reduce((n, t) => n + t.say.length + 1, -1);
    if (p && p.text.length + 1 + len > size()) flush();
    let si = -1, glued = false;
    for (const t of s) {
      p ||= { text: '', toks: [], sents: [] };
      if (si >= 0 && !glued && p.text.length + 1 + t.say.length > size()) { flush(); p = { text: '', toks: [], sents: [] }; si = -1; }
      if (si < 0) { si = p.sents.length; p.sents.push([s[0].j, s[s.length - 1].j]); } // the whole sentence, even when cut
      if (p.text && !glued) p.text += ' ';
      const at = p.text.length; p.text += t.say;
      p.toks.push({ at, end: p.text.length, j: t.j, s: si, g: glued });
      glued = t.glue;
    }
  }
  flush();
  return out;
}

/** The token at character c of a passage: the last one starting at or before it. */
export function tokAt(p, c) {
  let lo = 0, hi = p.toks.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (p.toks[m].at <= c) lo = m; else hi = m - 1; }
  return lo;
}

/** The words an audio timing places: glued tokens joined, punctuation-only ones left out. */
export function timingWords(p) {
  const out = [];
  for (const t of p.toks) {
    if (t.g && out.length) { out[out.length - 1].end = t.end; continue; }
    if (/[\p{L}\p{N}]/u.test(p.text.slice(t.at, t.end))) out.push({ start: t.at, end: t.end });
  }
  return out;
}

// --- when each word of an audio passage is said, read off the audio (readAloudTiming.ts) ---
// The audio says where the voice is SILENT. Find the pauses (runs of quiet
// frames relative to the passage's own loudness), decide which word gap each
// pause is (a small dynamic programme preferring punctuation and stretches
// whose length fits their syllables), then space words by syllables inside
// each stretch. Starfleet measured 0.17 s mean error against Whisper.
const PAUSE_MS = 90;  // plosives stop the voice 20-60 ms inside a word; Gemini's shortest pause measured 120 ms
const FRAME_MS = 10;

/** The 16-bit mono PCM in a WAV, or null. */
export function parseWav(buf) {
  const v = new DataView(buf);
  if (buf.byteLength < 44 || v.getUint32(0, false) !== 0x52494646) return null;
  let rate = 0, bits = 0, ch = 0, at = 12;
  while (at + 8 <= buf.byteLength) {
    const id = v.getUint32(at, false), size = v.getUint32(at + 4, true), body = at + 8;
    if (id === 0x666d7420) { ch = v.getUint16(body + 2, true); rate = v.getUint32(body + 4, true); bits = v.getUint16(body + 14, true); }
    else if (id === 0x64617461) {
      if (bits !== 16 || ch !== 1 || !rate) return null;
      const len = Math.min(size, buf.byteLength - body) & ~1; // a streamed header may say 0xFFFFFFFF
      return { samples: new Int16Array(buf.slice(body, body + len)), rate };
    }
    at = body + size + (size & 1);
  }
  return null;
}

/** Silent stretches in seconds, lead-in and tail included. */
export function silences(pcm) {
  const n = Math.max(1, Math.round((pcm.rate * FRAME_MS) / 1000));
  const frames = Math.floor(pcm.samples.length / n);
  if (!frames) return [];
  const rms = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * n; i < (f + 1) * n; i++) sum += pcm.samples[i] * pcm.samples[i];
    rms[f] = Math.sqrt(sum / n);
  }
  // The 95th-percentile frame stands for "speaking"; under 6% of it is silence.
  const loud = Float64Array.from(rms).sort()[Math.min(frames - 1, Math.floor(frames * 0.95))];
  const quiet = loud * 0.06, min = Math.ceil(PAUSE_MS / FRAME_MS), out = [];
  for (let f = 0; f < frames;) {
    if (rms[f] > quiet) { f++; continue; }
    let g = f; while (g < frames && rms[g] <= quiet) g++;
    if (g - f >= min || f === 0 || g === frames) out.push({ start: (f * FRAME_MS) / 1000, end: (g * FRAME_MS) / 1000 });
    f = g;
  }
  return out;
}

/** Roughly how many syllables a word takes to say: vowel groups, a digit each, one at least. */
export function syllables(word) {
  const w = word.toLowerCase();
  const digits = (w.match(/\d/g) || []).length;
  const groups = (w.replace(/\d/g, '').match(/[aeiouyáéíóúàèìòùäëïöü]+/g) || []).length;
  const silentE = /[^aeiouy]e$/.test(w) && groups > 1 ? 1 : 0;
  const bare = groups === 0 && digits === 0 ? Math.ceil(w.replace(/[^a-z]/g, '').length / 2) : 0; // an acronym
  return Math.max(1, groups - silentE + digits + bare);
}

/** How likely a pause is between two words, by the text between them (lower = likelier). */
function gapPull(text, end, next) {
  const between = text.slice(end, next);
  if (/[.!?…\n]/.test(between)) return 0;
  if (/[,;:—–()]/.test(between)) return 0.25;
  return 1.6;
}

/** Each word ({ start, end } in `text`) with when it is said ({ start, at }),
 *  in audio with these quiet stretches lasting `duration` seconds. */
export function timeWords(text, words, quiet, duration) {
  if (!words.length || duration <= 0) return [];
  const lead = quiet.length && quiet[0].start <= 0.02 ? quiet[0].end : 0;
  const last = quiet[quiet.length - 1];
  const tail = last && last.end >= duration - 0.02 && last !== quiet[0] ? last.start : duration;
  const inner = quiet.filter((q) => q.start > lead + 0.01 && q.end < tail - 0.01);
  const syl = words.map((w) => syllables(text.slice(w.start, w.end)));
  const sylBefore = [0];
  for (const s of syl) sylBefore.push(sylBefore[sylBefore.length - 1] + s);
  const voiced = Math.max(0.1, tail - lead - inner.reduce((n, q) => n + (q.end - q.start), 0));
  const perSyl = voiced / sylBefore[words.length];
  const gaps = words.length - 1;
  if (!inner.length || !gaps) return place(words, syl, [{ from: 0, to: words.length, t0: lead, t1: tail }]);
  // A silence may also be no gap at all (the stop inside "checked"): left
  // inside its stretch at a price that grows with its length.
  const k = inner.length;
  const skip = inner.map((q) => ((q.end - q.start) / 0.18) ** 2);
  const skipBefore = [0];
  for (const c of skip) skipBefore.push(skipBefore[skipBefore.length - 1] + c);
  const startAfter = (p) => (p < 0 ? lead : inner[p].end);
  const endBefore = (q) => (q >= k ? tail : inner[q].start);
  const quietBetween = (p, q) => { let d = 0; for (let i = p + 1; i < q; i++) d += inner[i].end - inner[i].start; return d; };
  const segCost = (a, b, p, q) => {
    if (b <= a) return Infinity;
    const want = (sylBefore[b] - sylBefore[a]) * perSyl;
    const got = Math.max(0.05, endBefore(q) - startAfter(p) - quietBetween(p, q));
    const r = Math.log(got / Math.max(0.05, want));
    return 2 * r * r;
  };
  const pull = (g) => gapPull(text, words[g].end, words[g + 1].start);
  // dp[q][g]: best cost with pause q used after word g.
  const dp = [], fromP = [], fromG = [];
  for (let q = 0; q < k; q++) {
    dp.push(new Float64Array(gaps).fill(Infinity)); fromP.push(new Int32Array(gaps).fill(-2)); fromG.push(new Int32Array(gaps).fill(-1));
    for (let g = 0; g < gaps; g++) {
      const here = pull(g);
      let best = segCost(0, g + 1, -1, q) + skipBefore[q] + here, bp = -1, bg = -1;
      for (let p = 0; p < q; p++) {
        const skipped = skipBefore[q] - skipBefore[p + 1];
        for (let hh = 0; hh < g; hh++) {
          if (dp[p][hh] === Infinity) continue;
          const c = dp[p][hh] + segCost(hh + 1, g + 1, p, q) + skipped + here;
          if (c < best) { best = c; bp = p; bg = hh; }
        }
      }
      dp[q][g] = best; fromP[q][g] = bp; fromG[q][g] = bg;
    }
  }
  let best = segCost(0, words.length, -1, k) + skipBefore[k], endP = -1, endG = -1;
  for (let p = 0; p < k; p++) {
    for (let g = 0; g < gaps; g++) {
      if (dp[p][g] === Infinity) continue;
      const c = dp[p][g] + segCost(g + 1, words.length, p, k) + (skipBefore[k] - skipBefore[p + 1]);
      if (c < best) { best = c; endP = p; endG = g; }
    }
  }
  const used = [];
  for (let p = endP, g = endG; p >= 0;) { used.unshift({ p, g }); const pp = fromP[p][g], gg = fromG[p][g]; p = pp; g = gg; }
  const segs = []; let from = 0, t0 = lead;
  for (const u of used) { segs.push({ from, to: u.g + 1, t0, t1: inner[u.p].start }); from = u.g + 1; t0 = inner[u.p].end; }
  segs.push({ from, to: words.length, t0, t1: tail });
  return place(words, syl, segs);
}
function place(words, syl, segs) {
  const out = [];
  for (const s of segs) {
    let total = 0; for (let w = s.from; w < s.to; w++) total += syl[w];
    let acc = 0;
    for (let w = s.from; w < s.to; w++) { out.push({ start: words[w].start, at: s.t0 + ((s.t1 - s.t0) * acc) / Math.max(1, total) }); acc += syl[w]; }
  }
  return out;
}
/** The character the voice is at, t seconds in: the start of the last word begun. */
export function charAtTime(timed, t) {
  if (!timed.length || t < timed[0].at) return timed[0]?.start ?? 0;
  let lo = 0, hi = timed.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (timed[m].at <= t) lo = m; else hi = m - 1; }
  return timed[lo].start;
}
/** When the voice reaches character c (to start the audio at a clicked word). */
export function timeAtChar(timed, c) {
  let best = timed[0]?.at ?? 0;
  for (const w of timed) { if (w.start > c) break; best = w.at; }
  return best;
}
// Before a passage's timing is ready: characters weighted by the pauses at punctuation.
const weight = (c) => (/[.!?]/.test(c) ? 8 : /[,;:—]/.test(c) ? 4 : 1);
export function charAtFraction(text, f) {
  let total = 0; for (const c of text) total += weight(c);
  const goal = Math.max(0, Math.min(1, f)) * total; let acc = 0;
  for (let i = 0; i < text.length; i++) { acc += weight(text[i]); if (acc >= goal) return i; }
  return Math.max(0, text.length - 1);
}
export function fractionAtChar(text, c) {
  let total = 0, before = 0;
  for (let i = 0; i < text.length; i++) { if (i < c) before += weight(text[i]); total += weight(text[i]); }
  return total ? before / total : 0;
}

// --- lining up two spellings of the same words (readAloud.ts align) ---
export const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
/** For each string of `a`, the index of the same one in `b`, or -1: pinned
 *  where three-word runs occur exactly once on each side (in agreeing order),
 *  matched word by word between the pins. */
export function align(a, b) {
  const out = new Array(a.length).fill(-1);
  const key = (ws, i) => `${ws[i]} ${ws[i + 1]} ${ws[i + 2]}`;
  const once = (ws) => { const m = new Map(); for (let i = 0; i + 2 < ws.length; i++) { const k = key(ws, i); m.set(k, m.has(k) ? -1 : i); } return m; };
  const inB = once(b), pairs = [];
  for (const [k, i] of once(a)) { const j = inB.get(k); if (i >= 0 && j >= 0) pairs.push([i, j]); }
  pairs.sort((x, y) => x[0] - y[0]);
  // the longest run of pins rising on both sides (patience sorting)
  const tails = [], prev = new Array(pairs.length).fill(-1);
  for (let k = 0; k < pairs.length; k++) {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (pairs[tails[m]][1] < pairs[k][1]) lo = m + 1; else hi = m; }
    if (lo > 0) prev[k] = tails[lo - 1];
    tails[lo] = k;
  }
  const pins = [];
  for (let k = tails.length ? tails[tails.length - 1] : -1; k >= 0; k = prev[k]) pins.unshift(pairs[k]);
  const fill = (s0, s1, p0, p1) => {
    const agree = (i, j, n) => {
      for (let k = 1; k <= n; k++) {
        if (i + k >= a.length || j + k >= b.length) return true;
        if ((i + k >= s1) !== (j + k >= p1) || a[i + k] !== b[j + k]) return false;
      }
      return true;
    };
    let cursor = p0;
    for (let i = s0; i < s1 && cursor < p1; i++) {
      const stop = Math.min(p1, cursor + 400);
      for (let j = cursor; j < stop; j++) {
        if (b[j] !== a[i]) continue;
        const ok = j === cursor ? (i > s0 && out[i - 1] === j - 1) || (i === s0 && j === p0) || agree(i, j, 1) : agree(i, j, 2);
        if (ok) { out[i] = j; cursor = j + 1; break; }
      }
    }
  };
  let s0 = 0, p0 = 0;
  for (const [i, j] of pins) {
    if (i < s0 || j < p0) continue;
    fill(s0, i, p0, j);
    for (let k = 0; k < 3; k++) out[i + k] = j + k;
    s0 = i + 3; p0 = j + 3;
  }
  fill(s0, a.length, p0, b.length);
  return out;
}
/** Give each reading word (`ws`, { text }) the indexes of the same word among a
 *  text layer's words (`layer`, strings) as `wi`: aligned, and a word the layer
 *  holds in two parts (a hyphen at a line end, two text runs) gets both. */
export function bindWi(ws, layer) {
  const ia = [], ib = [];
  ws.forEach((w, t) => { if (norm(w.text)) ia.push(t); });
  layer.forEach((s, t) => { if (norm(s)) ib.push(t); });
  const m = align(ia.map((t) => norm(ws[t].text)), ib.map((t) => norm(layer[t])));
  ia.forEach((t, x) => { if (m[x] >= 0) ws[t].wi = [ib[m[x]]]; });
  let next = 0;
  for (const w of ws) {
    if (w.wi) { next = w.wi[w.wi.length - 1] + 1; continue; }
    const n = norm(w.text);
    if (n && next + 1 < layer.length && norm(layer[next] + layer[next + 1]) === n) { w.wi = [next, next + 1]; next += 2; }
  }
  return ws;
}
// ==== end pure ====

// ---------- voices: the engine registry ----------
let bar = null, pill = null, noteTimer = 0; // the player and the Read button (built below)
const engines = new Map();
/** Add a voice engine (see the top of this file). Registering an id again replaces it. */
export function registerEngine(e) {
  engines.set(e.id, { kind: 'audio', sizes: SIZES.gemini, voices: () => [], available: () => '', ...e });
  if (bar) fillVoices();
}
export { engines as readAloudEngines };

const prefs = { rate: 1.5, engine: 'browser', browserVoice: '', geminiVoice: 'Kore', voices: {}, cont: false, ...store.get('readaloud', {}) };
const savePrefs = () => store.set('readaloud', prefs);
const voiceOf = (id) => (id === 'browser' ? prefs.browserVoice : id === 'gemini' ? prefs.geminiVoice : prefs.voices?.[id] ?? '');
function setVoicePref(id, v) {
  if (id === 'browser') prefs.browserVoice = v;
  else if (id === 'gemini') prefs.geminiVoice = v;
  else prefs.voices = { ...prefs.voices, [id]: v };
}

// The browser's voice (speechSynthesis).
const hasSynth = typeof speechSynthesis !== 'undefined';
const START_MS = 6000; // a browser voice that has not started by then has failed
const shortName = (v) => v.name.replace(/^(Microsoft|Google|Apple)\s+/, '').replace(/\s+Online.*$/, '').replace(/\s*\(.*\)$/, '').replace(/\s+-\s+.*$/, '');
// macOS voice quality: Premium > Enhanced > the rest. Firefox may drop the
// "(Premium)" suffix from names, but the voice URI keeps it
// (com.apple.voice.premium.en-US.Ava). Old MacinTalk and novelty voices go last.
const quality = (v) => { const t = (v.voiceURI + ' ' + v.name).toLowerCase(); return /premium/.test(t) ? 2 : /enhanced/.test(t) ? 1 : 0; };
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)\b/i;
const voiceLabel = (v) => shortName(v) + (quality(v) === 2 ? ' · Premium' : quality(v) === 1 ? ' · Enhanced' : '') + (v.localService ? '' : ' ☁');
function pickVoice(all, uri, rate) {
  const chosen = all.find((v) => v.voiceURI === uri);
  if (chosen) return chosen;
  // Chrome's online voices top out at 2x: above that, a local voice in the same language
  if (rate <= 2) return undefined;
  const base = (navigator.language || 'en').slice(0, 2);
  return all.find((v) => v.default && v.localService) || all.find((v) => v.localService && v.lang.toLowerCase().startsWith(base));
}
registerEngine({
  id: 'browser', label: 'This browser', kind: 'events', sizes: SIZES.browser, defaultLabel: 'Browser voice',
  available: () => (hasSynth ? '' : 'This browser has no speech voices'),
  voices() {
    const all = hasSynth ? speechSynthesis.getVoices() : [];
    const base = (navigator.language || 'en').slice(0, 2).toLowerCase();
    const mine = all.filter((v) => v.lang.toLowerCase().startsWith(base) || v.voiceURI === prefs.browserVoice)
      .sort((a, b) => quality(b) - quality(a) || (NOVELTY.test(a.name) - NOVELTY.test(b.name)) || a.name.localeCompare(b.name));
    const good = mine.filter((v) => !NOVELTY.test(shortName(v)) || quality(v) > 0);
    // With no choice made yet, use the best voice installed.
    if (!prefs.browserVoice && good[0] && quality(good[0]) > 0) prefs.browserVoice = good[0].voiceURI;
    return mine.map((v) => ({ id: v.voiceURI, label: voiceLabel(v), group: good.includes(v) ? '' : 'Older voices' }));
  },
  cancel() { if (hasSynth) speechSynthesis.cancel(); },
  speak({ text, voice, rate, onstart, onword, onend, onerror }) {
    const all = speechSynthesis.getVoices();
    const v = pickVoice(all, voice, rate);
    const u = new SpeechSynthesisUtterance(text);
    if (v) u.voice = v;
    u.lang = v?.lang || navigator.language || 'en-US';
    const online = v ? !v.localService : !!all.find((x) => x.default && !x.localService);
    u.rate = online ? Math.min(rate, 2) : rate;
    u.onstart = () => onstart();
    u.onboundary = (e) => { if (!e.name || e.name === 'word') onword(e.charIndex); };
    u.onend = () => onend();
    u.onerror = (e) => onerror(e.error);
    speechSynthesis.speak(u);
    // Chrome's online voices stop after ~15 s unless nudged.
    const keep = online ? setInterval(() => { if (speechSynthesis.speaking) { speechSynthesis.pause(); speechSynthesis.resume(); } }, 10000) : 0;
    return {
      rate: u.rate, key: v?.voiceURI || 'default', startMs: all.length ? START_MS : 3000,
      stop() { clearInterval(keep); u.onstart = u.onend = u.onerror = u.onboundary = null; },
    };
  },
});

// Gemini's voices (POST /tts).
let gem = { enabled: false, voices: [], model: '' };
fetch('/tts').then((r) => r.json()).then((j) => { gem = j; if (bar) fillVoices(); }).catch(() => {});
const GEM_VOICES = ['Kore', 'Puck', 'Charon', 'Aoede', 'Gacrux', 'Achird', 'Autonoe', 'Erinome'];
registerEngine({
  id: 'gemini', label: 'Gemini', kind: 'audio', sizes: SIZES.gemini,
  available: () => (gem.enabled ? '' : 'Gemini voices need GEMINI_API_KEY (or GOOGLE_API_KEY) set where the server runs'),
  voices: () => (gem.voices?.length ? gem.voices : GEM_VOICES).map((n) => ({ id: n, label: 'Gemini ' + n })),
  async speak({ text, voice, priority, signal }) {
    for (let n = 0; ; n++) {
      const res = await fetch('/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: voice || 'Kore', priority }), signal });
      if (res.ok) return { buf: await res.arrayBuffer(), type: res.headers.get('Content-Type') || 'audio/wav' };
      const j = await res.json().catch(() => ({}));
      // Google's minute quota: back off and ask again; the hourly budget is not worth asking again
      if (res.status === 429 && j.code === 'busy' && n < 2) { await sleep([3000, 8000][n]); if (signal.aborted) throw new Error('cancelled'); continue; }
      throw Object.assign(new Error(j.error || `HTTP ${res.status}`), { code: j.code, status: res.status });
    }
  },
});

/** The engine to read with: the chosen one if it can, else the browser's (saying why on `r`). */
function pickEngine(r) {
  const want = engines.get(prefs.engine);
  if (want && !want.available()) return want.id;
  const b = engines.get('browser');
  if (want && want.id !== 'browser') r.notice = `${want.available()}; using the browser’s voice.`;
  return b && !b.available() ? 'browser' : null;
}
const sizesOf = (id) => engines.get(id)?.sizes || SIZES.browser;

// ---------- the reading ----------
const LEAD_S = 0.06;   // light an audio word this much before it is heard
const HOLD_MS = 5000;  // a page the reader turns holds the follow this long (Starfleet)
const CPS = 15;        // characters a second a voice says at 1x

let mode = false;      // read-aloud mode: the player is up; keys, wheel and clicks move the voice
/** The reading of one item while the mode is on: { id, i, it, kind: 'flow'|'pdf'|'scan',
 *  eng, words, sents, cum (flow), spans (raster: page -> [a, b)), first, next, n,
 *  passages, index, tok, cur (the word lit), at/c (where the voice is: passage,
 *  character), playing, loading, notice, gen }. */
let R = null, sessions = 0;
let run = 0;           // bumped by every (re)start of speech; callbacks from an older run do nothing
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
let holdUntil = 0;     // Date.now() until which the pages do not follow (the reader turned one)
let settling = 0;      // performance.now() until which a turn of ours is on its way
let anchor = null;     // { id, j, slot }: keep flow word j in the same column slot across a relayout
let contFor = null;    // the item the reading goes on with, once it is on screen
let contT = 0;
let drawGen = 0;       // bumped when the drawn words change (relayout, text layers)
const lastAt = new Map(); // item id -> { j } (flow) or { page, wi }: where the reading stopped

function session(i, it, eng) {
  return {
    id: ++sessions, i, it, eng, kind: isFlow(it) ? 'flow' : it.kind === 'pdf' ? 'pdf' : 'scan',
    words: [], sents: [], cum: null, spans: new Map(), first: 0, next: 0, n: it.n || 1, paraNext: 0,
    passages: [], built: 0, index: 0, tok: 0, cur: 0, at: 0, c: 0,
    playing: true, loading: true, notice: '', gen: 0, approx: false, q: Promise.resolve(),
  };
}
/** Run fn after the reading's earlier loads, unless the reading has ended. */
function queue(r, fn) { const p = r.q.then(() => (R === r ? fn() : false)); r.q = p.catch(() => {}); return p; }

// --- flow documents: the words in the live columns ---
const SKIP = 'pre, script, style, .flow-title .m, sup, .ts-gap';
const PARA = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,dt,dd,figcaption,caption,pre,div,section,article,header,tr';
/** Every word of a flow layout as { text, page, para, node, a, b, glue? }: the
 *  words text.js gives, in order, as a text node and offsets. No Range is kept
 *  per word: every live Range is updated on every DOM change in the page, and
 *  tens of thousands of them made each change of the player cost ~100 ms. */
function collectFlow(L) {
  const words = [], paras = new Map();
  const walker = document.createTreeWalker(L.flow, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let open = false; // the last word ran to the end of its text node with nothing after it yet
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === 1) { if (/^(BR|IMG|SVG|HR)$/i.test(n.tagName)) open = false; continue; }
    const pe = n.parentElement;
    if (pe.closest(SKIP)) { open = false; continue; }
    const vp = pe.closest('[data-vp]'), blk = pe.closest(PARA);
    let para = paras.get(blk); if (para == null) paras.set(blk, (para = paras.size));
    const page = vp ? Number(vp.dataset.vp) : 0;
    let first = true;
    for (const m of n.data.matchAll(/\S+/g)) {
      // "<em>word</em>s": a word that runs on into the next text node with no space is said as one
      if (first && open && m.index === 0 && words[words.length - 1].para === para) words[words.length - 1].glue = true;
      first = false;
      words.push({ text: m[0], page, para, node: n, a: m.index, b: m.index + m[0].length });
    }
    if (/\S/.test(n.data)) open = !/\s$/.test(n.data);
    else open = false;
  }
  return words;
}
/** A fresh Range over a flow word (from..to: a run of words). */
function rangeOf(w, to = w) { const r = document.createRange(); r.setStart(w.node, w.a); r.setEnd(to.node, to.b); return r; }
const flowOn = (r) => r?.kind === 'flow' && live?.id === r.it.id;
/** The column a flow word is in (from its first line box), or null when it is not drawn. */
function colOf(w, L = live) {
  if (!w?.node || !L) return null;
  const rr = rangeOf(w).getClientRects()[0];
  if (!rr || (!rr.width && !rr.height)) return null;
  const fr = L.flow.getBoundingClientRect();
  return Math.max(0, Math.floor((rr.left - fr.left + L.g.gap / 2) / L.g.pitch));
}
/** The first word in column `s` or after (binary search; words not drawn are passed over). */
function firstFrom(words, s, L = live) {
  let lo = 0, hi = words.length - 1, ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    let q = m, c = null;
    while (q <= hi && (c = colOf(words[q], L)) == null) q++;
    if (c == null) { hi = m - 1; continue; }
    if (c >= s) { ans = q; hi = m - 1; } else lo = q + 1;
  }
  return ans >= 0 ? ans : Math.max(0, words.length - 1);
}
/** Tie the reading's words to a new layout of the same text (a relayout makes new DOM). */
function rebind(r, L) {
  const ws = collectFlow(L);
  if (ws.length !== r.words.length) { exitMode(false); toast('Reading stopped', { icon: 'circle-alert', kind: 'bad', sub: 'The text changed under it' }); return false; }
  ws.forEach((w, j) => { r.words[j].node = w.node; });
  drawGen++;
  return true;
}
/** After a relayout (the player coming or going), put the anchored word back in its column slot. */
function applyAnchor(L) {
  const a = anchor; anchor = null;
  const r = R && R.it.id === a.id && R.kind === 'flow' ? R : null;
  if (r && r.words[0] && !L.flow.contains(r.words[0].node) && !rebind(r, L)) return;
  const words = r ? r.words : collectFlow(L);
  const c = colOf(words[a.j], L); if (c == null) return;
  const i = current();
  // No slide from the start of the text: the new layout appears in place.
  L.flow.style.transition = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => { L.flow.style.transition = ''; }));
  const ns = Math.max(0, Math.min(L.n - 1, c - a.slot));
  if (ns === (state.start.get(i) ?? 0)) return;
  state.hist.set(i, []); // its columns changed: the turn history no longer applies
  state.start.set(i, ns); showFeed();
}
function anchorAt(r, j) {
  if (!flowOn(r) || !r.words[j]) return null;
  const c = colOf(r.words[j]); if (c == null) return null;
  const s = state.start.get(r.i) ?? 0;
  return { id: r.it.id, j, slot: Math.max(0, Math.min(live.g.cols - 1, c - s)) };
}

// --- raster pages: PDFs and scans ---
// features/textlayer.js: pageModel(it, k) gives the words its spans are made from
// (loaded lazily, so read-aloud still works on flow text without it).
const tlReady = import('./textlayer.js').catch(() => null);
const ENDS_LINE = /[.!?:…]["'”’)\]]*$/;
const isPageNo = (t) => /^\s*(\d{1,4}|[ivxlc]{1,7})\s*$/i.test(t);
/** A running head or foot ("382      BELL SYSTEM TECHNICAL JOURNAL"): the first
 *  line in the page's top tenth or the last in its bottom tenth, whose first or
 *  last piece ([x0, x1, text]) is a page number set well apart from the rest. A
 *  heading such as "1 Introduction" keeps the usual word gap and is read. */
function runningHead(lines, x, H) {
  const l = lines[x], ps = l?.parts || [];
  if (ps.length < 2 || !((x === 0 && l.top < H * 0.1) || (x === lines.length - 1 && l.bottom > H * 0.9))) return false;
  const [a, b] = ps, [y, z] = ps.slice(-2);
  return (isPageNo(a[2]) && b[0] - a[1] > 3 * l.h) || (isPageNo(z[2]) && z[0] - y[1] > 3 * l.h);
}
/** Paragraph numbers for lines { x0, x1, top, bottom, h, text } in reading order:
 *  a new one after a blank line, into or out of a heading, after a short line
 *  that ends a sentence, or at an indented first line. */
function paragraphs(lines, W) {
  const hs = lines.map((l) => l.h).sort((a, b) => a - b), mh = hs[hs.length >> 1] || 10;
  const colRight = (l) => { let m = l.x1; for (const o of lines) if (Math.abs(o.x0 - l.x0) < W * 0.15) m = Math.max(m, o.x1); return m; };
  let para = 0;
  return lines.map((l, x) => {
    const p = lines[x - 1];
    if (p) {
      const gap = l.top - p.bottom, ended = ENDS_LINE.test(p.text.trim());
      if ((gap > 0.9 * mh && gap < 12 * mh)
        || (l.h > mh * 1.2) !== (p.h > mh * 1.2)
        || (ended && p.x1 < colRight(p) - 1.5 * mh)
        || (ended && l.x0 > p.x0 + 0.8 * mh && l.x0 < p.x0 + 6 * mh)) para++;
    }
    return para;
  });
}
/** A PDF page's words from its pdf.js text (`tc`, with the page's view box):
 *  lines rebuilt, page numbers and sideways text left out, paragraphs found,
 *  line-end hyphens joined. */
async function pdfText(it, k) {
  const page = await (await openDoc(it)).pdf.getPage(k + 1);
  return { tc: await page.getTextContent(), view: page.view };
}
function pdfWords(tc, view, k) {
  const [vx0, vy0, vx1, vy1] = view, W = vx1 - vx0, H = vy1 - vy0;
  const lines = []; let L = null;
  for (const x of tc.items) {
    if (typeof x.str !== 'string') continue;
    const [, b, c, dd, e, f] = x.transform;
    if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01) { L = null; continue; } // sideways: margin stamps, axis labels
    const hgt = x.height || Math.abs(dd) || 10;
    if (x.str) {
      if (!L || Math.abs(f - L.y) > hgt * 0.5) { L = { y: f, h: hgt, x0: e, x1: e + (x.width || 0), text: '', parts: [] }; lines.push(L); }
      else if (L.text && !/\s$/.test(L.text) && !/^\s/.test(x.str) && e - L.x1 > hgt * 0.2) L.text += ' '; // pdf.js leaves some spaces implicit
      L.text += x.str; L.x1 = Math.max(L.x1, e + (x.width || 0)); L.h = Math.max(L.h, hgt);
      if (x.str.trim()) L.parts.push([e, e + (x.width || 0), x.str.trim()]);
    }
    if (x.hasEOL) L = null;
  }
  let body = lines.filter((l) => l.text.trim());
  body = body.filter((l, x) => !(isPageNo(l.text) && (x === 0 || x === body.length - 1 || l.y - vy0 < H * 0.08 || vy1 - l.y > H * 0.92)));
  for (const l of body) { l.top = vy1 - l.y - l.h; l.bottom = vy1 - l.y; } // PDF y grows upward
  body = body.filter((l, x, all) => !runningHead(all, x, H));
  const paras = paragraphs(body, W);
  const out = [];
  body.forEach((l, x) => {
    const ws = l.text.split(/\s+/).filter(Boolean);
    const last = out[out.length - 1];
    // A word broken at the line end with a hyphen is said whole.
    if (last && last.para === paras[x] && /\p{L}-$/u.test(last.text) && /^\p{Ll}/u.test(ws[0] || '')) last.text = last.text.slice(0, -1) + ws.shift();
    for (const t of ws) out.push({ text: t, page: k, para: paras[x] });
  });
  return out;
}
/** A scan page's words from its OCR word boxes (the text layer's own words). */
function ocrWords(m, k) {
  const ws = m.o.words || [], W = m.o.w || 1000, H = m.o.h || 1400;
  const lines = [];
  for (let j = 0; j < ws.length;) {
    let e = j; while (e < ws.length && ws[e].l === ws[j].l) e++;
    const seg = ws.slice(j, e);
    const top = Math.min(...seg.map((w) => w.y0)), bottom = Math.max(...seg.map((w) => w.y1));
    lines.push({ a: j, b: e, x0: Math.min(...seg.map((w) => w.x0)), x1: Math.max(...seg.map((w) => w.x1)), top, bottom, h: bottom - top, text: seg.map((w) => w.t).join(' ') });
    j = e;
  }
  const body = lines.filter((l, x) => !(isPageNo(l.text) && (x === 0 || x === lines.length - 1 || l.top < H * 0.08 || l.bottom > H * 0.92)))
    .filter((l, x, all) => { l.parts = ws.slice(l.a, l.b).map((w) => [w.x0, w.x1, w.t]); return !runningHead(all, x, H); });
  const paras = paragraphs(body, W);
  const out = [];
  body.forEach((l, x) => {
    for (let j = l.a; j < l.b; j++) out.push({ text: ws[j].t, page: k, para: paras[x], wi: [j] });
    const last = out[out.length - 1], nx = body[x + 1];
    if (last && nx && paras[x + 1] === paras[x] && /\p{L}-$/u.test(last.text) && /^\p{Ll}/u.test(ws[nx.a]?.t || '')) {
      last.say = spokenOf(last.text.slice(0, -1)); last.glue = true; // said whole with the next line's first word
    }
  });
  return out;
}
/** A scan page's OCR text by estimate: its share of the item's djvu.txt (no page breaks there). */
const ocr = new Map();
async function scanWords(it, k) {
  if (!ocr.has(it.ia)) ocr.set(it.ia, fetch(P(`https://archive.org/download/${it.ia}/${it.ia}_djvu.txt`)).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  const txt = await ocr.get(it.ia); if (!txt) return [];
  const n = it.n || 1, L = txt.length;
  const snap = (x) => { while (x > 0 && x < L && !/\s/.test(txt[x - 1])) x++; return x; };
  const a = snap(Math.floor((k / n) * L)), b = snap(Math.floor(((k + 1) / n) * L));
  const out = []; let para = 0;
  for (const m of txt.slice(a, b).matchAll(/\S+|\n\s*\n/g)) { if (m[0][0] === '\n') para++; else out.push({ text: m[0], page: k, para }); }
  return out;
}
/** The words of raster page k, each with `wi` (its text-layer span indexes) when known. */
async function pageWords(r, k) {
  const tl = await tlReady;
  if (r.kind === 'pdf') {
    // The text layer's page model holds the page's pdf.js text already: one parse for both.
    let m = null;
    if (tl?.pageModel) { try { m = await tl.pageModel(r.it, k); } catch { /* no layer for this page */ } }
    const { tc, view } = m?.tc && m.vp?.viewBox ? { tc: m.tc, view: m.vp.viewBox } : await pdfText(r.it, k);
    const ws = pdfWords(tc, view, k);
    if (m?.words) bindWi(ws, m.words.map((w) => w.t));
    return ws;
  }
  if (tl?.pageModel) { try { const m = await tl.pageModel(r.it, k); if (m.kind === 'ocr') return ocrWords(m, k); } catch { /* no word boxes */ } }
  if (!r.approx) { r.approx = true; r.notice = 'No OCR word boxes for this scan: reading its OCR text by estimate, without highlighting.'; paintBar(); }
  return scanWords(r.it, k);
}
/** Add page k's words after the loaded ones (its first paragraph continues the last). */
function append(r, k, ws) {
  const a = r.words.length, map = new Map();
  for (const w of ws) {
    let id = map.get(w.para);
    if (id == null) { id = !map.size && a ? r.words[a - 1].para : r.paraNext++; map.set(w.para, id); }
    w.para = id;
  }
  r.words.push(...ws);
  r.spans.set(k, [a, r.words.length]);
  r.next = k + 1;
  r.sents = sentencesOf(r.words);
}
/** Add page k's words before the loaded ones; every index moves up. */
function prepend(r, k, ws) {
  const m = ws.length, map = new Map(), lastLocal = ws[m - 1]?.para;
  for (const w of ws) {
    let id = map.get(w.para);
    if (id == null) { id = w.para === lastLocal && r.words.length ? r.words[0].para : r.paraNext++; map.set(w.para, id); }
    w.para = id;
  }
  r.words = ws.concat(r.words);
  for (const [kk, [a, b]] of r.spans) r.spans.set(kk, [a + m, b + m]);
  r.spans.set(k, [0, m]); r.first = k;
  r.cur += m; r.built += m; r.gen++;
  for (const p of r.passages) { for (const t of p.toks) t.j += m; for (const s of p.sents) { s[0] += m; s[1] += m; } }
  r.sents = sentencesOf(r.words);
}
const more = (r) => queue(r, async () => {
  if (r.next >= r.n) return false;
  const k = r.next, gen = r.gen;
  const ws = await pageWords(r, k);
  if (R !== r || r.gen !== gen || r.next !== k) return R === r;
  append(r, k, ws);
  return true;
});
const earlier = (r) => queue(r, async () => {
  if (r.first <= 0) return false;
  const k = r.first - 1, gen = r.gen;
  const ws = await pageWords(r, k);
  if (R !== r || r.gen !== gen || r.first !== k + 1) return R === r;
  prepend(r, k, ws);
  return true;
});
/** Read from page k afresh: its words (blank pages passed over, up to 12). */
const loadFrom = (r, k) => queue(r, async () => {
  r.gen++; const gen = r.gen;
  Object.assign(r, { words: [], sents: [], spans: new Map(), passages: [], built: 0, first: k, next: k, index: 0, tok: 0, cur: 0 });
  for (let tries = 0; r.next < r.n && tries < 12; tries++) {
    const kk = r.next;
    const ws = await pageWords(r, kk);
    if (R !== r || r.gen !== gen) return false;
    append(r, kk, ws);
    if (r.words.length) return true;
  }
  return r.words.length > 0;
});
/** Cut the next stretch of words (about CHUNK, to a sentence end) into passages. */
const CHUNK = 1500;
function extend(r) {
  if (r.built >= r.words.length) return false;
  const want = Math.min(r.words.length - 1, r.built + CHUNK);
  let si = sentIdx(r, want); if (r.sents[si] && r.sents[si][1] < want) si++;
  const s = r.sents[si];
  const to = Math.max(r.built + 1, s ? Math.min(r.words.length, s[1] + 1) : r.words.length);
  r.passages.push(...buildPassages(r.words, r.built, to, sizesOf(r.eng), r.passages.length));
  r.built = to;
  return true;
}
function ensureAhead(r) {
  while (r.passages.length - r.index <= 4 && extend(r)) { /* cut more */ }
  if (r.kind === 'flow' || r.next >= r.n || r.ahead) return;
  // the pages on screen (a click there is then instant), and enough ahead of the voice
  const onScreenEnd = (state.start.get(r.i) ?? 0) + Math.max(1, state.shown || 1);
  if (r.next >= onScreenEnd && r.passages.length - r.index > 4 && r.words.length - r.cur > 250) return;
  r.ahead = true;
  more(r).finally(() => { r.ahead = false; if (R !== r) return; ensureAhead(r); if (r.playing && engines.get(r.eng)?.kind === 'audio') prefetch(r.index); });
}
/** The reading's word on raster page k nearest text-layer word `wi` (else the page's first). */
function wordFor(r, k, wi) {
  const sp = r.spans.get(k); if (!sp) return null;
  let best = sp[0], bestWi = -1;
  if (wi != null) for (let j = sp[0]; j < sp[1]; j++) {
    const x = r.words[j].wi; if (!x) continue;
    if (x.includes(wi)) return j;
    if (x[0] < wi && x[0] > bestWi) { bestWi = x[0]; best = j; }
  }
  return best;
}

// ---------- starting and stopping ----------
/** Start reading the current item (and turn the mode on): from flow word `j`,
 *  from raster page `page` (text-layer word `wi` on it), else from where it
 *  stopped if that is on screen, else from the first word on screen. */
async function begin(opt = {}) {
  const i = current(), it = items[i];
  if (it == null || state.view !== 'feed') return;
  const flow = isFlow(it);
  if (flow && live?.id !== it.id) { toast('Still opening', { icon: 'loader-circle', kind: 'busy' }); return; }
  if (!flow && it.kind !== 'pdf' && it.kind !== 'scan') { toast('Nothing to read here', { icon: 'volume-x', kind: 'edge' }); return; }
  const probe = {};
  const eng = pickEngine(probe);
  if (!eng) { toast('No voice here', 3200, { icon: 'volume-x', kind: 'bad', sub: 'This browser has no speech voices; Gemini voices need GEMINI_API_KEY where the server runs' }); return; }
  endSession(true);
  clearTimeout(contT); contFor = null;
  const r = session(i, it, eng);
  r.notice = probe.notice || '';
  R = r;
  const prev = lastAt.get(it.id);
  if (flow) {
    r.words = collectFlow(live);
    if (!r.words.length) { R = null; toast('Nothing to read here', { icon: 'volume-x', kind: 'edge' }); if (mode) setMode(false); return; }
    r.sents = sentencesOf(r.words);
    r.cum = [0]; for (const w of r.words) r.cum.push(r.cum[r.cum.length - 1] + w.text.length + 1);
    let j = opt.j;
    if (j == null) j = prev?.j != null && r.words[prev.j] && onScreen(r, r.words[prev.j]) ? prev.j : firstFrom(r.words, state.start.get(i) ?? 0);
    if (!mode) anchor = anchorAt(r, j); // the player takes room: keep this word where it is
    setMode(true);
    moveTo(j);
    return;
  }
  // where the reader is, read before the player takes its room (the pages then shrink a little)
  const s = state.start.get(i) ?? 0, shown = Math.max(1, state.shown || 1);
  setMode(true);
  paintBar();
  let k = opt.page, wi = opt.wi;
  if (k == null && prev?.page != null && prev.page >= s && prev.page < s + shown) ({ page: k, wi } = prev);
  if (k == null) k = s;
  const ok = await loadFrom(r, k);
  if (R !== r) return;
  if (!ok) { exitMode(false); toast('Nothing to read here', { icon: 'volume-x', kind: 'edge', sub: 'No text on these pages' }); return; }
  moveTo(wordFor(r, r.spans.has(k) ? k : r.first, wi) ?? 0);
}

/** Stop the reading (the mode stays). */
function endSession(remember = true) {
  const r = R; if (!r) return;
  const w = r.words[r.cur];
  if (remember && w) lastAt.set(r.it.id, r.kind === 'flow' ? { j: r.cur } : { page: w.page, wi: w.wi?.[0] });
  else if (!remember) lastAt.delete(r.it.id);
  endHold(false);
  stopSpeech(); dropFetches();
  highlight('tts-word', []); highlight('tts-sentence', []); highlight('tts-hover', []);
  R = null; cancelAnimationFrame(raf); raf = 0;
  syncMedia();
}
/** Leave the mode: the reading stops and the pages take back the player's room. */
function exitMode(remember = true) {
  const r = R;
  if (r && items[current()]?.id === r.it.id) anchor = anchorAt(r, r.cur) || anchor;
  clearTimeout(contT); contFor = null;
  endSession(remember);
  setMode(false);
}
let perHeld = null; // pages a spread had when the mode began, kept while the player takes room
function setMode(on) {
  if (mode === on) { paintBar(); return; }
  mode = on;
  document.documentElement.classList.toggle('ra-on', on);
  // A shorter stage would fit another page and regroup the spread: keep the pages as they are.
  if (on && state.perAuto && !isFlow(items[current()])) { perHeld = state.per; state.perAuto = false; }
  else if (!on && perHeld != null) { if (!state.perAuto && state.per === perHeld) state.perAuto = true; perHeld = null; }
  if (on) buildBar();
  paintBar();
  if (state.view === 'feed') showFeed(); // the pages make room for the player, or take it back
}
/** The end of the item: on to the next one ("Next item" on), else out of the mode. */
function finish() {
  const nx = state.order[state.pos + 1];
  if (prefs.cont && nx != null) {
    endSession(false);
    contFor = items[nx].id; armCont();
    toast('Next item', { icon: 'skip-forward', kind: 'ok', sub: items[nx].t });
    go(state.pos + 1);
    return;
  }
  exitMode(false);
  toast('Finished reading', { icon: 'circle-check', kind: 'ok' });
}
function armCont() { clearTimeout(contT); contT = setTimeout(() => { if (mode && !R && contFor) exitMode(false); }, 20000); }

// ---------- moving the voice ----------
/** Put the voice on word j: lit at once, the pages brought to it, and (playing) speaking from there.
 *  speak: 'now', 'soon' (after the wheel settles) or 'none' (a held key skimming). */
function moveTo(j, { speak: how = 'now', play = false } = {}) {
  const r = R; if (!r || !r.words.length) return;
  j = Math.max(0, Math.min(r.words.length - 1, j));
  if (backTo && backTo.j !== j) backTo = null; // moved elsewhere: the next step back is a fresh one
  stopSpeech(); dropFetches();
  r.passages = []; r.built = j; extend(r);
  r.index = 0; r.tok = 0; r.at = 0; r.c = 0; r.loading = false;
  r.cur = r.passages[0]?.toks[0]?.j ?? j;
  if (play) r.playing = true;
  holdUntil = 0;
  paint();
  if (!r.passages.length) { r.index = -1; if (r.playing) advance(); paintBar(); return; } // nothing said on this page: on to the next
  if (r.playing) { if (how === 'now') speak(0); else if (how === 'soon') speakSoon(); }
  ensureAhead(r); paintBar(); syncMedia();
}
/** The sentence holding word j (index into r.sents). */
function sentIdx(r, j) {
  let lo = 0, hi = r.sents.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (r.sents[m][0] <= j) lo = m; else hi = m - 1; }
  return lo;
}
let navBusy = false, backTo = null; // { r, gen, j, t }: where the last step back went, and when
const edge = (msg, icon) => toast(msg, { icon, kind: 'edge' });
/** The last step back, while a press now counts as "again" (within 1.5 s, nothing else moved the voice since). */
const lastStepBack = (r) => (backTo && backTo.r === r && backTo.gen === r.gen && performance.now() - backTo.t < 1500 ? backTo : null);
const steppedBack = (r, j) => { backTo = { r, gen: r.gen, j, t: performance.now() }; };
/** Whether a step back should only go to the start of what is being read: the
 *  voice is a few words into it, and this is not a second press in a row. */
const restart = (r, a, o) => r.cur - a >= 3 && !o.repeat && !lastStepBack(r);
/** Where a step back counts from: the voice, or, pressed again, where the last
 *  step back went. A short sentence ("2.", a heading) is read before the next
 *  press, so counting from the voice would land on it again. */
function backFrom(r) { const b = lastStepBack(r); return b && b.j < r.cur ? b.j : r.cur; }
/** Back or forward a sentence. Back goes to the start of this sentence when the
 *  voice is a few words into it, else (or pressed again) to the one before;
 *  a held key skims on. */
async function stepSentence(d, o = {}) {
  const r = R; if (!r || navBusy || !r.sents.length) return;
  navBusy = true;
  try {
    let si = sentIdx(r, d < 0 ? backFrom(r) : r.cur), target = null;
    if (d < 0) {
      const a = r.sents[si][0], m0 = r.words.length;
      if (restart(r, a, o)) target = a;
      else if (si > 0) target = r.sents[si - 1][0];
      else if (r.kind !== 'flow' && r.first > 0 && await earlier(r)) { if (R !== r) return; si = sentIdx(r, a + r.words.length - m0); target = r.sents[Math.max(0, si - 1)][0]; }
      else { target = a; if (!o.repeat) edge('Start of document', 'arrow-up-to-line'); }
      if (target != null) steppedBack(r, target);
    } else {
      if (si + 1 >= r.sents.length && r.kind !== 'flow' && r.next < r.n) {
        for (let n = 0; n < 6 && si + 1 >= r.sents.length && r.next < r.n; n++) { if (!(await more(r)) || R !== r) return; si = sentIdx(r, r.cur); }
      }
      if (si + 1 < r.sents.length) target = r.sents[si + 1][0];
      else if (!o.repeat) edge('End of document', 'arrow-down-to-line');
    }
    if (target != null && R === r) moveTo(target, o);
  } finally { navBusy = false; }
}
/** Back or forward a paragraph (a heading, list item or table cell counts as one). */
async function stepPara(d, o = {}) {
  const r = R; if (!r || navBusy || !r.sents.length) return;
  navBusy = true;
  try {
    const start = (j) => { const p = r.words[j].para; while (j > 0 && r.words[j - 1].para === p) j--; return j; };
    const sentFrom = (j) => { const si = sentIdx(r, j), s = r.sents[si]; return s && s[0] >= j ? s[0] : r.sents[si + 1]?.[0] ?? s?.[0] ?? j; };
    let target = null;
    if (d < 0) {
      const from = backFrom(r);
      let a = start(from);
      const prev = o.repeat || !!lastStepBack(r) || from - sentFrom(a) < 3; // it goes to the paragraph before
      if (a === 0 && r.kind !== 'flow' && r.first > 0 && prev) {
        const m0 = r.words.length;
        if (await earlier(r)) { if (R !== r) return; a = start(r.words.length - m0); }
      }
      const fa = sentFrom(a);
      if (restart(r, fa, o)) target = fa;
      else if (a > 0) target = sentFrom(start(a - 1));
      else { target = fa; if (!o.repeat) edge('Start of document', 'arrow-up-to-line'); }
      steppedBack(r, target);
    } else {
      const p = r.words[r.cur].para; let j = r.cur;
      for (let n = 0; n < 6; n++) {
        while (j < r.words.length && r.words[j].para === p) j++;
        if (j < r.words.length || r.kind === 'flow' || r.next >= r.n) break;
        if (!(await more(r)) || R !== r) return;
      }
      if (j < r.words.length) target = sentFrom(j);
      else if (!o.repeat) edge('End of document', 'arrow-down-to-line');
    }
    if (target != null && R === r) moveTo(target, o);
  } finally { navBusy = false; }
}
/** Read from a share of the item (a click on the progress line). */
async function seekFraction(f) {
  const r = R; if (!r) return;
  f = Math.max(0, Math.min(1, f));
  holdUntil = 0;
  if (r.kind === 'flow') { const s = r.sents[sentIdx(r, Math.round(f * (r.words.length - 1)))]; moveTo(s ? s[0] : 0, { play: true }); return; }
  const k = Math.min(r.n - 1, Math.floor(f * r.n));
  if (!r.spans.has(k) && !(await loadFrom(r, k))) return;
  if (R !== r) return;
  moveTo(wordFor(r, r.spans.has(k) ? k : r.first, null) ?? 0, { play: true });
}
/** The voice to a raster word: page k, text-layer word wi (pages loaded on the way). */
async function rasterJump(r, k, wi) {
  if (!r.spans.has(k)) {
    if (k >= r.next && k - r.next < 6) { while (R === r && r.next <= k && r.next < r.n) if (!(await more(r))) break; }
    else if (k < r.first && r.first - k < 3) { while (R === r && r.first > k) if (!(await earlier(r))) break; }
    else await loadFrom(r, k);
  }
  if (R !== r) return;
  const j = wordFor(r, k, wi) ?? wordFor(r, r.first, null);
  if (j != null) moveTo(j, { play: true });
}

// ---------- speaking ----------
function speak(from = 0) {
  const r = R; if (!r?.passages[r.index]) return;
  if (engines.get(r.eng).kind === 'audio') speakAudio(from); else speakEvents(from);
  tick();
}
let soonT = 0, rateT = 0;
function speakSoon(ms = 280) { clearTimeout(soonT); soonT = setTimeout(() => { if (R?.playing) speak(0); }, ms); }
function stopSpeech() {
  run++; clearTimers(); clearTimeout(soonT); clearTimeout(rateT);
  if (B.h) { B.h.stop(); B.h = null; }
  for (const e of engines.values()) if (e.kind === 'events') e.cancel?.();
  if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
  audioAt = -1;
}
function pause() {
  const r = R; if (!r || !r.playing) return;
  position();
  r.playing = false; r.loading = false;
  if (engines.get(r.eng).kind === 'audio' && audio && audioAt === r.index) { run++; clearTimers(); audio.onended = audio.onerror = null; audio.pause(); }
  else stopSpeech();
  paintBar(); syncMedia();
}
function resume() {
  const r = R; if (!r || r.playing) return;
  r.notice = '';
  // The reader moved the pages away while paused: read from where they are now.
  const w = r.words[r.cur];
  if (w && !onScreen(r, w) && state.view === 'feed' && current() === r.i) {
    if (r.kind === 'flow') { moveTo(firstFrom(r.words, state.start.get(r.i) ?? 0), { play: true }); return; }
    r.playing = true; rasterJump(r, state.start.get(r.i) ?? 0, null); return;
  }
  r.playing = true;
  speak(engines.get(r.eng).kind === 'audio' ? null : resumePoint());
  paintBar(); syncMedia();
}
/** Stop and pause, saying why. */
function halt(msg) { pause(); if (R) { R.notice = msg; paintBar(); } }
async function advance() {
  const r = R; if (!r) return;
  const mine = run;
  for (let n = 0; r.index + 1 >= r.passages.length && n < 24; n++) { // cut more, then the next page (blank ones passed over)
    if (extend(r)) continue;
    if (r.kind === 'flow' || r.next >= r.n) break;
    r.loading = true; paintBar();
    await more(r);
    if (R !== r || mine !== run) return;
  }
  r.loading = false;
  if (r.index + 1 >= r.passages.length) return finish();
  r.index++; r.tok = 0; r.at = r.index; r.c = 0;
  keepWindow(r.index);
  if (r.playing) speak(0);
  ensureAhead(r); paintBar();
}
/** Where the current passage picks up: the start of the word it was on. */
function resumePoint() {
  const c = position(); const p = R.passages[R.index];
  return c == null || !p ? 0 : p.toks[tokAt(p, c)].at;
}
/** Another engine: cut the rest again from the word being read. */
function recut(engine) {
  const r = R; if (!r) return;
  r.eng = engine;
  moveTo(r.cur, { speak: r.playing ? 'now' : 'none' });
}

// --- events engines (the browser's voice) ---
const B = { run: -1, t0: 0, from: 0, rate: 1, bounded: false, retried: false, key: 'default', h: null };
const pace = new Map(); // voice -> characters a second measured at 1x (voices that report no words)
function speakEvents(from) {
  const mine = ++run;
  clearTimers(); if (B.h) { B.h.stop(); B.h = null; }
  engines.get(R.eng).cancel?.();
  R.at = R.index; R.c = from || 0;
  // a speak() in the same task as a cancel() is dropped on some Chrome builds
  later(() => { if (mine === run) utter(mine, from || 0); }, 30);
}
function utter(mine, from) {
  const r = R, p = r.passages[r.index], e = engines.get(r.eng);
  const at = from > 0 && p.text.slice(from).trim() ? from : 0;
  let started = false;
  Object.assign(B, { run: -1, from: at, bounded: false });
  let hnd;
  try {
    hnd = e.speak({
      text: p.text.slice(at), voice: voiceOf(e.id), rate: prefs.rate,
      onstart: () => { if (mine !== run) return; started = true; B.retried = false; B.run = mine; B.t0 = performance.now(); },
      onword: (ci) => { if (mine !== run) return; B.bounded = true; r.at = r.index; r.c = at + ci; },
      onend: () => {
        if (mine !== run) return;
        clearTimers();
        const took = (performance.now() - B.t0) / 1000, len = p.text.length - at;
        if (!B.bounded && started && len > 40 && took > 1) { // learn this voice's real pace
          const m = len / took / (B.rate || 1);
          if (m > 5 && m < 40) pace.set(B.key, pace.has(B.key) ? pace.get(B.key) * 0.6 + m * 0.4 : m);
        }
        B.h?.stop(); B.h = null;
        advance();
      },
      onerror: (err) => {
        if (mine !== run || err === 'interrupted' || err === 'canceled') return;
        clearTimers();
        if (err === 'not-allowed') halt('The browser wants a click on the page before it speaks; then press Space.');
        else voiceFailed(`failed (${err})`);
      },
    });
  } catch (err) { voiceFailed(`failed (${err.message})`); return; }
  B.h = hnd; B.rate = hnd?.rate || prefs.rate; B.key = hnd?.key || 'default';
  later(() => {
    if (mine !== run || started) return;
    if (!B.retried) { B.retried = true; speakEvents(at); } else { B.retried = false; voiceFailed('did not start'); }
  }, hnd?.startMs || START_MS);
}
function voiceFailed(what) {
  const others = [...engines.values()].filter((e) => e.id !== R?.eng && !e.available()).map((e) => e.label);
  halt(`The voice ${what}. ${others.length ? `Pick another voice (${others.join(', ')}).` : 'This system may have no speech voices; Gemini voices need GEMINI_API_KEY set where the server runs.'}`);
}

// --- audio engines (Gemini, local models) ---
let audio = null, audioAt = -1;
const fetches = new Map(); // passage index -> { p, ac, e?: { url, own, timed }, failed? }
function make(idx, priority = 'ahead') {
  const hit = fetches.get(idx); if (hit) return hit.p;
  const r = R, p = r.passages[idx], ac = new AbortController(), e = engines.get(r.eng);
  const f = { ac };
  f.p = (async () => {
    const out = await e.speak({ text: p.text, voice: voiceOf(e.id), priority, signal: ac.signal, passage: p });
    const blob = out.blob || (out.buf ? new Blob([out.buf], { type: out.type || 'audio/wav' }) : null);
    const res = { url: out.url || URL.createObjectURL(blob), own: !out.url, timed: null };
    if (out.wordTimes?.length) res.timed = out.wordTimes.map((w) => ({ start: w.start, at: w.at })).sort((a, b) => a.at - b.at);
    else if (out.buf) {
      setTimeout(() => { // off the play path: a few ms of arithmetic per passage
        try { const pcm = parseWav(out.buf); if (pcm) res.timed = timeWords(p.text, timingWords(p), silences(pcm), pcm.samples.length / pcm.rate); } catch (err) { console.warn('read aloud: timing', err); }
      }, 0);
    }
    return res;
  })();
  f.p.then((x) => { f.e = x; }, () => { f.failed = true; });
  fetches.set(idx, f);
  return f.p;
}
function dropFetch(idx) {
  const f = fetches.get(idx); if (!f) return;
  f.ac.abort(); f.p.then((x) => x.own && URL.revokeObjectURL(x.url), () => {});
  fetches.delete(idx);
}
function dropFetches() { for (const idx of [...fetches.keys()]) dropFetch(idx); }
const depth = () => (prefs.rate <= 3 ? 3 : 4);
function prefetch(at) { for (let k = at + 1; k <= at + depth() && k < R.passages.length; k++) make(k); }
/** After a move: let go of passages behind, and of requests in flight past the window. */
function keepWindow(from) { for (const [k, f] of [...fetches]) if (k < from || (k > from + depth() && !f.e)) dropFetch(k); }
function speakAudio(from) {
  const mine = ++run;
  clearTimers(); if (B.h) { B.h.stop(); B.h = null; }
  for (const e of engines.values()) if (e.kind === 'events') e.cancel?.();
  const r = R, at = r.index, f = fetches.get(at), label = engines.get(r.eng).label;
  if (audio && audioAt === at && audio.getAttribute('src') && f?.e) { // paused on this passage: carry on
    if (from != null) seekTo(f.e, at, from);
    prefetch(at);
    return playAudio(mine, at, f.e, null);
  }
  if (f?.e) { prefetch(at); return playAudio(mine, at, f.e, from); }
  if (f?.failed) dropFetch(at);
  r.at = at; r.c = from || 0;
  r.loading = true; paintBar();
  make(at, 'now').then((x) => {
    if (mine !== run || R !== r) return;
    r.loading = false; paintBar();
    playAudio(mine, at, x, from);
  }, (err) => {
    if (mine !== run || R !== r) return;
    r.loading = false;
    fallBack(err.code === 'busy' ? `${label}’s voice is over its quota for now` : `${label}’s voice failed (${err.message})`);
  });
  prefetch(at);
}
function seekTo(e, at, from) {
  const el = audio, go2 = () => { el.currentTime = e.timed?.length ? timeAtChar(e.timed, from) : fractionAtChar(R.passages[at].text, from) * (el.duration || 0); };
  if (el.readyState >= 1) go2(); else el.addEventListener('loadedmetadata', go2, { once: true });
}
function playAudio(mine, at, e, from) {
  const el = (audio ||= new Audio());
  if (el.getAttribute('src') !== e.url) el.src = e.url;
  audioAt = at;
  if (from > 0) seekTo(e, at, from);
  el.preservesPitch = true;
  el.playbackRate = prefs.rate;
  el.onended = () => {
    if (mine !== run) return;
    const f = fetches.get(at); fetches.delete(at);
    if (f?.e?.own) setTimeout(() => URL.revokeObjectURL(f.e.url), 2000);
    advance();
  };
  el.onerror = () => { if (mine === run) fallBack(`The audio would not play (${el.error?.message || el.error?.code || 'unknown'})`); };
  el.play().catch((err) => {
    if (mine !== run || err.name === 'AbortError') return;
    if (err.name === 'NotAllowedError') halt('The browser wants a click on the page before it plays; then press Space.');
    else fallBack(`The audio would not play (${err.message})`);
  });
  syncMedia();
}
/** An audio engine failed: the browser's voice reads the rest, and the player says why. */
function fallBack(why) {
  if (!R) return;
  if (engines.get('browser').available()) { halt(`${why}.`); return; }
  R.notice = `${why}; the browser’s voice reads the rest.`;
  recut('browser');
  paintBar(); syncMedia();
}

// ---------- where the voice is, lit on the page ----------
/** The character the voice is at in the current passage, or null. */
function position() {
  const r = R; const p = r?.passages[r.index]; if (!p) return null;
  if (engines.get(r.eng).kind === 'audio') {
    if (audio && audioAt === r.index && audio.duration > 0) {
      const e = fetches.get(r.index)?.e;
      const t = audio.currentTime + (audio.paused ? 0 : LEAD_S * audio.playbackRate);
      r.at = r.index; r.c = e?.timed?.length ? charAtTime(e.timed, t) : charAtFraction(p.text, t / audio.duration);
    }
  } else if (r.playing && B.run === run && !B.bounded) {
    // a voice that reports no words (Chrome's online ones): by its pace
    const sec = (performance.now() - B.t0) / 1000;
    if (sec > 0.6) { r.at = r.index; r.c = Math.min(p.text.length - 1, B.from + Math.floor(sec * (pace.get(B.key) || CPS) * B.rate)); }
  }
  return r.at === r.index ? r.c : null;
}
let raf = 0, lastProg = 0;
function tick() {
  if (raf) return;
  const step = () => {
    raf = 0;
    const r = R; if (!r) return;
    const c = position(), p = r.passages[r.index];
    if (c != null && p?.toks.length) {
      const t = tokAt(p, c), j = p.toks[t].j;
      r.tok = t;
      if (j !== r.cur) { r.cur = j; paint(); }
    }
    const now = performance.now();
    if (now - lastProg > 250) { lastProg = now; progress(); }
    if (r.playing) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

/** The text-layer spans of a raster word (looked up live: layers come and go with turns). */
function elsOf(w) {
  if (!w?.wi) return [];
  const out = [];
  for (const tl of document.querySelectorAll(`#spread .pg[data-k="${w.page}"] > .tl`)) {
    for (const x of w.wi) for (const el of tl._wi?.get(x) || tl.querySelectorAll(`[data-wi="${x}"]`)) out.push(el);
  }
  return out;
}
const drawn = (r, w) => (w.node ? flowOn(r) && live.flow.contains(w.node) : elsOf(w).length > 0);
/** A flow word's range without its quotes and punctuation. */
function trimmed(w) {
  const lead = w.text.match(/^[^\p{L}\p{N}]*/u)[0].length, tail = w.text.match(/[^\p{L}\p{N}]*$/u)[0].length;
  if (lead + tail >= w.text.length) return { range: rangeOf(w) };
  const r = document.createRange();
  r.setStart(w.node, w.a + lead); r.setEnd(w.node, w.b - tail);
  return { range: r };
}
const marksOf = (w) => (w.node ? [trimmed(w)] : elsOf(w).map((el) => ({ el })));
function prioritise() {
  if (!globalThis.CSS?.highlights) return;
  [['tts-hover', 0], ['tts-sentence', 1], ['tts-word', 2]].forEach(([n, p]) => { const x = CSS.highlights.get(n); if (x) x.priority = p; });
}
let painted = ''; // the sentence lit last: repainted only when it, or what is drawn, changes
/** Light the voice's word and sentence; `turn` false: without bringing the pages to it. */
function paint(turn = true) {
  const r = R; if (!r) return;
  const j = r.cur, w = r.words[j]; if (!w) return;
  // the word, or (not drawn: a page with no text layer, a mark) the last drawn one before it
  let k = j; while (k > j - 8 && k > 0 && !drawn(r, r.words[k])) k--;
  const ww = drawn(r, r.words[k]) ? r.words[k] : null;
  highlight('tts-word', ww ? marksOf(ww) : []);
  const si = sentIdx(r, j), key = `${r.id}|${r.gen}|${si}|${drawGen}`;
  if (key !== painted) {
    painted = key;
    const [a, b] = r.sents[si] || [j, j];
    let marks = [];
    if (r.kind === 'flow') {
      const fa = r.words[a], fb = r.words[b];
      if (fa && fb && drawn(r, fa) && drawn(r, fb)) {
        try { marks = [{ range: rangeOf(fa, fb) }]; } catch { /* torn DOM */ }
      }
    } else for (let x = a; x <= b && x - a < 160; x++) for (const el of elsOf(r.words[x])) marks.push({ el });
    highlight('tts-sentence', marks);
  }
  prioritise();
  if (turn) follow(r, w);
  paintNow(si);
}
on('spread:rendered', () => { drawGen++; });
on('textlayer:ready', ({ it }) => { drawGen++; if (R && it?.id === R.it.id) paint(false); }); // a page's spans just arrived

/** Whether a word is on screen now. */
function onScreen(r, w) {
  if (r.kind === 'flow') {
    if (!flowOn(r) || !live.flow.contains(w.node)) return false;
    const c = colOf(w), s = state.start.get(r.i) ?? 0;
    return c != null && c >= s && c < s + live.g.cols;
  }
  const s = state.start.get(r.i) ?? 0;
  return w.page >= s && w.page < s + Math.max(1, state.shown || 1);
}
/** Turn so that the start is `ns` (a column, or a page), without a 'nav' event (that would hold the follow). */
function turnTo(r, ns) {
  const i = r.i, s = state.start.get(i) ?? 0;
  if (ns === s) return;
  const hist = state.hist.get(i) || [];
  if (ns > s) hist.push(s); else while (hist.length && hist.at(-1) >= ns) hist.pop();
  state.hist.set(i, hist);
  settling = performance.now() + 700;
  state.start.set(i, ns); showFeed();
}
/** Keep the spoken word on screen: the next spread when it runs off the end
 *  (the previous one when it goes back), else straight to its column or page;
 *  not while the reader holds the pages (they turned one lately). */
function follow(r, w) {
  if (!w || !mode || state.view !== 'feed' || current() !== r.i) return;
  if (Date.now() < holdUntil || performance.now() < settling || anchor) return;
  if (document.querySelector('#track:hover, #scrub:hover')) return; // the reader is looking through the item
  if (r.kind === 'flow') {
    if (!flowOn(r) || !live.flow.contains(w.node)) return; // relayout pending
    const c = colOf(w); if (c == null) return;
    const s = state.start.get(r.i) ?? 0, n = live.g.cols;
    if (c >= s && c < s + n) return;
    const ns = c >= s + n && c < s + 2 * n ? s + n : c < s && c >= s - n ? Math.max(0, s - n) : c;
    turnTo(r, Math.min(ns, Math.max(0, live.n - 1)));
    return;
  }
  const s = state.start.get(r.i) ?? 0, n = Math.max(1, state.shown || 1);
  if (w.page >= s && w.page < s + n) return;
  turnTo(r, w.page >= s + n && w.page < s + 2 * n ? s + n : w.page < s && w.page >= s - n ? Math.max(0, s - n) : w.page);
}
// A jump the reader makes while the voice reads (the outline, the page strip,
// the track, the overview, g t Home End, r) takes the voice along: it reads
// from the top of the new view, rather than the pages going back to it after
// HOLD_MS. A turn (PgDn PgUp), Back, a link followed or a zoom only holds the follow.
on('nav', ({ type, it }) => {
  const r = R;
  if (!r || it?.id !== r.it.id || type === 'item') return;
  holdUntil = Date.now() + HOLD_MS; // a jump: until the voice lands there (moveTo), the pages stay
  if ((type === 'page' || type === 'random') && mode && r.playing && state.view === 'feed') readHere(r);
});
function readHere(r) {
  const s = state.start.get(r.i) ?? 0;
  if (r.kind !== 'flow') { stopSpeech(); rasterJump(r, s, null); return; } // the page may need loading: silent meanwhile
  if (flowOn(r) && live.flow.contains(r.words[0]?.node)) moveTo(firstFrom(r.words, s), { play: true }); // else a relayout is under way: only held
}
on('flow:jump', () => { if (R) holdUntil = Date.now() + HOLD_MS; });
on('spread:rendered', ({ it, flow }) => {
  settling = 0;
  if (anchor && anchor.id === it.id && flow) applyAnchor(flow);
  const r = R;
  if (r && it.id === r.it.id) {
    if (flow && r.kind === 'flow' && r.words[0] && !flow.flow.contains(r.words[0].node) && !rebind(r, flow)) return;
    // Relit on the new pages, not followed: a render comes inside showFeed(), before
    // the 'nav' event of a turn or jump the reader made, so following here would
    // undo it at once. The next word the voice says follows (tick).
    paint(false);
  }
  if (mode && !R && contFor === it.id) { contFor = null; setTimeout(() => { if (mode && !R && items[current()]?.id === it.id) begin({ cont: true }); }, 0); }
});
on('item:shown', ({ it }) => {
  if (anchor && anchor.id !== it.id) anchor = null;
  if (!mode || (R && R.it.id === it.id)) return;
  if (contFor === it.id) return;
  if (prefs.cont) { endSession(true); contFor = it.id; armCont(); paintBar(); } else exitMode(true);
});
on('view:changed', ({ view }) => { if (mode && view !== 'feed') exitMode(true); paintPill(); });

// ---------- keys: in the mode, the voice is what moves ----------
function toggle() {
  const it = items[current()];
  if (!mode || !R || R.it.id !== it?.id) return begin();
  if (R.loading && !R.passages.length) return;
  if (R.playing) pause(); else resume();
}
function setRate(v) {
  prefs.rate = v; savePrefs();
  const r = R;
  if (r) {
    if (engines.get(r.eng).kind === 'audio') { if (audio) audio.playbackRate = v; }
    else if (r.playing) { clearTimeout(rateT); rateT = setTimeout(() => { if (R === r && r.playing) speak(resumePoint()); }, 160); } // an utterance's rate is fixed: restart at the word
  }
  paintBar();
}
function stepRate(d) {
  let k = SPEEDS.findIndex((s) => s >= prefs.rate - 1e-6); if (k < 0) k = SPEEDS.length - 1;
  if (d > 0 && SPEEDS[k] > prefs.rate) k--; // between steps: the next one up is k itself
  setRate(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, k + d))]);
  if (!mode) toast(`Reading speed ${prefs.rate}×`, { icon: 'gauge' });
}
registerKey('v', toggle, { help: ['v', 'read aloud from the top of the screen (Alt+click a word: from there); in read-aloud: pause / play'], order: 45 });
registerKey('V', () => exitMode(false));
registerKey('<', () => stepRate(-1), { help: ['< >', 'slower / faster reading'], order: 46.5 });
registerKey('>', () => stepRate(1));
keyHelp.push(
  { label: '← →', text: 'read-aloud: back / forward a sentence (h l and the wheel too; hold to skip on)', order: 45.1 },
  { label: '⇧← ⇧→', text: 'read-aloud: back / forward a paragraph', order: 45.2 },
  { label: '↑ ↓', text: 'read-aloud: faster / slower', order: 45.3 },
  { label: 'Space', text: 'read-aloud: pause / play', order: 45.4 },
  { label: 'click', text: 'read-aloud: read from the word clicked (a link: click it again, or ⌘-click, to follow it)', order: 45.5 },
  { label: 'Esc V', text: 'leave read-aloud (j k: another item ends it, unless “Next item” is on)', order: 45.6 },
);

// A held arrow skims: one step at once, then (after 0.4 s) a step every 160 ms,
// faster the longer it is held, silently; on release the voice reads from there.
let hold = null; // { code, fn, t0, n, timer }
function press(code, fn) {
  endHold(false);
  fn({ speak: 'now' });
  const h0 = (hold = { code, fn, t0: performance.now(), n: 0, timer: 0 });
  const again = () => {
    if (hold !== h0) return;
    if (!navBusy) { h0.n++; h0.fn({ speak: 'none', repeat: true }); }
    const held = performance.now() - h0.t0;
    h0.timer = setTimeout(again, held > 1800 ? 60 : held > 1000 ? 100 : 160);
  };
  h0.timer = setTimeout(again, 400);
}
function endHold(say = true) {
  const h0 = hold; if (!h0) return;
  hold = null; clearTimeout(h0.timer);
  if (say && h0.n && R?.playing) speak(0);
}
const typing = (t) => /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName) || t?.isContentEditable;
function modeKey(e) {
  const c = e.code, k = e.key;
  if (k === 'ArrowLeft' || (k === 'h' && !e.shiftKey)) return () => press(c, (o) => (e.shiftKey ? stepPara(-1, o) : stepSentence(-1, o)));
  if (k === 'ArrowRight' || (k === 'l' && !e.shiftKey)) return () => press(c, (o) => (e.shiftKey ? stepPara(1, o) : stepSentence(1, o)));
  if (k === 'ArrowUp' && !e.shiftKey) return () => stepRate(1);
  if (k === 'ArrowDown' && !e.shiftKey) return () => stepRate(-1);
  // Shift+Space too: a held one would riffle the pages (riffle.js)
  if (k === ' ') return () => { if (R) toggle(); };
  if (k === 'Escape') return () => exitMode(true);
  return null;
}
// Widgets with keys of their own keep them: the library list (a tree or a
// listbox: arrows, letters to filter, Esc) and the Settings sheet. Space still
// pauses from the list. Esc first closes what is open over the pages.
const ownKeys = (t) => !!t?.closest?.('[role=tree], [role=listbox], [role=combobox], [role=menu], #st');
const shown = (sel) => { const el = $(sel); return !!el && !el.hidden; };
const overlayOpen = () => shown('#keys') || shown('#st') || shown('#saved') || !!$('#wheel-menu');
// Capture phase, ahead of the key registry (chrome.js) and hold-to-riffle
// (riffle.js): in the mode these keys move the voice, not the pages.
addEventListener('keydown', (e) => {
  if (!mode || state.view !== 'feed' || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target, inBar = !!t?.closest?.('#ra-bar');
  if (typing(t) && !(inBar && t.tagName === 'SELECT')) return;
  if (ownKeys(t) && !(e.key === ' ' && !t.closest('#st'))) return;
  if (e.key === 'Escape' && overlayOpen()) return;
  const act = modeKey(e); if (!act) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (inBar) t.blur?.();
  if (e.repeat) return; // a held key repeats on our own clock (press)
  act();
}, true);
addEventListener('keyup', (e) => {
  if (hold && e.code === hold.code) endHold();
  if (mode && e.key === ' ' && e.target?.closest?.('#ra-bar')) e.preventDefault(); // no click on a focused button
}, true);
addEventListener('blur', () => endHold());

// The wheel and the trackpad (nav.js asks state.stepHook first): a sentence a notch or stroke.
state.stepHook = (d) => {
  if (!mode) return false;
  d.glyph = '';
  if (R) stepSentence(d.dir > 0 ? 1 : -1, { speak: 'soon' });
  return true;
};

// ---------- the pointer: click a word to read from it ----------
function caretAt(x, y) {
  const cp = document.caretPositionFromPoint?.(x, y);
  if (cp) return { node: cp.offsetNode, off: cp.offset };
  const cr = document.caretRangeFromPoint?.(x, y);
  return cr ? { node: cr.startContainer, off: cr.startOffset } : null;
}
/** The flow word at a caret (or the next one after it): binary search against the caret point. */
function wordAtCaret(words, node, off) {
  const at = document.createRange();
  try { at.setStart(node, off); } catch { return -1; }
  let lo = 0, hi = words.length - 1, ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1, w = words[m]; let s, e;
    try { s = at.comparePoint(w.node, w.a); e = at.comparePoint(w.node, w.b); } catch { return -1; }
    if (s <= 0 && e >= 0) return m;   // the word starts at or before the caret and ends at or after it
    if (s > 0) { ans = m; hi = m - 1; } else lo = m + 1;
  }
  return ans;
}
const distTo = (rects, x, y) => { let d = Infinity; for (const b of rects) d = Math.min(d, Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom))); return d; };
/** The flow word under (or within a few px of) a point, or -1. */
function flowWordAt(words, x, y) {
  const c = caretAt(x, y);
  if (!c || !live?.flow.contains(c.node)) return -1;
  const j = wordAtCaret(words, c.node, c.off); if (j < 0) return -1;
  let best = -1, bd = Infinity;
  for (const q of [j - 1, j]) { if (!words[q]) continue; const d = distTo(rangeOf(words[q]).getClientRects(), x, y); if (d < bd) { bd = d; best = q; } }
  return bd <= 14 ? best : -1;
}
/** The text-layer word under (or nearest, within 20 px of) a point on a raster page. */
function rasterWordAt(x, y, target) {
  const pg = target.closest?.('#spread .pg[data-k]'); if (!pg) return null;
  const k = Number(pg.dataset.k), layer = pg.querySelector(':scope > .tl');
  let sp = target.closest?.('.tl .w');
  if (!sp && layer) {
    let best = 21;
    for (const w of layer.querySelectorAll('.w')) { const d = distTo([w.getBoundingClientRect()], x, y); if (d < best) { best = d; sp = w; } }
  }
  if (sp) return { page: k, wi: Number(sp.dataset.wi) };
  return layer ? null : { page: k, wi: null }; // a page with no words drawn: from its top
}
function hitAt(x, y, target) {
  const it = items[current()];
  if (!isFlow(it)) return rasterWordAt(x, y, target);
  if (live?.id !== it.id) return null;
  const words = R && R.kind === 'flow' && R.it.id === it.id ? R.words : collectFlow(live);
  const j = flowWordAt(words, x, y);
  return j >= 0 ? { j } : null;
}
function readFrom(hit) {
  const r = R;
  if (!mode || !r || r.it.id !== items[current()]?.id) { begin(hit); return; }
  holdUntil = 0;
  if (r.kind === 'flow') moveTo(hit.j, { play: true });
  else rasterJump(r, hit.page, hit.wi);
}
// Capture phase, before links (an Alt+click downloads one), footnote jumps and zoom.
let down = null, armed = null;
addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; }, true);
document.addEventListener('mousedown', (e) => { if (e.altKey && e.button === 0 && e.target.closest?.('#spread')) e.preventDefault(); }, true);
document.addEventListener('click', (e) => {
  if (e.button !== 0 || state.view !== 'feed' || !e.target.closest?.('#spread')) return;
  const alt = e.altKey && !e.metaKey && !e.ctrlKey;
  if (!alt && (!mode || !R || e.metaKey || e.ctrlKey || e.shiftKey)) return; // a modifier: the click does what it always does
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; // the end of a drag (a selection)
  if (!alt && String(getSelection() || '').trim()) return;
  const a = e.target.closest('a[href]');
  if (!alt && a) {
    // A link reads from its words; clicked again (or double-clicked), it goes where it points.
    if (e.detail > 1 || (armed?.a === a && performance.now() - armed.t < 6000)) { armed = null; return; }
    armed = { a, t: performance.now() };
  } else if (!alt && e.detail > 1) { e.preventDefault(); e.stopPropagation(); return; } // a double click selects a word; the first click moved the voice
  const hit = hitAt(e.clientX, e.clientY, e.target);
  if (!hit) {
    if (alt) { e.preventDefault(); e.stopPropagation(); toast('No text there to read', { icon: 'text-cursor', kind: 'edge' }); }
    else armed = null;
    return;
  }
  e.preventDefault(); e.stopPropagation();
  if (a) toast('Reading from the link', { icon: 'volume-2', sub: 'Click it again to follow it' });
  readFrom(hit);
}, true);
// Hovering a word in the mode marks it lightly (for 1.5 s after the pointer
// stops): that is where a click reads from.
let hovRaf = 0, hovT = 0, hovXY = null, hovEl = null;
const unhover = () => { hovEl?.classList.remove('ra-hov'); hovEl = null; };
addEventListener('mousemove', (e) => {
  const w = mode && R && R.kind !== 'flow' ? e.target.closest?.('#spread .tl .w') : null;
  if (w !== hovEl) { unhover(); if (w) { hovEl = w; w.classList.add('ra-hov'); } }
  if (w) { clearTimeout(hovT); hovT = setTimeout(unhover, 1500); }
  if (!mode || R?.kind !== 'flow' || !e.target.closest?.('#spread .flow')) { if (hovXY) { hovXY = null; highlight('tts-hover', []); } return; }
  hovXY = [e.clientX, e.clientY];
  if (hovRaf) return;
  hovRaf = requestAnimationFrame(() => {
    hovRaf = 0;
    if (!hovXY || R?.kind !== 'flow') return;
    const j = flowWordAt(R.words, hovXY[0], hovXY[1]);
    highlight('tts-hover', j >= 0 ? [trimmed(R.words[j])] : []); prioritise();
    clearTimeout(hovT); hovT = setTimeout(() => highlight('tts-hover', []), 1500);
  });
}, { passive: true });
addEventListener('pagehide', () => endSession());

// ---------- the media keys and the lock screen ----------
// Chrome routes media keys only to a page playing a media element, and the
// browser's voice is not one, so a looped silent clip stands in for it.
let loop = null;
function silentClip() {
  const rate = 8000, n = rate * 15, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  [...'RIFF'].forEach((c, k) => v.setUint8(k, c.charCodeAt(0))); v.setUint32(4, 36 + n * 2, true);
  [...'WAVEfmt '].forEach((c, k) => v.setUint8(8 + k, c.charCodeAt(0)));
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  [...'data'].forEach((c, k) => v.setUint8(36 + k, c.charCodeAt(0))); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function syncMedia() {
  const want = R && engines.get(R.eng)?.kind === 'events' && R.playing;
  if (want) { loop ||= Object.assign(new Audio(silentClip()), { loop: true }); if (loop.paused) loop.play().catch(() => {}); } else if (loop && !loop.paused) loop.pause();
  const ms = navigator.mediaSession; if (!ms) return;
  const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch { /* unknown here */ } };
  if (!R) { ms.metadata = null; ms.playbackState = 'none'; for (const a of ['play', 'pause', 'stop', 'nexttrack', 'previoustrack', 'seekforward', 'seekbackward']) set(a, null); return; }
  if (typeof MediaMetadata !== 'undefined' && ms.metadata?.title !== R.it.t) ms.metadata = new MediaMetadata({ title: R.it.t, artist: R.it.a || 'Stacks', album: 'Read aloud' });
  ms.playbackState = R.playing ? 'playing' : 'paused';
  set('play', resume); set('pause', pause); set('stop', () => exitMode());
  set('nexttrack', () => stepSentence(1)); set('previoustrack', () => stepSentence(-1));
  set('seekforward', () => stepPara(1)); set('seekbackward', () => stepPara(-1));
}

// ---------- the player (under the pages, while the mode is on) and the Read button ----------
const svg = (body, size = 20, fill = false) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  play: svg('<path d="M7 4.5v15l12.5-7.5z"/>', 22, true),
  pause: svg('<path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z"/>', 22, true),
  back: svg('<path d="M18 19 9 12l9-7v14z"/><path d="M5 5v14"/>'),
  fwd: svg('<path d="m6 5 9 7-9 7V5z"/><path d="M19 5v14"/>'),
  speaker: svg('<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>', 15),
  cont: svg('<path d="m15 10 5 5-5 5"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>', 16),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 18),
};
const blurred = (fn) => (e) => { e.currentTarget.blur(); fn(e); }; // keep the keys for the page
function buildBar() {
  if (bar) { placeBar(); return; }
  const btn = (cls, icon, title, fn) => { const b = h('button', { type: 'button', className: cls, title, ariaLabel: title, onclick: blurred(fn) }); b.innerHTML = icon; return b; };
  const back = btn('ra-step', ICON.back, 'Back a sentence (←; Shift+←: a paragraph)', () => stepSentence(-1));
  const play = btn('ra-play', ICON.play, 'Play (Space)', () => toggle());
  const fwd = btn('ra-step', ICON.fwd, 'Forward a sentence (→; Shift+→: a paragraph)', () => stepSentence(1));
  const sent = h('div', { className: 'ra-sent', title: 'The sentence being read' });
  const fill = h('i', { className: 'ra-fill' }), knob = h('b', { className: 'ra-knob' });
  const prog = h('div', { className: 'ra-prog', title: 'Where the voice is in this item · click to read from there' }, h('div', { className: 'ra-rail' }, fill, knob));
  prog.onclick = (e) => { const b = prog.getBoundingClientRect(); seekFraction((e.clientX - b.left) / b.width); };
  const where = h('div', { className: 'ra-where' });
  const slower = btn('ra-sp', '−', 'Slower (↓ or <)', () => stepRate(-1));
  const faster = btn('ra-sp', '+', 'Faster (↑ or >)', () => stepRate(1));
  const speed = h('select', { className: 'ra-speed', title: 'Reading speed (↑ ↓)' }, ...SPEEDS.map((s) => h('option', { value: String(s), textContent: `${s}×` })));
  speed.onchange = () => { setRate(Number(speed.value)); speed.blur(); };
  const voice = h('select', { className: 'ra-voice', title: 'Voice' });
  voice.onchange = () => { setVoice(voice.value); voice.blur(); };
  const cont = btn('ra-cont', ICON.cont + '<span>Next item</span>', '', () => {
    prefs.cont = !prefs.cont; savePrefs(); paintBar();
    toast(prefs.cont ? 'Then the next item' : 'Stop at the end', { icon: prefs.cont ? 'skip-forward' : 'arrow-down-to-line', kind: 'mode', sub: prefs.cont ? 'At the end (or on j/k) reading goes on with the next item' : 'Reading stops at the end of this item' });
  });
  const x = btn('ra-x', ICON.x, 'Leave read-aloud (Esc or V)', () => exitMode(true));
  const note = h('div', { className: 'ra-note', hidden: true, title: 'Click to dismiss', onclick: () => { if (R) R.notice = ''; paintBar(); } });
  const card = h('div', { className: 'ra-card' }, note,
    h('div', { className: 'ra-ctl' }, back, play, fwd),
    h('div', { className: 'ra-mid' }, sent, prog),
    where,
    h('div', { className: 'ra-spd' }, slower, speed, faster),
    voice, cont, x);
  bar = h('div', { id: 'ra-bar', role: 'region', ariaLabel: 'Read aloud', hidden: true }, card);
  Object.assign(bar, { play, sent, fill, knob, where, speed, voice, cont, note });
  placeBar();
  fillVoices();
  if (hasSynth) speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
}
/** In the stage's column under the pages, so the pages make room for it. */
function placeBar() {
  const st = $('#stage'); if (!st) { if (!bar.isConnected) document.body.append(bar); return; }
  if (bar.parentElement === st) return;
  const after = $('#spread');
  st.insertBefore(bar, after?.parentElement === st ? after.nextSibling : null);
}
function fillVoices() {
  if (!bar) return;
  const groups = [];
  for (const e of engines.values()) {
    const why = e.available(); let vs = [];
    try { vs = e.voices() || []; } catch { /* none */ }
    const opt = (v) => h('option', { value: `${e.id}:${v.id}`, textContent: v.label, disabled: !!why });
    const head = e.defaultLabel ? [h('option', { value: `${e.id}:`, textContent: e.defaultLabel, disabled: !!why })] : [];
    groups.push(h('optgroup', { label: why ? `${e.label} (not set up)` : e.label }, ...head, ...vs.filter((v) => !v.group).map(opt)));
    for (const g of new Set(vs.filter((v) => v.group).map((v) => v.group))) groups.push(h('optgroup', { label: g }, ...vs.filter((v) => v.group === g).map(opt)));
  }
  bar.voice.replaceChildren(...groups);
  syncVoice();
}
function syncVoice() {
  if (!bar) return;
  const pref = engines.get(prefs.engine);
  const id = R?.eng || (pref && !pref.available() ? prefs.engine : 'browser');
  const want = `${id}:${voiceOf(id)}`;
  if (bar.voice.value === want) return;
  bar.voice.value = want;
  if (bar.voice.value !== want) bar.voice.value = `${id}:`;
  const e = engines.get(id);
  bar.voice.title = `Voice: ${e?.label || id}` + [...engines.values()].filter((x) => x.available()).map((x) => ` · ${x.label}: ${x.available()}`).join('');
}
/** Pick a voice: 'engine:voice' ('b:' and 'g:' are the browser's and Gemini's, as the Settings sheet says them). */
function setVoice(val) {
  const at = val.indexOf(':');
  let id = at < 0 ? val : val.slice(0, at); const name = at < 0 ? '' : val.slice(at + 1);
  id = { b: 'browser', g: 'gemini' }[id] || id;
  const e = engines.get(id); if (!e) return;
  if (e.available()) { if (R) { R.notice = e.available() + '.'; paintBar(); } syncVoice(); return; }
  prefs.engine = id; setVoicePref(id, name);
  savePrefs();
  if (R) { R.notice = ''; recut(id); }
  paintBar(); syncMedia();
}
const clock = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`; };
function progress() {
  const r = R; if (!bar || !mode) return;
  if (!r || !r.words.length) { bar.fill.style.width = '0%'; bar.knob.style.left = '0%'; bar.where.replaceChildren(); bar.where._t = ''; return; }
  const w = r.words[r.cur] || r.words[0];
  let f, top, sub;
  if (r.kind === 'flow') {
    f = r.cur / Math.max(1, r.words.length - 1);
    const left = (r.cum.at(-1) - r.cum[r.cur]) / (CPS * prefs.rate);
    top = `p. ${w.page + 1} / ${r.it.n || w.page + 1}`; sub = `−${clock(left)}`;
    bar.where.title = `stable page ${w.page + 1} of ${r.it.n}; about ${clock(left)} left at ${prefs.rate}×`;
  } else {
    const [a, b] = r.spans.get(w.page) || [r.cur, r.cur + 1];
    f = (w.page + (r.cur - a) / Math.max(1, b - a)) / r.n;
    top = `p. ${w.page + 1} / ${r.n}`; sub = r.approx ? 'by estimate' : `${Math.round(100 * f)}%`;
    bar.where.title = `page ${w.page + 1} of ${r.n}`;
  }
  const pct = (100 * Math.max(0, Math.min(1, f))).toFixed(2) + '%';
  if (bar.fill.style.width !== pct) { bar.fill.style.width = pct; bar.knob.style.left = pct; }
  if (bar.where._t !== top + sub) { bar.where._t = top + sub; bar.where.replaceChildren(h('b', { textContent: top }), h('span', { textContent: sub })); }
}
/** The sentence being read, faintly, in the player, its current word brighter. */
function paintNow(si) {
  const r = R; if (!bar || !mode || !r) return;
  const box = bar.sent, key = `${r.id}|${r.gen}|${si}`;
  if (box._key !== key) {
    const [a, b] = r.sents[si] || [r.cur, r.cur];
    const lo = Math.max(a, r.cur - 80), hi = Math.min(b, lo + 160);
    box._key = key; box._a = lo;
    box.replaceChildren(...r.words.slice(lo, hi + 1).map((w, x) => h('span', { textContent: (x && !r.words[lo + x - 1].glue ? ' ' : '') + w.text })));
    box.scrollLeft = 0;
  }
  box.querySelector('.cur')?.classList.remove('cur');
  const el = box.children[r.cur - box._a];
  if (el) {
    el.classList.add('cur');
    if (el.offsetLeft + el.offsetWidth > box.scrollLeft + box.clientWidth - 24 || el.offsetLeft < box.scrollLeft) box.scrollLeft = Math.max(0, el.offsetLeft - box.clientWidth * 0.3);
  }
}
function paintBar() {
  paintPill();
  if (!bar) return;
  bar.hidden = !mode;
  if (!mode) return;
  const r = R, playing = !!r?.playing;
  bar.classList.toggle('playing', playing);
  bar.classList.toggle('loading', !r || (!!r.loading && playing));
  if (bar.play._on !== playing) { bar.play._on = playing; bar.play.innerHTML = playing ? ICON.pause : ICON.play; bar.play.title = bar.play.ariaLabel = playing ? 'Pause (Space)' : 'Play (Space)'; }
  if (bar.speed.value !== String(prefs.rate)) {
    if (![...bar.speed.options].some((o) => o.value === String(prefs.rate))) bar.speed.append(h('option', { value: String(prefs.rate), textContent: `${prefs.rate}×` }));
    bar.speed.value = String(prefs.rate);
  }
  syncVoice();
  if (bar.cont._on !== !!prefs.cont) bar.cont._on = !!prefs.cont, bar.cont.classList.toggle('on', !!prefs.cont), bar.cont.setAttribute('aria-pressed', String(!!prefs.cont));
  bar.cont.title = prefs.cont ? 'Next item: on · at the end (or on j/k) reading goes on with the next item' : 'Next item: off · reading stops at the end of this item (click to go on to the next)';
  const msg = r?.notice || (!r && contFor ? 'Opening the next item…' : '');
  if (bar.note.textContent !== msg) {
    bar.note.textContent = msg;
    clearTimeout(noteTimer);
    if (r?.notice) noteTimer = setTimeout(function fade() { if (bar.note.matches(':hover')) noteTimer = setTimeout(fade, 3000); else if (R) { R.notice = ''; paintBar(); } }, 12000);
  }
  bar.note.hidden = !msg;
  if (!r) { bar.sent.replaceChildren(); bar.sent._key = ''; }
  progress();
}
function paintPill() {
  if (!pill) {
    const hdr = $('#bar'); if (!hdr) return;
    pill = h('button', { id: 'ra-pill', type: 'button', className: 'ghost', onclick: blurred(() => (mode ? exitMode(true) : begin())) });
    pill.innerHTML = ICON.speaker + '<span>Read</span>';
    const before = $('#search-btn');
    hdr.insertBefore(pill, before?.parentElement === hdr ? before : null);
  }
  pill.classList.toggle('on', mode);
  pill.title = mode ? 'Leave read-aloud (Esc or V)' : 'Read aloud from the top of the screen (v) · Alt+click a word to read from there';
  pill.ariaLabel = mode ? 'Leave read-aloud' : 'Read aloud';
  pill.hidden = state.view !== 'feed' && !mode;
}
paintPill();

// For the Settings sheet (features/settings.js) and other features: the saved
// voice and speed, the setters the player uses (they also retune a reading in
// progress), and starting / leaving the mode.
export { prefs as readAloudPrefs, setRate as setReadRate, setVoice as setReadVoice };
export const readAloud = { start: (opt) => begin(opt), stop: () => exitMode(true), get on() { return mode; }, get playing() { return !!R?.playing; } };
