import { getTranslations } from "next-intl/server"

import { BookingPage } from "@/components/booking/booking-start-page"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { getRoomSummaries } from "@/lib/booking-launch-content"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/booking">) {
    const locale = await resolvePageLocale(params)
    const t = await getTranslations({ locale, namespace: "Metadata" })

    return {
        title: t("bookingPageTitle"),
        description: t("bookingPageDescription"),
    }
}


export default async function BookingPageSite({ params }: PageProps<"/[locale]/booking">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    return <BookingPage rom={getRoomSummaries(locale)} />
}
