#!/usr/bin/env python3
"""Regenerate the Open Stacks sidebar in astro.config.mjs and the chapter table in index.mdx.
Pages that don't exist yet become planned entries linking to /#the-book."""
import os, re, sys
APP='/home/user/cairn/apps/open-stacks'
DOCS=APP+'/src/content/docs'
PARTS=[
 ('Start Here',[('Open Stacks','start-here/introduction'),('What to Do First','start-here/decision-guide'),('Cruxes','start-here/cruxes')]),
 ('Part I — Getting the Text',[('Open-Access Books and Textbooks','access/open-books'),('The Public Domain and Open Corpora','access/public-domain'),('Open Papers and Preprints','access/open-papers'),('Grey Literature and Community Archives','access/grey-literature'),('Cheap Subscriptions','access/subscriptions'),('Public Libraries','access/public-libraries'),('University and Employer Access','access/academic-and-employer'),('Your Own Library','access/your-own-library'),('The Shadow Libraries','access/shadow-libraries'),('The Access Ladder','access/access-ladder')]),
 ('Part II — Finding Things',[('Catalogs and Metadata','finding/catalogs-and-metadata'),('Browsing the Stacks','finding/browsing-the-stacks'),('Searching Inside Books You Don’t Have','finding/searching-inside-books'),('AI Research Assistants','finding/ai-research-assistants'),('Curation: Syllabi, Experts and Reviews','finding/curation'),('Lectures, Talks and Podcasts','finding/lectures-and-media')]),
 ('Part III — Interfaces: What Has Been Tried',[('Foraging and Exploratory Search','interfaces/exploratory-search'),('Maps of Knowledge','interfaces/maps-of-knowledge'),('Reading Interfaces','interfaces/reading-interfaces'),('Generative Interfaces','interfaces/generative-interfaces')]),
 ('Part IV — Where You Read',[('Reading Modes and Devices','environments/reading-modes-and-devices'),('VR and Spatial Computing','environments/vr-and-spatial-computing'),('Building a Virtual Reading Room','environments/virtual-reading-room')]),
 ('Part V — Building Your Own',[('The Legal Map','building/legal-map'),('A Reference Architecture','building/reference-architecture'),('Costs and Effort','building/costs-and-effort'),('The Design Space','building/design-space'),('Prototype Gallery','building/prototype-gallery')]),
 ('Reference',[('Directory of Sources and Tools','reference/directory'),('Glossary','reference/glossary'),('Open Problems','reference/open-questions'),('About the Research','reference/methodology')]),
]
def exists(slug): return any(os.path.exists(f'{DOCS}/{slug}{e}') for e in ('.md','.mdx'))
lines=[]; n=0; rows=[]
for part,items in PARTS:
    lines.append('\t\t\t\t{\n\t\t\t\t\tlabel: %r,\n\t\t\t\t\tcollapsed: false,\n\t\t\t\t\titems: [' % part.replace("'", "\\'") if False else "\t\t\t\t{\n\t\t\t\t\tlabel: '%s',\n\t\t\t\t\tcollapsed: false,\n\t\t\t\t\titems: [" % part)
    if part.startswith('Part'):
        rows.append(f"| **{part.split(' — ')[0].replace('Part ','')}** | **{part.split(' — ')[1]}** | |")
    for title,slug in items:
        if part=='Reference': label=title
        else:
            n+=1; label=f'{n}. {title}'
        if exists(slug):
            lines.append(f"\t\t\t\t\t\t{{ label: '{label}', slug: '{slug}' }},")
            status='draft'
        else:
            lines.append(f"\t\t\t\t\t\t{{ label: '{label} (planned)', link: '/#the-book' }},")
            status='planned'
        num = '—' if part=='Reference' else str(n)
        link = f'[{title}](/{slug}/)'.replace("\\'","'") if status=='draft' else title.replace("\\'","'")
        rows.append(f'| {num} | {link} | {status} |')
    lines.append('\t\t\t\t\t],\n\t\t\t\t},')
sidebar='\t\t\tsidebar: [\n'+'\n'.join(lines)+'\n\t\t\t],'
cfg=open(APP+'/astro.config.mjs').read()
cfg=re.sub(r'\t\t\tsidebar: \[.*?\n\t\t\t\],', lambda m: sidebar, cfg, flags=re.S)
open(APP+'/astro.config.mjs','w').write(cfg)
table='| # | Chapter | Status |\n|---|---|---|\n'+'\n'.join(rows)
idx=open(DOCS+'/index.mdx').read()
if '{/* chapter-table */}' in idx:
    idx=re.sub(r'\{/\* chapter-table \*/\}.*?\{/\* /chapter-table \*/\}', lambda m: '{/* chapter-table */}\n'+table+'\n{/* /chapter-table */}', idx, flags=re.S)
    open(DOCS+'/index.mdx','w').write(idx)
print('sidebar entries:', n, 'existing:', sum(1 for _,it in PARTS for _,s in it if exists(s)))
