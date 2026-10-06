import type { CaptureResult } from "posthog-js"
import { afterEach, expect, it, vi } from "vitest"
import { isTrackingExcluded, prepareBrowserEvent } from "./tracking-exclusions"

afterEach(() => vi.unstubAllGlobals())

it.each([
  "/infoskjerm",
  "/infoskjerm/?message=test",
  "https://www.samfunnetibergen.no/infoskjerm?message=test",
  "https://samfunnetibergen-samfunnetibergen.vercel.app/en",
])("excludes %s", url => {
  expect(isTrackingExcluded(url)).toBe(true)
})

it.each([undefined, "/nb", "/infoskjerm-guide", "/nb/rom/book"])(
  "keeps tracking for %s",
  url => {
    expect(isTrackingExcluded(url)).toBe(false)
  },
)

it.each([
  "$pageview",
  "$pageleave",
  "$web_vitals",
  "$autocapture",
  "$snapshot",
  "$exception",
])("drops %s after navigating to infoskjerm", eventName => {
  vi.stubGlobal("window", {
    location: new URL("https://www.samfunnetibergen.no/infoskjerm"),
  })
  const event = {
    uuid: "test",
    event: eventName,
    properties: {},
  } as CaptureResult
  expect(prepareBrowserEvent(event)).toBeNull()
})

it("drops delayed infoskjerm events after navigating away", () => {
  vi.stubGlobal("window", {
    location: new URL("https://www.samfunnetibergen.no/nb"),
  })
  const event = {
    uuid: "test",
    event: "$web_vitals",
    properties: { $current_url: "https://www.samfunnetibergen.no/infoskjerm" },
  } as CaptureResult
  expect(prepareBrowserEvent(event)).toBeNull()
})

it("retains public page events", () => {
  vi.stubGlobal("window", {
    location: new URL("https://www.samfunnetibergen.no/nb"),
  })
  const event = {
    uuid: "test",
    event: "$pageview",
    properties: {},
  } as CaptureResult
  expect(prepareBrowserEvent(event)).toEqual(event)
})

it("retains only one promoted event exposure per session and surface", () => {
  const storage = new Map<string, string>()
  vi.stubGlobal("window", {
    location: new URL("https://www.samfunnetibergen.no/nb"),
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })
  const event = {
    uuid: "exposure",
    event: "event_placement_viewed",
    properties: {
      is_promoted: true,
      event_document_id: "snooks",
      surface: "home-promoted",
      $session_id: "session-one",
    },
  } as CaptureResult
  expect(prepareBrowserEvent(event)).toEqual(event)
  expect(prepareBrowserEvent(event)).toBeNull()
  const otherSurface = {
    ...event,
    properties: { ...event.properties, surface: "events-list" },
  }
  expect(prepareBrowserEvent(otherSurface)).toEqual(otherSurface)
  const nextSession = {
    ...event,
    properties: { ...event.properties, $session_id: "session-two" },
  }
  expect(prepareBrowserEvent(nextSession)).toEqual(nextSession)
  storage.set(
    "promotion-exposures",
    JSON.stringify({
      session: "restored-session",
      keys: [JSON.stringify(["snooks", "home-promoted"])],
    }),
  )
  expect(
    prepareBrowserEvent({
      ...event,
      properties: { ...event.properties, $session_id: "restored-session" },
    }),
  ).toBeNull()
  expect(
    prepareBrowserEvent({
      ...event,
      properties: { ...event.properties, is_promoted: false },
    }),
  ).toBeNull()
})
