"use client"

import * as React from "react"

/**
 * Hook for managing a Set-based toggle filter with minimum active constraint
 * Used by RisksTable (causal levels) and ParametersTable (categories)
 */
export function useToggleSet<T extends string>(
  initialValues: T[],
  options?: { minActive?: number }
) {
  const { minActive = 1 } = options ?? {}
  const [active, setActive] = React.useState<Set<T>>(() => new Set(initialValues))

  const toggle = React.useCallback((value: T) => {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(value)) {
        // Don't allow deselecting if it would go below minActive
        if (next.size > minActive) {
          next.delete(value)
        }
      } else {
        next.add(value)
      }
      return next
    })
  }, [minActive])

  const reset = React.useCallback(() => {
    setActive(new Set(initialValues))
  }, [initialValues])

  const isAllActive = active.size === initialValues.length

  return { active, toggle, reset, isAllActive }
}

export default useToggleSet
