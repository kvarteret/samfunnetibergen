"use client"

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface NumberFieldProps {
  id?: string
  value: number | null
  onValueChange: (value: number | null) => void
  className?: string
  inputClassName?: string
  min?: number
  max?: number
  step?: number | "any"
  placeholder?: string
  disabled?: boolean
  required?: boolean
  showControls?: boolean
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

export function NumberField({
  id,
  value,
  onValueChange,
  className,
  inputClassName,
  min,
  max,
  step = 1,
  placeholder,
  disabled,
  required,
  showControls = true,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: NumberFieldProps) {
  return (
    <NumberFieldPrimitive.Root
      className={className}
      disabled={disabled}
      id={id}
      max={max}
      min={min}
      onValueChange={onValueChange}
      required={required}
      step={step}
      value={value}
    >
      <NumberFieldPrimitive.Group className="flex h-11">
        {showControls && (
          <NumberFieldPrimitive.Decrement
            aria-label="Reduser"
            className="flex w-10 cursor-pointer items-center justify-center rounded-base border-2 border-r-0 border-border bg-card outline-none hover:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-50 focus-brutal"
          >
            <Minus aria-hidden className="size-4" />
          </NumberFieldPrimitive.Decrement>
        )}
        <NumberFieldPrimitive.Input
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            "min-w-0 flex-1 rounded-base border-2 border-border bg-card px-3 py-2 font-base tabular-nums text-foreground outline-none placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50 focus-brutal",
            showControls && "text-center",
            inputClassName,
          )}
          placeholder={placeholder}
        />
        {showControls && (
          <NumberFieldPrimitive.Increment
            aria-label="Øk"
            className="flex w-10 cursor-pointer items-center justify-center rounded-base border-2 border-l-0 border-border bg-card outline-none hover:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-50 focus-brutal"
          >
            <Plus aria-hidden className="size-4" />
          </NumberFieldPrimitive.Increment>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}
