"use client"

import { Checkbox } from "@base-ui/react/checkbox"
import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export function CheckboxGroup({
  className,
  ...props
}: CheckboxGroupPrimitive.Props) {
  return (
    <CheckboxGroupPrimitive
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

interface CheckboxGroupItemProps {
  value: string
  label: string
  name?: string
  disabled?: boolean
}

export function CheckboxGroupItem({
  value,
  label,
  name,
  disabled,
}: CheckboxGroupItemProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <Checkbox.Root
        className="flex size-5 shrink-0 items-center justify-center border-2 border-border bg-card outline-none group-hover:bg-muted data-checked:bg-primary data-disabled:cursor-not-allowed focus-visible:ring-3 focus-visible:ring-primary"
        disabled={disabled}
        name={name}
        value={value}
      >
        <Checkbox.Indicator>
          <Check aria-hidden className="size-3 text-primary-foreground" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <span className="font-heading text-foreground">{label}</span>
    </label>
  )
}
