import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import type { Logger } from "@opentelemetry/api-logs"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import type { LogRecordProcessor, SdkLogRecord } from "@opentelemetry/sdk-logs"

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
