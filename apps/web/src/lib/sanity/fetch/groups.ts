import "server-only"

import type { ClientReturn } from "@sanity/client"
import { stegaClean } from "@sanity/client/stega"
import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  groupsPageQuery,
  studentGroupBySlugQuery,
  studentGroupSlugsQuery,
  studentGroupsQuery,
} from "../queries"
import { compact, type FetchOptions, withRequiredKeys } from "./shared"

export type GroupsPageContent = NonNullable<
  ClientReturn<typeof groupsPageQuery>
>

type StudentGroupSummaryRaw = ClientReturn<typeof studentGroupsQuery>[number]

export type StudentGroupSummary = Omit<StudentGroupSummaryRaw, "labels"> & {
  labels: string[]
}

export type StudentGroupDetail = NonNullable<
  ClientReturn<typeof studentGroupBySlugQuery>
>

export async function fetchGroupsPageContent(
  locale: AppLocale,
  options: FetchOptions = {},
): Promise<GroupsPageContent | null> {
  const { data } = await sanityFetch({
    query: groupsPageQuery,
    params: { locale },
    stega: options.stega,
  })
  return data
}

export async function fetchStudentGroups(
  locale: AppLocale,
): Promise<StudentGroupSummary[]> {
  const { data: groups } = (await sanityFetch({
    query: studentGroupsQuery,
    params: { locale },
  })) as { data: readonly StudentGroupSummaryRaw[] | null }
  return withRequiredKeys(groups ?? [], "slug").map(group => ({
    ...group,
    labels: group.labels as string[],
    slug: stegaClean(group.slug),
  }))
}

export async function fetchStudentGroupSlugs(): Promise<string[]> {
  const groups = await sanityClient.fetch(
    studentGroupSlugsQuery,
    {},
    {
      perspective: "published",
      stega: false,
    },
  )
  return compact(groups.map(group => group.slug))
}

export async function fetchStudentGroupBySlug(
  slug: string,
  locale: AppLocale,
  options: FetchOptions = {},
): Promise<StudentGroupDetail | null> {
  const { data } = await sanityFetch({
    query: studentGroupBySlugQuery,
    params: { slug, locale },
    stega: options.stega,
  })
  return data
}
