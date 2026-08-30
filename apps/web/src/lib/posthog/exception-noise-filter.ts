import type { CaptureResult } from "posthog-js"

/**
 * Exception events that are reliably browser, extension, or PostHog-ingest
 * noise rather than bugs in this app. We drop them at the SDK (`before_send`)
 * so they never reach error tracking, instead of relying on PostHog
 * suppression rules that need to be re-applied by hand.
 *
 * Keep this list narrow and evidence-based — each entry maps to a real issue
 * we have already triaged as noise. Over-filtering hides genuine bugs.
 */

type ExceptionEntry = { type?: string; value?: string }

const EXCEPTION_NOISE_PATTERNS: ReadonlyArray<{
  type?: RegExp
  value: RegExp
}> = [
  // ResizeObserver reports this for layout-thrashing observers; harmless.
  {
    value: /ResizeObserver loop completed with undelivered notifications/,
  },
  // React hydration mismatch from browser-extension DOM injection (#418).
  { value: /Minified React error #418/ },
  // React DOM teardown races — typically extensions or StrictMode remounts.
  {
    type: /DOMException/,
    value: /removeChild|The object can not be found here/,
  },
  // Browser-extension global (e.g. Sitecore CDP bridge).
  { type: /ReferenceError/, value: /SCDynimacBridge/ },
  // PostHog ingest network failures (source: /ingest/...), not app fetches.
  { type: /TypeError/, value: /^(network error|Load failed)$/ },
]

function isExceptionNoise(exception: ExceptionEntry): boolean {
  const value = exception.value ?? ""
  return EXCEPTION_NOISE_PATTERNS.some(
    pattern =>
      // Match the value first (always required), then the type if specified.
      pattern.value.test(value) &&
      (pattern.type === undefined ||
        (exception.type !== undefined && pattern.type.test(exception.type))),
  )
}

function getExceptionList(event: CaptureResult): ExceptionEntry[] {
  const list = event.properties?.$exception_list
  return Array.isArray(list) ? (list as ExceptionEntry[]) : []
}

/**
 * `before_send` hook for posthog-js. Drops `$exception` events whose entire
 * exception list is known noise; leaves every other event untouched.
 */
export function filterExceptionNoise(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event || event.event !== "$exception") return event

  const exceptions = getExceptionList(event)
  if (exceptions.length === 0) return event

  return exceptions.every(isExceptionNoise) ? null : event
}
