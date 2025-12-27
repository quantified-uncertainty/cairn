/**
 * Extract Descriptions Script
 *
 * Extracts the first paragraph after "## Summary" from MDX files
 * and adds it as the `description` field in entities.yaml.
 *
 * Usage: node scripts/extract-descriptions.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { parse, stringify } from 'yaml';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENTITIES_FILE = join(ROOT, 'src/data/entities.yaml');
const CONTENT_DIR = join(ROOT, 'src/content/docs');

// Map entity types to potential MDX file locations (relative to CONTENT_DIR)
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

/**
 * Find MDX file for an entity
 */
function findMdxFile(entityId, entityType) {
  const patterns = TYPE_PATH_PATTERNS[entityType] || [];

  for (const pattern of patterns) {
    const mdxPath = join(CONTENT_DIR, pattern, `${entityId}.mdx`);
    if (existsSync(mdxPath)) {
      return mdxPath;
    }
  }

  // Fallback: search all subdirectories of knowledge-base
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
 * Extract description from MDX content
 * Gets the first paragraph after "## Summary"
 */
function extractDescription(mdxContent) {
  // Find ## Summary section
  const summaryMatch = mdxContent.match(/^## Summary\s*\n+([\s\S]*?)(?=\n## |\n---|\n<|$)/m);

  if (!summaryMatch) {
    // Try to get frontmatter description as fallback
    const frontmatterMatch = mdxContent.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const descMatch = frontmatterMatch[1].match(/^description:\s*(.+)$/m);
      if (descMatch) {
        return descMatch[1].trim().replace(/^["']|["']$/g, '');
      }
    }
    return null;
  }

  const summaryContent = summaryMatch[1].trim();

  // Get first paragraph (text before first blank line or special element)
  const paragraphs = summaryContent.split(/\n\n+/);

  for (const para of paragraphs) {
    // Skip component calls, lists, tables, etc.
    const trimmed = para.trim();
    if (
      !trimmed ||
      trimmed.startsWith('<') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('>')
    ) {
      continue;
    }

    // Clean markdown formatting
    let description = trimmed
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/\n/g, ' ') // Single line
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Truncate if too long (aim for 300 chars max)
    if (description.length > 350) {
      // Find sentence boundary
      const sentenceEnd = description.substring(0, 350).lastIndexOf('. ');
      if (sentenceEnd > 150) {
        description = description.substring(0, sentenceEnd + 1);
      } else {
        description = description.substring(0, 347) + '...';
      }
    }

    if (description.length > 30) {
      return description;
    }
  }

  return null;
}

function main() {
  console.log('Extracting descriptions from MDX files...\n');

  // Load entities
  const content = readFileSync(ENTITIES_FILE, 'utf-8');
  const entities = parse(content);

  let found = 0;
  let notFound = 0;
  let alreadyHas = 0;
  let extracted = 0;

  for (const entity of entities) {
    // Skip if already has description
    if (entity.description) {
      alreadyHas++;
      continue;
    }

    const mdxPath = findMdxFile(entity.id, entity.type);

    if (!mdxPath) {
      notFound++;
      console.log(`  ✗ No MDX: ${entity.id} (${entity.type})`);
      continue;
    }

    found++;
    const mdxContent = readFileSync(mdxPath, 'utf-8');
    const description = extractDescription(mdxContent);

    if (description) {
      entity.description = description;
      extracted++;
      console.log(`  ✓ ${entity.id}: "${description.substring(0, 60)}..."`);
    } else {
      console.log(`  ? ${entity.id}: No description found in MDX`);
    }
  }

  // Write back
  const output = stringify(entities, {
    lineWidth: 0, // Don't wrap long strings
    singleQuote: true,
  });
  writeFileSync(ENTITIES_FILE, output);

  console.log(`
Summary:
  Already had description: ${alreadyHas}
  MDX files found: ${found}
  MDX files not found: ${notFound}
  Descriptions extracted: ${extracted}
`);
}

main();
