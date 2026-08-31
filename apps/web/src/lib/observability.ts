import {
  type Attributes,
  context,
  propagation,
  type Span,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api"
import { logs, SeverityNumber } from "@opentelemetry/api-logs"

const tracer = trace.getTracer("samfunnetibergen")
const logger = logs.getLogger("samfunnetibergen")

const ALLOWED_FIELDS = new Set([
  "booking_submission_id",
  "crescat_http_status",
  "duration_ms",
  "error_category",
  "failure_stage",
  "origin_trace_id",
  "outcome",
  "registration_id",
  "span_id",
  "status",
  "trace_id",
])

export type OperationalField = boolean | number | string | undefined

const SENSITIVE_VALUE =
  /(?:[\w.%+-]+@[\w.-]+\.[a-z]{2,}|bearer\s+\S+|[?&](?:token|code|email|authorization)=|\/apply\/[a-z0-9_-]{8,})/i

function sanitizeFieldValue(value: Exclude<OperationalField, undefined>) {
  if (typeof value === "string" && SENSITIVE_VALUE.test(value)) {
    return "[redacted]"
  }
  return value
}

export function currentTraceFields(): {
  trace_id?: string
  span_id?: string
} {
  const spanContext = trace.getActiveSpan()?.spanContext()
  if (!spanContext || !trace.isSpanContextValid(spanContext)) return {}
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  }
}

export function injectActiveTraceContext(
  headers: Record<string, string>,
): void {
  propagation.inject(context.active(), headers)
}

export function emitOperationalEvent(
  event: string,
  fields: Record<string, OperationalField> = {},
): void {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    body: SENSITIVE_VALUE.test(event) ? "[redacted]" : event,
    attributes: buildOperationalAttributes(event, fields),
  })
}

export function buildOperationalAttributes(
  event: string,
  fields: Record<string, OperationalField> = {},
): Attributes {
  const attributes: Attributes = {
    service: "samfunnetibergen",
    event: SENSITIVE_VALUE.test(event) ? "[redacted]" : event,
    ...currentTraceFields(),
  }

  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.has(key) && value !== undefined) {
      attributes[key] = sanitizeFieldValue(value)
    }
  }

  return attributes
}

export async function withOperationalSpan<T>(
  name: string,
  run: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async span => {
    try {
      return await run(span)
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}
