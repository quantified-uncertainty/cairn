"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { pages, type Page } from "../../data"

interface PageRow {
  path: string
  title: string
  category: string
  quality: number | null
  importance: number | null
  lastUpdated: string | null
}

interface PageIndexProps {
  showSearch?: boolean
  filterCategory?: string
  maxItems?: number
  title?: string
}

function QualityCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>

  const colorClass = value >= 4
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
    : value >= 3
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    : value >= 2
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

  return (
    <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded text-sm font-medium", colorClass)}>
      {value}
    </span>
  )
}

function ImportanceCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>

  // 0-100 scale: 90+ essential, 70-89 high, 50-69 useful, 30-49 reference, <30 peripheral
  const colorClass = value >= 90
    ? "bg-purple-200 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200"
    : value >= 70
    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
    : value >= 50
    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    : value >= 30
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

  // Display as integer for cleaner look
  const displayValue = Math.round(value)

  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", colorClass)}>
      {displayValue}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const variants: Record<string, string> = {
    risks: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    responses: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    models: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    capabilities: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    cruxes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    history: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    organizations: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    people: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  }
  const colorClass = variants[category] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", colorClass)}>
      {displayName}
    </span>
  )
}

const columns: ColumnDef<PageRow>[] = [
  {
    accessorKey: "importance",
    header: ({ column }) => <SortableHeader column={column}>Imp</SortableHeader>,
    cell: ({ row }) => <ImportanceCell value={row.getValue("importance")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("importance") as number | null
      const b = rowB.getValue("importance") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "quality",
    header: ({ column }) => <SortableHeader column={column}>Qual</SortableHeader>,
    cell: ({ row }) => <QualityCell value={row.getValue("quality")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("quality") as number | null
      const b = rowB.getValue("quality") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
    cell: ({ row }) => (
      <a href={row.original.path} className="text-primary hover:underline font-medium">
        {row.getValue("title")}
      </a>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
    cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
  },
  {
    accessorKey: "lastUpdated",
    header: ({ column }) => <SortableHeader column={column}>Updated</SortableHeader>,
    cell: ({ row }) => <span className="text-sm">{row.getValue("lastUpdated") || "—"}</span>,
  },
]

export function PageIndex({ showSearch = true, filterCategory, maxItems, title }: PageIndexProps) {
  const data = React.useMemo(() => {
    let result = pages.map(p => ({
      path: p.path,
      title: p.title,
      category: p.category,
      quality: p.quality,
      importance: p.importance,
      lastUpdated: p.lastUpdated,
    }))

    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory)
    }

    if (maxItems) {
      result = result.slice(0, maxItems)
    }

    return result
  }, [filterCategory, maxItems])

  const stats = React.useMemo(() => {
    const byQuality: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    // Importance ranges: 90-100, 70-89, 50-69, 30-49, 0-29
    const byImportanceRange = { "90+": 0, "70-89": 0, "50-69": 0, "30-49": 0, "<30": 0 }
    let noQuality = 0
    let noImportance = 0
    let importanceSum = 0

    pages.forEach(p => {
      if (p.quality !== null && p.quality >= 1 && p.quality <= 5) {
        byQuality[p.quality]++
      } else {
        noQuality++
      }
      if (p.importance !== null && p.importance >= 0) {
        importanceSum += p.importance
        if (p.importance >= 90) byImportanceRange["90+"]++
        else if (p.importance >= 70) byImportanceRange["70-89"]++
        else if (p.importance >= 50) byImportanceRange["50-69"]++
        else if (p.importance >= 30) byImportanceRange["30-49"]++
        else byImportanceRange["<30"]++
      } else {
        noImportance++
      }
    })

    const withImportance = pages.length - noImportance
    const avgImportance = withImportance > 0
      ? (importanceSum / withImportance).toFixed(1)
      : "—"

    return { total: pages.length, byQuality, byImportanceRange, noQuality, noImportance, withImportance, avgImportance }
  }, [])

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-bold">{title}</h2>}

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-purple-500 pl-3">
          <span className="text-2xl font-bold">{stats.withImportance}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">With Importance</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-purple-400 pl-3">
          <span className="text-2xl font-bold">{stats.avgImportance}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Importance</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-emerald-500 pl-3">
          <span className="text-2xl font-bold">{stats.total - stats.noQuality}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">With Quality</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search pages..."
        defaultSorting={[{ id: "importance", desc: true }]}
      />
    </div>
  )
}

export default PageIndex
