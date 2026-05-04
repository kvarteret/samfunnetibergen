import { getTranslations } from "next-intl/server"

import { VolunteerSignupPage } from "@/components/volunteer-signup-page"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { getVolunteerGroupSummaries } from "@/lib/volunteer-launch-content"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    const t = await getTranslations({ locale, namespace: "Metadata" })

    return {
        title: t("volunteerSignupTitle"),
        description: t("volunteerSignupDescription"),
    }
}

export default async function BlifrivilligPage({ params }: PageProps<"/[locale]/blifrivillig">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    return <VolunteerSignupPage groups={await getVolunteerGroupSummaries(locale)} />
}
