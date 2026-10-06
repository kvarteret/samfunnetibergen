"use client"

import posthog from "posthog-js"
import { useEffect, useRef } from "react"

import {
  type PromotionContext,
  promotionProperties,
} from "@/lib/posthog/event-placement"
import { entrySurface } from "@/lib/posthog/placement-entry"
import {
  contentPageViewProperties,
  type TrackedContentType,
} from "@/lib/posthog/tracking-attributes"

type ContentPageViewTrackingProps = {
  content: PromotionContext & {
    _id: string
    slug: string
    title: string
  }
  contentType: TrackedContentType
  locale: "nb" | "en"
}

export function ContentPageViewTracking({
  content,
  contentType,
  locale,
}: ContentPageViewTrackingProps) {
  const trackedContentRef = useRef<string | null>(null)

  useEffect(() => {
    const trackingKey = `${contentType}:${content._id}:${locale}`
    if (trackedContentRef.current === trackingKey) return
    trackedContentRef.current = trackingKey

    posthog.capture("content_page_viewed", {
      ...contentPageViewProperties(content, contentType, locale),
      ...(contentType === "arrangement"
        ? {
            ...promotionProperties(content),
            event_id: content.initialSlug ?? content.slug,
            event_document_id: content._id,
            entry_surface:
              entrySurface([content._id, content.slug, content.initialSlug]) ??
              null,
          }
        : {}),
    })
  }, [content, contentType, locale])

  return null
}
