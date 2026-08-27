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
