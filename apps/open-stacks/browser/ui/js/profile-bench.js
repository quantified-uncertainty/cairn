// The profile benchmark (docs/profiles/spec.md, section 11.1): how fast item
// switches, page turns and track scrubbing are with no profile, with a profile
// but no stored images (useAssets off), and with display images and sprites.
// Open the app with ?bench=profile to run it in your own browser (it prints a
// table to the console and keeps the numbers in window.__profileBench), or
// call bench() from a test (test/profile-bench.mjs does, in headless Chromium).
//
// Latencies run from the action (go, turn, a pointer move on the track) to
// 'spread:rendered' (scrubbing: to a page image on screen), with the browser's
// memory caches dropped between trials (dropRenders, dropDocs) and the
// server's disk cache warm.
import { items, byId } from './corpus.js';
import { state } from './state.js';
import { on } from './util.js';
import { go, turn } from './nav.js';
import { dropRenders } from './render.js';
import { dropDocs } from './docs.js';
import { schedBusy } from './prefetch.js';
import { scrubStats } from './feed.js';
import { loadProfile, profileOf } from './profile.js';

export const DEFAULT_IDS = ['arxiv:1706.03762', 'arxiv:2212.08073', 'arxiv:2304.06528', 'arxiv:2504.01849', 'arxiv:1606.06565', 'ia:mathematicalwrin00jonerich', 'ia:treatiseonstabil00routuoft'];
export const CONFIGS = { none: { useProfiles: false, useAssets: false }, profile: { useProfiles: true, useAssets: false }, assets: { useProfiles: true, useAssets: true } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
export const pct = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))] * 10) / 10; };
const setCfg = (c) => { state.useProfiles = c.useProfiles; state.useAssets = c.useAssets; };
/** Wait until no prepared-ahead work is queued or running (at most `max` ms), then `ms` more. */
async function quiet(ms = 250, max = 8000) { const t = performance.now(); while (schedBusy() > 0 && performance.now() - t < max) await sleep(25); await sleep(ms); }
let rendered = null;
on('spread:rendered', (d) => { rendered?.(d); });
const waitRendered = (id, timeout = 30000) => new Promise((res) => {
  const t = setTimeout(() => { rendered = null; res(null); }, timeout);
  rendered = (d) => { if (d.it.id === id) { clearTimeout(t); rendered = null; res(performance.now()); } };
});
/** Go to item `id` at page `s` (as a jump from where you are); ms to its first spread. */
async function goTo(id, s) {
  const i = byId.get(id);
  state.order.splice(state.pos + 1, 0, i);
  state.start.set(i, s); state.hist.set(i, []); state.zoom = false;
  const p = waitRendered(id);
  const t0 = performance.now();
  go(state.pos + 1);
  const t1 = await p;
  return t1 == null ? null : t1 - t0;
}
const startPage = (it) => (it.kind === 'scan' ? Math.min(40, Math.floor((it.n || 100) / 4)) : 0);

/** P1: switching to an item whose document is not open in the browser (one trial). */
async function coldSwitch(id) {
  const it = items[byId.get(id)];
  dropRenders(); dropDocs(); await quiet(150);
  const ms = await goTo(id, startPage(it));
  await sleep(350);
  return ms;
}
/** P2 (warm: pages prepared ahead) and P3 (cold: renders dropped before each turn): `count` turns. */
async function turns(id, count, cold) {
  const it = items[byId.get(id)];
  await goTo(id, startPage(it)); await quiet(400);
  const out = [];
  let dir = 1;
  for (let t = 0; t < count; t++) {
    if (cold) { await quiet(50); dropRenders(); } else await quiet(120);
    const p = waitRendered(id, 15000);
    const t0 = performance.now();
    if (!turn(dir)) { dir = -dir; continue; }
    const t1 = await p; if (t1 != null) out.push(t1 - t0);
    dir = -dir; // back and forth between two spreads
  }
  return out;
}
/** P4: pointer moves along the track (renders dropped first); ms until every page on the stage shows something. */
async function scrub(id, moves = 20) {
  const it = items[byId.get(id)];
  await goTo(id, startPage(it)); await quiet(600);
  const track = document.getElementById('track'), spread = document.getElementById('spread');
  const r = track.getBoundingClientRect(), n = it.n || 1;
  // P10: hovering the pages already on screen draws nothing new.
  const s = state.start.get(byId.get(id)) ?? 0;
  scrubStats.quick = 0;
  track.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
  track.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + ((s + 0.5) / n) * r.width, clientY: r.top + r.height / 2, bubbles: true }));
  await sleep(400);
  const sameQuick = scrubStats.quick;
  dropRenders(); scrubStats.drop?.();
  const out = [];
  for (let j = 0; j < moves; j++) {
    const k = Math.floor((((j + 1) * 7919) % 1000) / 1000 * n);
    const t0 = performance.now();
    track.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + ((k + 0.5) / n) * r.width, clientY: r.top + r.height / 2, bubbles: true }));
    const shown = () => [...spread.children].every((el) => (el.style.backgroundImage && el.style.backgroundImage !== 'none') || el.querySelector(':scope > canvas, :scope > img'));
    while (!shown() && performance.now() - t0 < 3000) await sleep(2);
    await frame();
    out.push(performance.now() - t0);
    await sleep(70); // a hand moving along the bar
  }
  const moving = scrubStats.quick - sameQuick;
  track.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
  await sleep(300);
  return { times: out, quickOnSame: sameQuick, quickWhileMoving: moving };
}

/** Make sure the items have profiles with a sprite and display images (compiles them if needed). */
export async function prepare(ids, { all = true } = {}) {
  for (const id of ids) {
    const it = items[byId.get(id)]; if (!it) continue;
    const P = await loadProfile(it, { force: true });
    const need = !P || !P.assets?.sprite || (it.kind === 'pdf' && !Object.keys(P.assets?.display || {}).length);
    if (need && window.__stacksCompile) await window.__stacksCompile(id, { assets: 'full', all });
    await loadProfile(it, { force: true });
  }
}

export async function bench({ ids = DEFAULT_IDS, trials = 20, configs = Object.keys(CONFIGS), parts = ['switch', 'turnWarm', 'turnCold', 'scrub'], rounds = 4, log = true } = {}) {
  // Configurations are interleaved (trial by trial, or round by round), so a busy
  // machine slows them alike.
  const res = [];
  const keep = { useProfiles: state.useProfiles, useAssets: state.useAssets };
  for (const id of ids) {
    const it = items[byId.get(id)];
    if (!it) continue;
    const acc = Object.fromEntries(configs.map((c) => [c, { switch: [], turnWarm: [], turnCold: [], scrub: [], quickOnSame: 0, quickMoving: 0, per: null }]));
    if (parts.includes('switch')) for (let t = 0; t < trials; t++) for (const c of configs) { setCfg(CONFIGS[c]); const ms = await coldSwitch(id); if (ms != null) acc[c].switch.push(ms); acc[c].per = state.shown; }
    const per = Math.max(1, Math.ceil(trials / rounds));
    for (let r = 0; r < rounds; r++) {
      for (const c of configs) {
        setCfg(CONFIGS[c]);
        if (parts.includes('turnWarm')) acc[c].turnWarm.push(...await turns(id, per, false));
        if (parts.includes('turnCold')) acc[c].turnCold.push(...await turns(id, per, true));
        if (parts.includes('scrub')) { const x = await scrub(id, per); acc[c].scrub.push(...x.times); acc[c].quickOnSame += x.quickOnSame; acc[c].quickMoving += x.quickWhileMoving; }
      }
    }
    for (const c of configs) {
      const a = acc[c];
      const row = { id, kind: it.kind, cfg: c, n: it.n || profileOf(it)?.n || null, shown: a.per };
      if (a.switch.length) { row.switchP50 = pct(a.switch, 0.5); row.switchP90 = pct(a.switch, 0.9); }
      if (a.turnWarm.length) { row.turnWarmP50 = pct(a.turnWarm, 0.5); row.turnWarmP90 = pct(a.turnWarm, 0.9); }
      if (a.turnCold.length) { row.turnColdP50 = pct(a.turnCold, 0.5); row.turnColdP90 = pct(a.turnCold, 0.9); }
      if (a.scrub.length) { row.scrubP50 = pct(a.scrub, 0.5); row.scrubP95 = pct(a.scrub, 0.95); row.quickOnSame = a.quickOnSame; row.quickMoving = a.quickMoving; }
      res.push(row);
      if (log) console.log('bench', JSON.stringify(row));
    }
  }
  setCfg(keep);
  window.__profileBench = res;
  if (log) console.table(res);
  return res;
}

/** ?bench=profile: prepare, then run with the defaults, a few seconds after boot. */
export async function run() {
  await sleep(4000);
  const q = new URL(location.href).searchParams;
  const ids = (q.get('ids') || '').split(',').filter(Boolean);
  const list = ids.length ? ids : DEFAULT_IDS.filter((id) => byId.has(id));
  console.log('profile bench: preparing', list);
  await prepare(list);
  return bench({ ids: list, trials: Number(q.get('trials')) || 20 });
}
