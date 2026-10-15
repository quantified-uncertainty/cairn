// Notes per item, saved to disk by the server; quotes can be appended.
import { $, h, on, registerSection, registerKey, toast } from './util.js';
import { items } from './corpus.js';
import { state, current } from './state.js';

export let notes = {};
try { notes = await (await fetch('/notes')).json(); } catch { notes = {}; }

function save(it, text) {
  const note = { ...(notes[it.id] || {}), text, title: it.t, authors: it.a, year: it.y, link: it.page || it.url };
  notes[it.id] = note;
  return fetch('/notes', { method: 'POST', body: JSON.stringify({ id: it.id, note }) }).catch(() => {});
}
/** Append a quotation (with its page) to the item's note. */
export function appendQuote(it, text, page) {
  const cur = notes[it.id]?.text || '';
  const q = `> ${text.trim().replace(/\s+/g, ' ')}${page != null ? ` (p. ${page})` : ''}\n`;
  const next = (cur ? cur.replace(/\n*$/, '\n\n') : '') + q;
  save(it, next);
  const ta = $('#note'); if (ta && state.panelItem === it.id) ta.value = next;
  toast('Quoted into your note', { icon: 'quote', kind: 'ok' });
}

registerSection({
  id: 'note', title: 'Note', order: 40,
  render(it) {
    const ta = h('textarea', { id: 'note', placeholder: 'Notes on this item (saved to your disk; export from Saved)', value: notes[it.id]?.text || '' });
    let t = null;
    ta.oninput = () => { clearTimeout(t); t = setTimeout(() => save(it, ta.value), 500); };
    ta.onkeydown = (e) => { if (e.key === 'Escape') ta.blur(); };
    return ta;
  },
});
registerKey('n', () => {
  if (!state.panel) document.getElementById('panel-btn')?.click();
  $('#note')?.focus();
}, { help: ['n', 'write a note'], order: 32 });
