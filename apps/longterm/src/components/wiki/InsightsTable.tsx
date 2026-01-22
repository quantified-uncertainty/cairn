"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, Search } from "lucide-react"
import { insights, getInsightStats, getAllTags, getAllTypes, type Insight, type InsightType } from "@/data/insights-data"

interface InsightRow extends Insight {
  composite: number;
}

function RatingCell({ value }: { value: number }) {
  const colorClass = value >= 4.0
    ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200"
    : value >= 3.5
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
    : value >= 3.0
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : value >= 2.0
    ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
    : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"

  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-sm font-medium ${colorClass}`}>
      {value.toFixed(1)}
    </span>
  )
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
      {tag}
    </span>
  )
}

const typeColors: Record<InsightType, string> = {
  'claim': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'research-gap': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'counterintuitive': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'quantitative': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'disagreement': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'neglected': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

function TypeBadge({ type }: { type: InsightType }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[type] || 'bg-slate-100'}`}>
      {type}
    </span>
  )
}

function SortButton({ label, sorted, onClick }: { label: string; sorted: false | 'asc' | 'desc'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground text-muted-foreground font-medium text-sm"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sorted ? 'text-foreground' : ''}`} />
    </button>
  )
}

const columns: ColumnDef<InsightRow>[] = [
  { accessorKey: "composite", header: "Score" },
  { accessorKey: "insight", header: "Insight" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "surprising", header: "Surp" },
  { accessorKey: "important", header: "Imp" },
  { accessorKey: "actionable", header: "Act" },
  { accessorKey: "neglected", header: "Negl" },
  { accessorKey: "source", header: "Source" },
]

export function InsightsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "composite", desc: true }])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<InsightType | "all">("all")
  const [sortField, setSortField] = React.useState<"composite" | "surprising" | "important" | "actionable" | "neglected">("composite")

  const data = React.useMemo<InsightRow[]>(() => {
    let filtered = insights.map(insight => ({
      ...insight,
      composite: insight.composite || 0,
    }))

    if (typeFilter !== "all") {
      filtered = filtered.filter(i => i.type === typeFilter)
    }

    return filtered
  }, [typeFilter])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: { sorting, globalFilter },
  })

  const stats = React.useMemo(() => getInsightStats(), [])
  const tags = React.useMemo(() => getAllTags(), [])
  const types = React.useMemo(() => getAllTypes(), [])

  // Handle sort change
  const handleSort = (field: typeof sortField) => {
    setSortField(field)
    setSorting([{ id: field, desc: true }])
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg text-sm">
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase">Total</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold">{stats.avgSurprising}</span>
          <span className="text-xs text-muted-foreground uppercase">Avg Surp</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold">{stats.avgImportant}</span>
          <span className="text-xs text-muted-foreground uppercase">Avg Imp</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold">{stats.avgActionable}</span>
          <span className="text-xs text-muted-foreground uppercase">Avg Act</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold">{stats.avgNeglected}</span>
          <span className="text-xs text-muted-foreground uppercase">Avg Negl</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search insights..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as InsightType | "all")}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="all">All types</option>
          {types.map(t => (
            <option key={t} value={t}>{t} ({stats.byType[t] || 0})</option>
          ))}
        </select>

        <select
          value={sortField}
          onChange={(e) => handleSort(e.target.value as typeof sortField)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="composite">Sort: Composite</option>
          <option value="surprising">Sort: Surprising</option>
          <option value="important">Sort: Important</option>
          <option value="actionable">Sort: Actionable</option>
          <option value="neglected">Sort: Neglected</option>
        </select>

        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} insights
        </span>
      </div>

      {/* Type badges */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${typeFilter === "all" ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}
        >
          All ({stats.total})
        </button>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${typeFilter === t ? typeColors[t].replace('100', '300').replace('900/30', '700') : typeColors[t]}`}
          >
            {t} ({stats.byType[t] || 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-2 py-2 text-left w-14">
                <SortButton
                  label="Score"
                  sorted={sorting[0]?.id === "composite" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("composite")}
                />
              </th>
              <th className="px-2 py-2 text-left w-20">
                <span className="text-muted-foreground font-medium text-sm">Type</span>
              </th>
              <th className="px-2 py-2 text-left">
                <span className="text-muted-foreground font-medium text-sm">Insight</span>
              </th>
              <th className="px-2 py-2 text-left w-14">
                <SortButton
                  label="Surp"
                  sorted={sorting[0]?.id === "surprising" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("surprising")}
                />
              </th>
              <th className="px-2 py-2 text-left w-14">
                <SortButton
                  label="Imp"
                  sorted={sorting[0]?.id === "important" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("important")}
                />
              </th>
              <th className="px-2 py-2 text-left w-14">
                <SortButton
                  label="Act"
                  sorted={sorting[0]?.id === "actionable" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("actionable")}
                />
              </th>
              <th className="px-2 py-2 text-left w-14">
                <SortButton
                  label="Negl"
                  sorted={sorting[0]?.id === "neglected" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("neglected")}
                />
              </th>
              <th className="px-2 py-2 text-left w-28">
                <span className="text-muted-foreground font-medium text-sm">Source</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/30">
                <td className="px-2 py-2 align-top">
                  <RatingCell value={row.getValue("composite")} />
                </td>
                <td className="px-2 py-2 align-top">
                  <TypeBadge type={row.original.type} />
                </td>
                <td className="px-2 py-2 align-top">
                  <div>
                    <p className="text-sm leading-relaxed">{row.getValue("insight")}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.original.tags.map(tag => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2 align-top">
                  <RatingCell value={row.getValue("surprising")} />
                </td>
                <td className="px-2 py-2 align-top">
                  <RatingCell value={row.getValue("important")} />
                </td>
                <td className="px-2 py-2 align-top">
                  <RatingCell value={row.getValue("actionable")} />
                </td>
                <td className="px-2 py-2 align-top">
                  <RatingCell value={row.getValue("neglected")} />
                </td>
                <td className="px-2 py-2 align-top">
                  {(() => {
                    const source = row.getValue("source") as string
                    const parts = source.split('/')
                    const label = parts[parts.length - 1] || parts[parts.length - 2]
                    return (
                      <a href={source} className="text-primary hover:underline text-xs">
                        {label}
                      </a>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InsightsTable
