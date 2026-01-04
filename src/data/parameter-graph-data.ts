// Parameter graph data loader
// Loads and validates the YAML data for the cause-effect visualization

import type { Node, Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData } from '../components/CauseEffectGraph';
import yaml from 'js-yaml';

// Import YAML as raw text
import graphYaml from './parameter-graph.yaml?raw';

// Types for the raw YAML structure
interface RawNode {
  id: string;
  label: string;
  description?: string;
  type: 'cause' | 'intermediate' | 'effect';
  order?: number;  // Manual ordering within layer (0 = leftmost)
  subItems?: Array<{ label: string; probability?: string }>;
  confidence?: number;
  confidenceLabel?: string;
}

interface RawEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  strength?: 'strong' | 'medium' | 'weak';
  effect?: 'increases' | 'decreases';
}

interface RawGraphData {
  nodes: RawNode[];
  edges: RawEdge[];
}

// Parse YAML
const rawData = yaml.load(graphYaml) as RawGraphData;

// Validate edges reference valid node IDs
function validateGraph(data: RawGraphData): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(data.nodes.map(n => n.id));

  for (const edge of data.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge "${edge.id}": source "${edge.source}" not found in nodes`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge "${edge.id}": target "${edge.target}" not found in nodes`);
    }
  }

  // Check for duplicate node IDs
  const seenIds = new Set<string>();
  for (const node of data.nodes) {
    if (seenIds.has(node.id)) {
      errors.push(`Duplicate node ID: "${node.id}"`);
    }
    seenIds.add(node.id);
  }

  // Check for duplicate edge IDs
  const seenEdgeIds = new Set<string>();
  for (const edge of data.edges) {
    if (seenEdgeIds.has(edge.id)) {
      errors.push(`Duplicate edge ID: "${edge.id}"`);
    }
    seenEdgeIds.add(edge.id);
  }

  return errors;
}

// Run validation
const validationErrors = validateGraph(rawData);
if (validationErrors.length > 0) {
  console.error('Parameter graph validation errors:');
  validationErrors.forEach(err => console.error(`  - ${err}`));
  // In development, throw to make errors visible
  if (import.meta.env.DEV) {
    throw new Error(`Parameter graph has ${validationErrors.length} validation error(s)`);
  }
}

// Transform to React Flow format
export const parameterNodes: Node<CauseEffectNodeData>[] = rawData.nodes.map(node => ({
  id: node.id,
  type: 'causeEffect',
  position: { x: 0, y: 0 }, // Layout will reposition
  data: {
    label: node.label,
    description: node.description,
    type: node.type,
    order: node.order,  // Manual ordering for layout
    subItems: node.subItems,
    confidence: node.confidence,
    confidenceLabel: node.confidenceLabel,
  },
}));

export const parameterEdges: Edge<CauseEffectEdgeData>[] = rawData.edges.map(edge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  data: {
    label: edge.label,
    strength: edge.strength,
    effect: edge.effect,
  },
}));
