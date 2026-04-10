import type { MetadataRoute } from "next"

import { routing, type AppLocale } from "@/i18n/routing"
import { resolveSiteUrl } from "@/lib/site-url"
import { getLaunchGroups } from "@/lib/volunteer-launch-content"

function localizedPath(locale: AppLocale, path = "") {
    return path === "/" ? `/${locale}` : `/${locale}${path}`
}

function localizedAlternates(siteUrl: string, path = "") {
    return Object.fromEntries(
        routing.locales.map(locale => [locale, `${siteUrl}${localizedPath(locale, path)}`]),
    )
}

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = resolveSiteUrl()
    const lastModified = new Date()

    const staticEntries: MetadataRoute.Sitemap = ["/", "/blifrivillig"].flatMap(path =>
        routing.locales.map(locale => ({
            url: `${siteUrl}${localizedPath(locale, path)}`,
            lastModified,
            changeFrequency: path === "/" ? "weekly" : "monthly",
            priority: path === "/" ? 1 : 0.8,
            alternates: {
                languages: localizedAlternates(siteUrl, path),
            },
        })),
    )

    const groupEntries: MetadataRoute.Sitemap = routing.locales.flatMap(locale =>
        getLaunchGroups(locale as AppLocale).map(group => ({
            url: `${siteUrl}${localizedPath(locale as AppLocale, `/blifrivillig/${group.slug}`)}`,
            lastModified,
            changeFrequency: "monthly",
            priority: 0.7,
            alternates: {
                languages: localizedAlternates(siteUrl, `/blifrivillig/${group.slug}`),
            },
        })),
    )

    return [...staticEntries, ...groupEntries]
}
