// Profiles in the browser: the compiled form of an item (page shapes, one crop
// box for the body pages, blank pages, spreads, contents, sprite and display
// images), fetched from the server and kept for the session. Core modules
// (render.js, feed.js, prefetch.js) use it when a profile is present and do
// exactly what they did before when it is not. features/compile.js makes them.
// Format and rules: docs/profiles/spec.md; the pure parts are in profile-core.js.
//
// Emits 'profile:updated' {id, profile} whenever a profile arrives or changes.
import { emit, store } from './util.js';
import { state } from './state.js';
import * as core from './profile-core.js';
export { spreadStarts, snapStart, spreadAt, HINTS, GEN, SCHEMA, DEFAULT_PAD, toBox, toArr } from './profile-core.js';

// Settings (spec 12.1): show display images and sprites when available. The
// benchmark turns them off (useAssets) or ignores profiles altogether (useProfiles).
state.useAssets ??= store.get('useAssets', true);
state.useProfiles ??= true;

const known = new Map(); // id -> Profile | null (known to have none)
const inflight = new Map();
const CAP = 300;
const enc = encodeURIComponent;
/** A profile is used only if it describes the item as the reader sees it. */
function usable(it, P) {
  if (!P || P.schema !== core.SCHEMA || P.stale === 'src' || P.kind !== it.kind) return false;
  if ((it.kind === 'pdf' || it.kind === 'scan') && (P.pages?.length !== P.n || (it.n && it.n !== P.n))) return false;
  return true;
}
function remember(id, P) {
  const old = known.get(id);
  known.delete(id); known.set(id, P);
  while (known.size > CAP) known.delete(known.keys().next().value);
  if (P && (!old || old.rev !== P.rev || old.pid !== P.pid)) emit('profile:updated', { id, profile: P });
}
/** Sync: the item's profile, null (known to have none) or undefined (not asked yet). */
export function profileOf(it) {
  if (!it || state.useProfiles === false) return null;
  const P = known.get(it.id);
  if (P === undefined) return undefined;
  return P && usable(it, P) ? P : null;
}
/** The raw stored profile, even when it does not fit the item (compile.js decides what to redo). */
export const storedProfile = (it) => known.get(it?.id);
/** Fetch an item's profile (de-duplicated; revalidated with its ETag when forced). */
export function loadProfile(it, { force = false } = {}) {
  if (!it) return Promise.resolve(null);
  if (!force && known.has(it.id)) return Promise.resolve(profileOf(it));
  if (inflight.has(it.id)) return inflight.get(it.id);
  const old = known.get(it.id);
  const p = fetch('/profile?id=' + enc(it.id), { headers: old ? { 'If-None-Match': `"${old.pid}.${old.rev}"` } : {} })
    .then(async (r) => (r.status === 304 ? old : r.status === 404 || r.status === 400 ? null : r.ok ? r.json() : old ?? null))
    .catch(() => old ?? null)
    .then((P) => { inflight.delete(it.id); remember(it.id, P ?? null); return profileOf(it); });
  inflight.set(it.id, p);
  return p;
}
/** Fetch the whole profiles of these items that are not known yet, in one request (prefetch). Resolves to how many arrived. */
export async function loadProfiles(list) {
  const want = [...new Set(list.filter((it) => it && !known.has(it.id) && !inflight.has(it.id)).map((it) => it.id))].slice(0, 40);
  if (!want.length) return 0;
  const p = fetch('/profiles?full=1&ids=' + want.map(enc).join(',')).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  for (const id of want) inflight.set(id, p.then((o) => o[id] ?? null));
  const o = await p;
  let got = 0;
  for (const id of want) { inflight.delete(id); remember(id, o[id] ?? null); if (o[id]) got++; }
  return got;
}
/** After an upload: the server's answer replaces what we had. */
export function setProfile(id, P) { remember(id, P); }
export function forgetLocal(id) { known.delete(id); }

/** A short signature of how a profile crops its pages ('' without one): part of render keys. */
const ckMemo = new WeakMap();
export function cropKey(P) {
  if (!P) return '';
  let c = ckMemo.get(P);
  if (c == null) {
    const s = JSON.stringify([P.gen, P.crop?.groups, (P.pages || []).map((p) => (p.blank ? 0 : p.cg === 'own' ? p.crop : p.cg))]);
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    c = 'p' + h.toString(36);
    ckMemo.set(P, c);
  }
  return c;
}
/** The box to show page k (object {x0, y0, x1, y1}), or null for a blank page or no profile. */
export const cropOf = (P, k, pad = state.cropPad ?? core.DEFAULT_PAD) => core.cropOf(P, k, pad);
/** Shown width / height of page k, crop applied when the reader crops. */
export const pageAspect = (P, k, pad = state.cropPad ?? core.DEFAULT_PAD) => core.pageAspect(P, k, pad, state.crop !== false);
/** Width / height pages of this item take on screen (the body box when cropping). */
export const itemAspect = (P) => (P ? (state.crop !== false ? P.aspect?.body : P.aspect?.page) || null : null);

function recOf(P, size, kj) {
  const A = P?.assets; if (!A) return null;
  return size === 'sprite' ? A.sprite?.sheets?.find((s) => s.j === kj) || null : A[size]?.[kj] || null;
}
/** URL of a stored asset (display or thumb page k, sprite sheet j), versioned so the browser caches it for good; null if there is none. */
export function assetUrl(P, size, kj) {
  const r = recOf(P, size, kj);
  return r ? `/profile/asset?id=${enc(P.id)}&size=${size}&${size === 'sprite' ? 'j' : 'k'}=${kj}&v=${r.v}` : null;
}
/** The display image record of page k, when it can stand in for a pdf.js render at full height H. */
export function displayFor(P, k, H) {
  if (!state.useAssets || state.crop === false) return null;
  const d = P?.assets?.display?.[k];
  if (!d || d.H < 0.9 * H) return null;
  const c = cropOf(P, k);
  if (!c) return null;
  const e = 2e-3;
  return d.box[0] <= c.x0 + e && d.box[1] <= c.y0 + e && d.box[2] >= c.x1 - e && d.box[3] >= c.y1 - e ? d : null;
}
/** Drop a record whose file has gone (404): fall back to rendering from then on. */
export function assetMissing(P, size, kj) {
  if (size === 'sprite') { if (P?.assets) P.assets.sprite = null; } else if (P?.assets?.[size]) delete P.assets[size][kj];
}
/** CSS for page k's sprite cell shown `displayHeight` px tall: {backgroundImage, backgroundSize, backgroundPosition} or null. */
export function spriteCell(P, k, displayHeight) {
  const S = state.useAssets !== false && P?.assets?.sprite;
  if (!S || !(k >= 0 && k < P.n)) return null;
  const j = Math.floor(k / S.per), i = k % S.per;
  const sheet = S.sheets.find((x) => x.j === j);
  if (!sheet) return null;
  const s = displayHeight / S.ch;
  const x = (i % S.cols) * S.cw, y = Math.floor(i / S.cols) * S.ch;
  return {
    backgroundImage: `url("${assetUrl(P, 'sprite', j)}")`,
    backgroundSize: `${(sheet.w * s).toFixed(2)}px ${(sheet.h * s).toFixed(2)}px`,
    backgroundPosition: `${(-x * s).toFixed(2)}px ${(-y * s).toFixed(2)}px`,
    backgroundRepeat: 'no-repeat',
  };
}
/** Width / height of a sprite cell (cells are uniform; pages are letterboxed in them). */
export const spriteAspect = (P) => (state.useAssets !== false && P?.assets?.sprite ? P.assets.sprite.cw / P.assets.sprite.ch : null);
/** Preload the item's sprite sheets (10-50 KB for a paper) so scrubbing never waits. */
const preloaded = new Set();
export function preloadSprite(P) {
  for (const s of P?.assets?.sprite?.sheets || []) {
    const u = assetUrl(P, 'sprite', s.j);
    if (preloaded.has(u)) continue;
    preloaded.add(u);
    const im = new Image(); im.decoding = 'async'; im.src = u;
  }
}
