const POSTHOG_COOKIE_PREFIX = "ph_phc_"
const POSTHOG_COOKIE_SUFFIX = "_posthog"

export function getPostHogDistinctIdFromCookie(
  cookieHeader: string | string[] | undefined,
): string | undefined {
  if (!cookieHeader) return undefined
  const cookieString = Array.isArray(cookieHeader)
    ? cookieHeader.join("; ")
    : cookieHeader

  for (const cookiePart of cookieString.split(";")) {
    const [rawName, ...rawValueParts] = cookiePart.trim().split("=")
    const rawValue = rawValueParts.join("=")
    if (
      !rawName ||
      !rawValue ||
      !rawName.startsWith(POSTHOG_COOKIE_PREFIX) ||
      !rawName.endsWith(POSTHOG_COOKIE_SUFFIX)
    ) {
      continue
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
        distinct_id?: unknown
      }
      if (
        typeof parsed.distinct_id === "string" &&
        parsed.distinct_id.length > 0 &&
        parsed.distinct_id.length <= 256
      ) {
        return parsed.distinct_id
      }
    } catch {
      // Ignore malformed analytics cookies and continue to the next candidate.
    }
  }

  return undefined
}
