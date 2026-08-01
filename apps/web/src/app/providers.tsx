"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useState } from "react"

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

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </QueryClientProvider>
  )
}
