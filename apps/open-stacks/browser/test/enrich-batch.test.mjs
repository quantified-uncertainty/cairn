// enrich-batch.mjs: places from profiles, guides, post headings and scan contents; best
// pages checked (front matter, references, pages not offered dropped; printed numbers
// mapped through the labels); the merge; and a mock run that resumes
// (node --test test/*.test.mjs).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import * as E from '../enrich-batch.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = mkdtempSync(join(tmpdir(), 'stacks-enrich-'));
after(() => rmSync(CACHE, { recursive: true, force: true }));
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const corpus = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
const pdf = corpus.items.find((it) => it.kind === 'pdf' && it.url);
const scan = corpus.items.find((it) => it.kind === 'scan' && it.ia && it.n > 30);
const post = corpus.items.find((it) => it.kind === 'html' && it.url);
const plain = corpus.items.find((it) => it.kind === 'pdf' && it.url && it.id !== pdf.id);

test('post headings get the stable pages prepareFlow cuts (280 words a page)', () => {
  const para = (n) => `<p>${Array.from({ length: n }, (_, j) => 'w' + j).join(' ')}</p>`;
  const html = `<h1>Intro</h1>${para(200)}<ul><li>${para(50)}</li></ul><h2>Method</h2>${para(300)}<script>var x = '<h2>no</h2>';</script><h2>Results</h2>${para(10)}<img src="a.png"><h3>Discussion</h3>${para(10)}`;
  const F = E.flowOutline(html);
  assert.deepEqual(F.outline.map((o) => [o.t, o.k, o.d]), [['Intro', 0, 0], ['Method', 0, 1], ['Results', 1, 1], ['Discussion', 1, 2]]);
  assert.equal(F.n, 2);
});

test('best pages: only offered pages, never front matter or references; printed numbers mapped', () => {
  const P = { n: 30, toc: [{ t: 'Contents', k: 1, d: 0 }, { t: '1 Introduction', k: 3, d: 0 }, { t: '2 Results', k: 9, d: 0 }, { t: 'References', k: 26, d: 0 }],
    ranges: { front: [0, 2], body: [3, 25], refs: [26, 29] }, pages: Array.from({ length: 30 }, (_, k) => ({ k, role: k < 3 ? 'front' : k >= 26 ? 'refs' : 'body' })) };
  const pl = E.placesOf({ id: 'x', kind: 'pdf' }, { profile: P });
  assert.deepEqual([...pl.cand].sort((a, b) => a - b), [3, 9]);
  assert.deepEqual(E.checkBest([{ page: 10, printed: null }, { page: 2, printed: null }, { page: 27, printed: null }, { page: 5, printed: null }, { page: 4, printed: null }, { page: 10, printed: null }], pl), [9, 3]);
  const block = E.itemBlock({ id: 'x', kind: 'pdf', t: 'T', lane: 'llm' }, 0, pl);
  assert.match(block, /p\. 10 {2}?2 Results|p\. 10 2 Results/);
  assert.match(block, /front matter to p\. 3/);

  // A scan with printed labels and a contents page in its OCR: printed numbers, never in the front.
  const labels = [null, null, 'iii', 'iv', ...Array.from({ length: 40 }, (_, j) => String(j + 1))];
  const ocr = labels.map((_, k) => (k === 2 ? 'CONTENTS Chapter I. The Engine ... 1 Chapter II. The Mill ... 17' : 'text'));
  const sp = E.placesOf({ id: 's', kind: 'scan', n: labels.length }, { labels, ocrText: ocr });
  assert.equal(sp.front, 3);
  assert.ok(sp.contents.startsWith('CONTENTS'));
  assert.deepEqual(E.checkBest([{ page: null, printed: '17' }, { page: null, printed: 'iii' }, { page: null, printed: '99' }, { page: null, printed: '1' }], sp), [20, 4]);
  // No outline at all: nothing to choose from, so no best.
  const none = E.placesOf({ id: 'p', kind: 'pdf' }, {});
  assert.equal(none.cand.size, 0);
  assert.deepEqual(E.checkBest([{ page: 3, printed: null }], none), []);
});

test('the merge keeps hooks from elsewhere and drops only best pages this script wrote', () => {
  const base = { items: { a: { rel: 0.2, hook: 'hand hook', best: [4] }, b: { rel: 0.5, best: [7] } } };
  const m = E.mergeOut(base, { a: { rel: 0.9, hook: '', best: [], ours: false }, b: { rel: 0.6, hook: 'new', best: [], ours: true }, c: { rel: 0.4, hook: 'h', best: [2, 5] } }, { source: 's' });
  assert.deepEqual(m.items.a, { rel: 0.9, hook: 'hand hook', best: [4] });
  assert.deepEqual(m.items.b, { rel: 0.6, hook: 'new' });
  assert.deepEqual(m.items.c, { rel: 0.4, hook: 'h', best: [2, 5] });
});

test('learned interests come from CACHE/learn/profile.json, labels only, mutes and boosts first', () => {
  const dir = mkdtempSync(join(tmpdir(), 'stacks-enrich-learn-'));
  try {
    mkdirSync(join(dir, 'learn'));
    writeFileSync(join(dir, 'learn', 'profile.json'), JSON.stringify({ feat: {
      'tag:calibration': { l: 0.6, W: 4, label: 'Calibration' }, 'lane:ttrpg': { l: -0.5, W: 3, label: 'TTRPG manuals' },
      'au:smith': { l: 0.01, W: 9, label: 'Smith' }, 'tag:x': { l: 0.9, W: 1, label: 'Ignored', ctl: 'ignore' }, 'tag:y': { l: 0, W: 0, label: 'Boosted', ctl: 'boost' },
    } }));
    const I = E.learnedInterests(dir);
    assert.deepEqual(I, { more: ['Boosted (boosted)', 'Calibration'], less: ['TTRPG manuals'] });
    assert.match(E.readerBlock({ lanes: { llm: 'LLM papers' }, interests: I }), /Reads more of: Boosted \(boosted\); Calibration/);
    assert.equal(E.learnedInterests(join(dir, 'none')), null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a mock run writes rel, hook and best to the cache folder and resumes', { skip: !(pdf && scan && post && plain) && 'needs a PDF, a scan and a post in the corpus' }, () => {
  // A compiled profile for the PDF, a cached post, a scan's OCR and page numbers.
  const pid = sha1(pdf.id + '|' + pdf.url);
  mkdirSync(join(CACHE, 'profiles', pid), { recursive: true });
  writeFileSync(join(CACHE, 'profiles', pid, 'profile.json'), JSON.stringify({ id: pdf.id, n: 12, toc: [{ t: 'Abstract', k: 0, d: 0 }, { t: 'Results', k: 5, d: 0 }, { t: 'Discussion', k: 8, d: 0 }], ranges: { front: null, body: [0, 10], refs: [11, 11] }, pages: [] }));
  const put = (u, body) => { const k = sha1(u); mkdirSync(join(CACHE, k.slice(0, 2)), { recursive: true }); writeFileSync(join(CACHE, k.slice(0, 2), k), body); writeFileSync(join(CACHE, k.slice(0, 2), k + '.json'), '{}'); };
  put(post.url, JSON.stringify({ data: { post: { result: { htmlBody: `<p>${'word '.repeat(300)}</p><h2>The key argument</h2><p>${'more '.repeat(300)}</p><h2>Objections</h2><p>end</p>` } } } }));
  put(`https://archive.org/download/${scan.ia}/${scan.ia}_page_numbers.json`, JSON.stringify({ pages: Array.from({ length: scan.n }, (_, k) => ({ leafNum: k + 1, pageNumber: k >= 4 ? String(k - 3) : '' })) }));
  mkdirSync(join(CACHE, 'ocr', scan.ia), { recursive: true });
  writeFileSync(join(CACHE, 'ocr', scan.ia, 'text.json'), JSON.stringify({ pages: Array.from({ length: scan.n }, (_, k) => (k === 2 ? 'CONTENTS I. First 1 II. Second 9' : 'page text')) }));
  const env = { ...process.env, STACKS_CACHE: CACHE, STACKS_MOCK_AI: '1' };
  const ids = [pdf.id, scan.id, post.id, plain.id].join(',');
  const run = (...a) => execFileSync(process.execPath, [join(HERE, 'enrich-batch.mjs'), '--ids', ids, ...a], { env, cwd: HERE }).toString();
  assert.match(run('--dry-run'), /4 items to enrich; 3 with an outline/);
  assert.ok(!existsSync(join(CACHE, 'enrich.mock.json')), 'a dry run writes nothing');
  const out = run();
  assert.match(out, /Enriched 4 of 4 items/);
  const got = JSON.parse(readFileSync(join(CACHE, 'enrich.mock.json'), 'utf-8')).items;
  for (const id of ids.split(',')) { assert.ok(got[id].rel >= 0 && got[id].rel <= 1, id); assert.ok(got[id].hook.length <= 120, id); }
  assert.deepEqual(got[pdf.id].best, [0, 5]);
  assert.deepEqual(got[post.id].best, [1, 2]); // the headings' stable pages; page 0 is where a post opens anyway
  assert.equal(got[plain.id].best, undefined); // no outline: nothing guessed
  assert.ok(!existsSync(join(CACHE, 'enrich.json')), 'mock answers stay out of the real file');
  // Again: nothing to do. A new outline for one item: just that one.
  assert.match(run(), /0 items to enrich \(4 already done/);
  const pid2 = sha1(plain.id + '|' + plain.url);
  mkdirSync(join(CACHE, 'profiles', pid2), { recursive: true });
  writeFileSync(join(CACHE, 'profiles', pid2, 'profile.json'), JSON.stringify({ id: plain.id, n: 9, toc: [{ t: 'Setup', k: 2, d: 0 }, { t: 'Findings', k: 4, d: 0 }], ranges: { front: [0, 1], body: [2, 8] }, pages: [] }));
  assert.match(run(), /1 item to enrich \(3 already done/);
  assert.deepEqual(JSON.parse(readFileSync(join(CACHE, 'enrich.mock.json'), 'utf-8')).items[plain.id].best, [2, 4]);
});

test('/enrich.json and the server-side corpus read the cache folder\'s file first', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stacks-enrich-route-'));
  try {
    const code = `import { enrichFile } from './server/config.mjs'; import { loadCorpus } from './server/routes/60-warm.mjs'; const it = loadCorpus().find((x) => x.id === ${JSON.stringify(pdf.id)}); console.log(JSON.stringify({ f: enrichFile(), rel: it.rel ?? null, hook: it.hook ?? null }));`;
    const env = { ...process.env, STACKS_CACHE: dir };
    const before = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, cwd: HERE }).toString());
    assert.equal(before.f, join(HERE, 'enrich.json'));
    writeFileSync(join(dir, 'enrich.json'), JSON.stringify({ items: { [pdf.id]: { rel: 0.93, hook: 'cached hook' } } }));
    const now = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, cwd: HERE }).toString());
    assert.deepEqual(now, { f: join(dir, 'enrich.json'), rel: 0.93, hook: 'cached hook' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
