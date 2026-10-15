// Raster pages: fetch or render, find the ink, crop, split columns, mark blanks.
// With a profile (profile.js), the crop, blank pages and gutters come from it,
// and a stored display image stands in for a pdf.js render when it is sharp
// enough: decoded and cropped off the main thread (createImageBitmap).
import { P, lru } from './util.js';
import { state } from './state.js';
import { openDoc, scanUrl } from './docs.js';
import { analyzeLum } from './profile-core.js';
import { profileOf, cropOf, displayFor, assetUrl, assetMissing, cropKey } from './profile.js';

const imgs = new Map();
export function loadImg(src) {
  return lru(imgs, src, () => new Promise((res, rej) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => im.decode().then(() => res(im), () => res(im));
    im.onerror = () => rej(new Error('image unavailable'));
    im.src = src;
  }), 60);
}

/** Find the ink box, whether the page is blank, and a two-column gutter. */
export function analyze(src) {
  const W = 240; const H = Math.max(1, Math.round(src.height * (W / src.width)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
  // The algorithm lives in profile-core.js, so the feed and the compiler find the same boxes.
  const a = analyzeLum(lum, W, H);
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
  const a = analyze(src);
  if (a.blank) return [{ blank: true, k }];
  return panelsBox(src, k, state.crop ? a.box : FULL, a.gutter, extra);
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
/** Panels cut from an image (a Blob) showing region `ibox` of the page, at `fw` x `fh` px a full page. */
async function panelsFromImage(blob, k, ibox, fw, fh, iw, ih, box, gutter, extra) {
  const parts = partsOf(box, gutter);
  const rect = (b) => {
    const sx = Math.max(0, Math.round((b.x0 - ibox[0]) * fw)), sy = Math.max(0, Math.round((b.y0 - ibox[1]) * fh));
    return [sx, sy, Math.max(1, Math.min(iw - sx, Math.round((b.x1 - b.x0) * fw))), Math.max(1, Math.min(ih - sy, Math.round((b.y1 - b.y0) * fh)))];
  };
  let bms;
  if (parts.length === 1 && iw && ih) bms = [await createImageBitmap(blob, ...rect(parts[0].box))];
  else {
    const all = await createImageBitmap(blob);
    if (!iw) { iw = all.width; ih = all.height; fw = iw / (ibox[2] - ibox[0]); fh = ih / (ibox[3] - ibox[1]); }
    bms = await Promise.all(parts.map((x) => createImageBitmap(all, ...rect(x.box))));
    all.close?.();
  }
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
export function dropRenders() { renders.clear(); done.clear(); imgs.clear(); }
export const renderedNow = (it, k) => { const key = keyOf(it, k); return renders.has(key) ? done.get(key) || null : null; };
export function renderPage(it, k) {
  const key = keyOf(it, k);
  const p = renderPage1(it, k, key);
  if (!p._watched) {
    p._watched = true;
    p.then((v) => { done.set(key, v); if (done.size > 400) done.delete(done.keys().next().value); }, () => {});
  }
  return p;
}
function renderPage1(it, k, key) {
  return lru(renders, key, async () => {
    const pf = profileOf(it), pg = pf?.pages?.[k];
    if (pg) {
      if (pg.blank) return [{ blank: true, k }];
      const d = displayFor(pf, k, RENDER_H);
      if (d) {
        try {
          const r = await fetch(assetUrl(pf, 'display', k));
          if (!r.ok) throw new Error('gone');
          const fw = d.w / (d.box[2] - d.box[0]), fh = d.h / (d.box[3] - d.box[1]);
          return await panelsFromImage(await r.blob(), k, d.box, fw, fh, d.w, d.h, cropOf(pf, k), pg.gut, { pdfScale: fw / pg.w, src: 'asset' });
        } catch { assetMissing(pf, 'display', k); /* fall back to rendering */ }
      }
      if (it.kind === 'scan') {
        const r = await fetch(P(scanUrl(it, k, 1000)));
        if (!r.ok) throw new Error('image unavailable');
        return panelsFromImage(await r.blob(), k, [0, 0, 1, 1], 0, 0, 0, 0, state.crop ? cropOf(pf, k) : FULL, pg.gut, { src: 'scan' });
      }
    }
    if (it.kind === 'scan') {
      const im = await loadImg(P(scanUrl(it, k, 1000)));
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      return panelsFrom(c, k, { src: 'scan' });
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
