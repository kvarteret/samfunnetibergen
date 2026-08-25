import { stegaClean } from "@sanity/client/stega"

export type FetchOptions = {
  stega?: boolean
}

const osloDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Oslo",
  year: "numeric",
})

// Fetch helpers are the Sanity boundary. Keep route params, stega behavior, and
// frontend-friendly return shapes here so views do not re-parse raw responses.

/** Drop nullish entries, narrowing `(T | null | undefined)[]` to `T[]`. */
export function compact<T>(items: readonly (T | null | undefined)[]): T[] {
  return items.filter((item): item is T => item != null)
}

type CleanableOpeningHoursRow = {
  status?: string | null | undefined
  duration?: {
    start?: string | null | undefined
    end?: string | null | undefined
  } | null
}

/**
 * Strip draft-mode stega encoding from opening-hours rows. In draft mode
 * `sanityFetch` can return editable strings stega-encoded (invisible
 * characters appended), which breaks `timeToMinutes()` and `status === "closed"`
 * in `@/lib/opening-hours`. Cleaning here keeps display strings encoded for
 * Visual Editing while domain logic sees plain values.
 */
function cleanOpeningHoursRows<T extends CleanableOpeningHoursRow | null>(
  rows: T[] | null | undefined,
): T[] | null | undefined {
  if (!rows) return rows
  return rows.map(row => {
    if (!row) return row
    const logicFields = stegaClean({
      status: row.status,
      duration: row.duration,
    })
    return {
      ...row,
      ...logicFields,
    } as T
  })
}

/** Apply `cleanOpeningHoursRows` to an `openingHours`-shaped object. */
export function cleanOpeningHours<
  T extends { rows?: CleanableOpeningHoursRow[] | null } | null | undefined,
>(hours: T): T {
  if (!hours) return hours
  return { ...hours, rows: cleanOpeningHoursRows(hours.rows) } as T
}

/** Keep only records whose given keys are non-null, narrowing those keys. */
export function withRequiredKeys<T, K extends keyof T>(
  items: readonly T[],
  ...keys: K[]
): Array<T & { [P in K]-?: NonNullable<T[P]> }> {
  return items.filter((item): item is T & { [P in K]-?: NonNullable<T[P]> } =>
    keys.every(key => item[key] != null),
  )
}

export function getOsloDateString(): string {
  return osloDateFormatter.format(new Date())
}
