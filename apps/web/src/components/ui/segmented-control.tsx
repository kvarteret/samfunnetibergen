"use client"

import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "./radio-group"

interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>
  value: T
  onValueChange: (value: T) => void
  className?: string
  variant?: "pills" | "squares" | "fill"
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
      fill: "border-2 border-border",
    },
  },
})

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  variant = "pills",
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup
      className={cn(containerVariants({ variant }), className)}
      onValueChange={onValueChange}
      value={value}
    >
      {options.map(option => (
        <RadioGroupItem
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
