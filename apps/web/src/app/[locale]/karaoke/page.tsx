import { ExternalLink, Mic } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Breadcrumbs } from "@/components/breadcrumbs"
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
  const t = await getTranslations({ locale, namespace: "Karaoke" })

  return buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/karaoke`,
    title: t("bookingTitle"),
    description: t("metaDescription"),
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
  const t = await getTranslations({ locale, namespace: "Karaoke" })
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
    : { ...MAOS_FALLBACK, summary: t("roomSummary") }

  return (
    <article className="flex w-full flex-col gap-10">
      <Breadcrumbs path="/karaoke" />
      <KaraokePageIntro />
      <KaraokeForm
        initialNow={new Date().toISOString()}
        room={room}
        bookableHours={houseHours?.bookableHours}
        houseClosedDates={houseHours?.houseClosedDates}
        vacationMode={houseHours?.vacationMode}
      />
    </article>
  )
}

async function KaraokePageIntro() {
  const t = await getTranslations("Karaoke")
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-primary flex items-center justify-center shrink-0">
          <Mic className="size-5 text-primary-foreground" aria-hidden />
        </div>
        <p className="font-heading uppercase tracking-widest">Karaoke</p>
      </div>
      <h1 className="font-heading text-4xl leading-tight text-foreground lg:text-5xl">
        {t("bookingTitle")}
      </h1>
      <p className="text-lg leading-7 text-foreground-muted max-w-xl">
        {t("intro")}
      </p>

      <p className="text-lg leading-7 text-foreground-muted max-w-xl">
        {t("karafun")}{" "}
        <a
          className="inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:no-underline focus-brutal"
          href="https://www.karafun.com/karaoke/"
          rel="noreferrer"
          target="_blank"
        >
          {t("catalogue")}
          <ExternalLink aria-hidden className="size-4" />
        </a>
        .
      </p>

      <p className="font-heading uppercase tracking-widest text-destructive">
        {t("age")}{" "}
        <span className="normal-case tracking-normal font-sans text-foreground-muted">
          {t("ageNote")}
        </span>
      </p>

      <SameDayKaraokeNotice />
    </header>
  )
}

async function SameDayKaraokeNotice() {
  const t = await getTranslations("Karaoke")
  return (
    <div className="space-y-3 max-w-xl panel">
      <p className=" font-heading text-foreground">{t("sameDay")}</p>
      <ul className="space-y-1.5 text-foreground-muted leading-6">
        <li>{t("sameDayWeekday")}</li>
        <li>{t("sameDayPhone")}</li>
      </ul>
      <KaraokePhoneLink />
    </div>
  )
}
