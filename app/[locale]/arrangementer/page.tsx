import { getTranslations } from "next-intl/server"
import { EventsPage as EventsPageContent } from "@/features/events"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import {
    fetchEventsPageContent,
    fetchPublishedArrangements,
    fetchSiteMetadata,
} from "@/lib/sanity/fetch"

export const revalidate = 60

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/arrangementer">) {
    const locale = await resolvePageLocale(params)
    const [t, eventsPage, siteMetadata] = await Promise.all([
        getTranslations({ locale, namespace: "Metadata" }),
        fetchEventsPageContent(locale, { stega: false }),
        fetchSiteMetadata(locale, { stega: false }),
    ])
    const title = eventsPage?.seoTitle ?? t("eventsTitle")
    const description = eventsPage?.seoDescription ?? t("eventsDescription")
    const openGraphTitle = eventsPage?.openGraphTitle ?? title
    const openGraphDescription = eventsPage?.openGraphDescription ?? description
    const openGraphImage = eventsPage?.openGraphImageUrl ?? siteMetadata?.defaultOpenGraphImageUrl

    return {
        title,
        description,
        openGraph: {
            title: openGraphTitle,
            description: openGraphDescription,
            images: openGraphImage ? [{ url: openGraphImage }] : undefined,
            siteName: siteMetadata?.siteName ?? "Samfunnet i Bergen",
        },
    }
}

export default async function EventsPage({
    params,
    searchParams,
}: PageProps<"/[locale]/arrangementer">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)

    const [t, eventsContent, arrangements, resolvedSearchParams] = await Promise.all([
        getTranslations({ locale, namespace: "EventsPage" }),
        fetchEventsPageContent(locale),
        fetchPublishedArrangements(),
        searchParams,
    ])

    const title = eventsContent?.title ?? t("title")

    return (
        <EventsPageContent
            arrangements={arrangements}
            backLabel={t("back")}
            emptyLabel={t("empty")}
            facebookLabel={t("facebook")}
            filterAllLabel={t("filterAll")}
            filterMoreLabel={t("filterMore")}
            filterOrganizerLabel={t("filterOrganizer")}
            filterTypeLabel={t("filterType")}
            locale={locale}
            searchParams={resolvedSearchParams}
            ticketsLabel={t("tickets")}
            title={title}
        />
    )
}
