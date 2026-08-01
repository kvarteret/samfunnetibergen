export type ApprovalStatus =
  | "pending"
  | "approved"
  | "paused"
  | "rejected"
  | "archived"

export type ApprovalTransition = {
  from: ApprovalStatus
  label: string
  status: ApprovalStatus
  tone: "positive" | "critical" | "caution"
  roles?: string[]
}

export const approvalTransitions: Record<ApprovalStatus, ApprovalTransition[]> =
  {
    pending: [
      {
        from: "pending",
        label: "Godkjenn og publiser",
        status: "approved",
        tone: "positive",
      },
      {
        from: "pending",
        label: "Avvis request",
        status: "rejected",
        tone: "critical",
      },
    ],
    rejected: [
      {
        from: "rejected",
        label: "Gjenåpne request",
        status: "pending",
        tone: "caution",
        roles: ["administrator", "editor"],
      },
    ],
    approved: [
      {
        from: "approved",
        label: "Skjul midlertidig",
        status: "paused",
        tone: "caution",
      },
      {
        from: "approved",
        label: "Arkiver",
        status: "archived",
        tone: "critical",
      },
    ],
    paused: [
      {
        from: "paused",
        label: "Gjør synlig",
        status: "approved",
        tone: "positive",
      },
      {
        from: "paused",
        label: "Arkiver",
        status: "archived",
        tone: "critical",
      },
    ],
    archived: [
      {
        from: "archived",
        label: "Gjenopprett og publiser",
        status: "approved",
        tone: "positive",
      },
    ],
  }

export function getApprovalTransitions(
  status: string | undefined,
  roleNames: string[] = [],
): ApprovalTransition[] {
  if (!status || !(status in approvalTransitions)) return []
  return approvalTransitions[status as ApprovalStatus].filter(
    transition =>
      !transition.roles ||
      transition.roles.some(role => roleNames.includes(role)),
  )
}
