export type FormValidationIssue = {
  path: string
  message: string
}

/**
 * Read Standard Schema issues from one or more TanStack form error-map slots.
 * The form library keeps the map intentionally generic, so this small adapter
 * is the single place where the runtime shape is narrowed for presentation.
 */
export function getFormValidationIssues(
  ...errorMaps: unknown[]
): FormValidationIssue[] {
  const issues: FormValidationIssue[] = []
  const seen = new Set<string>()

  for (const errorMap of errorMaps) {
    if (!errorMap || typeof errorMap !== "object") continue

    for (const [path, value] of Object.entries(
      errorMap as Record<string, unknown>,
    )) {
      if (!Array.isArray(value)) continue

      for (const issue of value) {
        if (!issue || typeof issue !== "object") continue
        const message = (issue as { message?: unknown }).message
        if (typeof message !== "string") continue

        const key = `${path}:${message}`
        if (seen.has(key)) continue
        seen.add(key)
        issues.push({ path, message })
      }
    }
  }

  return issues
}
