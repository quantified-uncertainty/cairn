// `node jobs.mjs check` (server/jobs.mjs checkJob): a good addition passes; duplicates by
// every key, shadow-library and unknown hosts, missing fields, a "you" in why, a short
// count, an unmerged corpus and a modern scan all fail. Then done, drop, and --live
// against a local HTTP server. Works on a temp copy of corpus.json and data/ (--root).
// Run: node --test test/jobs-check.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import http from 'http';
import * as J from '../server/jobs.mjs';
import { makeRoot, HERE } from './stacks-root.mjs';

let root, dir;
const corpus = () => JSON.parse(readFileSync(join(root, 'corpus.json'), 'utf-8')).items;
const today = new Date().toISOString().slice(0, 10);
const JOB = 'discover-0001';
function writeJob(id = JOB, wants = { count: 3, min: 2, max: 4 }) {
  J.ensureDirs(dir);
  const job = J.finish({ id, type: 'discover', title: 'Find 3 open works on LLM papers › Reasoning', priority: 'high', status: 'open', created: today, key: 'discover:path:llm/Reasoning:' + id,
    target: { feature: 'path:llm/Reasoning', label: 'LLM papers › Reasoning', lane: 'llm' }, inputs: [{ id: 'arxiv:2402.03300', t: 'DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models' }], wants, gen: 1 });
  writeFileSync(join(dir, 'open', id + '.md'), J.formatJob(job));
}
const good = (k = 1, extra = {}) => ({
  id: `arxiv:2610.9990${k}`, kind: 'pdf', t: `A Synthetic Paper Number ${k} on Long Chains of Reasoning`, a: 'Ada Tester, Bo Example', y: 2026, d: '2026-10-01',
  url: `https://arxiv.org/pdf/2610.9990${k}`, page: `https://arxiv.org/abs/2610.9990${k}`, why: 'A synthetic test item about reasoning chains, close to DeepSeekMath.',
  tags: ['reasoning'], added: today, job: JOB, via: { source: 'arxiv', query: 'abs:"reasoning chains"', seeds: ['arxiv:2402.03300'] }, ...extra,
});
function lane(items, file = 'llm.added.json', laneId = 'llm') {
  writeFileSync(join(root, 'data', 'lanes', file), JSON.stringify({ lane: laneId, label: 'Added by agent jobs', items }));
}
const merge = () => execFileSync(process.execPath, [join(HERE, 'build-corpus.mjs'), '--merge', '--root', root], { stdio: 'pipe' });
const check = (opts = {}) => J.checkJob(JOB, { root, dir, ...opts });
const failed = (r, re) => r.lines.some((l) => !l.ok && re.test(l.text));

before(() => {
  root = makeRoot({ prefix: 'stacks-check-' });
  dir = mkdtempSync(join(tmpdir(), 'stacks-jobsdir-'));
  writeJob();
});
after(() => { rmSync(root, { recursive: true, force: true }); rmSync(dir, { recursive: true, force: true }); });

test('a good addition passes once merged; before the merge it does not', async () => {
  lane([good(1), good(2, { id: 'pdf:openreview.net/pdf/abc123', url: 'https://openreview.net/pdf?id=abc123', page: 'https://openreview.net/forum?id=abc123', t: 'An Open Review Paper About Process Reward Models', via: { source: 'publisher', query: 'openreview search "process reward"' } })]);
  const before = await check();
  assert.ok(failed(before, /corpus\.json lacks 2 of the items/), JSON.stringify(before.lines));
  merge();
  const r = await check();
  assert.ok(r.ok, r.lines.filter((l) => !l.ok).map((l) => l.text).join('\n'));
  assert.equal(r.added.length, 2);
  assert.ok(r.files.includes('data/lanes/llm.added.json') && r.files.includes('corpus.json'));
  const c = corpus().find((it) => it.id === 'arxiv:2610.99901');
  assert.ok(Array.isArray(c.path) && Number.isFinite(c.ord));
});

test('duplicates by every key', async () => {
  const items = corpus();
  const shortT = items.find((it) => it.t && it.t.split(/\s+/).length <= 2 && it.a && /^lw:/.test(it.id));
  const scan = items.find((it) => it.kind === 'scan' && it.y && it.a && it.ia);
  const lwPost = items.find((it) => /^lw:/.test(it.id));
  const cases = [
    ['arXiv v2', { id: 'arxiv:2402.03300v2', url: 'https://arxiv.org/pdf/2402.03300v2', page: 'https://arxiv.org/abs/2402.03300v2' }, /arXiv id/],
    ['DOI', { id: 'pdf:example.org/gneiting.pdf', url: 'https://openreview.net/pdf?id=g1', page: 'https://openreview.net/forum?id=g1', t: 'A Different Title For The Same Scoring Paper', doi: '10.1198/016214506000001437' }, /same DOI/],
    ['10.48550 DOI', { id: 'pdf:openreview.net/pdf/dsm', url: 'https://openreview.net/pdf?id=dsm', page: 'https://openreview.net/forum?id=dsm', t: 'Something Else Entirely About Math', doi: '10.48550/arXiv.2402.03300' }, /same arXiv id/],
    ['title of 4+ words', { t: 'Concrete Problems in AI Safety' }, /same title/],
    ['short title and author', { t: shortT.t, a: shortT.a }, /same short title and author/],
    ['LW crosspost', { id: 'eaf:AbCdEfGhIjKlMnOpQ', kind: 'html', url: 'https://forum.effectivealtruism.org/graphql?query=' + encodeURIComponent('{post(input:{selector:{_id:"AbCdEfGhIjKlMnOpQ"}}){result{htmlBody}}}'), page: 'https://forum.effectivealtruism.org/posts/AbCdEfGhIjKlMnOpQ/x', xpost: lwPost.id, t: 'A Crossposted Essay With Another Title' }, /same forum post id/],
    ['IA work', { id: 'ia:anotherscan00copy', kind: 'scan', ia: 'anotherscan00copy', n: 120, t: scan.t, a: scan.a, y: scan.y, d: undefined, url: 'https://archive.org/details/anotherscan00copy', page: 'https://archive.org/details/anotherscan00copy' }, /same (work|title)/],
    ['URL', { id: 'pdf:auai.org/uai2016/proceedings/papers/68.pdf', url: 'https://www.auai.org/uai2016/proceedings/papers/68.pdf/', page: 'https://www.auai.org/uai2016/proceedings.php?x', t: 'Some Other Title Entirely Here' }, /same URL/],
  ];
  for (const [name, patch, re] of cases) {
    lane([good(1), good(3, patch)]);
    const r = await check();
    assert.ok(failed(r, /duplicates/) && failed(r, re), `${name}: ${r.lines.filter((l) => !l.ok).map((l) => l.text).join(' | ')}`);
  }
  // Within the job.
  lane([good(1), good(4, { t: good(1).t })]);
  assert.ok(failed(await check(), /in this job/));
  // A twin (the same work in another form) passes the title check.
  const twinOf = items.find((it) => it.t === 'Concrete Problems in AI Safety');
  lane([good(1), good(5, { t: 'Concrete Problems in AI Safety', twin: twinOf.id })]);
  assert.ok(!failed(await check(), /duplicates/));
});

test('hosts: shadow libraries are refused; unknown hosts need an allow entry', async () => {
  lane([good(1), good(6, { id: 'pdf:libgen.rs/book.pdf', url: 'https://libgen.rs/book.pdf', page: 'https://libgen.rs/book', t: 'A Book From A Shadow Library Copy' })]);
  assert.ok(failed(await check(), /shadow library/));
  lane([good(1), good(6, { id: 'pdf:mirror.sci-hub.se/x.pdf', url: 'https://mirror.sci-hub.se/x.pdf', page: 'https://mirror.sci-hub.se/x', t: 'A Paper From Another Shadow Library' })]);
  assert.ok(failed(await check(), /shadow library \(deny list: sci-hub\.\*\)/));
  lane([good(1), good(6, { id: 'pdf:unknown-host.example/p.pdf', url: 'https://unknown-host.example/p.pdf', page: 'https://unknown-host.example/p', t: 'A Paper On An Unknown Host Somewhere' })]);
  assert.ok(failed(await check(), /not a known open host/));
});

test('item rules: each missing field, a "you" in why, a modern scan', async () => {
  const drops = { t: /no title/, a: /no author/, url: /url must be an https/, page: /page must be an https/, why: /why must be 20-200/, tags: /tags: 1 to 4/, added: /added must be the date/, via: /via must be/, job: /1 items with job discover-0001/ /* an item without the job id is not counted */ };
  for (const [k, re] of Object.entries(drops)) {
    const bad = good(7); delete bad[k];
    lane([good(1), bad]);
    assert.ok(failed(await check(), re), k);
  }
  const noDate = good(7); delete noDate.y; delete noDate.d;
  lane([good(1), noDate]);
  assert.ok(failed(await check(), /no year \(y\) or date \(d\)/));
  lane([good(1), good(7, { why: 'A paper that you will find useful for your research.' })]);
  assert.ok(failed(await check(), /why must be neutral/));
  lane([good(1), good(7, { via: { source: 'arxiv', query: 'you read 3 of these deeply' } })]);
  assert.ok(failed(await check(), /read like reading history/));
  lane([good(1), good(7, { id: 'ia:modernbook1950', kind: 'scan', ia: 'modernbook1950', n: 200, y: 1950, d: undefined, url: 'https://archive.org/details/modernbook1950', page: 'https://archive.org/details/modernbook1950', t: 'A Modern Book Still In Copyright' })]);
  assert.ok(failed(await check(), /1930 or earlier/));
  lane([good(1), good(7, { url: 'https://arxiv.org/abs/2610.99907' })]);
  assert.ok(failed(await check(), /arXiv url must be https:\/\/arxiv\.org\/pdf\/2610\.99907/));
});

test('a count below wants.min fails', async () => {
  lane([good(1)]);
  const r = await check();
  assert.ok(failed(r, /1 items with job discover-0001 .*wants 2 to 4/), JSON.stringify(r.lines));
});

test('--live, against a local server standing in for the hosts', async () => {
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.slice(1));
    if (/graphql/.test(u)) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ data: { post: { result: { htmlBody: '<p>' + 'x'.repeat(200) + '</p>' } } } })); }
    if (/99902/.test(u)) { res.writeHead(404); return res.end('gone'); }
    if (/\/pdf\//.test(u)) { res.writeHead(206, { 'Content-Type': 'application/octet-stream' }); return res.end('%PDF-1.5 synthetic'); }
    res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html>ok</html>');
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const local = `http://127.0.0.1:${srv.address().port}/`;
  const fetchImpl = (url, opts) => fetch(local + encodeURIComponent(url), opts);
  try {
    lane([good(1), good(3)]);
    merge();
    let r = await check({ live: true, fetchImpl });
    assert.ok(r.ok, r.lines.filter((l) => !l.ok).map((l) => l.text).join('\n'));
    assert.ok(r.lines.some((l) => l.ok && /arxiv\.org\/pdf\/2610\.99901 answers/.test(l.text)));
    lane([good(1), good(2)]);
    merge();
    r = await check({ live: true, fetchImpl });
    assert.ok(failed(r, /2610\.99902 answers HTTP 404/), JSON.stringify(r.lines));
  } finally { srv.close(); }
});

test('done writes the Result and moves the file; drop likewise', async () => {
  lane([good(1), good(3)]);
  merge();
  const r = await J.doneJob(JOB, { root, dir, note: 'Two synthetic papers.' });
  assert.ok(r.ok, r.why);
  assert.ok(!existsSync(join(dir, 'open', JOB + '.md')) && existsSync(join(dir, 'done', JOB + '.md')));
  const { job } = J.parseJob(readFileSync(join(dir, 'done', JOB + '.md'), 'utf-8'));
  assert.equal(job.status, 'done'); assert.equal(job.by, 'agent');
  assert.deepEqual(job.result.added.sort(), ['arxiv:2610.99901', 'arxiv:2610.99903']);
  assert.match(job.body, /## Result\n\nItems added \(2\): arxiv:2610\.9990\d "A Synthetic Paper/);
  assert.match(job.body, /Sources and queries: arxiv: abs:"reasoning chains"/);
  assert.match(job.body, /Note: Two synthetic papers\./);
  assert.ok(r.files.includes('data/lanes/llm.added.json') && r.files.includes('corpus.json'));
  assert.match(r.commit, /^git commit -m "Stacks job discover-0001: Find 3 open works on LLM papers › Reasoning"$/);
  assert.ok(!/git add -A/.test(r.add));
  // Closing twice is refused.
  assert.equal((await J.doneJob(JOB, { root, dir })).ok, false);
  writeJob('discover-0002');
  const d = J.dropJob('discover-0002', { root, dir, why: 'nothing open exists' });
  const dj = J.parseJob(readFileSync(d.file, 'utf-8')).job;
  assert.equal(dj.status, 'dropped');
  assert.match(dj.body, /## Result\n\nDropped: nothing open exists/);
  assert.throws(() => J.dropJob('discover-0009', { root, dir, why: 'x' }), /no open job/);
  // A failing check refuses done unless --force.
  writeJob('discover-0003', { count: 3, min: 5, max: 9 });
  const no = await J.doneJob('discover-0003', { root, dir });
  assert.equal(no.ok, false);
  const yes = await J.doneJob('discover-0003', { root, dir, force: true });
  assert.ok(yes.ok);
  assert.match(J.parseJob(readFileSync(yes.file, 'utf-8')).job.body, /Closed with --force; the check failed/);
});

test('the CLI: list, next, show, lookup, check exit codes', () => {
  const cli = (...a) => { try { return { out: execFileSync(process.execPath, [join(HERE, 'jobs.mjs'), ...a, '--dir', dir, '--root', root], { encoding: 'utf-8' }), code: 0 }; } catch (e) { return { out: String(e.stdout) + String(e.stderr), code: e.status }; } };
  writeJob('discover-0004');
  assert.match(cli('list').out, /high {3}discover-0004/);
  assert.match(cli('next').out, /id: "discover-0004"[\s\S]*# Files to edit: data\/lanes\/llm\.added\.json, corpus\.json/);
  assert.match(cli('show', 'discover-0001').out, /status: "done"/);
  assert.match(cli('lookup', '2402.03300').out, /^arxiv:2402\.03300 .*DeepSeekMath/m);
  assert.match(cli('lookup', 'https://arxiv.org/abs/2402.03300v3').out, /arxiv:2402\.03300/);
  assert.match(cli('lookup', '10.1198/016214506000001437').out, /Gneiting/);
  assert.match(cli('lookup', 'concrete problems in ai safety').out, /arxiv:1606\.06565/);
  assert.match(cli('lookup', 'No Such Paper Title At All Anywhere').out, /No match/);
  assert.match(cli('lookup', '--lane', 'llm').out, /^llm: \d+ items/);
  lane([good(1)]);
  assert.equal(cli('check', 'discover-0004').code, 1);
  assert.match(cli('skeleton', 'arxiv', '2610.01995v2', '--job', 'discover-0004').out, /"url": "https:\/\/arxiv\.org\/pdf\/2610\.01995"/);
  mkdirSync(join(dir, 'x'), { recursive: true });
});
