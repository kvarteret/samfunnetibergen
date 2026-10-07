import { placementProperties } from "./event-placement"
import { rememberEntrySurface } from "./placement-entry"

const SELECTOR = "a[data-event-id][data-event-surface]"

/**
 * Surfaces where every event card counts as seen, not only promoted ones.
 * Seen cards are batched into one `event_placements_seen` per surface instead
 * of one event per card, which keeps volume close to one event per page view.
 */
export const BATCHED_SURFACES = new Set([
  "home-promoted",
  "home-upcoming",
  "events-list",
  "calendar",
])
const BATCH_DELAY_MS = 3000

export function observeEventPlacements(
  root: Document,
  locale: string,
  capture: (name: string, properties: Record<string, unknown>) => void,
) {
  const viewed = new Set<string>()
  const seen = new Set<string>()
  const pending = new Map<string, Map<string, HTMLElement>>()
  let flushTimer: ReturnType<typeof setTimeout> | undefined
  const watched = new Set<HTMLElement>()
  const visible = new Set<HTMLElement>()
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>()

  const isPromoted = (element: HTMLElement) =>
    element.dataset.eventPromoted === "true"
  const batchKey = (element: HTMLElement) => {
    const surface = element.dataset.eventSurface
    const documentId = element.dataset.eventDocumentId
    return surface && documentId && BATCHED_SURFACES.has(surface)
      ? `${surface}:${documentId}`
      : undefined
  }
  const isTracked = (element: HTMLElement) =>
    isPromoted(element) || batchKey(element) !== undefined

  const flush = () => {
    clearTimeout(flushTimer)
    flushTimer = undefined
    for (const [surface, elements] of pending) {
      const cards = [...elements.values()]
      if (!cards.length) continue
      const { placement_name } = placementProperties(cards[0], locale)
      capture("event_placements_seen", {
        surface,
        placement_name,
        locale,
        event_document_ids: cards.map(card => card.dataset.eventDocumentId),
        event_ids: cards.map(card => card.dataset.eventId),
        count: cards.length,
        tracking_version: 1,
      })
    }
    pending.clear()
  }
  const addToBatch = (element: HTMLElement, key: string) => {
    seen.add(key)
    const surface = element.dataset.eventSurface as string
    const batch = pending.get(surface) ?? new Map<string, HTMLElement>()
    batch.set(key, element)
    pending.set(surface, batch)
    clearTimeout(flushTimer)
    flushTimer = setTimeout(flush, BATCH_DELAY_MS)
  }

  const cancel = (element: HTMLElement) => {
    clearTimeout(timers.get(element))
    timers.delete(element)
  }
  const start = (element: HTMLElement) => {
    const placementKey = element.dataset.eventPlacementId
    const single =
      isPromoted(element) && placementKey && !viewed.has(placementKey)
    const key = batchKey(element)
    const batched = key !== undefined && !seen.has(key)
    if ((!single && !batched) || timers.has(element) || root.hidden) return
    const properties = placementProperties(element, locale)
    timers.set(
      element,
      setTimeout(() => {
        timers.delete(element)
        if (!element.isConnected || root.hidden || !visible.has(element)) return
        if (single && placementKey) {
          viewed.add(placementKey)
          capture("event_placement_viewed", properties)
        }
        if (batched && key) addToBatch(element, key)
      }, 1000),
    )
  }
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          visible.add(element)
          start(element)
        } else {
          visible.delete(element)
          cancel(element)
        }
      }
    },
    { threshold: [0, 0.5] },
  )
  const scan = () => {
    for (const element of watched) {
      if (!element.isConnected) {
        observer.unobserve(element)
        cancel(element)
        watched.delete(element)
        visible.delete(element)
      }
    }
    root.querySelectorAll<HTMLElement>(SELECTOR).forEach(element => {
      if (isTracked(element) && !watched.has(element)) {
        watched.add(element)
        observer.observe(element)
      }
    })
  }
  const mutations = new MutationObserver(scan)
  mutations.observe(root.body, { childList: true, subtree: true })
  const click = (event: MouseEvent) => {
    if (event.type === "auxclick" ? event.button !== 1 : event.button !== 0)
      return
    const element =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(SELECTOR)
        : null
    if (!element) return
    rememberEntrySurface(
      [element.dataset.eventDocumentId, element.dataset.eventSlug],
      element.dataset.eventSurface,
    )
    capture("event_placement_clicked", {
      ...placementProperties(element, locale),
      interaction:
        event.type === "auxclick"
          ? "middle_click"
          : event.detail === 0
            ? "keyboard"
            : "click",
    })
  }
  const visibility = () => {
    if (root.hidden) flush()
    for (const element of visible) {
      if (root.hidden) cancel(element)
      else start(element)
    }
  }
  root.addEventListener("click", click, true)
  root.addEventListener("auxclick", click, true)
  root.addEventListener("visibilitychange", visibility)
  root.defaultView?.addEventListener("pagehide", flush)
  scan()
  return () => {
    flush()
    observer.disconnect()
    mutations.disconnect()
    timers.forEach(timer => {
      clearTimeout(timer)
    })
    root.removeEventListener("click", click, true)
    root.removeEventListener("auxclick", click, true)
    root.removeEventListener("visibilitychange", visibility)
    root.defaultView?.removeEventListener("pagehide", flush)
  }
}
