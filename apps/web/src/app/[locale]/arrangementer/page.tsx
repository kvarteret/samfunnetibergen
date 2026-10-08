import { getTranslations } from "next-intl/server"
import { Breadcrumbs } from "@/components/breadcrumbs"
import type { EventDateEntry } from "@/features/events"
import { EventsPage as EventsPageContent } from "@/features/events"
import { buildCardDateLabels } from "@/features/events/domain/dates"
import { filterToFirstInstances } from "@/features/events/domain/eventUtils"
import { getCardDateLabels } from "@/features/events/server/card-date-labels"
import { fetchPublicEventSet } from "@/features/events/server/public-events"
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"

export const revalidate = 60

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/arrangementer">) {
  const locale = await resolvePageLocale(params)
  const t = await getTranslations({ locale, namespace: "Metadata" })

  const metadata = buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/arrangementer`,
    title: t("eventsTitle"),
    description: t("eventsDescription"),
  })

  return metadata
}

export default async function EventsPage({
  params,
}: PageProps<"/[locale]/arrangementer">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)
  const today = getOsloDateString()

  const [t, { events: fetchedArrangements }, cardT, cardLabels] =
    await Promise.all([
      getTranslations({ locale, namespace: "EventsPage" }),
      fetchPublicEventSet({ locale, from: today, to: null }),
      getTranslations({ locale, namespace: "EventCard" }),
      getCardDateLabels(locale),
    ])
  const arrangements = filterToFirstInstances(fetchedArrangements)

  const precomputedDates = new Map<
    string,
    {
      resolvedDates: EventDateEntry[]
      recurringLabel: string | null
      primaryDateLabel: string | null
      statusLabel: string | null
    }
  >()
  for (const event of arrangements) {
    const { resolvedDates, primaryDateLabel, recurringLabel } =
      buildCardDateLabels(event, today, cardLabels)
    const statusLabel =
      event.eventStatus === "cancelled" ? cardT("statusCancelled") : null
    precomputedDates.set(event._id, {
      resolvedDates,
      recurringLabel,
      primaryDateLabel,
      statusLabel,
    })
  }

  return (
    <>
      <Breadcrumbs className="mb-8" path="/arrangementer" />
      <EventsPageContent
        arrangements={arrangements}
        calendarLabel={t("calendar")}
        precomputedDates={precomputedDates}
        title={t("title")}
      />
    </>
  )
}
