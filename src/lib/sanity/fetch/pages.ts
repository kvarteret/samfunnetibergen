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
    tags: ["siteMetadata"],
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
    tags: ["homePage"],
    stega: options.stega,
  })
  return data
}

export async function fetchNavbar(): Promise<NavbarContent | null> {
  const { data } = await sanityFetch({ query: navbarQuery, tags: ["navbar"] })
  return data
}

export async function fetchSponsorsPageContent(
  options: FetchOptions = {},
): Promise<SponsorsPageContent | null> {
  const { data } = await sanityFetch({
    query: sponsorsPageQuery,
    tags: ["sponsorsPage"],
    stega: options.stega,
  })
  return data
}

export async function fetchPageSlugs(): Promise<string[]> {
  const pages = await sanityClient.fetch(
    pageSlugsQuery,
    {},
    { next: { revalidate: 300, tags: ["pages"] } },
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
    tags: ["pages"],
    stega: options.stega,
  })
  return data
}

export async function fetchKontaktPage() {
  const { data } = await sanityFetch({
    query: kontaktPageQuery,
    tags: ["kontaktPage"],
  })
  return data
}

export async function fetchFooter() {
  const { data } = await sanityFetch({ query: footerQuery, tags: ["footer"] })
  return data
}

export async function fetchHouseHours(): Promise<HouseHoursContent | null> {
  const { data } = await sanityFetch({
    query: houseHoursQuery,
    tags: ["siteMetadata"],
  })
  return data
}

export async function fetchLinkInBio() {
  const { data } = await sanityFetch({
    query: linkInBioQuery,
    tags: ["linkInBio"],
  })
  return data
}
