import { CalendarDays, Clock, MapPin, Repeat, Ticket } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Fragment, type ReactNode } from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContentPageViewTracking } from "@/components/content-page-view-tracking"
import { JsonLd } from "@/components/JsonLd"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { EventInterest } from "@/features/event-interest/components/EventInterest"
import {
  FestivalHero,
  type FestivalLabels,
  FestivalProgramme,
} from "@/features/events/components/FestivalProgramme"
import { buildCardDateLabels } from "@/features/events/domain/dates"
import {
  flattenPublicOccurrences,
  type PublicEvent,
} from "@/features/events/domain/events"
import { groupFestivalProgramme } from "@/features/events/domain/festival-programme"
import { getCardDateLabels } from "@/features/events/server/card-date-labels"
import { fetchEventPageData } from "@/features/events/server/public-events-page"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { PortableTextContent } from "@/lib/portable-text-components"
import { eventTrackingAttributes } from "@/lib/posthog/tracking-attributes"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { resolveSiteUrl } from "@/lib/site-url"
import {
  buildEventStructuredData,
  toPlainTextContent,
} from "@/lib/structured-data"
import { EventFacebookButton, EventTicketButton } from "./EventTrackedLinks"
import { StickyTicketBar } from "./StickyTicketBar"

type EventDetail = PublicEvent
type EventDetailDate = EventDetail["dates"][number]
type Translator = Awaited<ReturnType<typeof getTranslations<"EventPage">>>

/** One row of the date list; series rows link to their own instance page. */
type EventDateRow = {
  key: string
  date: EventDetailDate
  event: EventDetail
  href: string | null
}

type EventPageProps = {
  params: Promise<{ event: string; locale: string }>
}

const PARENT_EVENT_KINDS = ["seriesParent", "festivalParent"]

export default async function EventPage({ params }: EventPageProps) {
  const resolvedParams = await params
  const locale = (await resolvePageLocale(
    Promise.resolve({ locale: resolvedParams.locale }),
  )) as AppLocale
  activateRequestLocale(locale)

  const [detail, t, cardLabels] = await Promise.all([
    fetchEventPageData(resolvedParams.event, locale, { stega: false }),
    getTranslations({ locale, namespace: "EventPage" }),
    getCardDateLabels(locale),
  ])

  if (!detail) notFound()

  const { event: eventData, children: childEvents } = detail
  const isParentEvent = PARENT_EVENT_KINDS.includes(eventData.eventKind)
  const isFestival = eventData.eventKind === "festivalParent"
  const today = getOsloDateString()
  const eventJsonLd = buildEventStructuredData(
    isParentEvent
      ? flattenPublicOccurrences(childEvents, { from: today, to: null })
      : flattenPublicOccurrences([eventData], { from: today, to: null }),
    {
      siteUrl: resolveSiteUrl(),
      locale,
    },
  )

  return (
    <>
      {eventJsonLd && <JsonLd data={eventJsonLd} />}
      <article
        className="flex w-full flex-col gap-10"
        {...eventTrackingAttributes(eventData, "event-detail")}
      >
        <ContentPageViewTracking
          content={eventData}
          contentType="arrangement"
          locale={locale}
        />
        <Breadcrumbs
          current={eventData.title}
          parent={
            eventData.eventKind === "festivalSession" && eventData.parentEvent
              ? {
                  label: eventData.parentEvent.title,
                  href: `/arrangementer/${eventData.parentEvent.slug}`,
                }
              : undefined
          }
          path={`/arrangementer/${resolvedParams.event}`}
        />
        <EventStatusNotice event={eventData} t={t} />
        {isFestival ? (
          <FestivalPage
            event={eventData}
            childEvents={childEvents}
            eventSlug={resolvedParams.event}
            locale={locale}
            labels={{
              programme: t("childEvents"),
              browseDays: t("festivalBrowseDays"),
              eventCount: cardLabels.events,
              runDays: cardLabels.days,
              soldOut: t("soldOut"),
              cancelled: t("statusCancelled"),
              timeUnknown: t("festivalTimeUnknown"),
              empty: t("festivalEmpty"),
            }}
            t={t}
          />
        ) : (
          <EventDetailPage
            event={eventData}
            eventSlug={resolvedParams.event}
            dateRows={eventDateRows(eventData, childEvents, today)}
            recurringLabel={
              buildCardDateLabels(eventData, today, cardLabels)
                .recurringDetailLabel
            }
            locale={locale}
            t={t}
          />
        )}
      </article>
    </>
  )
}

export async function generateMetadata({ params }: EventPageProps) {
  const resolvedParams = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: resolvedParams.locale }),
  )
  const detail = await fetchEventPageData(resolvedParams.event, locale, {
    stega: false,
  })

  if (!detail) return {}

  const { event: eventData } = detail

  const metadata = buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/arrangementer/${resolvedParams.event}`,
    title: eventData.title,
    description: toPlainTextContent(eventData.description),
    imageUrl: eventData.imageUrl,
    openGraphType: "article",
  })

  return metadata
}

function FestivalPage({
  event,
  childEvents,
  eventSlug,
  locale,
  labels,
  t,
}: {
  event: EventDetail
  childEvents: EventDetail[]
  eventSlug: string
  locale: AppLocale
  labels: FestivalLabels
  t: Translator
}) {
  const days = groupFestivalProgramme(childEvents)

  return (
    <>
      <FestivalHero
        event={event}
        days={days}
        locale={locale}
        labels={labels}
        price={formatPrices(event, t)}
      >
        {event.description.length > 0 && (
          <PortableTextContent value={event.description} nofollowLinks />
        )}
      </FestivalHero>
      <FestivalProgramme days={days} locale={locale} labels={labels} />
      <EventDetailActions event={event} eventSlug={eventSlug} t={t} />
    </>
  )
}

function EventDetailPage({
  event,
  eventSlug,
  dateRows,
  recurringLabel,
  locale,
  t,
}: {
  event: EventDetail
  eventSlug: string
  dateRows: EventDateRow[]
  recurringLabel: string | null
  locale: AppLocale
  t: Translator
}) {
  const nextDate = dateRows[0]?.date ?? event.dates[0] ?? null

  return (
    <>
      <EventDetailHero
        event={event}
        eventSlug={eventSlug}
        nextDate={nextDate}
        recurringLabel={recurringLabel}
        locale={locale}
        t={t}
      />
      <EventDetailBody event={event} eventSlug={eventSlug} t={t} />
      {dateRows.length > 1 && (
        <EventDateList rows={dateRows} locale={locale} t={t} />
      )}
    </>
  )
}

/**
 * Upcoming dates for the page. A series parent lists its instances, so each
 * row opens the matching instance; other events list their own dates.
 */
function eventDateRows(
  event: EventDetail,
  childEvents: EventDetail[],
  today: string,
): EventDateRow[] {
  const all: EventDateRow[] =
    event.eventKind === "seriesParent"
      ? flattenPublicOccurrences(childEvents).map(occurrence => ({
          key: occurrence.id,
          date: occurrence.event.dates.find(
            date => date._key === occurrence.dateKey,
          ) as EventDetailDate,
          event: occurrence.event,
          href: `/arrangementer/${occurrence.event.slug}`,
        }))
      : event.dates.map(date => ({ key: date._key, date, event, href: null }))
  const upcoming = all.filter(row => row.date.startDate >= today)
  return upcoming.length > 0 ? upcoming : all.slice(-1)
}

function EventStatusNotice({
  event,
  t,
}: {
  event: EventDetail
  t: Translator
}) {
  if (event.eventStatus === "scheduled") return null

  return (
    <p
      className="border-2 border-destructive bg-destructive px-4 py-3 font-heading uppercase tracking-widest text-destructive-foreground"
      role="status"
    >
      {t("cancelledNotice")}
    </p>
  )
}

function EventDetailHero({
  event,
  eventSlug,
  nextDate,
  recurringLabel,
  locale,
  t,
}: {
  event: EventDetail
  eventSlug: string
  nextDate: EventDetailDate | null
  recurringLabel: string | null
  locale: AppLocale
  t: Translator
}) {
  const imageUrl = event.imageUrl
    ? sanityImageUrl(
        event.imageUrl,
        { height: 900, width: 1600 },
        event.imageFrame,
      )
    : null
  // Instances of a series are identical by definition, so the series rhythm
  // replaces the parent link. Festival sessions still point to their festival.
  const isSeries =
    event.eventKind === "seriesInstance" || event.eventKind === "seriesParent"
  const festival =
    event.eventKind === "festivalSession" ? event.parentEvent : null

  return (
    <header className="grid gap-8 lg:grid-cols-[minmax(19rem,2fr)_minmax(0,3fr)] lg:items-center">
      <div className="flex flex-col gap-5 lg:order-first">
        <div className="space-y-3">
          {event.eventType?.name && (
            <Tag variant="accent">{event.eventType.name}</Tag>
          )}
          <h1 className="text-page-title">{event.title}</h1>
          {festival && (
            <p className="text-foreground-muted">
              {t("partOf")}{" "}
              <Link
                href={`/arrangementer/${festival.slug}`}
                className="underline underline-offset-4 hover:no-underline focus-brutal"
                {...eventTrackingAttributes(festival, "detail-parent")}
              >
                {festival.title}
              </Link>
            </p>
          )}
        </div>

        <dl className="space-y-2.5 text-lg leading-6 text-foreground">
          {nextDate && (
            <EventFact icon={CalendarDays} label={t("date")}>
              <time dateTime={nextDate.startDate}>
                {formatLongDate(nextDate.startDate, locale)}
              </time>
            </EventFact>
          )}
          {nextDate?.startTime && (
            <EventFact icon={Clock} label={t("time")}>
              {formatScheduleTime(nextDate)}
            </EventFact>
          )}
          {isSeries && recurringLabel && (
            <EventFact icon={Repeat} label={t("recurrence")}>
              {recurringLabel}
            </EventFact>
          )}
          <EventPlaceFact event={event} t={t} />
          <EventFact icon={Ticket} label={t("price")}>
            {event.isSoldOut ? t("soldOut") : (formatPrices(event, t) ?? "-")}
          </EventFact>
        </dl>

        <div id="event-ticket" className="w-fit empty:hidden">
          <EventTicketAction event={event} eventSlug={eventSlug} t={t} />
        </div>
        {event.ticketUrl &&
          event.eventStatus === "scheduled" &&
          !event.isSoldOut &&
          nextDate && (
            <StickyTicketBar
              targetId="event-ticket"
              summary={[
                formatShortDate(nextDate.startDate, locale),
                nextDate.startTime,
              ]
                .filter(Boolean)
                .join(", ")}
            >
              <EventTicketAction event={event} eventSlug={eventSlug} t={t} />
            </StickyTicketBar>
          )}
      </div>

      <div className="order-first overflow-hidden rounded-base bg-muted lg:order-none">
        {imageUrl ? (
          <div className="relative aspect-video">
            <Image
              alt={event.imageAlt ?? event.imageCaption ?? event.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              src={imageUrl}
              unoptimized={shouldLoadImageDirectly(imageUrl)}
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center p-8 text-center">
            <p className="max-w-md font-heading text-4xl leading-tight text-foreground-muted">
              {event.title}
            </p>
          </div>
        )}
      </div>
    </header>
  )
}

function EventFact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <dt className="shrink-0 pt-0.5 text-foreground-muted">
        <Icon className="size-5" aria-hidden />
        <span className="sr-only">{label}</span>
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function EventPlaceFact({ event, t }: { event: EventDetail; t: Translator }) {
  const roomTitle = event.room?.title ?? event.roomText
  if (!roomTitle) return null
  const roomSlug = event.room?.slug
  const floor = event.room?.floor

  return (
    <EventFact icon={MapPin} label={t("place")}>
      {roomSlug ? (
        <EventDetailRoomLink
          event={event}
          floorLabel={floor != null ? t("floor", { floor }) : null}
          roomSlug={roomSlug}
          roomTitle={roomTitle}
        />
      ) : (
        roomTitle
      )}
      {floor != null && (
        <span className="text-foreground-muted">
          {" "}
          · {t("floor", { floor })}
        </span>
      )}
    </EventFact>
  )
}

function EventDetailBody({
  event,
  eventSlug,
  t,
}: {
  event: EventDetail
  eventSlug: string
  t: Translator
}) {
  const groups = [
    ...(event.organizerGroup ? [event.organizerGroup] : []),
    ...(event.coOrganizerGroups ?? []),
  ]
  const hasOrganizer = groups.length > 0 || event.organizerText

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(19rem,2fr)_minmax(0,3fr)]">
      <div className="space-y-6 lg:order-last">
        <div className="max-w-prose space-y-5 text-lg leading-8 text-foreground">
          {event.description?.length ? (
            <PortableTextContent value={event.description} nofollowLinks />
          ) : (
            <p>-</p>
          )}
        </div>
      </div>
      <aside className="space-y-6">
        {hasOrganizer && (
          <div className="space-y-2">
            <p className="font-heading text-sm text-foreground-muted">
              {t("organizer")}
            </p>
            <p className="text-lg leading-6">
              {groups.length > 0
                ? groups.map((group, index) => (
                    <Fragment key={group._id}>
                      {index > 0 ? ", " : null}
                      {group.slug ? (
                        <Link
                          href={`/grupper/${group.slug}`}
                          className="underline underline-offset-4 hover:text-primary focus-brutal"
                        >
                          {group.name}
                        </Link>
                      ) : (
                        group.name
                      )}
                    </Fragment>
                  ))
                : event.organizerText}
            </p>
          </div>
        )}
        <EventDetailActions event={event} eventSlug={eventSlug} t={t} />
      </aside>
    </section>
  )
}

function EventDateList({
  rows,
  locale,
  t,
}: {
  rows: EventDateRow[]
  locale: AppLocale
  t: Translator
}) {
  return (
    <section aria-labelledby="event-dates-heading" className="space-y-4">
      <h2 id="event-dates-heading" className="text-section-title">
        {t("upcomingDates")}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(row => {
          const roomTitle = row.event.room?.title ?? row.event.roomText
          const cancelled = row.event.eventStatus !== "scheduled"
          const content = (
            <>
              <span className="flex flex-wrap items-center gap-2 font-heading text-lg">
                <time dateTime={row.date.startDate}>
                  {formatLongDate(row.date.startDate, locale)}
                </time>
                {cancelled && (
                  <Tag variant="destructive" className="text-xs">
                    {t("statusCancelled")}
                  </Tag>
                )}
              </span>
              <span className="text-foreground-muted">
                {[
                  row.date.startTime ? formatScheduleTime(row.date) : null,
                  roomTitle,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </>
          )
          const className =
            "flex h-full flex-col gap-1 rounded-base bg-card px-4 py-3"

          return (
            <li key={row.key}>
              {row.href ? (
                <Link
                  href={row.href}
                  className={`${className} transition-colors hover:bg-muted focus-brutal`}
                  {...eventTrackingAttributes(row.event, "detail-child")}
                >
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function EventDetailRoomLink({
  event,
  roomSlug,
  roomTitle,
  floorLabel,
}: {
  event: EventDetail
  roomSlug: string
  roomTitle?: string | null
  floorLabel: string | null
}) {
  const roomFloor = event.room?.floor
  const roomImageUrl = event.room?.imageUrl
    ? sanityImageUrl(event.room.imageUrl, { height: 264, width: 352 })
    : null

  return (
    <span className="group relative inline-block">
      <Link
        href={`/rom/${roomSlug}`}
        className="underline underline-offset-4 hover:no-underline focus-brutal"
      >
        {roomTitle}
      </Link>
      {(roomImageUrl != null || roomFloor != null) && (
        <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-44 flex-col overflow-hidden rounded border border-border bg-popover shadow-md group-hover:flex">
          {roomImageUrl && (
            <span className="relative block aspect-4/3 w-full">
              <Image
                src={roomImageUrl}
                alt={roomTitle ?? ""}
                fill
                className="object-cover"
                sizes="176px"
                unoptimized={shouldLoadImageDirectly(roomImageUrl)}
              />
            </span>
          )}
          {roomFloor != null && (
            <span className="px-2 py-1 text-sm text-muted-foreground">
              {floorLabel}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

function EventDetailActions({
  event,
  eventSlug,
  t,
}: {
  event: EventDetail
  eventSlug: string
  t: Translator
}) {
  return (
    <div className="space-y-4">
      {event.eventStatus === "scheduled" && (
        <EventInterest key={eventSlug} eventSlug={eventSlug} />
      )}
      {event.facebookUrl && (
        <EventFacebookButton
          facebookUrl={event.facebookUrl}
          label={t("facebook")}
          eventId={event._id}
          eventTitle={event.title}
          eventSlug={eventSlug}
        />
      )}
    </div>
  )
}

function formatLongDate(dateStr: string, locale: AppLocale): string {
  const formatted = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "nb-NO",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Oslo",
    },
  ).format(new Date(`${dateStr}T12:00:00Z`))
  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1)
}

function formatScheduleTime(date: EventDetailDate): string {
  if (!date.startTime) return "-"
  if (!date.endTime) return date.startTime
  return `${date.startTime}–${date.endTime}`
}

function formatPrices(event: EventDetail, t: Translator): string | null {
  if (event.isFree) return t("priceFree")
  const parts: string[] = []
  if (event.priceOrdinar != null)
    parts.push(t("priceOrdinary", { price: event.priceOrdinar }))
  if (event.priceStudent != null)
    parts.push(t("priceStudent", { price: event.priceStudent }))
  if (event.priceMedlem != null)
    parts.push(t("priceMember", { price: event.priceMedlem }))
  return parts.length > 0 ? parts.join(" / ") : null
}

function lowestPrice(event: EventDetail): number | null {
  const prices = [
    event.priceOrdinar,
    event.priceStudent,
    event.priceMedlem,
  ].filter((price): price is number => price != null)
  return prices.length > 0 ? Math.min(...prices) : null
}

function formatShortDate(dateStr: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Oslo",
  }).format(new Date(`${dateStr}T12:00:00Z`))
}

/**
 * The one filled button on the page. Sold-out and cancelled events keep the
 * button in place, disabled, so the state reads at a glance.
 */
function EventTicketAction({
  event,
  eventSlug,
  t,
}: {
  event: EventDetail
  eventSlug: string
  t: Translator
}) {
  if (!event.ticketUrl) return null
  if (event.eventStatus !== "scheduled" || event.isSoldOut) {
    return (
      <Button disabled>
        {event.isSoldOut ? t("soldOut") : t("statusCancelled")}
      </Button>
    )
  }
  const from = event.isFree ? null : lowestPrice(event)

  return (
    <EventTicketButton
      ticketUrl={event.ticketUrl}
      label={from == null ? t("tickets") : t("ticketsFrom", { price: from })}
      newTabLabel={t("opensInNewTab")}
      eventId={event._id}
      eventTitle={event.title}
      eventSlug={eventSlug}
    />
  )
}
