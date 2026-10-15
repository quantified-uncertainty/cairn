// OCR for Internet Archive scans: word boxes per page (the selectable text
// layer), plain text per page (find in item) and printed page numbers.
//
//   GET /ocr?ia=<id>&k=<page>   -> { w, h, words: [{ t, x0, y0, x1, y1, l }], lines: [[x0, y0, x1, y1]], src }  (&bg=1: prefetch)
//   GET /ocr/text?ia=<id>       -> { pages: [text of page k], src }
//   GET /ocr/labels?ia=<id>     -> { labels: [printed page label or null], confidence }
//
// Page k is the k-th page image (archive.org/download/<id>/page/n<k>), that is
// the k-th leaf of the access formats. Coordinates are pixels of the full-size
// page image (w x h); `l` indexes `lines`. Results are cached under CACHE/ocr/.
//
// Sources, verified against live archive.org items:
// - <id>_hocr.html with <id>_hocr_pageindex.json.gz: one [textStart, textEnd,
//   byteStart, byteEnd) entry per hOCR page, so a page is one HTTP Range
//   request; <id>_hocr_searchtext.txt.gz holds the plain text, sliced by the
//   same index. hOCR covers every scanned leaf (deleted ones too) in scandata
//   order, while <id>_page_numbers.json lists the access leaves (leafNum and
//   the printed page number). Scandata starts at leaf 0 in some books and at
//   leaf 1 in others, so hOCR page = leafNum + d, with d found per book: the
//   offset under which the printed page numbers show up at the top or bottom
//   of their hOCR pages' text, or else under which the first pages' sizes
//   match the djvu.xml OBJECTs (named <id>_<leaf>.djvu). Saved in map.json.
// - <id>_djvu.xml (older items without hOCR): one OBJECT (width, height) per
//   access page, words as <WORD coords="left,bottom,right,top">.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';

const CHUNK = 8; // hOCR pages fetched per Range request (consecutive pages are contiguous bytes)
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e] ?? m));
const attr = (a, name) => (a.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`)) || [])[2] || '';
const bbox = (title) => { const m = title.match(/bbox (-?\d+) (-?\d+) (-?\d+) (-?\d+)/); return m ? m.slice(1, 5).map(Number) : null; };

/** One hOCR page (an ocr_page div) to words with line boxes. */
export function parseHocrPage(html) {
  const pm = html.match(/class=["']ocr_page["'][^>]*/);
  const pb = pm ? bbox(attr(pm[0], 'title')) : null;
  const words = [], lines = [];
  const re = /<span\b([^>]*)>|<\/span>/g;
  let m;
  while ((m = re.exec(html))) {
    if (!m[1]) continue;
    const cls = attr(m[1], 'class');
    const b = bbox(attr(m[1], 'title'));
    if (!b) continue;
    if (/\bocr(_line|_textfloat|_header|_caption)\b/.test(cls)) lines.push(b);
    else if (/\bocrx_word\b/.test(cls)) {
      const end = html.indexOf('</span>', re.lastIndex);
      const t = decode(html.slice(re.lastIndex, end < 0 ? undefined : end).replace(/<[^>]*>/g, '')).trim();
      if (t) words.push({ t, x0: b[0], y0: b[1], x1: b[2], y1: b[3], l: Math.max(0, lines.length - 1) });
    }
  }
  if (!lines.length) for (const w of words) w.l = 0;
  return { w: pb ? pb[2] : 0, h: pb ? pb[3] : 0, words, lines: lines.length ? lines : [[0, 0, 0, 0]], src: 'hocr' };
}

/** One djvu.xml OBJECT to the same shape; line boxes are the union of their words. */
export function parseDjvuObject(xml) {
  const om = xml.match(/<OBJECT\b[^>]*>/);
  const words = [], lines = [];
  for (const lm of xml.matchAll(/<LINE>([\s\S]*?)<\/LINE>/g)) {
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const wm of lm[1].matchAll(/<WORD\b[^>]*coords="([^"]*)"[^>]*>([\s\S]*?)<\/WORD>/g)) {
      const [l, b, r, t] = wm[1].split(',').map(Number);
      const text = decode(wm[2]).trim();
      if (!text || [l, b, r, t].some((v) => !Number.isFinite(v))) continue;
      words.push({ t: text, x0: l, y0: Math.min(t, b), x1: r, y1: Math.max(t, b), l: lines.length });
      box[0] = Math.min(box[0], l); box[1] = Math.min(box[1], t, b); box[2] = Math.max(box[2], r); box[3] = Math.max(box[3], t, b);
    }
    if (box[0] !== Infinity) lines.push(box);
  }
  return { w: om ? Number(attr(om[0], 'width')) : 0, h: om ? Number(attr(om[0], 'height')) : 0, words, lines: lines.length ? lines : [[0, 0, 0, 0]], src: 'djvu' };
}

export default function (app) {
  const { cache, UA } = app;
  const DIR = join(app.CACHE, 'ocr');
  const base = (id) => `https://archive.org/download/${id}/${id}`;
  const file = (id, name) => { const d = join(DIR, id); mkdirSync(d, { recursive: true }); return join(d, name); };
  const readJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return null; } };
  /** An archive.org file through the shared disk cache (and its per-host
   *  limits), or null if it does not exist. archive.org's occasional HTTP 500
   *  gets one retry; other failures throw. `fg`: someone is waiting for it. */
  const source = async (u, fg = true, retry = true) => {
    try { await cache.ensure(u, { fg }); return cache.read(u); } catch (e) {
      if (/HTTP (403|404|410)\b/.test(e.message)) return null;
      if (retry && /HTTP 500\b/.test(e.message)) { await new Promise((r) => setTimeout(r, 400)); return source(u, fg, false); }
      throw e;
    }
  };
  const memo = new Map();
  const once = (key, fn) => { if (!memo.has(key)) { const p = fn(); memo.set(key, p); p.catch(() => memo.delete(key)); } return memo.get(key); };
  let served = 0;

  /** Bytes [a, b) of an archive.org file by HTTP Range (redirects followed to the datanode). */
  async function range(u, a, b, retry = true) {
    const r = await fetch(u, { headers: { 'User-Agent': UA, Range: `bytes=${a}-${b - 1}` }, redirect: 'follow' });
    if (r.status >= 500 && retry) { await new Promise((res) => setTimeout(res, 400)); return range(u, a, b, false); }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    cache.stats.bytes += buf.length;
    return r.status === 206 ? buf : buf.subarray(a, b); // a server that ignores Range sends the whole file
  }

  /** The offset d with hOCR page = leafNum + d (see the header). */
  async function leafOffset(id, index, pages, fg) {
    const f = file(id, 'map.json');
    const saved = existsSync(f) && readJson(f);
    if (saved && saved.v === 1) return saved.d;
    const D = [0, -1, 1, -2];
    let d = null, how = 'default';
    // 1. Printed page numbers at the top or bottom of the page's text.
    const labelled = pages.filter((p) => p.pageNumber);
    if (labelled.length >= 5) {
      const st = await source(base(id) + '_hocr_searchtext.txt.gz', fg);
      if (st) {
        const all = gunzipSync(st).toString('utf-8');
        const score = (dd) => labelled.filter((p) => {
          const e = index[p.leafNum + dd]; if (!e) return false;
          const t = all.slice(e[0], e[1]).toLowerCase();
          return (t.slice(0, 80) + ' ' + t.slice(-80)).split(/[^a-z0-9]+/).includes(String(p.pageNumber).toLowerCase());
        }).length;
        const sc = D.map(score); const best = Math.max(...sc); const second = [...sc].sort((a, b) => b - a)[1];
        if (best >= 3 && best >= 2 * second) { d = D[sc.indexOf(best)]; how = 'labels'; }
      }
    }
    // 2. The first pages' sizes against the djvu.xml OBJECTs.
    if (d == null) {
      try {
        const head = (await range(base(id) + '_djvu.xml', 0, 262144)).toString('utf-8');
        const objs = [...head.matchAll(/<OBJECT\b[^>]*>/g)].map((m) => ({ leaf: Number((attr(m[0], 'usemap').match(/_(\d+)\.djvu$/) || [])[1]), w: attr(m[0], 'width'), h: attr(m[0], 'height') })).filter((o) => Number.isFinite(o.leaf));
        let n = 1; while (n < Math.min(index.length, 16) && index[n][3] - index[0][2] < 400000) n++;
        const html = (await range(base(id) + '_hocr.html', index[0][2], index[n - 1][3])).toString('utf-8');
        const dims = [...html.matchAll(/class=["']ocr_page["'][^>]*/g)].map((m) => (bbox(attr(m[0], 'title')) || []).slice(2).join('x'));
        const sc = D.map((dd) => objs.filter((o) => dims[o.leaf + dd] === `${o.w}x${o.h}`).length);
        const best = Math.max(...sc);
        if (best >= 2 && sc.filter((x) => x === best).length === 1) { d = D[sc.indexOf(best)]; how = 'sizes'; }
      } catch { how = 'failed'; }
    }
    d ??= 0;
    if (how !== 'failed') writeFileSync(f, JSON.stringify({ v: 1, d, how }));
    else setTimeout(() => memo.delete('meta|' + id), 60000); // try again in a minute
    return d;
  }

  // Which OCR files exist, and how page k maps onto them.
  const meta = (id, fg = true) => once('meta|' + id, async () => {
    const [pn, pi] = await Promise.all([source(base(id) + '_page_numbers.json', fg), source(base(id) + '_hocr_pageindex.json.gz', fg)]);
    let pages = null, confidence = null, index = null;
    try { const j = JSON.parse(pn); pages = j.pages || null; confidence = j.confidence ?? null; } catch { /* none */ }
    try { index = JSON.parse(gunzipSync(pi)); } catch { /* no hOCR */ }
    const leaves = pages?.map((p) => p.leafNum) || null;
    // Same count: hOCR holds just the access pages, in order.
    const d = index && leaves && index.length !== leaves.length ? await leafOffset(id, index, pages, fg) : null;
    const hocrPage = (k) => {
      if (!index) return null;
      const h = d == null ? k : leaves[k] + d;
      return h >= 0 && h < index.length ? h : null;
    };
    const n = leaves?.length || index?.length || 0;
    return { index, hocrPage, n, labels: pages?.map((p) => (p.pageNumber ? String(p.pageNumber) : null)) || null, confidence };
  });

  // Parsed djvu.xml split at its OBJECTs, the last two books kept in memory.
  const djvus = new Map();
  const djvu = (id, fg = true) => {
    if (!djvus.has(id)) {
      const p = source(base(id) + '_djvu.xml', fg).then((buf) => {
        if (!buf) throw new Error('no OCR for this scan');
        const xml = buf.toString('utf-8'); const at = [];
        for (let i = xml.indexOf('<OBJECT'); i >= 0; i = xml.indexOf('<OBJECT', i + 7)) at.push(i);
        return { xml, at, page: (k) => (k < at.length ? xml.slice(at[k], at[k + 1] ?? xml.length) : null) };
      });
      djvus.set(id, p); p.catch(() => djvus.delete(id));
      while (djvus.size > 2) djvus.delete(djvus.keys().next().value);
    }
    return djvus.get(id);
  };

  /** Fetch a chunk of hOCR pages in one Range request and cache each as words. */
  const fetchHocr = (id, m, chunkStart) => once(`hocr|${id}|${chunkStart}`, async () => {
    const pages = [];
    for (let k = chunkStart; k < Math.min(m.n, chunkStart + CHUNK); k++) { const hp = m.hocrPage(k); if (hp != null) pages.push([k, m.index[hp]]); }
    if (!pages.length) return;
    const lo = Math.min(...pages.map(([, e]) => e[2])), hi = Math.max(...pages.map(([, e]) => e[3]));
    const buf = await range(base(id) + '_hocr.html', lo, hi);
    for (const [k, e] of pages) writeFileSync(file(id, `p${k}.json`), JSON.stringify(parseHocrPage(buf.subarray(e[2] - lo, e[3] - lo).toString('utf-8'))));
  }).finally(() => memo.delete(`hocr|${id}|${chunkStart}`));

  async function words(id, k, fg) {
    const f = file(id, `p${k}.json`);
    const hit = existsSync(f) && readJson(f);
    if (hit) return hit;
    const m = await meta(id, fg);
    if (m.index && m.hocrPage(k) != null) {
      const c = Math.floor(k / CHUNK) * CHUNK;
      await fetchHocr(id, m, c);
      // Read ahead: the next chunk is usually where the reader goes next.
      if (k - c >= CHUNK / 2 && c + CHUNK < m.n && !existsSync(file(id, `p${c + CHUNK}.json`))) fetchHocr(id, m, c + CHUNK).catch(() => {});
      return readJson(f);
    }
    const d = await djvu(id, fg);
    const obj = d.page(k);
    if (!obj) throw Object.assign(new Error('no such page'), { code: 404 });
    const out = parseDjvuObject(obj);
    writeFileSync(f, JSON.stringify(out));
    return out;
  }

  const texts = (id) => once('text|' + id, async () => {
    const f = file(id, 'text.json');
    const hit = existsSync(f) && readJson(f);
    if (hit) return hit;
    const m = await meta(id);
    let out = null;
    if (m.index) {
      const st = await source(base(id) + '_hocr_searchtext.txt.gz');
      if (st) {
        const all = gunzipSync(st).toString('utf-8');
        out = { pages: Array.from({ length: m.n }, (_, k) => { const hp = m.hocrPage(k); return hp == null ? '' : all.slice(m.index[hp][0], m.index[hp][1]); }), src: 'hocr' };
      }
    }
    if (!out) {
      const d = await djvu(id);
      out = { pages: d.at.map((_, k) => parseDjvuObject(d.page(k)).words.map((w) => w.t).join(' ')), src: 'djvu' };
    }
    writeFileSync(f, JSON.stringify(out));
    return out;
  });

  const ok = (id) => /^[\w.-]{1,200}$/.test(id || '');
  const wrap = (fn) => async (req, res, url) => {
    const id = url.searchParams.get('ia');
    if (!ok(id)) return app.json(res, { error: 'bad id' }, 400);
    try {
      const out = await fn(id, url);
      served++;
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' });
      res.end(JSON.stringify(out));
    } catch (e) { app.json(res, { error: e.message }, e.code === 404 ? 404 : 502); }
  };
  // &bg=1: a prefetch (the next items), which yields to pages the reader is waiting for.
  app.route('GET', '/ocr', wrap((id, url) => words(id, Math.max(0, Number(url.searchParams.get('k')) || 0), !url.searchParams.get('bg'))));
  app.route('GET', '/ocr/text', wrap((id) => texts(id)));
  app.route('GET', '/ocr/labels', wrap(async (id) => { const m = await meta(id); return { labels: m.labels, confidence: m.confidence }; }));
  app.status(() => ({ ocr: served }));
}
