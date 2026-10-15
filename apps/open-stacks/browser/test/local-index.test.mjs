// The index of your own folders (server/local.mjs LocalIndex) on a synthetic folder:
// what is listed and left out, the tree, the order, ids, metadata, iCloud placeholders.
//   node --test test/local-index.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, renameSync, utimesSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalIndex, idOf } from '../server/local.mjs';
import { makeFolder, makePdf } from './local-fixtures.mjs';

function setup(t, opts = {}) {
  const d = mkdtempSync(join(tmpdir(), 'stacks-local-index-'));
  t.after(() => rmSync(d, { recursive: true, force: true }));
  const root = makeFolder(join(d, 'My Reading'));
  const make = (o = {}) => new LocalIndex({ dirs: [root], cacheDir: join(d, 'cache'), tools: { pdfinfo: true, mdls: false, textutil: false, brctl: false }, ...opts, ...o });
  return { d, root, make };
}
const byTitle = (ix) => Object.fromEntries(ix.items.map((it) => [it.t, it]));

test('what is listed: documents, a gallery, a placeholder, an archive; hidden, empty, partial, links and unpacked archives are not', async (t) => {
  const { make } = setup(t);
  const ix = make(); await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  assert.deepEqual(Object.keys(T).sort(), ['A Local Page', 'A Plain Text', 'Alpha paper', 'Dot', 'Inner Paper', 'Later', 'Lone', 'Maps', 'Notes on Synthetic Things', 'Root Level Paper', 'The Synthetic Book', 'X']);
  assert.deepEqual(ix.roots[0].skipped, { hidden: 2, empty: 1, partial: 1, link: 1 });
  assert.equal(ix.roots[0].n, 12);
  // kinds and URLs
  assert.equal(T['Root Level Paper'].kind, 'pdf');
  assert.match(T['Root Level Paper'].url, /^\/local\/file\/local:[0-9a-f]{20}\?v=\w+$/);
  assert.equal(T['A Plain Text'].kind, 'text');
  for (const k of ['The Synthetic Book', 'Notes on Synthetic Things', 'A Local Page', 'Maps', 'Lone', 'Later', 'Dot']) {
    assert.equal(T[k].kind, 'html', k); assert.match(T[k].url, /^\/local\/doc\/local:/, k);
  }
  // corpus.json's item format, and the lane
  for (const it of ix.items) {
    assert.equal(it.lane, 'local'); assert.equal(it.src, 'local'); assert.equal(it.private, true);
    assert.ok(Array.isArray(it.path) && it.path[0] === 'My Reading');
    assert.match(it.why, /^Your folder/);
    assert.equal(typeof it.ord, 'number');
  }
  assert.equal(T.Maps.count, 2, 'a folder of two pictures is one item');
  assert.deepEqual(T.Maps.path, ['My Reading'], 'in the folder above its own');
  assert.equal(T.Lone.ext, 'zip');
  assert.ok(!ix.items.some((it) => /archive/i.test(it.t)), 'Archive.zip sits beside its unpacked folder: left out');
});

test('the tree: each subfolder a folder (path), files before subfolders, by name, depth first', async (t) => {
  const { make } = setup(t);
  const ix = make(); await ix.scan(); await ix.settled();
  const rows = ix.items.map((it) => [it.ord, it.path.slice(1).join('/'), it.t]);
  assert.deepEqual(rows, [
    [0, '', 'Lone'], [1, '', 'Maps'], [2, '', 'A Local Page'], [3, '', 'Root Level Paper'],
    [4, 'Archive', 'X'],
    [5, 'Books', 'A Plain Text'], [6, 'Books', 'The Synthetic Book'],
    [7, 'Books/Deep/Deeper', 'Inner Paper'],
    [8, 'Papers', 'Alpha paper'], [9, 'Papers', 'Notes on Synthetic Things'], [10, 'Papers', 'Later'],
    [11, 'Papers/pics', 'Dot'],
  ]);
  assert.equal(byTitle(ix)['Inner Paper'].why, 'Your folder › Books › Deep › Deeper');
});

test('newest first: files by modified date in each folder, folders by their newest file', async (t) => {
  const { root, make } = setup(t);
  const at = (rel, iso) => { const s = new Date(iso).getTime() / 1000; utimesSync(join(root, rel), s, s); };
  at('Papers/Alpha paper.pdf', '2025-01-01'); at('Papers/beta_notes.md', '2025-06-01');
  at('Books/plain.txt', '2024-01-01'); at('Books/Synthetic Book.epub', '2026-03-01');
  const ix = make({ order: 'newest' }); await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  assert.ok(T['Notes on Synthetic Things'].ord < T['Alpha paper'].ord);
  assert.ok(T['The Synthetic Book'].ord < T['A Plain Text'].ord);
  assert.equal(T['Alpha paper'].d, '2025-01-01', 'the file date');
  ix.order = 'name'; ix.build();
  assert.ok(byTitle(ix)['Alpha paper'].ord < byTitle(ix)['Notes on Synthetic Things'].ord);
});

test('metadata: PDF titles worth showing, authors, years and pages; EPUB, Markdown and text titles', async (t) => {
  const { d, make } = setup(t);
  const ix = make(); await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  assert.deepEqual([T['Root Level Paper'].a, T['Root Level Paper'].y, T['Root Level Paper'].n], ['Test Author', 2021, 2]);
  assert.equal(T['Alpha paper'].a, undefined, '"Administrator" is not an author');
  assert.equal(T['Alpha paper'].n, 5, 'the title "Untitled" gives way to the file name, the page count stays');
  assert.deepEqual([T['The Synthetic Book'].a, T['The Synthetic Book'].y], ['Ada Example', 2019]);
  assert.deepEqual([T['Notes on Synthetic Things'].a, T['Notes on Synthetic Things'].y], ['Test Author', 2024]);
  assert.equal(T['A Plain Text'].a, 'Someone Plain');
  // Cached by path, size and modified time, under the cache folder.
  const meta = JSON.parse(readFileSync(join(d, 'cache', 'meta.json'), 'utf-8'));
  assert.ok(Object.keys(meta).length >= 6 && Object.keys(meta).every((k) => /\|\d+\|\d+$/.test(k)), 'keyed by path|size|mtime');
  assert.equal(meta[Object.keys(meta).find((k) => k.includes('Root.pdf|'))].title, 'Root Level Paper');
  // Without poppler (a Mac without it): the PDF's own Info dictionary and page tree.
  const bare = make({ tools: { pdfinfo: false, mdls: false, textutil: false, brctl: false }, cacheDir: join(d, 'cache2') });
  await bare.scan(); await bare.settled();
  assert.deepEqual([byTitle(bare)['Root Level Paper'].n, byTitle(bare)['Root Level Paper'].y], [2, 2021]);
});

test('ids: stable across indexes, from the folder name and the path; an iCloud placeholder has the id of its file', async (t) => {
  const { root, make } = setup(t);
  const a = make(); await a.scan(); await a.settled();
  const b = make(); await b.scan(); await b.settled();
  assert.deepEqual(a.items.map((it) => it.id), b.items.map((it) => it.id));
  const later = byTitle(a).Later;
  assert.equal(later.id, idOf('My Reading', 'Papers/Later.pdf'));
  assert.equal(later.cloud, 'stub');
  assert.match(later.why, /not downloaded/);
  assert.ok(later.why.includes(`brctl download '${join(root, 'Papers', 'Later.pdf')}'`), 'the fix, with the real path');
  assert.deepEqual(a.ready(later.id), [0, 0], 'not on disk: dimmed in the Library');
  assert.deepEqual(a.ready(byTitle(a)['Root Level Paper'].id), [1, 1]);
  assert.equal(a.ready('local:00000000000000000000'), null);
  // The download finishes: the placeholder goes and the file appears under the same id.
  renameSync(join(root, 'Papers', '.Later.pdf.icloud'), join(root, 'Papers', 'gone.tmp'));
  rmSync(join(root, 'Papers', 'gone.tmp'));
  writeFileSync(join(root, 'Papers', 'Later.pdf'), makePdf({ pages: 4, title: 'Later, Downloaded' }));
  await a.scan(); await a.settled();
  const now = a.items.find((it) => it.id === later.id);
  assert.equal(now.kind, 'pdf'); assert.equal(now.t, 'Later, Downloaded'); assert.equal(now.n, 4); assert.equal(now.cloud, undefined);
  assert.deepEqual(a.ready(later.id), [1, 1]);
});

test('an iCloud placeholder beside its downloaded file: one item, the file (not two with one id)', async (t) => {
  const { root, make } = setup(t);
  writeFileSync(join(root, 'Papers', 'Later.pdf'), makePdf({ pages: 2, title: 'Later, Arriving' })); // .Later.pdf.icloud is still there
  const ix = make(); await ix.scan(); await ix.settled();
  const ids = ix.items.map((it) => it.id);
  assert.equal(new Set(ids).size, ids.length, 'no id twice');
  const it = ix.items.find((x) => x.id === idOf('My Reading', 'Papers/Later.pdf'));
  assert.equal(it.kind, 'pdf'); assert.equal(it.cloud, undefined);
});
test('titles: text files in UTF-16 or Latin-1, and file names in decomposed Unicode (NFD)', async (t) => {
  const { root, make } = setup(t);
  writeFileSync(join(root, 'Books', 'wide.txt'), Buffer.from('﻿Title: A Wide Text\n\nBody.\n', 'utf16le'));
  writeFileSync(join(root, 'Books', 'old.txt'), Buffer.from('Title: Caf\xe9 Text\n\nBody.\n', 'latin1'));
  writeFileSync(join(root, 'Books', 'Café Notes.pdf'), makePdf({ pages: 1, title: 'Untitled' }));
  const ix = make(); await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  assert.ok(T['A Wide Text'] && T['Café Text'], Object.keys(T).join(', '));
  assert.ok(T['Café Notes'], 'NFC, so a search typed on a keyboard finds it');
});

test('changes: a new file, a removed one (still answered, as gone), the version', async (t) => {
  const { root, make } = setup(t);
  let changes = 0;
  const ix = make({ onChange: () => changes++ }); await ix.scan(); await ix.settled();
  const v0 = ix.v, c0 = changes, old = byTitle(ix)['A Plain Text'];
  writeFileSync(join(root, 'Papers', 'Fresh.pdf'), makePdf({ pages: 1, title: 'A Fresh Arrival' }));
  rmSync(join(root, 'Books', 'plain.txt'));
  await ix.scan(); await ix.settled();
  assert.notEqual(ix.v, v0); assert.ok(changes > c0);
  assert.ok(byTitle(ix)['A Fresh Arrival']);
  assert.equal(byTitle(ix)['A Plain Text'], undefined);
  assert.equal(ix.get(old.id).gone, true, 'a file that went away still answers, as gone');
  const v1 = ix.v; await ix.scan(); await ix.settled();
  assert.equal(ix.v, v1, 'nothing changed: same version');
});

test('settings: AI on request by default, several folders, a missing one, and a cap', async (t) => {
  const { d, root, make } = setup(t);
  const other = join(d, 'elsewhere', 'My Reading'); mkdirSync(other, { recursive: true });
  writeFileSync(join(other, 'one.pdf'), makePdf({ pages: 1, title: 'Another Root' }));
  const ix = make({ dirs: [root, other, join(d, 'missing')], autoAI: true }); await ix.scan(); await ix.settled();
  assert.deepEqual(ix.roots.map((r) => [r.name, r.ok, r.error]), [['My Reading', true, null], ['My Reading (2)', true, null], ['missing', false, 'not found']]);
  const a = byTitle(ix)['Another Root'];
  assert.deepEqual(a.path, ['My Reading (2)']);
  assert.equal(a.why, 'My Reading (2)', 'with several folders, the folder’s own name');
  assert.equal(a.private, false, 'autoAI: summaries like any item');
  assert.notEqual(a.id, byTitle(ix)['Root Level Paper'].id);
  const capped = make({ maxFiles: 3, cacheDir: join(d, 'c3') }); await capped.scan(); await capped.settled();
  assert.equal(capped.roots[0].truncated, true);
  assert.ok(capped.items.length <= 3);
  assert.ok(existsSync(join(d, 'cache', 'meta.json')));
});
