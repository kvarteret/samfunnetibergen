export type ApprovalStatus = "pending" | "approved" | "rejected"
export type EventStatus = "scheduled" | "cancelled"

export type ApprovalTransition = {
  from: ApprovalStatus
  label: string
  status: ApprovalStatus
  tone: "positive" | "critical" | "caution"
  roles?: string[]
}

export type EventStatusTransition = {
  from: EventStatus
  label: string
  status: EventStatus
  tone: "positive" | "critical"
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
    approved: [],
  }

export const eventStatusTransitions: Record<
  EventStatus,
  EventStatusTransition[]
> = {
  scheduled: [
    {
      from: "scheduled",
      label: "Kanseller arrangement",
      status: "cancelled",
      tone: "critical",
    },
  ],
  cancelled: [
    {
      from: "cancelled",
      label: "Gjenopprett som godkjent",
      status: "scheduled",
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

export function getEventStatusTransitions(
  approvalStatus: string | undefined,
  eventStatus: string | undefined,
): EventStatusTransition[] {
  if (approvalStatus !== "approved") return []
  const effectiveStatus = eventStatus ?? "scheduled"
  if (!(effectiveStatus in eventStatusTransitions)) return []
  return eventStatusTransitions[effectiveStatus as EventStatus]
}
