"use client"

import * as React from "react"

/**
 * Creates a data-aware wrapper component that supports both:
 * 1. Data lookup via `dataId` prop (pulls from YAML data)
 * 2. Inline data via other props (backwards compatible)
 *
 * This eliminates the boilerplate of creating Data* wrapper components manually.
 *
 * @example
 * ```tsx
 * // Before: Manual DataEstimateBox wrapper (80 lines)
 * // After: One-liner
 * export const DataEstimateBox = createDataWrapper(
 *   EstimateBox,
 *   getEstimateBoxData,
 *   ['variable', 'estimates'], // required inline props
 *   'EstimateBox'
 * )
 * ```
 */

interface DataWrapperOptions<TData, TProps> {
  /** Function to fetch data by ID */
  getData: (id: string) => TData | undefined
  /** Props that are required when using inline mode (no dataId) */
  requiredInlineProps: (keyof TProps)[]
  /** Display name for error messages */
  displayName: string
  /** Optional: Transform fetched data before passing to component */
  transformData?: (data: TData) => Partial<TProps>
}

type DataWrapperProps<TProps> = { dataId?: string } & Partial<TProps>

export function createDataWrapper<TData, TProps extends object>(
  BaseComponent: React.ComponentType<TProps>,
  options: DataWrapperOptions<TData, TProps>
): React.FC<DataWrapperProps<TProps>> {
  const { getData, requiredInlineProps, displayName, transformData } = options

  const WrappedComponent: React.FC<DataWrapperProps<TProps>> = (props) => {
    const { dataId, ...inlineProps } = props

    // If dataId provided, fetch from data
    if (dataId) {
      const data = getData(dataId)
      if (!data) {
        return (
          <div className="p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 rounded text-sm text-red-700 dark:text-red-300">
            No data found for {displayName} ID: <code className="font-mono">{dataId}</code>
          </div>
        )
      }

      const transformedData = transformData ? transformData(data) : (data as unknown as Partial<TProps>)
      return <BaseComponent {...(transformedData as TProps)} />
    }

    // Check required inline props
    const missingProps = requiredInlineProps.filter(
      (prop) => inlineProps[prop as keyof typeof inlineProps] === undefined
    )

    if (missingProps.length > 0) {
      return (
        <div className="p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 rounded text-sm text-amber-700 dark:text-amber-300">
          {displayName} requires either <code className="font-mono">dataId</code> or these props:{" "}
          {missingProps.map((p) => <code key={String(p)} className="font-mono">{String(p)}</code>).reduce<React.ReactNode[]>(
            (acc, el, i) => (i === 0 ? [el] : [...acc, ", ", el]),
            []
          )}
        </div>
      )
    }

    return <BaseComponent {...(inlineProps as TProps)} />
  }

  WrappedComponent.displayName = `Data${displayName}`
  return WrappedComponent
}

/**
 * Simpler version for components where the data shape matches props exactly.
 * Just provide the component, data getter, and required props.
 */
export function createSimpleDataWrapper<TProps extends object>(
  BaseComponent: React.ComponentType<TProps>,
  getData: (id: string) => TProps | undefined,
  requiredInlineProps: (keyof TProps)[],
  displayName: string
): React.FC<{ dataId?: string } & Partial<TProps>> {
  return createDataWrapper(BaseComponent, {
    getData,
    requiredInlineProps,
    displayName,
  })
}
