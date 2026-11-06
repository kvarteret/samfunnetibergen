// Contract between the website's Crescat request scan (writer) and Studio
// (reader). A check lives in its own private `crescatCheck.<arrangementId>`
// document so scans never touch an editor's revision or publish a draft.

/** found = green, maybe = orange, missing = red. */
export type CrescatCheckStatus = "found" | "maybe" | "missing"

export type CrescatCheckMatch = {
  title: string
  room: string
  start: string
  end: string
}

export type CrescatCheckDate = {
  _key: string
  date: string
  startTime?: string
  endTime?: string
  status: CrescatCheckStatus
  reason: string
  matches: CrescatCheckMatch[]
}

export type CrescatCheckDocument = {
  _id: string
  _type: "crescatCheck"
  arrangementId: string
  status: CrescatCheckStatus
  checkedAt: string
  /** What the check was computed from; Studio flags it stale on change. */
  fingerprint: string
  dates: CrescatCheckDate[]
}

export type CrescatCheckInput = {
  room?: { _ref?: string | null } | null
  dates?:
    | {
        startDate?: string | null
        startTime?: string | null
        endTime?: string | null
      }[]
    | null
}

export const CRESCAT_CHECK_LABELS: Record<CrescatCheckStatus, string> = {
  found: "Booking funnet i Crescat",
  maybe: "Mulig booking i Crescat",
  missing: "Ingen booking funnet i Crescat",
}

export function crescatCheckId(arrangementId: string): string {
  return `crescatCheck.${arrangementId.replace(/^drafts\./, "")}`
}

export function crescatCheckFingerprint(input: CrescatCheckInput): string {
  return JSON.stringify({
    room: input.room?._ref ?? null,
    dates: (input.dates ?? []).map(date => [
      date.startDate ?? null,
      date.startTime ?? null,
      date.endTime ?? null,
    ]),
  })
}

/** Worst-case roll-up: every date found → found, none → missing. */
export function overallCrescatStatus(
  statuses: CrescatCheckStatus[],
): CrescatCheckStatus {
  if (statuses.every(status => status === "found")) return "found"
  if (statuses.every(status => status === "missing")) return "missing"
  return "maybe"
}
