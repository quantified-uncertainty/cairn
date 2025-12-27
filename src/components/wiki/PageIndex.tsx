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
  lastUpdated: string | null
}

interface PageIndexProps {
  showSearch?: boolean
  filterCategory?: string
  maxItems?: number
  title?: string
}

function QualityCell({ quality }: { quality: number | null }) {
  if (quality === null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn(
      "inline-flex items-center justify-center w-6 h-6 rounded text-sm font-medium",
      quality >= 4 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
      quality >= 3 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
      quality >= 2 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    )}>
      {quality}
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
    accessorKey: "quality",
    header: ({ column }) => <SortableHeader column={column}>Quality</SortableHeader>,
    cell: ({ row }) => <QualityCell quality={row.getValue("quality")} />,
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
    let noRating = 0
    pages.forEach(p => {
      if (p.quality !== null && p.quality >= 1 && p.quality <= 5) {
        byQuality[p.quality]++
      } else {
        noRating++
      }
    })
    return { total: pages.length, byQuality, noRating }
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
        {[5, 4, 3, 2, 1].map(q => (
          <div key={q} className={cn(
            "flex flex-col border-l-2 pl-3",
            q === 5 ? "border-l-emerald-500" :
            q === 4 ? "border-l-emerald-400" :
            q === 3 ? "border-l-blue-500" :
            q === 2 ? "border-l-amber-500" :
            "border-l-slate-400"
          )}>
            <span className="text-2xl font-bold">{stats.byQuality[q]}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{q} Star</span>
          </div>
        ))}
        <div className="flex flex-col border-l-2 border-l-slate-300 pl-3">
          <span className="text-2xl font-bold">{stats.noRating}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">No Rating</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search pages..."
        defaultSorting={[{ id: "quality", desc: true }]}
      />
    </div>
  )
}

export default PageIndex
