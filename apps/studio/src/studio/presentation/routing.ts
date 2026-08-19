const defaultLocale = "nb"
const defaultPreviewPath = `/${defaultLocale}`
const localPreviewOrigin = "http://localhost:3187"
// The canonical production origin is www; keep the apex too so the Studio
// trusts both hosts (the site canonicalizes apex -> www and the Presentation
// iframe reports the host the preview actually resolves to).
const productionPreviewOrigin = "https://www.samfunnetibergen.no"
const productionApexOrigin = "https://samfunnetibergen.no"

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
    (process.env.NODE_ENV === "development"
      ? localPreviewOrigin
      : productionPreviewOrigin)

  return new URL(defaultPreviewPath, siteUrl).toString()
}

export function resolvePresentationOrigins() {
  const configuredOrigins = [
    localPreviewOrigin,
    process.env.SANITY_STUDIO_PREVIEW_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    productionApexOrigin,
    productionPreviewOrigin,
  ]

  return Array.from(
    new Set(
      configuredOrigins
        .filter((origin): origin is string => Boolean(origin))
        .map(origin => new URL(origin).origin),
    ),
  )
}
