const defaultLocale = "nb"
const defaultPreviewPath = `/${defaultLocale}`
const localPreviewOrigin = "http://localhost:3187"

export function documentLocation(
  title: string | undefined,
  slug: string | undefined,
  pathPrefix: string,
  fallbackTitle: string,
) {
  if (!slug) {
    return []
  }

  return [
    {
      title: title ?? fallbackTitle,
      href: `/${defaultLocale}/${pathPrefix}/${slug}`,
    },
  ]
}

export function resolvePresentationInitialUrl() {
  const siteUrl =
    process.env.SANITY_STUDIO_PREVIEW_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    localPreviewOrigin

  return new URL(defaultPreviewPath, siteUrl).toString()
}

export function resolvePresentationOrigins() {
  const configuredOrigins = [
    localPreviewOrigin,
    process.env.SANITY_STUDIO_PREVIEW_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://samfunnetibergen.no",
    "https://neste.samfunnetibergen.no",
  ]

  return Array.from(
    new Set(
      configuredOrigins
        .filter((origin): origin is string => Boolean(origin))
        .map(origin => new URL(origin).origin),
    ),
  )
}
