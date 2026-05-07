import { PortableText } from "next-sanity"

import { VolunteerProspectExperience } from "@/components/volunteer-prospect-experience"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchBlifrivilligPage } from "@/lib/sanity/queries"
import { resolveInitialLaunchGroupSlug } from "@/lib/volunteer-groups"
import { getInstitutionOptions, getLaunchGroups } from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    const page = await fetchBlifrivilligPage(locale, { stega: false })
    return {
        title: page?.title ?? "Bli frivillig | Samfunnet i Bergen",
        description: page?.seoDescription ?? undefined,
    }
}

export default async function BlifrivilligPage({
    params,
    searchParams,
}: PageProps<"/[locale]/blifrivillig"> & {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const resolvedSearchParams = (await searchParams) ?? {}

    const [page, groups] = await Promise.all([
        fetchBlifrivilligPage(locale),
        getLaunchGroups(locale),
    ])

    return (
        <div className="flex flex-col gap-8">
            {page?.description && page.description.length > 0 && (
                <div className="prose prose-neutral max-w-none dark:prose-invert">
                    <PortableText value={page.description} />
                </div>
            )}
            <VolunteerProspectExperience
                groups={groups}
                hideHero
                homeContent={null}
                initialGroupSlug={resolveInitialLaunchGroupSlug(groups, resolvedSearchParams.group)}
                institutionOptions={getInstitutionOptions(locale)}
            />
        </div>
    )
}
