"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { badgeVariants, type BadgeVariant } from "./style-config"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  size?: "sm" | "md"
}

export function Badge({
  children,
  variant = "default",
  className,
  size = "md"
}: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"

  return (
    <span
      className={cn(
        "inline-block rounded font-medium",
        sizeClasses,
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
