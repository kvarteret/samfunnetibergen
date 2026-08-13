import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { type EventDateEntry, type EventSummary } from "@/features/events"
import {
  computeAllDates,
  formatPrimaryDate,
  getRecurringLabel,
} from "@/features/events/domain/dates"
import {
  isPromotableEventKind,
  promotedCardGridStartClass,
  selectHomepagePromotedEvents,
} from "@/features/events/domain/promotedOrdering"
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import {
  fetchBarPreviews,
  fetchHomePageContent,
  fetchPromotedParentEvents,
  fetchPublishedEvents,
} from "@/lib/sanity/fetch"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"
import { HomeBarPreviews } from "./_components/HomeBarPreviews"
import { HomeBookingBanner } from "./_components/HomeBookingBanner"
import { HomeGrupperBanner } from "./_components/HomeGrupperBanner"
import { HorizontalScrollRow } from "./_components/HorizontalScrollRow"
import { SlackFeedback } from "./_components/SlackFeedback"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = await resolvePageLocale(params)
  const homePage = await fetchHomePageContent(locale, { stega: false })
  const title = "Samfunnet i Bergen – studentkultur på Kvarteret"
  const description = homePage?.description ?? undefined
  return {
    ...buildPageMetadata({ canonicalPath: `/${locale}`, title, description }),
    title: { absolute: title },
  }
}

type SanityEvent = Awaited<ReturnType<typeof fetchPublishedEvents>>[number]
type SanityEventDate = NonNullable<SanityEvent["dates"]>[number]

type EventCardLabels = {
  today: string
  tomorrow: string
  inNDays: (n: number) => string
  recurringDaily: string
  recurringWeekly: string
  recurringMonthly: string
  recurringGeneric: string
}

function toEventSummary(
  event: SanityEvent,
  labels?: EventCardLabels,
): EventSummary {
  const dates: EventDateEntry[] = (event.dates ?? []).map(
    (d: SanityEventDate) => ({
      _key: d._key,
      startDate: d.startDate,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
    }),
  )

  const todayStr = new Date().toISOString().split("T")[0]!
  const resolvedDates = computeAllDates(dates, todayStr)

  const primaryDateLabels = labels
    ? {
        today: labels.today,
        tomorrow: labels.tomorrow,
        inNDays: labels.inNDays,
      }
    : undefined
  const primaryDate = resolvedDates[0]
  const primaryDateLabel =
    primaryDate && primaryDateLabels
      ? formatPrimaryDate(primaryDate, primaryDateLabels)
      : null
  const recurringLabel = labels
    ? event.eventKind === "seriesInstance"
      ? labels.recurringGeneric
      : event.isRecurring
        ? getRecurringLabel(event.rrule, {
            daily: labels.recurringDaily,
            weekly: labels.recurringWeekly,
            monthly: labels.recurringMonthly,
            generic: labels.recurringGeneric,
          })
        : null
    : null

  return {
    _id: event._id,
    title: event.title,
    slug: event.slug,
    isRecurring: event.isRecurring ?? undefined,
    rrule: event.rrule ?? null,
    dates,
    resolvedDates,
    recurringLabel,
    primaryDateLabel,
    isFree: event.isFree ?? undefined,
    priceOrdinar: event.priceOrdinar ?? null,
    priceStudent: event.priceStudent ?? null,
    priceMedlem: event.priceMedlem ?? null,
    ticketUrl: event.ticketUrl ?? null,
    facebookUrl: event.facebookUrl ?? null,
    imageUrl: event.imageUrl ?? null,
    imageCaption: event.imageCaption ?? null,
    room: event.room
      ? {
          _id: event.room._id,
          title: event.room.title,
          slug: event.room.slug,
          floor: event.room.floor ?? null,
          imageUrl: event.room.imageUrl ?? null,
        }
      : null,
    roomText: event.roomText ?? null,
    organizerGroup: event.organizerGroup
      ? {
          _id: event.organizerGroup._id,
          name: event.organizerGroup.name,
          slug: event.organizerGroup.slug,
        }
      : null,
    organizerText: event.organizerText ?? null,
    eventType: event.eventType
      ? {
          _id: event.eventType._id,
          name: event.eventType.name,
          taxonomyGroup: event.eventType.taxonomyGroup
            ? {
                _id: event.eventType.taxonomyGroup._id,
                name: event.eventType.taxonomyGroup.name,
              }
            : null,
        }
      : null,
  }
}

function dateFormatter(locale: AppLocale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", options)
}

const promotedDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Oslo",
}

const upcomingDateOptions: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Oslo",
  weekday: "long",
}

function parseEventDate(dateStr: string) {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function capitalize(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value
}

function formatPromotedDate(date: EventDateEntry, locale: AppLocale) {
  const parsed = parseEventDate(date.startDate)
  return parsed
    ? dateFormatter(locale, promotedDateOptions).format(parsed)
    : null
}

function formatUpcomingDateTime(date: EventDateEntry, locale: AppLocale) {
  const parsed = parseEventDate(date.startDate)
  if (!parsed) return null
  const dateLabel = capitalize(
    dateFormatter(locale, upcomingDateOptions).format(parsed),
  )
  return date.startTime
    ? `${dateLabel}, ${locale === "en" ? "at" : "kl."} ${date.startTime}`
    : dateLabel
}

function eventHref(event: EventSummary, locale: AppLocale) {
  return `/${locale}/arrangementer/${event.slug}`
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)

  const [events, promotedParentEvents, barPreviews, t, homeT] =
    await Promise.all([
      fetchPublishedEvents(),
      fetchPromotedParentEvents(),
      fetchBarPreviews(),
      getTranslations({ locale, namespace: "EventCard" }),
      getTranslations({ locale, namespace: "HomePage" }),
    ])
  const today = getOsloDateString()
  const initialNow = new Date().toISOString()
  const promotedCandidates = [...promotedParentEvents, ...(events ?? [])]
    .filter(event => isPromotableEventKind(event.eventKind))
    .filter(event => event.isPromoted)
  const promotedEvents = selectHomepagePromotedEvents(promotedCandidates, today)
  const promotedEventIds = new Set(promotedEvents.map(event => event._id))
  const upcomingEvents = (events ?? [])
    .filter(event => !promotedEventIds.has(event._id))
    .slice(0, 30)

  const eventCardLabels: EventCardLabels = {
    today: t("today"),
    tomorrow: t("tomorrow"),
    inNDays: (n: number) => t("inNDays", { n }),
    recurringDaily: t("recurringDaily"),
    recurringWeekly: t("recurringWeekly"),
    recurringMonthly: t("recurringMonthly"),
    recurringGeneric: t("recurringGeneric"),
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <h1 className="sr-only">Samfunnet i Bergen</h1>
      <HomePromotedEvents
        events={promotedEvents}
        labels={eventCardLabels}
        locale={locale}
        sectionLabel={undefined}
        linkLabel={homeT("eventsAll")}
      />
      <HomeUpcomingEvents
        events={upcomingEvents}
        labels={eventCardLabels}
        locale={locale}
        sectionLabel={homeT("eventsTitle")}
        linkLabel={homeT("calendar")}
      />
      <HomeGrupperBanner
        body={homeT("grupperBannerBody")}
        cta={homeT("grupperBannerCta")}
        heading1={homeT("grupperBannerHeading1")}
        heading2={homeT("grupperBannerHeading2")}
      />
      <div className="hs:hidden">
        <HomeBookingBanner
          body={homeT("bookingBannerBody")}
          cta={homeT("bookingBannerCta")}
          eyebrow={homeT("bookingBannerEyebrow")}
          heading1={homeT("bookingBannerHeading1")}
          heading2={homeT("bookingBannerHeading2")}
        />
      </div>
      <HomeBarPreviews
        houseClosedDates={barPreviews?.houseClosedDates}
        initialNow={initialNow}
        locale={locale}
        operationsManagerHours={barPreviews?.operationsManagerHours}
        rooms={barPreviews?.rooms ?? []}
        vacationMode={barPreviews?.vacationMode}
      />

      <section className="hs:hidden">
        <Image
          alt=""
          className="hidden h-auto w-full md:block"
          height={288}
          priority={false}
          src="/images/studentersamfunnet-illustration.webp"
          width={866}
        />
        <Image
          alt=""
          className="mx-auto h-auto w-full md:hidden"
          height={500}
          priority={false}
          src="/images/studentersamfunnet-illustration-mobile.webp"
          width={500}
        />
      </section>
      <div className="hs:hidden">
        <SlackFeedback />
      </div>
    </div>
  )
}

interface HomeEventsSectionProps {
  events: SanityEvent[]
  labels: EventCardLabels
  locale: AppLocale
  sectionLabel?: string
  linkLabel: string
}

function HomePromotedEvents({
  events,
  labels,
  locale,
  linkLabel,
}: HomeEventsSectionProps) {
  if (!events.length) return null

  return (
    <section className="space-y-6">
      <HomeEventsHeader
        href={`/${locale}/arrangementer`}
        linkLabel={linkLabel}
      />
      <div className="grid grid-cols-1 gap-7 md:grid-cols-6">
        {events.map((event, index) => (
          <div
            className={cn(
              "md:col-span-2",
              promotedCardGridStartClass(events.length, index),
            )}
            key={event._id}
          >
            <HomePromotedEventCard
              event={toEventSummary(event, labels)}
              index={index}
              locale={locale}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function HomeUpcomingEvents({
  events,
  labels,
  locale,
  sectionLabel,
  linkLabel,
}: HomeEventsSectionProps) {
  if (!events.length) return null

  return (
    <section className="w-screen bg-primary py-8 text-primary-foreground [margin-left:calc(50%_-_50vw)] sm:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 sm:px-10 lg:px-14">
        <HomeEventsHeader
          href={`/${locale}/arrangementer`}
          label={sectionLabel}
          linkLabel={linkLabel}
          onPrimary
        />
        <HorizontalScrollRow className="gap-3 sm:gap-4">
          {events.map(event => (
            <div
              className="w-[min(21rem,calc(100vw-3rem))] shrink-0 md:w-[21rem] xl:w-[calc((100%-4rem)/5)]"
              key={event._id}
            >
              <HomeUpcomingEventCard
                event={toEventSummary(event, labels)}
                locale={locale}
              />
            </div>
          ))}
        </HorizontalScrollRow>
      </div>
    </section>
  )
}

function HomeEventsHeader({
  href,
  label,
  linkLabel,
  onPrimary = false,
}: {
  href: string
  label?: string
  linkLabel: string
  onPrimary?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4",
        label ? "justify-between" : "justify-end",
      )}
    >
      {label && (
        <div className="flex items-center gap-4">
          <SectionMark
            className={onPrimary ? "text-primary-foreground" : "text-primary"}
          />
          <h2 className="text-base uppercase tracking-wide sm:text-lg">
            {label}
          </h2>
        </div>
      )}
      <Link
        className="group inline-flex items-center gap-2 font-heading underline underline-offset-4 focus-brutal"
        href={href}
      >
        {linkLabel}
        <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
      </Link>
    </div>
  )
}

function SectionMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("h-4 w-auto shrink-0 fill-current", className)}
      viewBox="364 337 309 216"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M428.042877,349.052338 C428.034332,413.832733 428.023773,478.122162 428.014496,542.411621 C428.014282,543.910583 427.914154,545.420471 428.056854,546.906433 C428.507263,551.595642 426.649261,553.344849 421.769409,553.276550 C404.617859,553.036682 387.460175,553.109924 370.306427,553.254333 C366.306030,553.288086 364.662109,552.055908 364.667633,547.835144 C364.757233,479.548370 364.762787,411.261444 364.668518,342.974701 C364.662598,338.674957 366.374817,337.612091 370.331360,337.648865 C387.318359,337.806702 404.307556,337.727936 421.295929,337.741943 C427.682983,337.747223 427.895264,337.968689 428.008942,344.564209 C428.031891,345.896393 428.030945,347.229004 428.042877,349.052338 Z" />
      <path d="M673.273926,495.000000 C673.281189,512.493958 673.301270,529.487915 673.286682,546.481873 C673.280945,553.200623 673.245850,553.204102 666.708557,553.205261 C650.214417,553.208252 633.720276,553.186890 617.226196,553.218628 C610.284729,553.232056 610.037903,553.046265 610.040161,545.875061 C610.053223,504.569214 610.084473,463.263397 610.089478,421.957550 C610.092590,396.300018 610.044739,370.642517 610.054138,344.984985 C610.056763,337.827942 610.205627,337.732849 617.292725,337.726227 C633.620300,337.710938 649.947815,337.706696 666.275391,337.679810 C673.238342,337.668335 673.275696,337.677032 673.275818,344.552307 C673.276672,394.534882 673.274231,444.517426 673.273926,495.000000 Z" />
      <path d="M446.830048,455.000000 C446.803772,417.519806 446.854279,380.539185 446.658630,343.559875 C446.633698,338.841675 448.227203,337.615479 452.721588,337.670013 C469.543213,337.874176 486.376007,337.993652 503.189331,337.556427 C508.577515,337.416290 509.445709,339.180420 509.433899,344.016479 C509.285370,404.816986 509.338470,465.618011 509.339050,526.418884 C509.339111,533.748291 509.198975,541.081116 509.387268,548.405579 C509.482391,552.106079 508.128418,553.297363 504.434784,553.261963 C487.278839,553.097351 470.118256,553.017578 452.964600,553.268250 C448.077118,553.339661 446.681213,551.688904 446.708618,546.951050 C446.884918,516.468201 446.817993,485.983856 446.830048,455.000000 Z" />
      <path d="M528.681274,524.999878 C528.680481,464.682892 528.679138,404.865906 528.680420,345.048920 C528.680542,337.721924 528.686890,337.722382 536.110474,337.716827 C552.439270,337.704590 568.772034,337.888031 585.094421,337.557953 C589.898621,337.460815 591.419739,338.670898 591.402039,343.590942 C591.233765,390.410858 591.287109,437.231567 591.289490,484.052063 C591.290527,505.046265 591.198242,526.041809 591.430664,547.033630 C591.483093,551.771423 590.152161,553.410461 585.252930,553.331116 C568.428589,553.058472 551.594971,553.058289 534.770081,553.308472 C529.887878,553.381042 528.357483,551.742981 528.579895,546.990295 C528.914490,539.840942 528.676270,532.664734 528.681274,524.999878 Z" />
    </svg>
  )
}

function HomePromotedEventCard({
  event,
  index,
  locale,
}: {
  event: EventSummary
  index: number
  locale: AppLocale
}) {
  const dates = event.resolvedDates ?? event.dates
  const visibleDates = dates
    .slice(0, 3)
    .map(date => formatPromotedDate(date, locale))
    .filter(Boolean)
  const extraDates = Math.max(0, dates.length - visibleDates.length)
  const imageUrl = event.imageUrl
    ? sanityImageUrl(event.imageUrl, { height: 900, width: 1200 })
    : null

  return (
    <article className="min-w-0">
      <Link
        className="group block focus-brutal"
        href={eventHref(event, locale)}
      >
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              alt={event.imageCaption ?? event.title}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 33vw"
              src={imageUrl}
              unoptimized={shouldLoadImageDirectly(imageUrl)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-card p-6 text-center font-heading text-foreground-muted">
              {event.title}
            </div>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <h2 className="text-3xl leading-none tracking-normal sm:text-4xl md:text-3xl lg:text-4xl">
            {event.title}
          </h2>
          {visibleDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleDates.map(date => (
                <span
                  className="rounded-full bg-primary px-2.5 py-1 font-heading text-sm leading-none text-primary-foreground"
                  key={date}
                >
                  {date}
                </span>
              ))}
              {extraDates > 0 && (
                <span className="rounded-full bg-primary px-2.5 py-1 font-heading text-sm leading-none text-primary-foreground">
                  +{extraDates}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

function HomeUpcomingEventCard({
  event,
  locale,
}: {
  event: EventSummary
  locale: AppLocale
}) {
  const primaryDate = (event.resolvedDates ?? event.dates)[0]
  const dateLabel = primaryDate
    ? formatUpcomingDateTime(primaryDate, locale)
    : null
  const imageUrl = event.imageUrl
    ? sanityImageUrl(event.imageUrl, { height: 480, width: 640 })
    : null

  return (
    <Link
      className="group grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 focus-brutal sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4 xl:grid-cols-1"
      href={eventHref(event, locale)}
    >
      <div className="relative aspect-4/3 min-w-0 overflow-hidden bg-primary-foreground/15">
        {imageUrl ? (
          <Image
            alt={event.imageCaption ?? event.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 8rem, (max-width: 1280px) 40vw, 12rem"
            src={imageUrl}
            unoptimized={shouldLoadImageDirectly(imageUrl)}
          />
        ) : (
          <div className="h-full bg-primary-foreground/15" />
        )}
      </div>
      <div className="min-w-0 space-y-1">
        {dateLabel && (
          <p className="font-heading text-sm leading-tight opacity-80">
            {dateLabel}
          </p>
        )}
        <h2 className="text-xl leading-tight transition-colors group-hover:underline group-hover:underline-offset-4">
          {event.title}
        </h2>
      </div>
    </Link>
  )
}
