// Profiles on disk: the compiled form of each item (analysis JSON, page-marked
// text, sprite sheets, display images, thumbnails). See docs/profiles/spec.md,
// sections 3, 4 and 7.1; the routes are in routes/90-profile.mjs.
//
//   CACHE/profiles/index.json        {v: 1, profiles: {pid: {id, kind, n, gen, rev, by, bytes, heavy, at, used, usedHeavy}}}
//   CACHE/profiles/<pid>/profile.json
//   CACHE/profiles/<pid>/text.txt    "[p. 1] …\n[p. 2] …"
//   CACHE/profiles/<pid>/s<j>.webp   sprite sheet j
//   CACHE/profiles/<pid>/t<k>.webp   thumbnail of page k (or .jpg)
//   CACHE/profiles/<pid>/d<k>.webp   display image of page k (or .jpg)
//
// pid = sha1(id + '|' + srcKey); srcKey is the item's url, or ia:<identifier>
// for scans. Profiles join the disk cache's size cap and LRU order through
// cache.registerTenant: display images and thumbnails ("heavy") go long
// before the JSON, sprite and text ("core"). STACKS_PROFILE_MAX (default
// 4 GiB) is a soft cap of its own on the heavy assets.
//
// Other modules (the augmentation) use readProfile(id) and profileTextPath(id).
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync, readdirSync, rmSync, unlinkSync, statSync, createReadStream } from 'fs';
import { join } from 'path';
import { CACHE, HERE } from './config.mjs';
import * as cache from './cache.mjs';
import { SCHEMA, GEN, budgetFor, validate, cropOf } from '../ui/js/profile-core.js';

export const DIR = join(CACHE, 'profiles');
const INDEX = join(DIR, 'index.json');
export const PROFILE_MAX = cache.parseSize(process.env.STACKS_PROFILE_MAX, 4 * 1024 ** 3);
export const LIMITS = { display: 2 * 1024 * 1024, thumb: 64 * 1024, sprite: 2 * 1024 * 1024, text: 3 * 1024 * 1024, json: 4 * 1024 * 1024 };
const RANK = { browser: 2, playwright: 2, poppler: 1 };
const nowSec = () => Math.floor(Date.now() / 1000);
const sha1 = (b) => createHash('sha1').update(b).digest('hex');
mkdirSync(DIR, { recursive: true });

// ------------------------------------------------------------------ items ----
let corpus = null, corpusMtime = 0, corpusCheck = 0;
function corpusMap() {
  const now = Date.now();
  if (corpus && now - corpusCheck < 5000) return corpus;
  corpusCheck = now;
  const files = ['corpus.json', 'enrich.json'].map((f) => join(HERE, f));
  let m = 0; for (const f of files) try { m += statSync(f).mtimeMs; } catch { /* optional */ }
  if (corpus && m === corpusMtime) return corpus;
  corpusMtime = m;
  const map = new Map();
  try {
    const { items = [] } = JSON.parse(readFileSync(files[0], 'utf-8'));
    let enr = {}; try { enr = JSON.parse(readFileSync(files[1], 'utf-8')).items || {}; } catch { /* no enrichment */ }
    for (const it of items) map.set(it.id, enr[it.id] ? { ...it, ...enr[it.id] } : it);
  } catch (e) { console.warn('profiles: corpus.json unreadable:', e.message); }
  corpus = map;
  return map;
}
export const itemOf = (id) => corpusMap().get(id) || null;
export const srcKeyOf = (it, src) => (it.kind === 'scan' && it.ia ? 'ia:' + it.ia : src || it.url || '');
export const pidOf = (id, srcKey) => sha1(id + '|' + srcKey);
/** {it, pid, srcKey, url} for an item id (and optional source URL), or null for an unknown id. */
export function resolve(id, src = null) {
  const it = id && itemOf(id);
  if (!it) return null;
  if (src && !cache.allowed(src)) return null;
  const srcKey = srcKeyOf(it, src);
  return { it, pid: pidOf(id, srcKey), srcKey, url: it.kind === 'scan' ? null : src || it.url || null };
}

// ------------------------------------------------------------------ index ----
const index = new Map(); // pid -> record
let totalBytes = 0, heavyBytes = 0, indexT = null, indexReady = false;
function setRec(pid, r) {
  const old = index.get(pid);
  if (old) { totalBytes -= old.bytes; heavyBytes -= old.heavy; }
  if (r) { index.set(pid, r); totalBytes += r.bytes; heavyBytes += r.heavy; } else index.delete(pid);
  saveIndexSoon();
}
function saveIndexSoon() { if (!indexT) indexT = setTimeout(saveIndex, 2000); indexT.unref?.(); }
function saveIndex() {
  clearTimeout(indexT); indexT = null;
  if (!indexReady) return;
  try {
    writeFileSync(INDEX + '.tmp', JSON.stringify({ v: 1, profiles: Object.fromEntries(index) }));
    renameSync(INDEX + '.tmp', INDEX);
  } catch (e) { console.warn('profiles: index write failed:', e.message); }
}
process.on('exit', () => { if (indexT) saveIndex(); });
const recOf = (P) => {
  const a = P.assets || {};
  const heavy = Object.values(a.display || {}).reduce((s, d) => s + d.bytes, 0) + Object.values(a.thumb || {}).reduce((s, d) => s + d.bytes, 0);
  return { id: P.id, kind: P.kind, n: P.n, gen: P.gen, rev: P.rev, by: P.by, bytes: a.bytes || 0, heavy, at: Math.floor(Date.parse(P.at) / 1000) || nowSec(), used: nowSec(), usedHeavy: nowSec() };
};
function loadIndex() {
  try {
    const j = JSON.parse(readFileSync(INDEX, 'utf-8'));
    for (const [pid, r] of Object.entries(j.profiles || {})) if (existsSync(join(DIR, pid, 'profile.json'))) setRec(pid, r);
    indexReady = true;
    return true;
  } catch { return false; }
}
/** Rebuild the index from the profile.json files (missing or unreadable index). */
async function rebuildIndex() {
  let dirs = [];
  try { dirs = readdirSync(DIR).filter((d) => /^[0-9a-f]{40}$/.test(d)); } catch { /* none */ }
  for (const pid of dirs) {
    try { const P = JSON.parse(readFileSync(join(DIR, pid, 'profile.json'), 'utf-8')); const r = recOf(P); r.used = r.usedHeavy = r.at; setRec(pid, r); } catch { /* half-written: ignore */ }
    await new Promise((r) => setImmediate(r));
  }
  indexReady = true;
  saveIndex();
}
if (!loadIndex()) setTimeout(rebuildIndex, 100).unref?.();

// ------------------------------------------------------------ profile.json ----
const mem = new Map(); // pid -> parsed profile (LRU, 400)
const pathOf = (pid, f = 'profile.json') => join(DIR, pid, f);
function readP(pid) {
  if (mem.has(pid)) { const P = mem.get(pid); mem.delete(pid); mem.set(pid, P); return P; }
  let P; try { P = JSON.parse(readFileSync(pathOf(pid), 'utf-8')); } catch { return null; }
  mem.set(pid, P); while (mem.size > 400) mem.delete(mem.keys().next().value);
  return P;
}
function atomic(file, data) { writeFileSync(file + '.tmp', data); renameSync(file + '.tmp', file); }
const jsonBytes = (P) => Buffer.byteLength(JSON.stringify(P));
function sumAssets(P, pid) {
  const a = P.assets;
  let b = 0;
  for (const d of Object.values(a.display)) b += d.bytes;
  for (const d of Object.values(a.thumb)) b += d.bytes;
  for (const s of a.sprite?.sheets || []) b += s.bytes;
  if (a.text) b += a.text.bytes;
  a.bytes = b; // a near guess, so the JSON measured next has about the right length
  a.bytes = b + jsonBytes(P);
  void pid;
}
function writeP(pid, P) {
  mkdirSync(join(DIR, pid), { recursive: true });
  sumAssets(P, pid);
  atomic(pathOf(pid), JSON.stringify(P));
  mem.delete(pid); mem.set(pid, P);
  const old = index.get(pid), r = recOf(P);
  if (old) { r.used = old.used; r.usedHeavy = old.usedHeavy; }
  setRec(pid, r);
  cache.tenantGrew?.();
  softCap();
}
const emptyAssets = (n) => ({ H: null, display: {}, thumb: {}, sprite: null, text: null, bytes: 0, budget: budgetFor(n) });
const contains = (outer, inner, eps = 2e-3) => outer && inner && outer[0] <= inner.x0 + eps && outer[1] <= inner.y0 + eps && outer[2] >= inner.x1 - eps && outer[3] >= inner.y1 - eps;
const unlinkQuiet = (f) => { try { unlinkSync(f); } catch { /* gone */ } };

// -------------------------------------------------------------- staleness ----
// sha1 of a cached source, memoised by path, size and mtime (computed in the background).
const shaMemo = new Map();
function srcSha(url, wait = false) {
  if (!url || !cache.cached(url)) return null;
  const p = cache.paths(url).body;
  let st; try { st = statSync(p); } catch { return null; }
  const key = `${p}|${st.size}|${st.mtimeMs}`;
  const m = shaMemo.get(p);
  if (m && m.key === key) return m.sha ? { sha1: m.sha, size: st.size } : wait ? m.p : null;
  const job = { key, sha: null };
  job.p = new Promise((res) => {
    const h = createHash('sha1');
    createReadStream(p).on('data', (c) => h.update(c)).on('end', () => { job.sha = h.digest('hex'); res({ sha1: job.sha, size: st.size }); }).on('error', () => res(null));
  });
  shaMemo.set(p, job);
  if (shaMemo.size > 2000) shaMemo.delete(shaMemo.keys().next().value);
  return wait ? job.p : null;
}
function staleOf(P, r) {
  if (P.gen < GEN) return 'gen';
  if (P.src?.sha1 && r?.url) { const s = srcSha(r.url); if (s && s.sha1 !== P.src.sha1) return 'src'; }
  return null;
}

// -------------------------------------------------------- LaTeXML contents ----
let skel = (s) => String(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
import('./routes/30-summarize.mjs').then((m) => { if (m.skel) skel = m.skel; }).catch(() => {});
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => { if (e[0] === '#') { try { return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))); } catch { return m; } } return ENT[e.toLowerCase()] ?? m; });
/** Sections of an arXiv paper from its LaTeXML HTML in the disk cache, mapped to pages through text.txt. */
function latexmlToc(it, pid) {
  const m = /^arxiv:(.+)$/.exec(it.id || '');
  if (!m) return null;
  const url = [`https://arxiv.org/html/${m[1]}`, `https://ar5iv.labs.arxiv.org/html/${m[1]}`].find((u) => cache.cached(u));
  if (!url) return null;
  let html; try { html = readFileSync(cache.paths(url).body, 'utf-8'); } catch { return null; }
  const heads = [];
  const re = /<h([23])\b[^>]*class="[^"]*\bltx_title_(section|subsection|appendix)\b[^"]*"[^>]*>([\s\S]*?)<\/h\1>/g;
  let h;
  while ((h = re.exec(html)) && heads.length < 80) {
    const raw = h[3].replace(/<span[^>]*ltx_tag[^>]*>([\s\S]*?)<\/span>/, '$1 ').replace(/<[^>]+>/g, '');
    const t = decode(raw).replace(/\s+/g, ' ').trim();
    if (t) heads.push({ t, d: h[2] === 'subsection' ? 1 : 0, bare: decode(h[3].replace(/<span[^>]*ltx_tag[^>]*>[\s\S]*?<\/span>/, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() });
  }
  if (heads.length < 3) return null;
  let text = ''; try { text = readFileSync(pathOf(pid, 'text.txt'), 'utf-8'); } catch { /* no text yet */ }
  const pages = text ? text.split('\n').map((l) => skel(l.replace(/^\[p\. \d+\]\s?/, ''))) : [];
  let from = 0;
  return heads.map((x) => {
    let k = null;
    for (const cand of [skel(x.t), skel(x.bare)]) {
      if (cand.length < 4 || k != null) continue;
      for (let j = from; j < pages.length; j++) if (pages[j].includes(cand)) { k = j; break; }
    }
    if (k != null) from = k;
    return { t: x.t.slice(0, 120), k, d: x.d, src: 'latexml' };
  });
}
function applyLatexml(r, P) {
  if (P.toc?.length >= 3 && P.toc[0].src === 'outline') return false;
  const t = latexmlToc(r.it, r.pid);
  if (!t || t.filter((x) => x.k != null).length < Math.min(3, t.length)) return false;
  P.toc = t;
  return true;
}

// --------------------------------------------------------------- reading ----
/** The stored profile of an item ({stale} added), or null. */
export function readProfile(id, src = null) {
  const r = resolve(id, src); if (!r) return null;
  const P = readP(r.pid); if (!P) return null;
  return { ...P, stale: staleOf(P, r) };
}
/** Path of the item's page-marked text (text.txt), or null. */
export function profileTextPath(id, src = null) {
  const r = resolve(id, src); if (!r) return null;
  const f = pathOf(r.pid, 'text.txt');
  return existsSync(f) ? f : null;
}
export function touchProfile(pid, heavy = false) {
  const rec = index.get(pid); if (!rec) return;
  const now = nowSec();
  if (now - rec.used > 30 || (heavy && now - rec.usedHeavy > 30)) { rec.used = now; if (heavy) rec.usedHeavy = now; saveIndexSoon(); }
}
/** The short form for the wall and prefetch. */
export function brief(P) {
  return {
    pid: P.pid, rev: P.rev, gen: P.gen, kind: P.kind, n: P.n, aspect: P.aspect, crop: { groups: P.crop?.groups || {} }, layout: { pair: P.layout?.pair ?? null },
    sprite: P.assets?.sprite || null, display: Object.keys(P.assets?.display || {}).map(Number).sort((a, b) => a - b), stale: P.stale ?? null,
  };
}

// --------------------------------------------------------------- writing ----
const err = (code, body) => ({ code, body });
/** POST /profile: an analysis upload. Returns {code, body}. */
export async function putAnalysis(id, src, up) {
  const r = resolve(id, src);
  if (!r) return err(400, { error: 'unknown id' });
  const force = !!up?.force;
  const P = { ...up };
  for (const f of ['force', 'rev', 'pid', 'assets', 'stale']) delete P[f];
  P.src = { ...(P.src || {}) };
  const bad = validate(P) || (P.id !== id ? 'id does not match' : null);
  if (bad) return err(400, { error: 'invalid', detail: bad });
  const old = readP(r.pid);
  if (old && !force && (old.gen > P.gen || (old.gen === P.gen && (RANK[old.by] || 0) > (RANK[P.by] || 0)))) return err(409, { error: 'older', have: { gen: old.gen, by: old.by } });
  if (r.url) { const s = await srcSha(r.url, true); if (s) { P.src.sha1 = s.sha1; P.src.size = s.size; } }
  if (r.it.kind === 'scan') P.src.ia = r.it.ia; else P.src.url = r.url;
  P.pid = r.pid; P.rev = (old?.rev || 0) + 1;
  applyLatexml(r, P);
  P.assets = old?.assets ? { ...old.assets } : emptyAssets(P.n);
  P.assets.budget = budgetFor(P.n);
  // Display images and thumbnails that no longer cover the page's crop go; so does a
  // sprite drawn through different crops.
  for (const size of ['display', 'thumb']) {
    for (const [k, d] of Object.entries(P.assets[size] || {})) {
      const c = cropOf(P, Number(k));
      if (Number(k) >= P.n || !c || !contains(d.box, c)) { unlinkQuiet(pathOf(r.pid, d.f)); delete P.assets[size][k]; }
    }
  }
  if (P.assets.sprite && old && cropSig(old) !== cropSig(P)) { for (const s of P.assets.sprite.sheets) unlinkQuiet(pathOf(r.pid, s.f)); P.assets.sprite = null; }
  writeP(r.pid, P);
  return err(200, { ok: true, rev: P.rev, profile: { ...P, stale: staleOf(P, r) } });
}
const cropSig = (P) => JSON.stringify([P.n, P.crop?.groups, (P.pages || []).map((p) => (p.blank ? 0 : p.cg === 'own' ? p.crop : p.cg))]);

/** POST /profile/text: replace text.txt. */
export function putText(id, src, text, from = 'pdf') {
  const r = resolve(id, src);
  if (!r) return err(400, { error: 'unknown id' });
  const P = readP(r.pid);
  if (!P) return err(404, { error: 'none' });
  const buf = Buffer.from(String(text), 'utf-8');
  if (buf.length > LIMITS.text) return err(413, { error: 'too large' });
  atomic(pathOf(r.pid, 'text.txt'), buf);
  P.assets.text = { f: 'text.txt', v: sha1(buf).slice(0, 10), chars: String(text).length, bytes: buf.length, src: ['pdf', 'ocr', 'flow', 'pdftotext'].includes(from) ? from : 'pdf' };
  applyLatexml(r, P);
  P.rev++;
  writeP(r.pid, P);
  return err(200, { ok: true, chars: P.assets.text.chars, bytes: buf.length, rev: P.rev });
}

const isWebp = (b) => b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
const isJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const num = (v) => (v == null || v === '' ? NaN : Number(v));
/**
 * POST /profile/asset. q: {size, k | j, w, h, box, H, pri, cw, ch, cols}; buf: the image.
 * Display images are admitted by priority within the profile's budget.
 */
export function putAsset(id, src, q, buf) {
  const r = resolve(id, src);
  if (!r) return err(400, { error: 'unknown id' });
  const size = q.size;
  if (!['display', 'thumb', 'sprite'].includes(size)) return err(400, { error: 'invalid', detail: 'size' });
  if (buf.length > LIMITS[size]) return err(413, { error: 'too large', max: LIMITS[size] });
  const ext = isWebp(buf) ? 'webp' : isJpeg(buf) ? 'jpg' : null;
  if (!ext) return err(415, { error: 'type', detail: 'WebP or JPEG only' });
  const P = readP(r.pid);
  if (!P) return err(404, { error: 'none' });
  const A = P.assets ||= emptyAssets(P.n);
  A.budget = budgetFor(P.n);
  const w = Math.round(num(q.w)), h = Math.round(num(q.h));
  if (!(w > 0 && h > 0 && w <= 8000 && h <= 8000)) return err(400, { error: 'invalid', detail: 'w, h' });
  const v = sha1(buf).slice(0, 10);
  const write = (f, old) => { if (old && old.f !== f) unlinkQuiet(pathOf(r.pid, old.f)); atomic(pathOf(r.pid, f), buf); };
  if (size === 'sprite') {
    const j = Math.round(num(q.j)), cw = Math.round(num(q.cw)), ch = Math.round(num(q.ch)), cols = Math.round(num(q.cols));
    if (!(j >= 0 && j < 64 && cw > 0 && ch > 0 && cols > 0)) return err(400, { error: 'invalid', detail: 'j, cw, ch, cols' });
    let S = A.sprite;
    if (S && (S.cw !== cw || S.ch !== ch || S.cols !== cols)) {
      if (j > 0) return err(409, { error: 'sprite', detail: 'cell size differs from sheet 0' });
      for (const s of S.sheets) unlinkQuiet(pathOf(r.pid, s.f));
      S = null;
    }
    S ||= { ch, cw, cols, per: 1024, box: 'crop', sheets: [] };
    const old = S.sheets.find((s) => s.j === j);
    const used = A.bytes - (old?.bytes || 0) + buf.length;
    if (used > A.budget && !freeFor(r.pid, P, used - A.budget, 101)) return err(409, { error: 'budget', used: A.bytes, budget: A.budget, minPri: minPri(A) });
    const f = `s${j}.${ext}`;
    write(f, old);
    S.sheets = S.sheets.filter((s) => s.j !== j).concat({ j, f, v, w, h, bytes: buf.length }).sort((a, b) => a.j - b.j);
    A.sprite = S;
    P.rev++; writeP(r.pid, P);
    return err(200, { ok: true, f, v, bytes: buf.length, used: A.bytes, budget: A.budget });
  }
  const k = Math.round(num(q.k));
  if (!(k >= 0 && k < P.n)) return err(400, { error: 'invalid', detail: 'k' });
  const box = String(q.box || '').split(',').map(Number);
  if (box.length !== 4 || !box.every((x) => x >= 0 && x <= 1) || !(box[0] < box[2] && box[1] < box[3])) return err(400, { error: 'invalid', detail: 'box' });
  const rec = A[size] ||= {};
  const old = rec[k];
  const pri = size === 'display' ? Math.max(0, Math.min(100, Math.round(num(q.pri)) || 60)) : 100;
  const need = A.bytes - (old?.bytes || 0) + buf.length - A.budget;
  if (need > 0 && !freeFor(r.pid, P, need, pri, size === 'display' ? k : null)) return err(409, { error: 'budget', used: A.bytes, budget: A.budget, minPri: minPri(A) });
  const f = `${size === 'display' ? 'd' : 't'}${k}.${ext}`;
  write(f, old);
  const H = Math.round(num(q.H));
  rec[k] = size === 'display'
    ? { f, v, w, h, box: box.map((x) => Math.round(x * 1e4) / 1e4), H: H > 0 ? H : Math.round(h / (box[3] - box[1])), pri, bytes: buf.length }
    : { f, v, w, h, box: box.map((x) => Math.round(x * 1e4) / 1e4), bytes: buf.length };
  if (size === 'display') A.H = Math.max(A.H || 0, rec[k].H);
  P.rev++; writeP(r.pid, P);
  return err(200, { ok: true, f, v, bytes: buf.length, used: A.bytes, budget: A.budget });
}
const minPri = (A) => { const ps = Object.values(A.display || {}).map((d) => d.pri); return ps.length ? Math.min(...ps) : null; };
/** Make `need` bytes of room by dropping display images of priority below `pri` (lowest first). */
function freeFor(pid, P, need, pri, except = null) {
  const A = P.assets;
  const cands = Object.entries(A.display).filter(([k, d]) => d.pri < pri && Number(k) !== except).sort((a, b) => a[1].pri - b[1].pri || Number(b[0]) - Number(a[0]));
  let room = 0; const drop = [];
  for (const [k, d] of cands) { if (room >= need) break; room += d.bytes; drop.push(k); }
  if (room < need) return false;
  for (const k of drop) { unlinkQuiet(pathOf(pid, A.display[k].f)); A.bytes -= A.display[k].bytes; delete A.display[k]; }
  return true;
}

/** GET /profile/asset: {file, type, immutable} or {code}. Missing files drop their record. */
export function assetFile(id, src, size, kj, v) {
  const r = resolve(id, src);
  if (!r) return { code: 400 };
  const P = readP(r.pid);
  if (!P?.assets) return { code: 404 };
  const A = P.assets;
  const rec = size === 'sprite' ? A.sprite?.sheets?.find((s) => s.j === kj) : size === 'display' || size === 'thumb' ? A[size]?.[kj] : null;
  if (!rec) return { code: 404 };
  const file = pathOf(r.pid, rec.f);
  if (!existsSync(file)) {
    if (size === 'sprite') A.sprite = null; else delete A[size][kj];
    P.rev++; writeP(r.pid, P);
    return { code: 404 };
  }
  touchProfile(r.pid, size !== 'sprite');
  let bytes = rec.bytes; try { bytes = statSync(file).size; } catch { /* raced */ }
  return { file, type: rec.f.endsWith('.jpg') ? 'image/jpeg' : 'image/webp', bytes, immutable: !!v && v === rec.v };
}

/** POST /profile/forget: delete an item's profile. */
export function forget(id, src = null) {
  const r = resolve(id, src);
  if (!r) return err(400, { error: 'unknown id' });
  dropProfile(r.pid);
  return err(200, { ok: true });
}
function dropProfile(pid) {
  const rec = index.get(pid);
  try { rmSync(join(DIR, pid), { recursive: true, force: true }); } catch { /* gone */ }
  mem.delete(pid); setRec(pid, null);
  return rec?.bytes || 0;
}
function dropHeavy(pid) {
  const P = readP(pid); if (!P?.assets) return 0;
  let freed = 0;
  for (const size of ['display', 'thumb']) for (const d of Object.values(P.assets[size] || {})) { unlinkQuiet(pathOf(pid, d.f)); freed += d.bytes; }
  if (!freed) return 0;
  P.assets.display = {}; P.assets.thumb = {}; P.assets.H = null;
  P.rev++;
  try { writeP(pid, P); } catch { /* disk trouble: the record is rebuilt later */ }
  return freed;
}

// -------------------------------------------------------------- eviction ----
// Two LRU entries per profile in the disk cache's order: its heavy assets (by
// when they were last served) and its core (biased 30 days younger, so the
// small, most useful part outlives the heavy part).
cache.registerTenant?.('profiles', {
  entries() {
    const out = [];
    for (const [pid, r] of index) {
      if (r.heavy > 0) out.push({ k: pid + ':heavy', s: r.heavy, a: r.usedHeavy || r.at });
      out.push({ k: pid + ':core', s: Math.max(0, r.bytes - r.heavy), a: (r.used || r.at) + 30 * 86400 });
    }
    return out;
  },
  bytes: () => totalBytes,
  async remove(k) { const [pid, part] = k.split(':'); return part === 'heavy' ? dropHeavy(pid) : dropProfile(pid); },
});
/** Over STACKS_PROFILE_MAX: drop heavy assets, least recently served first, to 90%. */
let capping = false;
function softCap() {
  if (capping || totalBytes <= PROFILE_MAX) return;
  capping = true;
  try {
    const order = [...index].filter(([, r]) => r.heavy > 0).sort((a, b) => (a[1].usedHeavy || a[1].at) - (b[1].usedHeavy || b[1].at));
    for (const [pid] of order) { if (totalBytes <= PROFILE_MAX * 0.9) break; dropHeavy(pid); }
  } finally { capping = false; }
}

export function profileState() {
  const day = new Date(); day.setHours(0, 0, 0, 0);
  const t0 = day.getTime() / 1000;
  const byEngine = { browser: 0, playwright: 0, poppler: 0 };
  let today = 0, stale = 0;
  for (const r of index.values()) { if (r.at >= t0) today++; if (r.by in byEngine) byEngine[r.by]++; if (r.gen < GEN) stale++; }
  return { count: index.size, bytes: totalBytes, max: PROFILE_MAX, heavyBytes, compiledToday: today, byEngine, stale, schema: SCHEMA, gen: GEN };
}
export { staleOf, readP, GEN };
