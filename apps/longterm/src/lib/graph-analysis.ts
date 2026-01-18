/**
 * Graph Analysis Utilities
 *
 * Provides graph-based analysis of entity relationships including:
 * - Cluster detection using label propagation
 * - Orphan finding (no connections)
 * - Centrality metrics
 * - Graph data preparation for React Flow
 */

import database from '../data/database.json';

// Types
export interface GraphNode {
  id: string;
  title: string;
  type: string;
  group?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship?: string;
}

export interface ClusterInfo {
  id: string;
  entities: string[];
  centralNode: string;
  size: number;
}

export interface ReactFlowNode {
  id: string;
  type?: string;
  data: {
    label: string;
    entityType: string;
    isOrphan?: boolean;
  };
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

// Color palette for entity types
export const TYPE_COLORS: Record<string, string> = {
  risk: '#dc2626',           // red
  'risk-factor': '#ef4444',  // lighter red
  'safety-agenda': '#16a34a', // green
  intervention: '#22c55e',   // lighter green
  policy: '#2563eb',         // blue
  capability: '#9333ea',     // purple
  model: '#f59e0b',          // amber
  crux: '#06b6d4',           // cyan
  concept: '#64748b',        // slate
  organization: '#0ea5e9',   // sky
  lab: '#0284c7',            // darker sky
  'lab-frontier': '#0369a1',
  researcher: '#7c3aed',     // violet
  funder: '#84cc16',         // lime
  // AI Transition Model types
  'ai-transition-model-parameter': '#8b5cf6',  // violet
  'ai-transition-model-metric': '#a78bfa',     // lighter violet
  'ai-transition-model-scenario': '#f97316',   // orange
  'ai-transition-model-factor': '#ef4444',     // red (like risk-factor)
  'ai-transition-model-subitem': '#fb923c',    // lighter orange
  default: '#6b7280',        // gray
};

/**
 * Get all entities from database
 */
export function getEntities(): any[] {
  return (database as any).entities || [];
}

/**
 * Get backlinks from database
 */
export function getBacklinks(): Record<string, any[]> {
  return (database as any).backlinks || {};
}

/**
 * Build adjacency list from entities
 */
export function buildAdjacencyList(): Map<string, Set<string>> {
  const entities = getEntities();
  const backlinks = getBacklinks();
  const adjacency = new Map<string, Set<string>>();

  // Initialize all nodes
  for (const entity of entities) {
    adjacency.set(entity.id, new Set());
  }

  // Add forward links (relatedEntries)
  for (const entity of entities) {
    if (entity.relatedEntries) {
      for (const rel of entity.relatedEntries) {
        adjacency.get(entity.id)?.add(rel.id);
        // Also add reverse for undirected graph analysis
        if (!adjacency.has(rel.id)) {
          adjacency.set(rel.id, new Set());
        }
        adjacency.get(rel.id)?.add(entity.id);
      }
    }
  }

  // Add backlinks
  for (const [entityId, links] of Object.entries(backlinks)) {
    if (!adjacency.has(entityId)) {
      adjacency.set(entityId, new Set());
    }
    for (const link of links as any[]) {
      adjacency.get(entityId)?.add(link.id);
    }
  }

  return adjacency;
}

/**
 * Find orphaned entities (no connections)
 */
export function findOrphans(): string[] {
  const adjacency = buildAdjacencyList();
  const orphans: string[] = [];

  for (const [entityId, neighbors] of adjacency.entries()) {
    if (neighbors.size === 0) {
      orphans.push(entityId);
    }
  }

  return orphans;
}

/**
 * Detect clusters using label propagation algorithm
 */
export function detectClusters(): ClusterInfo[] {
  const adjacency = buildAdjacencyList();
  const labels = new Map<string, string>();

  // Initialize each node with its own label
  for (const entityId of adjacency.keys()) {
    labels.set(entityId, entityId);
  }

  // Run label propagation (max 10 iterations)
  for (let i = 0; i < 10; i++) {
    let changed = false;

    for (const [entityId, neighbors] of adjacency.entries()) {
      if (neighbors.size === 0) continue;

      // Count neighbor labels
      const labelCounts = new Map<string, number>();
      for (const neighbor of neighbors) {
        const label = labels.get(neighbor) || neighbor;
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
      }

      // Find most common label
      let maxLabel = labels.get(entityId)!;
      let maxCount = 0;
      for (const [label, count] of labelCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          maxLabel = label;
        }
      }

      if (labels.get(entityId) !== maxLabel) {
        labels.set(entityId, maxLabel);
        changed = true;
      }
    }

    if (!changed) break;
  }

  // Group by cluster
  const clusters = new Map<string, string[]>();
  for (const [entityId, clusterId] of labels.entries()) {
    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, []);
    }
    clusters.get(clusterId)!.push(entityId);
  }

  // Filter to clusters with 2+ members and find central node
  const result: ClusterInfo[] = [];
  for (const [clusterId, members] of clusters.entries()) {
    if (members.length >= 2) {
      // Find node with most connections as central
      let centralNode = members[0];
      let maxConnections = 0;
      for (const member of members) {
        const connections = adjacency.get(member)?.size || 0;
        if (connections > maxConnections) {
          maxConnections = connections;
          centralNode = member;
        }
      }

      result.push({
        id: clusterId,
        entities: members,
        centralNode,
        size: members.length,
      });
    }
  }

  return result.sort((a, b) => b.size - a.size);
}

/**
 * Prepare graph data for React Flow
 */
export function prepareReactFlowData(options?: {
  focusEntity?: string;
  showOrphans?: boolean;
  maxNodes?: number;
}): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {
  const entities = getEntities();
  const orphans = new Set(findOrphans());
  const nodes: ReactFlowNode[] = [];
  const edges: ReactFlowEdge[] = [];
  const nodeIds = new Set<string>();

  // Filter entities
  let filteredEntities = entities;
  if (!options?.showOrphans) {
    filteredEntities = entities.filter(e => !orphans.has(e.id));
  }
  if (options?.maxNodes && filteredEntities.length > options.maxNodes) {
    filteredEntities = filteredEntities.slice(0, options.maxNodes);
  }

  // Create nodes
  const cols = Math.ceil(Math.sqrt(filteredEntities.length));
  filteredEntities.forEach((entity, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    nodes.push({
      id: entity.id,
      data: {
        label: entity.title,
        entityType: entity.type,
        isOrphan: orphans.has(entity.id),
      },
      position: {
        x: col * 200 + Math.random() * 50,
        y: row * 100 + Math.random() * 30,
      },
      style: {
        backgroundColor: TYPE_COLORS[entity.type] || TYPE_COLORS.default,
        color: '#fff',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        border: options?.focusEntity === entity.id ? '3px solid #000' : 'none',
      },
    });
    nodeIds.add(entity.id);
  });

  // Create edges
  for (const entity of filteredEntities) {
    if (!entity.relatedEntries) continue;

    for (const rel of entity.relatedEntries) {
      if (nodeIds.has(rel.id)) {
        edges.push({
          id: `${entity.id}-${rel.id}`,
          source: entity.id,
          target: rel.id,
          label: rel.relationship,
          animated: rel.relationship === 'causes',
          style: {
            stroke: '#999',
            strokeWidth: rel.strength === 'strong' ? 2 : 1,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Get entity lookup map for quick access
 */
export function getEntityMap(): Map<string, any> {
  const entities = getEntities();
  const map = new Map();
  for (const entity of entities) {
    map.set(entity.id, entity);
  }
  return map;
}

/**
 * Calculate degree centrality for all entities
 */
export function calculateCentrality(): Map<string, number> {
  const adjacency = buildAdjacencyList();
  const centrality = new Map<string, number>();

  for (const [entityId, neighbors] of adjacency.entries()) {
    centrality.set(entityId, neighbors.size);
  }

  return centrality;
}

/**
 * Get most connected entities
 */
export function getMostConnected(limit = 10): { id: string; title: string; connections: number }[] {
  const entities = getEntities();
  const entityMap = getEntityMap();
  const centrality = calculateCentrality();

  return [...centrality.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, connections]) => ({
      id,
      title: entityMap.get(id)?.title || id,
      connections,
    }));
}
