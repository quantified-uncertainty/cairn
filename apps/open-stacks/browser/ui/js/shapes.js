// Page shapes before a profile exists (feed.js placeholders, and how many pages fit).
//
// A profile (profile.js) knows every page's shape; before one is compiled, the shape
// comes from what the server already has on disk (GET /shapes, server/routes/18-shapes.mjs:
// a web PDF's page sizes from the render service, a scan's from the header of a page image,
// a Local PDF's from pdfinfo), asked for the next items in one request beside their
// profiles (prefetch.js planAround) and for a jump at most 60 ms (feed.js profileSoon).
// The raw page is then cut to its ink, so the shape shown is the raw shape times the
// lane's usual crop (width/height of the crop box, learned from pages shown). With no
// raw size, the lane's usual shown shape. Both are learned per lane and kind from the
// pages finish() puts up, and kept in the store (a few numbers a lane).
// Nothing here waits: guess() is a map lookup, ask() fetches in the background.
import { store } from './util.js';
import { state } from './state.js';
import { profileOf } from './profile.js';

const known = new Map(); // id -> {pages: {k: [w, h]}, med: [w, h], src} | null (asked, nothing yet)
const askedAt = new Map(); // id -> ms of the last request (null answers are asked again later)
const inflight = new Map(); // id -> Promise
const AGAIN = 6000; // ms before an item the server knew nothing about is asked again (its pages may be on disk now)
const enc = encodeURIComponent;
const wants = (it) => it && (it.kind === 'scan' || it.kind === 'pdf');

/** Ask the server about these items' page shapes, in one request: `list` holds items or
 *  [item, opening page] pairs; those with a profile, known, or just asked are left out. */
export function ask(list) {
  const now = Date.now();
  const want = [];
  for (const x of list) {
    const [it, k] = Array.isArray(x) ? x : [x, 0];
    if (!wants(it) || profileOf(it) || inflight.has(it.id) || known.get(it.id) || now - (askedAt.get(it.id) || 0) < AGAIN) continue;
    want.push([it, k || 0]); if (want.length >= 40) break;
  }
  if (!want.length || state.useShapes === false) return Promise.resolve(0);
  for (const [it] of want) askedAt.set(it.id, now);
  const p = fetch(`/shapes?ids=${want.map(([it]) => enc(it.id)).join(',')}&k=${want.map(([it, k]) => enc(it.id) + ':' + k).join(',')}`)
    .then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    .then((o) => { let got = 0; for (const [it] of want) { inflight.delete(it.id); const v = o[it.id] || null; if (v || !known.get(it.id)) known.set(it.id, v); if (v?.n > 0) it.n ||= v.n; if (v) got++; } return got; });
  for (const [it] of want) inflight.set(it.id, p);
  return p;
}
/** One item's shape, asked now if it is not known (resolves when the answer is in). */
export const soon = (it, k = 0) => (known.get(it?.id) ? Promise.resolve(1) : inflight.get(it?.id) || ask([[it, k]]));

// ---- what pages become once cut to their ink, per lane and kind ----
const LEARN = 'pageShapes', KEEP = 24;
let learned = store.get(LEARN, {}); // `${lane}|${kind}` -> {r: [crop w/h ratios], a: [shown aspects]}
let saveT = null;
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const laneKey = (it) => `${it.lane}|${it.kind}`;
/** Usual crop ratio (shown aspect / raw aspect) of this lane's pages; 0.97 until three are seen (measured, 16 October). */
const ratioOf = (it) => { const L = learned[laneKey(it)]; return L?.r?.length >= 3 ? med(L.r) : 0.97; };
/** Usual shown aspect of this lane's pages, or null until three are seen. */
export const laneAspect = (it) => { const L = learned[laneKey(it)]; return L?.a?.length >= 3 ? med(L.a) : null; };

/** The expected shown shape (width / height) of page k (or of the item's pages, k null), or null. */
export function guess(it, k = null) {
  if (state.useShapes === false) return null; // the benchmark's A/B switch
  const S = known.get(it?.id);
  const wh = S && ((k != null && S.pages?.[k]) || S.med);
  if (wh && wh[0] > 0 && wh[1] > 0) return (wh[0] / wh[1]) * (state.crop === false ? 1 : ratioOf(it));
  return laneAspect(it);
}
/** Learn from the panels a spread put up (feed.js finish): whole pages only, not blanks or columns. */
export function learn(it, results) {
  if (!wants(it)) return;
  const L = (learned[laneKey(it)] ||= { r: [], a: [] });
  let any = false;
  for (const panels of results) {
    const p = panels?.length === 1 ? panels[0] : null;
    if (!p?.canvas || p.part || !p.box) continue;
    const a = p.aspect ?? p.canvas.width / p.canvas.height;
    if (!(a > 0.2 && a < 5)) continue;
    L.a.push(+a.toFixed(4));
    if (state.crop !== false) { const bw = p.box.x1 - p.box.x0, bh = p.box.y1 - p.box.y0; if (bw > 0 && bh > 0) L.r.push(+(bw / bh).toFixed(4)); }
    any = true;
  }
  if (!any) return;
  L.a = L.a.slice(-KEEP); L.r = L.r.slice(-KEEP);
  if (!saveT) saveT = setTimeout(() => { saveT = null; store.set(LEARN, learned); }, 2000);
}
/** For tests and the benchmark: forget what was asked and learned. */
export function reset({ lanes = false } = {}) { known.clear(); askedAt.clear(); if (lanes) { learned = {}; store.set(LEARN, learned); } }
export const shapeOf = (it) => known.get(it?.id);
