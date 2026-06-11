"use client"

import { cn } from "@/lib/utils"

interface ToggleGroupProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T[]
  onChange: (value: T[]) => void
  className?: string
  size?: "default" | "sm"
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "default",
}: ToggleGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map(option => {
        const selected = value.includes(option.value)

        return (
          <button
            aria-pressed={selected}
            className={cn(
              "min-h-11 border-2 border-border font-heading transition-colors focus-brutal",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
              size === "default" && "px-3 py-1.5 text-sm",
              size === "sm" && "size-11 text-sm",
            )}
            key={option.value}
            onClick={() =>
              onChange(
                selected
                  ? value.filter(v => v !== option.value)
                  : [...value, option.value],
              )
            }
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
