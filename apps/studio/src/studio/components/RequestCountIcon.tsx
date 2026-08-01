import { icons } from "@sanity/icons"
import { Badge, Box } from "@sanity/ui"
import { useEffect, useState } from "react"
import { useClient } from "sanity"

import { countPendingRequests } from "./arrangementFilters"

const API_VERSION = "2026-07-29"
const REQUEST_QUERY = `*[
  _type == "arrangement" &&
  defined(submittedByEmail)
] {_id, approvalStatus, submittedByEmail}`

export function RequestCountIcon() {
  const client = useClient({ apiVersion: API_VERSION })
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      const requests = await client.fetch(REQUEST_QUERY, undefined, {
        perspective: "previewDrafts",
      })
      if (active) setCount(countPendingRequests(requests))
    }
    void refresh()
    const subscription = client
      .listen(
        '*[_type == "arrangement" && defined(submittedByEmail)]',
        {},
        { includeResult: false, visibility: "query" },
      )
      .subscribe(() => void refresh())
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  return (
    <Box style={{ position: "relative" }}>
      <icons.inbox />
      {count > 0 ? (
        <Badge
          fontSize={0}
          mode="default"
          padding={1}
          radius="full"
          tone="critical"
          style={{ position: "absolute", right: -10, top: -10 }}
        >
          {count > 99 ? "99+" : count}
        </Badge>
      ) : null}
    </Box>
  )
}
