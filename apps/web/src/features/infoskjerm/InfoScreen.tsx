"use client"

import { TZDate } from "@date-fns/tz"
import {
  CalendarDays,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Moon,
  Sun,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BrandLogo } from "@/components/navbar/BrandLogo"
import { SectionMark } from "@/components/section-mark"
import {
  type ClosedDate,
  formatOpeningHoursTime,
  isoDate,
  type OpeningHours,
  openingHoursStatusAt,
  openingRangesForDate,
  type VacationMode,
} from "@/lib/opening-hours"
import type { SiteLogoContent } from "@/lib/sanity/fetch"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import messages from "@/messages/nb.json"
import styles from "./InfoScreen.module.css"
import {
  EVENTS_PER_PAGE,
  getScreenDate,
  isScreenEventExpired,
  PAGE_DURATION_MS,
  REFRESH_INTERVAL_MS,
  SCREEN_TIME_ZONE,
  type ScreenEvent,
  type ScreenPromotion,
} from "./schedule"
import { describeWeather, type ScreenWeather } from "./weather"

const weatherIcons = {
  sun: Sun,
  moon: Moon,
  partlyCloudy: CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
  fog: CloudFog,
}

const dayFormatter = new Intl.DateTimeFormat("nb-NO", {
  timeZone: SCREEN_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
})
const timeFormatter = new Intl.DateTimeFormat("nb-NO", {
  timeZone: SCREEN_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
})

export type ScreenRoomHours = {
  rooms: { title: string; slug: string; hours: OpeningHours | null }[]
  closedDates?: ClosedDate[] | null
  vacationMode?: VacationMode | null
}

type InfoScreenProps = {
  date: string
  events: ScreenEvent[]
  initialNow: string
  logo?: SiteLogoContent | null
  weather?: ScreenWeather | null
  message?: string
  roomHours?: ScreenRoomHours | null
  promotions?: ScreenPromotion[]
}

export function InfoScreen({
  date,
  events,
  initialNow,
  logo,
  weather,
  message,
  roomHours,
  promotions = [],
}: InfoScreenProps) {
  const router = useRouter()
  const [now, setNow] = useState(() => new Date(initialNow))
  const [page, setPage] = useState(0)
  const eventsPerPage = promotions.length ? 3 : EVENTS_PER_PAGE
  const pageCount = Math.max(1, Math.ceil(events.length / eventsPerPage))
  const currentPage = page % pageCount
  const pageIds = events
    .filter((_, index) => index % eventsPerPage === 0)
    .map(event => event.id)
  const visibleEvents = events.slice(
    currentPage * eventsPerPage,
    (currentPage + 1) * eventsPerPage,
  )

  useEffect(() => {
    let currentDate = date
    const tick = () => {
      const nextNow = new Date()
      setNow(nextNow)
      const nextDate = getScreenDate(nextNow)
      if (nextDate !== currentDate) {
        currentDate = nextDate
        router.refresh()
      }
    }
    tick()
    const clock = window.setInterval(tick, 1_000)
    const refresh = window.setInterval(
      () => router.refresh(),
      REFRESH_INTERVAL_MS,
    )
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tick()
        router.refresh()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(refresh)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [date, router])

  useEffect(() => {
    if (pageCount <= 1) return
    const rotation = window.setInterval(
      () => setPage(page => (page + 1) % pageCount),
      PAGE_DURATION_MS,
    )
    return () => window.clearInterval(rotation)
  }, [pageCount])

  return (
    <main className={styles.viewport}>
      <div className={`${styles.screen} paper-surface`}>
        <header className={styles.header}>
          <div className={styles.brandRow}>
            <BrandLogo logo={logo} targetHeight={100} className={styles.logo} />
            <div className={styles.clock}>
              <time dateTime={now.toISOString()}>
                {timeFormatter.format(now)}
              </time>
              {weather && <WeatherDisplay weather={weather} />}
            </div>
          </div>
          <div className={styles.headingRow}>
            <h1>
              I dag på
              <br />
              <span>Kvarteret.</span>
            </h1>
            <SectionMark className={styles.mark} />
          </div>
          <p className={styles.date}>
            <time dateTime={date}>
              {dayFormatter.format(new Date(`${date}T12:00:00+01:00`))}
            </time>
          </p>
          {roomHours && <ScreenOpeningHours roomHours={roomHours} now={now} />}
        </header>

        <section className={styles.program} aria-label="Dagens arrangementer">
          {events.length > 0 ? (
            <ol
              className={styles.events}
              data-count={visibleEvents.length}
              style={{
                gridTemplateRows: `repeat(${visibleEvents.length}, minmax(0, 1fr))`,
              }}
              start={currentPage * eventsPerPage + 1}
            >
              {visibleEvents.map(event => (
                <ScreenEventCard key={event.id} event={event} now={now} />
              ))}
            </ol>
          ) : (
            <div className={styles.empty}>
              <CalendarDays aria-hidden />
              <h2>
                En rolig dag
                <br />
                på huset.
              </h2>
              <p>Ingen arrangementer i programmet i dag.</p>
              <p>Se hva som skjer fremover på samfunnetibergen.no</p>
            </div>
          )}
          {pageCount > 1 && (
            <div className={styles.pagination}>
              <div className={styles.dots} aria-hidden>
                {pageIds.map((id, index) => (
                  <span key={id} data-active={index === currentPage} />
                ))}
              </div>
              <span>
                Side {currentPage + 1} av {pageCount}
              </span>
            </div>
          )}
        </section>

        {promotions.length > 0 && <PromotedEvents events={promotions} />}

        <footer className={styles.footer}>
          <div>
            {message && <p className={styles.footerHeading}>{message}</p>}
            <div className={styles.footerDetails}>
              <p className={styles.website}>samfunnetibergen.no</p>
              <a className={styles.credit} href="/nb/grupper/e-tjenesten">
                {messages.Footer.credit}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

function PromotedEvents({ events }: { events: ScreenPromotion[] }) {
  return (
    <section className={styles.promotions} aria-label="Snart">
      <h2>Snart</h2>
      <div className={styles.promotionGrid}>
        {events.map(event => {
          const imageUrl = event.imageUrl
            ? sanityImageUrl(event.imageUrl, { width: 640, height: 480 })
            : null
          return (
            <article className={styles.promotion} key={event.id}>
              <div className={styles.promotionImage}>
                {imageUrl ? (
                  <Image
                    alt=""
                    fill
                    sizes="24vw"
                    src={imageUrl}
                    unoptimized={shouldLoadImageDirectly(imageUrl)}
                  />
                ) : (
                  <SectionMark className={styles.imageMark} />
                )}
              </div>
              <div className={styles.promotionBody}>
                <p className={styles.promotionDate}>
                  <time dateTime={event.date}>{event.dateLabel}</time>
                </p>
                <h3>{event.title}</h3>
                {event.room && (
                  <p className={styles.promotionRoom}>{event.room}</p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ScreenOpeningHours({
  roomHours,
  now,
}: {
  roomHours: ScreenRoomHours
  now: Date
}) {
  const today = isoDate(now)
  const osloNow = TZDate.tz(SCREEN_TIME_ZONE, now)
  const currentMinute = osloNow.getHours() * 60 + osloNow.getMinutes()
  return (
    <dl className={styles.openingHours} aria-label="Åpningstider i dag">
      {roomHours.rooms.map(room => {
        const { isOpen, currentRange } = openingHoursStatusAt(
          now,
          room.hours,
          roomHours.closedDates,
          roomHours.vacationMode,
        )
        const ranges = openingRangesForDate(
          today,
          room.hours,
          roomHours.closedDates,
          roomHours.vacationMode,
        )
        const overnightRange =
          isOpen && currentRange && currentRange.startMin < 0
            ? currentRange
            : null
        const displayRanges = overnightRange
          ? [overnightRange, ...ranges]
          : ranges
        const hours = displayRanges.length
          ? displayRanges
              .map(
                range =>
                  `${range.startMin > currentMinute ? `Åpner ${formatOpeningHoursTime(range.startMin)} · ` : ""}Stenger ${formatOpeningHoursTime(range.endMin)}`,
              )
              .join(", ")
          : messages.OpeningHours.closedShort
        return (
          <div key={room.slug} data-open={isOpen}>
            <dt>
              {isOpen && (
                <span
                  role="img"
                  className={styles.openDot}
                  aria-label="Åpent"
                />
              )}
              {room.title}
            </dt>
            <dd>{hours}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function WeatherDisplay({ weather }: { weather: ScreenWeather }) {
  const { label, icon } = describeWeather(weather.symbol)
  const Icon = weatherIcons[icon]

  return (
    <div className={styles.weather}>
      <div
        role="img"
        aria-label={`Værvarsel for Bergen: ${label}, ${weather.temperature} grader`}
      >
        <Icon aria-hidden />
        <span>{weather.temperature}°</span>
        <span>{label}</span>
      </div>
    </div>
  )
}

function ScreenEventCard({ event, now }: { event: ScreenEvent; now: Date }) {
  const expired = isScreenEventExpired(event, now)
  const imageUrl = event.imageUrl
    ? sanityImageUrl(event.imageUrl, { width: 480, height: 360 })
    : null

  return (
    <li className={styles.event} data-expired={expired}>
      <div className={styles.eventTime}>
        <span>{event.startTime ?? "Tid kommer"}</span>
        {event.endTime && (
          <span className={styles.endTime}>– {event.endTime}</span>
        )}
      </div>
      <div className={styles.eventBody}>
        <h2>{event.title}</h2>
        <div className={styles.tags}>
          {expired && <span>Avsluttet</span>}
          {event.category && <span>{event.category}</span>}
          {event.cancelled ? (
            <span className={styles.cancelled}>Avlyst</span>
          ) : event.isFree ? (
            <span>Gratis</span>
          ) : null}
        </div>
        {event.room && (
          <p className={styles.room}>
            <MapPin aria-hidden />
            <span className={styles.roomName}>{event.room}</span>
            {event.floor != null && (
              <span className={styles.floorLabel}>{event.floor}. etasje</span>
            )}
          </p>
        )}
        {!event.room && event.floor != null && (
          <p className={styles.floor}>{event.floor}. etasje</p>
        )}
        {event.organizer && (
          <p className={styles.organizer}>{event.organizer}</p>
        )}
      </div>
      <div className={styles.eventImage}>
        {imageUrl ? (
          <Image
            alt=""
            fill
            sizes="(max-aspect-ratio: 9/16) 34vw, 19vh"
            src={imageUrl}
            unoptimized={shouldLoadImageDirectly(imageUrl)}
          />
        ) : (
          <SectionMark className={styles.imageMark} />
        )}
      </div>
    </li>
  )
}
