import type { AppLocale } from "@/i18n/routing"
import { fetchLaunchGroups, fetchVolunteerGroupSummaries } from "@/lib/sanity/queries"
import enMessages from "@/messages/en.json"
import nbMessages from "@/messages/nb.json"

export type LaunchGroupSlug = string

type GroupSection = {
    title: string | null
    paragraphs: string[]
}

export type LaunchGroupContent = {
    slug: LaunchGroupSlug
    name: string | null
    eyebrow: string | null
    lead: string | null
    accordionSections: GroupSection[]
    detailSections: GroupSection[]
    imageUrl: string | null
}

export type InstitutionOption = {
    value: string
    label: string
}

export type VolunteerGroupSummary = {
    name: string
    description: string | null
}

export function getInstitutionOptions(locale: AppLocale): InstitutionOption[] {
    return messagesByLocale[locale].InstitutionOptions as InstitutionOption[]
}

export async function getLaunchGroups(locale: AppLocale): Promise<LaunchGroupContent[]> {
    return fetchLaunchGroups(locale)
}

export async function getLaunchGroupBySlug(
    locale: AppLocale,
    slug: string,
): Promise<LaunchGroupContent | undefined> {
    const groups = await fetchLaunchGroups(locale)
    return groups.find(group => group.slug === slug)
}

export async function getVolunteerGroupSummaries(
    locale: AppLocale,
): Promise<VolunteerGroupSummary[]> {
    return fetchVolunteerGroupSummaries(locale)
}

const messagesByLocale = {
    nb: nbMessages,
    en: enMessages,
} as const

// Compatibility export for stale dev graphs that may still reference the
// pre-i18n module shape while Turbopack refreshes.
export const institutionOptions = getInstitutionOptions("nb")
