import { useMemo } from "react"

/**
 * Returns aria props for a form field linked to an error message.
 *
 * Eliminates the repeated pattern:
 *   aria-describedby={error ? `${fieldId}-error` : undefined}
 *   aria-invalid={!!error}
 */
export function useFieldAria(fieldId: string, error?: string) {
  return useMemo(() => {
    const hasError = !!error
    return {
      describedby: hasError ? `${fieldId}-error` : undefined,
      invalid: hasError,
    } as const
  }, [fieldId, error])
}
