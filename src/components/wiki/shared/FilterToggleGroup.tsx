"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FilterOption<T extends string> {
  value: T
  label: string
  count?: number
  color: string
  activeColor: string
}

interface FilterToggleGroupProps<T extends string> {
  label: string
  options: FilterOption<T>[]
  active: Set<T>
  onToggle: (value: T) => void
  showAll?: boolean
  onShowAll?: () => void
  minActive?: number
}

/**
 * Reusable filter toggle group for table filtering
 * Used by RisksTable (causal levels) and ParametersTable (categories)
 */
export function FilterToggleGroup<T extends string>({
  label,
  options,
  active,
  onToggle,
  showAll = true,
  onShowAll,
  minActive = 1,
}: FilterToggleGroupProps<T>) {
  const handleToggle = (value: T) => {
    // Don't allow deselecting if it would go below minActive
    if (active.has(value) && active.size <= minActive) {
      return
    }
    onToggle(value)
  }

  const allActive = active.size === options.length

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      {options.map((option) => {
        const isActive = active.has(option.value)
        return (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all",
              isActive ? option.activeColor : option.color,
              "hover:opacity-80"
            )}
          >
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </button>
        )
      })}
      {showAll && !allActive && onShowAll && (
        <button
          onClick={onShowAll}
          className="px-3 py-1.5 rounded-full text-sm font-medium border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          Show All
        </button>
      )}
    </div>
  )
}

/**
 * Helper to create filter options from a config object
 */
export function createFilterOptions<T extends string>(
  config: Record<T, { label: string; color: string; activeColor: string }>,
  counts?: Record<T, number>
): FilterOption<T>[] {
  return (Object.keys(config) as T[]).map((key) => ({
    value: key,
    label: config[key].label,
    color: config[key].color,
    activeColor: config[key].activeColor,
    count: counts?.[key],
  }))
}

export default FilterToggleGroup
