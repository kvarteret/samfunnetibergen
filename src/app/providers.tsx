"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect, useRef, useState } from "react"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST

// PostHog is never initialized on localhost — local development must not emit
// analytics into the production project.
function isLocalhost() {
  if (typeof window === "undefined") return true
  const { hostname } = window.location
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  const posthogInitialized = useRef(false)
  useEffect(() => {
    if (!POSTHOG_KEY || isLocalhost() || posthogInitialized.current) return
    posthogInitialized.current = true
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </QueryClientProvider>
  )
}
