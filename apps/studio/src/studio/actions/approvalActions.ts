import { icons } from "@sanity/icons"
import { useToast } from "@sanity/ui"
import type { IdentifiedSanityDocumentStub } from "@sanity/client"
import { useState } from "react"
import type { DocumentActionProps, SanityDocument } from "sanity"
import { useClient, useCurrentUser } from "sanity"

import {
  type ApprovalStatus,
  type ApprovalTransition,
  approvalTransitions,
} from "./approvalStatus"

const API_VERSION = "2026-07-29"

const TRANSITION_ICONS: Record<ApprovalStatus, React.ComponentType> = {
  pending: icons.reset,
  approved: icons.checkmark,
  paused: icons.pause,
  rejected: icons.close,
  archived: icons.archive,
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

export const arrangementApprovalActions = Object.values(approvalTransitions)
  .flat()
  .map(createStatusAction)
