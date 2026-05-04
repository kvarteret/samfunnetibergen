import { notFound } from "next/navigation"

import type { AppLocale } from "@/i18n/routing"
import { getLocaleStaticParams } from "@/lib/app-locale"
import { getLaunchGroupBySlug, getLaunchGroups } from "@/lib/volunteer-launch-content"

export async function getVolunteerGroupStaticParams() {
    const localeParams = getLocaleStaticParams()
    const results = await Promise.all(
        localeParams.map(async ({ locale }) => {
            const groups = await getLaunchGroups(locale as AppLocale)
            return groups.map(group => ({ locale, group: group.slug }))
        }),
    )
    return results.flat()
}

export async function resolveVolunteerGroup(locale: AppLocale, groupSlug: string) {
    const group = await getLaunchGroupBySlug(locale, groupSlug)

    if (!group) {
        notFound()
    }

    return group
}
