import type { CaptureResult } from "posthog-js"
import { prepareBrowserException } from "./browser-exception"

const EXPOSURE_STORAGE_KEY = "promotion-exposures"
let exposureSession: string | undefined
let exposures = new Set<string>()

function retainPromotionExposure(event: CaptureResult): boolean {
  if (event.properties.is_promoted !== true) return false
  const session = event.properties.$session_id
  const documentId = event.properties.event_document_id
  const surface = event.properties.surface
  if (!session || !documentId || !surface) return false
  if (exposureSession !== session) {
    exposureSession = session
    exposures = new Set()
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(EXPOSURE_STORAGE_KEY) ?? "null",
      )
      if (saved?.session === session && Array.isArray(saved.keys))
        exposures = new Set(saved.keys)
    } catch {
      // Storage can be unavailable; in-memory deduplication still applies.
    }
  }
  const key = JSON.stringify([documentId, surface])
  if (exposures.has(key)) return false
  exposures.add(key)
  try {
    window.localStorage.setItem(
      EXPOSURE_STORAGE_KEY,
      JSON.stringify({ session, keys: [...exposures] }),
    )
  } catch {
    // Keep tracking functional when browser storage is disabled.
  }
  return true
}

export function isTrackingExcluded(url: string | undefined): boolean {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url, "https://samfunnetibergen.no")
    return (
      hostname.endsWith(".vercel.app") ||
      pathname === "/infoskjerm" ||
      pathname.startsWith("/infoskjerm/")
    )
  } catch {
    return false
  }
}

export function prepareBrowserEvent(
  event: CaptureResult | null,
): CaptureResult | null {
  const currentUrl =
    typeof window === "undefined" ? undefined : window.location.href
  const eventUrl = event?.properties?.$current_url
  if (
    isTrackingExcluded(currentUrl) ||
    (typeof eventUrl === "string" && isTrackingExcluded(eventUrl))
  ) {
    return null
  }
  if (
    event?.event === "event_placement_viewed" &&
    !retainPromotionExposure(event)
  )
    return null
  return prepareBrowserException(event)
}
