import { FEATURED_SLOT_COUNT } from "@samfunnet/content-domain/promotion"

export type FeaturedSelectionDocument = {
  _id: string
  isPromoted?: boolean
  orderRank?: string
  promotedOrder?: number
  promotedPlacement?: "top" | "pool"
}

export type PromotionState = {
  isPromoted: boolean
  promotedOrder?: number
  promotedPlacement: "top" | "pool"
}

export function normalizedArrangementId(id: string) {
  return id.replace(/^drafts\./, "")
}

export function compareFeaturedSelection(
  first: FeaturedSelectionDocument,
  second: FeaturedSelectionDocument,
) {
  if (
    typeof first.promotedOrder === "number" ||
    typeof second.promotedOrder === "number"
  ) {
    return (
      (first.promotedOrder ?? Number.MAX_SAFE_INTEGER) -
      (second.promotedOrder ?? Number.MAX_SAFE_INTEGER)
    )
  }
  return (first.orderRank ?? "~").localeCompare(second.orderRank ?? "~")
}

export function selectFeaturedDocuments<T extends FeaturedSelectionDocument>(
  documents: T[],
): T[] {
  return [...documents]
    .filter(document => document.isPromoted)
    .sort(compareFeaturedSelection)
}

export function reorderFeaturedDocuments<T>(
  documents: T[],
  sourceIndex: number,
  destinationIndex: number,
) {
  if (
    sourceIndex === destinationIndex ||
    sourceIndex < 0 ||
    destinationIndex < 0 ||
    sourceIndex >= documents.length ||
    destinationIndex >= documents.length
  ) {
    return documents
  }
  const reordered = [...documents]
  const [moved] = reordered.splice(sourceIndex, 1)
  if (!moved) return documents
  reordered.splice(destinationIndex, 0, moved)
  return reordered
}

/**
 * The stored fields for an arrangement given the editors' ordered picks. The
 * first picks are "top", the rest wait in the "pool" and move up as earlier
 * picks end.
 */
export function promotionState(
  selectedIds: string[],
  id: string,
): PromotionState {
  const index = selectedIds.indexOf(normalizedArrangementId(id))
  if (index === -1) return { isPromoted: false, promotedPlacement: "pool" }
  return {
    isPromoted: true,
    promotedOrder: index,
    promotedPlacement: index < FEATURED_SLOT_COUNT ? "top" : "pool",
  }
}

/** Arrangements whose stored promotion fields differ from the new picks. */
export function changedPromotions<T extends FeaturedSelectionDocument>(
  documents: T[],
  selectedIds: string[],
): Array<{ document: T; state: PromotionState }> {
  return documents.flatMap(document => {
    const state = promotionState(selectedIds, document._id)
    const changed = state.isPromoted
      ? document.isPromoted !== true ||
        document.promotedOrder !== state.promotedOrder ||
        document.promotedPlacement !== state.promotedPlacement
      : document.isPromoted === true ||
        document.promotedPlacement === "top" ||
        typeof document.promotedOrder === "number"
    return changed ? [{ document, state }] : []
  })
}

export function applyPromotionState<T extends FeaturedSelectionDocument>(
  document: T,
  state: PromotionState,
): T {
  return {
    ...document,
    isPromoted: state.isPromoted,
    promotedOrder: state.promotedOrder,
    promotedPlacement: state.promotedPlacement,
  }
}
