"use client"

import { type ReactNode } from "react"

import { CheckboxSquare } from "@/components/ui/form-fields"
import { cn } from "@/lib/utils"

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
