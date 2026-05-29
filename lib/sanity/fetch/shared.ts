export type FetchOptions = {
    stega?: boolean
}

// Sanity returns required fields as `T | null` because drafts (rendered via
// Visual Editing) are allowed to be in an invalid state. These helpers parse
// that wide shape into a narrow one once, at the fetch boundary, so view
// components never re-check schema-required fields.

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
    return new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Europe/Oslo",
        year: "numeric",
    }).format(new Date())
}
