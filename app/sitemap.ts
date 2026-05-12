import type { MetadataRoute } from "next"
import { getVolunteerGroups } from "@/features/blifrivillig/content"
import { type AppLocale, routing } from "@/i18n/routing"
import { resolveSiteUrl } from "@/lib/site-url"

function localizedPath(locale: AppLocale, path = "") {
    return path === "/" ? `/${locale}` : `/${locale}${path}`
}

function localizedAlternates(siteUrl: string, path = "") {
    return Object.fromEntries(
        routing.locales.map(locale => [locale, `${siteUrl}${localizedPath(locale, path)}`]),
    )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

    const groupsByLocale = await Promise.all(
        routing.locales.map(async locale => ({
            locale: locale as AppLocale,
            groups: await getVolunteerGroups(locale as AppLocale),
        })),
    )

    const groupEntries: MetadataRoute.Sitemap = groupsByLocale.flatMap(({ locale, groups }) =>
        groups.map(group => ({
            url: `${siteUrl}${localizedPath(locale, `/grupper/${group.slug}`)}`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.7,
            alternates: {
                languages: localizedAlternates(siteUrl, `/grupper/${group.slug}`),
            },
        })),
    )

    return [...staticEntries, ...groupEntries]
}
