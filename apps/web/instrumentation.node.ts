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
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_CLOUD_REGION,
} from "@opentelemetry/semantic-conventions"

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
    [ATTR_SERVICE_NAME]: "samfunnetibergen",
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.VERCEL_ENV ?? "development",
    [ATTR_SERVICE_VERSION]:
      process.env.NEXT_PUBLIC_GIT_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "unknown",
    [SEMRESATTRS_CLOUD_REGION]: process.env.VERCEL_REGION ?? "local",
    [ATTR_SERVICE_INSTANCE_ID]: process.env.VERCEL_DEPLOYMENT_ID ?? "local",
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
        new SimpleLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${POSTHOG_OTLP_BASE_URL}/logs`,
            headers,
          }),
        }),
      ),
    ],
  })
  logs.setGlobalLoggerProvider(loggerProvider)

  new HttpInstrumentation().enable()
}
