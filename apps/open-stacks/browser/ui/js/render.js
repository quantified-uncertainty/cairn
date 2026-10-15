// Raster pages: fetch or render, find the ink, crop, split columns, mark blanks.
import { P, lru } from './util.js';
import { state } from './state.js';
import { openDoc, scanUrl } from './docs.js';

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
  const sorted = Float32Array.from(lum).sort();
  const bg = sorted[Math.floor(sorted.length * 0.8)];
  const thr = bg - Math.max(45, bg * 0.25);
  const rows = new Uint16Array(H), cols = new Uint16Array(W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (lum[y * W + x] < thr) { rows[y]++; cols[x]++; }
  // Scanner beds and page edges show up as nearly solid dark bands at the
  // borders: step past them before looking for the text block.
  let x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1;
  const lim = (a, b) => [Math.round(a * 0.12), Math.round(b * 0.12)];
  const [mxB, myB] = lim(W, H);
  while (x0 < mxB && cols[x0] > H * 0.35) x0++;
  while (W - 1 - x1 < mxB && cols[x1] > H * 0.35) x1--;
  while (y0 < myB && rows[y0] > W * 0.35) y0++;
  while (H - 1 - y1 < myB && rows[y1] > W * 0.35) y1--;
  // Then ignore a thin margin past the border, where shadows and specks live.
  x0 += Math.round(W * 0.015); x1 -= Math.round(W * 0.015); y0 += Math.round(H * 0.01); y1 -= Math.round(H * 0.01);
  let ink = 0;
  const rws = new Uint16Array(H), cls = new Uint16Array(W);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (lum[y * W + x] < thr) { rws[y]++; cls[x]++; ink++; }
  const frac = ink / Math.max(1, (x1 - x0) * (y1 - y0));
  if (frac < 0.0025) return { blank: true };
  const rmin = Math.max(1, W * 0.004), cmin = Math.max(1, H * 0.004);
  while (y0 < y1 && rws[y0] < rmin) y0++;
  while (y1 > y0 && rws[y1] < rmin) y1--;
  while (x0 < x1 && cls[x0] < cmin) x0++;
  while (x1 > x0 && cls[x1] < cmin) x1--;
  const pad = 0.012;
  const box = { x0: Math.max(0, x0 / W - pad), y0: Math.max(0, y0 / H - pad), x1: Math.min(1, (x1 + 1) / W + pad), y1: Math.min(1, (y1 + 1) / H + pad) };
  // Gutter: an ink-free vertical run in the middle third of the box.
  let gutter = null;
  const bw = x1 - x0;
  if (bw > 40) {
    let run = 0, best = 0, at = 0;
    for (let x = Math.round(x0 + bw * 0.38); x <= Math.round(x0 + bw * 0.62); x++) {
      if (cls[x] <= (y1 - y0) * 0.004) { run++; if (run > best) { best = run; at = x - run / 2; } } else run = 0;
    }
    if (best >= Math.max(2, bw * 0.012)) gutter = at / W;
  }
  return { blank: false, box, gutter };
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
export function panelsFrom(src, k) {
  const a = analyze(src);
  if (a.blank) return [{ blank: true, k }];
  const full = { x0: 0, y0: 0, x1: 1, y1: 1 };
  const box = state.crop ? a.box : full;
  const base = { k, srcW: src.width, srcH: src.height };
  if (state.cols && a.gutter) {
    const left = { ...box, x1: Math.min(box.x1, a.gutter + 0.01) };
    const right = { ...box, x0: Math.max(box.x0, a.gutter - 0.01) };
    return [{ ...base, canvas: cut(src, left), box: left, part: 'a' }, { ...base, canvas: cut(src, right), box: right, part: 'b' }];
  }
  return [{ ...base, canvas: state.crop ? cut(src, box) : src, box }];
}

// Rendered pages, keyed by item, page and display options.
const renders = new Map();
export function renderPage(it, k) {
  const key = `${it.id}|${k}|${state.crop}|${state.cols}`;
  return lru(renders, key, async () => {
    if (it.kind === 'scan') {
      const im = await loadImg(P(scanUrl(it, k, 1000)));
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      return panelsFrom(c, k);
    }
    const d = await openDoc(it);
    if (k >= d.n) return [];
    const page = await d.pdf.getPage(k + 1);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(1500 / vp0.width, 1400 / vp0.height);
    const vp = page.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    return panelsFrom(c, k).map((p) => ({ ...p, pdfScale: scale }));
  }, 48);
}
