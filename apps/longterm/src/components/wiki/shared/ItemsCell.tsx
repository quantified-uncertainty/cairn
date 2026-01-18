"use client"

import * as React from "react"
import { EmptyCell } from "./EmptyCell"
import { PillLink, RiskPillLink, InterventionPillLink } from "./PillLink"

interface RelatedItem {
  id: string
  title: string
  href: string
}

interface ItemsCellProps<T extends RelatedItem> {
  items: T[] | undefined | null
  maxItems?: number
  variant?: "default" | "risk" | "intervention"
  className?: string
}

/**
 * Displays a list of related items as pill links with overflow counter
 * Used in RisksTable (solutions), ParametersTable (risks, interventions)
 */
export function ItemsCell<T extends RelatedItem>({
  items,
  maxItems = 2,
  variant = "default",
}: ItemsCellProps<T>) {
  if (!items || items.length === 0) return <EmptyCell />

  const PillComponent = variant === "risk"
    ? RiskPillLink
    : variant === "intervention"
      ? InterventionPillLink
      : PillLink

  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, maxItems).map((item) => (
        <PillComponent key={item.id} href={item.href}>
          {item.title}
        </PillComponent>
      ))}
      {items.length > maxItems && (
        <span className="text-xs text-muted-foreground">+{items.length - maxItems}</span>
      )}
    </div>
  )
}

/**
 * Risk items cell (red theme)
 */
export function RiskItemsCell<T extends RelatedItem>({
  items,
  maxItems = 3
}: Omit<ItemsCellProps<T>, "variant">) {
  return <ItemsCell items={items} maxItems={maxItems} variant="risk" />
}

/**
 * Intervention/solution items cell (green theme)
 */
export function InterventionItemsCell<T extends RelatedItem>({
  items,
  maxItems = 2
}: Omit<ItemsCellProps<T>, "variant">) {
  return <ItemsCell items={items} maxItems={maxItems} variant="intervention" />
}

export default ItemsCell
