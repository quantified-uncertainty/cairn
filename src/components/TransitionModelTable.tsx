"use client"

// Embeddable table component for AI Transition Model - no navigation wrapper
import { useMemo } from 'react';
import type { ColumnDef } from "@tanstack/react-table"
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

// Parameter text - plain styled text, no background
function ParamText({ children, tier }: { children: React.ReactNode; tier: 'cause' | 'intermediate' | 'effect' }) {
  const colors: Record<string, string> = {
    cause: '#1e40af',
    intermediate: '#6d28d9',
    effect: '#92400e',
  };
  return (
    <span style={{
      fontSize: '13px',
      fontWeight: 500,
      color: colors[tier],
    }}>
      {children}
    </span>
  );
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

// Column definitions for Root Factors
const causeColumns: ColumnDef<SubItemRow>[] = [
  {
    accessorKey: "subItem",
    header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
    cell: ({ row }) => <ParamText tier="cause">{row.getValue("subItem")}</ParamText>,
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
];

// Column definitions for Ultimate Scenarios
const intermediateColumns: ColumnDef<SubItemRow>[] = [
  {
    accessorKey: "subItem",
    header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
    cell: ({ row }) => <ParamText tier="intermediate">{row.getValue("subItem")}</ParamText>,
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
];

// Column definitions for Ultimate Outcomes
const effectColumns: ColumnDef<SubItemRow>[] = [
  {
    accessorKey: "subItem",
    header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
    cell: ({ row }) => <ParamText tier="effect">{row.getValue("subItem")}</ParamText>,
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
];

function TableSection({
  title,
  data,
  columns,
  tierType,
  searchPlaceholder,
}: {
  title: string;
  data: SubItemRow[];
  columns: ColumnDef<SubItemRow>[];
  tierType: 'cause' | 'intermediate' | 'effect';
  searchPlaceholder: string;
}) {
  if (data.length === 0) return null;

  const headerColors = {
    cause: { background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)', color: '#1e40af' },
    intermediate: { background: 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%)', color: '#7c3aed' },
    effect: { background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)', color: '#a16207' },
  };

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
        ...headerColors[tierType],
      }}>
        {title}
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}

export default function TransitionModelTable() {
  const causeRows = useMemo(() => extractSubItems(parameterNodes, 'cause'), []);
  const intermediateRows = useMemo(() => extractSubItems(parameterNodes, 'intermediate'), []);
  const effectRows = useMemo(() => extractSubItems(parameterNodes, 'effect'), []);

  return (
    <div>
      <TableSection
        title="Root Factors"
        data={causeRows}
        columns={causeColumns}
        tierType="cause"
        searchPlaceholder="Search root factors..."
      />
      <TableSection
        title="Ultimate Scenarios"
        data={intermediateRows}
        columns={intermediateColumns}
        tierType="intermediate"
        searchPlaceholder="Search scenarios..."
      />
      <TableSection
        title="Ultimate Outcomes"
        data={effectRows}
        columns={effectColumns}
        tierType="effect"
        searchPlaceholder="Search outcomes..."
      />
    </div>
  );
}
