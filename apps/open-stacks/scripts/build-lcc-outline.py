#!/usr/bin/env python3
"""Build public/prototypes/data/lcc-outline.json from the Library of Congress
Classification Outline PDFs (a US government work, public domain).

    python3 scripts/build-lcc-outline.py <dir with lcco_*.pdf>

Download the PDFs first from https://www.loc.gov/aba/cataloging/classification/lcco/
(lcco_a.pdf ... lcco_z.pdf). Needs `pdftotext` (poppler). Each outline row such as
"QA273-280           Probabilities. Mathematical statistics" becomes
{"c": "QA", "lo": 273, "hi": 280, "d": 1, "n": "Probabilities. Mathematical statistics"},
where d is the indentation depth within the subclass, so the prototypes can
label any call number with its full trail of section names.
"""
import json, os, re, subprocess, sys

src = sys.argv[1]
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'public', 'prototypes', 'data', 'lcc-outline.json')
row = re.compile(r'^([A-Z]{1,3})(\(?[\d.]+\)?)(?:-(\(?[\d.]+\)?))?(\s+)(\S.*)$')
num = lambda s: float(s.strip('()')) if s else None

classes, ranges = {}, []
for fn in sorted(os.listdir(src)):
    if not fn.endswith('.pdf'):
        continue
    text = subprocess.run(['pdftotext', '-layout', os.path.join(src, fn), '-'],
                          capture_output=True, text=True, check=True).stdout
    for line in text.splitlines():
        m = re.match(r'^Subclass\s+([A-Z]{1,3})\s{2,}(\S.*)$', line.strip())
        if m:
            classes[m.group(1)] = m.group(2).strip()
            continue
        m = row.match(line.strip())
        if not m:
            continue
        c, lo, hi, gap, name = m.groups()
        # Indentation of the label column encodes hierarchy: measure where the label starts.
        label_col = line.index(name)
        ranges.append({'c': c, 'lo': num(lo), 'hi': num(hi) if hi else num(lo),
                       'col': label_col, 'n': re.sub(r'\s+', ' ', name).strip()})

# Convert label columns to depths per subclass (smallest column = depth 0).
by_class = {}
for r in ranges:
    by_class.setdefault(r['c'], []).append(r)
for c, rs in by_class.items():
    cols = sorted({r['col'] for r in rs})
    for r in rs:
        r['d'] = cols.index(r['col'])
        del r['col']

top = {
    'A': 'General Works', 'B': 'Philosophy. Psychology. Religion', 'C': 'Auxiliary Sciences of History',
    'D': 'World History', 'E': 'History of the Americas', 'F': 'History of the Americas',
    'G': 'Geography. Anthropology. Recreation', 'H': 'Social Sciences', 'J': 'Political Science',
    'K': 'Law', 'L': 'Education', 'M': 'Music', 'N': 'Fine Arts', 'P': 'Language and Literature',
    'Q': 'Science', 'R': 'Medicine', 'S': 'Agriculture', 'T': 'Technology', 'U': 'Military Science',
    'V': 'Naval Science', 'Z': 'Bibliography. Library Science',
}
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({'source': 'Library of Congress Classification Outline, https://www.loc.gov/aba/cataloging/classification/lcco/',
           'classes': top, 'subclasses': classes, 'ranges': ranges}, open(out, 'w'), separators=(',', ':'))
print(f'Wrote {len(classes)} subclasses and {len(ranges)} ranges to {out}')
