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
  siteMetadataNbQuery,
  sponsorsPageQuery,
  usefulInfoPageQuery,
} from "../queries"
import { compact, type FetchOptions } from "./shared"

export type SiteMetadataContent = NonNullable<
  ClientReturn<typeof siteMetadataNbQuery>
>

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

export async function fetchSiteMetadata(
  _locale: AppLocale,
  options: FetchOptions = {},
): Promise<SiteMetadataContent | null> {
  const { data } = await sanityFetch({
    query: siteMetadataNbQuery,
    stega: options.stega,
  })
  return data
}

export async function fetchHomePageContent(
  _locale: AppLocale,
  options: FetchOptions = {},
): Promise<HomePageContent | null> {
  const { data } = await sanityFetch({
    query: homePageNbQuery,
    stega: options.stega,
  })
  return data
}

export async function fetchNavbar(): Promise<NavbarContent | null> {
  const { data } = await sanityFetch({ query: navbarQuery })
  return data
}

export async function fetchSponsorsPageContent(
  options: FetchOptions = {},
): Promise<SponsorsPageContent | null> {
  const { data } = await sanityFetch({
    query: sponsorsPageQuery,
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
  options: FetchOptions = {},
): Promise<PageContent | null> {
  const { data } = await sanityFetch({
    query: pageBySlugQuery,
    params: { slug },
    stega: options.stega,
  })
  return data
}

export async function fetchKontaktPage() {
  const { data } = await sanityFetch({
    query: kontaktPageQuery,
  })
  return data
}

export async function fetchFooter() {
  const { data } = await sanityFetch({ query: footerQuery })
  return data
}

export async function fetchHouseHours(): Promise<HouseHoursContent | null> {
  const { data } = await sanityFetch({
    query: houseHoursQuery,
  })
  return data
}

export async function fetchLinkInBio() {
  const { data } = await sanityFetch({
    query: linkInBioQuery,
  })
  return data
}

export type UsefulInfoPage = NonNullable<
  ClientReturn<typeof usefulInfoPageQuery>
>

export async function fetchUsefulInfoPage(): Promise<UsefulInfoPage | null> {
  const { data } = await sanityFetch({
    query: usefulInfoPageQuery,
  })
  return data
}
