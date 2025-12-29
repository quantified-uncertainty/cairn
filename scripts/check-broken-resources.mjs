import { readFileSync } from 'fs';
import { parse } from 'yaml';

const resources = parse(readFileSync('src/data/resources.yaml', 'utf-8'));
const broken = resources.filter(r => !r.url || r.title === 'Untitled');

console.log('Broken resources:', broken.length);
console.log('');

for (const r of broken) {
  const citedBy = r.cited_by?.length || 0;
  console.log(r.id + ': "' + r.title + '" (cited by ' + citedBy + ' articles)');
  if (r.url) console.log('  URL: ' + r.url);
}
