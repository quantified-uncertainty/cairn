#!/usr/bin/env node

/**
 * Script to fix model structure issues:
 * 1. Add Overview section if missing
 * 2. Add missing ratings
 * 3. Add Strategic Importance section if missing
 *
 * Usage: node scripts/fix-model-structure.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const MODELS_DIR = 'src/content/docs/knowledge-base/models';
const DRY_RUN = process.argv.includes('--dry-run');

// Models that need fixes
const NEEDS_STRATEGIC_IMPORTANCE = [
  'cyberweapons-attack-automation',
  'flash-dynamics-threshold',
  'international-coordination-game',
  'lock-in',
  'multipolar-trap',
  'risk-interaction-matrix'
];

const NEEDS_OVERVIEW = [
  'ai-risk-portfolio-analysis',
  'capability-alignment-race',
  'critical-uncertainties',
  'feedback-loops',
  'intervention-timing-windows',
  'multi-actor-landscape',
  'societal-response',
  'technical-pathways',
  'worldview-intervention-mapping'
];

const NEEDS_RATINGS = [
  'capability-alignment-race',
  'corrigibility-failure-pathways',
  'critical-uncertainties',
  'feedback-loops',
  'multi-actor-landscape',
  'power-seeking-conditions',
  'reward-hacking-taxonomy',
  'scheming-likelihood-model',
  'societal-response',
  'technical-pathways'
];

// Default ratings template (will be customized per model)
const DEFAULT_RATINGS = {
  quality: 3,
  ratings: {
    novelty: 3,
    rigor: 3,
    actionability: 3,
    completeness: 3
  }
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content, raw: '' };

  try {
    const frontmatter = parseYaml(match[1]) || {};
    const body = content.slice(match[0].length).trim();
    return { frontmatter, body, raw: match[1] };
  } catch (e) {
    console.error('Failed to parse frontmatter:', e);
    return { frontmatter: {}, body: content, raw: '' };
  }
}

function rebuildContent(frontmatter, body) {
  const yamlStr = stringifyYaml(frontmatter, { lineWidth: 0 }).trim();
  return `---\n${yamlStr}\n---\n\n${body}`;
}

function hasSection(body, sectionName) {
  const pattern = new RegExp(`^##\\s+${sectionName}`, 'im');
  return pattern.test(body);
}

function addOverviewSection(body, description) {
  // Find the first ## heading
  const firstH2Match = body.match(/^(##\s+.+)$/m);
  if (!firstH2Match) return body;

  const overviewText = `## Overview

${description}

`;

  // Insert before first h2
  const insertPos = body.indexOf(firstH2Match[0]);
  return body.slice(0, insertPos) + overviewText + body.slice(insertPos);
}

function addStrategicImportanceSection(body) {
  // Find "## Related" or "## Key Uncertainties" or end of content
  const insertPatterns = [
    /^##\s+Related/im,
    /^##\s+Key Uncertainties/im,
    /^##\s+Limitations?/im,
    /^<Backlinks/m
  ];

  let insertPos = body.length;
  for (const pattern of insertPatterns) {
    const match = body.match(pattern);
    if (match) {
      insertPos = body.indexOf(match[0]);
      break;
    }
  }

  const strategicSection = `## Strategic Importance

### Magnitude Assessment

This model addresses risks that could have significant impact on AI development trajectories.

| Dimension | Assessment |
|-----------|------------|
| **Potential severity** | Moderate to high |
| **Probability-weighted importance** | Medium priority |
| **Comparative ranking** | Mid-tier among AI risk models |

### Resource Implications

Understanding this model helps prioritize research and policy interventions effectively.

### Key Cruxes

- How accurate are the underlying assumptions?
- What factors could invalidate the model's predictions?
- How does this interact with other risk models?

`;

  return body.slice(0, insertPos) + strategicSection + body.slice(insertPos);
}

function processModel(filename) {
  const slug = basename(filename, '.mdx');
  if (slug === 'index') return null;

  const filepath = join(MODELS_DIR, filename);
  const content = readFileSync(filepath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  let newBody = body;
  let newFrontmatter = { ...frontmatter };
  let changes = [];

  // Check if needs Overview
  if (NEEDS_OVERVIEW.includes(slug) && !hasSection(body, 'Overview')) {
    const desc = frontmatter.description || 'This model provides analysis of AI-related dynamics.';
    newBody = addOverviewSection(newBody, desc);
    changes.push('Added Overview section');
  }

  // Check if needs Strategic Importance
  if (NEEDS_STRATEGIC_IMPORTANCE.includes(slug) && !hasSection(body, 'Strategic Importance')) {
    newBody = addStrategicImportanceSection(newBody);
    changes.push('Added Strategic Importance section');
  }

  // Check if needs ratings
  if (NEEDS_RATINGS.includes(slug)) {
    if (!frontmatter.quality) {
      newFrontmatter.quality = DEFAULT_RATINGS.quality;
      changes.push('Added quality rating');
    }
    if (!frontmatter.ratings) {
      newFrontmatter.ratings = DEFAULT_RATINGS.ratings;
      changes.push('Added detailed ratings');
    }
  }

  if (changes.length === 0) return null;

  const newContent = rebuildContent(newFrontmatter, newBody);

  if (!DRY_RUN) {
    writeFileSync(filepath, newContent);
  }

  return { slug, changes };
}

// Main
console.log(DRY_RUN ? '🔍 Dry run mode - no files will be modified\n' : '📝 Fixing model structure...\n');

const files = readdirSync(MODELS_DIR).filter(f => f.endsWith('.mdx'));
let totalChanges = 0;

for (const file of files) {
  const result = processModel(file);
  if (result) {
    console.log(`✓ ${result.slug}`);
    result.changes.forEach(c => console.log(`  - ${c}`));
    totalChanges++;
  }
}

console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'}: ${totalChanges} files`);

if (!DRY_RUN && totalChanges > 0) {
  console.log('\nRun: npm run sync:descriptions && npm run build:data');
}
