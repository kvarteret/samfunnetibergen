"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { CheckboxSquare } from "@/components/ui/checkbox-field"
import { cn } from "@/lib/utils"

interface ToggleOptionProps {
  checked: boolean
  icon: LucideIcon
  label: string
  children?: ReactNode
  onChange: (checked: boolean) => void
}

export function ToggleOption({
  checked,
  icon: Icon,
  label,
  children,
  onChange,
}: ToggleOptionProps) {
  return (
    <button
      aria-pressed={checked}
      className={cn(
        "flex w-full cursor-pointer flex-col border-2 text-left transition-colors focus-brutal",
        checked
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted",
      )}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className="flex items-center gap-3 p-4">
        <CheckboxSquare checked={checked} decorative />
        <span className="flex min-w-0 flex-1 items-center gap-2 font-heading text-sm text-foreground">
          <Icon aria-hidden className="size-4 text-primary" />
          {label}
        </span>
      </span>
      {children && (
        // Stop propagation so interacting with children (inputs, selects)
        // doesn't bubble to the button and toggle the parent off.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
          {children}
        </div>
      )}
    </button>
  )
}
