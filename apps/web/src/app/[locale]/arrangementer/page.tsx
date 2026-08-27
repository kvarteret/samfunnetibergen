import { getTranslations } from "next-intl/server"
import type { EventDateEntry } from "@/features/events"
import { EventsPage as EventsPageContent } from "@/features/events"
import {
  computeAllDates,
  formatPrimaryDate,
  getRecurringLabel,
  type PrimaryDateLabels,
  type RecurringLabels,
} from "@/features/events/domain/dates"
import type { AppLocale } from "@/i18n/routing"
import { filterToFirstInstances } from "@/features/events/domain/eventUtils"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchPublishedEvents } from "@/lib/sanity/fetch"

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

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: {
        "application/ld+json": [
          {
            title: "Arrangementer — Samfunnet i Bergen",
            url: "/api/events/feed",
          },
        ],
      },
    },
  }
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/arrangementer">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)

  const [t, fetchedArrangements, resolvedSearchParams, cardT] =
    await Promise.all([
      getTranslations({ locale, namespace: "EventsPage" }),
      fetchPublishedEvents(locale),
      searchParams,
      getTranslations({ locale, namespace: "EventCard" }),
    ])
  const arrangements = filterToFirstInstances(fetchedArrangements)

  const primaryDateLabels: PrimaryDateLabels = {
    today: cardT("today"),
    tomorrow: cardT("tomorrow"),
    inNDays: (n: number) => cardT("inNDays", { n }),
  }
  const recurringLabels: RecurringLabels = {
    daily: cardT("recurringDaily"),
    weekly: cardT("recurringWeekly"),
    monthly: cardT("recurringMonthly"),
    generic: cardT("recurringGeneric"),
  }

  const todayStr = new Date().toISOString().split("T")[0]!
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
    const dates: EventDateEntry[] = (event.dates ?? []).map(d => ({
      _key: d._key,
      startDate: d.startDate,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
    }))
    const resolvedDates = computeAllDates(dates, todayStr)
    const primaryDate = resolvedDates[0]
    const primaryDateLabel = primaryDate
      ? formatPrimaryDate(primaryDate, primaryDateLabels)
      : null
    const recurringLabel =
      event.eventKind === "seriesInstance"
        ? recurringLabels.generic
        : event.isRecurring
          ? getRecurringLabel(event.rrule, recurringLabels)
          : null
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
    <EventsPageContent
      arrangements={arrangements}
      backLabel={t("back")}
      calendarLabel={t("calendar")}
      precomputedDates={precomputedDates}
      searchParams={resolvedSearchParams}
      title={t("title")}
    />
  )
}
