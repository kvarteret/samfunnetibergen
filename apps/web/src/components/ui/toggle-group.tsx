"use client"

import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "@/lib/utils"
import { selectionControlVariants } from "./selection-control"

interface ToggleGroupProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T[]
  onValueChange: (value: T[]) => void
  className?: string
  size?: "default" | "sm"
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onValueChange,
  className,
  size = "default",
}: ToggleGroupProps<T>) {
  return (
    <ToggleGroupPrimitive
      className={cn("flex flex-wrap gap-2", className)}
      multiple
      onValueChange={onValueChange}
      value={value}
    >
      {options.map(option => (
        <Toggle
          className={({ pressed }) =>
            cn(
              selectionControlVariants({
                selected: pressed,
                size: size === "sm" ? "square" : "default",
              }),
            )
          }
          key={option.value}
          value={option.value}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroupPrimitive>
  )
}
