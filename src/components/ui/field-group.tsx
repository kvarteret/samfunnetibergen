import { Field } from "@base-ui/react/field"
import type { ReactNode } from "react"

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
    <Field.Root className={cn("space-y-2", className)} invalid={!!error}>
      {children}
      {error && errorId ? (
        <Field.Error
          className="border-l-4 border-destructive pl-3 font-heading text-destructive"
          id={errorId}
          match
        >
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  )
}

interface FieldHintProps {
  children: ReactNode
}

export function FieldHint({ children }: FieldHintProps) {
  return (
    <Field.Description className="text-sm text-foreground-muted">
      {children}
    </Field.Description>
  )
}
