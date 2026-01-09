"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { cn } from "@/lib/utils"
import { categoryConfig, type RiskCategory } from "./RiskCategoryIcon"
import type { RiskTableLikelihood, RiskTableTimeframe, RiskTableSolution } from "@/data/index"
import { Badge } from "./shared/Badge"
import { EmptyCell } from "./shared/EmptyCell"
import { ImportanceScoreCell } from "./shared/ScoreCell"
import { InterventionItemsCell } from "./shared/ItemsCell"
import { SeverityBadge } from "./shared/SeverityBadge"
import { StatBox, PrimaryStatBox, StatsSummary } from "./shared/StatBox"
import { useToggleSet } from "./shared/useToggleSet"
import { riskCategoryColors, causalLevelColors, severitySortOrder, likelihoodSortOrder, maturitySortOrder, causalLevelSortOrder } from "./shared/style-config"

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

function CategoryBadge({ category }: { category: string }) {
  const config = categoryConfig[category as RiskCategory]
  const colorConfig = riskCategoryColors[category as keyof typeof riskCategoryColors]
  return <Badge variant={colorConfig?.variant || "default"}>{config?.label || category}</Badge>
}

function CausalLevelBadge({ level }: { level?: 'outcome' | 'pathway' | 'amplifier' | null }) {
  if (!level) return <EmptyCell />
  const config = causalLevelColors[level]
  return <Badge variant={config?.variant || "info"}>{config?.label || level}</Badge>
}

function LikelihoodCell({ likelihood }: { likelihood?: RiskTableLikelihood }) {
  if (!likelihood) return <EmptyCell />
  const displayText = likelihood.display || likelihood.level || '—'
  return <span className="text-sm">{displayText}</span>
}

function TimeframeCell({ timeframe }: { timeframe?: RiskTableTimeframe }) {
  if (!timeframe) return <EmptyCell />
  return <span className="text-sm">{timeframe.display}</span>
}

function MaturityCell({ maturity }: { maturity?: string }) {
  if (!maturity) return <EmptyCell />
  return <span className="text-sm">{maturity}</span>
}

const columns: ColumnDef<Risk>[] = [
  {
    accessorKey: "importance",
    header: ({ column }) => <SortableHeader column={column}>Imp</SortableHeader>,
    cell: ({ row }) => <ImportanceScoreCell value={row.getValue("importance")} />,
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
      const a = rowA.getValue("causalLevel") as string | null
      const b = rowB.getValue("causalLevel") as string | null
      return (a ? causalLevelSortOrder[a] || 0 : 0) - (b ? causalLevelSortOrder[b] || 0 : 0)
    },
  },
  {
    accessorKey: "severity",
    header: ({ column }) => <SortableHeader column={column}>Severity</SortableHeader>,
    cell: ({ row }) => <SeverityBadge severity={row.getValue("severity")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("severity") as string || ""
      const b = rowB.getValue("severity") as string || ""
      const aKey = a.toLowerCase().split(" ")[0]
      const bKey = b.toLowerCase().split(" ")[0]
      return (severitySortOrder[aKey] || 0) - (severitySortOrder[bKey] || 0)
    },
  },
  {
    accessorKey: "likelihood",
    header: ({ column }) => <SortableHeader column={column}>Likelihood</SortableHeader>,
    cell: ({ row }) => <LikelihoodCell likelihood={row.getValue("likelihood")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("likelihood") as RiskTableLikelihood | undefined
      const b = rowB.getValue("likelihood") as RiskTableLikelihood | undefined
      return (a ? (likelihoodSortOrder[a.level] || 0) : 0) - (b ? (likelihoodSortOrder[b.level] || 0) : 0)
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
      const a = (rowA.getValue("maturity") as string || "").toLowerCase()
      const b = (rowB.getValue("maturity") as string || "").toLowerCase()
      const getScore = (val: string) => {
        for (const [key, score] of Object.entries(maturitySortOrder)) {
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
    cell: ({ row }) => <InterventionItemsCell items={row.getValue("relatedSolutions")} />,
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

const allCausalLevels: CausalLevel[] = ['outcome', 'pathway', 'amplifier']

export function RisksTable({ risks }: RisksTableProps) {
  const { active: activeLevels, toggle: toggleLevel, reset: resetLevels, isAllActive } = useToggleSet(allCausalLevels)

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
        {!isAllActive && (
          <button
            onClick={resetLevels}
            className="px-3 py-1.5 rounded-full text-sm font-medium border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Show All
          </button>
        )}
      </div>
      {/* Stats Summary */}
      <StatsSummary>
        <PrimaryStatBox value={stats.total} label={stats.total !== stats.fullTotal ? 'Showing' : 'Total'} />
        <StatBox value={stats.bySeverity.catastrophic} label="Catastrophic" borderColor="border-l-red-500" />
        <StatBox value={stats.bySeverity.high} label="High" borderColor="border-l-amber-500" />
        {stats.categories.map(cat => {
          const config = categoryConfig[cat as RiskCategory]
          const colorConfig = riskCategoryColors[cat as keyof typeof riskCategoryColors]
          return (
            <StatBox
              key={cat}
              value={stats.byCategory[cat]}
              label={config?.label || cat}
              borderColor={colorConfig?.borderColor}
            />
          )
        })}
      </StatsSummary>
      <DataTable columns={columns} data={filteredRisks} searchPlaceholder="Search risks..." />
    </div>
  )
}

export default RisksTable
