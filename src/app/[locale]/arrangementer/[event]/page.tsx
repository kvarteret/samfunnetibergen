import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import type { ReactNode } from "react"

import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { PortableTextContent } from "@/lib/portable-text-components"
import { fetchEventBySlug, fetchSiteMetadata } from "@/lib/sanity/fetch"
import { EventFacebookButton, EventTicketButton } from "./EventTrackedLinks"

const longDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
})

type EventDetail = NonNullable<Awaited<ReturnType<typeof fetchEventBySlug>>>

type EventPageProps = {
  params: Promise<{ event: string; locale: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const resolvedParams = await params
  const locale = (await resolvePageLocale(
    Promise.resolve({ locale: resolvedParams.locale }),
  )) as AppLocale
  activateRequestLocale(locale)

  const [eventData, t] = await Promise.all([
    fetchEventBySlug(resolvedParams.event, { stega: false }),
    getTranslations({ locale, namespace: "EventPage" }),
  ])

  if (!eventData) notFound()

  return (
    <article className="flex w-full flex-col gap-8">
      <EventDetailHero
        event={eventData}
        eventSlug={resolvedParams.event}
        ticketsLabel={t("tickets")}
      />
      <EventDetailScheduleAndMeta event={eventData} t={t} />
      <EventDetailDescription
        event={eventData}
        eventSlug={resolvedParams.event}
        t={t}
      />
    </article>
  )
}

export async function generateMetadata({ params }: EventPageProps) {
  const resolvedParams = await params
  const [eventData, siteMetadata] = await Promise.all([
    fetchEventBySlug(resolvedParams.event),
    fetchSiteMetadata(resolvedParams.locale as AppLocale, { stega: false }),
  ])

  if (!eventData) return {}
  const description =
    eventData.seoDescription ??
    eventData.openGraphDescription ??
    siteMetadata?.defaultSeoDescription ??
    undefined
  const openGraphImage =
    eventData.openGraphImageUrl ??
    eventData.imageUrl ??
    siteMetadata?.defaultOpenGraphImageUrl

  const metadata = buildPageMetadata({
    content: eventData,
    canonicalPath: `/${resolvedParams.locale}/arrangementer/${resolvedParams.event}`,
    fallbackTitle: eventData.title,
    fallbackDescription: description,
    fallbackImageUrl: openGraphImage,
  })

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      siteName: siteMetadata?.siteName ?? "Samfunnet i Bergen",
      type: "article",
    },
  }
}

function EventDetailHero({
  event,
  eventSlug,
  ticketsLabel,
}: {
  event: EventDetail
  eventSlug: string
  ticketsLabel: string
}) {
  return (
    <header className="grid gap-6 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
      <div className="flex h-full flex-col justify-evenly">
        {event.eventType?.name && (
          <p className="w-fit bg-primary px-3 py-1.5 font-heading text-primary-foreground">
            {event.eventType.name}
          </p>
        )}
        <h1 className="wrap-break-word font-heading text-4xl leading-none text-foreground">
          {event.title}
        </h1>
        {event.ticketUrl && (
          <EventTicketButton
            ticketUrl={event.ticketUrl}
            label={ticketsLabel}
            eventTitle={event.title}
            eventSlug={eventSlug}
          />
        )}
      </div>

      <div className="overflow-hidden border-2 border-border bg-muted">
        {event.imageUrl ? (
          <div className="relative aspect-16/10 max-h-112 lg:aspect-video">
            <Image
              alt={event.imageCaption ?? event.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 80vw"
              src={event.imageUrl}
            />
          </div>
        ) : (
          <div className="flex aspect-16/10 max-h-112 items-center justify-center p-8 text-center lg:aspect-video">
            <p className="max-w-md font-heading text-4xl leading-tight text-foreground-muted">
              {event.title}
            </p>
          </div>
        )}
      </div>
    </header>
  )
}

function EventDetailScheduleAndMeta({
  event,
  t,
}: {
  event: EventDetail
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
      <EventDetailMetaSidebar event={event} t={t} />
      <EventDetailSchedule event={event} t={t} />
    </div>
  )
}

function EventDetailMetaSidebar({
  event,
  t,
}: {
  event: EventDetail
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  const organizer = event.organizerGroup?.name ?? event.organizerText
  const price = formatPrices(event)

  return (
    <aside className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
      <EventDetailMetaItem label={t("price")}>
        {price ?? "-"}
      </EventDetailMetaItem>
      {organizer && (
        <EventDetailMetaItem label={t("organizer")}>
          {organizer}
        </EventDetailMetaItem>
      )}
    </aside>
  )
}

function EventDetailMetaItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="font-heading uppercase tracking-widest text-foreground">
        {label}
      </p>
      <p className="text-lg leading-6 text-foreground">{children}</p>
    </div>
  )
}

function EventDetailSchedule({
  event,
  t,
}: {
  event: EventDetail
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  return (
    <section>
      <div className="grid grid-cols-[1.3fr_0.6fr_1fr] gap-3 font-heading uppercase tracking-widest text-foreground sm:gap-4">
        <p>{t("date")}</p>
        <p>{t("time")}</p>
        <p>{t("place")}</p>
      </div>
      {(event.dates ?? []).map(date => (
        <EventDetailScheduleItem date={date} event={event} key={date._key} />
      ))}
    </section>
  )
}

function EventDetailScheduleItem({
  date,
  event,
}: {
  date: NonNullable<EventDetail["dates"]>[number]
  event: EventDetail
}) {
  const roomTitle = event.room?.title ?? event.roomText
  const roomSlug = event.room?.slug

  return (
    <div className="grid grid-cols-[1.3fr_0.6fr_1fr] gap-3 px-0 py-4 text-lg leading-tight text-foreground sm:gap-4 sm:text-xl">
      <p>{formatDate(date.startDate)}</p>
      <p>{formatScheduleTime(date)}</p>
      <p>
        {roomSlug ? (
          <EventDetailRoomLink
            event={event}
            roomSlug={roomSlug}
            roomTitle={roomTitle}
          />
        ) : (
          (roomTitle ?? "-")
        )}
      </p>
    </div>
  )
}

function EventDetailRoomLink({
  event,
  roomSlug,
  roomTitle,
}: {
  event: EventDetail
  roomSlug: string
  roomTitle?: string | null
}) {
  const roomFloor = event.room?.floor
  const roomImageUrl = event.room?.imageUrl

  return (
    <span className="group relative inline-block">
      <Link
        href={`/rom/${roomSlug}`}
        className="hover:underline hover:underline-offset-4"
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
              />
            </span>
          )}
          {roomFloor != null && (
            <span className="px-2 py-1 text-sm text-muted-foreground">
              {roomFloor}. etasje
            </span>
          )}
        </span>
      )}
    </span>
  )
}

function EventDetailDescription({
  event,
  eventSlug,
  t,
}: {
  event: EventDetail
  eventSlug: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
      <EventDetailActions event={event} eventSlug={eventSlug} t={t} />
      <div className="space-y-5 border-l-2 border-foreground/60 pl-6 text-lg leading-8 text-foreground-muted max-lg:border-l-0 max-lg:pl-0">
        {event.description?.length ? (
          <PortableTextContent value={event.description} />
        ) : (
          <p>-</p>
        )}
      </div>
    </section>
  )
}

function EventDetailActions({
  event,
  eventSlug,
  t,
}: {
  event: EventDetail
  eventSlug: string
  t: Awaited<ReturnType<typeof getTranslations>>
}) {
  return (
    <div className="space-y-4">
      {event.facebookUrl && (
        <EventFacebookButton
          facebookUrl={event.facebookUrl}
          label={t("facebook")}
          eventTitle={event.title}
          eventSlug={eventSlug}
        />
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  return longDateFormatter.format(new Date(`${dateStr}T00:00:00`))
}

function formatScheduleTime(
  date: NonNullable<EventDetail["dates"]>[number],
): string {
  if (!date.startTime) return "-"
  if (!date.endTime) return date.startTime
  return `${date.startTime}–${date.endTime}`
}

function formatPrices(event: EventDetail): string | null {
  if (event.isFree) return "Gratis"
  const parts: string[] = []
  if (event.priceOrdinar != null) parts.push(`Ord. ${event.priceOrdinar} kr`)
  if (event.priceStudent != null) parts.push(`Stud. ${event.priceStudent} kr`)
  if (event.priceMedlem != null) parts.push(`Medl. ${event.priceMedlem} kr`)
  return parts.length > 0 ? parts.join(" / ") : null
}
