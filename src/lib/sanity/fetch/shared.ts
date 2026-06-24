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
