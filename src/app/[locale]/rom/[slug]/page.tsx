import { ArrowRight, Check, Clock, FileText, Users, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type CarouselSlide, ImageCarousel } from "@/features/rooms/components/ImageCarousel"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { formatWeekdays } from "@/lib/opening-hours"
import { PortableTextContent } from "@/lib/portable-text-components"
import type { SourcedImage } from "@/lib/sanity/fetch"
import { fetchRoomBySlug, fetchRoomSlugs } from "@/lib/sanity/fetch"

export const revalidate = 300

type RoomPageProps = {
    params: Promise<{ locale: string; slug: string }>
}

type Room = NonNullable<Awaited<ReturnType<typeof fetchRoomBySlug>>>

export async function generateStaticParams() {
    const [locales, slugs] = await Promise.all([getLocaleStaticParams(), fetchRoomSlugs()])
    return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

const imageUrl = (image: SourcedImage | null | undefined) => image?.assetUrl

function localizeHref(href: string, locale: string) {
    if (!href.startsWith("/")) return href
    return href === "/" ? `/${locale}` : `/${locale}${href}`
}

export async function generateMetadata({ params }: RoomPageProps) {
    const { slug, locale: localeParam } = await params
    await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    const room = await fetchRoomBySlug(slug, { stega: false })
    if (!room) return {}

    const title = room.title ?? slug
    const firstImageUrl = imageUrl(room.images?.[0]) ?? undefined

    return {
        title: `${title} | Rom | Samfunnet i Bergen`,
        description: room.summary ?? undefined,
        openGraph: {
            title,
            description: room.summary ?? undefined,
            images: firstImageUrl ? [{ url: firstImageUrl }] : undefined,
        },
    }
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const room = await fetchRoomBySlug(slug)
    if (!room) notFound()

    const title = room.title ?? slug

    const imageSlides: CarouselSlide[] = (room.images ?? []).flatMap((image: SourcedImage) => {
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
    })

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

    return (
        <article>
            {carouselSlides.length > 0 && (
                <div className="-mx-6 sm:-mx-10 lg:-mx-14">
                    <ImageCarousel slides={carouselSlides} />
                </div>
            )}

            <div className="mt-8 space-y-10">
                <header className="space-y-3">
                    <Link
                        className="font-heading text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground"
                        href={`/${locale}/rom`}
                    >
                        Rom
                    </Link>
                    <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                        {title}
                    </h1>
                    {room.summary && (
                        <p className="max-w-2xl text-lg leading-7 text-foreground/80">
                            {room.summary}
                        </p>
                    )}
                </header>

                {room.body && room.body.length > 0 && (
                    <section className="max-w-4xl space-y-8">
                        <PortableTextContent value={room.body} />
                    </section>
                )}

                <RoomSpecs room={room} />
                <RoomFloorPlan room={room} />
                <RoomOpeningHours room={room} />
                <RoomBookingButton label={room.bookingLink?.label} locale={locale} />
            </div>
        </article>
    )
}

function RoomBookingButton({ label, locale }: { label?: string | null; locale: string }) {
    return (
        <Button asChild className="w-fit" size="lg">
            <Link href={localizeHref("/rom/book", locale)}>
                <ArrowRight aria-hidden />
                {label ?? "Book rom her"}
            </Link>
        </Button>
    )
}

interface RoomSpecsProps {
    room: Room
}

function RoomSpecs({ room }: RoomSpecsProps) {
    const hasCapacity = room.capacityStanding != null || room.capacitySeated != null
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
                    <SpecRow label="Etasje">
                        <dd className="text-sm text-foreground">{room.floor}. etasje</dd>
                    </SpecRow>
                )}
                {room.capacityStanding != null && (
                    <SpecRow label="Stående">
                        <dd className="flex items-center gap-1.5 text-sm text-foreground">
                            <Users aria-hidden className="size-3.5 text-foreground/40" />
                            {room.capacityStanding} personer
                        </dd>
                    </SpecRow>
                )}
                {room.capacitySeated != null && (
                    <SpecRow label="Sittende">
                        <dd className="flex items-center gap-1.5 text-sm text-foreground">
                            <Users aria-hidden className="size-3.5 text-foreground/40" />
                            {room.capacitySeated} personer
                        </dd>
                    </SpecRow>
                )}
                {room.suitedPurposes?.length ? (
                    <SpecRow label="Passer til">
                        <dd className="text-sm text-foreground">
                            {room.suitedPurposes.join(", ")}
                        </dd>
                    </SpecRow>
                ) : null}
                {room.bar != null && (
                    <SpecRow label="Bar">
                        <dd className="text-sm text-foreground">{room.bar ? room.bar : "Nei"}</dd>
                    </SpecRow>
                )}
                {room.hasSound != null && (
                    <BoolSpec details={room.soundDetails} label="Lyd" value={room.hasSound} />
                )}
                {room.hasLighting != null && (
                    <BoolSpec details={room.lightingDetails} label="Lys" value={room.hasLighting} />
                )}
                {room.hasAV != null && (
                    <BoolSpec details={room.avDetails} label="A/V" value={room.hasAV} />
                )}
            </dl>

            {room.specsUrl && (
                <a
                    className="inline-flex items-center gap-2 border-2 border-border bg-card px-4 py-2.5 font-heading text-sm text-foreground shadow-shadow transition-shadow hover:shadow-none"
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

interface SpecRowProps {
    children: React.ReactNode
    label: string
}

function SpecRow({ children, label }: SpecRowProps) {
    return (
        <div className="flex gap-8 py-3">
            <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                {label}
            </dt>
            {children}
        </div>
    )
}

interface BoolSpecProps {
    details?: string | null
    label: string
    value: boolean
}

function BoolSpec({ details, label, value }: BoolSpecProps) {
    return (
        <SpecRow label={label}>
            <dd className="text-sm text-foreground">
                {value ? (
                    <span className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                            <Check
                                aria-hidden
                                className="size-4 text-green-700 dark:text-green-400"
                            />
                            Ja
                        </span>
                        {details ? (
                            <span className="block max-w-xs text-foreground/70">{details}</span>
                        ) : null}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-foreground/40">
                        <X aria-hidden className="size-4" />
                        Nei
                    </span>
                )}
            </dd>
        </SpecRow>
    )
}

function RoomFloorPlan({ room }: RoomSpecsProps) {
    const floorPlan = room.floorPlans?.find(plan => plan.floor === room.floor && plan.assetUrl)

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
        <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-heading text-lg text-foreground">
                <Clock aria-hidden className="size-4" />
                Åpningstider
            </h2>
            <dl className="max-w-md divide-y divide-border">
                {room.openingHours.rows.map(
                    (row: NonNullable<NonNullable<Room["openingHours"]>["rows"]>[number]) => {
                        const dayLabel = formatWeekdays(row.weekdays)
                        if (!dayLabel) return null

                        return (
                            <div
                                className="grid grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)] gap-4 py-2 text-sm"
                                key={row._key}
                            >
                                <dt className="font-heading text-foreground">{dayLabel}</dt>
                                <dd className="text-foreground/70">
                                    {row.status === "closed"
                                        ? "Stengt"
                                        : `${row.duration?.start ?? "?"}-${row.duration?.end ?? "?"}`}
                                    {row.note && (
                                        <span className="mt-1 block text-foreground/60">
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
