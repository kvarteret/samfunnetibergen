const CANONICAL_PRODUCTION_ORIGIN = "https://www.samfunnetibergen.no"

export function resolveSiteUrl() {
  const configuredSiteUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3187"

  const normalizedSiteUrl = configuredSiteUrl.startsWith("http")
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`

  const hostname = new URL(normalizedSiteUrl).hostname

  if (
    hostname === "samfunnetibergen.no" ||
    hostname === "www.samfunnetibergen.no"
  ) {
    return CANONICAL_PRODUCTION_ORIGIN
  }

  return normalizedSiteUrl.replace(/\/+$/, "")
}
