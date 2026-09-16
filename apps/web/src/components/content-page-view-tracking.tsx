"use client"

import posthog from "posthog-js"
import { useEffect, useRef } from "react"

import {
  contentPageViewProperties,
  type TrackedContentType,
} from "@/lib/posthog/tracking-attributes"

type ContentPageViewTrackingProps = {
  content: {
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

    posthog.capture(
      "content_page_viewed",
      contentPageViewProperties(content, contentType, locale),
    )
  }, [content._id, content.slug, content.title, contentType, locale])

  return null
}
