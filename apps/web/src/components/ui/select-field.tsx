"use client"

import { Select } from "@base-ui/react/select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  hint?: string
  className?: string
  error?: string
  errorId?: string
  disabled?: boolean
  required?: boolean
  hideArrow?: boolean
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  className,
  error,
  errorId,
  disabled,
  required,
  hideArrow,
}: SelectFieldProps) {
  const items = placeholder
    ? [{ value: "", label: placeholder }, ...options]
    : options

  return (
    <FieldGroup error={error} errorId={errorId}>
      <Label htmlFor={id}>{label}</Label>
      {hint && <FieldHint>{hint}</FieldHint>}
      <Select.Root
        disabled={disabled}
        id={id}
        items={items}
        onValueChange={nextValue => onChange(nextValue ?? "")}
        required={required}
        value={value}
      >
        <Select.Trigger
          aria-describedby={error && errorId ? errorId : undefined}
          aria-invalid={!!error}
          className={cn(
            "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-base border-2 border-border bg-card px-3 py-2 font-base text-foreground outline-none hover:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-50 data-popup-open:bg-muted focus-brutal",
            className,
          )}
          id={id}
        >
          <Select.Value
            className="truncate data-placeholder:text-foreground-muted"
            placeholder={placeholder}
          />
          <Select.Icon>
            {!hideArrow && <ChevronDown aria-hidden className="size-4" />}
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner className="z-50 outline-none" sideOffset={6}>
            <Select.Popup className="rounded-base border-2 border-border bg-card text-foreground shadow-shadow outline-none">
              <Select.ScrollUpArrow className="flex h-7 cursor-default items-center justify-center bg-card">
                <ChevronUp aria-hidden className="size-4" />
              </Select.ScrollUpArrow>
              <Select.List className="max-h-[var(--available-height)] overflow-y-auto p-1">
                {items.map(option => (
                  <Select.Item
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-highlighted:bg-primary data-highlighted:text-primary-foreground"
                    disabled={option.disabled}
                    key={option.value}
                    value={option.value}
                  >
                    <Select.ItemIndicator>
                      <Check aria-hidden className="size-4" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="flex h-7 cursor-default items-center justify-center bg-card">
                <ChevronDown aria-hidden className="size-4" />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </FieldGroup>
  )
}
