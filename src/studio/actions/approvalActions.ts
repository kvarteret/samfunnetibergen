import { CheckmarkIcon, CloseIcon } from "@sanity/icons"
import type { DocumentActionProps } from "sanity"
import { useClient } from "sanity"

const getStatus = ({ published, draft }: DocumentActionProps) =>
  (draft as Record<string, unknown> | null)?.approvalStatus ??
  (published as Record<string, unknown> | null)?.approvalStatus

export function ApproveAction(props: DocumentActionProps) {
  const client = useClient({ apiVersion: "2024-01-01" })
  if (getStatus(props) !== "pending") return null
  return {
    label: "Godkjenn",
    icon: CheckmarkIcon,
    tone: "positive" as const,
    onHandle: async () => {
      await client.patch(props.id).set({ approvalStatus: "approved" }).commit()
      props.onComplete()
    },
  }
}

export function RejectAction(props: DocumentActionProps) {
  const client = useClient({ apiVersion: "2024-01-01" })
  if (getStatus(props) !== "pending") return null
  return {
    label: "Avvis",
    icon: CloseIcon,
    tone: "critical" as const,
    onHandle: async () => {
      await client.patch(props.id).set({ approvalStatus: "rejected" }).commit()
      props.onComplete()
    },
  }
}
