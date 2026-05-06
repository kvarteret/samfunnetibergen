import { ExternalLink, Mail } from "lucide-react"
import { notFound } from "next/navigation"

import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchStudentGroupBySlug, fetchStudentGroupSlugs } from "@/lib/sanity/queries"

export const revalidate = 300

const groupCategoryLabel = (category: string | null | undefined) => {
    if (category === "arbeidsgruppe") {
        return "Arbeidsgruppe"
    }

    if (category === "komitee") {
        return "Komité"
    }

    return null
}

type GroupPageProps = {
    params: Promise<{
        locale: string
        slug: string
    }>
}

export async function generateStaticParams() {
    const [locales, slugs] = await Promise.all([getLocaleStaticParams(), fetchStudentGroupSlugs()])

    return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

export async function generateMetadata({ params }: GroupPageProps) {
    const { slug, locale: localeParam } = await params
    await resolvePageLocale(Promise.resolve({ locale: localeParam }))
    const group = await fetchStudentGroupBySlug(slug)

    if (!group) {
        return {}
    }

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

    if (!group) {
        notFound()
    }

    return (
        <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-8">
                <header className="space-y-5">
                    {groupCategoryLabel(group.category) ? (
                        <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                            {groupCategoryLabel(group.category)}
                        </p>
                    ) : null}
                    <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                        {group.name}
                    </h1>
                    <p className="text-xl leading-8 text-foreground">{group.summary}</p>
                </header>

                <div className="space-y-4 text-lg leading-8 text-foreground">
                    {group.body?.map(paragraph => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
            </div>

            <aside className="space-y-6">
                {group.email ? (
                    <section className="space-y-3 border-2 border-border bg-card p-5">
                        <h2 className="font-heading text-xl text-foreground">Kontakt</h2>
                        <a
                            className="inline-flex items-center gap-2 underline underline-offset-4"
                            href={`mailto:${group.email}`}
                        >
                            <Mail aria-hidden="true" className="size-4" />
                            {group.email}
                        </a>
                    </section>
                ) : null}
                {group.sourceNote ? (
                    <section className="space-y-3 border-2 border-border bg-card p-5">
                        <h2 className="font-heading text-xl text-foreground">Kilde</h2>
                        <p className="text-base leading-7 text-foreground">{group.sourceNote}</p>
                        {group.sourceUrl ? (
                            <a
                                className="inline-flex items-center gap-2 text-base underline underline-offset-4"
                                href={group.sourceUrl}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Les originalen
                                <ExternalLink aria-hidden="true" className="size-4" />
                            </a>
                        ) : null}
                    </section>
                ) : null}
            </aside>
        </article>
    )
}
