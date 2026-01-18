#!/usr/bin/env node
/**
 * Add missing nodes from individual diagrams to the master graph.
 *
 * Usage:
 *   node scripts/add-missing-nodes-to-master.mjs --dry-run  # Preview changes
 *   node scripts/add-missing-nodes-to-master.mjs --apply    # Apply changes
 */

import { readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';

const ENTITIES_PATH = 'src/data/entities/ai-transition-model.yaml';
const MASTER_GRAPH_PATH = 'src/data/graphs/ai-transition-model-master.yaml';

const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/add-missing-nodes-to-master.mjs --dry-run  # Preview');
  console.log('  node scripts/add-missing-nodes-to-master.mjs --apply    # Apply');
  process.exit(1);
}

// Load files
const entitiesYaml = readFileSync(ENTITIES_PATH, 'utf8');
const masterYamlContent = readFileSync(MASTER_GRAPH_PATH, 'utf8');

const entities = yaml.load(entitiesYaml);
const masterGraph = yaml.load(masterYamlContent);

// Extract all node IDs from master graph
const masterNodeIds = new Set();

for (const cat of masterGraph.categories || []) {
  masterNodeIds.add(cat.id);
  for (const sub of cat.subItems || []) {
    masterNodeIds.add(sub.id);
  }
}

for (const node of masterGraph.detailedNodes || []) {
  masterNodeIds.add(node.id);
}

console.log(`Master graph has ${masterNodeIds.size} existing nodes`);

// Map entity IDs to appropriate categories
function getCategoryForEntity(entityId) {
  if (entityId === 'tmc-compute' || entityId === 'tmc-algorithms') {
    return { category: 'ai-capabilities', subcategory: entityId.replace('tmc-', '') };
  }
  if (entityId === 'tmc-technical-ai-safety') {
    return { category: 'misalignment-potential', subcategory: 'technical-ai-safety' };
  }
  if (entityId.startsWith('tmc-')) {
    const sub = entityId.replace('tmc-', '');
    if (['economic-power', 'political-power', 'values', 'epistemics', 'suffering-lock-in'].includes(sub)) {
      return { category: 'long-term-lockin', subcategory: sub };
    }
    if (['gradual', 'rapid'].includes(sub)) {
      return { category: 'ai-takeover', subcategory: sub };
    }
  }

  const civCompParams = [
    'international-coordination', 'societal-trust', 'epistemic-health',
    'institutional-quality', 'coordination-capacity', 'reality-coherence',
    'preference-authenticity', 'societal-resilience', 'regulatory-capacity'
  ];
  const turbulenceParams = ['economic-stability', 'racing-intensity', 'human-expertise', 'human-agency'];
  const safetyParams = ['alignment-robustness', 'safety-capability-gap', 'interpretability-coverage', 'safety-culture-strength', 'human-oversight-quality'];
  const threatParams = ['biological-threat-exposure', 'cyber-threat-exposure', 'information-authenticity'];
  const ownershipParams = ['ai-control-concentration'];

  if (civCompParams.includes(entityId)) return { category: 'civilizational-competence', subcategory: entityId };
  if (turbulenceParams.includes(entityId)) return { category: 'transition-turbulence', subcategory: entityId };
  if (safetyParams.includes(entityId)) return { category: 'misalignment-potential', subcategory: entityId };
  if (threatParams.includes(entityId)) return { category: 'ai-uses', subcategory: entityId };
  if (ownershipParams.includes(entityId)) return { category: 'ai-ownership', subcategory: entityId };

  return { category: 'parameters', subcategory: entityId };
}

// Extract missing nodes
const newNodes = [];
const seenIds = new Set();

for (const entity of entities) {
  if (!entity.causeEffectGraph?.nodes) continue;

  const { category, subcategory } = getCategoryForEntity(entity.id);

  for (const node of entity.causeEffectGraph.nodes) {
    if (masterNodeIds.has(node.id)) continue;
    if (seenIds.has(node.id)) continue;
    seenIds.add(node.id);

    newNodes.push({
      id: node.id,
      label: node.label,
      category,
      subcategory,
      type: node.type || 'leaf',
      description: node.description || '',
      sourceEntity: entity.id,
    });
  }
}

console.log(`Found ${newNodes.length} missing nodes to add\n`);

// Group by category for output
const byCategory = new Map();
for (const node of newNodes) {
  const key = node.category;
  if (!byCategory.has(key)) byCategory.set(key, []);
  byCategory.get(key).push(node);
}

for (const [cat, nodes] of byCategory) {
  console.log(`  ${cat}: ${nodes.length} nodes`);
}

if (dryRun) {
  console.log(`\n=== DRY RUN - No changes made ===`);
  process.exit(0);
}

if (apply) {
  // Generate YAML text for new nodes
  let yamlAddition = '\n  # ===========================================================================\n';
  yamlAddition += '  # PARAMETER DIAGRAM NODES (from individual entity diagrams)\n';
  yamlAddition += '  # These nodes appear in entity-specific causal diagrams\n';
  yamlAddition += '  # ===========================================================================\n';

  // Group by subcategory for cleaner output
  const bySubcategory = new Map();
  for (const node of newNodes) {
    if (!bySubcategory.has(node.subcategory)) bySubcategory.set(node.subcategory, []);
    bySubcategory.get(node.subcategory).push(node);
  }

  for (const [subcategory, nodes] of bySubcategory) {
    yamlAddition += `\n  # From ${subcategory} diagram\n`;
    for (const node of nodes) {
      yamlAddition += `  - id: ${node.id}\n`;
      yamlAddition += `    label: "${node.label}"\n`;
      yamlAddition += `    category: ${node.category}\n`;
      yamlAddition += `    subcategory: ${node.subcategory}\n`;
      yamlAddition += `    type: ${node.type}\n`;
      if (node.description) {
        // Escape quotes in description
        const desc = node.description.replace(/"/g, '\\"');
        yamlAddition += `    description: "${desc}"\n`;
      }
      yamlAddition += '\n';
    }
  }

  // Find where to insert (before detailedEdges section)
  const insertMarker = '\n# =============================================================================\n# DETAILED EDGES';
  const insertIndex = masterYamlContent.indexOf(insertMarker);

  if (insertIndex === -1) {
    console.error('Could not find insertion point in master graph');
    process.exit(1);
  }

  const newContent = masterYamlContent.slice(0, insertIndex) + yamlAddition + masterYamlContent.slice(insertIndex);

  writeFileSync(MASTER_GRAPH_PATH, newContent);
  console.log(`\n✓ Added ${newNodes.length} nodes to ${MASTER_GRAPH_PATH}`);
}
