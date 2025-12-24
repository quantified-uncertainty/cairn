"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { Clock, Timer, CalendarClock, HelpCircle, TrendingUp, TrendingDown, Minus, Sprout, Leaf, TreeDeciduous, CircleDot } from "lucide-react"
import { RiskCategoryBadge, RiskCategoryIcon, categoryConfig, type RiskCategory } from "./RiskCategoryIcon"
import type { RiskTableLikelihood, RiskTableTimeframe, RiskTableSolution } from "@/data/index"

interface Risk {
  id: string
  title: string
  severity?: string
  likelihood?: RiskTableLikelihood
  timeframe?: RiskTableTimeframe
  maturity?: string
  category: string
  relatedSolutions: RiskTableSolution[]
}

interface RisksTableProps {
  risks: Risk[]
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <span className="text-muted-foreground">—</span>

  const normalized = severity.toLowerCase()
  let colorClass = "bg-muted text-muted-foreground"

  if (normalized.includes("catastrophic") || normalized.includes("critical")) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  } else if (normalized.includes("high") && !normalized.includes("medium")) {
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
  } else if (normalized.includes("medium")) {
    colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
  } else if (normalized.includes("low")) {
    colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  }

  return (
    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      {severity}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const validCategory = category as RiskCategory
  if (categoryConfig[validCategory]) {
    return <RiskCategoryBadge category={validCategory} size="sm" />
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium border bg-muted">
      {category}
    </span>
  )
}

function LikelihoodBadge({ likelihood }: { likelihood?: RiskTableLikelihood }) {
  if (!likelihood) return <span className="text-muted-foreground">—</span>

  const level = (likelihood.level || '').toLowerCase()
  let colorClass = "bg-gray-100 text-gray-700"
  let Icon = Minus

  if (level.includes("very-high") || level.includes("near-certain")) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    Icon = TrendingUp
  } else if (level.includes("high") && !level.includes("medium")) {
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    Icon = TrendingUp
  } else if (level.includes("medium")) {
    colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    Icon = Minus
  } else if (level.includes("low")) {
    colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    Icon = TrendingDown
  }

  // Adjust icon based on status if present
  if (likelihood.status === "theoretical") {
    Icon = HelpCircle
  } else if (likelihood.status === "emerging") {
    Icon = TrendingUp
  }

  const displayText = likelihood.display || likelihood.level || '—'

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      <Icon className="h-3 w-3" />
      {displayText}
    </span>
  )
}

function TimeframeBadge({ timeframe }: { timeframe?: RiskTableTimeframe }) {
  if (!timeframe) return <span className="text-muted-foreground">—</span>

  const median = timeframe.median
  let colorClass = "bg-gray-100 text-gray-700"
  let Icon = Clock

  if (median <= 2025) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    Icon = Clock
  } else if (median <= 2027) {
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    Icon = Timer
  } else if (median <= 2030) {
    colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    Icon = Timer
  } else if (median <= 2035) {
    colorClass = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    Icon = CalendarClock
  } else {
    colorClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
    Icon = CalendarClock
  }

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      <Icon className="h-3 w-3" />
      {timeframe.display}
    </span>
  )
}

function MaturityBadge({ maturity }: { maturity?: string }) {
  if (!maturity) return <span className="text-muted-foreground">—</span>

  const normalized = maturity.toLowerCase()
  let colorClass = "bg-gray-100 text-gray-700"
  let Icon = CircleDot

  if (normalized.includes("neglected") || normalized.includes("under-researched") || normalized.includes("minimal")) {
    colorClass = "bg-red-100 text-red-800"
    Icon = CircleDot
  } else if (normalized.includes("emerging") || normalized.includes("early") || normalized.includes("nascent")) {
    colorClass = "bg-amber-100 text-amber-800"
    Icon = Sprout
  } else if (normalized.includes("growing") || normalized.includes("developing") || normalized.includes("active")) {
    colorClass = "bg-blue-100 text-blue-800"
    Icon = Leaf
  } else if (normalized.includes("mature") || normalized.includes("established") || normalized.includes("well-studied")) {
    colorClass = "bg-green-100 text-green-800"
    Icon = TreeDeciduous
  }

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      <Icon className="h-3 w-3" />
      {maturity}
    </span>
  )
}

function SolutionsList({ solutions }: { solutions: RiskTableSolution[] }) {
  if (!solutions || solutions.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {solutions.map((solution) => (
        <a
          key={solution.id}
          href={solution.href}
          className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
        >
          {solution.title}
        </a>
      ))}
    </div>
  )
}

const columns: ColumnDef<Risk>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column}>Risk</SortableHeader>,
    cell: ({ row }) => (
      <a
        href={`/knowledge-base/risks/${row.original.category}/${row.original.id}/`}
        className="text-primary hover:underline font-medium"
      >
        {row.getValue("title")}
      </a>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
    cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "severity",
    header: ({ column }) => <SortableHeader column={column}>Severity</SortableHeader>,
    cell: ({ row }) => <SeverityBadge severity={row.getValue("severity")} />,
    sortingFn: (rowA, rowB) => {
      const order: Record<string, number> = {
        low: 1, medium: 2, "medium-high": 3, high: 4, critical: 5, catastrophic: 6,
      }
      const a = rowA.getValue("severity") as string || ""
      const b = rowB.getValue("severity") as string || ""
      const aKey = a.toLowerCase().split(" ")[0]
      const bKey = b.toLowerCase().split(" ")[0]
      return (order[aKey] || 0) - (order[bKey] || 0)
    },
  },
  {
    accessorKey: "likelihood",
    header: ({ column }) => <SortableHeader column={column}>Likelihood</SortableHeader>,
    cell: ({ row }) => <LikelihoodBadge likelihood={row.getValue("likelihood")} />,
    sortingFn: (rowA, rowB) => {
      const levelOrder: Record<string, number> = {
        "low": 1,
        "medium": 2,
        "medium-high": 3,
        "high": 4,
        "very-high": 5,
        "near-certain": 6,
      }
      const a = rowA.getValue("likelihood") as RiskTableLikelihood | undefined
      const b = rowB.getValue("likelihood") as RiskTableLikelihood | undefined
      const aScore = a ? (levelOrder[a.level] || 0) : 0
      const bScore = b ? (levelOrder[b.level] || 0) : 0
      return aScore - bScore
    },
  },
  {
    accessorKey: "timeframe",
    header: ({ column }) => <SortableHeader column={column}>Timeframe</SortableHeader>,
    cell: ({ row }) => <TimeframeBadge timeframe={row.getValue("timeframe")} />,
    sortingFn: (rowA, rowB) => {
      // Sort by median year directly - earlier years first
      const a = rowA.getValue("timeframe") as RiskTableTimeframe | undefined
      const b = rowB.getValue("timeframe") as RiskTableTimeframe | undefined
      const aMedian = a?.median ?? 9999  // No timeframe sorts last
      const bMedian = b?.median ?? 9999
      return aMedian - bMedian
    },
  },
  {
    accessorKey: "maturity",
    header: ({ column }) => <SortableHeader column={column}>Maturity</SortableHeader>,
    cell: ({ row }) => <MaturityBadge maturity={row.getValue("maturity")} />,
    sortingFn: (rowA, rowB) => {
      const order: Record<string, number> = {
        "neglected": 1,
        "under-researched": 1,
        "minimal": 1,
        "emerging": 2,
        "early": 2,
        "nascent": 2,
        "growing": 3,
        "developing": 3,
        "active": 3,
        "mature": 4,
        "established": 4,
        "well-studied": 4,
      }
      const a = (rowA.getValue("maturity") as string || "").toLowerCase()
      const b = (rowB.getValue("maturity") as string || "").toLowerCase()
      const getScore = (val: string) => {
        for (const [key, score] of Object.entries(order)) {
          if (val.includes(key)) return score
        }
        return 0
      }
      return getScore(a) - getScore(b)
    },
  },
  {
    accessorKey: "relatedSolutions",
    header: "Solutions",
    cell: ({ row }) => <SolutionsList solutions={row.getValue("relatedSolutions")} />,
    sortingFn: (rowA, rowB) => {
      // Sort by number of solutions
      const a = (rowA.getValue("relatedSolutions") as RiskTableSolution[] || []).length
      const b = (rowB.getValue("relatedSolutions") as RiskTableSolution[] || []).length
      return a - b
    },
  },
]

export function RisksTable({ risks }: RisksTableProps) {
  // Stats
  const stats = React.useMemo(() => {
    const categories = new Set(risks.map(r => r.category))
    const bySeverity = {
      catastrophic: risks.filter(r => {
        const s = r.severity?.toLowerCase() || ""
        return s.includes("catastrophic") || s.includes("critical")
      }).length,
      high: risks.filter(r => {
        const s = r.severity?.toLowerCase() || ""
        return s.includes("high") && !s.includes("medium")
      }).length,
    }
    const byCategory = Array.from(categories).reduce((acc, cat) => {
      acc[cat] = risks.filter(r => r.category === cat).length
      return acc
    }, {} as Record<string, number>)

    return { total: risks.length, bySeverity, byCategory, categories: Array.from(categories).sort() }
  }, [risks])

  const categoryBorderColors: Record<string, string> = {
    accident: "border-l-amber-500",
    misuse: "border-l-red-500",
    structural: "border-l-indigo-500",
    epistemic: "border-l-purple-500",
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-red-500 pl-3">
          <span className="text-2xl font-bold">{stats.bySeverity.catastrophic}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Catastrophic</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-amber-500 pl-3">
          <span className="text-2xl font-bold">{stats.bySeverity.high}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">High</span>
        </div>
        {stats.categories.map(cat => {
          const config = categoryConfig[cat as RiskCategory]
          return (
            <div key={cat} className={cn("flex flex-col border-l-2 pl-3", categoryBorderColors[cat])}>
              <span className="text-2xl font-bold">{stats.byCategory[cat]}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                {config && <RiskCategoryIcon category={cat as RiskCategory} size="sm" />}
                {config?.label || cat}
              </span>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={risks}
        searchPlaceholder="Search risks..."
      />
    </div>
  )
}

export default RisksTable
