import "server-only"

import { dataset, projectId } from "@/lib/sanity/env"
import type { CampaignPeriod } from "../domain/statistics"

/*
 * Sanity only stores "Promotert på forsiden" as an on/off flag, so campaign
 * periods are rebuilt from the document's history: list its transactions,
 * read the published document at each revision, and note when the flag
 * changes. The read token may list transactions and read revisions, but not
 * transaction contents, hence one request per revision. Revisions never
 * change, so those responses are cached indefinitely.
 */

const HISTORY = `https://${projectId}.api.sanity.io/v2021-06-07/data/history/${dataset}`
const BATCH = 8

type Transaction = { id: string; timestamp: string }

async function historyFetch(
  path: string,
  cache: RequestInit & { next?: unknown },
) {
  const token = process.env.SANITY_API_READ_TOKEN
  if (!token) throw new Error("SANITY_API_READ_TOKEN is required for history")
  const response = await fetch(`${HISTORY}${path}`, {
    ...cache,
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Sanity history ${response.status}`)
  return response.text()
}

async function isPromotedAt(documentId: string, revision: string) {
  const body = await historyFetch(
    `/documents/${encodeURIComponent(documentId)}?revision=${encodeURIComponent(revision)}`,
    { cache: "force-cache" },
  )
  const [document] = (
    JSON.parse(body) as { documents?: { isPromoted?: unknown }[] }
  ).documents ?? [{}]
  return document?.isPromoted === true
}

/** Promotion periods for a document, oldest first; `null` if unknown. */
export async function fetchCampaignPeriods(
  documentId: string,
): Promise<CampaignPeriod[] | null> {
  try {
    const body = await historyFetch(
      `/transactions/${encodeURIComponent(documentId)}?excludeContent=true&limit=1000`,
      { next: { revalidate: 900 } },
    )
    const transactions = body
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line) as Transaction)

    const states: boolean[] = []
    for (let index = 0; index < transactions.length; index += BATCH) {
      const batch = transactions.slice(index, index + BATCH)
      states.push(
        ...(await Promise.all(
          batch.map(transaction => isPromotedAt(documentId, transaction.id)),
        )),
      )
    }

    const periods: CampaignPeriod[] = []
    let promoted = false
    transactions.forEach((transaction, index) => {
      if (states[index] === promoted) return
      promoted = states[index]
      if (promoted) periods.push({ from: transaction.timestamp, until: null })
      else if (periods.length)
        periods[periods.length - 1].until = transaction.timestamp
    })
    return periods
  } catch {
    return null
  }
}
