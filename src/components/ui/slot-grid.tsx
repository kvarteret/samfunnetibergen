"use client"

import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const slotButtonVariants = cva(
  "py-2.5 text-sm font-heading border-2 text-center transition-colors",
  {
    variants: {
      state: {
        selected: "bg-primary border-primary text-primary-foreground",
        taken: "border-border/30 text-foreground/25 cursor-not-allowed",
        available: "border-border hover:bg-muted",
      },
    },
  },
)

export type SlotState = "selected" | "available" | "taken"

export interface SlotOption {
  value: string
  label: string
  state: SlotState
}

interface SlotGridProps {
  slots: SlotOption[]
  selectedValue: string | null
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function SlotGrid({
  slots,
  selectedValue,
  onChange,
  label = "Velg starttidspunkt",
  className,
}: SlotGridProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-heading uppercase tracking-[0.12em] text-foreground/50">
        {label}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {slots.map(slot => (
          <button
            key={slot.value}
            type="button"
            disabled={slot.state === "taken"}
            onClick={() => onChange(slot.value)}
            className={slotButtonVariants({
              state: slot.value === selectedValue ? "selected" : slot.state,
            })}
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  )
}
