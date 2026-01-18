/**
 * Parameter Flow Diagram Component
 *
 * Interactive visualization of parameters and their relationships to risks/interventions.
 * Uses React Flow with ELK.js for automatic hierarchical layout.
 * All arrows flow in one direction (left-to-right).
 */

import { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';

// Fix for React Flow edge SVGs - Tailwind/Starlight resets dimensions
const edgeFixStyles = `
  .parameter-flow-diagram .react-flow__edges {
    width: 100% !important;
    height: 100% !important;
  }
  .parameter-flow-diagram .react-flow__edges > svg {
    position: absolute !important;
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    left: 0 !important;
    overflow: visible !important;
    pointer-events: none;
  }
  .parameter-flow-diagram .react-flow__edge {
    pointer-events: all;
  }
`;

const elk = new ELK();

// Node types for the diagram
type NodeType = 'risk' | 'parameter' | 'intervention' | 'metric';

interface FlowNodeData {
  label: string;
  nodeType: NodeType;
  href?: string;
}

interface FlowNode {
  id: string;
  title: string;
  type: NodeType;
  href?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface ParameterFlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  height?: number;
}

// Colors for each node type
const TYPE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  risk: { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c' },
  parameter: { bg: '#fdf4ff', border: '#d946ef', text: '#a21caf' },
  intervention: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
  metric: { bg: '#eff6ff', border: '#2563eb', text: '#1d4ed8' },
};

// Node dimensions
const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;

// ELK layout options - left-to-right flow
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '30',
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.edgeNode': '30',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.layered.spacing.edgeNodeBetweenLayers': '30',
  'elk.edgeRouting': 'SPLINES',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  // Force layer assignment based on node type
  'elk.partitioning.activate': 'true',
};

// Custom node component
function FlowNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const colors = TYPE_COLORS[data.nodeType];

  const content = (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: '8px',
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        minWidth: NODE_WIDTH - 28,
        maxWidth: NODE_WIDTH,
        textAlign: 'center',
        cursor: data.href ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (data.href) {
          e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.15)`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
      />
      <div
        style={{
          fontWeight: 600,
          fontSize: '11px',
          color: colors.text,
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
      />
    </div>
  );

  if (data.href) {
    return (
      <a href={data.href} style={{ textDecoration: 'none' }}>
        {content}
      </a>
    );
  }
  return content;
}

const nodeTypes = { flowNode: FlowNode };

// Compute layout using ELK
async function computeLayout(
  nodes: FlowNode[],
  edges: FlowEdge[]
): Promise<{ nodes: Node<FlowNodeData>[]; edges: Edge[] }> {
  // Assign partitions based on node type to enforce layer ordering
  // Both risks and interventions on left (0), parameters on right (1)
  const partitionMap: Record<NodeType, number> = {
    risk: 0,
    intervention: 0,
    parameter: 1,
    metric: 2,
  };

  const elkGraph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      layoutOptions: {
        'elk.partitioning.partition': String(partitionMap[node.type]),
      },
    })),
    edges: edges.map((edge, idx) => ({
      id: `edge-${idx}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  };

  const layoutedGraph = await elk.layout(elkGraph);

  const flowNodes: Node<FlowNodeData>[] = nodes.map((node) => {
    const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return {
      id: node.id,
      type: 'flowNode',
      position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
      data: {
        label: node.title,
        nodeType: node.type,
        href: node.href,
      },
    };
  });

  // Style edges based on the source node type
  const flowEdges: Edge[] = edges.map((edge, idx) => {
    const sourceNode = nodes.find((n) => n.id === edge.from);
    const edgeColor = sourceNode ? TYPE_COLORS[sourceNode.type].border : '#64748b';

    return {
      id: `edge-${idx}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      labelStyle: { fontSize: 9, fontWeight: 500, fill: '#64748b' },
      labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
      labelBgPadding: [2, 4] as [number, number],
      labelBgBorderRadius: 2,
      style: {
        stroke: edgeColor,
        strokeWidth: 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 12,
        height: 12,
      },
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}

// Legend component
function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '11px',
        zIndex: 10,
        display: 'flex',
        gap: '16px',
      }}
    >
      {Object.entries(TYPE_COLORS).map(([type, colors]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: colors.bg,
              border: `2px solid ${colors.border}`,
            }}
          />
          <span style={{ color: '#374151', textTransform: 'capitalize' }}>{type}</span>
        </div>
      ))}
    </div>
  );
}

export default function ParameterFlowDiagram({
  nodes: inputNodes,
  edges: inputEdges,
  height = 500,
}: ParameterFlowDiagramProps) {
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLayouting, setIsLayouting] = useState(true);

  // Compute layout on mount/input change
  useEffect(() => {
    setIsLayouting(true);
    computeLayout(inputNodes, inputEdges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
    });
  }, [inputNodes, inputEdges]);

  // Memoize to prevent unnecessary re-renders
  const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);
  const defaultEdgeOptions = useMemo(() => ({
    type: 'default',
    style: { stroke: '#64748b', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 12, height: 12 },
  }), []);

  return (
    <div
      className="parameter-flow-diagram"
      style={{
        width: '100%',
        height,
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{edgeFixStyles}</style>
      {isLayouting && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#64748b',
            fontSize: '14px',
            zIndex: 20,
          }}
        >
          Computing layout...
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
      <Legend />
    </div>
  );
}
