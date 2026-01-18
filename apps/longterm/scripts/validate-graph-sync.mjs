#!/usr/bin/env node
/**
 * Validate that all nodes in individual entity diagrams exist in the master graph.
 *
 * This ensures the master graph stays the single source of truth for node definitions.
 *
 * Usage:
 *   node scripts/validate-graph-sync.mjs
 *
 * Exit codes:
 *   0 - All nodes are synced
 *   1 - Missing nodes found
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

for (const cat of masterGraph.categories || []) {
  masterNodeIds.add(cat.id);
  for (const sub of cat.subItems || []) {
    masterNodeIds.add(sub.id);
  }
}

for (const node of masterGraph.detailedNodes || []) {
  masterNodeIds.add(node.id);
}

// Find missing nodes
const missingNodes = [];

for (const entity of entities) {
  if (!entity.causeEffectGraph?.nodes) continue;

  for (const node of entity.causeEffectGraph.nodes) {
    if (!masterNodeIds.has(node.id)) {
      missingNodes.push({
        nodeId: node.id,
        nodeLabel: node.label,
        entityId: entity.id,
      });
    }
  }
}

if (missingNodes.length === 0) {
  console.log('✓ Graph sync validation passed');
  console.log(`  Master graph: ${masterNodeIds.size} nodes`);
  console.log(`  All individual diagram nodes found in master graph`);
  process.exit(0);
} else {
  console.error('✗ Graph sync validation FAILED');
  console.error(`  Found ${missingNodes.length} nodes in individual diagrams not in master graph:\n`);

  // Group by entity
  const byEntity = new Map();
  for (const m of missingNodes) {
    if (!byEntity.has(m.entityId)) byEntity.set(m.entityId, []);
    byEntity.get(m.entityId).push(m);
  }

  for (const [entityId, nodes] of byEntity) {
    console.error(`  ${entityId}:`);
    for (const n of nodes) {
      console.error(`    - ${n.nodeId} ("${n.nodeLabel}")`);
    }
  }

  console.error(`\nTo fix: run 'node scripts/add-missing-nodes-to-master.mjs --apply'`);
  process.exit(1);
}
