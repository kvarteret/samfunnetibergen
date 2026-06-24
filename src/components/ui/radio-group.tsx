"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"
import { selectionControlVariants } from "./selection-control"

export type RadioGroupProps<T> = Omit<
  RadioGroupPrimitive.Props<T>,
  "className"
> & {
  className?: string
}

export function RadioGroup<T>({ className, ...props }: RadioGroupProps<T>) {
  return (
    <RadioGroupPrimitive
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

type RadioGroupItemProps<T> = Omit<Radio.Root.Props<T>, "className"> & {
  className?: string
  appearance?: "solid" | "soft"
  size?: "none" | "default" | "square" | "fill"
}

export function RadioGroupItem<T>({
  appearance = "solid",
  className,
  size = "default",
  ...props
}: RadioGroupItemProps<T>) {
  return (
    <Radio.Root
      className={({ checked }) =>
        cn(
          selectionControlVariants({ appearance, selected: checked, size }),
          className,
        )
      }
      {...props}
    />
  )
}
