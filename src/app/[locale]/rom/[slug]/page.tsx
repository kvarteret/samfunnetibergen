import { FileText, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DetailRow } from "@/components/ui/detail-row"
import {
  BoolSpec,
} from "@/features/rooms"
import {
  ImageCarousel,
  PanoramaEmbed,
  type CarouselSlide,
} from "@/features/rooms/components/ImageCarousel"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { formatWeekdays } from "@/lib/opening-hours"
import { buildPageMetadata } from "@/lib/page-metadata"
import { PortableTextContent } from "@/lib/portable-text-components"
import type { SourcedImage } from "@/lib/sanity/fetch"
import { fetchRoomBySlug, fetchRoomSlugs } from "@/lib/sanity/fetch"

export const revalidate = 300

type RoomPageProps = {
  params: Promise<{ locale: string; slug: string }>
}

type Room = NonNullable<Awaited<ReturnType<typeof fetchRoomBySlug>>>

export async function generateStaticParams() {
  const locales = getLocaleStaticParams()
  const slugs = await fetchRoomSlugs()
  return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

const imageUrl = (image: SourcedImage | null | undefined) => image?.assetUrl

export async function generateMetadata({ params }: RoomPageProps) {
  const { slug, locale: localeParam } = await params
  await resolvePageLocale(Promise.resolve({ locale: localeParam }))
  const room = await fetchRoomBySlug(slug, { stega: false })
  if (!room) return {}

  const title = room.title ?? slug
  const firstImageUrl = imageUrl(room.images?.[0]) ?? undefined

  return buildPageMetadata({
    content: room,
    canonicalPath: `/${localeParam}/rom/${slug}`,
    fallbackTitle: `${title} | Rom`,
    fallbackDescription: room.summary,
    fallbackImageUrl: firstImageUrl,
  })
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug, locale: localeParam } = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  )
  activateRequestLocale(locale)

  const room = await fetchRoomBySlug(slug)
  if (!room) notFound()

  const title = room.title ?? slug

  const imageSlides: CarouselSlide[] = (room.images ?? []).flatMap(
    (image: SourcedImage) => {
      const src = imageUrl(image)
      return src
        ? [
            {
              _key: image._key,
              type: "image" as const,
              src,
              alt: image.alt || title,
              caption: image.caption,
            },
          ]
        : []
    },
  )

  const carouselSlides: CarouselSlide[] = room.panoramaUrl
    ? [
        {
          _key: "panorama",
          type: "panorama",
          iframeSrc: room.panoramaUrl,
          caption: "360° visning",
        },
        ...imageSlides,
      ]
    : imageSlides

  const imageOnlySlides = carouselSlides.filter(s => s.type === "image")
  const panoramaSlide = carouselSlides.find(s => s.type === "panorama")

  return (
    <article>
      {imageOnlySlides.length > 0 && (
        <div>
          <ImageCarousel slides={imageOnlySlides} />
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <header className="space-y-3">
            <Link
              className="font-heading text-sm uppercase tracking-widest text-foreground-muted hover:text-foreground"
              href={`/${locale}/rom`}
            >
              Rom
            </Link>
            <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
              {title}
            </h1>
            {room.summary && (
              <p className="max-w-2xl text-lg leading-7 text-foreground-muted">
                {room.summary}
              </p>
            )}
          </header>

          {room.body && room.body.length > 0 && (
            <section className="max-w-4xl space-y-8">
              <PortableTextContent value={room.body} />
            </section>
          )}

          <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <RoomSpecs room={room} />
            {panoramaSlide && "iframeSrc" in panoramaSlide && (
              <div className="aspect-video w-full">
                <PanoramaEmbed
                  loading="lazy"
                  src={panoramaSlide.iframeSrc}
                />
              </div>
            )}
          </section>
          <RoomFloorPlan room={room} />
        </div>

        <aside className="space-y-6">
          <RoomOpeningHours room={room} />
          <Button
            className="w-full"
            render={<Link href={`/rom/book?room=${room.crescatRoomId}`} />}
            size="lg"
          >
            Book {room.title ?? slug} her
          </Button>
        </aside>
      </div>
    </article>
  )
}

interface RoomSpecsProps {
  room: Room
}

function RoomSpecs({ room }: RoomSpecsProps) {
  const hasCapacity =
    room.capacityStanding != null || room.capacitySeated != null
  const hasSpecs =
    room.floor != null ||
    hasCapacity ||
    room.suitedPurposes?.length ||
    room.bar != null ||
    room.hasSound != null ||
    room.hasLighting != null ||
    room.hasAV != null

  if (!hasSpecs) {
    return null
  }

  return (
    <section className="space-y-6">
      <hr className="border-border" />
      <dl className="max-w-md divide-y divide-border">
        {room.floor != null && (
          <DetailRow label="Etasje" layout="labelColumn">
            {room.floor}. etasje
          </DetailRow>
        )}
        {room.capacityStanding != null && (
          <DetailRow label="Stående" layout="labelColumn">
            <span className="flex items-center gap-1.5">
              <Users aria-hidden className="size-3.5 text-foreground-muted" />
              {room.capacityStanding} personer
            </span>
          </DetailRow>
        )}
        {room.capacitySeated != null && (
          <DetailRow label="Sittende" layout="labelColumn">
            <span className="flex items-center gap-1.5">
              <Users aria-hidden className="size-3.5 text-foreground-muted" />
              {room.capacitySeated} personer
            </span>
          </DetailRow>
        )}
        {room.suitedPurposes?.length ? (
          <DetailRow label="Passer til" layout="labelColumn">
            {room.suitedPurposes.join(", ")}
          </DetailRow>
        ) : null}
        {room.bar != null && (
          <DetailRow label="Bar" layout="labelColumn">
            {room.bar ? room.bar : "Nei"}
          </DetailRow>
        )}
        {room.hasSound != null && (
          <BoolSpec
            details={room.soundDetails}
            label="Lyd"
            value={room.hasSound}
          />
        )}
        {room.hasLighting != null && (
          <BoolSpec
            details={room.lightingDetails}
            label="Lys"
            value={room.hasLighting}
          />
        )}
        {room.hasAV != null && (
          <BoolSpec details={room.avDetails} label="A/V" value={room.hasAV} />
        )}
      </dl>

      {room.specsUrl && (
        <a
          className="inline-flex items-center gap-2 panel px-4 py-2.5 font-heading text-foreground shadow-shadow transition-shadow hover:shadow-none"
          href={room.specsUrl}
          rel="noreferrer"
          target="_blank"
        >
          Tekniske spesifikasjoner
          <FileText aria-hidden className="size-4" />
        </a>
      )}
    </section>
  )
}

function RoomFloorPlan({ room }: RoomSpecsProps) {
  const floorPlan = room.floorPlans?.find(
    (plan: NonNullable<typeof room.floorPlans>[number]) => plan.floor === room.floor && plan.assetUrl,
  )

  if (!floorPlan?.assetUrl) {
    return null
  }

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg text-foreground">
        {floorPlan.title ?? `${room.floor}. etasje`}
      </h2>
      <div className="max-w-sm">
        <Image
          alt={floorPlan.title ?? `Plantegning for ${room.floor}. etasje`}
          className="h-auto w-full"
          height={600}
          src={floorPlan.assetUrl}
          width={540}
        />
      </div>
    </section>
  )
}

interface RoomOpeningHoursProps {
  room: Room
}

function RoomOpeningHours({ room }: RoomOpeningHoursProps) {
  if (!room.openingHours?.rows?.length) {
    return null
  }

  return (
    <section className="space-y-3">
      <h3 className="font-heading text-sm uppercase tracking-widest text-foreground-muted">
        Kontakt
      </h3>
      <dl className="divide-y divide-border border-y-2 border-border">
        {room.openingHours.rows.map(
          (
            row: NonNullable<NonNullable<Room["openingHours"]>["rows"]>[number],
          ) => {
            const dayLabel = formatWeekdays(row.weekdays)
            if (!dayLabel) return null

            return (
              <div
                className="grid grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)] gap-4 py-2"
                key={row._key}
              >
                <dt className="font-heading text-foreground">{dayLabel}</dt>
                <dd className="text-foreground-muted">
                  {row.status === "closed"
                    ? "Stengt"
                    : `${row.duration?.start ?? "?"}-${row.duration?.end ?? "?"}`}
                  {row.note && (
                    <span className="mt-1 block text-foreground-muted">
                      {row.note}
                    </span>
                  )}
                </dd>
              </div>
            )
          },
        )}
      </dl>
    </section>
  )
}
