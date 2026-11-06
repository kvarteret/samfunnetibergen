import {
  CRESCAT_CHECK_LABELS,
  type CrescatCheckDocument,
  type CrescatCheckInput,
  type CrescatCheckStatus,
  crescatCheckFingerprint,
  crescatCheckId,
} from "@samfunnet/content-domain/crescat-check"
import { createImageUrlBuilder } from "@sanity/image-url"
import { Card, Flex, Stack, Text } from "@sanity/ui"
import { useClient } from "sanity"

import { useListeningQuery } from "./useListeningQuery"

// The website's daily scan (and each new submission) writes these private
// documents, once per request; Studio only reads them. See apps/web/.../crescat-check.ts.

export const CRESCAT_SIGN_COLORS: Record<CrescatCheckStatus, string> = {
  found: "#1f9d55",
  maybe: "#e8871e",
  missing: "#d63c3c",
}
const TONES = {
  found: "positive",
  maybe: "caution",
  missing: "critical",
} as const

const CHECK_QUERY = `*[_id == $id][0]`
const CHECK_LISTEN_QUERY = `*[_id == $id]`

export function useCrescatCheck(arrangementId: string | undefined) {
  const id = arrangementId ? crescatCheckId(arrangementId) : ""
  return useListeningQuery<CrescatCheckDocument | null>({
    enabled: Boolean(id),
    initialValue: null,
    listenQuery: CHECK_LISTEN_QUERY,
    params: { id },
    perspective: "raw",
    query: CHECK_QUERY,
  })
}

/** A request is a website/import submission still awaiting approval. */
export function isPendingRequest(document: {
  submittedByEmail?: unknown
  approvalStatus?: unknown
}): boolean {
  return (
    Boolean(document.submittedByEmail) &&
    (document.approvalStatus ?? "pending") === "pending"
  )
}

export function CrescatSign({
  status,
  size = 12,
}: {
  status: CrescatCheckStatus
  size?: number
}) {
  return (
    <span
      aria-label={CRESCAT_CHECK_LABELS[status]}
      role="img"
      title={CRESCAT_CHECK_LABELS[status]}
      style={{
        background: CRESCAT_SIGN_COLORS[status],
        border: "2px solid #fff",
        borderRadius: "50%",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
        display: "inline-block",
        flexShrink: 0,
        height: size,
        width: size,
      }}
    />
  )
}

type MediaImage = { asset?: { _ref?: string } } | null | undefined

/** List thumbnail for a request: the event image with the Crescat sign. */
export function CrescatRequestMedia({
  arrangementId,
  image,
}: {
  arrangementId: string
  image: MediaImage
}) {
  const client = useClient({ apiVersion: "2026-07-29" })
  const { data: check } = useCrescatCheck(arrangementId)
  const src = image?.asset?._ref
    ? createImageUrlBuilder(client).image(image).width(80).auto("format").url()
    : null
  return (
    <span
      style={{
        display: "block",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      {src ? (
        <img
          alt=""
          src={src}
          style={{ height: "100%", objectFit: "cover", width: "100%" }}
        />
      ) : null}
      {check ? (
        <span
          style={{
            bottom: src ? 1 : "50%",
            lineHeight: 0,
            position: "absolute",
            right: src ? 1 : "50%",
            transform: src ? undefined : "translate(50%, 50%)",
          }}
        >
          <CrescatSign size={src ? 15 : 20} status={check.status} />
        </span>
      ) : null}
    </span>
  )
}

const formatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Oslo",
})
const hhmm = (value: string) => value.slice(11, 16)

/** Review-panel card: what the scan found for each date of the request. */
export function CrescatCheckPanel({
  document,
}: {
  document: CrescatCheckInput & { _id: string }
}) {
  const { data: check, loading } = useCrescatCheck(document._id)
  if (loading) return null
  if (!check) {
    return (
      <Card border padding={3} radius={2} tone="transparent">
        <Text muted size={1}>
          Crescat: ikke sjekket ennå. Nye requests sjekkes én gang daglig.
        </Text>
      </Card>
    )
  }
  const stale = check.fingerprint !== crescatCheckFingerprint(document)
  return (
    <Card border padding={3} radius={2} tone={TONES[check.status]}>
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <CrescatSign size={14} status={check.status} />
          <Text size={1} weight="semibold">
            {CRESCAT_CHECK_LABELS[check.status]}
          </Text>
        </Flex>
        {check.dates.map(date => (
          <Stack gap={2} key={date._key}>
            <Flex align="center" gap={2}>
              <CrescatSign size={10} status={date.status} />
              <Text size={1}>
                {date.date}
                {date.startTime
                  ? ` ${date.startTime}–${date.endTime ?? ""}`
                  : ""}
                : {date.reason}
              </Text>
            </Flex>
            {date.matches.map(match => (
              <Text
                key={`${match.title}-${match.room}-${match.start}`}
                muted
                size={1}
                style={{ paddingLeft: 18 }}
              >
                ↳ {match.title} · {match.room} · {hhmm(match.start)}–
                {hhmm(match.end)}
              </Text>
            ))}
          </Stack>
        ))}
        <Text muted size={0}>
          Sjekket {formatter.format(new Date(check.checkedAt))}
          {stale ? " · Dato eller rom er endret siden sjekken." : ""}
        </Text>
      </Stack>
    </Card>
  )
}
