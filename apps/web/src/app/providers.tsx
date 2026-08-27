"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useLocale } from "next-intl"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
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

  useEffect(() => {
    posthog.set_config({ override_display_language: locale })
  }, [locale])

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </QueryClientProvider>
  )
}
