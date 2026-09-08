import posthog from "posthog-js"
import { getFormValidationIssues } from "@/lib/form-validation-errors"

export type TrackedFormId =
  | "event_submission"
  | "karaoke_booking"
  | "room_booking"
  | "volunteer_application"

export function captureInvalidFormSubmission(
  formId: TrackedFormId,
  ...errorMaps: unknown[]
): void {
  const issues = getFormValidationIssues(...errorMaps)
  if (issues.length === 0) return

  const invalidFields = [
    ...new Set(issues.map(issue => normalizeFieldPath(issue.path))),
  ].sort()

  try {
    posthog.capture("form_validation_failed", {
      form_id: formId,
      invalid_field_count: invalidFields.length,
      invalid_fields: invalidFields,
      validation_issue_count: issues.length,
    })
  } catch {
    // Analytics must never interfere with validation feedback.
  }
}

function normalizeFieldPath(path: string): string {
  return path.replace(/\[\d+\]/g, "[]")
}

/** One tracker per mounted form; successful submissions start a new sequence. */
export function createSubmissionFailureTracker(formId: TrackedFormId) {
  let attempts: { stage: string; fields: { field: string; code: string }[] }[] =
    []
  return {
    reset() {
      attempts = []
    },
    fail(
      stage:
        | "validation"
        | "submission"
        | "calendar_conflict"
        | "opening_hours",
      ...errorMaps: unknown[]
    ) {
      const fields: { field: string; code: string }[] = []
      for (const map of errorMaps) {
        if (!map || typeof map !== "object") continue
        for (const [path, errors] of Object.entries(map)) {
          if (!Array.isArray(errors)) continue
          const field = normalizeFieldPath(path)
          if (!/^[a-zA-Z_][a-zA-Z0-9_.\[\]]{0,119}$/.test(field)) continue
          for (const error of errors) {
            // Never export values or arbitrary validator messages (they can echo input).
            const knownCodes = [
              "invalid_type",
              "invalid_format",
              "too_small",
              "too_big",
              "custom",
              "invalid_value",
              "invalid_union",
            ]
            const code = knownCodes.includes(error?.code)
              ? error.code
              : "validation_failed"
            if (
              !fields.some(item => item.field === field && item.code === code)
            )
              fields.push({ field, code })
          }
        }
      }
      if (attempts.length >= 3) return
      attempts.push({ stage, fields: fields.slice(0, 50) })
      if (attempts.length !== 3) return
      try {
        const error = new Error("Three unsuccessful form submission attempts")
        error.name = "RepeatedFormSubmissionFailure"
        posthog.captureException(error, {
          form_id: formId,
          attempt_count: 3,
          failure_history: attempts.map(attempt => ({ ...attempt })),
          service: "samfunnetibergen-browser",
        })
      } catch {
        // Reporting must never change the form result.
      }
    },
  }
}
