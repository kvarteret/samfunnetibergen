import "server-only"

import type { ClientReturn } from "@sanity/client"
import type { AppLocale } from "@/i18n/routing"
import { hasOpeningHoursRows } from "@/lib/opening-hours"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  footerQuery,
  homePageNbQuery,
  houseHoursQuery,
  kontaktPageQuery,
  linkInBioQuery,
  navbarQuery,
  pageBySlugQuery,
  pageSlugsQuery,
  siteLogoQuery,
  sponsorsPageQuery,
  usefulInfoPageQuery,
} from "../queries"
import { compact, cleanOpeningHours, type FetchOptions } from "./shared"
import { DEFAULT_LOCALE } from "../localized"
import { isLocalFixtureMode } from "../offline"

export type HouseHoursContent = NonNullable<
  ClientReturn<typeof houseHoursQuery>
>

export type SiteLogoContent = NonNullable<ClientReturn<typeof siteLogoQuery>>

export type HomePageContent = NonNullable<ClientReturn<typeof homePageNbQuery>>

export type SponsorsPageContent = NonNullable<
  ClientReturn<typeof sponsorsPageQuery>
>

export type PageContent = NonNullable<ClientReturn<typeof pageBySlugQuery>>

export type NavbarContent = NonNullable<ClientReturn<typeof navbarQuery>>

export type NavItem = NonNullable<NavbarContent["items"]>[number]

export type NavGroup = NonNullable<NavItem["children"]>[number]

export type NavLeaf = NonNullable<NavGroup["items"]>[number]

export async function fetchHomePageContent(
  locale: AppLocale = DEFAULT_LOCALE,
  options: FetchOptions = {},
): Promise<HomePageContent | null> {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: homePageNbQuery,
    params: { locale },
    stega: options.stega,
  })
  return data
}

export async function fetchNavbar(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<NavbarContent | null> {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({ query: navbarQuery, params: { locale } })
  return data
}

export async function fetchSponsorsPageContent(
  locale: AppLocale = DEFAULT_LOCALE,
  options: FetchOptions = {},
): Promise<SponsorsPageContent | null> {
  const { data } = await sanityFetch({
    query: sponsorsPageQuery,
    params: { locale },
    stega: options.stega,
  })
  return data
}

export async function fetchPageSlugs(): Promise<string[]> {
  if (isLocalFixtureMode) return []
  const pages = await sanityClient.fetch(
    pageSlugsQuery,
    {},
    {
      perspective: "published",
      stega: false,
    },
  )
  return compact(pages.map(p => p.slug))
}

export async function fetchPageBySlug(
  slug: string,
  locale: AppLocale = DEFAULT_LOCALE,
  options: FetchOptions = {},
): Promise<PageContent | null> {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: pageBySlugQuery,
    params: { slug, locale },
    stega: options.stega,
  })
  return data
}

export async function fetchKontaktPage(locale: AppLocale = DEFAULT_LOCALE) {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: kontaktPageQuery,
    params: { locale },
  })
  return data
}

export async function fetchFooter(locale: AppLocale = DEFAULT_LOCALE) {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({ query: footerQuery, params: { locale } })
  if (!data) return data
  return {
    ...data,
    openingHours: cleanOpeningHours(data.openingHours),
    roomHours: data.roomHours?.map(room => ({
      ...room,
      hours: cleanOpeningHours(room.hours),
    })),
  }
}

export async function fetchHouseHours(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<HouseHoursContent | null> {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: houseHoursQuery,
    params: { locale },
  })
  if (!data) return null

  const openingHours = cleanOpeningHours(data.openingHours)
  // "Huset kan bookes": until an editor configures rows, fall back to the
  // ordinary opening hours so booking windows keep today's behaviour.
  const bookableHours = cleanOpeningHours(data.bookableHours)
  return {
    ...data,
    openingHours,
    bookableHours: hasOpeningHoursRows(bookableHours)
      ? bookableHours
      : openingHours,
  }
}

export async function fetchSiteLogo(
  options: FetchOptions = {},
): Promise<SiteLogoContent | null> {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: siteLogoQuery,
    stega: options.stega,
  })
  return data
}

export async function fetchLinkInBio(locale: AppLocale = DEFAULT_LOCALE) {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: linkInBioQuery,
    params: { locale },
  })
  return data
}

export type UsefulInfoPage = NonNullable<
  ClientReturn<typeof usefulInfoPageQuery>
>

export async function fetchUsefulInfoPage(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<UsefulInfoPage | null> {
  if (isLocalFixtureMode) return null
  const { data } = await sanityFetch({
    query: usefulInfoPageQuery,
    params: { locale },
  })
  return data
}
