export const MAX_TAPS = 12
export const RETENTION_SECONDS = 90 * 24 * 60 * 60

export type InterestState = { taps: number; score: number }

export function interestLevel(taps: number): 0 | 1 | 2 | 3 {
  if (taps >= 8) return 3
  if (taps >= 4) return 2
  if (taps > 0) return 1
  return 0
}

export function interestWeight(taps: number): number {
  return [0, 0.25, 0.75, 1][interestLevel(taps)]
}

export function validTaps(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_TAPS
  )
}
