import { Mic } from "lucide-react"

import { KaraokeForm, type KaraokeRoom } from "@/features/karaoke"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import type { SourcedImage } from "@/lib/sanity/fetch"
import { fetchHouseHours, fetchRoomBySlug } from "@/lib/sanity/fetch"
import { KaraokePhoneLink } from "./KaraokePhoneLink"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)

  return buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/karaoke`,
    title: "Booking av karaoke",
    description:
      "Book karaoke på Maos Lille Røde hos Studentersamfunnet i Bergen. Fyll ut skjemaet så behandler vi forespørselen din så fort vi ser den.",
  })
}

const MAOS_FALLBACK: KaraokeRoom = {
  slug: "maos",
  title: "Maos Lille Røde",
  summary: "En rød og intim stue med moderne teknikk.",
  capacitySeated: 50,
  capacityStanding: 75,
  images: [],
}

export default async function KaraokePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const [roomData, houseHours] = await Promise.all([
    fetchRoomBySlug("maos", locale),
    fetchHouseHours(locale),
  ])
  const room: KaraokeRoom = roomData
    ? {
        slug: roomData.slug ?? MAOS_FALLBACK.slug,
        title: roomData.title ?? MAOS_FALLBACK.title,
        summary: roomData.summary ?? null,
        capacitySeated: roomData.capacitySeated ?? null,
        capacityStanding: roomData.capacityStanding ?? null,
        images: (roomData.images ?? []).map((img: SourcedImage) => ({
          _key: img._key ?? null,
          assetUrl: img.assetUrl ?? null,
          alt: img.alt ?? null,
          caption: img.caption ?? null,
        })),
      }
    : MAOS_FALLBACK

  return (
    <article className="flex w-full flex-col gap-10">
      <KaraokePageIntro />
      <KaraokeForm
        initialNow={new Date().toISOString()}
        room={room}
        operationsManagerHours={houseHours?.operationsManagerHours}
        houseClosedDates={houseHours?.houseClosedDates}
        vacationMode={houseHours?.vacationMode}
      />
    </article>
  )
}

function KaraokePageIntro() {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-primary flex items-center justify-center shrink-0">
          <Mic className="size-5 text-primary-foreground" aria-hidden />
        </div>
        <p className="font-heading uppercase tracking-widest">Karaoke</p>
      </div>
      <h1 className="font-heading text-4xl leading-tight text-foreground lg:text-5xl">
        Booking av karaoke
      </h1>
      <p className="text-lg leading-7 text-foreground-muted max-w-xl">
        Så gøy at du ønsker å booke karaoke hos oss! Fyll ut skjemaet under, så
        behandler vi forespørselen din så fort vi ser den.
      </p>

      <p className="font-heading uppercase tracking-widest text-destructive">
        Aldersgrense 18 år*{" "}
        <span className="normal-case tracking-normal font-sans text-foreground-muted">
          (*18 år med studentbevis – 20 år for alle andre)
        </span>
      </p>

      <SameDayKaraokeNotice />
    </header>
  )
}

function SameDayKaraokeNotice() {
  return (
    <div className="space-y-3 max-w-xl panel">
      <p className=" font-heading text-foreground">
        Vil du booke et karaokerom i dag?
      </p>
      <ul className="space-y-1.5 text-foreground-muted leading-6">
        <li>
          På <strong className="font-heading text-foreground">hverdager</strong>{" "}
          må bookinger for samme dag gjøres{" "}
          <strong className="font-heading text-foreground">
            før kl. 12:00.
          </strong>
        </li>
        <li>
          Etter kl. 12:00, eller på{" "}
          <strong className="font-heading text-foreground">
            lørdager og søndager,
          </strong>{" "}
          må du bestille på telefon:
        </li>
      </ul>
      <KaraokePhoneLink />
    </div>
  )
}
