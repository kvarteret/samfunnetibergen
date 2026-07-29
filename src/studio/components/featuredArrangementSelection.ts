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

export function moveFeaturedDocumentBetweenSections<T>(
  documents: T[],
  visibleCount: number,
  sourceSection: "visible" | "queue",
  sourceIndex: number,
  destinationSection: "visible" | "queue",
  destinationIndex: number,
  visibleLimit = 3,
): { documents: T[]; visibleCount: number } {
  const visibleDocuments = documents.slice(0, visibleCount)
  const queuedDocuments = documents.slice(visibleCount)

  if (sourceSection === destinationSection) {
    const sectionDocuments =
      sourceSection === "visible" ? visibleDocuments : queuedDocuments
    const reordered = reorderFeaturedDocuments(
      sectionDocuments,
      sourceIndex,
      destinationIndex,
    )
    if (reordered === sectionDocuments) return { documents, visibleCount }
    return {
      documents:
        sourceSection === "visible"
          ? [...reordered, ...queuedDocuments]
          : [...visibleDocuments, ...reordered],
      visibleCount,
    }
  }

  if (sourceSection === "visible") {
    if (visibleCount <= 1) return { documents, visibleCount }
    const nextVisible = [...visibleDocuments]
    const [moved] = nextVisible.splice(sourceIndex, 1)
    if (!moved) return { documents, visibleCount }
    const nextQueue = [...queuedDocuments]
    nextQueue.splice(
      Math.min(Math.max(destinationIndex, 0), nextQueue.length),
      0,
      moved,
    )
    return {
      documents: [...nextVisible, ...nextQueue],
      visibleCount: visibleCount - 1,
    }
  }

  if (visibleCount >= visibleLimit) return { documents, visibleCount }
  const nextQueue = [...queuedDocuments]
  const [moved] = nextQueue.splice(sourceIndex, 1)
  if (!moved) return { documents, visibleCount }
  visibleDocuments.splice(
    Math.min(Math.max(destinationIndex, 0), visibleDocuments.length),
    0,
    moved,
  )
  return {
    documents: [...visibleDocuments, ...nextQueue],
    visibleCount: visibleCount + 1,
  }
}

export function applyFeaturedSelection<T extends FeaturedSelectionDocument>(
  documents: T[],
  selectedDocuments: T[],
  visibleCount = Math.min(selectedDocuments.length, 3),
): T[] {
  const selectedIndexById = new Map(
    selectedDocuments.map((document, index) => [
      normalizedArrangementId(document._id),
      index,
    ]),
  )

  return documents.map(document => {
    const selectedIndex = selectedIndexById.get(
      normalizedArrangementId(document._id),
    )
    if (selectedIndex === undefined) {
      return {
        ...document,
        isPromoted: false,
        promotedOrder: undefined,
        promotedPlacement: "pool",
      }
    }
    return {
      ...document,
      isPromoted: true,
      promotedOrder: selectedIndex,
      promotedPlacement: selectedIndex < visibleCount ? "top" : "pool",
    }
  })
}

export function getFeaturedVisibleCount(
  selectedDocuments: FeaturedSelectionDocument[],
): number {
  if (selectedDocuments.length === 0) return 0
  const explicitTopCount = selectedDocuments.filter(
    document => document.promotedPlacement === "top",
  ).length
  const hasExplicitPlacement = selectedDocuments.some(
    document => document.promotedPlacement !== undefined,
  )
  return hasExplicitPlacement
    ? Math.min(Math.max(explicitTopCount, 1), 3)
    : Math.min(selectedDocuments.length, 3)
}

export function selectionNeedsNormalization(
  documents: FeaturedSelectionDocument[],
  selectedDocuments: FeaturedSelectionDocument[],
  visibleCount = Math.min(selectedDocuments.length, 3),
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
      const expectedPlacement = selectedIndex < visibleCount ? "top" : "pool"
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
