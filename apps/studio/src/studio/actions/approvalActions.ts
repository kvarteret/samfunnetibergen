import type { IdentifiedSanityDocumentStub, SanityClient } from "@sanity/client"
import { icons } from "@sanity/icons"
import { useToast } from "@sanity/ui"
import { useState } from "react"
import type { DocumentActionProps, SanityDocument } from "sanity"
import { useClient, useCurrentUser } from "sanity"

import {
  type ApprovalStatus,
  type ApprovalTransition,
  approvalTransitions,
  type EventStatus,
  type EventStatusTransition,
  eventStatusTransitions,
} from "./approvalStatus"

const API_VERSION = "2026-07-29"

const TRANSITION_ICONS: Record<ApprovalStatus, React.ComponentType> = {
  pending: icons.reset,
  approved: icons.checkmark,
  rejected: icons.close,
}

const EVENT_TRANSITION_ICONS: Record<EventStatus, React.ComponentType> = {
  scheduled: icons.checkmark,
  cancelled: icons.close,
}

export function publishableArrangement(
  source: SanityDocument,
  id: string,
  status: ApprovalStatus,
): IdentifiedSanityDocumentStub {
  const content = { ...source } as Record<string, unknown>
  delete content._createdAt
  delete content._rev
  delete content._updatedAt
  return {
    ...content,
    _id: id.replace(/^drafts\./, ""),
    _type: "arrangement",
    approvalStatus: status,
  } as IdentifiedSanityDocumentStub
}

function getStatus({ published, draft }: DocumentActionProps) {
  return (
    (draft as Record<string, unknown> | null)?.approvalStatus ??
    (published as Record<string, unknown> | null)?.approvalStatus
  )
}

function getEventStatus({ published, draft }: DocumentActionProps) {
  return (
    (draft as Record<string, unknown> | null)?.eventStatus ??
    (published as Record<string, unknown> | null)?.eventStatus ??
    "scheduled"
  )
}

export function publishableArrangementWithEventStatus(
  source: SanityDocument,
  id: string,
  status: EventStatus,
): IdentifiedSanityDocumentStub {
  const content = { ...source } as Record<string, unknown>
  delete content._createdAt
  delete content._rev
  delete content._updatedAt
  return {
    ...content,
    _id: id.replace(/^drafts\./, ""),
    _type: "arrangement",
    approvalStatus: "approved",
    eventStatus: status,
  } as IdentifiedSanityDocumentStub
}

export async function publishArrangementEventStatus(
  client: SanityClient,
  source: SanityDocument,
  id: string,
  status: EventStatus,
) {
  const publishedId = id.replace(/^drafts\./, "")
  const transaction = client
    .transaction()
    .createOrReplace(
      publishableArrangementWithEventStatus(source, publishedId, status),
    )
  if (source._id.startsWith("drafts.")) {
    transaction.delete(`drafts.${publishedId}`)
  }
  await transaction.commit()
}

function createStatusAction(transition: ApprovalTransition) {
  return function StatusAction(props: DocumentActionProps) {
    const client = useClient({ apiVersion: API_VERSION })
    const currentUser = useCurrentUser()
    const toast = useToast()
    const [busy, setBusy] = useState(false)
    const roles = currentUser?.roles.map(role => role.name) ?? []

    if (
      getStatus(props) !== transition.from ||
      (transition.roles && !transition.roles.some(role => roles.includes(role)))
    ) {
      return null
    }

    const source = props.draft ?? props.published
    if (!source) return null

    return {
      label: busy ? "Lagrer …" : transition.label,
      icon: TRANSITION_ICONS[transition.status],
      tone: transition.tone,
      disabled: busy,
      onHandle: async () => {
        setBusy(true)
        try {
          const publishedId = props.id.replace(/^drafts\./, "")
          const transaction = client
            .transaction()
            .createOrReplace(
              publishableArrangement(source, publishedId, transition.status),
            )
          if (props.draft) transaction.delete(`drafts.${publishedId}`)
          await transaction.commit()
          toast.push({
            status: "success",
            title: transition.label,
          })
          props.onComplete()
        } catch (error) {
          toast.push({
            status: "error",
            title: "Kunne ikke oppdatere arrangementet",
            description: error instanceof Error ? error.message : "Ukjent feil",
          })
          setBusy(false)
        }
      },
    }
  }
}

function createEventStatusAction(transition: EventStatusTransition) {
  return function EventStatusAction(props: DocumentActionProps) {
    const client = useClient({ apiVersion: API_VERSION })
    const toast = useToast()
    const [busy, setBusy] = useState(false)

    if (
      getStatus(props) !== "approved" ||
      getEventStatus(props) !== transition.from
    ) {
      return null
    }

    const source = props.draft ?? props.published
    if (!source) return null

    return {
      label: busy ? "Lagrer …" : transition.label,
      icon: EVENT_TRANSITION_ICONS[transition.status],
      tone: transition.tone,
      disabled: busy,
      onHandle: async () => {
        setBusy(true)
        try {
          await publishArrangementEventStatus(
            client,
            source,
            props.id,
            transition.status,
          )
          toast.push({ status: "success", title: transition.label })
          props.onComplete()
        } catch (error) {
          toast.push({
            status: "error",
            title: "Kunne ikke oppdatere arrangementet",
            description: error instanceof Error ? error.message : "Ukjent feil",
          })
          setBusy(false)
        }
      },
    }
  }
}

export const arrangementRequestActions = Object.values(approvalTransitions)
  .flat()
  .map(createStatusAction)

export const arrangementEventStatusActions = Object.values(
  eventStatusTransitions,
)
  .flat()
  .map(createEventStatusAction)

export const arrangementApprovalActions = [
  ...arrangementRequestActions,
  ...arrangementEventStatusActions,
]
