"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { entities as allEntities, getEntityHref, getPageById } from "@/data"

interface ModelRow {
  id: string
  title: string
  href: string
  modelType: string | null
  novelty: number | null
  rigor: number | null
  actionability: number | null
  completeness: number | null
  lastUpdated: string | null
}

function RatingCell({ value }: { value: number | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return <span>{value}</span>
}

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
      {type}
    </span>
  )
}

const columns: ColumnDef<ModelRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column}>Model</SortableHeader>,
    cell: ({ row }) => (
      <a
        href={row.original.href}
        className="text-primary hover:underline font-medium"
      >
        {row.getValue("title")}
      </a>
    ),
  },
  {
    accessorKey: "modelType",
    header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
    cell: ({ row }) => <TypeBadge type={row.getValue("modelType")} />,
  },
  {
    accessorKey: "novelty",
    header: ({ column }) => <SortableHeader column={column}>Nov</SortableHeader>,
    cell: ({ row }) => <RatingCell value={row.getValue("novelty")} />,
  },
  {
    accessorKey: "rigor",
    header: ({ column }) => <SortableHeader column={column}>Rig</SortableHeader>,
    cell: ({ row }) => <RatingCell value={row.getValue("rigor")} />,
  },
  {
    accessorKey: "actionability",
    header: ({ column }) => <SortableHeader column={column}>Act</SortableHeader>,
    cell: ({ row }) => <RatingCell value={row.getValue("actionability")} />,
  },
  {
    accessorKey: "completeness",
    header: ({ column }) => <SortableHeader column={column}>Cmp</SortableHeader>,
    cell: ({ row }) => <RatingCell value={row.getValue("completeness")} />,
  },
  {
    accessorKey: "lastUpdated",
    header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
    cell: ({ row }) => row.getValue("lastUpdated") || "—",
  },
]

export function ModelsTable() {
  const data = React.useMemo(() => {
    const models = allEntities.filter(e => e.type === 'model')

    return models.map(model => {
      const page = getPageById(model.id)
      const modelType = model.customFields?.find(f => f.label === 'Model Type')?.value || null
      return {
        id: model.id,
        title: model.title,
        href: getEntityHref(model.id, model.type),
        modelType,
        novelty: page?.ratings?.novelty ?? null,
        rigor: page?.ratings?.rigor ?? null,
        actionability: page?.ratings?.actionability ?? null,
        completeness: page?.ratings?.completeness ?? null,
        lastUpdated: model.lastUpdated ?? page?.lastUpdated ?? null,
      }
    })
  }, [])

  // Stats
  const stats = React.useMemo(() => {
    const total = data.length
    const withRatings = data.filter(m => m.novelty !== null).length
    const avgNovelty = data.filter(m => m.novelty).reduce((sum, m) => sum + (m.novelty || 0), 0) / (withRatings || 1)
    const avgRigor = data.filter(m => m.rigor).reduce((sum, m) => sum + (m.rigor || 0), 0) / (withRatings || 1)

    return { total, withRatings, avgNovelty: avgNovelty.toFixed(1), avgRigor: avgRigor.toFixed(1) }
  }, [data])

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Models</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-indigo-500 pl-3">
          <span className="text-2xl font-bold">{stats.withRatings}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">With Ratings</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-blue-500 pl-3">
          <span className="text-2xl font-bold">{stats.avgNovelty}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Novelty</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-green-500 pl-3">
          <span className="text-2xl font-bold">{stats.avgRigor}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Rigor</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search models..."
      />
    </div>
  )
}

export default ModelsTable
