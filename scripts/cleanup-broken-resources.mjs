import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';

const resources = parse(readFileSync('src/data/resources.yaml', 'utf-8'));
const before = resources.length;

// Filter out resources without URL or with "Untitled" title
const cleaned = resources.filter(r => r.url && r.title !== 'Untitled');

console.log('Before:', before);
console.log('After:', cleaned.length);
console.log('Removed:', before - cleaned.length);

const header = `# External Resources Referenced in the Knowledge Base
# ==================================================
#
# Auto-generated and manually curated.
# See src/data/schema.ts for Resource schema.

`;
writeFileSync('src/data/resources.yaml', header + stringify(cleaned, { lineWidth: 100 }));
console.log('Saved cleaned resources.yaml');
