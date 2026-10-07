"use client"

import { useLocale } from "next-intl"
import posthog from "posthog-js"
import { useEffect } from "react"
import { usePathname } from "@/i18n/navigation"
import { observeEventPlacements } from "@/lib/posthog/event-placement-observer"
import { isTrackingExcluded } from "@/lib/posthog/tracking-exclusions"

export function EventPlacementTracking() {
  const pathname = usePathname()
  const locale = useLocale()
  useEffect(() => {
    if (
      isTrackingExcluded(pathname) ||
      isTrackingExcluded(window.location.href) ||
      typeof IntersectionObserver === "undefined"
    )
      return
    return observeEventPlacements(document, locale, (name, properties) => {
      posthog.capture(name, properties)
    })
  }, [pathname, locale])
  return null
}
