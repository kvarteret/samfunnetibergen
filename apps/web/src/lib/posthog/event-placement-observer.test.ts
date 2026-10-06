import { afterEach, describe, expect, it, vi } from "vitest"
import { observeEventPlacements } from "./event-placement-observer"

function setup() {
  vi.useFakeTimers()
  let intersect: (entries: unknown[]) => void = () => {}
  let mutate = () => {}
  class FakeElement {
    dataset = {
      eventId: "the-snooks",
      eventDocumentId: "doc1",
      eventSlug: "the-snooks",
      eventSurface: "home-promoted",
      eventPlacementId: "home:doc1",
      eventPromoted: "true",
      eventCampaignId: "campaign1",
    }
    isConnected = true
    closest() {
      return this
    }
  }
  vi.stubGlobal("Element", FakeElement)
  const observe = vi.fn()
  const disconnect = vi.fn()
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof intersect) {
        intersect = callback
      }
      observe = observe
      unobserve = vi.fn()
      disconnect = disconnect
    },
  )
  vi.stubGlobal(
    "MutationObserver",
    class {
      constructor(callback: typeof mutate) {
        mutate = callback
      }
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
  const element = new FakeElement()
  const elements = [element]
  const listeners = new Map<string, (event: unknown) => void>()
  const root = {
    hidden: false,
    body: {},
    querySelectorAll: () => elements,
    addEventListener: (name: string, callback: (event: unknown) => void) => {
      listeners.set(name, callback)
    },
    removeEventListener: (name: string) => {
      listeners.delete(name)
    },
  }
  const capture = vi.fn()
  const cleanup = observeEventPlacements(
    root as unknown as Document,
    "nb",
    capture,
  )
  return {
    element,
    elements,
    root,
    capture,
    cleanup,
    observe,
    disconnect,
    mutate: () => mutate(),
    visible: (ratio: number) =>
      intersect([
        {
          target: element,
          isIntersecting: ratio > 0,
          intersectionRatio: ratio,
        },
      ]),
    emit: (name: string, event = {}) => listeners.get(name)?.(event),
  }
}
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
describe("event placement observation", () => {
  it("requires continuous half visibility for a second and deduplicates re-entry", () => {
    const s = setup()
    s.visible(0.5)
    vi.advanceTimersByTime(900)
    expect(s.capture).not.toHaveBeenCalled()
    s.visible(0.4)
    vi.advanceTimersByTime(1000)
    expect(s.capture).not.toHaveBeenCalled()
    s.visible(0.5)
    vi.advanceTimersByTime(1000)
    expect(s.capture).toHaveBeenCalledWith(
      "event_placement_viewed",
      expect.objectContaining({
        event_id: "the-snooks",
        event_document_id: "doc1",
        surface: "home-promoted",
        promotion_campaign_id: "campaign1",
      }),
    )
    s.visible(0)
    s.visible(1)
    vi.advanceTimersByTime(2000)
    expect(s.capture).toHaveBeenCalledTimes(1)
    s.cleanup()
  })
  it("cancels exposure while hidden and cleans up pending captures", () => {
    const s = setup()
    s.visible(1)
    vi.advanceTimersByTime(500)
    s.root.hidden = true
    s.emit("visibilitychange")
    vi.advanceTimersByTime(2000)
    expect(s.capture).not.toHaveBeenCalled()
    s.root.hidden = false
    s.emit("visibilitychange")
    vi.advanceTimersByTime(900)
    s.cleanup()
    vi.advanceTimersByTime(2000)
    expect(s.capture).not.toHaveBeenCalled()
    expect(s.disconnect).toHaveBeenCalled()
  })
  it("tracks keyboard and middle clicks, ignores right clicks and observes dynamic links", () => {
    const s = setup()
    s.emit("click", { target: s.element, button: 0, detail: 0, type: "click" })
    s.emit("auxclick", {
      target: s.element,
      button: 1,
      detail: 1,
      type: "auxclick",
    })
    s.emit("auxclick", { target: s.element, button: 2, type: "auxclick" })
    expect(s.capture).toHaveBeenCalledTimes(2)
    expect(s.capture.mock.calls[0][1].interaction).toBe("keyboard")
    expect(s.capture.mock.calls[1][1].interaction).toBe("middle_click")
    s.elements.push({ ...s.element } as typeof s.element)
    s.mutate()
    expect(s.observe).toHaveBeenCalledTimes(2)
    s.cleanup()
  })
})
