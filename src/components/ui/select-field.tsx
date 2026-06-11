"use client"

import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"

import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
  placeholder?: string
  hint?: string
  children?: ReactNode
  className?: string
  error?: string
  errorId?: string
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  children,
  className,
  error,
  errorId,
}: SelectFieldProps) {
  return (
    <FieldGroup error={error} errorId={errorId}>
      <Label htmlFor={id}>{label}</Label>
      {hint && <FieldHint>{hint}</FieldHint>}
      <div className={cn("relative", className)}>
        <select
          aria-describedby={error && errorId ? errorId : undefined}
          aria-invalid={!!error}
          className="w-full appearance-none border-2 border-border bg-card px-3 py-2 pr-9 font-base text-foreground focus-brutal"
          id={id}
          onChange={event => onChange(event.target.value)}
          value={value}
        >
          {children ?? (
            <>
              {placeholder && <option value="">{placeholder}</option>}
              {options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted"
        />
      </div>
    </FieldGroup>
  )
}
