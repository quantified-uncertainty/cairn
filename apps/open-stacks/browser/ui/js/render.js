// Raster pages: fetch or render, find the ink, crop, split columns, mark blanks.
// With a profile (profile.js), the crop, blank pages and gutters come from it,
// and a stored display image stands in for a pdf.js render when it is sharp
// enough: decoded and cropped off the main thread (createImageBitmap).
import { P, PI, SHARD, lru, emit } from './util.js';
import { state } from './state.js';
import { openDoc, scanUrl } from './docs.js';
import { analyzeLum } from './profile-core.js';
import { profileOf, cropOf, displayFor, assetUrl, assetMissing, cropKey } from './profile.js';

const imgs = new Map();
export function loadImg(src) {
  return lru(imgs, src, () => new Promise((res, rej) => {
    const im = new Image(); im.decoding = 'async';
    if (/^https?:/.test(src)) im.crossOrigin = 'anonymous'; // a page image from the second origin (util.js PI)
    im.onload = () => im.decode().then(() => res(im), () => res(im));
    im.onerror = () => rej(new Error('image unavailable'));
    im.src = src;
  }), 60);
}

/** Find the ink box, whether the page is blank, and a two-column gutter. */
export function analyze(src, { scan = true } = {}) {
  const W = 240; const H = Math.max(1, Math.round(src.height * (W / src.width)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
  // The algorithm lives in profile-core.js, so the feed and the compiler find the same boxes.
  const a = analyzeLum(lum, W, H, { scan });
  if (a.blank) return { blank: true };
  const pad = state.cropPad ?? 0.012; // Settings: crop padding, a fraction of the page
  const [x0, y0, x1, y1] = a.ink;
  return { blank: false, box: { x0: Math.max(0, x0 - pad), y0: Math.max(0, y0 - pad), x1: Math.min(1, x1 + pad), y1: Math.min(1, y1 + pad) }, gutter: a.gut };
}
export function cut(src, box) {
  const sx = Math.round(box.x0 * src.width), sy = Math.round(box.y0 * src.height);
  const sw = Math.max(1, Math.round((box.x1 - box.x0) * src.width)), sh = Math.max(1, Math.round((box.y1 - box.y0) * src.height));
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}
/** Turn a raster page into display panels: cropped, or split into columns, or
 *  marked blank. Each panel records the box it shows, in fractions of the
 *  source page, so overlays (text layer, highlights) can be placed on it. */
export function panelsFrom(src, k, extra = {}) {
  const a = analyze(src, { scan: false }); // pdf.js renders: born-digital pages
  if (a.blank) return [{ blank: true, k }];
  return panelsBox(src, k, state.crop ? a.box : FULL, a.gutter, extra);
}

// Scans without a profile: a page's ink box, blank flag and gutter are found
// once, from whichever image of it came first (a small preview or the sharp
// w1000; boxes are fractions of the page), and reused for the other, so the
// preview and the sharp page are cut identically. Panels carry `aspect` from
// the box and the image's shape (IA's sizes are power-of-two reductions of one
// image, so it is the same for both), and feed.js sizes pages by it: the sharp
// page replaces the preview without the spread moving.
// The work stays off the main thread's canvases: the analysis reads a
// 240-px-wide copy made by createImageBitmap (drawing the full page into a
// readable canvas first cost ~40 ms of main thread a page, profiled while
// reading), and the panel is a crop shown through 'bitmaprenderer'.
const scanCuts = new Map(); // `${id}|${k}|${pad}` -> Promise<analyze() result>
async function scanPanels(it, k, im, extra) {
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  const key = `${it.id}|${k}|${state.cropPad ?? ''}`;
  let a = scanCuts.get(key);
  if (!a) {
    a = (async () => {
      const sm = await createImageBitmap(im, { resizeWidth: 240, resizeHeight: Math.max(1, Math.round((240 * ih) / iw)), resizeQuality: 'low' });
      try { return analyze(sm); } finally { sm.close?.(); }
    })();
    scanCuts.set(key, a); if (scanCuts.size > 4000) scanCuts.delete(scanCuts.keys().next().value);
    a.catch(() => scanCuts.delete(key));
  }
  const cut = await a;
  if (cut.blank) return [{ blank: true, k }];
  const panels = await panelsFromImage(im, k, [0, 0, 1, 1], state.crop ? cut.box : FULL, cut.gutter, extra);
  return panels.map((p) => ({ ...p, aspect: ((p.box.x1 - p.box.x0) * iw) / ((p.box.y1 - p.box.y0) * ih) }));
}
// The size scans are read at (the Internet Archive's w1000: ~1064 px wide for a
// 500 ppi scan), and the small sizes a preview may come from, largest first.
export const SCAN_W = 1000;
const PREVIEW_W = [600, 400, 200];
/**
 * A quick look at a scan page without a profile while its sharp image loads:
 * the largest small image of it already on the server's disk, else (with
 * `fetch`) its w200 fetched now beside the w1000 (routes/13-ia.mjs). Panels cut
 * exactly as the sharp page will be (src 'preview'), or null when there is
 * nothing quick to show.
 */
export async function previewScan(it, k, { fetch: get = false } = {}) {
  if (it.kind !== 'scan' || profileOf(it)?.pages?.[k]) return null;
  // Not through loadImg: a page with no preview now (204) may have one later.
  const im = await new Promise((res) => {
    const x = new Image(); x.decoding = 'async';
    x.onload = () => x.decode().then(() => res(x), () => res(x)); x.onerror = () => res(null);
    x.src = `/ia/preview?u=${encodeURIComponent(scanUrl(it, k, SCAN_W))}&w=${PREVIEW_W.join(',')}${get ? '&fetch=1' : ''}`;
  });
  return im ? scanPanels(it, k, im, { src: 'preview' }).catch(() => null) : null;
}
const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };
/** The boxes a page shows: the crop, or its two columns split at the gutter. */
function partsOf(box, gutter) {
  if (!(state.cols && gutter)) return [{ box }];
  return [{ box: { ...box, x1: Math.min(box.x1, gutter + 0.01) }, part: 'a' }, { box: { ...box, x0: Math.max(box.x0, gutter - 0.01) }, part: 'b' }];
}
function panelsBox(src, k, box, gutter, extra = {}) {
  const base = { k, srcW: src.width, srcH: src.height, ...extra };
  const parts = partsOf(box, gutter);
  if (parts.length === 1) return [{ ...base, canvas: state.crop ? cut(src, box) : src, box }];
  return parts.map((x) => ({ ...base, canvas: cut(src, x.box), box: x.box, part: x.part }));
}
/** A canvas showing an ImageBitmap without copying it (bitmaprenderer), or by drawing it. */
function bitmapCanvas(bm) {
  const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  const ctx = c.getContext('bitmaprenderer');
  if (ctx) ctx.transferFromImageBitmap(bm); else { c.getContext('2d').drawImage(bm, 0, 0); bm.close?.(); }
  return c;
}
/** Panels cut from a decoded image showing region `ibox` of the page (the whole
 *  page for scans); each crop is an ImageBitmap shown without a copy. Images come
 *  through loadImg, so a page seen again is in the browser's memory cache. */
async function panelsFromImage(im, k, ibox, box, gutter, extra) {
  const iw = im.naturalWidth, ih = im.naturalHeight;
  const fw = iw / (ibox[2] - ibox[0]), fh = ih / (ibox[3] - ibox[1]);
  const rect = (b) => {
    const sx = Math.max(0, Math.round((b.x0 - ibox[0]) * fw)), sy = Math.max(0, Math.round((b.y0 - ibox[1]) * fh));
    return [sx, sy, Math.max(1, Math.min(iw - sx, Math.round((b.x1 - b.x0) * fw))), Math.max(1, Math.min(ih - sy, Math.round((b.y1 - b.y0) * fh)))];
  };
  const parts = partsOf(box, gutter);
  const bms = await Promise.all(parts.map((x) => createImageBitmap(im, ...rect(x.box))));
  return parts.map((x, j) => ({ k, canvas: bitmapCanvas(bms[j]), box: x.box, srcW: Math.round(fw), srcH: Math.round(fh), ...(x.part ? { part: x.part } : {}), ...extra }));
}

// PDF pages render at about the screen's physical height, so text stays sharp
// on high-DPI displays; fewer are kept in memory when they are this large.
export const RENDER_H = Math.min(2200, Math.max(1400, Math.round(screen.height * (devicePixelRatio || 1) * 0.85)));
const RENDER_CAP = RENDER_H > 1600 ? 30 : 48;
// Rendered pages, keyed by item, page and display options.
const renders = new Map();
/** The render of a page if it is already made or under way (never starts one). */
export const cachedRender = (it, k) => renders.get(keyOf(it, k)) || null;
// Finished renders, so a spread whose pages are all ready can be shown in the
// same frame as the key press (no placeholders, no await).
const done = new Map();
// cropKey: renders made before an item's profile arrived (each page cropped to its
// own ink) are not mixed with ones cropped to the profile's shared box.
const keyOf = (it, k) => `${it.id}|${k}|${state.crop}|${state.cols}|${state.cropPad ?? ''}|${cropKey(profileOf(it))}`;
/** Forget every render in memory (the benchmark measures cold paths with it). */
export function dropRenders() { renders.clear(); done.clear(); imgs.clear(); scanCuts.clear(); }
export const renderedNow = (it, k) => { const key = keyOf(it, k); return renders.has(key) ? done.get(key) || null : null; };
/** A page's panels. lane 'near' (prefetch.js) asks the render server at background priority and waits
 *  longer for it; a later foreground call for the same page does not wait behind that request. */
export function renderPage(it, k, { lane = 'fg' } = {}) {
  const key = keyOf(it, k);
  // The reader is waiting for a page prefetch is still asking the server for: ask again at fg (the
  // server promotes its job), and the prefetch's promise takes this one's result.
  if (lane === 'fg' && nearAsks.has(key) && !done.has(key)) { renders.delete(key); nearAsks.delete(key); taken.add(key); }
  const p = renderPage1(it, k, key, lane);
  if (!p._watched) {
    p._watched = true;
    p.then((v) => { done.set(key, v); if (done.size > 400) done.delete(done.keys().next().value); }, () => {});
  }
  return p;
}
function renderPage1(it, k, key, lane = 'fg') {
  return lru(renders, key, async () => {
    const pf = profileOf(it), pg = pf?.pages?.[k];
    if (pg) {
      if (pg.blank) return [{ blank: true, k }];
      const d = displayFor(pf, k, RENDER_H);
      if (d) {
        try {
          const im = await loadImg(assetUrl(pf, 'display', k));
          return await panelsFromImage(im, k, d.box, cropOf(pf, k), pg.gut, { pdfScale: d.w / (d.box[2] - d.box[0]) / pg.w, src: 'asset' });
        } catch { assetMissing(pf, 'display', k); /* gone (evicted): render instead */ }
      }
      if (it.kind === 'scan') return panelsFromImage(await loadImg(PI(scanUrl(it, k, SCAN_W))), k, [0, 0, 1, 1], state.crop ? cropOf(pf, k) : FULL, pg.gut, { src: 'scan' });
    }
    if (it.kind === 'scan') return scanPanels(it, k, await loadImg(PI(scanUrl(it, k, SCAN_W))), { src: 'scan' });
    if (onServer(it) && !(it.n && k >= it.n)) {
      const p = await serverPage(it, k, pf, pg, lane, key);
      const lost = lane !== 'fg' && taken.delete(key); // a foreground call took this page over
      if (p) return p;
      if (lost) { const cur = renders.get(key); if (cur) return cur; }
    }
    const d = await openDoc(it);
    if (k >= d.n) return [];
    const page = await d.pdf.getPage(k + 1);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min((RENDER_H * 0.85) / vp0.width, RENDER_H / vp0.height);
    const vp = page.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    // With a profile the crop is known: no ink analysis (getImageData) on the main thread.
    if (pg) return panelsBox(c, k, state.crop ? cropOf(pf, k) : FULL, pg.gut, { pdfScale: scale, src: 'pdfjs' });
    return panelsFrom(c, k, { pdfScale: scale, src: 'pdfjs' });
  }, RENDER_CAP);
}

// ---- Pages rendered on the server (docs/performance/prerender.md; server/routes/16-render.mjs) ----
// When GET /render/state says an engine runs, a PDF page is asked of the server before pdf.js draws it:
// a whole page as a JPEG, from the second origin (util.js SHARD, so it takes none of the app's six
// connections), decoded off the main thread (createImageBitmap from a Blob) and cropped here as scans
// are: by the profile's crop when there is one, else by its own ink (analyze()). The panels have the
// shape a pdf.js render gives (srcW × srcH the whole page, `box` in fractions of it), so the text
// layer, highlights and figure peek line up. The reader waits at most SERVER_WAIT ms for it; anything
// else (no engine, the PDF not on the server's disk yet, a failure, too slow) falls back to pdf.js.
export const serverRender = { on: false, engine: null, asked: 0, served: 0, fellBack: 0 };
const SERVER_WAIT = 700; // ms the reader waits for a server page before pdf.js draws it
const NEAR_WAIT = 2500; // prefetch: the page is not on screen yet, so the server may take longer
const NEAR_MAX = 2; // prefetch requests waiting on the server at once (the second origin has 6 connections)
const slow = { n: 0, until: 0 };
const tooSlow = () => { serverRender.late = (serverRender.late || 0) + 1; if (++slow.n >= 2) { slow.n = 0; slow.until = Date.now() + 20000; } };
const onServer = (it) => serverRender.on && it.kind === 'pdf' && /^https?:\/\//.test(it.url || '');
const nearAsks = new Set(); // render keys whose page is being asked for at near
const taken = new Set(); // ... and those a foreground call took over
let nearBusy = 0; const nearQ = [];
const nearSlot = () => (nearBusy < NEAR_MAX ? (nearBusy++, Promise.resolve()) : new Promise((r) => nearQ.push(r)));
const nearFree = () => { const r = nearQ.shift(); if (r) r(); else nearBusy--; };
(function probe(tries = 0) {
  fetch('/render/state').then((r) => r.json()).then((j) => {
    serverRender.engine = j.engine || null; serverRender.on = !!j.engine;
    if (j.engine) emit('render:ready', { engine: j.engine }); // prefetch.js sends its first hint
    if (j.pending && tries < 10) setTimeout(() => probe(tries + 1), 2000); // the server is still testing its engines
  }).catch(() => {});
})();
/** Page count from the render server when it has the PDF on disk (no pdf.js parse), else null. */
export async function serverCount(it) {
  if (!onServer(it)) return null;
  try {
    const j = await (await fetch(`/render/state?u=${encodeURIComponent(it.url)}&w=${RENDER_H}`)).json();
    if (j.n > 0) { it.n ||= j.n; return j.n; }
  } catch { /* off or offline */ }
  return null;
}
async function serverPage(it, k, pf, pg, lane, key) {
  const near = lane !== 'fg';
  if (near) { nearAsks.add(key); await nearSlot(); }
  // Two foreground pages in a row not ready in time (a busy machine): for 20 s the reader waits only
  // for pages already rendered (wait=0 is a readiness check: the server answers at once, and still
  // renders the page for next time), so pdf.js is never held up behind a slow server.
  const wait = near ? NEAR_WAIT : Date.now() < slow.until ? 0 : SERVER_WAIT;
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), wait + 150);
  serverRender.asked++;
  try {
    if (near && !nearAsks.has(key)) return null; // a foreground call took this page over meanwhile
    const r = await fetch(`${SHARD}/render/page?u=${encodeURIComponent(it.url)}&k=${k}&w=${RENDER_H}&lane=${near ? 'near' : 'fg'}&wait=${wait}`, { signal: ctl.signal, credentials: 'omit' });
    if (r.status !== 200) { r.body?.cancel?.().catch?.(() => {}); serverRender.fellBack++; if (r.status === 202 && !near && wait) tooSlow(); return null; }
    if (!near) slow.n = 0;
    const x = JSON.parse(r.headers.get('X-Render') || '{}');
    if (x.n > 0 && !it.n) it.n = x.n;
    const bm = await createImageBitmap(await r.blob());
    serverRender.served++;
    const extra = { pdfScale: x.pw ? bm.width / x.pw : undefined, src: 'server' };
    if (pg) return panelsFromBitmap(bm, k, state.crop ? cropOf(pf, k) : FULL, pg.gut, extra);
    const a = analyze(bm, { scan: false }); // born-digital pages, as a pdf.js render is analysed
    if (a.blank) { bm.close(); return [{ blank: true, k }]; }
    return panelsFromBitmap(bm, k, state.crop ? a.box : FULL, a.gutter, extra);
  } catch (e) {
    serverRender.fellBack++;
    if (e?.name === 'AbortError' && !near && wait) tooSlow();
    return null; // aborted (too slow), offline, or not an image: pdf.js draws it
  } finally {
    clearTimeout(t);
    if (near) { nearAsks.delete(key); nearFree(); }
  }
}
/** Panels from a decoded whole page: each crop (or column) an ImageBitmap shown without a copy. */
async function panelsFromBitmap(bm, k, box, gutter, extra) {
  const W = bm.width, H = bm.height;
  const parts = partsOf(box, gutter);
  const rect = (b) => { const sx = Math.max(0, Math.round(b.x0 * W)), sy = Math.max(0, Math.round(b.y0 * H)); return [sx, sy, Math.max(1, Math.min(W - sx, Math.round((b.x1 - b.x0) * W))), Math.max(1, Math.min(H - sy, Math.round((b.y1 - b.y0) * H)))]; };
  const whole = parts.length === 1 && rect(parts[0].box).every((v, i) => Math.abs(v - [0, 0, W, H][i]) <= 1);
  const bms = whole ? [bm] : await Promise.all(parts.map((x) => createImageBitmap(bm, ...rect(x.box))));
  if (!whole) bm.close();
  return parts.map((x, j) => ({ k, canvas: bitmapCanvas(bms[j]), box: x.box, srcW: W, srcH: H, ...(x.part ? { part: x.part } : {}), ...extra }));
}
