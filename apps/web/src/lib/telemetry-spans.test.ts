import { describe, expect, it } from "vitest"
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { withSanitizedSpans } from "./telemetry-spans"

describe("trace export privacy", () => {
  it("preserves correlation and timings while stripping credentials and arbitrary error payloads", async () => {
    const output = new InMemorySpanExporter()
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(withSanitizedSpans(output))],
    })
    const span = provider
      .getTracer("test")
      .startSpan("GET /api?csrf_token=sentinel-secret")
    span.setAttributes({
      "http.target": "/api?csrf_token=sentinel-secret",
      "http.request.header.authorization": "Bearer sentinel-secret",
      "http.status_code": 422,
      "http.route": "/api",
      "vercel.request_id": "request-123",
    })
    span.recordException(new Error("sentinel-secret"))
    span.end()
    await provider.forceFlush()
    const exported = output.getFinishedSpans()[0]
    expect(exported.spanContext()).toEqual(span.spanContext())
    expect(exported.attributes["http.status_code"]).toBe(422)
    expect(exported.attributes["vercel.request_id"]).toBe("request-123")
    expect(
      JSON.stringify({
        name: exported.name,
        attributes: exported.attributes,
        events: exported.events,
        status: exported.status,
      }),
    ).not.toContain("sentinel-secret")
    expect(exported.duration).toBeDefined()
    await provider.shutdown()
  })
})
