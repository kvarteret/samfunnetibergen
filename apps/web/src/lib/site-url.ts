const CANONICAL_PRODUCTION_ORIGIN = "https://www.samfunnetibergen.no"
const LOCAL_SITE_ORIGIN = "http://localhost:3187"

const SITE_URL_ENVIRONMENT_KEYS = [
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const

function parseSiteUrl(value: string | undefined): URL | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return null

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`

  try {
    const url = new URL(candidate)
    return url.protocol === "http:" || url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

export function resolveSiteUrl() {
  const resolvedUrl = SITE_URL_ENVIRONMENT_KEYS.map(key =>
    parseSiteUrl(process.env[key]),
  ).find((url): url is URL => url !== null)

  if (!resolvedUrl) return LOCAL_SITE_ORIGIN

  const hostname = resolvedUrl.hostname

  if (
    hostname === "samfunnetibergen.no" ||
    hostname === "www.samfunnetibergen.no"
  ) {
    return CANONICAL_PRODUCTION_ORIGIN
  }

  return resolvedUrl.toString().replace(/\/+$/, "")
}
