"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface SelectableCardProps {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  children: ReactNode
  image?: ReactNode
  className?: string
}

export function SelectableCard({
  selected,
  onSelect,
  disabled,
  children,
  image,
  className,
}: SelectableCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "flex cursor-pointer flex-col bg-card text-left transition-colors focus-brutal interactive-brutal",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
        image ? "overflow-hidden" : "min-h-32 gap-2 p-4",
        className,
      )}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      {image}
      <div className={image ? "space-y-2 p-4" : undefined}>{children}</div>
    </button>
  )
}
