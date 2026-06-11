"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface ErrorSummaryItem {
  fieldId: string
  message: string
}

interface ErrorSummaryProps {
  errors: ErrorSummaryItem[]
  title?: string
  className?: string
}

export function ErrorSummary({
  errors,
  title = "Det er et problem",
  className,
}: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  if (errors.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "border-2 border-destructive bg-destructive/10 p-5 shadow-shadow",
        className,
      )}
      ref={ref}
      role="alert"
      tabIndex={-1}
    >
      <p className="font-heading text-lg text-destructive">{title}</p>
      <ul className="mt-3 space-y-2">
        {errors.map(error => (
          <li key={`${error.fieldId}-${error.message}`}>
            <a
              className="font-heading text-base text-foreground underline underline-offset-4 focus-brutal"
              href={`#${error.fieldId}`}
              onClick={() => {
                window.setTimeout(() => {
                  document.getElementById(error.fieldId)?.focus()
                }, 0)
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
