import type { ReactNode } from "react"

interface FieldErrorProps {
  id: string
  children: ReactNode
}

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p
      className="border-l-4 border-destructive pl-3 font-heading text-sm text-destructive"
      id={id}
    >
      {children}
    </p>
  )
}
