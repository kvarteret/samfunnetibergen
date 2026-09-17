const CANONICAL_PRODUCTION_ORIGIN = "https://www.samfunnetibergen.no"
const LOCAL_DEVELOPMENT_ORIGIN = "http://localhost:3187"

// `vercel pull` replaces sensitive project values with this placeholder when it
// cannot decrypt them. A pulled production environment therefore contains
// strings that are not real origin values, and the production build must not
// treat them as one.
const PULLED_SECRET_PLACEHOLDER = "[SENSITIVE]"

function normalizeConfiguredSiteUrl(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.includes(PULLED_SECRET_PLACEHOLDER)) return null

  const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`

  try {
    new URL(normalized)
  } catch {
    return null
  }

  return normalized.replace(/\/+$/, "")
}

export function resolveSiteUrl() {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const siteUrl = normalizeConfiguredSiteUrl(candidate)
    if (!siteUrl) continue

    const { hostname } = new URL(siteUrl)

    if (
      hostname === "samfunnetibergen.no" ||
      hostname === "www.samfunnetibergen.no"
    ) {
      return CANONICAL_PRODUCTION_ORIGIN
    }

    return siteUrl
  }

  return LOCAL_DEVELOPMENT_ORIGIN
}
