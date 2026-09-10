import { randomUUID } from "node:crypto"
import {
  type Attributes,
  context,
  metrics,
  propagation,
  type Span,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api"
import { logs, SeverityNumber } from "@opentelemetry/api-logs"

const tracer = trace.getTracer("samfunnetibergen")
const logger = logs.getLogger("samfunnetibergen")
const failureCounter = metrics
  .getMeter("samfunnetibergen")
  .createCounter("telemetry.projection.failures")
const diagnosticCounters = new Map<string, number>()
const MAX_DIAGNOSTIC_COUNTER_KEYS = 32
const MAX_STRING_FIELD_LENGTH = 512
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

const ALLOWED_OUTCOMES = new Set([
  "accepted",
  "rejected",
  "failed",
  "outcome_unknown",
  "success",
  "failure",
])
const ENVELOPE_FIELDS = new Set([
  "event_id",
  "schema_version",
  "occurred_at",
  "environment",
  "service",
  "outcome",
])
const EVENT_FIELDS: Record<string, Set<string>> = {
  "booking.request.accepted": new Set([
    "booking_submission_id",
    "domain_event_id",
    "booking_kind",
    "source",
    "provider_http_status",
    "duration_ms",
  ]),
  "booking.request.rejected": new Set([
    "booking_submission_id",
    "domain_event_id",
    "booking_kind",
    "source",
    "reason_code",
    "failure_stage",
    "duration_ms",
  ]),
  "booking.request.failed": new Set([
    "booking_submission_id",
    "domain_event_id",
    "booking_kind",
    "source",
    "failure_stage",
    "reason_code",
    "duration_ms",
    "provider_http_status",
  ]),
  "booking.request.outcome_unknown": new Set([
    "booking_submission_id",
    "domain_event_id",
    "booking_kind",
    "source",
    "failure_stage",
    "reason_code",
    "duration_ms",
    "provider_http_status",
  ]),
  "volunteer.prospect.forwarded": new Set(["registration_id"]),
  "public.events.fetch.failed": new Set(["failure_stage", "error_category"]),
  "feedback.forward.failed": new Set([
    "failure_stage",
    "error_category",
    "status_code",
  ]),
  "slack.feedback.failed": new Set([
    "failure_stage",
    "error_category",
    "status_code",
  ]),
}
const EVENT_FIELD_VALUES: Record<string, Record<string, Set<string>>> = {
  "booking.request.accepted": {
    booking_kind: new Set(["room", "karaoke"]),
    source: new Set(["server"]),
  },
  "booking.request.rejected": {
    booking_kind: new Set(["room", "karaoke"]),
    source: new Set(["server"]),
    reason_code: new Set(["opening_hours", "calendar_conflict"]),
  },
  "booking.request.failed": {
    booking_kind: new Set(["room", "karaoke"]),
    source: new Set(["server"]),
    failure_stage: new Set([
      "schema_validation",
      "normalized_payload",
      "rate_limit",
      "crescat_response",
      "crescat_session",
      "crescat_timeout",
      "crescat_outcome_unknown",
      "network",
      "unexpected",
    ]),
  },
  "booking.request.outcome_unknown": {
    booking_kind: new Set(["room", "karaoke"]),
    source: new Set(["server"]),
  },
}

const EVENT_CATALOG = {
  "booking.request.accepted": {
    message: "Booking request accepted by Crescat",
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    defaultOutcome: "accepted",
  },
  "booking.request.rejected": {
    message: "Booking request rejected by business rules",
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    defaultOutcome: "rejected",
  },
  "booking.request.failed": {
    message: "Booking request could not be submitted",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
    defaultOutcome: "failed",
  },
  "booking.request.outcome_unknown": {
    message: "Booking request outcome could not be confirmed",
    severityNumber: SeverityNumber.WARN,
    severityText: "WARN",
    defaultOutcome: "outcome_unknown",
  },
  "volunteer.prospect.forwarded": {
    message: "Volunteer prospect forwarded to Personal",
    severityNumber: SeverityNumber.DEBUG,
    severityText: "DEBUG",
    defaultOutcome: "success",
  },
  "public.events.fetch.failed": {
    message: "Public event collection unavailable",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
    defaultOutcome: "failure",
  },
  "feedback.forward.failed": {
    message: "Feedback forwarding failed",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
    defaultOutcome: "failure",
  },
  "slack.feedback.failed": {
    message: "Slack feedback delivery failed",
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
    defaultOutcome: "failure",
  },
} as const

export function recordDiagnostic(kind: string): void {
  const key =
    !diagnosticCounters.has(kind) &&
    diagnosticCounters.size >= MAX_DIAGNOSTIC_COUNTER_KEYS
      ? "other"
      : kind
  diagnosticCounters.set(key, (diagnosticCounters.get(key) ?? 0) + 1)
  try {
    failureCounter.add(1, { reason: key })
  } catch {
    /* no recursive export */
  }
}

export function diagnosticCounts(): Record<string, number> {
  return Object.fromEntries(diagnosticCounters)
}

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

export function prepareOperationalEvent(
  event: string,
  fields: Record<string, OperationalField> = {},
): {
  event: string
  fields: Readonly<Record<string, OperationalField>>
} | null {
  const definition = EVENT_CATALOG[event as keyof typeof EVENT_CATALOG]
  if (!definition) {
    recordDiagnostic("unknown_event")
    return null
  }
  for (const [key, value] of Object.entries(fields)) {
    const expected =
      key === "schema_version"
        ? 1
        : key === "service"
          ? "samfunnetibergen"
          : key === "environment"
            ? (process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown")
            : key === "outcome"
              ? definition.defaultOutcome
              : undefined
    if (expected !== undefined && value !== expected) {
      recordDiagnostic("invalid_envelope")
      return null
    }
  }
  const eventFields = {
    ...fields,
    schema_version: 1,
    event_id: fields.event_id ?? randomUUID(),
    occurred_at: fields.occurred_at ?? new Date().toISOString(),
    service: "samfunnetibergen",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    outcome: definition.defaultOutcome,
  }
  if (!isValidOperationalFields(event, eventFields)) return null
  return Object.freeze({ event, fields: Object.freeze(eventFields) })
}

export function emitOperationalEvent(
  event: string,
  fields: Record<string, OperationalField> = {},
): void {
  const occurrence = prepareOperationalEvent(event, fields)
  if (!occurrence) return
  const definition = EVENT_CATALOG[event as keyof typeof EVENT_CATALOG]
  const severityNumber =
    event === "booking.request.failed" &&
    RECOVERABLE_BOOKING_FAILURE_STAGES.has(String(fields.failure_stage))
      ? SeverityNumber.WARN
      : definition.severityNumber
  try {
    logger.emit({
      severityNumber,
      severityText:
        severityNumber === SeverityNumber.WARN
          ? "WARN"
          : definition.severityText,
      body: eventMessage(event, occurrence.fields, definition.message),
      attributes: buildOperationalAttributes(event, occurrence.fields),
    })
  } catch {
    recordDiagnostic("sink_failure")
  }
}

function isValidOperationalFields(
  event: string,
  fields: Record<string, OperationalField>,
): boolean {
  let valid = true
  const required = event.startsWith("booking.request.")
    ? [
        "booking_kind",
        "booking_submission_id",
        ...(event === "booking.request.accepted"
          ? ["provider_http_status"]
          : []),
      ]
    : event === "volunteer.prospect.forwarded"
      ? ["registration_id"]
      : []
  for (const key of required) {
    if (fields[key] === undefined) {
      recordDiagnostic("missing_field")
      valid = false
    }
  }
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_FIELDS.has(key) || value === undefined) {
      if (!ALLOWED_FIELDS.has(key)) {
        recordDiagnostic("invalid_field")
        valid = false
      }
      continue
    }
    if (
      !ENVELOPE_FIELDS.has(key) &&
      !(EVENT_FIELDS[event]?.has(key) ?? false)
    ) {
      recordDiagnostic("invalid_field")
      valid = false
      continue
    }
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      recordDiagnostic("invalid_field")
      valid = false
      continue
    }
    const numeric = [
      "duration_ms",
      "status_code",
      "provider_http_status",
      "schema_version",
      "registration_id",
    ]
    if (
      (numeric.includes(key) &&
        (typeof value !== "number" || !Number.isFinite(value) || value < 0)) ||
      (!numeric.includes(key) && typeof value !== "string")
    ) {
      recordDiagnostic("invalid_field")
      valid = false
      continue
    }
    if (
      ["provider_http_status", "status_code"].includes(key) &&
      (!Number.isInteger(value) || Number(value) < 100 || Number(value) > 599)
    ) {
      recordDiagnostic("invalid_field")
      valid = false
    }
    const allowedValues = EVENT_FIELD_VALUES[event]?.[key]
    if (allowedValues && !allowedValues.has(String(value))) {
      recordDiagnostic("invalid_enum")
      valid = false
      continue
    }
    if (typeof value === "string" && value.length > MAX_STRING_FIELD_LENGTH) {
      recordDiagnostic("invalid_field")
      valid = false
    }
    if (key === "outcome" && !ALLOWED_OUTCOMES.has(String(value))) {
      recordDiagnostic("invalid_outcome")
      valid = false
    }
    if (
      key === "event_id" &&
      !/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(String(value))
    ) {
      recordDiagnostic("invalid_envelope")
      valid = false
    }
    if (
      key === "occurred_at" &&
      (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+]00:00)$/.test(String(value)) ||
        Number.isNaN(Date.parse(String(value))))
    ) {
      recordDiagnostic("invalid_envelope")
      valid = false
    }
  }
  return valid
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
      if (typeof value === "string" && value.length > MAX_STRING_FIELD_LENGTH) {
        recordDiagnostic("invalid_field")
        continue
      }
      attributes[key] = sanitizeFieldValue(value)
    } else if (value !== undefined) {
      recordDiagnostic("invalid_field")
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
