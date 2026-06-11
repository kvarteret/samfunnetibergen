import type { ReactNode } from "react"

import { FieldError } from "@/components/ui/field-error"
import { cn } from "@/lib/utils"

interface FieldGroupProps {
  children: ReactNode
  className?: string
  error?: string
  errorId?: string
}

export function FieldGroup({
  children,
  className,
  error,
  errorId,
}: FieldGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {error && errorId ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

interface FieldHintProps {
  children: ReactNode
}

export function FieldHint({ children }: FieldHintProps) {
  return <p className="text-xs text-foreground-subtle">{children}</p>
}
