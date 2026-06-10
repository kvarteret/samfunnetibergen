"use client"

import { cn } from "@/lib/utils"

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  className?: string
  variant?: "pills" | "squares" | "fill" | "inverse"
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  variant = "pills",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "flex flex-wrap",
        variant === "fill" ? "border-2 border-border" : "gap-2",
        className,
      )}
    >
      {options.map(option => (
        <button
          aria-pressed={value === option.value}
          className={cn(
            "text-sm font-heading transition-colors",
            value === option.value
              ? variant === "inverse"
                ? "bg-foreground text-background"
                : "bg-primary text-primary-foreground"
              : variant === "fill"
                ? "text-foreground/60 hover:bg-muted hover:text-foreground"
                : variant === "inverse"
                  ? "bg-muted text-foreground/80 hover:bg-card border-2 border-border"
                  : "border-2 border-border bg-background text-foreground hover:bg-muted",
            variant === "pills" && "px-3 py-1.5",
            variant === "squares" && "size-10",
            variant === "fill" && "flex-1 py-2.5 uppercase tracking-[0.12em]",
            variant === "inverse" && "px-4 py-2 min-h-11 font-bold",
          )}
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
