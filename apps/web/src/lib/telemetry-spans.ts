import type { Attributes } from "@opentelemetry/api"
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"

function safeText(value: string): string {
  return value.replace(/[?#][^\s]*/g, "?[redacted]")
    .replace(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi, "[redacted-email]")
    .replace(/bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(\/(?:apply|set-password)\/)[^/\s]+/gi, "$1[redacted]")
}

export function sanitizeSpan(span: ReadableSpan): ReadableSpan {
  const attributes: Attributes = {}
  for (const [key, value] of Object.entries(span.attributes)) {
    if (/header|cookie|authorization|password|token|body|statement|user_agent|referer|exception\.(message|stacktrace)/i.test(key)) continue
    attributes[key] = typeof value === "string" ? safeText(value) :
      Array.isArray(value) ? value.map(item => typeof item === "string" ? safeText(item) : item) as typeof value : value
  }
  return {
    spanContext: () => span.spanContext(),
    kind: span.kind, parentSpanContext: span.parentSpanContext,
    startTime: span.startTime, endTime: span.endTime, duration: span.duration,
    ended: span.ended, resource: span.resource, instrumentationScope: span.instrumentationScope,
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount + span.events.length,
    droppedLinksCount: span.droppedLinksCount,
    name: safeText(span.name), attributes,
    status: { code: span.status.code },
    // Exception event payloads and link attributes can contain arbitrary input.
    events: [], links: span.links.map(link => ({ context: link.context })),
  }
}

export function withSanitizedSpans(exporter: SpanExporter): SpanExporter {
  return {
    export: (spans, callback) => exporter.export(spans.map(sanitizeSpan), callback),
    shutdown: () => exporter.shutdown(),
    forceFlush: () => exporter.forceFlush?.() ?? Promise.resolve(),
  }
}
