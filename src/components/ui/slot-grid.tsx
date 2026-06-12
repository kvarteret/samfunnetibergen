"use client"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "./radio-group"

export type SlotAvailability = "available" | "taken"

export interface SlotOption {
  value: string
  label: string
  availability: SlotAvailability
}

interface SlotGridProps {
  slots: SlotOption[]
  value: string | null
  onValueChange: (value: string) => void
  label?: string
  className?: string
}

export function SlotGrid({
  slots,
  value,
  onValueChange,
  label = "Velg starttidspunkt",
  className,
}: SlotGridProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-heading uppercase tracking-widest text-foreground-muted">
        {label}
      </p>
      <RadioGroup
        className="grid grid-cols-4 gap-2 sm:grid-cols-5"
        onValueChange={onValueChange}
        value={value ?? ""}
      >
        {slots.map(slot => {
          return (
            <RadioGroupItem
              className={cn(
                "py-2.5 text-center",
                slot.availability === "taken" &&
                  "border-border/30 text-foreground-muted",
              )}
              disabled={slot.availability === "taken"}
              key={slot.value}
              value={slot.value}
            >
              {slot.label}
            </RadioGroupItem>
          )
        })}
      </RadioGroup>
    </div>
  )
}
