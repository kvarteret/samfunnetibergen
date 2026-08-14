import "server-only"

import type { ClientReturn } from "@sanity/client"
import type { AppLocale } from "@/i18n/routing"
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
  sponsorsPageQuery,
  usefulInfoPageQuery,
} from "../queries"
import { compact, type FetchOptions } from "./shared"
import { DEFAULT_LOCALE } from "../localized"

export type HouseHoursContent = NonNullable<
  ClientReturn<typeof houseHoursQuery>
>

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
  const { data } = await sanityFetch({
    query: pageBySlugQuery,
    params: { slug, locale },
    stega: options.stega,
  })
  return data
}

export async function fetchKontaktPage(locale: AppLocale = DEFAULT_LOCALE) {
  const { data } = await sanityFetch({
    query: kontaktPageQuery,
    params: { locale },
  })
  return data
}

export async function fetchFooter(locale: AppLocale = DEFAULT_LOCALE) {
  const { data } = await sanityFetch({ query: footerQuery, params: { locale } })
  return data
}

export async function fetchHouseHours(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<HouseHoursContent | null> {
  const { data } = await sanityFetch({
    query: houseHoursQuery,
    params: { locale },
  })
  return data
}

export async function fetchLinkInBio(locale: AppLocale = DEFAULT_LOCALE) {
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
  const { data } = await sanityFetch({
    query: usefulInfoPageQuery,
    params: { locale },
  })
  return data
}
