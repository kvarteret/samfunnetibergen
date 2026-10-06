import { placementProperties } from "./event-placement"

const SELECTOR = "a[data-event-id][data-event-surface]"

export function observeEventPlacements(
  root: Document,
  locale: string,
  capture: (name: string, properties: Record<string, unknown>) => void,
) {
  const viewed = new Set<string>()
  const watched = new Set<HTMLElement>()
  const visible = new Set<HTMLElement>()
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>()
  const cancel = (element: HTMLElement) => {
    clearTimeout(timers.get(element))
    timers.delete(element)
  }
  const start = (element: HTMLElement) => {
    const key = element.dataset.eventPlacementId
    if (!key || viewed.has(key) || timers.has(element) || root.hidden) return
    const properties = placementProperties(element, locale)
    timers.set(
      element,
      setTimeout(() => {
        timers.delete(element)
        if (!element.isConnected || root.hidden || !visible.has(element)) return
        viewed.add(key)
        capture("event_placement_viewed", properties)
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
      if (!watched.has(element)) {
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
    if (element)
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
    for (const element of visible) {
      if (root.hidden) cancel(element)
      else start(element)
    }
  }
  root.addEventListener("click", click, true)
  root.addEventListener("auxclick", click, true)
  root.addEventListener("visibilitychange", visibility)
  scan()
  return () => {
    observer.disconnect()
    mutations.disconnect()
    timers.forEach(timer => {
      clearTimeout(timer)
    })
    root.removeEventListener("click", click, true)
    root.removeEventListener("auxclick", click, true)
    root.removeEventListener("visibilitychange", visibility)
  }
}
