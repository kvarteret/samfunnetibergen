import { getTranslations } from "next-intl/server"

import { VolunteerSignupPage } from "@/components/volunteer-signup-page"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchSiteMetadata } from "@/lib/sanity/queries"
import { getVolunteerGroupSummaries } from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    const [t, siteMetadata] = await Promise.all([
        getTranslations({ locale, namespace: "Metadata" }),
        fetchSiteMetadata(locale),
    ])

    return {
        title: siteMetadata?.volunteerSignupTitle ?? t("volunteerSignupTitle"),
        description: siteMetadata?.volunteerSignupDescription ?? t("volunteerSignupDescription"),
    }
}

export default async function BlifrivilligPage({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    return <VolunteerSignupPage groups={await getVolunteerGroupSummaries(locale)} />
}
