import { icons } from "@sanity/icons"
import { Badge, Box } from "@sanity/ui"

import { countPendingRequests } from "./arrangementFilters"
import { useListeningQuery } from "./useListeningQuery"

const REQUEST_QUERY = `*[
  _type == "arrangement" &&
  defined(submittedByEmail)
] {_id, approvalStatus, submittedByEmail}`
const REQUEST_LISTEN_QUERY =
  '*[_type == "arrangement" && defined(submittedByEmail)]'

type RequestDocument = {
  _id: string
  approvalStatus?: string | null
  submittedByEmail?: string | null
}

const EMPTY_REQUESTS: RequestDocument[] = []

export function RequestCountIcon() {
  const { data: requests } = useListeningQuery({
    initialValue: EMPTY_REQUESTS,
    listenQuery: REQUEST_LISTEN_QUERY,
    query: REQUEST_QUERY,
  })
  const count = countPendingRequests(requests)

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
