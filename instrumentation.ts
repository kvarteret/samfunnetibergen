import type { Logger } from "@opentelemetry/api-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import type { LogRecordProcessor, SdkLogRecord } from "@opentelemetry/sdk-logs"
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import type { Instrumentation } from "next"
import {
  getPostHogDistinctIdFromCookie,
  getServerRequestExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"

/** Severity numbers: INFO=9, WARN=13, ERROR=17, FATAL=21 */
const INFO_SEVERITY = 9

/** Drop all records below INFO before reaching the exporter. */
class InfoAndAboveProcessor implements LogRecordProcessor {
  constructor(private delegate: LogRecordProcessor) {}
  onEmit(logRecord: SdkLogRecord): void {
    if ((logRecord.severityNumber ?? 0) >= INFO_SEVERITY) {
      this.delegate.onEmit(logRecord)
    }
  }
  shutdown(): Promise<void> {
    return this.delegate.shutdown()
  }
  forceFlush(): Promise<void> {
    return this.delegate.forceFlush()
  }
}

declare global {
  var __posthogLogger: Logger | undefined
}

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const exporter = new OTLPLogExporter({
      url: "https://eu.i.posthog.com/otlp/v1/logs",
      headers: {
        Authorization: `Bearer ${process.env.POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        "service.name": "samfunnetibergen",
      }),
      processors: [
        new InfoAndAboveProcessor(new SimpleLogRecordProcessor(exporter)),
      ],
    })

    globalThis.__posthogLogger = loggerProvider.getLogger("samfunnetibergen")
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const posthog = getPostHogClient()
  const distinctId =
    getPostHogDistinctIdFromCookie(request.headers.cookie) ?? "anonymous"
  const path = request.path.split("?")[0] || request.path
  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined

  posthog.captureException(
    toPostHogException(error),
    distinctId,
    getServerRequestExceptionProperties({
      source: "next-on-request-error",
      digest,
      path,
      method: request.method,
      router_kind: context.routerKind,
      route_path: context.routePath,
      route_type: context.routeType,
      render_source: context.renderSource,
      revalidate_reason: context.revalidateReason,
    }),
  )
  await posthog.flush()
}
