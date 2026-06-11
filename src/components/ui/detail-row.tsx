import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface DetailRowProps {
  label: string
  icon?: LucideIcon
  children: ReactNode
  layout?: "horizontal" | "vertical" | "labelColumn"
  className?: string
}

export function DetailRow({
  label,
  icon: Icon,
  children,
  layout = "horizontal",
  className,
}: DetailRowProps) {
  if (layout === "vertical") {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
          {Icon && <Icon aria-hidden className="size-3.5" />}
          {label}
        </dt>
        <dd className="text-foreground-muted">{children}</dd>
      </div>
    )
  }

  if (layout === "labelColumn") {
    return (
      <div className={cn("flex gap-8 py-3", className)}>
        <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
          {label}
        </dt>
        <dd>{children}</dd>
      </div>
    )
  }

  return (
    <div className={cn("flex justify-between gap-4", className)}>
      <span className="text-foreground-muted shrink-0">{label}</span>
      <span className="font-heading text-right truncate">{children}</span>
    </div>
  )
}
