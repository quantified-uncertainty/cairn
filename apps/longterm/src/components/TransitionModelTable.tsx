"use client"

// Embeddable table component for AI Transition Model - no navigation wrapper
import { useMemo, useState } from 'react';
import type { ColumnDef, Row } from "@tanstack/react-table"
import type { Node } from '@xyflow/react';
import type { CauseEffectNodeData } from './CauseEffectGraph/types';
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { parameterNodes } from '../data/parameter-graph-data';

interface Ratings {
  changeability: number;
  xriskImpact: number;
  trajectoryImpact: number;
  uncertainty: number;
}

interface SubItemRow {
  subItem: string;
  description: string;
  href?: string;
  parent: string;
  parentId: string;
  subgroup?: string;
  ratings?: Ratings;
}

// Extract sub-items from nodes
function extractSubItems(nodes: Node<CauseEffectNodeData>[], type: 'cause' | 'intermediate' | 'effect'): SubItemRow[] {
  const rows: SubItemRow[] = [];
  const filteredNodes = nodes
    .filter(n => n.data.type === type)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

  for (const node of filteredNodes) {
    if (node.data.subItems && node.data.subItems.length > 0) {
      for (const subItem of node.data.subItems) {
        rows.push({
          subItem: subItem.label,
          description: subItem.description || '',
          href: subItem.href,
          parent: node.data.label,
          parentId: node.id,
          subgroup: node.data.subgroup,
          ratings: subItem.ratings as Ratings | undefined,
        });
      }
    }
  }
  return rows;
}

// Map parent IDs to display categories
const parentCategories: Record<string, 'ai' | 'society'> = {
  'misalignment-potential': 'ai',
  'ai-capabilities': 'ai',
  'ai-uses': 'ai',
  'ai-ownership': 'ai',
  'civ-competence': 'society',
  'transition-turbulence': 'society',
  'misuse-potential': 'society',
};

// Truncate description for preview
function truncateText(text: string, maxLength: number = 150): string {
  if (!text) return '';
  const cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`#]/g, '').replace(/\n+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + '...';
}

// Parameter link - clickable with hover effect
function ParamLink({ children, href, tier, isHighPriority }: {
  children: React.ReactNode;
  href?: string;
  tier: 'cause' | 'intermediate' | 'effect';
  isHighPriority?: boolean;
}) {
  const colors: Record<string, string> = {
    cause: '#1e40af',
    intermediate: '#6d28d9',
    effect: '#92400e',
  };

  const content = (
    <span style={{
      fontSize: '13px',
      fontWeight: 600,
      color: colors[tier],
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      {isHighPriority && (
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ef4444',
          flexShrink: 0,
        }} title="High X-risk impact (>70)" />
      )}
      {children}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        style={{
          textDecoration: 'none',
          display: 'block',
        }}
        onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        {content}
      </a>
    );
  }
  return content;
}

// Rating cell with color-coded bar
function RatingCell({ value, colorType }: { value?: number; colorType: 'green' | 'red' | 'blue' | 'gray' }) {
  if (value === undefined) return <span style={{ color: '#9ca3af' }}>—</span>;

  const colorConfigs = {
    green: { bar: '#22c55e', bg: '#dcfce7', text: '#166534' },
    red: { bar: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
    blue: { bar: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
    gray: { bar: '#6b7280', bg: '#f3f4f6', text: '#374151' },
  };
  const c = colorConfigs[colorType];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
      <div style={{
        flex: 1,
        height: '6px',
        background: c.bg,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: c.bar,
          borderRadius: '3px',
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 500, color: c.text, minWidth: '24px' }}>{value}</span>
    </div>
  );
}

// Combined parent badge with category prefix
function CombinedParentBadge({ parent, category }: { parent: string; category?: 'ai' | 'society' }) {
  const config = {
    ai: { prefix: 'AI', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', prefixBg: '#dbeafe' },
    society: { prefix: 'Society', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', prefixBg: '#d1fae5' },
  };
  const c = config[category || 'ai'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      overflow: 'hidden',
      border: `1px solid ${c.border}`,
    }}>
      <span style={{
        padding: '3px 6px',
        background: c.prefixBg,
        color: c.color,
        fontWeight: 600,
        fontSize: '11px',
      }}>
        {c.prefix}
      </span>
      <span style={{
        padding: '3px 8px',
        background: c.bg,
        color: c.color,
      }}>
        {parent}
      </span>
    </span>
  );
}

// Expandable row component
function ExpandableRow({ row, isExpanded, onToggle }: {
  row: SubItemRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (!row.description) return null;

  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        fontSize: '13px',
        lineHeight: 1.6,
        color: '#475569',
      }}
    >
      <div style={{ maxWidth: '800px' }}>
        {truncateText(row.description, 400)}
        {row.href && (
          <a
            href={row.href}
            style={{
              marginLeft: '8px',
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Read more →
          </a>
        )}
      </div>
    </div>
  );
}

// Expand button
function ExpandButton({ isExpanded, onClick, hasDescription }: {
  isExpanded: boolean;
  onClick: () => void;
  hasDescription: boolean;
}) {
  if (!hasDescription) return <span style={{ width: '24px', display: 'inline-block' }} />;

  return (
    <button
      onClick={onClick}
      style={{
        width: '24px',
        height: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        background: isExpanded ? '#eff6ff' : 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: '#64748b',
        transition: 'all 0.15s ease',
      }}
      title={isExpanded ? 'Collapse' : 'Expand description'}
    >
      {isExpanded ? '−' : '+'}
    </button>
  );
}

// Column definitions for Root Factors
function createCauseColumns(
  expandedRows: Set<string>,
  toggleRow: (id: string) => void
): ColumnDef<SubItemRow>[] {
  return [
    {
      id: "expand",
      header: () => <span style={{ width: '24px' }} />,
      cell: ({ row }) => (
        <ExpandButton
          isExpanded={expandedRows.has(row.original.subItem)}
          onClick={() => toggleRow(row.original.subItem)}
          hasDescription={!!row.original.description}
        />
      ),
      size: 40,
    },
    {
      accessorKey: "subItem",
      header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
      cell: ({ row }) => (
        <ParamLink
          href={row.original.href}
          tier="cause"
          isHighPriority={(row.original.ratings?.xriskImpact ?? 0) > 70}
        >
          {row.getValue("subItem")}
        </ParamLink>
      ),
    },
    {
      accessorKey: "parent",
      header: ({ column }) => <SortableHeader column={column}>Parent Factor</SortableHeader>,
      cell: ({ row }) => {
        const cat = parentCategories[row.original.parentId];
        return <CombinedParentBadge parent={row.getValue("parent")} category={cat} />;
      },
    },
    {
      id: "changeability",
      accessorFn: (row) => row.ratings?.changeability,
      header: ({ column }) => <SortableHeader column={column}>Changeability</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.changeability} colorType="green" />,
    },
    {
      id: "uncertainty",
      accessorFn: (row) => row.ratings?.uncertainty,
      header: ({ column }) => <SortableHeader column={column}>Uncertainty</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.uncertainty} colorType="gray" />,
    },
    {
      id: "xriskImpact",
      accessorFn: (row) => row.ratings?.xriskImpact,
      header: ({ column }) => <SortableHeader column={column}>X-Risk</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.xriskImpact} colorType="red" />,
    },
    {
      id: "trajectoryImpact",
      accessorFn: (row) => row.ratings?.trajectoryImpact,
      header: ({ column }) => <SortableHeader column={column}>Trajectory</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.trajectoryImpact} colorType="blue" />,
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => row.original.href ? (
        <a
          href={row.original.href}
          style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            background: 'white',
            display: 'inline-block',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#1e40af';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          View →
        </a>
      ) : null,
      size: 70,
    },
  ];
}

// Column definitions for Ultimate Scenarios
function createIntermediateColumns(
  expandedRows: Set<string>,
  toggleRow: (id: string) => void
): ColumnDef<SubItemRow>[] {
  return [
    {
      id: "expand",
      header: () => <span style={{ width: '24px' }} />,
      cell: ({ row }) => (
        <ExpandButton
          isExpanded={expandedRows.has(row.original.subItem)}
          onClick={() => toggleRow(row.original.subItem)}
          hasDescription={!!row.original.description}
        />
      ),
      size: 40,
    },
    {
      accessorKey: "subItem",
      header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
      cell: ({ row }) => (
        <ParamLink
          href={row.original.href}
          tier="intermediate"
          isHighPriority={(row.original.ratings?.xriskImpact ?? 0) > 70}
        >
          {row.getValue("subItem")}
        </ParamLink>
      ),
    },
    {
      accessorKey: "parent",
      header: ({ column }) => <SortableHeader column={column}>Parent Scenario</SortableHeader>,
      cell: ({ row }) => (
        <span style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          background: '#f3e8ff',
          color: '#7c3aed',
          border: '1px solid #ddd6fe',
        }}>
          {row.getValue("parent")}
        </span>
      ),
    },
    {
      id: "changeability",
      accessorFn: (row) => row.ratings?.changeability,
      header: ({ column }) => <SortableHeader column={column}>Changeability</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.changeability} colorType="green" />,
    },
    {
      id: "uncertainty",
      accessorFn: (row) => row.ratings?.uncertainty,
      header: ({ column }) => <SortableHeader column={column}>Uncertainty</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.uncertainty} colorType="gray" />,
    },
    {
      id: "xriskImpact",
      accessorFn: (row) => row.ratings?.xriskImpact,
      header: ({ column }) => <SortableHeader column={column}>X-Risk</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.xriskImpact} colorType="red" />,
    },
    {
      id: "trajectoryImpact",
      accessorFn: (row) => row.ratings?.trajectoryImpact,
      header: ({ column }) => <SortableHeader column={column}>Trajectory</SortableHeader>,
      cell: ({ row }) => <RatingCell value={row.original.ratings?.trajectoryImpact} colorType="blue" />,
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => row.original.href ? (
        <a
          href={row.original.href}
          style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            background: 'white',
            display: 'inline-block',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#7c3aed';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          View →
        </a>
      ) : null,
      size: 70,
    },
  ];
}

// Column definitions for Ultimate Outcomes
function createEffectColumns(
  expandedRows: Set<string>,
  toggleRow: (id: string) => void
): ColumnDef<SubItemRow>[] {
  return [
    {
      id: "expand",
      header: () => <span style={{ width: '24px' }} />,
      cell: ({ row }) => (
        <ExpandButton
          isExpanded={expandedRows.has(row.original.subItem)}
          onClick={() => toggleRow(row.original.subItem)}
          hasDescription={!!row.original.description}
        />
      ),
      size: 40,
    },
    {
      accessorKey: "subItem",
      header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
      cell: ({ row }) => (
        <ParamLink href={row.original.href} tier="effect">
          {row.getValue("subItem")}
        </ParamLink>
      ),
    },
    {
      accessorKey: "parent",
      header: ({ column }) => <SortableHeader column={column}>Parent Outcome</SortableHeader>,
      cell: ({ row }) => (
        <span style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fcd34d',
        }}>
          {row.getValue("parent")}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => row.original.href ? (
        <a
          href={row.original.href}
          style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            background: 'white',
            display: 'inline-block',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#92400e';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          View →
        </a>
      ) : null,
      size: 70,
    },
  ];
}

// View mode type
type ViewMode = 'flat' | 'grouped';

function TableSection({
  title,
  data,
  columns,
  tierType,
  searchPlaceholder,
  expandedRows,
  viewMode,
}: {
  title: string;
  data: SubItemRow[];
  columns: ColumnDef<SubItemRow>[];
  tierType: 'cause' | 'intermediate' | 'effect';
  searchPlaceholder: string;
  expandedRows: Set<string>;
  viewMode: ViewMode;
}) {
  if (data.length === 0) return null;

  const headerColors = {
    cause: { background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)', color: '#1e40af' },
    intermediate: { background: 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%)', color: '#7c3aed' },
    effect: { background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)', color: '#a16207' },
  };

  // Group data by parent if in grouped mode
  const groupedData = useMemo(() => {
    if (viewMode === 'flat') return null;
    const groups: Record<string, SubItemRow[]> = {};
    for (const row of data) {
      if (!groups[row.parent]) groups[row.parent] = [];
      groups[row.parent].push(row);
    }
    return groups;
  }, [data, viewMode]);

  // Count high-priority items
  const highPriorityCount = data.filter(r => (r.ratings?.xriskImpact ?? 0) > 70).length;

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        padding: '12px 16px',
        fontWeight: 600,
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...headerColors[tierType],
      }}>
        <span>{title}</span>
        {highPriorityCount > 0 && (
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ef4444',
            }} />
            {highPriorityCount} high priority
          </span>
        )}
      </div>

      {viewMode === 'grouped' && groupedData ? (
        Object.entries(groupedData).map(([parent, rows]) => (
          <div key={parent} style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              padding: '8px 0',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '8px',
            }}>
              {parent} ({rows.length})
            </div>
            <DataTable
              columns={columns}
              data={rows}
              searchPlaceholder={searchPlaceholder}
              renderExpandedRow={(row) =>
                expandedRows.has(row.original.subItem) ? (
                  <ExpandableRow row={row.original} isExpanded={true} onToggle={() => {}} />
                ) : null
              }
              getRowClassName={(row) =>
                (row.original.ratings?.xriskImpact ?? 0) > 70 ? 'high-priority-row' : ''
              }
            />
          </div>
        ))
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder={searchPlaceholder}
          renderExpandedRow={(row) =>
            expandedRows.has(row.original.subItem) ? (
              <ExpandableRow row={row.original} isExpanded={true} onToggle={() => {}} />
            ) : null
          }
          getRowClassName={(row) =>
            (row.original.ratings?.xriskImpact ?? 0) > 70 ? 'high-priority-row' : ''
          }
        />
      )}
    </div>
  );
}

export default function TransitionModelTable() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('flat');

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const causeRows = useMemo(() => extractSubItems(parameterNodes, 'cause'), []);
  const intermediateRows = useMemo(() => extractSubItems(parameterNodes, 'intermediate'), []);
  const effectRows = useMemo(() => extractSubItems(parameterNodes, 'effect'), []);

  const causeColumns = useMemo(() => createCauseColumns(expandedRows, toggleRow), [expandedRows]);
  const intermediateColumns = useMemo(() => createIntermediateColumns(expandedRows, toggleRow), [expandedRows]);
  const effectColumns = useMemo(() => createEffectColumns(expandedRows, toggleRow), [expandedRows]);

  return (
    <div>
      {/* View mode toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px',
        gap: '8px',
      }}>
        <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>View:</span>
        <button
          onClick={() => setViewMode('flat')}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            background: viewMode === 'flat' ? '#1e40af' : 'white',
            color: viewMode === 'flat' ? 'white' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Flat
        </button>
        <button
          onClick={() => setViewMode('grouped')}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            background: viewMode === 'grouped' ? '#1e40af' : 'white',
            color: viewMode === 'grouped' ? 'white' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Grouped
        </button>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        fontSize: '12px',
        color: '#64748b',
        alignItems: 'center',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
          }} />
          High X-risk impact (&gt;70)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '16px',
            height: '16px',
            border: '1px solid #e2e8f0',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
          }}>+</span>
          Click to expand description
        </span>
      </div>

      <style>{`
        .high-priority-row {
          background-color: #fef2f2 !important;
        }
        .high-priority-row:hover {
          background-color: #fee2e2 !important;
        }
      `}</style>

      <TableSection
        title="Root Factors"
        data={causeRows}
        columns={causeColumns}
        tierType="cause"
        searchPlaceholder="Search root factors..."
        expandedRows={expandedRows}
        viewMode={viewMode}
      />
      <TableSection
        title="Ultimate Scenarios"
        data={intermediateRows}
        columns={intermediateColumns}
        tierType="intermediate"
        searchPlaceholder="Search scenarios..."
        expandedRows={expandedRows}
        viewMode={viewMode}
      />
      <TableSection
        title="Ultimate Outcomes"
        data={effectRows}
        columns={effectColumns}
        tierType="effect"
        searchPlaceholder="Search outcomes..."
        expandedRows={expandedRows}
        viewMode={viewMode}
      />
    </div>
  );
}
