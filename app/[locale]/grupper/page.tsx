import { ArrowRight, Mail } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchGroupsPageContent, fetchStudentGroups } from "@/lib/sanity/queries"
import type { EditorialSection, GroupsPageContent } from "@/lib/sanity/types"

export const revalidate = 300

const groupCategoryLabel = (category: string | null | undefined) => {
    if (category === "arbeidsgruppe") {
        return "Arbeidsgruppe"
    }

    if (category === "komitee") {
        return "Komité"
    }

    return "Gruppe"
}

export function generateStaticParams() {
    return getLocaleStaticParams()
}

type GroupsPageProps = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: GroupsPageProps) {
    await resolvePageLocale(params)
    const content = await fetchGroupsPageContent({ stega: false })

    return {
        title: `${content?.seoTitle ?? content?.title ?? "Grupper"} | Samfunnet i Bergen`,
        description: content?.seoDescription ?? content?.description ?? "Se gruppene i Samfunnet.",
    }
}

export default async function GroupsPage({ params }: GroupsPageProps) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const [content, groups] = await Promise.all([fetchGroupsPageContent(), fetchStudentGroups()])

    return (
        <div className="space-y-12">
            <header className="space-y-5">
                {content?.eyebrow ? (
                    <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
                        {content.eyebrow}
                    </p>
                ) : null}
                <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
                    {content?.title ?? "Grupper"}
                </h1>
                {content?.description ? (
                    <p className="max-w-3xl text-xl leading-8 text-foreground">
                        {content.description}
                    </p>
                ) : null}
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
                        </article>
                    ))}
                </section>
            ) : null}

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {groups.map(group => (
                    <Link
                        className="group flex min-h-full flex-col gap-4 border-2 border-border bg-card p-5 shadow-shadow transition-transform hover:-translate-y-1"
                        href={`/grupper/${group.slug}`}
                        key={group.slug}
                    >
                        <div className="space-y-2">
                            <p className="w-fit bg-secondary-background px-2 py-1 font-heading text-xs uppercase text-foreground">
                                {groupCategoryLabel(group.category)}
                            </p>
                            <h2 className="font-heading text-3xl leading-none text-foreground">
                                {group.name}
                            </h2>
                            <p className="line-clamp-4 text-base leading-7 text-foreground">
                                {group.summary}
                            </p>
                        </div>
                        <div className="mt-auto flex flex-col gap-3 text-sm text-foreground">
                            {group.email ? (
                                <span className="inline-flex items-center gap-2">
                                    <Mail aria-hidden="true" className="size-4" />
                                    {group.email}
                                </span>
                            ) : null}
                            <span className="inline-flex items-center gap-2 font-heading group-hover:underline group-hover:underline-offset-4">
                                Les mer
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </span>
                        </div>
                    </Link>
                ))}
            </section>

            {content?.faq?.length ? (
                <section className="space-y-5">
                    <h2 className="font-heading text-4xl leading-none text-foreground">FAQ</h2>
                    <div className="grid gap-4">
                        {content.faq.map((item: NonNullable<GroupsPageContent["faq"]>[number]) => (
                            <details className="border-2 border-border bg-card p-5" key={item._key}>
                                <summary className="cursor-pointer font-heading text-xl text-foreground">
                                    {item.question}
                                </summary>
                                <div className="mt-3 space-y-3 text-base leading-7 text-foreground">
                                    {item.answer?.map((paragraph: string) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    )
}
