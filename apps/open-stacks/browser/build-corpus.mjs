#!/usr/bin/env node
/**
 * Build corpus.json for the Stacks Browser: a curated set of openable items in
 * lanes chosen by the reader, rather than everything that happens to be open.
 *
 *   node build-corpus.mjs            # writes ./corpus.json
 *
 * Lanes:
 *   lesswrong           top LessWrong posts by karma (LessWrong GraphQL API)
 *   ai-safety           curated papers (seeds.json) + top Alignment Forum posts
 *   llm                 curated landmark LLM papers (seeds.json)
 *   information-theory  curated open texts (seeds.json)
 *   cybernetics         curated open texts (seeds.json)
 *   ttrpg               openly licensed tabletop RPG manuals (seeds.json)
 *   oddities            a small serendipity lane: the most-read public-domain
 *                       technical scans on Internet Archive
 *
 * seeds.json is a hand-curated list whose arXiv IDs and URLs were checked
 * against the live sources; see its header.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const UA = 'OpenStacksBrowser/0.2 (https://github.com/quantified-uncertainty/cairn)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LANES = {
  lesswrong: 'LessWrong',
  'ai-safety': 'AI safety',
  llm: 'LLM papers',
  'information-theory': 'Information theory',
  cybernetics: 'Cybernetics',
  ttrpg: 'TTRPG manuals',
  oddities: 'Old technical oddities',
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

// 1. LessWrong top posts, and Alignment Forum top posts not already among them.
async function forumLane(host, lane, label, limit) {
  const d = await gql(host, `{posts(input:{terms:{view:"top",limit:${limit}}}){results{_id title slug baseScore postedAt wordCount user{displayName}}}}`);
  const posts = d?.data?.posts?.results || [];
  for (const p of posts) {
    add({
      id: `lw:${p._id}`, lane, kind: 'html', src: label,
      t: p.title, a: p.user?.displayName || '', y: Number(String(p.postedAt).slice(0, 4)),
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
    const src = s.id.startsWith('arxiv:') ? 'arXiv' : s.kind === 'text' ? 'Project Gutenberg' : new URL(s.page || s.url).hostname.replace(/^www\./, '');
    add({ ...s, src, why: s.why, score: s.score || 0 });
  }
  console.log(`seeds: ${seeds.items.length}`);
} else console.warn('seeds.json missing: curated lanes will be empty');

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

writeFileSync(join(HERE, 'corpus.json'), JSON.stringify({
  built: new Date().toISOString().slice(0, 10),
  lanes: LANES,
  counts: items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {}),
  items,
}));
console.log(`Wrote ${items.length} items`, items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {}));
