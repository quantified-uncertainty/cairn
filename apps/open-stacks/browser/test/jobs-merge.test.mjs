// `node build-corpus.mjs --merge --root <tmp>`: appends lane-file items with their place in
// the library tree, keeps every existing item's index, applies data/overrides.json (a field
// change, a drop), leaves the wikis' order alone, and makes no network call.
// Run: node --test test/jobs-merge.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { makeRoot, HERE } from './stacks-root.mjs';

test('merge: append, place, override, drop, offline, fast', () => {
  const root = makeRoot({ prefix: 'stacks-merge-' });
  try {
    const before = JSON.parse(readFileSync(join(root, 'corpus.json'), 'utf-8')).items;
    const today = new Date().toISOString().slice(0, 10);
    const via = { source: 'arxiv', query: 'test' };
    writeFileSync(join(root, 'data', 'lanes', 'llm.added.json'), JSON.stringify({ lane: 'llm', items: [
      { id: 'arxiv:2610.99911', kind: 'pdf', t: 'Chain-of-Thought Reasoning at Scale: A Synthetic Test', a: 'Ada Tester', y: 2026, url: 'https://arxiv.org/pdf/2610.99911', page: 'https://arxiv.org/abs/2610.99911', why: 'A synthetic reasoning paper for the merge test.', tags: ['reasoning'], added: today, job: 'discover-0001', via },
      { id: 'lw:AbCdEfGhIjKlMnOpQ', lane: 'lesswrong', kind: 'html', t: 'A Synthetic Forum Post', a: 'someone', y: 2026, d: '2026-09-01', url: 'https://www.lesswrong.com/graphql?query=x', page: 'https://www.lesswrong.com/posts/AbCdEfGhIjKlMnOpQ/x', why: 'A synthetic forum post for the merge test.', tags: ['x'], added: today, job: 'discover-0001', via },
      { id: 'web:example.org/not-graphql', kind: 'html', t: 'A Web Page Marked Html', a: 'someone', y: 2026, url: 'https://example.org/not-graphql', page: 'https://example.org/not-graphql', why: 'html that is not a forum post becomes web.', tags: ['x'], added: today, job: 'discover-0001', via },
      { id: 'web:bad.example/no-url', kind: 'web', t: 'No URL', a: 'x', y: 2026, page: 'https://bad.example/no-url' },
    ] }));
    const quri = before.find((it) => it.lane === 'quri');
    const host = new URL(quri.url).host;
    writeFileSync(join(root, 'data', 'lanes', 'quri.added.json'), JSON.stringify({ lane: 'quri', items: [
      { id: `web:${host}/a-new-page`, kind: 'web', src: quri.src, t: 'A New Wiki Page', a: quri.a, url: `https://${host}/a-new-page/`, page: `https://${host}/a-new-page/`, why: 'A new page on the wiki.', tags: ['x'], added: today, job: 'grow-lane-0001', via: { source: 'quri', query: 'sitemap' } },
    ] }));
    const fixed = before.find((it) => it.id === 'arxiv:1606.06565');
    const dropped = before.find((it) => it.lane === 'llm' && it.id !== 'arxiv:1606.06565');
    writeFileSync(join(root, 'data', 'overrides.json'), JSON.stringify({ v: 1, items: {
      [fixed.id]: { t: 'Concrete Problems in AI Safety (corrected)', why: 'test', fixed: today, job: 'fix-item-0001' },
      [dropped.id]: { drop: true, why: 'test drop', fixed: today, job: 'fix-item-0001' },
      'no:such-item': { t: 'x', why: 'missing' },
    } }));
    writeFileSync(join(root, 'nofetch.mjs'), "globalThis.fetch = () => { throw new Error('the merge used the network'); };\n");
    const t0 = Date.now();
    const out = execFileSync(process.execPath, ['--import', join(root, 'nofetch.mjs'), join(HERE, 'build-corpus.mjs'), '--merge', '--root', root], { encoding: 'utf-8' });
    const ms = Date.now() - t0;
    assert.ok(ms <= 3000, `took ${ms} ms`);
    assert.match(out, /Merged in \d+ ms: \d+ appended .*1 updated, 1 dropped/);
    assert.match(out, /skipped llm\.added\.json: web:bad\.example\/no-url: needs id, url and t/);
    assert.match(out, /skipped no:such-item: not in the corpus/);
    const c = JSON.parse(readFileSync(join(root, 'corpus.json'), 'utf-8'));
    const after = c.items;
    // Existing items keep their order and positions (shifted by one after the dropped item).
    const kept = before.filter((it) => it.id !== dropped.id);
    assert.deepEqual(after.slice(0, kept.length).map((it) => it.id), kept.map((it) => it.id));
    assert.ok(!after.some((it) => it.id === dropped.id));
    assert.equal(after.find((it) => it.id === fixed.id).t, 'Concrete Problems in AI Safety (corrected)');
    // Appended items: normalised and placed.
    const a = after.find((it) => it.id === 'arxiv:2610.99911');
    assert.equal(a.lane, 'llm'); assert.equal(a.src, 'arXiv'); assert.equal(a.d, '2026-10'); assert.equal(a.q, 0.5); assert.equal(a.score, 0);
    assert.ok(Array.isArray(a.path) && a.path.length && Number.isFinite(a.ord), JSON.stringify(a));
    assert.equal(a.path[0], 'Reasoning', 'the topic folder from the tree builder');
    assert.equal(after.find((it) => it.id === 'lw:AbCdEfGhIjKlMnOpQ').kind, 'html', 'a GraphQL post stays html');
    assert.equal(after.find((it) => it.id === 'web:example.org/not-graphql').kind, 'web');
    // The wikis: existing order untouched, new pages after it, not in the sidebar.
    const q0 = before.filter((it) => it.lane === 'quri').map((it) => `${it.id}:${it.ord}`).join();
    const q1 = after.filter((it) => it.lane === 'quri' && it.id !== `web:${host}/a-new-page`).map((it) => `${it.id}:${it.ord}`).join();
    assert.equal(q1, q0);
    const np = after.find((it) => it.id === `web:${host}/a-new-page`);
    assert.deepEqual(np.path, [quri.src, 'Not in the sidebar']);
    assert.equal(np.ord, Math.max(...before.filter((it) => it.lane === 'quri').map((it) => it.ord)) + 1);
    assert.equal(c.counts.llm, after.filter((it) => it.lane === 'llm').length);
    assert.match(c.merged, /^\d{4}-\d{2}-\d{2}$/);
    // Running it again changes nothing.
    const again = execFileSync(process.execPath, [join(HERE, 'build-corpus.mjs'), '--merge', '--root', root], { encoding: 'utf-8' });
    assert.match(again, /: 0 appended, 0 updated, 0 dropped/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
