import { getTranslations } from "next-intl/server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { fetchSiteMetadata } from "@/lib/sanity/queries"
import { getVolunteerGroupStaticParams, resolveVolunteerGroup } from "@/lib/volunteer-group-page"

export function generateStaticParams() {
    return getVolunteerGroupStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blifrivillig/[group]">) {
    const resolvedParams = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: resolvedParams.locale }))
    const { group } = resolvedParams
    const resolvedGroup = await resolveVolunteerGroup(locale, group)
    const [t, siteMetadata] = await Promise.all([
        getTranslations({ locale, namespace: "Metadata" }),
        fetchSiteMetadata(locale),
    ])

    return {
        title:
            siteMetadata?.groupPageTitle?.replaceAll("{group}", resolvedGroup.name) ??
            t("groupPageTitle", { group: resolvedGroup.name }),
        description:
            siteMetadata?.groupPageDescription?.replaceAll("{group}", resolvedGroup.name) ??
            t("groupPageDescription", { group: resolvedGroup.name }),
    }
}

export default async function VolunteerGroupPage({
    params,
}: PageProps<"/[locale]/blifrivillig/[group]">) {
    const resolvedParams = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: resolvedParams.locale }))
    const { group: groupSlug } = resolvedParams
    activateRequestLocale(locale)
    const group = await resolveVolunteerGroup(locale, groupSlug)
    const t = await getTranslations({ locale, namespace: "GroupPage" })

    return (
        <div className="flex w-full max-w-5xl flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    className="inline-flex min-h-12 items-center border-2 border-border bg-card px-5 py-2 text-sm font-semibold shadow-shadow"
                    href="/"
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

            <header className="flex flex-col gap-4">
                <p className="text-xs uppercase tracking-[0.28em] text-foreground/65">
                    {group.eyebrow}
                </p>
                <h1 className="text-5xl leading-none sm:text-6xl">{group.name}</h1>
                <p className="max-w-4xl text-xl leading-8 text-foreground/85">{group.lead}</p>
            </header>

            <div className="flex flex-col gap-5">
                {group.detailSections.map(section => (
                    <Card className="bg-card" key={section.title}>
                        <CardHeader className="border-b-2 border-border">
                            <CardTitle className="text-2xl">{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
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
    )
}
