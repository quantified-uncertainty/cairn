// AI summaries: after 5 s on an item (or `a`; `A` regenerates), the server asks
// Claude for a structured summary of the text extracted here, with [p. N]
// page markers. The summary streams in as the model writes it. Fields depend
// on the shelf (papers, posts, textbooks, TTRPG manuals, oddities); each key
// point carries a verbatim quote the server checks against the text, and
// clicking a key point goes to its page and highlights the quoted sentence.
// Below it: "Ask about this item", the model picker and today's spend.
import { $, h, on, emit, registerSection, registerKey, store, sleep } from './util.js';
import { items, LANES } from './corpus.js';
import { state, current } from './state.js';
import { openDoc, isFlow, peekDoc } from './docs.js';
import { startOf } from './prefetch.js';
import { goPage } from './nav.js';
import { paintScrub } from './feed.js';
import { live, flowRange } from './flow.js';
import { currentWords, highlight, reveal } from './text.js';

export const MODELS = [['claude-haiku-5-5', 'Haiku'], ['claude-sonnet-5-5', 'Sonnet'], ['claude-opus-5-5', 'Opus'], ['claude-fable-5-1', 'Fable']];
/** The model chosen in the panel (localStorage), else the server's default. */
// Haiku is the default; a one-time reset moves earlier Opus choices to it.
if (!store.get('summodel:haiku-default', false)) { store.set('summodel', 'claude-haiku-5-5'); store.set('summodel:haiku-default', true); }
export const summaryModel = () => store.get('summodel', null) || state.status.model || 'claude-haiku-5-5';
const short = (m = '') => (MODELS.find(([id]) => m.startsWith(id))?.[1] || m) + (m.includes('(mock)') ? ' (mock)' : '');

export const summaries = new Map(); // id -> summary for the chosen model (other modules read this)
const done = new Map();     // `${id}|${model}` -> final summary, or {error, code}
const partials = new Map(); // `${id}|${model}` -> the summary so far, while it streams
const inflight = new Map(); // `${id}|${model}` -> promise
const phase = new Map();    // `${id}|${model}` -> 'text' while the text is extracted, then 'model'
const qas = new Map();      // id -> [{q, answer, model, cost, live?, error?}], newest first
const K = (id, m = summaryModel()) => id + '|' + m;
let dwellTimer = null;
let spend = null; // {today, budget, calls} from the server
let litQuote = null; // the key point whose quote is lit on the page

registerSection({
  id: 'summary', title: 'Summary', order: 20,
  render(it, i) {
    clearTimeout(dwellTimer);
    queueMicrotask(() => { paintSummary(it); load(it, i); });
    return h('div', { className: 'sum-sec' }, h('div', { id: 'sum' }), askBox(it, i), footer());
  },
});

/** Show the cached summary for the chosen model, or count down to making one. */
async function load(it, i) {
  const m = summaryModel(); const k = K(it.id, m);
  if (!done.has(k) && !inflight.has(k)) {
    let s = null;
    try { s = await (await fetch(`/summary?id=${encodeURIComponent(it.id)}&model=${encodeURIComponent(m)}`)).json(); } catch { /* offline */ }
    if (state.panelItem !== it.id || summaryModel() !== m) return;
    if (s) return setSummary(it, m, s);
    if (done.has(k) || inflight.has(k)) return; // arrived meanwhile
    if (state.status.summariesEnabled === false) return paintSummary(it);
    if (spend && spend.today >= spend.budget) return paintSummary(it, 'budget');
    if (!store.get('autoSum', true)) return paintSummary(it, 'manual'); // Settings: only on a
    if (it.private) return paintSummary(it, 'private'); // your own files (features/local.js): only when you ask
    paintSummary(it, 'countdown');
    textFor(it, isFlow(it) ? 0 : startOf(i)).catch(() => {}); // extract during the countdown, so the request goes out at once
    clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => { if (state.panelItem === it.id && summaryModel() === m) summarizeItem(i, true); }, store.get('sumDelay', 5000)); // Settings: the delay
    return;
  }
  const s = done.get(k);
  if (s && !s.error) { summaries.set(it.id, s); state.marks.set(it.id, pagesOf(s)); repaintStrip(it); }
  paintSummary(it);
}

const pagesOf = (s) => [...(s.key_points || []).map((k) => k?.page), ...(s.best_chapters || []).map((c) => c?.page), ...(s.steal || []).map((x) => x?.page), s.best_page?.page].filter(Boolean);
function repaintStrip(it) {
  const i = current(); if (items[i]?.id !== it.id) return;
  if (isFlow(it)) { if (live?.id === it.id) { const [a, b] = flowRange(state.start.get(i) ?? 0); paintScrub(i, a, b - a + 1); } }
  else paintScrub(i, startOf(i), state.shown || 1);
}

function setSummary(it, m, s) {
  done.set(K(it.id, m), s); partials.delete(K(it.id, m));
  if (m !== summaryModel()) return;
  if (!s.error) { summaries.set(it.id, s); state.marks.set(it.id, pagesOf(s)); }
  emit('summary:updated', { id: it.id, summary: s });
  if (state.panelItem === it.id) { paintSummary(it); repaintStrip(it); }
}

// ---- painting ----
const queued = new Set();
function schedulePaint(it) {
  if (queued.has(it.id)) return;
  queued.add(it.id);
  requestAnimationFrame(() => { queued.delete(it.id); paintSummary(it); paintQAs(it); });
}
const cents = (c) => (c == null ? '' : c < 0.01 ? '<1¢' : c < 1 ? Math.round(c * 100) + '¢' : '$' + c.toFixed(2));
const pageLink = (p) => (p ? h('span', { className: 'pl', textContent: 'p. ' + p, title: 'Go to page ' + p, onclick: (e) => { e.stopPropagation(); goPage(p - 1); } }) : null);

export function paintSummary(it, mode) {
  const box = $('#sum'); if (!box || state.panelItem !== it.id) return;
  const k = K(it.id);
  const s = done.get(k) || partials.get(k);
  if (s && !s.error) { box.replaceChildren(view(it, s, !done.has(k))); return; }
  const msg = (text, cls = '') => box.replaceChildren(h('div', { className: 'sum-state ' + cls }, ...[].concat(text)));
  if (s?.error) msg([s.error, h('span', { className: 'hint', textContent: s.code === 'budget' ? '' : 'A: try again' })], s.code === 'budget' ? 'budget' : 'err');
  else if (inflight.has(k) || mode === 'working') msg([phase.get(k) === 'text' ? 'Reading the text…' : `Summarizing with ${short(summaryModel())}…`, h('span', { className: 'bar' })], 'working');
  else if (state.status.summariesEnabled === false) msg('Summaries are off. Start the server with ANTHROPIC_API_KEY set (and run npm install once), or with STACKS_MOCK_AI=1 to try the interface.');
  else if (mode === 'budget') msg(`Daily AI budget reached ($${spend.today.toFixed(2)} of $${spend.budget}). Raise it in Settings (⌘, or Ctrl+,) to continue.`, 'budget');
  else if (mode === 'countdown') msg([`Summary in ${store.get('sumDelay', 5000) / 1000} s if you stay (a: now) · ${short(summaryModel())}`, h('span', { className: 'bar' })]);
  else if (mode === 'manual') msg(`a: summarize with ${short(summaryModel())} (automatic summaries are off in Settings)`);
  else if (mode === 'private') msg(`a: summarize with ${short(summaryModel())} (your own files are sent to Claude only when you ask; Settings › Local folders)`);
  else box.replaceChildren();
}

const VERDICTS = ['skip', 'skim', 'read', 'study'];
function view(it, s, streaming) {
  const kps = Array.isArray(s.key_points) ? s.key_points.filter((x) => x && x.point) : [];
  const ai = (s.model || '').includes('(mock)') ? 'Mock output' : 'AI-generated';
  return h('div', { className: 'sum' + (streaming ? ' streaming' : '') },
    VERDICTS.includes(s.verdict) ? h('div', { className: 'verdict' }, h('span', { className: 'pill ' + s.verdict, textContent: s.verdict }), s.minutes ? `${s.minutes} min` : '') : null,
    s.why_care ? h('div', { className: 'care', textContent: s.why_care }) : null,
    s.gist ? h('div', { className: 'gist', textContent: s.gist }) : null,
    facts(s),
    kps.length ? h('ul', { className: 'kps' }, ...kps.map((kp, j) => keyPoint(it, kp, streaming && j === kps.length - 1))) : null,
    s.this_spread ? h('div', { className: 'spread', textContent: 'On the pages first shown: ' + s.this_spread }) : null,
    streaming ? null : h('div', { className: 'ai-note', textContent: [`${ai} by ${short(s.model)}`, cents(s.cost), s.truncated ? 'cut off' : '', 'may be wrong'].filter(Boolean).join(' · ') }));
}

// Shelf-specific fields, as a small fact sheet (label | value).
const bullets = (xs) => (Array.isArray(xs) && xs.length ? h('ul', {}, ...xs.filter(Boolean).map((x) => h('li', { textContent: x }))) : null);
const withPages = (xs, body) => (Array.isArray(xs) && xs.length ? h('ul', { className: 'pg-list' }, ...xs.filter(Boolean).map((x) => h('li', {}, ...[].concat(body(x)), ' ', pageLink(x.page)))) : null);
const FACTS = {
  paper: (s) => [['Claim', s.claim], ['Method', s.method],
    ['Evidence', s.evidence?.why || s.evidence?.strength ? [s.evidence.strength ? h('span', { className: 'ev ' + s.evidence.strength, textContent: s.evidence.strength }) : null, ' ', s.evidence.why || ''] : null],
    ['Limits', bullets(s.limitations)]],
  post: (s) => [['Claim', s.claim], ['Against', s.counterpoint],
    ['Concepts', Array.isArray(s.concepts) && s.concepts.length ? h('ul', {}, ...s.concepts.filter((c) => c?.term).map((c) => h('li', {}, h('b', { textContent: c.term }), c.gloss ? ' ' + c.gloss : ''))) : null]],
  textbook: (s) => [['Teaches', s.teaches], ['Needs', Array.isArray(s.prerequisites) ? s.prerequisites.join(' · ') : null],
    ['Best', withPages(s.best_chapters, (c) => [h('b', { textContent: c.title || '' }), c.why ? ' ' + c.why : ''])]],
  ttrpg: (s) => [['Mechanic', s.mechanic], ['Ideas', bullets(s.ideas)], ['Steal', withPages(s.steal, (x) => x.what || '')]],
  oddity: (s) => [['What', s.what_it_is], ['Why now', s.why_now], ['Best page', s.best_page ? withPages([s.best_page], (x) => x.what || '') : null]],
};
function facts(s) {
  const rows = (FACTS[s.family] || (() => []))(s).filter(([, v]) => v != null && v !== '');
  if (!rows.length) return null;
  return h('dl', { className: 'facts' }, ...rows.flatMap(([l, v]) => [h('dt', { textContent: l }), h('dd', {}, ...[].concat(v))]));
}

function keyPoint(it, kp, writing) {
  const st = kp.quote_ok === true ? 'ok' : kp.quote_ok === false ? 'bad' : 'pend';
  const where = kp.page ? `p. ${kp.page}` : 'its page';
  const title = !kp.quote ? (kp.page ? `Go to ${where}` : '')
    : st === 'ok' ? `Found verbatim in the text. Click: go to ${where} and highlight it.`
      : st === 'bad' ? `Not found verbatim in the text: the model may have paraphrased or misquoted. Click: go to ${where}.`
        : 'Checking the quote…';
  return h('li', { className: 'kp ' + st + (writing ? ' writing' : '') + (litQuote && litQuote === it.id + '|' + kp.point ? ' on' : ''), title, onclick: (e) => { markLit(it, kp, e.currentTarget); jumpToQuote(it, kp); } },
    h('span', { className: 'pt', textContent: kp.point }), ' ', pageLink(kp.page),
    kp.quote ? h('div', { className: 'qt' }, h('span', { className: 'qm', textContent: st === 'ok' ? '✓' : st === 'bad' ? 'not in text' : '' }), kp.quote) : null);
}

function markLit(it, kp, li) {
  litQuote = it.id + '|' + kp.point;
  for (const x of document.querySelectorAll('#sum .kps li.on')) x.classList.remove('on');
  li.classList.add('on');
}

// ---- the footer: model, background toggle, spend ----
function footer() {
  const m = summaryModel();
  const opts = MODELS.some(([id]) => id === m) ? MODELS : [...MODELS, [m, m]];
  return h('div', { className: 'sum-foot' },
    h('select', { className: 'sum-model', title: 'Model for summaries and answers (Haiku cheapest, Fable most capable)', onchange: (e) => setModel(e.target.value) },
      ...opts.map(([id, label]) => h('option', { value: id, textContent: label, selected: id === m }))),
    h('label', { className: 'toggle', title: 'Also summarize the next two items in the background (stops near the daily budget)' },
      h('input', { type: 'checkbox', checked: state.presum, onchange: (e) => { state.presum = e.target.checked; store.set('presum', state.presum); } }), 'next 2'),
    h('span', { className: 'spend', id: 'sum-spend' }));
}
function setModel(m) {
  store.set('summodel', m);
  const i = current(); const it = items[i];
  clearTimeout(dwellTimer);
  summaries.delete(it.id); state.marks.delete(it.id); repaintStrip(it);
  paintSummary(it); load(it, i);
}
function paintSpend() {
  const el = $('#sum-spend'); if (!el || !spend) return;
  const cap = Number.isInteger(spend.budget) ? spend.budget : spend.budget.toFixed(2);
  el.textContent = `$${spend.today.toFixed(2)} / $${cap} today`;
  el.className = 'spend' + (spend.today >= spend.budget ? ' over' : spend.today >= 0.8 * spend.budget ? ' warn' : '');
  el.title = `${spend.calls} AI calls today; the daily cap is STACKS_DAILY_BUDGET`;
}
const setSpend = (sp) => { if (sp) { spend = sp; paintSpend(); } };
on('status', (s) => setSpend(s.spend));
on('panel:painted', paintSpend);

// ---- requests ----
async function* ndjson(r) {
  const rd = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { value, done: end } = await rd.read();
    if (end) break;
    buf += dec.decode(value, { stream: true });
    for (let nl; (nl = buf.indexOf('\n')) >= 0;) { const line = buf.slice(0, nl); buf = buf.slice(nl + 1); if (line.trim()) yield JSON.parse(line); }
  }
  if (buf.trim()) yield JSON.parse(buf);
}
function meta(it, i) {
  let spread;
  if (isFlow(it) && live?.id === it.id) { const [a, b] = flowRange(state.start.get(i) ?? 0); spread = `${a + 1}-${b + 1}`; }
  else { const s = isFlow(it) ? 0 : startOf(i); spread = `${s + 1}-${s + (state.shown || state.per)}`; }
  return { id: it.id, title: it.t, authors: it.a, year: it.y, lane: LANES[it.lane], laneId: it.lane, kind: it.kind, spread };
}
const texts = new Map(); // `${id}|${s}` -> Promise<text>, a few kept so asks reuse the summary's extraction
function textFor(it, s) {
  const k = it.id + '|' + s;
  if (!texts.has(k)) {
    texts.set(k, extractText(it, s).catch((e) => { texts.delete(k); throw e; }));
    while (texts.size > 8) texts.delete(texts.keys().next().value);
  }
  return texts.get(k);
}

const iaId = (it) => it.ia || String(it.url || '').match(/archive\.org\/download\/([^/]+)\//)?.[1];
const within = (p, ms) => Promise.race([p, sleep(ms).then(() => null)]);
/** Internet Archive OCR text: the opening pages and the stretch around page s (no exact page breaks). */
async function iaText(id, n, s) {
  const r = await fetch('/proxy?u=' + encodeURIComponent(`https://archive.org/download/${id}/${id}_djvu.txt`));
  if (!r.ok) throw new Error('No OCR text for this scan');
  const t = await r.text();
  const at = n ? Math.floor((s / Math.max(1, n)) * t.length) : 0;
  return ['[opening pages]\n' + t.slice(0, 15000), `\n[around p. ${s + 1}]\n` + t.slice(Math.max(15000, at - 8000), at + 25000)].join('\n');
}

/** Text with [p. N] markers, around where the reader is, for the summarizer. */
export async function extractText(it, s) {
  if (it.kind === 'scan') return (await iaText(it.ia, it.n, s)).slice(0, 85000);
  // A large scanned PDF from the Internet Archive can take a minute to arrive; its OCR text is quicker.
  const d = iaId(it) && it.kind === 'pdf' ? await within(openDoc(it).catch(() => null), 4000) : await within(openDoc(it), 60000);
  if (!d && iaId(it)) return (await iaText(iaId(it), it.n, s)).slice(0, 85000);
  if (!d) throw new Error('the document has not loaded after a minute');
  const parts = [];
  if (d.pdf) {
    const pages = new Set([...Array(Math.min(d.n, 10)).keys(), ...[0, 1, 2].map((j) => s + j).filter((k) => k < d.n)]);
    for (const k of [...pages].sort((a, b) => a - b)) {
      const tc = await (await d.pdf.getPage(k + 1)).getTextContent();
      parts.push(`[p. ${k + 1}] ` + tc.items.map((x) => x.str).join(' '));
      if (parts.join('').length > 70000) break;
    }
  } else {
    d.texts.forEach((x, k) => parts.push(`[p. ${k + 1}] ${x}`));
  }
  return parts.join('\n').slice(0, 85000);
}

/** Summarize item i with the chosen model, streaming into the panel. `visible`: the reader asked or is looking. */
export function summarizeItem(i, visible, { force = false } = {}) {
  const it = items[i]; const m = summaryModel(); const k = K(it.id, m);
  const have = done.get(k);
  if (!force && have && !have.error) return Promise.resolve(have);
  if (inflight.has(k)) { if (visible) paintSummary(it, 'working'); return inflight.get(k); }
  if (visible) clearTimeout(dwellTimer);
  done.delete(k); partials.delete(k);
  if (force && m === summaryModel()) { summaries.delete(it.id); highlight('quote', []); }
  const run = (async () => {
    phase.set(k, 'text');
    if (visible) paintSummary(it, 'working');
    let out = null;
    try {
      const text = await textFor(it, isFlow(it) ? 0 : startOf(i));
      phase.set(k, 'model'); schedulePaint(it);
      const r = await fetch('/summarize', { method: 'POST', body: JSON.stringify({ ...meta(it, i), model: m, force, text }) });
      for await (const msg of ndjson(r)) {
        if (msg.type === 'partial') { partials.set(k, msg.summary); schedulePaint(it); }
        else if (msg.type === 'final') { out = msg.summary; setSpend(msg.spend); }
        else if (msg.type === 'error') {
          out = { error: ['no_key', 'no_sdk', 'budget', 'refusal'].includes(msg.code) ? msg.error : 'Summary failed: ' + msg.error, code: msg.code };
          setSpend(msg.spend);
        }
      }
      out ||= { error: 'Summary failed: the stream ended early', code: 'error' };
    } catch (e) { out = { error: (phase.get(k) === 'text' ? 'Could not get the text: ' : 'Summary failed: ') + e.message, code: 'error' }; }
    partials.delete(k); phase.delete(k);
    // A background failure is not remembered (it is retried when you arrive), unless you are already looking.
    if (out.error && !visible && state.panelItem !== it.id) return out;
    setSummary(it, m, out);
    if (visible && state.presum && !out.error && !(spend && spend.today >= 0.9 * spend.budget)) {
      for (const ii of state.order.slice(state.pos + 1, state.pos + 3)) if (!items[ii]?.private) summarizeItem(ii, false);
    }
    return out;
  })().finally(() => inflight.delete(k));
  inflight.set(k, run);
  return run;
}
registerKey('a', () => summarizeItem(current(), true), { help: ['a A', 'summarize now (otherwise after 5 s) / regenerate'], order: 31 });
registerKey('A', () => summarizeItem(current(), true, { force: true }), { order: 31 });

// ---- ask about this item ----
function askBox(it, i) {
  const input = h('input', {
    className: 'ask-in', type: 'text', placeholder: 'Ask about this item…', spellcheck: false,
    onkeydown: (e) => {
      if (e.key === 'Enter' && input.value.trim()) { ask(it, i, input.value.trim()); input.value = ''; }
      else if (e.key === 'Escape') input.blur();
    },
  });
  if (!qas.has(it.id)) {
    qas.set(it.id, []);
    fetch('/asks?id=' + encodeURIComponent(it.id)).then((r) => r.json()).then((all) => {
      const list = qas.get(it.id);
      for (const a of all) if (!list.some((e) => e.q === a.q && e.model === a.model)) list.push(a);
      paintQAs(it);
    }).catch(() => {});
  }
  queueMicrotask(() => paintQAs(it));
  return h('div', { className: 'ask' }, input, h('div', { className: 'qas', id: 'sum-qas' }));
}
let qaMore = false;
on('item:shown', () => { qaMore = false; litQuote = null; highlight('quote', []); });
function paintQAs(it) {
  const box = $('#sum-qas'); if (!box || state.panelItem !== it.id) return;
  const all = qas.get(it.id) || [];
  const shown = qaMore ? all : all.slice(0, 2);
  box.replaceChildren(...[...shown.map((e) => h('div', { className: 'qa' + (e.live ? ' live' : '') + (e.error ? ' err' : '') },
    h('div', { className: 'q', textContent: e.q }),
    h('div', { className: 'a' }, ...(e.error ? [e.error] : cite(e.answer || ''))),
    e.live || e.error ? null : h('div', { className: 'ai-note', textContent: [`${(e.model || '').includes('(mock)') ? 'Mock' : 'AI'} answer by ${short(e.model)}`, cents(e.cost)].filter(Boolean).join(' · ') }))),
  all.length > shown.length ? h('button', { className: 'ghost more', textContent: `${all.length - shown.length} earlier`, onclick: () => { qaMore = true; paintQAs(it); } }) : null].filter(Boolean));
}
/** Answer text with its page citations ("p. 4", "pp. 4-6") turned into links. */
function cite(raw) {
  const text = raw.replace(/\*\*/g, '');
  const out = []; let last = 0;
  for (const m of text.matchAll(/\bpp?\.\s?(\d+)(?:\s?[–-]\s?\d+)?/g)) {
    const p = Number(m[1]);
    out.push(text.slice(last, m.index), h('span', { className: 'pl cite', textContent: m[0], onclick: () => goPage(p - 1) }));
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}
async function ask(it, i, q) {
  const m = summaryModel();
  const list = qas.get(it.id) || [];
  const same = list.find((e) => !e.error && !e.live && e.q.toLowerCase() === q.toLowerCase() && (e.model || '').startsWith(m));
  if (same) { list.splice(list.indexOf(same), 1); list.unshift(same); return paintQAs(it); }
  const e = { q, answer: '', model: m, live: true };
  list.unshift(e); qas.set(it.id, list); paintQAs(it);
  try {
    const text = await textFor(it, isFlow(it) ? 0 : state.start.get(i) ?? startOf(i));
    const r = await fetch('/ask', { method: 'POST', body: JSON.stringify({ ...meta(it, i), model: m, q, text }) });
    for await (const msg of ndjson(r)) {
      if (msg.type === 'delta') {
        if (!e.answer) requestAnimationFrame(() => $('#sum-qas .qa')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
        e.answer = msg.text; schedulePaint(it);
      }
      else if (msg.type === 'final') { Object.assign(e, msg.answer); setSpend(msg.spend); }
      else if (msg.type === 'error') { e.error = msg.error; setSpend(msg.spend); }
    }
  } catch (err) { e.error = 'Ask failed: ' + err.message; }
  e.live = false;
  paintQAs(it);
}

// ---- click a key point: go to its page and highlight the quoted sentence ----
/** Letters and digits only, lowercased, accents and ligatures decomposed (same as the server). */
export const skel = (s) => String(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function locate(sk, frags, maxGap) {
  const out = [];
  for (let at = sk.indexOf(frags[0]); at >= 0 && out.length < 20; at = sk.indexOf(frags[0], at + 1)) {
    let from = at + frags[0].length, ok = true;
    for (const f of frags.slice(1)) {
      const nx = sk.indexOf(f, from);
      if (nx < 0 || nx - from > maxGap) { ok = false; break; }
      from = nx + f.length;
    }
    if (ok) out.push([at, from]);
  }
  return out;
}
/** The [first, last] word indices of a quote among words, preferring a match on `page` (0-based). */
export function findSpan(words, quote, page = -1) {
  const parts = String(quote).split(/\[?(?:\.\s?){3}\]?|…/);
  // Second pass without digits: footnote markers are in the extracted text but not in the live page.
  for (const digits of [true, false]) {
    const strip = (s) => (digits ? skel(s) : skel(s).replace(/\p{N}/gu, ''));
    let sk = ''; const own = [];
    words.forEach((w, j) => { const s = strip(w.text); sk += s; for (let c = 0; c < s.length; c++) own.push(j); });
    const frags = parts.map(strip).filter((f) => f.length >= 4);
    const whole = frags.join('');
    if (whole.length < 12) return null;
    let cands = locate(sk, frags, 400);
    // The middle differs (a typo the model fixed, an inline formula): anchor on the head and the tail.
    if (!cands.length && whole.length >= 60) cands = locate(sk, [whole.slice(0, 30), whole.slice(-30)], whole.length);
    if (cands.length) {
      const [a, b] = cands.find(([x]) => words[own[x]].page === page) || cands[0];
      return [own[a], own[b - 1]];
    }
  }
  return null;
}
function paintQuote(words, a, b) {
  const wa = words[a], wb = words[b];
  highlight('quote', []);
  if (wa.range && wb.range && globalThis.CSS?.highlights) {
    // One range across the words, so the spaces between them are lit too.
    const r = document.createRange();
    r.setStart(wa.range.startContainer, wa.range.startOffset);
    r.setEnd(wb.range.endContainer, wb.range.endOffset);
    CSS.highlights.set('quote', new Highlight(r));
  } else highlight('quote', words.slice(a, b + 1));
}
async function jumpToQuote(it, kp) {
  const i = current(); if (items[i]?.id !== it.id) return;
  const page = kp.page ? kp.page - 1 : -1;
  highlight('quote', []);
  const useQuote = kp.quote && kp.quote_ok !== false;
  if (isFlow(it) && live?.id === it.id) {
    const r = useQuote ? await currentWords() : null;
    const span = r && findSpan(r.words, kp.quote, page);
    if (span) { paintQuote(r.words, ...span); reveal(r.words[span[0]]); return; }
    if (page >= 0) goPage(page);
    return;
  }
  if (page >= 0) goPage(page);
  if (!useQuote) return;
  // Raster pages: a text source (pdf.js text layer, OCR boxes) gives words with elements once the page is drawn.
  for (const ms of [120, 300, 700, 1500, 3000]) {
    await sleep(ms);
    if (items[current()]?.id !== it.id) return;
    const words = ((await currentWords().catch(() => null))?.words || []).filter((w) => w.el);
    const span = words.length ? findSpan(words, kp.quote, page) : null;
    if (span) { highlight('quote', words.slice(span[0], span[1] + 1)); return; }
  }
}

export { peekDoc };
