import type { SanityClient } from "@sanity/client"
import { nanoid } from "nanoid"

/** Performances further apart than this are treated as separate runs. */
const MERGE_WINDOW_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

type ArrangementDate = {
  _key: string
  _type: "arrangementDate"
  startDate: string
  startTime?: string
  endTime?: string
}

type Candidate = {
  _id: string
  _rev: string
  _createdAt: string
  dates?: ArrangementDate[]
  sourceTicketUrls?: string[]
}

export type DuplicateListing = {
  url: string
  title: string
  imageAssetId: string
  date: { startDate: string; startTime?: string; endTime?: string }
}

const normalizeTitle = (title: string) =>
  title.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()

const sortKey = (date: Pick<ArrangementDate, "startDate" | "startTime">) =>
  `${date.startDate}T${date.startTime ?? ""}`

function withinWindow(dates: ArrangementDate[] | undefined, startDate: string) {
  const target = Date.parse(startDate)
  return (dates ?? []).some(
    date =>
      Math.abs(Date.parse(date.startDate) - target) <=
      MERGE_WINDOW_DAYS * DAY_MS,
  )
}

/**
 * TicketCo lists each performance of a show as its own event, and every listing
 * re-encodes the same poster (new sha1, identical thumbHash). Fold such a
 * listing into the existing arrangement as an extra date instead of creating a
 * duplicate request. Returns the arrangement id it merged into, or null.
 */
export async function mergeDuplicateListing(
  client: SanityClient,
  listing: DuplicateListing,
): Promise<string | null> {
  const thumbHash = await client.fetch<string | null>(
    `*[_id == $asset][0].metadata.thumbHash`,
    { asset: listing.imageAssetId },
  )
  if (!thumbHash) return null
  const title = normalizeTitle(listing.title)
  // Raw perspective: published and draft versions are patched together.
  const candidates = (
    await client.fetch<(Candidate & { title?: string })[]>(
      `*[_type == "arrangement" && eventKind == "single" && approvalStatus != "rejected" && image.asset->metadata.thumbHash == $thumbHash]{_id, _rev, _createdAt, dates, sourceTicketUrls, "title": localizedTitle[language == "nb"][0].value}`,
      { thumbHash },
    )
  ).filter(
    candidate =>
      normalizeTitle(candidate.title ?? "") === title &&
      withinWindow(candidate.dates, listing.date.startDate),
  )
  if (!candidates.length) return null

  const baseId = (id: string) => id.replace(/^drafts\./, "")
  const oldest = candidates.reduce((a, b) =>
    a._createdAt <= b._createdAt ? a : b,
  )
  const target = baseId(oldest._id)
  const transaction = client.transaction()
  for (const doc of candidates.filter(c => baseId(c._id) === target)) {
    const dates = doc.dates ?? []
    const exists = dates.some(date => sortKey(date) === sortKey(listing.date))
    const merged = exists
      ? dates
      : [
          ...dates,
          {
            _key: nanoid(),
            _type: "arrangementDate" as const,
            startDate: listing.date.startDate,
            ...(listing.date.startTime
              ? { startTime: listing.date.startTime }
              : {}),
            ...(listing.date.endTime ? { endTime: listing.date.endTime } : {}),
          },
        ].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    transaction.patch(doc._id, patch =>
      patch
        .ifRevisionId(doc._rev)
        .set({ dates: merged })
        .setIfMissing({ sourceTicketUrls: [] })
        .append("sourceTicketUrls", [listing.url]),
    )
  }
  await transaction.commit()
  // The re-encoded poster is now unreferenced. Sanity refuses the delete if the
  // upload was deduplicated onto an asset that is still in use.
  await client.delete(listing.imageAssetId).catch(() => undefined)
  return target
}
