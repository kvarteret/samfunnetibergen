import type { MetadataRoute } from "next"
import { routing } from "@/i18n/routing"
import {
  fetchPageSlugs,
  fetchPublishedEventSlugs,
  fetchRoomSlugs,
  fetchStudentGroupSlugs,
} from "@/lib/sanity/fetch"
import { resolveSiteUrl } from "@/lib/site-url"
import {
  buildLocalizedSitemapEntries,
  PUBLIC_STATIC_PATHS,
} from "./sitemapEntries"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl()
  const lastModified = new Date()

  const [pageSlugs, roomSlugs, groupSlugs, eventSlugs] = await Promise.all([
    fetchPageSlugs(),
    fetchRoomSlugs(),
    fetchStudentGroupSlugs(),
    fetchPublishedEventSlugs(),
  ])

  const dynamicPaths = [
    ...pageSlugs.map(slug => `/${slug}`),
    ...roomSlugs.map(slug => `/rom/${slug}`),
    ...groupSlugs.map(slug => `/grupper/${slug}`),
    ...eventSlugs.map(slug => `/arrangementer/${slug}`),
  ]
  const paths = [...new Set([...PUBLIC_STATIC_PATHS, ...dynamicPaths])]

  return buildLocalizedSitemapEntries({
    locales: routing.locales,
    paths,
    siteUrl,
    lastModified,
  })
}
