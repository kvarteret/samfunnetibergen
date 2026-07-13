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
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import {
  fetchEventsPageContent,
  fetchPublishedEvents,
} from "@/lib/sanity/fetch"

export const revalidate = 60

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/arrangementer">) {
  const locale = await resolvePageLocale(params)
  const [t, eventsPage] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    fetchEventsPageContent(locale, { stega: false }),
  ])
  const description = eventsPage?.description ?? t("eventsDescription")

  const metadata = buildPageMetadata({
    canonicalPath: `/${locale}/arrangementer`,
    fallbackTitle: t("eventsTitle"),
    fallbackDescription: description,
  })

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      siteName: "Samfunnet i Bergen",
    },
  }
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/arrangementer">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)

  const [t, eventsContent, arrangements, resolvedSearchParams, cardT] =
    await Promise.all([
      getTranslations({ locale, namespace: "EventsPage" }),
      fetchEventsPageContent(locale),
      fetchPublishedEvents(),
      searchParams,
      getTranslations({ locale, namespace: "EventCard" }),
    ])

  const title = eventsContent?.title ?? t("title")

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
      event.eventStatus === "cancelled"
        ? cardT("statusCancelled")
        : event.eventStatus === "postponed"
          ? cardT("statusPostponed")
          : null
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
      precomputedDates={precomputedDates}
      searchParams={resolvedSearchParams}
      title={title}
    />
  )
}
