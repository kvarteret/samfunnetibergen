"use client"

import { Checkbox } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { type ReactNode } from "react"

import { FieldGroup } from "@/components/ui/field-group"
import { cn } from "@/lib/utils"

interface CheckboxSquareProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  // Render only the visual box when another control owns the interaction.
  decorative?: boolean
}

export function CheckboxSquare({
  checked,
  onChange,
  disabled = false,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  decorative = false,
}: CheckboxSquareProps) {
  if (decorative) {
    return (
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 flex size-5 items-center justify-center rounded-base border-2 border-border",
          checked ? "bg-primary" : "bg-card",
        )}
      >
        {checked && (
          <Check aria-hidden className="size-3 text-primary-foreground" />
        )}
      </span>
    )
  }

  return (
    <Checkbox.Root
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      checked={checked}
      className="relative mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-base border-2 border-border bg-card outline-none group-hover:bg-muted data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-primary"
      disabled={disabled}
      id={id}
      onCheckedChange={onChange}
    >
      <Checkbox.Indicator>
        <Check aria-hidden className="size-3 text-primary-foreground" />
      </Checkbox.Indicator>
    </Checkbox.Root>
  )
}

interface CheckboxFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  hint?: string
  children?: ReactNode
  className?: string
  labelClassName?: string
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  error?: string
  errorId?: string
}

export function CheckboxField({
  checked,
  onChange,
  label,
  hint,
  children,
  className,
  labelClassName,
  disabled = false,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  error,
  errorId,
}: CheckboxFieldProps) {
  return (
    <FieldGroup className={className} error={error} errorId={errorId}>
      <label
        className={cn(
          "group flex items-start gap-3",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <CheckboxSquare
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          checked={checked}
          disabled={disabled}
          id={id}
          onChange={onChange}
        />
        {children ?? (
          <span>
            <span
              className={cn(
                "block font-heading  text-foreground",
                labelClassName,
              )}
            >
              {label}
            </span>
            {hint && (
              <span className="mt-0.5 block text-sm text-foreground-muted">
                {hint}
              </span>
            )}
          </span>
        )}
      </label>
    </FieldGroup>
  )
}
