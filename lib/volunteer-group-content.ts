import type { AppLocale } from "@/i18n/routing"
import { fetchVolunteerGroupSummaries, fetchVolunteerGroups } from "@/lib/sanity/queries"
import enMessages from "@/messages/en.json"
import nbMessages from "@/messages/nb.json"

export type VolunteerGroupSlug = string

type GroupSection = {
    title: string | null
    paragraphs: string[]
}

export type VolunteerGroupContent = {
    slug: VolunteerGroupSlug
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

export async function getVolunteerGroups(locale: AppLocale): Promise<VolunteerGroupContent[]> {
    return fetchVolunteerGroups(locale)
}

export async function getVolunteerGroupBySlug(
    locale: AppLocale,
    slug: string,
): Promise<VolunteerGroupContent | undefined> {
    const groups = await fetchVolunteerGroups(locale)
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
