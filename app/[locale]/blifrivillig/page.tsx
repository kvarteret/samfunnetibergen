import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { VolunteerSignupPage } from "@/components/volunteer-signup-page"
import { routing, type AppLocale } from "@/i18n/routing"
import { getVolunteerGroupSummaries } from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return routing.locales.map(locale => ({ locale }))
}

export async function generateMetadata({
    params,
}: PageProps<"/[locale]/blifrivillig">) {
    const { locale } = await params
    const t = await getTranslations({
        locale,
        namespace: "Metadata",
    })

    return {
        title: t("volunteerSignupTitle"),
        description: t("volunteerSignupDescription"),
    }
}

export default async function BlifrivilligPage({
    params,
}: PageProps<"/[locale]/blifrivillig">) {
    const { locale } = await params

    if (!hasLocale(routing.locales, locale)) {
        notFound()
    }

    setRequestLocale(locale)

    return <VolunteerSignupPage groups={getVolunteerGroupSummaries(locale as AppLocale)} />
}
