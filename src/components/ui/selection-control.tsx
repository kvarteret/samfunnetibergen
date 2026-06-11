import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const selectionControlVariants = cva(
  "cursor-pointer border-2 border-border bg-card text-foreground focus-brutal disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      selected: {
        false: "hover:bg-muted",
        true: "",
      },
      appearance: {
        solid: "",
        soft: "",
      },
      size: {
        none: "",
        default: "min-h-11 px-3 py-1.5 font-heading text-base",
        square: "size-11 font-heading text-base",
        fill: "min-h-11 flex-1 px-3 py-2.5 font-heading text-base uppercase tracking-widest",
      },
    },
    compoundVariants: [
      {
        appearance: "solid",
        selected: true,
        className: "bg-primary text-primary-foreground",
      },
      {
        appearance: "soft",
        selected: true,
        className: "border-primary bg-primary/5 text-foreground",
      },
    ],
    defaultVariants: {
      appearance: "solid",
      size: "default",
    },
  },
)

type SelectionControlProps = ComponentProps<"button"> &
  VariantProps<typeof selectionControlVariants>

export function SelectionControl({
  appearance,
  className,
  selected,
  size,
  type = "button",
  ...props
}: SelectionControlProps) {
  return (
    <button
      className={cn(
        selectionControlVariants({ appearance, selected, size }),
        className,
      )}
      type={type}
      {...props}
    />
  )
}
