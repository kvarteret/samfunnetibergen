import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { SectionMark } from "@/components/section-mark"
import {
  EventCard,
  type EventDateEntry,
  type EventSummary,
} from "@/features/events"
import {
  computeAllDates,
  formatPrimaryDate,
  formatWeekday,
  getRecurringLabel,
} from "@/features/events/domain/dates"
import type { PublicEvent } from "@/features/events/domain/events"
import {
  isPromotableEventKind,
  promotedCardGridStartClass,
  selectHomepagePromotedEvents,
} from "@/features/events/domain/promotedOrdering"
import {
  fetchPublicEventSet,
  fetchPublicPromotedParentEvents,
} from "@/features/events/server/public-events"
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchBarPreviews, fetchHomePageContent } from "@/lib/sanity/fetch"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
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
  const title =
    homePage?.title ?? "Samfunnet i Bergen – studentkultur på Kvarteret"
  const description = homePage?.description ?? undefined
  return {
    ...buildPageMetadata({
      locale,
      canonicalPath: `/${locale}`,
      title,
      description,
    }),
    title: { absolute: title },
  }
}

type SanityEvent = PublicEvent
type SanityEventDate = NonNullable<SanityEvent["dates"]>[number]

type EventCardLabels = {
  today: string
  tomorrow: string
  weekday: (date: Date) => string
  recurringDaily: string
  recurringWeekly: string
  recurringMonthly: string
  recurringGeneric: string
}

function toEventSummary(
  event: SanityEvent,
  today: string,
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

  const resolvedDates = computeAllDates(dates, today)

  const primaryDateLabels = labels
    ? {
        today: labels.today,
        tomorrow: labels.tomorrow,
        weekday: labels.weekday,
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
    image: event.image ?? null,
    imageCaption: event.imageCaption ?? null,
    room: event.room
      ? {
          _id: event.room._id,
          title: event.room.title,
          slug: event.room.slug,
          floor: event.room.floor ?? null,
          image: event.room.image ?? null,
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

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)
  const today = getOsloDateString()

  const [{ events }, promotedParentEvents, barPreviews, t, homeT] =
    await Promise.all([
      fetchPublicEventSet({ locale, from: today, to: null }),
      fetchPublicPromotedParentEvents({ locale, from: today, to: null }),
      fetchBarPreviews(locale),
      getTranslations({ locale, namespace: "EventCard" }),
      getTranslations({ locale, namespace: "HomePage" }),
    ])
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
    weekday: (date: Date) => formatWeekday(date, locale),
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
        today={today}
      />
      <HomeUpcomingEvents
        events={upcomingEvents}
        labels={eventCardLabels}
        locale={locale}
        sectionLabel={homeT("eventsTitle")}
        linkLabel={homeT("calendar")}
        today={today}
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
        openingHours={barPreviews?.openingHours}
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
  today: string
}

function HomePromotedEvents({
  events,
  labels,
  locale,
  linkLabel,
  today,
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
            <EventCard
              event={toEventSummary(event, today, labels)}
              priority={index === 0}
              trackingSurface="home-promoted"
              variant="promoted"
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
  today,
}: HomeEventsSectionProps) {
  if (!events.length) return null

  return (
    <section className="w-screen bg-primary py-8 text-primary-foreground [margin-left:calc(50%_-_50vw)] sm:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 sm:px-10 lg:px-14">
        <HomeEventsHeader
          href={`/${locale}/arrangementer/kalender`}
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
              <EventCard
                event={toEventSummary(event, today, labels)}
                size="small"
                trackingSurface="home-upcoming"
                variant="slider"
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
        onPrimary && "text-primary-foreground",
      )}
    >
      {label && (
        <div className="flex items-center gap-4">
          <SectionMark
            className={onPrimary ? "text-primary-foreground" : "text-primary"}
          />
          <h2 className="text-base tracking-wide sm:text-lg">{label}</h2>
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
