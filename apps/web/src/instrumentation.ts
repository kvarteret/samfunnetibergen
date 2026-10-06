import type { Instrumentation } from "next"
import {
  getPostHogDistinctIdFromCookie,
  getServerRequestExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node")
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const posthog = getPostHogClient()
  const distinctId =
    getPostHogDistinctIdFromCookie(request.headers.cookie) ?? "anonymous"
  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined

  posthog.captureException(
    toPostHogException(error),
    distinctId,
    getServerRequestExceptionProperties({
      source: "next-on-request-error",
      digest,
      method: request.method,
      router_kind: context.routerKind,
      route_path: context.routePath,
      route_type: context.routeType,
      render_source: context.renderSource,
      revalidate_reason: context.revalidateReason,
    }),
  )
  await posthog.flush()
}
