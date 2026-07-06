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
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import {
  fetchBarPreviews,
  fetchHomePageContent,
  fetchPublishedEvents,
  fetchSiteMetadata,
} from "@/lib/sanity/fetch"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { HomeBarPreviews } from "./_components/HomeBarPreviews"
import { HomeBookingBanner } from "./_components/HomeBookingBanner"
import { HomeGrupperBanner } from "./_components/HomeGrupperBanner"
import { SlackFeedback } from "./_components/SlackFeedback"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = await resolvePageLocale(params)
  const [homePage, siteMetadata] = await Promise.all([
    fetchHomePageContent(locale, { stega: false }),
    fetchSiteMetadata(locale, { stega: false }),
  ])
  const title =
    homePage?.seoTitle ??
    siteMetadata?.defaultSeoTitle ??
    homePage?.title ??
    siteMetadata?.siteName ??
    undefined
  const description =
    homePage?.seoDescription ??
    siteMetadata?.defaultSeoDescription ??
    homePage?.description ??
    undefined
  const openGraphTitle =
    homePage?.openGraphTitle ?? siteMetadata?.defaultOpenGraphTitle ?? title
  const openGraphDescription =
    homePage?.openGraphDescription ??
    siteMetadata?.defaultOpenGraphDescription ??
    description
  const openGraphImage =
    homePage?.openGraphImageUrl ?? siteMetadata?.defaultOpenGraphImageUrl
  return {
    title,
    description,
    alternates: {
      canonical: homePage?.canonicalUrl ?? `/${locale}`,
    },
    robots: {
      index: !homePage?.noIndex,
      follow: !homePage?.noFollow,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      images: openGraphImage
        ? [
            {
              url: openGraphImage,
              alt: homePage?.openGraphImageAlt ?? undefined,
            },
          ]
        : undefined,
      siteName: siteMetadata?.siteName ?? "Samfunnet i Bergen",
    },
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
  const resolvedDates = computeAllDates(dates, event.rrule, todayStr)

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
  const recurringLabel =
    labels && event.isRecurring
      ? getRecurringLabel(event.rrule, {
          daily: labels.recurringDaily,
          weekly: labels.recurringWeekly,
          monthly: labels.recurringMonthly,
          generic: labels.recurringGeneric,
        })
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

const promotedDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Oslo",
})

const upcomingDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Oslo",
  weekday: "long",
})

function parseEventDate(dateStr: string) {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function capitalize(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value
}

function formatPromotedDate(date: EventDateEntry) {
  const parsed = parseEventDate(date.startDate)
  return parsed ? promotedDateFormatter.format(parsed) : null
}

function formatUpcomingDateTime(date: EventDateEntry) {
  const parsed = parseEventDate(date.startDate)
  if (!parsed) return null
  const dateLabel = capitalize(upcomingDateFormatter.format(parsed))
  return date.startTime ? `${dateLabel}, kl. ${date.startTime}` : dateLabel
}

function eventHref(event: EventSummary, locale: AppLocale) {
  return `/${locale}/arrangementer/${event.slug}`
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)

  const [events, barPreviews, t, homeT] = await Promise.all([
    fetchPublishedEvents(),
    fetchBarPreviews(),
    getTranslations({ locale, namespace: "EventCard" }),
    getTranslations({ locale, namespace: "HomePage" }),
  ])
  const promotedEvents = (events ?? [])
    .filter(event => event.isPromoted)
    .slice(0, 3)
  const promotedEventIds = new Set(promotedEvents.map(event => event._id))
  const upcomingEvents = (events ?? [])
    .filter(event => !promotedEventIds.has(event._id))
    .slice(0, 5)

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
      <HomePromotedEvents
        events={promotedEvents}
        labels={eventCardLabels}
        locale={locale}
      />
      <HomeUpcomingEvents
        events={upcomingEvents}
        labels={eventCardLabels}
        locale={locale}
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
        locale={locale}
        rooms={barPreviews?.rooms ?? []}
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
}

function HomePromotedEvents({
  events,
  labels,
  locale,
}: HomeEventsSectionProps) {
  if (!events.length) return null

  return (
    <section className="space-y-6">
      <HomeEventsHeader
        href={`/${locale}/arrangementer`}
        label="Arrangementer"
        linkLabel="Se alle arrangementer"
      />
      <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
        {events.map((event, index) => (
          <HomePromotedEventCard
            event={toEventSummary(event, labels)}
            index={index}
            key={event._id}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}

function HomeUpcomingEvents({
  events,
  labels,
  locale,
}: HomeEventsSectionProps) {
  if (!events.length) return null

  return (
    <section className="w-screen bg-primary py-8 text-primary-foreground [margin-left:calc(50%_-_50vw)] sm:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 sm:px-10 lg:px-14">
        <HomeEventsHeader
          href={`/${locale}/arrangementer`}
          label="Kommende"
          linkLabel="Vis kalender"
          onPrimary
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {events.map(event => (
            <HomeUpcomingEventCard
              event={toEventSummary(event, labels)}
              key={event._id}
              locale={locale}
            />
          ))}
        </div>
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
  label: string
  linkLabel: string
  onPrimary?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="flex gap-2" aria-hidden>
          {[0, 1, 2].map(dot => (
            <span
              className={`size-2.5 rounded-full ${
                onPrimary ? "bg-primary-foreground" : "bg-primary"
              }`}
              key={dot}
            />
          ))}
        </span>
        <h1 className="text-base uppercase tracking-wide sm:text-lg">
          {label}
        </h1>
      </div>
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
  const visibleDates = dates.slice(0, 3).map(formatPromotedDate).filter(Boolean)
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
  const dateLabel = primaryDate ? formatUpcomingDateTime(primaryDate) : null
  const imageUrl = event.imageUrl
    ? sanityImageUrl(event.imageUrl, { height: 480, width: 640 })
    : null

  return (
    <Link
      className="group grid min-w-0 grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4 focus-brutal xl:grid-cols-1"
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
