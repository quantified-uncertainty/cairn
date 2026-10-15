// Export: collect pages into a tray (e), arrange them (E), and build one PDF
// in the browser with pdf-lib, after a cover page listing the sources:
//   - PDF pages are the original page objects (text stays selectable), scaled
//     onto the chosen page size and clipped to the crop box;
//   - scanned pages are the full-resolution page images, cropped;
//   - posts and web pages are typeset as plain serif text with page labels.
// The server saves the file to ~/Documents/Stacks (STACKS_EXPORT_DIR) and can
// send it to a reMarkable through the rmapi CLI (server/routes/75-export.mjs).
//
// A tray entry is one page: {id, k, box?, part?, flow?}. `k` is 0-based (a
// stable page for flow documents); `box` is the ink or column box in
// fractions of the page as displayed. Other features can add entries with
// addPages() (e.g. a figure's box).
import { $, h, P, on, store, toast, registerKey, fmtDate, today } from '../util.js';
import { items, byId, LANE_COLORS } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, isFlow, scanUrl } from '../docs.js';
import { analyze } from '../render.js';
import { flowRange } from '../flow.js';
import { serverPrefetch } from '../prefetch.js';
import { jumpTo, goPage } from '../nav.js';

const PDFLIB = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js'; // self-contained ESM (the +esm build imports /npm/ paths the proxy cannot serve)
const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };
// Page sizes in points. reMarkable: 157.8 x 210.4 mm, the 1404 x 1872 px screen at 226 dpi.
export const SIZES = { remarkable: ['reMarkable', [447.3, 596.4]], a5: ['A5', [419.5, 595.3]], letter: ['Letter', [612, 792]], original: ['Original', null] };
const SCAN_MAX = 2000;  // longest side of an exported scan crop, px (the reMarkable screen is 1872 px tall)
const ORIG_W = 432;     // an "Original" scan page is laid out as a 6 in wide book page

let tray = store.get('export:tray', []);
let thumbs = store.get('export:thumbs', {}); // entry key -> small JPEG data URL or a text snippet
let metas = store.get('export:items', {});   // id -> item snapshot, so the tray survives corpus rebuilds
let opts = { size: 'remarkable', trim: true, ...store.get('export:opts', {}) };
let last = null; // the latest spread:rendered detail

const keyOf = (e) => `${e.id}|${e.k}|${e.part || ''}`;
const itemOf = (id) => items[byId.get(id)] || metas[id];
const pageName = (e) => String(e.k + 1) + (e.part || '');
const round = (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 1e4) / 1e4]));
function save() {
  const keys = new Set(tray.map(keyOf)); const ids = new Set(tray.map((e) => e.id));
  for (const k of Object.keys(thumbs)) if (!keys.has(k)) delete thumbs[k];
  for (const id of Object.keys(metas)) if (!ids.has(id)) delete metas[id];
  store.set('export:tray', tray); store.set('export:thumbs', thumbs); store.set('export:items', metas);
  paintBadge(); markSpread(); paintSheet();
}

/** "pp. 3–5, 9" from 0-based page numbers. */
export function pagesLabel(ks) {
  const u = [...new Set(ks)].sort((a, b) => a - b); const runs = [];
  for (const k of u) { const r = runs.at(-1); if (r && k === r[1] + 1) r[1] = k; else runs.push([k, k]); }
  return (u.length > 1 ? 'pp. ' : 'p. ') + runs.map(([a, b]) => (a === b ? `${a + 1}` : `${a + 1}–${b + 1}`)).join(', ');
}
/** The tray as runs of one item each (the tray is kept grouped by item). */
function groups(list = tray) {
  const out = [];
  list.forEach((e, idx) => { const g = out.at(-1); if (g && g.id === e.id) g.entries.push({ e, idx }); else out.push({ id: e.id, entries: [{ e, idx }] }); });
  return out;
}

// ---------- adding pages ----------
on('spread:rendered', (d) => { last = d; markSpread(); });

function thumbOf(canvas) {
  const H = 120; const c = h('canvas', { height: H, width: Math.max(1, Math.min(180, Math.round((canvas.width * H) / canvas.height))) });
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.6);
}
/** The pages on screen as tray entries, with thumbnails. */
function spreadEntries() {
  const i = current(); const it = items[i];
  if (!last || last.it !== it || state.view !== 'feed') return [];
  if (last.flow) {
    const [a, b] = flowRange(state.start.get(i) ?? 0); const out = [];
    for (let k = a; k <= b; k++) out.push({ e: { id: it.id, k, flow: true }, thumb: (last.doc?.texts?.[k] || '').slice(0, 260) });
    return out;
  }
  return last.els.filter((el) => el.isConnected && el._pnl?.canvas).map((el) => {
    const p = el._pnl;
    // With cropping off the panel shows the whole page; find the ink box now so "trim margins" still works.
    const box = state.crop || p.part ? p.box : analyze(p.canvas).box || FULL;
    return { e: { id: it.id, k: p.k, box: round(box), ...(p.part ? { part: p.part } : {}) }, thumb: thumbOf(p.canvas) };
  });
}
/** Add entries ({e, thumb?} or bare entries), keeping each item's pages together and in page order. */
export function addPages(list) {
  const have = new Set(tray.map(keyOf)); let n = 0;
  for (const x of list) {
    const e = x.e || x; if (have.has(keyOf(e))) continue;
    const it = itemOf(e.id); if (!it) continue;
    if (!metas[e.id]) metas[e.id] = Object.fromEntries(['id', 't', 'a', 'y', 'd', 'kind', 'url', 'page', 'ia', 'lane', 'src', 'n', 'license'].filter((k) => it[k] != null).map((k) => [k, it[k]]));
    if (x.thumb) thumbs[keyOf(e)] = x.thumb;
    const same = tray.map((t, j) => [t, j]).filter(([t]) => t.id === e.id);
    const after = same.find(([t]) => t.k > e.k || (t.k === e.k && (t.part || '') > (e.part || '')));
    tray.splice(after ? after[1] : same.length ? same.at(-1)[1] + 1 : tray.length, 0, e);
    have.add(keyOf(e)); n++;
  }
  if (n) save();
  return n;
}
export function removePages(keys) {
  const ks = new Set(keys); const before = tray.length;
  tray = tray.filter((e) => !ks.has(keyOf(e)));
  if (tray.length !== before) save();
  return before - tray.length;
}
function toggleSpread() {
  const got = spreadEntries();
  if (!got.length) return toast('Nothing to add yet: wait for the pages to load');
  const have = new Set(tray.map(keyOf));
  const fresh = got.filter((g) => !have.has(keyOf(g.e)));
  if (!fresh.length) { removePages(got.map((g) => keyOf(g.e))); toast(`Removed ${pagesLabel(got.map((g) => g.e.k))} from the export tray`); return; }
  addPages(fresh);
  toast(`Added ${pagesLabel(fresh.map((g) => g.e.k))} · ${tray.length} page${tray.length > 1 ? 's' : ''} in the export tray (E)`, 2200);
  // Warm the server cache with the full-resolution scans the PDF will need.
  const it = items[current()];
  if (it.kind === 'scan') serverPrefetch(fresh.map((g) => scanUrl(it, g.e.k, 1500)), 50, 'export-' + it.id + '-' + fresh[0].e.k);
}

/** A ribbon on spread pages that are in the tray. */
function markSpread() {
  if (!last?.els || last.flow) return;
  const keys = new Set(tray.map(keyOf));
  for (const el of last.els) if (el._pnl?.canvas) el.classList.toggle('xp-in', keys.has(keyOf({ id: last.it.id, k: el._pnl.k, part: el._pnl.part })));
}

// ---------- the tray sheet ----------
let sheet = null; let badge = null; let rm = null; let busy = false;
const tilde = (p) => String(p).replace(/^\/(Users|home)\/[^/]+/, '~');
const msg = (text, cls = '') => { const m = sheet && $('.xp-msg', sheet); if (m) { m.textContent = text; m.className = 'xp-msg ' + cls; } };

function paintBadge() {
  if (!badge) {
    badge = h('button', { id: 'xp-btn', className: 'ghost', title: 'Export tray (E)', onclick: () => toggleSheet() }, 'Export ', h('span'));
    $('#keys-btn')?.before(badge);
  }
  badge.hidden = !tray.length;
  badge.lastChild.textContent = tray.length;
}

function toggleSheet(show) {
  if (!sheet) {
    sheet = h('aside', { id: 'xp', hidden: true });
    sheet.setAttribute('aria-label', 'Export tray');
    document.body.append(sheet);
    wireDrag(sheet);
  }
  sheet.hidden = !(show ?? sheet.hidden);
  if (!sheet.hidden) {
    paintSheet(); pdfLib().catch(() => {});
    fetch('/export/status').then((r) => r.json()).then((s) => { rm = s; paintSheet(); }).catch(() => {});
  }
}

function paintSheet() {
  if (!sheet || sheet.hidden) return;
  const gs = groups(); const keepMsg = $('.xp-msg', sheet);
  const seg = h('div', { className: 'xp-seg' }, ...Object.entries(SIZES).map(([k, [label]]) => h('button', {
    className: opts.size === k ? 'on' : '', textContent: label,
    title: k === 'original' ? 'Keep each page’s own size' : `Fit every page to ${label}`,
    onclick: () => { opts.size = k; store.set('export:opts', opts); paintSheet(); },
  })));
  const trim = h('input', { type: 'checkbox', checked: opts.trim, onchange: () => { opts.trim = trim.checked; store.set('export:opts', opts); } });
  const list = h('div', { className: 'xp-list' }, ...gs.map(paintGroup));
  if (!gs.length) list.append(h('p', { className: 'xp-empty' }, 'Press ', h('kbd', { textContent: 'e' }), ' on any spread to add its pages here; ', h('kbd', { textContent: 'e' }), ' again removes them.'));
  const sources = gs.length;
  sheet.replaceChildren(
    h('header', {},
      h('h2', { textContent: 'Export' }),
      h('span', { className: 'xp-n', textContent: tray.length ? `${tray.length} page${tray.length > 1 ? 's' : ''} · ${sources} source${sources > 1 ? 's' : ''}` : '' }),
      h('button', { className: 'xp-x', title: 'Close (Esc)', textContent: '×', onclick: () => toggleSheet(false) })),
    h('div', { className: 'xp-opts' }, seg, h('label', { title: 'Cut pages to their text block (the crop box)' }, trim, ' Trim margins')),
    list,
    h('footer', { className: 'xp-foot' },
      h('button', { className: 'primary', textContent: busy ? 'Building…' : 'Export PDF', disabled: busy || !tray.length, title: 'Build the PDF, save it and download it', onclick: () => exportPdf() }),
      rm?.rmapi ? h('button', { textContent: 'Send to reMarkable', disabled: busy || !tray.length, title: `Save, then upload with rmapi to ${rm.folder}`, onclick: () => exportPdf({ send: true }) }) : null,
      h('button', { className: 'ghost xp-clear', textContent: 'Clear', disabled: busy || !tray.length, onclick: clearTray }),
      keepMsg || h('div', { className: 'xp-msg' }),
      h('div', { className: 'xp-dir', textContent: rm ? `Saves to ${tilde(rm.dir)}${rm.rmapi ? '' : ' · install rmapi to send to a reMarkable'}` : '' })),
  );
}
/** Empty the tray, with an undo in the message line. */
function clearTray() {
  const prev = { tray, thumbs: { ...thumbs }, metas: { ...metas } };
  tray = []; save();
  msg(`Cleared ${prev.tray.length} page${prev.tray.length > 1 ? 's' : ''} · `);
  $('.xp-msg', sheet)?.append(h('a', { href: '#', textContent: 'Undo', onclick: (ev) => { ev.preventDefault(); ({ tray, thumbs, metas } = prev); save(); msg(''); } }));
}
function paintGroup(g) {
  const it = itemOf(g.id) || { t: g.id };
  const head = h('div', { className: 'xp-gh', draggable: true, title: 'Drag to reorder sources' },
    h('span', { className: 'dot', style: `background:${LANE_COLORS[it.lane] || 'var(--ink-3)'}` }),
    h('span', { className: 't', textContent: it.t, title: [it.t, it.a, fmtDate(it)].filter(Boolean).join(' · ') }),
    h('span', { className: 'pp', textContent: pagesLabel(g.entries.map((x) => x.e.k)) }),
    h('button', { className: 'rm', textContent: '×', title: 'Remove these pages', onclick: () => removePages(g.entries.map((x) => keyOf(x.e))) }));
  head.dataset.id = g.id;
  const ths = g.entries.map(({ e, idx }) => {
    const t = thumbs[keyOf(e)];
    const face = t?.startsWith('data:') ? h('img', { src: t, alt: '' })
      : it.kind === 'scan' && !e.flow ? h('img', { src: P(scanUrl(it, e.k, 120)), alt: '', loading: 'lazy' })
        : h('div', { className: 'tx', textContent: t || '' });
    const el = h('div', { className: 'xp-th' + (e.flow ? ' flow' : ''), draggable: true, title: `${e.flow ? 'p.' : 'Page'} ${pageName(e)} · click to view, drag to reorder` },
      face, h('span', { className: 'pn', textContent: pageName(e) }),
      h('button', { className: 'rm', textContent: '×', title: 'Remove', onclick: (ev) => { ev.stopPropagation(); removePages([keyOf(e)]); } }));
    el.dataset.idx = idx; el.dataset.id = e.id;
    el.onclick = () => reveal(e);
    return el;
  });
  const sec = h('section', { className: 'xp-g' }, head, h('div', { className: 'xp-ths' }, ...ths));
  sec.dataset.id = g.id;
  return sec;
}
/** Show a tray page in the feed. */
function reveal(e) {
  const i = byId.get(e.id); if (i == null) return;
  if (current() === i && state.view === 'feed') { goPage(e.k); return; }
  state.hist.set(i, []);
  if (isFlow(items[i])) state.pendingVp = e.k; else state.start.set(i, e.k);
  jumpTo(i);
}

// Drag to reorder: pages within their item, items as whole groups.
function wireDrag(root) {
  let drag = null;
  const clear = () => root.querySelectorAll('.drop-l,.drop-r,.drop-t,.drop-b,.dragging').forEach((x) => x.classList.remove('drop-l', 'drop-r', 'drop-t', 'drop-b', 'dragging'));
  const spot = (ev) => {
    if (!drag) return null;
    if (drag.page != null) {
      const t = ev.target.closest('.xp-th'); if (!t || t.dataset.id !== drag.id) return null;
      const r = t.getBoundingClientRect();
      return { el: t, cls: ev.clientX > r.left + r.width / 2 ? 'drop-r' : 'drop-l' };
    }
    const g = ev.target.closest('.xp-g'); if (!g || g.dataset.id === drag.group) return null;
    const r = g.getBoundingClientRect();
    return { el: g, cls: ev.clientY > r.top + r.height / 2 ? 'drop-b' : 'drop-t' };
  };
  root.addEventListener('dragstart', (ev) => {
    const t = ev.target.closest?.('.xp-th, .xp-gh'); if (!t) return;
    drag = t.classList.contains('xp-th') ? { page: Number(t.dataset.idx), id: t.dataset.id } : { group: t.dataset.id };
    ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', '');
    (drag.group ? t.closest('.xp-g') : t).classList.add('dragging');
  });
  root.addEventListener('dragover', (ev) => {
    const s = spot(ev); clear(); if (!s) return;
    ev.preventDefault(); s.el.classList.add(s.cls);
  });
  root.addEventListener('drop', (ev) => {
    const s = spot(ev); clear(); if (!s) return;
    ev.preventDefault();
    if (drag.page != null) {
      const to = Number(s.el.dataset.idx) + (s.cls === 'drop-r' ? 1 : 0);
      const [x] = tray.splice(drag.page, 1);
      tray.splice(to > drag.page ? to - 1 : to, 0, x);
    } else {
      const moving = tray.filter((e) => e.id === drag.group);
      const rest = tray.filter((e) => e.id !== drag.group);
      const ids = rest.map((e) => e.id);
      const at = s.cls === 'drop-t' ? ids.indexOf(s.el.dataset.id) : ids.lastIndexOf(s.el.dataset.id) + 1;
      rest.splice(at, 0, ...moving); tray = rest;
    }
    drag = null; save();
  });
  root.addEventListener('dragend', () => { drag = null; clear(); });
}

// ---------- building the PDF ----------
let libP = null;
const pdfLib = () => (libP ||= import(P(PDFLIB)).catch((e) => { libP = null; throw e; }));

async function bytesOf(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
/** A gate that runs at most n async tasks at once: gate(() => promise). */
function limiter(n) {
  let active = 0; const q = [];
  const next = () => { if (active >= n || !q.length) return; active++; const [fn, res, rej] = q.shift(); fn().then(res, rej).finally(() => { active--; next(); }); };
  return (fn) => new Promise((res, rej) => { q.push([fn, res, rej]); next(); });
}
/** Run fn over xs with at most n at a time; results in order. */
async function pool(xs, n, fn) {
  const out = new Array(xs.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, xs.length) }, async () => { while (next < xs.length) { const j = next++; out[j] = await fn(xs[j], j); } }));
  return out;
}
/** Crop an image or canvas to a fractional box and encode it as JPEG. */
async function cropJpeg(src, f, maxSide, quality = 0.85) {
  const W = src.width, H = src.height;
  const sx = f.x0 * W, sy = f.y0 * H, sw = Math.max(1, (f.x1 - f.x0) * W), sh = Math.max(1, (f.y1 - f.y0) * H);
  const sc = Math.min(1, maxSide / Math.max(sw, sh));
  const c = new OffscreenCanvas(Math.max(1, Math.round(sw * sc)), Math.max(1, Math.round(sh * sc)));
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const blob = await c.convertToBlob({ type: 'image/jpeg', quality });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height, sw, sh };
}
async function scanJpeg(it, e, box) {
  for (const w of [1500, 1000]) {
    const r = await fetch(P(scanUrl(it, e.k, w))).catch(() => null);
    if (!r?.ok) continue;
    const bmp = await createImageBitmap(await r.blob());
    try { const j = await cropJpeg(bmp, box, SCAN_MAX, 0.8); return { ...j, ppx: ORIG_W / bmp.width }; } finally { bmp.close(); }
  }
  throw new Error(`page ${e.k + 1} of “${it.t}” is unavailable`);
}
/** Render a PDF page with pdf.js (fallback for files pdf-lib cannot copy). */
async function pdfJpeg(pdf, e, box) {
  const page = await pdf.getPage(e.k + 1);
  const vp0 = page.getViewport({ scale: 1 });
  const scale = Math.min(3, 2200 / Math.max(vp0.width, vp0.height));
  const vp = page.getViewport({ scale });
  const c = new OffscreenCanvas(Math.floor(vp.width), Math.floor(vp.height));
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: g, viewport: vp }).promise;
  return { ...(await cropJpeg(c, box, SCAN_MAX)), ppx: 1 / scale };
}
async function addImagePage(out, jpg, size) {
  const img = await out.embedJpg(jpg.bytes);
  const [W, H] = size || [jpg.sw * jpg.ppx, jpg.sh * jpg.ppx];
  const page = out.addPage([W, H]);
  const s = Math.min(W / jpg.w, H / jpg.h);
  page.drawImage(img, { x: (W - jpg.w * s) / 2, y: (H - jpg.h * s) / 2, width: jpg.w * s, height: jpg.h * s });
  return page;
}

/** Keep only external (URI) links on a source page before copying it: copying
 *  internal links would drag the whole source document into the export. */
function keepUriLinks(L, page) {
  const { PDFName, PDFDict, PDFArray } = L; const A = PDFName.of('Annots');
  const annots = page.node.lookup(A);
  if (!(annots instanceof PDFArray)) return;
  const keep = [];
  for (let j = 0; j < annots.size(); j++) {
    const a = annots.lookup(j); if (!(a instanceof PDFDict)) continue;
    const act = a.lookup(PDFName.of('A'));
    if (a.get(PDFName.of('Subtype')) === PDFName.of('Link') && act instanceof PDFDict && act.get(PDFName.of('S')) === PDFName.of('URI')) {
      a.delete(PDFName.of('P')); keep.push(annots.get(j));
    }
  }
  if (keep.length) page.node.set(A, page.doc.context.obj(keep)); else page.node.delete(A);
}

/** Scale a copied PDF page onto the target size, clipped to its crop box.
 *  The content stays the original vector content; only a transform and a
 *  clip are wrapped around it, so text remains selectable. */
function fitPdfPage(L, page, e, o, size) {
  const { PDFName, PDFArray, PDFDict, pushGraphicsState, popGraphicsState, concatTransformationMatrix, rectangle, clip, endPath } = L;
  const f = o.trim && e.box ? e.box : FULL;
  if (!size && f === FULL) return;
  const v = page.getCropBox();
  const rot = (((page.getRotation().angle || 0) % 360) + 360) % 360;
  // Box fractions are of the page as displayed (rotation applied); map them to user space.
  const map = ([fx, fy]) => (rot === 90 ? [v.x + fy * v.width, v.y + fx * v.height]
    : rot === 180 ? [v.x + (1 - fx) * v.width, v.y + fy * v.height]
      : rot === 270 ? [v.x + (1 - fy) * v.width, v.y + (1 - fx) * v.height]
        : [v.x + fx * v.width, v.y + (1 - fy) * v.height]);
  const [a, b] = [map([f.x0, f.y0]), map([f.x1, f.y1])];
  const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), hh = Math.abs(b[1] - a[1]);
  const [TW, TH] = size ? (rot % 180 ? [size[1], size[0]] : size) : [w, hh];
  const s = Math.min(TW / w, TH / hh);
  const tx = (TW - w * s) / 2 - x * s, ty = (TH - hh * s) / 2 - y * s;
  const ctx = page.doc.context; const C = PDFName.of('Contents');
  const raw = page.node.get(C); const val = page.node.lookup(C);
  const pre = ctx.register(ctx.contentStream([pushGraphicsState(), concatTransformationMatrix(s, 0, 0, s, tx, ty), rectangle(x, y, w, hh), clip(), endPath()]));
  const post = ctx.register(ctx.contentStream([popGraphicsState()]));
  page.node.set(C, ctx.obj([pre, ...(val instanceof PDFArray ? val.asArray() : raw ? [raw] : []), post]));
  page.setMediaBox(0, 0, TW, TH); page.setCropBox(0, 0, TW, TH);
  for (const k of ['TrimBox', 'BleedBox', 'ArtBox']) page.node.delete(PDFName.of(k));
  // Move the kept links with the content (cloned: two crops of one page share annotation objects).
  const annots = page.node.lookup(PDFName.of('Annots'));
  if (annots instanceof PDFArray) {
    const moved = [];
    for (let j = 0; j < annots.size(); j++) {
      const d = annots.lookup(j); if (!(d instanceof PDFDict)) continue;
      const r = d.lookup(PDFName.of('Rect'))?.asArray?.().map((n) => n.asNumber?.() ?? 0); if (!r || r.length !== 4) continue;
      const [x0, x1] = [Math.max(Math.min(r[0], r[2]), x), Math.min(Math.max(r[0], r[2]), x + w)];
      const [y0, y1] = [Math.max(Math.min(r[1], r[3]), y), Math.min(Math.max(r[1], r[3]), y + hh)];
      if (x1 <= x0 || y1 <= y0) continue; // outside the crop
      const c = d.clone(ctx); c.delete(PDFName.of('QuadPoints'));
      c.set(PDFName.of('Rect'), ctx.obj([x0 * s + tx, y0 * s + ty, x1 * s + tx, y1 * s + ty]));
      moved.push(ctx.register(c));
    }
    page.node.set(PDFName.of('Annots'), ctx.obj(moved));
  }
}

// ---- plain-text typesetting (flow documents and the cover) ----
// The standard PDF fonts only cover WinAnsi; map what we can and mark the rest.
const REPL = { '\u2212': '-', '\u2010': '-', '\u2011': '-', '\u2192': '->', '\u2190': '<-', '\u21d2': '=>', '\u2264': '<=', '\u2265': '>=', '\u2260': '!=', '\u2248': '~', '\u221e': 'inf', '\u2208': ' in ', '\u2032': "'", '\u2033': '"', '\u2215': '/', '\u22c5': '·', '\u2217': '*', '\u2713': 'v', '\u2714': 'v', '\u2717': 'x', '\u2610': '[ ]', '\u2611': '[x]' };
const GREEK = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma sigma tau upsilon phi chi psi omega'.split(' ');
const charsets = new WeakMap();
function clean(s, font) {
  let ok = charsets.get(font); if (!ok) charsets.set(font, ok = new Set(font.getCharacterSet()));
  let out = '';
  for (const ch of String(s).replace(/[\u200b-\u200d\u2060\ufeff\u00ad]/g, '').replace(/[\s\u00a0\u2000-\u200a\u202f\u205f]/g, ' ')) {
    const cp = ch.codePointAt(0);
    if (ok.has(cp)) { out += ch; continue; }
    if (REPL[ch] != null) { out += REPL[ch]; continue; }
    const g = cp >= 0x3b1 && cp <= 0x3c9 ? GREEK[cp - 0x3b1] : cp >= 0x391 && cp <= 0x3a9 ? GREEK[cp - 0x391] : null;
    if (g) { out += cp < 0x3b1 ? g[0].toUpperCase() + g.slice(1) : g; continue; }
    const base = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    out += base && [...base].every((c) => ok.has(c.codePointAt(0))) ? base : '?';
  }
  return out;
}
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const GRAY = [0.38, 0.36, 0.33];

class Typesetter {
  constructor(L, out, fonts, [W, H], { footer = '', at = null } = {}) {
    Object.assign(this, { L, out, f: fonts, W, H, footerText: footer, at });
    this.fs = Math.max(10.5, Math.min(12, W / 40)); // body size: 11.2 pt on a reMarkable page
    this.m = Math.round(W * 0.09);
    this.top = H - this.m * 0.85; this.bottom = this.m * 0.85 + (footer ? this.fs : 0);
    this.page = null; this.y = 0; this.pages = []; this.label = null; this.labels = [];
    this.widths = new Map();
  }
  rgb(c) { return this.L.rgb(...c); }
  newPage() {
    this.finishPage();
    this.page = this.at == null ? this.out.addPage([this.W, this.H]) : this.out.insertPage(this.at++, [this.W, this.H]);
    this.pages.push(this.page); this.y = this.top; this.labels = [];
  }
  finishPage() {
    if (!this.page || !this.footerText) return;
    const fs = this.fs * 0.68; const y = this.m * 0.55; const right = this.labels.length ? pagesLabel(this.labels) : '';
    const rw = this.f.i.widthOfTextAtSize(right, fs);
    this.page.drawText(this.fit(this.footerText, this.f.i, fs, this.W - 2 * this.m - rw - 16), { x: this.m, y, size: fs, font: this.f.i, color: this.rgb(GRAY) });
    if (right) this.page.drawText(right, { x: this.W - this.m - rw, y, size: fs, font: this.f.i, color: this.rgb(GRAY) });
  }
  width(word, font, size) {
    const k = font.name + '\u0000' + word;
    if (!this.widths.has(k)) this.widths.set(k, font.widthOfTextAtSize(word, 1));
    return this.widths.get(k) * size;
  }
  fit(text, font, size, max) {
    let t = clean(text, font);
    if (font.widthOfTextAtSize(t, size) <= max) return t;
    while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > max) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }
  wrap(text, font, size, max) {
    const lines = []; let line = ''; let lw = 0; const sp = this.width(' ', font, size);
    for (let word of clean(text, font).split(' ').filter(Boolean)) {
      let ww = this.width(word, font, size);
      while (ww > max) { // break very long words (URLs) by characters
        let n = word.length; while (n > 1 && this.width(word.slice(0, n), font, size) > max - (line ? lw + sp : 0)) n--;
        if (line && n < 4) { lines.push(line); line = ''; lw = 0; continue; }
        lines.push((line ? line + ' ' : '') + word.slice(0, n)); line = ''; lw = 0;
        word = word.slice(n); ww = this.width(word, font, size);
      }
      if (line && lw + sp + ww > max) { lines.push(line); line = word; lw = ww; } else { line = line ? line + ' ' + word : word; lw += (lw ? sp : 0) + ww; }
    }
    if (line) lines.push(line);
    return lines;
  }
  /** A paragraph; returns the box of its lines on the last page, for links.
   *  `reserve`: room to keep free below it (headings stay with the text that follows). */
  para(text, { font = this.f.r, size = this.fs, indent = 0, lead = 1.3, before = this.fs * 0.45, color = [0.08, 0.07, 0.06], bullet = null, rule = false, center = false, reserve = 0 } = {}) {
    const max = this.W - 2 * this.m - indent;
    const lines = this.wrap(text, font, size, max); if (!lines.length) return null;
    const lh = size * lead;
    const need = before + lh * (reserve ? lines.length : Math.min(lines.length, 2)) + reserve; // no single orphan line
    if (!this.page || this.y - need < this.bottom) this.newPage(); else this.y -= before;
    let box = null;
    lines.forEach((ln, j) => {
      if (this.y - lh < this.bottom) this.newPage();
      const base = this.y - size * 0.95 - (lh - size) / 2;
      const x = this.m + indent + (center ? (max - font.widthOfTextAtSize(ln, size)) / 2 : 0);
      this.page.drawText(ln, { x, y: base, size, font, color: this.rgb(color) });
      if (j === 0 && bullet) this.page.drawText(clean(bullet, font), { x: this.m + indent - this.width(clean(bullet, font), font, size) - 5, y: base, size, font, color: this.rgb(color) });
      if (rule) this.page.drawLine({ start: { x: this.m + indent - 9, y: this.y }, end: { x: this.m + indent - 9, y: this.y - lh }, thickness: 1.2, color: this.rgb([0.75, 0.72, 0.66]) });
      if (this.label != null) { // a stable-page label in the right margin
        const t = `p. ${this.label + 1}`; const ls = this.fs * 0.62;
        this.page.drawText(t, { x: this.W - this.m + 5, y: base + 1, size: ls, font: this.f.i, color: this.rgb(GRAY) });
        this.labels.push(this.label); this.label = null;
      }
      const r = [x, base - size * 0.25, x + font.widthOfTextAtSize(ln, size), base + size * 0.85];
      box = box?.page === this.page ? { page: this.page, rect: [Math.min(box.rect[0], r[0]), r[1], Math.max(box.rect[2], r[2]), box.rect[3]] } : { page: this.page, rect: r };
      this.y -= lh;
    });
    return box;
  }
  space(pt) { this.y -= pt; }
  rule(width = 0.5, frac = 1) {
    if (!this.page || this.y - 10 < this.bottom) this.newPage();
    const w = (this.W - 2 * this.m) * frac; const x = this.m + (this.W - 2 * this.m - w) / 2;
    this.y -= 9; this.page.drawLine({ start: { x, y: this.y }, end: { x: x + w, y: this.y }, thickness: width, color: this.rgb([0.7, 0.67, 0.62]) }); this.y -= 7;
  }
  pre(text) {
    const size = this.fs * 0.8; const lh = size * 1.25; const font = this.f.m;
    const cols = Math.max(20, Math.floor((this.W - 2 * this.m - 8) / (0.6 * size)));
    this.y -= this.fs * 0.4;
    for (const raw of String(text).replace(/\t/g, '  ').split('\n')) {
      const line = clean(raw, font).replace(/\s+$/, '');
      for (let j = 0; j === 0 || j < line.length; j += cols) {
        if (!this.page || this.y - lh < this.bottom) this.newPage();
        this.page.drawText(line.slice(j, j + cols), { x: this.m + 8, y: this.y - size, size, font, color: this.rgb([0.15, 0.14, 0.12]) });
        this.y -= lh;
      }
    }
  }
  async image(src) {
    try {
      const jpg = await (this.imgs?.get(src) || webJpeg(src)); if (!jpg) return false;
      const img = await this.out.embedJpg(jpg.bytes); const w0 = jpg.natW;
      const maxW = this.W - 2 * this.m, maxH = (this.top - this.bottom) * 0.62;
      let w = Math.min(maxW, w0 * 0.75); let hh = (w * jpg.h) / jpg.w;
      if (hh > maxH) { w *= maxH / hh; hh = maxH; }
      if (!this.page || this.y - hh - 8 < this.bottom) this.newPage();
      this.y -= 6;
      this.page.drawImage(img, { x: this.m + (maxW - w) / 2, y: this.y - hh, width: w, height: hh });
      this.y -= hh + 4;
      return true;
    } catch { return false; }
  }
  /** One block of a flow document (an element with data-vp). */
  async block(b) {
    const tag = b.tagName; const f = this.f;
    const parts = (el) => { const ps = [...el.children].filter((c) => c.tagName === 'P'); return ps.length > 1 ? ps.map((p) => norm(p.textContent)) : [norm(el.textContent)]; };
    if (/^H[1-6]$/.test(tag)) {
      const lvl = Number(tag[1]);
      this.para(norm(b.textContent), { font: f.b, size: this.fs * (lvl <= 2 ? 1.3 : lvl === 3 ? 1.14 : 1.04), before: this.fs * 0.95, reserve: this.fs * 2.6 });
    } else if (tag === 'PRE') this.pre(b.textContent);
    else if (tag === 'LI') {
      // Nested lists live inside the item's block: print them as deeper items.
      const item = (li, depth) => {
        const ol = li.parentElement?.tagName === 'OL';
        const n = ol ? [...li.parentElement.children].indexOf(li) + Number(li.parentElement.getAttribute('start') || 1) : 0;
        const own = li.cloneNode(true); own.querySelectorAll('ul, ol').forEach((x) => x.remove());
        parts(own).forEach((t, j) => this.para(t, { indent: 14 + depth * 14, bullet: j ? null : ol ? `${n}.` : depth ? '–' : '•', before: this.fs * 0.2 }));
        for (const sub of li.querySelectorAll(':scope > ul > li, :scope > ol > li')) item(sub, Math.min(3, depth + 1));
      };
      item(b, 0);
    } else if (tag === 'BLOCKQUOTE') parts(b).forEach((t) => this.para(t, { indent: 14, rule: true, color: [0.25, 0.23, 0.2] }));
    else if (tag === 'HR') this.rule(0.5, 0.3);
    else if (tag === 'TABLE') {
      for (const tr of b.querySelectorAll('tr')) this.para([...tr.children].map((c) => norm(c.textContent)).join('   |   '), { size: this.fs * 0.86, before: this.fs * 0.15, font: tr.querySelector('th') ? f.b : f.r });
    } else if (tag === 'IMG' || tag === 'FIGURE') {
      const img = tag === 'IMG' ? b : b.querySelector('img');
      const ok = img && (await this.image(img.getAttribute('src')));
      const cap = tag === 'FIGURE' ? norm(b.querySelector('figcaption')?.textContent) : '';
      if (!img) { const t = norm(b.textContent); if (t) this.para(t); } else if (!ok) this.para(`[image${img.alt ? ': ' + img.alt : ''}]`, { font: f.i, color: GRAY });
      if (cap) this.para(cap, { font: f.i, size: this.fs * 0.88, color: GRAY, center: true, before: 2 });
    } else if (tag === 'IFRAME') this.para(`[embedded: ${b.getAttribute('src') || ''}]`, { font: f.i, color: GRAY });
    else if (tag === 'DT') this.para(norm(b.textContent), { font: f.b });
    else if (tag === 'DD') this.para(norm(b.textContent), { indent: 16, before: 2 });
    else for (const t of parts(b)) if (t) this.para(t);
  }
}

/** A web image as JPEG (most image hosts of posts allow CORS); null when it cannot be read. */
async function webJpeg(src) {
  if (!/^https?:/.test(src || '')) return null;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(src, { signal: ctl.signal }); clearTimeout(t);
    if (!r.ok) return null;
    const bmp = await createImageBitmap(await r.blob());
    try { return { ...(await cropJpeg(bmp, FULL, 1600, 0.82)), natW: bmp.width }; } finally { bmp.close(); }
  } catch { return null; }
}

/** A flow document's blocks by stable page, with the selected pages' images loading in parallel. */
async function prepFlow(it, ents) {
  const d = await openDoc(it);
  const dom = new DOMParser().parseFromString(d.html, 'text/html');
  const byVp = new Map();
  for (const b of dom.body.querySelectorAll('[data-vp]')) { const k = Number(b.dataset.vp); if (!byVp.has(k)) byVp.set(k, []); byVp.get(k).push(b); }
  const srcs = ents.flatMap((e) => (byVp.get(e.k) || []).flatMap((b) => (b.tagName === 'IMG' ? [b] : [...b.querySelectorAll('img')]).map((im) => im.getAttribute('src'))));
  const uniq = [...new Set(srcs.filter(Boolean))]; const loads = pool(uniq, 6, webJpeg);
  return { byVp, imgs: new Map(uniq.map((u, j) => [u, loads.then((r) => r[j])])) };
}
/** Typeset a flow document's selected stable pages (in tray order). */
async function addFlowPages(L, out, it, ents, { byVp, imgs }, fonts, size, tick) {
  const T = new Typesetter(L, out, fonts, size, { footer: it.t });
  T.imgs = imgs;
  T.para(it.t, { font: fonts.b, size: T.fs * 1.55, lead: 1.18, before: 0 });
  const meta = [it.a, fmtDate(it), it.src].filter(Boolean).join(' · ');
  if (meta) T.para(meta, { font: fonts.i, color: GRAY, before: 4 });
  if (it.page || it.url) T.para(it.page || it.url, { size: T.fs * 0.75, color: GRAY, before: 2 });
  T.rule(0.6);
  let prev = null;
  for (const e of ents) {
    if (prev != null && e.k !== prev + 1) { T.space(T.fs * 0.4); T.para('· · ·', { center: true, color: GRAY }); }
    T.label = e.k;
    for (const b of byVp.get(e.k) || []) await T.block(b);
    prev = e.k; tick();
  }
  T.finishPage();
}

function addLink(L, page, rect, target) {
  const { PDFName, PDFString } = L; const ctx = page.doc.context;
  const d = ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: rect, Border: [0, 0, 0] });
  if (typeof target === 'string') d.set(PDFName.of('A'), ctx.obj({ S: 'URI', URI: PDFString.of(target) }));
  else d.set(PDFName.of('Dest'), ctx.obj([target.ref, 'Fit']));
  page.node.addAnnot(ctx.register(d));
}
/** PDF bookmarks: one per source. */
function addOutline(L, out, srcs) {
  const { PDFName, PDFHexString } = L; const ctx = out.context;
  if (!srcs.length) return;
  const root = ctx.nextRef(); const refs = srcs.map(() => ctx.nextRef());
  srcs.forEach((s, j) => ctx.assign(refs[j], ctx.obj({
    Title: PDFHexString.fromText(s.it.t), Parent: root, Dest: [s.first.ref, 'Fit'],
    ...(j ? { Prev: refs[j - 1] } : {}), ...(j < srcs.length - 1 ? { Next: refs[j + 1] } : {}),
  })));
  ctx.assign(root, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs.at(-1), Count: srcs.length }));
  out.catalog.set(PDFName.of('Outlines'), root);
}
/** The cover: what is in the file and where each piece came from. */
function addCover(L, out, srcs, fonts, size, nPages) {
  const lay = (offset) => {
    const T = new Typesetter(L, out, fonts, size, { at: 0 });
    T.para('Stacks export', { font: fonts.b, size: T.fs * 2, before: 0 });
    const d = new Date();
    T.para(`${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${nPages} page${nPages > 1 ? 's' : ''} from ${srcs.length} source${srcs.length > 1 ? 's' : ''}`, { font: fonts.i, color: GRAY, before: 4 });
    T.rule(0.6);
    srcs.forEach((s, j) => {
      const it = s.it;
      const tb = T.para(`${j + 1}.  ${it.t}`, { font: fonts.b, size: T.fs, before: T.fs * 0.85, reserve: T.fs * 3.2 });
      if (tb) addLink(L, tb.page, tb.rect, s.first); // the title jumps to the source's first page
      const meta = [it.a, fmtDate(it), it.src].filter(Boolean).join(' · ');
      if (meta) T.para(meta, { font: fonts.i, size: T.fs * 0.9, indent: 16, before: 1 });
      const link = it.page || it.url;
      if (link && /^https?:/.test(link)) { const lb = T.para(link, { size: T.fs * 0.76, indent: 16, color: [0.15, 0.3, 0.55], before: 1 }); if (lb) addLink(L, lb.page, lb.rect, link); }
      const at = s.count > 1 ? `pages ${s.start + offset + 1}–${s.start + offset + s.count}` : `page ${s.start + offset + 1}`;
      T.para([`${pagesLabel(s.ks)}${s.flow ? ' (of ~280 words each)' : ''}`, `here: ${at}`, it.license ? `licence: ${it.license}` : ''].filter(Boolean).join('  ·  '), { size: T.fs * 0.76, indent: 16, color: GRAY, before: 1 });
    });
    T.para('Exported from Stacks Browser. Page images and text come from the sources listed; check each source’s licence before sharing further.', { size: T.fs * 0.7, font: fonts.i, color: GRAY, before: T.fs * 1.6 });
    return T.pages.length;
  };
  // The cover's own length shifts the page numbers it cites: lay it out again if it was not one page.
  const n = lay(1);
  if (n !== 1) { for (let j = 0; j < n; j++) out.removePage(0); lay(n); }
}

/** Build the PDF for a list of tray entries. Returns {bytes, pages, sources, ms}. */
export async function buildPdf(list = tray, o = opts, progress = () => {}) {
  const t0 = performance.now();
  const L = await pdfLib();
  const out = await L.PDFDocument.create();
  const fonts = Object.fromEntries(await Promise.all(Object.entries({ r: 'TimesRoman', b: 'TimesRomanBold', i: 'TimesRomanItalic', m: 'Courier' }).map(async ([k, f]) => [k, await out.embedFont(L.StandardFonts[f])])));
  const size = SIZES[o.size]?.[1] || null;
  // Without trimming, the two columns of a split page become the page once.
  const ents = o.trim ? list : list.filter((e, j) => !(e.part && j && list[j - 1].id === e.id && list[j - 1].k === e.k && list[j - 1].part));
  let done = 0; const tick = () => progress(++done, ents.length);
  const box = (e) => (o.trim && e.box ? e.box : FULL);
  const skipped = [];
  // Start every source's slow work (fetches, image decoding and encoding) at once, then assemble in order.
  const heavy = limiter(4); // a decoded full-resolution scan holds ~40 MB
  const jobs = groups(ents).map((g) => {
    const it = itemOf(g.id); const es = g.entries.map((x) => x.e);
    if (!it) return null;
    const ready = it.kind === 'scan' ? Promise.all(es.map((e) => heavy(() => scanJpeg(it, e, box(e))).then((j) => { tick(); return j; }, () => { skipped.push(`${it.t} p. ${e.k + 1}`); return null; })))
      : it.kind === 'pdf' ? bytesOf(P(it.url)).catch(() => { skipped.push(it.t); return null; })
        : prepFlow(it, es).catch(() => { skipped.push(it.t); return null; });
    return { it, es, ready };
  }).filter(Boolean);
  const srcs = [];
  for (const { it, es, ready } of jobs) {
    const data = await ready; if (!data) continue;
    const start = out.getPageCount();
    if (it.kind === 'scan') { for (const j of data) if (j) await addImagePage(out, j, size); }
    else if (it.kind === 'pdf') {
      let src = null;
      try { src = await L.PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false, parseSpeed: L.ParseSpeeds.Fastest }); if (src.isEncrypted) src = null; } catch (err) { console.warn('export: cannot copy pages, rasterising', it.url, err); }
      if (src) {
        const ok = es.filter((e) => e.k < src.getPageCount());
        for (const k of new Set(ok.map((e) => e.k))) keepUriLinks(L, src.getPage(k));
        const pages = await out.copyPages(src, ok.map((e) => e.k));
        pages.forEach((p, j) => { fitPdfPage(L, p, ok[j], o, size); out.addPage(p); tick(); });
      } else { // encrypted or unreadable for pdf-lib: rasterise with pdf.js
        try {
          const d = await openDoc(it);
          for (const e of es.filter((x) => x.k < d.n)) { await addImagePage(out, await heavy(() => pdfJpeg(d.pdf, e, box(e))), size); tick(); }
        } catch { skipped.push(it.t); }
      }
    } else await addFlowPages(L, out, it, es, data, fonts, size || SIZES.letter[1], tick);
    const count = out.getPageCount() - start;
    if (count) srcs.push({ it, ks: es.map((e) => e.k), flow: isFlow(it), start, count, first: out.getPage(start) });
  }
  if (!srcs.length) throw new Error('nothing could be exported' + (skipped.length ? ` (unavailable: ${skipped.join(', ')})` : ''));
  const nPages = out.getPageCount();
  addCover(L, out, srcs, fonts, size || SIZES.letter[1], nPages);
  addOutline(L, out, srcs);
  out.setTitle(srcs.length === 1 ? srcs[0].it.t : `Stacks export: ${srcs.map((s) => s.it.t).join('; ')}`.slice(0, 500));
  const authors = [...new Set(srcs.map((s) => s.it.a).filter(Boolean))];
  if (authors.length) out.setAuthor(authors.join('; ').slice(0, 300));
  out.setCreator('Stacks Browser'); out.setProducer('pdf-lib 1.17.1');
  const bytes = await out.save({ objectsPerTick: 5000 }); // the default (50) yields so often that saving takes 10x longer
  return { bytes, pages: out.getPageCount(), sources: srcs.length, skipped, ms: Math.round(performance.now() - t0) };
}

function fileName(list = tray) {
  const gs = groups(list); const first = itemOf(gs[0]?.id);
  const t = (first?.t || 'Stacks export').replace(/[–—]/g, '-').slice(0, 80);
  return gs.length === 1 ? `${t} (${pagesLabel(gs[0].entries.map((x) => x.e.k)).replace(/–/g, '-')})` : `Stacks ${today} - ${t} +${gs.length - 1}`;
}

/** Export button: build, save on the server, download; optionally send to the reMarkable. */
export async function exportPdf({ send = false, download = !send } = {}) {
  if (busy) return;
  if (!tray.length) { toast('The export tray is empty: press e on a spread'); return; }
  busy = true; paintSheet(); msg('Loading pdf-lib…');
  try {
    const r = await buildPdf(tray, opts, (n, of) => msg(`Building… ${n}/${of} pages`));
    const name = fileName();
    if (download) {
      const url = URL.createObjectURL(new Blob([r.bytes], { type: 'application/pdf' }));
      h('a', { href: url, download: name + '.pdf' }).click();
      setTimeout(() => URL.revokeObjectURL(url), 60e3);
    }
    msg('Saving…');
    const saved = await (await fetch('/export?name=' + encodeURIComponent(name), { method: 'POST', body: r.bytes, headers: { 'Content-Type': 'application/pdf' } })).json();
    if (saved.error) throw new Error(saved.error);
    const info = `${r.pages} pages · ${(r.bytes.length / 1e6).toFixed(1)} MB · ${(r.ms / 1000).toFixed(1)} s`;
    msg(`Saved ${tilde(saved.path)} · ${info}${r.skipped.length ? ` · skipped (unavailable): ${r.skipped.join(', ')}` : ''}`, 'ok');
    if (send) {
      msg(`Sending to reMarkable… (${info})`);
      const s = await (await fetch('/export/remarkable', { method: 'POST', body: JSON.stringify({ file: saved.file }) })).json();
      msg(s.ok ? `Sent “${saved.file}” to reMarkable ${s.folder} · ${info}` : `rmapi failed: ${s.output}`, s.ok ? 'ok' : 'bad');
      toast(s.ok ? 'Sent to reMarkable' : 'Sending to reMarkable failed', 2400);
    } else toast(`Exported ${r.pages} pages`, 2000);
    return { ...r, ...saved };
  } catch (e) {
    console.error(e); msg('Export failed: ' + e.message, 'bad');
  } finally { busy = false; paintSheet(); }
}

// ---------- keys ----------
registerKey('e', toggleSpread, { help: ['e E', 'add these pages to the export tray (again: remove) / open the tray: PDF, reMarkable'], order: 42 });
registerKey('E', () => toggleSheet(), { view: null });
// Esc closes the sheet (and does not also leave zoom in the feed).
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && sheet && !sheet.hidden && !ev.metaKey && !ev.ctrlKey) { ev.stopPropagation(); ev.preventDefault(); toggleSheet(false); }
}, true);
on('boot', paintBadge);
