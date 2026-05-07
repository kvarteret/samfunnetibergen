import { ExternalLink, Globe, Mail } from "lucide-react"
import { notFound } from "next/navigation"

import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchStudentGroupBySlug, fetchStudentGroupSlugs } from "@/lib/sanity/queries"

export const revalidate = 300

const CATEGORY_LABELS: Record<string, string> = {
    arbeidsgruppe: "Arbeidsgruppe",
    komitee: "Komité",
    dorg: "Fast samarbeidspartner",
    borg: "Brukerorganisasjon",
}

type GroupPageProps = {
    params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
    const [locales, slugs] = await Promise.all([getLocaleStaticParams(), fetchStudentGroupSlugs()])
    return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

export async function generateMetadata({ params }: GroupPageProps) {
    const { slug, locale: localeParam } = await params
    await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    const group = await fetchStudentGroupBySlug(slug, { stega: false })
    if (!group) return {}

    return {
        title: `${group.name} | Grupper | Samfunnet i Bergen`,
        description: group.summary,
    }
}

export default async function GroupPage({ params }: GroupPageProps) {
    const { slug, locale: localeParam } = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    activateRequestLocale(locale)

    const group = await fetchStudentGroupBySlug(slug)
    if (!group) notFound()

    const categoryLabel = group.category ? (CATEGORY_LABELS[group.category] ?? null) : null

    return (
        <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-8">
                <header className="space-y-5">
                    {categoryLabel && (
                        <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                            {categoryLabel}
                        </p>
                    )}
                    <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                        {group.name}
                    </h1>
                    <p className="text-xl leading-8 text-foreground">{group.summary}</p>
                </header>

                {/* Body: portable text rendered as plain paragraphs */}
                {group.body && group.body.length > 0 && (
                    <div className="space-y-4 text-lg leading-8 text-foreground">
                        {group.body.map((block: Record<string, unknown>) => {
                            if (block._type !== "block") return null
                            const children = block.children as
                                | Array<{ _key: string; text?: string }>
                                | undefined
                            const text = children?.map(c => c.text ?? "").join("") ?? ""
                            return text ? <p key={block._key as string}>{text}</p> : null
                        })}
                    </div>
                )}
            </div>

            <aside className="space-y-6">
                {/* Contact */}
                {(group.email || group.website) && (
                    <section className="space-y-3 border-2 border-border bg-card p-5">
                        <h2 className="font-heading text-xl text-foreground">Kontakt</h2>
                        {group.email && (
                            <a
                                className="flex items-center gap-2 underline underline-offset-4"
                                href={`mailto:${group.email}`}
                            >
                                <Mail aria-hidden className="size-4" />
                                {group.email}
                            </a>
                        )}
                        {group.website && (
                            <a
                                className="flex items-center gap-2 underline underline-offset-4"
                                href={group.website}
                                rel="noreferrer"
                                target="_blank"
                            >
                                <Globe aria-hidden className="size-4" />
                                Nettside
                                <ExternalLink aria-hidden className="size-3" />
                            </a>
                        )}
                    </section>
                )}

                {/* Parent group */}
                {group.parentGroup && (
                    <section className="space-y-2 border-2 border-border bg-card p-5">
                        <h2 className="font-heading text-xl text-foreground">Del av</h2>
                        <p className="text-base text-foreground">{group.parentGroup.name}</p>
                    </section>
                )}
            </aside>
        </article>
    )
}
