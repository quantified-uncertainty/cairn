#!/usr/bin/env python3
"""Check a built wiki for broken internal links, missing heading anchors, and KaTeX errors.

Run after `pnpm build` in one or more apps:

    python3 scripts/check-built-links.py

Every app with an `llms.config.json` and a `dist/` is checked. Links to a sibling
wiki's domain (its llms.config.json `url`) are resolved against that sibling's
build, so cross-wiki links and anchors are checked too. External links are not.
KaTeX renders a failed formula as red text with a `katex-error` class rather than
failing the build, so parse errors are reported here as well. Exits 1 on any issue.
"""
import os,re,sys,html
from urllib.parse import urlparse,unquote
import json,glob
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES={}
for cfg in sorted(glob.glob(os.path.join(REPO,'apps','*','llms.config.json'))):
    app=os.path.dirname(cfg); dist=os.path.join(app,'dist')
    if os.path.isdir(dist):
        SITES[urlparse(json.load(open(cfg))['url']).netloc]=dist
if not SITES:
    sys.exit('check-built-links: no built wikis found (build first; apps are found via llms.config.json)')
ids_cache={}
def page_file(root,path):
    path=unquote(path)
    cand=[os.path.join(root,path.lstrip('/')), os.path.join(root,path.lstrip('/'),'index.html')]
    for c in cand:
        if os.path.isfile(c): return c
    return None
def ids(f):
    if f not in ids_cache:
        s=open(f,encoding='utf-8').read()
        ids_cache[f]=set(re.findall(r'\bid="([^"]+)"',s))
    return ids_cache[f]
bad=0; checked=0
for host,root in SITES.items():
    for dp,_,fs in os.walk(root):
        for fn in fs:
            if not fn.endswith('.html'): continue
            src=os.path.join(dp,fn); s=open(src,encoding='utf-8').read()
            # only main content links
            m=re.search(r'<main.*?</main>',s,re.S); body=m.group(0) if m else s
            for href in re.findall(r'href="([^"]+)"',body):
                href=html.unescape(href)
                u=urlparse(href)
                if u.scheme in('http','https'):
                    if u.netloc not in SITES: continue
                    troot=SITES[u.netloc]; path=u.path
                elif href.startswith('/'):
                    troot=root; path=u.path
                elif href.startswith('#'):
                    troot=None; path=None
                else: continue
                checked+=1
                if troot is None:
                    tf=src
                else:
                    tf=page_file(troot,path)
                    if not tf:
                        bad+=1; print(f'MISSING PAGE  {src.replace(root,host)} -> {href}'); continue
                if u.fragment and u.fragment not in ids(tf):
                    bad+=1; print(f'MISSING ANCHOR {src.replace(root,host)} -> {href}')
kerr=0
for host,root in SITES.items():
    for dp,_,fs in os.walk(root):
        for fn in fs:
            if fn.endswith('.html'):
                f=os.path.join(dp,fn); t=open(f,encoding='utf-8').read()
                for m in re.findall(r'katex-error" title="([^"]+)"',t):
                    kerr+=1; print('KATEX ERROR', f.replace(root,host), html.unescape(m)[:120])
bad+=kerr
print(f'checked {checked} internal/sibling links, {bad} broken')
sys.exit(1 if bad else 0)
