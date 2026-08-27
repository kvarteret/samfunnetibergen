import { getTranslations } from "next-intl/server"

import { EventCalendarPage } from "@/features/events"
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchPublishedEvents } from "@/lib/sanity/fetch"
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

  const [t, arrangements, resolvedSearchParams] = await Promise.all([
    getTranslations({ locale, namespace: "EventsPage" }),
    fetchPublishedEvents(locale),
    searchParams,
  ])

  return (
    <EventCalendarPage
      arrangements={arrangements}
      backLabel={t("back")}
      listLabel={t("list")}
      locale={locale}
      searchParams={resolvedSearchParams}
      title={t("calendarTitle")}
      today={getOsloDateString()}
    />
  )
}
