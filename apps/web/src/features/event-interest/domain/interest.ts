export const FULL_HEART_TAPS = 12
export const MAX_BATCH_CLICKS = 1000
export const RETENTION_SECONDS = 90 * 24 * 60 * 60

export type InterestState = { taps: number; count: number }
export type ClickBatch = { clicks: number; batch_id: string }

export function interestLevel(taps: number): 0 | 1 | 2 | 3 {
  if (taps >= 8) return 3
  if (taps >= 4) return 2
  if (taps > 0) return 1
  return 0
}

export function validClicks(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_BATCH_CLICKS
  )
}

export function validBatchId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      value,
    )
  )
}

export function validInterest(value: unknown): value is InterestState {
  if (
    !value ||
    typeof value !== "object" ||
    !("taps" in value) ||
    !("count" in value)
  )
    return false
  return (
    typeof value.taps === "number" &&
    Number.isSafeInteger(value.taps) &&
    value.taps >= 0 &&
    typeof value.count === "number" &&
    Number.isSafeInteger(value.count) &&
    value.count >= value.taps
  )
}
