import { Check, Clock, ExternalLink, FileText, Users, X } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ImageCarousel } from "@/components/room/ImageCarousel"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchRoomBySlug, fetchRoomSlugs } from "@/lib/sanity/queries"
import type { EditorialSection, RoomDetail, SourcedImage } from "@/lib/sanity/types"

export const revalidate = 300

type RoomPageProps = {
    params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
    const [locales, slugs] = await Promise.all([getLocaleStaticParams(), fetchRoomSlugs()])
    return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

const imageUrl = (image: SourcedImage | null | undefined) => image?.assetUrl ?? image?.sourceUrl

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

const DAY_LABELS: Record<string, string> = {
    monday: "Mandag",
    tuesday: "Tirsdag",
    wednesday: "Onsdag",
    thursday: "Torsdag",
    friday: "Fredag",
    saturday: "Lørdag",
    sunday: "Søndag",
}

function BoolSpec({ label, value }: { label: string; value: boolean }) {
    return (
        <div className="flex gap-8 py-3">
            <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                {label}
            </dt>
            <dd className="text-sm text-foreground">
                {value ? (
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                        <Check aria-hidden className="size-4 text-green-700 dark:text-green-400" />
                        Ja
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-foreground/40">
                        <X aria-hidden className="size-4" />
                        Nei
                    </span>
                )}
            </dd>
        </div>
    )
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const room = await fetchRoomBySlug(slug)
    if (!room) notFound()

    const title = room.title ?? slug

    const carouselImages = (room.images ?? []).flatMap((image: SourcedImage) => {
        const src = imageUrl(image)
        return src
            ? [{ _key: image._key, src, alt: image.alt || title, caption: image.caption }]
            : []
    })

    const hasCapacity = room.capacityStanding != null || room.capacitySeated != null
    const hasSpecs =
        room.floor != null ||
        hasCapacity ||
        room.suitedPurposes?.length ||
        room.bar != null ||
        room.hasSound != null ||
        room.hasLighting != null ||
        room.hasAV != null

    const hasOpeningHours = (room.openingHours?.hours?.length ?? 0) > 0

    return (
        <article>
            {/* Full-bleed carousel */}
            {carouselImages.length > 0 && (
                <div className="-mx-6 sm:-mx-10 lg:-mx-14">
                    <ImageCarousel images={carouselImages} />
                </div>
            )}

            {/* Page content */}
            <div className="mt-8 space-y-10">
                {/* Title block */}
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

                {/* Editorial sections */}
                {room.sections?.map((section: EditorialSection) => (
                    <section className="max-w-2xl space-y-3" key={section._key}>
                        {section.title && (
                            <h2 className="font-heading text-2xl leading-tight text-foreground">
                                {section.title}
                            </h2>
                        )}
                        <div className="space-y-3 text-base leading-7 text-foreground/80">
                            {section.paragraphs?.map((paragraph: string) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                        {section.links?.length ? (
                            <div className="flex flex-wrap gap-3 pt-1">
                                {section.links.map(
                                    (link: {
                                        _key: string
                                        label: string | null
                                        url: string | null
                                    }) =>
                                        link.url ? (
                                            <a
                                                className="inline-flex items-center gap-1.5 font-heading text-sm underline underline-offset-4"
                                                href={link.url}
                                                key={link._key}
                                                rel="noreferrer"
                                                target="_blank"
                                            >
                                                <ExternalLink aria-hidden className="size-3.5" />
                                                {link.label}
                                            </a>
                                        ) : null,
                                )}
                            </div>
                        ) : null}
                    </section>
                ))}

                {/* Tech specs */}
                {hasSpecs && (
                    <section className="space-y-6">
                        <hr className="border-border" />
                        <dl className="max-w-md divide-y divide-border">
                            {room.floor != null && (
                                <div className="flex gap-8 py-3">
                                    <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                                        Etasje
                                    </dt>
                                    <dd className="text-sm text-foreground">
                                        {room.floor}. etasje
                                    </dd>
                                </div>
                            )}
                            {room.capacityStanding != null && (
                                <div className="flex gap-8 py-3">
                                    <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                                        Stående
                                    </dt>
                                    <dd className="flex items-center gap-1.5 text-sm text-foreground">
                                        <Users
                                            aria-hidden
                                            className="size-3.5 text-foreground/40"
                                        />
                                        {room.capacityStanding} personer
                                    </dd>
                                </div>
                            )}
                            {room.capacitySeated != null && (
                                <div className="flex gap-8 py-3">
                                    <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                                        Sittende
                                    </dt>
                                    <dd className="flex items-center gap-1.5 text-sm text-foreground">
                                        <Users
                                            aria-hidden
                                            className="size-3.5 text-foreground/40"
                                        />
                                        {room.capacitySeated} personer
                                    </dd>
                                </div>
                            )}
                            {room.suitedPurposes?.length ? (
                                <div className="flex gap-8 py-3">
                                    <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                                        Passer til
                                    </dt>
                                    <dd className="text-sm text-foreground">
                                        {room.suitedPurposes.join(", ")}
                                    </dd>
                                </div>
                            ) : null}
                            {room.bar != null && (
                                <div className="flex gap-8 py-3">
                                    <dt className="w-36 shrink-0 font-heading text-sm font-medium text-foreground">
                                        Bar
                                    </dt>
                                    <dd className="text-sm text-foreground">
                                        {room.bar ? room.bar : "Nei"}
                                    </dd>
                                </div>
                            )}
                            {room.hasSound != null && (
                                <BoolSpec label="Lyd" value={room.hasSound} />
                            )}
                            {room.hasLighting != null && (
                                <BoolSpec label="Lys" value={room.hasLighting} />
                            )}
                            {room.hasAV != null && <BoolSpec label="A/V" value={room.hasAV} />}
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
                )}

                {/* Opening hours */}
                {hasOpeningHours && (
                    <section className="space-y-4">
                        <h2 className="flex items-center gap-2 font-heading text-lg text-foreground">
                            <Clock aria-hidden className="size-4" />
                            Åpningstider
                        </h2>
                        {room.openingHours?.note && (
                            <p className="text-sm text-foreground/60">{room.openingHours.note}</p>
                        )}
                        <dl className="max-w-xs divide-y divide-border">
                            {room.openingHours?.hours?.map(
                                (
                                    entry: NonNullable<
                                        NonNullable<RoomDetail["openingHours"]>["hours"]
                                    >[number],
                                ) => (
                                    <div
                                        className="flex justify-between py-2 text-sm"
                                        key={entry._key}
                                    >
                                        <dt className="font-heading text-foreground">
                                            {DAY_LABELS[entry.day ?? ""] ?? entry.day}
                                        </dt>
                                        <dd className="text-foreground/70">
                                            {entry.closed
                                                ? "Stengt"
                                                : `${entry.opens ?? "?"} – ${entry.closes ?? "?"}`}
                                        </dd>
                                    </div>
                                ),
                            )}
                        </dl>
                    </section>
                )}
            </div>
        </article>
    )
}
