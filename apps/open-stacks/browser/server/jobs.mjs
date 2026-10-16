// Agent jobs (docs/learning/spec.md §7): the app turns what it learned from reading,
// and gaps in the library, into open jobs, one Markdown file each in jobs/open/.
// An outside agent (Claude Code pointed at this repo) does a job by following
// jobs/README.md, edits the data files, checks its work with `node jobs.mjs check`
// and closes it with `node jobs.mjs done`. This module holds what the server
// (routes/96-jobs.mjs) and the CLI (jobs.mjs) share: the file format, the
// generator and its body templates, the privacy lint, the checker, the dedupe
// keys, and the moves (done, drop, dismiss).
//
// Job files are public (the repository is). They hold public ids, titles,
// authors, lane and tag labels, counts wanted and error statuses, never reading
// history: privacyLint() guards the templates.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'fs';
import { join, relative, isAbsolute, resolve } from 'path';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { firstAuthor, firstAuthorName, localDay, dateAt } from './learn.mjs';

export const GEN = 1;
/** Types in the order jobs are written and picked. */
export const TYPES = ['flag', 'fix-item', 'discover', 'follow-author', 'grow-lane', 'media', 'metadata', 'tag', 'thread'];
export const PRIORITIES = ['high', 'normal', 'low'];
export const STATUSES = ['open', 'done', 'dropped', 'dismissed'];
export const CAPS = { total: 30, discover: 4, 'follow-author': 3, 'grow-lane': 2, 'fix-item': 3, media: 2, tag: 2, metadata: 2, thread: 1 };
export const COOL = { discover: 14, 'follow-author': 30, 'grow-lane': 21, 'fix-item': 14, media: 14, tag: 14, metadata: 30, thread: 7 };
export const BATCH = { 'fix-item': 10, media: 20, tag: 60, metadata: 40, thread: 25 };
export const SOURCES = ['arxiv', 'semantic-scholar', 'openalex', 'lesswrong', 'alignment-forum', 'eaforum', 'internet-archive', 'quri', 'publisher', 'author-site', 'wayback', 'manual', 'other'];
export const FLAG_KINDS = { open: "Doesn't open or wrong file", garbled: 'Pages missing or garbled', images: 'Images broken', meta: 'Wrong title, author or date', place: 'Wrong lane or folder', duplicate: 'Duplicate', other: 'Other' };
const KEY_ORDER = ['id', 'type', 'title', 'priority', 'status', 'created', 'done', 'by', 'key', 'target', 'inputs', 'wants', 'output', 'acceptance', 'result', 'gen'];
const DAY = 864e5;
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const readJson = (f, dflt) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return dflt; } };
const writeAtomic = (f, s) => { writeFileSync(f + '.tmp', s); renameSync(f + '.tmp', f); };
const trunc = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const ARXIV_RE = /^arxiv:((\d{4}\.\d{4,5})|([a-z-]+(\.[A-Z]{2})?\/\d{7}))$/i;

// ------------------------------------------------------------------ format ----
/**
 * Parse a job file: YAML frontmatter restricted to one `key: <JSON>` per line, then a
 * Markdown body. → {job: {...fields, body} | null, errors: [string]}
 */
export function parseJob(text) {
  const errors = [];
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/.exec(String(text || ''));
  if (!m) return { job: null, errors: ['no frontmatter: the file must start with a line "---", then one "key: <JSON>" per line, then "---"'] };
  const job = {};
  m[1].split(/\r?\n/).forEach((line, k) => {
    if (!line.trim()) return;
    const at = line.indexOf(': ');
    const key = at > 0 ? line.slice(0, at) : '';
    if (!/^[a-z][a-zA-Z0-9_-]*$/.test(key)) { errors.push(`frontmatter line ${k + 2}: expected "key: <JSON value>", got ${JSON.stringify(trunc(line, 60))}`); return; }
    if (key in job) { errors.push(`frontmatter line ${k + 2}: ${key} appears twice`); return; }
    try { job[key] = JSON.parse(line.slice(at + 2)); } catch (e) { errors.push(`frontmatter line ${k + 2} (${key}): the value is not JSON (${e.message}); strings need double quotes`); }
  });
  job.body = (m[2] || '').replace(/^\r?\n/, '');
  for (const k of ['id', 'type', 'title', 'priority', 'status', 'created', 'key']) if (job[k] == null) errors.push(`missing ${k}`);
  if (job.type != null && !TYPES.includes(job.type)) errors.push(`type ${JSON.stringify(job.type)} is not one of ${TYPES.join(', ')}`);
  if (job.priority != null && !PRIORITIES.includes(job.priority)) errors.push(`priority must be high, normal or low`);
  if (job.status != null && !STATUSES.includes(job.status)) errors.push(`status must be one of ${STATUSES.join(', ')}`);
  if (job.id != null && !/^[a-z-]+-\d{4,}$/.test(job.id)) errors.push(`id ${JSON.stringify(job.id)} must look like <type>-0001`);
  if (job.id && job.type && !String(job.id).startsWith(job.type + '-')) errors.push(`id ${job.id} does not start with its type ${job.type}`);
  for (const k of ['created', 'done']) if (job[k] != null && !/^\d{4}-\d{2}-\d{2}$/.test(job[k])) errors.push(`${k} must be a date YYYY-MM-DD`);
  for (const k of ['inputs', 'output', 'acceptance']) if (job[k] != null && !Array.isArray(job[k])) errors.push(`${k} must be a JSON array`);
  return { job: errors.some((e) => /^no frontmatter/.test(e)) ? null : job, errors };
}
/** The file text of a job (fields in a fixed order, then the body). */
export function formatJob(job) {
  const lines = [];
  const put = (k) => { if (job[k] !== undefined && k !== 'body') lines.push(`${k}: ${JSON.stringify(job[k])}`); };
  for (const k of KEY_ORDER) put(k);
  for (const k of Object.keys(job)) if (!KEY_ORDER.includes(k)) put(k);
  const body = String(job.body || '').replace(/^\n+/, '').replace(/\s*$/, '\n');
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ------------------------------------------------------------- the folders ----
export const dirsOf = (root) => ({ root, open: join(root, 'open'), done: join(root, 'done'), assets: join(root, 'assets') });
export function ensureDirs(root) { const d = dirsOf(root); for (const x of [d.open, d.done, d.assets]) mkdirSync(x, { recursive: true }); return d; }
/** Every job file in open/ and done/: [{file, where, text, job, errors, mtime}]. */
export function listJobs(root) {
  const d = dirsOf(root), out = { open: [], done: [] };
  for (const where of ['open', 'done']) {
    let names = [];
    try { names = readdirSync(d[where]).filter((f) => f.endsWith('.md')); } catch { continue; }
    for (const f of names.sort()) {
      const file = join(d[where], f);
      let text = '';
      try { text = readFileSync(file, 'utf-8'); } catch { continue; }
      const { job, errors } = parseJob(text);
      out[where].push({ file, where, name: f, text, job, errors, mtime: statSync(file).mtimeMs });
    }
  }
  return out;
}
/** The next id for a type: the highest number in open/ and done/, plus 1. */
export function nextId(type, root) {
  const d = dirsOf(root);
  let max = 0;
  const re = new RegExp(`^${type.replace(/[-]/g, '\\-')}-(\\d+)\\.md$`);
  for (const dir of [d.open, d.done]) { try { for (const f of readdirSync(dir)) { const m = re.exec(f); if (m) max = Math.max(max, +m[1]); } } catch { /* none */ } }
  return `${type}-${String(max + 1).padStart(4, '0')}`;
}
/** Write a new job with the next free id (the `wx` flag; retried on a clash). build(id) → job. → {id, file, text} */
export function writeNew(root, type, build) {
  const d = ensureDirs(root);
  for (let k = 0; k < 50; k++) {
    const id = nextId(type, root);
    const job = build(id);
    const text = formatJob(job);
    try { writeFileSync(join(d.open, id + '.md'), text, { flag: 'wx' }); return { id, file: join(d.open, id + '.md'), text, job }; } catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
  throw new Error('could not find a free job id');
}

// ---------------------------------------------------------------- privacy ----
export const LINT = [/\byou(r|'re|'ve)?\b/i, /\bminutes?\b/i, /\bhours?\b/i, /\bvisits?\b/i, /\bpages? (seen|read)\b/i, /\b(read|skimmed|skipped|saved) (it|this|these|\d)\b/i,
  /\bengagement\b/i, /\blambda\b/i, /λ/, /\binterest(s|ed)?\b/i, /\bhistory\b/i, /\bdwell\b/i, /\b\d+ ?(min|mins|h|hrs|s|sec|secs|seconds)\b/i];
/** The public strings of a job (titles, authors, labels, ids, URLs) that the lint masks first. */
export function publicStrings(job) {
  const out = new Set();
  const add = (v) => { if (typeof v === 'string' && v.trim().length >= 2) out.add(v.trim()); else if (Array.isArray(v)) v.forEach(add); };
  for (const x of [...(job.inputs || []), job.target || {}]) if (x && typeof x === 'object') for (const k of ['t', 'a', 'name', 'id', 'url', 'page', 'label', 'feature', 'lane', 'laneName', 'item', 'alt', 'author', 'problem', 'missing']) add(x[k]);
  add(job.id); add(job.key);
  return [...out];
}
/** Hits of the privacy patterns in text, after masking the public strings (and URLs) with §. */
export function privacyLint(text, publics = []) {
  let s = String(text || '');
  for (const p of [...publics].filter((x) => x && x.length >= 2).sort((a, b) => b.length - a.length)) s = s.split(p).join('§');
  s = s.replace(/https?:\/\/[^\s)>"'`]+/g, '§');
  const hits = [];
  for (const re of LINT) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (const m of s.matchAll(g)) hits.push({ pattern: re.source, match: m[0], near: s.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, ' ') });
  }
  return hits;
}
/** Lint a whole job file (text) with its own public strings, minus a flag's note. */
export function lintJob(job, text = formatJob(job), extra = []) {
  const note = job.type === 'flag' && job.target?.note ? [job.target.note] : [];
  return privacyLint(text, [...publicStrings(job), ...note, ...extra]);
}

// ------------------------------------------------------------- the prompts ----
export const allPrompt = (repo) => `In the cairn repo, open ${repo}/jobs/README.md and do the open jobs in ${repo}/jobs/open/, highest priority first (node jobs.mjs next). For each job: follow the playbook, run node jobs.mjs check <id> --live, then node jobs.mjs done <id>, and commit with the command it prints (one commit per job). Stop after 5 jobs or 60 minutes and summarise what you did.`;
export const jobPrompt = (id, repo) => `In the cairn repo, do job ${id} (${repo}/jobs/open/${id}.md) following ${repo}/jobs/README.md: check it with node jobs.mjs check ${id} --live, close it with node jobs.mjs done ${id}, and commit with the command it prints.`;
/** The browser folder relative to the git root ("apps/open-stacks/browser"). */
export function repoPathOf(here) {
  let d = resolve(here);
  for (let k = 0; k < 12; k++) { if (existsSync(join(d, '.git'))) return relative(d, resolve(here)).split('\\').join('/') || '.'; const up = resolve(d, '..'); if (up === d) break; d = up; }
  return 'apps/open-stacks/browser';
}

// ---------------------------------------------------------- body templates ----
const FINISH = (id, title, merge = true) => `## Finish\n\n${merge ? '`node build-corpus.mjs --merge`, then ' : ''}\`node jobs.mjs check ${id} --live\`, then \`node jobs.mjs done ${id} --note "…"\`, then commit the files \`done\` lists as "Stacks job ${id}: ${title}".\n`;
const lineOf = (x) => `- ${x.t} (${x.id})`;
const seedsOf = (inputs) => inputs.filter((x) => !x.ex);
/** Where to look, from the kinds of the seeds (README section 6). */
function whereToLook(seeds, lane) {
  const ids = seeds.map((s) => s.id || '');
  const has = (re) => ids.some((id) => re.test(id));
  const out = [];
  if (has(/^arxiv:/) || has(/^pdf:/)) out.push('Semantic Scholar recommendations with the arXiv or DOI seeds as positives, one call for this topic (README section 6.2).', 'arXiv phrase queries built from the topic and the seeds\' titles, in the seeds\' categories, over the last 24 months (README section 6.1).');
  if (has(/^(lw|eaf):/) || ['lesswrong', 'ai-safety', 'forecasting'].includes(lane)) out.push('LessWrong, the Alignment Forum and the EA Forum: top posts in the nearest tag since 2023, and posts by the seeds\' authors (README section 6.4).');
  if (has(/^ia:/) || ['oddities', 'ttrpg', 'information-theory', 'cybernetics'].includes(lane)) out.push('The Internet Archive: subject and title searches, published 1930 or earlier, no lending-library scans (README section 6.5).');
  if (lane === 'quri' || has(/quantifieduncertainty/)) out.push('The QURI wikis: pages in their sitemaps that the corpus lacks (README section 6.6).');
  if (!out.length) out.push('Semantic Scholar recommendations from the seeds (README section 6.2), then arXiv phrase queries (6.1).');
  out.push('Publisher and author pages for open PDFs (README section 6.7).');
  return out.map((s, k) => `${k + 1}. ${s}`).join('\n');
}
/** The Markdown body of a generated job (written once the id is known). */
export function bodyOf(job) {
  const { id, type, title, target = {}, inputs = [], wants = {} } = job;
  switch (type) {
    case 'discover': return `## What to do

Find ${wants.count} open works (papers, reports or long posts) on **${target.label}** that sit close to the ${seedsOf(inputs).length ? 'seed items' : 'examples'} below: the same questions, methods or debates, by other authors as well as the same ones. Prefer work from the last three years; at most two older classics the library is missing. Each item must be free to read without a login and must not already be in the corpus (\`node jobs.mjs lookup "<title or id>"\`). Put each item in the lane where it fits best; most will fit \`${target.lane}\`. Add between ${wants.min} and ${wants.max} items, each with \`job: "${id}"\` (README section 3).
${seedsOf(inputs).length ? `\n## Seeds\n\n${seedsOf(inputs).map(lineOf).join('\n')}\n` : ''}${inputs.some((x) => x.ex) ? `\n## Examples already in the library\n\n${inputs.filter((x) => x.ex).map(lineOf).join('\n')}\n` : ''}
## Where to look

${whereToLook(inputs, target.lane)}

${FINISH(id, title)}`;
    case 'follow-author': return `## What to do

Find up to ${wants.max} open works by **${target.name}** (first or main author) that are not in the corpus yet, newest first. Make sure each one is by the same person (co-authors, affiliation, topic), not a namesake. Add at least ${wants.min}, each with \`job: "${id}"\`; if nothing new and open exists, drop the job: \`node jobs.mjs drop ${id} --why "…"\`.

## Works by ${target.name} already in the corpus

${inputs.map(lineOf).join('\n')}

## Where to look

1. arXiv: \`au:"${target.name}"\`, sorted by submission date (README section 6.1).
2. Semantic Scholar: the author id from a seed paper's \`authors\` list, then that author's papers (README section 6.2).
3. Forum writers: their LessWrong, Alignment Forum or EA Forum posts (\`userPosts\`, README section 6.4).
4. The author's own page for open PDFs (README section 6.7).

${FINISH(id, title)}`;
    case 'grow-lane': return `## What to do

Grow the **${target.laneName}** lane (\`${target.lane}\`): add ${wants.count} more open items that belong in it (${wants.min} to ${wants.max}), the strongest open works on its main topics that the corpus lacks. The anchors below show its flavour; \`node jobs.mjs lookup --lane ${target.lane}\` lists its folders. Each item gets \`job: "${id}"\`.

## Anchors

${inputs.map(lineOf).join('\n')}

## Where to look

${whereToLook(inputs, target.lane)}

${FINISH(id, title)}`;
    case 'fix-item': return `## What to do

These items do not open, or open the wrong thing. For each item, find a working legal open copy of the same work (the publisher's open PDF, the author's page, arXiv, the Internet Archive, the Wayback Machine). Record it in \`data/overrides.json\` (\`url\`, \`page\`, \`kind\`…), or, if none exists, set \`drop: true\` with \`why\`. Each entry also gets \`fixed\` (the date) and \`job: "${id}"\` (README section 7).

## Items

${inputs.map((x) => `- ${x.t} (${x.id}): ${x.problem}. Now: ${x.url || 'no URL'}`).join('\n')}

${FINISH(id, title)}`;
    case 'media': return `## What to do

These images in corpus items do not load (removed, blocked, or replaced by a placeholder). For each one, find the same image elsewhere: another size in the post's own source, the author's site, a mirror, or the Wayback Machine (the raw \`id_\` form, README section 7). Record it in \`data/media-fixes.json\` under \`images["<image url>"]\` as \`{"from": "<working url>", "why", "added", "job": "${id}"}\`, or \`{"from": null, "gone": true, "why", "added", "job": "${id}"}\` when no copy exists.

## Images

${inputs.map((x) => `- In ${x.t} (${x.item})${x.page != null ? `, p. ${x.page}` : ''}: ${x.url}${x.alt ? ` (alt: "${trunc(x.alt, 80)}")` : ''}`).join('\n')}

${FINISH(id, title, false)}`;
    case 'tag': return `## What to do

These items have no tags. Give each one 1 to 4 tags from \`data/tags.json\`: add the item's id to each tag's \`items\`. A new tag needs \`id\`, \`label\`, \`kind\` and \`desc\`, and should fit at least three items (README section 7).

## Items

${inputs.map(lineOf).join('\n')}

${FINISH(id, title, false)}`;
    case 'thread': return `## What to do

Write a thread for each item below and add it to \`data/threads.json\` under the item's id, in the format and by the rules of \`docs/feeds/threads.md\` (sections 2 and 3): 4 to 7 posts, the hook first, then what was found, how, the figure, what it changes, the caveat and what to read. Read the whole source first. Every post cites one place with a quote of at most 25 words copied exactly from the source, and every number in a post must be in the source. Set \`model\` to the model that wrote it and \`written\` to today's date.

Then check them against their sources: \`node threads.mjs verify --ids <the ids>\` fetches each source, finds every quote again, sets pages and \`checks\`, and drops the posts that fail. (With an API key, \`node threads.mjs --ids <the ids>\` has Claude Haiku write them instead; it prints the cost first.)

## Items

${inputs.map(lineOf).join('\n')}

${FINISH(id, title, false)}`;
    case 'metadata': return `## What to do

These items lack an author or a date. Find each from the item's own page or file (the title page, arXiv, the publisher, the Internet Archive's metadata). Record it in \`data/overrides.json\` (\`a\`, \`y\`, \`d\`) with \`why\`, \`fixed\` and \`job: "${id}"\`. When a field cannot be found, set \`unknown: ["a"]\` (or \`["y"]\`) with \`why\` (README section 7).

## Items

${inputs.map((x) => `- ${x.t} (${x.id}): no ${x.missing.map((k) => ({ a: 'author', y: 'date' })[k] || k).join(' or ')}`).join('\n')}

${FINISH(id, title)}`;
    case 'flag': {
      const v = target.view || {};
      return `## The flag

- Item: ${target.t} (${target.id}), lane \`${target.lane}\`
- Where: p. ${target.page ?? '?'}
- Kind: ${FLAG_KINDS[target.kind] || target.kind}
- View: zoom ${!!v.zoom}, pages per screen ${v.per ?? '?'}, crop ${!!v.crop}, columns ${!!v.cols}, flow ${!!v.flow}, theme ${v.theme || 'default'}
- Picture: ${target.asset ? `\`jobs/assets/${target.asset}\`` : 'none'}
- Source: ${target.url || 'no URL'}

## Note from the reader

${target.note ? target.note.split('\n').map((l) => '> ' + l).join('\n') : '(none)'}

## What to do

Find the cause and fix the data: a better open copy, or a corrected title, author, date, lane or folder (\`data/overrides.json\`), or a broken image (\`data/media-fixes.json\`). If the cause is an app bug, describe it in the Result; fix it in code only if the fix is small and clearly in scope, with a test. \`done\` needs a note here: say what was wrong and what changed.

${FINISH(id, title)}`;
    }
    default: return '';
  }
}
const ACCEPT = {
  discover: (j) => [`${j.wants.min} to ${j.wants.max} new items with job ${j.id} in data/lanes/*.added.json`, 'each new item passes the item rules (jobs/README.md, section 3)', 'no new item duplicates the corpus', 'every URL is on an open host and answers (check --live)', 'corpus.json rebuilt with node build-corpus.mjs --merge'],
  'fix-item': (j) => [`every listed item has an entry with job ${j.id} in data/overrides.json: a working open copy, or drop: true with why`, 'new URLs are on open hosts and answer (check --live)', 'corpus.json rebuilt with node build-corpus.mjs --merge'],
  media: (j) => [`every listed image has an entry with job ${j.id} in data/media-fixes.json: from (an open host or web.archive.org), or gone: true with why`, 'every from URL answers with an image (check --live)'],
  tag: () => ['every listed item is in at least one tag in data/tags.json', 'every tag has id, label, kind and desc'],
  thread: () => ['every listed item has a thread in data/threads.json: 4 to 7 posts, the hook first', 'every quote was found again in the source by node threads.mjs verify (cite.ok, checks.at)'],
  metadata: (j) => [`every listed item has an entry with job ${j.id} in data/overrides.json: the missing fields, or unknown with why`, 'corpus.json rebuilt with node build-corpus.mjs --merge'],
  flag: () => ['the cause is found and fixed in the data files, or described in the Result', 'every data file touched still validates', 'done with --note'],
};
ACCEPT['follow-author'] = ACCEPT.discover; ACCEPT['grow-lane'] = ACCEPT.discover;
const OUTPUT = {
  discover: (j) => [`data/lanes/${j.target.lane}.added.json`, 'corpus.json'], 'follow-author': (j) => [`data/lanes/${j.target.lane}.added.json`, 'corpus.json'], 'grow-lane': (j) => [`data/lanes/${j.target.lane}.added.json`, 'corpus.json'],
  'fix-item': () => ['data/overrides.json', 'corpus.json'], media: () => ['data/media-fixes.json'], tag: () => ['data/tags.json'], metadata: () => ['data/overrides.json', 'corpus.json'], thread: () => ['data/threads.json'],
  flag: () => ['data/overrides.json', 'data/media-fixes.json', 'corpus.json'],
};
/** Fill in a job's id-dependent parts: output, acceptance, body. */
export function finish(job) {
  job.output = OUTPUT[job.type](job);
  job.acceptance = ACCEPT[job.type](job);
  job.body = bodyOf(job);
  return job;
}

// --------------------------------------------------------------- generator ----
const TOPICAL_SKIP = /^(\d{4}([–-]\d{4})?|Undated|Before \d{4}|\d{4} and later|\d{4}–\d{4}|Other|Not in the sidebar|Posts|Papers & reports|Blog & posts)$/;
const WANTS = { high: { count: 10, min: 6, max: 15 }, normal: { count: 8, min: 5, max: 12 }, low: { count: 6, min: 3, max: 10 } };
const dateKey = (it) => { if (it?.d) return it.d; if (it?.y) return String(it.y); const m = /^arxiv:(\d{2})(\d{2})/.exec(it?.id || ''); return m ? `20${m[1]}-${m[2]}` : ''; };
const pub = (it) => ({ id: it.id, t: trunc(it.t, 200) });

/**
 * Candidate jobs from the profile and the library's state (spec §7.2), best first within each type.
 * ctx: {profile, index, items, lanes, rescue: {docs, imgs}, errors: {items}, tags, overrides, mediaFixes, closed: [jobs], open: [jobs], now}
 * → [{type, key, priority, rank, title, target, inputs, wants}]
 */
export function candidates(ctx) {
  const { profile: P, index, items = [], lanes = {}, now = Date.now() } = ctx;
  const out = [];
  const byId = index?.byId || new Map(items.map((it, i) => [it.id, i]));
  const itemOf = (id) => { const i = byId.get(id); return i == null ? null : items[i]; };
  const feats = (id) => { const i = byId.get(id); return i == null || !index ? [] : index.feats[i]; };
  const has = (id, f) => feats(id).some((x) => x[1] === f);
  const recentClosed = (key, days) => (ctx.closed || []).filter((j) => j.key === key && j.done && now - dateAt(j.done) < days * DAY);
  const closedIds = (type, days, field = 'id') => {
    const s = new Set();
    for (const j of ctx.closed || []) if (j.type === type && j.done && now - dateAt(j.done) < days * DAY) for (const x of j.inputs || []) s.add(x[field]);
    return s;
  };
  const openIds = (type, field = 'id') => { const s = new Set(); for (const j of ctx.open || []) if (j.type === type) for (const x of j.inputs || []) s.add(x[field]); return s; };
  const reading = !!P && P.exposures >= 10;
  const feat = P?.feat || {};
  const seeds = (P?.seeds || []).filter((id) => itemOf(id));

  // discover: a topic (tag, field at depth ≥ 2, topical folder) read well, or boosted.
  if (P) {
    const cands = [];
    for (const [f, x] of Object.entries(feat)) {
      if (!['tag', 'field', 'path'].includes(x.g)) continue;
      if (x.g === 'field' && !f.includes('/')) continue;
      if (x.g === 'path' && TOPICAL_SKIP.test(f.split('/').at(-1))) continue;
      if (x.ctl === 'mute' || x.ctl === 'ignore') continue;
      const boosted = x.ctl === 'boost';
      const with_ = seeds.filter((id) => has(id, f));
      if (!boosted && !(reading && x.l >= 0.5 && x.W >= 2 && with_.length >= 2)) continue;
      // Seeds are items the reader valued (2-5, one topic). Library examples stand in only for a
      // boosted topic with fewer than 2 seeds: padding a read topic with unread items mixes topics
      // (an RL-for-reasoning job once got an AI-safety paper as its third "seed").
      let ins = with_.slice(0, 5), ex = new Set();
      if (ins.length < 2) {
        const more = (index?.inv.get(f) ? [...index.inv.get(f)] : []).map((i) => items[i]).filter((it) => !ins.includes(it.id)).sort((a, b) => (b.q ?? 0.5) - (a.q ?? 0.5));
        for (const it of more) { if (ins.length >= 3) break; ins.push(it.id); ex.add(it.id); }
      }
      if (!ins.length) continue;
      const laneOf = () => {
        if (x.g === 'path') return f.slice(5).split('/')[0];
        const c = {}; for (const id of ins) { const l = itemOf(id)?.lane; if (l) c[l] = (c[l] || 0) + 1; }
        return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ai-safety';
      };
      const priority = boosted || (x.l >= 1 && x.W >= 4) ? 'high' : x.l >= 0.75 ? 'normal' : 'low';
      cands.push({ f, x, boosted, seedSet: with_, ins, ex, lane: laneOf(), priority, rank: x.l * Math.sqrt(Math.max(x.W, 1)) });
    }
    cands.sort((a, b) => b.rank - a.rank);
    const kept = [];
    for (const c of cands) {
      // Skip a topic whose seeds the jobs ranked above it already cover (80%), together, not only one by one:
      // one cluster of reading otherwise fills the cap with its tag, its folders and its field.
      const covered = new Set(kept.flatMap((k) => k.seedSet));
      if (c.seedSet.length && c.seedSet.filter((s) => covered.has(s)).length >= 0.8 * c.seedSet.length) continue;
      kept.push(c);
      const ins = c.ins.map(itemOf).filter(Boolean).sort((a, b) => (c.ex.has(a.id) - c.ex.has(b.id)) || (dateKey(a) < dateKey(b) ? 1 : -1)).map((it) => (c.ex.has(it.id) ? { ...pub(it), ex: true } : pub(it)));
      const wants = { ...WANTS[c.priority] };
      out.push({ type: 'discover', key: `discover:${c.f}`, priority: c.priority, rank: c.rank, title: `Find ${wants.count} open works on ${c.x.label}`,
        target: { feature: c.f, label: c.x.label, lane: c.lane }, inputs: ins, wants });
    }
  }

  // follow-author: a first author read well, with at least two seeds.
  if (P && reading) {
    for (const [f, x] of Object.entries(feat)) {
      if (x.g !== 'author' || x.ctl === 'mute' || x.ctl === 'ignore' || !(x.l >= 0.7 && x.W >= 2)) continue;
      const au = f.slice(3);
      const ss = seeds.filter((id) => firstAuthor(itemOf(id)?.a) === au);
      if (ss.length < 2) continue;
      const names = {}; for (const id of ss) { const n = firstAuthorName(itemOf(id).a); names[n] = (names[n] || 0) + 1; }
      const name = Object.entries(names).sort((a, b) => b[1] - a[1])[0][0];
      const c = {}; for (const id of ss) { const l = itemOf(id).lane; c[l] = (c[l] || 0) + 1; }
      const lane = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
      out.push({ type: 'follow-author', key: `follow-author:${au}`, priority: 'normal', rank: x.l * Math.sqrt(x.W), title: `Follow ${name}: up to 10 new open works`,
        target: { feature: f, author: au, name, label: name, lane }, inputs: ss.slice(0, 3).map((id) => pub(itemOf(id))), wants: { count: 5, min: 1, max: 10 } });
    }
  }

  // grow-lane: a lane read well (or boosted) with few strong unread items left.
  if (P) {
    const unreadStrong = {};
    for (const it of items) if (!P.items?.[it.id] && (P.pred?.[it.id] || 0) >= 0.3) unreadStrong[it.lane] = (unreadStrong[it.lane] || 0) + 1;
    for (const l of new Set(items.map((it) => it.lane))) {
      const x = feat['lane:' + l], ctl = x?.ctl;
      if (ctl === 'mute' || ctl === 'ignore') continue;
      if (!(ctl === 'boost' || (reading && (P.lanes?.[l] ?? 0) >= 0.5))) continue;
      if ((unreadStrong[l] || 0) >= 20) continue;
      let anchors = seeds.filter((id) => itemOf(id).lane === l).slice(0, 5);
      if (!anchors.length) anchors = items.filter((it) => it.lane === l).sort((a, b) => (b.q ?? 0.5) - (a.q ?? 0.5)).slice(0, 5).map((it) => it.id);
      const name = lanes[l] || l;
      out.push({ type: 'grow-lane', key: `grow-lane:${l}`, priority: 'normal', rank: P.lanes?.[l] ?? 0, title: `Grow the ${name} lane by 15 open items`,
        target: { lane: l, laneName: name, label: name }, inputs: anchors.map((id) => pub(itemOf(id))), wants: { count: 15, min: 8, max: 25 } });
    }
  }

  // fix-item: items that do not open.
  {
    const skip = new Set([...closedIds('fix-item', COOL['fix-item']), ...openIds('fix-item')]);
    const ov = ctx.overrides?.items || {};
    const docs = ctx.rescue?.docs || {}, errs = ctx.errors?.items || {};
    const byLane = new Map();
    for (const it of items) {
      if (skip.has(it.id)) continue;
      let problem = null;
      for (const u of [it.url, it.page, it.pdf]) { const r = u && docs[u]; if (r?.st === 'bad') { problem = r.why ? trunc(`fails to open: ${r.why}`, 100) : 'dead page'; break; } }
      const e = errs[it.id];
      if (!problem && e && ((e.n >= 2 && (e.days || []).length >= 2) || [404, 410, 451].includes(e.status))) {
        if (ov[it.id]?.fixed && (e.days || []).every((d) => d <= ov[it.id].fixed)) continue; // fixed after the errors
        problem = e.status ? `HTTP ${e.status}` : `fails to open: ${trunc(e.msg || 'error', 80)}`;
      }
      if (!problem) continue;
      if (!byLane.has(it.lane)) byLane.set(it.lane, []);
      byLane.get(it.lane).push({ id: it.id, t: trunc(it.t, 200), url: it.url || it.page || '', problem });
    }
    for (const [l, list] of byLane) {
      const ins = list.slice(0, BATCH['fix-item']);
      out.push({ type: 'fix-item', key: `fix-item:${l}`, priority: ins.length >= 5 ? 'high' : 'normal', rank: ins.length, title: `Fix ${ins.length} item${ins.length > 1 ? 's' : ''} that fail to open in ${lanes[l] || l}`,
        target: { lane: l, laneName: lanes[l] || l, label: lanes[l] || l }, inputs: ins, wants: { all: true, count: ins.length }, more: list.slice(BATCH['fix-item']) });
    }
  }

  // media: broken images in corpus items that the rescue could not fix.
  {
    const skip = new Set([...closedIds('media', COOL.media, 'url'), ...openIds('media', 'url')]);
    const fixed = ctx.mediaFixes?.images || {};
    const byLane = new Map();
    for (const [u, r] of Object.entries(ctx.rescue?.imgs || {})) {
      if (r?.st !== 'bad' || fixed[u] || skip.has(u)) continue;
      const it = itemOf(r.ctx?.item);
      if (!it) continue;
      if (!byLane.has(it.lane)) byLane.set(it.lane, []);
      byLane.get(it.lane).push({ item: it.id, t: trunc(it.t, 200), page: Number.isFinite(r.ctx?.page) ? r.ctx.page : null, url: u, alt: trunc(r.ctx?.alt || '', 200) });
    }
    for (const [l, list] of byLane) {
      const ins = list.slice(0, BATCH.media);
      out.push({ type: 'media', key: `media:${l}`, priority: 'low', rank: ins.length, title: `Find copies of ${ins.length} broken image${ins.length > 1 ? 's' : ''} in ${lanes[l] || l}`,
        target: { lane: l, laneName: lanes[l] || l, label: lanes[l] || l }, inputs: ins, wants: { all: true, count: ins.length }, more: list.slice(BATCH.media) });
    }
  }

  // tag: items in no tag, once data/tags.json exists.
  if (ctx.tags && Array.isArray(ctx.tags.tags)) {
    const tagged = new Set(ctx.tags.tags.flatMap((t) => (Array.isArray(t.items) ? t.items : [])));
    const skip = new Set([...closedIds('tag', COOL.tag), ...openIds('tag')]);
    const byLane = new Map();
    for (const it of items) {
      if (tagged.has(it.id) || (it.tags && it.tags.length) || skip.has(it.id)) continue;
      if (!byLane.has(it.lane)) byLane.set(it.lane, []);
      byLane.get(it.lane).push(pub(it));
    }
    for (const [l, list] of byLane) {
      const ins = list.slice(0, BATCH.tag);
      out.push({ type: 'tag', key: `tag:${l}`, priority: 'low', rank: ins.length, title: `Tag ${ins.length} untagged item${ins.length > 1 ? 's' : ''} in ${lanes[l] || l}`,
        target: { lane: l, laneName: lanes[l] || l, label: lanes[l] || l }, inputs: ins, wants: { all: true, count: ins.length }, more: list.slice(BATCH.tag) });
    }
  }

  // thread: items with no thread yet, once data/threads.json exists (docs/feeds/threads.md; threads.mjs verifies them).
  if (ctx.threads && ctx.threads.items && typeof ctx.threads.items === 'object') {
    const have = new Set(Object.keys(ctx.threads.items));
    const skip = new Set([...closedIds('thread', COOL.thread), ...openIds('thread')]);
    const byLane = new Map();
    for (const it of items) {
      if (have.has(it.id) || skip.has(it.id) || it.kind === 'text' || (!it.url && !it.ia)) continue;
      if (!byLane.has(it.lane)) byLane.set(it.lane, []);
      byLane.get(it.lane).push(pub(it));
    }
    for (const [l, list] of byLane) {
      const ins = list.slice(0, BATCH.thread);
      out.push({ type: 'thread', key: `thread:${l}`, priority: 'low', rank: ins.length, title: `Write threads for ${ins.length} item${ins.length > 1 ? 's' : ''} in ${lanes[l] || l}`,
        target: { lane: l, laneName: lanes[l] || l, label: lanes[l] || l }, inputs: ins, wants: { all: true, count: ins.length }, more: list.slice(BATCH.thread) });
    }
  }

  // metadata: items with no author, or no date.
  {
    const ov = ctx.overrides?.items || {};
    const skip = new Set([...closedIds('metadata', COOL.metadata), ...openIds('metadata')]);
    const byLane = new Map();
    for (const it of items) {
      if (it.lane === 'quri' || /^arxiv:/.test(it.id) || skip.has(it.id)) continue;
      const unknown = new Set(ov[it.id]?.unknown || []);
      const missing = [];
      if (!it.a && !unknown.has('a')) missing.push('a');
      if (!it.y && !it.d && !unknown.has('y')) missing.push('y');
      if (!missing.length) continue;
      if (!byLane.has(it.lane)) byLane.set(it.lane, []);
      byLane.get(it.lane).push({ ...pub(it), missing });
    }
    for (const [l, list] of byLane) {
      const ins = list.slice(0, BATCH.metadata);
      out.push({ type: 'metadata', key: `metadata:${l}`, priority: 'low', rank: ins.length, title: `Find authors or dates for ${ins.length} item${ins.length > 1 ? 's' : ''} in ${lanes[l] || l}`,
        target: { lane: l, laneName: lanes[l] || l, label: lanes[l] || l }, inputs: ins, wants: { all: true, count: ins.length }, more: list.slice(BATCH.metadata) });
    }
  }

  // Cool-downs for discover-like keys: a closed job inside the window, or (discover) no seed beyond the last job's.
  for (const c of out) {
    if (!COOL[c.type] || ['fix-item', 'media', 'tag', 'metadata', 'thread'].includes(c.type)) continue;
    const recent = recentClosed(c.key, COOL[c.type]);
    if (recent.length) { c.cool = `cool-down until ${localDay(dateAt(recent.map((j) => j.done).sort().at(-1)) + COOL[c.type] * DAY)}`; continue; }
    if (c.type === 'discover') {
      const last = (ctx.closed || []).filter((j) => j.key === c.key).sort((a, b) => (a.done < b.done ? 1 : -1))[0];
      if (last && c.inputs.every((x) => (last.inputs || []).some((y) => y.id === x.id))) c.cool = 'no seed beyond the last job with this key';
    }
  }
  const pr = (p) => PRIORITIES.indexOf(p), ty = (t) => TYPES.indexOf(t);
  out.sort((a, b) => pr(a.priority) - pr(b.priority) || ty(a.type) - ty(b.type) || b.rank - a.rank);
  return out;
}

/**
 * One refresh (spec §7.3): write the candidates as job files until a cap binds; add new
 * inputs to untouched open maintenance jobs. Never deletes or closes a job.
 * state: CACHE/jobs/state.json ({written: {id: sha1}}), updated in place.
 * → {created: [ids], updated: [ids], skipped: [{key, why}]}
 */
export function refresh(root, ctx, state, { caps = CAPS, now = Date.now() } = {}) {
  ensureDirs(root);
  const all = listJobs(root);
  const open = all.open.filter((x) => x.job).map((x) => ({ ...x.job, _text: x.text, _file: x.file }));
  const closed = all.done.filter((x) => x.job).map((x) => x.job);
  const cands = candidates({ ...ctx, open, closed, now });
  const created = [], updated = [], skipped = [];
  state.written ||= {};
  const count = (t) => open.filter((j) => j.type === t).length;
  let total = open.filter((j) => j.type !== 'flag').length;
  for (const c of cands) {
    const cur = open.find((j) => j.key === c.key);
    if (cur) {
      // Add new inputs to an untouched maintenance job.
      if (BATCH[c.type] && state.written[cur.id] === sha1(cur._text)) {
        const field = c.type === 'media' ? 'url' : 'id';
        const have = new Set((cur.inputs || []).map((x) => x[field]));
        const add = [...c.inputs, ...(c.more || [])].filter((x) => !have.has(x[field])).slice(0, Math.max(0, BATCH[c.type] - have.size));
        if (add.length) {
          const job = { ...cur, inputs: [...cur.inputs, ...add] };
          delete job._text; delete job._file;
          job.wants = { ...job.wants, count: job.inputs.length };
          finish(job);
          const text = formatJob(job);
          if (!lintJob(job, text).length) { writeAtomic(cur._file, text); state.written[cur.id] = sha1(text); updated.push(cur.id); continue; }
        }
      }
      skipped.push({ key: c.key, why: 'an open job has this key' });
      continue;
    }
    if (c.cool) { skipped.push({ key: c.key, why: c.cool }); continue; }
    if (total >= caps.total) { skipped.push({ key: c.key, why: `${caps.total} open jobs (the cap)` }); continue; }
    if (count(c.type) >= (caps[c.type] ?? Infinity)) { skipped.push({ key: c.key, why: `${caps[c.type]} open ${c.type} jobs (the cap)` }); continue; }
    let hits = null;
    const w = writeNew(root, c.type, (id) => {
      const job = finish({ id, type: c.type, title: c.title, priority: c.priority, status: 'open', created: localDay(now), key: c.key, target: c.target, inputs: c.inputs, wants: c.wants, gen: GEN });
      hits = lintJob(job);
      return job;
    });
    if (hits.length) { try { unlinkSync(w.file); } catch { /* gone */ } skipped.push({ key: c.key, why: `privacy lint: ${hits.map((h) => h.match).join(', ')}` }); continue; }
    state.written[w.id] = sha1(w.text);
    open.push({ ...w.job, _text: w.text, _file: w.file });
    created.push(w.id);
    total++;
  }
  return { created, updated, skipped };
}

/** A reader flag as a job (spec §7.4). f: {item, page, kind, note, view, asset}. */
export function makeFlag(root, f, now = Date.now()) {
  const it = f.item;
  const kind = FLAG_KINDS[f.kind] ? f.kind : 'other';
  return writeNew(root, 'flag', (id) => finish({
    id, type: 'flag', title: `Reader flag: ${FLAG_KINDS[kind]} on p. ${f.page ?? '?'} of ${trunc(it.t, 60)}`, priority: 'high', status: 'open', created: localDay(now),
    key: `flag:${it.id}:${id}`,
    target: { id: it.id, t: trunc(it.t, 200), lane: it.lane, url: it.url || it.page || '', page: f.page ?? null, kind, note: f.note || '', view: f.view || {}, asset: f.asset ? f.asset.replace('{id}', id) : null },
    inputs: [{ id: it.id, t: trunc(it.t, 200) }], wants: { resolved: true }, gen: GEN,
  }));
}

// ------------------------------------------------------------ dedupe keys ----
export const normTitle = (t) => String(t || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const arxivOf = (s) => {
  const m = /arxiv\.org\/(?:abs|pdf|html)\/((?:\d{4}\.\d{4,5})|(?:[a-z-]+(?:\.[a-z]{2})?\/\d{7}))(?:v\d+)?(?:\.pdf)?/i.exec(s || '') || /10\.48550\/arxiv\.((?:\d{4}\.\d{4,5})|(?:[a-z-]+\/\d{7}))/i.exec(s || '');
  return m ? m[1].toLowerCase() : null;
};
/** The forum post a URL names (a post page, or the GraphQL htmlBody URL): 'lw:<_id>' or 'eaf:<_id>'. */
const postOf = (u) => {
  let s = String(u || ''); try { s = decodeURIComponent(s); } catch { /* as is */ }
  const m = /^https?:\/\/(?:www\.)?(lesswrong\.com|alignmentforum\.org|greaterwrong\.com|forum\.effectivealtruism\.org|ea\.greaterwrong\.com)\/(?:posts\/([A-Za-z0-9]{8,24})\b|graphql\b.*_id:\s*"([A-Za-z0-9]{8,24})")/i.exec(s);
  return m ? `${/effectivealtruism|^ea\./i.test(m[1]) ? 'eaf' : 'lw'}:${m[2] || m[3]}` : null;
};
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };
const isGraphql = (u) => /\/graphql\b/.test(u || '');
export function urlKey(u) {
  try { const x = new URL(u); if (isGraphql(u)) return null; return x.hostname.toLowerCase().replace(/^www\./, '') + x.pathname.replace(/\/+$/, ''); } catch { return null; }
}
/** Every dedupe key of an item (spec §7.7). */
export function dedupeKeys(it) {
  const k = new Set();
  if (it.id) k.add('id:' + it.id);
  const ax = (/^arxiv:(.+)$/i.exec(it.id || '')?.[1]?.replace(/v\d+$/, '').toLowerCase()) || arxivOf(it.url) || arxivOf(it.page) || arxivOf(it.doi ? 'doi.org/' + it.doi : '');
  if (ax) k.add('arxiv:' + ax);
  const doi = (it.doi || /doi\.org\/(10\.[^\s?#]+)/i.exec(it.page || '')?.[1] || /doi\.org\/(10\.[^\s?#]+)/i.exec(it.url || '')?.[1] || '').toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '');
  if (doi) { k.add('doi:' + doi); const a = arxivOf(doi); if (a) k.add('arxiv:' + a); }
  for (const p of [it.id, it.xpost, postOf(it.url), postOf(it.page)]) if (/^(lw|eaf):/.test(p || '')) k.add('post:' + p);
  const sur = firstAuthor(it.a) || '';
  const ia = it.ia || /^ia:(.+)$/.exec(it.id || '')?.[1];
  if (ia) { k.add('ia:' + ia.toLowerCase()); }
  const nt = normTitle(it.t);
  if (ia || it.kind === 'scan') k.add(`work:${nt}|${sur}|${it.y || ''}`);
  // What the item opens, not its landing page: several reports share one (deepmind.google/frontier-safety,
  // anthropic.com/system-cards), and a shared page made every new one a "duplicate".
  for (const u of [it.url, it.pdf]) { const x = u && urlKey(u); if (x) k.add('url:' + x); }
  if (nt) { const n = nt.split(' ').length; if (n >= 4) k.add('t:' + nt); else if (sur) k.add(`ts:${nt}|${sur}`); }
  return k;
}
/** A key index over items: Map key → [ids]. */
export function keyIndex(list) {
  const m = new Map();
  for (const it of list) for (const k of dedupeKeys(it)) { if (!m.has(k)) m.set(k, []); const a = m.get(k); if (!a.includes(it.id)) a.push(it.id); }
  return m;
}

// ----------------------------------------------------------------- hosts ----
export const BASE_HOSTS = ['archive.org', 'arxiv.org', 'gutenberg.org', 'standardebooks.org', 'openlibrary.org', 'cdn.jsdelivr.net', 'lesswrong.com', 'alignmentforum.org', 'forum.effectivealtruism.org'];
const parents = (h) => { const p = h.split('.'), out = []; for (let k = 0; k < p.length - 1; k++) out.push(p.slice(k).join('.')); return out; };
const patternRe = (p) => new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.+') + '$', 'i');
/** A deny-listed host (a shadow library): the pattern that matches the host or a parent, or null. */
export function denied(host, hosts) {
  for (const p of hosts?.deny || []) { const re = patternRe(p); if (parents(host).some((h) => re.test(h))) return p; }
  return null;
}
/** The deny pattern a URL hits: its host, or the host of the page a Wayback Machine URL archives. */
export function deniedUrl(u, hosts) {
  const h = hostOf(u); if (!h) return null;
  const inner = /^(?:web\.)?archive\.org$/.test(h) ? /^\/web\/(?:[^/]*\/)?(?:https?:\/\/?)?([^/?#:]+)/i.exec(String(u).replace(/^https?:\/\/[^/]+/i, ''))?.[1] : null;
  return denied(h, hosts) || (inner ? denied(inner.toLowerCase().replace(/^www\./, ''), hosts) : null);
}
export function allowedHost(host, hosts, corpusHosts = new Set()) {
  const allow = hosts?.allow || {};
  return parents(host).some((h) => h in allow || corpusHosts.has(h) || BASE_HOSTS.includes(h));
}

// ----------------------------------------------------------------- checks ----
const KINDS = ['pdf', 'html', 'web', 'scan', 'text'];
const OPEN_LICENSE = /public domain|cc[- ]?by|creative commons|cc0|pdm|no known copyright|not_in_copyright|gnu free|open government/i;
const postUrl = (host, id) => `https://${host}/graphql?query=${encodeURIComponent(`{post(input:{selector:{_id:"${id}"}}){result{htmlBody}}}`)}`;
/** Problems with one added item (spec §7.5's rules): [string]. */
export function itemProblems(it, { tagIds = null, job = null } = {}) {
  const p = [];
  const id = String(it.id || '');
  if (!id) p.push('no id');
  else if (!(ARXIV_RE.test(id) || /^lw:[A-Za-z0-9]{8,24}$/.test(id) || /^eaf:[A-Za-z0-9]{8,24}$/.test(id) || /^ia:[A-Za-z0-9._-]+$/.test(id) || /^pdf:[a-z0-9.-]+\.[a-z]{2,}\/\S+$/.test(id) || /^web:[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/.test(id)))
    p.push(`id ${JSON.stringify(id)} is not arxiv:<id without version>, lw:<_id>, eaf:<_id>, ia:<identifier>, pdf:<host><path> or web:<host><path>`);
  else {
    if (/^arxiv:/.test(id) && /v\d+$/.test(id)) p.push('arXiv id has a version (drop the vN)');
    if (/^(pdf|web):www\./.test(id)) p.push('pdf:/web: ids drop the www.');
    if (/^web:.*\/$/.test(id)) p.push('web: ids have no trailing slash');
  }
  if (!KINDS.includes(it.kind)) p.push(`kind ${JSON.stringify(it.kind)} is not one of ${KINDS.join(', ')}`);
  if (!String(it.t || '').trim()) p.push('no title (t)');
  if (!String(it.a || '').trim()) p.push('no author (a); use the organisation when there is no person');
  if (!it.y && !it.d) p.push('no year (y) or date (d)');
  if (it.d != null && !/^\d{4}-\d{2}(-\d{2})?$/.test(it.d)) p.push('d must be YYYY-MM or YYYY-MM-DD');
  if (it.y != null && !(Number.isInteger(it.y) && it.y > 1400 && it.y < 2100)) p.push('y must be a year (a number)');
  for (const k of ['url', 'page']) if (!/^https:\/\//.test(it[k] || '')) p.push(`${k} must be an https:// URL`);
  if (/^https:\/\/(dx\.)?doi\.org\//i.test(it.url || '')) p.push('url must be the open copy itself, not a doi.org link (a DOI resolves to the publisher, often a paywall): put the DOI in doi or page');
  if (/^(pdf|web):/.test(id) && [it.url, it.page].some((u) => postOf(u))) p.push(`a forum post takes the id ${postOf(it.page) || postOf(it.url)} and the GraphQL url (jobs/README.md, section 3)`);
  if (/^arxiv:/.test(id)) {
    const a = id.slice(6);
    if (it.url !== `https://arxiv.org/pdf/${a}`) p.push(`arXiv url must be https://arxiv.org/pdf/${a}`);
    if (it.page !== `https://arxiv.org/abs/${a}`) p.push(`arXiv page must be https://arxiv.org/abs/${a}`);
    if (it.kind && it.kind !== 'pdf') p.push('arXiv items are kind pdf');
  }
  if (/^lw:/.test(id)) {
    if (it.url !== postUrl('www.lesswrong.com', id.slice(3))) p.push('LessWrong/Alignment Forum url must be the GraphQL htmlBody URL (jobs/README.md, section 3)');
    if (!/^https:\/\/(www\.lesswrong\.com|www\.alignmentforum\.org)\/posts\//.test(it.page || '')) p.push('LessWrong page must be the post page');
    if (it.kind !== 'html') p.push('forum posts are kind html');
    if (/alignmentforum\.org/.test(it.page || '') && it.src !== 'Alignment Forum') p.push('Alignment Forum posts set "src": "Alignment Forum"');
  }
  if (/^eaf:/.test(id)) {
    if (it.url !== postUrl('forum.effectivealtruism.org', id.slice(4))) p.push('EA Forum url must be the GraphQL htmlBody URL on forum.effectivealtruism.org');
    if (!/^https:\/\/forum\.effectivealtruism\.org\/posts\//.test(it.page || '')) p.push('EA Forum page must be the post page');
    if (it.kind !== 'html') p.push('forum posts are kind html');
  }
  if (it.kind === 'scan' || /^ia:/.test(id)) {
    const ia = it.ia || id.slice(3);
    if (!it.ia) p.push('scans need ia (the Internet Archive identifier)');
    if (!(it.n > 0)) p.push('scans need n (the image count)');
    const d = `https://archive.org/details/${ia}`;
    if (it.url !== d || it.page !== d) p.push(`IA scans set url and page to ${d}`);
  }
  const why = String(it.why || '');
  if (why.length < 20 || why.length > 200) p.push(`why must be 20-200 characters (has ${why.length})`);
  if (/[\r\n]/.test(why)) p.push('why must be one line');
  if (/\b(you|your|I)\b/.test(why)) p.push('why must be neutral (no "you", "your" or "I")');
  if (!Array.isArray(it.tags) || it.tags.length < 1 || it.tags.length > 4) p.push('tags: 1 to 4 entries');
  else if (tagIds) for (const t of it.tags) if (!tagIds.has(t)) p.push(`tag ${JSON.stringify(t)} is not in data/tags.json`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(it.added || '')) p.push('added must be the date YYYY-MM-DD');
  if (job && it.job !== job) p.push(`job must be ${job}`);
  if (!it.via || typeof it.via !== 'object') p.push('via must be {source, query, seeds?}');
  else {
    if (!SOURCES.includes(it.via.source)) p.push(`via.source must be one of ${SOURCES.join(', ')}`);
    if (!String(it.via.query || '').trim()) p.push('via.query is empty (the query or call that found it)');
    if (it.via.seeds != null && !Array.isArray(it.via.seeds)) p.push('via.seeds must be a list of ids');
  }
  if (it.ab != null && String(it.ab).length > 2000) p.push('ab must be at most 2,000 characters');
  return p;
}

/** The data an agent edits, read from the browser folder `root`. */
export function loadData(root) {
  const errors = [];
  const rd = (f, dflt) => { const p = join(root, f); if (!existsSync(p)) return dflt; try { return JSON.parse(readFileSync(p, 'utf-8')); } catch (e) { errors.push(`${f} does not parse: ${e.message}`); return dflt; } };
  const corpus = rd('corpus.json', { items: [] });
  const lanes = [];
  const dir = join(root, 'data', 'lanes');
  for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith('.json')).sort() : []) {
    const d = rd(join('data', 'lanes', f), null);
    if (!d) continue;
    if (!Array.isArray(d.items)) { errors.push(`data/lanes/${f} has no items array`); continue; }
    lanes.push({ file: `data/lanes/${f}`, lane: d.lane, data: d });
  }
  const overrides = rd('data/overrides.json', { v: 1, items: {} });
  if (!overrides || typeof overrides.items !== 'object' || Array.isArray(overrides.items)) errors.push('data/overrides.json must be {"v": 1, "items": {"<id>": {…}}}');
  const media = rd('data/media-fixes.json', { v: 1, images: {} });
  if (!media || typeof media.images !== 'object' || Array.isArray(media.images)) errors.push('data/media-fixes.json must be {"v": 1, "images": {"<url>": {…}}}');
  const tags = rd(process.env.STACKS_TAGS ? relative(root, resolve(process.env.STACKS_TAGS)) : 'data/tags.json', null);
  if (tags && !Array.isArray(tags.tags)) errors.push('data/tags.json must be {"tags": [...]}');
  const threads = rd(process.env.STACKS_THREADS ? relative(root, resolve(process.env.STACKS_THREADS)) : 'data/threads.json', null);
  if (threads && (typeof threads.items !== 'object' || Array.isArray(threads.items))) errors.push('data/threads.json must be {"items": {"<id>": {posts…}}}');
  return { corpus, lanes, overrides: overrides || { items: {} }, media: media || { images: {} }, tags, threads, errors };
}
export function loadHosts(dir, root) {
  for (const f of [join(dir, 'hosts.json'), join(root, 'jobs', 'hosts.json')]) if (existsSync(f)) { const h = readJson(f, null); if (h) return h; }
  return { allow: {}, deny: [] };
}

/** Live checks (--live): one GET per URL with a Range header, polite per host. */
export async function liveCheck(urls, { fetchImpl = globalThis.fetch, ia = [], ua = 'OpenStacksBrowser/0.3 jobs check (https://github.com/quantified-uncertainty/cairn)', timeout = 20e3, gap = (h) => (h === 'export.arxiv.org' ? 3000 : 1000), deny = () => null, allowed = () => true } = {}) {
  const lines = [], last = new Map();
  const wait = async (h) => { const t = last.get(h) || 0, d = t + gap(h) - Date.now(); if (d > 0) await new Promise((r) => setTimeout(r, d)); last.set(h, Date.now()); };
  // The first n bytes only: a server that ignores Range must not make the check download a whole PDF.
  const head = async (r, n = 2048) => {
    if (!r.body?.getReader) return Buffer.from(await r.arrayBuffer()).subarray(0, n);
    const rd = r.body.getReader(), parts = []; let len = 0;
    try { while (len < n) { const { done, value } = await rd.read(); if (done) break; parts.push(Buffer.from(value)); len += value.length; } } finally { rd.cancel().catch(() => {}); }
    return Buffer.concat(parts).subarray(0, n);
  };
  for (const { url, kind, role } of urls) {
    const h = hostOf(url) || '?';
    await wait(h);
    try {
      const graph = isGraphql(url);
      const r = await fetchImpl(url, { headers: { 'User-Agent': ua, ...(graph ? {} : { Range: 'bytes=0-2047' }) }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
      // A landing page behind a bot challenge (the EA Forum's post pages answer scripts with Cloudflare's
      // 403 challenge) is there for the reader's browser; what the app opens (role 'url') must answer.
      if (r.status === 403 && role === 'page' && /challenge/i.test(r.headers.get('cf-mitigated') || '')) { r.body?.cancel?.().catch(() => {}); lines.push({ ok: true, text: `${url} answers with a bot challenge (HTTP 403, cf-mitigated); a browser gets through` }); continue; }
      if (!(r.status === 200 || r.status === 206)) { r.body?.cancel?.().catch(() => {}); lines.push({ ok: false, text: `${url} answers HTTP ${r.status}` }); continue; }
      // Where the redirects ended: never a shadow library or a login page; what the reader opens stays on an open host.
      const fin = r.redirected && r.url && r.url !== url ? r.url : null, fh = fin && hostOf(fin);
      const bad = fin && (deny(fin) ? `redirects to a shadow library (${fh})` : /\/(log-?in|sign-?in|signin|auth|sso|shibboleth|idp|accounts\/login)\b/i.test(new URL(fin).pathname) ? `redirects to a login page (${fin.slice(0, 80)})` : role === 'url' && fh !== h && !allowed(fh) ? `redirects to ${fh}, not a known open host (link the open copy directly, or add ${fh} to jobs/hosts.json "allow" with a reason)` : null);
      if (bad) { r.body?.cancel?.().catch(() => {}); lines.push({ ok: false, text: `${url} ${bad}` }); continue; }
      if (graph) {
        const j = await r.json().catch(() => null);
        const body = j?.data?.post?.result?.htmlBody;
        lines.push(body && body.length > 50 ? { ok: true, text: `${url.slice(0, 80)}… has a post body` } : { ok: false, text: `${url.slice(0, 80)}… returned no htmlBody` });
        continue;
      }
      const buf = await head(r);
      const type = r.headers.get('content-type') || '';
      if (kind === 'pdf' && !(buf.subarray(0, 5).toString('latin1').startsWith('%PDF') || /application\/pdf/i.test(type))) lines.push({ ok: false, text: `${url} is not a PDF (${type || 'no type'})` });
      else if (kind === 'image' && !/^image\//i.test(type)) lines.push({ ok: false, text: `${url} is not an image (${type || 'no type'})` });
      else lines.push({ ok: true, text: `${url} answers (${r.status}, ${type.split(';')[0] || 'no type'})` });
    } catch (e) { lines.push({ ok: false, text: `${url} failed: ${e.message}` }); }
  }
  for (const id of ia) {
    await wait('archive.org');
    try {
      const r = await fetchImpl(`https://archive.org/metadata/${id}`, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(timeout) });
      const md = await r.json();
      const m = md?.metadata || {};
      const coll = [].concat(m.collection || []);
      const bad = coll.filter((c) => ['inlibrary', 'printdisabled', 'lendinglibrary'].includes(c));
      if (!(Number(m.imagecount) > 0)) lines.push({ ok: false, text: `ia:${id} has no imagecount` });
      else if (m['access-restricted-item'] === 'true' || m['access-restricted-item'] === true) lines.push({ ok: false, text: `ia:${id} is access-restricted (a lending copy)` });
      else if (bad.length) lines.push({ ok: false, text: `ia:${id} is in ${bad.join(', ')} (lending library)` });
      else lines.push({ ok: true, text: `ia:${id} is open (${m.imagecount} images)` });
    } catch (e) { lines.push({ ok: false, text: `ia:${id} metadata failed: ${e.message}` }); }
  }
  return lines;
}

/**
 * Check a job against its acceptance criteria (spec §7.7).
 * opts: {root: the browser folder, dir: the jobs folder, live, fetchImpl, note (for flags at done)}
 * → {ok, lines: [{ok, text}], job, file, added: [items], changed: [ids], files: [paths], hostsAdded, queries}
 */
export async function checkJob(id, { root, dir, live = false, fetchImpl, now = Date.now() } = {}) {
  const lines = [], out = { ok: false, lines, job: null, file: null, added: [], changed: [], files: [], hostsAdded: [], queries: [] };
  const say = (ok, text) => lines.push({ ok: !!ok, text });
  const d = dirsOf(dir);
  const file = [join(d.open, id + '.md'), join(d.done, id + '.md')].find((f) => existsSync(f));
  if (!file) { say(false, `no job file ${id}.md in ${d.open}`); return out; }
  out.file = file;
  const text = readFileSync(file, 'utf-8');
  const { job, errors } = parseJob(text);
  say(!errors.length, errors.length ? `job file: ${errors.join('; ')}` : 'job file parses');
  if (!job) return out;
  out.job = job;
  const data = loadData(root);
  say(!data.errors.length, data.errors.length ? data.errors.join('; ') : 'data files parse and have the right shape');
  const hosts = loadHosts(dir, root);
  const tagIds = data.tags ? new Set(data.tags.tags.map((t) => t.id)) : null;
  const corpusById = new Map((data.corpus.items || []).map((it) => [it.id, it]));
  const liveUrls = [], liveIa = [];
  const files = new Set();
  const pubs = publicStrings(job);

  if (['discover', 'follow-author', 'grow-lane'].includes(job.type)) {
    const mine = [], others = [];
    for (const lf of data.lanes) for (const x of lf.data.items) {
      if (x.job === id) { mine.push({ ...x, lane: x.lane || lf.data.lane, _file: lf.file }); files.add(lf.file); }
      else others.push(x);
    }
    out.added = mine;
    const w = job.wants || {};
    say(mine.length >= (w.min ?? 1) && mine.length <= (w.max ?? Infinity), `${mine.length} items with job ${id} in data/lanes/*.json (wants ${w.min ?? 1} to ${w.max ?? '∞'})`);
    let bad = 0;
    for (const it of mine) { const p = itemProblems(it, { tagIds, job: id }); if (p.length) { bad++; say(false, `${it.id || '(no id)'}: ${p.join('; ')}`); } }
    if (!bad) say(true, `${mine.length} items follow the item rules`);
    // Duplicates: against the corpus and the other lane-file items (without this job's), and within the job.
    // The corpus without this job's own merged items (they carry `job`): an item whose id the
    // corpus already had before this job is a duplicate, not "merged".
    const mineIds = new Set(mine.map((x) => x.id));
    const ofJob = (it) => it.job === id && mineIds.has(it.id);
    const base = keyIndex([...[...corpusById.values()].filter((it) => !ofJob(it)), ...others]);
    const seen = new Map(), what = { id: 'id', arxiv: 'arXiv id', doi: 'DOI', post: 'forum post id', ia: 'IA identifier', work: 'work (title, author, year)', url: 'URL', t: 'title', ts: 'short title and author' };
    let dups = 0;
    for (const it of mine) {
      const keys = dedupeKeys(it);
      for (const k of keys) {
        const kind = k.slice(0, k.indexOf(':')), val = k.slice(k.indexOf(':') + 1);
        // `twin` (README section 4) lets the same work in another form past the title keys only.
        const hit = (base.get(k) || []).filter((x) => !(x === it.twin && (kind === 't' || kind === 'ts')));
        if (hit.length) { dups++; say(false, `${it.id} duplicates ${hit.slice(0, 3).join(', ')} (same ${what[kind] || kind}: ${trunc(val, 80)})`); break; }
        if (seen.has(k) && seen.get(k) !== it.id) { dups++; say(false, `${it.id} duplicates ${seen.get(k)} in this job (same ${what[kind] || kind})`); break; }
      }
      for (const k of keys) if (!seen.has(k)) seen.set(k, it.id);
    }
    if (!dups) say(true, 'no duplicates against the corpus, the lane files or each other');
    // Hosts.
    const corpusHosts = new Set();
    for (const it of corpusById.values()) if (!ofJob(it)) for (const u of [it.url, it.page]) { const h = hostOf(u); if (h) corpusHosts.add(h); }
    let hostBad = 0;
    const added = new Set();
    for (const it of mine) for (const u of [it.url, it.page, it.pdf]) {
      if (!u) continue;
      const h = hostOf(u); if (!h) continue;
      const dn = deniedUrl(u, hosts);
      if (dn) { hostBad++; say(false, `${it.id}: ${u.length > 90 ? u.slice(0, 90) + '…' : u} is on a shadow library (deny list: ${dn}); never use it`); continue; }
      if (!allowedHost(h, hosts, corpusHosts)) { hostBad++; say(false, `${it.id}: ${h} is not a known open host; if it is open, add it to jobs/hosts.json "allow" with a reason`); continue; }
      if (!parents(h).some((x) => corpusHosts.has(x) || BASE_HOSTS.includes(x))) added.add(h);
    }
    out.hostsAdded = [...added];
    if (added.size) { const hf = [join(dir, 'hosts.json'), join(root, 'jobs', 'hosts.json')].find((f) => existsSync(f)); if (hf) files.add(relTo(root, hf)); }
    if (!hostBad) say(true, `every URL is on an open host${added.size ? ` (hosts new to the corpus, for review: ${[...added].join(', ')})` : ''}`);
    for (const it of mine) if (it.kind === 'scan' && !(it.y <= 1930 || OPEN_LICENSE.test(it.license || ''))) say(false, `${it.id}: a scan must be from 1930 or earlier, or carry an open licence`);
    const unmerged = mine.filter((it) => { const c = corpusById.get(it.id); return !c || !Array.isArray(c.path) || !Number.isFinite(c.ord); });
    say(!unmerged.length, unmerged.length ? `corpus.json lacks ${unmerged.length} of the items (or their path and ord): run node build-corpus.mjs --merge` : 'corpus.json has every item, placed in the library tree');
    let lint = 0;
    for (const it of mine) {
      const h = privacyLint(`${it.why || ''}\n${JSON.stringify(it.via || {})}`, [...pubs, it.t, it.a, it.id, ...(it.via?.seeds || [])].filter(Boolean));
      if (h.length) { lint++; say(false, `${it.id}: why/via read like reading history ("${h[0].match}"); keep them neutral`); }
    }
    if (!lint) say(true, 'why and via are neutral');
    for (const it of mine) {
      liveUrls.push({ url: it.url, kind: it.kind === 'pdf' ? 'pdf' : 'page', role: 'url' }); if (it.page && it.page !== it.url) liveUrls.push({ url: it.page, kind: 'page', role: 'page' });
      // Any Internet Archive item, whatever its kind, must not be a lending copy.
      const ia = (it.kind === 'scan' && it.ia) || /^https:\/\/archive\.org\/(?:details|download)\/([^/?#]+)/.exec(it.url || '')?.[1];
      if (ia) liveIa.push(ia);
    }
    for (const it of mine) if (it.via) out.queries.push(`${it.via.source}: ${it.via.query}`);
    if (mine.length) files.add('corpus.json');
  } else if (['fix-item', 'metadata'].includes(job.type)) {
    const ov = data.overrides.items || {};
    let missing = 0, notMerged = 0;
    for (const x of job.inputs || []) {
      const o = ov[x.id];
      if (!o || o.job !== id) { missing++; say(false, `${x.id}: no entry with job ${id} in data/overrides.json`); continue; }
      const fields = ['t', 'a', 'y', 'd', 'url', 'page', 'pdf', 'kind', 'n', 'ia', 'tags', 'lane'].filter((k) => o[k] !== undefined);
      if (o.drop) { if (!String(o.why || '').trim()) { missing++; say(false, `${x.id}: drop needs why`); } }
      else if (job.type === 'metadata' && Array.isArray(o.unknown) && o.unknown.length) { if (!String(o.why || '').trim()) { missing++; say(false, `${x.id}: unknown needs why`); } }
      else if (!fields.length) { missing++; say(false, `${x.id}: the entry changes no field`); }
      for (const k of ['url', 'page', 'pdf']) if (o[k]) {
        const h = hostOf(o[k]);
        if (!/^https:\/\//.test(o[k])) say(false, `${x.id}: ${k} must be https://`);
        else if (h && deniedUrl(o[k], hosts)) say(false, `${x.id}: ${k} is on a shadow library (deny list: ${deniedUrl(o[k], hosts)}); never use it`);
        else liveUrls.push({ url: o[k], kind: (o.kind || corpusById.get(x.id)?.kind) === 'pdf' && k !== 'page' ? 'pdf' : 'page', role: k === 'page' ? 'page' : 'url' });
      }
      const c = corpusById.get(x.id);
      if (o.drop ? !!c : c && fields.some((k) => JSON.stringify(c[k]) !== JSON.stringify(o[k]))) notMerged++;
      out.changed.push(x.id);
      if (o.via) out.queries.push(`${o.via.source || 'other'}: ${o.via.query || ''}`);
    }
    if (!missing) say(true, `every input has an override with job ${id}`);
    if (job.type === 'fix-item' || out.changed.length) say(!notMerged, notMerged ? `corpus.json does not reflect ${notMerged} override(s) yet: run node build-corpus.mjs --merge` : 'corpus.json reflects the overrides');
    files.add('data/overrides.json'); files.add('corpus.json');
  } else if (job.type === 'media') {
    const im = data.media.images || {};
    let missing = 0;
    for (const x of job.inputs || []) {
      const e = im[x.url];
      if (!e || e.job !== id) { missing++; say(false, `${x.url}: no entry with job ${id} in data/media-fixes.json`); continue; }
      if (e.from) {
        const h = hostOf(e.from);
        if (!h || !/^https:\/\//.test(e.from)) { missing++; say(false, `${x.url}: from must be an https:// URL`); }
        else if (deniedUrl(e.from, hosts)) { missing++; say(false, `${x.url}: from is on a shadow library (deny list: ${deniedUrl(e.from, hosts)})`); }
        else if (!(h === 'web.archive.org' || allowedHost(h, hosts, new Set()) || hostOf(x.url) === h)) { missing++; say(false, `${x.url}: ${h} is not an open host (add it to jobs/hosts.json with a reason, or use web.archive.org)`); }
        else liveUrls.push({ url: e.from, kind: 'image' });
      } else if (!(e.gone && String(e.why || '').trim())) { missing++; say(false, `${x.url}: needs from, or gone: true with why`); }
      out.changed.push(x.url);
    }
    if (!missing) say(true, `every image has an entry with job ${id}`);
    files.add('data/media-fixes.json');
  } else if (job.type === 'tag') {
    if (!data.tags) say(false, 'data/tags.json does not exist');
    else {
      const tagged = new Set(data.tags.tags.flatMap((t) => t.items || []));
      const miss = (job.inputs || []).filter((x) => !tagged.has(x.id));
      say(!miss.length, miss.length ? `${miss.length} items are in no tag: ${miss.slice(0, 5).map((x) => x.id).join(', ')}` : 'every input is in a tag');
      const badTags = data.tags.tags.filter((t) => !(t.id && t.label && t.kind && t.desc));
      say(!badTags.length, badTags.length ? `tags missing id, label, kind or desc: ${badTags.slice(0, 5).map((t) => t.id || '?').join(', ')}` : 'every tag has id, label, kind and desc');
      out.changed = (job.inputs || []).map((x) => x.id);
    }
    files.add(process.env.STACKS_TAGS ? relative(root, resolve(process.env.STACKS_TAGS)) : 'data/tags.json');
  } else if (job.type === 'thread') {
    const th = data.threads?.items || {};
    let bad = 0;
    for (const x of job.inputs || []) {
      const t = th[x.id];
      const why = !t ? 'no thread in data/threads.json'
        : !Array.isArray(t.posts) || t.posts.length < 4 || t.posts.length > 7 ? '4 to 7 posts needed'
          : t.posts[0]?.kind !== 'hook' ? 'the hook must come first'
            : !t.checks?.at ? 'not verified yet (node threads.mjs verify --ids …)'
              : t.posts.some((p) => !p.cite?.quote || p.cite.ok !== true) ? 'a post whose quote was not found in the source'
                : !t.model ? 'no model' : '';
      if (why) { bad++; say(false, `${x.id}: ${why}`); }
    }
    if (!bad) say(true, `every listed item has a verified thread`);
    out.changed = (job.inputs || []).map((x) => x.id);
    files.add(process.env.STACKS_THREADS ? relative(root, resolve(process.env.STACKS_THREADS)) : 'data/threads.json');
  } else if (job.type === 'flag') {
    const ov = data.overrides.items || {}, im = data.media.images || {};
    for (const [k, o] of Object.entries(ov)) if (o.job === id) { out.changed.push(k); files.add('data/overrides.json'); files.add('corpus.json'); for (const f of ['url', 'page', 'pdf']) if (o[f]) liveUrls.push({ url: o[f], kind: 'page' }); }
    for (const [u, e] of Object.entries(im)) if (e.job === id) { out.changed.push(u); files.add('data/media-fixes.json'); if (e.from) liveUrls.push({ url: e.from, kind: 'image' }); }
    for (const lf of data.lanes) for (const x of lf.data.items) if (x.job === id) { out.added.push(x); files.add(lf.file); files.add('corpus.json'); }
    say(true, out.changed.length || out.added.length ? `touches ${out.changed.length + out.added.length} entries` : 'touches no data file (a code fix or a note only)');
    // Overrides and added items must be in corpus.json, as for fix-item (the merge ran).
    const F = ['t', 'a', 'y', 'd', 'url', 'page', 'pdf', 'kind', 'n', 'ia', 'tags', 'lane'];
    const stale = Object.entries(ov).filter(([k, o]) => o.job === id && (o.drop ? corpusById.has(k) : corpusById.has(k) && F.some((f) => o[f] !== undefined && JSON.stringify(corpusById.get(k)[f]) !== JSON.stringify(o[f])))).length + out.added.filter((x) => !corpusById.has(x.id)).length;
    if (Object.values(ov).some((o) => o.job === id) || out.added.length) say(!stale, stale ? `corpus.json does not reflect ${stale} change(s) yet: run node build-corpus.mjs --merge` : 'corpus.json reflects the changes');
  }
  // The job file itself.
  const hits = lintJob(job, text);
  say(!hits.length, hits.length ? `job file reads like reading history: ${hits.slice(0, 3).map((h) => `"${h.match}" in "…${h.near}…"`).join('; ')}` : 'job file passes the privacy lint');
  if (live && (liveUrls.length || liveIa.length)) {
    const seenU = new Set();
    const urls = liveUrls.filter((x) => x.url && !seenU.has(x.url) && seenU.add(x.url));
    const known = new Set(); for (const it of corpusById.values()) for (const u of [it.url, it.page]) { const h = hostOf(u); if (h) known.add(h); }
    for (const l of await liveCheck(urls, { fetchImpl, ia: [...new Set(liveIa)], deny: (u) => deniedUrl(u, hosts), allowed: (h) => allowedHost(h, hosts, known) })) lines.push(l);
  } else if (!live && (liveUrls.length || liveIa.length)) say(true, `${liveUrls.length + liveIa.length} URLs not checked live (add --live)`);
  out.files = [...files];
  out.ok = lines.every((l) => l.ok);
  return out;
}

// ------------------------------------------------------------------ moves ----
const relTo = (root, f) => { const r = relative(root, f); return r && !r.startsWith('..') && !isAbsolute(r) ? r.split('\\').join('/') : f; };
function gitTracked(root, f) {
  try { execFileSync('git', ['ls-files', '--error-unmatch', f], { cwd: root, stdio: 'ignore' }); return true; } catch { return false; }
}
/** Move a job to done/ with a status and a Result section. → {file, job} */
export function closeJob(dir, id, { status, result, resultText, by = 'agent', now = Date.now() }) {
  const d = ensureDirs(dir);
  const from = join(d.open, id + '.md');
  if (!existsSync(from)) throw new Error(`no open job ${id}`);
  const { job, errors } = parseJob(readFileSync(from, 'utf-8'));
  if (!job) throw new Error(`job ${id}: ${errors.join('; ')}`);
  job.status = status; job.done = localDay(now); job.by = by;
  if (result) job.result = result;
  job.body = String(job.body || '').replace(/\n## Result\n[\s\S]*$/, '').replace(/\s*$/, '\n') + `\n## Result\n\n${resultText.trim()}\n`;
  const to = join(d.done, id + '.md');
  writeAtomic(to, formatJob(job));
  unlinkSync(from);
  return { file: to, from, job };
}
/** `node jobs.mjs done`: check, write the Result, move, and say what to commit. */
export async function doneJob(id, { root, dir, note = '', force = false, live = false, fetchImpl, by = 'agent', now = Date.now() } = {}) {
  const chk = await checkJob(id, { root, dir, live, fetchImpl, now });
  if (!chk.job) return { ok: false, check: chk, why: 'the job file is missing or does not parse' };
  if (chk.file && chk.file.includes(`${join('done', id)}.md`)) return { ok: false, check: chk, why: `${id} is already closed` };
  if (chk.job.type === 'flag' && !String(note).trim()) return { ok: false, check: chk, why: 'a flag needs --note "what was wrong and what changed"' };
  if (!chk.ok && !force) return { ok: false, check: chk, why: 'the check failed (fix it, or pass --force to close anyway)' };
  const added = chk.added.map((it) => `${it.id} "${trunc(it.t, 80)}" (${it.lane})`);
  const queries = [...new Set(chk.queries)];
  const resultText = [
    `Items added (${added.length}): ${added.length ? added.join(', ') : 'none'}`,
    `Items changed: ${chk.changed.length ? chk.changed.join(', ') : 'none'}`,
    `Files: ${chk.files.length ? chk.files.join(', ') : 'none'}`,
    `Sources and queries: ${queries.length ? queries.join('; ') : 'none recorded'}`,
    ...(note ? [`Note: ${note}`] : []),
    ...(chk.ok ? [] : ['Closed with --force; the check failed: ' + chk.lines.filter((l) => !l.ok).map((l) => l.text).join('; ')]),
  ].join('\n');
  const wasTracked = gitTracked(root, chk.file);
  const { file } = closeJob(dir, id, { status: 'done', resultText, by, now, result: { added: chk.added.map((it) => it.id), changed: chk.changed, files: chk.files, queries } });
  const asset = chk.job.target?.asset ? join(dirsOf(dir).assets, chk.job.target.asset) : null;
  const files = [relTo(root, file), ...(wasTracked ? [relTo(root, chk.file)] : []), ...chk.files, ...(asset && existsSync(asset) ? [relTo(root, asset)] : [])];
  const uniq = [...new Set(files)];
  return { ok: true, file, files: uniq, check: chk, add: `git add ${uniq.map((f) => (/\s/.test(f) ? JSON.stringify(f) : f)).join(' ')}`, commit: `git commit -m ${JSON.stringify(`Stacks job ${id}: ${chk.job.title}`)}` };
}
/** `node jobs.mjs drop`: close a job that cannot or should not be done. */
export function dropJob(id, { root, dir, why, by = 'agent', now = Date.now() }) {
  if (!String(why || '').trim()) throw new Error('drop needs --why "…"');
  const from = join(dirsOf(dir).open, id + '.md');
  const wasTracked = existsSync(from) && gitTracked(root, from);
  const { file, job } = closeJob(dir, id, { status: 'dropped', resultText: `Dropped: ${why}`, by, now });
  const files = [relTo(root, file), ...(wasTracked ? [relTo(root, from)] : [])];
  return { ok: true, file, files, add: `git add ${files.join(' ')}`, commit: `git commit -m ${JSON.stringify(`Stacks job ${id}: dropped (${trunc(job.title, 60)})`)}` };
}
/** The Dashboard's Dismiss: close as dismissed (its key then cools down as if done). */
export function dismissJob(dir, id, now = Date.now()) {
  return closeJob(dir, id, { status: 'dismissed', resultText: 'Dismissed in the Dashboard.', by: 'reader', now });
}

/** Apply data/media-fixes.json entries that have a copy and no applied record, through rescue.manualCopy. */
export async function applyMediaFixes(fixes, applied, manualCopy, now = Date.now()) {
  const done = [];
  for (const [u, e] of Object.entries(fixes?.images || {})) {
    if (!e?.from || applied[u]?.from === e.from) continue;
    let st = 'bad', why = '';
    try { const r = await manualCopy(u, e.from); st = r?.st || 'bad'; why = r?.why || ''; } catch (err) { why = err.message; }
    applied[u] = { from: e.from, st, why, at: now };
    done.push({ url: u, st });
  }
  return done;
}
