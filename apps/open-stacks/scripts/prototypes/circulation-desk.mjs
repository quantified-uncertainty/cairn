#!/usr/bin/env node
/**
 * The Circulation Desk — build the access-route registry for the departures board.
 *
 *   node scripts/prototypes/circulation-desk.mjs              # full build (needs network for OL/IA checks)
 *   node scripts/prototypes/circulation-desk.mjs --offline    # reuse the HTTP cache only
 *   node scripts/prototypes/circulation-desk.mjs --cache DIR  # HTTP cache dir (default: $TMPDIR/circulation-desk-cache)
 *
 * Writes public/prototypes/data/circulation-desk/routes.json:
 *
 *   rules      Routing rules, each with a short code (A1, B1, L1, O2 ...), the dossier section it comes
 *              from and a confidence class. The page cites these codes on every route, and live Claude
 *              explanations must cite them too (the page drops codes that do not exist).
 *   keys       Access keys a reader can hold (open web, IA account, library cards, subscriptions), with
 *              prices and frictions from research/R03-paid-and-institutional-access.md (2026-10-15).
 *   publishers ISBN registrant prefixes -> publisher, and publisher -> O'Reilly / Perlego presence, from
 *              R03 §1.2 and §1.3. Used ONLY to estimate subscription coverage for titles nobody checked.
 *   works      A hand-curated registry of 28 frequently assigned books. Every fact is copied from
 *              research/R01-open-books.md (author-hosted copies, §4; the 55-book coverage test, §9) and
 *              R03 (the 33-book technical and 20-book humanities spot-checks, §5; AbeBooks prices, §1.5;
 *              Libby holdings, §2.2). Each work is joined to catalog.json by Open Library work id, or, when
 *              the shared catalog lacks it, looked up live in the Open Library search API (id stored).
 *   sample     The prefilled reading list (28 registry titles plus two deliberately messy lines).
 *   precomputed  Claude-written route explanations and two tray resolutions, labelled AI-generated.
 *
 * Live checks made by this script (polite: one request at a time, >= 1.1 s apart, User-Agent set):
 *   1. Open Library search API — work ids, median page counts and IA scan ids for works missing from
 *      catalog.json.
 *   2. Internet Archive item metadata (archive.org/metadata/<id>) for every scan of the works R01 lists
 *      as "borrowable", to find an ENGLISH scan in the lending collection (`inlibrary`). Open Library's
 *      work-level `ebook_access` flag is a maximum over all editions, translations included (R01
 *      verification #10), so a work only gets rule B1 (verified English loan) when such a scan exists.
 *
 * Nothing here routes to shadow libraries. Rule X1 records that policy.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { tmpdir } from 'os';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = join(APP, 'public/prototypes/data');
const OUT_DIR = join(DATA, 'circulation-desk');
const UA = 'OpenStacksPrototypes/0.1 (https://github.com/quantified-uncertainty/cairn)';
const args = process.argv.slice(2);
const OFFLINE = args.includes('--offline');
const CACHE = args.includes('--cache') ? args[args.indexOf('--cache') + 1] : join(process.env.TMPDIR || tmpdir(), 'circulation-desk-cache');
const CHECKED = '2026-10-15';
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

let lastReq = 0;
async function getJSON(url) {
  const f = join(CACHE, createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf-8'));
  if (OFFLINE) return null;
  const wait = 1100 - (Date.now() - lastReq);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReq = Date.now();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      writeFileSync(f, JSON.stringify(j));
      return j;
    } catch (e) {
      if (attempt === 2) { console.warn('  ! ' + url + ' — ' + e.message); return null; }
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
}

const catalog = JSON.parse(readFileSync(join(DATA, 'catalog.json'), 'utf-8')).works;
const byOL = new Map(catalog.map((w) => [w.id, w]));
const gut = JSON.parse(readFileSync(join(DATA, 'gutenberg.json'), 'utf-8')).books;
const gutById = new Map(gut.map((b) => [b.id, b]));

// ---------------------------------------------------------------------------------------------
// Rules. Codes are what the board prints on each route and what Claude must cite.
// ---------------------------------------------------------------------------------------------
const rules = {
  A1: { name: 'Author- or publisher-hosted full text', src: 'R01 §4 (author-hosted editions)', conf: 'verified',
    d: 'A complete text the author or publisher deliberately makes available. Terms range from Creative Commons to "personal use only"; each route quotes them.' },
  A2: { name: 'Open-access book (DOAB)', src: 'R01 §1 and §9 (DOAB export)', conf: 'verified',
    d: 'Listed in the Directory of Open Access Books with an open licence.' },
  A3: { name: 'Public domain: Project Gutenberg', src: 'R01 §7; gutenberg.json', conf: 'verified',
    d: 'The work has a Project Gutenberg ebook id. Free to read and reuse in the US.' },
  A4: { name: 'Standard Ebooks edition', src: 'catalog.json (Open Library) field se; R01 §7', conf: 'verified',
    d: 'A proofread, typeset public-domain edition from Standard Ebooks.' },
  A5: { name: 'Open scan on the Internet Archive', src: 'catalog.json: ebook_access = public', conf: 'verified',
    d: 'Open Library marks the work "public": a full scan anyone can read without a loan.' },
  A6: { name: 'Partial free text', src: 'R01 §9 (coverage test)', conf: 'verified',
    d: 'Only part of the book is free. Counted as a start, not as the book.' },
  B1: { name: 'Internet Archive loan, English scan verified', src: 'R01 §9 (corrected); R03 §1.6; IA metadata re-checked ' + CHECKED, conf: 'verified',
    d: 'An English-language scan is in the Internet Archive lending collection. Free account; 1-hour renewable loans, some 14-day; waitlists possible.' },
  B2: { name: 'Internet Archive loan flag, edition unverified', src: 'catalog.json: ebook_access = borrowable; R01 verification #10', conf: 'likely',
    d: 'Open Library flags the work "borrowable", but the flag is a maximum over all editions, translations included, so the lendable copy may not be in English.' },
  B3: { name: 'Translation-only lending (not routed)', src: 'R01 §9, corrected in verification', conf: 'verified',
    d: 'The only lendable scans are translations or study guides; English scans are print-disabled only. Shown as a warning, never as a route.' },
  P1: { name: 'Print-disabled access only', src: 'catalog.json: ebook_access = printdisabled; R01 §7', conf: 'verified',
    d: 'The scan is available only to readers certified as print-disabled (through a qualifying organization or a certifying professional). Offered only when the reader says they are eligible.' },
  L1: { name: 'Library ebook, holdings checked', src: 'R03 §2.2 and §5 (OverDrive/Libby API, snapshot ' + CHECKED + ')', conf: 'verified',
    d: 'Libby holdings at named libraries on the snapshot date, with copies and holds where recorded. Wait estimate: two weeks per loan cycle, holds ÷ copies cycles.' },
  L2: { name: 'Library ebook, likely (not checked)', src: 'R03 §2.2 base rates; inference', conf: 'estimate',
    d: 'Not checked for this title. In R03, Bay Area Libby held 16 of 20 humanities and 18 of 33 technical titles; popular trade books are held most often.' },
  O1: { name: "O'Reilly catalog, title checked", src: 'R03 §1.2 and §5 (public book sitemap, 66,609 titles)', conf: 'verified',
    d: "Present (or absent) in O'Reilly's public book sitemap." },
  O2: { name: "O'Reilly, estimated from the publisher", src: 'R03 §1.2 (sitemap by ISBN prefix)', conf: 'estimate',
    d: "Not checked by title. Estimated from the publisher's share of the sitemap: Wiley ≈9,200, O'Reilly ≈9,000, Pearson ≈6,200, Apress ≈4,000, CRC ≈3,000, Manning ≈1,100; MIT Press, Cambridge, Oxford and core Springer 0." },
  O3: { name: "O'Reilly through a public library", src: 'R03 §2.1; contested point 2', conf: 'likely',
    d: "SFPL, Oakland, Berkeley, San José and Santa Clara County libraries offer O'Reilly for Public Libraries to cardholders. About 70% that sitemap titles are readable this way." },
  E1: { name: 'Perlego, title checked (US rights)', src: 'R03 §1.3 and §5 (public search index)', conf: 'verified',
    d: 'Present (or absent) in Perlego with US sales rights. "Restricted" titles probably need the Complete plan.' },
  E2: { name: 'Perlego, estimated from the publisher', src: 'R03 §1.3 (publisher counts)', conf: 'estimate',
    d: 'Not checked by title. Perlego carries Routledge (153k), CRC (34k), Wiley (19k), Cambridge (15.7k), Princeton (9.8k), MIT Press (1k); almost no O\'Reilly (33) and no Pearson.' },
  V1: { name: 'Everand, unverified', src: 'R03 §1.4', conf: 'estimate',
    d: "Everand's catalog blocked automated checks. Plans give 1, 3 or 5 unlocks a month. Routed for popular trade titles only, as an estimate." },
  K1: { name: 'Kindle Unlimited, unverified', src: 'R03 §1.1', conf: 'estimate',
    d: 'Claims "over 5 million digital titles"; price about $11.99 unverified. No title on this list was checked, so the desk routes nothing through it.' },
  U1: { name: 'Buy, price checked', src: 'R03 §1.5 (AbeBooks, cheapest total incl. US shipping, ' + CHECKED + ')', conf: 'verified',
    d: 'Cheapest AbeBooks listing by ISBN on the snapshot date. Ships in about 3–5 days.' },
  U2: { name: 'Buy, price not checked', src: 'no price source', conf: 'estimate',
    d: 'Always possible, but no price was recorded. Search by ISBN.' },
  H1: { name: 'Free shadow', src: 'R01 §6 (lecture notes and courses)', conf: 'judgement',
    d: 'Free material covering similar ground, such as a course by the same department. A judgement, not an edition of the book.' },
  X1: { name: 'No shadow libraries', src: 'Policy; see R09', conf: 'policy',
    d: 'The desk never routes to unauthorised copies, even when nothing else is free.' },
};

// ---------------------------------------------------------------------------------------------
// Keys (R03, 2026-10-15). Library keys use R03's Bay Area sample as the worked example.
// ---------------------------------------------------------------------------------------------
const keys = [
  { id: 'web', name: 'Open web', short: 'OPEN WEB', cost: 0, per: null, friction: 'Always held', held: true, fixed: true, src: 'R01',
    note: 'Author sites, open-access books, Project Gutenberg, Standard Ebooks, open Internet Archive scans.' },
  { id: 'ia', name: 'Internet Archive account', short: 'IA ACCOUNT', cost: 0, per: null, friction: 'Sign up online, instant', held: true, src: 'R03 §1.6',
    note: 'Controlled digital lending: 1-hour renewable loans, some 14-day; up to 10 books at a time.' },
  { id: 'sfpl', name: 'San Francisco PL card', short: 'SFPL CARD', cost: 0, per: null, friction: 'Free to California residents; apply online, show ID in person', src: 'R03 §2.1',
    note: "Libby, O'Reilly for Public Libraries, ProQuest eBook Central, JSTOR (remote access disputed)." },
  { id: 'bay', name: 'Bay Area card stack', short: 'BAY CARDS', cost: 0, per: null, friction: 'Five free cards (Oakland, Berkeley, San José, Santa Clara County, Peninsula); several visits', src: 'R03 §2.1–2.2',
    note: "Libby at five more systems; O'Reilly at Oakland, Berkeley, San José and Santa Clara County." },
  { id: 'lapl', name: 'LA Public Library card', short: 'LAPL CARD', cost: 0, per: null, friction: 'Free to Californians, in person in LA (e-card for LA City residents only)', src: 'R03 §2.1, §2.4',
    note: "Libby with MIT Press ebooks no Bay Area library had (CLRS, Goodfellow, Sutton & Barto). No O'Reilly." },
  { id: 'oreilly', name: "O'Reilly Individual", short: "O'REILLY", cost: 49, per: 'mo', friction: '$49 a month, $499 a year', src: 'R03 §1.1',
    note: "Strong on Wiley, O'Reilly, Pearson, Packt, Apress, CRC, Manning; no MIT Press, Cambridge, Oxford or core Springer. Terms forbid using content as AI input." },
  { id: 'perlego', name: 'Perlego Complete', short: 'PERLEGO', cost: 27, per: 'mo', friction: '$27 a month, $199 a year (Essential $15 lacks "restricted" titles)', src: 'R03 §1.1, §1.3',
    note: "Humanities and social science: Routledge, CRC, Cambridge, Princeton, Yale, Chicago. Almost no O'Reilly or Pearson." },
  { id: 'everand', name: 'Everand Plus', short: 'EVERAND', cost: 16.99, per: 'mo', friction: '$16.99 a month for 3 unlocks', cap: 3, src: 'R03 §1.4',
    note: 'Unlock model since the unlimited plan ended. Catalog could not be checked; routes are estimates.' },
  { id: 'ku', name: 'Kindle Unlimited', short: 'KINDLE UNL.', cost: 11.99, per: 'mo', friction: 'About $11.99 a month (unverified)', src: 'R03 §1.1',
    note: 'No title on this list was checked against it, so it opens nothing here.' },
  { id: 'pd', name: 'Print-disabled eligibility', short: 'PRINT-DISABLED', cost: 0, per: null, friction: 'Not for sale: certification of a print disability is required', restricted: true, src: 'R01 §7',
    note: 'Unlocks print-disabled scans on the Internet Archive for eligible readers only. The advisor never recommends it.' },
];

// ---------------------------------------------------------------------------------------------
// Publishers: ISBN registrant prefixes (R03 §1.2 lists the O'Reilly-side ones; the rest are
// standard registrant blocks) and their O'Reilly / Perlego presence (R03 §1.2, §1.3).
// ---------------------------------------------------------------------------------------------
const publishers = {
  // Registrant prefixes as ISBN-13 digits without hyphens. The longest matching prefix wins.
  prefixes: [
    ['9780262', 'MIT Press'],
    ['9780521', 'Cambridge University Press'], ['9781107', 'Cambridge University Press'], ['9781108', 'Cambridge University Press'], ['9781009', 'Cambridge University Press'], ['9780511', 'Cambridge University Press'],
    ['978019', 'Oxford University Press'],
    ['9780387', 'Springer'], ['9783540', 'Springer'], ['9783642', 'Springer'], ['9783319', 'Springer'], ['9783030', 'Springer'], ['9783031', 'Springer'],
    ['97814419', 'Springer'], ['97814614', 'Springer'], ['97814757', 'Springer'], ['97814471', 'Springer'], ['97808176', 'Springer'], ['97894007', 'Springer'],
    ['9780691', 'Princeton University Press'], ['9780300', 'Yale University Press'], ['9780226', 'University of Chicago Press'], ['9780674', 'Harvard University Press'],
    ['9780596', "O'Reilly Media"], ['97814493', "O'Reilly Media"], ['97814919', "O'Reilly Media"], ['97814920', "O'Reilly Media"], ['9781098', "O'Reilly Media"],
    ['978013', 'Pearson'], ['9780321', 'Pearson'], ['9780201', 'Pearson'], ['9781292', 'Pearson'],
    ['9781118', 'Wiley'], ['9781119', 'Wiley'], ['9780470', 'Wiley'], ['9780471', 'Wiley'], ['9781394', 'Wiley'],
    ['978178', 'Packt'], ['978180', 'Packt'], ['978183', 'Packt'],
    ['97814842', 'Apress'], ['97814302', 'Apress'],
    ['9781617', 'Manning'], ['9781633', 'Manning'],
    ['97814398', 'CRC Press'], ['97815848', 'CRC Press'], ['97814200', 'CRC Press'], ['97814665', 'CRC Press'], ['97814822', 'CRC Press'], ['97808493', 'CRC Press'], ['9780367', 'CRC Press'], ['9781032', 'CRC Press'],
    ['9781138', 'Routledge'], ['9780415', 'Routledge'],
    ['978012', 'Elsevier'], ['97815586', 'Elsevier'], ['978008', 'Elsevier'],
    ['978007', 'McGraw-Hill'], ['9780486', 'Dover'],
    ['978014', 'Penguin Random House'], ['9780670', 'Penguin Random House'], ['9780525', 'Penguin Random House'], ['9780385', 'Penguin Random House'], ['9780307', 'Penguin Random House'],
    ['97808041', 'Penguin Random House'], ['9780375', 'Penguin Random House'], ['9780394', 'Penguin Random House'], ['9780679', 'Penguin Random House'], ['9781101', 'Penguin Random House'],
    ['9780553', 'Penguin Random House'], ['9780241', 'Penguin Random House'], ['9780374', 'Macmillan (FSG)'],
    ['9780393', 'W. W. Norton'], ['9780465', 'Basic Books'], ['97815416', 'Basic Books'], ['978006', 'HarperCollins'], ['9780316', 'Hachette'],
    ['97815011', 'Simon & Schuster'], ['97807432', 'Simon & Schuster'], ['97814516', 'Simon & Schuster'], ['97814767', 'Simon & Schuster'], ['9780684', 'Simon & Schuster'],
  ],
  // o = O'Reilly sitemap titles (R03 §1.2; the big-5 trade houses together ≈62), p = Perlego titles (R03 §1.3); null = not counted.
  table: {
    'MIT Press': { o: 0, p: 1003 }, 'Cambridge University Press': { o: 0, p: 15658 }, 'Oxford University Press': { o: 0, p: null },
    Springer: { o: 0, p: 4472 }, 'Princeton University Press': { o: 0, p: 9762 }, 'Yale University Press': { o: 0, p: 1558 },
    'University of Chicago Press': { o: 0, p: null }, 'Harvard University Press': { o: 0, p: 2958 },
    "O'Reilly Media": { o: 8975, p: 33 }, Pearson: { o: 6188, p: 0 }, Wiley: { o: 9204, p: 18959 }, Packt: { o: 4700, p: 5662 },
    Apress: { o: 3997, p: 1165 }, Manning: { o: 1140, p: 688 }, 'CRC Press': { o: 3057, p: 33699 }, Routledge: { o: 3057, p: 153104 },
    Elsevier: { o: 1675, p: 5598 }, 'McGraw-Hill': { o: 1205, p: null }, Dover: { o: null, p: null },
    'Penguin Random House': { o: 62, p: null }, 'Macmillan (FSG)': { o: 62, p: null }, 'W. W. Norton': { o: 62, p: 421 }, 'Basic Books': { o: 62, p: null },
    HarperCollins: { o: 62, p: 1986 }, Hachette: { o: 62, p: null }, 'Simon & Schuster': { o: 62, p: 2361 },
  },
};

// ---------------------------------------------------------------------------------------------
// The registry. Facts and sources are inline. `ol` = Open Library work id in catalog.json;
// `olq` = Open Library search query used when the shared catalog lacks the work.
// libby: null = not checked; {checked:true, sfpl, bay:[...], lapl} from R03 §5 (true = held; or
// {c: copies, h: holds}). oreilly / perlego: true/false = checked in R03 §5; undefined = not checked.
// ---------------------------------------------------------------------------------------------
const R03 = 'R03 §5';
const works = [
  { key: 'itila', ol: 'OL8325677W', t: 'Information Theory, Inference, and Learning Algorithms', a: ['David J. C. MacKay'], y: 2003, kind: 'textbook', pub: 'Cambridge University Press', alias: ['itila'],
    free: [{ rule: 'A1', label: 'AUTHOR PDF', url: 'https://www.inference.org.uk/itila/book.html', terms: 'PDF, PostScript, DjVu and EPUB. "You are welcome to view the book on-screen."' }],
    oreilly: false, perlego: false, libby: { checked: true }, used: [{ p: 56.21, isbn: '9780521642989' }] },
  { key: 'esl', ol: 'OL4147338W', t: 'The Elements of Statistical Learning', ed: '2nd ed. (2009)', a: ['Trevor Hastie', 'Robert Tibshirani', 'Jerome Friedman'], y: 2001, kind: 'textbook', pub: 'Springer', alias: ['esl', 'eosl'],
    free: [{ rule: 'A1', label: 'AUTHOR PDF', url: 'https://hastie.su.domains/ElemStatLearn/', terms: 'Author-hosted PDF of the 2nd edition (12th printing).', conf: 'likely',
      note: 'The host reset connections from the research environment on 2026-10-15; the book is listed in free-programming-books [~90%].' }],
    iaCheck: true, oreilly: false, perlego: false, libby: { checked: true }, used: [{ p: 42.14, isbn: '9780387848570', ed: '2nd ed.' }] },
  { key: 'isl', ol: 'OL17581605W', t: 'An Introduction to Statistical Learning', a: ['Gareth James', 'Daniela Witten', 'Trevor Hastie', 'Robert Tibshirani'], y: 2013, kind: 'textbook', pub: 'Springer', alias: ['isl', 'islr', 'islp'],
    free: [{ rule: 'A1', label: 'AUTHOR PDF', url: 'https://www.statlearning.com/', terms: 'Full PDFs: R 1st ed. (2013), R 2nd ed. (2021) and the Python edition (2023).' }] },
  { key: 'sutton-barto', ol: 'OL2691730W', t: 'Reinforcement Learning: An Introduction', ed: '2nd ed. (2018)', a: ['Richard S. Sutton', 'Andrew G. Barto'], y: 1998, kind: 'textbook', pub: 'MIT Press', alias: ['sutton barto'],
    free: [{ rule: 'A1', label: 'AUTHOR PDF', url: 'http://incompleteideas.net/book/the-book-2nd.html', terms: 'Full PDF of the 2nd edition (73 MB).' }],
    oreilly: false, perlego: false, libby: { checked: true, lapl: { c: 1 } }, used: [{ p: 77.74, isbn: '9780262039246', ed: '2nd ed.' }] },
  { key: 'pml1', olq: { title: 'Probabilistic Machine Learning', author: 'Kevin P. Murphy' }, t: 'Probabilistic Machine Learning: An Introduction', a: ['Kevin P. Murphy'], y: 2022, kind: 'textbook', pub: 'MIT Press', alias: ['pml', 'probml', 'pml1'],
    free: [{ rule: 'A1', label: 'AUTHOR PDF', url: 'https://probml.github.io/pml-book/book1.html', terms: 'Draft PDF dated 2025-04-18, CC BY-NC-ND.' }] },
  { key: 'prml', ol: 'OL2963587W', t: 'Pattern Recognition and Machine Learning', a: ['Christopher M. Bishop'], y: 2006, kind: 'textbook', pub: 'Springer', alias: ['prml'],
    free: [{ rule: 'A1', label: 'PUBLISHER PDF', url: 'https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/', terms: 'Full PDF hosted by Microsoft Research; no licence text on the page.' }],
    oreilly: false, perlego: false, libby: { checked: true }, used: [{ p: 38.19, isbn: '9780387310732' }] },
  { key: 'bda3', ol: 'OL17552975W', t: 'Bayesian Data Analysis', ed: '3rd ed. (2013)', a: ['Andrew Gelman', 'John B. Carlin', 'Hal S. Stern', 'David B. Dunson', 'Aki Vehtari', 'Donald B. Rubin'], y: 2013, kind: 'textbook', pub: 'CRC Press', alias: ['bda', 'bda3'],
    free: [{ rule: 'A1', label: 'AUTHOR PDF', url: 'https://sites.stat.columbia.edu/gelman/book/', terms: 'PDF "for non-commercial purposes".' }],
    oreilly: true, perlego: { restricted: true }, libby: { checked: true }, used: [{ p: 54.39, isbn: '9781439840955' }] },
  { key: 'jaynes', ol: 'OL5911565W', t: 'Probability Theory: The Logic of Science', a: ['E. T. Jaynes'], y: 2003, kind: 'textbook', pub: 'Cambridge University Press', alias: ['jaynes'],
    partial: [{ rule: 'A6', label: 'PARTIAL', url: 'https://bayes.wustl.edu/etj/prob/book.pdf', terms: 'A 95-page PDF on the editor\'s site: front matter and chapters 1–3 (© 1995 Jaynes).' }],
    oreilly: false, perlego: false, libby: { checked: true }, used: [{ p: 69.99, isbn: '9780521592710' }] },
  { key: 'rethinking', ol: 'OL20743446W', t: 'Statistical Rethinking', ed: '2nd ed. (2020)', a: ['Richard McElreath'], y: 2015, kind: 'textbook', pub: 'CRC Press', alias: ['rethinking'],
    oreilly: true, perlego: { restricted: true }, libby: { checked: true }, used: [{ p: 68.75, isbn: '9780367139919', ed: '2nd ed.' }],
    notes: ['R01 records the author\'s lectures as free; no link was verified for this build, so no shadow is offered.'] },
  { key: 'goodfellow', ol: 'OL17801809W', t: 'Deep Learning', a: ['Ian Goodfellow', 'Yoshua Bengio', 'Aaron Courville'], y: 2016, kind: 'textbook', pub: 'MIT Press', alias: ['goodfellow'],
    free: [{ rule: 'A1', label: 'HTML ONLY', url: 'https://www.deeplearningbook.org/', terms: 'HTML only: "our contract with MIT Press forbids distribution of too easily copied electronic formats".' }],
    oreilly: false, perlego: true, libby: { checked: true, lapl: { c: 3 } }, used: [{ p: 35.99, isbn: '9780262035613' }] },
  { key: 'bertsekas', ol: 'OL17816074W', t: 'Introduction to Probability', ed: '2nd ed. (2008)', a: ['Dimitri P. Bertsekas', 'John N. Tsitsiklis'], y: 2008, kind: 'textbook', pub: 'Athena Scientific', alias: [],
    iaCheck: true,
    shadow: [{ rule: 'H1', label: 'MIT OCW 6.041SC', url: 'https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/', terms: 'Probabilistic Systems Analysis and Applied Probability (Fall 2013): lectures, recitations and problem sets, CC BY-NC-SA. R01 §6 calls it a free substitute for this textbook (a judgement).' }] },
  { key: 'aima', ol: 'OL2896994W', t: 'Artificial Intelligence: A Modern Approach', ed: '4th ed. (2020)', a: ['Stuart Russell', 'Peter Norvig'], y: 1995, kind: 'textbook', pub: 'Pearson', alias: ['aima'],
    oreilly: false, perlego: false, libby: { checked: true },
    used: [{ p: 33.15, isbn: '9780134610993', cond: 'new', note: 'Listed "New"; probably an international edition (R03 inference).' }, { p: 127.80, isbn: '9780134610993' }],
    notes: ['Not free: the book site offers only the preface, contents, bibliography, index and pseudocode (R01 §4).'] },
  { key: 'ddia', olq: { title: 'Designing Data-Intensive Applications', author: 'Kleppmann' }, t: 'Designing Data-Intensive Applications', a: ['Martin Kleppmann'], y: 2017, kind: 'technical', pub: "O'Reilly Media", alias: ['ddia'],
    oreilly: true, perlego: false, libby: { checked: true, sfpl: { c: 10 }, bay: ['OPL', 'SJPL', 'SCCLD'], lapl: true }, used: [{ p: 44.54, isbn: '9781449373320', ed: '1st ed.' }],
    notes: ['Not free: the book site points to purchase (R01 §4).'] },
  { key: 'geron', ol: 'OL19543288W', t: 'Hands-On Machine Learning with Scikit-Learn and TensorFlow', a: ['Aurélien Géron'], y: 2017, kind: 'technical', pub: "O'Reilly Media", alias: ['homl'],
    iaCheck: true, iaEdNote: 'The lendable scan is the 1st edition (2017, TensorFlow 1). The current edition is the 3rd (2022).',
    oreilly: true, perlego: false, libby: { checked: true, bay: ['SJPL', 'SCCLD'], lapl: true }, used: [{ p: 32.74, isbn: '9781098125974', ed: '3rd ed.' }] },
  { key: 'clrs', ol: 'OL4781294W', t: 'Introduction to Algorithms', a: ['Thomas H. Cormen', 'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein'], y: 1990, kind: 'textbook', pub: 'MIT Press', alias: ['clrs'],
    oreilly: false, perlego: false, libby: { checked: true, lapl: { c: 3 } }, used: [{ p: 16.25, isbn: '9780262033848', ed: '3rd ed.' }, { p: 70.43, isbn: '9780262046305', ed: '4th ed.' }] },
  { key: 'tfs', ol: 'OL15992072W', t: 'Thinking, Fast and Slow', a: ['Daniel Kahneman'], y: 2011, kind: 'popular', pub: 'Farrar, Straus and Giroux', alias: [],
    iaTrap: { lend: 'onsfeilbaredenke0000kahn', english: 'thinkingfastslow0000kahn_b1q8',
      note: 'Open Library flags this work "borrowable", but the lendable scans are translations; the English scan is print-disabled only (R01 §9, corrected in verification).' },
    oreilly: false, perlego: false, libby: { checked: true, sfpl: { c: 13, h: 51 }, bay: ['OPL', 'BPL', 'SJPL', 'SCCLD', 'PLS'], lapl: { c: 16, h: 87 } } },
  { key: 'superforecasting', ol: 'OL18233878W', t: 'Superforecasting: The Art and Science of Prediction', a: ['Philip E. Tetlock', 'Dan Gardner'], y: 2015, kind: 'popular', pub: 'Crown', alias: [],
    oreilly: false, perlego: false, libby: { checked: true, sfpl: true, bay: ['SJPL', 'SCCLD', 'PLS'], lapl: true }, used: [{ p: 9.38, isbn: '9780804136716' }] },
  { key: 'alignment', ol: 'OL20781447W', t: 'The Alignment Problem', a: ['Brian Christian'], y: 2020, kind: 'popular', pub: 'W. W. Norton', alias: [],
    oreilly: false, perlego: false, perlegoNote: 'In Perlego only as the UK Atlantic Books edition, without US sales rights (R03 §1.3).',
    libby: { checked: true, sfpl: { c: 7, h: 8 }, bay: ['SCCLD', 'PLS'], lapl: true } },
  { key: 'geb', ol: 'OL716850W', t: 'Gödel, Escher, Bach: an Eternal Golden Braid', a: ['Douglas R. Hofstadter'], y: 1979, kind: 'popular', pub: 'Basic Books', alias: ['geb'],
    oreilly: false, perlego: false, libby: { checked: true }, used: [{ p: 8.23, isbn: '9780465026562' }],
    notes: ['No Libby copy at any of the nine systems R03 checked; it may simply have no ebook edition (R03 contested point 11).'] },
  { key: 'kuhn', olq: { title: 'The Structure of Scientific Revolutions', author: 'Kuhn' }, t: 'The Structure of Scientific Revolutions', a: ['Thomas S. Kuhn'], y: 1962, kind: 'monograph', pub: 'University of Chicago Press', alias: [],
    iaCheck: true, oreilly: false, perlego: true, libby: null },
  { key: 'parfit', olq: { title: 'Reasons and Persons', author: 'Parfit' }, t: 'Reasons and Persons', a: ['Derek Parfit'], y: 1984, kind: 'monograph', pub: 'Oxford University Press', alias: [],
    iaCheck: true, oreilly: false, perlego: false, libby: null },
  { key: 'scott', ol: 'OL26241985W', t: 'Seeing Like a State', a: ['James C. Scott'], y: 1998, kind: 'monograph', pub: 'Yale University Press', alias: [],
    oreilly: false, perlego: true, libby: null },
  { key: 'savage', olq: { title: 'The Foundations of Statistics', author: 'Savage' }, t: 'The Foundations of Statistics', a: ['Leonard J. Savage'], y: 1954, kind: 'monograph', pub: 'Dover', alias: [],
    iaCheck: true },
  { key: 'moral-uncertainty', olq: { title: 'Moral Uncertainty', author: 'MacAskill' }, t: 'Moral Uncertainty', a: ['William MacAskill', 'Krister Bykvist', 'Toby Ord'], y: 2020, kind: 'monograph', pub: 'Oxford University Press', alias: [],
    free: [{ rule: 'A2', label: 'OPEN ACCESS', url: 'https://directory.doabooks.org/handle/20.500.12854/30579', terms: 'Open access from Oxford University Press, CC BY-NC-ND (DOAB record).' }] },
  { key: 'keynes', ol: 'OL35949W', t: 'A Treatise on Probability', a: ['John Maynard Keynes'], y: 1921, kind: 'classic', pub: 'Macmillan', alias: [], pg: 32625 },
  { key: 'laplace', olq: { title: 'A Philosophical Essay on Probabilities', author: 'Laplace' }, t: 'A Philosophical Essay on Probabilities', a: ['Pierre-Simon Laplace'], y: 1814, kind: 'classic', pub: '(public domain)', alias: [], pg: 58881,
    notes: ['The full text is also on the Open Stacks text shelf (data/texts/58881.txt).'] },
  { key: 'hume', ol: 'OL93547W', t: 'An Enquiry Concerning Human Understanding', a: ['David Hume'], y: 1748, kind: 'classic', pub: '(public domain)', alias: [], pg: 9662,
    notes: ['Open Library files this work under its first title, Philosophical Essays Concerning Human Understanding.'] },
  { key: 'darwin', ol: 'OL515051W', t: 'On the Origin of Species', a: ['Charles Darwin'], y: 1859, kind: 'classic', pub: '(public domain)', alias: [], pg: 1228 },
];

const sample = [
  '# Forecasting, ML & epistemics reading group: fall list',
  'MacKay, Information Theory, Inference, and Learning Algorithms',
  'Hastie, Tibshirani & Friedman: The Elements of Statistical Learning',
  'ISL (James, Witten, Hastie, Tibshirani)',
  'Sutton & Barto, Reinforcement Learning: An Introduction (2nd ed)',
  'Murphy, Probabilistic Machine Learning: An Introduction',
  'Bishop PRML',
  'Gelman et al., BDA3',
  'Jaynes, Probability Theory: The Logic of Science',
  'McElreath, Statistical Rethinking',
  'Goodfellow, Bengio & Courville, Deep Learning',
  'Bertsekas & Tsitsiklis, Introduction to Probability',
  'Russell & Norvig, AIMA',
  'Kleppmann, Designing Data-Intensive Applications',
  'Géron, Hands-On Machine Learning',
  'CLRS',
  'Kahneman, Thinking, Fast and Slow',
  'Tetlock & Gardner, Superforecasting',
  'Brian Christian, The Alignment Problem',
  'Hofstadter, Gödel, Escher, Bach',
  'Kuhn, The Structure of Scientific Revolutions',
  'Parfit, Reasons and Persons',
  'James C. Scott, Seeing Like a State',
  'Savage, The Foundations of Statistics',
  'MacAskill, Bykvist & Ord, Moral Uncertainty',
  'Keynes, A Treatise on Probability (1921)',
  'Laplace, A Philosophical Essay on Probabilities',
  'Hume, An Enquiry Concerning Human Understanding',
  'Darwin, On the Origin of Species',
  'the Kahneman/Tversky heuristics & biases volume',
  "de Finetti's two-volume Theory of Probability (the Wiley one)",
].join('\n');

// ---------------------------------------------------------------------------------------------
// Precomputed Claude content (AI-generated; labelled as such in the UI).
// ---------------------------------------------------------------------------------------------
const PROV = 'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)';
const explanations = {
  tfs: 'The catalog says "borrowable", but that flag comes from translations: the English scan is print-disabled only, so the desk does not offer an Internet Archive loan [B3]. The realistic route is a library ebook. SFPL had 13 copies and 51 holds on the snapshot date, roughly an eight-week wait; LAPL\'s queue was longer [L1].',
  geron: 'Tonight\'s free route is an Internet Archive loan, but of the 1st edition (2017, TensorFlow 1) [B1]. For the current 3rd edition, O\'Reilly carries it [O1], and a library card reaches O\'Reilly at no cost [O3]; San José and Santa Clara County also hold Libby copies [L1].',
  scott: 'No free copy and no English loan: the Internet Archive scan is print-disabled only [P1]. Perlego carries the Yale edition with US rights [E1], so a month of Perlego opens it tonight. A library ebook is plausible but was not checked by title [L2].',
  esl: 'The authors host a PDF of the 2nd edition [A1]. Their server reset connections during the October check, so an English Internet Archive loan of the 1st edition is listed as the backup [B1]. Neither O\'Reilly nor Perlego carries it [O1] [E1].',
  jaynes: 'Only chapters 1–3 are free, as a 95-page PDF on the editor\'s site [A6]. The full book is not in O\'Reilly, Perlego or any library R03 checked [O1] [E1] [L1], so after the free chapters the route is a used copy, about $70 on the snapshot date [U1].',
  ddia: 'Not free: the author\'s site points to purchase. O\'Reilly carries both editions [O1], and a public library card reaches O\'Reilly at no cost [O3]. SFPL also held 10 Libby copies [L1].',
};
const tray = [
  { line: 'the Kahneman/Tversky heuristics & biases volume',
    match: { src: 'catalog', id: 'OL12970183W' }, confidence: 0.86,
    explanation: 'This is Judgment under Uncertainty: Heuristics and Biases, edited by Kahneman, Slovic and Tversky; the local catalog lists it as "Judgement under uncertainty" (OL12970183W). Open Library has no ebook for it, so there is no Internet Archive route. Its ISBN is a Cambridge one, and O\'Reilly carries no Cambridge titles [O2]; Perlego carries about 15,700, so it may be there, unchecked [E2]. Otherwise, buy a copy [U2].' },
  { line: "de Finetti's two-volume Theory of Probability (the Wiley one)",
    match: null, confidence: 0.7,
    identified: { t: 'Theory of Probability: A Critical Introductory Treatment', a: ['Bruno de Finetti'], y: 1974, pub: 'Wiley', kind: 'textbook' },
    olq: { title: 'Theory of Probability', author: 'de Finetti' },
    explanation: 'Not in the local catalog. This is most likely Bruno de Finetti\'s Theory of Probability (Wiley, two volumes, 1974–75, translated by Machí and Smith). It is in copyright, so no Gutenberg route [A3]. Wiley is O\'Reilly\'s largest publisher (about 9,200 titles) and has about 19,000 Perlego titles, so either subscription may carry it, unchecked [O2] [E2]. Otherwise buy a copy [U2].' },
];

// ---------------------------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------------------------
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

async function olSearch(q) {
  const url = 'https://openlibrary.org/search.json?' + new URLSearchParams({ title: q.title, author: q.author,
    fields: 'key,title,subtitle,author_name,first_publish_year,ebook_access,ia,number_of_pages_median,isbn,lcc_sort,lcc,language', limit: '5' });
  const j = await getJSON(url);
  const docs = j?.docs || [];
  // Prefer the doc whose title matches best, then by number of IA scans (the main work record).
  const nt = norm(q.title);
  docs.sort((a, b) => (norm(b.title).startsWith(nt) - norm(a.title).startsWith(nt)) || ((b.ia || []).length - (a.ia || []).length));
  return docs[0] || null;
}

async function iaScan(id) {
  const j = await getJSON('https://archive.org/metadata/' + encodeURIComponent(id) + '/metadata');
  const m = j?.result;
  if (!m) return null;
  const coll = [].concat(m.collection || []);
  const lang = [].concat(m.language || []).join(',').toLowerCase();
  return { id, lend: coll.includes('inlibrary'), pd: coll.includes('printdisabled'), lang, date: m.date || '', title: m.title || '' };
}

const out = [];
for (const w of works) {
  const rec = { ...w };
  delete rec.olq; delete rec.iaCheck;
  let cat = w.ol ? byOL.get(w.ol) : null;
  if (w.ol && !cat) console.warn('  ! ' + w.key + ': ' + w.ol + ' not in catalog.json');
  let doc = null;
  if (!cat && w.olq) {
    doc = await olSearch(w.olq);
    if (doc) {
      rec.ol = doc.key.replace('/works/', '');
      rec.olSrc = 'Open Library search API, ' + CHECKED;
      cat = byOL.get(rec.ol) || null;
    } else console.warn('  ! ' + w.key + ': no Open Library match');
  }
  rec.inCatalog = !!cat;
  if (cat) {
    rec.acc = cat.acc; rec.ia = cat.ia || null; rec.pp = cat.pp || null; rec.call = cat.call || null; rec.isbn = cat.isbn || null;
    rec.se = cat.se || null; rec.rl = cat.rl || 0; rec.olTitle = cat.t;
    if (!rec.pg && cat.pg) rec.pg = cat.pg;
  } else if (doc) {
    rec.acc = doc.ebook_access === 'no_ebook' ? 'no_ebook' : doc.ebook_access || 'unclassified';
    rec.ia = (doc.ia || [])[0] || null; rec.pp = doc.number_of_pages_median || null; rec.isbn = (doc.isbn || []).find((i) => i.length === 13) || null;
    rec.call = null; rec.olTitle = doc.title;
  }
  if (rec.pg) {
    const g = gutById.get(rec.pg);
    if (!g) throw new Error(w.key + ': Gutenberg id ' + rec.pg + ' not in gutenberg.json');
    rec.pgTitle = g.t;
  }
  // Verify an English lending scan for works R01 lists as borrowable (and ESL, flagged borrowable).
  if (w.iaCheck) {
    let ids = [];
    if (doc) ids = doc.ia || [];
    else {
      const d2 = await getJSON('https://openlibrary.org/search.json?' + new URLSearchParams({ q: 'key:/works/' + rec.ol, fields: 'key,ia', limit: '1' }));
      ids = d2?.docs?.[0]?.ia || (rec.ia ? [rec.ia] : []);
    }
    const scans = [];
    for (const id of ids.slice(0, 14)) {
      const s = await iaScan(id);
      if (s) scans.push(s);
      if (scans.some((x) => x.lend && /eng/.test(x.lang))) break;
    }
    const en = scans.find((x) => x.lend && /eng/.test(x.lang));
    rec.iaChecked = scans.map((s) => ({ id: s.id, lend: s.lend, pd: s.pd, lang: s.lang }));
    if (en) rec.iaLend = en.id;
    else rec.iaLendNote = 'No English scan in the lending collection among ' + scans.length + ' checked (' + CHECKED + ').';
    console.log(`  ${w.key}: ${scans.length} scans checked -> ${en ? 'English loan ' + en.id : 'no English loan'}`);
  }
  if (!rec.pp) console.warn('  ! ' + w.key + ': no page count');
  out.push(rec);
}

// Precomputed tray: verify the catalog match exists; look up the identified work's OL id.
for (const t of tray) {
  if (t.match?.src === 'catalog' && !byOL.get(t.match.id)) throw new Error('tray match ' + t.match.id + ' not in catalog');
  if (t.olq) {
    const doc = await olSearch(t.olq);
    if (doc) {
      t.identified.ol = doc.key.replace('/works/', '');
      t.identified.acc = doc.ebook_access || null;
      t.identified.pp = doc.number_of_pages_median || null;
      t.identified.verifiedBy = 'Open Library search API, ' + CHECKED + ' (build-time check; a live identification is not verified)';
    }
    delete t.olq;
  }
  t.provenance = PROV;
}

const payload = {
  title: 'The Circulation Desk: access-route registry',
  generated: new Date().toISOString().slice(0, 10),
  checked: CHECKED,
  sources: {
    R01: 'research/R01-open-books.md (Free and open-access books; 55-book coverage test), 2026-10-15',
    R03: 'research/R03-paid-and-institutional-access.md (Paid and institutional access; 33 + 20 title spot-check), 2026-10-15',
    catalog: 'catalog.json: Open Library works (CC0), fetched October 2026',
  },
  rules, keys, publishers, works: out, sample,
  precomputed: { provenance: PROV, explanations, tray },
};
writeFileSync(join(OUT_DIR, 'routes.json'), JSON.stringify(payload));
console.log(`circulation-desk: ${out.length} works, ${Object.keys(rules).length} rules -> ${join(OUT_DIR, 'routes.json')}`);
