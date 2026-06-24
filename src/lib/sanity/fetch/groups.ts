import "server-only"

import type { ClientReturn } from "@sanity/client"
import { stegaClean } from "@sanity/client/stega"
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
  options: FetchOptions = {},
): Promise<GroupsPageContent | null> {
  const { data } = await sanityFetch({
    query: groupsPageQuery,
    stega: options.stega,
  })
  return data
}

export async function fetchStudentGroups(): Promise<StudentGroupSummary[]> {
  const { data: groups } = (await sanityFetch({
    query: studentGroupsQuery,
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
  options: FetchOptions = {},
): Promise<StudentGroupDetail | null> {
  const { data } = await sanityFetch({
    query: studentGroupBySlugQuery,
    params: { slug },
    stega: options.stega,
  })
  return data
}
