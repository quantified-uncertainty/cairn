import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Types
interface Permission {
  type: 'read' | 'write' | 'execute' | 'network' | 'admin';
  scope?: string;
}

interface DelegationNodeData {
  id: string;
  name: string;
  type: 'human' | 'coordinator' | 'agent' | 'executor' | 'verifier';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  permissions: Permission[];
  description: string;
  delegationRisk?: number;
  warnings?: string[];
}

interface TreeNode extends DelegationNodeData {
  children?: TreeNode[];
}

// Sample data
const sampleData: TreeNode = {
  id: 'human',
  name: 'Human Principal',
  type: 'human',
  riskLevel: 'low',
  permissions: [{ type: 'admin', scope: 'full system' }],
  description: 'Ultimate authority and oversight. Approves major decisions and reviews outputs.',
  delegationRisk: 0,
  children: [
    {
      id: 'oversight',
      name: 'Oversight Board',
      type: 'coordinator',
      riskLevel: 'low',
      permissions: [{ type: 'read', scope: 'all logs' }, { type: 'execute', scope: 'emergency stop' }],
      description: 'Monitors system behavior. Can halt operations if anomalies detected.',
      delegationRisk: 50,
    },
    {
      id: 'planner',
      name: 'Task Planner',
      type: 'coordinator',
      riskLevel: 'medium',
      permissions: [{ type: 'read', scope: 'codebase' }, { type: 'write', scope: 'task queue' }],
      description: 'Decomposes complex tasks into subtasks. No direct code execution.',
      delegationRisk: 200,
      warnings: ['High leverage position'],
      children: [
        {
          id: 'security-arch',
          name: 'Security Architect',
          type: 'agent',
          riskLevel: 'medium',
          permissions: [{ type: 'read', scope: 'auth modules' }],
          description: 'Designs security-critical components. Read-only access.',
          delegationRisk: 150,
          children: [
            {
              id: 'auth-impl',
              name: 'Auth Implementer',
              type: 'executor',
              riskLevel: 'high',
              permissions: [{ type: 'write', scope: '/src/auth/' }, { type: 'read', scope: 'secrets' }],
              description: 'Writes authentication code. Sensitive scope access.',
              delegationRisk: 300,
              warnings: ['Access to secrets', 'Security-critical path'],
            },
            {
              id: 'security-review',
              name: 'Security Reviewer',
              type: 'verifier',
              riskLevel: 'low',
              permissions: [{ type: 'read', scope: '/src/auth/' }],
              description: 'Reviews security code. Read-only, isolated.',
              delegationRisk: 25,
            }
          ]
        },
        {
          id: 'api-arch',
          name: 'API Designer',
          type: 'agent',
          riskLevel: 'low',
          permissions: [{ type: 'read', scope: 'api specs' }],
          description: 'Designs API contracts. No implementation access.',
          delegationRisk: 75,
          children: [
            {
              id: 'api-impl',
              name: 'API Implementer',
              type: 'executor',
              riskLevel: 'medium',
              permissions: [{ type: 'write', scope: '/src/api/' }, { type: 'network', scope: 'localhost' }],
              description: 'Implements API endpoints. Limited network for testing.',
              delegationRisk: 200,
            }
          ]
        },
        {
          id: 'db-arch',
          name: 'DB Designer',
          type: 'agent',
          riskLevel: 'medium',
          permissions: [{ type: 'read', scope: 'schemas' }],
          description: 'Designs database schemas. No direct DB access.',
          delegationRisk: 100,
          children: [
            {
              id: 'migration-writer',
              name: 'Migration Writer',
              type: 'executor',
              riskLevel: 'high',
              permissions: [{ type: 'write', scope: '/migrations/' }],
              description: 'Writes database migrations. High impact on data.',
              delegationRisk: 350,
              warnings: ['Can affect production data'],
            }
          ]
        }
      ]
    },
    {
      id: 'doc-writer',
      name: 'Doc Writer',
      type: 'executor',
      riskLevel: 'low',
      permissions: [{ type: 'write', scope: '/docs/' }],
      description: 'Updates documentation. Isolated, low-risk.',
      delegationRisk: 20,
    }
  ]
};

const riskColors = {
  low: { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
  medium: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  high: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
  critical: { bg: '#fecaca', border: '#b91c1c', text: '#7f1d1d' }
};

const typeIcons: Record<string, string> = {
  human: '👤',
  coordinator: '🎯',
  agent: '🤖',
  executor: '⚡',
  verifier: '✓'
};

// Convert tree to React Flow nodes and edges
function treeToFlow(tree: TreeNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate layout positions using a simple algorithm
  const levelWidths: number[] = [];
  const nodePositions: Map<string, { x: number; y: number }> = new Map();

  // First pass: count nodes at each level
  function countLevels(node: TreeNode, level: number) {
    levelWidths[level] = (levelWidths[level] || 0) + 1;
    node.children?.forEach(child => countLevels(child, level + 1));
  }
  countLevels(tree, 0);

  // Second pass: assign positions
  const levelCounters: number[] = new Array(levelWidths.length).fill(0);
  const nodeWidth = 160;
  const nodeHeight = 80;
  const horizontalGap = 40;
  const verticalGap = 100;

  function assignPositions(node: TreeNode, level: number, parentId?: string) {
    const levelWidth = levelWidths[level];
    const totalWidth = levelWidth * nodeWidth + (levelWidth - 1) * horizontalGap;
    const startX = -totalWidth / 2;
    const nodeIndex = levelCounters[level]++;

    const x = startX + nodeIndex * (nodeWidth + horizontalGap) + nodeWidth / 2;
    const y = level * (nodeHeight + verticalGap);

    nodePositions.set(node.id, { x, y });

    const colors = riskColors[node.riskLevel];
    const hasWarnings = node.warnings && node.warnings.length > 0;

    nodes.push({
      id: node.id,
      position: { x, y },
      data: {
        label: (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{typeIcons[node.type]}</span>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>{node.name}</span>
              {hasWarnings && <span style={{ color: '#dc2626' }}>⚠</span>}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              ${node.delegationRisk || 0}/mo
            </div>
          </div>
        ),
        ...node
      },
      style: {
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '8px',
        width: nodeWidth,
        fontSize: '12px',
        color: colors.text,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
          width: 20,
          height: 20,
        },
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
        },
      });
    }

    node.children?.forEach(child => assignPositions(child, level + 1, node.id));
  }

  assignPositions(tree, 0);

  return { nodes, edges };
}

// Detail panel component
function DetailPanel({ node }: { node: DelegationNodeData | null }) {
  if (!node) {
    return (
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        color: 'var(--sl-color-gray-3)',
        fontStyle: 'italic',
        fontSize: '14px',
        height: '100%',
      }}>
        Click a node to see details
      </div>
    );
  }

  const colors = riskColors[node.riskLevel];
  const riskPercent = Math.min(100, ((node.delegationRisk || 0) / 400) * 100);

  return (
    <div style={{
      padding: '16px',
      background: 'var(--sl-color-gray-6)',
      borderRadius: '8px',
      fontSize: '14px',
      height: '100%',
      overflow: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--sl-color-gray-5)',
      }}>
        <span style={{ fontSize: '20px' }}>{typeIcons[node.type]}</span>
        <span style={{ fontWeight: 600, fontSize: '16px' }}>{node.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '2px' }}>Type</div>
          <div>{node.type.charAt(0).toUpperCase() + node.type.slice(1)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '2px' }}>Risk</div>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            background: colors.bg,
            color: colors.text,
            fontWeight: 600,
            fontSize: '12px',
          }}>
            {node.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '2px' }}>Delegation Risk</div>
        <div style={{ fontWeight: 600 }}>${node.delegationRisk || 0}/mo</div>
        <div style={{ height: '6px', background: 'var(--sl-color-gray-5)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${riskPercent}%`, background: colors.border, borderRadius: '3px' }} />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '2px' }}>Description</div>
        <div style={{ lineHeight: 1.4 }}>{node.description}</div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Permissions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {node.permissions.map((perm, i) => (
            <span key={i} style={{
              display: 'inline-block',
              padding: '3px 8px',
              background: 'var(--sl-color-gray-5)',
              borderRadius: '4px',
              fontSize: '11px',
            }}>
              {perm.type}{perm.scope && `: ${perm.scope}`}
            </span>
          ))}
        </div>
      </div>

      {node.warnings && node.warnings.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '4px' }}>Warnings</div>
          {node.warnings.map((warning, i) => (
            <div key={i} style={{
              padding: '6px 10px',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '4px',
            }}>
              ⚠ {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DelegationGraph() {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => treeToFlow(sampleData), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<DelegationNodeData | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as DelegationNodeData);
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    let total = 0;
    let totalRisk = 0;
    const byRisk: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };

    nodes.forEach(node => {
      total++;
      const data = node.data as DelegationNodeData;
      totalRisk += data.delegationRisk || 0;
      byRisk[data.riskLevel]++;
    });

    return { total, totalRisk, byRisk };
  }, [nodes]);

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '0 0.5rem',
    }}>
      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ padding: '6px 12px', background: 'var(--sl-color-gray-6)', borderRadius: '6px', textAlign: 'center' }}>
          <span style={{ fontWeight: 700 }}>{stats.total}</span>
          <span style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', marginLeft: '4px' }}>nodes</span>
        </div>
        <div style={{ padding: '6px 12px', background: 'var(--sl-color-gray-6)', borderRadius: '6px', textAlign: 'center' }}>
          <span style={{ fontWeight: 700 }}>${stats.totalRisk}</span>
          <span style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', marginLeft: '4px' }}>risk/mo</span>
        </div>
        <div style={{ padding: '6px 12px', background: riskColors.high.bg, borderRadius: '6px' }}>
          <span style={{ fontWeight: 700, color: riskColors.high.text }}>{stats.byRisk.high}</span>
          <span style={{ fontSize: '11px', color: riskColors.high.text, marginLeft: '4px' }}>high risk</span>
        </div>
        <div style={{ padding: '6px 12px', background: riskColors.low.bg, borderRadius: '6px' }}>
          <span style={{ fontWeight: 700, color: riskColors.low.text }}>{stats.byRisk.low}</span>
          <span style={{ fontSize: '11px', color: riskColors.low.text, marginLeft: '4px' }}>low risk</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--sl-color-gray-2)' }}>
          {Object.entries(typeIcons).map(([type, icon]) => (
            <span key={type}>{icon} {type}</span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'stretch' }}>
        {/* Flow diagram */}
        <div style={{
          height: '500px',
          background: '#f8fafc',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--sl-color-gray-5)',
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnScroll={true}
            zoomOnScroll={true}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Detail panel */}
        <DetailPanel node={selectedNode} />
      </div>
    </div>
  );
}
