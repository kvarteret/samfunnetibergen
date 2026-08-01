import posthog from "posthog-js"

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.") ||
    window.location.hostname === "[::1]")

if (
  !isLocalhost ||
  process.env.NEXT_PUBLIC_POSTHOG_ENABLE_LOCALHOST === "true"
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_pageview: true,
    capture_pageleave: true,
    capture_exceptions: true,
    person_profiles: "identified_only",
    tracing_headers:
      typeof window === "undefined" ? undefined : [window.location.hostname],
  })

  posthog.register({
    ...(process.env.NEXT_PUBLIC_DEPLOYMENT_TAG
      ? { deployment_tag: process.env.NEXT_PUBLIC_DEPLOYMENT_TAG }
      : {}),
    ...(process.env.NEXT_PUBLIC_GIT_SHA
      ? { git_sha: process.env.NEXT_PUBLIC_GIT_SHA }
      : {}),
  })
}
