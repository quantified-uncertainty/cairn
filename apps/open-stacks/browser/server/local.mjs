// Your own folders: files on this machine, read in place, as the 'local' lane.
//
// Nothing here copies a file into the repository or sends one anywhere. The index
// (metadata read from the files) and converted output (EPUB, Markdown, Word as HTML)
// live under the cache folder, CACHE/local/. server/routes/17-local.mjs serves it.
//
// Pure parts, imported by the tests: parseDirs, openZip, mdToHtml, epubBook,
// htmlDoc, frontMatter, bundleOf, bundleMeta, imageSize(Of), sizeImages, cleanTitle,
// goodTitle, parsePdfinfo, parseMdls, sniffPdf, classify,
// planFolder, and LocalIndex (the scan, the metadata queue and the items).
//
// Item ids are 'local:' + the first 20 hex digits of sha1('<folder name>/<path inside it>'),
// so they survive a restart, a move of the whole folder and an iCloud download
// (an '.X.icloud' placeholder has the id of X).
import { createHash } from 'crypto';
import { openSync, readSync, closeSync, fstatSync, readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, statSync } from 'fs';
import { readdir, lstat } from 'fs/promises';
import { join, dirname, basename, extname, resolve, posix } from 'path';
import { homedir } from 'os';
import { inflateRawSync } from 'zlib';
import { execFile, spawnSync } from 'child_process';

export const sha1 = (s) => createHash('sha1').update(s).digest('hex');
export const idOf = (rootName, rel) => 'local:' + sha1(rootName + '/' + rel).slice(0, 20);
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
export const natural = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);

// ------------------------------------------------------------ configuration ----

export const ICLOUD_DEFAULT = '~/Library/Mobile Documents/com~apple~CloudDocs/Recent Things to Read';
const expandHome = (p) => (p === '~' ? homedir() : p.startsWith('~/') ? join(homedir(), p.slice(2)) : p);
/** Folder list from STACKS_LOCAL_DIRS or the Settings box: separated by ':' or new lines, ~ expanded, absolute, no repeats. */
export function parseDirs(s) {
  const list = Array.isArray(s) ? s : String(s ?? '').split(/[:\n]/);
  const out = [];
  for (const raw of list) {
    const p = String(raw).trim().replace(/^["']|["']$/g, '');
    if (!p) continue;
    const abs = resolve(expandHome(p));
    if (!out.includes(abs)) out.push(abs);
  }
  return out;
}
/** The folders to read: Settings (when saved), else STACKS_LOCAL_DIRS, else the iCloud folder when it exists. */
export function effectiveDirs(saved, env = process.env.STACKS_LOCAL_DIRS) {
  if (Array.isArray(saved)) return { dirs: parseDirs(saved), from: 'settings' };
  if (env != null && String(env).trim()) return { dirs: parseDirs(env), from: 'env' };
  const d = parseDirs(ICLOUD_DEFAULT)[0];
  return existsSync(d) ? { dirs: [d], from: 'default' } : { dirs: [], from: 'none' };
}

// ---------------------------------------------------------------- zip files ----
// EPUB, Word and the zip archives themselves: the central directory, then one
// entry at a time (stored or deflated), with zip64 sizes and offsets.

function readFully(fd, len, pos) {
  const b = Buffer.alloc(len);
  let got = 0;
  while (got < len) { const n = readSync(fd, b, got, len - got, pos + got); if (!n) break; got += n; }
  return got === len ? b : b.subarray(0, got);
}
const utf8ok = (b) => { try { new TextDecoder('utf-8', { fatal: true }).decode(b); return true; } catch { return false; } };
/** Text from bytes: the encoding a BOM gives (UTF-8, UTF-16), else UTF-8 when it is valid (a last
 *  character cut off is fine), else the one an XML or HTML declaration names, else Windows-1252. */
export function decodeText(b) {
  const u = Buffer.isBuffer(b) ? b : Buffer.from(b);
  const dec = (label, x = u) => new TextDecoder(label).decode(x);
  if (u[0] === 0xef && u[1] === 0xbb && u[2] === 0xbf) return dec('utf-8', u.subarray(3));
  if (u[0] === 0xff && u[1] === 0xfe) return dec('utf-16le', u.subarray(2));
  if (u[0] === 0xfe && u[1] === 0xff) return dec('utf-16be', u.subarray(2));
  if (u[0] === 0x3c && u[1] === 0 && u[2] === 0x3f && u[3] === 0) return dec('utf-16le'); // '<?xml' in UTF-16, no BOM
  if (u[0] === 0 && u[1] === 0x3c && u[2] === 0 && u[3] === 0x3f) return dec('utf-16be');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u, { stream: true }); } catch { /* not UTF-8 */ }
  const head = u.subarray(0, 1024).toString('latin1');
  const named = /^\s*<\?xml[^>]*encoding\s*=\s*["']([\w.:-]+)/i.exec(head)?.[1] || /<meta[^>]+charset\s*=\s*["']?([\w.:-]+)/i.exec(head)?.[1];
  for (const label of [named, 'windows-1252']) { if (label) try { return dec(label); } catch { /* not a label TextDecoder knows */ } }
  return u.toString('latin1');
}

/** openZip(file) → { entries: Map name → {name, method, csize, size, off, flags}, read(name, max), text(name), close() } */
export function openZip(file) {
  const fd = openSync(file, 'r');
  try {
    const size = fstatSync(fd).size;
    const tl = Math.min(size, 65557);
    const tail = readFully(fd, tl, size - tl);
    let e = -1;
    for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('not a zip file');
    let count = tail.readUInt16LE(e + 10), cdSize = tail.readUInt32LE(e + 12), cdOff = tail.readUInt32LE(e + 16);
    if ((count === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) && e >= 20 && tail.readUInt32LE(e - 20) === 0x07064b50) {
      const z = readFully(fd, 56, Number(tail.readBigUInt64LE(e - 20 + 8)));
      if (z.length === 56 && z.readUInt32LE(0) === 0x06064b50) { count = Number(z.readBigUInt64LE(32)); cdSize = Number(z.readBigUInt64LE(40)); cdOff = Number(z.readBigUInt64LE(48)); }
    }
    if (cdSize > 64 * 1024 * 1024 || cdOff + cdSize > size) throw new Error('zip directory out of range');
    const cd = readFully(fd, cdSize, cdOff);
    const entries = new Map();
    let p = 0;
    for (let k = 0; k < count && p + 46 <= cd.length; k++) {
      if (cd.readUInt32LE(p) !== 0x02014b50) break;
      const flags = cd.readUInt16LE(p + 8), method = cd.readUInt16LE(p + 10);
      let csize = cd.readUInt32LE(p + 20), usize = cd.readUInt32LE(p + 24), off = cd.readUInt32LE(p + 42);
      const nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32);
      const nb = cd.subarray(p + 46, p + 46 + nl);
      const name = (flags & 0x800) || utf8ok(nb) ? nb.toString('utf-8') : nb.toString('latin1');
      for (let x = p + 46 + nl, xe = x + xl; x + 4 <= xe;) {
        const id = cd.readUInt16LE(x), len = cd.readUInt16LE(x + 2);
        if (id === 1) {
          let q = x + 4;
          if (usize === 0xffffffff && q + 8 <= x + 4 + len) { usize = Number(cd.readBigUInt64LE(q)); q += 8; }
          if (csize === 0xffffffff && q + 8 <= x + 4 + len) { csize = Number(cd.readBigUInt64LE(q)); q += 8; }
          if (off === 0xffffffff && q + 8 <= x + 4 + len) { off = Number(cd.readBigUInt64LE(q)); q += 8; }
        }
        x += 4 + len;
      }
      if (!name.endsWith('/')) entries.set(name, { name, method, csize, size: usize, off, flags });
      p += 46 + nl + xl + cl;
    }
    let closed = false;
    const z = {
      entries, size,
      /** The entry's bytes, inflated; max caps what one entry may grow to (zip bombs). */
      read(name, max = 256 * 1024 * 1024) {
        const en = entries.get(name);
        if (!en) throw new Error('no such entry: ' + name);
        if (en.flags & 1) throw new Error('encrypted entry');
        if (en.size > max) throw new Error('entry too large');
        const h = readFully(fd, 30, en.off);
        if (h.length < 30 || h.readUInt32LE(0) !== 0x04034b50) throw new Error('bad local header');
        const data = readFully(fd, en.csize, en.off + 30 + h.readUInt16LE(26) + h.readUInt16LE(28));
        if (en.method === 0) return data;
        if (en.method === 8) return inflateRawSync(data, { maxOutputLength: Math.max(1, Math.min(max, en.size || max)) });
        throw new Error('unsupported compression method ' + en.method);
      },
      text(name, max) { return decodeText(z.read(name, max)); }, // UTF-16 chapters, Latin-1 ones that say so
      close() { if (!closed) { closed = true; closeSync(fd); } },
    };
    return z;
  } catch (e) { try { closeSync(fd); } catch { /* closed */ } throw e; }
}
/** Find an entry ignoring case (EPUBs made on case-insensitive disks get it wrong). */
const findEntry = (z, name) => (z.entries.has(name) ? name : [...z.entries.keys()].find((k) => k.toLowerCase() === name.toLowerCase()) || null);

// ------------------------------------------------------------ titles, names ----

const BAD_TITLE = /^(untitled(-\d+)?|title|document\d*|doc\d*|print|layout \d+|cover|book|ebook|pdf|draft|final|new document|microsoft word|adobe acrobat|unknown|none|null|n\/?a|\d+)$/i;
const FILE_LIKE = /\.(pdf|docx?|indd|idml|qxp|qxd|pages|rtf|txt|ai|psd|tex|dvi|ps|eps|html?|xhtml|md|odt|pub|sla|key|pptx?|xlsx?)$/i;
/** A cleaned file name as a title: no extension, underscores (and dashes in a name with no spaces) as spaces. */
export function cleanTitle(name) {
  let t = String(name).replace(/\.[A-Za-z0-9]{1,5}$/, '');
  const spaced = /\s/.test(t);
  t = t.replace(/^[a-z0-9-]+\.(com|net|org|io|info)[\s_-]+/i, ''); // a download site's name in front
  t = t.replace(/_+/g, ' ');
  if (!spaced) t = t.replace(/-+/g, ' ').replace(/(?<=[A-Za-z])\.(?=[A-Za-z])/g, ' ');
  t = t.replace(/(\w{4,})pdf\b/gi, '$1').replace(/(\s+pdf)?(\s+free)?$/i, '').replace(/\s+pdf$/i, ''); // download artefacts: "…rulebookpdf pdf free"
  t = t.replace(/\b([A-Za-z]{2,}) s\b(?=\s|$)/g, "$1's"); // "Player s Book": an apostrophe lost to an underscore
  t = t.replace(/\s+/g, ' ').trim();
  if (t && t === t.toLowerCase()) t = t[0].toUpperCase() + t.slice(1);
  return t || String(name);
}
const baseName = (n) => String(n).replace(/\.[A-Za-z0-9]{1,5}$/, '');
// A folder name that says little on its own ("maps", "assets", "audio") is shown after the folder it is in.
const GENERIC = /^(maps?|assets?|images?|img|pics?|pictures?|art|artwork|tokens?|handouts?|audio|sounds?|music|ost|mp3s?|extras?|files?|scans?|media|misc|other|resources?|downloads?)$/i;
/** A metadata title worth showing, or null: not a placeholder, a file name or an export artefact. */
export function goodTitle(t) {
  if (t == null) return null;
  let s = String(t).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^microsoft (word|powerpoint) - /i, '');
  if (s.length < 3 || s.length > 220 || !/\p{L}{2}/u.test(s)) return null;
  if (BAD_TITLE.test(s) || FILE_LIKE.test(s) || /^[\w.-]+$/.test(s) && /[_]/.test(s)) return null;
  if (/^(c|\/|[a-z]:\\|\\\\|\/users\/|\/home\/)/i.test(s) && /[\\/]/.test(s)) return null;
  return s;
}
const BAD_AUTHOR = /^(admin(istrator)?|user|owner|unknown|author|microsoft office user|default|test|me|pc|mac|anonymous|none|null|n\/?a|\d+)$/i;
export const goodAuthor = (a) => { const s = String(a ?? '').replace(/\s+/g, ' ').trim(); return s.length >= 2 && s.length <= 200 && /\p{L}/u.test(s) && !BAD_AUTHOR.test(s) ? s : null; };
const yearOf = (s) => { const m = /(1[5-9]\d\d|20\d\d)/.exec(String(s ?? '')); const y = m ? Number(m[1]) : null; return y && y <= new Date().getFullYear() + 1 ? y : null; };
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

// --------------------------------------------------------------- Markdown ----
// A small CommonMark-ish converter: headings (ATX and setext), paragraphs, emphasis,
// strong, strikethrough, code spans and fenced or indented code, links (inline,
// reference, autolinks, bare URLs), images, nested lists (task lists too),
// block quotes, rules and simple tables. Raw HTML is shown as text, except a few
// attribute-free inline tags (<br>, <sup>, <kbd>…).

const slug = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/&\w+;/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-').slice(0, 80);
const indentOf = (l) => l.length - l.trimStart().length;
const LIST_RE = /^( {0,3})([-*+]|\d{1,9}[.)])(?:([ \t]+)(.*)|$)/;
const startsBlock = (l) => /^ {0,3}(#{1,6}(\s|$)|>|```|~~~|([-*_])(\s*\3){2,}\s*$)/.test(l) || LIST_RE.test(l);
const isTableSep = (l) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(l) && l.includes('-') && (l.includes('|') || /^\s*:?-+:?\s*$/.test(l) === false);
function splitRow(l) {
  let s = l.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = []; let cur = '', code = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') code = !code;
    if (c === '|' && !code) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

/** YAML-ish front matter: {data, body}. `key: value`, `key: [a, b]` and block lists
 *  (`key:` then `- a` lines) are read; lists become arrays, keys lower case. */
export function frontMatter(src) {
  const text = String(src ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const fm = /^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/.exec(text);
  if (!fm) return { data: {}, body: text };
  const data = {}, unq = (s) => s.trim().replace(/^(["'])(.*)\1$/, '$2');
  let list = null;
  for (const line of fm[1].split('\n')) {
    const item = list && /^\s*-\s+(.*)$/.exec(line);
    if (item) { list.push(unq(item[1])); continue; }
    const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    list = null;
    if (!v) { data[k] = list = []; continue; }
    const arr = /^\[(.*)\]$/.exec(v);
    data[k] = arr ? arr[1].split(',').map(unq).filter(Boolean) : unq(v);
  }
  return { data, body: text.slice(fm[0].length) };
}

/** mdToHtml(src, {url(u, isImage) → u}) → {html, title, meta} */
export function mdToHtml(src, opts = {}) {
  const ctx = { url: opts.url || ((u) => u), refs: new Map(), heads: [], ids: new Map() };
  const { data, body } = frontMatter(src);
  let text = body.replace(/\t/g, '    ');
  const meta = {};
  for (const [k, v] of Object.entries(data)) meta[k] = Array.isArray(v) ? v.join(', ') : v;
  // Link reference definitions (outside code fences).
  const lines = [];
  let fence = null;
  for (const l of text.split('\n')) {
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(l);
    if (f) { if (!fence) fence = f[1]; else if (f[1][0] === fence[0] && f[1].length >= fence.length && !l.trim().slice(f[1].length).trim()) fence = null; }
    const d = !fence && /^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/.exec(l);
    if (d) { ctx.refs.set(d[1].trim().toLowerCase(), { u: d[2], t: d[3] ?? d[4] ?? d[5] }); continue; }
    lines.push(l);
  }
  const html = mdBlocks(lines, ctx);
  const h1 = ctx.heads.find((x) => x[0] === 1) || ctx.heads[0];
  return { html, title: meta.title || (h1 ? decodeEnt(h1[1].replace(/<[^>]+>/g, '')).trim() : null), meta };
}
function heading(n, raw, ctx) {
  const inner = mdInline(raw.trim(), ctx);
  let id = slug(inner) || 'section';
  const k = ctx.ids.get(id) || 0; ctx.ids.set(id, k + 1); if (k) id += '-' + k;
  ctx.heads.push([n, inner]);
  return `<h${n} id="${esc(id)}">${inner}</h${n}>`;
}
function mdBlocks(lines, ctx) {
  const out = [], para = [];
  const flush = () => { if (para.length) { out.push(`<p>${mdInline(para.join('\n'), ctx)}</p>`); para.length = 0; } };
  let i = 0, m;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flush(); i++; continue; }
    if ((m = /^( {0,3})(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/.exec(line))) {
      flush();
      const f = m[2], body = [], strip = m[1].length;
      i++;
      while (i < lines.length && !(new RegExp(`^ {0,3}${f[0] === '`' ? '`' : '~'}{${f.length},}\\s*$`).test(lines[i]))) body.push(lines[i++].replace(new RegExp(`^ {0,${strip}}`), ''));
      i++;
      out.push(`<pre><code${m[3] ? ` class="language-${esc(m[3])}"` : ''}>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    if ((m = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/.exec(line))) { flush(); out.push(heading(m[1].length, m[2] || '', ctx)); i++; continue; }
    if (para.length && (m = /^ {0,3}(=+|-+)[ \t]*$/.exec(line))) { const t = para.join(' '); para.length = 0; out.push(heading(m[1][0] === '=' ? 1 : 2, t, ctx)); i++; continue; }
    if (/^ {0,3}([-*_])([ \t]*\1){2,}[ \t]*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }
    if (/^ {0,3}>/.test(line)) {
      flush();
      const body = [];
      while (i < lines.length && lines[i].trim()) {
        if (/^ {0,3}>/.test(lines[i])) body.push(lines[i].replace(/^ {0,3}> ?/, ''));
        else if (!startsBlock(lines[i])) body.push(lines[i]); // a lazy continuation line
        else break;
        i++;
      }
      out.push(`<blockquote>${mdBlocks(body, ctx)}</blockquote>`);
      continue;
    }
    if (LIST_RE.test(line) && !(para.length && /^\s*\d/.test(line) && !/^ {0,3}1[.)]/.test(line))) { flush(); const r = mdList(lines, i, ctx); out.push(r.html); i = r.i; continue; }
    if (!para.length && line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line), al = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /^-+:$/.test(c) ? 'right' : /^:-+$/.test(c) ? 'left' : ''));
      if (head.length === al.length || al.length >= 1) {
        const cell = (tag, c, j) => `<${tag}${al[j] ? ` style="text-align:${al[j]}"` : ''}>${mdInline(c, ctx)}</${tag}>`;
        const rows = [];
        i += 2;
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) { const r = splitRow(lines[i++]); rows.push(`<tr>${head.map((_, j) => cell('td', r[j] ?? '', j)).join('')}</tr>`); }
        out.push(`<table><thead><tr>${head.map((c, j) => cell('th', c, j)).join('')}</tr></thead>${rows.length ? `<tbody>${rows.join('')}</tbody>` : ''}</table>`);
        continue;
      }
    }
    if (!para.length && /^ {4}/.test(line)) {
      flush();
      const body = [];
      while (i < lines.length && (/^ {4}/.test(lines[i]) || !lines[i].trim())) body.push(lines[i++].slice(4));
      while (body.length && !body.at(-1).trim()) body.pop();
      out.push(`<pre><code>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    para.push(line.replace(/^\s+/, '')); // trailing spaces stay: two of them break the line
    i++;
  }
  flush();
  return out.join('\n');
}
function mdList(lines, i, ctx) {
  const first = LIST_RE.exec(lines[i]);
  const ordered = /\d/.test(first[2]), base = first[1].length, bullet = first[2].slice(-1);
  const start = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  let cur = null, loose = false, blank = false;
  while (i < lines.length) {
    const l = lines[i];
    const m = LIST_RE.exec(l);
    if (m && m[1].length <= base + 1 && /\d/.test(m[2]) === ordered && m[2].slice(-1) === bullet && (!cur || indentOf(l) < cur.cin)) {
      if (blank && cur) loose = true;
      cur = { lines: [m[4] ?? ''], cin: m[1].length + m[2].length + Math.min(4, (m[3] || ' ').length) };
      items.push(cur); blank = false; i++; continue;
    }
    if (!l.trim()) {
      let j = i + 1; while (j < lines.length && !lines[j].trim()) j++;
      if (j >= lines.length || !cur) break;
      const n = LIST_RE.exec(lines[j]);
      const sibling = n && n[1].length <= base + 1 && /\d/.test(n[2]) === ordered && n[2].slice(-1) === bullet;
      if (indentOf(lines[j]) >= cur.cin || sibling) { cur.lines.push(''); blank = true; i++; continue; }
      break;
    }
    if (cur && indentOf(l) >= cur.cin) { if (blank && !LIST_RE.test(l.slice(cur.cin))) loose = true; cur.lines.push(l.slice(cur.cin)); blank = false; i++; continue; }
    if (cur && !blank && !startsBlock(l)) { cur.lines.push(l.trim()); i++; continue; } // lazy continuation
    if (cur && !blank && LIST_RE.test(l) && indentOf(l) > base) { cur.lines.push(l.slice(Math.min(indentOf(l), cur.cin))); i++; continue; }
    break;
  }
  const lis = items.map((it) => {
    while (it.lines.length && !it.lines.at(-1).trim()) it.lines.pop();
    let first = it.lines[0] || '', box = '';
    const t = /^\[( |x|X)\][ \t]+/.exec(first);
    if (t) { box = `<input type="checkbox" disabled${t[1] !== ' ' ? ' checked' : ''}> `; it.lines[0] = first.slice(t[0].length); }
    let inner = mdBlocks(it.lines, ctx);
    if (!loose) inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, '$1').replace(/\n<p>([\s\S]*?)<\/p>$/, '\n$1');
    return `<li${box ? ' class="task"' : ''}>${box}${inner}</li>`;
  });
  const tag = ordered ? 'ol' : 'ul';
  return { html: `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ''}>${lis.join('\n')}</${tag}>`, i };
}
const INLINE_TAGS = 'br|sup|sub|kbd|b|i|em|strong|u|s|mark|small|abbr|cite|q|dfn|del|ins|var|samp';
function mdInline(s, ctx) {
  const slots = [];
  const keep = (html) => `\u0000${slots.push(html) - 1}\u0000`;
  const attr = (v) => esc(v);
  const link = (href, title, inner) => `<a href="${attr(ctx.url(href, false))}"${title ? ` title="${attr(title)}"` : ''}>${inner}</a>`;
  const img = (src, alt, title) => `<img src="${attr(ctx.url(src, true))}" alt="${attr(alt)}"${title ? ` title="${attr(title)}"` : ''}>`;
  const ref = (k) => ctx.refs.get(String(k).trim().toLowerCase().replace(/\s+/g, ' '));
  // TeX math, as pandoc reads it: $$display$$, \[display\], \(inline\), and $inline$ (no space
  // inside the dollars, no digit after the closing one, so "$5 and $10" stays text). The reader
  // renders span.math-tex with KaTeX (features/webview.js); without it the TeX stays readable.
  s = s.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<![\\$\w])\$(?=[^\s$])((?:[^$\\]|\\[\s\S])+?)(?<=[^\s\\])\$(?![\d$])/g,
    (_, d1, d2, i1, i2) => keep(`<span class="math-tex">${esc(d1 ?? d2 ? `\\[${(d1 ?? d2).trim()}\\]` : `\\(${(i1 ?? i2).trim()}\\)`)}</span>`));
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!|~<>$])/g, (_, c) => keep(esc(c)));
  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, b, c) => keep(`<code>${esc(c.replace(/\n/g, ' ').replace(/^ ([\s\S]*) $/, '$1'))}</code>`));
  s = s.replace(/<((?:https?|mailto|ftp):[^\s<>]+)>/gi, (_, u) => keep(link(u, null, esc(u))));
  s = s.replace(new RegExp(`<(/?)(${INLINE_TAGS})\\s*/?>`, 'gi'), (_, sl, t) => keep(`<${sl}${t.toLowerCase()}>`));
  const DEST = String.raw`(?:<([^>\n]*)>|([^\s()]*(?:\([^\s()]*\)[^\s()]*)*))(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)`;
  s = s.replace(new RegExp(String.raw`!\[([^\]]*)\]\(\s*` + DEST, 'g'), (_, alt, d1, d2, t1, t2) => keep(img(d1 ?? d2, alt, t1 ?? t2)));
  s = s.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (all, alt, k) => { const r = ref(k || alt); return r ? keep(img(r.u, alt, r.t)) : all; });
  const rest = (t) => emph(esc(t).replace(/&amp;(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/gi, '&$1;')); // &copy; &#169; stay entities
  s = s.replace(new RegExp(String.raw`\[((?:[^\]\\]|\\.)+)\]\(\s*` + DEST, 'g'), (_, txt, d1, d2, t1, t2) => keep(link(d1 ?? d2, t1 ?? t2, rest(txt))));
  s = s.replace(/\[((?:[^\]\\]|\\.)+)\](?:\[([^\]]*)\])?/g, (all, txt, k) => { const r = ref(k || txt); return r ? keep(link(r.u, r.t, rest(txt))) : all; });
  s = rest(s);
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<\u0000]*[^\s<\u0000.,:;"')\]!?])/g, (_, pre, u) => pre + keep(link(u.replace(/&amp;/g, '&'), null, u)));
  s = s.replace(/(?: {2,}|\\)\n/g, '<br>\n');
  for (let k = 0; k < 3 && s.includes('\u0000'); k++) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => slots[n]);
  return s;
}
function emph(s) {
  return s
    .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/\*(?=[^\s*])([\s\S]*?[^\s*])\*/g, '<em>$1</em>')
    .replace(/(^|[^\w])_(?=[^\s_])([\s\S]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
}

// ------------------------------------------------------------ HTML clean-up ----
// The client sanitizes again with the DOM (features/local.js); this keeps scripts
// and event handlers out of what is served, and points relative links somewhere.

const VOID = 'area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr|image|path|rect|circle|line|polyline|polygon|ellipse|use|stop|feImage';
/** Body HTML without scripts, styles, frames, forms or handlers; relative URLs through url(v, isImage). */
export function cleanHtml(html, url = (u) => u) {
  let s = String(html);
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(script|style|noscript|iframe|frame|frameset|object|embed|form|template|head|title|button|select|textarea)\b[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<\/?(script|style|link|meta|base|iframe|frame|object|embed|form|input|button|select|textarea|html|body|head|animate|animateMotion|animateTransform|set|discard)\b[^>]*>/gi, (t) => (/^<input\b[^>]*type\s*=\s*["']?checkbox/i.test(t) ? t : '')); // SVG animation could set an href to javascript:
  s = s.replace(new RegExp(`<((?!(?:${VOID})\\b)[a-zA-Z][\\w:-]*)(\\s[^<>]*?)?\\s*/>`, 'g'), '<$1$2></$1>');
  s = s.replace(/\s(on[a-z]+|formaction|srcdoc)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/\s(srcset)\s*=\s*("[^"]*"|'[^']*')/gi, '');
  s = s.replace(/(\s(?:src|href|xlink:href|poster|data))\s*=\s*("([^"]*)"|'([^']*)'|([^\s>"']+))/gi, (all, a, _q, d, sq, bare, off, str) => {
    const v = (d ?? sq ?? bare ?? '').replace(/&amp;/g, '&').trim();
    const tagStart = str.lastIndexOf('<', off);
    const tag = (/^<([a-zA-Z:]+)/.exec(str.slice(tagStart, off + 1)) || [])[1]?.toLowerCase() || '';
    const isImg = tag === 'img' || tag === 'image' || tag === 'audio' || tag === 'video' || tag === 'source' || /poster/i.test(a);
    let out;
    if (/^\s*(javascript|vbscript):/i.test(v) || (/^\s*data:/i.test(v) && !(isImg && /^\s*data:image\//i.test(v)))) out = '#';
    else out = url(v, isImg);
    return `${a}="${esc(out)}"`;
  });
  return s;
}
const bodyOf = (html) => { const m = /<body\b[^>]*>([\s\S]*?)(?:<\/body>|$)/i.exec(html); return m ? m[1] : html.replace(/<head\b[\s\S]*?<\/head>/i, ''); };
const decodeEnt = (s) => String(s).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const textOf = (html) => decodeEnt(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** A local HTML file: {html (body, cleaned), title}. */
export function htmlDoc(buf, url) {
  let raw = Buffer.isBuffer(buf) ? buf.toString('latin1') : String(buf);
  const cs = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(raw.slice(0, 4096))?.[1]?.toLowerCase();
  if (Buffer.isBuffer(buf) && !/^(iso-8859-1|latin-?1|windows-1252|us-ascii|ascii)$/.test(cs || '')) raw = decodeText(buf);
  const title = textOf(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(raw)?.[1] || '') || textOf(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(raw)?.[1] || '') || null;
  return { html: cleanHtml(bodyOf(raw), url), title };
}

// ------------------------------------------------------------------ bundles ----
// A folder that is one document (docs/authoring.md): named "*.stack", or holding an
// index.md / index.html at its top. Its text is the index file, its pictures come from
// inside it through /local/rel, its subfolders are not Library folders, and its facts
// come from front matter or the HTML head, with stack.json beside the index on top.

export const STACK_DIR = /\.stack$/i;
const INDEX_ORDER = ['index.md', 'index.markdown', 'index.html', 'index.htm', 'index.xhtml'];
const COVER = /^cover\.(jpe?g|png|webp|avif|gif)$/i;
/** bundleOf(folderName, fileNames, subfolderNames?) → null (an ordinary folder) | {index: name | null, itype: 'md' | 'html' | null, cover: name | null, sidecar: name | null}.
 *  index.md comes before index.html (an HTML file beside it is usually made from it); a .stack folder
 *  without an index file takes its first Markdown or HTML file. A folder holding only one HTML file
 *  and an images/ folder (Google Docs' "Web page (.html, zipped)" export, unzipped) is a bundle too. */
export function bundleOf(dirName, names, dirs = []) {
  const low = new Map(names.filter((n) => !n.startsWith('.')).map((n) => [n.toLowerCase(), n]));
  let index = INDEX_ORDER.map((n) => low.get(n)).find(Boolean) || null;
  if (!index && !STACK_DIR.test(dirName)) {
    const files = [...low.values()], subs = dirs.filter((d) => !d.startsWith('.') && d !== '__MACOSX');
    if (files.length !== 1 || TYPES[extname(files[0]).slice(1).toLowerCase()] !== 'html' || subs.length !== 1 || subs[0].toLowerCase() !== 'images') return null;
    index = files[0];
  }
  if (!index) index = [...low.values()].filter((n) => ['md', 'html'].includes(TYPES[extname(n).slice(1).toLowerCase()])).sort(natural)[0] || null;
  return {
    index, itype: index ? TYPES[extname(index).slice(1).toLowerCase()] : null,
    cover: [...low.values()].filter((n) => COVER.test(n)).sort()[0] || null,
    sidecar: low.get('stack.json') || null,
  };
}
/** A path inside a bundle as written in stack.json ("images/cover.jpg"), or null: relative, no dot segments. */
export const safeRel = (p) => (typeof p === 'string' && p && !/^[\\/]|^[a-z][a-z0-9+.-]*:|\\|\0/i.test(p) && p.split('/').every((s) => s && !s.startsWith('.')) ? p : null);
const metaTags = (head) => {
  const out = {};
  for (const m of String(head).matchAll(/<meta\b[^>]*>/gi)) {
    const k = (attrOf(m[0], 'name') || attrOf(m[0], 'property') || '').toLowerCase(), v = attrOf(m[0], 'content');
    if (k && v != null) (out[k] ||= []).push(v.trim());
  }
  return out;
};
/** A bundle's facts: {title, author, year, date, url, summary, tags, cover} from the index file's
 *  head (Markdown front matter, or <title>, <meta name="author|date|dcterms.date|description|keywords">,
 *  <link rel="canonical">) and stack.json (same field names; it wins). */
export function bundleMeta({ text = '', type = null, sidecar = null } = {}) {
  const f = {};
  const list = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : String(v).split(type === 'html' ? /\s*,\s*/ : /\s*[;,]\s*|\s+and\s+/)).map((x) => String(x).trim()).filter(Boolean);
  if (type === 'md') {
    const { data } = frontMatter(text);
    const m = mdToHtml(text.length < 64 * 1024 ? text : text.slice(0, text.lastIndexOf('\n')));
    Object.assign(f, { title: m.title, authors: list(data.authors ?? data.author), date: data.date, url: data.source ?? data.url, summary: data.summary ?? data.description ?? data.abstract, tags: list(data.tags ?? data.keywords) });
  } else if (type === 'html') {
    const head = /<head\b[\s\S]*?(?:<\/head>|<body\b)/i.exec(text)?.[0] || text.slice(0, 16384);
    const mt = metaTags(head);
    const canon = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => /\srel\s*=\s*["']?canonical\b/i.test(t));
    Object.assign(f, {
      title: htmlDoc(text).title, authors: (mt.author || mt['dc.creator'] || mt.citation_author || []).flatMap((a) => list(a)),
      date: (mt.date || mt['dcterms.date'] || mt['dc.date'] || mt.citation_date || mt['article:published_time'] || [])[0],
      url: canon ? attrOf(canon, 'href') : null, summary: (mt.description || mt['og:description'] || [])[0], tags: (mt.keywords || []).flatMap((k) => list(k)),
    });
  }
  let side = null;
  if (sidecar != null) { try { side = JSON.parse(Buffer.isBuffer(sidecar) ? decodeText(sidecar) : String(sidecar)); } catch { side = null; } }
  if (side && typeof side === 'object' && !Array.isArray(side)) {
    const str = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : null);
    if (str(side.title)) f.title = str(side.title);
    if (side.authors != null || side.author != null) f.authors = list(side.authors ?? side.author).filter((a) => typeof a === 'string' || typeof a === 'number');
    if (str(side.date)) f.date = str(side.date);
    if (str(side.source ?? side.url)) f.url = str(side.source ?? side.url);
    if (str(side.summary ?? side.description)) f.summary = str(side.summary ?? side.description);
    if (side.tags != null) f.tags = list(side.tags);
    if (safeRel(side.cover)) f.cover = side.cover;
  }
  const date = String(f.date ?? '').trim();
  const day = /^(\d{4}-\d{2}-\d{2})\b/.exec(date)?.[1];
  const tags = [...new Set((f.tags || []).map((t) => String(t).toLowerCase().trim().replace(/\s+/g, '-')).filter((t) => t && t.length <= 60))].slice(0, 20);
  return {
    title: f.title ? decodeEnt(String(f.title)).trim() || null : null,
    author: (f.authors || []).map(String).join(', ') || null,
    year: yearOf(date), date: day && !Number.isNaN(Date.parse(day)) ? day : null,
    url: /^https?:\/\/\S+$/i.test(String(f.url ?? '').trim()) ? String(f.url).trim() : null,
    summary: f.summary ? decodeEnt(String(f.summary)).replace(/\s+/g, ' ').trim().slice(0, 1200) || null : null,
    tags, cover: f.cover || null,
  };
}

/** Pixel size of an image from its first bytes: PNG, JPEG (EXIF rotation applied), GIF, WebP,
 *  AVIF, BMP and SVG (width/height or viewBox). read(len, pos) → Buffer. → [w, h] | null */
export function imageSizeOf(read) {
  const b = read(64, 0);
  if (b.length < 24) return /<svg/i.test(b.toString('latin1')) ? svgSize(read(8192, 0).toString('utf-8')) : null;
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('latin1', 0, 4) === 'GIF8') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.toString('latin1', 0, 2) === 'BM') return [b.readInt32LE(18), Math.abs(b.readInt32LE(22))];
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const c = b.toString('latin1', 12, 16);
    if (c === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (c === 'VP8L') return [1 + (((b[22] & 0x3f) << 8) | b[21]), 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6))];
    if (c === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    return null;
  }
  if (b.toString('latin1', 4, 8) === 'ftyp') { // AVIF / HEIF: the 'ispe' property
    const s = read(65536, 0); const k = s.indexOf('ispe');
    return k > 0 && k + 16 <= s.length ? [s.readUInt32BE(k + 8), s.readUInt32BE(k + 12)] : null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let pos = 2, turn = false;
    for (let n = 0; n < 400; n++) {
      const m = read(4, pos);
      if (m.length < 4 || m[0] !== 0xff) return null;
      const mk = m[1], len = m.readUInt16BE(2);
      if (mk === 0xff) { pos++; continue; }
      if (mk === 0xe1) { const x = read(Math.min(len, 65536), pos + 4); turn = exifTurned(x); }
      if ((mk >= 0xc0 && mk <= 0xcf) && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) {
        const f = read(9, pos); if (f.length < 9) return null; // FF Cn, length, precision, height, width
        const hh = f.readUInt16BE(5), w = f.readUInt16BE(7);
        return turn ? [hh, w] : [w, hh];
      }
      pos += 2 + len;
    }
    return null;
  }
  const t = read(8192, 0).toString('utf-8');
  return /<svg\b/i.test(t) ? svgSize(t) : null;
}
/** EXIF orientation 5-8: the picture is shown turned a quarter, width and height swap. */
function exifTurned(x) {
  if (x.toString('latin1', 0, 6) !== 'Exif\0\0') return false;
  const t = x.subarray(6), le = t.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o)), u32 = (o) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o));
  try {
    const ifd = u32(4), n = u16(ifd);
    for (let k = 0; k < n; k++) { const e = ifd + 2 + 12 * k; if (u16(e) === 0x0112) return u16(e + 8) >= 5 && u16(e + 8) <= 8; }
  } catch { /* cut short */ }
  return false;
}
function svgSize(t) {
  const tag = /<svg\b[^>]*>/i.exec(t)?.[0]; if (!tag) return null;
  const px = (v) => { const m = /^\s*([\d.]+)\s*(px)?\s*$/.exec(v || ''); return m ? Number(m[1]) : NaN; };
  const w = px(attrOf(tag, 'width')), hh = px(attrOf(tag, 'height'));
  if (w > 0 && hh > 0) return [Math.round(w), Math.round(hh)];
  const vb = (attrOf(tag, 'viewBox') || '').trim().split(/[\s,]+/).map(Number);
  return vb.length === 4 && vb[2] > 0 && vb[3] > 0 ? [Math.round(vb[2]), Math.round(vb[3])] : null;
}
/** imageSize(file) → [w, h] | null (reads the header only). */
export function imageSize(file) {
  let fd; try { fd = openSync(file, 'r'); } catch { return null; }
  try { const s = imageSizeOf((len, pos) => readFully(fd, len, pos)); return s && s[0] > 0 && s[1] > 0 && s[0] < 1e5 && s[1] < 1e5 ? s : null; } catch { return null; } finally { closeSync(fd); }
}
/** width and height on each <img> that has neither, from sizeOf(src) → [w, h] | null; at most max lookups,
 *  so the reader keeps each picture's box before it loads and the pages do not move. */
export function sizeImages(html, sizeOf, max = 400) {
  let n = 0;
  return String(html).replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\s(width|height)\s*=/i.test(tag) || n >= max) return tag;
    const src = attrOf(tag, 'src'); if (!src) return tag;
    n++;
    const s = sizeOf(src);
    return s ? tag.replace(/\s*\/?>$/, (end) => ` width="${s[0]}" height="${s[1]}"${end}`) : tag;
  });
}

// ------------------------------------------------------------------- EPUB ----
// container.xml → the OPF package → the spine's XHTML, in order, one <section> each.
// Ids are prefixed per chapter (c3-…) and links between chapters become #anchors;
// images and other files inside the book go through asset(entryPath).

const attrOf = (tag, name) => { const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag); return m ? decodeEnt(m[2] ?? m[3]) : null; };
const resolveIn = (dir, href) => { try { return posix.normalize(posix.join(dir, decodeURIComponent(href))).replace(/^(\.\.\/)+/, '').replace(/^\.\//, ''); } catch { return posix.normalize(posix.join(dir, href)); } };
/** EPUB metadata only (cheap): {title, authors, date, lang}. */
export function epubMeta(file) {
  const z = openZip(file);
  try { return readOpf(z).meta; } finally { z.close(); }
}
function readOpf(z) {
  const cn = findEntry(z, 'META-INF/container.xml');
  if (!cn) throw new Error('not an EPUB (no META-INF/container.xml)');
  const cont = z.text(cn, 1e6);
  const path = attrOf(/<rootfile\b[^>]*>/i.exec(cont)?.[0] || '', 'full-path');
  const opfPath = path && findEntry(z, path);
  if (!opfPath) throw new Error('EPUB package file missing');
  const opf = z.text(opfPath, 8e6);
  const dc = (tag) => [...opf.matchAll(new RegExp(`<dc:${tag}\\b[^>]*>([\\s\\S]*?)</dc:${tag}>`, 'gi'))].map((m) => textOf(m[1])).filter(Boolean);
  const meta = { title: dc('title')[0] || null, authors: dc('creator'), date: dc('date')[0] || null, lang: dc('language')[0] || null };
  const base = posix.dirname(opfPath) === '.' ? '' : posix.dirname(opfPath);
  const manifest = new Map();
  for (const m of opf.matchAll(/<(?:opf:)?item\b[^>]*>/gi)) {
    const id = attrOf(m[0], 'id'), href = attrOf(m[0], 'href');
    if (id && href) manifest.set(id, { href, type: attrOf(m[0], 'media-type') || '', path: resolveIn(base, href.split('#')[0]) });
  }
  const spine = [...opf.matchAll(/<(?:opf:)?itemref\b[^>]*>/gi)].map((m) => ({ idref: attrOf(m[0], 'idref'), linear: attrOf(m[0], 'linear') })).filter((x) => manifest.has(x.idref));
  return { meta, manifest, spine, opfPath };
}
/** epubBook(file, {asset(entryPath) → url}) → {html, title, authors, date, lang, chapters} */
export function epubBook(file, { asset = (p) => p, max = 60 * 1024 * 1024 } = {}) {
  const z = openZip(file);
  try {
    const { meta, manifest, spine } = readOpf(z);
    const docs = spine.map((s) => manifest.get(s.idref)).filter((it) => /x?html|xml/i.test(it.type) || /\.(x?html?|xml)$/i.test(it.path));
    const chapterOf = new Map(docs.map((d, n) => [d.path, n]));
    const parts = [];
    let total = 0;
    docs.forEach((d, n) => {
      const name = findEntry(z, d.path);
      if (!name || total > max) return;
      let x = z.text(name, 32 * 1024 * 1024);
      total += x.length;
      const dir = posix.dirname(d.path) === '.' ? '' : posix.dirname(d.path);
      x = bodyOf(x);
      x = x.replace(/(\s(?:id|name))\s*=\s*("([^"]*)"|'([^']*)')/gi, (all, a, _q, v1, v2) => (/name/i.test(a) && !/\sid=/i.test(all) ? all : ` id="c${n}-${esc(v1 ?? v2)}"`));
      x = cleanHtml(x, (v, isImg) => {
        if (!v || /^(https?|mailto|ftp|data):/i.test(v)) return v; // data: (cleanHtml has vetted it)
        if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '#'; // file:, an app's own scheme…
        const [p, frag] = v.split('#');
        const target = p ? resolveIn(dir, p) : d.path;
        if (chapterOf.has(target)) { const m = chapterOf.get(target); return frag ? `#c${m}-${frag}` : `#c${m}`; }
        const en = findEntry(z, target);
        return en ? asset(en) : isImg ? '' : '#';
      });
      parts.push(`<section id="c${n}" class="lc-ch">${x}</section>`);
    });
    if (!parts.length) throw new Error('EPUB has no readable chapters');
    return { html: parts.join('\n'), ...meta, chapters: parts.length };
  } finally { z.close(); }
}
/** Word (docx) metadata from docProps/core.xml: {title, authors, date}. */
export function docxMeta(file) {
  const z = openZip(file);
  try {
    const n = findEntry(z, 'docProps/core.xml'); if (!n) return {};
    const x = z.text(n, 1e6);
    const get = (t) => textOf(new RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)</${t}>`, 'i').exec(x)?.[1] || '') || null;
    return { title: get('dc:title'), authors: [get('dc:creator')].filter(Boolean), date: get('dcterms:created') };
  } finally { z.close(); }
}

// --------------------------------------------------------------- PDF facts ----

/** pdfinfo's output → {title, author, year, n}. */
export function parsePdfinfo(out) {
  const f = {};
  for (const line of String(out).split('\n')) { const m = /^([A-Za-z ]+?):\s*(.*)$/.exec(line); if (m && !(m[1] in f)) f[m[1].trim()] = m[2].trim(); }
  return { title: f.Title || null, author: f.Author || null, year: yearOf(f.CreationDate), n: Number(f.Pages) || null };
}
/** mdls -name kMDItemTitle -name kMDItemAuthors -name kMDItemNumberOfPages -name kMDItemContentCreationDate → {title, author, year, n}. */
export function parseMdls(out) {
  const s = String(out), get = (k) => new RegExp(`^${k}\\s*=\\s*([\\s\\S]*?)(?=^kMDItem|(?![\\s\\S]))`, 'm').exec(s)?.[1].trim();
  const str = (v) => (v == null || v === '(null)' ? null : v.replace(/^"([\s\S]*)"$/, '$1').replace(/\\"/g, '"'));
  const authors = get('kMDItemAuthors');
  const list = authors && authors !== '(null)' ? [...authors.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]) : [];
  return { title: str(get('kMDItemTitle')), author: list.join(', ') || null, year: yearOf(get('kMDItemContentCreationDate')), n: Number(get('kMDItemNumberOfPages')) || null };
}
/** No poppler: the page count and Info title from the first and last 256 KB of an uncompressed PDF. */
export function sniffPdf(file) {
  const fd = openSync(file, 'r');
  try {
    const size = fstatSync(fd).size, K = 256 * 1024;
    const head = readFully(fd, Math.min(size, K), 0).toString('latin1');
    const tail = size > K ? readFully(fd, Math.min(size - K, K), size - Math.min(size - K, K)).toString('latin1') : '';
    const s = head + '\n' + tail;
    let n = null;
    for (const m of s.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)) n = Math.max(n || 0, Number(m[1] || m[2]));
    const lit = /\/Title\s*\(((?:[^()\\]|\\.)*)\)/.exec(s)?.[1];
    let title = null;
    if (lit != null) {
      const raw = lit.replace(/\\([nrtbf()\\])/g, (_, c) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[c] ?? c)).replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
      title = raw.startsWith('þÿ') ? Buffer.from(raw.slice(2), 'latin1').swap16().toString('utf16le') : raw;
    }
    const year = yearOf(/\/CreationDate\s*\(D:(\d{4})/.exec(s)?.[1]);
    return { title, author: null, year, n };
  } finally { closeSync(fd); }
}

// ------------------------------------------------------------- what a file is ----

const TYPES = {
  pdf: 'pdf', epub: 'epub', md: 'md', markdown: 'md', mdown: 'md', mkd: 'md', mkdn: 'md',
  html: 'html', htm: 'html', xhtml: 'html', txt: 'txt', text: 'txt',
  docx: 'word', doc: 'word', rtf: 'word', odt: 'word', webarchive: 'word', wordml: 'word',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', avif: 'image', bmp: 'image',
  mp3: 'audio', m4a: 'audio', aac: 'audio', wav: 'audio', ogg: 'audio', oga: 'audio', opus: 'audio', flac: 'audio',
  zip: 'archive', rar: 'archive', '7z': 'archive', cbz: 'comic', cbr: 'comic', cb7: 'comic',
  mobi: 'kindle', azw: 'kindle', azw3: 'kindle', kfx: 'kindle', djvu: 'djvu', djv: 'djvu', pages: 'pages',
};
export const MIME = {
  pdf: 'application/pdf', epub: 'application/epub+zip', md: 'text/markdown; charset=utf-8', markdown: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', xhtml: 'application/xhtml+xml', txt: 'text/plain; charset=utf-8', text: 'text/plain; charset=utf-8',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac',
  zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword', rtf: 'application/rtf',
  css: 'text/css', xml: 'application/xml', json: 'application/json', mp4: 'video/mp4', webm: 'video/webm', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf',
};
export const mimeOf = (name) => MIME[extname(name).slice(1).toLowerCase()] || 'application/octet-stream';
const PARTIAL = /\.(crdownload|part|partial|download|tmp|temp|swp)$/i;
/** classify(name) → {skip: reason} | {type, ext, real?: name, stub?: true}. Dotfiles and .DS_Store are skipped; '.X.icloud' is X, not downloaded. */
export function classify(name) {
  const st = /^\.(.+)\.icloud$/.exec(name);
  if (st && !st[1].startsWith('.')) { const c = classify(st[1]); return c.skip ? c : { ...c, real: st[1], stub: true }; }
  if (name.startsWith('.') || name === 'Icon\r' || name === 'desktop.ini' || name === 'Thumbs.db') return { skip: 'hidden' };
  if (PARTIAL.test(name) || /^~\$|^\.~lock/.test(name)) return { skip: 'partial' };
  const ext = extname(name).slice(1).toLowerCase();
  const type = TYPES[ext];
  return type ? { type, ext } : { skip: 'other', ext };
}
const BUNDLE = /\.(app|photoslibrary|bundle|framework|plugin|kext|xcodeproj|xcworkspace|lproj|rtfd|pages|numbers|key|band|fcpbundle|imovielibrary|musiclibrary|tvlibrary)$/i;
const norm = (s) => String(s).toLowerCase().replace(/\.[a-z0-9]{1,4}$/, '').replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * planFolder(files, subdirNames) → the entries a folder contributes, before metadata:
 *   files: [{name, type, ext, stub?, real?}]; images and audio, two or more of a kind,
 *   become one gallery or playlist; an archive beside a folder of the same name
 *   (it was unpacked there) is left out.
 * → [{kind: 'file' | 'gallery' | 'playlist', files: [...], name}]
 */
export function planFolder(files, subdirs = []) {
  const subs = new Set(subdirs.map(norm));
  const out = [], imgs = [], auds = [];
  for (const f of files) {
    if (f.type === 'archive' && subs.has(norm(f.real || f.name))) continue;
    if (!f.stub && f.type === 'image') imgs.push(f);
    else if (!f.stub && f.type === 'audio') auds.push(f);
    else out.push({ kind: 'file', files: [f], name: f.real || f.name });
  }
  for (const [list, kind] of [[imgs, 'gallery'], [auds, 'playlist']]) {
    if (list.length >= 2) out.push({ kind, files: list.sort((a, b) => natural(a.name, b.name)), name: '' });
    else for (const f of list) out.push({ kind: 'file', files: [f], name: f.name });
  }
  return out;
}

// ------------------------------------------------------------------ the index ----

const TOOL = (cmd, args = ['-v']) => { try { const r = spawnSync(cmd, args, { stdio: 'ignore', timeout: 3000 }); return !(r.error && r.error.code === 'ENOENT'); } catch { return false; } };
const KIND_LABEL = { pdf: 'PDF', epub: 'EPUB', md: 'Markdown', html: 'web page', txt: 'text', word: 'Word document', image: 'image', audio: 'audio', archive: 'archive', comic: 'comic book archive', kindle: 'Kindle book', djvu: 'DjVu', pages: 'Pages document', bundle: 'bundle' };
export const sizeText = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e6 ? Math.round(b / 1e6) + ' MB' : b >= 1e3 ? Math.round(b / 1e3) + ' KB' : b + ' bytes');
const shq = (p) => `'${String(p).replace(/'/g, `'\\''`)}'`;
const run = (cmd, args, ms = 15000) => new Promise((res) => execFile(cmd, args, { timeout: ms, maxBuffer: 4 * 1024 * 1024, encoding: 'utf-8' }, (e, out) => res(e && !out ? null : out)));

/**
 * The index of every configured folder. scan() walks them (fast: names and stats);
 * metadata (titles, authors, years, page counts) follows from a background queue,
 * cached in CACHE/local/meta.json by path, size and modified time.
 * items: the client's items (corpus.json's format, lane 'local'); v: their version.
 */
export class LocalIndex {
  constructor({ dirs = [], cacheDir, order = 'name', autoAI = false, platform = process.platform, tools = null, maxFiles = 20000, maxDepth = 14, onChange = () => {} } = {}) {
    Object.assign(this, { dirs, cacheDir, order, autoAI, platform, maxFiles, maxDepth, onChange });
    this.tools = tools || {
      pdfinfo: TOOL('pdfinfo'),
      mdls: platform === 'darwin' && TOOL('mdls', ['-help']),
      textutil: platform === 'darwin' && TOOL('textutil', ['-help']),
      brctl: platform === 'darwin' && TOOL('brctl', ['help']),
    };
    this.items = []; this.byId = new Map(); this.v = '0'; this.roots = []; this.scanning = null; this.scans = 0; this.lastScan = 0;
    this.metaFile = cacheDir ? join(cacheDir, 'meta.json') : null;
    this.meta = new Map();
    if (this.metaFile) { try { this.meta = new Map(Object.entries(JSON.parse(readFileSync(this.metaFile, 'utf-8')))); } catch { /* first run */ } }
    this.queue = []; this.working = 0; this.metaT = null; this.saveT = null;
  }
  /** Walk the folders again (one walk at a time; a call during a walk runs one more after it). */
  scan() {
    if (this.scanning) { this.again = true; return this.scanning; }
    this.scanning = this._scan().catch((e) => { console.warn('local: scan failed:', e.message); }).finally(() => {
      this.scanning = null;
      if (this.again) { this.again = false; this.scan(); }
    });
    return this.scanning;
  }
  async _scan() {
    const t0 = Date.now();
    const names = new Map();
    const roots = this.dirs.map((dir) => {
      let name = basename(dir) || dir;
      const k = (names.get(name) || 0) + 1; names.set(name, k); if (k > 1) name += ` (${k})`;
      return { dir, name, n: 0, ok: false, error: null, skipped: {}, truncated: false };
    });
    const entries = [];
    let files = 0;
    for (const root of roots) {
      const why = (e) => (e.code === 'ENOENT' ? 'not found' : e.code === 'EACCES' || e.code === 'EPERM' ? 'no permission (on a Mac: System Settings › Privacy & Security › Files and Folders, or Full Disk Access, for the app that runs node)' : e.message);
      try { const st = statSync(root.dir); if (!st.isDirectory()) throw new Error('not a folder'); root.ok = true; } catch (e) { root.error = why(e); continue; }
      const skip = (why, n = 1) => { root.skipped[why] = (root.skipped[why] || 0) + n; };
      const walk = async (abs, rel, depth) => {
        let list;
        try { list = await readdir(abs, { withFileTypes: true }); } catch (e) { if (!rel) { root.ok = false; root.error = why(e); } else skip('unreadable folder'); return { n: 0, newest: 0, here: [], subs: [] }; }
        // A bundle (a subfolder, never a configured folder itself): one item in the folder above; what is inside is its own.
        const bu = rel ? bundleOf(basename(rel), list.filter((d) => d.isFile()).map((d) => d.name), list.filter((d) => d.isDirectory()).map((d) => d.name)) : null;
        if (bu) {
          if (files >= this.maxFiles) { root.truncated = true; return { n: 0, newest: 0, here: [], subs: [] }; }
          const st = async (n) => (n ? lstat(join(abs, n)).catch(() => null) : null);
          const [ist, cst, sst] = [await st(bu.index), await st(bu.cover), await st(bu.sidecar)];
          if (bu.index && !ist) bu.index = null;
          files++;
          const mtimeMs = Math.max(0, ...[ist, cst, sst].filter(Boolean).map((s) => s.mtimeMs));
          const cloud = ist && this.platform === 'darwin' && ist.size > 4096 && ist.blocks === 0 ? 'evicted' : null;
          const e = {
            root, dirRel: rel, depth, kind: 'bundle', type: 'bundle', itype: bu.index ? bu.itype : null, ext: 'bundle', up: true,
            dir: abs, abs: bu.index ? join(abs, bu.index) : null, rel: rel + '/#bundle', name: basename(rel), size: ist?.size || 0,
            mtimeMs: mtimeMs || (await lstat(abs).catch(() => ({ mtimeMs: 0 }))).mtimeMs, birthtimeMs: ist?.birthtimeMs || 0, files: [], cloud,
            cover: cst ? bu.cover : null, sidecar: sst ? join(abs, bu.sidecar) : null, sideSize: sst?.size || 0,
          };
          return { n: 1, newest: e.mtimeMs, here: [e], subs: [] };
        }
        const fileRows = [], dirs = [];
        for (const d of list) {
          const name = d.name;
          if (d.isSymbolicLink()) { skip('link'); continue; }
          if (d.isDirectory()) {
            if (name.startsWith('.') || name === 'node_modules' || name === '__MACOSX' || BUNDLE.test(name)) { skip('hidden'); continue; }
            dirs.push(name); continue;
          }
          if (!d.isFile()) continue;
          const c = classify(name);
          if (c.skip) { skip(c.skip === 'other' && c.ext ? '.' + c.ext : c.skip); continue; }
          if (files >= this.maxFiles) { root.truncated = true; continue; }
          let st; try { st = await lstat(join(abs, name)); } catch { continue; }
          if (!c.stub && st.size === 0) { skip('empty'); continue; }
          if (c.type === 'word' && !this.tools.textutil) { skip('Word needs macOS (textutil)'); continue; }
          files++;
          // macOS 14+ keeps an iCloud file that is not downloaded as a 'dataless' file: full size, no blocks.
          const cloud = c.stub ? 'stub' : this.platform === 'darwin' && st.size > 4096 && st.blocks === 0 ? 'evicted' : null;
          fileRows.push({ ...c, name, abs: join(abs, name), rel: rel ? rel + '/' + name : name, size: st.size, mtimeMs: st.mtimeMs, birthtimeMs: st.birthtimeMs, cloud });
        }
        const subs = [];
        if (depth < this.maxDepth) for (const dn of dirs.sort(natural)) subs.push({ name: dn, ...(await walk(join(abs, dn), rel ? rel + '/' + dn : dn, depth + 1)) });
        else if (dirs.length) skip('too deep', dirs.length);
        // An '.X.icloud' placeholder beside X itself (a download under way): X only, or both would have X's id.
        const here0 = new Set(fileRows.filter((f) => !f.stub).map((f) => f.name));
        const plan = planFolder(fileRows.filter((f) => !f.stub || !here0.has(f.real)), dirs);
        const here = [];
        for (const p of plan) {
          const f = p.files[0];
          const base = { root, dirRel: rel, depth, mtimeMs: Math.max(...p.files.map((x) => x.mtimeMs)), files: p.files };
          if (p.kind === 'file') here.push({ ...base, kind: 'file', type: f.type, ext: f.ext, abs: f.stub ? join(dirname(f.abs), f.real) : f.abs, rel: f.stub ? (rel ? rel + '/' + f.real : f.real) : f.rel, name: f.real || f.name, size: f.size, birthtimeMs: f.birthtimeMs, cloud: f.cloud, stubAbs: f.stub ? f.abs : null });
          else here.push({ ...base, kind: p.kind, type: p.kind, rel: (rel ? rel + '/' : '') + '#' + p.kind, name: basename(rel) || root.name, size: p.files.reduce((s, x) => s + x.size, 0) });
        }
        const total = here.length + subs.reduce((s, x) => s + x.n, 0);
        // A folder of nothing but pictures (or sound): its gallery stands in for it, in the folder above.
        if (rel && here.length === 1 && here[0].kind !== 'file' && subs.every((x) => !x.n)) { here[0].up = true; }
        const newest = Math.max(0, ...here.map((x) => x.mtimeMs), ...subs.map((x) => x.newest));
        return { n: total, newest, here, subs };
      };
      const tree = await walk(root.dir, '', 0);
      root.tree = tree;
      const visit = (node) => {
        for (const e of node.here) { entries.push(e); root.n++; }
        for (const s of node.subs) visit(s);
      };
      visit(tree);
    }
    this.roots = roots;
    this.entries = entries;
    this.scans++; this.lastScan = Date.now(); this.scanMs = Date.now() - t0;
    this.build();
    // Metadata for what is new or changed, in the background.
    for (const e of entries) if (this.needsMeta(e) && !this.meta.has(this.metaKey(e))) this.queue.push(e);
    this.pump();
  }
  // |2: titles read again after the reader learned UTF-16 and Latin-1 text (bump when readMeta changes).
  metaKey(e) { return `${e.abs || e.dir}|${e.size}${e.kind === 'bundle' ? '+' + (e.sideSize || 0) : ''}|${Math.round(e.mtimeMs)}|2`; }
  needsMeta(e) { return e.kind === 'bundle' ? !!(e.abs || e.sidecar) : e.kind === 'file' && !e.stubAbs && ['pdf', 'epub', 'md', 'html', 'txt', 'word'].includes(e.type); }
  pump() {
    while (this.working < 3 && this.queue.length) {
      const e = this.queue.shift();
      const k = this.metaKey(e);
      if (this.meta.has(k)) continue;
      this.working++;
      this.readMeta(e).catch(() => ({})).then((m) => {
        this.meta.set(k, m || {});
        this.working--;
        clearTimeout(this.metaT); this.metaT = setTimeout(() => { this.build(); this.saveMeta(); }, this.queue.length || this.working ? 400 : 30);
        this.pump();
      });
    }
  }
  /** Settled: the scan under way and the metadata it queued are done (tests, and a first /local/items.json). */
  async settled(ms = 20000) {
    const t = Date.now();
    while (Date.now() - t < ms && (this.scanning || this.queue.length || this.working)) await new Promise((r) => setTimeout(r, 20));
    clearTimeout(this.metaT); this.build(); this.saveMeta(true);
  }
  close() { clearTimeout(this.metaT); clearTimeout(this.saveT); this.queue.length = 0; }
  /** meta.json, a second after the last change (now: at once); only entries for files still there. */
  saveMeta(now = false) {
    if (!this.metaFile) return;
    clearTimeout(this.saveT);
    const save = () => {
      const live = new Set((this.entries || []).map((e) => this.metaKey(e)));
      const o = {}; for (const [k, v] of this.meta) if (live.has(k)) o[k] = v;
      try { mkdirSync(dirname(this.metaFile), { recursive: true }); writeFileSync(this.metaFile + '.tmp', JSON.stringify(o)); renameSync(this.metaFile + '.tmp', this.metaFile); } catch (e) { console.warn('local: meta.json:', e.message); }
    };
    if (now) return save();
    this.saveT = setTimeout(save, 1000);
    this.saveT.unref?.();
  }
  async readMeta(e) {
    const f = e.abs;
    if (e.kind === 'bundle') {
      let text = '', sidecar = null;
      if (f && !e.cloud) { const fd = openSync(f, 'r'); try { text = decodeText(readFully(fd, 64 * 1024, 0)); } finally { closeSync(fd); } }
      if (e.sidecar) { const fd = openSync(e.sidecar, 'r'); try { sidecar = readFully(fd, 256 * 1024, 0); } finally { closeSync(fd); } }
      return bundleMeta({ text, type: e.itype, sidecar });
    }
    if (e.type === 'pdf') {
      // A file iCloud has not downloaded is never read here (that would download it): Spotlight knows its facts.
      if (e.cloud && this.tools.mdls) return parseMdls(await run('mdls', ['-name', 'kMDItemTitle', '-name', 'kMDItemAuthors', '-name', 'kMDItemNumberOfPages', '-name', 'kMDItemContentCreationDate', f]) || '');
      if (e.cloud) return {};
      if (this.tools.pdfinfo) { const out = await run('pdfinfo', ['-enc', 'UTF-8', f]); if (out) return parsePdfinfo(out); }
      if (this.tools.mdls) { const out = await run('mdls', ['-name', 'kMDItemTitle', '-name', 'kMDItemAuthors', '-name', 'kMDItemNumberOfPages', '-name', 'kMDItemContentCreationDate', f]); if (out) return parseMdls(out); }
      return sniffPdf(f);
    }
    if (e.cloud) return {};
    if (e.type === 'epub') { const m = epubMeta(f); return { title: m.title, author: m.authors.join(', ') || null, year: yearOf(m.date), lang: m.lang }; }
    if (e.type === 'word') { if (e.ext !== 'docx') return {}; const m = docxMeta(f); return { title: m.title, author: m.authors?.join(', ') || null, year: yearOf(m.date) }; }
    const fd = openSync(f, 'r'); let raw; try { raw = readFully(fd, 64 * 1024, 0); } finally { closeSync(fd); } // not the whole file
    const head = decodeText(raw);
    if (e.type === 'md') { const m = mdToHtml(head.length < 64 * 1024 ? head : head.slice(0, head.lastIndexOf('\n'))); return { title: m.title, author: m.meta.author || null, year: yearOf(m.meta.date) }; }
    if (e.type === 'html') return { title: htmlDoc(head).title };
    if (e.type === 'txt') {
      const t = /^\s*Title:\s*(.+)$/m.exec(head.slice(0, 4000))?.[1], a = /^\s*Author:\s*(.+)$/m.exec(head.slice(0, 4000))?.[1];
      return { title: t?.trim() || null, author: a?.trim() || null };
    }
    return {};
  }
  /** The items, from the entries and what metadata has arrived; bumps v when they change. */
  build() {
    const entries = this.entries || [];
    const one = this.roots.filter((r) => r.ok).length <= 1;
    // Tree order: in each folder its own files, then its subfolders; by name (natural:
    // 2 before 10), or newest first. Name is the default: series, chapters, sheets and
    // a book's 'spreads' and 'pages' versions stay together, and Newest (S) gives the other.
    const byFolder = new Map();
    for (const e of entries) {
      const dir = e.up ? posix.dirname(e.dirRel) === '.' ? '' : posix.dirname(e.dirRel) : e.dirRel;
      const k = e.root.name + '\u0001' + dir;
      if (!byFolder.has(k)) byFolder.set(k, []);
      byFolder.get(k).push(e);
    }
    const newestFirst = this.order === 'newest';
    // Names without their extensions, so "Guide.pdf" comes before "Guide_Spreads.pdf".
    const cmp = (a, b) => (newestFirst ? b.mtimeMs - a.mtimeMs : 0) || natural(a.up ? basename(a.dirRel) : baseName(a.name), b.up ? basename(b.dirRel) : baseName(b.name));
    const items = [], byId = new Map();
    let ord = 0;
    const emit = (root, dir, node) => {
      const k = root.name + '\u0001' + dir;
      for (const e of (byFolder.get(k) || []).sort(cmp)) { const it = this.itemOf(e, ord++, one); items.push(it); byId.set(it.id, { e, it }); }
      const subs = node.subs.slice();
      if (newestFirst) subs.sort((a, b) => b.newest - a.newest || natural(a.name, b.name));
      for (const s of subs) emit(root, dir ? dir + '/' + s.name : s.name, s);
    };
    for (const root of this.roots) if (root.tree) emit(root, '', root.tree);
    const v = sha1(JSON.stringify(items)).slice(0, 12);
    // Files that went away keep answering (the page says so) until the browser reloads.
    for (const [id, x] of this.byId) if (!byId.has(id)) byId.set(id, { e: x.e, it: x.it, gone: true });
    this.byId = byId;
    if (v !== this.v) { this.items = items; this.v = v; this.onChange(this); }
  }
  itemOf(e, ord, oneRoot) {
    const root = e.root;
    const dir = e.up ? (posix.dirname(e.dirRel) === '.' ? '' : posix.dirname(e.dirRel)) : e.dirRel;
    const sub = dir ? dir.split('/') : [];
    const id = idOf(root.name, e.rel);
    const m = ((e.kind === 'file' || e.kind === 'bundle') && this.meta.get(this.metaKey(e))) || {};
    const ver = Math.round(e.mtimeMs).toString(36) + e.size.toString(36);
    const fileUrl = `/local/file/${id}?v=${ver}`, docUrl = `/local/doc/${id}?v=${ver}`;
    let kind = 'html', url = docUrl, page = e.kind === 'file' && !e.stubAbs ? fileUrl : undefined;
    let t;
    if (e.kind === 'gallery' || e.kind === 'playlist') {
      const what = e.kind === 'gallery' ? 'images' : 'audio';
      const own = basename(e.dirRel) || root.name, above = basename(posix.dirname(e.dirRel));
      const named = GENERIC.test(own.trim()) && e.dirRel.includes('/') ? `${cleanTitle(above)}: ${cleanTitle(own).toLowerCase()}` : cleanTitle(own);
      t = e.up ? named : `${named}: ${what}`;
    } else {
      t = goodTitle(m.title) || cleanTitle(e.name);
      if (!/\p{L}/u.test(t)) t = `${cleanTitle(basename(e.dirRel) || root.name)} (${t})`; // "1638415655271.pdf": the folder says more
      if (!e.stubAbs && e.type === 'pdf') { kind = 'pdf'; url = fileUrl; }
      else if (!e.stubAbs && e.type === 'txt') { kind = 'text'; url = fileUrl; }
    }
    const where = oneRoot ? ['Your folder', ...sub] : [root.name, ...sub];
    let why = where.join(' › ');
    if (e.stubAbs) why += ` · in iCloud, not downloaded to this Mac yet. To fetch it, run in Terminal: brctl download ${shq(e.abs)}`;
    else if (e.cloud === 'evicted') why += ` · in iCloud, not on this Mac yet: it downloads when you open it (or run brctl download ${shq(e.abs)})`;
    const d = e.mtimeMs >= Date.UTC(1995, 0, 1) ? e.mtimeMs : e.birthtimeMs >= Date.UTC(1995, 0, 1) ? e.birthtimeMs : null;
    const it = {
      id, lane: 'local', kind, t: t.normalize('NFC'), url, ...(page ? { page } : {}), // NFC: a Mac file name may spell é as e + ́, and search types é
      ...(goodAuthor(m.author) ? { a: goodAuthor(m.author) } : {}),
      ...(m.year ? { y: m.year } : {}),
      ...(d ? { d: isoDay(d) } : {}),
      ...(kind === 'pdf' && m.n ? { n: m.n } : {}),
      path: [root.name, ...sub], ord, why, src: 'local', q: 0.5,
      private: !this.autoAI, ...(e.stubAbs ? {} : { size: e.size }), ext: e.kind === 'file' ? e.ext : e.kind,
      ...(e.files.length > 1 ? { count: e.files.length } : {}),
      ...(e.cloud ? { cloud: e.cloud } : {}),
    };
    if (e.kind === 'bundle') {
      // The source it was made from is the "original" (the header's link); a stated date wins over the file's.
      if (m.url) it.page = m.url;
      if (m.date) it.d = m.date;
      if (m.summary) it.ab = m.summary;
      if (m.tags?.length) it.tags = m.tags;
      const cover = m.cover || e.cover;
      if (cover) it.cover = `/local/rel/${id}/${cover.split('/').map(encodeURIComponent).join('/')}?v=${ver}`;
    }
    return it;
  }
  /** {e, it, gone?} for an id, or null. */
  get(id) { return this.byId.get(id) || null; }
  /** [first spread on disk, share on disk] for /ready: files here are [1, 1]; iCloud files not downloaded [0, 0]. */
  ready(id) { const x = this.byId.get(id); if (!x) return null; return x.gone ? [0, 0] : x.e.cloud ? [0, 0] : [1, 1]; }
  /** "PDF, 12 MB", "image (26), 40 MB". */
  describe(e) { return `${KIND_LABEL[e.type] || e.type}${e.files?.length > 1 ? ` (${e.files.length})` : ''}, ${sizeText(e.size)}`; }
}
export { KIND_LABEL };
