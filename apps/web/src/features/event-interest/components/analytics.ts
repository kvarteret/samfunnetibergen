import posthog from "posthog-js"

type InterestAnalytics = {
  loaded: { taps: number; count: number }
  tapped: { taps: number }
  full: { taps: number }
  batch_saved: { requested_clicks: number; taps: number; count: number }
  failed: { phase: "load" | "initialize" | "save" }
  retried: { phase: "load" | "save" }
}

export function captureInterest<Event extends keyof InterestAnalytics>(
  event: Event,
  eventSlug: string,
  locale: string,
  properties: InterestAnalytics[Event],
): void {
  try {
    posthog.capture(`event_interest_${event}`, {
      event_slug: eventSlug,
      locale,
      ...properties,
      $ip: null,
    })
  } catch {
    // Analytics must never affect clicks, saving, or retry feedback.
  }
}
