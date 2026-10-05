"use client"

import { CalendarDays } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { BrandLogo } from "@/components/navbar/BrandLogo"
import { SectionMark } from "@/components/section-mark"
import { Button } from "@/components/ui/button"
import type { SiteLogoContent } from "@/lib/sanity/fetch"
import messages from "@/messages/nb.json"
import type { ScreenRoomHours } from "../domain/opening-hours"
import {
  SCREEN_TIME_ZONE,
  type ScreenEvent,
  type ScreenPromotion,
} from "../domain/schedule"
import { useInfoScreen } from "../domain/useInfoScreen"
import type { ScreenWeather } from "../domain/weather"
import { PromotedEvents } from "./PromotedEvents"
import { ScreenEventCard } from "./ScreenEventCard"
import { ScreenOpeningHours } from "./ScreenOpeningHours"
import { WeatherDisplay } from "./WeatherDisplay"

const EMPTY_PROMOTIONS: ScreenPromotion[] = []
const VOLUNTEER_URL =
  "https://blifrivillig.no/?utm_source=infoskjerm&utm_medium=qr&utm_campaign=second-floor-infoskjerm"

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
    <main className="fixed inset-0 grid place-items-center overflow-hidden bg-foreground">
      <div className="flex h-[min(100dvh,177.777778vw)] w-[min(100vw,56.25dvh)] flex-col overflow-hidden bg-background text-foreground [container-type:inline-size]">
        <header className="shrink-0 px-[6cqw] pt-[4cqw] pb-[3cqw]">
          <div className="mb-[3cqw] flex items-center justify-between">
            <BrandLogo
              logo={logo}
              targetHeight={100}
              className="h-[8cqw] w-auto max-w-[45cqw] object-contain"
            />
            <div className="grid gap-[0.8cqw] text-right">
              <time
                className="font-mono text-[6cqw] leading-none tabular-nums"
                dateTime={now.toISOString()}
              >
                {timeFormatter.format(now)}
              </time>
              {weather && <WeatherDisplay weather={weather} />}
            </div>
          </div>
          <div className="flex items-end justify-between gap-[3cqw]">
            <h1 className="text-[8.6cqw] font-heading leading-[1.04] tracking-[-0.055em]">
              I dag på
              <br />
              <span className="text-primary">
                Kvarteret<span className="text-foreground">.</span>
              </span>
            </h1>
            <SectionMark className="mb-[1cqw] h-[5cqw] w-auto text-primary" />
          </div>
          <p className="mt-[2cqw] text-[2.7cqw] capitalize">
            <time dateTime={date}>
              {dayFormatter.format(new Date(`${date}T12:00:00+01:00`))}
            </time>
          </p>
          {roomHours && <ScreenOpeningHours roomHours={roomHours} now={now} />}
        </header>

        <section
          className="flex min-h-0 flex-1 flex-col px-[6cqw]"
          aria-label="Dagens arrangementer"
        >
          {events.length > 0 ? (
            <ol
              className="m-0 grid min-h-0 flex-1 list-none p-0"
              data-count={visibleEvents.length}
              style={{
                gridTemplateRows: `repeat(${visibleEvents.length}, minmax(0, 1fr))`,
              }}
              start={currentPage * eventsPerPage + 1}
            >
              {visibleEvents.map(event => (
                <ScreenEventCard
                  key={event.id}
                  event={event}
                  now={now}
                  pageSize={visibleEvents.length}
                />
              ))}
            </ol>
          ) : (
            <div className="flex flex-1 flex-col items-start justify-center gap-[3cqw] [&_p]:max-w-[65cqw] [&_p]:text-[2.5cqw] [&_p]:leading-[1.4]">
              <CalendarDays aria-hidden className="size-[8cqw] text-primary" />
              <h2 className="text-[7cqw] leading-[1.12] tracking-[-0.04em]">
                En rolig dag
                <br />
                på huset.
              </h2>
              <p>Ingen arrangementer i programmet i dag.</p>
              <p>Se hva som skjer fremover på samfunnetibergen.no</p>
            </div>
          )}
          {pageCount > 1 && (
            <div className="flex h-[4cqw] shrink-0 items-center justify-between text-[1.8cqw]">
              <div className="flex gap-[0.8cqw]" aria-hidden>
                {pageIds.map((id, index) => (
                  <span
                    key={id}
                    data-active={index === currentPage}
                    className="size-[0.9cqw] rounded-full bg-border data-[active=true]:bg-primary"
                  />
                ))}
              </div>
              <span>
                Side {currentPage + 1} av {pageCount}
              </span>
            </div>
          )}
        </section>

        {promotions.length > 0 && <PromotedEvents events={promotions} />}

        <footer className="flex shrink-0 items-center justify-between bg-primary pl-[6cqw] text-[2.1cqw] leading-[1.6] text-primary-foreground">
          <div className="grid h-[8.2cqw] w-full grid-cols-[minmax(0,1fr)_auto_8.2cqw] grid-rows-2 items-center gap-x-[2cqw]">
            <p className="col-start-1 row-start-1 line-clamp-1 text-[2.8cqw] font-heading leading-[1.2] tracking-[-0.03em] [font-family:var(--font-display)] [overflow-wrap:anywhere]">
              {message}
            </p>
            <p className="col-start-1 row-start-2 text-[2.4cqw] font-semibold text-primary-foreground/70">
              samfunnetibergen.no
            </p>
            <Button
              variant="plain"
              render={<Link href="/nb/grupper/e-tjenesten" prefetch={false} />}
              className="col-start-2 row-start-1 block h-auto rounded-none p-0 text-[1.6cqw] text-primary-foreground focus-visible:outline-[0.2cqw] focus-visible:outline-offset-[0.4cqw] focus-visible:outline-current"
            >
              {messages.Footer.credit}
            </Button>
            <p className="col-start-2 row-start-2 text-center text-[2.2cqw] font-semibold leading-[1.2] [font-family:var(--font-fraunces)]">
              Bli frivillig!
            </p>
            <Link
              href={VOLUNTEER_URL}
              prefetch={false}
              aria-label="Bli frivillig – se gruppene"
              className="col-start-3 row-span-2 row-start-1 block bg-white focus-visible:outline-[0.2cqw] focus-visible:outline-offset-[0.4cqw] focus-visible:outline-current"
            >
              <Image
                src="/infoskjerm/volunteer-qr.png"
                alt="QR-kode til gruppene på Samfunnet i Bergen"
                width={490}
                height={490}
                unoptimized
                className="size-[8.2cqw] [image-rendering:pixelated]"
              />
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
