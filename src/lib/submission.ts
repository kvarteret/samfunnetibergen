import {
  type ErrorContext,
  type ErrorWorkflow,
  getHandledExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// Shared plumbing for the public, unauthenticated submission surfaces
// (server actions and API routes): user-facing copy, rate limiting, and
// failure telemetry. Internal error detail never crosses to the client; it
// lives in the PostHog exception captures.

export const GENERIC_SUBMIT_ERROR = "Noe gikk galt. Prøv igjen senere."
export const RATE_LIMIT_ERROR = "For mange forsøk. Vent litt og prøv igjen."
export const INVALID_PAYLOAD_ERROR =
  "Skjemaet er ufullstendig eller inneholder ugyldige verdier."

export const SUBMIT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
export const DEFAULT_SUBMIT_LIMIT = 5

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

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
  getPostHogClient().captureException(
    toPostHogException(error),
    "anonymous",
    getHandledExceptionProperties(workflow, properties),
  )
}
