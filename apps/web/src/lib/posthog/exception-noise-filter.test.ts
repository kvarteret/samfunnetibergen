import { describe, expect, it } from "vitest"
import type { CaptureResult } from "posthog-js"
import { filterExceptionNoise } from "./exception-noise-filter"

function exceptionEvent(
  exceptions: Array<{ type?: string; value?: string }>,
): CaptureResult {
  return {
    uuid: "test-uuid",
    event: "$exception",
    properties: {
      $exception_list: exceptions,
      $exception_types: exceptions.map(e => e.type ?? ""),
      $exception_values: exceptions.map(e => e.value ?? ""),
    },
  }
}

describe("filterExceptionNoise", () => {
  it("drops ResizeObserver loop errors", () => {
    expect(
      filterExceptionNoise(
        exceptionEvent([
          {
            type: "Error",
            value: "ResizeObserver loop completed with undelivered notifications.",
          },
        ]),
      ),
    ).toBeNull()
  })

  it("drops minified React hydration error #418", () => {
    expect(
      filterExceptionNoise(
        exceptionEvent([
          {
            type: "Error",
            value: "Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message.",
          },
        ]),
      ),
    ).toBeNull()
  })

  it("drops DOMException removeChild races", () => {
    expect(
      filterExceptionNoise(
        exceptionEvent([
          {
            type: "DOMException",
            value: "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
          },
        ]),
      ),
    ).toBeNull()
  })

  it("drops the SCDynimacBridge browser-extension ReferenceError", () => {
    expect(
      filterExceptionNoise(
        exceptionEvent([
          { type: "ReferenceError", value: "Can't find variable: SCDynimacBridge" },
        ]),
      ),
    ).toBeNull()
  })

  it("drops ingest network failures", () => {
    expect(
      filterExceptionNoise(
        exceptionEvent([{ type: "TypeError", value: "network error" }]),
      ),
    ).toBeNull()
    expect(
      filterExceptionNoise(
        exceptionEvent([{ type: "TypeError", value: "Load failed" }]),
      ),
    ).toBeNull()
  })

  it("keeps a real unhandled TypeError", () => {
    const event = exceptionEvent([{ type: "TypeError", value: "o is not a function" }])
    expect(filterExceptionNoise(event)).toBe(event)
  })

  it("keeps events that mix a noise exception with a real one", () => {
    const event = exceptionEvent([
      { type: "Error", value: "ResizeObserver loop completed with undelivered notifications." },
      { type: "TypeError", value: "o is not a function" },
    ])
    expect(filterExceptionNoise(event)).toBe(event)
  })

  it("leaves non-exception events untouched", () => {
    const event: CaptureResult = {
      uuid: "test-uuid",
      event: "pageview",
      properties: {},
    }
    expect(filterExceptionNoise(event)).toBe(event)
  })

  it("passes through null events", () => {
    expect(filterExceptionNoise(null)).toBeNull()
  })
})
