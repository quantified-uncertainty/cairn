// Flag for an agent (docs/learning/spec.md §8.7): a problem with an item (it does not
// open, pages missing, images broken, wrong metadata or place, a duplicate) becomes a
// job file in the public repository (POST /jobs/flag → jobs/open/flag-NNNN.md), which
// an outside agent picks up (jobs/README.md). `!` or the ⚑ in the item header opens
// the dialog; the note and, if ticked, a picture of the page go into the repository,
// and the dialog says so. Open errors the reader hits are reported too (POST
// /jobs/report, once per item per session): two on different days make a fix-item job.
import { $, h, on, store, toast, registerKey } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { isFlow } from '../docs.js';
import { live, flowRange } from '../flow.js';

const KINDS = [
  ['open', 'Doesn’t open or wrong file'], ['garbled', 'Pages missing or garbled'], ['images', 'Images broken'],
  ['meta', 'Wrong title, author or date'], ['place', 'Wrong lane or folder'], ['duplicate', 'Duplicate'], ['other', 'Other'],
];
const MAX_SHOT = 1.5e6, MAX_W = 1600;

// ---------------------------------------------------------------- the dialog
const sel = h('select', { 'aria-label': 'What kind of problem' }, ...KINDS.map(([v, l]) => h('option', { value: v, textContent: l })));
const note = h('textarea', { maxLength: 1000, placeholder: 'What’s wrong? This goes into the public repository.', spellcheck: true });
const pic = h('input', { type: 'checkbox' });
const picRow = h('label', { className: 'fl-pic' }, pic, h('span', { textContent: 'Attach a picture of this page (goes into the public repository)' }));
const count = h('span', { className: 'fl-n' });
const go = h('button', { type: 'button', className: 'fl-go' }, 'Write job', h('kbd', { textContent: navigator.platform?.startsWith('Mac') ? '⌘↵' : 'Ctrl↵' }));
const cancel = h('button', { type: 'button', className: 'fl-cancel' }, 'Cancel', h('kbd', { textContent: 'Esc' }));
const itLine = h('div', { className: 'fl-it' });
const dlg = h('div', { id: 'flag-dlg', role: 'dialog', 'aria-label': 'Flag for an agent', hidden: true },
  h('h3', { textContent: 'Flag for an agent' }), itLine, sel, note, picRow,
  h('div', { className: 'fl-warn', textContent: 'Writes a job file in jobs/open/ for an agent to fix. It names this item and the page; your note and the picture are public once committed. Nothing about your reading is included.' }),
  h('div', { className: 'fl-acts' }, count, cancel, go));
let target = null; // {i, it, page, flow}
note.oninput = () => { count.textContent = note.value.length > 800 ? `${note.value.length}/1000` : ''; };

/** The page on screen, 1-based (a stable page for flow documents). */
function pageNow(i, it) {
  const s = state.start.get(i) ?? 0;
  if (isFlow(it)) return live?.id === it.id ? flowRange(s)[0] + 1 : 1;
  return s + 1;
}
export function openFlag() {
  const i = current(); if (i == null || state.view !== 'feed') return false;
  const it = items[i], flow = isFlow(it), page = pageNow(i, it);
  target = { i, it, page, flow };
  itLine.replaceChildren(it.t, h('span', { textContent: `p. ${page}` }));
  pic.checked = false; pic.disabled = flow;
  picRow.classList.toggle('off', flow);
  picRow.title = flow ? 'Pictures are for page images (PDFs and scans); describe a post’s problem in the note' : '';
  if (dlg.parentNode !== $('#stage')) $('#stage').append(dlg);
  dlg.hidden = false; go.disabled = false;
  requestAnimationFrame(() => note.focus());
  return true;
}
const close = () => { dlg.hidden = true; target = null; document.activeElement?.blur?.(); };
cancel.onclick = close;
go.onclick = () => send();

// Keys typed in the dialog never reach the reader (capture phase, ahead of chrome.js).
addEventListener('keydown', (e) => {
  if (dlg.hidden) return;
  const inside = dlg.contains(e.target);
  if (e.key === 'Escape' && (inside || e.target === document.body)) { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
  if (!inside) return;
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.stopImmediatePropagation(); send(); return; }
  e.stopImmediatePropagation(); // typing stays in the dialog
}, true);
on('item:shown', () => { if (!dlg.hidden && target && items[current()]?.id !== target.it.id) close(); });
on('view:changed', ({ view }) => { if (view !== 'feed' && !dlg.hidden) close(); });

// ---------------------------------------------------------------- the picture
/** The page images on screen, drawn into one canvas at most 1,600 px wide, as WebP ≤ 1.5 MB. */
async function picture() {
  const pgs = [...document.querySelectorAll('#spread .pg')].filter((p) => p.querySelector(':scope > canvas, :scope > img'));
  if (!pgs.length) return null;
  const rects = pgs.map((p) => p.getBoundingClientRect()).filter((r) => r.width > 2);
  const x0 = Math.min(...rects.map((r) => r.left)), y0 = Math.min(...rects.map((r) => r.top));
  const W = Math.max(...rects.map((r) => r.right)) - x0, H = Math.max(...rects.map((r) => r.bottom)) - y0;
  const k = Math.min(MAX_W / W, Math.max(1, devicePixelRatio || 1));
  const c = h('canvas', { width: Math.round(W * k), height: Math.round(H * k) });
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  for (const p of pgs) {
    const pr = p.getBoundingClientRect();
    g.save(); g.beginPath(); g.rect((pr.left - x0) * k, (pr.top - y0) * k, pr.width * k, pr.height * k); g.clip();
    for (const src of p.querySelectorAll(':scope > canvas, :scope > img')) {
      const r = src.getBoundingClientRect();
      if (r.width > 1) g.drawImage(src, (r.left - x0) * k, (r.top - y0) * k, r.width * k, r.height * k);
    }
    g.restore();
  }
  for (let q = 0.85; q >= 0.3; q -= 0.15) {
    const blob = await new Promise((res, rej) => { try { c.toBlob(res, 'image/webp', q); } catch (e) { rej(e); } });
    if (!blob) throw new Error('no image');
    if (blob.size <= MAX_SHOT) return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  }
  throw new Error('picture too large');
}

// ---------------------------------------------------------------- sending
async function send() {
  if (!target || go.disabled) return;
  const { it, page, flow } = target;
  go.disabled = true;
  let shot = null, noPic = false;
  if (pic.checked && !flow) { try { shot = await picture(); } catch { noPic = true; } }
  const body = {
    id: it.id, page, kind: sel.value, note: note.value.trim().slice(0, 1000),
    view: { zoom: !!state.zoom, per: state.shown, crop: !!state.crop, cols: !!state.cols, flow, theme: store.get('settings', {}).theme || 'reading' },
    ...(shot ? { shot } : {}),
  };
  try {
    const r = await fetch('/jobs/flag', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    close(); note.value = ''; count.textContent = '';
    toast('Flag written', { icon: 'send', kind: 'ok', sub: `${j.id || 'job'}${noPic ? ' · without the picture (it could not be made)' : ''} · Y: Dashboard`, ms: 3200 });
  } catch (e) {
    go.disabled = false;
    toast('Could not write the flag', { icon: 'circle-alert', kind: 'bad', sub: String(e.message || e).slice(0, 80) });
  }
}

// ---------------------------------------------------------------- entry points
registerKey('!', () => { if (!dlg.hidden) close(); else openFlag(); },
  { help: ['!', 'flag a problem with this item for an agent job (writes a job file in the public repo)'], order: 41 });
// A small ⚑ in the item header; feed.js repaints the header on every item, so an observer re-adds it.
const btn = () => h('button', { type: 'button', className: 'fl-btn', textContent: '⚑', title: 'Flag a problem with this item for an agent (!) · writes a job file in the public repository', onclick: (e) => { e.stopPropagation(); openFlag(); } });
const head = $('#item-head');
if (head) new MutationObserver(() => { const m = head.querySelector(':scope > .meta'); if (m && !m.querySelector('.fl-btn')) m.append(btn()); }).observe(head, { childList: true });

// ---------------------------------------------------------------- open errors
const reported = new Set();
on('item:error', ({ it, msg }) => {
  if (!it?.id || reported.has(it.id)) return;
  reported.add(it.id);
  const m = String(msg || '');
  const st = /HTTP (\d{3})/.exec(m);
  fetch('/jobs/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: it.id, kind: 'open', msg: m.slice(0, 120), status: st ? Number(st[1]) : null }) }).catch(() => {});
});
