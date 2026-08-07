import type { MetadataRoute } from "next"

export const PUBLIC_STATIC_PATHS = [
  "/",
  "/arrangementer",
  "/bli-frivillig",
  "/kontakt",
  "/nyttig",
  "/rom",
  "/rom/book",
  "/sponsorer",
  "/karaoke",
] as const

export const SITEMAP_EXCLUDED_PATHS = new Set([
  "/blifrivillig",
  "/grupper",
  "/tilgjengelighet",
])

type SitemapEntryOptions = {
  locales: readonly string[]
  paths: readonly string[]
  siteUrl: string
}

function localizedPath(locale: string, path: string) {
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

export function buildLocalizedSitemapEntries({
  locales,
  paths,
  siteUrl,
}: SitemapEntryOptions): MetadataRoute.Sitemap {
  return paths.flatMap(path =>
    locales.map(locale => ({
      url: `${siteUrl}${localizedPath(locale, path)}`,
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

export function filterSitemapDynamicPaths(paths: readonly string[]) {
  return paths.filter(path => !SITEMAP_EXCLUDED_PATHS.has(path))
}
