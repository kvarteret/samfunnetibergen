import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

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
