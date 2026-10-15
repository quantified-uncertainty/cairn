#!/usr/bin/env python3
"""Check arXiv citations in the wikis against arXiv's own metadata.

    python3 scripts/check-citations.py                    # all apps
    python3 scripts/check-citations.py --app delegation-risk
    python3 scripts/check-citations.py --json > report.json

Scans apps/*/src/content/docs/**/*.md(x) for arXiv references: arxiv.org
abs/pdf/html links (and ar5iv, alphaxiv, Hugging Face and Emergent Mind paper
links), the arXiv DOI 10.48550/arXiv.<id>, "arXiv:<id>" / "arXiv <id>", and bare
IDs in a block that mentions arXiv. Metadata comes from the arXiv API in batches,
one request per 3 seconds, cached in .cache/arxiv-metadata.json (gitignored).

Each reference is compared with the citation text around it: the whole table row,
heading or short list item (a reference entry) when it holds one arXiv ID; otherwise
the sentence, cut at ';' and at neighbouring references. Three checks:

  author  the first author's surname appears (capitalised). If not, and the text
          attributes the work to someone else ("X et al.", "X & Y (2024)",
          "X, A. B."), mismatch; naming only a co-author is a warning.
  year    a citation-style year ("(2024)", "et al. 2024", "May 2024", not "in 2016")
          lies within arXiv v1 +/- 1, or equals the latest-version year or a year in
          the journal reference / comment. No such year: no verdict.
  title   share of the real title's content words found in the text. Mismatch
          when the text presents a title (text of the link to the paper, quoted
          string in a reference entry, or the "Author (Year). Title." slot) and
          under 15% of the title's words appear.

ERROR (exit 1): the ID is malformed or not on arXiv, or two of the three checks
mismatch (author+year, author+title or year+title). WARNING: one check mismatches,
or only a co-author is named. References with nothing to compare (e.g.
"[study](arxiv link)") are counted but listed only with --verbose. Exit 2 if some
IDs could not be looked up and there were no errors.

The checks are heuristics: confirm each flag against the paper before editing the
page. Stdlib only.
"""
import argparse
import bisect
import glob
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DEFAULT = os.path.join(REPO, '.cache', 'arxiv-metadata.json')
API = 'https://export.arxiv.org/api/query'
BATCH = 50
DELAY = 3.1            # arXiv asks for at most one request every 3 seconds
NOT_FOUND_TTL = 7 * 86400
USER_AGENT = 'cairn-check-citations/1.0 (QURI research wikis; python-urllib)'
ATOM = '{http://www.w3.org/2005/Atom}'
ARXIV_NS = '{http://arxiv.org/schemas/atom}'

# ---------------------------------------------------------------- ID patterns

NEW_ID = r'\d{4}\.\d{1,6}'
OLD_ID = r'[a-z][a-z\-]+(?:\.[A-Z]{2})?/\d{7}'
ANY_ID = rf'(?:{NEW_ID}|{OLD_ID})(?:v\d+)?(?![\d])'
ID_AT_END = re.compile(rf'({NEW_ID}|{OLD_ID})(v\d+)?$', re.I)
HOSTS = (r'(?:(?:www|export|ar5iv\.labs|browse)\.)?arxiv\.org/(?:abs|pdf|html|format|ps)'
         r'|ar5iv\.(?:labs\.arxiv\.)?org/(?:abs|html)'
         r'|(?:www\.)?alphaxiv\.org/(?:abs|overview|pdf)'
         r'|huggingface\.co/papers'
         r'|(?:www\.)?emergentmind\.com/papers'
         r'|(?:www\.)?semanticscholar\.org/arxiv')
EXPLICIT = re.compile(
    rf'(?:(?:{HOSTS})/{ANY_ID}'
    rf'|10\.48550/arxiv\.{ANY_ID}'
    rf'|\barxiv(?:\s+(?:pre-?print|e-?print|paper|id|no\.?))?\s*[:\s]\s*(?:arxiv\s*:\s*)?{ANY_ID})',
    re.I)
# A bare new-style ID; only counted in a block that mentions arXiv.
BARE = re.compile(r'(?<![\w./-])(?P<id>\d{4}\.\d{4,5})(?P<ver>v\d+)?(?![\w/]|\.\d)')
URLISH = re.compile(r'https?://\S+|\b10\.\d{4,9}/\S+|\bwww\.\S+', re.I)


def id_problem(aid, today):
    """Return why `aid` is not a well-formed arXiv ID, or None."""
    if '/' in aid:
        num = aid.split('/', 1)[1]
        yy, mm = int(num[:2]), int(num[2:4])
        if not (1 <= mm <= 12) or not (91 <= yy or yy <= 7):
            return 'old-style ID with impossible year/month'
        return None
    yymm, seq = aid.split('.')
    yy, mm = int(yymm[:2]), int(yymm[2:])
    if not (1 <= mm <= 12) or yy < 7 or (yy, mm) < (7, 4):
        return 'no such year/month'
    if (2000 + yy, mm) > (today.year, today.month):
        return 'year/month is in the future'
    want = 4 if yymm < '1501' else 5
    if len(seq) != want:
        return f'sequence number should have {want} digits'
    return None


def norm_old(aid):
    """math.PR/0601001 -> math/0601001 (the API drops the subject class)."""
    if '/' in aid:
        arch, num = aid.split('/', 1)
        return arch.split('.')[0].lower() + '/' + num
    return aid

# ---------------------------------------------------------------- markdown blocks

LIST_RE = re.compile(r'^\s*(?:[-*+]|\d+[.)])\s+')
FOOT_RE = re.compile(r'^\s*\[\^[^\]]+\]:')
HEAD_RE = re.compile(r'^\s*#{1,6}\s')
TABLE_RE = re.compile(r'^\s*\|')
FENCE_RE = re.compile(r'^\s*(```|~~~)')
QUOTE_RE = re.compile(r'^\s*(?:>\s?)+')


def blocks(lines):
    """Yield (kind, first_line_no, [lines]) for the markdown blocks of a file.

    kind is 'item' (list item / footnote), 'row' (table row), 'head', 'code',
    'meta' (frontmatter) or 'para'. Lines are 1-indexed.
    """
    out = []
    cur = None
    fence = None
    in_meta = bool(lines) and lines[0].strip() == '---'
    for i, raw in enumerate(lines, 1):
        if in_meta:
            if i > 1 and raw.strip() == '---':
                in_meta = False
            out.append(('meta', i, [raw]))
            continue
        if fence:
            out.append(('code', i, [raw]))
            if raw.strip().startswith(fence):
                fence = None
            continue
        m = FENCE_RE.match(raw)
        if m:
            fence = m.group(1)
            cur = None
            out.append(('code', i, [raw]))
            continue
        line = QUOTE_RE.sub('', raw)
        if not line.strip():
            cur = None
            continue
        if HEAD_RE.match(line):
            out.append(('head', i, [line])); cur = None; continue
        if TABLE_RE.match(line):
            out.append(('row', i, [line])); cur = None; continue
        if LIST_RE.match(line) or FOOT_RE.match(line):
            cur = ['item', i, [line]]; out.append(cur); continue
        if cur is None:
            cur = ['para', i, [line]]; out.append(cur)
        else:
            cur[2].append(line)
    return [tuple(b) for b in out]

# ---------------------------------------------------------------- reference extraction

LINK_RE = re.compile(r'\[((?:[^\[\]]|\[[^\]]*\])*)\]\(\s*<?([^()\s>]*(?:\([^()]*\)[^()\s>]*)*)>?(?:\s+"[^"]*")?\s*\)')
ABBREV = {'al', 'e.g', 'i.e', 'eg', 'ie', 'vs', 'cf', 'fig', 'figs', 'eq', 'eqs', 'sec', 'no', 'vol',
          'pp', 'p', 'inc', 'ltd', 'co', 'jr', 'sr', 'dr', 'mr', 'ms', 'mrs', 'st', 'prof', 'approx',
          'ca', 'ch', 'ed', 'eds', 'etc', 'u.s', 'u.k', 'ref', 'refs', 'resp'}
SENT_END = re.compile(r'[.!?]["”’)\]*_]*\s+(?=["“(\[*_]*[A-Z0-9])')


def sentence_bounds(text):
    """Start offsets of sentences in `text` (crude: skips initials and abbreviations)."""
    starts = [0]
    for m in SENT_END.finditer(text):
        k = m.start()
        j = k
        while j > 0 and (text[j - 1].isalpha() or text[j - 1] == '.'):
            j -= 1
        word = text[j:k].lower()
        if word in ABBREV or (len(word) == 1 and word.isalpha()):
            continue
        starts.append(m.end())
    return starts


def find_refs(text, today):
    """All arXiv references in a block's text: list of dicts with id, ver, start, end, raw."""
    refs, taken = [], []
    for m in EXPLICIT.finditer(text):
        mm = ID_AT_END.search(m.group(0))
        aid, ver = mm.group(1), mm.group(2)
        refs.append(dict(id=aid, ver=ver, start=m.start(), end=m.end(), raw=m.group(0)))
        taken.append((m.start(), m.end()))
    if re.search(r'arxiv', text, re.I):
        masked = URLISH.sub(lambda u: ' ' * len(u.group(0)), text)
        for m in BARE.finditer(masked):
            if any(s <= m.start() < e for s, e in taken):
                continue
            if id_problem(m.group('id'), today):
                continue       # bare numbers must look exactly like an ID to count
            refs.append(dict(id=m.group('id'), ver=m.group('ver'), start=m.start(), end=m.end(),
                             raw=m.group(0)))
    refs.sort(key=lambda r: r['start'])
    return refs


def ref_spans(text, refs):
    """Widen each reference to the markdown link that carries it, if any."""
    links = [(m.start(), m.end(), m.start(2)) for m in LINK_RE.finditer(text)]
    for r in refs:
        r['span'] = (r['start'], r['end'])
        for s, e, us in links:
            if us <= r['start'] < e:
                r['span'] = (s, e)
                break


ITEM_MAX = 450   # a list item longer than this (plain text) is prose, not a reference entry


def clause_marks(text):
    """Offsets of ';' that separate clauses (not HTML entities like &amp;)."""
    return [m.start() for m in re.finditer(r'&#?\w+;|;', text) if len(m.group(0)) == 1]


def segment(text, kind, refs, ids_in_block):
    """Give each reference the slice of block text that cites it (r['seg']).

    A table row, heading, or short list item (a reference entry) with one arXiv ID
    is cited by the whole block. Otherwise the slice is the sentence, cut at ';'
    and at the neighbouring references. For a long list item the whole item is
    kept as a fallback (r['fallback']) for when the sentence alone says nothing.
    """
    single = len(ids_in_block) == 1
    # a list item citing two different papers is prose, whatever its length
    whole = kind in ('row', 'head', 'meta', 'code') or (kind == 'item' and single and len(plain(text)) <= ITEM_MAX)
    for r in refs:
        r['entry'] = whole
        r['fallback'] = (0, len(text)) if kind == 'item' and not whole else None
    if whole and single:
        for r in refs:
            r['seg'] = (0, len(text))
        return
    # cut points between consecutive references with different IDs: the first sentence
    # end, ';' or table-cell bar between them, else just after the earlier reference
    all_sents = sentence_bounds(text)
    marks = sorted(set(all_sents[1:]) | {c + 1 for c in clause_marks(text)} |
                   {m.end() for m in re.finditer(r'\|', text)})
    cuts = []
    for a, b in zip(refs, refs[1:]):
        lo, hi = a['span'][1], b['span'][0]
        if a['id'] == b['id'] or hi <= lo:
            cuts.append(None)
            continue
        inside = [c for c in marks if lo < c <= hi]
        if inside:
            cuts.append(inside[0])
        else:
            # keep a trailing parenthetical like " (February 2025)" with the reference before it
            m = re.match(r'[\s)\]*_,]*(?:\([^()]{0,60}\))?[\s)\]*_,]*', text[lo:hi])
            cuts.append(lo + (m.end() if m else 0))
    sents = [0] if whole else all_sents
    semis = [] if whole else clause_marks(text)
    for i, r in enumerate(refs):
        lo = next((cuts[j] for j in range(i - 1, -1, -1) if cuts[j] is not None), 0)
        hi = next((cuts[j] for j in range(i, len(cuts)) if cuts[j] is not None), len(text))
        if not whole:
            s0, s1 = r['span']
            k = bisect.bisect_right(sents, s0) - 1
            s_lo = sents[k]
            s_hi = max(sents[k + 1] if k + 1 < len(sents) else len(text), s1)
            s_lo = max([s_lo] + [c + 1 for c in semis if c < s0])
            s_hi = min([s_hi] + [c for c in semis if c >= s1])
            lo, hi = max(lo, s_lo), min(hi, s_hi)
        r['seg'] = (min(lo, r['span'][0]), max(hi, r['span'][1]))

# ---------------------------------------------------------------- text normalisation


def deaccent(s):
    s = unicodedata.normalize('NFKD', s)
    return ''.join(c for c in s if not unicodedata.combining(c))


def fold(s):
    return deaccent(s).lower()


def plain(s, keep_ids=False):
    """Markdown -> readable text without URLs (and, unless keep_ids, without arXiv IDs)."""
    s = LINK_RE.sub(lambda m: m.group(1), s)
    s = re.sub(r'<https?://[^>]*>', ' ', s)
    s = URLISH.sub(' ', s)
    if not keep_ids:
        s = EXPLICIT.sub(' ', s)
        s = BARE.sub(' ', s)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'(\*\*|__|`)', '', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)|(?<!\s)\*(?![\w*])', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


STOP = set("""a an the of for and or in on at to with from by via as is are be been was were we our
its it into onto over under through using use towards toward how what why when where which who
can do does did not no vs versus than that this these those their them they about between beyond
without within across against all any each more most less few new two one three upon
large language model models llm llms ai learning neural network networks deep based approach
arxiv preprint paper study et al""".split())


def stems(s):
    out = set()
    for w in re.findall(r'[a-z0-9]+', fold(s)):
        if len(w) < 3 or w in STOP or w.isdigit():
            continue
        out.add(w[:5])
    return out


MONTHS = set("""january february march april may june july august september october november december
jan feb mar apr jun jul aug sep sept oct nov dec spring summer fall autumn winter early mid late""".split())
NOT_NAMES = MONTHS | set("""the in on at by for from since until before after during as of and or see also
year years version preprint proceedings conference workshop journal review report science nature
transactions edition volume vol table figure section chapter appendix phase part released published
updated around circa about between through ca dated accessed retrieved posted blog paper papers study
note notes update original revised final draft preliminary prior earlier later then now today""".split())
ORG_WORDS = set("""research institute institution lab labs laboratory foundation university team center centre
group collaboration project society association council committee consortium deepmind anthropic google
meta microsoft apollo redwood epoch metr amazon apple nvidia stanford berkeley harvard oxford cambridge
alignment forum press news times post wired reuters bloomberg economist guardian wikipedia nist iso
government commission agency department office academy academies company corporation""".split())
PARTICLES = ('van', 'von', 'de', 'der', 'den', 'du', 'da', 'di', 'del', 'della', 'le', 'la', 'bin', 'ten', 'ter', 'dos', 'das')
PARTICLE = r'(?:(?:' + '|'.join(PARTICLES) + r')\s+)*'
NAMEW = r"[^\W\d_][^\W\d_'’\-]*(?:['’\-][^\W\d_]+)*"
NAMEP = PARTICLE + NAMEW
YEAR = r'(?:19[5-9]\d|20[0-4]\d)'
P_ETAL = re.compile(rf'({NAMEP})\s+et\.?\s+al\b')
P_ANDYEAR = re.compile(rf'((?:{NAMEP})(?:\s*,\s*{NAMEP})*\s*,?\s+(?:&|and)\s+{NAMEP})\s*,?\s*\(?\s*{YEAR}\b')
P_YEAR = re.compile(rf'({NAMEP})\s*,?\s*\(\s*{YEAR}[a-z]?\s*\)|({NAMEP})\s*,?\s+{YEAR}\b')
P_BIB = re.compile(rf'(?:^|[\s(\[;&])({NAMEP}),\s+(?:[A-Z]\.\s*-?\s*){{1,3}}(?=[,&(]|and\b|\s|$)')
YEAR_TOKEN = re.compile(rf'(?<![\d.,/\-–])({YEAR})[a-z]?(?![\d%]|\.\d)')


def looks_like_name(w):
    w = re.sub(r'^' + PARTICLE, '', w)
    if not w or not w[0].isupper():
        return False
    upp = sum(c.isupper() for c in w)
    if upp > 2 or not any(c.islower() for c in w):
        return False
    lw = fold(w)
    return lw not in NOT_NAMES and lw not in ORG_WORDS and len(lw) >= 2


def cited_names(text):
    """Surnames the text attributes a work to: "X et al.", "X & Y (2024)", "X 2024", "X, A. B."."""
    found = []

    def add(n):
        n = n.strip(" ,&'’")
        last = re.split(r'\s+', n)[-1]
        if looks_like_name(last) and last not in found:
            found.append(last)
    for m in P_ETAL.finditer(text):
        add(m.group(1))
    for m in P_ANDYEAR.finditer(text):
        for part in re.split(r'\s*,\s*|\s+(?:&|and)\s+', m.group(1)):
            add(part)
    for m in P_YEAR.finditer(text):
        n = m.group(1) or m.group(2)
        if fold(re.split(r'\s+', n)[-1]) in ORG_WORDS:   # "Redwood Research, 2024"
            continue
        add(n)
    for m in P_BIB.finditer(text):
        add(m.group(1))
    return found


def cited_years(text):
    """Years written the way citations write them: "(2024)", ", 2024", "et al. 2024",
    "Name 2024", "March 2024", "ICML 2024". Skips prose like "in 2016" or "its 2021 launch"."""
    out = set()
    for m in YEAR_TOKEN.finditer(text):
        before = text[:m.start()].rstrip()
        if not before or before[-1] in '([,;|:':
            out.add(int(m.group(1)))
            continue
        w = re.search(r"([^\W\d_][\w'’]*)\.?$", before)
        if w and (w.group(1)[0].isupper() or w.group(1).lower() in ('arxiv', 'al')):
            out.add(int(m.group(1)))
    return sorted(out)


def surname_keys(name):
    """Folded tokens that identify an author's surname (drops given name, initials, suffixes)."""
    toks = [t.strip('."\'“”‘’()') for t in re.split(r'[\s,]+', fold(name))]
    toks = [t for t in toks if t and t not in ('jr', 'sr', 'ii', 'iii', 'iv') and len(t) >= 2]
    if not toks:
        return set()
    keys = set(toks[1:]) if len(toks) >= 2 else set(toks)
    keys |= {p for t in list(keys) for p in t.split('-') if len(p) >= 2}
    return {k for k in keys if k not in PARTICLES}


def name_in(key, text):
    """Is `key` in `text` as a capitalised word? ("Black", not "black-box")."""
    for m in re.finditer(r'(?<![^\W\d_])' + re.escape(key) + r'(?![^\W\d_])', deaccent(text), re.I):
        if m.group(0)[0].isupper():
            return True
    return False


def titled_phrases(raw, text, entry):
    """Phrases in the citation text that present themselves as a title: the text of a
    link to the paper, the title slot of "Author (2024). Title.", and, in a reference
    entry, quoted strings. Phrases with fewer than 3 content words don't count."""
    out = []
    for m in LINK_RE.finditer(raw):
        if re.search(r'arxiv|ar5iv|alphaxiv|huggingface\.co/papers|emergentmind', m.group(2), re.I):
            out.append(plain(m.group(1)))
    if entry:
        for q in re.findall(r'"([^"]{8,})"|“([^”]{8,})”', text):
            out += [x for x in q if x]
    out += [m.group(1) for m in re.finditer(rf'\(\s*{YEAR}[a-z]?\s*\)\.\s+([^.?!]{{8,}})', text)]
    return [p for p in out if len(stems(p) - stems(' '.join(cited_names(p)))) >= 3]

# ---------------------------------------------------------------- arXiv API + cache


def load_cache(path):
    try:
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        return data.get('entries', {}) if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def save_cache(path, entries):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump({'version': 1, 'source': API, 'entries': entries}, f, indent=1, sort_keys=True, ensure_ascii=False)
    os.replace(tmp, path)


class Fetcher:
    """GET the arXiv API, at most one request per DELAY seconds, retrying transient errors."""

    def __init__(self):
        self.last = 0.0

    def get(self, ids):
        wait = self.last + DELAY - time.time()
        if wait > 0:
            time.sleep(wait)
        q = urllib.parse.urlencode({'id_list': ','.join(ids), 'max_results': len(ids)})
        req = urllib.request.Request(f'{API}?{q}', headers={'User-Agent': USER_AGENT})
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    body = resp.read()
                self.last = time.time()
                return body
            except urllib.error.HTTPError as e:
                self.last = time.time()
                if e.code in (429, 500, 502, 503, 504) and attempt < 3:
                    ra = e.headers.get('Retry-After') if e.headers else None
                    time.sleep(int(ra) if ra and ra.isdigit() else 10 * (attempt + 1))
                    continue
                raise
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                self.last = time.time()
                if attempt < 3:
                    time.sleep(5 * (attempt + 1))
                    continue
                raise


def parse_feed(body):
    """Return {id: metadata} for the papers in an API response (error entries are skipped)."""
    root = ET.fromstring(body)
    got = {}
    for e in root.findall(ATOM + 'entry'):
        eid = (e.findtext(ATOM + 'id') or '').strip()
        m = re.search(r'arxiv\.org/abs/(.+?)(v\d+)?$', eid)
        if not m:
            continue
        title = re.sub(r'\s+', ' ', e.findtext(ATOM + 'title') or '').strip()
        if not title:
            continue
        got[norm_old(m.group(1))] = {
            'found': True,
            'title': title,
            'authors': [re.sub(r'\s+', ' ', a.findtext(ATOM + 'name') or '').strip() for a in e.findall(ATOM + 'author')],
            'published': (e.findtext(ATOM + 'published') or '')[:10],
            'updated': (e.findtext(ATOM + 'updated') or '')[:10],
            'latest_version': m.group(2),
            'journal_ref': (e.findtext(ARXIV_NS + 'journal_ref') or '').strip(),
            'comment': re.sub(r'\s+', ' ', e.findtext(ARXIV_NS + 'comment') or '').strip(),
        }
    return got


def lookup(ids, cache, refresh, offline, log):
    """Fill cache for `ids`; return the set of IDs that could not be checked."""
    now = time.time()
    need = []
    for i in ids:
        c = cache.get(i)
        if refresh or c is None or (not c.get('found') and now - c.get('checked', 0) > NOT_FOUND_TTL):
            need.append(i)
    if offline or not need:
        return {i for i in need if i not in cache}
    f = Fetcher()
    unchecked, missing = set(), []
    batches = [need[k:k + BATCH] for k in range(0, len(need), BATCH)]
    for n, b in enumerate(batches, 1):
        log(f'arXiv API: batch {n}/{len(batches)} ({len(b)} IDs)')
        try:
            got = parse_feed(f.get(b))
        except Exception as e:  # network or XML failure: leave these unchecked
            log(f'  lookup failed: {e}')
            unchecked.update(b)
            continue
        for k, v in got.items():
            v['checked'] = now
            cache[k] = v
        missing += [i for i in b if i not in got]
    # The API sometimes drops entries from a batch (and one malformed ID can void a
    # whole batch), so a miss counts as "not found" only after two lookups on its own.
    for i in missing:
        log(f'arXiv API: confirming {i}')
        for attempt in range(2):
            try:
                got = parse_feed(f.get([i]))
            except Exception as e:
                log(f'  lookup failed: {e}')
                unchecked.add(i)
                break
            if i in got:
                got[i]['checked'] = now
                cache[i] = got[i]
                break
        else:
            cache[i] = {'found': False, 'checked': now}
    return unchecked

# ---------------------------------------------------------------- comparison


def year_window(meta):
    v1 = int(meta['published'][:4])
    ok = {v1 - 1, v1, v1 + 1}
    if meta.get('updated'):
        ok.add(int(meta['updated'][:4]))
    # venue years from the journal reference or comment ("UAI2005", "ICML 2024")
    for y in re.findall(rf'(?<!\d)({YEAR})(?!\d)', meta.get('journal_ref', '') + ' ' + meta.get('comment', '')):
        ok.add(int(y))
    return ok


TITLE_OK, TITLE_BAD = 0.5, 0.15


def compare(raw, entry, meta):
    """Check citation markdown `raw` against arXiv metadata. Returns (level, checks, issues)."""
    text = plain(raw)
    checks, issues = {}, []
    authors = meta['authors']
    first = authors[0] if authors else ''
    title_st = stems(meta['title'])

    # author: drop "names" that are really title words ("AI Control (2024)")
    names = [n for n in cited_names(text) if fold(n)[:5] not in title_st]
    if first and any(name_in(k, text) for k in surname_keys(first)):
        checks['author'] = {'status': 'ok'}
    else:
        co = [a for a in authors[1:] if any(name_in(k, text) for k in surname_keys(a))]
        if co:
            checks['author'] = {'status': 'other', 'named': co[:3]}
            issues.append(f'author: names co-author {", ".join(co[:3])}; first author is {first}')
        elif names:
            checks['author'] = {'status': 'mismatch', 'named': names}
            issues.append(f'author: cited {", ".join(names)}; actual first author {first or "(none)"}')
        else:
            checks['author'] = {'status': 'unknown'}

    # year
    years = cited_years(text)
    window = year_window(meta)
    v1 = int(meta['published'][:4])
    if not years:
        checks['year'] = {'status': 'unknown'}
    elif window & set(years):
        checks['year'] = {'status': 'ok', 'cited': years}
    else:
        checks['year'] = {'status': 'mismatch', 'cited': years}
        msg = f'year: cited {", ".join(map(str, years))}; arXiv v1 is {meta["published"][:7]}'
        if checks['author']['status'] == 'ok':
            msg += (' (an earlier year may be the original venue, posted to arXiv later)' if max(years) < v1
                    else ' (a later year may be the journal version; name the venue or use the arXiv year)')
        issues.append(msg)

    # title
    if title_st:
        ov = len(title_st & stems(text)) / len(title_st)
        if ov >= TITLE_OK:
            st = 'ok'
        elif ov < TITLE_BAD and titled_phrases(raw, text, entry):
            st = 'mismatch'
            issues.append(f'title: {round(ov * 100)}% of the title\'s words appear in the citation text')
        else:
            st = 'unknown'
        checks['title'] = {'status': st, 'overlap': round(ov, 2)}
    else:
        checks['title'] = {'status': 'unknown'}

    bad = [k for k, v in checks.items() if v['status'] == 'mismatch']
    if len(bad) >= 2:
        level = 'error'
    elif bad or checks['author']['status'] == 'other':
        level = 'warning'
    elif all(v['status'] == 'unknown' for v in checks.values()):
        level = 'unverifiable'
    else:
        level = 'ok'
    return level, checks, issues

# ---------------------------------------------------------------- main


def scan(apps, today):
    refs, nfiles = [], 0
    for app in apps:
        root = os.path.join(REPO, 'apps', app, 'src', 'content', 'docs')
        files = sorted(glob.glob(os.path.join(root, '**', '*.md'), recursive=True) +
                       glob.glob(os.path.join(root, '**', '*.mdx'), recursive=True))
        for path in files:
            nfiles += 1
            with open(path, encoding='utf-8') as f:
                lines = f.read().split('\n')
            rel = os.path.relpath(path, REPO)
            for kind, first, blines in blocks(lines):
                text = '\n'.join(blines)
                found = find_refs(text, today)
                if not found:
                    continue
                ref_spans(text, found)
                ids = {r['id'] for r in found}
                segment(text, kind, found, ids)
                offsets = [0]
                for bl in blines[:-1]:
                    offsets.append(offsets[-1] + len(bl) + 1)
                # one reference per ID per block; its context is the union of its segments
                byid = {}
                for r in found:
                    byid.setdefault(r['id'], []).append(r)
                for aid, rs in byid.items():
                    segs = sorted({r['seg'] for r in rs})
                    ctx_raw = ' … '.join(text[a:b] for a, b in segs)
                    line = first + bisect.bisect_right(offsets, rs[0]['start']) - 1
                    refs.append({
                        'app': app, 'file': rel, 'line': line, 'id': aid,
                        'version': rs[0]['ver'], 'match': rs[0]['raw'].strip(),
                        'context_raw': ctx_raw, 'entry': rs[0]['entry'],
                        'fallback_raw': text if rs[0]['fallback'] else None,
                    })
    return refs, nfiles


def short(s, n=220):
    s = re.sub(r'\s+', ' ', s).strip()
    return s if len(s) <= n else s[:n - 1].rstrip() + '…'


def describe(meta):
    a = [re.split(r'\s+', x)[-1] for x in meta['authors']] or ['?']
    who = a[0] if len(a) == 1 else f'{a[0]} & {a[1]}' if len(a) == 2 else f'{a[0]} et al.'
    return f'{who} ({meta["published"][:7]}), "{meta["title"]}"'


def main():
    apps_all = sorted(d for d in os.listdir(os.path.join(REPO, 'apps'))
                      if os.path.isdir(os.path.join(REPO, 'apps', d, 'src', 'content', 'docs')))
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0],
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--app', action='append', metavar='NAME',
                    help=f'only check this app (repeatable or comma-separated): {", ".join(apps_all)}')
    ap.add_argument('--json', action='store_true', help='print a JSON report on stdout')
    ap.add_argument('--verbose', '-v', action='store_true', help='also list references that pass or have nothing to compare')
    ap.add_argument('--refresh', action='store_true', help='ignore the cache and re-query every ID')
    ap.add_argument('--offline', action='store_true', help='use only the cache; uncached IDs are reported as unchecked')
    ap.add_argument('--cache', default=CACHE_DEFAULT, help='metadata cache (default: .cache/arxiv-metadata.json)')
    args = ap.parse_args()

    apps = apps_all
    if args.app:
        apps = [a.strip() for v in args.app for a in v.split(',') if a.strip()]
        unknown = [a for a in apps if a not in apps_all]
        if unknown:
            ap.error(f'unknown app {", ".join(unknown)}; choose from {", ".join(apps_all)}')

    log = (lambda m: print(m, file=sys.stderr))
    today = datetime.now(timezone.utc)
    refs, nfiles = scan(apps, today)

    cache = load_cache(args.cache)
    valid = sorted({norm_old(r['id']) for r in refs if not id_problem(r['id'], today)})
    unchecked = lookup(valid, cache, args.refresh, args.offline, log)
    if not args.offline:
        save_cache(args.cache, cache)

    for r in refs:
        prob = id_problem(r['id'], today)
        key = norm_old(r['id'])
        r['actual'] = None
        if prob:
            r.update(level='error', checks={}, issues=[f'malformed arXiv ID: {prob}'])
        elif key in unchecked or key not in cache:
            why = 'not in the cache (--offline)' if args.offline else 'arXiv API lookup failed'
            r.update(level='unchecked', checks={}, issues=[why])
        elif not cache[key].get('found'):
            r.update(level='error', checks={}, issues=['ID not found on arXiv'])
        else:
            meta = cache[key]
            level, checks, issues = compare(r['context_raw'], r['entry'], meta)
            if level == 'unverifiable' and r['fallback_raw'] and len(re.findall(r'[^\W\d_]{2,}', plain(r['context_raw']))) < 3:
                # the sentence is little more than the ID ("*arXiv:2401.09876*."); use the whole list item
                alt = compare(r['fallback_raw'], False, meta)
                if alt[0] != 'unverifiable':
                    level, checks, issues = alt
                    r['context_raw'] = r['fallback_raw']
            r.update(level=level, checks=checks, issues=issues)
            r['actual'] = {k: meta[k] for k in ('title', 'authors', 'published', 'updated', 'journal_ref', 'comment')}
            r['actual']['url'] = f'https://arxiv.org/abs/{r["id"]}'
        r['cited'] = plain(r['context_raw'], keep_ids=True)

    counts = {k: sum(r['level'] == k for r in refs) for k in ('error', 'warning', 'ok', 'unverifiable', 'unchecked')}
    summary = {'apps': apps, 'files': nfiles, 'references': len(refs),
               'unique_ids': len({norm_old(r['id']) for r in refs}), **counts}

    if args.json:
        out = []
        for r in refs:
            d = {k: r[k] for k in ('app', 'file', 'line', 'id', 'version', 'match', 'level', 'issues', 'checks', 'actual')}
            d['cited'] = short(r['cited'], 1000)
            out.append(d)
        json.dump({'summary': summary, 'references': out}, sys.stdout, indent=1, ensure_ascii=False)
        print()
    else:
        rank = {'error': 0, 'warning': 1, 'unchecked': 2, 'ok': 3, 'unverifiable': 4}
        shown = [r for r in refs if args.verbose or r['level'] in ('error', 'warning', 'unchecked')]
        for r in sorted(shown, key=lambda r: (rank[r['level']], r['file'], r['line'])):
            print(f'{r["level"].upper()} {r["file"]}:{r["line"]}  arXiv:{r["id"]}')
            print(f'  cited:  {short(r["cited"])}')
            if r['actual']:
                print(f'  actual: {short(describe(r["actual"]), 260)}')
            for i in r['issues']:
                print(f'  - {i}')
            print()
        def n(k, word):
            return f'{counts[k]} {word}' + ('' if counts[k] == 1 else 's')
        print(f'{summary["references"]} arXiv references ({summary["unique_ids"]} unique IDs) in {nfiles} files '
              f'[{", ".join(apps)}]: {n("error", "error")}, {n("warning", "warning")}, '
              f'{counts["ok"]} ok, {counts["unverifiable"]} with nothing to compare'
              + (f', {counts["unchecked"]} unchecked' if counts['unchecked'] else ''))
    if counts['error']:
        return 1
    if counts['unchecked']:
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
