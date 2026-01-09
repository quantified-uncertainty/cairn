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
  question?: string;  // For outcome nodes - the key question they address
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
  question?: string;  // For outcome nodes - the key question they address
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
      question: node.question,
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

// === RELATIONSHIP QUERY HELPERS ===
// These derive relationships from the YAML edges instead of hardcoding them

export interface ScenarioInfluence {
  scenarioId: string;
  scenarioLabel: string;
  effect: 'increases' | 'decreases' | undefined;
  strength: 'strong' | 'medium' | 'weak' | undefined;
}

export interface FactorInfluence {
  factorId: string;
  factorLabel: string;
  effect: 'increases' | 'decreases' | undefined;
  strength: 'strong' | 'medium' | 'weak' | undefined;
}

export interface OutcomeConnection {
  outcomeId: string;
  outcomeLabel: string;
  effect: 'increases' | 'decreases' | undefined;
}

// Get all scenarios that a root factor influences (with direction)
export function getFactorScenarioInfluences(factorId: string): ScenarioInfluence[] {
  const edges = rawData.edges.filter(e => e.source === factorId);
  const scenarios = getScenarios();

  return edges
    .map(edge => {
      const scenario = scenarios.find(s => s.id === edge.target);
      if (!scenario) return null;
      return {
        scenarioId: edge.target,
        scenarioLabel: scenario.label,
        effect: edge.effect,
        strength: edge.strength,
      };
    })
    .filter((s): s is ScenarioInfluence => s !== null);
}

// Get formatted scenario influences as a string array (for display)
export function getFactorScenarioLabels(factorId: string): string[] {
  const influences = getFactorScenarioInfluences(factorId);

  if (influences.length === 0) return ['—'];

  // Check if this factor affects all scenarios
  const scenarios = getScenarios();
  if (influences.length === scenarios.length) {
    return ['All scenarios'];
  }

  return influences.map(inf => {
    const arrow = inf.effect === 'increases' ? '↑' : inf.effect === 'decreases' ? '↓' : '';
    return `${inf.scenarioLabel} ${arrow}`.trim();
  });
}

// Get all factors that influence a scenario (with direction)
export function getScenarioFactorInfluences(scenarioId: string): FactorInfluence[] {
  const edges = rawData.edges.filter(e => e.target === scenarioId);
  const factors = getRootFactors();

  return edges
    .map(edge => {
      const factor = factors.find(f => f.id === edge.source);
      if (!factor) return null;
      return {
        factorId: edge.source,
        factorLabel: factor.label,
        effect: edge.effect,
        strength: edge.strength,
      };
    })
    .filter((f): f is FactorInfluence => f !== null);
}

// Get formatted factor influences for a scenario as a string
export function getScenarioFactorLabels(scenarioId: string): string {
  const influences = getScenarioFactorInfluences(scenarioId);

  if (influences.length === 0) return '—';

  return influences.map(inf => {
    const arrow = inf.effect === 'increases' ? '↑' : inf.effect === 'decreases' ? '↓' : '';
    return `${inf.factorLabel} ${arrow}`.trim();
  }).join(', ');
}

// Get all outcomes that a scenario leads to
export function getScenarioOutcomeConnections(scenarioId: string): OutcomeConnection[] {
  const edges = rawData.edges.filter(e => e.source === scenarioId);
  const outcomes = getOutcomes();

  return edges
    .map(edge => {
      const outcome = outcomes.find(o => o.id === edge.target);
      if (!outcome) return null;
      return {
        outcomeId: edge.target,
        outcomeLabel: outcome.label,
        effect: edge.effect,
      };
    })
    .filter((o): o is OutcomeConnection => o !== null);
}

// Get formatted outcome labels for a scenario as a string
export function getScenarioOutcomeLabels(scenarioId: string): string {
  const connections = getScenarioOutcomeConnections(scenarioId);

  if (connections.length === 0) return '—';

  return connections.map(c => c.outcomeLabel).join(', ');
}

// Get all scenarios that lead to an outcome
export function getOutcomeScenarioConnections(outcomeId: string): { scenarioId: string; scenarioLabel: string }[] {
  const edges = rawData.edges.filter(e => e.target === outcomeId);
  const scenarios = getScenarios();

  return edges
    .map(edge => {
      const scenario = scenarios.find(s => s.id === edge.source);
      if (!scenario) return null;
      return {
        scenarioId: edge.source,
        scenarioLabel: scenario.label,
      };
    })
    .filter((s): s is { scenarioId: string; scenarioLabel: string } => s !== null);
}

// Get formatted scenario labels for an outcome as a string
export function getOutcomeScenarioLabels(outcomeId: string): string {
  const connections = getOutcomeScenarioConnections(outcomeId);

  if (connections.length === 0) return '—';

  return connections.map(c => c.scenarioLabel).join(', ');
}

// Get a node by ID (any type)
export function getNodeById(nodeId: string): RootFactor | undefined {
  const allNodes = getAllNodes();
  return allNodes.find(n => n.id === nodeId);
}
