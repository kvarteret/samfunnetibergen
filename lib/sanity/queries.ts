import "server-only"

import type { AppLocale } from "@/i18n/routing"
import type { LaunchGroupContent, VolunteerGroupSummary } from "@/lib/volunteer-launch-content"

import { sanityClient } from "./client"
import type { EventsPageContent, HomeBarContent, HomePageContent } from "./types"

const localeSuffix = (locale: AppLocale): "Nb" | "En" => (locale === "en" ? "En" : "Nb")

export async function fetchLaunchGroups(locale: AppLocale): Promise<LaunchGroupContent[]> {
    const s = localeSuffix(locale)
    return sanityClient.fetch(
        `*[_type == "launchGroup"] | order(_createdAt asc) {
            slug,
            "name": name${s},
            "eyebrow": eyebrow${s},
            "lead": lead${s},
            "accordionSections": accordionSections[] {
                "title": title${s},
                "paragraphs": paragraphs${s}
            },
            "detailSections": detailSections[] {
                "title": title${s},
                "paragraphs": paragraphs${s}
            }
        }`,
        {},
        { next: { revalidate: 300, tags: ["launchGroups"] } },
    )
}

export async function fetchVolunteerGroupSummaries(
    locale: AppLocale,
): Promise<VolunteerGroupSummary[]> {
    const s = localeSuffix(locale)
    return sanityClient.fetch(
        `*[_type == "volunteerGroupSummary"] | order(order asc) {
            name,
            "description": description${s}
        }`,
        {},
        { next: { revalidate: 300, tags: ["volunteerGroupSummaries"] } },
    )
}

export async function fetchHomePageContent(locale: AppLocale): Promise<HomePageContent | null> {
    const s = localeSuffix(locale)
    const results = await sanityClient.fetch<HomePageContent[]>(
        `*[_type == "homePage"][0..0] {
            "badge": badge${s},
            "heroDescription": heroDescription${s},
            "heroDescriptionFusion": heroDescriptionFusion${s},
            "eventsLink": eventsLink${s}
        }`,
        {},
        { next: { revalidate: 300, tags: ["homePage"] } },
    )
    return results[0] ?? null
}

export async function fetchEventsPageContent(locale: AppLocale): Promise<EventsPageContent | null> {
    const s = localeSuffix(locale)
    const results = await sanityClient.fetch<EventsPageContent[]>(
        `*[_type == "eventsPage"][0..0] {
            "eyebrow": eyebrow${s},
            "title": title${s},
            "description": description${s}
        }`,
        {},
        { next: { revalidate: 300, tags: ["eventsPage"] } },
    )
    return results[0] ?? null
}

export async function fetchHomeBars(locale: AppLocale): Promise<HomeBarContent[]> {
    const s = localeSuffix(locale)
    return sanityClient.fetch(
        `*[_type == "homeBar"] | order(order asc) {
            "name": name${s},
            "description": description${s}
        }`,
        {},
        { next: { revalidate: 300, tags: ["homeBars"] } },
    )
}
