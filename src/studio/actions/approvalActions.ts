import { icons } from "@sanity/icons"
import type { DocumentActionProps } from "sanity"
import { useDocumentOperation } from "sanity"

import type { ApprovalStatus } from "./approvalStatus"

const getStatus = ({ published, draft }: DocumentActionProps) =>
  (draft as Record<string, unknown> | null)?.approvalStatus ??
  (published as Record<string, unknown> | null)?.approvalStatus

function createStatusAction({
  currentStatus,
  icon,
  label,
  nextStatus,
  tone,
}: {
  currentStatus: ApprovalStatus
  icon: React.ComponentType
  label: string
  nextStatus: ApprovalStatus
  tone: "positive" | "critical" | "caution"
}) {
  return function StatusAction(props: DocumentActionProps) {
    const operations = useDocumentOperation(props.id, props.type)
    if (getStatus(props) !== currentStatus) return null

    return {
      label,
      icon,
      tone,
      disabled: Boolean(operations.patch.disabled),
      onHandle: () => {
        operations.patch.execute([{ set: { approvalStatus: nextStatus } }])
        props.onComplete()
      },
    }
  }
}

export const ApproveAction = createStatusAction({
  currentStatus: "pending",
  icon: icons.checkmark,
  label: "Godkjenn",
  nextStatus: "approved",
  tone: "positive",
})

export const RejectAction = createStatusAction({
  currentStatus: "pending",
  icon: icons.close,
  label: "Avvis",
  nextStatus: "rejected",
  tone: "critical",
})

export const PauseAction = createStatusAction({
  currentStatus: "approved",
  icon: icons.pause,
  label: "Sett på pause",
  nextStatus: "paused",
  tone: "caution",
})

export const ResumeAction = createStatusAction({
  currentStatus: "paused",
  icon: icons.play,
  label: "Gjenoppta",
  nextStatus: "approved",
  tone: "positive",
})
