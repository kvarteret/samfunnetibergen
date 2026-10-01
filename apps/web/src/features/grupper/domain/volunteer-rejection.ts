import type { FormValidationIssue } from "@/lib/form-validation-errors"

const FIELD_NAMES = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "studyInstitution",
  "backgroundDetails",
  "firstChoiceGroupSlug",
  "secondChoiceGroupSlug",
  "friendEmails",
])

export type VolunteerRejection = {
  message: string
  issues: FormValidationIssue[]
  detail: string | { message: string; fieldErrors: Record<string, string> }
}

/** Only expose known form fields, never arbitrary upstream objects or inputs. */
export function parseVolunteerRejection(
  detail: unknown,
  fallback: string,
): VolunteerRejection {
  const object =
    detail && typeof detail === "object"
      ? (detail as Record<string, unknown>)
      : undefined
  const messageValue = typeof detail === "string" ? detail : object?.message
  const message =
    typeof messageValue === "string" && messageValue.trim()
      ? messageValue.slice(0, 500)
      : fallback
  const issues: FormValidationIssue[] = []
  const fields = object?.fieldErrors
  if (fields && typeof fields === "object" && !Array.isArray(fields)) {
    for (const [path, value] of Object.entries(fields)) {
      if (FIELD_NAMES.has(path) && typeof value === "string") {
        issues.push({ path, message: value.slice(0, 500) })
      } else if (
        /^friendEmails\[[01]\]$/.test(path) &&
        typeof value === "string"
      ) {
        issues.push({ path, message: value.slice(0, 500) })
      } else if (
        path === "friendEmails" &&
        value &&
        typeof value === "object"
      ) {
        for (const [index, error] of Object.entries(value)) {
          if (/^[01]$/.test(index) && typeof error === "string") {
            issues.push({
              path: `friendEmails[${index}]`,
              message: error.slice(0, 500),
            })
          }
        }
      }
    }
  }
  return {
    message,
    issues,
    detail: issues.length
      ? {
          message,
          fieldErrors: Object.fromEntries(
            issues.map(issue => [issue.path, issue.message]),
          ),
        }
      : message,
  }
}

export function volunteerRejectionDiagnostics(
  rejection: VolunteerRejection,
  upstreamCode: string | null = null,
) {
  const allowedCodes = new Set([
    "group_not_found",
    "duplicate_group_choices",
    "first_choice_required",
    "field_validation",
    "domain_validation",
    "phone_required",
    "phone_invalid",
  ])
  return {
    issue_count: rejection.issues.length,
    field_paths: [
      ...new Set(
        rejection.issues.map(issue => issue.path.replace(/\[\d+\]/g, "[]")),
      ),
    ]
      .sort()
      .join(","),
    issue_codes:
      upstreamCode && allowedCodes.has(upstreamCode)
        ? upstreamCode
        : rejection.issues.length
          ? "upstream_field_validation"
          : "upstream_rejection",
  }
}
