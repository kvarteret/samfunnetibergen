import { resolveEffectiveStatus } from "@samfunnet/content-domain/resolve-event"
import { Card, Flex, Select, Stack, Text, useToast } from "@sanity/ui"
import { useState } from "react"
import type { ObjectInputProps, SanityDocument } from "sanity"
import { useClient } from "sanity"
import { createGlobalStyle } from "styled-components"

import { publishArrangementEventStatus } from "../actions/approvalActions"
import {
  type EventStatus,
  getEventStatusTransitions,
} from "../actions/approvalStatus"
import {
  ARRANGEMENT_LIST_STATUS_LABELS,
  type ArrangementBrowserItem,
  type ArrangementListStatus,
  arrangementListStatus,
  normalizeDocumentId,
  todayInOslo,
} from "./arrangementFilters"
import { useListeningQuery } from "./useListeningQuery"

const CHILD_KINDS = new Set(["seriesInstance", "festivalSession"])
const PARENT_KINDS = new Set(["seriesParent", "festivalParent"])
const RELATED_STATUS_QUERY = `{
  "childDates": *[
    _type == "arrangement" &&
    parentEvent._ref == $documentId &&
    approvalStatus == "approved"
  ].dates[].startDate,
  "parentStatus": coalesce(
    *[_id == "drafts." + $parentId][0].eventStatus,
    *[_id == $parentId][0].eventStatus,
    "scheduled"
  )
}`
const RELATED_STATUS_LISTEN_QUERY = `*[
  _type == "arrangement" &&
  (_id in [$parentId, "drafts." + $parentId] ||
    parentEvent._ref == $documentId)
]`

type ArrangementDocument = SanityDocument & {
  approvalStatus?: string | null
  eventKind?: string | null
  eventStatus?: string | null
  dates?: ArrangementBrowserItem["dates"]
  parentEvent?: { _ref?: string | null } | null
}

type RelatedStatusData = {
  childDates: string[]
  parentStatus: "scheduled" | "cancelled"
}

const EMPTY_RELATED_STATUS: RelatedStatusData = {
  childDates: [],
  parentStatus: "scheduled",
}

const ArrangementActionStyles = createGlobalStyle`
  [data-testid="pane-footer"] [data-testid="action-menu-button"] {
    min-width: 5rem;
  }

  [data-testid="pane-footer"] [data-testid="action-menu-button"]
    [data-sanity-icon="ellipsis-horizontal"] {
    display: none;
  }

  [data-testid="pane-footer"] [data-testid="action-menu-button"]
    div[data-ui="Text"] > span::after {
    content: "Actions";
  }
`

export function deriveArrangementDocumentStatus(
  document: ArrangementDocument,
  related: RelatedStatusData,
  today: string,
): ArrangementListStatus {
  const effectiveEventStatus = resolveEffectiveStatus(
    document.eventStatus === "cancelled" ? "cancelled" : "scheduled",
    related.parentStatus,
  )

  return arrangementListStatus(
    {
      _id: normalizeDocumentId(document._id),
      eventKind: document.eventKind,
      eventStatus: effectiveEventStatus,
      dates: document.dates,
      childDates: related.childDates,
    },
    today,
  )
}

export function editableArrangementStatuses(
  document: ArrangementDocument,
  status: ArrangementListStatus,
): ArrangementListStatus[] {
  if (
    !(["approved", "cancelled"] as ArrangementListStatus[]).includes(status)
  ) {
    return [status]
  }
  const targets = getEventStatusTransitions(
    document.approvalStatus ?? undefined,
    document.eventStatus ?? undefined,
  ).map(transition =>
    transition.status === "cancelled" ? "cancelled" : "approved",
  )
  return [status, ...targets.filter(target => target !== status)]
}

function toneFor(status: ArrangementListStatus) {
  if (status === "cancelled") return "critical" as const
  if (status === "completed") return "positive" as const
  if (status === "archived") return "default" as const
  return "primary" as const
}

function ArrangementStatusInput({
  document,
}: {
  document: ArrangementDocument
}) {
  const client = useClient({ apiVersion: "2026-07-29" })
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const documentId = normalizeDocumentId(document._id)
  const eventKind = document.eventKind ?? "single"
  const parentId = normalizeDocumentId(document.parentEvent?._ref ?? "")
  const needsRelatedData =
    PARENT_KINDS.has(eventKind) || CHILD_KINDS.has(eventKind)
  const { data: related } = useListeningQuery({
    enabled: needsRelatedData,
    initialValue: EMPTY_RELATED_STATUS,
    listenQuery: RELATED_STATUS_LISTEN_QUERY,
    params: { documentId, parentId },
    query: RELATED_STATUS_QUERY,
  })
  const status = deriveArrangementDocumentStatus(
    document,
    related,
    todayInOslo(),
  )
  const editableStatuses = editableArrangementStatuses(document, status)
  const editable = editableStatuses.length > 1

  const updateStatus = async (nextStatus: ArrangementListStatus) => {
    const eventStatus: EventStatus | null =
      nextStatus === "approved"
        ? "scheduled"
        : nextStatus === "cancelled"
          ? "cancelled"
          : null
    if (!eventStatus || !editableStatuses.includes(nextStatus)) return

    setBusy(true)
    try {
      await publishArrangementEventStatus(
        client,
        document,
        document._id,
        eventStatus,
      )
      toast.push({
        status: "success",
        title: `Status endret til ${ARRANGEMENT_LIST_STATUS_LABELS[nextStatus]}`,
      })
    } catch (error) {
      toast.push({
        status: "error",
        title: "Kunne ikke oppdatere arrangementet",
        description: error instanceof Error ? error.message : "Ukjent feil",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card border padding={3} radius={2} tone={toneFor(status)}>
      <Flex align="center" gap={3} justify="space-between" wrap="wrap">
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Status
          </Text>
          <Text muted size={1}>
            {editable
              ? "Kan endres mellom Godkjent og Kansellert."
              : "Avledes fra arrangementsdatoen og kan ikke endres manuelt."}
          </Text>
        </Stack>
        <Select
          aria-label="Status"
          disabled={busy || !editable}
          onChange={event =>
            void updateStatus(
              event.currentTarget.value as ArrangementListStatus,
            )
          }
          value={status}
        >
          {Object.entries(ARRANGEMENT_LIST_STATUS_LABELS).map(
            ([value, label]) => (
              <option
                disabled={
                  !editableStatuses.includes(value as ArrangementListStatus)
                }
                key={value}
                value={value}
              >
                {label}
              </option>
            ),
          )}
        </Select>
      </Flex>
    </Card>
  )
}

export function ArrangementDocumentInput(props: ObjectInputProps) {
  const document = props.value as ArrangementDocument | undefined
  return (
    <>
      <ArrangementActionStyles />
      <Stack space={4}>
        {document?.approvalStatus === "approved" ? (
          <ArrangementStatusInput document={document} />
        ) : null}
        {props.renderDefault(props)}
      </Stack>
    </>
  )
}
