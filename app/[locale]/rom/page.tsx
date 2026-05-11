import { ArrowRight, ExternalLink, Users } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchRooms, fetchRoomsPageContent } from "@/lib/sanity/queries"
import type { EditorialSection, RoomSummary, SourcedImage } from "@/lib/sanity/types"

export const revalidate = 300

export function generateStaticParams() {
    return getLocaleStaticParams()
}

type RoomsPageProps = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: RoomsPageProps) {
    await resolvePageLocale(params)
    const content = await fetchRoomsPageContent({ stega: false })

    return {
        title: `${content?.seoTitle ?? content?.title ?? "Rom"} | Samfunnet i Bergen`,
        description:
            content?.seoDescription ??
            content?.description ??
            "Se rommene på Det Akademiske Kvarter.",
    }
}

const imageUrl = (image: SourcedImage | null | undefined) => image?.assetUrl
type ContentLink = {
    _key?: string | null
    label?: string | null
    href?: string | null
}

function isExternalHref(href: string) {
    return !href.startsWith("/")
}

function InlineContentLink({ link }: { link: ContentLink }) {
    if (!link.href) return null

    const className =
        "inline-flex items-center gap-2 font-heading text-sm underline underline-offset-4"

    return isExternalHref(link.href) ? (
        <a className={className} href={link.href} rel="noreferrer" target="_blank">
            {link.label}
            <ExternalLink aria-hidden="true" className="size-4" />
        </a>
    ) : (
        <Link className={className} href={link.href}>
            {link.label}
        </Link>
    )
}

function BookingButton({ link }: { link: ContentLink }) {
    if (!link.href) return null

    return (
        <Button asChild className="w-fit lg:justify-self-end" size="lg">
            {isExternalHref(link.href) ? (
                <a href={link.href} rel="noreferrer" target="_blank">
                    <ExternalLink aria-hidden="true" />
                    {link.label}
                </a>
            ) : (
                <Link href={link.href}>
                    <ArrowRight aria-hidden="true" />
                    {link.label}
                </Link>
            )}
        </Button>
    )
}

function RoomImage({ image, title }: { image: RoomSummary["image"]; title: string }) {
    const src = imageUrl(image)

    if (!src) {
        return (
            <div className="flex aspect-[16/10] items-center justify-center bg-muted p-6 text-center font-heading text-2xl text-foreground/50">
                {title}
            </div>
        )
    }

    return (
        <div className="relative aspect-[16/10] overflow-hidden">
            <Image
                alt={image?.alt || title}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                src={src}
            />
        </div>
    )
}

export default async function RoomsPage({ params }: RoomsPageProps) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const [content, rooms] = await Promise.all([fetchRoomsPageContent(), fetchRooms()])

    return (
        <div className="space-y-12">
            <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
                <div className="space-y-5">
                    {content?.eyebrow ? (
                        <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                            {content.eyebrow}
                        </p>
                    ) : null}
                    <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                        {content?.title ?? "Rom"}
                    </h1>
                    {content?.description ? (
                        <p className="max-w-3xl text-xl leading-8 text-foreground">
                            {content.description}
                        </p>
                    ) : null}
                </div>
                {content?.bookingLink ? <BookingButton link={content.bookingLink} /> : null}
            </header>

            {content?.sections?.length ? (
                <section className="grid gap-6 md:grid-cols-2">
                    {content.sections.map((section: EditorialSection) => (
                        <article
                            className="space-y-3 border-2 border-border bg-card p-5"
                            key={section._key}
                        >
                            {section.title ? (
                                <h2 className="font-heading text-2xl leading-tight text-foreground">
                                    {section.title}
                                </h2>
                            ) : null}
                            <div className="space-y-3 text-base leading-7 text-foreground">
                                {section.paragraphs?.map((paragraph: string) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                            {section.links?.length ? (
                                <div className="flex flex-wrap gap-3">
                                    {section.links.map(
                                        (link: NonNullable<EditorialSection["links"]>[number]) => (
                                            <InlineContentLink key={link._key} link={link} />
                                        ),
                                    )}
                                </div>
                            ) : null}
                        </article>
                    ))}
                </section>
            ) : null}

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map(room => {
                    if (!room.slug) {
                        return null
                    }

                    const title = room.title ?? room.slug

                    return (
                        <Link
                            className="group flex min-h-full flex-col overflow-hidden border-2 border-border bg-card shadow-shadow transition-transform hover:-translate-y-1"
                            href={`/rom/${room.slug}`}
                            key={room.slug}
                        >
                            <RoomImage image={room.image} title={title} />
                            <div className="flex flex-1 flex-col gap-4 p-5">
                                <div className="space-y-2">
                                    <h2 className="font-heading text-3xl leading-none text-foreground">
                                        {title}
                                    </h2>
                                    {room.summary ? (
                                        <p className="line-clamp-3 text-base leading-7 text-foreground">
                                            {room.summary}
                                        </p>
                                    ) : null}
                                </div>
                                <dl className="mt-auto grid gap-3 text-sm text-foreground">
                                    {room.capacityStanding != null ||
                                    room.capacitySeated != null ? (
                                        <div className="flex items-center gap-2">
                                            <Users aria-hidden="true" className="size-4" />
                                            <dt className="font-heading">Kapasitet</dt>
                                            <dd>
                                                {[
                                                    room.capacityStanding != null &&
                                                        `${room.capacityStanding} stående`,
                                                    room.capacitySeated != null &&
                                                        `${room.capacitySeated} sittende`,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" / ")}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {room.suitedPurposes?.length ? (
                                        <div className="space-y-1">
                                            <dt className="font-heading">Passer til</dt>
                                            <dd>{room.suitedPurposes.join(", ")}</dd>
                                        </div>
                                    ) : null}
                                </dl>
                                <span className="inline-flex items-center gap-2 font-heading text-sm text-foreground group-hover:underline group-hover:underline-offset-4">
                                    Les mer
                                    <ArrowRight aria-hidden="true" className="size-4" />
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </section>
        </div>
    )
}
