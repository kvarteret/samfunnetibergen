import "server-only"

import type { ClientReturn } from "next-sanity"
import type { AppLocale } from "@/i18n/routing"
import type { VolunteerGroupsNbQueryResult } from "@/sanity.types"
import { sanityFetch } from "../live"
import {
    blifrivilligPageNbQuery,
    volunteerGroupSummariesNbQuery,
    volunteerGroupsNbQuery,
} from "../queries"
import type { FetchOptions } from "./shared"

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

    type G = NonNullable<VolunteerGroupsNbQueryResult>[number]
    return (groups ?? [])
        .filter((group: G) => Boolean(group.slug))
        .map((group: G) => ({
            slug: group.slug!,
            name: group.name ?? null,
            eyebrow: group.eyebrow ?? null,
            lead: group.lead ?? null,
            imageUrl: group.imageUrl ?? null,
            accordionSections: (group.accordionSections ?? []).map(section => ({
                title: section.title ?? null,
                paragraphs: (section.paragraphs ?? []).filter(
                    (paragraph): paragraph is string => Boolean(paragraph),
                ),
            })),
            detailSections: [],
        }))
}

export async function fetchVolunteerGroupSummaries(_locale: AppLocale) {
    void _locale

    const { data: groups } = await sanityFetch({
        query: volunteerGroupSummariesNbQuery,
        tags: ["volunteerGroupSummaries"],
    })

    return (groups ?? []).flatMap(
        (group: { name: string | null; description: string | null }) =>
            group.name ? [{ ...group, name: group.name }] : [],
    )
}
