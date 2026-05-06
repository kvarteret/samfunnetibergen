import { getTranslations } from "next-intl/server"

import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { getPublicEvents } from "@/lib/events"
import { fetchEventsPageContent, fetchSiteMetadata } from "@/lib/sanity/queries"
import { EventsPageClient } from "./events-page-client"

export const revalidate = 60

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/arrangementer">) {
    const locale = await resolvePageLocale(params)
    const [t, siteMetadata] = await Promise.all([
        getTranslations({ locale, namespace: "Metadata" }),
        fetchSiteMetadata(locale),
    ])

    return {
        title: siteMetadata?.eventsTitle ?? t("eventsTitle"),
        description: siteMetadata?.eventsDescription ?? t("eventsDescription"),
    }
}

export default async function EventsPage({
    params,
    searchParams,
}: PageProps<"/[locale]/arrangementer"> & {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)
    const [t, eventsContent, result, resolvedSearchParams] = await Promise.all([
        getTranslations({ locale, namespace: "EventsPage" }),
        fetchEventsPageContent(locale),
        getPublicEvents(locale),
        searchParams ?? Promise.resolve({}),
    ])

    return (
        <EventsPageClient
            backLabel={t("back")}
            description={eventsContent?.description ?? t("description")}
            emptyLabel={t("empty")}
            errorLabel={t("error")}
            eyebrow={eventsContent?.eyebrow ?? t("eyebrow")}
            facebookLabel={t("facebook")}
            filterAllLabel={t("filterAll")}
            filterMoreLabel={t("filterMore")}
            filterOrganizerLabel={t("filterOrganizer")}
            filterTypeLabel={t("filterType")}
            hasError={!result.ok}
            initialEvents={result.events}
            initialSearchParams={resolvedSearchParams}
            initialTaxonomy={
                result.ok
                    ? result.taxonomy
                    : { event_type_groups: [], organizer_groups: [], rooms: [] }
            }
            locale={locale}
            ticketsLabel={t("tickets")}
            title={eventsContent?.title ?? t("title")}
        />
    )
}
