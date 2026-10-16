// Reading guides: the augmentation layer of a compiled document
// (docs/profiles/spec.md, sections 8 and 9.6; server: server/augment.mjs).
//
// After 15 s on an item (augDelay; or "make now" in the panel), the server asks
// Claude for a reading guide and streams it here. It adds:
// - panel sections: "Reading guide" (the skim path, skip ranges, display hints
//   with an apply link, the hook), "Sections" (a section map with one line
//   each, lit for the pages on screen; it replaces the built-in outline while
//   it shows) and "Glossary";
// - margin notes: a small mark in a page's outer margin beside a sentence a
//   careful reader would want explained, and one beside each explained figure;
//   hover or focus shows the note, click lights the sentence. Placed only after
//   the spread settles, never during a turn;
// - skim mode (T, off by default): Advance goes to the next stop of the skim
//   path instead of the next spread, then on to the next item; Back undoes a
//   step as usual (features/back.js). The head shows "stop 3/6 · p. 12";
// - marks on the track: section boundaries as ticks, stops as small
//   triangles, skip ranges hatched (feed.js registerTrackLayer).
// Everything here is AI-generated and labelled so. Quotes were checked on the
// server; notes whose quote was not found never arrive.
//
// Store keys: augAuto (true), augDelay (15000), augmodel (Haiku), skim (false),
// notes (true). Emits 'augment:updated' {id, aug} and 'nav' {type: 'tour', i, it, k}.
import { $, h, on, emit, store, toast, sleep, keymap, registerKey, registerSection, registerStepper } from '../util.js';
import { items, LANES } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, isFlow } from '../docs.js';
import * as feed from '../feed.js';
import { before, go } from '../nav.js';
import { live, vpToCol, flowRange } from '../flow.js';
import { currentWords, highlight } from '../text.js';
import { findSpan, MODELS } from '../summary.js';

// The profile module (ui/js/profile.js) is optional: figure boxes, snapped spreads, profile text.
let prof = null;
import('../profile.js').then((m) => { prof = m; }).catch(() => {});
const profileOf = (it) => { try { return prof?.profileOf?.(it) || null; } catch { return null; } };

const S = {
  get auto() { return store.get('augAuto', true); },
  get delay() { return Math.max(0, Number(store.get('augDelay', 15000)) || 0); },
  get model() { return store.get('augmodel', null) || 'claude-haiku-5-5'; },
  get skim() { return !!store.get('skim', false); },
  get notes() { return store.get('notes', true) !== false; },
};
const short = (m = '') => (MODELS.find(([id]) => m.startsWith(id))?.[1] || m) + (m.includes('(mock)') ? ' (mock)' : '');
const cents = (c) => (c == null ? '' : c < 0.01 ? '<1¢' : c < 1 ? Math.round(c * 100) + '¢' : '$' + c.toFixed(2));
const enc = encodeURIComponent;
const K = (id) => id + '|' + S.model;
const augs = new Map();     // `${id}|${model}` -> final guide, or {error, code}
const partials = new Map(); // `${id}|${model}` -> the guide so far, while it streams
const inflight = new Map(); // `${id}|${model}` -> promise
const phase = new Map();    // `${id}|${model}` -> 'text' | 'model'
let dwellT = null, countdown = null, spend = null;
const here = (it) => items[current()]?.id === it.id;

/** The final guide for an item (chosen model), or null. */
export function augOf(it) { const a = it && augs.get(K(it.id)); return a && !a.error ? a : null; }
/** The skim path's stops [{k, why, kind, quote?}], in page order; for a later tour.js too. */
export const skimStops = (it) => augOf(it)?.plan || [];

// ---------- loading ----------
on('status', (s) => { if (s?.spend) spend = s.spend; });
on('item:shown', ({ it }) => { clearTimeout(dwellT); countdown = null; restoreApplied(it); closePop(); });
on('item:settled', ({ i, it }) => { if (i === current() && state.view === 'feed') load(it); });
async function load(it) {
  clearTimeout(dwellT); countdown = null;
  const k = K(it.id);
  if (augs.has(k) || inflight.has(k)) { refresh(it); return; }
  let a = null, running = false;
  try {
    const r = await fetch(`/augment?id=${enc(it.id)}&model=${enc(S.model)}`);
    if (r.ok) { a = await r.json(); running = r.headers.get('X-Augment-Running') === '1'; }
  } catch { /* offline */ }
  if (!here(it) || augs.has(k) || inflight.has(k)) return;
  if (a) return setAug(it, a);
  if (running && await joinRunning(it)) return; // being written elsewhere (another tab, a reload mid-stream)
  if (!here(it) || augs.has(k) || inflight.has(k)) return;
  if (state.status.summariesEnabled === false || !S.auto || it.private || (spend && spend.today >= spend.budget)) return paintGuide(it); // private: your own files, only on request
  countdown = { id: it.id, at: Date.now(), ms: S.delay };
  paintGuide(it);
  textFor(it).catch(() => {}); // extract in idle time during the countdown, so the request goes out at once
  dwellT = setTimeout(() => { countdown = null; if (here(it) && !augOf(it)) makeAug(it); }, S.delay);
}
/** Attach to a guide being written for this item already; true if there was one. */
async function joinRunning(it) {
  const k = K(it.id);
  let r; try { r = await fetch(`/augment/stream?id=${enc(it.id)}&model=${enc(S.model)}`); } catch { return false; }
  if (!r.ok) return false;
  const run = consume(it, k, r).finally(() => { inflight.delete(k); phase.delete(k); });
  inflight.set(k, run); phase.set(k, 'model');
  await run;
  return true;
}
async function* ndjson(r) {
  const rd = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { value, done } = await rd.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    for (let nl; (nl = buf.indexOf('\n')) >= 0;) { const line = buf.slice(0, nl); buf = buf.slice(nl + 1); if (line.trim()) yield JSON.parse(line); }
  }
  if (buf.trim()) yield JSON.parse(buf);
}
async function consume(it, k, r) {
  let out = null;
  for await (const msg of ndjson(r)) {
    if (msg.type === 'partial') { partials.set(k, msg.aug); schedule(it); }
    else if (msg.type === 'final') { out = msg.aug; if (msg.spend) spend = msg.spend; }
    else if (msg.type === 'error') {
      out = { error: ['no_key', 'no_sdk', 'budget', 'refusal', 'no_text'].includes(msg.code) ? msg.error : 'Reading guide failed: ' + msg.error, code: msg.code };
      if (msg.spend) spend = msg.spend;
    }
  }
  out ||= { error: 'Reading guide failed: the stream ended early', code: 'error' };
  partials.delete(k);
  setAug(it, out);
  return out;
}

/** Write a guide for an item now (force: again). */
export function makeAug(it, { force = false } = {}) {
  const k = K(it.id);
  if (inflight.has(k)) return inflight.get(k);
  clearTimeout(dwellT); countdown = null;
  if (force) { augs.delete(k); repaintAll(it); }
  const run = (async () => {
    phase.set(k, 'text'); schedule(it);
    try {
      const text = await textFor(it).catch(() => null); // without it, the server looks for text itself
      phase.set(k, 'model'); schedule(it);
      const body = { id: it.id, title: it.t, authors: it.a, year: it.y, lane: LANES[it.lane], laneId: it.lane, kind: it.kind, n: it.n, model: S.model, force, ...(text && { text }) };
      const r = await fetch('/augment', { method: 'POST', body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP ' + r.status);
      return await consume(it, k, r);
    } catch (e) {
      const out = { error: 'Reading guide failed: ' + e.message, code: 'error' };
      setAug(it, out); return out;
    }
  })().finally(() => { inflight.delete(k); phase.delete(k); });
  inflight.set(k, run);
  return run;
}

function setAug(it, a) {
  const k = K(it.id);
  augs.set(k, a); partials.delete(k);
  while (augs.size > 300) augs.delete(augs.keys().next().value);
  if (!a.error) emit('augment:updated', { id: it.id, aug: a });
  repaintAll(it);
}
function repaintAll(it) {
  if (!here(it)) return;
  refresh(it);
  repaintTrack();
  paintNotesSoon();
}
function refresh(it) { paintGuide(it); paintSections(it); paintGlossary(it); paintBadge(); }
const queued = new Set();
function schedule(it) {
  if (queued.has(it.id)) return;
  queued.add(it.id);
  requestAnimationFrame(() => { queued.delete(it.id); if (here(it)) refresh(it); });
}

// ---------- the text the model reads ----------
// The server reads a profile's text, a scan's OCR, or the cached file itself;
// the browser sends text only for PDFs and posts it already has open and that
// have no profile text: every page of a PDF (up to 300), one page per idle slice.
const texts = new Map(); // id -> Promise<string|null>
let lastNav = 0;
on('nav', () => { lastNav = performance.now(); clearNotes(); });
on('item:skim', clearNotes);
/** Any move (a turn, a page, an item, a jump) takes the margin notes away at once: on a post they sit
 *  in the text, which does not move with the turn, and were only replaced when the spread settled,
 *  a second or two later. They come back for the new pages on 'spread:settled'. */
function clearNotes() {
  notesGen++; pending.clear(); clearTimeout(notesT); closePop();
  for (const m of document.querySelectorAll('.aug-mk')) m.remove();
}
const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 40)));
function textFor(it) {
  if (it.kind === 'scan' || profileOf(it)?.assets?.text) return Promise.resolve(null);
  if (!texts.has(it.id)) {
    const p = extract(it).catch((e) => { texts.delete(it.id); throw e; });
    texts.set(it.id, p);
    while (texts.size > 4) texts.delete(texts.keys().next().value);
  }
  return texts.get(it.id);
}
async function extract(it) {
  const d = await openDoc(it);
  if (d.flow) return d.texts.map((t, k) => `[p. ${k + 1}] ${t}`).join('\n');
  if (!d.pdf) return null;
  const parts = [];
  for (let k = 0; k < Math.min(d.n, 300); k++) {
    // Yield to reading: wait for idle time, and for turns and item changes to settle.
    do { await idle(); if (performance.now() - lastNav < 600) await sleep(300); } while (performance.now() - lastNav < 600);
    if (!here(it) && !inflight.has(K(it.id))) throw new Error('moved on');
    const tc = await (await d.pdf.getPage(k + 1)).getTextContent();
    parts.push(`[p. ${k + 1}] ` + tc.items.map((x) => x.str).join(' ').replace(/\s+/g, ' ').trim());
  }
  return parts.join('\n');
}

// ---------- moving: stops, sections, glossary terms ----------
const perNow = () => Math.max(1, state.zoom ? 1 : state.shown || state.per);
/** The spread (state.start units) that shows page or stable page k. */
function startFor(it, k) {
  if (isFlow(it)) return live?.id === it.id ? vpToCol(k) : null;
  const per = perNow(); const P = profileOf(it);
  if (P && prof?.snapStart) { try { return prof.snapStart(P, k, per); } catch { /* fall through */ } }
  return Math.max(0, Math.min(k, (it.n || k + 1) - per));
}
/** Go to page k of the current item, recorded for Back, keeping the turn history (unlike goPage). */
function moveTo(it, k, label, quote) {
  const i = current(); if (items[i]?.id !== it.id) return false;
  const s = startFor(it, k); if (s == null) return false;
  before(label);
  state.start.set(i, s);
  feed.showFeed();
  emit('nav', { type: 'tour', i, it, k });
  if (quote) lightQuote(it, k, quote);
  return true;
}
/** The last page (stable page, for posts) on screen. */
function spreadEnd(i, it) {
  const s = state.start.get(i) ?? 0;
  if (isFlow(it)) return live?.id === it.id ? flowRange(s)[1] : -1;
  return s + perNow() - 1;
}

// Skim mode: Advance follows the skim path.
registerStepper((dir, e) => {
  if (dir < 0 || !S.skim || state.view !== 'feed') return false;
  const i = current(); const it = items[i]; if (!it) return false;
  const stops = skimStops(it); if (!stops.length) return false;
  if (isFlow(it) ? live?.id !== it.id : !it.n) return false; // still opening
  const end = spreadEnd(i, it);
  const next = stops.find((st) => st.k > end);
  if (next) return moveTo(it, next.k, 'skim stop', next.quote);
  if (e?.repeat || e?.fresh === false) return true; // a held key or the rest of a stroke stays on the last stop
  return go(state.pos + 1);
}, 30);
function toggleSkim() {
  store.set('skim', !S.skim);
  if (S.skim) toast('Skim path on', { icon: 'route', kind: 'mode', sub: 'Space: next stop of the reading guide' });
  else toast('Skim path off', { icon: 'route', kind: 'mode', sub: 'Space turns pages' });
  const it = items[current()]; if (it) { paintGuide(it); paintBadge(); }
}
if (keymap.has('T')) console.warn('augment: T is taken; the skim path toggle has no key');
else registerKey('T', toggleSkim, { help: ['T', 'skim path: Space follows the reading guide (on / off)'], order: 32 });
on('boot', () => { if (keymap.get('T') && keymap.get('T').fn !== toggleSkim) console.warn('augment: another feature took T; the skim path toggle is in the panel only'); });

// "stop 3/6 · p. 12" in the head while skim mode is on.
function paintBadge() {
  const head = $('#item-head'); if (!head) return;
  let b = head.querySelector('.aug-skim');
  const i = current(); const it = items[i];
  const stops = it ? skimStops(it) : [];
  if (!S.skim || !stops.length || state.view !== 'feed') { b?.remove(); return; }
  const s = state.start.get(i) ?? 0, end = spreadEnd(i, it);
  const lo = isFlow(it) ? (live?.id === it.id ? flowRange(s)[0] : 0) : s;
  const on = stops.findIndex((st) => st.k >= lo && st.k <= end);
  const done = stops.filter((st) => st.k <= end).length;
  const nx = stops.find((st) => st.k > end);
  const text = on >= 0 ? `stop ${on + 1}/${stops.length} · p. ${stops[on].k + 1}` : `${done}/${stops.length} stops · ${nx ? 'next p. ' + (nx.k + 1) : 'last passed'}`;
  if (!b) b = h('span', { className: 'aug-skim', title: 'Skim path: Advance goes to the next stop of the reading guide (T turns it off)' });
  b.textContent = 'skim · ' + text;
  const pos = head.querySelector('#pos');
  if (b.nextSibling !== pos || !b.isConnected) head.insertBefore(b, pos);
}
on('spread:rendered', () => { if (S.skim) paintBadge(); });

// ---------- panel: Reading guide ----------
const pageLink = (k) => h('span', { className: 'pl', textContent: 'p. ' + (k + 1) });
const KIND = { start: 'start', claim: 'claim', method: 'method', result: 'result', figure: 'figure', limit: 'limit', conclusion: 'end', example: 'example', definition: 'term' };
registerSection({
  id: 'guide', title: 'Reading guide', order: 25,
  render(it) { queueMicrotask(() => paintGuide(it)); return h('div', { className: 'aug-guide', id: 'aug-guide' }); },
});
function paintGuide(it) {
  const box = $('#aug-guide'); if (!box || state.panelItem !== it.id) return;
  const k = K(it.id);
  const a = augs.get(k) || partials.get(k);
  const msg = (parts, cls = '') => box.replaceChildren(h('div', { className: 'sum-state ' + cls }, ...[].concat(parts)));
  const makeBtn = (label) => h('button', { className: 'ghost aug-make', textContent: label, onclick: () => makeAug(it, { force: !!augs.get(k) }) });
  if (a && !a.error) return box.replaceChildren(guideView(it, a, !augs.has(k)));
  if (a?.error) return msg([a.error, a.code === 'budget' || a.code === 'no_text' ? null : makeBtn('try again')], a.code === 'budget' ? 'budget' : 'err');
  if (inflight.has(k)) return msg([phase.get(k) === 'text' ? 'Reading the text…' : `Writing a reading guide with ${short(S.model)}…`, h('span', { className: 'bar' })], 'working');
  if (state.status.summariesEnabled === false) return msg('Reading guides are off. Start the server with ANTHROPIC_API_KEY set, or with STACKS_MOCK_AI=1 to try the interface.');
  if (spend && spend.today >= spend.budget) return msg(`Daily AI budget reached ($${spend.today.toFixed(2)} of $${spend.budget}). Raise it in Settings (⌘, or Ctrl+,) for reading guides.`, 'budget');
  if (countdown?.id === it.id) {
    const left = Math.max(0, countdown.ms - (Date.now() - countdown.at));
    const bar = h('span', { className: 'bar' }); bar.style.setProperty('--aug-t', left + 'ms');
    return msg([`Reading guide in ${Math.ceil(left / 1000)} s if you stay`, bar, makeBtn('now')], 'countdown');
  }
  if (!S.auto || it.private) return msg([it.private ? 'Your own file: a guide is written (by Claude) only when you ask.' : `Reading guides are made on request.`, makeBtn('make one')]);
  box.replaceChildren();
}
function guideView(it, a, streaming) {
  const stops = a.plan || [];
  const i = current();
  const end = here(it) ? spreadEnd(i, it) : -1, lo = here(it) ? (isFlow(it) ? (live?.id === it.id ? flowRange(state.start.get(i) ?? 0)[0] : 0) : state.start.get(i) ?? 0) : -1;
  const ai = (a.model || '').includes('(mock)') ? 'Mock output' : 'AI-generated';
  return h('div', { className: 'aug' + (streaming ? ' streaming' : '') },
    !it.hook && a.hook ? h('div', { className: 'aug-hook', textContent: a.hook }) : null,
    h('div', { className: 'aug-line' },
      a.minutes ? h('span', { textContent: `${a.minutes} min skim` }) : null,
      stops.length ? h('span', { textContent: `${stops.length} stop${stops.length > 1 ? 's' : ''}` }) : null,
      stops.length && !streaming ? h('button', {
        className: 'aug-skimbtn' + (S.skim ? ' on' : ''), title: 'Skim path: Advance (Space) goes to the next stop, then the next item (T)',
        textContent: S.skim ? 'skim path on' : 'follow with Space', onclick: toggleSkim,
      }) : null,
      a.notes?.length && !streaming ? h('button', {
        className: 'aug-notesbtn' + (S.notes ? ' on' : ''), title: 'Margin notes on the pages: hover a † for the note, click it to light the sentence',
        textContent: `${a.notes.length} margin note${a.notes.length > 1 ? 's' : ''}${S.notes ? '' : ' (off)'}`,
        onclick: () => { store.set('notes', !S.notes); paintGuide(it); paintNotesSoon(); },
      }) : null),
    stops.length ? h('ol', { className: 'aug-plan' }, ...stops.map((st) => {
      const li = h('li', {
        className: 'st' + (st.k >= lo && st.k <= end ? ' cur' : ''), title: st.quote ? `“${st.quote}”` : `Go to p. ${st.k + 1}`,
        onclick: () => moveTo(it, st.k, 'reading guide stop', st.quote),
      }, pageLink(st.k), h('span', { className: 'kd', textContent: KIND[st.kind] || st.kind }), h('span', { className: 'why', textContent: st.why }));
      li.dataset.k = st.k;
      return li;
    })) : null,
    a.skip?.length ? h('div', { className: 'aug-skip' }, h('b', { textContent: 'Skip ' }), ...a.skip.flatMap((x, j) => [j ? ' · ' : null,
      h('span', { className: 'pl', textContent: x.a === x.b ? `p. ${x.a + 1}` : `pp. ${x.a + 1}–${x.b + 1}`, title: 'Go past it', onclick: () => moveTo(it, Math.min((it.n || x.b + 2) - 1, x.b + 1), 'skip ahead') }),
      x.why ? ` ${x.why}` : ''])) : null,
    hintsView(it, a),
    a.tags?.length ? h('div', { className: 'aug-tags' }, ...a.tags.map((t) => h('span', { textContent: t }))) : null,
    streaming ? null : h('div', { className: 'ai-note' },
      [`${ai} by ${short(a.model)}`, cents(a.cost), a.batch ? 'batch' : '', a.coverage < 1 ? `read ${Math.round(a.coverage * 100)}% of the text` : '', a.stale ? 'out of date' : '', a.truncated ? 'cut off' : '', 'may be wrong'].filter(Boolean).join(' · '),
      ' ', h('a', { href: '#', className: 'aug-redo', textContent: 'redo', title: 'Write the reading guide again (costs another call)', onclick: (e) => { e.preventDefault(); makeAug(it, { force: true }); } })));
}

// Display hints: what would help show this document, with an "apply" for this item.
const HINT_TEXT = {
  'one-up': 'one page at a time', 'two-up': 'two pages at a time', 'three-up': 'three pages at a time', 'split-columns': 'split two-column pages',
  'facing-pages': 'facing pages, as printed', 'skip-front': 'start after the front matter', landscape: 'landscape pages alone',
  'zoom-figures': 'zoom into the figures (z)', sequential: 'read in order', 'ocr-poor': 'poor text layer',
};
let applied = null; // { id, per, perAuto, cols, set: {per?, cols?} }: what "apply" changed, undone on the next item
function apply(it, code) {
  const i = current(); if (items[i]?.id !== it.id) return;
  const per = { 'one-up': 1, 'two-up': 2, 'three-up': 3, 'facing-pages': 2 }[code];
  if (!applied || applied.id !== it.id) applied = { id: it.id, per: state.per, perAuto: state.perAuto, cols: state.cols, set: {} };
  if (per) { state.perAuto = false; state.per = per; applied.set.per = per; }
  else if (code === 'split-columns') { state.cols = true; applied.set.cols = true; }
  else if (code === 'skip-front') { const b = profileOf(it)?.ranges?.body?.[0]; if (b != null) return moveTo(it, b, 'skip front matter'); }
  else if (code === 'sequential') { if (S.skim) toggleSkim(); return; }
  state.hist.set(i, []);
  feed.showFeed();
  toast('Applied for this item', { icon: 'wand-sparkles', kind: 'ok', sub: HINT_TEXT[code] });
}
function restoreApplied(it) {
  if (!applied || applied.id === it.id) return;
  // Put back what apply changed, unless the reader has changed it since.
  if (applied.set.per && state.per === applied.set.per && !state.perAuto) { state.per = applied.per; state.perAuto = applied.perAuto; }
  if (applied.set.cols && state.cols) state.cols = applied.cols;
  applied = null;
}
const APPLIES = new Set(['one-up', 'two-up', 'three-up', 'facing-pages', 'split-columns', 'skip-front', 'sequential']);
function hintsView(it, a) {
  if (!a.display?.length || isFlow(it)) return null;
  return h('ul', { className: 'aug-hints' }, ...a.display.map((d) => h('li', {},
    h('b', { textContent: HINT_TEXT[d.code] || d.code }), d.why ? ` ${d.why}` : '',
    APPLIES.has(d.code) && !(d.code === 'skip-front' && profileOf(it)?.ranges?.body?.[0] == null)
      ? h('a', { href: '#', className: 'aug-apply', textContent: 'apply', onclick: (e) => { e.preventDefault(); apply(it, d.code); } }) : null)));
}

// ---------- panel: Sections ----------
registerSection({
  id: 'sections', title: 'Sections', order: 31,
  render(it) { queueMicrotask(() => paintSections(it)); return h('ol', { className: 'aug-secs outline', id: 'aug-secs' }); },
});
function paintSections(it) {
  const box = $('#aug-secs'); if (!box || state.panelItem !== it.id) return;
  const k = K(it.id); const a = augs.get(k) || partials.get(k);
  const secs = a && !a.error ? a.sections || [] : [];
  const sec = document.getElementById('sec-sections');
  if (sec) sec.hidden = !secs.length;
  $('#panel')?.classList.toggle('has-aug-sections', secs.length > 0);
  const ai = a && !a.error && (a.model || '').includes('(mock)') ? 'mock' : 'AI';
  box.replaceChildren(...secs.map((s) => {
    const li = h('li', { style: `--d:${s.d}`, onclick: () => moveTo(it, s.k, 'section') },
      h('span', { className: 'st' }, h('span', { className: 'tt', textContent: s.t }), s.sum ? h('span', { className: 'sm', textContent: s.sum }) : null),
      h('span', { className: 'op', textContent: String(s.k + 1) }));
    li.dataset.page = s.k;
    return li;
  }), ...(secs.length ? [h('li', { className: 'aug-ai', textContent: `Section lines: ${ai}-written` })] : []));
  litSections();
}
/** Light the section and the stops on screen (after the spread settles: a few class changes). */
function litSections() {
  const i = current(); const it = items[i]; if (!it) return;
  const end = spreadEnd(i, it);
  const lo = isFlow(it) ? (flowHere(it) ? flowRange(state.start.get(i) ?? 0)[0] : 0) : state.start.get(i) ?? 0;
  let lit = null;
  for (const li of document.querySelectorAll('#aug-secs li[data-page]')) { li.classList.remove('cur'); if (Number(li.dataset.page) <= end) lit = li; }
  lit?.classList.add('cur');
  for (const li of document.querySelectorAll('#aug-guide .aug-plan li[data-k]')) { const k = Number(li.dataset.k); li.classList.toggle('cur', k >= lo && k <= end); }
}
on('spread:settled', litSections);

// ---------- panel: Glossary ----------
registerSection({
  id: 'glossary', title: 'Glossary', order: 36,
  render(it) { queueMicrotask(() => paintGlossary(it)); return h('dl', { className: 'aug-gloss', id: 'aug-gloss' }); },
});
function paintGlossary(it) {
  const box = $('#aug-gloss'); if (!box || state.panelItem !== it.id) return;
  const k = K(it.id); const a = augs.get(k) || partials.get(k);
  const gl = a && !a.error ? (a.glossary || []).filter((g) => g.term && g.def) : [];
  const sec = document.getElementById('sec-glossary');
  if (sec) sec.hidden = !gl.length;
  box.replaceChildren(...gl.flatMap((g) => [
    h('dt', { title: g.quote ? `Go to p. ${g.k + 1} and light the defining sentence` : `Go to p. ${g.k + 1}`, onclick: () => moveTo(it, g.k, 'glossary term', g.ok ? g.quote : null) }, g.term, ' ', pageLink(g.k)),
    h('dd', { textContent: g.def }),
  ]));
}

// ---------- lighting a quote on the page ----------
const flowHere = (it) => isFlow(it) && live?.id === it.id;
/** Words of the visible stretch of a post, with DOM ranges (cheaper than the whole document). */
function flowWords(vpLo, vpHi) {
  const words = [];
  for (const b of live.flow.querySelectorAll('[data-vp]')) {
    const vp = Number(b.dataset.vp); if (vp < vpLo || vp > vpHi) continue;
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('pre, script, style, sup') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) for (const m of n.data.matchAll(/\S+/g)) {
      const range = document.createRange(); range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      words.push({ text: m[0], page: vp, range });
    }
  }
  return words;
}
function lightWords(words, a, b) {
  const wa = words[a], wb = words[b];
  highlight('quote', []);
  if (wa.range && wb.range && globalThis.CSS?.highlights) {
    const r = document.createRange(); r.setStart(wa.range.startContainer, wa.range.startOffset); r.setEnd(wb.range.endContainer, wb.range.endOffset);
    CSS.highlights.set('quote', new Highlight(r));
  } else highlight('quote', words.slice(a, b + 1).filter((w) => w.el || w.range));
}
/** After a move, light the sentence once its page is drawn and has words (raster: the text layer). */
async function lightQuote(it, k, quote) {
  highlight('quote', []);
  for (const ms of [160, 300, 600, 1200, 2400]) {
    await sleep(ms);
    if (!here(it)) return;
    if (flowHere(it)) {
      const [lo, hi] = flowRange(state.start.get(current()) ?? 0);
      const ws = flowWords(Math.min(lo, k), Math.max(hi, k));
      const sp = findSpan(ws, quote, k); if (sp) { lightWords(ws, ...sp); return; }
      continue;
    }
    const ws = ((await currentWords().catch(() => null))?.words || []).filter((w) => w.el);
    const sp = ws.length ? findSpan(ws, quote, k) : null;
    if (sp) { lightWords(ws, ...sp); return; }
  }
}

// ---------- margin notes ----------
// Placed after the spread settles (never on a turn), from the words on screen:
// the text layer's word spans on PDFs and scans, the live text of posts.
let notesGen = 0, notesT = null;
const pending = new Map(); // k -> fn: pages whose text layer is not attached yet
function paintNotesSoon() { clearTimeout(notesT); notesT = setTimeout(paintNotes, 30); }
on('spread:settled', paintNotesSoon);
on('textlayer:ready', ({ it, k }) => { if (here(it) && pending.has(k)) pending.get(k)(); });
on('profile:updated', ({ id }) => { if (items[current()]?.id === id) paintNotesSoon(); });

async function paintNotes() {
  const gen = ++notesGen; pending.clear(); closePop();
  if (state.view !== 'feed') return;
  const i = current(); const it = items[i]; if (!it) return;
  const pages = [...document.querySelectorAll('#spread > .pg')];
  for (const el of pages) el.querySelectorAll('.aug-mk').forEach((x) => x.remove());
  const a = augOf(it);
  if (!S.notes || !a || (!a.notes?.length && !a.figs?.length)) return;
  if (isFlow(it)) return flowNotes(it, a, gen);
  const shown = pages.filter((el) => el.dataset.k != null && el._pnl?.canvas);
  const first = shown[0];
  const P = profileOf(it);
  const byK = new Map();
  for (const el of shown) { const k = Number(el.dataset.k); if (!byK.has(k)) byK.set(k, []); byK.get(k).push(el); }
  // Figure explanations: beside the figure's box, when the profile knows it.
  for (const f of a.figs || []) {
    const [k, j] = f.fid.split('.').map(Number);
    const b = P?.pages?.[k]?.fig?.[j]?.b; if (!b) continue;
    for (const el of byK.get(k) || []) {
      const box = el._pnl.box; if (!box || b[2] < box.x0 || b[0] > box.x1 || b[3] < box.y0 || b[1] > box.y1) continue;
      const y = ((Math.max(b[1], box.y0) - box.y0) / (box.y1 - box.y0)) * el.clientHeight;
      addMark(el, el === first, y, { kind: 'fig', k, title: f.what, body: f.look, label: `Figure · p. ${k + 1}` });
      break;
    }
  }
  const notes = (a.notes || []).filter((n) => byK.has(n.k));
  if (!notes.length) return;
  const r = await currentWords().catch(() => null);
  if (gen !== notesGen || !r?.words?.length) return;
  const words = r.words;
  const place = (k, tries = 0) => {
    if (gen !== notesGen) return;
    let waiting = false;
    for (const n of notes.filter((x) => x.k === k).slice(0, 4)) {
      const sp = findSpan(words, n.quote, k);
      if (!sp) continue;
      const w = words[sp[0]];
      if (w.page !== k) continue;
      const wel = w.el; if (!wel) { waiting = true; continue; }
      const el = wel.closest('#spread > .pg'); if (!el) continue;
      const pr = el.getBoundingClientRect(), wr = wel.getBoundingClientRect();
      addMark(el, el === first, wr.top - pr.top + wr.height / 2, { kind: 'note', k, title: n.note, quote: n.quote, words, span: sp, label: `Note · p. ${k + 1}` });
    }
    if (waiting && tries < 6) {
      // The text layer attaches a moment later: on its 'textlayer:ready', or the next try, whichever comes first.
      const again = () => { if (pending.get(k) === again) { pending.delete(k); place(k, tries + 1); } };
      pending.set(k, again);
      setTimeout(again, 200 * 2 ** tries);
    }
  };
  for (const k of byK.keys()) place(k);
}
function flowNotes(it, a, gen) {
  if (!flowHere(it)) return;
  const [lo, hi] = flowRange(state.start.get(current()) ?? 0);
  // Pages of a guide made from the cached HTML (a batch) are approximate: look a little wider.
  const slack = a.textSrc === 'html-approx' ? 3 : 1;
  const notes = (a.notes || []).filter((n) => n.k >= lo - slack && n.k <= hi + slack);
  if (!notes.length) return;
  const words = flowWords(lo - slack, hi + slack);
  const sheet = live.sheet, port = live.port;
  if (gen !== notesGen || !sheet.isConnected) return;
  const sr = sheet.getBoundingClientRect(), pr = port.getBoundingClientRect();
  const perCol = new Map();
  for (const n of notes.slice(0, 12)) {
    const sp = findSpan(words, n.quote, n.k); if (!sp) continue;
    const rect = words[sp[0]].range.getClientRects()[0]; if (!rect) continue;
    if (rect.left < pr.left - 2 || rect.left > pr.right) continue; // not in a visible column
    const col = Math.floor((rect.left - pr.left + 2) / live.g.pitch);
    if ((perCol.get(col) || 0) >= 4) continue;
    perCol.set(col, (perCol.get(col) || 0) + 1);
    const x = pr.left + col * live.g.pitch - sr.left - 15;
    addMark(sheet, true, rect.top - sr.top + rect.height / 2, { kind: 'note', k: n.k, title: n.note, quote: n.quote, words, span: sp, label: `Note · p. ${n.k + 1}` }, x);
  }
}
function addMark(el, left, y, info, x = null) {
  const H = el.clientHeight;
  y = Math.max(9, Math.min(H - 9, y));
  // Keep marks on the same page at least 18 px apart.
  const taken = [...el.querySelectorAll('.aug-mk')].map((m) => parseFloat(m.style.top));
  while (taken.some((t) => Math.abs(t - y) < 18) && y < H - 9) y += 18;
  const m = h('button', { type: 'button', className: 'aug-mk ' + info.kind + (left ? ' l' : ' r'), textContent: info.kind === 'fig' ? '◧' : '†', 'aria-label': `${info.label}: ${info.title}` });
  m.style.top = y + 'px';
  if (x != null) { m.style.left = Math.max(0, x) + 'px'; m.classList.remove('r'); m.classList.add('l', 'at'); }
  m._info = info;
  m.addEventListener('pointerenter', () => showPop(m));
  m.addEventListener('pointerleave', closePop);
  m.addEventListener('focus', () => showPop(m));
  m.addEventListener('blur', closePop);
  m.addEventListener('click', (e) => {
    e.stopPropagation(); // not a click on the page (zoom)
    const { words, span } = m._info;
    if (words && span) lightWords(words, ...span);
    showPop(m);
  });
  el.append(m);
}
let pop = null;
function showPop(m) {
  closePop();
  const { title, body, quote, label } = m._info;
  pop = h('div', { className: 'aug-pop', role: 'note' },
    h('div', { className: 'ap-h' }, h('span', { className: 'ap-ai', textContent: 'AI' }), label),
    h('div', { className: 'ap-t', textContent: title }),
    body ? h('div', { className: 'ap-b', textContent: body }) : null,
    quote ? h('div', { className: 'ap-q', textContent: `On “${quote.length > 110 ? quote.slice(0, 108) + '…' : quote}”` }) : null);
  document.body.append(pop);
  const r = m.getBoundingClientRect(), W = 290; // .aug-pop width (augment.css)
  const leftSide = m.classList.contains('l');
  let x = leftSide ? r.right + 8 : r.left - W - 8;
  x = Math.max(8, Math.min(innerWidth - W - 8, x));
  pop.style.left = x + 'px';
  const ph = pop.offsetHeight;
  pop.style.top = Math.max(8, Math.min(innerHeight - ph - 8, r.top - 10)) + 'px';
}
function closePop() { pop?.remove(); pop = null; }
on('spread:rendered', closePop);

// ---------- the track: sections, stops, skip ranges ----------
function paintLayer({ it, n, el }) {
  const a = augOf(it);
  const key = it.id + '|' + (a?.at || '') + '|' + n;
  if (el.dataset.for === key && (el.childElementCount || !a)) return; // painted already: nothing to do on a turn
  el.dataset.for = key;
  if (!a) { el.replaceChildren(); return; }
  const N = Math.max(1, n || a.n);
  const pct = (k) => Math.max(0, Math.min(100, (100 * k) / N)) + '%';
  el.replaceChildren(
    ...(a.skip || []).map((x) => h('i', { className: 'ag-skip', title: `Skip ${x.a === x.b ? 'p. ' + (x.a + 1) : `pp. ${x.a + 1}–${x.b + 1}`}: ${x.why}`, style: `left:${pct(x.a)};width:${(100 * (x.b - x.a + 1)) / N}%` })),
    ...(a.sections || []).filter((s) => s.k > 0).map((s) => h('i', { className: 'ag-sec d' + s.d, title: `${s.t} · p. ${s.k + 1}`, style: `left:${pct(s.k)}` })),
    ...(a.plan || []).map((st, j) => h('i', { className: 'ag-stop', title: `Stop ${j + 1}: p. ${st.k + 1} · ${st.why}`, style: `left:${pct(st.k + 0.5)}` })));
}
let fallbackEl = null; // without feed.js's hook: our own layer in the track
function repaintTrack() {
  if (typeof feed.repaintTrack === 'function' && typeof feed.registerTrackLayer === 'function') { feed.repaintTrack(); return; }
  const bar = $('#track .tr-bar'); const i = current(); const it = items[i];
  if (!bar || !it) return;
  if (!fallbackEl || !fallbackEl.isConnected) { fallbackEl = h('div', { className: 'tr-layer' }); fallbackEl.dataset.layer = 'augment'; bar.append(fallbackEl); }
  paintLayer({ i, it, n: it.n || augOf(it)?.n || 1, el: fallbackEl });
}
if (typeof feed.registerTrackLayer === 'function') feed.registerTrackLayer('augment', paintLayer);
else {
  on('item:shown', () => { if (fallbackEl) { fallbackEl.replaceChildren(); fallbackEl.dataset.for = ''; } });
  on('item:settled', () => repaintTrack());
}

// ---------- settings changes from elsewhere ----------
on('settings:changed', ({ key }) => {
  if (key === 'notes') paintNotesSoon();
  if (key === 'augmodel') { const it = items[current()]; if (it) load(it); }
});
