"use client"

import * as React from "react"
import {
  getRootFactors,
  getScenarios,
  getOutcomes,
  impactGrid,
  getNodeLabel,
  type ImpactGridEntry
} from "@/data/parameter-graph-data"

interface ImpactGridProps {
  /** Which relationship type to show */
  gridType?: 'factors-to-scenarios' | 'scenarios-to-outcomes' | 'all'
  /** Show notes on hover */
  showNotes?: boolean
  /** Compact mode without labels */
  compact?: boolean
}

// Get color based on impact score and direction
function getImpactColor(impact: number, direction: string): string {
  const intensity = Math.round((impact / 100) * 255)

  if (direction === 'decreases') {
    // Green for decreasing risk
    return `rgba(34, 197, 94, ${impact / 100})`
  } else if (direction === 'mixed') {
    // Yellow/orange for mixed
    return `rgba(234, 179, 8, ${impact / 100})`
  } else {
    // Red for increasing risk
    return `rgba(239, 68, 68, ${impact / 100})`
  }
}

// Get text color based on background
function getTextColor(impact: number): string {
  return impact > 50 ? 'white' : 'inherit'
}

// Get direction symbol
function getDirectionSymbol(direction: string): string {
  if (direction === 'increases') return '↑'
  if (direction === 'decreases') return '↓'
  return '↔'
}

export function ImpactGrid({
  gridType = 'factors-to-scenarios',
  showNotes = true,
  compact = false
}: ImpactGridProps) {
  const factors = getRootFactors()
  const scenarios = getScenarios()
  const outcomes = getOutcomes()

  // Determine sources and targets based on grid type
  let sources: { id: string; label: string }[] = []
  let targets: { id: string; label: string }[] = []

  if (gridType === 'factors-to-scenarios') {
    sources = factors.map(f => ({ id: f.id, label: f.label }))
    targets = scenarios.map(s => ({ id: s.id, label: s.label }))
  } else if (gridType === 'scenarios-to-outcomes') {
    sources = scenarios.map(s => ({ id: s.id, label: s.label }))
    targets = outcomes.map(o => ({ id: o.id, label: o.label }))
  } else {
    // All: factors + scenarios as sources, scenarios + outcomes as targets
    sources = [...factors, ...scenarios].map(n => ({ id: n.id, label: n.label }))
    targets = [...scenarios, ...outcomes].map(n => ({ id: n.id, label: n.label }))
  }

  // Build lookup map
  const impactMap = new Map<string, ImpactGridEntry>()
  impactGrid.forEach(entry => {
    impactMap.set(`${entry.source}:${entry.target}`, entry)
  })

  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              {compact ? '' : 'Source → Target'}
            </th>
            {targets.map(target => (
              <th
                key={target.id}
                className="p-2 text-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                style={{ minWidth: compact ? '40px' : '100px', writingMode: compact ? 'vertical-rl' : 'horizontal-tb' }}
              >
                {compact ? target.label.slice(0, 10) : target.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sources.map(source => (
            <tr key={source.id}>
              <td className="p-2 border border-slate-200 dark:border-slate-700 font-medium text-xs">
                {compact ? source.label.slice(0, 15) : source.label}
              </td>
              {targets.map(target => {
                const entry = impactMap.get(`${source.id}:${target.id}`)

                if (!entry) {
                  return (
                    <td
                      key={target.id}
                      className="p-2 text-center border border-slate-200 dark:border-slate-700 text-slate-300"
                    >
                      —
                    </td>
                  )
                }

                return (
                  <td
                    key={target.id}
                    className="p-2 text-center border border-slate-200 dark:border-slate-700 cursor-help transition-transform hover:scale-105"
                    style={{
                      backgroundColor: getImpactColor(entry.impact, entry.direction),
                      color: getTextColor(entry.impact)
                    }}
                    title={showNotes ? `${entry.notes}\n\nImpact: ${entry.impact}/100 (${entry.direction})` : undefined}
                  >
                    <span className="font-bold">{entry.impact}</span>
                    <span className="ml-1 text-xs">{getDirectionSymbol(entry.direction)}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {!compact && (
        <div className="mt-4 flex gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }}></span>
            <span>Increases risk</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }}></span>
            <span>Decreases risk</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.7)' }}></span>
            <span>Mixed effect</span>
          </div>
          <div className="text-slate-400">
            Numbers = impact magnitude (0-100)
          </div>
        </div>
      )}
    </div>
  )
}

interface ImpactListProps {
  /** Node ID to show impacts for */
  nodeId: string
  /** Direction: 'from' shows what this node affects, 'to' shows what affects it */
  direction?: 'from' | 'to'
  /** Compact table format instead of cards */
  compact?: boolean
}

export function ImpactList({ nodeId, direction = 'from', compact = false }: ImpactListProps) {
  const entries = direction === 'from'
    ? impactGrid.filter(e => e.source === nodeId)
    : impactGrid.filter(e => e.target === nodeId)

  if (entries.length === 0) {
    return <span className="text-slate-400">No impact data available</span>
  }

  // Sort by impact score descending
  const sorted = [...entries].sort((a, b) => b.impact - a.impact)

  // Compact table format
  if (compact) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-1.5 pr-3 font-medium w-16">Score</th>
            <th className="text-left py-1.5 pr-3 font-medium">Factor</th>
            <th className="text-left py-1.5 font-medium text-slate-500">Note</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => {
            const label = direction === 'from'
              ? getNodeLabel(entry.target)
              : getNodeLabel(entry.source)
            return (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="py-1.5 pr-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      backgroundColor: getImpactColor(entry.impact, entry.direction),
                      color: getTextColor(entry.impact)
                    }}
                  >
                    {entry.impact}
                  </span>
                </td>
                <td className="py-1.5 pr-3 font-medium">
                  {getDirectionSymbol(entry.direction)} {label}
                </td>
                <td className="py-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {entry.notes}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // Card format (original)
  return (
    <div className="space-y-2">
      {sorted.map((entry, i) => {
        const label = direction === 'from'
          ? getNodeLabel(entry.target)
          : getNodeLabel(entry.source)

        return (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded border border-slate-200 dark:border-slate-700"
          >
            <div
              className="w-12 h-8 rounded flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: getImpactColor(entry.impact, entry.direction),
                color: getTextColor(entry.impact)
              }}
            >
              {entry.impact}
            </div>
            <div className="flex-1">
              <div className="font-medium">
                {getDirectionSymbol(entry.direction)} {label}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {entry.notes}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ImpactGrid
