import { VolunteerProspectExperience } from "@/components/volunteer-prospect-experience"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { PortableTextContent } from "@/lib/portable-text-components"
import { fetchBlifrivilligPage } from "@/lib/sanity/queries"
import { getInstitutionOptions, getVolunteerGroups } from "@/lib/volunteer-group-content"

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

export default async function BlifrivilligPage({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const [page, groups] = await Promise.all([
        fetchBlifrivilligPage(locale),
        getVolunteerGroups(locale),
    ])

    return (
        <div className="flex flex-col gap-8">
            <PortableTextContent value={page?.description ?? []} />
            <VolunteerProspectExperience
                groups={groups}
                hideHero
                homeContent={null}
                institutionOptions={getInstitutionOptions(locale)}
            />
        </div>
    )
}
