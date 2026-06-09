"use client"

import { Check, ChevronDown } from "lucide-react"
import type { ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: string
}

interface SectionHeaderProps {
  number: string
  title: string
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline gap-4 border-b-2 border-border pb-4">
      <span className="font-heading text-4xl leading-none text-primary">
        {number}
      </span>
      <h2 className="font-heading text-xl uppercase tracking-[0.15em] text-foreground">
        {title}
      </h2>
    </div>
  )
}

interface FieldGroupProps {
  children: ReactNode
  className?: string
}

export function FieldGroup({ children, className }: FieldGroupProps) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

interface FieldHintProps {
  children: ReactNode
}

export function FieldHint({ children }: FieldHintProps) {
  return <p className="text-xs text-foreground/55">{children}</p>
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  hint?: string
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
}: SelectFieldProps) {
  return (
    <FieldGroup>
      <Label htmlFor={id}>{label}</Label>
      {hint && <FieldHint>{hint}</FieldHint>}
      <div className="relative">
        <select
          className="w-full appearance-none border-2 border-border bg-background px-3 py-2 pr-9 text-sm font-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          id={id}
          onChange={event => onChange(event.target.value)}
          value={value}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50"
        />
      </div>
    </FieldGroup>
  )
}

interface PriceInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function PriceInput({ id, label, value, onChange }: PriceInputProps) {
  return (
    <FieldGroup>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
          kr
        </span>
        <Input
          className="pl-9"
          id={id}
          min={0}
          onChange={event => onChange(event.target.value)}
          placeholder="0"
          step={1}
          type="number"
          value={value}
        />
      </div>
    </FieldGroup>
  )
}

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
          checked ? "bg-primary" : "bg-background group-hover:bg-muted",
        )}
      >
        {checked && (
          <Check aria-hidden className="size-3 text-primary-foreground" />
        )}
      </span>
    </span>
  )
}
