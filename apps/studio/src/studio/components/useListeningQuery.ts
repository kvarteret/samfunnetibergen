import type { ClientPerspective, QueryParams } from "@sanity/client"
import { useEffect, useState } from "react"
import { useClient } from "sanity"

const API_VERSION = "2026-07-29"

type ListeningQueryOptions<T> = {
  enabled?: boolean
  initialValue: T
  listenQuery: string
  params?: QueryParams
  perspective?: ClientPerspective
  query: string
}

export function useListeningQuery<T>({
  enabled = true,
  initialValue,
  listenQuery,
  params,
  perspective = "previewDrafts",
  query,
}: ListeningQueryOptions<T>): { data: T; loading: boolean } {
  const client = useClient({ apiVersion: API_VERSION })
  const [data, setData] = useState(initialValue)
  const [settledKey, setSettledKey] = useState<string | null>(null)
  const paramsKey = JSON.stringify(params ?? {})

  useEffect(() => {
    if (!enabled) return undefined

    let active = true
    const queryParams = JSON.parse(paramsKey) as QueryParams
    const refresh = async () => {
      try {
        const result = await client.fetch<T>(query, queryParams, {
          perspective,
        })
        if (active) setData(result)
      } catch {
        // Keep transient Studio connectivity failures from becoming
        // unhandled promise rejections. A later mutation retries the query.
      } finally {
        if (active) setSettledKey(paramsKey)
      }
    }

    void refresh()
    const subscription = client
      .listen(listenQuery, queryParams, {
        includeResult: false,
        visibility: "query",
      })
      .subscribe({
        next: () => void refresh(),
        error: () => undefined,
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client, enabled, listenQuery, paramsKey, perspective, query])

  // Derived rather than written from the effect. Calling setState synchronously
  // inside an effect schedules an extra render before the browser paints, which
  // `react-hooks/set-state-in-effect` now flags; deriving also means a live
  // subscription update no longer flashes the loading state.
  if (!enabled) return { data: initialValue, loading: false }

  return { data, loading: settledKey !== paramsKey }
}
