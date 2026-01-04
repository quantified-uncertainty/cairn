// Configuration and constants for CauseEffectGraph

// Node dimensions for layout calculation
export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 80;
export const NODE_HEIGHT_WITH_SUBITEMS = 160; // Nodes with 3 subItems are ~160px tall

// Group container padding and spacing
export const GROUP_PADDING = 20;
export const GROUP_HEADER_HEIGHT = 28;

// Subgroup padding and spacing
export const SUBGROUP_PADDING = 12;
export const SUBGROUP_HEADER_HEIGHT = 20;
export const SUBGROUP_GAP = 15;

// Unified configuration for all node types
export interface NodeTypeConfig {
  label: string;
  // Container (group) styling
  groupBg: string;
  groupBorder: string;
  // Node styling
  nodeBg: string;
  nodeBorder: string;
  nodeText: string;
  nodeAccent: string;
  // Legend
  showInLegend: boolean;
  legendOrder: number;
}

// Default labels (generic) - can be overridden via GraphConfig.typeLabels
export const DEFAULT_TYPE_LABELS: Record<string, string> = {
  leaf: 'Leaf Nodes',
  cause: 'Causes',
  intermediate: 'Intermediate',
  effect: 'Effects',
};

export const NODE_TYPE_CONFIG: Record<string, NodeTypeConfig> = {
  leaf: {
    label: DEFAULT_TYPE_LABELS.leaf,
    groupBg: 'rgba(236, 253, 245, 0.4)',
    groupBorder: '#a7f3d0',
    nodeBg: '#ecfdf5',
    nodeBorder: '#059669',
    nodeText: '#047857',
    nodeAccent: '#10b981',
    showInLegend: false,
    legendOrder: 0,
  },
  cause: {
    label: DEFAULT_TYPE_LABELS.cause,
    groupBg: 'rgba(241, 245, 249, 0.4)',
    groupBorder: '#cbd5e1',
    nodeBg: '#f1f5f9',
    nodeBorder: '#475569',
    nodeText: '#334155',
    nodeAccent: '#64748b',
    showInLegend: true,
    legendOrder: 1,
  },
  intermediate: {
    label: DEFAULT_TYPE_LABELS.intermediate,
    groupBg: 'rgba(219, 234, 254, 0.4)',
    groupBorder: '#93c5fd',
    nodeBg: '#dbeafe',
    nodeBorder: '#2563eb',
    nodeText: '#1d4ed8',
    nodeAccent: '#3b82f6',
    showInLegend: true,
    legendOrder: 2,
  },
  effect: {
    label: DEFAULT_TYPE_LABELS.effect,
    groupBg: 'rgba(254, 243, 199, 0.4)',
    groupBorder: '#fcd34d',
    nodeBg: '#fef3c7',
    nodeBorder: '#d97706',
    nodeText: '#92400e',
    nodeAccent: '#f59e0b',
    showInLegend: true,
    legendOrder: 3,
  },
};

// Derived groupConfig for layout code
export const groupConfig: Record<string, { label: string; bgColor: string; borderColor: string }> =
  Object.fromEntries(
    Object.entries(NODE_TYPE_CONFIG).map(([key, config]) => [
      key,
      { label: config.label, bgColor: config.groupBg, borderColor: config.groupBorder }
    ])
  );

// Default subgroup configuration (empty - graphs provide their own via GraphConfig)
export const DEFAULT_SUBGROUP_CONFIG: Record<string, { label: string; bgColor: string; borderColor: string }> = {};

// Default subgroup order (empty - graphs provide their own)
export const DEFAULT_SUBGROUP_ORDER: string[] = [];

// ELK layout options
export const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '40',
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.edgeNode': '25',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.layered.spacing.edgeNodeBetweenLayers': '30',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
  'elk.edgeRouting': 'SPLINES',
  'elk.layered.mergeEdges': 'false',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
};
