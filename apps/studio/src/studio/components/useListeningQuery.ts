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
  const [loading, setLoading] = useState(enabled)
  const paramsKey = JSON.stringify(params ?? {})

  useEffect(() => {
    if (!enabled) {
      setData(initialValue)
      setLoading(false)
      return undefined
    }

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
        if (active) setLoading(false)
      }
    }

    setData(initialValue)
    setLoading(true)
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
  }, [
    client,
    enabled,
    initialValue,
    listenQuery,
    paramsKey,
    perspective,
    query,
  ])

  return { data, loading }
}
