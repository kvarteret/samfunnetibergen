import { BliFrivilligPage as BliFrivilligPageContent } from "@/features/blifrivillig"
import { getInstitutionOptions, getVolunteerGroups } from "@/features/blifrivillig/content"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchBlifrivilligPage } from "@/lib/sanity/fetch"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    const page = await fetchBlifrivilligPage(locale, { stega: false })
    return {
        title: page?.seoTitle ?? page?.title ?? "Bli frivillig | Samfunnet i Bergen",
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
        <BliFrivilligPageContent
            groups={groups}
            institutionOptions={getInstitutionOptions(locale)}
            page={page}
        />
    )
}
