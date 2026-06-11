"use client"

import { FieldGroup } from "@/components/ui/field-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
