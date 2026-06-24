"use client"

import { FieldGroup } from "@/components/ui/field-group"
import { Label } from "@/components/ui/label"
import { NumberField } from "@/components/ui/number-field"

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
      <div className="relative max-w-28">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-foreground-muted">
          kr
        </span>
        <NumberField
          id={id}
          inputClassName="pl-9"
          min={0}
          onValueChange={nextValue =>
            onChange(nextValue === null ? "" : String(nextValue))
          }
          placeholder="0"
          showControls={false}
          value={value === "" ? null : Number(value)}
        />
      </div>
    </FieldGroup>
  )
}
