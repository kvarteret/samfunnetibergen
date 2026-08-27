import { headers } from "next/headers"

const POSTHOG_COOKIE_PREFIX = "ph_phc_"
const POSTHOG_COOKIE_SUFFIX = "_posthog"

export type ErrorWorkflow =
  | "event_image_upload"
  | "event_submission"
  | "feedback"
  | "karaoke_booking"
  | "room_booking"
  | "server_request"
  | "volunteer_application"

export type ErrorContext = Record<string, boolean | number | string | undefined>

export function getPostHogEnvironment(): string {
  if (process.env.VERCEL_ENV === "production") return "production"
  if (process.env.VERCEL_ENV === "preview") return "preview"
  if (process.env.NODE_ENV === "production") return "production"
  return "development"
}

export function getPostHogReleaseProperties(): ErrorContext {
  return {
    environment: getPostHogEnvironment(),
    vercel_env: process.env.VERCEL_ENV,
    vercel_url: process.env.VERCEL_URL,
    deployment_tag: process.env.NEXT_PUBLIC_DEPLOYMENT_TAG,
    git_sha:
      process.env.NEXT_PUBLIC_GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA,
  }
}

export function getHandledExceptionProperties(
  workflow: ErrorWorkflow,
  properties: ErrorContext = {},
): ErrorContext {
  return {
    ...getPostHogReleaseProperties(),
    ...properties,
    workflow,
    handled: true,
  }
}

export function getServerRequestExceptionProperties(
  properties: ErrorContext,
): ErrorContext {
  return {
    ...getPostHogReleaseProperties(),
    ...properties,
    workflow: "server_request",
    handled: false,
  }
}

export function toPostHogException(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === "string" && error.trim()) return new Error(error)
  return new Error("Unknown error")
}

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

    const distinctId = parsePostHogDistinctId(rawValue)
    if (distinctId) return distinctId
  }

  return undefined
}

/** Resolve the visitor's PostHog distinct_id from the request cookie, so a
 * server action or route handler can attach a server-side event (e.g. an
 * async submit confirmation) to the same person as the matching client-side
 * `*_started` event. Falls back to "anonymous" when no PostHog cookie is
 * present or the request headers can't be read (e.g. outside a Next request
 * scope such as unit tests), so analytics never blocks the submission. */
export async function getPostHogRequestDistinctId(): Promise<string> {
  try {
    const cookieHeader = (await headers()).get("cookie") ?? undefined
    return getPostHogDistinctIdFromCookie(cookieHeader) ?? "anonymous"
  } catch {
    return "anonymous"
  }
}

function parsePostHogDistinctId(rawValue: string): string | undefined {
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
      distinct_id?: unknown
    }
    return typeof parsed.distinct_id === "string" && parsed.distinct_id
      ? parsed.distinct_id
      : undefined
  } catch {
    return undefined
  }
}
