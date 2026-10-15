// Rescue: images and documents that no longer load from where they were
// published. Used by routes/14-media.mjs (the /img route, the reader's
// reports, the scavenger) and by cache.mjs (dead documents, through onDead).
//
// An image is fetched once into the disk cache and checked: HTTP errors, HTML
// instead of an image, known placeholders (imgur's removed.png and its region
// block, Flickr / Photobucket / Tinypic placeholders, 1x1 pixels; by final
// URL, size, dimensions and content hash) all count as broken. A broken image
// is looked for elsewhere, in order: the post's own other copies (srcset on
// LessWrong / EA Forum), simple mirrors (https, i.imgur.com direct forms,
// Wikimedia originals, Substack's image proxy), then the Internet Archive's
// Wayback Machine (availability API, then CDX; the raw "id_" snapshot, the
// earliest and the latest). The first good copy is stored under the original
// URL with where it came from; failures are remembered and retried after a day.
//
// State lives in CACHE/rescue.json: broken and rescued items, learned
// placeholder hashes, a log of what was rescued and the scavenger's runs.
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, renameSync } from 'fs';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { CACHE, UA, HERE } from './config.mjs';
import * as cache from './cache.mjs';

export const MAX_IMG = 15 * 1024 * 1024;       // bigger images are not proxied: the reader loads them directly
const MAX_DOC = 300 * 1024 * 1024;
const DAY = 864e5;
const WAYBACK = (process.env.STACKS_WAYBACK || 'https://web.archive.org').replace(/\/+$/, '');
const WAYBACK_API = process.env.STACKS_WAYBACK_API || 'https://archive.org/wayback/available';
const sha1 = (b) => createHash('sha1').update(b).digest('hex');
const now = () => Date.now();

// ------------------------------------------------------------------ state ----
const FILE = join(CACHE, 'rescue.json');
export const S = { v: 1, imgs: {}, docs: {}, placeholders: {}, seen: {}, blocked: {}, log: [], runs: [], ai: {} };
try { Object.assign(S, JSON.parse(readFileSync(FILE, 'utf-8'))); } catch { /* first run */ }
let saveT = null;
export function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    trim();
    try { writeFileSync(FILE + '.tmp', JSON.stringify(S)); renameSync(FILE + '.tmp', FILE); } catch (e) { console.warn('rescue: could not save state:', e.message); }
  }, 800);
  saveT.unref?.();
}
function trim() {
  S.log = S.log.slice(-500); S.runs = S.runs.slice(-40);
  const cap = (o, n) => { const ks = Object.keys(o); if (ks.length > n) for (const k of ks.slice(0, ks.length - n)) delete o[k]; };
  cap(S.imgs, 6000); cap(S.docs, 2000); cap(S.seen, 6000); cap(S.placeholders, 500);
}
process.on('exit', () => { if (saveT) { clearTimeout(saveT); try { trim(); writeFileSync(FILE, JSON.stringify(S)); } catch { /* read-only */ } } });

/** Something was rescued: kept in the log (CACHE/rescue.json) and printed. */
function logRescue(kind, u, rec, how) {
  S.log.push({ at: now(), kind, u, via: rec.via, from: rec.from, ts: rec.ts || undefined, how });
  console.log(`rescue: ${kind} ${u.slice(0, 90)} <- ${rec.via}${rec.ts ? ' ' + rec.ts.slice(0, 8) : ''} (${how})`);
  bump(); save();
}
let countsMemo = null;
const bump = () => { countsMemo = null; };
/** Counts for /status. */
export function counts() {
  if (countsMemo) return countsMemo;
  const c = { imagesBroken: 0, imagesRescued: 0, imagesTooBig: 0, docsArchived: 0, docsBroken: 0, placeholders: Object.keys(S.placeholders).length + KNOWN_PLACEHOLDERS.size, suggestions: 0 };
  for (const r of Object.values(S.imgs)) { if (r.st === 'bad') c.imagesBroken++; else if (r.st === 'rescued') c.imagesRescued++; else if (r.st === 'big') c.imagesTooBig++; if (r.sug?.length) c.suggestions++; }
  for (const r of Object.values(S.docs)) { if (r.st === 'rescued') c.docsArchived++; else if (r.st === 'bad') c.docsBroken++; }
  return (countsMemo = c);
}

// ------------------------------------------------------- documents we serve ----
// Web articles and PDFs in the corpus: their URLs fall back to the archive.
const DOCS = new Map(); // url -> {kind, t, a, id}
try {
  const { items } = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
  for (const it of items) if ((it.kind === 'web' || it.kind === 'pdf') && it.url) DOCS.set(it.url, { kind: it.kind, t: it.t, a: it.a, id: it.id });
} catch { /* no corpus */ }
export const docInfo = (u) => DOCS.get(u) || null;
/** A document the corpus file did not list at startup (another lane, a rebuilt corpus): it falls back to the archive too. */
export function addDoc(u, { kind, t = '', a = '', id } = {}) {
  if (u && !DOCS.has(u) && (kind === 'web' || kind === 'pdf') && okUrl(u)) DOCS.set(u, { kind, t: String(t).slice(0, 300), a: String(a).slice(0, 200), id });
}

// ---------------------------------------------------------------- fetching ----
/** Only http(s), and never this machine or the local network (a post could point anywhere). */
const PRIVATE = /^(localhost|.*\.local|.*\.localhost|.*\.internal|0\.\d+\.\d+\.\d+|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[?::1?\]?|\[?f[cd][0-9a-f]*:.*|\[?fe80:.*)$/i;
const TRUSTED = [WAYBACK, WAYBACK_API.replace(/^(https?:\/\/[^/]+).*$/, '$1')];
export function okUrl(u) {
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol)) return false;
    if (TRUSTED.some((t) => u.startsWith(t + '/'))) return true;
    return !PRIVATE.test(x.hostname) && x.hostname.includes('.');
  } catch { return false; }
}

// Per-host politeness: a few requests at a time per host, foreground first;
// the Internet Archive gets two at a time with gaps, more so in the background.
// 429 and 503 pause the host (Retry-After honoured).
class Lim {
  constructor(name, conc, gapFg = 0, gapBg = 0) { Object.assign(this, { name, conc, gapFg, gapBg, active: 0, next: 0, pause: 0, wait: [], timer: null, n: 0 }); }
  acquire(job) { return new Promise((resolve) => { this.wait.push({ job, resolve }); this.grant(); }); }
  release() { this.active--; this.grant(); }
  hold(ms) { this.pause = Math.max(this.pause, now() + ms); }
  grant() {
    clearTimeout(this.timer); this.timer = null;
    while (this.wait.length && this.active < this.conc) {
      const w = this.wait.find((x) => x.job.fg) || this.wait[0];
      const t = Math.max(this.pause, this.next) - now();
      if (t > 0) { this.timer = setTimeout(() => this.grant(), t + 2); this.timer.unref?.(); return; }
      // Background work leaves a slot free for the reader.
      if (!w.job.fg && this.active >= Math.max(1, this.conc - 1)) return;
      this.wait.splice(this.wait.indexOf(w), 1);
      this.active++; this.n++;
      this.next = now() + (w.job.fg ? this.gapFg : this.gapBg);
      w.resolve();
    }
  }
}
const lims = new Map();
function limFor(u) {
  let host = '?'; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch { /* bad url */ }
  const wb = u.startsWith(WAYBACK) || u.startsWith(WAYBACK_API) || /(^|\.)archive\.org$/.test(host);
  const name = wb ? 'archive.org' : host.split('.').slice(-2).join('.');
  if (!lims.has(name)) lims.set(name, wb ? new Lim(name, 2, 250, 1500) : new Lim(name, 6, 0, 150));
  return lims.get(name);
}
const retryAfter = (v) => { if (!v) return 0; const s = Number(v); if (Number.isFinite(s)) return s * 1000; const t = Date.parse(v); return Number.isFinite(t) ? Math.max(0, t - now()) : 0; };

/**
 * GET a URL politely: no cookies, our User-Agent, redirects followed by hand
 * (http(s) only, never to private hosts), at most `max` bytes. Resolves to
 * {status, type, buf, final} or {status, type, big: true, final}.
 */
export async function grab(u, { max = MAX_IMG, job = { fg: true }, accept = '*/*', hops = 6, firstChunk = false } = {}) {
  let cur = u;
  for (let hop = 0; hop <= hops; hop++) {
    if (!okUrl(cur)) throw Object.assign(new Error('URL not allowed'), { code: 'blocked' });
    const L = limFor(cur);
    await L.acquire(job);
    try {
      const res = await fetch(cur, { headers: { 'User-Agent': UA, Accept: accept }, redirect: 'manual', signal: AbortSignal.timeout(job.fg ? 30e3 : 90e3) });
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) { await res.body?.cancel().catch(() => {}); cur = new URL(loc, cur).href; continue; }
      if (res.status === 429 || res.status === 503) L.hold(Math.min(300e3, Math.max(retryAfter(res.headers.get('retry-after')), 5000)));
      const type = res.headers.get('content-type') || '';
      const len = Number(res.headers.get('content-length')) || 0;
      if (len > max) { await res.body?.cancel().catch(() => {}); return { status: res.status, type, big: true, final: cur, len }; }
      const chunks = []; let got = 0;
      if (res.body) for await (const ch of res.body) {
        chunks.push(ch); got += ch.length;
        if (got > max) { return { status: res.status, type, big: true, final: cur, len: got }; }
        if (firstChunk && got > 65536) break;
      }
      return { status: res.status, type, buf: Buffer.concat(chunks), final: cur };
    } finally { L.release(); }
  }
  throw new Error('too many redirects');
}

// ------------------------------------------------------- images: checking ----
/** Format and pixel size from the first bytes (PNG, GIF, JPEG, WebP, AVIF, BMP, ICO, SVG). */
export function sniff(b) {
  if (!b || b.length < 12) return null;
  try {
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { f: 'png', w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b.toString('ascii', 0, 3) === 'GIF') return { f: 'gif', w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      for (let i = 2; i + 9 < b.length;) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { f: 'jpeg', w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
        i += 2 + b.readUInt16BE(i + 2);
      }
      return { f: 'jpeg' };
    }
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const c = b.toString('ascii', 12, 16);
      if (c === 'VP8X') return { f: 'webp', w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (c === 'VP8L') { const v = b.readUInt32LE(21); return { f: 'webp', w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
      if (c === 'VP8 ') return { f: 'webp', w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      return { f: 'webp' };
    }
    if (b.toString('ascii', 4, 8) === 'ftyp' && /avif|avis|heic|mif1/.test(b.toString('ascii', 8, 12))) {
      const k = b.indexOf('ispe'); return k > 0 ? { f: 'avif', w: b.readUInt32BE(k + 8), h: b.readUInt32BE(k + 12) } : { f: 'avif' };
    }
    if (b.toString('ascii', 0, 2) === 'BM') return { f: 'bmp', w: b.readInt32LE(18), h: Math.abs(b.readInt32LE(22)) };
    if (b.readUInt32LE(0) === 0x00010000) return { f: 'ico', w: b[6] || 256, h: b[7] || 256 };
    const head = b.toString('utf-8', 0, Math.min(b.length, 2000)).replace(/^﻿/, '').trimStart();
    if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg\b/i.test(head)) {
      const tag = (head.match(/<svg\b[^>]*>/i) || [''])[0];
      const num = (a) => { const m = tag.match(new RegExp(`\\b${a}\\s*=\\s*["']?([\\d.]+)(px)?["'\\s>]`, 'i')); return m ? Math.round(parseFloat(m[1])) : 0; };
      let w = num('width'), h = num('height');
      const vb = tag.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
      if ((!w || !h) && vb) { w = Math.round(parseFloat(vb[1])); h = Math.round(parseFloat(vb[2])); }
      return { f: 'svg', w: w || 0, h: h || 0 };
    }
  } catch { /* truncated */ }
  return null;
}
const MIME = { png: 'image/png', gif: 'image/gif', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml' };

// Placeholders by content hash: the ones we know, plus ones learned at run time
// (S.placeholders): the canary below, identical bytes behind different image
// ids on an image host, and images the reader flagged.
const KNOWN_PLACEHOLDERS = new Map([
  ['20002faf28adfd94ca98cf6ced46f14334b53684', 'imgur removed.png'],
]);
const isPlaceholder = (h) => KNOWN_PLACEHOLDERS.has(h) || !!S.placeholders[h];
// Where image hosts send you when the image is gone (the final URL after redirects).
const PLACEHOLDER_URL = [
  /(^|\.)imgur\.com\/removed\.(png|jpe?g|gif)\b/i,
  /photo_unavailable/i,
  /(pbsrc\.com|photobucket\.com).*(thirdparty|upgrade|unavailable|error|placeholder)/i,
  /tinypic\.com\/?(\?.*)?$/i, /tinypic\.com\/.*(removed|unavailable|error)/i,
  /imageshack\.(us|com)\/.*(removed|unavailable|404)/i,
  /\/(removed|unavailable|no[-_]?image|image[-_]?(not[-_]?found|unavailable|removed)|placeholder|default[-_]?image)\.(png|jpe?g|gif|svg|webp)(\?|$)/i,
];
// Image hosts where two different image ids never legitimately share bytes,
// so shared bytes mean a placeholder.
const HOSTING = /(^|\.)(imgur\.com|photobucket\.com|tinypic\.com|staticflickr\.com|flickr\.com|imageshack\.(us|com)|postimg\.(cc|org)|ibb\.co|imgbox\.com|picpaste\.com|minus\.com|imagebam\.com)$/i;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
function idKey(u) {
  const h = hostOf(u);
  if (/imgur\.com$/.test(h)) return 'imgur:' + (imgurId(u) || u);
  try { return h + new URL(u).pathname; } catch { return u; }
}
/** imgur image id from any of its URL forms (i.imgur.com/ID.png, imgur.com/ID, size-suffixed thumbnails). */
export function imgurId(u) {
  const m = String(u).match(/^https?:\/\/(?:i\.|m\.|www\.)?imgur\.com\/(?!a\/|gallery\/|r\/|t\/|user\/)([A-Za-z0-9]{5,8})(?:\.[a-z0-9]+)?(?:[?#].*)?$/i);
  if (!m || /^removed$/i.test(m[1])) return null;
  // Ids are 5 or 7 characters; a trailing size letter on a 6- or 8-character name is a thumbnail suffix.
  const id = m[1];
  return (id.length === 6 || id.length === 8) && /[sbtmlh]$/.test(id) ? id.slice(0, -1) : id;
}

/** Is a fetched response a usable image? {ok, w, h, type, hash} or {bad: reason} or {big}. */
export function judgeImage(r, u) {
  if (r.big) return { big: true };
  if (r.status >= 400) return { bad: 'HTTP ' + r.status };
  if (!r.buf?.length) return { bad: 'empty' };
  const sn = sniff(r.buf);
  if (!sn) return { bad: /html/i.test(r.type) || /^\s*</.test(r.buf.toString('utf-8', 0, 64)) ? 'a web page, not an image' : 'not an image' };
  if (r.status !== 200 && r.status !== 203) return { bad: 'HTTP ' + r.status };
  const hash = sha1(r.buf);
  if (isPlaceholder(hash)) return { bad: 'placeholder (' + (KNOWN_PLACEHOLDERS.get(hash) || S.placeholders[hash]?.why || 'known') + ')', hash };
  if (r.final && r.final !== u && PLACEHOLDER_URL.some((re) => re.test(r.final))) return { bad: 'placeholder (redirected to ' + r.final.slice(0, 80) + ')', hash };
  if (sn.w && sn.h && sn.w <= 2 && sn.h <= 2 && sn.f !== 'svg') return { bad: 'tiny (' + sn.w + 'x' + sn.h + ')', hash, tiny: true };
  if (/imgur\.com$/.test(hostOf(r.final || u)) && sn.w === 161 && sn.h === 81) return { bad: 'placeholder (imgur removed)', hash };
  return { ok: true, w: sn.w || 0, h: sn.h || 0, type: MIME[sn.f] || r.type, hash, f: sn.f };
}

/** Learn a placeholder (its bytes) and forget cached copies that turn out to be it. */
export function learnPlaceholder(hash, why, extra = {}) {
  if (!hash || isPlaceholder(hash)) return false;
  S.placeholders[hash] = { why, at: now(), ...extra };
  console.log(`rescue: learned a placeholder image (${why}) ${hash.slice(0, 10)}`);
  bump(); save();
  return true;
}
// Two different image ids on an image host with the same bytes: a placeholder.
function noteSeen(u, hash) {
  if (!HOSTING.test(hostOf(u))) return false;
  const prev = S.seen[hash];
  const k = idKey(u);
  if (!prev) { S.seen[hash] = k; save(); return false; }
  if (prev === k) return false;
  return learnPlaceholder(hash, 'same image behind different ids on ' + hostOf(u), { ids: [prev, k] });
}

// ------------------------------------------------------- images: storing ----
async function store(u, buf, type, extra) {
  const p = cache.paths(u);
  await mkdir(p.d, { recursive: true });
  await writeFile(p.body, buf);
  const m = { url: u, type, size: buf.length, at: now(), img: 1, ...extra };
  await writeFile(p.meta, JSON.stringify(m)); // last: cached() means the body is complete
  try { cache.meta(u); } catch { /* registers it with the cache index for eviction */ }
  cache.stats.fetched++; cache.stats.bytes += buf.length;
  return m;
}
async function forget(u) { const p = cache.paths(u); await unlink(p.meta).catch(() => {}); await unlink(p.body).catch(() => {}); }
/** The cached image for a URL, if it is still good: its meta, else null. */
export function cachedImage(u) {
  if (!cache.cached(u)) return null;
  let m; try { m = cache.meta(u); } catch { return null; }
  if (m.img) return m.sha1 && isPlaceholder(m.sha1) ? null : m;
  return null;
}

// --------------------------------------------------------------- mirrors ----
/** Live alternatives to try for an image URL, best first. */
export function liveMirrors(u, alts = [], { blockedImgur = !!S.blocked.imgur } = {}) {
  const out = [];
  const add = (x) => { if (x && x !== u && okUrl(x) && !out.includes(x)) out.push(x); };
  for (const a of alts) add(a); // the post's own other copies (LessWrong / EA Forum CDN in srcset)
  let x; try { x = new URL(u); } catch { return out; }
  const host = x.hostname.replace(/^www\./, '').toLowerCase();
  if (x.protocol === 'http:') add('https:' + u.slice(5));
  if (/(^|\.)imgur\.com$/.test(host) && !blockedImgur) {
    const id = imgurId(u);
    const ext = (x.pathname.match(/\.(png|jpe?g|gif|webp)$/i) || [])[1];
    if (id) for (const e of [ext, 'png', 'jpg', 'gif'].filter(Boolean)) add(`https://i.imgur.com/${id}.${e.replace('jpeg', 'jpg')}`);
  }
  const wm = /^upload\.wikimedia\.org$/.test(host) && x.pathname.match(/^\/wikipedia\/([^/]+)\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/(\d+)px-([^/]+)$/);
  if (wm) {
    add(`https://upload.wikimedia.org/wikipedia/${wm[1]}/${wm[2]}`);
    for (const w of [500, 960, 330, 250]) add(`https://upload.wikimedia.org/wikipedia/${wm[1]}/thumb/${wm[2]}/${w}px-${wm[4]}`);
  }
  const ss = u.match(/^https?:\/\/(?:cdn\.substack\.com|substackcdn\.com)\/image\/fetch\/([^/]+)\/(https?(?:%3A|:)(?:%2F|\/).+)$/i);
  if (ss) { add(`https://substackcdn.com/image/fetch/${ss[1]}/${ss[2]}`); try { add(decodeURIComponent(ss[2])); } catch { /* bad escape */ } }
  const tw = /^pbs\.twimg\.com$/.test(host) && x.pathname.match(/^\/media\/([\w-]+)(?:\.(\w+))?$/);
  if (tw) { const f = x.searchParams.get('format') || tw[2] || 'jpg'; add(`https://pbs.twimg.com/media/${tw[1]}?format=${f}&name=orig`); add(`https://pbs.twimg.com/media/${tw[1]}.${f}`); }
  return out;
}
/** URLs worth asking the Wayback Machine about for an image: the URL itself and its other forms. */
export function waybackKeys(u) {
  const out = [u];
  const bare = (x) => x.replace(/^https?:\/\//, '');
  const add = (x) => { if (x && !out.some((y) => bare(y) === bare(x))) out.push(x); }; // the archive ignores the scheme
  const id = imgurId(u);
  if (id) { const ext = (u.match(/\.(png|jpe?g|gif)(?:[?#]|$)/i) || [])[1]; for (const e of [ext, 'jpg', 'png', 'gif'].filter(Boolean)) add(`http://i.imgur.com/${id}.${e}`); }
  const wm = u.match(/^(https?:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/\d+px-[^/]+$/);
  if (wm) add(`${wm[1]}/${wm[2]}`);
  const tw = u.match(/^https?:\/\/pbs\.twimg\.com\/media\/([\w-]+)/);
  if (tw) { add(`https://pbs.twimg.com/media/${tw[1]}.jpg`); add(`https://pbs.twimg.com/media/${tw[1]}?format=jpg&name=orig`); }
  return out.slice(0, 4);
}

// --------------------------------------------------------------- wayback ----
const wbMemo = new Map(); // key|kind -> {at, snaps}
const tsDate = (ts) => (ts ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}` : '');
/**
 * Snapshots of a URL in the Wayback Machine that returned 200: the earliest
 * and the latest (latest first for documents, earliest first for images,
 * which are likelier to have been replaced by a placeholder later).
 */
export async function waybackSnaps(u, { job = { fg: true }, kind = 'img' } = {}) {
  const mk = u + '|' + kind;
  const hit = wbMemo.get(mk);
  if (hit && now() - hit.at < 6 * 3600e3) return hit.snaps;
  const snaps = [];
  const add = (ts, orig) => { if (ts && /^\d{8,14}$/.test(ts) && !snaps.some((s) => s.ts === ts)) snaps.push({ ts, orig: orig || u }); };
  const order = kind === 'img' ? ['19960101', ''] : ['', '19960101'];
  for (const t of order) {
    try {
      const r = await grab(`${WAYBACK_API}?url=${encodeURIComponent(u)}${t ? '&timestamp=' + t : ''}`, { max: 1e6, job, accept: 'application/json' });
      if (r.status !== 200 || !r.buf) continue;
      const c = JSON.parse(r.buf.toString('utf-8'))?.archived_snapshots?.closest;
      if (c && c.available !== false && String(c.status) === '200') {
        const m = String(c.url || '').match(/\/web\/(\d{8,14})[a-z_]*\/(.+)$/);
        add(c.timestamp || m?.[1], m?.[2]);
      }
    } catch { /* try the next */ }
  }
  // The availability API often answers with nothing, or a capture that was not
  // a 200; the CDX index lists every capture.
  if (!snaps.length) {
    for (const lim of kind === 'img' ? ['3', '-2'] : ['-2', '3']) {
      try {
        const q = `${WAYBACK}/cdx/search/cdx?url=${encodeURIComponent(u)}&output=json&fl=timestamp,original,statuscode,mimetype&filter=statuscode:200${kind === 'img' ? '&filter=mimetype:image/.*' : ''}&limit=${lim}${lim.startsWith('-') ? '&fastLatest=true' : ''}`;
        const r = await grab(q, { max: 2e6, job, accept: 'application/json' });
        if (r.status !== 200 || !r.buf?.length) continue;
        const rows = JSON.parse(r.buf.toString('utf-8') || '[]').slice(1);
        for (const row of lim.startsWith('-') ? rows.reverse() : rows) add(row[0], row[1]);
      } catch { /* none */ }
      if (snaps.length >= 2) break;
    }
  }
  wbMemo.set(mk, { at: now(), snaps });
  if (wbMemo.size > 3000) wbMemo.delete(wbMemo.keys().next().value);
  return snaps;
}
const rawSnap = (s) => `${WAYBACK}/web/${s.ts}id_/${s.orig}`;

// -------------------------------------------------------- images: resolving ----
const inflight = new Map(); // url -> {job, p}
const ctxs = new Map();     // url -> {alts, item, page, title, alt, w, h} from the reader
export function noteCtx(u, c) {
  if (!c) return;
  const cur = ctxs.get(u) || {};
  const alts = [...new Set([...(cur.alts || []), ...(c.alts || [])])].filter(okUrl).slice(0, 4);
  ctxs.set(u, { ...cur, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v != null && v !== '')), alts });
  if (ctxs.size > 4000) ctxs.delete(ctxs.keys().next().value);
  const r = S.imgs[u];
  if (r && r.st === 'bad') { r.ctx = { ...(r.ctx || {}), ...trimCtx(ctxs.get(u)) }; save(); }
}
const trimCtx = (c = {}) => ({ item: c.item, page: c.page, title: c.title?.slice(0, 200), alt: c.alt?.slice(0, 300), w: c.w, h: c.h, alts: c.alts?.length ? c.alts : undefined });

/** What we know about an image URL without fetching it. */
export function imageInfo(u) {
  const r = S.imgs[u];
  const m = cachedImage(u);
  if (m) return { st: m.via ? 'rescued' : 'ok', w: m.w, h: m.h, via: m.via, from: m.from, ts: m.ts };
  if (r?.st === 'big') return { st: 'big' };
  if (r?.st === 'bad') return { st: inflight.has(u) ? 'pending' : 'bad', why: r.why, sug: r.sug?.map((s) => s.url), w: r.ctx?.w, h: r.ctx?.h };
  if (inflight.has(u)) return { st: 'pending' };
  return null;
}

/**
 * Make sure we have a good copy of an image: from the cache, the original,
 * a mirror or the Wayback Machine. Resolves to {st: 'ok'|'rescued', meta} |
 * {st: 'big'} | {st: 'bad', why}. Foreground jobs jump the queues.
 */
export function resolveImage(u, { fg = true, how = 'reader', force = false } = {}) {
  const cur = inflight.get(u);
  if (cur) { if (fg) cur.job.fg = true; return cur.p; }
  const job = { fg };
  const p = doResolve(u, job, how, force).catch((e) => ({ st: 'bad', why: e.message })).finally(() => inflight.delete(u));
  inflight.set(u, { job, p });
  return p;
}
async function doResolve(u, job, how, force) {
  const m = cachedImage(u);
  if (m && !force) return { st: m.via ? 'rescued' : 'ok', meta: m };
  if (cache.cached(u)) {
    // Cached by someone else (the /proxy route), or a cached placeholder: check it again.
    let mm = null; try { mm = cache.meta(u); } catch { /* evicted */ }
    if (mm && !mm.img && !force) {
      const v = judgeImage({ status: 200, type: mm.type, buf: cache.read(u), final: mm.final || u }, u);
      if (v.ok) { const meta = await store(u, cache.read(u), v.type, { w: v.w, h: v.h, sha1: v.hash }); return { st: 'ok', meta }; }
    }
    await forget(u);
  }
  const prev = S.imgs[u];
  // A copy we found before (and lost to eviction): go straight back to it.
  if (prev?.st === 'rescued' && prev.from) {
    const got = await tryCopy(u, prev.from, job, { via: prev.via, ts: prev.ts }, null);
    if (got) return got;
  }
  let why = 'unknown';
  // imgur blocked from here (the canary): its originals only return the block's placeholder.
  const skipLive = !!S.blocked.imgur && /(^|\.)imgur\.com$/.test(hostOf(u));
  if (skipLive) why = 'imgur is blocked from here';
  else {
    try {
      const r = await grab(u, { job, accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5' });
      const v = judgeImage(r, u);
      if (v.big) { S.imgs[u] = { st: 'big', at: now() }; bump(); save(); return { st: 'big' }; }
      if (v.ok) {
        if (noteSeen(r.final || u, v.hash)) why = 'placeholder (same image behind different ids)';
        else {
          const meta = await store(u, r.buf, v.type, { w: v.w, h: v.h, sha1: v.hash, ...(r.final !== u ? { final: r.final } : {}) });
          if (prev) { delete S.imgs[u]; bump(); save(); }
          return { st: 'ok', meta };
        }
      } else why = v.bad;
    } catch (e) { why = e.cause?.code || e.code || e.message; }
  }
  const got = await rescueImage(u, job, how, why);
  if (got) return got;
  const r = (S.imgs[u] ||= {});
  Object.assign(r, { st: 'bad', why, at: now(), next: now() + backoff(r.tries || 0) });
  r.tries = (r.tries || 0) + 1;
  const c = ctxs.get(u); if (c) r.ctx = { ...(r.ctx || {}), ...trimCtx(c) };
  bump(); save();
  return { st: 'bad', why };
}
const backoff = (tries) => Math.min(30, 2 ** tries) * DAY;

/** Fetch a candidate copy and keep it under the original URL if it is a good image. */
async function tryCopy(u, from, job, extra, how) {
  try {
    const r = await grab(from, { job, accept: 'image/*,*/*;q=0.5' });
    const v = judgeImage(r, from);
    if (!v.ok) return null;
    if (HOSTING.test(hostOf(from)) && !extra.via?.startsWith('Internet Archive') && noteSeen(from, v.hash)) return null;
    const meta = await store(u, r.buf, v.type, { w: v.w, h: v.h, sha1: v.hash, via: extra.via, from, ...(extra.ts ? { ts: extra.ts } : {}) });
    const rec = (S.imgs[u] ||= {});
    Object.assign(rec, { st: 'rescued', via: extra.via, from, ts: extra.ts, w: v.w, h: v.h, at: now() });
    delete rec.next; delete rec.sug;
    if (how) logRescue('img', u, rec, how); else { bump(); save(); }
    return { st: 'rescued', meta };
  } catch { return null; }
}

/** Look for a good copy of a broken image: the post's other copies, mirrors, then the Wayback Machine. */
export async function rescueImage(u, job = { fg: false }, how = 'scavenger', why = '') {
  const c = ctxs.get(u) || S.imgs[u]?.ctx || {};
  const viaOf = (m) => (c.alts?.includes(m) ? "the post's own copy" : /^https:/.test(m) && u.startsWith('http:') && m.slice(6) === u.slice(5) ? 'https' : 'mirror');
  for (const m of liveMirrors(u, c.alts || []).slice(0, 8)) {
    const got = await tryCopy(u, m, job, { via: viaOf(m) }, how);
    if (got) return got;
  }
  for (const k of waybackKeys(u)) {
    const snaps = await waybackSnaps(k, { job, kind: 'img' });
    for (const s of snaps.slice(0, 3)) {
      const got = await tryCopy(u, rawSnap(s), job, { via: 'Internet Archive', ts: s.ts }, how);
      if (got) return got;
    }
  }
  return null;
}

/** The reader says an image it showed is wrong (a placeholder): learn its bytes, drop it, look again. */
export async function flagImage(u, { fg = true } = {}) {
  const m = cache.cached(u) ? (() => { try { return cache.meta(u); } catch { return null; } })() : null;
  if (m?.sha1) learnPlaceholder(m.sha1, 'flagged in the reader', { u });
  else if (m && cache.cached(u)) { try { learnPlaceholder(sha1(cache.read(u)), 'flagged in the reader', { u }); } catch { /* gone */ } }
  await forget(u);
  if (S.imgs[u]?.st === 'rescued') S.imgs[u].st = 'bad';
  return resolveImage(u, { fg, how: 'flagged', force: true });
}

/** A copy the reader found by hand: keep it if it is an image. */
export async function manualCopy(u, from) {
  if (!okUrl(from)) return { st: 'bad', why: 'not a web address' };
  const got = await tryCopy(u, from, { fg: true }, { via: 'you' }, 'by hand');
  return got || { st: 'bad', why: 'that link is not an image (or is a placeholder)' };
}

// -------------------------------------------------------------- canaries ----
// imgur blocks some regions (the UK, since September 2025) by serving a
// "Content not viewable in your region" image in place of every image. Its
// own removed.png has known bytes; anything else there is the block.
const CANARIES = [{ host: 'imgur', url: 'https://i.imgur.com/removed.png', sha1: '20002faf28adfd94ca98cf6ced46f14334b53684' }];
export async function checkCanaries() {
  for (const c of CANARIES) {
    try {
      const r = await grab(c.url, { job: { fg: false } });
      const sn = sniff(r.buf);
      const h = r.buf?.length ? sha1(r.buf) : '';
      if (r.status === 200 && h === c.sha1) { if (S.blocked[c.host]) { delete S.blocked[c.host]; save(); } continue; }
      // Anything else: blocked here. An image that is not removed.png is the block's placeholder.
      if (r.status === 200 && sn && h) learnPlaceholder(h, `${c.host} region block`, { w: sn.w, h: sn.h });
      S.blocked[c.host] = { at: now(), status: r.status, final: r.final !== c.url ? r.final : undefined };
      console.log(`rescue: ${c.host} images look blocked from here (HTTP ${r.status}${sn ? ', a ' + sn.w + 'x' + sn.h + ' image' : ''}); going to the Internet Archive for them`);
      bump(); save();
    } catch { /* offline: try again later */ }
  }
}

// ------------------------------------------------------------- documents ----
const PARKED = /sedoparking|parkingcrew|bodis\.com|afternic|hugedomains|dan\.com\/buy|domain is parked|parked[- ]domain|this domain (name )?(is|may be) for sale|buy this domain|domain has expired|account (has been )?suspended/i;
/** Is a 200 response a placeholder rather than the document? Returns a reason or null. */
export function deadPage(buf, type, kind) {
  if (!buf?.length) return 'empty';
  const head = buf.subarray(0, 1024).toString('latin1');
  if (kind === 'pdf') return !head.includes('%PDF') && (/html|text\//i.test(type || '') || /^\s*</.test(head)) ? 'a web page instead of the PDF' : null;
  if (!/html/i.test(type || '') && !/^\s*</.test(head)) return null;
  const s = buf.toString('utf-8', 0, Math.min(buf.length, 400000));
  const title = ((s.match(/<title[^>]*>([^<]{0,300})/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  const text = s.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > 8000) return null; // a real page, whatever its title says
  if (PARKED.test(title) || PARKED.test(s.slice(0, 60000))) return 'a parked or expired domain';
  if (/\b(404|410|not found|page not found|page (does not|doesn['’]t) exist|no longer (available|exists)|has been (removed|deleted))\b/i.test(title)) return 'a “not found” page';
  return null;
}
const titleWords = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter((w) => w.length > 3 && !/^(with|from|that|this|what|when|their|about|into|over|than)$/.test(w));
/** Does a candidate document look like the one we lost? (PDF magic for PDFs; the title's words in the text.) */
function sameDoc(buf, type, info) {
  if (!buf?.length) return false;
  if (info.kind === 'pdf' && !buf.subarray(0, 1024).toString('latin1').includes('%PDF')) return false;
  if (info.kind === 'web' && deadPage(buf, type, 'web')) return false;
  const words = titleWords(info.t);
  if (!words.length) return true;
  const hay = buf.toString('latin1', 0, Math.min(buf.length, 4e6)).toLowerCase();
  const found = words.filter((w) => hay.includes(w)).length;
  return found / words.length >= (info.kind === 'pdf' ? 0.3 : 0.6);
}

/**
 * cache.mjs calls this (through onDead) when a document URL fails for good
 * (404, 410, 451, the host gone) or returns a placeholder page. Resolves to
 * the archived copy {buf, type, meta} to keep in its place, or null.
 */
export async function deadHook(u, { status = 0, error, type, buf, fg = true } = {}) {
  const info = DOCS.get(u);
  if (!info) return null;
  let why;
  if (buf) { why = deadPage(buf, type, info.kind); if (!why) return null; }
  else if ([404, 410, 451].includes(status)) why = 'HTTP ' + status;
  else if (/ENOTFOUND|ECONNREFUSED|CERT_|ERR_TLS|UNABLE_TO_VERIFY|DEPTH_ZERO|SELF_SIGNED/.test(String(error || ''))) why = String(error);
  else return null;
  const prev = S.docs[u];
  if (prev?.st === 'bad' && now() < (prev.next || 0) && !fg) return null;
  const got = await archivedDoc(u, info, { fg }, why);
  const rec = (S.docs[u] ||= {});
  if (got) {
    Object.assign(rec, { st: 'rescued', why, via: 'Internet Archive', from: got.meta.from, ts: got.meta.archived, at: now(), checked: now() });
    delete rec.next;
    logRescue('doc', u, rec, fg ? 'reader' : 'scavenger');
    return got;
  }
  Object.assign(rec, { st: 'bad', why, at: now(), next: now() + backoff(rec.tries || 0) });
  rec.tries = (rec.tries || 0) + 1;
  bump(); save();
  return null;
}
async function archivedDoc(u, info, job, why) {
  for (const s of (await waybackSnaps(u, { job, kind: 'doc' })).slice(0, 3)) {
    try {
      const from = rawSnap(s);
      const r = await grab(from, { job, max: MAX_DOC, accept: info.kind === 'pdf' ? 'application/pdf,*/*;q=0.5' : 'text/html,*/*;q=0.5' });
      if (r.status !== 200 || !r.buf?.length) continue;
      if (deadPage(r.buf, r.type, info.kind)) continue;
      const type = info.kind === 'pdf' ? 'application/pdf' : r.type || 'text/html; charset=utf-8';
      return { buf: r.buf, type, meta: { via: 'Internet Archive', from: `${WAYBACK}/web/${s.ts}/${s.orig}`, archived: s.ts, dead: why } };
    } catch { /* next snapshot */ }
  }
  return null;
}
/** What the reader shows in the header for a document: {st, archived, date, from, why} or {}. */
export function docState(u) {
  const r = S.docs[u];
  let m = null;
  try { if (cache.cached(u)) m = JSON.parse(readFileSync(cache.paths(u).meta, 'utf-8')); } catch { /* none */ }
  if (m?.via) return { st: 'rescued', via: m.via, archived: m.archived, date: tsDate(m.archived), from: m.from, why: m.dead };
  if (r?.st === 'bad') return { st: 'bad', why: r.why, sug: r.sug?.map((s) => s.url) };
  return {};
}

// ------------------------------------------------------------- scavenger ----
let running = null;
export const isRunning = () => !!running;
/**
 * Retry what is still broken (polite, capped), optionally asking Claude for
 * other copies of what the archive does not have. Resolves to the run record.
 */
export function scavenge(opts = {}) {
  if (running) return running;
  running = runScavenger(opts).finally(() => { running = null; });
  return running;
}
async function runScavenger({ reason = 'schedule', images = 40, docs = 10, ai = null, force = false } = {}) {
  const t0 = now();
  const run = { at: t0, reason, tried: 0, rescued: 0, still: 0, docsTried: 0, docsRescued: 0, liveAgain: 0, ai: null };
  const due = (r) => force || (r.next || 0) <= now();
  const imgs = Object.entries(S.imgs).filter(([, r]) => r.st === 'bad' && due(r)).sort((a, b) => (a[1].tries || 0) - (b[1].tries || 0)).slice(0, images);
  for (const [u] of imgs) {
    run.tried++;
    const out = await resolveImage(u, { fg: false, how: 'scavenger', force: true });
    if (out.st === 'ok' || out.st === 'rescued') run.rescued++; else run.still++;
  }
  const dd = Object.entries(S.docs).filter(([, r]) => r.st === 'bad' && due(r)).slice(0, docs);
  for (const [u, r] of dd) {
    run.docsTried++;
    const info = DOCS.get(u); if (!info) continue;
    // The original may be back.
    try {
      const live = await grab(u, { job: { fg: false }, max: MAX_DOC });
      if (live.status === 200 && live.buf && !deadPage(live.buf, live.type, info.kind)) { delete S.docs[u]; run.liveAgain++; continue; }
    } catch { /* still gone */ }
    const got = await archivedDoc(u, info, { fg: false }, r.why);
    if (got) {
      await cacheDoc(u, got);
      Object.assign(r, { st: 'rescued', via: 'Internet Archive', from: got.meta.from, ts: got.meta.archived, at: now(), checked: now() });
      delete r.next; run.docsRescued++;
      logRescue('doc', u, r, 'scavenger');
    } else { r.next = now() + backoff(r.tries || 0); r.tries = (r.tries || 0) + 1; }
  }
  // Archived documents whose original came back: let the cache fetch it again (weekly check).
  for (const [u, r] of Object.entries(S.docs).filter(([, x]) => x.st === 'rescued' && now() - (x.checked || 0) > 7 * DAY).slice(0, 5)) {
    const info = DOCS.get(u); r.checked = now();
    try {
      const live = await grab(u, { job: { fg: false }, max: MAX_DOC });
      if (info && live.status === 200 && live.buf && !deadPage(live.buf, live.type, info.kind)) { await forget(u); delete S.docs[u]; run.liveAgain++; }
    } catch { /* still gone */ }
  }
  if (ai) run.ai = await ai().catch((e) => ({ error: e.message }));
  run.ms = now() - t0;
  S.runs.push(run); bump(); save();
  console.log(`rescue: scavenger (${reason}) tried ${run.tried} images, rescued ${run.rescued}; documents ${run.docsTried}, rescued ${run.docsRescued}${run.ai ? ' · AI ' + JSON.stringify(run.ai) : ''} in ${(run.ms / 1000).toFixed(1)} s`);
  return run;
}
async function cacheDoc(u, got) {
  const p = cache.paths(u);
  await mkdir(p.d, { recursive: true });
  await writeFile(p.body, got.buf);
  await writeFile(p.meta, JSON.stringify({ url: u, type: got.type, size: got.buf.length, at: now(), ...got.meta }));
  try { cache.meta(u); } catch { /* index */ }
}

// ------------------------------------------------------------ agentic mode ----
// Off by default (STACKS_RESCUE_AI=1 and an API key turn it on). For items the
// archive does not have, ask Claude, with web search, for other copies; each
// candidate is fetched and checked before it is used. Spend counts against
// the daily AI budget that summaries use (app.ai in routes/30-summarize.mjs).
export const AI_ON = /^(1|true|yes)$/i.test(process.env.STACKS_RESCUE_AI || '');
export const AI_MODEL = process.env.STACKS_RESCUE_MODEL || 'claude-haiku-5-5';
const AI_PER_RUN = Number(process.env.STACKS_RESCUE_AI_MAX) || 4;
const SEARCH_USD = 0.01; // per web search
const MAX_SEARCHES = 3;

function aiPrompt(kind, u, r, info) {
  const c = r.ctx || {};
  if (kind === 'img') {
    return `An image embedded in a post can no longer be loaded from its original address (${r.why || 'broken'}), and the Internet Archive has no usable copy.

Original image URL: ${u}
Post: ${c.title || 'unknown'}${c.page ? ` (${c.page})` : ''}
Alt text or caption: ${c.alt || 'none'}
${c.w && c.h ? `Displayed size in the post: ${c.w}x${c.h}\n` : ''}
Find another copy of exactly this image on the web: the same file on another host, the post republished elsewhere (the author's blog, Substack, Medium, GreaterWrong, a forum crosspost) with the image, or the image's own original source (a paper's figure, a chart's publisher). Use web search. Only propose direct image file URLs you actually saw in search results or on pages you found, not guesses.

End your answer with a JSON object on its own line: {"candidates": [{"url": "...", "why": "..."}]} (at most 5; an empty list if you found nothing).`;
  }
  return `A document can no longer be loaded from its original address (${r.why || 'broken'}), and the Internet Archive has no usable copy.

Original URL: ${u}
Title: ${info?.t || 'unknown'}
Author: ${info?.a || 'unknown'}
Type: ${info?.kind === 'pdf' ? 'PDF' : 'web article'}

Find another copy of exactly this document: a mirror, the author's or publisher's own site, arXiv or another repository, or a republished copy. Use web search. Only propose direct URLs you actually saw in search results${info?.kind === 'pdf' ? ' (links to the PDF file itself)' : ''}, not guesses.

End your answer with a JSON object on its own line: {"candidates": [{"url": "...", "why": "..."}]} (at most 5; an empty list if you found nothing).`;
}
/** The last {"candidates": [...]} object in the model's answer (balanced braces, strings respected). */
export function parseCandidates(text) {
  const s = String(text || '');
  for (let k = s.lastIndexOf('"candidates"'); k >= 0; k = k > 0 ? s.lastIndexOf('"candidates"', k - 1) : -1) {
    const open = s.lastIndexOf('{', k);
    if (open < 0) continue;
    let depth = 0, inStr = false, esc = false;
    for (let i = open; i < s.length; i++) {
      const ch = s[i];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        try { const j = JSON.parse(s.slice(open, i + 1)); if (Array.isArray(j.candidates)) return j.candidates.filter((c) => c && typeof c.url === 'string' && okUrl(c.url)).slice(0, 5); } catch { /* not JSON */ }
        break;
      }
    }
  }
  return [];
}
const base = (u) => { try { return decodeURIComponent(new URL(u).pathname.split('/').pop() || '').toLowerCase().replace(/\.[a-z0-9]+$/, ''); } catch { return ''; } };
/** Verify an image candidate: a real image, and the same one (same file name or id, or the same shape as the original). */
async function verifyImage(u, cand, r) {
  const got = await grab(cand, { job: { fg: false }, accept: 'image/*' }).catch(() => null);
  if (!got) return { ok: false, why: 'unreachable' };
  const v = judgeImage(got, cand);
  if (!v.ok) return { ok: false, why: v.bad || 'too big' };
  const c = r.ctx || {};
  const w0 = r.w || c.w, h0 = r.h || c.h;
  const shape = w0 && h0 && v.w && v.h ? Math.abs(v.w / v.h - w0 / h0) / (w0 / h0) < 0.04 : null;
  const b0 = base(u), id0 = imgurId(u);
  const name = (b0.length >= 5 && base(cand) === b0) || (id0 && cand.includes(id0));
  if (shape === false) return { ok: false, why: `different shape (${v.w}x${v.h})` };
  if (!name && !shape) return { ok: false, why: 'cannot confirm it is the same image', plausible: true };
  return { ok: true, got, v };
}
async function verifyDoc(u, cand, info) {
  const got = await grab(cand, { job: { fg: false }, max: MAX_DOC }).catch(() => null);
  if (!got || got.status !== 200) return { ok: false, why: 'unreachable' };
  if (!sameDoc(got.buf, got.type, info)) return { ok: false, why: 'not the same document', plausible: true };
  return { ok: true, got };
}

/**
 * One agentic pass over items still broken after the archive (not asked in
 * the last 30 days). `ai` is app.ai from routes/30-summarize.mjs.
 */
export async function agentic(ai, { max = AI_PER_RUN, client } = {}) {
  if (!ai) return { skipped: 'no AI module' };
  if (ai.MOCK && !client) return { skipped: 'mock AI mode' };
  if (S.ai.noSearch && now() - S.ai.noSearch < 7 * DAY) return { skipped: 'web search unavailable' };
  const todo = [
    ...Object.entries(S.imgs).filter(([, r]) => r.st === 'bad' && !r.ctx?.tiny && now() - (r.aiAt || 0) > 30 * DAY).map(([u, r]) => ['img', u, r]),
    ...Object.entries(S.docs).filter(([, r]) => r.st === 'bad' && now() - (r.aiAt || 0) > 30 * DAY).map(([u, r]) => ['doc', u, r]),
  ].slice(0, max);
  const out = { asked: 0, rescued: 0, suggested: 0, usd: 0 };
  if (!todo.length) return out;
  let Anthropic = null; try { ({ default: Anthropic } = await import('@anthropic-ai/sdk')); } catch { /* typed errors unavailable */ }
  const c = client || await ai.client();
  const { PRICES } = await import('./routes/30-summarize.mjs');
  const [pi] = PRICES[AI_MODEL] || [1];
  for (const [kind, u, r] of todo) {
    const info = kind === 'doc' ? DOCS.get(u) : null;
    const prompt = aiPrompt(kind, u, r, info);
    // Reserve against the shared daily budget: the prompt, search results coming back in, and the searches themselves.
    let release;
    try { release = ai.reserve(AI_MODEL, prompt.length + 90000 + Math.ceil(((SEARCH_USD * MAX_SEARCHES) / pi) * 1e6 * 3.5), 2000); } catch (e) { out.stopped = e.message; break; }
    r.aiAt = now(); out.asked++;
    try {
      let messages = [{ role: 'user', content: prompt }], msg = null, usd = 0;
      for (let turn = 0; turn < 3; turn++) {
        msg = await c.messages.create({ model: AI_MODEL, max_tokens: 4000, output_config: { effort: 'low' }, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }], messages });
        usd += ai.costOf(AI_MODEL, msg.usage) + SEARCH_USD * (msg.usage?.server_tool_use?.web_search_requests || 0);
        if (msg.stop_reason !== 'pause_turn') break;
        messages = [...messages, { role: 'assistant', content: msg.content }];
      }
      ai.charge(AI_MODEL, usd); out.usd += usd;
      S.ai.calls = (S.ai.calls || 0) + 1; S.ai.usd = +((S.ai.usd || 0) + usd).toFixed(4);
      if (msg.stop_reason === 'refusal') { r.aiNote = 'declined'; continue; }
      const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      const cands = parseCandidates(text).filter((x) => x.url !== u);
      const sug = [];
      for (const cand of cands) {
        const v = kind === 'img' ? await verifyImage(u, cand.url, r) : await verifyDoc(u, cand.url, info);
        if (v.ok) {
          if (kind === 'img') {
            const meta = await store(u, v.got.buf, v.v.type, { w: v.v.w, h: v.v.h, sha1: v.v.hash, via: 'found by Claude', from: cand.url });
            Object.assign(r, { st: 'rescued', via: 'found by Claude', from: cand.url, w: meta.w, h: meta.h, at: now() });
          } else {
            await cacheDoc(u, { buf: v.got.buf, type: info.kind === 'pdf' ? 'application/pdf' : v.got.type, meta: { via: 'found by Claude', from: cand.url, dead: r.why } });
            Object.assign(r, { st: 'rescued', via: 'found by Claude', from: cand.url, at: now() });
          }
          delete r.next; delete r.sug;
          out.rescued++; logRescue(kind, u, r, 'ai');
          break;
        }
        if (v.plausible) sug.push({ url: cand.url, why: String(cand.why || '').slice(0, 200), check: v.why });
      }
      if (r.st === 'bad' && sug.length) { r.sug = sug.slice(0, 3); out.suggested++; }
    } catch (e) {
      // Web search not offered for this key or model: skip agentic mode for a week.
      const bad = Anthropic ? e instanceof Anthropic.BadRequestError : e?.status === 400;
      if (bad && /web_search|tool/i.test(e.message)) { S.ai.noSearch = now(); out.skipped = 'web search unavailable'; break; }
      r.aiNote = e.message?.slice(0, 200);
    } finally { release(); save(); }
  }
  out.usd = +out.usd.toFixed(4);
  bump(); save();
  return out;
}

export { tsDate, WAYBACK, WAYBACK_API };
export const _test = { sameDoc, ctxs, inflight, store, forget, noteSeen, wbMemo };
