import type { CaptureResult } from "posthog-js"
import { describe, expect, it } from "vitest"
import { dropDocumentUrlExceptions } from "./exception-filter"

const DOCUMENT_URL = "https://www.samfunnetibergen.no/en/arrangementer"

function frame(filename: string) {
  return {
    platform: "web:javascript",
    filename,
    function: "?",
    in_app: true,
    lineno: 17,
    colno: 6324,
  }
}

function exceptionEvent(
  exceptionList: unknown,
  event = "$exception",
): CaptureResult {
  return {
    uuid: "01a07401-a88c-7562-9a8a-e4675849e434",
    event,
    properties: { $exception_list: exceptionList },
  }
}

function throwing(...filenames: string[]) {
  return [
    {
      type: "TypeError",
      value: "undefined is not an object",
      mechanism: { handled: false, synthetic: false, type: "generic" },
      stacktrace: { type: "raw", frames: filenames.map(frame) },
    },
  ]
}

describe("dropDocumentUrlExceptions", () => {
  it.each([
    "https://www.samfunnetibergen.no/en/rom/halvtimen",
    "https://www.samfunnetibergen.no/nb/grupper",
    "https://www.samfunnetibergen.no/nb/arrangementer/electric-eye-1787681708816",
    "https://www.samfunnetibergen.no/en/arrangementer?utm_source=ig",
  ])("drops an exception thrown from the document at %s", filename => {
    const event = exceptionEvent(throwing(filename))

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBeNull()
  })

  it("drops stack-overflow variants where the document frame repeats", () => {
    const document = "https://www.samfunnetibergen.no/nb"
    const event = exceptionEvent(
      throwing(...Array.from({ length: 40 }, () => document)),
    )

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBeNull()
  })

  it.each([
    "https://www.samfunnetibergen.no/_next/static/chunks/0gqayfy338c8i.js",
    "https://www.samfunnetibergen.no/_next/static/chunks/2ejk.js?dpl=dpl_93sx",
    "https://www.samfunnetibergen.no/ingest/static/exception-autocapture.js?v=1.396.8",
  ])("keeps an exception thrown from the bundle at %s", filename => {
    const event = exceptionEvent(throwing(filename))

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("keeps an exception with a single application frame below document frames", () => {
    const event = exceptionEvent(
      throwing(
        "https://www.samfunnetibergen.no/nb/rom/book",
        "https://www.samfunnetibergen.no/_next/static/chunks/0gqayfy338c8i.js",
      ),
    )

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("keeps an exception thrown from another origin", () => {
    const event = exceptionEvent(
      throwing("iabjs://navigation_performance_logger_android"),
    )

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("keeps an exception with no frames", () => {
    const event = exceptionEvent([
      {
        type: "Error",
        value: "Script error.",
        stacktrace: { type: "raw", frames: [] },
      },
    ])

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("keeps an exception with no stack trace at all", () => {
    const event = exceptionEvent([{ type: "Error", value: "Script error." }])

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("keeps a chained exception when only one link is a document frame", () => {
    const event = exceptionEvent([
      ...throwing("https://www.samfunnetibergen.no/nb/grupper"),
      { type: "Error", value: "cause" },
    ])

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it.each([
    undefined,
    null,
    "not-a-list",
    [],
  ])("keeps an exception with an unusable $exception_list (%s)", exceptionList => {
    const event = exceptionEvent(exceptionList)

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("keeps a frame with a non-URL filename", () => {
    const event = exceptionEvent(throwing("[native code]"))

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("leaves events other than $exception untouched", () => {
    const event = exceptionEvent(
      throwing("https://www.samfunnetibergen.no/nb/grupper"),
      "$pageview",
    )

    expect(dropDocumentUrlExceptions(event, DOCUMENT_URL)).toBe(event)
  })

  it("passes through a null event", () => {
    expect(dropDocumentUrlExceptions(null, DOCUMENT_URL)).toBeNull()
  })

  it("keeps the event when the document has an opaque origin", () => {
    const event = exceptionEvent(
      throwing("https://www.samfunnetibergen.no/nb/grupper"),
    )

    expect(dropDocumentUrlExceptions(event, "about:srcdoc")).toBe(event)
  })
})
