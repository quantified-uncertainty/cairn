// Adversarial additions that `node jobs.mjs check` must refuse (QA of the jobs loop,
// docs/learning/spec.md §11.4): an item re-added under the corpus's own id, the arXiv
// HTML view, a "doi:" prefix, a forum post filed as a web page, `twin` used past the
// title keys, a shadow library behind the Wayback Machine, a DOI link as the url; the
// merge never folds in a shadow-library link; --live reads only the first bytes and
// refuses redirects to a shadow library, a login page or an unknown host.
// Works on a temp copy of corpus.json and data/ (--root) and a temp jobs folder.
// Run: node --test test/jobs-adversarial.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import http from 'http';
import * as J from '../server/jobs.mjs';
import { makeRoot, HERE } from './stacks-root.mjs';

let root, dir;
const today = new Date().toISOString().slice(0, 10);
const JOB = 'discover-0001';
const LW = 'tD9zEiHfkvakpnNam'; // a corpus post ("A challenge for AGI organizations, and a challenge for readers")
const good = (k, extra = {}) => ({
  id: `arxiv:2610.9980${k}`, kind: 'pdf', t: `An Adversarial Test Paper Number ${k} on Reasoning`, a: 'Ada Tester, Bo Example', y: 2026, d: '2026-10-01',
  url: `https://arxiv.org/pdf/2610.9980${k}`, page: `https://arxiv.org/abs/2610.9980${k}`, why: 'A synthetic test item about reasoning chains, close to DeepSeekMath.',
  tags: ['reasoning'], added: today, job: JOB, via: { source: 'arxiv', query: 'abs:"reasoning chains"', seeds: ['arxiv:2402.03300'] }, ...extra,
});
const lane = (items) => writeFileSync(join(root, 'data', 'lanes', 'llm.added.json'), JSON.stringify({ lane: 'llm', label: 'Added by agent jobs', items }));
const merge = () => execFileSync(process.execPath, [join(HERE, 'build-corpus.mjs'), '--merge', '--root', root], { stdio: 'pipe' }).toString();
const fails = async (bad) => {
  writeFileSync(join(root, 'corpus.json'), readFileSync(join(root, 'corpus.base.json')));
  lane([good(1), good(2), bad]);
  merge();
  const r = await J.checkJob(JOB, { root, dir });
  return r.lines.filter((l) => !l.ok && l.text.includes(bad.id)).map((l) => l.text).join(' | ');
};

before(() => {
  root = makeRoot({ prefix: 'stacks-adv-' });
  dir = mkdtempSync(join(tmpdir(), 'stacks-jobsdir-'));
  writeFileSync(join(root, 'corpus.base.json'), readFileSync(join(root, 'corpus.json')));
  J.ensureDirs(dir);
  writeFileSync(join(dir, 'open', JOB + '.md'), J.formatJob(J.finish({ id: JOB, type: 'discover', title: 'Find 3 open works on LLM papers › Reasoning', priority: 'high', status: 'open', created: today, key: 'discover:path:llm/Reasoning',
    target: { feature: 'path:llm/Reasoning', label: 'LLM papers › Reasoning', lane: 'llm' }, inputs: [{ id: 'arxiv:2402.03300', t: 'DeepSeekMath' }], wants: { count: 3, min: 2, max: 6 }, gen: 1 })));
});
after(() => { rmSync(root, { recursive: true, force: true }); rmSync(dir, { recursive: true, force: true }); });

test('duplicates that used to pass', async () => {
  const gql = (id) => `https://www.lesswrong.com/graphql?query=${encodeURIComponent(`{post(input:{selector:{_id:"${id}"}}){result{htmlBody}}}`)}`;
  const cases = [
    // The corpus's own id: the merge skips it silently, so the check must not count it as this job's.
    ['the same arXiv id', good(3, { id: 'arxiv:2402.03300', url: 'https://arxiv.org/pdf/2402.03300', page: 'https://arxiv.org/abs/2402.03300', t: 'A renamed copy' }), /same id/],
    ['the same post id', good(3, { id: 'lw:' + LW, kind: 'html', url: gql(LW), page: `https://www.lesswrong.com/posts/${LW}/x`, t: 'A renamed post', src: 'Alignment Forum' }), /same id/],
    ['the arXiv HTML view', good(3, { id: 'web:arxiv.org/html/2402.03300v2', kind: 'web', url: 'https://arxiv.org/html/2402.03300v2', page: 'https://arxiv.org/html/2402.03300v2', t: 'Math reasoning (HTML)' }), /same arXiv id/],
    ['a "doi:" prefix', good(3, { id: 'pdf:openreview.net/pdf/g2', url: 'https://openreview.net/pdf?id=g2', page: 'https://openreview.net/forum?id=g2', t: 'Another label for a scoring rules paper', doi: 'doi:10.1198/016214506000001437' }), /same DOI/],
    ['a forum post filed as a web page on the Alignment Forum', good(3, { id: `web:alignmentforum.org/posts/${LW}/a-challenge`, kind: 'web', url: `https://www.alignmentforum.org/posts/${LW}/a-challenge`, page: `https://www.alignmentforum.org/posts/${LW}/a-challenge`, t: 'Challenge for AGI orgs (AF)' }), /same forum post id/],
    ['twin on a true arXiv duplicate', good(3, { id: 'pdf:openreview.net/pdf/tw', url: 'https://arxiv.org/pdf/2402.03300v2', page: 'https://openreview.net/forum?id=tw', t: 'DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models', twin: 'arxiv:2402.03300' }), /same arXiv id/],
  ];
  for (const [name, bad, re] of cases) assert.match(await fails(bad), re, name);
  // A forum post must take its lw: id, whatever the duplicates.
  assert.match(await fails(good(3, { id: 'web:lesswrong.com/posts/AbCdEfGhIjKlMnOpQ', kind: 'web', url: 'https://www.lesswrong.com/posts/AbCdEfGhIjKlMnOpQ', page: 'https://www.lesswrong.com/posts/AbCdEfGhIjKlMnOpQ', t: 'A post filed as a web page' })), /takes the id lw:AbCdEfGhIjKlMnOpQ/);
  // twin still lets the same work in another form past the title key.
  assert.equal(await fails(good(3, { id: 'lw:AbCdEfGhIjKlMnOpQ', kind: 'html', url: gql('AbCdEfGhIjKlMnOpQ'), page: 'https://www.lesswrong.com/posts/AbCdEfGhIjKlMnOpQ/x', t: 'Concrete Problems in AI Safety', twin: 'arxiv:1606.06565' })), '');
});

test('closed and shadow-library links', async () => {
  assert.match(await fails(good(3, { id: 'pdf:web.archive.org/web/2024/https://libgen.rs/x.pdf', url: 'https://web.archive.org/web/2024id_/https://libgen.rs/x.pdf', page: 'https://web.archive.org/web/2024/https://libgen.rs/x', t: 'A shadow copy behind the Wayback Machine' })), /shadow library \(deny list: libgen\.\*\)/);
  assert.match(await fails(good(3, { id: 'web:doi.org/10.1038/s41586-024-07566-y', kind: 'web', url: 'https://doi.org/10.1038/s41586-024-07566-y', page: 'https://doi.org/10.1038/s41586-024-07566-y', t: 'A paper behind a paywall' })), /not a doi\.org link/);
  // The merge refuses a shadow-library link even when nobody ran the check.
  writeFileSync(join(root, 'corpus.json'), readFileSync(join(root, 'corpus.base.json')));
  lane([good(1), good(3, { id: 'pdf:libgen.rs/x.pdf', url: 'https://libgen.rs/x.pdf', page: 'https://libgen.rs/x', t: 'A shadow copy of a book' })]);
  assert.match(merge(), /pdf:libgen\.rs\/x\.pdf: on a shadow library \(libgen\.\*\), never added/);
  const ids = new Set(JSON.parse(readFileSync(join(root, 'corpus.json'), 'utf-8')).items.map((it) => it.id));
  assert.ok(ids.has('arxiv:2610.99801') && !ids.has('pdf:libgen.rs/x.pdf'));
});

test('--live reads the first bytes only and checks where redirects end', async () => {
  const srv = http.createServer((req, res) => {
    if (req.url === '/huge.pdf') { res.writeHead(200, { 'Content-Type': 'application/pdf' }); res.write('%PDF-1.4\n'); const t = setInterval(() => res.write(Buffer.alloc(65536)), 5); req.on('close', () => clearInterval(t)); return; }
    if (req.url === '/to-login') { res.writeHead(302, { Location: '/accounts/login?next=/x.pdf' }); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<form>password</form>');
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    const t0 = Date.now();
    const [huge, login] = await J.liveCheck([{ url: base + '/huge.pdf', kind: 'pdf', role: 'url' }, { url: base + '/to-login', kind: 'page', role: 'url' }], { gap: () => 0, timeout: 5000 });
    assert.ok(huge.ok && Date.now() - t0 < 4000, `a server that ignores Range: ${huge.text}`);
    assert.match(login.text, /redirects to a login page/);
  } finally { srv.close(); }
  const hosts = J.loadHosts(dir, HERE);
  const redirect = (final) => async () => { const r = new Response('%PDF-1.4', { status: 200, headers: { 'content-type': 'application/pdf' } }); Object.defineProperty(r, 'url', { value: final }); Object.defineProperty(r, 'redirected', { value: true }); return r; };
  const opts = (final) => ({ fetchImpl: redirect(final), gap: () => 0, deny: (u) => J.deniedUrl(u, hosts), allowed: (h) => J.allowedHost(h, hosts) });
  assert.match((await J.liveCheck([{ url: 'https://github.com/someone/books/raw/main/x.pdf', kind: 'pdf', role: 'url' }], opts('https://libgen.rs/x.pdf')))[0].text, /redirects to a shadow library/);
  assert.match((await J.liveCheck([{ url: 'https://openreview.net/pdf?id=x', kind: 'pdf', role: 'url' }], opts('https://paywalled.example/x.pdf')))[0].text, /redirects to paywalled\.example, not a known open host/);
  // A landing page may redirect anywhere open (a DOI resolves to the publisher).
  assert.ok((await J.liveCheck([{ url: 'https://doi.org/10.1/x', kind: 'page', role: 'page' }], opts('https://publisher.example/x')))[0].ok);
  // A post page behind Cloudflare's bot challenge is fine as a landing page, not as what the app opens.
  const challenge = async () => new Response('<html>Just a moment…</html>', { status: 403, headers: { 'content-type': 'text/html', 'cf-mitigated': 'challenge' } });
  const [pg, op] = await J.liveCheck([{ url: 'https://forum.effectivealtruism.org/posts/AbCdEfGhIjKlMnOpQ/x', kind: 'page', role: 'page' }, { url: 'https://blog.example/post', kind: 'page', role: 'url' }], { fetchImpl: challenge, gap: () => 0 });
  assert.ok(pg.ok && /bot challenge/.test(pg.text), pg.text);
  assert.ok(!op.ok && /HTTP 403/.test(op.text), op.text);
});

test('a new item that failed to open stays new however long it sat on screen', async () => {
  const L = await import('../server/learn.mjs');
  const it = { id: 'arxiv:2610.99801', added: today };
  const sat = { a: 40e3, sc: 0, pos: { c: 2 }, jl: [] };
  assert.equal(L.findState(it, sat, null, Date.now()), 'seen', 'without an open error, 40 s on it is reading');
  assert.equal(L.findState(it, sat, null, Date.now(), true), 'new', 'with one and no page seen, it is not');
  assert.equal(L.findState(it, { ...sat, sc: 3 }, null, Date.now(), true), 'seen', 'pages seen after the error count');
});

test('a server on a fresh cache writes no job files until a day after its first start', async () => {
  const { startServer, until } = await import('./stacks-root.mjs');
  const { readdirSync } = await import('fs');
  const jobsDir = mkdtempSync(join(tmpdir(), 'stacks-jobsdir-'));
  const srv = await startServer(root, { STACKS_JOBS_DIR: jobsDir, STACKS_JOBS_EVERY: '24', STACKS_JOBS_DELAY: '200' });
  try {
    await new Promise((r) => setTimeout(r, 1500));
    const j = await srv.get('/jobs');
    assert.deepEqual(readdirSync(join(jobsDir, 'open')).filter((f) => f.endsWith('.md')), [], 'nothing written on its own');
    assert.equal(j.lastRefresh, 0);
    assert.ok(j.nextRefresh > Date.now() + 23 * 3600e3, `the first automatic refresh is a day away (${new Date(j.nextRefresh).toISOString()})`);
    const r = await (await srv.post('/jobs/refresh', {})).json();
    assert.ok(Array.isArray(r.created), 'Refresh jobs still runs at once');
    await until(async () => (await srv.get('/jobs')).lastRefresh > 0, 3000);
  } finally { srv.stop(); rmSync(jobsDir, { recursive: true, force: true }); }
});
