#!/usr/bin/env node
/**
 * Tag people with cluster assignments based on their description/role.
 *
 * Usage:
 *   node scripts/tag-people-clusters.mjs           # Dry run - show suggestions
 *   node scripts/tag-people-clusters.mjs --write   # Update people.yaml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_FILE = path.join(__dirname, '../src/data/entities/people.yaml');

// Keywords that suggest each cluster
const CLUSTER_KEYWORDS = {
  'community': [
    'community building',
    'community manager',
    'field building',
    'field-building',
    'movement building',
    'outreach',
    'cea',
    'centre for effective altruism',
    'center for effective altruism',
    '80,000 hours',
    '80000 hours',
    'giving what we can',
    'ea global',
    'effective ventures',
    'ev operations',
  ],
  'governance': [
    'governance',
    'policy',
    'regulation',
    'government',
    'govai',
    'cset',
    'institute for ai policy',
    'public policy',
    'lawmaker',
    'legislation',
    'regulatory',
    'geopolitics',
    'international',
    'diplomat',
  ],
  'epistemics': [
    'forecasting',
    'forecaster',
    'superforecasting',
    'prediction market',
    'good judgment',
    'metaculus',
    'polymarket',
    'calibration',
    'rationality',
    'lesswrong',
    'cfar',
    'center for applied rationality',
  ],
  'biorisks': [
    'biosecurity',
    'pandemic',
    'pathogen',
    'bioweapon',
    'biological',
    'health security',
    'global health',
  ],
  'cyber': [
    'cybersecurity',
    'cyber',
    'hacking',
    'infosec',
    'information security',
  ],
};

function suggestClusters(person) {
  // Build searchable text from person data
  const searchText = [
    person.title || '',
    person.description || '',
    (person.customFields || []).map(f => `${f.label} ${f.value}`).join(' '),
    (person.tags || []).join(' '),
  ].join(' ').toLowerCase();

  const clusters = ['ai-safety']; // Default - everyone is ai-safety related

  for (const [cluster, keywords] of Object.entries(CLUSTER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        if (!clusters.includes(cluster)) {
          clusters.push(cluster);
        }
        break; // Found one match for this cluster, move on
      }
    }
  }

  return clusters;
}

function main() {
  const writeMode = process.argv.includes('--write');

  // Read people.yaml
  const content = fs.readFileSync(PEOPLE_FILE, 'utf8');
  const people = yaml.load(content);

  let updated = 0;
  const results = [];

  for (const person of people) {
    const suggestedClusters = suggestClusters(person);
    const existingClusters = person.clusters || [];

    // Only add clusters if not already present
    const newClusters = suggestedClusters.filter(c => !existingClusters.includes(c));

    if (newClusters.length > 0 || existingClusters.length === 0) {
      const finalClusters = [...new Set([...existingClusters, ...suggestedClusters])];

      results.push({
        id: person.id,
        title: person.title,
        existing: existingClusters,
        suggested: suggestedClusters,
        final: finalClusters,
      });

      if (writeMode) {
        person.clusters = finalClusters;
        updated++;
      }
    }
  }

  // Print results
  console.log('\n=== People Cluster Suggestions ===\n');

  const communityPeople = results.filter(r => r.final.includes('community'));
  const governancePeople = results.filter(r => r.final.includes('governance'));
  const epistemicsPeople = results.filter(r => r.final.includes('epistemics'));
  const biorisksPeople = results.filter(r => r.final.includes('biorisks'));
  const cyberPeople = results.filter(r => r.final.includes('cyber'));

  console.log(`Community (${communityPeople.length}):`);
  communityPeople.forEach(p => console.log(`  - ${p.title} (${p.id})`));

  console.log(`\nGovernance (${governancePeople.length}):`);
  governancePeople.forEach(p => console.log(`  - ${p.title} (${p.id})`));

  console.log(`\nEpistemics (${epistemicsPeople.length}):`);
  epistemicsPeople.forEach(p => console.log(`  - ${p.title} (${p.id})`));

  console.log(`\nBiorisks (${biorisksPeople.length}):`);
  biorisksPeople.forEach(p => console.log(`  - ${p.title} (${p.id})`));

  console.log(`\nCyber (${cyberPeople.length}):`);
  cyberPeople.forEach(p => console.log(`  - ${p.title} (${p.id})`));

  console.log(`\n---`);
  console.log(`Total people: ${people.length}`);
  console.log(`Would update: ${results.length}`);

  if (writeMode) {
    // Write back to YAML
    const output = yaml.dump(people, {
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });

    // Preserve the header comment
    const header = '# People Entities\n# Auto-generated from entities.yaml - edit this file directly\n\n';
    fs.writeFileSync(PEOPLE_FILE, header + output.replace(/^---\n/, ''));

    console.log(`\n✅ Updated ${updated} people in people.yaml`);
  } else {
    console.log(`\nRun with --write to apply changes`);
  }
}

main();
