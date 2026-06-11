"use client"

import { Check } from "lucide-react"
import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface CheckboxSquareProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxSquare({ checked, onChange }: CheckboxSquareProps) {
  return (
    <span className="relative mt-0.5">
      <input
        checked={checked}
        className="sr-only"
        onChange={event => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        className={cn(
          "flex size-5 items-center justify-center border-2 border-border transition-colors",
          checked ? "bg-primary" : "bg-card group-hover:bg-muted",
        )}
      >
        {checked && (
          <Check aria-hidden className="size-3 text-primary-foreground" />
        )}
      </span>
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
        checked={checked}
        onChange={disabled ? () => {} : onChange}
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
            <span className="mt-0.5 block text-xs text-foreground/55">
              {hint}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
