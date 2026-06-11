"use client"

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { selectionControlVariants } from "./selection-control"

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
    <ToggleGroupPrimitive.Root
      className={cn("flex flex-wrap gap-2", className)}
      onValueChange={nextValue => onChange(nextValue as T[])}
      type="multiple"
      value={value}
    >
      {options.map(option => (
        <ToggleGroupPrimitive.Item
          className={cn(
            selectionControlVariants({
              selected: false,
              size: size === "sm" ? "square" : "default",
            }),
            "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
          )}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
