import Image from "next/image"
import { notFound } from "next/navigation"
import { PortableText } from "next-sanity"

import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchPageBySlug, fetchPageSlugs } from "@/lib/sanity/queries"

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
    const page = await fetchPageBySlug(slug, { stega: false })
    if (!page) return {}

    return {
        title: `${page.seoTitle ?? page.title} | Samfunnet i Bergen`,
        description: page.seoDescription ?? undefined,
    }
}

export default async function DynamicPage({ params }: PageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const page = await fetchPageBySlug(slug)
    if (!page) notFound()

    return (
        <div className="max-w-4xl space-y-8">
            <PortableText components={portableTextComponents} value={page.content ?? []} />
        </div>
    )
}

const portableTextComponents = {
    types: {
        image: ({ value }: { value: { imageUrl?: string; alt?: string; caption?: string } }) => {
            if (!value.imageUrl) return null

            return (
                <figure className="my-10">
                    <div className="relative aspect-[16/9] overflow-hidden border-2 border-border">
                        <Image
                            alt={value.alt ?? ""}
                            className="object-cover"
                            fill
                            sizes="(max-width: 1280px) 100vw, 1280px"
                            src={value.imageUrl}
                        />
                    </div>
                    {value.caption && (
                        <figcaption className="mt-2 text-sm text-foreground/70">
                            {value.caption}
                        </figcaption>
                    )}
                </figure>
            )
        },
    },
    block: {
        h1: ({ children }: { children?: React.ReactNode }) => (
            <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                {children}
            </h1>
        ),
        h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 className="font-heading text-3xl leading-tight text-foreground">{children}</h2>
        ),
        h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 className="font-heading text-2xl leading-tight text-foreground">{children}</h3>
        ),
        h4: ({ children }: { children?: React.ReactNode }) => (
            <h4 className="font-heading text-xl leading-tight text-foreground">{children}</h4>
        ),
        normal: ({ children }: { children?: React.ReactNode }) => (
            <p className="text-lg leading-8 text-foreground">{children}</p>
        ),
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="border-l-4 border-primary pl-4 text-lg leading-8 italic">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }: { children?: React.ReactNode }) => (
            <ul className="ml-6 list-disc space-y-2 text-lg leading-8 text-foreground">
                {children}
            </ul>
        ),
        number: ({ children }: { children?: React.ReactNode }) => (
            <ol className="ml-6 list-decimal space-y-2 text-lg leading-8 text-foreground">
                {children}
            </ol>
        ),
    },
    listItem: {
        bullet: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
        number: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
    },
    marks: {
        link: ({
            children,
            value,
        }: {
            children?: React.ReactNode
            value?: { href?: string; blank?: boolean }
        }) => {
            if (!value?.href) return children

            return (
                <a
                    className="underline underline-offset-4"
                    href={value.href}
                    rel={value.blank ? "noreferrer" : undefined}
                    target={value.blank ? "_blank" : undefined}
                >
                    {children}
                </a>
            )
        },
    },
}
