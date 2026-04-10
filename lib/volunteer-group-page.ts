import { notFound } from "next/navigation"

import type { AppLocale } from "@/i18n/routing"
import { getLocaleStaticParams } from "@/lib/app-locale"
import { getLaunchGroupBySlug, getLaunchGroups } from "@/lib/volunteer-launch-content"

export function getVolunteerGroupStaticParams() {
    return getLocaleStaticParams().flatMap(({ locale }) =>
        getLaunchGroups(locale).map(group => ({
            locale,
            group: group.slug,
        })),
    )
}

export function resolveVolunteerGroup(locale: AppLocale, groupSlug: string) {
    const group = getLaunchGroupBySlug(locale, groupSlug)

    if (!group) {
        notFound()
    }

    return group
}
