import { Field } from "@base-ui/react/field"
import type { ReactNode } from "react"

interface FieldErrorProps {
  id: string
  children: ReactNode
}

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <Field.Error
      className="border-l-4 border-destructive pl-3 font-heading text-destructive"
      id={id}
      match
    >
      {children}
    </Field.Error>
  )
}
