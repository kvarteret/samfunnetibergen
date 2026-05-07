import { Check, Clock, ExternalLink, Music, Tv, Users, X } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
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
    const room = await fetchRoomBySlug(slug)
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

function TechSpec({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
            <dt className="w-32 shrink-0 font-heading text-sm text-foreground/70">{label}</dt>
            <dd className="text-sm text-foreground">{value}</dd>
        </div>
    )
}

function BoolSpec({ label, value }: { label: string; value: boolean | null | undefined }) {
    return (
        <TechSpec
            label={label}
            value={
                value ? (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                        <Check aria-hidden className="size-4" /> Ja
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-foreground/50">
                        <X aria-hidden className="size-4" /> Nei
                    </span>
                )
            }
        />
    )
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

export default async function RoomPage({ params }: RoomPageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const room = await fetchRoomBySlug(slug)
    if (!room) notFound()

    const heroImage = room.images?.[0]
    const heroImageUrl = imageUrl(heroImage) ?? undefined
    const title = room.title ?? slug

    const hasSpecs =
        room.floor != null ||
        room.capacityStanding != null ||
        room.capacitySeated != null ||
        room.bar != null ||
        room.hasSound != null ||
        room.hasLighting != null ||
        room.hasAV != null

    const hasOpeningHours = (room.openingHours?.hours?.length ?? 0) > 0

    return (
        <article className="space-y-12">
            {/* Header */}
            <header className="grid gap-6 lg:grid-cols-[minmax(20rem,0.45fr)_minmax(0,1fr)]">
                <div className="flex flex-col justify-between gap-6">
                    <div className="space-y-5">
                        <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                            Rom
                        </p>
                        <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                            {title}
                        </h1>
                        <p className="text-xl leading-8 text-foreground">{room.summary}</p>
                    </div>

                    {/* Quick stats */}
                    <dl className="grid gap-2 text-base text-foreground">
                        {room.capacityStanding != null && (
                            <div className="flex items-center gap-2">
                                <Users aria-hidden className="size-5" />
                                <dt className="font-heading">Stående</dt>
                                <dd>{room.capacityStanding}</dd>
                            </div>
                        )}
                        {room.capacitySeated != null && (
                            <div className="flex items-center gap-2">
                                <Users aria-hidden className="size-5" />
                                <dt className="font-heading">Sittende</dt>
                                <dd>{room.capacitySeated}</dd>
                            </div>
                        )}
                        {room.floor != null && (
                            <div className="flex items-center gap-2">
                                <dt className="font-heading">Etasje</dt>
                                <dd>{room.floor}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="border-2 border-border bg-muted shadow-shadow">
                    {heroImageUrl ? (
                        <div className="relative aspect-[16/10] max-h-[32rem]">
                            <Image
                                alt={heroImage?.alt || title}
                                className="object-cover"
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 60vw"
                                src={heroImageUrl}
                            />
                        </div>
                    ) : (
                        <div className="flex aspect-[16/10] items-center justify-center p-8 text-center font-heading text-4xl text-foreground/50">
                            {title}
                        </div>
                    )}
                </div>
            </header>

            {/* Body + sidebar */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
                {/* Sections */}
                <div className="space-y-8">
                    {room.sections?.map((section: EditorialSection) => (
                        <section className="space-y-3" key={section._key}>
                            {section.title && (
                                <h2 className="font-heading text-3xl leading-tight text-foreground">
                                    {section.title}
                                </h2>
                            )}
                            <div className="space-y-3 text-lg leading-8 text-foreground">
                                {section.paragraphs?.map((paragraph: string) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                            {section.links?.length ? (
                                <div className="flex flex-wrap gap-3 pt-1">
                                    {section.links.map((link: { _key: string; label: string | null; url: string | null }) =>
                                        link.url ? (
                                            <Button asChild key={link._key} variant="neutral">
                                                <a href={link.url} rel="noreferrer" target="_blank">
                                                    <ExternalLink aria-hidden className="size-4" />
                                                    {link.label}
                                                </a>
                                            </Button>
                                        ) : null,
                                    )}
                                </div>
                            ) : null}
                        </section>
                    ))}
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    {/* Tech specs */}
                    {hasSpecs && (
                        <section className="space-y-1 border-2 border-border bg-card p-5">
                            <h2 className="mb-3 font-heading text-xl text-foreground">
                                Tekniske specs
                            </h2>
                            <dl>
                                {room.floor != null && (
                                    <TechSpec label="Etasje" value={room.floor} />
                                )}
                                {room.capacityStanding != null && (
                                    <TechSpec label="Stående" value={room.capacityStanding} />
                                )}
                                {room.capacitySeated != null && (
                                    <TechSpec label="Sittende" value={room.capacitySeated} />
                                )}
                                {room.suitedPurposes?.length ? (
                                    <TechSpec
                                        label="Bruk"
                                        value={room.suitedPurposes.join(", ")}
                                    />
                                ) : null}
                                {room.bar != null && (
                                    <TechSpec label="Bar" value={room.bar || "Nei"} />
                                )}
                                <BoolSpec label="Lyd" value={room.hasSound} />
                                <BoolSpec label="Lys" value={room.hasLighting} />
                                <BoolSpec label="A/V" value={room.hasAV} />
                            </dl>
                        </section>
                    )}

                    {/* Opening hours */}
                    {hasOpeningHours && (
                        <section className="space-y-3 border-2 border-border bg-card p-5">
                            <h2 className="flex items-center gap-2 font-heading text-xl text-foreground">
                                <Clock aria-hidden className="size-5" />
                                Åpningstider
                            </h2>
                            {room.openingHours?.note && (
                                <p className="text-sm text-foreground/70">
                                    {room.openingHours.note}
                                </p>
                            )}
                            <dl className="space-y-1">
                                {room.openingHours?.hours?.map((entry: NonNullable<NonNullable<RoomDetail["openingHours"]>["hours"]>[number]) => (
                                    <div
                                        className="flex justify-between text-sm text-foreground"
                                        key={entry._key}
                                    >
                                        <dt className="font-heading">
                                            {DAY_LABELS[entry.day ?? ""] ?? entry.day}
                                        </dt>
                                        <dd>
                                            {entry.closed
                                                ? "Stengt"
                                                : `${entry.opens ?? "?"} – ${entry.closes ?? "?"}`}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}
                </aside>
            </div>

            {/* Image gallery */}
            {room.images && room.images.length > 1 && (
                <section className="grid gap-4 md:grid-cols-2">
                    {room.images.slice(1).map((image: SourcedImage) => {
                        const src = imageUrl(image)
                        return src ? (
                            <figure className="border-2 border-border bg-muted" key={image._key}>
                                <div className="relative aspect-[16/10]">
                                    <Image
                                        alt={image.alt || title}
                                        className="object-cover"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        src={src}
                                    />
                                </div>
                                {image.caption && (
                                    <figcaption className="p-3 text-sm text-foreground">
                                        {image.caption}
                                    </figcaption>
                                )}
                            </figure>
                        ) : null
                    })}
                </section>
            )}
        </article>
    )
}
