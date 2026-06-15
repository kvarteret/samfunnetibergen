import type { MetadataRoute } from "next"

export const PUBLIC_STATIC_PATHS = [
  "/",
  "/arrangementer",
  "/grupper",
  "/kontakt",
  "/rom",
  "/sponsorer",
  "/karaoke",
] as const

type SitemapEntryOptions = {
  locales: readonly string[]
  paths: readonly string[]
  siteUrl: string
  lastModified: Date
}

function localizedPath(locale: string, path: string) {
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

export function buildLocalizedSitemapEntries({
  locales,
  paths,
  siteUrl,
  lastModified,
}: SitemapEntryOptions): MetadataRoute.Sitemap {
  return paths.flatMap(path =>
    locales.map(locale => ({
      url: `${siteUrl}${localizedPath(locale, path)}`,
      lastModified,
      changeFrequency:
        path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map(alternateLocale => [
            alternateLocale,
            `${siteUrl}${localizedPath(alternateLocale, path)}`,
          ]),
        ),
      },
    })),
  )
}
