import type { CaptureResult } from "posthog-js"
import { afterEach, expect, it, vi } from "vitest"
import { isTrackingExcluded, prepareBrowserEvent } from "./tracking-exclusions"

afterEach(() => vi.unstubAllGlobals())

it.each([
  "/infoskjerm",
  "/infoskjerm/?message=test",
  "https://www.samfunnetibergen.no/infoskjerm?message=test",
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
