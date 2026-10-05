import type { CaptureResult } from "posthog-js"
import { prepareBrowserException } from "./browser-exception"

export function isTrackingExcluded(url: string | undefined): boolean {
  if (!url) return false
  try {
    const { pathname } = new URL(url, "https://samfunnetibergen.no")
    return pathname === "/infoskjerm" || pathname.startsWith("/infoskjerm/")
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
  return prepareBrowserException(event)
}
