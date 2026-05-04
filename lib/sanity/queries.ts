import "server-only"

import type { AppLocale } from "@/i18n/routing"
import type { LaunchGroupContent, VolunteerGroupSummary } from "@/lib/volunteer-launch-content"

import { sanityClient } from "./client"

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
