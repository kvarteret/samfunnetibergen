import posthog from "posthog-js"

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.") ||
    window.location.hostname === "[::1]")

if (!isLocalhost || process.env.NEXT_PUBLIC_POSTHOG_ENABLE_LOCALHOST === "true") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
  })
}
