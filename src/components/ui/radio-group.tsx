"use client"

import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { selectionControlVariants } from "./selection-control"

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item> & {
  appearance?: "solid" | "soft"
  size?: "none" | "default" | "square" | "fill"
}

export function RadioGroupItem({
  appearance = "solid",
  className,
  size = "default",
  ...props
}: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        selectionControlVariants({ appearance, selected: false, size }),
        appearance === "solid"
          ? "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          : "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:text-foreground",
        className,
      )}
      {...props}
    />
  )
}
