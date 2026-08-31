export { getPostHogDistinctIdFromCookie } from "./distinct-id"

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
