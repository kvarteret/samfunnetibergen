import type { MetadataRoute } from "next"
import { fetchPublicEventSlugs } from "@/features/events/server/public-events"
import { routing } from "@/i18n/routing"
import {
  fetchPageSlugs,
  fetchRoomSlugs,
  fetchStudentGroupSlugs,
} from "@/lib/sanity/fetch"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { resolveSiteUrl } from "@/lib/site-url"
import {
  buildLocalizedSitemapEntries,
  filterSitemapDynamicPaths,
  PUBLIC_STATIC_PATHS,
} from "./sitemapEntries"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl()

  const [pageSlugs, roomSlugs, groupSlugs, eventSlugs] = await Promise.all([
    fetchPageSlugs(),
    fetchRoomSlugs(),
    fetchStudentGroupSlugs(),
    fetchPublicEventSlugs(getOsloDateString()),
  ])

  const dynamicPaths = filterSitemapDynamicPaths([
    ...pageSlugs.map(slug => `/${slug}`),
    ...roomSlugs.map(slug => `/rom/${slug}`),
    ...groupSlugs.map(slug => `/grupper/${slug}`),
    ...eventSlugs.map(slug => `/arrangementer/${slug}`),
  ])
  const paths = [...new Set([...PUBLIC_STATIC_PATHS, ...dynamicPaths])]

  return buildLocalizedSitemapEntries({
    locales: routing.locales,
    paths,
    siteUrl,
  })
}
