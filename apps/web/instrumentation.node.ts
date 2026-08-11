import { logs } from "@opentelemetry/api-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import type { LogRecordProcessor, SdkLogRecord } from "@opentelemetry/sdk-logs"
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"

const INFO_SEVERITY = 9
const POSTHOG_OTLP_BASE_URL = "https://eu.i.posthog.com/i/v1"

class InfoAndAboveProcessor implements LogRecordProcessor {
  constructor(private readonly delegate: LogRecordProcessor) {}

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

const projectToken = process.env.POSTHOG_API_KEY?.trim()

if (projectToken) {
  const headers = {
    Authorization: `Bearer ${projectToken}`,
    "Content-Type": "application/json",
  }
  const resource = resourceFromAttributes({
    "service.name": "samfunnetibergen",
    "deployment.environment.name": process.env.VERCEL_ENV ?? "development",
    "service.version":
      process.env.NEXT_PUBLIC_GIT_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "unknown",
    "cloud.region": process.env.VERCEL_REGION ?? "local",
    "service.instance.id": process.env.VERCEL_DEPLOYMENT_ID ?? "local",
  })

  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [
      new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: `${POSTHOG_OTLP_BASE_URL}/traces`,
          headers,
        }),
      ),
    ],
  })
  tracerProvider.register()

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new InfoAndAboveProcessor(
        new SimpleLogRecordProcessor(
          new OTLPLogExporter({
            url: `${POSTHOG_OTLP_BASE_URL}/logs`,
            headers,
          }),
        ),
      ),
    ],
  })
  logs.setGlobalLoggerProvider(loggerProvider)

  new HttpInstrumentation().enable()
}
