export type ApprovalStatus =
  | "pending"
  | "approved"
  | "paused"
  | "rejected"
  | "archived"

export type ApprovalTransition = {
  label: string
  status: ApprovalStatus
  tone: "positive" | "critical" | "caution"
}

const transitions: Partial<Record<ApprovalStatus, ApprovalTransition[]>> = {
  pending: [
    { label: "Godkjenn", status: "approved", tone: "positive" },
    { label: "Avvis", status: "rejected", tone: "critical" },
  ],
  approved: [{ label: "Sett på pause", status: "paused", tone: "caution" }],
  paused: [{ label: "Gjenoppta", status: "approved", tone: "positive" }],
}

export function getApprovalTransitions(
  status: string | undefined,
): ApprovalTransition[] {
  return status && status in transitions
    ? [...(transitions[status as ApprovalStatus] ?? [])]
    : []
}
