#!/usr/bin/env node
/**
 * Page Flags — precompute the "flag shelf" for a fixed list of concepts.
 *
 *   node scripts/prototypes/page-flags.mjs                 # all concepts
 *   node scripts/prototypes/page-flags.mjs --only dutch-book,miracle
 *   node scripts/prototypes/page-flags.mjs --cache /some/dir   # HTTP cache (default: $TMPDIR/page-flags-cache)
 *   node scripts/prototypes/page-flags.mjs --probe          # Search Inside only; print top titles per concept
 *
 * Writes public/prototypes/data/page-flags/concepts.json (the concept index) and
 * public/prototypes/data/page-flags/si/<concept-id>.json (one lazily loaded file per concept).
 *
 * Sources (all queried politely: one request at a time, >= 1.1 s apart, with a User-Agent):
 *
 *  1. Open Library Search Inside  https://openlibrary.org/search/inside.json?q="<phrase>"&limit=60
 *     A proxy for the Internet Archive full-text index (fts_main). Each hit is one scanned
 *     volume with up to five highlighted passages ({{{match}}}). Its `page_num` field is the
 *     number of scan leaves in the volume (it equals the item's `imagecount`; checked on
 *     2026-10-15 against archive.org/metadata for four items), NOT the page of the hit. So the
 *     public API does not say where in a lending or print-disabled scan a hit sits.
 *  2. Open Library Search  https://openlibrary.org/search.json?q=ia:(id OR id ...)
 *     Joins scans to Open Library works: work key, LC call number, first publication year,
 *     subjects. Works are then joined to ../catalog.json by work id.
 *  3. Internet Archive, for OPEN scans only (not in the `inlibrary` or `printdisabled`
 *     collections): archive.org/metadata/<id> (data node + path), the item's BookReader
 *     manifest (BookReaderJSIA.php: the ordered page list with printed page numbers), and the
 *     per-item search inside endpoint (fulltext/inside.php), which returns every match with
 *     its leaf number. Leaves are mapped to BookReader page indexes (the n<index> in
 *     https://archive.org/details/<id>/page/n<index>) through the manifest. The same per-item
 *     endpoint is closed for lending items ("Item not available"), so those books get one
 *     unpositioned "slip" carrying their highlights instead of positioned flags.
 *
 * Snippets are cut to at most 150 characters around the first match (short, for locating
 * passages, not reading them). Access is the scan's own status from its IA collections:
 * open | borrow (inlibrary) | restricted (printdisabled only).
 *
 * The false-friend flag is a transparent rule, not a model: a book "fits" a concept when its
 * LC class or its subjects match the concept's field (see FIELDS below). Books with neither
 * LC class nor subjects are left unjudged.
 *
 * Synonym chips (`syn`) were written by Claude in October 2026 and are AI-generated; they are
 * suggestions for the full-text wall, labelled as such in the UI.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(APP, 'public/prototypes/data/page-flags');
const UA = 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)';
const SNAPSHOT = new Date().toISOString().slice(0, 10);
const LIMIT = 60; // books per concept from Search Inside
const OPEN_CAP = 14; // open scans per concept that get per-page flags
const MAX_FLAGS = 60; // positioned flags kept per book

const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const CACHE = argVal('--cache') || join(tmpdir(), 'page-flags-cache');
const ONLY = argVal('--only')?.split(',');
const PROBE = args.includes('--probe');
mkdirSync(CACHE, { recursive: true });
mkdirSync(join(OUT, 'si'), { recursive: true });

// ---------------------------------------------------------------------------------------------
// Fields: which LC classes and subject words count as "the reader's sense" of a concept.
const FIELDS = {
  prob: {
    lcc: ['B', 'H', 'Q', 'T5', 'R', 'U', 'J'],
    subj: /probab|statist|chance|logic|philosoph|knowledge|epistem|inference|induct|decision|bayes|econom|game theor|risk|uncertain|forecast|reason|mathemat|psycholog|judg|belief|evidence|cognit|gambl|insur|actuar|science|predict|finance|invest|rational|operations research|machine learning|artificial intelligence/i,
  },
  evo: {
    lcc: ['QH', 'QL', 'QE', 'QK', 'QR', 'QP', 'GN', 'B', 'BL', 'H', 'Q1', 'Q12', 'Q17'],
    subj: /evolut|natural selection|darwin|biolog|genetic|species|origin|ecolog|naturalist|science|philosoph|zoolog|botan|fossil|paleont/i,
  },
  rel: {
    lcc: ['B', 'BL', 'BR', 'BT', 'BS', 'BX', 'BV', 'Q', 'H'],
    subj: /miracle|relig|theolog|apologet|christian|god|faith|deism|skeptic|scepti|hume|philosoph|belief|evidence|testimon|probab|natural theology|bible|historical/i,
  },
  pol: {
    lcc: ['J', 'K', 'H', 'B'],
    subj: /liberty|politic|democra|freedom|philosoph|ethic|law|government|social|speech|toleration|utilitar|mill/i,
  },
  phil: {
    lcc: ['B', 'Q', 'H', 'P'],
    subj: /philosoph|knowledge|epistem|logic|perception|mind|metaphys|science|reason|realism|empiric|language|semantic|pragmat|truth|belief/i,
  },
  math: {
    lcc: ['QA', 'QC', 'B', 'Q'],
    subj: /geometr|mathemat|physic|space|relativ|philosoph|science|topolog/i,
  },
};

// ---------------------------------------------------------------------------------------------
// Concepts. `si` is the exact phrase sent to Search Inside (quoted). `wall` is the regular
// expression source the full-text wall uses for this concept (case-insensitive); when absent
// the page derives it from the label. `aka` feeds autocomplete. `syn` (AI-generated) are
// period or neighbouring terms offered as chips.
const CONCEPTS = [
  // Scoring and coherence
  { id: 'proper-scoring-rule', label: 'proper scoring rule', si: 'proper scoring rule', f: 'prob', aka: ['scoring rule', 'strictly proper'], syn: ['scoring rule', 'Brier score', 'logarithmic score'] },
  { id: 'brier-score', label: 'Brier score', si: 'Brier score', f: 'prob', aka: ['quadratic score'], syn: ['quadratic scoring rule', 'proper scoring rule', 'mean squared error'] },
  { id: 'dutch-book', label: 'Dutch book', si: 'Dutch book', f: 'prob', aka: ['coherence', 'sure-loss'], syn: ['coherence', 'fair bet', 'betting quotient'] },
  { id: 'calibration', label: 'calibration', si: 'well calibrated', f: 'prob', wall: 'calibrat\\w*', aka: ['well calibrated', 'reliability diagram'], syn: ['well calibrated', 'overconfidence', 'reliability diagram'] },
  { id: 'degree-of-belief', label: 'degree of belief', si: 'degree of belief', f: 'prob', wall: 'degrees? of (?:belief|assent|credibility)', aka: ['credence', 'degrees of belief'], syn: ['credence', 'degree of assent', 'subjective probability'] },
  { id: 'subjective-probability', label: 'subjective probability', si: 'subjective probability', f: 'prob', aka: ['personal probability', 'personalist'], syn: ['degree of belief', 'personal probability', 'credence'] },
  { id: 'frequency-interpretation', label: 'frequency interpretation', si: 'frequency interpretation', f: 'prob', wall: 'frequency (?:interpretation|theory|view)', aka: ['frequentism', 'frequency theory'], syn: ['frequency theory', 'series', 'long run'] },
  // Priors, classes, rates
  { id: 'reference-class', label: 'reference class', si: 'reference class', f: 'prob', aka: ['reference class problem'], syn: ['series', 'class of instances', 'base rate'] },
  { id: 'base-rate', label: 'base rate', si: 'base rate fallacy', f: 'prob', wall: 'base[\\s-]+rates?', aka: ['base rate fallacy', 'base-rate neglect'], syn: ['prior probability', 'antecedent probability', 'reference class'] },
  { id: 'prior-probability', label: 'prior probability', si: 'prior probability', f: 'prob', wall: '(?:prior|antecedent|a priori) probabilit\\w*', aka: ['prior', 'antecedent probability'], syn: ['antecedent probability', 'a priori probability', 'base rate'] },
  { id: 'principle-of-indifference', label: 'principle of indifference', si: 'principle of indifference', f: 'prob', aka: ['indifference principle'], syn: ['principle of insufficient reason', 'equally possible', 'equally probable'] },
  { id: 'insufficient-reason', label: 'principle of insufficient reason', si: 'principle of insufficient reason', f: 'prob', wall: 'insufficient reason', aka: ['insufficient reason'], syn: ['principle of indifference', 'equally possible', 'no reason to the contrary'] },
  { id: 'rule-of-succession', label: 'rule of succession', si: 'rule of succession', f: 'prob', aka: ['Laplace succession', 'sunrise problem'], syn: ['rising of the sun', 'inverse probability', 'probability of a future event'] },
  { id: 'inverse-probability', label: 'inverse probability', si: 'inverse probability', f: 'prob', wall: 'inverse (?:probabilit\\w*|method|principle)', aka: ['probability of causes'], syn: ['probability of causes', 'Bayes', 'a posteriori'] },
  { id: 'bayes-theorem', label: 'Bayes', si: 'Bayes theorem', f: 'prob', wall: 'Bayes\\w*', aka: ["Bayes's theorem", 'Bayes theorem', 'Bayesian', 'Bayes rule'], syn: ['inverse probability', 'probability of causes', 'a posteriori'] },
  { id: 'likelihood-ratio', label: 'likelihood ratio', si: 'likelihood ratio', f: 'prob', aka: ['Bayes factor'], syn: ['Bayes factor', 'weight of evidence', 'odds'] },
  { id: 'cromwells-rule', label: "Cromwell's rule", si: "Cromwell's rule", f: 'prob', wall: "Cromwell", aka: ['Cromwell rule', 'never assign zero'], syn: ['possible you may be mistaken', 'certainty', 'prior probability'] },
  // Long run
  { id: 'law-of-large-numbers', label: 'law of large numbers', si: 'law of large numbers', f: 'prob', wall: 'law of (?:large|great) numbers', aka: ["Bernoulli's theorem", 'law of averages'], syn: ["Bernoulli's theorem", 'law of great numbers', 'long run'] },
  { id: 'regression-to-the-mean', label: 'regression to the mean', si: 'regression to the mean', f: 'prob', wall: 'regression (?:to|towards) (?:the )?(?:mean|mediocrity)', aka: ['reversion', 'regression towards mediocrity'], syn: ['reversion', 'regression towards mediocrity', 'average'] },
  { id: 'law-of-error', label: 'law of error', si: 'law of error', f: 'prob', wall: 'law of (?:error|facility)\\w*', aka: ['normal curve', 'Gaussian', 'error curve'], syn: ['normal law', 'law of facility', 'curve of error'] },
  { id: 'least-squares', label: 'method of least squares', si: 'method of least squares', f: 'prob', wall: 'least squares', aka: ['least squares'], syn: ['mean of observations', 'law of error', 'probable error'] },
  { id: 'gamblers-fallacy', label: "gambler's fallacy", si: "gambler's fallacy", f: 'prob', wall: "gambler'?s'? fallacy|maturity of (?:the )?chances", aka: ['maturity of chances', 'hot hand'], syn: ['maturity of the chances', 'run of luck', 'due number'] },
  { id: 'doctrine-of-chances', label: 'doctrine of chances', si: 'doctrine of chances', f: 'prob', aka: ['calculus of probabilities', 'theory of chances'], syn: ['calculus of probabilities', 'theory of probabilities', 'games of chance'] },
  { id: 'martingale', label: 'martingale', si: 'martingale', f: 'prob', aka: ['doubling strategy'], syn: ['doubling the stake', 'betting system', 'fair game'] },
  // Decisions and value
  { id: 'expected-value', label: 'expected value', si: 'expected value', f: 'prob', wall: 'expected value|(?:mathematical|moral) expectation', aka: ['mathematical expectation', 'expectation'], syn: ['mathematical expectation', 'moral expectation', 'value of a chance'] },
  { id: 'moral-expectation', label: 'moral expectation', si: 'moral expectation', f: 'prob', aka: ['diminishing marginal utility', 'moral fortune'], syn: ['moral fortune', 'utility', 'St. Petersburg'] },
  { id: 'st-petersburg', label: 'St. Petersburg paradox', si: 'Petersburg paradox', f: 'prob', wall: 'Petersburg', aka: ['Petersburg problem'], syn: ['moral expectation', 'Bernoulli', 'infinite expectation'] },
  { id: 'expected-utility', label: 'expected utility', si: 'expected utility', f: 'prob', aka: ['utility theory', 'von Neumann-Morgenstern'], syn: ['moral expectation', 'utility', 'expected value'] },
  { id: 'kelly-criterion', label: 'Kelly criterion', si: 'Kelly criterion', f: 'prob', wall: 'Kelly', aka: ['Kelly betting', 'fractional Kelly'], syn: ['log utility', 'growth rate', 'bankroll'] },
  { id: 'value-of-information', label: 'value of information', si: 'value of information', f: 'prob', aka: ['expected value of information', 'VOI'], syn: ['expected value of perfect information', 'decision analysis'] },
  { id: 'insurance', label: 'insurance', si: 'theory of insurance', f: 'prob', wall: 'insur\\w*|assurance', aka: ['life insurance', 'annuities'], syn: ['assurance', 'annuities', 'mortality'] },
  { id: 'lottery', label: 'lottery', si: 'lottery tickets', f: 'prob', wall: 'lotter(?:y|ies)', aka: ['lotteries', 'lottery ticket'], syn: ['lotteries', 'drawing of lots', 'urn'] },
  { id: 'lottery-paradox', label: 'lottery paradox', si: 'lottery paradox', f: 'prob', aka: ['Kyburg'], syn: ['preface paradox', 'rational acceptance'] },
  { id: 'pascals-wager', label: "Pascal's wager", si: "Pascal's wager", f: 'rel', wall: "Pascal'?s? wager|Pascal", aka: ['the wager'], syn: ['wager', 'infinite stakes', 'prudential argument'] },
  // Evidence and testimony
  { id: 'testimony', label: 'testimony', si: 'probability of testimony', f: 'prob', wall: 'testimon\\w*', aka: ['testimonies', 'witnesses', 'credibility'], syn: ['witnesses', 'credibility', 'veracity'] },
  { id: 'miracle', label: 'miracle', si: 'testimony for miracles', f: 'rel', wall: 'miracle\\w*|miraculous', aka: ['miracles', 'of miracles', 'Hume on miracles'], syn: ['extraordinary', 'prodigies', 'testimony'] },
  { id: 'induction', label: 'induction', si: 'problem of induction', f: 'phil', wall: 'inducti\\w*', aka: ['problem of induction', 'inductive inference'], syn: ['uniformity of nature', 'reasoning from experience', 'generalization'] },
  { id: 'uniformity-of-nature', label: 'uniformity of nature', si: 'uniformity of nature', f: 'phil', aka: ['course of nature'], syn: ['course of nature', 'order of nature', 'induction'] },
  { id: 'black-swan', label: 'black swan', si: 'black swans', f: 'phil', wall: 'black swans?', aka: ['black swans', 'all swans are white'], syn: ['white swans', 'exception', 'induction'] },
  { id: 'necessary-connexion', label: 'necessary connexion', si: 'necessary connexion', f: 'phil', wall: 'necessary connexion\\w*|necessary connection\\w*', aka: ['necessary connection', 'cause and effect'], syn: ['cause and effect', 'constant conjunction', 'power'] },
  { id: 'argument-from-analogy', label: 'analogy', si: 'argument from analogy', f: 'phil', wall: 'analog\\w*', aka: ['argument from analogy', 'reasoning by analogy'], syn: ['resemblance', 'similar causes', 'induction'] },
  { id: 'occams-razor', label: "Occam's razor", si: "Occam's razor", f: 'phil', wall: "Occam|Ockham|simplicity", aka: ["Ockham's razor", 'parsimony', 'simplicity'], syn: ['simplicity', 'parsimony', 'economy of thought'] },
  { id: 'hypothesis', label: 'working hypothesis', si: 'working hypothesis', f: 'phil', wall: 'hypothes[ie]s', aka: ['hypothesis', 'hypotheses', 'abduction'], syn: ['conjecture', 'abduction', 'theory'] },
  { id: 'pragmatic-maxim', label: 'pragmatism', si: 'pragmatic maxim', f: 'phil', wall: 'pragmati\\w*', aka: ['pragmatic maxim', 'clear ideas'], syn: ['practical bearings', 'clearness', 'meaning'] },
  { id: 'fixation-of-belief', label: 'fixation of belief', si: 'fixation of belief', f: 'phil', wall: 'fixation of belief|method of (?:tenacity|authority)', aka: ['method of tenacity', 'method of authority'], syn: ['doubt', 'method of science', 'tenacity'] },
  { id: 'tychism', label: 'tychism', si: 'tychism', f: 'phil', wall: 'tychism|absolute chance', aka: ['absolute chance'], syn: ['absolute chance', 'necessitarianism', 'spontaneity'] },
  { id: 'sense-data', label: 'sense-data', si: 'sense-data', f: 'phil', wall: 'sense[\\s-]+data|sense[\\s-]+datum', aka: ['sense data', 'sense-datum'], syn: ['appearance', 'perception', 'acquaintance'] },
  { id: 'knowledge-by-acquaintance', label: 'knowledge by acquaintance', si: 'knowledge by acquaintance', f: 'phil', wall: 'acquaint\\w*', aka: ['acquaintance', 'knowledge by description'], syn: ['knowledge by description', 'sense-data', 'direct knowledge'] },
  { id: 'non-euclidean', label: 'non-Euclidean geometry', si: 'non-Euclidean geometry', f: 'math', wall: 'non[\\s-]*Euclidean', aka: ['Lobachevsky', 'Riemann'], syn: ['Lobachevski', 'Riemann', 'convention'] },
  { id: 'maximum-entropy', label: 'maximum entropy', si: 'maximum entropy', f: 'prob', wall: 'entropy', aka: ['MaxEnt', 'entropy'], syn: ['entropy', 'information', 'principle of indifference'] },
  // Evolution
  { id: 'natural-selection', label: 'natural selection', si: 'natural selection', f: 'evo', aka: ['selection'], syn: ['survival of the fittest', 'struggle for existence', 'variation'] },
  { id: 'struggle-for-existence', label: 'struggle for existence', si: 'struggle for existence', f: 'evo', aka: ['struggle for life'], syn: ['struggle for life', 'natural selection', 'Malthus'] },
  { id: 'survival-of-the-fittest', label: 'survival of the fittest', si: 'survival of the fittest', f: 'evo', wall: 'survival of the fittest|fittest', aka: ['fittest'], syn: ['natural selection', 'struggle for existence'] },
  { id: 'argument-from-design', label: 'argument from design', si: 'argument from design', f: 'rel', wall: 'design\\w*', aka: ['design argument', 'teleological argument'], syn: ['final causes', 'contrivance', 'adaptation'] },
  // Liberty
  { id: 'tyranny-of-the-majority', label: 'tyranny of the majority', si: 'tyranny of the majority', f: 'pol', wall: 'tyranny of (?:the )?majorit\\w*', aka: ['majority tyranny'], syn: ['social tyranny', 'despotism of custom', 'public opinion'] },
  { id: 'liberty-of-thought', label: 'liberty of thought', si: 'liberty of thought', f: 'pol', wall: 'liberty of (?:thought|discussion|the press)|freedom of (?:thought|opinion|discussion)', aka: ['freedom of speech', 'free discussion'], syn: ['freedom of opinion', 'liberty of discussion', 'liberty of the press'] },
  // Forecasting and EA-adjacent (mostly absent from the 19th-century texts; that absence is the point)
  { id: 'wisdom-of-crowds', label: 'wisdom of crowds', si: 'wisdom of crowds', f: 'prob', aka: ['crowd forecasting', 'vox populi'], syn: ['vox populi', 'aggregation', 'collective judgment'] },
  { id: 'superforecasting', label: 'superforecasters', si: 'superforecasters', f: 'prob', wall: 'superforecast\\w*', aka: ['superforecasting', 'Good Judgment Project'], syn: ['forecasting tournament', 'calibration', 'Brier score'] },
  { id: 'existential-risk', label: 'existential risk', si: 'existential risk', f: 'prob', aka: ['x-risk', 'extinction risk'], syn: ['human extinction', 'global catastrophic risk'] },
];

// ---------------------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastReq = 0;
let nNet = 0;

async function fetchCached(url, kind = 'json') {
  const key = createHash('sha1').update(url).digest('hex');
  const file = join(CACHE, key + (kind === 'json' ? '.json' : '.txt'));
  if (existsSync(file)) {
    const raw = readFileSync(file, 'utf-8');
    if (raw === '__ERR__') return null;
    return kind === 'json' ? JSON.parse(raw) : raw;
  }
  for (let i = 0; i < 4; i++) {
    const wait = lastReq + 1100 - Date.now();
    if (wait > 0) await sleep(wait);
    lastReq = Date.now();
    nNet++;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 90000);
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal, redirect: 'follow' });
      clearTimeout(timer);
      const body = await res.text();
      if (res.ok) {
        if (kind === 'json') {
          try {
            const j = JSON.parse(body);
            writeFileSync(file, body);
            return j;
          } catch {
            // HTML "Item not available" pages come back with 200 from some nodes
            writeFileSync(file, '__ERR__');
            return null;
          }
        }
        writeFileSync(file, body);
        return body;
      }
      if (res.status === 403 || res.status === 404) { writeFileSync(file, '__ERR__'); return null; }
      console.warn(`  HTTP ${res.status} ${url}`);
    } catch (e) {
      console.warn(`  ${e.name}: ${e.message} ${url}`);
    }
    await sleep(3000 * 2 ** i);
  }
  return null;
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Cut a highlighted passage to <= max chars around the first match. Markers become « ». */
function snip(text, open, close, max = 150) {
  let s = norm(text).split(open).join('\u0001').split(close).join('\u0002');
  s = s.replace(/\u0002(\s*)\u0001/g, '$1'); // merge adjacent matches ("Dutch" "book")
  const first = s.indexOf('\u0001');
  const vis = (x) => x.replace(/[\u0001\u0002]/g, '');
  if (vis(s).length > max) {
    // Window in "visible" characters around the first match.
    let start = Math.max(0, first - 55);
    // advance start to a word boundary
    if (start > 0) { const sp = s.indexOf(' ', start); if (sp > -1 && sp < first) start = sp + 1; }
    let out = '';
    let visCount = 0;
    for (let i = start; i < s.length && visCount < max - 2; i++) {
      out += s[i];
      if (s[i] !== '\u0001' && s[i] !== '\u0002') visCount++;
    }
    // close a dangling match marker
    if ((out.match(/\u0001/g) || []).length > (out.match(/\u0002/g) || []).length) out += '\u0002';
    out = out.replace(/\s+\S*$/, (m) => (m.includes('\u0002') ? m : ''));
    s = (start > 0 ? '…' : '') + out.trim() + '…';
  }
  return s.replace(/\u0001/g, '«').replace(/\u0002/g, '»');
}

function accessOf(collections = []) {
  if (collections.includes('inlibrary')) return 'borrow';
  if (collections.includes('printdisabled')) return 'restricted';
  return 'open';
}

function lccClass(sortKey) {
  // 'BC-0141.00000000.K4 1929' -> { cls: 'BC', num: 141 }
  const m = /^([A-Z]{1,3})-?(\d+(?:\.\d+)?)?/.exec(sortKey || '');
  return m ? { cls: m[1], num: m[2] ? Number(m[2]) : 0 } : null;
}

function readableCall(sortKey) {
  const m = /^([A-Z]{1,3})-?0*(\d+)(?:\.(\d+))?\.?(.*)$/.exec(sortKey || '');
  if (!m) return null;
  const dec = m[3] && /[1-9]/.test(m[3]) ? '.' + m[3].replace(/0+$/, '') : '';
  return `${m[1]}${m[2]}${dec} ${m[4] ? '.' + m[4].replace(/^\./, '') : ''}`.trim();
}

function judgeFit(field, lccKey, subjects) {
  const F = FIELDS[field];
  const lc = lccClass(lccKey);
  const hasSubj = subjects && subjects.length;
  if (!lc && !hasSubj) return null;
  if (lc && F.lcc.some((p) => (lc.cls + String(lc.num)).startsWith(p) || lc.cls.startsWith(p))) return 1;
  if (hasSubj && subjects.some((s) => F.subj.test(s))) return 1;
  return 0;
}

// ---------------------------------------------------------------------------------------------
const catalog = JSON.parse(readFileSync(join(APP, 'public/prototypes/data/catalog.json'), 'utf-8')).works;
const catByWork = new Map(catalog.map((w) => [w.id, w]));
const catByIa = new Map(catalog.filter((w) => w.ia).map((w) => [w.ia, w]));
const itemCache = new Map();

async function itemInfo(ia) {
  if (itemCache.has(ia)) return itemCache.get(ia);
  const meta = await fetchCached(`https://archive.org/metadata/${encodeURIComponent(ia)}`);
  let info = null;
  if (meta && meta.server && meta.dir) {
    const server = meta.server;
    const br = await fetchCached(
      `https://${server}/BookReader/BookReaderJSIA.php?id=${encodeURIComponent(ia)}&itemPath=${encodeURIComponent(meta.dir)}&server=${server}&format=json&subPrefix=${encodeURIComponent(ia)}`,
    );
    const pages = br?.data?.brOptions?.data?.flat?.() || null;
    const restricted = br?.data?.data?.isRestricted;
    if (pages && pages.length && !restricted) {
      const leafToIndex = new Map();
      pages.forEach((p, i) => leafToIndex.set(p.leafNum, { i, pn: p.pageNum ?? null }));
      info = { server, dir: meta.dir, n: pages.length, leafToIndex, subPrefix: br?.data?.data?.subPrefix || ia };
    }
  }
  itemCache.set(ia, info);
  return info;
}

async function perItemMatches(ia, info, phrase) {
  const url = `https://${info.server}/fulltext/inside.php?item_id=${encodeURIComponent(ia)}&doc=${encodeURIComponent(info.subPrefix)}&path=${encodeURIComponent(info.dir)}&q=${encodeURIComponent('"' + phrase + '"')}`;
  const j = await fetchCached(url);
  if (!j || !Array.isArray(j.matches)) return null;
  const flags = [];
  const seen = new Set();
  for (const m of j.matches) {
    const leaf = m.par?.[0]?.page;
    if (leaf == null) continue;
    const map = info.leafToIndex.get(leaf);
    if (!map) continue;
    const k = map.i + '|' + flags.length;
    if (seen.has(k)) continue;
    seen.add(k);
    flags.push([map.i, map.pn != null ? String(map.pn) : null, snip(m.text, '<IA_FTS_MATCH>', '</IA_FTS_MATCH>')]);
  }
  flags.sort((a, b) => a[0] - b[0]);
  return flags.slice(0, MAX_FLAGS);
}

async function runConcept(c) {
  const q = `"${c.si}"`;
  const si = await fetchCached(`https://openlibrary.org/search/inside.json?q=${encodeURIComponent(q)}&limit=${LIMIT}`);
  if (!si?.hits) { console.warn(`  no result for ${c.id}`); return null; }
  const total = si.hits.total?.value ?? si.hits.total ?? 0;
  const hits = si.hits.hits || [];
  const books = [];
  for (const h of hits) {
    const f = h.fields || {};
    const lang = f.meta_languageSorter || [];
    if (lang.length && !lang.some((l) => /english/i.test(l))) continue;
    const ia = f.identifier?.[0];
    if (!ia) continue;
    const leaves = Number([].concat(f.page_num || []).flat()[0]) || null;
    const year = Number([].concat(f.meta_year || [])[0]) || null;
    books.push({
      ia,
      t: norm(f.meta_title?.[0]).replace(/\s*[:/;]\s*$/, ''),
      a: norm(f.meta_creator?.[0] || ''),
      y: year,
      leaves,
      acc: accessOf(f.meta_collection || []),
      sc: Math.round((h._score || 0) * 100) / 100,
      subj: (f.meta_subjectSorter || []).map(norm).filter(Boolean).slice(0, 6),
      pub: norm(f.meta_publisher?.[0] || ''),
      sn: (h.highlight?.text || []).slice(0, 3).map((t) => snip(t, '{{{', '}}}')),
    });
  }
  if (PROBE) {
    console.log(`\n${c.id}  "${c.si}"  total=${total}  english=${books.length}`);
    for (const b of books.slice(0, 8)) console.log(`   ${b.acc.padEnd(10)} ${String(b.y).padEnd(5)} ${b.t.slice(0, 70)}`);
    return null;
  }
  // Join to Open Library works by IA id (batches of 30).
  const ids = books.map((b) => b.ia);
  const byIa = new Map();
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent('ia:(' + chunk.join(' OR ') + ')')}&fields=key,title,author_name,first_publish_year,lcc,ia,subject,ebook_access&limit=100`;
    const r = await fetchCached(url);
    for (const d of r?.docs || []) for (const x of d.ia || []) if (chunk.includes(x)) byIa.set(x, d);
  }
  let nOpenDone = 0;
  for (const b of books) {
    const w = byIa.get(b.ia);
    if (w) {
      b.work = w.key.replace('/works/', '');
      if (w.first_publish_year) b.fy = w.first_publish_year;
      if (w.author_name?.length && !b.a) b.a = w.author_name[0];
      const subj = (w.subject || []).slice(0, 8);
      b.subj = [...new Set([...b.subj, ...subj])].slice(0, 8);
      const lccs = (w.lcc || []).filter(Boolean).sort();
      if (lccs.length) { b.lcc = lccs[0]; b.call = readableCall(lccs[0]); }
    }
    const cat = (b.work && catByWork.get(b.work)) || catByIa.get(b.ia);
    if (cat) {
      b.cat = cat.id;
      if (!b.lcc && cat.lcc) { b.lcc = cat.lcc; b.call = cat.call; }
      b.catAcc = cat.acc;
    }
    b.fit = judgeFit(c.f, b.lcc, b.subj);
    // Per-page flags for open scans.
    if (b.acc === 'open' && nOpenDone < OPEN_CAP) {
      const info = await itemInfo(b.ia);
      if (info) {
        const flags = await perItemMatches(b.ia, info, c.si);
        if (flags && flags.length) { b.flags = flags; b.n = info.n; nOpenDone++; }
      }
    }
    b.subj = b.subj.slice(0, 4);
  }
  const out = {
    id: c.id,
    label: c.label,
    query: q,
    total,
    snapshot: SNAPSHOT,
    source: 'Open Library Search Inside (Internet Archive full-text index), https://openlibrary.org/search/inside.json; joins: Open Library Search API, archive.org metadata, BookReader manifests and per-item search inside for open scans',
    books,
  };
  writeFileSync(join(OUT, 'si', c.id + '.json'), JSON.stringify(out));
  const located = books.filter((b) => b.flags).length;
  console.log(`${c.id.padEnd(28)} total=${String(total).padStart(7)} books=${books.length} located=${located} fit=${books.filter((b) => b.fit === 1).length} ff=${books.filter((b) => b.fit === 0).length}  (net ${nNet})`);
  return { total, books: books.length, located, flags: books.reduce((s, b) => s + (b.flags?.length || 0), 0) };
}

const index = [];
for (const c of CONCEPTS) {
  if (ONLY && !ONLY.includes(c.id)) continue;
  const r = await runConcept(c);
  if (r) index.push({ ...c, f: undefined, field: c.f, siTotal: r.total, siBooks: r.books, siLocated: r.located, siFlags: r.flags });
}
if (!PROBE) {
  // Merge with an existing index when --only was used.
  const idxFile = join(OUT, 'concepts.json');
  let prev = [];
  if (ONLY && existsSync(idxFile)) prev = JSON.parse(readFileSync(idxFile, 'utf-8')).concepts || [];
  const merged = CONCEPTS.map((c) => index.find((x) => x.id === c.id) || prev.find((x) => x.id === c.id)).filter(Boolean);
  writeFileSync(
    idxFile,
    JSON.stringify(
      {
        snapshot: SNAPSHOT,
        about: 'Concept list for the Page Flags prototype. si = phrase sent to Open Library Search Inside; wall = regex source for the full-text wall; syn = AI-generated synonym suggestions.',
        synProvenance: 'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)',
        fields: Object.fromEntries(Object.entries(FIELDS).map(([k, v]) => [k, { lcc: v.lcc, subj: v.subj.source }])),
        concepts: merged.map(({ f, ...rest }) => rest),
      },
      null,
      0,
    ),
  );
  console.log(`wrote ${merged.length} concepts; ${nNet} network requests`);
}
