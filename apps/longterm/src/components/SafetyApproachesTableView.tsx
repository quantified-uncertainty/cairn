"use client"

// Safety Approaches Comparison Table
// Refactored to use TanStack Table + shadcn + Tailwind
// Evaluates safety techniques on whether they actually make the world safer
// vs. primarily enabling more capable (potentially dangerous) systems

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SAFETY_APPROACHES, CATEGORIES } from "@data/safety-approaches-data"
import { columns } from "./tables/safety-approaches-columns"
import {
  getBadgeColorClass,
  categoryColors,
} from "./tables/shared/safety-table-styles"
import { TableInsightsSummary } from "./tables/shared/TableInsightsSummary"

type ViewMode = "unified" | "grouped"

// Category labels for display
const categoryLabels: Record<string, string> = {
  training: "Training & Alignment",
  interpretability: "Interpretability",
  evaluation: "Evaluation",
  architectural: "Architectural",
  governance: "Governance",
  theoretical: "Theoretical",
}

// Legend badge component
function LegendBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold",
        getBadgeColorClass(level)
      )}
    >
      {level}
    </span>
  )
}

export default function SafetyApproachesTableView() {
  const [viewMode, setViewMode] = useState<ViewMode>("unified")
  const [sorting, setSorting] = useState<SortingState>([{ id: "category", desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: SAFETY_APPROACHES,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Group data by category for grouped view
  const groupedData = useMemo(() => {
    const groups: Record<string, typeof SAFETY_APPROACHES> = {}
    for (const approach of SAFETY_APPROACHES) {
      if (!groups[approach.category]) groups[approach.category] = []
      groups[approach.category].push(approach)
    }
    return groups
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-muted/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <a href="/knowledge-base/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Knowledge Base
          </a>
          <span className="text-muted-foreground">|</span>
          <a href="/tables/" className="text-sm text-muted-foreground hover:text-foreground">
            All Tables
          </a>
          <h1 className="flex-1 text-lg font-semibold">
            AI Safety Approaches: Safety vs Capability Tradeoffs
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 space-y-6">
        {/* Related resources */}
        <details className="max-w-4xl">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none">
            Similar tables elsewhere ↗
          </summary>
          <div className="mt-2 pl-4 border-l-2 border-border text-sm space-y-1">
            <div>
              <a
                href="https://futureoflife.org/ai-safety-index-winter-2025/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener"
              >
                FLI AI Safety Index
              </a>{" "}
              – Lab safety scorecards
            </div>
            <div>
              <a
                href="https://metr.org/common-elements"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener"
              >
                METR: Common Elements
              </a>{" "}
              – Policy comparison (12 companies)
            </div>
            <div>
              <a
                href="https://arxiv.org/abs/2310.19852"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener"
              >
                AI Alignment Survey
              </a>{" "}
              – Academic taxonomy
            </div>
          </div>
        </details>

        {/* Intro */}
        <p className="text-muted-foreground max-w-4xl leading-relaxed">
          Comparative analysis of AI safety approaches, with particular attention to the question:{" "}
          <strong className="text-foreground">
            Does this technique actually make the world safer, or does it primarily enable more
            capable systems?
          </strong>
        </p>

        {/* Key insight banner */}
        <Card className="max-w-4xl border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
          <CardContent className="py-3">
            <p className="text-sm">
              <strong className="text-amber-700 dark:text-amber-400">Key insight:</strong> Many
              "safety" techniques have <em>capability uplift</em> as their primary effect. RLHF, for
              example, is what makes ChatGPT useful - its safety benefit is secondary to its
              capability benefit. A technique that provides DOMINANT capability uplift with only LOW
              safety uplift may be net negative for world safety, even if it reduces obvious harms.
            </p>
          </CardContent>
        </Card>

        {/* Related insights from insights database */}
        <div className="max-w-4xl">
          <TableInsightsSummary
            tableId="safety-approaches"
            tags={["safety-approaches", "rlhf", "interpretability", "alignment", "safety-training"]}
            maxItems={3}
          />
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "unified" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("unified")}
          >
            Unified Table
          </Button>
          <Button
            variant={viewMode === "grouped" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grouped")}
          >
            Grouped by Category
          </Button>
        </div>

        {/* Legend */}
        <Card className="max-w-fit">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Safety Uplift</p>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span><LegendBadge level="CRITICAL" /> Transformative if works</span>
                  <span><LegendBadge level="HIGH" /> Significant risk reduction</span>
                  <span><LegendBadge level="MEDIUM" /> Meaningful but limited</span>
                  <span><LegendBadge level="LOW" /> Marginal benefit</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Capability Uplift</p>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span><LegendBadge level="DOMINANT" /> Primary capability driver</span>
                  <span><LegendBadge level="SIGNIFICANT" /> Major capability boost</span>
                  <span><LegendBadge level="SOME" /> Some capability benefit</span>
                  <span><LegendBadge level="NEUTRAL" /> No capability effect</span>
                  <span><LegendBadge level="TAX" /> Reduces capabilities</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Net World Safety</p>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span><LegendBadge level="HELPFUL" /> Probably net positive</span>
                  <span><LegendBadge level="UNCLEAR" /> Could go either way</span>
                  <span><LegendBadge level="HARMFUL" /> Likely net negative</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Scales to SI?</p>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span><LegendBadge level="YES" /> Works at superintelligence</span>
                  <span><LegendBadge level="MAYBE" /> Might work</span>
                  <span><LegendBadge level="UNLIKELY" /> Probably breaks</span>
                  <span><LegendBadge level="NO" /> Fundamentally limited</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Differential Progress</p>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span><LegendBadge level="SAFETY-DOMINANT" /> Safety &gt;&gt; capability</span>
                  <span><LegendBadge level="SAFETY-LEANING" /> Safety &gt; capability</span>
                  <span><LegendBadge level="BALANCED" /> Roughly equal</span>
                  <span><LegendBadge level="CAPABILITY-LEANING" /> Capability &gt; safety</span>
                  <span><LegendBadge level="CAPABILITY-DOMINANT" /> Capability &gt;&gt; safety</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Recommendation</p>
                <div className="flex flex-col gap-1 text-[10px]">
                  <span><LegendBadge level="PRIORITIZE" /> Needs much more funding</span>
                  <span><LegendBadge level="INCREASE" /> Should grow</span>
                  <span><LegendBadge level="MAINTAIN" /> About right</span>
                  <span><LegendBadge level="REDUCE" /> Overfunded for safety</span>
                  <span><LegendBadge level="DEFUND" /> Counterproductive</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {viewMode === "unified" ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[2000px] border-collapse text-xs">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b-2 border-border">
                    {headerGroup.headers.map((header, idx) => (
                      <th
                        key={header.id}
                        className={cn(
                          "px-2 py-2 text-left font-semibold bg-muted text-muted-foreground whitespace-nowrap",
                          idx === 0 && "sticky left-0 z-10 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 min-w-[180px]"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-2 py-2 align-top",
                          idx === 0 && "sticky left-0 z-5 bg-amber-50 dark:bg-amber-950/30 border-r border-amber-200 dark:border-amber-800"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Grouped view
          <div className="space-y-8">
            {CATEGORIES.map((category) => {
              const approaches = groupedData[category.id]
              if (!approaches || approaches.length === 0) return null
              const colors = categoryColors[category.id] || categoryColors.training

              return (
                <div key={category.id}>
                  <div className={cn("flex items-center gap-3 pb-2 mb-3 border-b-2", colors.border)}>
                    <div className={cn("w-3 h-3 rounded-full", colors.dot)} />
                    <h2 className="text-base font-semibold">{category.label}</h2>
                  </div>

                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full min-w-[2000px] border-collapse text-xs">
                      <thead>
                        <tr className="border-b-2 border-border">
                          {columns.map((col, idx) => (
                            <th
                              key={col.id || idx}
                              className={cn(
                                "px-2 py-2 text-left font-semibold bg-muted text-muted-foreground whitespace-nowrap",
                                idx === 0 && "sticky left-0 z-10 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 min-w-[180px]"
                              )}
                            >
                              {typeof col.header === "string" ? col.header : col.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {approaches.map((approach) => {
                          const row = table.getRowModel().rows.find(r => r.original.id === approach.id)
                          if (!row) return null
                          return (
                            <tr
                              key={approach.id}
                              className="border-b border-border hover:bg-muted/50 transition-colors"
                            >
                              {row.getVisibleCells().map((cell, idx) => (
                                <td
                                  key={cell.id}
                                  className={cn(
                                    "px-2 py-2 align-top",
                                    idx === 0 && "sticky left-0 z-5 bg-amber-50 dark:bg-amber-950/30 border-r border-amber-200 dark:border-amber-800"
                                  )}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
