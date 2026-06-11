"use client"

import { useState } from "react"

import type { ErrorSummaryItem } from "@/components/ui/error-summary"

// House pattern for form validation display: errors stay hidden until the
// first invalid submit attempt; after that the ErrorSummary and per-field
// messages show and live-update as the user fixes fields.
export function useFormErrors(validationErrors: ErrorSummaryItem[]) {
  const [hasSubmittedInvalid, setHasSubmittedInvalid] = useState(false)
  const visibleErrors = hasSubmittedInvalid ? validationErrors : []

  return {
    visibleErrors,
    markSubmitAttempt: () => setHasSubmittedInvalid(true),
    errorFor: (fieldId: string) =>
      visibleErrors.find(error => error.fieldId === fieldId)?.message,
  }
}
