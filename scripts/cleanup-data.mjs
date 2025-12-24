/**
 * Data Cleanup Script
 *
 * Cleans up the generated YAML files:
 * 1. Separates people from organizations
 * 2. Removes generic category names (Skeptics, Proponents, etc.)
 * 3. Deduplicates entries
 * 4. Normalizes affiliation IDs
 * 5. Fixes crux position arrays
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';

const DATA_DIR = 'src/data';

// Known organizations (should be in organizations.yaml, not experts.yaml)
const KNOWN_ORGS = new Set([
  'miri', 'anthropic', 'openai', 'deepmind', 'arc', 'chai', 'cais', 'fhi',
  'govai', 'redwood', 'mila', 'conjecture', 'open-philanthropy'
]);

// Generic category names to remove (not real experts)
const GENERIC_NAMES = new Set([
  'optimists', 'pessimists', 'skeptics', 'critics', 'proponents',
  'ai-optimists', 'ai-safety-advocates', 'tech-optimists',
  'governance-optimists', 'industry-optimists', 'scaling-advocates',
  'deep-learning-skeptics', 'moderate-ai-researchers',
  'many-ai-safety-researchers', 'many-ai-capability-researchers',
  'many-governance-researchers', 'most-ai-researchers-survey',
  'some-pause-advocates', 'some-lab-leadership', 'some-ml-researchers',
  'lab-safety-teams', 'empirical-alignment-researchers',
  'compute-governance-researchers', 'critics-of-governance',
  'concerned-departures', 'external-critics', 'this-argument',
  'openai-leadership-position', 'median-alignment-researcher',
  'anthropic-researchers', 'deepmind-researchers', 'miri-researchers',
  'miri-leadership', 'openai-safety-team'
]);

// Affiliation normalization map
const AFFILIATION_MAP = {
  'machine-intelligence-research-institute-miri-': 'miri',
  'future-of-humanity-institute-until-closure-oxford': 'fhi',
  'future-of-humanity-institute-fhi-oxford': 'fhi',
  'mila-quebec-ai-institute-university-of-montreal': 'mila',
  'center-for-ai-safety-cais-': 'cais',
  'safe-superintelligence-inc-': 'ssi',
  'university-of-toronto-emeritus-formerly-google': 'independent',
  'uc-berkeley-chai': 'chai',
};

// Dedupe map - keep first entry
const DEDUPE_MAP = {
  'jan-leike-openai': 'jan-leike',
  'eliezer-yudkowsky-miri': 'eliezer-yudkowsky',
  'arc-paul-christiano': 'paul-christiano',
  'miri-yudkowsky': 'eliezer-yudkowsky',
  'toby-ord-the-precipice': 'toby-ord',
  'nate-soares-miri': 'nate-soares',
};

// =============================================================================
// CLEAN EXPERTS
// =============================================================================

function cleanExperts() {
  const filepath = `${DATA_DIR}/experts-generated.yaml`;
  const content = readFileSync(filepath, 'utf-8');
  const experts = parse(content);

  const cleanedExperts = [];
  const seenIds = new Set();
  const extractedOrgs = [];

  for (const expert of experts) {
    const id = expert.id;

    // Skip generic categories
    if (GENERIC_NAMES.has(id)) {
      console.log(`  Skipping generic: ${id}`);
      continue;
    }

    // Handle organizations masquerading as experts
    if (KNOWN_ORGS.has(id) || id.endsWith('-survey') || id === 'ai-impacts-survey') {
      console.log(`  Moving to orgs: ${id}`);
      extractedOrgs.push({
        id,
        name: expert.name,
        positions: expert.positions,
      });
      continue;
    }

    // Skip duplicates
    const canonicalId = DEDUPE_MAP[id] || id;
    if (seenIds.has(canonicalId)) {
      console.log(`  Skipping duplicate: ${id} -> ${canonicalId}`);
      continue;
    }
    seenIds.add(canonicalId);

    // Normalize affiliation
    if (expert.affiliation && AFFILIATION_MAP[expert.affiliation]) {
      expert.affiliation = AFFILIATION_MAP[expert.affiliation];
    }

    // Use canonical ID
    expert.id = canonicalId;

    // Clean up positions (remove empty ones)
    if (expert.positions) {
      expert.positions = expert.positions.filter(p => p.view || p.estimate);
    }

    cleanedExperts.push(expert);
  }

  console.log(`\nExperts: ${experts.length} -> ${cleanedExperts.length} (removed ${experts.length - cleanedExperts.length})`);

  // Write cleaned experts
  const yamlContent = stringify(cleanedExperts, { lineWidth: 100 });
  writeFileSync(`${DATA_DIR}/experts.yaml`, `# Experts Database\n# Auto-generated and cleaned - review before using\n\n${yamlContent}`);
  console.log(`Written: ${DATA_DIR}/experts.yaml`);

  return { extractedOrgs };
}

// =============================================================================
// CLEAN CRUXES (fix stringified position arrays)
// =============================================================================

function cleanCruxes() {
  const filepath = `${DATA_DIR}/cruxes-generated.yaml`;
  const content = readFileSync(filepath, 'utf-8');
  const cruxes = parse(content);

  const cleanedCruxes = cruxes.map(crux => {
    // If positions is a string, try to parse it
    if (typeof crux.positions === 'string') {
      try {
        // Try to parse the stringified JSX array
        const cleaned = crux.positions
          .replace(/\\n/g, '')
          .replace(/\\\s+/g, ' ')
          .replace(/'/g, '"')
          // Quote unquoted keys
          .replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":')
          // Remove trailing commas
          .replace(/,(\s*[}\]])/g, '$1');

        crux.positions = JSON.parse(cleaned);
      } catch (e) {
        console.log(`  Could not parse positions for: ${crux.id}`);
        crux.positions = [];
      }
    }

    // Ensure positions is an array
    if (!Array.isArray(crux.positions)) {
      crux.positions = [];
    }

    return crux;
  });

  // Write cleaned cruxes
  const yamlContent = stringify(cleanedCruxes, { lineWidth: 100 });
  writeFileSync(`${DATA_DIR}/cruxes.yaml`, `# Cruxes Database\n# Auto-generated and cleaned - review before using\n\n${yamlContent}`);
  console.log(`Written: ${DATA_DIR}/cruxes.yaml`);
}

// =============================================================================
// CLEAN ESTIMATES
// =============================================================================

function cleanEstimates() {
  const filepath = `${DATA_DIR}/estimates-generated.yaml`;
  const content = readFileSync(filepath, 'utf-8');
  const estimates = parse(content);

  // Remove "unknown" variable entries
  const cleanedEstimates = estimates.filter(e => e.variable !== 'unknown' && e.id !== 'unknown');

  console.log(`Estimates: ${estimates.length} -> ${cleanedEstimates.length}`);

  // Write cleaned estimates
  const yamlContent = stringify(cleanedEstimates, { lineWidth: 100 });
  writeFileSync(`${DATA_DIR}/estimates.yaml`, `# Estimates Database\n# Auto-generated and cleaned - review before using\n\n${yamlContent}`);
  console.log(`Written: ${DATA_DIR}/estimates.yaml`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('Cleaning extracted data...\n');

  console.log('Cleaning experts...');
  const { extractedOrgs } = cleanExperts();

  console.log('\nCleaning cruxes...');
  cleanCruxes();

  console.log('\nCleaning estimates...');
  cleanEstimates();

  console.log('\n✓ Cleanup complete!');
}

main();
