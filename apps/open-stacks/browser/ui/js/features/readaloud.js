// Read aloud, with the word being said lit on the page and the page following
// the voice. Ported from Starfleet v3 (web/src/readAloud/*.ts).
//
// Two voices. The browser's (speechSynthesis) is the default: free, instant,
// and its 'boundary' events say exactly which word it is on. Gemini's (POST
// /tts, server/routes/55-tts.mjs) sounds far better; its audio carries no word
// times, so words are placed on it by the audio's own pauses (timeWords).
//
// What is read is the page's own words (text.js currentWords), so every spoken
// word knows the word on the page it came from: flow documents give DOM ranges;
// a PDF page is read from its pdf.js text and lined up with a text layer's
// spans when one is drawn (align); a scan with no text layer reads its OCR text
// by estimate, unlit. Code blocks and footnote marks are skipped, a URL is
// said as "a link". The text from the first word on screen is cut into
// passages of whole sentences, short first (the one the listener waits for);
// Gemini's next passages are fetched while one plays.
//
// Keys: v play/pause (resumes where it paused if that is on screen, else reads
// from the top of the screen), V stop, < > speed; Alt+click a word: read from
// there. A page turned by the reader holds the follow for HOLD_MS.
import { h, P, store, on, registerKey, toast, sleep } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { isFlow, openDoc } from '../docs.js';
import { live } from '../flow.js';
import { currentWords, highlight, reveal } from '../text.js';

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

/** Cut words[from..to) into passages of whole sentences.
 *  A word is { text, para?, glue? }: `para` changes where a block (paragraph,
 *  heading, list item, cell) ends, which closes a sentence (with a full stop if
 *  it has none, so the voice pauses after a heading); `glue` says the next word
 *  continues this one with no space ("<em>word</em>s"). A sentence longer than
 *  a passage is cut at word boundaries. `first` continues a size ramp.
 *  Returns [{ text, toks: [{ at, end, j, s, g }], sents: [[j0, j1]] }]: each
 *  spoken token knows its character span, its page word j, its sentence s
 *  (the page words of the whole sentence, even one cut across passages), and
 *  whether it is glued to the token before it (g). */
export function buildPassages(words, from, to, sizes, first = 0) {
  const sents = []; let cur = [];
  const close = (dot) => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    if (dot && !CLOSED.test(last.say)) last.say += '.';
    sents.push(cur); cur = [];
  };
  for (let j = from; j < to; j++) {
    const w = words[j]; const say = spokenOf(w.text);
    if (say) cur.push({ say, j, glue: !!w.glue });
    const next = j + 1 < to ? words[j + 1] : null;
    if (!next) close(false);
    else if (next.para !== w.para) close(true);
    else if (say && !w.glue && ENDS.test(say) && !ABBR.test(say) && !INITIAL.test(say)) close(false);
  }
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

/** The words Gemini's timing places: glued tokens joined, punctuation-only ones left out. */
export function timingWords(p) {
  const out = [];
  for (const t of p.toks) {
    if (t.g && out.length) { out[out.length - 1].end = t.end; continue; }
    if (/[\p{L}\p{N}]/u.test(p.text.slice(t.at, t.end))) out.push({ start: t.at, end: t.end });
  }
  return out;
}

// --- when each word of a Gemini passage is said, read off the audio (readAloudTiming.ts) ---
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
// ==== end pure ====

// ---------- the reading ----------
const LEAD_S = 0.06;   // light a Gemini word this much before it is heard
const HOLD_MS = 5000;  // a page the reader turns holds the follow this long (Starfleet)
const CPS = 15;        // characters a second a voice says at 1x
const START_MS = 6000; // a browser voice that has not started by then has failed
const hasSynth = typeof speechSynthesis !== 'undefined';
const prefs = { rate: 1.5, engine: 'browser', browserVoice: '', geminiVoice: 'Kore', ...store.get('readaloud', {}) };
const savePrefs = () => store.set('readaloud', prefs);
let gem = { enabled: false, voices: [], model: '' }; // GET /tts
fetch('/tts').then((r) => r.json()).then((j) => { gem = j; if (bar) fillVoices(); }).catch(() => {});

/** The reading: { i, it, kind: 'flow'|'pdf'|'scan', words, spans (page -> [a, b)),
 *  passages, index, lastTok, lastJ, engine, playing, loading, more, next, notice }. */
let R = null;
let run = 0; // bumped by every (re)start; callbacks from an older run do nothing
let timers = [], keepalive = 0;
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearInterval(keepalive); keepalive = 0; };
let heldAt = -1, heldChar = 0;   // the last place known: passage, character
const lastAt = new Map();        // item id -> page word read last, for coming back
let holdUntil = 0, settleUntil = 0;

const PARA = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,dt,dd,figcaption,caption,pre,div,section,article,header,tr';
/** Flow words: which block each is in, and which run into the next with no space. */
function markFlow(words) {
  for (const w of words) w.para = w.range.startContainer.parentElement?.closest(PARA) || null;
  for (let j = 0; j + 1 < words.length; j++) {
    const a = words[j].range, b = words[j + 1].range;
    if (a.endContainer === b.startContainer || a.endOffset !== a.endContainer.length || b.startOffset !== 0 || words[j].para !== words[j + 1].para) continue;
    const gap = document.createRange();
    gap.setStart(a.endContainer, a.endOffset); gap.setEnd(b.startContainer, 0);
    words[j].glue = !/\s/.test(gap.toString()) && !gap.cloneContents().querySelector('br,img,svg');
  }
}
/** The first flow word inside the visible columns (binary search over their boxes). */
function firstOnScreen(words, fallback) {
  if (!live) return fallback;
  const left = live.port.getBoundingClientRect().left - 2;
  let lo = 0, hi = words.length - 1, ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1; const r = words[m].range.getBoundingClientRect();
    if (!r.width && !r.height) return fallback;
    if (r.left >= left) { ans = m; hi = m - 1; } else lo = m + 1;
  }
  return ans >= 0 ? ans : fallback;
}

// --- raster pages ---
/** A PDF page's words from pdf.js, line-end hyphens joined. */
async function pdfWords(it, k) {
  const d = await openDoc(it);
  const tc = await (await d.pdf.getPage(k + 1)).getTextContent();
  let text = '', prev = null;
  for (const x of tc.items) {
    if (typeof x.str !== 'string') continue;
    if (prev && !prev.hasEOL && text && !/\s$/.test(text) && !/^\s/.test(x.str)) {
      // pdf.js leaves some spaces implicit: a gap, or a new line, between items
      const hgt = x.height || prev.height || 10;
      const gap = x.transform[4] - (prev.transform[4] + prev.width);
      if (Math.abs(x.transform[5] - prev.transform[5]) > hgt * 0.5 || gap > hgt * 0.2) text += ' ';
    }
    text += x.str + (x.hasEOL ? '\n' : '');
    prev = x;
  }
  text = text.replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2');
  return text.split(/\s+/).filter(Boolean).map((t) => ({ text: t, page: k }));
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
/** The words a text source has for page k (textlayer.js: the pages on screen and the next spread). */
async function shownWords(k) {
  const got = await currentWords().catch(() => null);
  const ws = got?.words.filter((w) => w.page === k) || [];
  return ws.length ? ws : null;
}
const waiting = []; // [item id, resolve] until that item's next render
on('spread:rendered', ({ it }) => { for (let k = waiting.length - 1; k >= 0; k--) if (waiting[k][0] === it.id) waiting.splice(k, 1)[0][1](); });
const rendered = (id, ms = 4000) => new Promise((res) => { waiting.push([id, res]); setTimeout(res, ms); });
async function pageWords(r, k) {
  if (r.kind === 'pdf') return pdfWords(r.it, k);
  let ws = await shownWords(k);
  if (!ws && r.layer && current() === r.i && state.view === 'feed') { reveal({ page: k }); await rendered(r.it.id); ws = await shownWords(k); }
  if (ws) { r.layer = true; return ws.map((w) => ({ text: w.text, page: k, src: w })); }
  if (!r.approx) { r.approx = true; r.notice = 'No text layer on this scan yet: reading its OCR text by estimate, without highlighting.'; }
  return scanWords(r.it, k);
}
/** Session words of one page lined up with the words a text layer draws for it. */
function alignPage(sw, dws) {
  if (sw.length === dws.length && sw.every((w, t) => w.text === dws[t].text)) return sw.map((_, t) => t);
  const ia = [], ib = [];
  sw.forEach((w, t) => { if (norm(w.text)) ia.push(t); });
  dws.forEach((w, t) => { if (norm(w.text)) ib.push(t); });
  const m = align(ia.map((t) => norm(sw[t].text)), ib.map((t) => norm(dws[t].text)));
  const out = new Array(sw.length).fill(-1);
  ia.forEach((t, x) => { if (m[x] >= 0) out[t] = ib[m[x]]; });
  return out;
}
/** Load the next page with words into the reading (blank pages are passed over). */
async function loadPage(r, k, start = null) {
  const n = r.it.n || 1;
  for (let tries = 0; k < n && tries < 12; k++, tries++) {
    const ws = await pageWords(r, k);
    if (R !== r) return;
    const a = r.words.length;
    r.words.push(...ws);
    r.spans.set(k, [a, r.words.length]);
    r.next = k + 1; r.more = r.next < n;
    let from = a;
    if (start && start.d != null && start.display?.length) {
      const m = alignPage(ws, start.display);
      const t = m.findIndex((x) => x >= start.d);
      from = a + Math.max(0, t);
    }
    start = null;
    const ps = buildPassages(r.words, from, r.words.length, SIZES[r.engine], r.passages.length);
    r.passages.push(...ps);
    if (ps.length) { bindShown(r); return; }
  }
}
function ensureAhead(r) {
  if (r.kind === 'flow' || !r.more || r.pageLoad || r.passages.length - r.index > 4) return;
  r.pageLoad = loadPage(r, r.next).catch((e) => console.warn('read aloud: page', e)).finally(() => { r.pageLoad = null; if (R === r && r.engine === 'gemini' && r.playing) prefetch(r.index); });
}
/** Tie the reading's words of the pages a text source has now to its words
 *  (`src`); their `el` is looked up live, so this holds across re-renders. */
async function bindShown(r, tries = 0) {
  if (r.kind === 'flow') return;
  const got = await currentWords().catch(() => null);
  if (R !== r) return;
  const ws = got?.words || [];
  if (!ws.length) { if (tries < 2) setTimeout(() => R === r && bindShown(r, tries + 1), 500 * (tries + 1)); return; }
  const byPage = new Map();
  for (const w of ws) { if (!byPage.has(w.page)) byPage.set(w.page, []); byPage.get(w.page).push(w); }
  for (const [k, dws] of byPage) {
    const span = r.spans.get(k); if (!span) continue;
    const sw = r.words.slice(span[0], span[1]);
    if (sw.length && sw.every((w, t) => w.src === dws[t])) continue; // tied already
    const m = alignPage(sw, dws);
    sw.forEach((w, t) => { w.src = m[t] >= 0 ? dws[m[t]] : null; });
  }
  repaint();
}
async function rebindFlow(r) {
  const got = await currentWords().catch(() => null);
  if (R !== r || !got) return;
  if (got.words.length !== r.words.length) { stopReading(); toast('Reading stopped', { icon: 'volume-x', sub: 'The text on screen changed' }); return; }
  got.words.forEach((w, j) => { r.words[j].range = w.range; r.words[j].block = w.block; });
  repaint();
}

// ---------- starting, pausing, stopping ----------
function pickEngine(r) {
  if (prefs.engine === 'gemini' && gem.enabled) return 'gemini';
  if (prefs.engine === 'gemini') r.notice = 'Gemini voices need GEMINI_API_KEY (or GOOGLE_API_KEY) set where the server runs; using the browser’s voice.';
  return 'browser';
}

/** Start reading the current item: from page word `j` (flow), from page `page`
 *  (raster; `d` a text-layer word on it), else from the first word on screen. */
async function begin(opt = {}) {
  const i = current(); const it = items[i];
  if (it == null) return;
  stopReading();
  const r = { i, it, kind: isFlow(it) ? 'flow' : it.kind === 'pdf' ? 'pdf' : 'scan', words: [], spans: new Map(), passages: [], index: 0, lastTok: 0, lastJ: -1, playing: true, loading: true, more: false, next: 0, notice: '' };
  r.engine = pickEngine(r);
  if (r.engine === 'browser' && !hasSynth) { toast('No voice to read with', { icon: 'volume-x', kind: 'bad', sub: 'This browser has none; Gemini voices need GEMINI_API_KEY' }); return; }
  R = r; heldAt = 0; heldChar = 0;
  paintBar();
  try {
    if (r.kind === 'flow') {
      const got = await currentWords();
      if (R !== r) return;
      if (!got) throw new Error('No text on screen to read');
      r.words = got.words; markFlow(r.words);
      let from = opt.j;
      if (from == null) {
        const prev = lastAt.get(it.id); // where it paused, if that is still on screen
        from = prev != null && r.words[prev] && onScreen(r.words[prev], r) ? prev : firstOnScreen(r.words, got.start);
      }
      r.passages = buildPassages(r.words, from, r.words.length, SIZES[r.engine]);
    } else {
      await loadPage(r, opt.page ?? state.start.get(i) ?? 0, opt);
      if (R !== r) return;
    }
  } catch (e) { if (R === r) { stopReading(false); toast('Cannot read aloud', { icon: 'volume-x', kind: 'bad', sub: e.message }); } return; }
  if (!r.passages.length) { stopReading(false); toast('Nothing to read here', { icon: 'volume-x' }); return; }
  r.loading = false;
  holdUntil = 0;
  speak(0); ensureAhead(r); tick(); paintBar(); syncMedia();
}

function speak(from) { if (R.engine === 'gemini') speakGemini(from); else speakBrowser(from ?? 0); }

function stopEngines() {
  run++; clearTimers(); detachUtterance();
  if (hasSynth) speechSynthesis.cancel();
  if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
  audioAt = -1;
}

function pause() {
  const r = R; if (!r || !r.playing) return;
  position();
  r.playing = false; r.loading = false;
  if (r.engine === 'gemini' && audio && audioAt === r.index) { run++; clearTimers(); audio.onended = audio.onerror = null; audio.pause(); }
  else stopEngines();
  paintBar(); syncMedia();
}
function resume() {
  const r = R; if (!r || r.playing) return;
  r.playing = true; r.notice = '';
  speak(r.engine === 'gemini' ? null : resumePoint());
  tick(); paintBar(); syncMedia();
}
/** Stop and pause, saying why. */
function halt(msg) { pause(); if (R) { R.notice = msg; paintBar(); } }

function stopReading(remember = true) {
  if (!R) return;
  if (remember && R.lastJ >= 0) lastAt.set(R.it.id, R.lastJ); else lastAt.delete(R.it.id);
  stopEngines(); dropFetches();
  highlight('tts-word', []); highlight('tts-sentence', []);
  R = null; cancelAnimationFrame(raf); raf = 0;
  paintBar(); syncMedia();
}
function finish() { stopReading(false); toast('Finished reading', { icon: 'circle-check', kind: 'ok' }); }

async function advance() {
  const r = R; if (!r) return;
  const mine = run;
  for (let n = 0; r.index + 1 >= r.passages.length && r.more && n < 8; n++) { // the next page (blank ones passed over)
    r.loading = true; paintBar();
    ensureAhead(r); await r.pageLoad;
    if (R !== r || mine !== run) return;
  }
  r.loading = false;
  if (r.index + 1 >= r.passages.length) return finish();
  r.index++; r.lastTok = 0; heldAt = r.index; heldChar = 0;
  keepWindow(r.index);
  speak(0); ensureAhead(r); paintBar();
}
/** Jump d passages, playing or not. */
function skip(d) {
  const r = R; if (!r) return;
  const to = Math.max(0, Math.min(r.passages.length - 1, r.index + d));
  stopEngines(); keepWindow(to);
  r.index = to; r.lastTok = 0; heldAt = to; heldChar = 0; repaint();
  if (r.playing) speak(0);
  ensureAhead(r);
}
/** Cut the rest again for another engine, from the word being read. */
function recut(engine) {
  const r = R; if (!r) return;
  const j = r.passages[r.index]?.toks[r.lastTok]?.j ?? 0;
  stopEngines(); dropFetches();
  r.engine = engine; r.passages = [];
  if (r.kind === 'flow') r.passages = buildPassages(r.words, j, r.words.length, SIZES[engine]);
  else for (const [, [a, b]] of r.spans) if (b > j) r.passages.push(...buildPassages(r.words, Math.max(a, j), b, SIZES[engine], r.passages.length));
  r.index = 0; r.lastTok = 0; heldAt = 0; heldChar = 0;
}
/** Where the current passage picks up: the start of the word it was on. */
function resumePoint() {
  const c = position(); const p = R.passages[R.index];
  return c == null || !p ? 0 : p.toks[tokAt(p, c)].at;
}

// ---------- the browser's voice ----------
let utterance = null;
const B = { run: -1, at: 0, from: 0, rate: 1, bounded: false, retried: false };
const pace = new Map(); // voice -> characters a second measured at 1x (voices that report no words)
function detachUtterance() { if (utterance) utterance.onstart = utterance.onend = utterance.onerror = utterance.onboundary = null; utterance = null; }
function pickVoice(all) {
  const chosen = all.find((v) => v.voiceURI === prefs.browserVoice);
  if (chosen) return chosen;
  // Chrome's online voices top out at 2x: above that, a local voice in the same language
  if (prefs.rate <= 2) return undefined;
  const base = (navigator.language || 'en').slice(0, 2);
  return all.find((v) => v.default && v.localService) || all.find((v) => v.localService && v.lang.toLowerCase().startsWith(base));
}
function speakBrowser(from) {
  const mine = ++run;
  clearTimers(); detachUtterance(); speechSynthesis.cancel();
  heldAt = R.index; heldChar = from;
  // a speak() in the same task as a cancel() is dropped on some Chrome builds
  later(() => { if (mine === run) utter(mine, from); }, 30);
}
function utter(mine, from) {
  const r = R, p = r.passages[r.index];
  const at = from > 0 && p.text.slice(from).trim() ? from : 0;
  const u = new SpeechSynthesisUtterance(p.text.slice(at));
  const all = speechSynthesis.getVoices();
  const v = pickVoice(all);
  if (v) u.voice = v;
  u.lang = v?.lang || navigator.language || 'en-US';
  const online = v ? !v.localService : !!all.find((x) => x.default && !x.localService);
  u.rate = online ? Math.min(prefs.rate, 2) : prefs.rate;
  let started = false;
  Object.assign(B, { run: -1, from: at, rate: u.rate, bounded: false });
  u.onstart = () => { if (mine !== run) return; started = true; B.retried = false; B.run = mine; B.at = performance.now(); };
  u.onboundary = (e) => {
    if (mine !== run || (e.name && e.name !== 'word')) return;
    B.bounded = true; heldAt = r.index; heldChar = at + e.charIndex;
  };
  u.onend = () => {
    if (mine !== run) return;
    clearTimers();
    const took = (performance.now() - B.at) / 1000;
    if (!B.bounded && started && u.text.length > 40 && took > 1) { // learn this voice's real pace
      const m = u.text.length / took / (u.rate || 1); const vk = u.voice?.voiceURI || 'default';
      if (m > 5 && m < 40) pace.set(vk, pace.has(vk) ? pace.get(vk) * 0.6 + m * 0.4 : m);
    }
    advance();
  };
  u.onerror = (e) => {
    if (mine !== run || e.error === 'interrupted' || e.error === 'canceled') return;
    clearTimers();
    if (e.error === 'not-allowed') halt('The browser wants a click on the page before it speaks; then press v.');
    else browserFailed(`failed (${e.error})`);
  };
  utterance = u;
  speechSynthesis.speak(u);
  if (online) keepalive = setInterval(() => { if (mine === run && speechSynthesis.speaking) { speechSynthesis.pause(); speechSynthesis.resume(); } }, 10000);
  later(() => {
    if (mine !== run || started) return;
    if (!B.retried) { B.retried = true; speakBrowser(at); } else { B.retried = false; browserFailed('did not start'); }
  }, all.length ? START_MS : 3000);
}
function browserFailed(what) {
  halt(gem.enabled
    ? `The browser’s voice ${what}. Pick another voice, or a Gemini voice.`
    : `The browser’s voice ${what}. This system may have no speech voices; Gemini voices need GEMINI_API_KEY set where the server runs.`);
}

// ---------- Gemini's voice ----------
let audio = null, audioAt = -1;
const fetches = new Map(); // passage index -> { p, ac, e?: { url, timed }, failed? }
function gemini(idx, priority = 'ahead') {
  const hit = fetches.get(idx); if (hit) return hit.p;
  const r = R, p = r.passages[idx], ac = new AbortController(), voice = prefs.geminiVoice;
  const ask = async (n) => {
    const res = await fetch('/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: p.text, voice, priority }), signal: ac.signal });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      // Google's minute quota: back off and ask again; the hourly budget is not worth asking again
      if (res.status === 429 && j.code === 'busy' && n < 2) { await sleep([3000, 8000][n]); if (ac.signal.aborted) throw new Error('cancelled'); return ask(n + 1); }
      throw Object.assign(new Error(j.error || `HTTP ${res.status}`), { code: j.code, status: res.status });
    }
    const buf = await res.arrayBuffer();
    const e = { url: URL.createObjectURL(new Blob([buf], { type: res.headers.get('Content-Type') || 'audio/wav' })), timed: null };
    setTimeout(() => { // off the play path: a few ms of arithmetic per passage
      try { const pcm = parseWav(buf); if (pcm) e.timed = timeWords(p.text, timingWords(p), silences(pcm), pcm.samples.length / pcm.rate); } catch (err) { console.warn('read aloud: timing', err); }
    }, 0);
    return e;
  };
  const f = { p: ask(0), ac };
  f.p.then((e) => { f.e = e; }, () => { f.failed = true; });
  fetches.set(idx, f);
  return f.p;
}
function dropFetch(idx) {
  const f = fetches.get(idx); if (!f) return;
  f.ac.abort(); f.p.then((e) => URL.revokeObjectURL(e.url), () => {});
  fetches.delete(idx);
}
function dropFetches() { for (const idx of [...fetches.keys()]) dropFetch(idx); }
const depth = () => (prefs.rate <= 3 ? 3 : 4);
function prefetch(at) { for (let k = at + 1; k <= at + depth() && k < R.passages.length; k++) gemini(k); }
/** After a skip: let go of passages behind, and of requests in flight past the window. */
function keepWindow(from) { for (const [k, f] of [...fetches]) if (k < from || (k > from + depth() && !f.e)) dropFetch(k); }

function speakGemini(from) {
  const mine = ++run;
  clearTimers(); detachUtterance(); if (hasSynth) speechSynthesis.cancel();
  const r = R, at = r.index, f = fetches.get(at);
  if (audio && audioAt === at && audio.getAttribute('src') && f?.e) { // paused on this passage: carry on
    if (from != null) seekTo(f.e, at, from);
    prefetch(at);
    return playAudio(mine, at, f.e, null);
  }
  if (f?.e) { prefetch(at); return playAudio(mine, at, f.e, from); }
  if (f?.failed) dropFetch(at);
  heldAt = at; heldChar = from || 0;
  r.loading = true; paintBar();
  gemini(at, 'now').then((e) => {
    if (mine !== run || R !== r) return;
    r.loading = false; paintBar();
    playAudio(mine, at, e, from);
  }, (err) => {
    if (mine !== run || R !== r) return;
    r.loading = false;
    fallBack(err.code === 'busy' ? 'Gemini’s voice is over its quota for now' : `Gemini’s voice failed (${err.message})`);
  });
  prefetch(at);
}
function seekTo(e, at, from) {
  const el = audio, go = () => { el.currentTime = e.timed?.length ? timeAtChar(e.timed, from) : fractionAtChar(R.passages[at].text, from) * (el.duration || 0); };
  if (el.readyState >= 1) go(); else el.addEventListener('loadedmetadata', go, { once: true });
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
    if (f?.e) setTimeout(() => URL.revokeObjectURL(f.e.url), 2000);
    advance();
  };
  el.onerror = () => { if (mine === run) fallBack(`Gemini’s audio would not play (${el.error?.message || el.error?.code || 'unknown'})`); };
  el.play().catch((err) => {
    if (mine !== run || err.name === 'AbortError') return;
    if (err.name === 'NotAllowedError') halt('The browser wants a click on the page before it plays; then press v.');
    else fallBack(`Gemini’s audio would not play (${err.message})`);
  });
  syncMedia();
}
/** Gemini failed: the browser's voice reads the rest of this reading, and the bar says why. */
function fallBack(why) {
  if (!R) return;
  if (!hasSynth) { halt(`${why}.`); return; }
  const playing = R.playing;
  recut('browser');
  R.notice = `${why}; the browser’s voice reads the rest.`;
  if (playing) speak(0);
  paintBar(); syncMedia();
}

// ---------- where the voice is, lit on the page ----------
/** The character the voice is at in the current passage, or null. */
function position() {
  const r = R; const p = r?.passages[r.index]; if (!p) return null;
  if (r.engine === 'gemini') {
    if (audio && audioAt === r.index && audio.duration > 0) {
      const e = fetches.get(r.index)?.e;
      const t = audio.currentTime + (audio.paused ? 0 : LEAD_S * audio.playbackRate);
      heldAt = r.index; heldChar = e?.timed?.length ? charAtTime(e.timed, t) : charAtFraction(p.text, t / audio.duration);
    }
  } else if (r.playing && B.run === run && !B.bounded) {
    // a voice that reports no words (Chrome's online ones): by its pace
    const sec = (performance.now() - B.at) / 1000;
    if (sec > 0.6) { heldAt = r.index; heldChar = Math.min(p.text.length - 1, B.from + Math.floor(sec * (pace.get(utterance?.voice?.voiceURI || 'default') || CPS) * B.rate)); }
  }
  return heldAt === r.index ? heldChar : null;
}

let raf = 0, lastProg = 0;
function tick() {
  if (raf) return;
  const step = () => {
    raf = 0;
    const r = R; if (!r) return;
    const c = position(), p = r.passages[r.index];
    if (c != null && p) {
      const t = tokAt(p, c);
      if (t !== r.lastTok || p.toks[t].j !== r.lastJ) { r.lastTok = t; r.lastJ = p.toks[t].j; paint(); }
    }
    const now = performance.now();
    if (now - lastProg > 250) { lastProg = now; progress(); }
    if (r.playing) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
function repaint() { if (R) { R.lastJ = -1; tick(); } }

const elOf = (w) => w.el || w.src?.el || null;
const drawn = (w) => (w.range ? w.range.startContainer.isConnected : !!elOf(w)?.isConnected);
/** A word's range without its quotes and punctuation. */
function trimmed(w) {
  if (!w.range) return { el: elOf(w) };
  const lead = w.text.match(/^[^\p{L}\p{N}]*/u)[0].length, tail = w.text.match(/[^\p{L}\p{N}]*$/u)[0].length;
  if (lead + tail >= w.text.length || w.range.startContainer !== w.range.endContainer) return w;
  const r = document.createRange();
  r.setStart(w.range.startContainer, w.range.startOffset + lead); r.setEnd(w.range.endContainer, w.range.endOffset - tail);
  return { range: r };
}
function paint() {
  const r = R, p = r.passages[r.index], tok = p?.toks[r.lastTok]; if (!tok) return;
  // the word, or (not drawn: a page with no text layer, a mark) the last drawn one before it
  let k = tok.j; while (k > tok.j - 8 && k > 0 && !drawn(r.words[k])) k--;
  const w = drawn(r.words[k]) ? r.words[k] : null;
  const mark = w ? trimmed(w) : null;
  highlight('tts-word', mark ? [mark] : []);
  dodge(mark);
  const [a, b] = p.sents[tok.s]; const ws = r.words.slice(a, b + 1).filter(drawn);
  let marks = ws.filter((x) => !x.range).map((x) => ({ el: elOf(x) }));
  const rs = ws.filter((x) => x.range);
  if (rs.length) { // one range over the sentence, spaces included: an even tint
    try { const s = document.createRange(); s.setStart(rs[0].range.startContainer, rs[0].range.startOffset); s.setEnd(rs.at(-1).range.endContainer, rs.at(-1).range.endOffset); marks = marks.concat({ range: s }); } catch { marks = marks.concat(rs); }
  }
  highlight('tts-sentence', marks);
  if (globalThis.CSS?.highlights) { const hw = CSS.highlights.get('tts-word'), hs = CSS.highlights.get('tts-sentence'); if (hw) hw.priority = 2; if (hs) hs.priority = 1; }
  follow(r.words[tok.j]);
}

/** Whether a word is on screen now. */
function onScreen(w, r = R) {
  if (w.range && live?.id === r.it.id && live.flow.contains(w.range.startContainer)) {
    const a = w.range.getBoundingClientRect(), b = live.port.getBoundingClientRect();
    return a.width > 0 && a.left >= b.left - 2 && a.right <= b.right + 2;
  }
  if (w.range) return false;
  const s = state.start.get(r.i) ?? 0;
  return w.page >= s && w.page < s + Math.max(1, state.shown || 1);
}
/** Keep the spoken word on screen, unless the reader turned the page lately. */
function follow(w) {
  const r = R;
  if (!w || state.view !== 'feed' || current() !== r.i) return;
  const now = Date.now();
  if (now < holdUntil || now < settleUntil) return;
  if (w.range && !(live?.id === r.it.id && live.flow.contains(w.range.startContainer))) return; // relayout pending
  if (onScreen(w)) return;
  settleUntil = now + 400; // the columns slide for 140 ms
  reveal(w);
}
on('nav', ({ type, it }) => { if (R && it?.id === R.it.id && type !== 'item') holdUntil = Date.now() + HOLD_MS; });
on('flow:jump', () => { if (R) holdUntil = Date.now() + HOLD_MS; });
on('item:shown', ({ it }) => { if (R && it.id !== R.it.id) stopReading(); });
on('spread:rendered', ({ it, flow }) => {
  const r = R; if (!r || it.id !== r.it.id) return;
  if (flow) { const w0 = r.words.find((w) => w.range); if (w0 && !flow.flow.contains(w0.range.startContainer)) rebindFlow(r); else repaint(); }
  else bindShown(r);
});
on('textlayer:ready', ({ it }) => { if (R && it?.id === R.it.id) repaint(); }); // a page's spans just arrived

// ---------- keys and the pointer ----------
function toggle() {
  const it = items[current()];
  if (!R || R.it.id !== it?.id) return begin();
  if (R.loading && !R.passages.length) return;
  if (R.playing) return pause();
  const w = R.words[R.lastJ];
  if (!w || onScreen(w)) return resume();
  begin(); // the reader moved on while paused: from the top of the screen
}
function setRate(v) {
  prefs.rate = v; savePrefs();
  if (R) {
    if (R.engine === 'gemini') { if (audio) audio.playbackRate = v; }
    else if (R.playing) speak(resumePoint()); // a browser utterance's rate is fixed: restart at the word
  }
  paintBar();
}
function stepRate(d) {
  let k = SPEEDS.findIndex((s) => s >= prefs.rate - 1e-6); if (k < 0) k = SPEEDS.length - 1;
  if (d > 0 && SPEEDS[k] > prefs.rate) k--; // between steps: the next one up is k itself
  setRate(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, k + d))]);
  toast(`Reading speed ${prefs.rate}×`, { icon: 'gauge', sub: '< slower · > faster' });
}
registerKey('v', toggle, { help: ['v V', 'read aloud from the top of the screen (Alt+click a word: from there) / stop'], order: 45 });
registerKey('V', () => stopReading(false)); // a stop forgets the place: v then reads from the top of the screen
registerKey('<', () => stepRate(-1), { help: ['< >', 'slower / faster reading'], order: 46 });
registerKey('>', () => stepRate(1));

/** The flow word at a caret (or the next one after it): binary search by comparePoint. */
function wordAtCaret(words, node, off) {
  let lo = 0, hi = words.length - 1, ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1; let c;
    try { c = words[m].range.comparePoint(node, off); } catch { return -1; }
    if (c === 0) return m;
    if (c < 0) { ans = m; hi = m - 1; } else lo = m + 1;
  }
  return ans;
}
async function readFromPoint(x, y, target) {
  const it = items[current()];
  if (isFlow(it)) {
    const cp = document.caretPositionFromPoint?.(x, y), cr = cp ? null : document.caretRangeFromPoint?.(x, y);
    const node = cp?.offsetNode || cr?.startContainer, off = cp ? cp.offset : cr?.startOffset;
    if (!node) return;
    const got = R && R.it.id === it.id && R.kind === 'flow' ? { words: R.words } : await currentWords();
    const j = got ? wordAtCaret(got.words, node, off) : -1;
    if (j >= 0) begin({ j }); else toast('No text there to read', { icon: 'volume-x' });
    return;
  }
  const pg = target.closest('.pg[data-k]'); if (!pg) return;
  const k = Number(pg.dataset.k);
  const display = (await currentWords().catch(() => null))?.words.filter((w) => w.page === k) || [];
  // The span whose box holds the point, nearest its centre: text-layer spans overlap their neighbours.
  let d = -1, best = Infinity;
  display.forEach((w, j) => {
    const r = w.el?.getBoundingClientRect(); if (!r?.width) return;
    const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    const dist = Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2) + (inside ? 0 : 1e3);
    if (dist < best && dist < 1e3 + 30) { best = dist; d = j; }
  });
  begin({ page: k, d: d >= 0 ? d : null, display });
}
// Alt+click a word: read from there. Capture phase, before links (Alt+click downloads one) and zoom.
document.addEventListener('mousedown', (e) => { if (e.altKey && e.button === 0 && e.target.closest?.('#spread')) e.preventDefault(); }, true);
document.addEventListener('click', (e) => {
  if (!e.altKey || e.button !== 0 || state.view !== 'feed' || !e.target.closest?.('#spread')) return;
  e.preventDefault(); e.stopPropagation();
  readFromPoint(e.clientX, e.clientY, e.target);
}, true);
addEventListener('pagehide', () => stopReading());

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
  const want = R && R.engine === 'browser' && R.playing;
  if (want) { loop ||= Object.assign(new Audio(silentClip()), { loop: true }); if (loop.paused) loop.play().catch(() => {}); } else if (loop && !loop.paused) loop.pause();
  const ms = navigator.mediaSession; if (!ms) return;
  const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch { /* unknown here */ } };
  if (!R) { ms.metadata = null; ms.playbackState = 'none'; for (const a of ['play', 'pause', 'stop', 'nexttrack', 'previoustrack']) set(a, null); return; }
  if (typeof MediaMetadata !== 'undefined' && ms.metadata?.title !== R.it.t) ms.metadata = new MediaMetadata({ title: R.it.t, artist: R.it.a || 'Stacks', album: 'Read aloud' });
  ms.playbackState = R.playing ? 'playing' : 'paused';
  set('play', resume); set('pause', pause); set('stop', () => stopReading());
  set('nexttrack', () => skip(1)); set('previoustrack', () => skip(-1));
}

// ---------- the player bar (bottom right) ----------
let bar = null;
const DODGE = 46; // px the bar steps up while the spoken word is under it (it then covers lines already read)
function dodge(mark) {
  if (!bar || bar.hidden || bar.matches(':hover, :focus-within')) return;
  const r = (mark?.range || mark?.el)?.getBoundingClientRect();
  const b = bar.getBoundingClientRect(), up = bar.classList.contains('dodge') ? DODGE : 0;
  const under = !!r?.width && r.bottom > b.top + up - 8 && r.top < b.bottom + up + 8 && r.right > b.left - 8;
  bar.classList.toggle('dodge', under);
}
let noteTimer = 0;
const ICON = {
  play: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" fill="currentColor"/></svg>',
};
const blurred = (fn) => (e) => { e.currentTarget.blur(); fn(e); }; // keep keys for the page
function buildBar() {
  const play = h('button', { className: 'ra-play', onclick: blurred(() => toggle()) });
  const fill = h('i');
  const prog = h('div', { className: 'ra-prog', title: 'Click to read from there' }, fill);
  prog.onclick = (e) => seekFraction(e.offsetX / prog.clientWidth);
  const left = h('span', { className: 'ra-left' });
  const speed = h('select', { className: 'ra-speed', title: 'Speed (< >)' }, ...SPEEDS.map((s) => h('option', { value: String(s), textContent: `${s}×` })));
  speed.onchange = () => { setRate(Number(speed.value)); speed.blur(); };
  const voice = h('select', { className: 'ra-voice', title: 'Voice' });
  voice.onchange = () => { setVoice(voice.value); voice.blur(); };
  const x = h('button', { className: 'ra-x', title: 'Stop (V)', ariaLabel: 'Stop reading', textContent: '×', onclick: blurred(() => stopReading(false)) });
  const note = h('div', { className: 'ra-note', hidden: true, title: 'Click to dismiss', onclick: () => { if (R) R.notice = ''; paintBar(); } });
  bar = h('div', { id: 'ra-bar', className: 'ra', role: 'region', ariaLabel: 'Read aloud' }, note, play, prog, left, speed, voice, x);
  Object.assign(bar, { play, fill, left, speed, voice, note });
  document.body.append(bar);
  fillVoices();
  if (hasSynth) speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
}
const shortName = (v) => v.name.replace(/^(Microsoft|Google|Apple)\s+/, '').replace(/\s+Online.*$/, '').replace(/\s*\(.*\)$/, '').replace(/\s+-\s+.*$/, '');
function fillVoices() {
  if (!bar) return;
  const all = hasSynth ? speechSynthesis.getVoices() : [];
  const base = (navigator.language || 'en').slice(0, 2).toLowerCase();
  const mine = all.filter((v) => v.lang.toLowerCase().startsWith(base) || v.voiceURI === prefs.browserVoice);
  const names = gem.voices?.length ? gem.voices : ['Kore', 'Puck', 'Charon', 'Aoede', 'Gacrux', 'Achird', 'Autonoe', 'Erinome'];
  bar.voice.replaceChildren(
    h('optgroup', { label: all.length ? 'This browser' : 'This browser (no voices found)' },
      h('option', { value: 'b:', textContent: 'Browser voice' }),
      ...mine.map((v) => h('option', { value: 'b:' + v.voiceURI, textContent: shortName(v) + (v.localService ? '' : ' ☁') }))),
    h('optgroup', { label: gem.enabled ? 'Gemini' : 'Gemini (needs GEMINI_API_KEY)' },
      ...names.map((n) => h('option', { value: 'g:' + n, textContent: 'Gemini ' + n, disabled: !gem.enabled }))));
  const eng = R ? R.engine : (prefs.engine === 'gemini' && gem.enabled ? 'gemini' : 'browser');
  bar.voice.value = eng === 'gemini' ? 'g:' + prefs.geminiVoice : 'b:' + (mine.some((v) => v.voiceURI === prefs.browserVoice) ? prefs.browserVoice : '');
  bar.voice.title = gem.enabled ? 'Voice' : 'Voice · Gemini voices need GEMINI_API_KEY (or GOOGLE_API_KEY) set where the server runs';
}
function setVoice(val) {
  const kind = val[0], name = val.slice(2);
  if (kind === 'g') {
    if (!gem.enabled) { if (R) { R.notice = 'Gemini voices need GEMINI_API_KEY (or GOOGLE_API_KEY) set where the server runs.'; paintBar(); } return; }
    Object.assign(prefs, { engine: 'gemini', geminiVoice: name });
  } else Object.assign(prefs, { engine: 'browser', browserVoice: name });
  savePrefs();
  if (!R) return;
  const playing = R.playing;
  R.notice = '';
  recut(prefs.engine);
  if (playing) speak(0);
  paintBar(); syncMedia();
}
/** Read from a share of the item (a click on the progress line). */
function seekFraction(f) {
  const r = R; if (!r) return;
  f = Math.max(0, Math.min(1, f));
  holdUntil = 0;
  if (r.kind === 'flow') { const j = Math.min(r.words.length - 1, Math.floor(f * r.words.length)); reveal(r.words[j]); begin({ j }); }
  else { const k = Math.min((r.it.n || 1) - 1, Math.floor(f * (r.it.n || 1))); reveal({ page: k }); begin({ page: k }); }
}
const clock = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`; };
function progress() {
  const r = R; if (!r || !bar) return;
  const p = r.passages[r.index], tok = p?.toks[r.lastTok];
  const j = tok?.j ?? 0;
  if (r.kind === 'flow') {
    let chars = p ? p.text.length - (tok?.at ?? 0) : 0;
    for (let x = r.index + 1; x < r.passages.length; x++) chars += r.passages[x].text.length + 1;
    bar.fill.style.width = ((100 * j) / Math.max(1, r.words.length - 1)).toFixed(1) + '%';
    bar.left.textContent = '−' + clock(chars / (CPS * prefs.rate));
    bar.left.title = `about ${clock(chars / (CPS * prefs.rate))} left at ${prefs.rate}×`;
  } else {
    const n = r.it.n || 1, pg = r.words[j]?.page ?? 0;
    bar.fill.style.width = ((100 * (pg + 0.5)) / n).toFixed(1) + '%';
    bar.left.textContent = `p.${pg + 1}`;
    bar.left.title = `page ${pg + 1} of ${n}`;
  }
}
function paintBar() {
  if (!R) { if (bar) bar.hidden = true; return; }
  if (!bar) buildBar();
  bar.hidden = false;
  bar.classList.toggle('playing', R.playing);
  bar.classList.toggle('loading', !!R.loading && R.playing);
  bar.play.innerHTML = R.playing ? ICON.pause : ICON.play;
  bar.play.title = R.playing ? 'Pause (v)' : 'Play (v)';
  bar.play.ariaLabel = bar.play.title;
  if (![...bar.speed.options].some((o) => o.value === String(prefs.rate))) bar.speed.append(h('option', { value: String(prefs.rate), textContent: `${prefs.rate}×` }));
  bar.speed.value = String(prefs.rate);
  const v = R.engine === 'gemini' ? 'g:' + prefs.geminiVoice : 'b:' + (prefs.browserVoice || '');
  if (bar.voice.value !== v) { bar.voice.value = v; if (bar.voice.value !== v) fillVoices(); }
  if (bar.note.textContent !== (R.notice || '')) {
    bar.note.textContent = R.notice || '';
    clearTimeout(noteTimer);
    if (R.notice) noteTimer = setTimeout(function fade() { if (bar.note.matches(':hover')) noteTimer = setTimeout(fade, 3000); else if (R) { R.notice = ''; paintBar(); } }, 12000);
  }
  bar.note.hidden = !R.notice;
  progress();
}

// For the Settings sheet (features/settings.js): the saved voice and speed, and
// the setters the bar uses (they also retune a reading in progress).
export { prefs as readAloudPrefs, setRate as setReadRate, setVoice as setReadVoice };
