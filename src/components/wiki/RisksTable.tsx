"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { categoryConfig, type RiskCategory } from "./RiskCategoryIcon"
import type { RiskTableLikelihood, RiskTableTimeframe, RiskTableSolution } from "@/data/index"

interface Risk {
  id: string
  title: string
  severity?: string
  likelihood?: RiskTableLikelihood
  timeframe?: RiskTableTimeframe
  maturity?: string
  category: string
  causalLevel?: 'outcome' | 'pathway' | 'amplifier' | null
  relatedSolutions: RiskTableSolution[]
  importance: number | null
}

interface RisksTableProps {
  risks: Risk[]
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "danger" | "warning" | "success" | "info" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    info: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  }
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", variants[variant])}>
      {children}
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

  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", colorClass)}>
      {Math.round(value)}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const variants: Record<string, "danger" | "warning" | "info" | "default"> = {
    accident: "warning",
    misuse: "danger",
    structural: "info",
    epistemic: "default",
  }
  const config = categoryConfig[category as RiskCategory]
  return <Badge variant={variants[category] || "default"}>{config?.label || category}</Badge>
}

function CausalLevelBadge({ level }: { level?: 'outcome' | 'pathway' | 'amplifier' | null }) {
  if (!level) return <span className="text-muted-foreground">—</span>
  const config: Record<string, { label: string; variant: "danger" | "warning" | "info" }> = {
    outcome: { label: "Outcome", variant: "danger" },
    pathway: { label: "Pathway", variant: "warning" },
    amplifier: { label: "Amplifier", variant: "info" },
  }
  const { label, variant } = config[level] || { label: level, variant: "info" as const }
  return <Badge variant={variant}>{label}</Badge>
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <span className="text-muted-foreground">—</span>
  const normalized = severity.toLowerCase()
  let variant: "danger" | "warning" | "info" | "success" | "default" = "default"
  if (normalized.includes("catastrophic") || normalized.includes("critical")) variant = "danger"
  else if (normalized.includes("high") && !normalized.includes("medium")) variant = "warning"
  else if (normalized.includes("medium")) variant = "info"
  else if (normalized.includes("low")) variant = "success"
  return <Badge variant={variant}>{severity}</Badge>
}

function LikelihoodCell({ likelihood }: { likelihood?: RiskTableLikelihood }) {
  if (!likelihood) return <span className="text-muted-foreground">—</span>
  const displayText = likelihood.display || likelihood.level || '—'
  return <span className="text-sm">{displayText}</span>
}

function TimeframeCell({ timeframe }: { timeframe?: RiskTableTimeframe }) {
  if (!timeframe) return <span className="text-muted-foreground">—</span>
  return <span className="text-sm">{timeframe.display}</span>
}

function MaturityCell({ maturity }: { maturity?: string }) {
  if (!maturity) return <span className="text-muted-foreground">—</span>
  return <span className="text-sm">{maturity}</span>
}

function SolutionsCell({ solutions }: { solutions: RiskTableSolution[] }) {
  if (!solutions || solutions.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {solutions.slice(0, 2).map((solution) => (
        <a
          key={solution.id}
          href={solution.href}
          className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:underline"
        >
          {solution.title}
        </a>
      ))}
      {solutions.length > 2 && (
        <span className="text-xs text-muted-foreground">+{solutions.length - 2}</span>
      )}
    </div>
  )
}

const columns: ColumnDef<Risk>[] = [
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
    accessorKey: "causalLevel",
    header: ({ column }) => <SortableHeader column={column}>Level</SortableHeader>,
    cell: ({ row }) => <CausalLevelBadge level={row.getValue("causalLevel")} />,
    sortingFn: (rowA, rowB) => {
      const order: Record<string, number> = { outcome: 3, pathway: 2, amplifier: 1 }
      const a = rowA.getValue("causalLevel") as string | null
      const b = rowB.getValue("causalLevel") as string | null
      return (a ? order[a] || 0 : 0) - (b ? order[b] || 0 : 0)
    },
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
    cell: ({ row }) => <LikelihoodCell likelihood={row.getValue("likelihood")} />,
    sortingFn: (rowA, rowB) => {
      const levelOrder: Record<string, number> = {
        "low": 1, "medium": 2, "medium-high": 3, "high": 4, "very-high": 5, "near-certain": 6,
      }
      const a = rowA.getValue("likelihood") as RiskTableLikelihood | undefined
      const b = rowB.getValue("likelihood") as RiskTableLikelihood | undefined
      return (a ? (levelOrder[a.level] || 0) : 0) - (b ? (levelOrder[b.level] || 0) : 0)
    },
  },
  {
    accessorKey: "timeframe",
    header: ({ column }) => <SortableHeader column={column}>Timeframe</SortableHeader>,
    cell: ({ row }) => <TimeframeCell timeframe={row.getValue("timeframe")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("timeframe") as RiskTableTimeframe | undefined
      const b = rowB.getValue("timeframe") as RiskTableTimeframe | undefined
      return (a?.median ?? 9999) - (b?.median ?? 9999)
    },
  },
  {
    accessorKey: "maturity",
    header: ({ column }) => <SortableHeader column={column}>Maturity</SortableHeader>,
    cell: ({ row }) => <MaturityCell maturity={row.getValue("maturity")} />,
    sortingFn: (rowA, rowB) => {
      const order: Record<string, number> = {
        "neglected": 1, "under-researched": 1, "minimal": 1,
        "emerging": 2, "early": 2, "nascent": 2,
        "growing": 3, "developing": 3, "active": 3,
        "mature": 4, "established": 4, "well-studied": 4,
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
    cell: ({ row }) => <SolutionsCell solutions={row.getValue("relatedSolutions")} />,
    sortingFn: (rowA, rowB) => {
      const a = (rowA.getValue("relatedSolutions") as RiskTableSolution[] || []).length
      const b = (rowB.getValue("relatedSolutions") as RiskTableSolution[] || []).length
      return a - b
    },
  },
]

type CausalLevel = 'outcome' | 'pathway' | 'amplifier'

const causalLevelConfig: Record<CausalLevel, { label: string; color: string; activeColor: string }> = {
  outcome: {
    label: "Outcomes",
    color: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-300",
    activeColor: "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-500 dark:text-red-200"
  },
  pathway: {
    label: "Pathways",
    color: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
    activeColor: "bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/50 dark:border-amber-500 dark:text-amber-200"
  },
  amplifier: {
    label: "Amplifiers",
    color: "border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300",
    activeColor: "bg-indigo-100 border-indigo-500 text-indigo-800 dark:bg-indigo-900/50 dark:border-indigo-500 dark:text-indigo-200"
  },
}

export function RisksTable({ risks }: RisksTableProps) {
  const [activeLevels, setActiveLevels] = React.useState<Set<CausalLevel>>(new Set(['outcome', 'pathway', 'amplifier']))

  const toggleLevel = (level: CausalLevel) => {
    setActiveLevels(prev => {
      const next = new Set(prev)
      if (next.has(level)) {
        // Don't allow deselecting all - keep at least one active
        if (next.size > 1) {
          next.delete(level)
        }
      } else {
        next.add(level)
      }
      return next
    })
  }

  const filteredRisks = React.useMemo(() => {
    return risks.filter(r => {
      if (!r.causalLevel) return true // Show risks without causalLevel
      return activeLevels.has(r.causalLevel)
    })
  }, [risks, activeLevels])

  const stats = React.useMemo(() => {
    const categories = new Set(filteredRisks.map(r => r.category))
    const bySeverity = {
      catastrophic: filteredRisks.filter(r => {
        const s = r.severity?.toLowerCase() || ""
        return s.includes("catastrophic") || s.includes("critical")
      }).length,
      high: filteredRisks.filter(r => {
        const s = r.severity?.toLowerCase() || ""
        return s.includes("high") && !s.includes("medium")
      }).length,
    }
    const byCategory = Array.from(categories).reduce((acc, cat) => {
      acc[cat] = filteredRisks.filter(r => r.category === cat).length
      return acc
    }, {} as Record<string, number>)
    const byLevel = {
      outcome: risks.filter(r => r.causalLevel === 'outcome').length,
      pathway: risks.filter(r => r.causalLevel === 'pathway').length,
      amplifier: risks.filter(r => r.causalLevel === 'amplifier').length,
    }
    return { total: filteredRisks.length, fullTotal: risks.length, bySeverity, byCategory, byLevel, categories: Array.from(categories).sort() }
  }, [risks, filteredRisks])

  const categoryBorderColors: Record<string, string> = {
    accident: "border-l-amber-500",
    misuse: "border-l-red-500",
    structural: "border-l-indigo-500",
    epistemic: "border-l-slate-500",
  }

  return (
    <div className="space-y-6">
      {/* Filter by Causal Level */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter by level:</span>
        {(Object.keys(causalLevelConfig) as CausalLevel[]).map(level => {
          const config = causalLevelConfig[level]
          const isActive = activeLevels.has(level)
          const count = stats.byLevel[level]
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
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
        {activeLevels.size < 3 && (
          <button
            onClick={() => setActiveLevels(new Set(['outcome', 'pathway', 'amplifier']))}
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
            {stats.total !== stats.fullTotal ? `Showing` : 'Total'}
          </span>
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
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {config?.label || cat}
              </span>
            </div>
          )
        })}
      </div>
      <DataTable columns={columns} data={filteredRisks} searchPlaceholder="Search risks..." />
    </div>
  )
}

export default RisksTable
