/*
 * Remembers which surface (front page, events list, calendar, …) a visitor
 * clicked an event from, so the event page view and its ticket and Facebook
 * clicks can say where the visit came from. Kept per browser tab for a short
 * while; storage can be unavailable, in which case attribution is skipped.
 */

const STORAGE_KEY = "event-placement-entries"
const TTL_MS = 30 * 60 * 1000

type Entry = { surface: string; at: number }
type Entries = Record<string, Entry>

function read(storage: Storage | undefined): Entries {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "{}")
    return parsed && typeof parsed === "object" ? (parsed as Entries) : {}
  } catch {
    return {}
  }
}

function browserStorage() {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage
  } catch {
    return undefined
  }
}

export function rememberEntrySurface(
  keys: ReadonlyArray<string | undefined>,
  surface: string | undefined,
  now = Date.now(),
  storage = browserStorage(),
) {
  if (!surface || !storage) return
  const entries = read(storage)
  for (const [key, entry] of Object.entries(entries)) {
    if (now - entry.at > TTL_MS) delete entries[key]
  }
  for (const key of keys) {
    if (key) entries[key] = { surface, at: now }
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Attribution is best effort.
  }
}

/** The surface the visitor came from for this event, if recent. */
export function entrySurface(
  keys: ReadonlyArray<string | null | undefined>,
  now = Date.now(),
  storage = browserStorage(),
): string | undefined {
  const entries = read(storage)
  for (const key of keys) {
    const entry = key ? entries[key] : undefined
    if (entry && now - entry.at <= TTL_MS) return entry.surface
  }
  return undefined
}
