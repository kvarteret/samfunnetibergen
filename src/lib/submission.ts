import {
  type ErrorContext,
  type ErrorWorkflow,
  getHandledExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
export { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"

// Shared plumbing for the public, unauthenticated submission surfaces
// (server actions and API routes): user-facing copy, rate limiting, and
// failure telemetry. Internal error detail never crosses to the client; it
// lives in the PostHog exception captures.

export const RATE_LIMIT_ERROR = "For mange forsøk. Vent litt og prøv igjen."
export const INVALID_PAYLOAD_ERROR =
  "Skjemaet er ufullstendig eller inneholder ugyldige verdier."

export const SUBMIT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
export const DEFAULT_SUBMIT_LIMIT = 5

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export interface SubmissionValidationIssue {
  code?: unknown
  path?: readonly unknown[]
}

/**
 * Convert schema issues into stable, value-free telemetry fields. Never pass
 * the issue objects or submitted values to PostHog: some validation libraries
 * include the original input in their richer error structures.
 */
export function getValidationDiagnostics(
  issues: readonly SubmissionValidationIssue[],
): Pick<ErrorContext, "issue_count" | "field_paths" | "issue_codes"> {
  const paths = new Set<string>()
  const codes = new Set<string>()

  for (const issue of issues) {
    const path = (issue.path ?? [])
      .map(segment => {
        if (
          typeof segment === "object" &&
          segment !== null &&
          "key" in segment
        ) {
          return String((segment as { key: unknown }).key)
        }
        return String(segment)
      })
      .join(".")
    paths.add(path || "form")

    if (typeof issue.code === "string" && issue.code) {
      codes.add(issue.code)
    }
  }

  return {
    issue_count: issues.length,
    field_paths: [...paths].sort().join(","),
    issue_codes: [...codes].sort().join(","),
  }
}

/** Per-IP rate limit for a named submission surface; true when the caller
 * should be rejected with RATE_LIMIT_ERROR / HTTP 429. */
export async function isSubmissionRateLimited(
  name: string,
  limit = DEFAULT_SUBMIT_LIMIT,
): Promise<boolean> {
  const ip = await getClientIp()
  return !checkRateLimit({
    name,
    ip,
    limit,
    windowMs: SUBMIT_RATE_LIMIT_WINDOW_MS,
  })
}

/** One PostHog exception capture per failure, tagged with the workflow and
 * any submission context worth debugging with. */
export function captureSubmitFailure(
  workflow: ErrorWorkflow,
  error: unknown,
  properties: ErrorContext = {},
): void {
  try {
    getPostHogClient().captureException(
      toPostHogException(error),
      "anonymous",
      getHandledExceptionProperties(workflow, properties),
    )
  } catch {
    // Submission feedback must not depend on telemetry availability.
  }
}
