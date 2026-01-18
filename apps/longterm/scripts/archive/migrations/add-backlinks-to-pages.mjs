/**
 * Script to automatically add Backlinks component to entity MDX pages
 * that have incoming backlinks in the data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load database
const db = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/data/database.json'), 'utf-8'));
const backlinks = db.backlinks;

// Map entity types to directory paths
const typeToPath = {
  'risk': 'knowledge-base/risks',
  'capability': 'knowledge-base/capabilities',
  'intervention': 'knowledge-base/responses/technical',
  'safety-agenda': 'knowledge-base/responses/technical',
  'policy': 'knowledge-base/responses/governance',
  'researcher': 'knowledge-base/people',
  'lab': 'knowledge-base/organizations/labs',
  'lab-frontier': 'knowledge-base/organizations/labs',
  'lab-research': 'knowledge-base/organizations/labs',
  'organization': 'knowledge-base/organizations/safety-orgs',
  'crux': 'knowledge-base/cruxes',
  'funder': 'knowledge-base/funders',
  'historical': 'knowledge-base/history',
  'resource': 'knowledge-base/literature',
};

// Risk subcategories
const riskCategories = {
  'accident': ['deceptive-alignment', 'mesa-optimization', 'reward-hacking', 'specification-gaming',
               'goal-misgeneralization', 'instrumental-convergence', 'power-seeking', 'corrigibility-failure',
               'treacherous-turn', 'sharp-left-turn', 'sycophancy', 'sandbagging', 'emergent-capabilities'],
  'misuse': ['autonomous-weapons', 'bioweapons', 'cyberweapons', 'deepfakes', 'disinformation',
             'surveillance', 'authoritarian-tools', 'fraud'],
  'structural': ['racing-dynamics', 'concentration-of-power', 'lock-in', 'economic-disruption',
                 'proliferation', 'winner-take-all', 'multipolar-trap', 'enfeeblement', 'flash-dynamics',
                 'erosion-of-agency', 'irreversibility'],
  'epistemic': ['trust-erosion', 'epistemic-collapse', 'automation-bias', 'sycophancy-scale',
                'reality-fragmentation', 'consensus-manufacturing', 'knowledge-monopoly']
};

function getRiskCategory(id) {
  for (const [category, ids] of Object.entries(riskCategories)) {
    if (ids.includes(id)) return category;
  }
  return 'accident'; // default
}

function findMdxFile(entityId, entityType) {
  const contentDir = path.join(rootDir, 'src/content/docs');

  // Special handling for risks
  if (entityType === 'risk') {
    const category = getRiskCategory(entityId);
    const riskPath = path.join(contentDir, 'knowledge-base/risks', category, `${entityId}.mdx`);
    if (fs.existsSync(riskPath)) return riskPath;
  }

  // Try the type-based path
  const basePath = typeToPath[entityType];
  if (basePath) {
    const filePath = path.join(contentDir, basePath, `${entityId}.mdx`);
    if (fs.existsSync(filePath)) return filePath;
  }

  // Search recursively in content/docs
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = searchDir(fullPath);
        if (found) return found;
      } else if (entry.name === `${entityId}.mdx`) {
        return fullPath;
      }
    }
    return null;
  }

  return searchDir(contentDir);
}

function hasBacklinksComponent(content) {
  return content.includes('<Backlinks') || content.includes('Backlinks }');
}

function addBacklinksImport(content) {
  // Check if Backlinks is already imported
  if (content.includes('Backlinks')) return content;

  // Find the import line from components/wiki
  const importRegex = /import \{([^}]+)\} from ['"][^'"]*components\/wiki['"];?/;
  const match = content.match(importRegex);

  if (match) {
    // Add Backlinks to existing import
    const imports = match[1];
    const newImports = imports.trim() + ', Backlinks';
    return content.replace(importRegex, `import {${newImports}} from '${match[0].match(/['"]([^'"]*components\/wiki)['"]/)[1]}';`);
  } else {
    // Find the frontmatter end and add new import
    const frontmatterEnd = content.indexOf('---', 3) + 3;
    const beforeContent = content.slice(0, frontmatterEnd);
    const afterContent = content.slice(frontmatterEnd);

    // Determine the correct relative path based on file depth
    // This is a simplification - in practice we'd need to calculate the actual path
    const importPath = "'../../../../../components/wiki'";
    return beforeContent + `\n\nimport { Backlinks } from ${importPath};\n` + afterContent;
  }
}

function addBacklinksSection(content, entityId) {
  // Check if already has Related Pages section with Backlinks
  if (content.includes('<Backlinks')) return content;

  // Add at the end of the file
  const trimmed = content.trimEnd();
  return trimmed + `\n\n## Related Pages\n\n<Backlinks client:load entityId="${entityId}" />\n`;
}

// Get entity info from database
const entities = db.entities || [];
const entityMap = new Map(entities.map(e => [e.id, e]));

// Process each entity with backlinks
let updated = 0;
let skipped = 0;
let notFound = 0;

console.log('Adding Backlinks to entity pages...\n');

for (const [entityId, links] of Object.entries(backlinks)) {
  if (links.length === 0) continue;

  const entity = entityMap.get(entityId);
  const entityType = entity?.type || 'risk';

  const filePath = findMdxFile(entityId, entityType);

  if (!filePath) {
    console.log(`  [NOT FOUND] ${entityId} (${entityType})`);
    notFound++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  if (hasBacklinksComponent(content)) {
    console.log(`  [SKIP] ${entityId} - already has Backlinks`);
    skipped++;
    continue;
  }

  // Add import and component
  content = addBacklinksImport(content);
  content = addBacklinksSection(content, entityId);

  fs.writeFileSync(filePath, content);
  console.log(`  [ADDED] ${entityId} (${links.length} backlinks)`);
  updated++;
}

console.log(`\n--- Summary ---`);
console.log(`Updated: ${updated} files`);
console.log(`Skipped: ${skipped} (already had Backlinks)`);
console.log(`Not found: ${notFound} (no MDX file)`);
