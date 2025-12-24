/**
 * Add Timestamps Script
 *
 * Gets the last git commit date for each entity's MDX file
 * and adds it as the `lastUpdated` field.
 *
 * Usage: node scripts/add-timestamps.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { parse, stringify } from 'yaml';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENTITIES_FILE = join(ROOT, 'src/data/entities.yaml');
const CONTENT_DIR = join(ROOT, 'src/content/docs');

// Same path patterns as extract-descriptions
const TYPE_PATH_PATTERNS = {
  risk: [
    'knowledge-base/risks/accident',
    'knowledge-base/risks/misuse',
    'knowledge-base/risks/structural',
    'knowledge-base/risks/epistemic',
  ],
  capability: ['knowledge-base/capabilities'],
  policy: [
    'knowledge-base/responses/governance/legislation',
    'knowledge-base/responses/governance/international',
    'knowledge-base/responses/governance/industry',
    'knowledge-base/responses/governance/policy-approaches',
    'knowledge-base/responses/governance',
  ],
  intervention: [
    'knowledge-base/responses/technical',
    'knowledge-base/responses/institutions',
    'knowledge-base/responses/field-building',
    'knowledge-base/responses/resilience',
    'knowledge-base/responses/epistemic-tools',
  ],
  'safety-agenda': ['knowledge-base/responses/technical'],
  researcher: ['knowledge-base/people'],
  organization: [
    'knowledge-base/organizations/government',
    'knowledge-base/organizations/safety-orgs',
    'knowledge-base/organizations',
  ],
  lab: ['knowledge-base/organizations/labs'],
  'lab-research': ['knowledge-base/organizations/labs', 'knowledge-base/organizations/safety-orgs'],
  'lab-academic': ['knowledge-base/organizations/labs', 'knowledge-base/organizations/safety-orgs'],
  'lab-frontier': ['knowledge-base/organizations/labs'],
  'lab-startup': ['knowledge-base/organizations/labs'],
  crux: ['knowledge-base/cruxes'],
  historical: ['knowledge-base/history', 'understanding-ai-risk/history'],
  analysis: ['analysis'],
  resource: ['knowledge-base/literature'],
  funder: ['knowledge-base/funders'],
};

function findMdxFile(entityId, entityType) {
  const patterns = TYPE_PATH_PATTERNS[entityType] || [];

  for (const pattern of patterns) {
    const mdxPath = join(CONTENT_DIR, pattern, `${entityId}.mdx`);
    if (existsSync(mdxPath)) {
      return mdxPath;
    }
  }

  // Fallback search
  const searchDirs = [
    'knowledge-base/risks/accident',
    'knowledge-base/risks/misuse',
    'knowledge-base/risks/structural',
    'knowledge-base/risks/epistemic',
    'knowledge-base/capabilities',
    'knowledge-base/responses/technical',
    'knowledge-base/responses/governance/legislation',
    'knowledge-base/responses/governance/international',
    'knowledge-base/responses/governance/industry',
    'knowledge-base/responses/governance/policy-approaches',
    'knowledge-base/responses/institutions',
    'knowledge-base/responses/field-building',
    'knowledge-base/responses/resilience',
    'knowledge-base/responses/epistemic-tools',
    'knowledge-base/organizations/labs',
    'knowledge-base/organizations/government',
    'knowledge-base/organizations/safety-orgs',
    'knowledge-base/people',
    'knowledge-base/cruxes',
    'knowledge-base/history',
    'knowledge-base/literature',
    'knowledge-base/funders',
  ];

  for (const dir of searchDirs) {
    const mdxPath = join(CONTENT_DIR, dir, `${entityId}.mdx`);
    if (existsSync(mdxPath)) {
      return mdxPath;
    }
  }

  return null;
}

/**
 * Get last commit date for a file
 */
function getLastCommitDate(filePath) {
  try {
    const result = execSync(
      `git log -1 --format=%ci "${filePath}"`,
      { cwd: ROOT, encoding: 'utf-8' }
    ).trim();

    if (!result) return null;

    // Parse the date and format as YYYY-MM
    const date = new Date(result);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch (e) {
    return null;
  }
}

function main() {
  console.log('Adding timestamps from git history...\n');

  // Load entities
  const content = readFileSync(ENTITIES_FILE, 'utf-8');
  const entities = parse(content);

  let found = 0;
  let notFound = 0;
  let alreadyHas = 0;
  let added = 0;

  for (const entity of entities) {
    // Skip if already has lastUpdated
    if (entity.lastUpdated) {
      alreadyHas++;
      continue;
    }

    const mdxPath = findMdxFile(entity.id, entity.type);

    if (!mdxPath) {
      notFound++;
      continue;
    }

    found++;
    const lastUpdated = getLastCommitDate(mdxPath);

    if (lastUpdated) {
      entity.lastUpdated = lastUpdated;
      added++;
    }
  }

  // Write back
  const output = stringify(entities, {
    lineWidth: 0,
    singleQuote: true,
  });
  writeFileSync(ENTITIES_FILE, output);

  console.log(`Summary:
  Already had timestamp: ${alreadyHas}
  MDX files found: ${found}
  MDX files not found: ${notFound}
  Timestamps added: ${added}
`);
}

main();
