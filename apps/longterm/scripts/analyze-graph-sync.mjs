#!/usr/bin/env node
/**
 * Analyze sync status between individual entity diagrams and the master graph.
 *
 * Identifies:
 * 1. Nodes in individual diagrams but not in master graph
 * 2. Nodes in master graph but not referenced in any individual diagram
 * 3. Potential ID mismatches (similar names, different IDs)
 */

import { readFileSync } from 'fs';
import yaml from 'js-yaml';

const ENTITIES_PATH = 'src/data/entities/ai-transition-model.yaml';
const MASTER_GRAPH_PATH = 'src/data/graphs/ai-transition-model-master.yaml';

// Load files
const entitiesYaml = readFileSync(ENTITIES_PATH, 'utf8');
const masterYaml = readFileSync(MASTER_GRAPH_PATH, 'utf8');

const entities = yaml.load(entitiesYaml);
const masterGraph = yaml.load(masterYaml);

// Extract all node IDs from master graph
const masterNodeIds = new Set();
const masterNodeLabels = new Map(); // id -> label

// From categories
for (const cat of masterGraph.categories || []) {
  masterNodeIds.add(cat.id);
  masterNodeLabels.set(cat.id, cat.label);
  for (const sub of cat.subItems || []) {
    masterNodeIds.add(sub.id);
    masterNodeLabels.set(sub.id, sub.label);
  }
}

// From detailed nodes
for (const node of masterGraph.detailedNodes || []) {
  masterNodeIds.add(node.id);
  masterNodeLabels.set(node.id, node.label);
}

console.log(`\n=== Master Graph Stats ===`);
console.log(`Categories: ${masterGraph.categories?.length || 0}`);
console.log(`Detailed Nodes: ${masterGraph.detailedNodes?.length || 0}`);
console.log(`Total Unique Node IDs: ${masterNodeIds.size}`);

// Extract all node IDs from individual diagrams
const individualNodeIds = new Set();
const individualNodeLabels = new Map(); // id -> {label, entityId}
const entitiesWithDiagrams = [];

for (const entity of entities) {
  if (entity.causeEffectGraph?.nodes) {
    entitiesWithDiagrams.push(entity.id);
    for (const node of entity.causeEffectGraph.nodes) {
      individualNodeIds.add(node.id);
      if (!individualNodeLabels.has(node.id)) {
        individualNodeLabels.set(node.id, { label: node.label, entities: [entity.id] });
      } else {
        individualNodeLabels.get(node.id).entities.push(entity.id);
      }
    }
  }
}

console.log(`\n=== Individual Diagrams Stats ===`);
console.log(`Entities with diagrams: ${entitiesWithDiagrams.length}`);
console.log(`Total Unique Node IDs: ${individualNodeIds.size}`);

// Find nodes in individual diagrams but NOT in master
const missingFromMaster = [];
for (const id of individualNodeIds) {
  if (!masterNodeIds.has(id)) {
    const info = individualNodeLabels.get(id);
    missingFromMaster.push({ id, label: info.label, usedIn: info.entities });
  }
}

console.log(`\n=== Nodes in Individual Diagrams but NOT in Master Graph (${missingFromMaster.length}) ===`);
if (missingFromMaster.length > 0) {
  // Group by the entity that uses them
  const byEntity = new Map();
  for (const node of missingFromMaster) {
    for (const entityId of node.usedIn) {
      if (!byEntity.has(entityId)) byEntity.set(entityId, []);
      byEntity.get(entityId).push(node);
    }
  }

  for (const [entityId, nodes] of byEntity) {
    console.log(`\n  ${entityId}:`);
    for (const node of nodes) {
      console.log(`    - ${node.id} ("${node.label}")`);
    }
  }
}

// Find potential ID mismatches (same label, different ID)
console.log(`\n=== Potential ID Mismatches (same/similar label, different ID) ===`);
const labelToIds = new Map();

// Build label -> ids map from both sources
for (const [id, label] of masterNodeLabels) {
  const normalizedLabel = label.toLowerCase().trim();
  if (!labelToIds.has(normalizedLabel)) labelToIds.set(normalizedLabel, { master: [], individual: [] });
  labelToIds.get(normalizedLabel).master.push(id);
}

for (const [id, info] of individualNodeLabels) {
  const normalizedLabel = info.label.toLowerCase().trim();
  if (!labelToIds.has(normalizedLabel)) labelToIds.set(normalizedLabel, { master: [], individual: [] });
  labelToIds.get(normalizedLabel).individual.push(id);
}

let mismatchCount = 0;
for (const [label, ids] of labelToIds) {
  if (ids.master.length > 0 && ids.individual.length > 0) {
    // Check if IDs differ
    const masterSet = new Set(ids.master);
    const individualSet = new Set(ids.individual);
    const onlyInMaster = ids.master.filter(id => !individualSet.has(id));
    const onlyInIndividual = ids.individual.filter(id => !masterSet.has(id));

    if (onlyInMaster.length > 0 || onlyInIndividual.length > 0) {
      mismatchCount++;
      console.log(`\n  Label: "${label}"`);
      if (onlyInMaster.length > 0) console.log(`    Master IDs: ${onlyInMaster.join(', ')}`);
      if (onlyInIndividual.length > 0) console.log(`    Individual IDs: ${onlyInIndividual.join(', ')}`);
    }
  }
}

if (mismatchCount === 0) {
  console.log('  None found.');
}

// Summary
console.log(`\n=== Summary ===`);
console.log(`Nodes missing from master graph: ${missingFromMaster.length}`);
console.log(`Potential ID mismatches: ${mismatchCount}`);

if (missingFromMaster.length > 0) {
  console.log(`\nTo add missing nodes to master graph, consider adding them to:`);
  console.log(`  ${MASTER_GRAPH_PATH} under detailedNodes section`);
}
