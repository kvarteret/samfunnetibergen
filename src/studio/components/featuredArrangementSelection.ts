export type FeaturedSelectionDocument = {
  _id: string
  isPromoted?: boolean
  orderRank?: string
  promotedOrder?: number
  promotedPlacement?: "top" | "pool"
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

export function selectionNeedsNormalization(
  documents: FeaturedSelectionDocument[],
  selectedDocuments: FeaturedSelectionDocument[],
) {
  const selectedIds = new Set(
    selectedDocuments.map(document => normalizedArrangementId(document._id)),
  )
  return documents.some(document => {
    const id = normalizedArrangementId(document._id)
    const selectedIndex = selectedDocuments.findIndex(
      selected => normalizedArrangementId(selected._id) === id,
    )
    if (selectedIds.has(id)) {
      const expectedPlacement = selectedIndex < 3 ? "top" : "pool"
      return (
        document.isPromoted !== true ||
        document.promotedPlacement !== expectedPlacement ||
        document.promotedOrder !== selectedIndex
      )
    }
    return (
      document.isPromoted === true ||
      document.promotedPlacement === "top" ||
      typeof document.promotedOrder === "number"
    )
  })
}
