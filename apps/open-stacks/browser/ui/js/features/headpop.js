// Header popovers: rest the pointer on a part of the item header and a small
// card opens under it.
//
//   the title     the hook, else the summary's "why care" if the side panel already
//                 has it (never a request of its own), else the abstract or the why
//                 line; its type, pages, date, links and how far you have read it
//   the lane      how big it is, where this item is in it, what you have opened, and
//                 its folders: a click browses one in the Library, ⇥ stays in it
//   the author    (or a wiki's site) the other items by them, around this one in the
//                 current sort: a click opens one; "Stay in" narrows the stack to them
//                 (an author with one item: the item's folder instead)
//   the crumb     ("› Reasoning 7/10") the stack you stay in, around this item
//   the date      the full date and the item's age
//   the flag ⚑    what flagging does
//
// Quiet on purpose: it opens only when the pointer has rested on a part for
// REST_MS (moved no more than a few px), never for a pointer that passes, or for
// content that moves under a still pointer (a pointermove that did not move is
// ignored; a wheel waits it out). It is one element, at most about 360 × 320 px,
// position: fixed under the part (nothing moves), and it goes when the pointer
// leaves the part and the card, on Esc, a click elsewhere, a wheel, or any key
// that does something else (j k l h Space…: the key still does it); sent away while the
// pointer is still on its part, it waits until the pointer leaves that part. From the
// keyboard: Tab to a part, ↓ (or Enter on the lane, author and date) opens it
// and puts the keyboard in it (↑ ↓ move, Enter acts, Esc goes back).
//
// Speed: nothing here runs on a page turn. On an item change an observer gives
// the header's plain parts a tab stop (a few attributes, no layout); everything
// else waits for a rest, a click or a key.
import { $, h, on, emit, esc, fmtDate, dateOf, toast } from '../util.js';
import { items, LANES, COUNTS, LANE_COLORS } from '../corpus.js';
import { state, current, SORTERS, score } from '../state.js';
import { stayIn, leave, goTo, folderStack } from '../stack.js';
import { itemIcon, typeOf, TYPES } from '../icons.js';
import { summaries } from '../summary.js';
import { escHolds } from '../nav.js';

const REST_MS = 350, SWITCH_MS = 180, CLOSE_MS = 220, NEAR = 4, ROWS = 8;
const head = $('#item-head');
const pop = h('div', { id: 'hpop', hidden: true, role: 'dialog' });
document.body.append(pop);

// Other features, once everything has loaded (they load after this one).
let progressOf = null, firstAuthor = null, openFlag = null;
on('boot', () => {
  import('./memory.js').then((m) => { progressOf = m.progressOf; }).catch(() => {});
  import('./tags.js').then((m) => { firstAuthor = m.firstAuthor; }).catch(() => {});
  import('./flag.js').then((m) => { openFlag = m.openFlag; }).catch(() => {});
});

// ---------------------------------------------------------------- the parts
const PARTS = '#item-head > h1, #item-head > .meta > :is(.lane, .au, .dt, .fl-btn), #item-head > .meta > .stk-crumb > .sc-t';
const partOf = (t) => { const el = t?.closest?.('h1, .lane, .au, .dt, .sc-t, .fl-btn'); return el?.matches(PARTS) ? el : null; };
const plain = (p) => p.matches('.lane, .au, .dt'); // parts that do nothing else when clicked
const kindOf = (el) => (el.tagName === 'H1' ? 'title' : el.classList.contains('lane') ? 'lane' : el.classList.contains('au') ? 'author'
  : el.classList.contains('dt') ? 'date' : el.classList.contains('sc-t') ? 'crumb' : 'flag');
// The plain parts get a tab stop (the title's link, the crumb and ⚑ are buttons or links already).
function decorate() {
  const h1 = head.querySelector(':scope > h1');
  for (const el of [...head.querySelectorAll(':scope > .meta > :is(.lane, .au, .dt)'), h1 && !h1.querySelector('a') ? h1 : null]) {
    if (!el || el.tabIndex === 0) continue;
    el.tabIndex = 0; el.setAttribute('aria-haspopup', 'dialog'); el.setAttribute('aria-expanded', 'false');
  }
}
if (head) new MutationObserver(decorate).observe(head, { childList: true });
// The header's own tooltips would sit on top of the card: they go when a part is first pointed at
// or focused (their words are in the card); a button keeps its name.
function untitle(p) {
  for (const el of [p, ...p.querySelectorAll('[title]')]) {
    if (!el.title) continue;
    if (el.tagName === 'BUTTON' && !el.getAttribute('aria-label') && !/\w/.test(el.textContent)) el.setAttribute('aria-label', el.title.split(' · ')[0]);
    el.removeAttribute('title');
  }
  p.setAttribute('aria-haspopup', 'dialog');
}

// ---------------------------------------------------------------- resting
let open = null; // { part, kind, byKey, i }
let rest = null, restT = 0, closeT = 0, last = [NaN, NaN], moved = false, quietTill = 0;
// The kind of part a card was sent away from (Esc, l, j, Space, the wheel, a click on the part) while the
// pointer stayed on it: not again until the pointer leaves that part, so a twitch does not bring it back.
let dismissed = null;
let shutAt = -Infinity; // when a card last closed (performance.now()), for Esc: escHolds below
const busy = () => state.view !== 'feed' || document.hidden || !!$('.hd-menu') || !!$('#wheel-menu') || ($('#more') && !$('#more').hidden)
  || !!document.querySelector('#flag-dlg:not([hidden]), #st:not([hidden]), #keys:not([hidden])') || performance.now() < quietTill;
function cancelRest() { clearTimeout(restT); restT = 0; rest = null; }
function closeSoon() { if (!closeT) closeT = setTimeout(() => { closeT = 0; hide(); }, CLOSE_MS); }
const keepOpen = () => { clearTimeout(closeT); closeT = 0; };
head?.addEventListener('pointerover', (e) => { const p = partOf(e.target); if (p) untitle(p); });
// Whether the pointer itself moved (anywhere), or only what is under it.
addEventListener('pointermove', (e) => { moved = e.clientX !== last[0] || e.clientY !== last[1]; last = [e.clientX, e.clientY]; }, { passive: true, capture: true });
head?.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch' || !moved) return; // the pointer did not move: something moved under it
  const part = e.buttons ? null : partOf(e.target);
  if (dismissed && (!part || kindOf(part) !== dismissed)) dismissed = null;
  if (open && part === open.part) { keepOpen(); cancelRest(); return; }
  if (!part) { cancelRest(); if (open && !open.byKey) closeSoon(); return; }
  if (dismissed) { cancelRest(); return; } // sent away from this part: wait until the pointer leaves it
  if (rest?.part === part && Math.hypot(e.clientX - rest.x, e.clientY - rest.y) <= NEAR) return; // still resting
  rest = { part, x: e.clientX, y: e.clientY };
  clearTimeout(restT);
  restT = setTimeout(() => { const r = rest; restT = 0; rest = null; if (r?.part.isConnected && !busy()) show(r.part, false); }, open ? SWITCH_MS : REST_MS);
}, { passive: true });
head?.addEventListener('pointerleave', (e) => { cancelRest(); dismissed = null; if (open && !open.byKey && !pop.contains(e.relatedTarget)) closeSoon(); });
pop.addEventListener('pointerenter', keepOpen);
pop.addEventListener('pointerleave', (e) => { if (open && !open.part.contains(e.relatedTarget)) closeSoon(); });
// A wheel turns pages under a still pointer: no card for a moment, and an open one goes.
addEventListener('wheel', (e) => { quietTill = performance.now() + 500; cancelRest(); if (open && !pop.contains(e.target)) hide(); }, { passive: true, capture: true });
// A click on a part that does nothing else (the lane, the author, the date) opens its card at once.
head?.addEventListener('click', (e) => {
  const p = partOf(e.target); if (!p || !plain(p)) return;
  cancelRest();
  if (open?.part === p) hide(); else show(p, e.detail === 0);
});

// ---------------------------------------------------------------- keys
head?.addEventListener('focusin', (e) => { const p = partOf(e.target); if (p) untitle(p); });
head?.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const p = partOf(e.target); if (!p) return;
  if (!(e.key === 'ArrowDown' || (e.key === 'Enter' && e.target === p && (plain(p) || p.tagName === 'H1')))) return;
  e.preventDefault(); e.stopPropagation(); // not the next item, not zoom
  if (open?.part === p) focusIn(); else show(p, true);
});
const btns = () => [...pop.querySelectorAll('button, a[href]')];
function focusIn() { btns()[0]?.focus({ preventScroll: true }); }
// While a card is open (capture, ahead of the reader's keys): Esc closes it, arrows move in it,
// and any other key closes it and goes on to do what it does.
function onKey(e) {
  if (!open) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(true); shutAt = -Infinity; return; }
  if (/^(Shift|Control|Alt|Meta|CapsLock|Fn)$/.test(e.key)) return;
  if ((e.metaKey || e.ctrlKey) && /^c$/i.test(e.key)) return; // copying text selected in the card keeps it
  const inPop = pop.contains(e.target);
  if (inPop) {
    const bs = btns(), j = bs.indexOf(document.activeElement);
    const go = (k) => { e.preventDefault(); e.stopPropagation(); bs[(k + bs.length) % bs.length]?.focus({ preventScroll: true }); };
    if (e.key === 'ArrowDown') return go(j + 1);
    if (e.key === 'ArrowUp') return go(j < 0 ? -1 : j - 1);
    if (e.key === 'Home') return go(0);
    if (e.key === 'End') return go(-1);
    if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); return; } // the button's own click
    if (e.key === 'Tab') {
      // The card is last in the page: Tab past its last control would leave the page with the card
      // open. It closes and the keyboard goes back to the part (Shift+Tab off the first lands on the
      // part; Tab off the last lets the browser go on from the part to the next one).
      if (e.shiftKey ? j <= 0 : j === bs.length - 1) { e.stopPropagation(); if (e.shiftKey) e.preventDefault(); hide(true); }
      return; // within the card: focusout below closes it if the keyboard leaves some other way
    }
  } else if (e.target === open.part || open.part.contains(e.target)) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') return; // the part's own handler: into the card
  }
  hide(false);
}
pop.addEventListener('focusout', (e) => {
  if (!open || pop.contains(e.relatedTarget) || open.part.contains(e.relatedTarget)) return;
  if (e.relatedTarget) hide(false); // Tab went elsewhere; a click elsewhere is handled by pointerdown
});
// A press anywhere else closes it (on the lane, author or date, the click itself toggles it).
function onDown(e) { if (open && !pop.contains(e.target) && !(plain(open.part) && open.part.contains(e.target))) hide(false); }
function listen(yes) {
  if (yes) { window.addEventListener('keydown', onKey, true); document.addEventListener('pointerdown', onDown, true); }
  else { window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); }
}

// ---------------------------------------------------------------- showing
function show(part, byKey) {
  const i = current(); if (i == null || state.view !== 'feed' || !part.isConnected) return;
  const kind = kindOf(part), it = items[i];
  let kids = null;
  try { kids = FILL[kind](it, i, part); } catch (err) { console.error('headpop', kind, err); }
  if (!kids) return;
  keepOpen(); dismissed = null;
  if (open && open.part !== part) open.part.setAttribute('aria-expanded', 'false');
  pop.replaceChildren(...kids.filter(Boolean));
  pop.className = 'hp-' + kind;
  pop.setAttribute('aria-label', LABEL[kind]);
  untitle(part);
  part.setAttribute('aria-expanded', 'true');
  pop.style.maxHeight = '';
  pop.hidden = false;
  // One layout read, when it opens: under the part, inside the window.
  const r = part.getBoundingClientRect(), w = pop.offsetWidth;
  const top = Math.round(r.bottom + 5);
  pop.style.left = Math.round(Math.max(8, Math.min(r.left - 6, innerWidth - w - 8))) + 'px';
  pop.style.top = top + 'px';
  pop.style.maxHeight = Math.max(120, Math.min(320, innerHeight - top - 8)) + 'px';
  const was = !!open;
  open = { part, kind, byKey, i };
  if (!was) listen(true);
  if (byKey) focusIn();
}
/** Close it; back (Esc): the keyboard returns to the part when it was opened from the keyboard. */
function hide(back = false) {
  keepOpen(); cancelRest();
  if (!open) return;
  const { part, kind, byKey } = open; open = null; shutAt = performance.now();
  // Closed while the pointer is still on its part (a key, the wheel, a click): dismissed. (After an item
  // change the part is a new element: the pointer is then still on the header.)
  dismissed = (part.isConnected ? part : head).matches(':hover') ? kind : null;
  const had = pop.contains(document.activeElement);
  pop.hidden = true; pop.replaceChildren();
  part.setAttribute('aria-expanded', 'false');
  listen(false);
  // Opened from the keyboard, the keyboard goes back to the part; otherwise back to the page (Space, Enter).
  if (part.isConnected && byKey && (back || had)) (part.matches('h1') ? part.querySelector('a') || part : part).focus({ preventScroll: true });
  else if (had) document.activeElement?.blur?.();
}
// An Esc meant for a card that has just closed by itself (the pointer left it, a wheel, an item
// change), or pressed with the pointer on the header, does nothing rather than leave the Reader
// for the Wall (nav.js escHolds). One that closes a card is not counted: a second Esc goes on.
escHolds.push(() => performance.now() - shutAt < 500 || !!document.querySelector('#bar:hover, #item-head:hover'));
// Anything that moves closes it.
for (const ev of ['item:shown', 'item:skim', 'nav', 'view:changed', 'header:changed', 'stack:changed', 'overview']) on(ev, () => { cancelRest(); if (open) hide(); });
addEventListener('resize', () => { if (open) hide(); });
addEventListener('blur', () => { cancelRest(); });

// ---------------------------------------------------------------- the cards
const LABEL = { title: 'About this item', lane: 'About this lane', author: 'More by this author', crumb: 'The stack you stay in', date: 'The date', flag: 'Flagging' };
const ICON = {
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  author: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  site: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  stay: '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>', // list-filter: the stack narrowed
};
const svg = (k, s = 13) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const ic = (k) => h('span', { className: 'hp-i', innerHTML: svg(k) });
const hdr = (icon, label, n) => h('div', { className: 'hp-h' }, icon, h('span', { className: 'hp-l', textContent: label }), n != null ? h('span', { className: 'hp-n', textContent: n }) : null);
const line = (text, cls = 'hp-k') => (text ? h('div', { className: cls, textContent: text }) : null);
const plural = (n, w) => `${n.toLocaleString('en-US')} ${w}${n === 1 ? '' : 's'}`;
function button(text, title, fn, cls = '') {
  const b = h('button', { type: 'button', className: 'hp-b ' + cls, title });
  b.innerHTML = text;
  b.onclick = (e) => { e.stopPropagation(); hide(false); fn(); };
  return b;
}
const lanePos = () => (state.scope ? `${state.pos + 1} of ${state.order.length} in “${state.stack?.label}”` : `${state.pos + 1} of ${state.order.length} in ${state.lane === 'all' ? 'All' : LANES[state.lane] || state.lane}`);
const SORT_NAME = { topic: 'by topic', ranked: 'for you', newest: 'newest first', oldest: 'oldest first' };

/** Items `arr` in the order j/k would walk them (the current sort), and a window of ROWS around item i. */
function around(arr, i, inStack = false) {
  let list;
  if (inStack) list = state.order;
  else if (SORTERS[state.sort]) { list = arr.includes(i) ? arr.slice() : [...arr, i]; list.sort(SORTERS[state.sort]); }
  else { const sc = new Map(arr.map((j) => [j, score(j)])); list = arr.filter((j) => j !== i).sort((a, b) => sc.get(b) - sc.get(a)); list.unshift(i); }
  const k = Math.max(0, inStack ? state.pos : list.indexOf(i));
  const a = Math.max(0, Math.min(k - 2, list.length - ROWS));
  return { win: list.slice(a, a + ROWS), from: a, k, n: list.length };
}
function rows({ win, from, k }, i, act) {
  return h('div', { className: 'hp-rows', role: 'group' }, ...win.map((j, r) => {
    const it = items[j], here = j === i;
    const b = h('button', { type: 'button', className: 'hp-row' + (here ? ' here' : from + r < k ? ' before' : ''), title: it.t }, itemIcon(it, 11),
      h('span', { className: 't', textContent: it.t }), h('span', { className: 'y', textContent: here ? 'here' : fmtDate(it) || '' }));
    b.onclick = (e) => { e.stopPropagation(); hide(false); if (!here) act(j); };
    if (here) b.setAttribute('aria-current', 'true');
    return b;
  }));
}
function stayed(label, n) {
  toast(`In: ${label} · ${n}`, { icon: svg('stay', 24), kind: 'mode', sub: `${state.pos + 1} of ${state.order.length} · j/k walk only these · u leaves · Back undoes` });
}
const isIn = (id) => !!state.scope && state.stack?.id === id;

// ---- the title
function blurb(it) {
  if (it.hook) return ['', it.hook];
  const s = summaries.get(it.id);
  if (s && !s.error && (s.why_care || s.gist)) return ['AI summary', s.why_care || s.gist];
  if (it.ab) return ['Abstract', it.ab];
  return ['', it.why || ''];
}
function progressLine(it) {
  const p = progressOf?.(it.id);
  if (!p) return line(progressOf ? 'First visit' : '', 'hp-p');
  const min = Math.round((p.ms || 0) / 60000);
  const what = p.done ? 'Finished' : p.n ? `Seen ${p.seen} of ${plural(p.n, 'page')}` : 'Opened before';
  const el = h('div', { className: 'hp-p' }, h('span', { textContent: [what, plural(p.visits || 1, 'visit'), min ? `${min} min` : 'under a minute'].join(' · ') }));
  if (p.n) el.append(h('i', { className: 'hp-bar', style: `--f:${Math.round(100 * (p.done ? 1 : p.frac || 0))}%` }));
  return el;
}
const FILL = {
  title(it) {
    const [tag, text] = blurb(it);
    const size = it.n ? plural(it.n, 'page') : it.words ? `${Math.max(1, Math.round(it.words / 230))} min read` : '';
    const links = [...head.querySelectorAll('.meta a.src')].map((a) => { const c = a.cloneNode(true); c.removeAttribute('title'); c.className = 'hp-a'; return c; });
    return [
      h('div', { className: 'hp-t' }, itemIcon(it, 13), h('span', { textContent: it.t })),
      it.a && it.a !== it.src ? line(it.a, 'hp-by') : null,
      line([TYPES[typeOf(it)]?.[1], size, fmtDate(it), it.src !== it.a ? it.src : ''].filter(Boolean).join(' · ')),
      text ? h('div', { className: 'hp-d' }, tag ? h('b', { textContent: tag + ' ' }) : null, text) : null,
      progressLine(it),
      links.length ? h('div', { className: 'hp-links' }, ...links, h('span', { className: 'hp-hint', textContent: 'o opens the original' })) : null,
    ];
  },

  lane(it, i) {
    const lane = it.lane, name = LANES[lane] || lane;
    const folders = new Map(); let n = 0, rank = 1, opened = 0, done = 0;
    items.forEach((x, j) => {
      if (x.lane !== lane) return;
      n++;
      if ((x.ord ?? j) < (it.ord ?? i)) rank++;
      const p = progressOf?.(x.id); if (p) { opened++; if (p.done) done++; }
      const f = Array.isArray(x.path) ? x.path[0] : null; if (!f) return;
      const e = folders.get(f) || folders.set(f, { name: f, n: 0, o: Infinity }).get(f);
      e.n++; if ((x.ord ?? j) < e.o) e.o = x.ord ?? j;
    });
    const mine = it.path?.[0];
    let list = [...folders.values()].sort((a, b) => a.o - b.o);
    if (list.length > ROWS) { const keep = list.slice(0, ROWS - 1); if (mine && !keep.some((f) => f.name === mine)) keep.push(folders.get(mine)); else keep.push(list[ROWS - 1]); list = keep.sort((a, b) => a.o - b.o); }
    const walking = state.lane === lane && !state.scope;
    const where = walking ? `${state.pos + 1} of ${n} here, ${SORT_NAME[state.sort] || 'in this order'}` : `No. ${rank} of ${n} in the lane’s own order · ${lanePos()}`;
    const laneItems = () => items.reduce((a, x, j) => (x.lane === lane && a.push(j), a), []);
    return [
      hdr(h('i', { className: 'hp-dot', style: `--c:${LANE_COLORS[lane] || 'var(--ink-3)'}` }), name, plural(COUNTS[lane] || n, 'item')),
      line(where),
      progressOf ? line(opened ? `You have opened ${opened} of them${done ? `, finished ${done}` : ''}` : 'You have not opened any of them before', 'hp-k2') : null,
      list.length ? h('div', { className: 'hp-sec', textContent: `Folders · ${folders.size}` }) : null,
      list.length ? h('div', { className: 'hp-rows' }, ...list.map((f) => {
        const row = h('div', { className: 'hp-frow' + (f.name === mine ? ' here' : '') });
        const b = h('button', { type: 'button', className: 'hp-row', title: state.sort === 'topic' ? `Browse “${f.name}” in the Library` : `Stay in “${f.name}” and list it in the Library (the Library shows folders By topic: S)` }, ic('folder'), h('span', { className: 't', textContent: f.name }), h('span', { className: 'y', textContent: String(f.n) }));
        b.onclick = (e) => { e.stopPropagation(); hide(false); browse(lane, [f.name]); };
        const s = h('button', { type: 'button', className: 'hp-stay', title: `Stay in “${f.name}”: j/k walk only its ${f.n} items · u leaves`, innerHTML: svg('stay', 12) });
        s.setAttribute('aria-label', `Stay in ${f.name}`);
        s.onclick = (e) => { e.stopPropagation(); hide(false); const d = folderStack(lane, [f.name]); if (stayIn(d)) stayed(d.label, d.items.length); };
        row.append(b, s);
        return row;
      })) : null,
      folders.size > list.length ? line(`…and ${folders.size - list.length} more in the Library`, 'hp-f') : null,
      h('div', { className: 'hp-acts' },
        isIn('lane:' + lane) ? button('Leave <kbd>u</kbd>', 'Back to the whole lane', () => leave())
          : state.lane !== lane || state.scope ? button(`${svg('stay', 12)} Stay in ${esc(name)}`, `j/k walk only ${name} · u leaves`, () => { const a = laneItems(); if (stayIn({ kind: 'tag', id: 'lane:' + lane, label: name, crumb: [name], items: a })) stayed(name, a.length); }) : null,
        button('Library <kbd>L</kbd>', `Show ${name} in the Library`, () => browse(lane, it.path?.length ? [it.path[0]] : [], false))),
    ];
  },

  author(it, i) {
    const a = firstAuthor ? firstAuthor(it.a) : it.a;
    let members = a ? byAuthor(a) : [];
    let desc;
    if (members.length >= 2) {
      const site = it.a === it.src;
      desc = { kind: 'tag', id: 'author:' + a.toLowerCase(), label: a, crumb: [a], items: members, what: site ? 'Site' : firstAuthor && a !== it.a ? 'First author' : 'Author', icon: site ? 'site' : 'author' };
    } else if (it.path?.length) {
      const f = folderStack(it.lane, it.path);
      members = f.items; desc = { ...f, what: `Folder · ${f.crumb.join(' › ')}`, icon: 'folder' };
    } else return [hdr(ic('author'), it.a, null), line('Author · no other item by them here')];
    const w = around(members, i);
    const lanes = new Set(members.map((j) => items[j].lane));
    return [
      hdr(ic(desc.icon), desc.label, plural(members.length, 'item')),
      line(desc.what + (lanes.size > 1 ? ` · in ${lanes.size} lanes` : '')),
      rows(w, i, (j) => goTo(j, 'open from header')),
      h('div', { className: 'hp-acts' },
        isIn(desc.id) ? button('Leave <kbd>u</kbd>', 'Back to the whole lane, same item', () => leave())
          : button(`${svg('stay', 12)} Stay in ${esc(desc.label)}`, `j/k walk only these ${members.length} items, ${SORT_NAME[state.sort] || 'in this order'} · u leaves · Back undoes`, () => { if (stayIn(desc)) stayed(desc.label, members.length); }),
        w.n > ROWS ? h('span', { className: 'hp-hint', textContent: `${w.n - w.win.length} more` }) : null),
    ];
  },

  crumb(it, i) {
    if (!state.scope) return null;
    const st = state.stack, w = around(null, i, true);
    return [
      hdr(ic(st.kind === 'folder' ? 'folder' : 'stay'), st.label, `${state.pos + 1} / ${state.order.length}`),
      line(`Staying in ${(st.crumb || [st.label]).join(' › ')} · ${SORT_NAME[state.sort] || 'in this order'}`),
      rows(w, i, (j) => goTo(j, 'open from header')),
      h('div', { className: 'hp-acts' },
        button('Leave <kbd>u</kbd>', `The whole ${LANES[state.lane] || 'lane'} again, same item · Back undoes`, () => leave()),
        button('Library <kbd>L</kbd>', 'Show the stack in the Library', () => emit('stack:show', {}))),
    ];
  },

  date(it) {
    const m = dateOf(it); // [y, month, day?]: it.d, else the month of an arXiv id or a dated address
    const y = m ? +m[0] : it.y; if (!y) return null;
    const when = m ? new Date(Date.UTC(y, +m[1] - 1, +(m[2] || 15))) : new Date(Date.UTC(y, 6, 1));
    const full = m ? when.toLocaleDateString('en-GB', { timeZone: 'UTC', year: 'numeric', month: 'long', ...(m[2] ? { day: 'numeric' } : {}) }) : String(y);
    const what = /^arxiv:/.test(it.id) ? 'arXiv submission' : it.kind === 'scan' ? 'Published' : it.lane === 'lesswrong' || /forum|lesswrong/i.test(it.src || '') ? 'Posted' : 'Dated';
    return [hdr(ic('calendar'), full, null), line(`${what} · ${age(when, m?.[2] ? 'day' : m ? 'month' : 'year')}`)];
  },

  flag() {
    return [
      hdr(h('span', { className: 'hp-i', textContent: '⚑' }), 'Flag a problem for an agent', null),
      h('div', { className: 'hp-d' }, 'Writes a job file in ', h('code', { textContent: 'jobs/open/' }), ' for an agent to fix: it does not open, pages missing or garbled, images broken, wrong title, author, date, lane or folder, or a duplicate.'),
      line('The file names this item and the page. Your note, and a picture of the page only if you tick the box, are public once committed; nothing about your reading goes in.', 'hp-k2'),
      h('div', { className: 'hp-acts' }, button('Flag this item… <kbd>!</kbd>', 'Open the flag dialog', () => openFlag?.())),
    ];
  },
};

/** The item's age in words ("yesterday", "5 months ago", "about 114 years ago"), as precise as its date. */
function age(d, prec) {
  const days = (Date.now() - d.getTime()) / 864e5, years = days / 365.25;
  if (days < -1) return 'in the future';
  if (prec === 'day') {
    if (days < 1) return 'today';
    if (days < 2) return 'yesterday';
    if (days < 14) return `${Math.round(days)} days ago`;
    if (days < 62) return `${Math.round(days / 7)} weeks ago`;
  }
  if (prec === 'month' && days < 45) return 'this month or last';
  if (prec !== 'year' && days < 700) return `${Math.max(2, Math.round(days / 30.44))} months ago`;
  if (years < 1.5) return prec === 'year' ? 'this year or last' : 'about a year ago';
  return `${prec === 'year' ? 'about ' : ''}${Math.round(years)} years ago`;
}

// Items by first author, made once when first asked for.
let AU = null;
on('corpus:changed', () => { AU = null; });
function byAuthor(a) {
  if (!AU) {
    AU = new Map();
    items.forEach((x, j) => { const k = (firstAuthor ? firstAuthor(x.a) : x.a)?.toLowerCase(); if (k) { const l = AU.get(k); if (l) l.push(j); else AU.set(k, [j]); } });
  }
  return AU.get(a.toLowerCase()) || [];
}

/** Browse a lane or a folder in the Library (features/library.js). Its tree is there in By topic;
 *  in the other sorts the Library is a list, so (narrow) the folder becomes the stack instead. */
function browse(lane, path, narrow = true) {
  const d = { lane, path };
  emit('library:show', d);
  if (d.shown || !narrow || !path.length) return;
  const f = folderStack(lane, path);
  if (stayIn(f)) { stayed(f.label, f.items.length); emit('stack:show', {}); }
}
