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
  subgroup?: string;  // Cluster within layer (e.g., 'ai' vs 'society')
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

export interface ImpactGridEntry {
  source: string;
  target: string;
  impact: number;
  direction: 'increases' | 'decreases' | 'mixed';
  notes: string;
}

interface RawGraphData {
  nodes: RawNode[];
  edges: RawEdge[];
  impactGrid?: ImpactGridEntry[];
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
    subgroup: node.subgroup,  // Cluster within layer
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

// Export impact grid data
export const impactGrid: ImpactGridEntry[] = rawData.impactGrid || [];

// Helper to get all impacts where this node is the source (what it affects)
export function getImpactsFrom(nodeId: string): ImpactGridEntry[] {
  return impactGrid.filter(entry => entry.source === nodeId);
}

// Helper to get all impacts where this node is the target (what affects it)
export function getImpactsTo(nodeId: string): ImpactGridEntry[] {
  return impactGrid.filter(entry => entry.target === nodeId);
}

// Helper to get node label by ID
export function getNodeLabel(nodeId: string): string {
  const node = rawData.nodes.find(n => n.id === nodeId);
  return node?.label || nodeId;
}

// Types for sub-items
export interface SubItemRatings {
  changeability?: number;
  xriskImpact?: number;
  trajectoryImpact?: number;
  uncertainty?: number;
}

export interface KeyDebate {
  topic: string;
  description: string;
}

export interface RelatedContentLink {
  path: string;
  title: string;
}

export interface RelatedContent {
  risks?: RelatedContentLink[];
  responses?: RelatedContentLink[];
  models?: RelatedContentLink[];
  cruxes?: RelatedContentLink[];
}

export interface SubItem {
  label: string;
  description?: string;
  href?: string;
  ratings?: SubItemRatings;
  scope?: string;
  keyDebates?: KeyDebate[];
  relatedContent?: RelatedContent;
}

export interface RootFactor {
  id: string;
  label: string;
  description?: string;
  href?: string;
  subgroup?: string;
  order?: number;
  subItems?: SubItem[];
}

// Get all root factors (cause nodes) with their sub-items
export function getRootFactors(): RootFactor[] {
  return rawData.nodes
    .filter(node => node.type === 'cause')
    .sort((a, b) => {
      // Sort by subgroup first (ai before society), then by order
      if (a.subgroup !== b.subgroup) {
        return a.subgroup === 'ai' ? -1 : 1;
      }
      return (a.order || 0) - (b.order || 0);
    })
    .map(node => ({
      id: node.id,
      label: node.label,
      description: node.description,
      href: (node as any).href,
      subgroup: node.subgroup,
      order: node.order,
      subItems: node.subItems?.map(item => ({
        label: item.label,
        description: (item as any).description,
        href: (item as any).href,
        ratings: (item as any).ratings,
        scope: (item as any).scope,
        keyDebates: (item as any).keyDebates,
        relatedContent: (item as any).relatedContent,
      })),
    }));
}

// Get scenarios (intermediate nodes)
export function getScenarios(): RootFactor[] {
  return rawData.nodes
    .filter(node => node.type === 'intermediate')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(node => ({
      id: node.id,
      label: node.label,
      description: node.description,
      href: (node as any).href,
      subItems: node.subItems?.map(item => ({
        label: item.label,
        description: (item as any).description,
        href: (item as any).href,
        ratings: (item as any).ratings,
        scope: (item as any).scope,
        keyDebates: (item as any).keyDebates,
        relatedContent: (item as any).relatedContent,
      })),
    }));
}

// Get outcomes (effect nodes)
export function getOutcomes(): RootFactor[] {
  return rawData.nodes
    .filter(node => node.type === 'effect')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(node => ({
      id: node.id,
      label: node.label,
      description: node.description,
      href: (node as any).href,
    }));
}

// Get edges for a specific source node
export function getEdgesFrom(sourceId: string) {
  return rawData.edges.filter(e => e.source === sourceId);
}

// Get edges for a specific target node
export function getEdgesTo(targetId: string) {
  return rawData.edges.filter(e => e.target === targetId);
}

// Get all nodes (root factors + scenarios + outcomes)
function getAllNodes(): RootFactor[] {
  return [...getRootFactors(), ...getScenarios(), ...getOutcomes()];
}

// Get a specific sub-item by node ID and label
export function getSubItem(nodeId: string, subItemLabel: string): SubItem | undefined {
  const allNodes = getAllNodes();
  const node = allNodes.find(n => n.id === nodeId);
  if (!node?.subItems) return undefined;
  return node.subItems.find(item => item.label === subItemLabel);
}

// Get key debates for a sub-item
export function getSubItemDebates(nodeId: string, subItemLabel: string): KeyDebate[] {
  const subItem = getSubItem(nodeId, subItemLabel);
  return subItem?.keyDebates || [];
}

// Get ratings for a sub-item
export function getSubItemRatings(nodeId: string, subItemLabel: string): SubItemRatings | undefined {
  const subItem = getSubItem(nodeId, subItemLabel);
  return subItem?.ratings;
}

// Get related content for a sub-item
export function getSubItemRelatedContent(nodeId: string, subItemLabel: string): RelatedContent | undefined {
  const subItem = getSubItem(nodeId, subItemLabel);
  return subItem?.relatedContent;
}

// Get scope for a sub-item
export function getSubItemScope(nodeId: string, subItemLabel: string): string | undefined {
  const subItem = getSubItem(nodeId, subItemLabel);
  return subItem?.scope;
}
