export type PromotedPlacement = "top" | "pool"

export type PromotedPlacementDocument = {
  _id: string
  orderRank?: string
  promotedPlacement?: PromotedPlacement
}

export type PromotedDragDecision =
  | { type: "none" }
  | { type: "move"; draggedId: string; placement: PromotedPlacement }
  | { type: "rejectMaximum" }
  | { type: "rejectMinimum" }

export function normalizedDocumentId(id: string) {
  return id.replace(/^drafts\./, "")
}

export function topDocumentIds(documents: PromotedPlacementDocument[]) {
  const hasSavedPlacement = documents.some(document =>
    Boolean(document.promotedPlacement),
  )
  if (hasSavedPlacement) {
    return new Set(
      documents
        .filter(document => document.promotedPlacement === "top")
        .map(document => normalizedDocumentId(document._id)),
    )
  }
  return new Set(
    documents
      .slice(0, Math.min(3, documents.length))
      .map(document => normalizedDocumentId(document._id)),
  )
}

export function decidePromotedDrag(
  before: PromotedPlacementDocument[],
  after: PromotedPlacementDocument[],
  draggedId: string,
): PromotedDragDecision {
  const normalizedId = normalizedDocumentId(draggedId)
  const beforeIndex = before.findIndex(
    document => normalizedDocumentId(document._id) === normalizedId,
  )
  const afterIndex = after.findIndex(
    document => normalizedDocumentId(document._id) === normalizedId,
  )
  if (beforeIndex < 0 || afterIndex < 0 || beforeIndex === afterIndex) {
    return { type: "none" }
  }

  const topIds = topDocumentIds(before)
  const wasTop = topIds.has(normalizedId)
  const topCount = topIds.size

  if (wasTop && afterIndex >= topCount) {
    return topCount === 1
      ? { type: "rejectMinimum" }
      : { type: "move", draggedId: normalizedId, placement: "pool" }
  }
  if (!wasTop && afterIndex < topCount) {
    return topCount === 3
      ? { type: "rejectMaximum" }
      : { type: "move", draggedId: normalizedId, placement: "top" }
  }
  return { type: "none" }
}

export function placementsAfterDecision(
  documents: PromotedPlacementDocument[],
  decision: Extract<PromotedDragDecision, { type: "move" }>,
) {
  const currentTopIds = topDocumentIds(documents)
  return documents.map(document => {
    const id = normalizedDocumentId(document._id)
    return {
      id,
      placement:
        id === decision.draggedId
          ? decision.placement
          : currentTopIds.has(id)
            ? ("top" as const)
            : ("pool" as const),
    }
  })
}
