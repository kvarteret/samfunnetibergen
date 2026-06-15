import { PostHog } from "posthog-node"

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST!
if (POSTHOG_HOST && (POSTHOG_HOST.includes("localhost") || POSTHOG_HOST.startsWith("http://127.0.0"))) {
  throw new Error(`PostHog host must not be localhost, got: ${POSTHOG_HOST}`)
}

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!,
      {
        host: POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      },
    )
  }
  return posthogClient
}
