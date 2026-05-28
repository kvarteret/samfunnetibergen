import { ArrowRight, ExternalLink, Headphones, Music2, Users, UtensilsCrossed } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchRooms, fetchRoomsPageContent } from "@/lib/sanity/fetch"
import type { EditorialSection, RoomSummary, SourcedImage } from "@/lib/sanity/fetch"

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
        title: `${content?.seoTitle ?? content?.title ?? "Booking"} | Samfunnet i Bergen`,
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

const SERVICES = [
    {
        icon: Music2,
        title: "Karaoke",
        description: "Privat rom med mikrofoner, storskjerm og tusenvis av låter. Leies per time.",
        href: "/karaoke",
    },
    {
        icon: Headphones,
        title: "Silent Disco",
        description:
            "Tre kanaler, DJs og lyssetting for en hel fest. Tilgjengelig i Teglverket, Tivoli og Storelogen.",
        href: "/silent-disco",
    },
    {
        icon: UtensilsCrossed,
        title: "Catering",
        description: "Kvarterets kjøkken skreddersyr mat etter ønske – fra tapas til storselskap.",
        href: "/catering",
    },
] as const

function ServicesSection() {
    return (
        <section aria-labelledby="services-heading">
            <h2 className="mb-5 font-heading text-2xl text-foreground" id="services-heading">
                Tillegg og tjenester
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
                {SERVICES.map(({ icon: Icon, title, description, href }) => (
                    <Link
                        className="group flex flex-col gap-4 border-2 border-border bg-card p-5 shadow-shadow transition-transform hover:-translate-y-1"
                        href={href}
                        key={href}
                    >
                        <Icon aria-hidden className="size-6 text-primary" />
                        <div className="space-y-1.5">
                            <h3 className="font-heading text-xl text-foreground">{title}</h3>
                            <p className="text-sm leading-6 text-foreground/70">{description}</p>
                        </div>
                        <span className="mt-auto inline-flex items-center gap-2 font-heading text-sm text-foreground group-hover:underline group-hover:underline-offset-4">
                            Les mer
                            <ArrowRight aria-hidden className="size-4" />
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    )
}

function HowToSection({ section }: { section: EditorialSection }) {
    return (
        <section aria-labelledby="how-to-heading" className="space-y-5">
            <h2 className="font-heading text-2xl text-foreground" id="how-to-heading">
                {section.title}
            </h2>
            <ol className="grid gap-4 sm:grid-cols-3">
                {section.paragraphs?.map((paragraph, i) => (
                    <li className="flex gap-4 border-l-2 border-border pl-4" key={paragraph}>
                        <span className="mt-0.5 shrink-0 font-heading text-sm text-foreground/40">
                            {i + 1}
                        </span>
                        <p className="text-sm leading-6 text-foreground">{paragraph}</p>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export default async function RoomsPage({ params }: RoomsPageProps) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const [content, rooms] = await Promise.all([fetchRoomsPageContent(), fetchRooms()])

    const sections = content?.sections ?? []
    const [howToSection, ...infoSections] = sections

    return (
        <div className="space-y-16">
            <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
                <div className="space-y-5">
                    {content?.eyebrow ? (
                        <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                            {content.eyebrow}
                        </p>
                    ) : null}
                    <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                        {content?.title ?? "Booking"}
                    </h1>
                    {content?.description ? (
                        <p className="max-w-3xl text-xl leading-8 text-foreground">
                            {content.description}
                        </p>
                    ) : null}
                </div>
                {content?.bookingLink ? <BookingButton link={content.bookingLink} /> : null}
            </header>

            {howToSection ? <HowToSection section={howToSection} /> : null}

            <ServicesSection />

            <section
                aria-label="Tilgjengelige rom"
                className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
                {rooms.map(room => {
                    if (!room.slug) return null
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

            {infoSections.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {infoSections.map((section: EditorialSection) => (
                        <div
                            className="space-y-3 border-2 border-border bg-card p-5"
                            key={section._key}
                        >
                            {section.title ? (
                                <h2 className="font-heading text-xl leading-tight text-foreground">
                                    {section.title}
                                </h2>
                            ) : null}
                            <div className="space-y-2 text-sm leading-6 text-foreground/80">
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
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
