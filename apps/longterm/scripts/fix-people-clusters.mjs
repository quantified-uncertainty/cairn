#!/usr/bin/env node
/**
 * Fix people cluster assignments.
 *
 * "community" should only be for people involved in EA/AI Safety community building,
 * movement building, field building - NOT all researchers in the field.
 *
 * Usage:
 *   node scripts/fix-people-clusters.mjs           # Dry run - show changes
 *   node scripts/fix-people-clusters.mjs --write   # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_DIR = path.join(__dirname, '../src/content/docs/knowledge-base/people');

// Correct cluster assignments for each person
// Only include non-default clusters (ai-safety is implied for most)
const CLUSTER_ASSIGNMENTS = {
  'chris-olah': ['ai-safety'],  // Researcher, not community
  'connor-leahy': ['ai-safety'],  // Researcher/CEO
  'dan-hendrycks': ['ai-safety', 'governance'],  // CAIS director, governance focus
  'daniela-amodei': ['ai-safety', 'governance'],  // Lab leadership
  'dario-amodei': ['ai-safety', 'governance'],  // Lab leadership, policy testimony
  'david-sacks': ['governance'],  // Government role (Crypto Czar)
  'demis-hassabis': ['ai-safety'],  // Lab CEO
  'dustin-moskovitz': ['ai-safety', 'community'],  // Major EA funder, community influence
  'eli-lifland': ['ai-safety', 'epistemics'],  // Forecaster
  'eliezer-yudkowsky': ['ai-safety'],  // AI safety theorist
  'elizabeth-kelly': ['ai-safety', 'governance'],  // US AISI director
  'elon-musk': ['ai-safety', 'governance'],  // xAI, policy influence
  'evan-hubinger': ['ai-safety'],  // Researcher
  'geoffrey-hinton': ['ai-safety'],  // ML researcher, safety warnings
  'gwern': ['ai-safety', 'epistemics'],  // Researcher/writer
  'helen-toner': ['ai-safety', 'governance'],  // GovAI, policy focus
  'holden-karnofsky': ['ai-safety', 'governance', 'community'],  // Open Phil, EA leadership
  'ilya-sutskever': ['ai-safety'],  // Researcher
  'jaan-tallinn': ['ai-safety', 'governance'],  // Funder, policy involvement
  'jan-leike': ['ai-safety'],  // Researcher
  'leopold-aschenbrenner': ['ai-safety', 'governance'],  // Policy-focused analysis
  'marc-andreessen': ['governance'],  // Tech policy, investment
  'max-tegmark': ['ai-safety', 'governance'],  // FLI founder, policy advocacy
  'neel-nanda': ['ai-safety'],  // Researcher
  'nick-bostrom': ['ai-safety', 'governance'],  // FHI founder, policy
  'nuno-sempere': ['epistemics'],  // Forecaster
  'paul-christiano': ['ai-safety'],  // ARC founder, researcher
  'philip-tetlock': ['epistemics'],  // Superforecasting pioneer
  'robin-hanson': ['epistemics', 'ai-safety'],  // Prediction markets, economist
  'sam-altman': ['ai-safety', 'governance'],  // OpenAI CEO, policy
  'stuart-russell': ['ai-safety', 'governance'],  // AI regulation advocate
  'toby-ord': ['ai-safety', 'governance', 'community'],  // FHI, Giving What We Can founder
  'vidur-kapur': ['ai-safety', 'epistemics'],  // Forecaster
  'yann-lecun': ['ai-safety'],  // ML researcher, safety skeptic
  'yoshua-bengio': ['ai-safety', 'governance'],  // International AI governance
};

async function main() {
  const writeMode = process.argv.includes('--write');

  const files = fs.readdirSync(PEOPLE_DIR).filter(f => f.endsWith('.mdx'));
  const changes = [];

  for (const file of files) {
    if (file === 'index.mdx') continue;

    const id = file.replace('.mdx', '');
    const filepath = path.join(PEOPLE_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');

    // Extract current clusters
    const clusterMatch = content.match(/^clusters:\s*(\[.*?\])/m);
    const currentClusters = clusterMatch ? JSON.parse(clusterMatch[1]) : [];

    // Get correct clusters
    const correctClusters = CLUSTER_ASSIGNMENTS[id] || ['ai-safety'];

    // Check if different
    const currentSorted = [...currentClusters].sort().join(',');
    const correctSorted = [...correctClusters].sort().join(',');

    if (currentSorted !== correctSorted) {
      changes.push({
        id,
        file,
        current: currentClusters,
        correct: correctClusters,
      });

      if (writeMode) {
        // Replace clusters line
        const newClustersLine = `clusters: ${JSON.stringify(correctClusters)}`;
        let newContent;

        if (clusterMatch) {
          newContent = content.replace(/^clusters:\s*\[.*?\]/m, newClustersLine);
        } else {
          // Add clusters after description or title
          newContent = content.replace(/(^description:.*$)/m, `$1\n${newClustersLine}`);
        }

        fs.writeFileSync(filepath, newContent);
      }
    }
  }

  // Print summary
  console.log('\n=== People Cluster Corrections ===\n');

  if (changes.length === 0) {
    console.log('No changes needed.');
    return;
  }

  for (const change of changes) {
    console.log(`${change.id}:`);
    console.log(`  Current:  ${JSON.stringify(change.current)}`);
    console.log(`  Correct:  ${JSON.stringify(change.correct)}`);
    console.log();
  }

  console.log(`---`);
  console.log(`Total changes: ${changes.length}`);

  if (writeMode) {
    console.log(`\n✅ Applied ${changes.length} changes`);
  } else {
    console.log(`\nRun with --write to apply changes`);
  }
}

main().catch(console.error);
