"use client"

import posthog from "posthog-js"
import { useEffect } from "react"

type TrackViewProperties = Record<
  string,
  string | number | boolean | null | undefined
>

/**
 * Fires a PostHog event once per page arrival from the browser, so the event
 * carries the visitor's real client distinct_id (unlike a server-rendered
 * capture on an ISR page, which would fire at revalidate time instead of per
 * visit). Use on detail pages to measure content exploration.
 *
 * `captureKey` is a stable per-page identifier (e.g. the slug); the capture
 * re-fires when it changes so navigating between two detail pages of the same
 * route still records each view.
 */
export function TrackView({
  event,
  captureKey,
  properties,
}: {
  event: string
  captureKey: string
  properties: TrackViewProperties
}) {
  useEffect(() => {
    // posthog-js no-ops before init completes and is disabled entirely on
    // localhost unless explicitly enabled, so this never throws.
    posthog.capture(event, properties)
    // captureKey + event fully determine the capture; properties are derived
    // from the server props for this page and are not reactive dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, captureKey])

  return null
}
