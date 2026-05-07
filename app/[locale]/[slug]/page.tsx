import Image from "next/image"
import { notFound } from "next/navigation"
import { stegaClean } from "next-sanity"

import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchPageBySlug, fetchPageSlugs } from "@/lib/sanity/queries"
import type { PageBlock } from "@/lib/sanity/types"

export const revalidate = 300

type PageProps = {
    params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
    const [locales, slugs] = await Promise.all([getLocaleStaticParams(), fetchPageSlugs()])
    return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

export async function generateMetadata({ params }: PageProps) {
    const { slug, locale: localeParam } = await params
    await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    const page = await fetchPageBySlug(slug)
    if (!page) return {}

    return {
        title: `${page.seoTitle ?? page.title} | Samfunnet i Bergen`,
        description: page.seoDescription ?? undefined,
    }
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function HeroBlock({ block }: { block: Extract<PageBlock, { _type: "heroBlock" }> }) {
    return (
        <section className="space-y-6">
            {block.eyebrow && (
                <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                    {block.eyebrow}
                </p>
            )}
            <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                {block.title}
            </h1>
            {block.lead && (
                <p className="max-w-3xl text-xl leading-8 text-foreground">{block.lead}</p>
            )}
            {block.imageUrl && (
                <div className="relative aspect-[21/9] overflow-hidden border-2 border-border">
                    <Image
                        alt={block.title ?? ""}
                        className="object-cover"
                        fill
                        priority
                        sizes="100vw"
                        src={block.imageUrl}
                    />
                </div>
            )}
            {block.cta?.url && (
                <a
                    className="inline-flex items-center gap-2 border-2 border-border bg-primary px-5 py-3 font-heading text-sm text-primary-foreground hover:opacity-90"
                    href={block.cta.url}
                    rel="noreferrer"
                    target="_blank"
                >
                    {block.cta.label}
                </a>
            )}
        </section>
    )
}

function RichTextBlock({ block }: { block: Extract<PageBlock, { _type: "richTextBlock" }> }) {
    const cols = stegaClean(block.columns) === "2" ? "md:columns-2" : ""

    return (
        <section className="space-y-4">
            {block.title && (
                <h2 className="font-heading text-3xl leading-tight text-foreground">{block.title}</h2>
            )}
            <div className={`space-y-4 text-lg leading-8 text-foreground ${cols}`}>
                {block.content?.map((node: Record<string, unknown>) => {
                    if (node._type !== "block") return null
                    const children = node.children as Array<{ _key: string; text?: string; marks?: string[] }> | undefined
                    const text = children?.map(c => c.text ?? "").join("") ?? ""
                    if (!text) return null

                    const style = node.style as string | undefined
                    if (style === "h2")
                        return (
                            <h2 className="font-heading text-2xl" key={node._key as string}>
                                {text}
                            </h2>
                        )
                    if (style === "h3")
                        return (
                            <h3 className="font-heading text-xl" key={node._key as string}>
                                {text}
                            </h3>
                        )
                    if (style === "blockquote")
                        return (
                            <blockquote
                                className="border-l-4 border-primary pl-4 italic"
                                key={node._key as string}
                            >
                                {text}
                            </blockquote>
                        )
                    return <p key={node._key as string}>{text}</p>
                })}
            </div>
        </section>
    )
}

function ImageBlock({ block }: { block: Extract<PageBlock, { _type: "imageBlock" }> }) {
    if (!block.imageUrl) return null
    const full = stegaClean(block.size) === "full"

    return (
        <figure className={full ? "-mx-6 sm:-mx-10 lg:-mx-14" : ""}>
            <div className="relative aspect-[16/9] overflow-hidden border-2 border-border">
                <Image
                    alt={block.alt ?? ""}
                    className="object-cover"
                    fill
                    sizes={full ? "100vw" : "(max-width: 1280px) 100vw, 1280px"}
                    src={block.imageUrl}
                />
            </div>
            {block.caption && (
                <figcaption className="mt-2 text-sm text-foreground/70">{block.caption}</figcaption>
            )}
        </figure>
    )
}

function CalloutBlock({ block }: { block: Extract<PageBlock, { _type: "calloutBlock" }> }) {
    return (
        <aside className="space-y-3 border-2 border-border bg-card p-5">
            {block.title && (
                <h2 className="font-heading text-xl text-foreground">{block.title}</h2>
            )}
            <div className="space-y-3 text-base leading-7 text-foreground">
                {block.content?.map((node: Record<string, unknown>) => {
                    if (node._type !== "block") return null
                    const children = node.children as Array<{ _key: string; text?: string }> | undefined
                    const text = children?.map(c => c.text ?? "").join("") ?? ""
                    return text ? <p key={node._key as string}>{text}</p> : null
                })}
            </div>
            {block.links?.length ? (
                <div className="flex flex-wrap gap-3">
                    {block.links.map((link: { _key: string; label: string | null; url: string | null }) =>
                        link.url ? (
                            <a
                                className="font-heading text-sm underline underline-offset-4"
                                href={link.url}
                                key={link._key}
                                rel="noreferrer"
                                target="_blank"
                            >
                                {link.label}
                            </a>
                        ) : null,
                    )}
                </div>
            ) : null}
        </aside>
    )
}

function PageBlock({ block }: { block: PageBlock }) {
    switch (block._type) {
        case "heroBlock":
            return <HeroBlock block={block} />
        case "richTextBlock":
            return <RichTextBlock block={block} />
        case "imageBlock":
            return <ImageBlock block={block} />
        case "calloutBlock":
            return <CalloutBlock block={block} />
        default:
            return null
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DynamicPage({ params }: PageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const page = await fetchPageBySlug(slug)
    if (!page) notFound()

    return (
        <div className="space-y-16">
            {page.pageBuilder?.map((block: PageBlock) => (
                <PageBlock block={block} key={block._key} />
            ))}
        </div>
    )
}
