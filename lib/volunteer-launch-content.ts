import enMessages from "@/messages/en.json"
import nbMessages from "@/messages/nb.json"

import type { AppLocale } from "@/i18n/routing"

export type LaunchGroupSlug = "skjenkegruppen" | "kraft" | "vaktetaten"

type GroupSection = {
    title: string
    paragraphs: string[]
}

export type LaunchGroupContent = {
    slug: LaunchGroupSlug
    name: string
    eyebrow: string
    lead: string
    accordionSections: GroupSection[]
    detailSections: GroupSection[]
}

export type InstitutionOption = {
    value: string
    label: string
}

export type VolunteerGroupSummary = {
    name: string
    description: string
}

const messagesByLocale = {
    nb: nbMessages,
    en: enMessages,
} as const

function getMessages(locale: AppLocale) {
    return messagesByLocale[locale]
}

export function getInstitutionOptions(locale: AppLocale) {
    return getMessages(locale).InstitutionOptions as InstitutionOption[]
}

export function getLaunchGroups(locale: AppLocale) {
    return getMessages(locale).LaunchGroups as LaunchGroupContent[]
}

export function getLaunchGroupBySlug(locale: AppLocale, slug: string) {
    return getLaunchGroups(locale).find(group => group.slug === slug)
}

export function getVolunteerGroupSummaries(locale: AppLocale) {
    return getMessages(locale).VolunteerGroupSummaries as VolunteerGroupSummary[]
}

// Compatibility exports for stale dev graphs that may still reference the
// pre-i18n module shape while Turbopack refreshes.
export const institutionOptions = getInstitutionOptions("nb")
export const launchGroups = getLaunchGroups("nb")
