import "server-only"

import type { ClientReturn } from "@sanity/client"
import type { AppLocale } from "@/i18n/routing"
import { sanityFetch } from "../fetcher"
import {
    blifrivilligPageNbQuery,
    volunteerGroupSummariesNbQuery,
    volunteerGroupsNbQuery,
} from "../queries"
import { compact, type FetchOptions, withRequiredKeys } from "./shared"

export type BlifrivilligPageContent = NonNullable<ClientReturn<typeof blifrivilligPageNbQuery>>

export async function fetchBlifrivilligPage(
    _locale: AppLocale,
    options: FetchOptions = {},
): Promise<BlifrivilligPageContent | null> {
    const { data } = await sanityFetch({
        query: blifrivilligPageNbQuery,
        tags: ["blifrivilligPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchVolunteerGroups(_locale: AppLocale) {
    void _locale

    const { data: groups } = await sanityFetch({
        query: volunteerGroupsNbQuery,
        tags: ["volunteerGroups"],
    })

    return withRequiredKeys(groups ?? [], "slug").map(group => ({
        ...group,
        accordionSections: (group.accordionSections ?? []).map(section => ({
            title: section.title,
            paragraphs: compact(section.paragraphs ?? []),
        })),
    }))
}

export async function fetchVolunteerGroupSummaries(_locale: AppLocale) {
    void _locale

    const { data: groups } = await sanityFetch({
        query: volunteerGroupSummariesNbQuery,
        tags: ["volunteerGroupSummaries"],
    })

    return groups ?? []
}
