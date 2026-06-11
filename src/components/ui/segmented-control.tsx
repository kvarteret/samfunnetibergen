"use client"

import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  className?: string
  variant?: "pills" | "squares" | "fill" | "inverse"
}

const buttonVariants = cva("text-sm font-heading transition-colors", {
  variants: {
    variant: {
      pills: "px-3 py-1.5",
      squares: "size-10",
      fill: "flex-1 py-2.5 uppercase tracking-[0.12em]",
      inverse: "px-4 py-2 min-h-11 font-bold",
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
        "border-0 text-foreground/60 hover:bg-muted hover:text-foreground",
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
        "bg-muted text-foreground/80 hover:bg-card border-2 border-border",
    },
  ],
})

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
  return (
    <div className={cn(containerVariants({ variant }), className)}>
      {options.map(option => (
        <button
          aria-pressed={value === option.value}
          className={buttonVariants({
            variant,
            selected: value === option.value,
          })}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
