"use client"

import { Check } from "lucide-react"
import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface CheckboxSquareProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  // Render only the visual box, no input. For use inside another interactive
  // element (e.g. ToggleOption's button) where a nested input would create a
  // second tab stop.
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
  const box = (
    <span
      aria-hidden={decorative || undefined}
      className={cn(
        "flex size-5 items-center justify-center border-2 border-border transition-colors",
        checked ? "bg-primary" : "bg-card",
        !disabled && !checked && "group-hover:bg-muted",
        !decorative &&
          "peer-focus-visible:ring-3 peer-focus-visible:ring-primary",
      )}
    >
      {checked && (
        <Check aria-hidden className="size-3 text-primary-foreground" />
      )}
    </span>
  )

  if (decorative) {
    return <span className="relative mt-0.5">{box}</span>
  }

  return (
    <span className="relative mt-0.5">
      <input
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        id={id}
        onChange={event => onChange?.(event.target.checked)}
        type="checkbox"
      />
      {box}
    </span>
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
}: CheckboxFieldProps) {
  return (
    <label
      className={cn(
        "group flex items-start gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
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
              "block font-heading text-sm text-foreground",
              labelClassName,
            )}
          >
            {label}
          </span>
          {hint && (
            <span className="mt-0.5 block text-xs text-foreground-subtle">
              {hint}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
