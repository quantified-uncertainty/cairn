#!/usr/bin/env node
/**
 * Build corpus.json for the Stacks Browser: a curated set of openable items in
 * lanes chosen by the reader, rather than everything that happens to be open.
 *
 *   node build-corpus.mjs            # writes ./corpus.json
 *
 * Lanes (in key order):
 *   ai-safety           curated papers and reports (data/lanes/ai-safety.*.json,
 *                       seeds.json) + top Alignment Forum posts
 *   deepmind-safety     Google DeepMind safety work: papers and posts (data/lanes/deepmind-safety.*.json)
 *   forecasting         papers, open PDFs and the best posts (data/lanes/forecasting.*.json)
 *   quri                every page of QURI's wikis (Delegation Risk, Evaluation Engineering,
 *                       Robust Reasoning Processes, Priors), from their sitemaps
 *   llm                 landmark LLM papers (seeds.json)
 *   textbooks           free, legal technical textbooks (data/lanes/textbooks.json)
 *   lesswrong           top LessWrong posts by karma (LessWrong GraphQL API)
 *   information-theory, cybernetics, ttrpg   curated open texts (seeds.json)
 *   oddities            a small serendipity lane: the most-read public-domain
 *                       technical scans on Internet Archive
 *
 * The curated files list items whose arXiv IDs and URLs were checked against
 * the live sources (see each file's "notes"). Later files never override an
 * item already added, so the more specific lane (DeepMind safety) wins.
 * laneWeights set each lane's share of the mixed "All" feed: technical papers first.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'OpenStacksBrowser/0.2 (https://github.com/quantified-uncertainty/cairn)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LANES = {
  'ai-safety': 'AI safety',
  'deepmind-safety': 'DeepMind safety',
  forecasting: 'Forecasting',
  quri: 'QURI wikis',
  llm: 'LLM papers',
  textbooks: 'Technical books',
  lesswrong: 'LessWrong',
  'information-theory': 'Information theory',
  cybernetics: 'Cybernetics',
  ttrpg: 'TTRPG manuals',
  oddities: 'Old technical oddities',
};
const LANE_WEIGHTS = {
  'ai-safety': 1.4, 'deepmind-safety': 1.3, forecasting: 1.2, quri: 0.9, llm: 1, textbooks: 0.8,
  lesswrong: 0.8, 'information-theory': 0.6, cybernetics: 0.5, ttrpg: 0.4, oddities: 0.25,
};

async function getJson(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) return await r.json();
      console.warn(`HTTP ${r.status} ${url.slice(0, 120)}`);
    } catch (e) { console.warn(e.message); }
    await sleep(2000 * 2 ** i);
  }
  return null;
}
const gql = (host, q) => getJson(`https://${host}/graphql?query=${encodeURIComponent(q)}`);
const postBodyUrl = (host, id) => `https://${host}/graphql?query=${encodeURIComponent(`{post(input:{selector:{_id:"${id}"}}){result{htmlBody}}}`)}`;

const items = [];
const seen = new Set();
const add = (it) => { if (!seen.has(it.id)) { seen.add(it.id); items.push(it); } };
const srcOf = (it) => it.id.startsWith('arxiv:') ? 'arXiv' : it.id.startsWith('lw:') ? (it.src || 'LessWrong') : it.id.startsWith('eaf:') ? 'EA Forum'
  : it.kind === 'text' ? 'Project Gutenberg' : new URL(it.page || it.url).hostname.replace(/^www\./, '');

// 0. Curated lane files, most specific first.
const LANE_DIR = join(HERE, 'data', 'lanes');
if (existsSync(LANE_DIR)) {
  const files = readdirSync(LANE_DIR).filter((f) => f.endsWith('.json'))
    .sort((a, b) => (a.startsWith('deepmind') ? -1 : 0) - (b.startsWith('deepmind') ? -1 : 0) || a.localeCompare(b));
  for (const f of files) {
    let d;
    try { d = JSON.parse(readFileSync(join(LANE_DIR, f), 'utf-8')); } catch (e) { console.warn(`skip ${f}: ${e.message}`); continue; }
    let n = 0;
    for (const x of d.items || []) {
      if (!x.id || !x.url || !x.t) continue;
      const lane = x.lane || d.lane;
      if (!LANES[lane]) continue;
      add({ ...x, lane, src: srcOf(x), score: x.score || 0 }); n++;
    }
    console.log(`${f}: ${n}`);
  }
}

// 1. LessWrong top posts, and Alignment Forum top posts not already among them.
async function forumLane(host, lane, label, limit) {
  const d = await gql(host, `{posts(input:{terms:{view:"top",limit:${limit}}}){results{_id title slug baseScore postedAt wordCount user{displayName}}}}`);
  const posts = d?.data?.posts?.results || [];
  for (const p of posts) {
    add({
      id: `lw:${p._id}`, lane, kind: 'html', src: label,
      t: p.title, a: p.user?.displayName || '', y: Number(String(p.postedAt).slice(0, 4)), d: String(p.postedAt).slice(0, 10),
      url: postBodyUrl('www.lesswrong.com', p._id), page: `https://www.lesswrong.com/posts/${p._id}/${p.slug}`,
      words: p.wordCount, score: p.baseScore,
      why: `Top ${label} post · ${p.baseScore} karma · ${Math.max(1, Math.round((p.wordCount || 0) / 230))} min`,
    });
  }
  console.log(`${label}: ${posts.length}`);
}
await forumLane('www.lesswrong.com', 'lesswrong', 'LessWrong', 300);
await forumLane('www.alignmentforum.org', 'ai-safety', 'Alignment Forum', 150);

// 2. Curated seeds.
if (existsSync(join(HERE, 'seeds.json'))) {
  const seeds = JSON.parse(readFileSync(join(HERE, 'seeds.json'), 'utf-8'));
  for (const s of seeds.items) {
    add({ ...s, src: srcOf(s), why: s.why, score: s.score || 0 });
  }
  console.log(`seeds: ${seeds.items.length}`);
} else console.warn('seeds.json missing: curated lanes will be empty');

// 2b. QURI's wikis: every page, from each site's sitemap (or its home page's
// links when it has none), with the page's own title and description.
const QURI = [
  ['delegation-risk.quantifieduncertainty.org', 'Delegation Risk'],
  ['evaluation-engineering.quantifieduncertainty.org', 'Evaluation Engineering'],
  ['reasoning-processes.quantifieduncertainty.org', 'Robust Reasoning Processes'],
  ['priors.quantifieduncertainty.org', 'QURI Priors'],
];
async function getText(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45000) });
      if (r.ok) return await r.text();
      if (r.status === 404) return null;
    } catch { /* retry */ }
    await sleep(1500 * 2 ** i);
  }
  return null;
}
const attr = (html, re) => (html.match(re)?.[1] || '').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').trim();
await Promise.all(QURI.map(async ([host, site]) => {
  const base = `https://${host}`;
  let urls = [];
  const sm = await getText(`${base}/sitemap-0.xml`);
  if (sm) urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  else {
    const home = await getText(base + '/') || '';
    urls = [...new Set([...home.matchAll(/href="(\/[^"#?]*\/)"/g)].map((m) => base + m[1]))];
  }
  urls = urls.filter((u) => !/\/(404|tags?|_astro)\b/.test(u));
  let n = 0;
  for (const [j, u] of urls.entries()) {
    const html = await getText(u);
    await sleep(250);
    if (!html) continue;
    const title = attr(html, /<title>([^<]*)<\/title>/).replace(/\s*\|[^|]*$/, '');
    const desc = attr(html, /<meta name="description" content="([^"]*)"/);
    const words = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').split(/\s+/).length;
    if (!title || words < 150) continue;
    const path = new URL(u).pathname;
    add({
      id: `web:${host}${path.replace(/\/$/, '')}`, lane: 'quri', kind: 'web', src: site,
      t: path === '/' ? `${site} (home)` : title, a: site, url: u, page: u,
      why: desc || `${site} wiki page`, score: Math.max(1, 100 - j), words, tags: [site.toLowerCase(), ...path.split('/').filter(Boolean).slice(0, 1)],
    });
    n++;
  }
  console.log(`${site}: ${n} pages`);
}));

// 3. Old technical oddities: most-read public-domain technical scans.
const ODD = ['mathematical recreations', 'slide rule', 'telegraph', 'cryptography', 'calculating machines', 'logic', 'probabilities', 'mechanics', 'navigation', 'electricity', 'machinery', 'war games', 'chess'];
for (const subject of ODD) {
  const q = `mediatype:texts AND subject:("${subject}") AND year:[1700 TO 1928] AND language:(eng OR English) AND imagecount:[40 TO 1200] AND -collection:ericarchive AND -collection:microfilm`;
  const d = await getJson(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=imagecount&fl[]=downloads&sort[]=downloads+desc&rows=45&output=json`);
  await sleep(1000);
  for (const x of d?.response?.docs || []) {
    const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
    add({
      id: `ia:${x.identifier}`, lane: 'oddities', kind: 'scan', src: 'Internet Archive',
      t: String(one(x.title)).replace(/\s*\[microform\]/i, '').replace(/&amp;/gi, '&').slice(0, 200),
      a: String(one(x.creator)).replace(/,\s*\d{4}-?\d{0,4}\.?$/, '').slice(0, 80),
      y: Number(String(x.year).slice(0, 4)) || null, n: x.imagecount, ia: x.identifier,
      page: `https://archive.org/details/${x.identifier}`, score: x.downloads || 0,
      why: `Public-domain scan · shelved under "${subject}" · ${(x.downloads || 0).toLocaleString()} downloads`,
    });
  }
  console.log(`oddities/${subject}: ${d?.response?.docs?.length ?? 0}`);
}

// 4. Dates and lengths for forum posts that came from curated files.
const forum = items.filter((it) => /^(lw|eaf):/.test(it.id) && (!it.d || !it.words));
for (const host of ['www.lesswrong.com', 'forum.effectivealtruism.org']) {
  const ids = forum.filter((it) => it.id.startsWith(host.includes('lesswrong') ? 'lw:' : 'eaf:'));
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    const query = '{' + chunk.map((it, j) => `p${j}:post(input:{selector:{_id:"${it.id.split(':')[1]}"}}){result{postedAt wordCount baseScore}}`).join(' ') + '}';
    try {
      const r = await fetch(`https://${host}/graphql`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': UA }, body: JSON.stringify({ query }) });
      const d = (await r.json()).data || {};
      chunk.forEach((it, j) => {
        const p = d['p' + j]?.result; if (!p) return;
        it.d ||= String(p.postedAt).slice(0, 10); it.y ||= Number(it.d.slice(0, 4));
        it.words ||= p.wordCount; if (!it.karma) it.karma = p.baseScore;
      });
    } catch (e) { console.warn('post metadata:', e.message); }
    await sleep(1000);
  }
}

// Only forum posts are fetched as GraphQL JSON; other HTML pages are web articles.
for (const it of items) if (it.kind === 'html' && !/\/graphql\b/.test(it.url)) it.kind = 'web';

// 5. Quality as a percentile within each lane and family (posts vs documents),
// so karma and citation-style scores are comparable; unscored curated items
// sit at the median.
const groups = {};
for (const it of items) (groups[`${it.lane}|${it.kind === 'html' || it.kind === 'web' ? 'post' : 'doc'}`] ||= []).push(it);
for (const g of Object.values(groups)) {
  const scored = g.filter((it) => it.score > 0).sort((a, b) => a.score - b.score);
  scored.forEach((it, r) => { it.q = Math.round((scored.length > 1 ? r / (scored.length - 1) : 0.5) * 100) / 100; });
  for (const it of g) if (it.q == null) it.q = 0.5;
}

writeFileSync(join(HERE, 'corpus.json'), JSON.stringify({
  built: new Date().toISOString().slice(0, 10),
  lanes: Object.fromEntries(Object.entries(LANES).filter(([k]) => items.some((it) => it.lane === k))),
  laneWeights: LANE_WEIGHTS,
  counts: items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {}),
  items,
}));
console.log(`Wrote ${items.length} items`, items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {}));
