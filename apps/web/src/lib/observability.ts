import { randomUUID } from "node:crypto"
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
const RECOVERABLE_BOOKING_FAILURE_STAGES = new Set([
  "network",
  "crescat_timeout",
  "crescat_session",
  "rate_limit",
])

const ALLOWED_FIELDS = new Set([
  "event_id",
  "schema_version",
  "occurred_at",
  "environment",
  "service",
  "booking_submission_id",
  "domain_event_id",
  "booking_kind",
  "source",
  "provider_http_status",
  "crescat_http_status",
  "duration_ms",
  "error_category",
  "failure_stage",
  "reason_code",
  "origin_trace_id",
  "outcome",
  "registration_id",
  "span_id",
  "status",
  "status_code",
  "trace_id",
])

const EVENT_CATALOG = {
  "booking.request.accepted": {
    message: "Booking request accepted by Crescat",
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
  },
  "booking.request.rejected": {
    message: "Booking request rejected by business rules",
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
  },
  "booking.request.failed": {
    message: "Booking request could not be submitted",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
  },
  "booking.request.outcome_unknown": {
    message: "Booking request outcome could not be confirmed",
    severityNumber: SeverityNumber.WARN,
    severityText: "WARN",
  },
  "volunteer.prospect.forwarded": {
    message: "Volunteer prospect forwarded to Personal",
    severityNumber: SeverityNumber.DEBUG,
    severityText: "DEBUG",
  },
  "public.events.fetch.failed": {
    message: "Public event collection unavailable",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
  },
  "feedback.forward.failed": {
    message: "Feedback forwarding failed",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
  },
  "slack.feedback.failed": {
    message: "Slack feedback delivery failed",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
  },
} as const

function eventMessage(
  event: string,
  fields: Record<string, OperationalField>,
  fallback: string,
): string {
  if (!event.startsWith("booking.request.")) return fallback
  const kind = fields.booking_kind === "karaoke" ? "Karaoke" : "Room"
  if (event.endsWith("accepted")) {
    return `${kind} booking request accepted by Crescat`
  }
  if (event.endsWith("rejected")) {
    const reason =
      fields.reason_code === "opening_hours"
        ? "time unavailable"
        : fields.reason_code === "calendar_conflict"
          ? "time conflicts with an existing booking"
          : "business rules"
    return `${kind} booking request rejected: ${reason}`
  }
  if (event.endsWith("outcome_unknown")) {
    return `${kind} booking request outcome could not be confirmed`
  }
  return `${kind} booking request could not be submitted`
}

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
  const definition = EVENT_CATALOG[event as keyof typeof EVENT_CATALOG]
  if (!definition) return
  const severityNumber =
    event === "booking.request.failed" &&
    RECOVERABLE_BOOKING_FAILURE_STAGES.has(String(fields.failure_stage))
      ? SeverityNumber.WARN
      : definition.severityNumber
  const severityText =
    severityNumber === SeverityNumber.WARN ? "WARN" : definition.severityText
  const eventFields = {
    schema_version: 1,
    event_id: randomUUID(),
    occurred_at: new Date().toISOString(),
    service: "samfunnetibergen",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    outcome: "success",
    ...fields,
  }
  try {
    logger.emit({
      severityNumber,
      severityText,
      body: eventMessage(event, eventFields, definition.message),
      attributes: buildOperationalAttributes(event, eventFields),
    })
  } catch {
    // Operational telemetry is a projection and must not change the request.
  }
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
