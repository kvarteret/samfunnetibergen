"use client"

import { Music2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import type { AppLocale } from "@/i18n/routing"
import {
  type ClosedDate,
  formatVacationModeNotice,
  formatOpeningHoursRow,
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
  assetUrl?: string | null
  alt?: string | null
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
  operationsManagerHours?: OpeningHours | null
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
  operationsManagerHours,
  vacationMode,
  locale,
  initialNow,
}: HomeBarPreviewsProps) {
  const now = useCurrentTime(initialNow)
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
      <div className="flex items-center justify-between pb-2">
        <p className="font-heading text-xl text-foreground-muted">Barer</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rooms.map(room => (
          <HomeBarPreviewCard
            houseClosedDates={houseClosedDates}
            key={room.slug ?? room.title}
            locale={locale}
            now={now}
            nowPlaying={nowPlaying}
            operationsManagerHours={operationsManagerHours}
            room={room}
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
  operationsManagerHours,
  vacationMode,
  now,
  nowPlaying,
  locale,
}: {
  room: HomeBarPreviewRoom
  houseClosedDates?: ClosedDate[] | null
  operationsManagerHours?: OpeningHours | null
  vacationMode?: VacationMode | null
  now: Date
  nowPlaying: NowPlayingState | null
  locale: AppLocale
}) {
  const spotifyTrack = hasSpotifyTrack(nowPlaying, room)
  const isOpen = isOpenAtForCombinedHours(
    now,
    operationsManagerHours,
    room.openingHours,
    houseClosedDates,
    vacationMode,
  )
  const vacationNotice = formatVacationModeNotice(isoDate(now), vacationMode)
  const imageUrl = room.image?.assetUrl
  const href = room.slug ? `/${locale}/rom/${room.slug}` : `/${locale}/rom`

  return (
    <Link
      aria-label={`Gå til ${room.title ?? "bar"}`}
      className="grid min-h-60 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden panel p-0 transition-colors hover:border-primary focus-brutal"
      href={href}
    >
      <div className="relative min-h-full bg-muted">
        <ImageWithFallback
          alt={room.image?.alt ?? room.title ?? "Bar"}
          aspectRatio=""
          className="min-h-full"
          fallback={
            <Music2 aria-hidden className="size-10 text-foreground-muted" />
          }
          sizes="(min-width: 1024px) 25vw, 50vw"
          src={imageUrl}
        />
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-5 p-5">
        <div className="space-y-3">
          <div className="min-w-0">
            <p className="font-heading text-xl text-foreground">
              {room.bar || room.title}
            </p>
            {isOpen ? (
              <p className="mt-1 font-heading uppercase tracking-widest text-primary">
                Åpen
              </p>
            ) : null}
          </div>

          <BarPreviewBody
            spotifyTrack={spotifyTrack}
            nowPlaying={nowPlaying}
            summary={room.summary}
          />
        </div>

        {room.openingHours?.rows?.length ? (
          <dl className="space-y-1 border-t border-border pt-4">
            {room.openingHours.rows.slice(0, 3).map(row => {
              const label = row ? formatOpeningHoursRow(row) : null
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
}: {
  spotifyTrack: boolean
  nowPlaying: NowPlayingState | null
  summary?: string | null
}) {
  if (spotifyTrack && nowPlaying) {
    return (
      <div className="space-y-1 border-l-2 border-primary pl-3">
        <p className="font-heading uppercase tracking-widest text-primary">
          Spotify
        </p>
        <p className="line-clamp-1 font-heading text-foreground">
          {nowPlaying.name ?? "Spiller nå"}
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
