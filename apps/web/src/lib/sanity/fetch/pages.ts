import "server-only"

import type { ClientReturn } from "@sanity/client"
import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  footerQuery,
  homePageQuery,
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

export type HouseHoursContent = NonNullable<
  ClientReturn<typeof houseHoursQuery>
>

export type HomePageContent = NonNullable<ClientReturn<typeof homePageQuery>>

export type SponsorsPageContent = NonNullable<
  ClientReturn<typeof sponsorsPageQuery>
>

export type PageContent = NonNullable<ClientReturn<typeof pageBySlugQuery>>

export type NavbarContent = NonNullable<ClientReturn<typeof navbarQuery>>

export type NavItem = NonNullable<NavbarContent["items"]>[number]

export type NavGroup = NonNullable<NavItem["children"]>[number]

export type NavLeaf = NonNullable<NavGroup["items"]>[number]

export async function fetchHomePageContent(
  locale: AppLocale,
  options: FetchOptions = {},
): Promise<HomePageContent | null> {
  const { data } = await sanityFetch({
    query: homePageQuery,
    params: { locale },
    stega: options.stega,
  })
  return data
}

export async function fetchNavbar(): Promise<NavbarContent | null> {
  const { data } = await sanityFetch({ query: navbarQuery })
  return data
}

export async function fetchSponsorsPageContent(
  locale: AppLocale = "nb",
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
  options: FetchOptions & { locale?: AppLocale } = {},
): Promise<PageContent | null> {
  const { data } = await sanityFetch({
    query: pageBySlugQuery,
    params: { slug, locale: options.locale ?? "nb" },
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

export async function fetchUsefulInfoPage(
  locale: AppLocale = "nb",
): Promise<UsefulInfoPage | null> {
  const { data } = await sanityFetch({
    query: usefulInfoPageQuery,
    params: { locale },
  })
  return data
}
