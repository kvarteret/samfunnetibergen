import { ExternalLink, Users } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchRoomBySlug, fetchRoomSlugs } from "@/lib/sanity/queries"
import type { SourcedImage } from "@/lib/sanity/types"

export const revalidate = 300

type RoomPageProps = {
    params: Promise<{
        locale: string
        slug: string
    }>
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

    if (!room) {
        return {}
    }

    const title = room.title ?? slug
    const summary = room.summary ?? undefined
    const firstImageUrl = imageUrl(room.images?.[0]) ?? undefined

    return {
        title: `${title} | Rom | Samfunnet i Bergen`,
        description: summary,
        openGraph: {
            title,
            description: summary,
            images: firstImageUrl ? [{ url: firstImageUrl }] : undefined,
        },
    }
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const room = await fetchRoomBySlug(slug)

    if (!room) {
        notFound()
    }

    const heroImage = room.images?.[0]
    const heroImageUrl = imageUrl(heroImage) ?? undefined
    const title = room.title ?? slug
    const summary = room.summary ?? ""
    const sourceUrl = room.sourceUrl ?? "https://kvarteret.no/booking/"

    return (
        <article className="space-y-12">
            <header className="grid gap-6 lg:grid-cols-[minmax(20rem,0.45fr)_minmax(0,1fr)]">
                <div className="flex flex-col justify-between gap-6">
                    <div className="space-y-5">
                        <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                            Rom
                        </p>
                        <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                            {title}
                        </h1>
                        <p className="text-xl leading-8 text-foreground">{summary}</p>
                    </div>
                    <dl className="grid gap-4 text-base text-foreground">
                        {room.capacity ? (
                            <div className="flex items-center gap-2">
                                <Users aria-hidden="true" className="size-5" />
                                <dt className="font-heading">Kapasitet</dt>
                                <dd>{room.capacity}</dd>
                            </div>
                        ) : null}
                        {room.floor ? (
                            <div>
                                <dt className="font-heading">Etasje</dt>
                                <dd>{room.floor}</dd>
                            </div>
                        ) : null}
                        {room.suitedPurposes?.length ? (
                            <div>
                                <dt className="font-heading">Passer til</dt>
                                <dd>{room.suitedPurposes.join(", ")}</dd>
                            </div>
                        ) : null}
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

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-8">
                    {room.sections?.map(section => (
                        <section className="space-y-3" key={section._key}>
                            {section.title ? (
                                <h2 className="font-heading text-3xl leading-tight text-foreground">
                                    {section.title}
                                </h2>
                            ) : null}
                            <div className="space-y-3 text-lg leading-8 text-foreground">
                                {section.paragraphs?.map(paragraph => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                            {section.links?.length ? (
                                <div className="flex flex-wrap gap-3 pt-1">
                                    {section.links.map(link =>
                                        link.url ? (
                                            <Button asChild key={link._key} variant="neutral">
                                                <a href={link.url} rel="noreferrer" target="_blank">
                                                    <ExternalLink aria-hidden="true" />
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
                <aside className="space-y-3">
                    <h2 className="font-heading text-xl text-foreground">Kilde</h2>
                    <a
                        className="inline-flex items-center gap-2 text-base underline underline-offset-4"
                        href={sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                    >
                        Kvarteret.no
                        <ExternalLink aria-hidden="true" className="size-4" />
                    </a>
                </aside>
            </div>

            {room.images && room.images.length > 1 ? (
                <section className="grid gap-4 md:grid-cols-2">
                    {room.images.slice(1).map(image => {
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
                                {image.caption ? (
                                    <figcaption className="p-3 text-sm text-foreground">
                                        {image.caption}
                                    </figcaption>
                                ) : null}
                            </figure>
                        ) : null
                    })}
                </section>
            ) : null}
        </article>
    )
}
