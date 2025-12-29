"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"

type ParameterCategory = 'alignment' | 'governance' | 'societal' | 'resilience'

interface RelatedItem {
  id: string
  title: string
  href: string
}

interface Parameter {
  id: string
  title: string
  category: ParameterCategory
  direction: 'higher' | 'lower' | 'context'
  trend: string
  risks: RelatedItem[]
  interventions: RelatedItem[]
  // ITN framework (0-100 scale)
  importance?: number
  tractability?: number
  neglectedness?: number
  uncertainty?: number
}

interface ParametersTableProps {
  parameters: Parameter[]
}

const categoryConfig: Record<ParameterCategory, { label: string; color: string; activeColor: string }> = {
  alignment: {
    label: "Alignment",
    color: "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300",
    activeColor: "bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/50 dark:border-purple-500 dark:text-purple-200"
  },
  governance: {
    label: "Governance",
    color: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300",
    activeColor: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-200"
  },
  societal: {
    label: "Societal",
    color: "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300",
    activeColor: "bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-200"
  },
  resilience: {
    label: "Resilience",
    color: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
    activeColor: "bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/50 dark:border-amber-500 dark:text-amber-200"
  },
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "purple" | "blue" | "emerald" | "amber" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  }
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", variants[variant])}>
      {children}
    </span>
  )
}

function CategoryBadge({ category }: { category: ParameterCategory }) {
  const variants: Record<ParameterCategory, "purple" | "blue" | "emerald" | "amber"> = {
    alignment: "purple",
    governance: "blue",
    societal: "emerald",
    resilience: "amber",
  }
  const config = categoryConfig[category]
  return <Badge variant={variants[category]}>{config?.label || category}</Badge>
}

function DirectionCell({ direction }: { direction: 'higher' | 'lower' | 'context' }) {
  const labels: Record<string, { icon: string; text: string; iconColor: string; textColor: string }> = {
    higher: {
      icon: "▲",
      text: "Higher is better",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      textColor: "text-slate-600 dark:text-slate-400"
    },
    lower: {
      icon: "▼",
      text: "Lower is better",
      iconColor: "text-blue-500 dark:text-blue-400",
      textColor: "text-slate-600 dark:text-slate-400"
    },
    context: {
      icon: "◆",
      text: "Context-dependent",
      iconColor: "text-amber-500 dark:text-amber-400",
      textColor: "text-slate-600 dark:text-slate-400"
    },
  }
  const config = labels[direction] || labels.higher
  return (
    <span className="text-sm font-medium flex items-center gap-1.5">
      <span className={cn("text-base", config.iconColor)}>{config.icon}</span>
      <span className={config.textColor}>{config.text}</span>
    </span>
  )
}

function TrendCell({ trend }: { trend: string }) {
  const normalized = trend.toLowerCase()
  let color = "text-slate-600 dark:text-slate-400"
  if (normalized.includes("declining") || normalized.includes("widening") || normalized.includes("accelerating") || normalized.includes("stressed")) {
    color = "text-red-600 dark:text-red-400"
  } else if (normalized.includes("improving")) {
    color = "text-emerald-600 dark:text-emerald-400"
  } else if (normalized.includes("mixed") || normalized.includes("fragile")) {
    color = "text-amber-600 dark:text-amber-400"
  }
  return <span className={cn("text-sm", color)}>{trend}</span>
}

function RelatedItemsCell({ items, variant }: { items: RelatedItem[]; variant: 'risk' | 'intervention' }) {
  if (!items || items.length === 0) return <span className="text-muted-foreground">—</span>

  const colorClass = variant === 'risk'
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"

  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 3).map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium transition-colors", colorClass)}
        >
          {item.title}
        </a>
      ))}
      {items.length > 3 && (
        <span className="text-xs text-muted-foreground">+{items.length - 3}</span>
      )}
    </div>
  )
}

// Compute priority score from ITN components (geometric mean, adjusted by uncertainty)
function computePriorityScore(importance?: number, tractability?: number, neglectedness?: number, uncertainty?: number): number | null {
  if (importance === undefined || tractability === undefined || neglectedness === undefined) return null
  // Geometric mean of I, T, N
  const base = Math.pow(importance * tractability * neglectedness, 1/3)
  // Uncertainty reduces confidence but doesn't directly reduce score
  // Instead we might show it separately or use it for a confidence interval
  return Math.round(base)
}

// Get color for a score value
function getScoreColor(value: number): string {
  if (value >= 70) return "text-emerald-600 dark:text-emerald-400"
  if (value >= 50) return "text-blue-600 dark:text-blue-400"
  if (value >= 30) return "text-amber-600 dark:text-amber-400"
  return "text-slate-500 dark:text-slate-400"
}

// Small inline bar for ITN breakdown
function MiniBar({ value, label }: { value?: number; label: string }) {
  if (value === undefined) return null
  const width = Math.max(4, value) // minimum width for visibility
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="w-3 text-muted-foreground">{label}</span>
      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-slate-500 dark:bg-slate-400 rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-6 text-right text-muted-foreground">{value}</span>
    </div>
  )
}

function PriorityCell({ importance, tractability, neglectedness, uncertainty }: {
  importance?: number
  tractability?: number
  neglectedness?: number
  uncertainty?: number
}) {
  const score = computePriorityScore(importance, tractability, neglectedness, uncertainty)

  if (score === null) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  return (
    <div className="group relative">
      <div className="flex items-center gap-2">
        <span className={cn("text-lg font-semibold", getScoreColor(score))}>{score}</span>
        {uncertainty !== undefined && uncertainty >= 60 && (
          <span className="text-xs text-amber-500" title="High uncertainty">±</span>
        )}
      </div>
      {/* Tooltip with breakdown */}
      <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-popover border rounded-md shadow-lg p-2 min-w-[140px]">
        <div className="text-xs font-medium mb-1.5 text-foreground">ITN Breakdown</div>
        <div className="space-y-1">
          <MiniBar value={importance} label="I" />
          <MiniBar value={tractability} label="T" />
          <MiniBar value={neglectedness} label="N" />
          {uncertainty !== undefined && (
            <div className="pt-1 border-t mt-1">
              <MiniBar value={uncertainty} label="?" />
              <div className="text-[10px] text-muted-foreground mt-0.5">Uncertainty</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const columns: ColumnDef<Parameter>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column}>Parameter</SortableHeader>,
    cell: ({ row }) => (
      <a
        href={`/knowledge-base/parameters/${row.original.id}/`}
        className="text-primary hover:underline font-medium"
      >
        {row.getValue("title")}
      </a>
    ),
  },
  {
    id: "priority",
    header: ({ column }) => <SortableHeader column={column}>Priority</SortableHeader>,
    accessorFn: (row) => computePriorityScore(row.importance, row.tractability, row.neglectedness, row.uncertainty),
    cell: ({ row }) => (
      <PriorityCell
        importance={row.original.importance}
        tractability={row.original.tractability}
        neglectedness={row.original.neglectedness}
        uncertainty={row.original.uncertainty}
      />
    ),
    sortingFn: (rowA, rowB) => {
      const a = computePriorityScore(rowA.original.importance, rowA.original.tractability, rowA.original.neglectedness) ?? -1
      const b = computePriorityScore(rowB.original.importance, rowB.original.tractability, rowB.original.neglectedness) ?? -1
      return a - b
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
    cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => <DirectionCell direction={row.getValue("direction")} />,
  },
  {
    accessorKey: "trend",
    header: ({ column }) => <SortableHeader column={column}>Trend</SortableHeader>,
    cell: ({ row }) => <TrendCell trend={row.getValue("trend")} />,
    sortingFn: (rowA, rowB) => {
      const order: Record<string, number> = {
        "declining": 1, "widening": 1, "accelerating": 1, "stressed": 1,
        "mixed": 2, "fragile": 2,
        "improving": 3, "stable": 3,
      }
      const getScore = (val: string) => {
        const lower = val.toLowerCase()
        for (const [key, score] of Object.entries(order)) {
          if (lower.includes(key)) return score
        }
        return 2
      }
      return getScore(rowA.getValue("trend")) - getScore(rowB.getValue("trend"))
    },
  },
  {
    accessorKey: "risks",
    header: "Threatened By",
    cell: ({ row }) => <RelatedItemsCell items={row.getValue("risks")} variant="risk" />,
    sortingFn: (rowA, rowB) => {
      const a = (rowA.getValue("risks") as RelatedItem[] || []).length
      const b = (rowB.getValue("risks") as RelatedItem[] || []).length
      return a - b
    },
  },
  {
    accessorKey: "interventions",
    header: "Supported By",
    cell: ({ row }) => <RelatedItemsCell items={row.getValue("interventions")} variant="intervention" />,
    sortingFn: (rowA, rowB) => {
      const a = (rowA.getValue("interventions") as RelatedItem[] || []).length
      const b = (rowB.getValue("interventions") as RelatedItem[] || []).length
      return a - b
    },
  },
]

export function ParametersTable({ parameters }: ParametersTableProps) {
  const [activeCategories, setActiveCategories] = React.useState<Set<ParameterCategory>>(
    new Set(['alignment', 'governance', 'societal', 'resilience'])
  )

  const toggleCategory = (category: ParameterCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        if (next.size > 1) {
          next.delete(category)
        }
      } else {
        next.add(category)
      }
      return next
    })
  }

  const filteredParameters = React.useMemo(() => {
    return parameters.filter(p => activeCategories.has(p.category))
  }, [parameters, activeCategories])

  const stats = React.useMemo(() => {
    const byCategory = {
      alignment: parameters.filter(p => p.category === 'alignment').length,
      governance: parameters.filter(p => p.category === 'governance').length,
      societal: parameters.filter(p => p.category === 'societal').length,
      resilience: parameters.filter(p => p.category === 'resilience').length,
    }
    const declining = filteredParameters.filter(p => {
      const t = p.trend.toLowerCase()
      return t.includes('declining') || t.includes('widening') || t.includes('accelerating') || t.includes('stressed')
    }).length
    const improving = filteredParameters.filter(p => p.trend.toLowerCase().includes('improving')).length

    return { total: filteredParameters.length, fullTotal: parameters.length, byCategory, declining, improving }
  }, [parameters, filteredParameters])

  const categoryBorderColors: Record<ParameterCategory, string> = {
    alignment: "border-l-purple-500",
    governance: "border-l-blue-500",
    societal: "border-l-emerald-500",
    resilience: "border-l-amber-500",
  }

  return (
    <div className="space-y-6">
      {/* Filter by Category */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
        {(Object.keys(categoryConfig) as ParameterCategory[]).map(category => {
          const config = categoryConfig[category]
          const isActive = activeCategories.has(category)
          const count = stats.byCategory[category]
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all",
                isActive ? config.activeColor : config.color,
                "hover:opacity-80"
              )}
            >
              {config.label} ({count})
            </button>
          )
        })}
        {activeCategories.size < 4 && (
          <button
            onClick={() => setActiveCategories(new Set(['alignment', 'governance', 'societal', 'resilience']))}
            className="px-3 py-1.5 rounded-full text-sm font-medium border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Show All
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {stats.total !== stats.fullTotal ? 'Showing' : 'Total'}
          </span>
        </div>
        <div className="flex flex-col border-l-2 border-l-red-500 pl-3">
          <span className="text-2xl font-bold">{stats.declining}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Declining</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-emerald-500 pl-3">
          <span className="text-2xl font-bold">{stats.improving}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Improving</span>
        </div>
        {(Object.keys(categoryConfig) as ParameterCategory[]).map(cat => (
          <div key={cat} className={cn("flex flex-col border-l-2 pl-3", categoryBorderColors[cat])}>
            <span className="text-2xl font-bold">{stats.byCategory[cat]}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {categoryConfig[cat].label}
            </span>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={filteredParameters} searchPlaceholder="Search parameters..." />
    </div>
  )
}

export default ParametersTable
