"use client"

import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronDown, X } from "lucide-react"

import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { Label } from "@/components/ui/label"
import type { SelectOption } from "@/components/ui/select-field"
import { cn } from "@/lib/utils"

interface ComboboxFieldProps {
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
}

export function ComboboxField({
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
}: ComboboxFieldProps) {
  const selectedOption = options.find(option => option.value === value) ?? null

  return (
    <FieldGroup error={error} errorId={errorId}>
      <Label htmlFor={id}>{label}</Label>
      {hint && <FieldHint>{hint}</FieldHint>}
      <Combobox.Root
        disabled={disabled}
        isItemEqualToValue={(option, selected) =>
          option.value === selected.value
        }
        items={options}
        onValueChange={option => onChange(option?.value ?? "")}
        value={selectedOption}
      >
        <Combobox.InputGroup
          className={cn(
            "relative flex min-h-11 w-full items-center rounded-base border-2 border-border bg-card focus-within-brutal",
            className,
          )}
        >
          <Combobox.Input
            aria-describedby={error && errorId ? errorId : undefined}
            aria-invalid={!!error}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 font-base text-foreground outline-none placeholder:text-foreground-muted"
            id={id}
            placeholder={placeholder}
          />
          <Combobox.Clear
            aria-label="Tøm valg"
            className="flex size-10 cursor-pointer items-center justify-center text-foreground-muted hover:text-foreground data-disabled:hidden"
          >
            <X aria-hidden className="size-4" />
          </Combobox.Clear>
          <Combobox.Trigger
            aria-label="Åpne valg"
            className="flex size-10 cursor-pointer items-center justify-center text-foreground hover:bg-muted"
          >
            <ChevronDown aria-hidden className="size-4" />
          </Combobox.Trigger>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner className="z-50 outline-none" sideOffset={6}>
            <Combobox.Popup className="rounded-base border-2 border-border bg-card text-foreground shadow-shadow outline-none">
              <Combobox.Empty className="px-3 py-4 text-sm text-foreground-muted">
                Ingen treff
              </Combobox.Empty>
              <Combobox.List className="max-h-[min(22.5rem,var(--available-height))] overflow-y-auto p-1 outline-none">
                {(option: SelectOption) => (
                  <Combobox.Item
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-highlighted:bg-primary data-highlighted:text-primary-foreground"
                    disabled={option.disabled}
                    key={option.value}
                    value={option}
                  >
                    <Combobox.ItemIndicator>
                      <Check aria-hidden className="size-4" />
                    </Combobox.ItemIndicator>
                    <span>{option.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </FieldGroup>
  )
}
