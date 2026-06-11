"use client"

import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "./radio-group"

interface SelectableCardProps {
  value: string
  disabled?: boolean
  children: ReactNode
  image?: ReactNode
  className?: string
}

export function SelectableCard({
  value,
  disabled,
  children,
  image,
  className,
}: SelectableCardProps) {
  return (
    <RadioGroupItem
      appearance="soft"
      className={cn(
        "flex flex-col text-left interactive-brutal",
        disabled && "hover:bg-card",
        image ? "overflow-hidden" : "min-h-32 gap-2 p-4",
        className,
      )}
      disabled={disabled}
      size="none"
      value={value}
    >
      {image}
      <div className={image ? "space-y-2 p-4" : undefined}>{children}</div>
    </RadioGroupItem>
  )
}

export function SelectableCardGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroup>) {
  return <RadioGroup className={cn("grid gap-4", className)} {...props} />
}
