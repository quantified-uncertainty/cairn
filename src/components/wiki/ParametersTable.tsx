"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { Badge } from "./shared/Badge"
import { EmptyCell } from "./shared/EmptyCell"
import { RiskItemsCell, InterventionItemsCell } from "./shared/ItemsCell"
import { TrendCell } from "./shared/TrendCell"
import { StatBox, PrimaryStatBox, StatsSummary } from "./shared/StatBox"
import { useToggleSet } from "./shared/useToggleSet"
import { parameterCategoryColors, directionLabels, trendSortOrder, type ParameterCategory } from "./shared/style-config"

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

// Category labels for display
const categoryLabels: Record<ParameterCategory, string> = {
  alignment: "Alignment",
  governance: "Governance",
  societal: "Societal",
  resilience: "Resilience",
}

function CategoryBadge({ category }: { category: ParameterCategory }) {
  const config = parameterCategoryColors[category]
  return <Badge variant={config?.variant || "default"}>{categoryLabels[category] || category}</Badge>
}

function DirectionCell({ direction }: { direction: 'higher' | 'lower' | 'context' }) {
  const config = directionLabels[direction] || directionLabels.higher
  return (
    <span className="text-sm font-medium flex items-center gap-1.5">
      <span className={cn("text-base", config.iconColor)}>{config.icon}</span>
      <span className={config.textColor}>{config.text}</span>
    </span>
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
    return <EmptyCell />
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
        href={`/ai-transition-model/factors/${row.original.id}/`}
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
      const getScore = (val: string) => {
        const lower = val.toLowerCase()
        for (const [key, score] of Object.entries(trendSortOrder)) {
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
    cell: ({ row }) => <RiskItemsCell items={row.getValue("risks")} />,
    sortingFn: (rowA, rowB) => {
      const a = (rowA.getValue("risks") as RelatedItem[] || []).length
      const b = (rowB.getValue("risks") as RelatedItem[] || []).length
      return a - b
    },
  },
  {
    accessorKey: "interventions",
    header: "Supported By",
    cell: ({ row }) => <InterventionItemsCell items={row.getValue("interventions")} />,
    sortingFn: (rowA, rowB) => {
      const a = (rowA.getValue("interventions") as RelatedItem[] || []).length
      const b = (rowB.getValue("interventions") as RelatedItem[] || []).length
      return a - b
    },
  },
]

const allCategories: ParameterCategory[] = ['alignment', 'governance', 'societal', 'resilience']

export function ParametersTable({ parameters }: ParametersTableProps) {
  const { active: activeCategories, toggle: toggleCategory, reset: resetCategories, isAllActive } = useToggleSet(allCategories)

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

  return (
    <div className="space-y-6">
      {/* Filter by Category */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
        {(Object.keys(parameterCategoryColors) as ParameterCategory[]).map(category => {
          const config = parameterCategoryColors[category]
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
              {categoryLabels[category]} ({count})
            </button>
          )
        })}
        {!isAllActive && (
          <button
            onClick={resetCategories}
            className="px-3 py-1.5 rounded-full text-sm font-medium border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Show All
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <StatsSummary>
        <PrimaryStatBox value={stats.total} label={stats.total !== stats.fullTotal ? 'Showing' : 'Total'} />
        <StatBox value={stats.declining} label="Declining" borderColor="border-l-red-500" />
        <StatBox value={stats.improving} label="Improving" borderColor="border-l-emerald-500" />
        {(Object.keys(parameterCategoryColors) as ParameterCategory[]).map(cat => (
          <StatBox
            key={cat}
            value={stats.byCategory[cat]}
            label={categoryLabels[cat]}
            borderColor={parameterCategoryColors[cat].borderColor}
          />
        ))}
      </StatsSummary>

      <DataTable columns={columns} data={filteredParameters} searchPlaceholder="Search parameters..." />
    </div>
  )
}

export default ParametersTable
