import { getTranslations } from "next-intl/server"

import { VolunteerProspectExperience } from "@/components/volunteer-prospect-experience"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchHomePageContent } from "@/lib/sanity/queries"
import { resolveInitialLaunchGroupSlug } from "@/lib/volunteer-groups"
import { getInstitutionOptions, getLaunchGroups } from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
    const locale = await resolvePageLocale(params)
    const t = await getTranslations({ locale, namespace: "Metadata" })

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
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const [groups, homeContent] = await Promise.all([
        getLaunchGroups(locale),
        fetchHomePageContent(locale),
    ])
    const resolvedSearchParams = (await searchParams) ?? {}

    return (
        <VolunteerProspectExperience
            groups={groups}
            homeContent={homeContent}
            initialGroupSlug={resolveInitialLaunchGroupSlug(groups, resolvedSearchParams.group)}
            institutionOptions={getInstitutionOptions(locale)}
        />
    )
}
