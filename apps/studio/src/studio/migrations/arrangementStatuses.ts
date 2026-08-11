type ArrangementStatusDocument = {
  _id: string
  _type: string
  approvalStatus?: unknown
  eventStatus?: unknown
  submittedByEmail?: unknown
}

export function buildArrangementStatusPatch(
  document: ArrangementStatusDocument,
): Record<string, "approved" | "pending" | "scheduled"> {
  if (document._type !== "arrangement") return {}

  const patch: Record<string, "approved" | "pending" | "scheduled"> = {}
  if (document.eventStatus == null || document.eventStatus === "postponed") {
    patch.eventStatus = "scheduled"
  }

  if (
    document.approvalStatus === "paused" ||
    document.approvalStatus === "archived"
  ) {
    patch.approvalStatus = "approved"
  } else if (document.approvalStatus == null) {
    patch.approvalStatus =
      typeof document.submittedByEmail === "string" &&
      document.submittedByEmail.trim().length > 0
        ? "pending"
        : "approved"
  }

  return patch
}
