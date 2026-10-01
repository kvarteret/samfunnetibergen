"use client"

import { CalendarDays } from "lucide-react"
import Link from "next/link"
import { BrandLogo } from "@/components/navbar/BrandLogo"
import { SectionMark } from "@/components/section-mark"
import type { SiteLogoContent } from "@/lib/sanity/fetch"
import messages from "@/messages/nb.json"
import styles from "./InfoScreen.module.css"
import type { ScreenRoomHours } from "./opening-hours"
import { PromotedEvents } from "./PromotedEvents"
import { ScreenEventCard } from "./ScreenEventCard"
import { ScreenOpeningHours } from "./ScreenOpeningHours"
import {
  SCREEN_TIME_ZONE,
  type ScreenEvent,
  type ScreenPromotion,
} from "./schedule"
import { useInfoScreen } from "./useInfoScreen"
import { WeatherDisplay } from "./WeatherDisplay"
import type { ScreenWeather } from "./weather"

const EMPTY_PROMOTIONS: ScreenPromotion[] = []

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
  promotions = EMPTY_PROMOTIONS,
}: InfoScreenProps) {
  const { now, currentPage, pageCount, pageIds, visibleEvents, eventsPerPage } =
    useInfoScreen({
      date,
      events,
      initialNow,
      hasPromotions: promotions.length > 0,
    })

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
              <Link
                className={styles.credit}
                href="/nb/grupper/e-tjenesten"
                prefetch={false}
              >
                {messages.Footer.credit}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
