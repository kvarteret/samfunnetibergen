import "server-only"

import type { AppLocale } from "@/i18n/routing"
import type { LaunchGroupContent, VolunteerGroupSummary } from "@/lib/volunteer-launch-content"

import { sanityClient } from "./client"
import {
    eventsPageContentEnQuery,
    eventsPageContentNbQuery,
    homeBarsEnQuery,
    homeBarsNbQuery,
    homePageContentEnQuery,
    homePageContentNbQuery,
    launchGroupsEnQuery,
    launchGroupsNbQuery,
    siteMetadataEnQuery,
    siteMetadataNbQuery,
    volunteerGroupSummariesEnQuery,
    volunteerGroupSummariesNbQuery,
} from "./query-definitions"
import type {
    EventsPageContent,
    HomeBarContent,
    HomePageContent,
    SiteMetadataContent,
} from "./types"

export async function fetchLaunchGroups(locale: AppLocale): Promise<LaunchGroupContent[]> {
    const groups = await sanityClient.fetch(
        locale === "en" ? launchGroupsEnQuery : launchGroupsNbQuery,
        {},
        { next: { revalidate: 300, tags: ["launchGroups"] } },
    )

    return groups.flatMap(group => {
        if (!group.slug) {
            return []
        }

        return [
            {
                ...group,
                slug: group.slug,
                accordionSections: (group.accordionSections ?? []).map(section => ({
                    ...section,
                    paragraphs: section.paragraphs ?? [],
                })),
                detailSections: (group.detailSections ?? []).map(section => ({
                    ...section,
                    paragraphs: section.paragraphs ?? [],
                })),
            },
        ]
    })
}

export async function fetchVolunteerGroupSummaries(
    locale: AppLocale,
): Promise<VolunteerGroupSummary[]> {
    const groups = await sanityClient.fetch(
        locale === "en" ? volunteerGroupSummariesEnQuery : volunteerGroupSummariesNbQuery,
        {},
        { next: { revalidate: 300, tags: ["volunteerGroupSummaries"] } },
    )

    return groups.flatMap(group => (group.name ? [{ ...group, name: group.name }] : []))
}

export async function fetchHomePageContent(locale: AppLocale): Promise<HomePageContent | null> {
    return sanityClient.fetch(
        locale === "en" ? homePageContentEnQuery : homePageContentNbQuery,
        {},
        { next: { revalidate: 300, tags: ["homePage"] } },
    )
}

export async function fetchEventsPageContent(locale: AppLocale): Promise<EventsPageContent | null> {
    return sanityClient.fetch(
        locale === "en" ? eventsPageContentEnQuery : eventsPageContentNbQuery,
        {},
        { next: { revalidate: 300, tags: ["eventsPage"] } },
    )
}

export async function fetchSiteMetadata(locale: AppLocale): Promise<SiteMetadataContent | null> {
    return sanityClient.fetch(
        locale === "en" ? siteMetadataEnQuery : siteMetadataNbQuery,
        {},
        { next: { revalidate: 300, tags: ["siteMetadata"] } },
    )
}

export async function fetchHomeBars(locale: AppLocale): Promise<HomeBarContent[]> {
    return sanityClient.fetch(
        locale === "en" ? homeBarsEnQuery : homeBarsNbQuery,
        {},
        { next: { revalidate: 300, tags: ["homeBars"] } },
    )
}
