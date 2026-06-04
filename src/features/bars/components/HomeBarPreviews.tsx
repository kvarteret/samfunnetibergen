"use client";

import { Music2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  formatOpeningHoursRow,
  isOpenAt,
  type ClosedDate,
  type OpeningHours,
} from "@/lib/opening-hours";
import type { AppLocale } from "@/i18n/routing";

interface NowPlayingState {
  authorized: boolean;
  hasTrack: boolean;
  isPlaybackActive: boolean;
  name: string | null;
  artists: string | null;
  album: string | null;
  image: string | null;
}

interface BarPreviewImage {
  assetUrl?: string | null;
  alt?: string | null;
}

export interface HomeBarPreviewRoom {
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  bar?: string | null;
  openingHours?: OpeningHours | null;
  image?: BarPreviewImage | null;
}

interface HomeBarPreviewsProps {
  rooms: HomeBarPreviewRoom[];
  houseClosedDates?: ClosedDate[] | null;
  locale: AppLocale;
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
  );
}

export function HomeBarPreviews({
  rooms,
  houseClosedDates,
  locale,
}: HomeBarPreviewsProps) {
  const [now, setNow] = useState(() => new Date());
  const [nowPlaying, setNowPlaying] = useState<NowPlayingState | null>(null);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchNowPlaying() {
      try {
        const response = await fetch("/api/now-playing", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        setNowPlaying((await response.json()) as NowPlayingState | null);
      } catch {
        if (!controller.signal.aborted) setNowPlaying(null);
      }
    }

    void fetchNowPlaying();
    const interval = window.setInterval(fetchNowPlaying, 15_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  if (!rooms.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-border pb-2">
        <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
          Barer
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rooms.map((room) => (
          <HomeBarPreviewCard
            houseClosedDates={houseClosedDates}
            key={room.slug ?? room.title}
            locale={locale}
            now={now}
            nowPlaying={nowPlaying}
            room={room}
          />
        ))}
      </div>
    </section>
  );
}

function HomeBarPreviewCard({
  room,
  houseClosedDates,
  now,
  nowPlaying,
  locale,
}: {
  room: HomeBarPreviewRoom;
  houseClosedDates?: ClosedDate[] | null;
  now: Date;
  nowPlaying: NowPlayingState | null;
  locale: AppLocale;
}) {
  const spotifyTrack = hasSpotifyTrack(nowPlaying, room);
  const isOpen = isOpenAt(now, room.openingHours, houseClosedDates);
  const imageUrl = room.image?.assetUrl;
  const href = room.slug ? `/${locale}/rom/${room.slug}` : `/${locale}/rom`;

  return (
    <Link
      aria-label={`Gå til ${room.title ?? "bar"}`}
      className="grid min-h-[15rem] grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden border-2 border-border bg-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
    >
      <div className="relative min-h-full bg-muted">
        {imageUrl ? (
          <Image
            alt={room.image?.alt ?? room.title ?? "Bar"}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            src={imageUrl}
          />
        ) : (
          <div className="flex h-full min-h-[15rem] items-center justify-center">
            <Music2 aria-hidden className="size-10 text-foreground/20" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-5 p-5">
        <div className="space-y-3">
          <div className="min-w-0">
            <p className="font-heading text-xl text-foreground">
              {room.bar || room.title}
            </p>
            {isOpen ? (
              <p className="mt-1 font-heading text-xs uppercase tracking-[0.14em] text-primary">
                Åpen
              </p>
            ) : null}
          </div>

          {spotifyTrack && nowPlaying ? (
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <p className="text-xs font-heading uppercase tracking-[0.14em] text-primary">
                Spotify
              </p>
              <p className="line-clamp-1 font-heading text-sm text-foreground">
                {nowPlaying.name ?? "Spiller nå"}
              </p>
              {nowPlaying.artists && (
                <p className="line-clamp-1 text-sm text-foreground/65">
                  {nowPlaying.artists}
                </p>
              )}
            </div>
          ) : room.summary ? (
            <p className="line-clamp-3 text-sm leading-6 text-foreground/70">
              {room.summary}
            </p>
          ) : null}
        </div>

        {room.openingHours?.rows?.length ? (
          <dl className="space-y-1 border-t border-border pt-4">
            {room.openingHours.rows.slice(0, 3).map((row) => {
              const label = row ? formatOpeningHoursRow(row) : null;
              if (!label) return null;

              return (
                <div
                  className="text-xs text-foreground/60"
                  key={row?._key ?? label}
                >
                  {label}
                </div>
              );
            })}
          </dl>
        ) : null}
      </div>
    </Link>
  );
}
