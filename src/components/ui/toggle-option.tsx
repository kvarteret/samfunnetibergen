"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { CheckboxSquare } from "@/components/ui/form-fields"
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
    <div
      className={cn(
        "border-2 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
    >
      <button
        aria-pressed={checked}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
        onClick={() => onChange(!checked)}
        type="button"
      >
        <CheckboxSquare checked={checked} onChange={() => {}} />
        <span className="flex min-w-0 flex-1 items-center gap-2 font-heading text-sm text-foreground">
          <Icon aria-hidden className="size-4 text-primary" />
          {label}
        </span>
      </button>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
