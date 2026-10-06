"use client"

import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "./radio-group"

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string; disabled?: boolean }>
  value: T
  onValueChange: (value: T) => void
  className?: string
  variant?: "pills" | "squares" | "fill"
  "aria-labelledby"?: string
}

const sizeByVariant = {
  pills: "default",
  squares: "square",
  fill: "fill",
} as const

const containerVariants = cva("flex flex-wrap", {
  variants: {
    variant: {
      pills: "gap-2",
      squares: "gap-2",
      // A soft track holds the segments; the selected one is filled.
      fill: "w-fit max-w-full flex-nowrap gap-1 rounded-full bg-muted p-1",
    },
  },
})

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  variant = "pills",
  "aria-labelledby": labelledBy,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      className={cn(containerVariants({ variant }), className)}
      onValueChange={onValueChange}
      value={value}
    >
      {options.map(option => (
        <RadioGroupItem
          className={variant === "pills" ? "rounded-full" : undefined}
          disabled={option.disabled}
          key={option.value}
          size={sizeByVariant[variant]}
          value={option.value}
        >
          {option.label}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  )
}
