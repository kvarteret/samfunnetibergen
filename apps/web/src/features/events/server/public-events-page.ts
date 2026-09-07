import "server-only"

import { draftMode } from "next/headers"

import type { AppLocale } from "@/i18n/routing"
import type { FetchOptions } from "@/lib/sanity/fetch/shared"
import { sanityFetch } from "@/lib/sanity/fetcher"
import {
  previewEventBySlugQuery,
  previewEventChildrenQuery,
} from "@/lib/sanity/queries"

import type { RawPublicEvent } from "../domain/events"
import { resolvePublicEvent } from "../domain/events"
import {
  fetchPublicEventBySlug,
  type PublicEventDetailResult,
} from "./public-events"

/** Load a website event detail with Presentation draft support when enabled. */
export async function fetchEventPageData(
  slug: string,
  locale: AppLocale,
  options: FetchOptions = {},
): Promise<PublicEventDetailResult | null> {
  const { isEnabled: preview } = await draftMode()
  if (!preview) return fetchPublicEventBySlug(slug, locale)

  const { data: row } = (await sanityFetch({
    query: previewEventBySlugQuery,
    params: {
      preview,
      slug,
      locale,
      from: null,
      to: null,
      includeInternal: true,
    },
    stega: options.stega,
  })) as { data: RawPublicEvent | null }
  if (!row) return null

  const event = resolvePublicEvent(row)
  const isParent =
    event.eventKind === "seriesParent" || event.eventKind === "festivalParent"
  if (!isParent) return { event, children: [] }

  const { data: childRows } = (await sanityFetch({
    query: previewEventChildrenQuery,
    params: {
      parentId: event._id,
      locale,
      from: null,
      to: null,
      includeInternal: true,
    },
    stega: options.stega,
  })) as { data: RawPublicEvent[] }

  return {
    event,
    children: childRows.map(childRow => resolvePublicEvent(childRow)),
  }
}
