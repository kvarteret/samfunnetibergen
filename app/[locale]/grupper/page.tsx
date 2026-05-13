import { ArrowRight, Mail } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchGroupsPageContent, fetchStudentGroups } from "@/lib/sanity/fetch"
import type { EditorialSection, GroupsPageContent, StudentGroupSummary } from "@/lib/sanity/types"

export const revalidate = 300

type GroupCategory = NonNullable<StudentGroupSummary["category"]>

type GroupSection = {
    title: string
    categories: GroupCategory[]
}

const GROUP_SECTIONS: GroupSection[] = [
    {
        title: "Arbeidsgrupper & Komiteer",
        categories: ["arbeidsgruppe", "komitee"],
    },
    {
        title: "Driftsorganisasjoner",
        categories: ["dorg"],
    },
    {
        title: "Brukerorganisasjoner",
        categories: ["borg"],
    },
]

const groupCategoryPrefix = (category: string | null | undefined) => {
    if (category === "dorg") return "Dorg"
    if (category === "borg") return "Borg"
    return "Arg"
}

const groupCategories = new Set<string>(GROUP_SECTIONS.flatMap(section => section.categories))

const groupBySection = (groups: StudentGroupSummary[]) =>
    GROUP_SECTIONS.map(section => ({
        ...section,
        groups: groups.filter(group => group.category && section.categories.includes(group.category)),
    })).filter(section => section.groups.length > 0)

const uncategorizedGroups = (groups: StudentGroupSummary[]) =>
    groups.filter(group => !group.category || !groupCategories.has(group.category))

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

            <div className="space-y-12">
                {[...groupBySection(groups), { title: "Andre grupper", groups: uncategorizedGroups(groups) }]
                    .filter(section => section.groups.length > 0)
                    .map(section => (
                        <section className="space-y-5" key={section.title}>
                            <h2 className="font-heading text-4xl leading-none text-foreground">
                                {section.title}
                            </h2>
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {section.groups.map(group => (
                                    <Link
                                        className="group flex min-h-full flex-col gap-4 border-2 border-border bg-card p-5 shadow-shadow transition-transform hover:-translate-y-1"
                                        href={`/grupper/${group.slug}`}
                                        key={group.slug}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <h3 className="wrap-break-word font-heading text-3xl leading-none text-foreground">
                                                    {group.name}
                                                </h3>
                                                <span className="shrink-0 bg-secondary-background px-2 py-1 font-heading text-xs uppercase text-foreground">
                                                    {groupCategoryPrefix(group.category)}
                                                </span>
                                            </div>
                                            <p className="line-clamp-4 text-base leading-7 text-foreground">
                                                {group.summary}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex flex-col gap-3 text-sm text-foreground">
                                            {group.subGroups?.length ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {group.subGroups.map(subGroup => (
                                                        <span
                                                            className="border-2 border-border bg-background px-2 py-1 font-heading text-xs text-foreground"
                                                            key={subGroup.slug ?? subGroup.name}
                                                        >
                                                            {subGroup.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
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
                            </div>
                        </section>
                    ))}
            </div>

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
