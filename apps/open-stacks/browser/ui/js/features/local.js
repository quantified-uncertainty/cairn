// Local: files from folders on this machine, read in place, as the 'local' lane.
//
// The server (server/routes/17-local.mjs, server/local.mjs) indexes the folders set in
// Settings › Local folders (or STACKS_LOCAL_DIRS; by default iCloud Drive's "Recent
// Things to Read") and serves each file at /local/file/<id>, and EPUB, Markdown, web
// pages, Word (on a Mac), folders of pictures or sound as HTML at /local/doc/<id>.
// corpus.js appends /local/items.json after the corpus at load (no index moves), so the
// lane chip, the Library tree (each folder a folder), the sorts, search, the wall,
// reading memory, tags and /ready treat them like any other item.
//
// Here: the flow extractor for /local/doc pages (sanitized with the DOM), a poll that
// brings in files added, changed, downloaded from iCloud or removed while the page is
// open (every 3 s while visible: one tiny request), a why line (the file, Show in
// Finder, the iCloud command to copy), and the Settings section. Summaries and reading
// guides of your own files are made only when you ask (items carry private: true),
// unless Settings says otherwise: they send the text to Claude.
import { $, h, on, emit, toast, registerWhyLine } from '../util.js';
import { items, byId, LANES, LOCAL, mergeItems } from '../corpus.js';
import { state, current, buildOrder } from '../state.js';
import { extractors } from '../docs.js';
import { showFeed } from '../feed.js';
import { paintLanes } from '../chrome.js';
import { stack } from '../stack.js';

const isLocal = (it) => it?.src === 'local' && String(it.id).startsWith('local:');

// ---------------------------------------------------------------- reading
/** A /local/doc page → article HTML for prepareFlow: no scripts, frames, forms or handlers. */
export function localHtml(src) {
  const doc = new DOMParser().parseFromString(src, 'text/html');
  doc.querySelectorAll('script, style, link, meta, base, iframe, frame, object, embed, form, noscript, template').forEach((x) => x.remove());
  for (const el of doc.body.querySelectorAll('*')) {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('on') || n === 'srcdoc' || n === 'formaction') el.removeAttribute(a.name);
      else if (/^(href|src|xlink:href|poster|action)$/.test(n) && /^\s*(javascript|vbscript|data:(?!image\/))/i.test(a.value)) el.removeAttribute(a.name);
    }
  }
  return doc.body.innerHTML;
}
const coreHtml = extractors.html;
extractors.html = async (it, r) => (isLocal(it) ? localHtml(await r.text()) : coreHtml(it, r));

// ---------------------------------------------------------------- keeping up
let checking = false, lastCheck = 0;
/** Ask whether the folders changed; bring the change in when they did. */
async function check(force = false) {
  if (checking || (document.hidden && !force)) return;
  checking = true; lastCheck = Date.now();
  try {
    const r = await fetch('/local/v', { cache: 'no-store' });
    if (!r.ok) return;
    const { v } = await r.json();
    if (force || (v && v !== LOCAL.v)) await refresh();
  } catch { /* the server is restarting */ } finally { checking = false; }
}
/** The items again: new files appended, changed ones updated in place, removed ones say so. */
export async function refresh() {
  const r = await fetch('/local/items.json', { cache: 'no-store' });
  if (!r.ok) return;
  const j = await r.json();
  LOCAL.v = j.v; LOCAL.roots = j.roots || [];
  const ids = new Set(j.items.map((x) => x.id));
  const gone = [];
  for (const [id, i] of byId) {
    const it = items[i];
    if (!id.startsWith('local:') || ids.has(id) || it.gone) continue;
    gone.push({ id, lane: it.lane, kind: 'html', t: it.t, url: `/local/doc/${id}?gone=1`, path: it.path, ord: it.ord, src: 'local', q: it.q, private: it.private, ext: it.ext, gone: true,
      why: 'No longer in your folder: moved, renamed or deleted (gone after a reload)' });
  }
  if (!LANES.local && (j.items.length || LOCAL.roots.length)) LANES.local = j.label || 'Local';
  const ci = current(), cur = items[ci], was = cur && { url: cur.url, kind: cur.kind };
  const { added, changed } = mergeItems([...j.items, ...gone]);
  if (!added.length && !changed.length) return;
  paintLanes();
  if (added.length && !state.scope && (state.lane === 'local' || state.lane === 'all')) { buildOrder(true); emit('stack:changed', { stack: stack() }); }
  // The file on screen changed (saved again, or arrived from iCloud): show it as it is now.
  if (cur && current() === ci && was && (cur.url !== was.url || cur.kind !== was.kind) && state.view === 'feed') {
    state.start.set(ci, 0); state.hist.set(ci, []);
    showFeed();
  }
  if (added.length && state.lane === 'local') toast(added.length === 1 ? 'New in your folder' : `${added.length} new in your folder`, { icon: 'file-plus', kind: 'ok', sub: added.length === 1 ? items[added[0]].t : '' });
}
setInterval(() => { if (Date.now() - lastCheck > 2500) check(); }, 3000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });

// ---------------------------------------------------------------- why line
let info = null; // GET /local/settings, once: the platform, for Show in Finder
const infoP = () => (info ? Promise.resolve(info) : fetch('/local/settings').then((r) => (r.ok ? r.json() : null)).then((j) => { info = j; return j; }).catch(() => null));
async function reveal(it) {
  try {
    const r = await fetch('/local/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP ' + r.status);
  } catch (e) { toast('Could not show it', { icon: 'circle-alert', kind: 'bad', sub: e.message }); }
}
const SIZE = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e6 ? Math.round(b / 1e6) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');
const KIND = { pdf: 'PDF', epub: 'EPUB', md: 'Markdown', markdown: 'Markdown', html: 'web page', htm: 'web page', txt: 'text', gallery: 'pictures', playlist: 'sound', zip: 'zip archive' };
registerWhyLine((it) => {
  if (!isLocal(it)) return null;
  const mac = info ? info.platform === 'darwin' : /Mac/.test(navigator.platform);
  const what = [KIND[it.ext] || (it.ext ? it.ext.toUpperCase() : 'file') + (it.count ? '' : ' file'), it.count ? `${it.count} files` : null, it.size ? SIZE(it.size) : null].filter(Boolean).join(', ');
  const el = h('div', { className: 'lc-why' }, h('span', { className: 'lc-what', textContent: what }));
  if (!it.gone) el.append(h('button', { type: 'button', className: 'lc-btn', textContent: mac ? 'Show in Finder' : 'Show in folder', title: 'Open the folder it is in', onclick: () => reveal(it) }));
  if (it.page) el.append(h('a', { className: 'lc-btn', href: it.page, target: '_blank', rel: 'noopener', textContent: 'The file ↗', title: 'The file itself, in a new tab' }));
  const cmd = /brctl download (.+)$/.exec(it.why || '')?.[1];
  if (cmd) el.append(h('button', { type: 'button', className: 'lc-btn', textContent: 'Copy the command', title: 'brctl download … (paste it into Terminal)', onclick: async () => { try { await navigator.clipboard.writeText('brctl download ' + cmd.replace(/\)$/, '')); toast('Copied', { icon: 'circle-check', kind: 'ok', sub: 'Paste it into Terminal' }); } catch { toast('Could not copy', { icon: 'circle-alert', kind: 'bad' }); } } }));
  if (it.private) el.append(h('span', { className: 'lc-ai', textContent: 'AI only on request', title: 'Summaries and reading guides of your own files are made only when you ask (a), because they send the text to Claude. Settings › Local folders changes it.' }));
  return el;
});

// ---------------------------------------------------------------- Settings › Local folders
async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'HTTP ' + r.status);
  return j;
}
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
function section(ui) {
  const { row, seg, tog, upd, sync, flash } = ui;
  let S = info || { dirs: [], roots: [], order: 'name', autoAI: false };
  const box = h('textarea', { className: 'lc-dirs', rows: 3, spellcheck: false, placeholder: '~/Library/Mobile Documents/com~apple~CloudDocs/Recent Things to Read', ariaLabel: 'Folders, one per line' });
  const msg = h('span', { className: 'st-msg' });
  const list = h('div', { className: 'lc-roots' });
  let edited = false;
  box.addEventListener('input', () => { edited = true; });
  const apply = async (body, done) => {
    msg.textContent = 'Reading the folders…'; msg.className = 'st-msg';
    try {
      S = info = await post('/local/settings', body);
      edited = false;
      msg.textContent = done || 'Saved.'; msg.className = 'st-msg ok';
      await check(true);
    } catch (e) { msg.textContent = 'Not saved: ' + e.message; msg.className = 'st-msg bad'; }
    sync();
  };
  const save = h('button', { type: 'button', className: 'st-btn', textContent: 'Save', onclick: () => apply({ dirs: box.value }, 'Saved: the Local lane follows these folders.') });
  const dflt = h('button', { type: 'button', className: 'st-btn', textContent: 'Default', title: 'STACKS_LOCAL_DIRS when it is set, else iCloud Drive’s “Recent Things to Read”', onclick: () => apply({ dirs: null }) });
  const rescan = h('button', { type: 'button', className: 'st-btn', textContent: 'Look again', title: 'Read the folders again now (changes are normally seen within seconds)', onclick: async () => { msg.textContent = 'Looking…'; try { S = info = await post('/local/rescan', {}); await check(true); msg.textContent = 'Up to date.'; msg.className = 'st-msg ok'; } catch (e) { msg.textContent = e.message; msg.className = 'st-msg bad'; } sync(); } });
  upd(() => {
    if (!edited && document.activeElement !== box) box.value = (S.saved || S.dirs || []).join('\n');
    dflt.classList.toggle('on', !S.saved);
    const from = { settings: 'set here', env: 'from STACKS_LOCAL_DIRS', default: 'the default (iCloud Drive)', none: 'none set' }[S.from] || '';
    list.replaceChildren(
      ...(S.roots || []).map((r) => {
        const skipped = Object.entries(r.skipped || {}).filter(([k]) => k !== 'hidden').map(([k, n]) => `${n} ${k}`).join(', ');
        return h('div', { className: 'lc-root' + (r.ok ? '' : ' bad') },
          h('b', { textContent: r.name }),
          h('span', { textContent: r.ok ? ` · ${plural(r.n, 'item')}${r.truncated ? ' (stopped at 20,000 files)' : ''}${skipped ? ` · left out: ${skipped}` : ''}` : ` · ${r.error || 'cannot be read'}` }),
          h('div', { className: 'lc-path', textContent: r.dir }));
      }),
      h('div', { className: 'lc-from', textContent: (S.roots || []).length ? `${from}${S.watching ? ' · watching for changes' : ''}` : S.from === 'none' ? 'No folder yet: add one above (one per line).' : from }));
  });
  if (!info) infoP().then(() => { S = info || S; sync(); });
  return {
    id: 'local', title: 'Local folders', note: 'your own files, read in place',
    reset: () => apply({ dirs: null, order: 'name', autoAI: false }, 'Local folders: back to the defaults.'),
    rows: [
      row('Folders', ['One per line; ', h('code', { textContent: '~' }), ' is your home folder. Each becomes a folder of the Local lane, its subfolders folders under it. Files are read where they are: nothing is copied or uploaded.'],
        h('div', { className: 'lc-set' }, box, h('div', { className: 'lc-acts' }, save, dflt, rescan, msg), list)),
      row('Order in a folder', 'By name keeps series, chapters and sheets together (2 before 10). Newest first puts the latest files on top; S (Newest) sorts the whole lane by date either way.',
        seg([['name', 'By name'], ['newest', 'Newest first']], () => S.order || 'name', (v) => apply({ order: v }))),
      row('AI on your files', ['Summaries and reading guides send the text to Claude. On request: only when you press ', ui.kb('a'), ' or “make one”.'],
        ...tog(() => !S.autoAI, (v) => apply({ autoAI: !v }), ['On request', 'Automatic'])),
    ],
  };
}
import('./settings.js').then((m) => m.registerSettings?.(section)).catch(() => { /* no Settings sheet */ });
on('boot', () => { if (LOCAL.roots.length) infoP(); });
