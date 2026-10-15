#!/usr/bin/env node
/**
 * Build corpus.json for the Stacks Browser: a curated set of openable items in
 * lanes chosen by the reader, rather than everything that happens to be open.
 *
 *   node build-corpus.mjs            # writes ./corpus.json
 *   node build-corpus.mjs --tree-only  # refreshes only the library tree (path, ord) in it
 *   node build-corpus.mjs --merge      # no network: appends new lane-file items (agent jobs'
 *                                      # data/lanes/<lane>.added.json), applies data/overrides.json
 *   --root DIR                         # read and write under DIR instead of this folder
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

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
// --root DIR: read and write corpus.json, data/ and seeds.json under DIR (tests, QA copies).
const ROOT = process.argv.includes('--root') ? resolve(process.argv[process.argv.indexOf('--root') + 1]) : HERE;
const UA ='OpenStacksBrowser/0.2 (https://github.com/quantified-uncertainty/cairn)';
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

// ---- library tree ----------------------------------------------------------
// Every item gets `path` (folder names below its lane, outermost first) and
// `ord` (its place in the lane's tree order: sorting a lane's items by ord
// walks the tree depth-first, so it also orders items within each folder and
// folders by their first item). Lanes where order matters (the wikis) are
// listed in corpus.json's `laneOrdered`, and the feed follows tree order there.
// The QURI wikis follow each site's own Starlight sidebar; other lanes get
// topic, year or era folders from tags and titles (features/library.js shows
// the tree).
const LANE_ORDERED = { quri: true };
const SIDEBARS = {}; // host -> parsed Starlight sidebar

/** A Starlight sidebar (<ul class="top-level">) as [{label, href} | {label, kids}], in order. */
function parseSidebar(html) {
  const at = html ? html.search(/<ul class="top-level/) : -1;
  if (at < 0) return null;
  const clean = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').replace(/\s*↗$/, '').trim();
  const root = { label: '', kids: [] }; const stack = [root];
  let ul = 0, summary = false, link = null, badge = false, buf = '';
  const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*)>|([^<]+)/g;
  re.lastIndex = at;
  for (let m; (m = re.exec(html));) {
    const [, close, tag0, attrs, txt] = m;
    if (txt != null) { if (!badge && (summary || link)) buf += txt; continue; }
    const tag = tag0.toLowerCase();
    if (tag === 'ul') { ul += close ? -1 : 1; if (ul === 0) break; }
    else if (tag === 'details') {
      if (close) { if (stack.length > 1) stack.pop(); } else { const g = { label: '', kids: [] }; stack.at(-1).kids.push(g); stack.push(g); }
    } else if (tag === 'summary') {
      if (close) { stack.at(-1).label = clean(buf); summary = false; } else { summary = true; buf = ''; }
    } else if (tag === 'a') {
      if (close) { if (link) { link.label = clean(buf); stack.at(-1).kids.push(link); link = null; } } else { link = { href: (attrs.match(/href="([^"]*)"/) || [])[1] || '' }; buf = ''; }
    } else if (tag === 'span') {
      if (!close && /sl-badge/.test(attrs)) badge = true; else if (close && badge) badge = false;
    }
  }
  return root.kids.length ? root.kids : null;
}
/** The site's sidebar: from its home page, else (a splash home page has none) from its first other page. */
async function fetchSidebar(base, urls = []) {
  const tries = [base + '/', ...urls.filter((u) => new URL(u).pathname !== '/').slice(0, 2)];
  for (const u of tries) {
    const sb = parseSidebar(await getText(u));
    if (sb) return sb;
  }
  return null;
}
/** Same-site page links of a sidebar, in order. */
const sidebarUrls = (sb, base) => {
  const out = [];
  const walk = (ns) => { for (const n of ns) { if (n.kids) walk(n.kids); else if (n.href?.startsWith('/')) out.push(base + n.href); } };
  walk(sb || []);
  return out;
};

const lc = (s) => String(s || '').toLowerCase();
const blurb = (it) => lc(`${it.t} ${it.why || ''}`);
/** An item's topic folder: the first topic listing one of its tags (in the item's
 *  own tag order), else the first whose pattern matches its title, then its
 *  description (topics with `pri` are tried first), else the `fallback` topic. */
function topicOf(it, topics) {
  if (!topics) return null;
  for (const t of topics) if (t.test?.(it)) return t.name;
  for (const g of it.tags || []) for (const t of topics) if (t.tags?.includes(g)) return t.name;
  const byPri = topics.filter((t) => t.re).sort((a, b) => (b.pri || 0) - (a.pri || 0));
  for (const s of [lc(it.t), blurb(it)]) for (const t of byPri) if (t.re.test(s)) return t.name;
  return topics.find((t) => t.fallback)?.name || 'Other';
}
const TOPICS = {
  'ai-safety': [
    { name: 'Agendas & overviews', tags: ['agenda', 'survey', 'surveys', 'overview', 'synthesis', 'textbook', 'methodology', 'alignment-forum'],
      re: /\b(agenda|research directions|overview|field guide|the plan\b|tips for|lessons learned|unsolved problems|concrete problems|challenge for)/ },
    { name: 'Interpretability', tags: ['interpretability', 'circuits', 'probing', 'sae', 'sparse-autoencoders', 'superposition', 'representations', 'attribution', 'attribution-graphs', 'steering', 'representation-engineering', 'model-diffing', 'probes', 'transcoders', 'editing', 'concept-erasure'],
      re: /interpretab|monosemantic|superposition|\bsae\b|sparse autoencoder|circuit|feature (geometry|hypothesis)|single direction|steering|probing|retarget the search|inscrutable|latent behaviors/ },
    { name: 'Evaluations & capabilities', tags: ['evaluations', 'evals', 'benchmark', 'benchmarks', 'dangerous-capabilities', 'elicitation', 'third-party-evals', 'eval-awareness', 'autonomy', 'ai-rnd', 'system-card', 'system-cards', 'self-improvement', 'productivity', 'trends'],
      re: /\beval|benchmark|capabilit|time horizon|long tasks|measuring/ },
    { name: 'Training & RLHF', tags: ['rlhf', 'reward-modeling', 'reward-modelling', 'constitutional-ai', 'alignment-training', 'model-spec', 'training', 'rl', 'values'],
      re: /rlhf|human feedback|fine-?tun|constitution|instruction|mode collapse|simulator/ },
    { name: 'Oversight, debate & honesty', tags: ['scalable-oversight', 'debate', 'amplification', 'weak-to-strong', 'elk', 'eliciting-latent-knowledge', 'honesty', 'sycophancy', 'oversight', 'amplified-oversight'],
      re: /oversight|debate|amplification|latent knowledge|\belk\b|honest|sycophan|weak-to-strong/ },
    { name: 'Deception & scheming', tags: ['deception', 'scheming', 'alignment-faking', 'situational-awareness', 'model-organisms', 'emergent-misalignment', 'agentic-misalignment', 'power-seeking', 'sandbagging', 'inner-alignment', 'misalignment', 'steganography'],
      re: /decept|scheming|alignment faking|treacherous|mesa|situational awareness|emergent misalignment|sharp left turn|power-seeking/ },
    { name: 'Reward hacking & generalization', tags: ['reward-hacking', 'specification-gaming', 'goal-misgeneralization', 'side-effects', 'safe-rl', 'distribution-shift', 'generalization', 'reward-tampering', 'mild-optimization'],
      re: /reward hack|goodhart|specification gaming|misgeneraliz|generali[sz]e|side effect|wirehead/ },
    { name: 'Robustness & security', tags: ['jailbreaks', 'adversarial-robustness', 'adversarial-training', 'red-teaming', 'backdoors', 'prompt-injection', 'defenses', 'unlearning', 'robustness', 'open-weights', 'anomaly-detection', 'biosecurity', 'adversarial', 'fine-tuning-attacks', 'ood-detection', 'safeguards'],
      re: /jailbreak|adversarial|red.?team|backdoor|sleeper|prompt injection|unlearning|robustness\b/ },
    { name: 'Control & monitoring', tags: ['ai-control', 'control', 'cot-monitoring', 'monitoring', 'cot-faithfulness', 'auditing', 'alignment-audits', 'safety-cases', 'chain-of-thought', 'faithfulness'],
      re: /\bcontrol\b|monitor|chain of thought|\bcot\b|faithful|audit|safety case/ },
    { name: 'Agent foundations & theory', tags: ['agent-foundations', 'foundations', 'decision-theory', 'value-learning', 'irl', 'corrigibility', 'logical-uncertainty', 'theory', 'causality', 'world-models', 'heuristic-arguments', 'instrumental-convergence', 'introspection', 'ai-welfare', 'model-psychology', 'manipulation', 'formal-verification'],
      re: /embedded agen|decision theory|\budt\b|corrigib|utility|optimization|abstraction|instrumental|goals|bargaining|description length|value learning|agent|consciousness|psychology|internal experience|morality|ontology/ },
    { name: 'Governance & strategy', tags: ['governance', 'compute-governance', 'government', 'strategy', 'risk', 'threat-models', 'forecasting', 'scenarios', 'takeoff', 'risk-reports', 'frameworks', 'statements', 'existential-risk', 'incidents', 'compute'],
      re: /governance|policy|regulat|strateg|timeline|takeoff|overhang|scaling|compute|\boom|failure (looks|story)|multipolar|extinction|game board|openai|lab\b|organi[sz]ation|safetywashing|existential|agi\b/ },
    { name: 'Essays & debates', fallback: true },
  ],
  'deepmind-safety': [
    { name: 'Interpretability', tags: ['interpretability', 'sparse-autoencoders', 'circuits', 'probes', 'transcoders', 'steering', 'model-diffing', 'modularity'] },
    { name: 'Evaluations & dangerous capabilities', tags: ['evals', 'dangerous-capabilities', 'frontier-safety', 'sandbagging', 'hallucination', 'environments'] },
    { name: 'Monitoring & chain of thought', tags: ['chain-of-thought', 'monitoring', 'faithfulness', 'obfuscation', 'control', 'scheming', 'deception', 'emergent-misalignment', 'misalignment', 'auditing'] },
    { name: 'Oversight & debate', tags: ['oversight', 'debate', 'amplified-oversight', 'verification', 'eliciting-latent-knowledge', 'honesty', 'sycophancy'] },
    { name: 'Incentives & agent foundations', tags: ['agent-foundations', 'causal-influence-diagrams', 'incentives', 'agency', 'goal-directedness', 'causality', 'reward-tampering', 'theory', 'philosophy', 'manipulation', 'corrigibility', 'power-seeking'] },
    { name: 'Specification & reward', tags: ['specification-gaming', 'reward-hacking', 'reward-modelling', 'rlhf', 'side-effects', 'impact-regularisation', 'safe-exploration', 'goal-misgeneralization', 'generalisation', 'values', 'meta-learning', 'rl', 'training'] },
    { name: 'Robustness & security', tags: ['robustness', 'adversarial', 'jailbreaks', 'red-teaming', 'security', 'prompt-injection', 'unlearning', 'misuse'] },
    { name: 'Agents & multi-agent', tags: ['agents', 'multi-agent', 'human-ai', 'language-models', 'reasoning', 'tooling'] },
    { name: 'Frameworks & governance', tags: ['governance', 'frameworks', 'agenda', 'threat-models', 'harms', 'safety-cases', 'taxonomy', 'alignment', 'forecasting'] },
  ],
  forecasting: [
    { name: 'Prediction markets', tags: ['prediction-markets', 'futarchy', 'markets', 'market-efficiency', 'mechanism-design', 'subsidies', 'incentives', 'resolution', 'scoring-rules', 'scoring'] },
    { name: 'Forecasting AI', tags: ['ai-forecasting', 'bio-anchors', 'takeoff', 'time-horizon', 'llm-forecasting', 'ai-safety'] },
    { name: 'Track records & calibration', tags: ['track-record', 'accuracy', 'calibration', 'overconfidence', 'metaculus', 'tournaments', 'xpt', 'personal-forecasting', 'benchmarks'] },
    { name: 'Superforecasting & judgment', tags: ['superforecasting', 'expert-judgment', 'wisdom-of-crowds', 'expert-surveys', 'biases', 'aggregation', 'crowd-forecasting', 'extremizing', 'adversarial-collaboration', 'rationales'] },
    { name: 'Methods & theory', tags: ['method', 'research-agenda', 'theory', 'reference-classes', 'base-rates', 'fermi-estimation', 'priors', 'evidence', 'model-uncertainty', 'credal-resilience', 'updating', 'model-combination', 'causality', 'trend-extrapolation', 'technology-forecasting', 'long-range', 'history', 'science', 'epistemics', 'critique'] },
    { name: 'Estimation & evaluation (QURI)', tags: ['quri', 'squiggle', 'uncertainty-analysis', 'cost-effectiveness', 'value-of-information', 'estimates', 'uncertainty-propagation', 'grantmaking', 'evaluation', 'funding', 'tools', 'forecasting-infrastructure', 'amplification', 'measurement', 'models', 'uncertainty'] },
    { name: 'Risks & scenarios', tags: ['existential-risk', 'nuclear-risk', 'scenarios', 'governance', 'policy'] },
  ],
  llm: [
    { name: 'Before Transformers', re: /word representations|word2vec|align and translate|sequence to sequence|contextualized word/ },
    { name: 'Architectures & long context', re: /attention is all|mixture-of-experts|sparsely-gated|switch transformers|glu variants|rotary|roformer|linear biases|alibi|mamba|state spaces|context window|positional interpolation|yarn/ },
    { name: 'Scaling & pretraining', re: /scaling laws|compute-optimal|pre-training|pretraining|few-shot learners|unsupervised multitask|text-to-text|\bpile\b|fineweb|emergent abilities/ },
    { name: 'Efficiency & systems', re: /megatron|zero:|speculative|flashattention|pagedattention|memory management|model parallel/ },
    { name: 'Alignment & fine-tuning', re: /human feedback|preference optimization|instruction|zero-shot learners|proximal policy|low-rank adaptation|qlora|rlhf/ },
    { name: 'Reasoning', re: /reason|chain-of-thought|chain of thought|step by step|self-consistency|tree of thoughts|test-time|deepseekmath|verifiers/ },
    { name: 'Agents, tools & retrieval', pri: 2, re: /^react:|toolformer|retrieval-augmented|use tools/ },
    { name: 'Evaluation & benchmarks', re: /measuring|benchmark|evaluating|judge|swe-bench|lost in the middle/ },
    { name: 'Model reports & open models', pri: 1, re: /technical report|model card|^llama|^mistral 7b|mixtral|^olmo|kimi k2|^gemini|herd of models|^palm:|deepseek-v\d/ },
    { name: 'Other', fallback: true },
  ],
  'information-theory': [
    { name: 'Founding papers', test: (it) => (it.y || 9999) < 1960 },
    { name: 'Textbooks & lecture notes', re: /textbook|lecture notes|course notes|book draft|graduate text|introduction to|rigorous treatment|^entropy and information theory|inference, and learning/ },
    { name: 'Algorithmic information & induction', pri: 1, re: /kolmogorov|description length|universal induction|solomonoff/ },
    { name: 'Information in learning & compression', fallback: true },
  ],
  cybernetics: [
    { name: 'Precursors: feedback & regulation', test: (it) => (it.y || 9999) < 1950 },
    { name: 'Cybernetics, systems & the brain', re: /cybernetic|macroscope|self-organi[sz]|phenomenon of science|free energy|brain/ },
    { name: 'Requisite variety & information', pri: 1, re: /requisite variety|information-theoretic|scale-dependent/ },
    { name: 'Control theory', fallback: true },
  ],
  ttrpg: [
    { name: 'Kriegsspiel & early wargames', test: (it) => (it.y || 9999) < 1950 },
    { name: 'D&D and the d20 family', re: /d&d|d20|dungeons & dragons|system reference document 5|pathfinder|starfinder|old-school essentials|a5e|level up|fifth-edition|5th edition/ },
    { name: 'Indie & story games', fallback: true },
  ],
};
const tp = (lane, it) => topicOf(it, TOPICS[lane]);
const topicIdx = (lane, name) => { const k = (TOPICS[lane] || []).findIndex((t) => t.name === name); return k < 0 ? 99 : k; };
const isPost = (it) => it.kind === 'html' || (it.kind === 'web' && !/\.pdf$/i.test(it.url || ''));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Folder path and sort key for each item, by lane (t: its topic folder, for lanes with TOPICS). Keys sort folders first, then items. */
function placeItem(it, t) {
  const q = -(it.q ?? 0.5), yr = it.y || 0, title = lc(it.t);
  const ti = topicIdx(it.lane, t);
  switch (it.lane) {
    case 'ai-safety': return { path: [t], key: [ti, q, -yr, title] };
    case 'deepmind-safety': // papers and reports by topic, newest first; blog posts apart once there are a few
      if (!split.has(it.lane)) return { path: [t], key: [ti, -yr, q, title] };
      if (dmPost(it)) return { path: ['Blog & posts'], key: [1, 0, -yr, q, title] };
      return { path: ['Papers & reports', t], key: [0, ti, -yr, q, title] };
    case 'forecasting': {
      const post = fcPost(it);
      return { path: [post ? 'Posts' : 'Papers & reports', t], key: [post ? 1 : 0, ti, q, -yr, title] };
    }
    case 'llm': case 'information-theory': case 'cybernetics': case 'ttrpg':
      return { path: [t], key: [ti, yr, title] };
    case 'lesswrong': { // a folder a year; the quieter early years share one
      const f = !yr ? 'Undated' : yr >= 2019 ? String(yr) : yr >= 2010 ? '2010–2018' : '2006–2009';
      return { path: [f], key: [yr >= 2019 ? -yr : yr >= 2010 ? -2018 : yr ? -2009 : 0, -(it.score || 0), title] };
    }
    case 'oddities': {
      const sub = (it.why || '').match(/shelved under "([^"]+)"/)?.[1];
      const era = !it.y ? 'Undated' : it.y < 1800 ? 'Before 1800' : it.y < 1850 ? '1800–1849' : it.y < 1900 ? '1850–1899' : '1900 and later';
      return { path: [sub ? cap(sub) : era], key: [sub ? lc(sub) : 'zzz' + era, -(it.score || 0), title] };
    }
    default: { // textbooks and new lanes: the first tag is the field
      const tag = (it.tags || [])[0];
      return { path: tag ? [cap(tag.replace(/-/g, ' '))] : [], key: [tag || '~', q, title] };
    }
  }
}
const dmPost = (it) => isPost(it);
const split = new Set(); // lanes with enough posts for a folder of their own
const fcPost = (it) => isPost(it) && it.src !== 'arXiv';
const QURI_ORDER = ['delegation-risk.', 'evaluation-engineering.', 'reasoning-processes.', 'priors.'];
/** QURI wikis: site → sidebar groups, in sidebar order; pages not in the sidebar go last. */
function placeQuri(list) {
  const out = new Map();
  const bySite = new Map();
  for (const it of list) {
    const host = new URL(it.url).host;
    if (!bySite.has(host)) bySite.set(host, []);
    bySite.get(host).push(it);
  }
  const hostIdx = (h) => { const k = QURI_ORDER.findIndex((p) => h.startsWith(p)); return k < 0 ? 50 : k; };
  for (const [host, its] of bySite) {
    const site = its[0].src || host;
    const byPath = new Map(its.map((it) => [new URL(it.url).pathname.replace(/\/$/, '') || '/', it]));
    let seq = 0;
    const home = byPath.get('/');
    if (home) out.set(home, { path: [site], key: [hostIdx(host), host, seq++] });
    const walk = (nodes, path) => {
      for (const n of nodes) {
        if (n.kids) { walk(n.kids, [...path, n.label || 'Untitled']); continue; }
        if (!n.href?.startsWith('/')) continue;
        const it = byPath.get(n.href.split('#')[0].replace(/\/$/, '') || '/');
        if (it && !out.has(it)) out.set(it, { path, key: [hostIdx(host), host, seq++] });
      }
    };
    walk(SIDEBARS[host] || [], [site]);
    const rest = its.filter((it) => !out.has(it)).sort((a, b) => a.url.localeCompare(b.url));
    for (const it of rest) out.set(it, { path: SIDEBARS[host] ? [site, 'Not in the sidebar'] : [site], key: [hostIdx(host), host, seq++] });
  }
  return out;
}
const cmpKey = (a, b) => {
  for (let j = 0; j < Math.max(a.length, b.length); j++) {
    const x = a[j], y = b[j];
    if (x === y) continue;
    if (x == null) return -1; if (y == null) return 1;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x).localeCompare(String(y));
  }
  return 0;
};
function buildTree(all) {
  const lanes = new Map();
  for (const it of all) { if (!lanes.has(it.lane)) lanes.set(it.lane, []); lanes.get(it.lane).push(it); }
  for (const [lane, list] of lanes) {
    let where;
    if (lane === 'quri') where = placeQuri(list);
    else {
      if (lane === 'deepmind-safety' && list.filter(dmPost).length >= 3) split.add(lane);
      // Topic folders; a topic with fewer than 3 items in its group joins 'Other'.
      const topic = new Map(list.map((it) => [it, TOPICS[lane] ? tp(lane, it) : null]));
      if (TOPICS[lane]) {
        const grp = (it) => (lane === 'forecasting' ? fcPost(it) : split.has(lane) ? dmPost(it) : '') + '|' + topic.get(it);
        const n = new Map();
        for (const it of list) n.set(grp(it), (n.get(grp(it)) || 0) + 1);
        for (const it of list) if (n.get(grp(it)) < 3) topic.set(it, 'Other');
      }
      where = new Map(list.map((it) => [it, placeItem(it, topic.get(it))]));
    }
    const placed = list.map((it) => ({ it, ...where.get(it) }));
    placed.sort((a, b) => cmpKey(a.key, b.key));
    placed.forEach((p, k) => { p.it.path = p.path; p.it.ord = k; });
  }
}
// ---- fixes from agent jobs (data/overrides.json, jobs/README.md) -------------
/** Apply data/overrides.json to the items in place: fields, or drop. → {updated, dropped, lanes (Set of lanes touched), skipped} */
function applyOverrides(list) {
  const out = { updated: [], dropped: [], lanes: new Set(), skipped: [] };
  const f = join(ROOT, 'data', 'overrides.json');
  if (!existsSync(f)) return out;
  let ov;
  try { ov = JSON.parse(readFileSync(f, 'utf-8')).items || {}; } catch (e) { console.warn(`data/overrides.json: ${e.message}`); return out; }
  const FIELDS = ['t', 'a', 'y', 'd', 'url', 'page', 'pdf', 'kind', 'n', 'ia', 'tags', 'lane'];
  const at = new Map(list.map((it, k) => [it.id, k]));
  const drop = new Set();
  for (const [id, o] of Object.entries(ov)) {
    const it = list[at.get(id)];
    if (!it) { out.skipped.push(`${id}: not in the corpus`); continue; }
    if (o.drop) { drop.add(id); out.lanes.add(it.lane); out.dropped.push(id); continue; }
    if (o.lane !== undefined && !LANES[o.lane]) { out.skipped.push(`${id}: unknown lane ${o.lane}`); continue; }
    let changed = false;
    for (const k of FIELDS) {
      if (o[k] === undefined || JSON.stringify(it[k]) === JSON.stringify(o[k])) continue;
      if (k === 'lane') out.lanes.add(it.lane);
      it[k] = o[k]; changed = true;
    }
    if (!changed) continue;
    if (it.kind === 'html' && !/\/graphql\b/.test(it.url || '')) it.kind = 'web';
    out.updated.push(id); out.lanes.add(it.lane);
  }
  if (drop.size) for (let k = list.length - 1; k >= 0; k--) if (drop.has(list[k].id)) list.splice(k, 1);
  return out;
}
// `node build-corpus.mjs --merge [--root DIR]`: no network. Appends the lane-file items
// not yet in corpus.json (agents add them in data/lanes/<lane>.added.json), applies
// data/overrides.json, and places what changed in the library tree. Existing items
// keep their positions in the array.
if (process.argv.includes('--merge')) {
  const t0 = Date.now();
  const file = join(ROOT, 'corpus.json');
  if (!existsSync(file)) { console.error('--merge needs an existing corpus.json: run the full build once'); process.exit(1); }
  const c = JSON.parse(readFileSync(file, 'utf-8'));
  const have = new Set(c.items.map((it) => it.id));
  const changed = new Set(), appended = {}, skipped = [];
  const fam = (it) => `${it.lane}|${it.kind === 'html' || it.kind === 'web' ? 'post' : 'doc'}`;
  const scores = {};
  for (const it of c.items) if (it.score > 0) (scores[fam(it)] ||= []).push(it.score);
  const dir = join(ROOT, 'data', 'lanes');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json'))
    .sort((a, b) => (a.startsWith('deepmind') ? -1 : 0) - (b.startsWith('deepmind') ? -1 : 0) || a.localeCompare(b)) : [];
  for (const f of files) {
    let d;
    try { d = JSON.parse(readFileSync(join(dir, f), 'utf-8')); } catch (e) { skipped.push(`${f}: ${e.message}`); continue; }
    for (const x of d.items || []) {
      if (!x || have.has(x.id)) continue;
      if (!x.id || !x.url || !x.t) { skipped.push(`${f}: ${x.id || '(no id)'}: needs id, url and t`); continue; }
      const lane = x.lane || d.lane;
      if (!LANES[lane]) { skipped.push(`${f}: ${x.id}: unknown lane ${lane}`); continue; }
      const it = { ...x, lane, src: lane === 'quri' && x.src ? x.src : srcOf(x), score: x.score || 0 };
      if (it.kind === 'html' && !/\/graphql\b/.test(it.url)) it.kind = 'web';
      if (!it.d && /^arxiv:\d{4}\./.test(it.id)) it.d = `20${it.id.slice(6, 8)}-${it.id.slice(8, 10)}`;
      const s = scores[fam(it)] || [];
      it.q = it.score > 0 && s.length ? Math.round(Math.min(1, s.filter((v) => v < it.score).length / Math.max(1, s.length - 1)) * 100) / 100 : 0.5;
      c.items.push(it); have.add(it.id); changed.add(lane);
      appended[lane] = (appended[lane] || 0) + 1;
    }
  }
  const ov = applyOverrides(c.items);
  for (const l of ov.lanes) changed.add(l);
  // The tree, for the lanes that changed. The wikis keep their sidebar order: new
  // pages go to "Not in the sidebar" until --tree-only (network) places them.
  buildTree(c.items.filter((it) => changed.has(it.lane) && it.lane !== 'quri'));
  if (changed.has('quri')) {
    let ord = Math.max(-1, ...c.items.filter((it) => it.lane === 'quri' && Number.isFinite(it.ord)).map((it) => it.ord));
    const siteOf = (host) => c.items.find((o) => o.lane === 'quri' && o.path?.length && Number.isFinite(o.ord) && new URL(o.url).host === host)?.path[0];
    for (const it of c.items) if (it.lane === 'quri' && !Number.isFinite(it.ord)) { const host = new URL(it.url).host; it.path = [siteOf(host) || it.src || host, 'Not in the sidebar']; it.ord = ++ord; }
  }
  c.counts = c.items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {});
  for (const l of Object.keys(c.counts)) if (!c.lanes?.[l]) (c.lanes ||= {})[l] = LANES[l];
  c.merged = new Date().toISOString().slice(0, 10);
  writeFileSync(file + '.tmp', JSON.stringify(c));
  renameSync(file + '.tmp', file);
  const n = Object.values(appended).reduce((a, b) => a + b, 0);
  console.log(`Merged in ${Date.now() - t0} ms: ${n} appended${n ? ' (' + Object.entries(appended).map(([l, k]) => `${l} ${k}`).join(', ') + ')' : ''}, ${ov.updated.length} updated, ${ov.dropped.length} dropped; ${c.items.length} items`);
  for (const s of [...skipped, ...ov.skipped]) console.log(`  skipped ${s}`);
  process.exit(0);
}

// `node build-corpus.mjs --tree-only` refreshes just the tree (paths, order and
// the wikis' sidebars) in the existing corpus.json, without refetching the rest.
if (process.argv.includes('--tree-only')) {
  const c = JSON.parse(readFileSync(join(ROOT, 'corpus.json'), 'utf-8'));
  const wiki = c.items.filter((it) => it.lane === 'quri');
  await Promise.all([...new Set(wiki.map((it) => new URL(it.url).host))].map(async (host) => {
    SIDEBARS[host] = await fetchSidebar(`https://${host}`, wiki.filter((it) => it.url.includes(host)).map((it) => it.url));
    console.log(`${host}: ${SIDEBARS[host] ? 'sidebar' : 'no sidebar'}`);
  }));
  buildTree(c.items);
  c.laneOrdered = LANE_ORDERED;
  writeFileSync(join(ROOT, 'corpus.json'), JSON.stringify(c));
  console.log(`Tree: ${c.items.length} items placed`);
  process.exit(0);
}
// ---- end library tree --------------------------------------------------------

// 0. Curated lane files, most specific first.
const LANE_DIR = join(ROOT, 'data', 'lanes');
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
      add({ ...x, lane, src: lane === 'quri' && x.src ? x.src : srcOf(x), score: x.score || 0 }); n++;
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
if (existsSync(join(ROOT, 'seeds.json'))) {
  const seeds = JSON.parse(readFileSync(join(ROOT, 'seeds.json'), 'utf-8'));
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
  // The site's own sidebar orders the library tree; any page it links that the sitemap missed joins too.
  SIDEBARS[host] = await fetchSidebar(base, urls);
  for (const u of sidebarUrls(SIDEBARS[host], base)) if (!urls.includes(u)) urls.push(u);
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

// Fixes from agent jobs (data/overrides.json).
{ const ov = applyOverrides(items); if (ov.updated.length || ov.dropped.length) console.log(`overrides: ${ov.updated.length} updated, ${ov.dropped.length} dropped`); }

// Only forum posts are fetched as GraphQL JSON; other HTML pages are web articles.
for (const it of items) if (it.kind === 'html' && !/\/graphql\b/.test(it.url)) it.kind = 'web';

// Internet Archive PDFs are scans: read them as page images (fast, per page)
// rather than downloading and decoding a whole scanned PDF.
for (const it of items) {
  const m = it.kind === 'pdf' && (it.url || '').match(/^https:\/\/archive\.org\/download\/([^/]+)\/[^/]+\.pdf$/i);
  if (!m) continue;
  const md = await getJson(`https://archive.org/metadata/${m[1]}`);
  const files = (md?.files || []).map((f) => f.name);
  const jp2 = files.filter((f) => /_jp2\.(zip|tar)$/.test(f));
  let n = Number(md?.metadata?.imagecount);
  if (!(n > 0) && jp2.length === 1) { // no image count: count the printed-page list instead
    const pn = files.find((f) => f.endsWith('_page_numbers.json'));
    if (pn) n = ((await getJson(`https://archive.org/download/${m[1]}/${encodeURIComponent(pn)}`))?.pages || []).length;
  }
  // Items holding several books (several page-image sets) stay PDFs.
  if (n > 0 && (Number(md?.metadata?.imagecount) > 0 || jp2.length === 1)) Object.assign(it, { kind: 'scan', ia: m[1], n, pdf: it.url });
  await sleep(300);
}

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

// 6. The library tree: folders (path) and tree order (ord) for every item.
buildTree(items);

writeFileSync(join(ROOT, 'corpus.json'), JSON.stringify({
  built: new Date().toISOString().slice(0, 10),
  lanes: Object.fromEntries(Object.entries(LANES).filter(([k]) => items.some((it) => it.lane === k))),
  laneWeights: LANE_WEIGHTS,
  laneOrdered: LANE_ORDERED,
  counts: items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {}),
  items,
}));
console.log(`Wrote ${items.length} items`, items.reduce((m, x) => ((m[x.lane] = (m[x.lane] || 0) + 1), m), {}));
