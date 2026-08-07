export const RESERVED_PAGE_SLUGS = [
  "arrangementer",
  "bli-frivillig",
  "grupper",
  "karaoke",
  "kontakt",
  "nyttig",
  "rom",
  "sponsorer",
  "tilgjengelighet",
] as const

export function isReservedPageSlug(slug: string | undefined) {
  return Boolean(
    slug &&
      RESERVED_PAGE_SLUGS.includes(
        slug as (typeof RESERVED_PAGE_SLUGS)[number],
      ),
  )
}

export function getPublishedDocumentId(documentId: string) {
  return documentId.startsWith("drafts.")
    ? documentId.slice("drafts.".length)
    : documentId
}

export async function wouldCreateGroupCycle(
  currentId: string,
  candidateParentId: string,
  loadParentId: (documentId: string) => Promise<string | null>,
) {
  const publishedCurrentId = getPublishedDocumentId(currentId)
  let documentId: string | null = getPublishedDocumentId(candidateParentId)
  const visited = new Set<string>()

  while (documentId) {
    if (documentId === publishedCurrentId || visited.has(documentId)) {
      return true
    }
    visited.add(documentId)
    documentId = await loadParentId(documentId)
  }

  return false
}
