import type { MetadataRoute } from "next"
import { type AppLocale, routing } from "@/i18n/routing"
import { fetchStudentGroupSlugs } from "@/lib/sanity/fetch"
import { resolveSiteUrl } from "@/lib/site-url"

function localizedPath(locale: AppLocale, path = "") {
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

function localizedAlternates(siteUrl: string, path = "") {
  return Object.fromEntries(
    routing.locales.map(locale => [
      locale,
      `${siteUrl}${localizedPath(locale, path)}`,
    ]),
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl()
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = ["/"].flatMap(path =>
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
      slugs: await fetchStudentGroupSlugs(),
    })),
  )

  const groupEntries: MetadataRoute.Sitemap = groupsByLocale.flatMap(
    ({ locale, slugs }) =>
      slugs.map(slug => {
        const groupPath = `/grupper/${slug}`
        return {
          url: `${siteUrl}${localizedPath(locale, groupPath)}`,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates: {
            languages: localizedAlternates(siteUrl, groupPath),
          },
        }
      }),
  )

  return [...staticEntries, ...groupEntries]
}
