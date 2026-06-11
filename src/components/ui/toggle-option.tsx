"use client"

import type { LucideIcon } from "lucide-react"
import { type ReactNode, useId } from "react"

import { CheckboxSquare } from "@/components/ui/checkbox-field"
import { cn } from "@/lib/utils"
import { selectionControlVariants } from "./selection-control"

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
  const id = useId()

  return (
    <div
      className={cn(
        "flex w-full flex-col text-left",
        selectionControlVariants({
          appearance: "soft",
          selected: checked,
          size: "none",
        }),
      )}
    >
      <label
        className="flex cursor-pointer items-center gap-3 p-4"
        htmlFor={id}
      >
        <CheckboxSquare checked={checked} id={id} onChange={onChange} />
        <span className="flex min-w-0 flex-1 items-center gap-2 font-heading text-foreground">
          <Icon aria-hidden className="size-4 text-primary" />
          {label}
        </span>
      </label>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
