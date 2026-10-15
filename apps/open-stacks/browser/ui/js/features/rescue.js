// Broken images and dead documents in the reader (server side: routes/14-media.mjs
// and server/rescue.mjs).
//
// Every image in a flow document loads through the local /img route, which
// fetches it once into the disk cache, recognizes broken ones (HTTP errors,
// web pages instead of images, placeholders such as imgur's "removed" and
// region-block images) and looks for another copy (the post's own CDN copy,
// mirrors, the Internet Archive). In the columns:
// - an image whose fate is not known yet reserves a small box, not a big one;
// - an image that cannot be shown becomes a small chip: icon, "Image
//   unavailable", the alt text or caption, links to the original address and
//   to the Internet Archive's list of captures, and "fix…" to paste the
//   address of a copy you found (checked by the server before it is used);
// - a rescued image says where it came from on hover ("via Internet Archive · 2016");
//   any other image offers "wrong image?" on hover, for placeholders the
//   server did not recognize (it learns them and looks again);
// - a document served from the archive says so in the header ("archived copy · Mar 2019").
// Chip labels are drawn by CSS, so summaries, export and read-aloud never see them.
import { $, h, on, toast } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { flowFilters } from '../docs.js';
import { live } from '../flow.js';

const ORIGIN = location.origin;
const viaImg = (u, alt) => `${ORIGIN}/img?u=${encodeURIComponent(u)}${alt ? '&alt=' + encodeURIComponent(alt) : ''}`;
const ours = (src) => src.startsWith(ORIGIN + '/') || src.startsWith('/');
/** What the server told us about each original image URL: {st: ok|rescued|bad|big|pending, w, h, via, ts, from, why, sug}. */
const known = new Map();
const remember = (u, info) => { known.set(u, { ...(known.get(u) || {}), ...info }); if (known.size > 8000) known.delete(known.keys().next().value); };
// Tracking pixels in old imported posts: dropped rather than shown as unavailable.
const TRACKER = /feeds\.feedburner\.com\/~[rf]\/|stats\.wordpress\.com\/[bg]\.gif|pixel\.wp\.com|google-analytics\.com\/(__utm|collect)|doubleclick\.net|quantserve\.com\/pixel|\/(1x1|spacer|pixel)\.(gif|png)(\?|$)/i;

/** srcset candidates [{u, d, n}] (cloudinary URLs contain commas, so only ", " separates). */
function srcset(s) {
  if (!s) return [];
  return s.split(/,\s+(?=\S)/).map((c) => {
    const [u, d = ''] = c.trim().split(/\s+/);
    return { u, d, n: parseFloat(d) || 1 };
  }).filter((c) => c.u);
}
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
function altOf(img) {
  const a = (img.getAttribute('alt') || img.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
  if (a && !/^(image|img|picture|photo|screenshot|untitled|\d+)$/i.test(a)) return a;
  const cap = img.closest('figure')?.querySelector('figcaption')?.textContent.replace(/\s+/g, ' ').trim();
  return cap || '';
}
/** What a chip replaces: the image, or the link around it when the link holds nothing else (no links inside links). */
const slot = (img) => { const a = img.parentElement; return a?.tagName === 'A' && !a.textContent.trim() && a.children.length === 1 ? a : img; };
function sizeIt(img, w, hh) {
  img.style.setProperty('--w', w + 'px'); img.style.setProperty('--r', String(w / hh));
  img.classList.add('rs-sized'); img.classList.remove('rs-wait');
}

// ---------------------------------------------------------------- the chip
function link(doc, cls, href, title) {
  const a = doc.createElement('a');
  Object.assign(a, { className: cls, href, target: '_blank', rel: 'noopener noreferrer', title });
  return a;
}
function chip(doc, img, o, k = {}) {
  const p = slot(img).parentElement;
  const top = !p || p === doc.body || p.classList.contains('flow') || p.matches('figure, div, section, article, center');
  const el = doc.createElement(top ? 'p' : 'span');
  el.className = 'rs-chip';
  if (img.dataset.vp != null) el.dataset.vp = img.dataset.vp;
  el.dataset.orig = o;
  el.title = `Image unavailable${k.why ? ` (${k.why})` : ''}\n${o}`;
  const icon = doc.createElement('span'); icon.className = 'rs-i';
  const label = doc.createElement('span'); label.className = 'rs-l';
  const alt = altOf(img);
  if (alt) label.dataset.alt = clip(alt, 110);
  if (k.st === 'pending') el.classList.add('rs-looking');
  const fix = doc.createElement('span');
  Object.assign(fix, { className: 'rs-fix', tabIndex: 0, title: 'Paste the address of a copy you found (it is checked before it is used)' });
  fix.setAttribute('role', 'button');
  el.append(icon, label, link(doc, 'rs-o', o, 'Open the original address'), link(doc, 'rs-w', 'https://web.archive.org/web/*/' + o, 'The Internet Archive’s captures of this address'), fix);
  for (const s of (k.sug || []).slice(0, 2)) el.append(link(doc, 'rs-s', s, 'A possible copy found by Claude: not verified as the same image'));
  return el;
}
/** The columns on screen measure again (flow.js), after content changed size. */
const remeasure = () => live?.remeasure?.();
/** Swap a broken image for its chip. */
function toChip(img, k) {
  const o = img.dataset.orig;
  const c = chip(document, img, o, k);
  c._img = img;
  slot(img).replaceWith(c);
  remeasure();
  return c;
}
/** Put the image back in place of its chip (a copy was found). */
function fromChip(c) {
  const img = c._img || Object.assign(document.createElement('img'), { decoding: 'async' });
  const o = c.dataset.orig;
  img.dataset.orig = o;
  img.classList.remove('rs-wait');
  const k = known.get(o);
  if (k?.w > 8 && k?.h > 8) sizeIt(img, k.w, k.h);
  img.removeAttribute('srcset');
  img.src = viaImg(o) + '&r=' + Date.now();
  if (c.dataset.vp != null) img.dataset.vp = c.dataset.vp;
  c.replaceWith(img);
  img.addEventListener('load', remeasure, { once: true });
}

// ---------------------------------------------------------------- flow filter
// Runs inside prepareFlow (docs.js), before layout, with width/height still there.
flowFilters.push((doc, it) => {
  const list = [];
  for (const img of [...doc.querySelectorAll('img')]) {
    let src = (img.getAttribute('src') || '').trim();
    if (src.startsWith('//')) src = 'https:' + src; // protocol-relative: not this local server's http
    if (!/^https?:\/\//i.test(src) || ours(src)) continue;
    const pct = /%/.test(img.getAttribute('width') + img.getAttribute('height'));
    const aw = pct ? NaN : parseFloat(img.getAttribute('width')), ah = pct ? NaN : parseFloat(img.getAttribute('height'));
    if ((aw > 0 && aw <= 2 && ah > 0 && ah <= 2) || TRACKER.test(src)) { img.remove(); continue; }
    const set = srcset(img.getAttribute('srcset'));
    const alts = set.filter((c) => c.u !== src && /^https?:\/\//i.test(c.u)).sort((a, b) => b.n - a.n).map((c) => c.u);
    img.dataset.orig = src;
    img.setAttribute('src', viaImg(src, alts[0]));
    if (set.length) img.setAttribute('srcset', set.map((c) => (/^https?:\/\//i.test(c.u) ? viaImg(c.u, src) : c.u) + (c.d ? ' ' + c.d : '')).join(', '));
    const k = known.get(src);
    // Asked again when the document opens: a copy may have been found since (the chip then becomes the image).
    if (!k || k.st === 'pending' || k.st === 'bad') list.push({ u: src, alt: clip(altOf(img), 300) || undefined, w: aw > 8 ? Math.round(aw) : undefined, h: ah > 8 ? Math.round(ah) : undefined, alts: alts.slice(0, 2) });
    if (k?.st === 'bad') { slot(img).replaceWith(chip(doc, img, src, k)); continue; }
    if (!img.classList.contains('wv-sized')) {
      if (k?.w > 8 && k?.h > 8) sizeIt(img, k.w, k.h);
      else if (aw > 8 && ah > 8) sizeIt(img, aw, ah);
      else img.classList.add('rs-wait');
    }
  }
  for (const s of doc.querySelectorAll('picture source[srcset]')) {
    s.setAttribute('srcset', srcset(s.getAttribute('srcset')).map((c) => (/^https?:\/\//i.test(c.u) && !ours(c.u) ? viaImg(c.u) : c.u) + (c.d ? ' ' + c.d : '')).join(', '));
  }
  if (list.length) ask(it, list);
});

/** Tell the server which images a document has (it warms the ones it does not know yet, in the feed). */
async function ask(it, list) {
  try {
    const r = await fetch('/img/info', { method: 'POST', body: JSON.stringify({ item: it.id, page: it.page || it.url, title: it.t, imgs: list, warm: state.view === 'feed' }) });
    const info = await r.json();
    for (const [u, x] of Object.entries(info)) remember(u, x);
    applyKnown();
  } catch { /* server busy: the images report for themselves */ }
}

/** Use what we know on the images on screen that have not loaded yet: a reserved box, or the chip. */
function applyKnown() {
  const flow = live?.flow;
  if (!flow?.isConnected) return;
  let changed = false;
  for (const img of flow.querySelectorAll('img[data-orig]')) {
    if (img.complete && img.naturalWidth > 1) continue;
    const k = known.get(img.dataset.orig);
    if (!k) continue;
    if (k.st === 'bad') toChip(img, k);
    else if (k.w > 8 && k.h > 8 && img.classList.contains('rs-wait')) { sizeIt(img, k.w, k.h); changed = true; }
  }
  // Chips made from what was known when the document opened: a copy found since, or still looking.
  for (const c of flow.querySelectorAll('.rs-chip')) {
    const k = known.get(c.dataset.orig);
    if (k) paintChip(c, c.dataset.orig, k);
  }
  if (changed) remeasure();
}
on('spread:rendered', ({ flow }) => { if (flow && !flow.flow._rs) { flow.flow._rs = true; applyKnown(); } });

// ---------------------------------------------------------------- image events
const reports = [];
let reportT = null;
function report(img, o) {
  const it = live?.it || items[current()];
  reports.push({ u: o, alt: clip(altOf(img), 300) || undefined, w: Number(img.dataset.w) || undefined, h: Number(img.dataset.h) || undefined, item: it?.id, page: it?.page || it?.url, title: it?.t });
  clearTimeout(reportT);
  reportT = setTimeout(() => {
    const batch = reports.splice(0);
    const first = batch[0];
    fetch('/rescue/report', { method: 'POST', body: JSON.stringify({ item: first.item, page: first.page, title: first.title, imgs: batch }) }).catch(() => {});
  }, 400);
}
/** What the server knows about a chip's image, on the chip: the image back if a copy was found;
 *  still looking or not; why it failed; copies Claude suggested. A tracking pixel just goes. */
function paintChip(c, o, info, again = true) {
  if (!c.isConnected) return;
  if (info.st === 'ok' || info.st === 'rescued') { fromChip(c); return; }
  if (info.st === 'bad' && /^tiny/.test(info.why || '')) { c.remove(); remeasure(); return; }
  c.classList.toggle('rs-looking', info.st === 'pending');
  c.title = `Image unavailable${info.why ? ` (${info.why})` : ''}\n${o}`;
  for (const s of (info.sug || []).slice(0, 2)) if (!c.querySelector(`a.rs-s[href="${CSS.escape(s)}"]`)) c.append(link(document, 'rs-s', s, 'A possible copy found by Claude: not verified as the same image'));
  if (info.st === 'pending' && again) watch(c, o);
}
// Chips whose image the server is still looking for: one request for all of them,
// soon at first and then less often (4 s, 8 s, 16 s, 32 s, then every minute, for about 7 minutes).
const watching = new Map(); // original URL -> {c, tries}
let pollT = null;
function watch(c, o) {
  const w = watching.get(o);
  if (w) w.c = c; else watching.set(o, { c, tries: 0 });
  if (!pollT) pollT = setTimeout(poll, Math.min(60e3, 4e3 * 2 ** Math.min(...[...watching.values()].map((x) => x.tries))));
}
async function poll() {
  pollT = null;
  const list = [...watching.keys()].slice(0, 200);
  let info = {};
  try { info = await (await fetch('/img/info', { method: 'POST', body: JSON.stringify({ imgs: list.map((u) => ({ u })) }) })).json(); } catch { /* offline: next time */ }
  for (const o of list) {
    const w = watching.get(o);
    w.tries++;
    const x = info[o];
    if (x) { remember(o, x); paintChip(w.c, o, x, false); }
    if ((x && x.st !== 'pending') || !w.c.isConnected || w.tries >= 10) watching.delete(o);
  }
  if (watching.size && !pollT) pollT = setTimeout(poll, Math.min(60e3, 4e3 * 2 ** Math.min(...[...watching.values()].map((x) => x.tries))));
}
async function explain(c, o) {
  try {
    const info = (await (await fetch('/img/info', { method: 'POST', body: JSON.stringify({ imgs: [{ u: o }] }) })).json())[o];
    if (info) { remember(o, info); paintChip(c, o, info); }
  } catch { /* offline */ }
}
/** An image that could not be shown (a load error, or the server's 1x1 "no image"): its chip. */
function broken(img) {
  if (!img.dataset.orig || !img.isConnected || !img.closest('.flow, #fn-pop')) return;
  const o = img.dataset.orig;
  remember(o, { st: 'bad' });
  const c = toChip(img, known.get(o));
  report(img, o);
  explain(c, o);
}
document.addEventListener('error', (e) => { if (e.target instanceof HTMLImageElement) broken(e.target); }, true);
document.addEventListener('load', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.orig || !img.isConnected) return;
  // /img answers "no image" with a 1x1 GIF (an error status would log a console error per image).
  if (img.naturalWidth === 1 && img.naturalHeight === 1 && ours(img.currentSrc || img.src)) { broken(img); return; }
  img.classList.remove('rs-wait');
  const o = img.dataset.orig, k = known.get(o);
  if (img.naturalWidth && (!k || k.st === 'pending' || !k.w)) remember(o, { st: k?.st === 'rescued' ? 'rescued' : 'ok', w: img.naturalWidth, h: img.naturalHeight });
}, true);

// ---------------------------------------------------------------- fix… (a copy found by hand)
document.addEventListener('click', (e) => {
  const fix = e.target.closest?.('.rs-chip .rs-fix');
  if (!fix) return;
  e.preventDefault(); e.stopPropagation();
  manual(fix.closest('.rs-chip'));
}, true);
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.rs-chip .rs-fix')) { e.preventDefault(); e.stopPropagation(); manual(e.target.closest('.rs-chip')); }
}, true);
async function manual(c) {
  const o = c.dataset.orig;
  const from = prompt('Address of a copy of this image (an image file; it is checked before it is used):', '');
  if (!from || !from.trim()) return;
  toast('Checking that copy…', 4000);
  try {
    const r = await (await fetch('/rescue/manual', { method: 'POST', body: JSON.stringify({ u: o, from: from.trim() }) })).json();
    if (r.st === 'rescued') { remember(o, { st: 'rescued', via: r.via, w: r.w, h: r.h, from: from.trim() }); fromChip(c); toast('Image restored from your copy'); }
    else toast('Could not use it: ' + (r.why || 'not an image'), 3500);
  } catch { toast('The server did not answer', 2500); }
}

// ---------------------------------------------------------------- hover: where it came from / wrong image?
const badge = h('div', { id: 'rs-badge', hidden: true });
let badgeImg = null, hideT = null;
const infoOnce = new Map(); // url -> {p: Promise<info>, t}; asked again after half a minute
function infoFor(o) {
  const hit = infoOnce.get(o);
  if (hit && Date.now() - hit.t < 30e3) return hit.p;
  const p = fetch('/img/info', { method: 'POST', body: JSON.stringify({ imgs: [{ u: o }] }) }).then((r) => r.json()).then((j) => { if (j[o]) remember(o, j[o]); return known.get(o) || {}; }).catch(() => ({}));
  infoOnce.set(o, { p, t: Date.now() });
  if (infoOnce.size > 500) infoOnce.delete(infoOnce.keys().next().value);
  return p;
}
const year = (ts) => (ts ? String(ts).slice(0, 4) : '');
async function showBadge(img) {
  clearTimeout(hideT);
  if (badgeImg === img && !badge.hidden) return;
  badgeImg = img;
  const o = img.dataset.orig;
  const k = await infoFor(o);
  if (badgeImg !== img || !img.isConnected) return;
  badge.replaceChildren();
  if (k.via) {
    const what = k.via === 'Internet Archive' ? `via Internet Archive${k.ts ? ' · ' + year(k.ts) : ''}` : k.via === 'you' ? 'your copy' : `via ${k.via}`;
    badge.append(h('a', { className: 'rs-via', href: k.from || o, target: '_blank', rel: 'noopener noreferrer', textContent: what, title: `The original (${o}) no longer works; this copy came from ${k.from || k.via}` }));
  } else {
    badge.append(h('button', { className: 'rs-flag', textContent: 'wrong image?', title: 'This is a placeholder or the wrong picture: look for the real one', onclick: () => flag(img) }));
  }
  const r = img.getBoundingClientRect();
  badge.hidden = false;
  badge.style.left = Math.max(4, r.left + 6) + 'px';
  badge.style.top = Math.min(innerHeight - 26, r.bottom - 24) + 'px';
}
function hideBadge() { clearTimeout(hideT); hideT = setTimeout(() => { badge.hidden = true; badgeImg = null; }, 250); }
document.addEventListener('mouseover', (e) => {
  const img = e.target.closest?.('.flow img[data-orig]');
  if (img && img.complete && img.naturalWidth > 40 && img.naturalHeight > 24) showBadge(img);
  else if (e.target.closest?.('#rs-badge')) clearTimeout(hideT);
  else if (!badge.hidden) hideBadge();
});
async function flag(img) {
  const o = img.dataset.orig;
  badge.hidden = true;
  toast('Looking for the real image…', 6000);
  try {
    const r = (await (await fetch('/rescue/report', { method: 'POST', body: JSON.stringify({ imgs: [{ u: o, flag: 'placeholder', alt: altOf(img) || undefined }] }) })).json())[o] || {};
    infoOnce.delete(o);
    remember(o, r);
    if (r.st === 'ok' || r.st === 'rescued') {
      img.classList.remove('rs-sized'); img.removeAttribute('srcset');
      img.src = viaImg(o) + '&r=' + Date.now();
      toast(r.via ? `Found it: via ${r.via}${r.ts ? ' (' + year(r.ts) + ')' : ''}` : 'Reloaded the image');
    } else { const c = toChip(img, known.get(o)); if (r.st === 'pending') watch(c, o); toast('No other copy found yet; it will keep looking', 2600); }
  } catch { toast('The server did not answer', 2500); }
}

// ---------------------------------------------------------------- archived documents: a note in the header
const docs = new Map(); // url -> {st, date, from, why, n}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${MONTHS[m[2] - 1]} ${m[1]}` : ''; };
const longDate = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${Number(m[3])} ${MONTHS[m[2] - 1]} ${m[1]}` : 'an earlier date'; };
async function docNote(it) {
  if (!it || !(it.kind === 'web' || it.kind === 'pdf') || !it.url) return;
  let st = docs.get(it.url);
  // Ask again until the document has opened (the archive is consulted while it loads).
  if (!st || (st.st !== 'rescued' && (st.n || 0) < 3 && Date.now() - st.t > 1500)) {
    const n = (st?.n || 0) + 1;
    st = await fetch(`/rescue/doc?u=${encodeURIComponent(it.url)}&kind=${it.kind}&t=${encodeURIComponent(it.t || '')}`).then((r) => r.json()).catch(() => ({}));
    st.n = n; st.t = Date.now();
    docs.set(it.url, st);
  }
  paintNote(it, st);
}
function paintNote(it, st) {
  if (items[current()] !== it) return;
  const meta = $('#item-head .meta');
  if (!meta) return;
  let el = meta.querySelector('.rs-arch');
  if (st.st === 'bad' && st.sug?.length) {
    // Gone, not archived, but Claude found a likely copy (not verified as the same document).
    if (!el) { el = h('a', { className: 'rs-arch', target: '_blank', rel: 'noopener noreferrer' }); meta.append(el); }
    el.href = st.sug[0]; el.textContent = 'possible copy ↗';
    el.title = `The original address no longer works${st.why ? ` (${st.why})` : ''} and the Internet Archive has no copy.\nClaude found this possible copy; it could not be checked as the same document.`;
    return;
  }
  if (st.st !== 'rescued') { el?.remove(); return; }
  if (!el) { el = h('a', { className: 'rs-arch', target: '_blank', rel: 'noopener noreferrer' }); meta.append(el); }
  el.href = st.from || it.url;
  el.textContent = st.via === 'Internet Archive' ? `archived copy · ${shortDate(st.date)}` : `copy · ${st.via}`;
  el.title = `The original address no longer works${st.why ? ` (${st.why})` : ''}: ${it.url}\nThis is ${st.via === 'Internet Archive' ? `the Internet Archive’s copy from ${longDate(st.date)}` : `a copy from ${st.from}`}.`;
}
on('item:shown', ({ it }) => docNote(it));
on('spread:rendered', ({ it }) => docNote(it));

document.body.append(badge);
