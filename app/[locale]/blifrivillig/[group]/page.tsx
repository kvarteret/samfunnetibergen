import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"
import {
    getLaunchGroupBySlug,
    getLaunchGroups,
} from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return routing.locales.flatMap(locale =>
        getLaunchGroups(locale as AppLocale).map(group => ({
            locale,
            group: group.slug,
        })),
    )
}

export async function generateMetadata({
    params,
}: PageProps<"/[locale]/blifrivillig/[group]">) {
    const { locale, group } = await params

    if (!hasLocale(routing.locales, locale)) {
        notFound()
    }

    const resolvedGroup = getLaunchGroupBySlug(locale as AppLocale, group)
    if (!resolvedGroup) {
        notFound()
    }

    const t = await getTranslations({
        locale,
        namespace: "Metadata",
    })

    return {
        title: t("groupPageTitle", { group: resolvedGroup.name }),
        description: t("groupPageDescription", { group: resolvedGroup.name }),
    }
}

export default async function VolunteerGroupPage({
    params,
}: PageProps<"/[locale]/blifrivillig/[group]">) {
    const { locale, group: groupSlug } = await params

    if (!hasLocale(routing.locales, locale)) {
        notFound()
    }

    setRequestLocale(locale)

    const group = getLaunchGroupBySlug(locale as AppLocale, groupSlug)
    if (!group) {
        notFound()
    }

    const t = await getTranslations({
        locale,
        namespace: "GroupPage",
    })

    return (
        <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto grid max-w-5xl gap-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        className="inline-flex min-h-12 items-center border-2 border-border bg-card px-5 py-2 text-sm font-semibold shadow-shadow"
                        href="/blifrivillig"
                    >
                        {t("backToGroups")}
                    </Link>
                    <Link
                        className="inline-flex min-h-12 items-center border-2 border-border bg-primary px-5 py-2 text-sm font-semibold shadow-shadow"
                        href={`/?group=${group.slug}#registration-form`}
                    >
                        {t("selectInForm", { group: group.name })}
                    </Link>
                </div>

                <header className="grid gap-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-foreground/65">
                        {group.eyebrow}
                    </p>
                    <h1 className="text-5xl leading-none sm:text-6xl">{group.name}</h1>
                    <p className="max-w-4xl text-xl leading-8 text-foreground/85">
                        {group.lead}
                    </p>
                </header>

                <div className="grid gap-5">
                    {group.detailSections.map(section => (
                        <Card className="bg-card" key={section.title}>
                            <CardHeader className="border-b-2 border-border">
                                <CardTitle className="text-2xl">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {section.paragraphs.map(paragraph => (
                                    <p
                                        className="text-base leading-7 text-foreground/80"
                                        key={paragraph}
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}
