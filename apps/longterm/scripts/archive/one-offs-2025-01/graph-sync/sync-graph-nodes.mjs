#!/usr/bin/env node
/**
 * Sync nodes between individual entity diagrams and the master graph.
 *
 * This script:
 * 1. Extracts all nodes from individual diagrams
 * 2. Identifies which ones are missing from master graph
 * 3. Generates YAML to add them to master graph (grouped by source entity)
 *
 * Usage:
 *   node scripts/sync-graph-nodes.mjs           # Show what's missing
 *   node scripts/sync-graph-nodes.mjs --output  # Output YAML to add
 */

import { readFileSync, writeFileSync } from 'fs';
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

// Extract nodes from individual diagrams, tracking source
const missingNodes = new Map(); // id -> {node, sourceEntities}

for (const entity of entities) {
  if (!entity.causeEffectGraph?.nodes) continue;

  for (const node of entity.causeEffectGraph.nodes) {
    if (masterNodeIds.has(node.id)) continue;

    if (!missingNodes.has(node.id)) {
      missingNodes.set(node.id, {
        node: {
          id: node.id,
          label: node.label,
          type: node.type || 'leaf',
          description: node.description || '',
        },
        sourceEntities: [entity.id],
      });
    } else {
      missingNodes.get(node.id).sourceEntities.push(entity.id);
    }
  }
}

// Group by primary source entity
const bySourceEntity = new Map();
for (const [id, data] of missingNodes) {
  const primarySource = data.sourceEntities[0];
  if (!bySourceEntity.has(primarySource)) {
    bySourceEntity.set(primarySource, []);
  }
  bySourceEntity.get(primarySource).push(data.node);
}

const outputYaml = process.argv.includes('--output');

if (outputYaml) {
  console.log('# Missing nodes to add to master graph');
  console.log('# Add these to the detailedNodes section\n');

  for (const [entityId, nodes] of bySourceEntity) {
    // Determine category based on entity type
    let category = 'parameters'; // default
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      if (entityId.startsWith('tmc-')) {
        // Sub-item diagrams - categorize by parent
        if (entityId.includes('compute')) category = 'ai-capabilities';
        else if (entityId.includes('algorithm')) category = 'ai-capabilities';
        else if (entityId.includes('safety')) category = 'misalignment-potential';
        else if (entityId.includes('economic') || entityId.includes('political') || entityId.includes('values') || entityId.includes('epistemic') || entityId.includes('suffering')) category = 'long-term-lockin';
        else if (entityId.includes('gradual') || entityId.includes('rapid')) category = 'ai-takeover';
      } else {
        // Parameter diagrams
        category = 'parameters';
      }
    }

    console.log(`  # ---------------------------------------------------------------------------`);
    console.log(`  # From ${entityId} diagram`);
    console.log(`  # ---------------------------------------------------------------------------`);

    for (const node of nodes) {
      console.log(`  - id: ${node.id}`);
      console.log(`    label: "${node.label}"`);
      console.log(`    category: ${category}`);
      console.log(`    subcategory: ${entityId.replace('tmc-', '')}`);
      console.log(`    type: ${node.type}`);
      if (node.description) {
        console.log(`    description: "${node.description.replace(/"/g, '\\"')}"`);
      }
      console.log('');
    }
  }
} else {
  console.log(`\n=== Missing Nodes Summary ===`);
  console.log(`Total missing: ${missingNodes.size}`);
  console.log(`\nBy source entity:`);

  for (const [entityId, nodes] of bySourceEntity) {
    console.log(`  ${entityId}: ${nodes.length} nodes`);
  }

  console.log(`\nRun with --output to generate YAML to add to master graph`);
}
