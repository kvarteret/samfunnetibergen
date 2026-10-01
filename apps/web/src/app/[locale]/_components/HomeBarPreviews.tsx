"use client"

import { Music2 } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { SectionMark } from "@/components/section-mark"
import { SanityImage } from "@/components/ui/sanity-image"
import type { AppLocale } from "@/i18n/routing"
import {
  type ClosedDate,
  formatOpeningHoursRow,
  formatVacationModeNotice,
  isOpenAtForCombinedHours,
  isoDate,
  type OpeningHours,
  type VacationMode,
} from "@/lib/opening-hours"
import { useCurrentTime } from "@/lib/use-current-time"

interface NowPlayingState {
  authorized: boolean
  hasTrack: boolean
  isPlaybackActive: boolean
  name: string | null
  artists: string | null
  album: string | null
  image: string | null
}

interface BarPreviewImage {
  id?: string | null
  alt?: string | null
  hotspot?: { x: number; y: number } | null
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  } | null
  lqip?: string | null
}

export interface HomeBarPreviewRoom {
  title?: string | null
  slug?: string | null
  summary?: string | null
  bar?: string | null
  openingHours?: OpeningHours | null
  image?: BarPreviewImage | null
}

interface HomeBarPreviewsProps {
  rooms: HomeBarPreviewRoom[]
  houseClosedDates?: ClosedDate[] | null
  openingHours?: OpeningHours | null
  vacationMode?: VacationMode | null
  locale: AppLocale
  initialNow: string
}

function hasSpotifyTrack(
  nowPlaying: NowPlayingState | null,
  room: HomeBarPreviewRoom,
) {
  return (
    room.slug === "grondahls" &&
    nowPlaying?.authorized === true &&
    nowPlaying.hasTrack &&
    nowPlaying.isPlaybackActive
  )
}

export function HomeBarPreviews({
  rooms,
  houseClosedDates,
  openingHours,
  vacationMode,
  locale,
  initialNow,
}: HomeBarPreviewsProps) {
  const now = useCurrentTime(initialNow)
  const t = useTranslations("HomePage")
  const [nowPlaying, setNowPlaying] = useState<NowPlayingState | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchNowPlaying() {
      try {
        const response = await fetch("/api/now-playing", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) return
        setNowPlaying((await response.json()) as NowPlayingState | null)
      } catch {
        if (!controller.signal.aborted) setNowPlaying(null)
      }
    }

    void fetchNowPlaying()
    const interval = window.setInterval(fetchNowPlaying, 15_000)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [])

  if (!rooms.length) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 pb-2">
        <SectionMark className="text-primary" />
        <h2 className="text-base tracking-wide sm:text-lg">{t("bars")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rooms.map(room => (
          <HomeBarPreviewCard
            houseClosedDates={houseClosedDates}
            key={room.slug ?? room.title}
            locale={locale}
            now={now}
            nowPlaying={nowPlaying}
            openingHours={openingHours}
            room={room}
            translations={t}
            vacationMode={vacationMode}
          />
        ))}
      </div>
    </section>
  )
}

function HomeBarPreviewCard({
  room,
  houseClosedDates,
  openingHours,
  vacationMode,
  now,
  nowPlaying,
  locale,
  translations,
}: {
  room: HomeBarPreviewRoom
  houseClosedDates?: ClosedDate[] | null
  openingHours?: OpeningHours | null
  vacationMode?: VacationMode | null
  now: Date
  nowPlaying: NowPlayingState | null
  locale: AppLocale
  translations: ReturnType<typeof useTranslations<"HomePage">>
}) {
  const spotifyTrack = hasSpotifyTrack(nowPlaying, room)
  const isOpen = isOpenAtForCombinedHours(
    now,
    openingHours,
    room.openingHours,
    houseClosedDates,
    vacationMode,
  )
  const vacationNotice = formatVacationModeNotice(
    isoDate(now),
    vacationMode,
    locale,
  )
  const image = room.image
  const href = room.slug ? `/${locale}/rom/${room.slug}` : `/${locale}/rom`

  return (
    <Link
      aria-label={translations("goToBar", {
        bar: room.title ?? translations("barFallback"),
      })}
      className="group grid min-h-60 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden bg-card focus-brutal"
      href={href}
    >
      <div className="relative min-h-full bg-muted">
        {image?.id ? (
          <SanityImage
            alt={image.alt ?? room.title ?? translations("barImageAlt")}
            className="min-h-full w-full object-cover"
            image={image}
            height={720}
            mode="cover"
            sizes="(min-width: 1024px) 25vw, 50vw"
            width={960}
          />
        ) : (
          <div className="flex min-h-full items-center justify-center">
            <Music2 aria-hidden className="size-10 text-foreground-muted" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-5 p-5">
        <div className="space-y-3">
          <div className="min-w-0">
            <p className="font-heading text-xl text-foreground group-hover:underline group-hover:underline-offset-2">
              {room.bar || room.title}
            </p>
            {isOpen ? (
              <p className="mt-1 font-heading uppercase tracking-widest text-primary">
                {translations("barOpen")}
              </p>
            ) : null}
          </div>

          <BarPreviewBody
            spotifyTrack={spotifyTrack}
            nowPlaying={nowPlaying}
            summary={room.summary}
            translations={translations}
          />
        </div>

        {room.openingHours?.rows?.length ? (
          <dl className="space-y-1 border-t border-border pt-4">
            {room.openingHours.rows.slice(0, 3).map(row => {
              const label = row ? formatOpeningHoursRow(row, locale) : null
              if (!label) return null

              return (
                <div
                  className="text-sm text-foreground-muted"
                  key={row?._key ?? label}
                >
                  {label}
                </div>
              )
            })}
            {vacationNotice ? (
              <div className="text-sm font-medium text-foreground">
                {vacationNotice}
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </Link>
  )
}

function BarPreviewBody({
  spotifyTrack,
  nowPlaying,
  summary,
  translations,
}: {
  spotifyTrack: boolean
  nowPlaying: NowPlayingState | null
  summary?: string | null
  translations: ReturnType<typeof useTranslations<"HomePage">>
}) {
  if (spotifyTrack && nowPlaying) {
    return (
      <div className="space-y-1 border-l-2 border-primary pl-3">
        <p className="font-heading uppercase tracking-widest text-primary">
          Spotify
        </p>
        <p className="line-clamp-1 font-heading text-foreground">
          {nowPlaying.name ?? translations("nowPlaying")}
        </p>
        {nowPlaying.artists && (
          <p className="line-clamp-1 text-foreground-muted">
            {nowPlaying.artists}
          </p>
        )}
      </div>
    )
  }
  if (summary) {
    return <p className="line-clamp-3">{summary}</p>
  }
  return null
}
