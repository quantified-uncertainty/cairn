// "Wrong?": a link in the footnote of the summary and of the reading guide (the line that ends
// "may be wrong") records what is wrong and lowers trust in the item's AI fields. The report goes
// to the cache folder (server/routes/31-aitrust.mjs: CACHE/ai-errors.jsonl), never to the
// repository or an agent job. While a summary or guide marked wrong is the one shown, the item's
// AI sections in the side panel (summary, reading guide, sections, glossary) and its margin notes
// are dimmed, and the marked section offers Redo (the same model again), a stronger model (the
// summary's model menu) and Trust it again. A summary or guide made again, or by another model,
// is trusted as before.
//
// The panel's sections repaint themselves (streaming, a model change), so the link and the banner
// are put back by a MutationObserver on #panel: a few querySelector calls per panel change, and
// nothing on the reading path.
import { $, h, on, toast } from '../util.js';
import { items, byId } from '../corpus.js';
import { state, current } from '../state.js';
import { summaries, summarizeItem } from '../summary.js';
import { augOf, makeAug } from './augment.js';

const flags = new Map(); // id -> [{what, model, at, when}] (the server's open flags)
const OUT = {
  summary: { box: '#sum .sum', label: 'summary', of: (it) => summaries.get(it.id) },
  guide: { box: '#aug-guide .aug', label: 'reading guide', of: (it) => augOf(it) },
};
const DIM = ['sec-summary', 'sec-guide', 'sec-sections', 'sec-glossary'];
const panelItem = () => { const i = byId.get(state.panelItem); return i == null ? null : items[i]; };

/** The flag on the summary or guide this item shows now, or null. */
function flagOf(it, what) {
  const o = it && OUT[what].of(it);
  if (!o || o.error) return null;
  return (flags.get(it.id) || []).find((f) => f.what === what && f.model === (o.model || null) && f.at === (o.at || null)) || null;
}
/** True while a summary or guide of this item that the reader marked wrong is the one shown. */
export const lowTrust = (it) => !!(flagOf(it, 'summary') || flagOf(it, 'guide'));

async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
  return j;
}

function ask(it, what, note) {
  const box = note.parentNode, open = box.querySelector(':scope > .ait-form');
  if (open) return open.querySelector('textarea').focus();
  const ta = h('textarea', { rows: 2, maxLength: 2000, placeholder: 'What is wrong? (optional: which point, and what the text says)' });
  const send = h('button', { type: 'submit', className: 'ait-btn', textContent: 'Mark wrong' });
  const form = h('form', {
    className: 'ait-form',
    onsubmit: async (e) => {
      e.preventDefault();
      const o = OUT[what].of(it); if (!o) return form.remove();
      send.disabled = true;
      try {
        const j = await post('/ai/wrong', { id: it.id, what, model: o.model || null, at: o.at || null, note: ta.value.trim(), title: it.t || '' });
        flags.set(it.id, j.flags || []);
        form.remove(); decorate(); syncRoot();
        toast('Marked wrong', { icon: 'thumbs-down', kind: 'ok', sub: `Recorded on this Mac · this item's AI notes are dimmed until redone`, ms: 2600 });
      } catch (err) {
        send.disabled = false;
        toast('Could not record it', { icon: 'circle-alert', kind: 'bad', sub: String(err.message || err).slice(0, 80) });
      }
    },
  }, ta, h('div', { className: 'ait-row' }, send,
    h('button', { type: 'button', className: 'ghost ait-btn', textContent: 'Cancel', onclick: () => form.remove() }),
    h('span', { className: 'ait-hint', textContent: 'Kept in the cache folder on this Mac; nothing is sent.' })));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); form.remove(); }
    else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); form.requestSubmit(); }
  });
  note.after(form);
  ta.focus();
}

function banner(it, what) {
  const label = OUT[what].label;
  const btn = (text, title, fn) => h('button', { type: 'button', className: 'ghost ait-btn', textContent: text, title, onclick: fn });
  return h('div', { className: 'ait-banner', role: 'note' },
    h('span', { className: 'ait-msg', textContent: `You marked this ${label} wrong; this item's AI notes are dimmed.` }),
    btn('Redo', `Write the ${label} again with the same model (costs another call)`, () => {
      if (what === 'guide') return makeAug(it, { force: true });
      const i = byId.get(it.id); if (i != null) summarizeItem(i, true, { force: true });
    }),
    what === 'summary' ? btn('Stronger model…', 'Pick Sonnet or Opus in the model menu below; it then summarizes every item until you pick Haiku again', () => {
      const sel = $('#sec-summary .sum-model'); if (!sel) return;
      sel.scrollIntoView({ block: 'nearest' }); sel.focus();
    }) : null,
    btn('Trust it again', 'Undo the mark: show it as before', async () => {
      try { const j = await post('/ai/trust', { id: it.id, what }); if (j.flags?.length) flags.set(it.id, j.flags); else flags.delete(it.id); decorate(); syncRoot(); } catch { /* offline */ }
    }));
}

/** Put the link, the banner and the dimming where the panel shows them now (idempotent). */
function decorate() {
  const it = panelItem(); if (!it) return;
  const low = lowTrust(it);
  for (const id of DIM) document.getElementById(id)?.classList.toggle('ait-low', low);
  for (const what of Object.keys(OUT)) {
    const box = $(OUT[what].box); if (!box) continue;
    const f = flagOf(it, what);
    const note = box.querySelector(':scope > .ai-note'), link = note?.querySelector('.ait-w');
    if (note && !f && !link) {
      note.append(h('span', { className: 'ait-w' }, ' · ', h('a', {
        href: '#', className: 'ait-wrong', textContent: 'wrong?', title: `Something in this ${OUT[what].label} is wrong: say what (kept on this Mac), and its AI notes are dimmed`,
        onclick: (e) => { e.preventDefault(); ask(it, what, note); },
      })));
    } else if (f && link) link.remove();
    // The banner goes where the link was, under the footnote: where the reader is looking when they mark it.
    const ban = box.querySelector(':scope > .ait-banner');
    if (f && !ban) (note ? note.after(banner(it, what)) : box.append(banner(it, what)));
    else if (!f && ban) ban.remove();
  }
}

/** Margin notes belong to the item on the stage: dim them while it is marked. */
function syncRoot() {
  const it = items[current()];
  document.documentElement.classList.toggle('ait-low', !!it && lowTrust(it));
}

const panel = document.getElementById('panel');
if (panel) new MutationObserver(decorate).observe(panel, { childList: true, subtree: true });
on('item:settled', syncRoot);
on('summary:updated', syncRoot);
on('augment:updated', syncRoot);
fetch('/ai/trust').then((r) => (r.ok ? r.json() : {})).then((j) => {
  for (const [id, fs] of Object.entries(j || {})) if (Array.isArray(fs) && fs.length) flags.set(id, fs);
  decorate(); syncRoot();
}).catch(() => { /* offline: nothing marked */ });
