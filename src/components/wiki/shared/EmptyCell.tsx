"use client"

/**
 * Standard empty/null state cell for tables
 * Replaces repeated: <span className="text-muted-foreground">—</span>
 */
export function EmptyCell({ text = "—" }: { text?: string }) {
  return <span className="text-muted-foreground">{text}</span>
}

export default EmptyCell
