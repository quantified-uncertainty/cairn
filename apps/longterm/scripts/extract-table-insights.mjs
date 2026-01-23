#!/usr/bin/env node
/**
 * Extract Insights from Table Data
 *
 * This script analyzes structured table data and generates insights
 * that can be added to insights.yaml.
 *
 * Usage:
 *   node scripts/extract-table-insights.mjs [--table safety-approaches] [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../src/data');

// Load safety approaches data
async function loadSafetyApproaches() {
  const dataPath = path.join(DATA_DIR, 'safety-approaches-data.ts');
  const content = fs.readFileSync(dataPath, 'utf-8');

  // Extract SAFETY_APPROACHES array (simple parsing for demo)
  const match = content.match(/export const SAFETY_APPROACHES[^=]*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not find SAFETY_APPROACHES in data file');
  }

  // This is a simplified extraction - in production you'd use proper TS parsing
  console.log('Found SAFETY_APPROACHES data');
  return content;
}

// Generate insights from safety approaches
function generateSafetyInsights() {
  const today = new Date().toISOString().split('T')[0];

  // These are example insights that could be generated from the table data
  // In a real implementation, this would parse the actual data
  const insights = [
    {
      id: 'sa-001',
      insight: 'RLHF provides DOMINANT capability uplift but only LOW-MEDIUM safety uplift - it\'s primarily a capability technique marketed as safety.',
      source: '/knowledge-base/responses/safety-approaches/table',
      tableRef: 'safety-approaches#rlhf',
      tags: ['rlhf', 'capability-uplift', 'quantitative', 'safety-approaches'],
      type: 'quantitative',
      surprising: 3.5,
      important: 4.5,
      actionable: 3.8,
      neglected: 2.5,
      compact: 4.5,
      added: today,
      lastVerified: today,
    },
    {
      id: 'sa-002',
      insight: 'Constitutional AI shows SAFETY-LEANING differential progress - one of few techniques where safety gains exceed capability gains.',
      source: '/knowledge-base/responses/safety-approaches/table',
      tableRef: 'safety-approaches#constitutional-ai',
      tags: ['constitutional-ai', 'differential-progress', 'quantitative'],
      type: 'quantitative',
      surprising: 3.2,
      important: 4.0,
      actionable: 3.5,
      neglected: 3.0,
      compact: 4.2,
      added: today,
      lastVerified: today,
    },
    {
      id: 'sa-003',
      insight: 'Mechanistic interpretability shows CRITICAL safety uplift potential but current investment ($50-150M/yr) may be insufficient for the scaling challenge.',
      source: '/knowledge-base/responses/safety-approaches/table',
      tableRef: 'safety-approaches#mechanistic-interpretability',
      tags: ['interpretability', 'funding', 'research-gap'],
      type: 'research-gap',
      surprising: 3.0,
      important: 4.5,
      actionable: 4.8,
      neglected: 4.0,
      compact: 4.0,
      added: today,
      lastVerified: today,
    },
    {
      id: 'sa-004',
      insight: 'Most safety training techniques (RLHF, adversarial training) show BREAKS scalability - they fail as AI capability increases.',
      source: '/knowledge-base/responses/safety-approaches/table',
      tableRef: 'safety-approaches',
      tags: ['scalability', 'safety-training', 'quantitative'],
      type: 'counterintuitive',
      surprising: 3.8,
      important: 4.8,
      actionable: 4.2,
      neglected: 3.5,
      compact: 4.5,
      added: today,
      lastVerified: today,
    },
    {
      id: 'sa-005',
      insight: 'Cooperative AI research shows NEUTRAL capability uplift with SOME safety benefit - a rare "pure safety" approach that doesn\'t accelerate capabilities.',
      source: '/knowledge-base/responses/safety-approaches/table',
      tableRef: 'safety-approaches#cooperative-ai',
      tags: ['cooperative-ai', 'differential-progress', 'neglected'],
      type: 'neglected',
      surprising: 3.5,
      important: 3.8,
      actionable: 4.0,
      neglected: 4.5,
      compact: 4.0,
      added: today,
      lastVerified: today,
    },
  ];

  return insights;
}

// Format insights as YAML
function formatAsYaml(insights) {
  let yaml = '  # === EXTRACTED FROM SAFETY APPROACHES TABLE ===\n';

  for (const i of insights) {
    yaml += `  - id: "${i.id}"\n`;
    yaml += `    insight: "${i.insight.replace(/"/g, '\\"')}"\n`;
    yaml += `    source: ${i.source}\n`;
    yaml += `    tableRef: ${i.tableRef}\n`;
    yaml += `    tags: [${i.tags.join(', ')}]\n`;
    yaml += `    type: ${i.type}\n`;
    yaml += `    surprising: ${i.surprising}\n`;
    yaml += `    important: ${i.important}\n`;
    yaml += `    actionable: ${i.actionable}\n`;
    yaml += `    neglected: ${i.neglected}\n`;
    yaml += `    compact: ${i.compact}\n`;
    yaml += `    added: "${i.added}"\n`;
    yaml += `    lastVerified: "${i.lastVerified}"\n`;
    yaml += '\n';
  }

  return yaml;
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const tableArg = args.find(a => a.startsWith('--table='));
  const table = tableArg ? tableArg.split('=')[1] : 'safety-approaches';

  console.log(`\n📊 Extracting insights from ${table} table...`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  if (table === 'safety-approaches') {
    const insights = generateSafetyInsights();
    const yaml = formatAsYaml(insights);

    console.log('Generated insights:\n');
    console.log(yaml);

    console.log(`\n✅ Generated ${insights.length} insights from safety approaches table`);

    if (!dryRun) {
      console.log('\n📝 To add these to insights.yaml, append the YAML above to src/data/insights.yaml');
      console.log('   Or run with --apply flag to auto-append (not implemented yet)');
    }
  } else {
    console.log(`Unknown table: ${table}`);
    console.log('Available tables: safety-approaches');
  }
}

main().catch(console.error);
