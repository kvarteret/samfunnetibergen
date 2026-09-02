import { getTranslations } from "next-intl/server"

import { EventCalendarPage } from "@/features/events"
import { startOfCurrentWeek } from "@/features/events/domain/calendar"
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
}: PageProps<"/[locale]/arrangementer/kalender">) {
  const locale = await resolvePageLocale(params)
  const t = await getTranslations({ locale, namespace: "Metadata" })

  return buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/arrangementer/kalender`,
    title: t("calendarTitle"),
    description: t("calendarDescription"),
  })
}

export default async function CalendarPage({
  params,
  searchParams,
}: PageProps<"/[locale]/arrangementer/kalender">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)
  const today = getOsloDateString()

  const [t, eventSet, resolvedSearchParams] = await Promise.all([
    getTranslations({ locale, namespace: "EventsPage" }),
    fetchPublicEventSet({
      locale,
      from: startOfCurrentWeek(today),
      to: null,
    }),
    searchParams,
  ])

  return (
    <EventCalendarPage
      arrangements={eventSet.events}
      backLabel={t("back")}
      listLabel={t("list")}
      locale={locale}
      occurrences={eventSet.occurrences}
      searchParams={resolvedSearchParams}
      title={t("calendarTitle")}
      today={today}
    />
  )
}
