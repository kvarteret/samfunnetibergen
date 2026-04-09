import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { VolunteerProspectExperience } from "@/components/volunteer-prospect-experience"
import { routing } from "@/i18n/routing"
import {
    getInstitutionOptions,
    getLaunchGroups,
} from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return routing.locales.map(locale => ({ locale }))
}

export async function generateMetadata({
    params,
}: PageProps<"/[locale]">) {
    const { locale } = await params
    const t = await getTranslations({
        locale,
        namespace: "Metadata",
    })

    return {
        title: t("homeTitle"),
        description: t("homeDescription"),
    }
}

export default async function Home({
    params,
    searchParams,
}: PageProps<"/[locale]"> & {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const { locale } = await params

    if (!hasLocale(routing.locales, locale)) {
        notFound()
    }

    setRequestLocale(locale)

    const resolvedSearchParams = (await searchParams) ?? {}
    const requestedGroup = resolvedSearchParams.group
    const initialGroupSlug =
        typeof requestedGroup === "string" ? requestedGroup : undefined

    return (
        <VolunteerProspectExperience
            groups={getLaunchGroups(locale)}
            initialGroupSlug={initialGroupSlug}
            institutionOptions={getInstitutionOptions(locale)}
        />
    )
}
