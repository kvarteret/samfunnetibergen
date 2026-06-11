"use client"

import { cva } from "class-variance-authority"
import { type KeyboardEvent, useRef } from "react"

import { cn } from "@/lib/utils"

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  className?: string
  variant?: "pills" | "squares" | "fill" | "inverse"
}

const buttonVariants = cva(
  "min-h-11 text-sm font-heading transition-colors focus-brutal",
  {
    variants: {
      variant: {
        pills: "px-3 py-1.5",
        squares: "size-11",
        fill: "flex-1 py-2.5 uppercase tracking-widest",
        inverse: "px-4 py-2 font-bold",
      },
      selected: {
        true: "bg-primary text-primary-foreground",
        false:
          "border-2 border-border bg-background text-foreground hover:bg-muted",
      },
    },
    compoundVariants: [
      {
        variant: "fill",
        selected: false,
        className:
          "border-0 text-foreground-subtle hover:bg-muted hover:text-foreground",
      },
      {
        variant: "inverse",
        selected: true,
        className: "bg-foreground text-background border-0",
      },
      {
        variant: "inverse",
        selected: false,
        className:
          "bg-muted text-foreground-muted hover:bg-card border-2 border-border",
      },
    ],
  },
)

const containerVariants = cva("flex flex-wrap", {
  variants: {
    variant: {
      pills: "gap-2",
      squares: "gap-2",
      fill: "border-2 border-border",
      inverse: "gap-2",
    },
  },
})

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  variant = "pills",
}: SegmentedControlProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null)
  const hasSelection = options.some(option => option.value === value)

  const selectAndFocus = (index: number) => {
    onChange(options[index].value)
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [index]?.focus()
  }

  // Roving tabindex: one tab stop, arrow keys move and select.
  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const last = options.length - 1
    let next: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = index === last ? 0 : index + 1
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = index === 0 ? last : index - 1
    if (event.key === "Home") next = 0
    if (event.key === "End") next = last
    if (next !== null) {
      event.preventDefault()
      selectAndFocus(next)
    }
  }

  return (
    <div
      className={cn(containerVariants({ variant }), className)}
      ref={groupRef}
      role="radiogroup"
    >
      {options.map((option, index) => {
        const selected = value === option.value
        return (
          <button
            aria-checked={selected}
            className={buttonVariants({ variant, selected })}
            key={option.value}
            onClick={() => onChange(option.value)}
            onKeyDown={event => handleKeyDown(event, index)}
            role="radio"
            tabIndex={selected || (!hasSelection && index === 0) ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
