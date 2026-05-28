import "server-only"

import { stegaClean } from "@sanity/client/stega"
import type { ClientReturn } from "next-sanity"
import { sanityClient } from "../client"
import { sanityFetch } from "../live"
import {
    allStudentGroupSlugsQuery,
    groupsPageQuery,
    studentGroupBySlugQuery,
    studentGroupSlugsQuery,
    studentGroupsByCategory,
    studentGroupsQuery,
} from "../queries"
import type { FetchOptions } from "./shared"

export type GroupsPageContent = NonNullable<ClientReturn<typeof groupsPageQuery>>

export type StudentGroupSummary = ClientReturn<typeof studentGroupsQuery>[number]

export type StudentGroupDetail = NonNullable<ClientReturn<typeof studentGroupBySlugQuery>>

export async function fetchGroupsPageContent(
    options: FetchOptions = {},
): Promise<GroupsPageContent | null> {
    const { data } = await sanityFetch({
        query: groupsPageQuery,
        tags: ["groupsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchStudentGroups(): Promise<StudentGroupSummary[]> {
    const { data: groups } = await sanityFetch({
        query: studentGroupsQuery,
        tags: ["studentGroups"],
    })
    type G = ClientReturn<typeof studentGroupsQuery>[number]
    return groups.flatMap((group: G) =>
        group.slug ? [{ ...group, slug: stegaClean(group.slug) }] : [],
    )
}

export async function fetchStudentGroupsByCategory(
    category: string,
): Promise<StudentGroupSummary[]> {
    const { data: groups } = await sanityFetch({
        query: studentGroupsByCategory,
        params: { category },
        tags: ["studentGroups"],
    })
    type G = ClientReturn<typeof studentGroupsQuery>[number]
    return groups.flatMap((group: G) =>
        group.slug ? [{ ...group, slug: stegaClean(group.slug) }] : [],
    )
}

export async function fetchStudentGroupSlugs(): Promise<string[]> {
    const groups = await sanityClient.fetch(
        studentGroupSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
    return groups.flatMap((group: { slug?: string | null }) => (group.slug ? [group.slug] : []))
}

export async function fetchAllStudentGroupSlugs(): Promise<string[]> {
    const groups = await sanityClient.fetch(
        allStudentGroupSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
    return groups.flatMap((group: { slug?: string | null }) => (group.slug ? [group.slug] : []))
}

export async function fetchStudentGroupBySlug(
    slug: string,
    options: FetchOptions = {},
): Promise<StudentGroupDetail | null> {
    const { data } = await sanityFetch({
        query: studentGroupBySlugQuery,
        params: { slug },
        tags: ["studentGroups"],
        stega: options.stega,
    })
    return data
}
